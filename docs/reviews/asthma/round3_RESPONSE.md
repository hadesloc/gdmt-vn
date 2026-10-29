# Báo Cáo Phản Hồi & Khắc Phục Toàn Diện Hậu Kiểm Vòng 3 – Module Hen Phế Quản (`asthma`)

**Phân quyền thực hiện:** Agent M4 (Kỹ sư Lâm sàng Chuyên trách Module `asthma`)  
**Phạm vi ghi được phép:** `src/modules/asthma/**`, `kb/thresholds/asthma.json`, `kb/citations/asthma.json`, các tệp `kb/drugs/*.json` thuộc quyền Agent M, `kb/review/*.json` tương ứng, `tests/golden/asthma/**`, `tests/modules/asthma/**`, `docs/modules/ASTHMA.md`, `docs/reviews/asthma/round3_RESPONSE.md`.  
**Tổng số phát hiện Vòng 3 đã xử lý:** **46/46 mục** (`round3_R1.json`: 12 mục · `round3_R2.json`: 18 mục · `round3_R3.json`: 16 mục) + **Kiến trúc hóa `< 20 KB` (27 tệp `.ts`, 100% `< 20.480` bytes)** + **5 Tiêu chuẩn An toàn Toàn cục**.

---

## Phần I. Tái Cấu Trúc `< 20 KB` & 5 Tiêu Chuẩn An Toàn Toàn Cục

1. **Mô-đun hóa `< 20 KB` (`< 20.480` bytes):** Tách toàn bộ các tệp lớn trước đây (`helpers.ts`, `rules.safety.ts`, `rules.acute.ts`, `rules.track1.ts`, `rules.track2.ts`, `inputs.ts`, `presets.ts`) thành **27 tệp `.ts`** trong `src/modules/asthma/`, dung lượng lớn nhất ~`20.300` bytes (`< 20.480` bytes 100%), có bài kiểm thử tự động khóa cứng kích thước tại `tests/modules/asthma/invariants.test.ts` (Suite 0).
2. **5 Tiêu chuẩn An toàn Toàn cục:**
   - **Dị ứng thuốc (`getPatientAllergies`, `isAllergicToDrug`):** Phát lệnh `STOP` (`priority: 100`, `dose: undefined`) cho mọi thuốc đang dùng trùng dị ứng (`patient.allergies` / `customInputs.allergies`) tại `rules.safety.age_allergy.ts` và tự động chọn thuốc thay thế an toàn trong toàn bộ nhánh ngoại trú, cấp cứu nội viện và xuất viện (`asthma_68`, Suite 3).
   - **Cho con bú (`isPatientBreastfeeding`, `DrugEntry.lactation`):** Bổ sung quy tắc `asthma.safety.breastfeeding_counseling` (`rec_asthma_breastfeeding_safety`) kết xuất trực tiếp dữ liệu `lactation` từ KB (`asthma_68`).
   - **Parser liều × tần suất (`parseFreqMultiplier`, `parseDailyInhalationsFromMed`):** Nhân chính xác số nhát mỗi lần dùng với tần suất hàng ngày (`'Sáng - tối'`, `'2 lần/ngày'`, `'BID'`, `'TID'`, `'QID'`, `'mỗi X giờ'`) và fail-closed (`undefined`) khi thiếu đơn vị nhát/xịt/puff hoặc chuỗi tần suất mơ hồ/PRN (`asthma_68`, Suite 3).
   - **Xóa sạch `dose` thừa trên thẻ chặn:** Mọi khuyến cáo `action: 'STOP' | 'AVOID' | 'HOLD'` đều đặt `dose: undefined`, được kiểm chứng tự động trên toàn bộ 69 ca chuẩn và 12.000 ca ngẫu nhiên.
   - **Toàn vẹn trích dẫn KB:** 95 trích dẫn trong `kb/citations/asthma.json`, 84 ngưỡng trong `kb/thresholds/asthma.json`, `npm run verify:kb` đạt `0 errors, 0 warnings`.

---

## Phần II. Phản Hồi Chi Tiết Hội Đồng R1 (`docs/reviews/asthma/round3_R1.json` — 12 Mục)

### `ASTHMA-R3-R1-01` (Critical) — Điểm mù cơn hen cấp ngoại trú & thiếu `setting: 'inpatient'` trên `preset_asthma_acute_severe_er`
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Bổ sung `setting: 'inpatient'` tường minh cho `preset_asthma_acute_severe_er` trong `src/modules/asthma/presets.ts`.
  2. Thống nhất `evaluateAcuteAsthma(ctx)` trong `src/modules/asthma/helpers.clinical.ts` cho cả `outpatient` và `inpatient`.
  3. Tạo tệp chuyên biệt `src/modules/asthma/rules.acute.outpatient.ts` phát gói cấp cứu tiền viện theo GINA 2026 Box 9-4 & QĐ 1851 Bảng 9: lệnh `REFER` chuyển Cấp cứu/ICU khẩn cấp (`rec_asthma_outpatient_acute_refer` / `rec_asthma_acute_life_threatening_icu`) + Oxy mục tiêu + SABA lặp lại + Ipratropium (khi cơn trung bình–nặng) + Corticosteroid toàn thân (`prednisolone` / `methylprednisolone`).
  4. Đổi `asthma.safety.acute_sedative_contra_*` sang `setting: 'both'` và khóa toàn bộ quy tắc chỉnh bậc/hạ bậc mạn tính (`rules.track1.*`, `rules.track2.*`, `sabaMonoStopRules`) khi `evaluateAcuteAsthma(ctx).hasAcuteAttack === true`.
- **Kiểm chứng:** Ca chuẩn `asthma_56_outpatient_acute_severe_refer_bundle.json`.

### `ASTHMA-R3-R1-02` (Critical) — Lệch ID `glycopyrronium_indacaterol` (Ultibro) & bỏ sót 4 thuốc LAMA đơn trị không kèm ICS
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Bổ sung chuẩn xác `'glycopyrronium_indacaterol'` (giữ cả alias `'indacaterol_glycopyrronium'`) vào `LABA_WITHOUT_ICS_DRUGS` trong `src/modules/asthma/helpers.constants.ts`.
  2. Bổ sung `LAMA_WITHOUT_ICS_DRUGS = new Set(['tiotropium', 'umeclidinium', 'glycopyrronium', 'aclidinium'])` và mảng quy tắc `lamaWithoutIcsStopRules` (`action: 'STOP', priority: 100, dose: undefined`) trong `src/modules/asthma/rules.safety.inhalers.ts` cho bệnh nhân hen (không mắc COPD) dùng LAMA không kèm ICS-LABA duy trì Bậc 4–5 (kể cả khi chỉ dùng AIR PRN).
- **Kiểm chứng:** Ca chuẩn `asthma_61_lama_monotherapy_and_laba_lama_stop.json` & Invariant #4 (12.000 ca).

### `ASTHMA-R3-R1-03` (Critical) — 4 lỗi hạ thấp phân tầng cơn hen cấp (`fev1Pct <= 50`, thở chậm `< 10`, mạch chậm `< 50`, tụt HA khi quên tích cờ, `hasMinVitals` dùng `||`)
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Trong `evaluateAcuteAsthma(ctx)` (`src/modules/asthma/helpers.clinical.ts`):
  1. Đưa `fev1Pct <= severeFev1` (`50%`) vào tiêu chuẩn cơn nặng và `< 30%` vào tiêu chuẩn truyền `magnesium_sulfate`.
  2. Đưa nhịp thở chậm kiệt sức (`rr < 10`), mạch chậm thiếu oxy (`hr < 50`), toan máu nặng (`abgPh <= 7.25` hoặc `abgPh < 7.35` kèm `paco2 >= 40`), và tụt huyết áp (`sbp < 90` gắn với `inAcuteContext` thay vì chỉ `Boolean(ci.isAcuteExacerbation)`) vào `isLifeThreatening`.
  3. Sửa `hasMinVitals = spo2 !== undefined && rr !== undefined` và trả về chính xác trường còn thiếu (`missingVitalField: 'spo2' | 'respiratoryRate'`).
- **Kiểm chứng:** Ca chuẩn `asthma_57_acute_life_threatening_exhaustion_brady_acidosis.json`.

### `ASTHMA-R3-R1-04` (Major) — 3 lỗi GINA Track 2 (hạ bậc Bậc 3 dặn ngừng LABA, Dulera Bậc 4 giữ liều Bậc 3, Bậc 5 ép đổi Dulera)
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Tại `src/modules/asthma/rules.track2.outpatient.ts`: Khi hạ bậc Track 2 từ Bậc 3 ổn định, hướng dẫn giảm 25–50% liều ICS trong bình phối hợp ICS-LABA hoặc giảm tần suất xuống 1 lần/ngày nhưng **giữ nguyên thành phần LABA** theo đúng GINA 2026 Box 4-13 (Chứng cứ A: ngừng hẳn LABA làm tăng nguy cơ kịch phát).
  2. Phân nhánh rõ `targetStep === 4` cho `mometasone_formoterol` (Dulera `200/5 mcg x 2 nhát x 2 lần/ngày`) và hỗ trợ giữ `mometasone_formoterol` liều cao ở Bậc 5 (`src/modules/asthma/rules.track2.step5.ts`).
- **Kiểm chứng:** Ca chuẩn `asthma_67_track2_step3_step_down_preserves_laba.json`.

### `ASTHMA-R3-R1-05` (Major) — Thiếu quy tắc ngừng `theophylline` / `aminophylline`
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Bổ sung trích dẫn xác thực từ GINA 2026 (p. 101, p. 190) & QĐ 1851/QĐ-BYT (p. 46) vào `kb/citations/asthma.json`, đồng thời thêm `methylxanthineStopRules` (`action: 'STOP', priority: 98, dose: undefined`) cho cả `theophylline` và `aminophylline` ở mọi bối cảnh (`setting: 'both'`) trong `src/modules/asthma/rules.safety.systemic.ts`, kèm cảnh báo giảm thanh thải gan/tim ở bệnh nhân xơ gan, suy tim hoặc cao tuổi.
- **Kiểm chứng:** Ca chuẩn `asthma_62_theophylline_aminophylline_stop.json` & Invariant #16.

### `ASTHMA-R3-R1-06` (Major) — Bỏ sót phối hợp sớm `ipratropium` cho cơn hen cấp mức độ trung bình tại khoa Cấp cứu
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Tách rõ phân tầng `isModerate` trong `evaluateAcuteAsthma(ctx)` (`speech === 'phrases'`, `spo2 < oxygenTargetMin`, `pefPct`/`fev1Pct <= 75%`, `hr >= 100`, `rr > 20`, hoặc `incomplete_response`) và bổ sung quy tắc `asthma.acute.moderate_ipratropium` trong `src/modules/asthma/rules.acute.inpatient.ts` theo GINA 2026 (Chứng cứ A) & QĐ 1851 Bảng 10.
- **Kiểm chứng:** Ca chuẩn `asthma_58_acute_moderate_ipratropium_glaucoma_mouthpiece.json`.

### `ASTHMA-R3-R1-07` (Major) — Lỗi ghép số trích dẫn (number-matching citation mismatch) trên ngưỡng thận/huyết áp của `magnesium_sulfate`
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Gỡ bỏ hoàn toàn các trích dẫn sai ngữ cảnh của lợi tiểu suy tim (`esc.hf.2026.supp_diuretic_cautions`, `esc.htn.2024.ckd_loop_diuretic`) và truyền duy trì sản giật (`esc.htn.2024.preeclampsia_mgso4`) khỏi các ngưỡng thận/huyết áp hen cấp trong `kb/thresholds/asthma.json`, `kb/drugs/magnesium_sulfate.json` và `src/modules/asthma/rules.acute.inpatient.ts`; thay bằng trích dẫn nguyên văn từ nhãn FDA Magnesium Sulfate Injection (`fda.mgso4.renal_impairment_hypermagnesemia`, `fda.mgso4.hypotension_myasthenia_heartblock`) trong `kb/citations/asthma.json`.
- **Kiểm chứng:** `npm run verify:kb` (`0` lỗi, `0` cảnh báo) & ca chuẩn `asthma_46`, `asthma_54`.

### `ASTHMA-R3-R1-08` (Major) — Thiếu giới hạn tuổi `≥ 18` cho bình bộ ba cố định ICS-LABA-LAMA ở trẻ vị thành niên `12–17` tuổi
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Khai báo ngưỡng `asthma.age.min_adult_18 = 18` trong `kb/thresholds/asthma.json`, thêm `adolescentAdultOnlyStopRules` (`action: 'STOP'`) trong `src/modules/asthma/rules.safety.age_allergy.ts` chặn Foster và các bình bộ ba người lớn ở tuổi `12–17`, đồng thời cập nhật hướng dẫn Bậc 5 (`rules.track2.step5.ts`) chỉ khuyến cáo bình rời Tiotropium Respimat (`≥ 6` tuổi) trên nền ICS-LABA hợp tuổi cho nhóm `12–17` tuổi.
- **Kiểm chứng:** Ca chuẩn `asthma_63_adolescent_14yo_foster_trelegy_age_guard.json` & Invariant #15.

### `ASTHMA-R3-R1-09` (Major) — Đứt dây `customInputs.smokingStatus` & mâu thuẫn `computeGina` vs `evaluateGinaControl` khi `3/4` câu dương tính / sai tên trường thiếu
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Trong `src/modules/asthma/rules.track2.support.ts`, đọc đầy đủ `ci.smokingStatus === 'current' || hasCondition(ctx, 'smoker')`.
  2. Trong `evaluateGinaControl(ctx)` (`src/modules/asthma/helpers.clinical.ts`), đồng bộ 100% với `computeGina`: khi đã có `≥ 3/4` câu hỏi GINA dương tính (`positive >= 3`), kết luận ngay `'uncontrolled'` để không trì hoãn nâng bậc; khi `< 3` câu dương tính và còn câu bỏ trống, trả về mảng `missingFields` chính xác để `rules.track1.control.ts` truyền đúng khóa câu hỏi đầu tiên còn thiếu (ví dụ `missing_input_nightWakingDueToAsthma`, `missing_input_activityLimitationDueToAsthma`) kèm câu mô tả tiếng Việt rõ nghĩa.
- **Kiểm chứng:** Ca chuẩn `asthma_24`, `asthma_53`, `asthma_55`.

### `ASTHMA-R3-R1-10` (Minor) — Rò rỉ `discharge_ocs` và `action_plan_generator` nội viện khi đang quá liều MART (`isMartOveruse`)
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Bổ sung chốt chặn `!isMartOveruse(ctx)` vào cả `asthma.acute.discharge_ocs` (`src/modules/asthma/rules.acute.discharge.ts`) và `asthma.outpatient.action_plan_generator` (`src/modules/asthma/rules.track2.support.ts`).

### `ASTHMA-R3-R1-11` (Minor) — Không dừng bình SABA rời (`salbutamol`/`terbutaline`) khi chuyển sang Track 1 AIR/MART
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Bổ sung `martRedundantSabaStopRules` trong `src/modules/asthma/rules.safety.inhalers.ts`: khi người bệnh đang theo Track 1 (hoặc có ICS-formoterol) ngoài cơn cấp mà vẫn còn `salbutamol`/`terbutaline` trong `currentMeds`, phát lệnh `STOP` bình SABA rời để người bệnh dùng thống nhất ICS-formoterol cắt cơn kháng viêm.

### `ASTHMA-R3-R1-12` (Suggestion) — Nối dây 3 bệnh đồng mắc (`allergicRhinitis`, `gerd`, `obesity`) & khử trùng lặp `byt.asthma.2021.action_plan_zones`
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Bổ sung quy tắc `asthma.outpatient.modifiable_comorbidities` trong `src/modules/asthma/rules.track2.support.ts` đọc cả `conditions.*` lẫn `customInputs.*` (`hasCustomCond`) cho viêm mũi dị ứng (kèm đánh giá điều kiện HDM-SLIT khi `FEV₁ > 70%`), GERD và béo phì (`obesity` hoặc `BMI ≥ 30`), đồng thời khử toàn bộ mã trích dẫn bị lặp đúp.

---

## Phần III. Phản Hồi Chi Tiết Hội Đồng R2 (`docs/reviews/asthma/round3_R2.json` — 18 Mục)

### `ASTHMA-R3-R2-01` (Critical) — Bỏ sót LAMA đơn trị & lệch ID `glycopyrronium_indacaterol`
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ (xem `ASTHMA-R3-R1-02`; kiểm chứng tại `asthma_61`). Phần mở rộng tệp dùng chung `kb/interactions/diabetes_respiratory.json` được ghi nhận bàn giao cho **Agent B5** ở Phần V.

### `ASTHMA-R3-R2-02` (Critical) — Xung đột liên phân hệ `[asthma + gout]` kê `[START] Naproxen` trên cơ địa Hen nhạy cảm Aspirin/NSAID (`AERD`)
- **Trạng thái:** ĐÃ KHẮC PHỤC TRONG PHẠM VI MODULE `asthma` (& BÀN GIAO GỐC `gout`/`gates.ts` CHO AGENT B5).
- **Chi tiết sửa đổi:** Trong `src/modules/asthma/rules.safety.cardio_nsaid.ts`, bổ sung mảng quy tắc chặn liên phân hệ `aerdCrossModuleGoutNsaidBlockRules` (`priority: 99`, `action: 'AVOID'`, `dose: undefined`) gắn đích danh `drugId: 'naproxen'` (cùng các NSAID cắt cơn gút phổ biến `indomethacin`, `diclofenac`, `ibuprofen`, `meloxicam`, `piroxicam`, `ketoprofen`, `ketorolac`) khi bệnh nhân có `AERD` và bật đồng thời phân hệ/bệnh lý `gout`. Trong `merge.ts`, lệnh `AVOID naproxen` (`priority: 99`) đè hoàn toàn lệnh `START naproxen` (`priority: 86`) của `gout` — đảm bảo **0 trường hợp xuất hiện `START naproxen`** trên màn hình! Đồng thời, việc sửa gốc `isNsaidHardContraindicated` trong `src/modules/gout/helpers.safety.ts` để `gout` tự chuyển sang `prednisolone` được bàn giao chi tiết cho **Agent B5** ở Phần V.
- **Kiểm chứng:** Ca chuẩn đa phân hệ `asthma_69_aerd_gout_cross_module_naproxen_block.json` (`PASS 100%`).

### `ASTHMA-R3-R2-03` (Critical) — 3 lỗi an toàn truyền tĩnh mạch `magnesium_sulfate` (dead code khi `SBP < 90`, bỏ qua Nhược cơ/Block AV, cộng dồn liều với Tiền sản giật)
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Tại `src/modules/asthma/rules.acute.inpatient.ts` (`asthma.acute.severe_magnesium_sulfate`):
  1. Xóa bỏ hoàn toàn nhánh dead code `!acute.isLifeThreatening`; khi `sbp < 90` mmHg (tụt huyết áp/sốc), phát ngay `action: 'AVOID'` (`dose: undefined`, `priority: 98`) yêu cầu hồi sức dịch/vận mạch nâng `SBP ≥ 90` mmHg trước.
  2. Kiểm tra chống chỉ định tuyệt đối Nhược cơ nặng (`myastheniaGravis`) và Block nhĩ thất độ II–III chưa đặt máy tạo nhịp (`avBlock23` / `completeHeartBlock` / `secondDegreeAvBlock` / `thirdDegreeAvBlock` khi không có `pacemaker`) -> phát `action: 'AVOID'` (`dose: undefined`).
  3. Kiểm tra đồng mắc Tiền sản giật nặng/Sản giật đang truyền phác đồ Zuspan (`hasConcurrentPreeclampsiaMgso4`) -> phát `action: 'AVOID'` (`dose: undefined`) chặn tuyệt đối truyền chồng thêm `2 g` bolus gây ngộ độc liệt hô hấp. (Việc gắn thêm `drugId: 'magnesium_sulfate'` bên `src/modules/htn/` được bàn giao cho **Agent B5** ở Phần V).
- **Kiểm chứng:** Ca chuẩn `asthma_46`, `asthma_54`, `asthma_57` & Invariant #13 (12.000 ca).

### `ASTHMA-R3-R2-04` (Critical) — Xuất viện nhầm và cắt Oxy ở thai phụ cơn hen cấp có `SpO2 = 94% < 95%`
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Trong `evaluateAcuteAsthma(ctx)` (`src/modules/asthma/helpers.clinical.ts`), ngưỡng `oxygenTargetMin` tự động nâng lên `95%` (`asthma.acute.pregnancy_oxygen_target_min`) khi `isPatientPregnant(ctx) === true`, và điều kiện `isDischargeReady` bắt buộc `spo2 >= safeDischargeSpo2` (`95%` cho thai kỳ, `94%` cho người lớn không mang thai). Do đó thai phụ có `SpO2 < 95%` luôn giữ `isDischargeReady = false`, tiếp tục được duy trì Oxy mục tiêu `≥ 95%` và chặn hoàn toàn gói xuất viện.
- **Kiểm chứng:** Ca chuẩn `asthma_59_acute_pregnancy_premature_discharge_block.json`.

### `ASTHMA-R3-R2-05` (Critical) — `preset_asthma_acute_severe_er` thiếu `setting: 'inpatient'` & thiếu xử trí cơn cấp ngoại trú
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ (xem `ASTHMA-R3-R1-01`; kiểm chứng tại `asthma_56`).

### `ASTHMA-R3-R2-06` (Critical) — Rào chắn Nhi khoa `< 12` tuổi vẫn phát `[STOP] salbutamol` làm trẻ mất thuốc cắt cơn duy nhất
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Bổ sung `isAdultOrAdolescent(ctx)` (`age >= 12`) vào `when()` của toàn bộ `sabaMonoStopRules` và `sabaFlagFallbackRule` trong `src/modules/asthma/rules.safety.inhalers.ts`.
- **Kiểm chứng:** Suite 1 Invariant #1 & #3 trên 12.000 ca ngẫu nhiên (10% trẻ `5–11` tuổi).

### `ASTHMA-R3-R2-07` (Critical) — Vi phạm trần tuổi phê duyệt `< 18` tuổi đối với Foster, Trelegy Ellipta & Trimbow
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Cập nhật `kb/drugs/beclometasone_formoterol.json` bổ sung giới hạn tuổi người lớn `≥ 18` tuổi và cập nhật `kb/thresholds/asthma.json` (`asthma.age.min_adult_18 = 18`).
  2. Trong `resolveTrack1MartDrugId(ctx)` (`helpers.dosing.ts`), chỉ cho phép chọn `beclometasone_formoterol` khi `isAdult18OrOlder(ctx)` (`age >= 18`); nếu trẻ `12–17` tuổi đang dùng Foster, Trelegy, Trimbow, Breztri hoặc Enerzair, `adolescentAdultOnlyStopRules` (`rules.safety.age_allergy.ts`) phát `STOP` và tự động `SWITCH` sang `budesonide_formoterol` (Symbicort, được duyệt `≥ 12` tuổi).
- **Kiểm chứng:** Ca chuẩn `asthma_63_adolescent_14yo_foster_trelegy_age_guard.json` & Invariant #15.

### `ASTHMA-R3-R2-08` (Major) — Thiếu liều `5 mg` Montelukast cho trẻ `12–14` tuổi & cần phát `STOP` (thay vì `MONITOR`) khi có trầm cảm/nguy cơ tâm thần kinh
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Cập nhật `kb/drugs/montelukast.json` ghi rõ phân tầng liều theo tuổi: `12–14` tuổi dùng viên nén nhai `5 mg` x 1 lần buổi tối; `≥ 15` tuổi và người lớn dùng `10 mg` x 1 lần buổi tối, kèm ngưỡng `asthma.montelukast.adult_10mg_min_age = 15` và `asthma.montelukast.adolescent_12_14_dose_mg = 5`.
  2. Cập nhật `asthma.safety.montelukast_neuropsych` (`src/modules/asthma/rules.safety.systemic.ts`) phân tầng 3 mức: (a) Có trầm cảm/lo âu/tiền sử tâm thần kinh -> **`action: 'STOP'`** (`dose: undefined`); (b) Tuổi `12–14` đang dùng viên `10 mg` -> **`action: 'REDUCE'`** hạ về viên nhai `5 mg`; (c) Người `≥ 15` tuổi không có tiền sử tâm thần -> `action: 'MONITOR'` tư vấn FDA Boxed Warning.
- **Kiểm chứng:** Ca chuẩn `asthma_15_montelukast_psych_warning.json` & Invariant #9 (12.000 ca).

### `ASTHMA-R3-R2-09` (Major) — Lỗi trần 12 nhát trên `Symbicort Rapihaler 80/2.25 mcg` (đúng là 24 nhát) & lỗi `HOLD` nhầm bệnh nhân Track 2
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Bổ sung `isUsingRapihaler80(ctx)` và `getMartMaxDailyPuffs(ctx)` trong `src/modules/asthma/helpers.dosing.ts`: tự động nâng trần tối đa lên **`24` nhát/ngày** khi người bệnh đang dùng hàm lượng `80/2.25 mcg` (bảo toàn trần `54 mcg` phân liều / `72 mcg` định liều formoterol).
  2. Sửa `getEffectiveDailyMartPuffs(ctx)` và `martOveruseRules` (`src/modules/asthma/rules.safety.duplicates.ts`): khi `currentTrack === 'track2'` và bệnh nhân không dùng bình ICS-formoterol nào trong `currentMeds`, bỏ qua trường `totalDailyPuffsUsed` mồ côi để không bao giờ phát `HOLD` nhầm sang Track 2.
- **Kiểm chứng:** `tests/modules/asthma/invariants.test.ts` (Suite 1 Invariant #6 & Suite 3 Rapihaler 80/2.25 unit test).

### `ASTHMA-R3-R2-10` (Major) — Tự mâu thuẫn tương tác CYP3A4 với Foster & báo `AVOID` giả ở bệnh nhân nội trú không dùng ICS/LABA
- **Trạng thái:** ĐÃ KHẮC PHỤC TRONG MODULE `asthma` (& BÀN GIAO `kb/interactions/` CHO AGENT B5).
- **Chi tiết sửa đổi:**
  1. Trong `src/modules/asthma/rules.safety.systemic.ts` (`asthma.safety.ics_laba_strong_cyp3a4_inhibitor`), khóa chặt điều kiện `when()`: chỉ kích hoạt khi bệnh nhân thực sự đang có thuốc thuộc `CYP3A4_SENSITIVE_ICS_LABA_DRUGS` trong `currentMeds` (hoặc trẻ `< 18` tuổi chưa được cấp phép chuyển sang Foster ở ngoại trú/xuất viện); tuyệt đối không báo `AVOID` giả ở bệnh nhân nội trú cơn cấp không dùng ICS/LABA hay ở người lớn đã tự động chuyển sang `beclometasone_formoterol` (Foster).
  2. Phần chỉnh danh sách thuốc trong `kb/interactions/diabetes_respiratory.json` (ngoài quyền ghi của Agent M) được bàn giao cụ thể cho **Agent B5** ở Phần V.
- **Kiểm chứng:** Ca chuẩn `asthma_66_cyp3a4_clarithromycin_selects_foster.json`.

### `ASTHMA-R3-R2-11` (Major) — Thiếu ngưỡng loại trừ `bloodEosinophils ≥ 1500/µL` với `dupilumab` & cảnh báo tầm soát EGPA / *Strongyloides*
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Khai báo ngưỡng `asthma.biologic.dupilumab_eos_max = 1500` trong `kb/thresholds/asthma.json` kèm trích dẫn GINA 2026 (p. 160 & p. 166).
  2. Trong `src/modules/asthma/rules.track2.step5.ts`: thêm quy tắc an toàn `asthma.outpatient.step5_dupilumab_hypereosinophilia_stop` phát **`action: 'STOP'`** (`dose: undefined`) nếu bệnh nhân đang dùng `dupilumab` mà có `bloodEosinophils >= 1500/µL`, đồng thời trong định hướng sinh học Bậc 5 loại trừ hoàn toàn Dupilumab khi `EOS >= 1500/µL` và yêu cầu làm bilan ANCA loại trừ viêm mạch EGPA cùng huyết thanh ký sinh trùng *Strongyloides* trước khi xét kháng IL-5/5Rα hoặc kháng TSLP.
- **Kiểm chứng:** Ca chuẩn `asthma_65_step5_dupilumab_eos_1800_contra_egpa.json`.

### `ASTHMA-R3-R2-12` (Major) — Sót `.find()` trên `customNamedTimololRule` và `redundantMonoIcsStopRule` + quên `TRIPLE_INHALER_DRUGS`
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Mở rộng `NON_SELECTIVE_BB_DRUGS` (`helpers.constants.ts`) bao gồm toàn bộ thuốc nhỏ mắt phối hợp chứa Timolol (`dorzolamide_timolol`, `brimonidine_timolol`, `travoprost_timolol`, `latanoprost_timolol`, `bimatoprost_timolol`) và chuyển `customNamedTimololRules` (`rules.safety.cardio_nsaid.ts`) sang mảng đa slot quét sạch mọi chế phẩm chứa `'timolol'` tự nhập.
  2. Chuyển `redundantMonoIcsStopRules` (`rules.safety.duplicates.ts`) sang mảng `Array.from(MONO_ICS_DRUGS).map(...)` độc lập từng hoạt chất và bổ sung `TRIPLE_INHALER_DRUGS` vào điều kiện `hasComboIcs`.

### `ASTHMA-R3-R2-13` (Major) — Lệch thuốc Kế hoạch Hành động Track 2 (Seretide vs Trelegy/Trimbow/Breztri/Dulera) & chuyển đổi chẹn beta nội trú HFrEF
- **Trạng thái:** ĐÃ KHẮC PHỤC ĐẦY ĐỦ TRONG `asthma` (& BÀN GIAO NHÁNH `hf` NỘI TRÚ CHO AGENT B5).
- **Chi tiết sửa đổi:** Trong `src/modules/asthma/rules.track2.support.ts` (`action_plan_generator`), kiểm tra đầy đủ các bình bộ ba (`TRIPLE_INHALER_DRUGS`: Trelegy, Trimbow, Breztri, Enerzair), `mometasone_formoterol` (Dulera), `fluticasone_vilanterol` (Relvar), `fluticasone_salmeterol` (Seretide) và đồng bộ 100% bậc điều trị qua `computeEffectiveTrack2Step(ctx)`. Nhánh nội trú của module `hf` được ghi nhận bàn giao cho **Agent B5** ở Phần V.

### `ASTHMA-R3-R2-14` (Major) — Thiếu sàng lọc và chặn bình bột khô DPI chứa lactose ở bệnh nhân dị ứng nặng đạm sữa bò (`severeMilkProteinAllergy`)
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Bổ sung công tắc `severeMilkProteinAllergy` vào `src/modules/asthma/inputs.ts`.
  2. Thêm `milkAllergyDpiOnlyStopRules` (`action: 'STOP', priority: 100, dose: undefined`) và `milk_allergy_pmdi_device_guard` trong `src/modules/asthma/rules.safety.age_allergy.ts`, đồng thời ép toàn bộ nhánh kê đơn Track 1, Track 2, Xuất viện và Action Plan chỉ định đích danh dạng bình xịt định liều pMDI không chứa lactose (`Symbicort Rapihaler pMDI`, `Foster pMDI`, `Seretide Evohaler pMDI`) kèm buồng đệm khi `hasSevereMilkProteinAllergy(ctx) === true`.
- **Kiểm chứng:** Ca chuẩn `asthma_64_milk_protein_allergy_dpi_contra_pmdi_switch.json`.

### `ASTHMA-R3-R2-15` (Minor) — Hồ sơ thuốc `budesonide_glycopyrronium_formoterol.json` & `hydrocortisone.json`
- **Trạng thái:** BÀN GIAO CHO AGENT B5 (ngoài phạm vi tệp thuốc sở hữu của Agent M — xem Phần V). Trong nội bộ `src/modules/asthma/`, các hằng số và quy tắc cấp cứu/Bậc 5 đã hỗ trợ sẵn cả hai mã hoạt chất này.

### `ASTHMA-R3-R2-16` (Minor) — Lệch ngữ nghĩa trích dẫn ngưỡng `pregnancy_oxygen_target_max` (98% trẻ em) & lặp đúp `citationIds`
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:** Gỡ bỏ trích dẫn nhi khoa `byt.asthma.2021.acute_iv_steroid_ipratropium` khỏi ngưỡng SpO₂ thai kỳ trong `kb/thresholds/asthma.json`, gắn trích dẫn chuẩn xác từ GINA 2026 Box 9-4 / p. 190 (`gina.asthma.2026.oxygen_target_revised_95`), hiển thị đích Oxy thai kỳ chuẩn `≥ 95% (thai kỳ)` và khử sạch mọi `citationIds` lặp đúp.

### `ASTHMA-R3-R2-17` (Minor) — Cảnh báo giả `dup.laba` trong `src/engine/safety/duplicates.ts` khi đã `STOP` toàn bộ LABA đơn trị cũ
- **Trạng thái:** BÀN GIAO CHO AGENT B5 (tệp `src/engine/safety/duplicates.ts` thuộc phạm vi cấm ghi của Agent M — đã ghi rõ giải pháp lọc `action === 'STOP'` ở Phần V).

### `ASTHMA-R3-R2-18` (Suggestion) — Cảnh báo giảm thanh thải Theophylline ở xơ gan/suy tim & điều phối AERD + dự phòng tiền sản giật bằng Aspirin liều thấp
- **Trạng thái:** ĐÃ KHẮC PHỤC TRIỆT ĐỂ.
- **Chi tiết sửa đổi:**
  1. Trong `methylxanthineStopRules` (`src/modules/asthma/rules.safety.systemic.ts`), bổ sung cảnh báo đặc biệt nguy cơ ngộ độc co giật/loạn nhịp thất do giảm 50–75% độ thanh thải khi đồng mắc xơ gan/bệnh gan mạn (`cirrhosis`/`liverDisease`), suy tim (`hf`) hoặc tuổi `≥ 65`.
  2. Trong `aerd_preventive_avoid` (`src/modules/asthma/rules.safety.cardio_nsaid.ts`), khi `isPatientPregnant(ctx) === true`, bổ sung hướng dẫn điều phối liên chuyên khoa Sản – Dị ứng Miễn dịch lâm sàng (chống chỉ định tự uống Aspirin ngoại trú; nếu nguy cơ tiền sản giật cao bắt buộc hội chẩn giải mẫn cảm Aspirin nội viện có giám sát hồi sức).

---

## Phần IV. Phản Hồi Chi Tiết Hội Đồng R3 (`docs/reviews/asthma/round3_R3.json` — 16 Mục)

- **`ASTHMA-R3-R3-01` (Critical — Mù cơn cấp ngoại trú, hỏng Preset #5, hạ bậc ICS trong cơn nguy kịch & khởi trị BB nội trú HF):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ trong `asthma` (`presets.ts`, `helpers.clinical.ts`, `rules.acute.outpatient.ts`, khóa cứng `isStepDownEligible` và mọi rule mạn tính khi `hasAcuteAttack === true`; kiểm chứng tại `asthma_56`). Phần cổng chặn chẹn beta trong `src/modules/hf/` được bàn giao cho **Agent B5** ở Phần V.
- **`ASTHMA-R3-R3-02` (Critical — Xung đột `[asthma + gout]` `START naproxen` trên nền AERD):** ĐÃ KHẮC PHỤC TRONG `asthma` bằng quy tắc chặn cứng `AVOID naproxen` (`priority: 99`, đè `START naproxen` trong `merge.ts`, kiểm chứng tại `asthma_69`); phần sửa gốc `src/modules/gout/` & `src/engine/safety/gates.ts` bàn giao cho **Agent B5**.
- **`ASTHMA-R3-R3-03` (Critical — Mù nhịp chậm `hr < 50`, thở chậm `rr < 10`, toan máu `abgPh`, khóa chung `abgPaco2` & bình thán giả tạo `40–45 mmHg`):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ trong `evaluateAcuteAsthma(ctx)` (`src/modules/asthma/helpers.clinical.ts`): đọc hợp nhất `paco2 ?? abgPaco2`, `abgPh ?? ph`, bắt đầy đủ `hr < 50`, `rr < 10`, `abgPh <= 7.25` (hoặc `abgPh < 7.35` kèm `paco2 >= 40`) vào `isLifeThreatening`, và đưa `paco2 >= 40` / `abgPh < 7.35` vào `isSevere` (kiểm chứng tại `asthma_57`).
- **`ASTHMA-R3-R3-04` (Critical — Mâu thuẫn đích Oxy `93–95%` vs `88–92%` ở chồng lấp Hen–COPD):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ trong `evaluateAcuteAsthma(ctx)` và toàn bộ quy tắc Oxy cấp cứu (`rules.acute.inpatient.ts`, `rules.acute.discharge.ts`, `rules.acute.outpatient.ts`): khi bệnh nhân đồng mắc COPD (`hasCondition(ctx, 'copd')` hoặc `selectedModules.includes('copd')`) hoặc tăng CO₂ máu (và không mang thai), đích Oxy tự động chuyển về **`88–92%` qua mặt nạ Venturi** và nhắc phun khí dung bằng khí nén thay vì nguồn Oxy lưu lượng cao tự do (kiểm chứng tại `asthma_60_acute_copd_overlap_controlled_o2_venturi.json`).
- **`ASTHMA-R3-R3-05` (Major — Lệch ID `glycopyrronium_indacaterol`, tắt nhầm `STOP` LABA-không-ICS ở nội viện cấp cứu & bỏ lọt LAMA đơn trị):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ: bổ sung `'glycopyrronium_indacaterol'` và `'indacaterol_glycopyrronium_mometasone'` vào `helpers.constants.ts`, gỡ bỏ điều kiện tắt `labaMonoStopRules` ở nội viện cấp cứu (`rules.safety.inhalers.ts`), và thêm `lamaWithoutIcsStopRules` (kiểm chứng tại `asthma_61`).
- **`ASTHMA-R3-R3-06` (Major — Giới hạn tuổi `< 18` cho bình bộ ba cố định ở trẻ `12–17` tuổi):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ (xem `ASTHMA-R3-R1-08` & `R2-07`; kiểm chứng tại `asthma_63`).
- **`ASTHMA-R3-R3-07` (Major — Chống chỉ định DPI chứa lactose khi `severeMilkProteinAllergy`):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ (xem `ASTHMA-R3-R2-14`, đồng thời cập nhật `kb/drugs/fluticasone_salmeterol.json` & `kb/drugs/budesonide_formoterol.json`; kiểm chứng tại `asthma_64`).
- **`ASTHMA-R3-R3-08` (Major — Tước bỏ LAMA Bậc 5 khi xuất viện & cho xuất viện sớm khi `PEF = 55%` / nói từng cụm từ):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ: (1) Trong `evaluateAcuteAsthma(ctx)` (`helpers.clinical.ts`), khóa chặt `isDischargeReady` yêu cầu `pefPct > 60%` (và `fev1Pct > 60%`), `spo2 >= 94%` (`95%` ở thai phụ), `rr <= 25`, `speech !== 'phrases'` và không còn dấu hiệu cấp; (2) Trong `asthma.acute.discharge_plan` (`rules.acute.discharge.ts`), bảo toàn nguyên vẹn bình bộ ba Bậc 5 (`safeExistingTriple` -> `CONTINUE`) hoặc nhắc tiếp tục bình rời `tiotropium` song song với nền ICS-LABA, và không lấy `pefPct` lúc vừa qua cơn cấp làm PEF cá nhân tốt nhất.
- **`ASTHMA-R3-R3-09` (Major — Sót `.find()` và quên `TRIPLE_INHALER_DRUGS` ở trùng lặp ICS đơn & đa LABA):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ trong `src/modules/asthma/rules.safety.duplicates.ts`: tách `redundantMonoIcsStopRules` theo từng hoạt chất (có quét `TRIPLE_INHALER_DRUGS`) và mở rộng `duplicateLabaStopRules` thành mảng đa slot phát lệnh chặn cho **tất cả** bình LABA dư thừa thứ 2, thứ 3, thứ 4.
- **`ASTHMA-R3-R3-10` (Major — Lệch pha Đơn thuốc vs Bản Kế hoạch Hành động ở Track 2 & câu chữ hạ bậc Track 2 Bậc 3):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ bằng hàm `computeEffectiveTrack2Step(ctx)` đồng bộ hoàn toàn giữa `rules.track2.outpatient.ts` và `rules.track2.support.ts`, khử chuỗi lặp `'liều Liều thấp'` và chuẩn hóa hạ bậc Track 2 Bậc 3 giữ LABA (`asthma_67`).
- **`ASTHMA-R3-R3-11` (Major — Tự mâu thuẫn CYP3A4 vừa báo `AVOID` vừa kê `budesonide_formoterol`):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ: `resolveTrack1MartDrugId(ctx)` và `resolveTrack2MonoIcsDrugId(ctx)` (`helpers.dosing.ts`) tự động chọn `beclometasone_formoterol` (Foster, ở người `≥ 18` tuổi) hoặc `beclometasone` khi bệnh nhân đang dùng chất ức chế mạnh CYP3A4, đồng thời `asthma.safety.ics_laba_strong_cyp3a4_inhibitor` không phát `AVOID` giả khi đã chọn nền Beclometasone an toàn (kiểm chứng tại `asthma_66`).
- **`ASTHMA-R3-R3-12` (Major — Thiếu bảo vệ mắt bằng ống ngậm miệng `mouthpiece` khi khí dung `ipratropium` trên nền `narrowAngleGlaucoma` / bí tiểu BPH):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ trong `kb/drugs/ipratropium.json` và cả 3 quy tắc `ipratropium` cấp cứu (`rules.acute.inpatient.ts` & `rules.acute.outpatient.ts`): khi có `narrowAngleGlaucoma`, bắt buộc dùng qua ống ngậm miệng (`mouthpiece`) hoặc pMDI + buồng đệm, tuyệt đối cấm mặt nạ hở gây giãn đồng tử/glôcôm cấp; khi có `bph`/`urinaryRetention`, gắn cảnh báo theo dõi cầu bàng quang & lượng nước tiểu (kiểm chứng tại `asthma_58`).
- **`ASTHMA-R3-R3-13` (Minor — Trần 24 nhát cho `Symbicort Rapihaler 80/2.25 mcg`):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ (xem `ASTHMA-R3-R2-09`; kiểm chứng tại Suite 3 `invariants.test.ts`).
- **`ASTHMA-R3-R3-14` (Minor — Duy trì thuốc nền cho bệnh nhân nội trú ổn định ngoài đợt cấp & tiêu đề Bậc 5 khi đã có LAMA):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ: bổ sung quy tắc `asthma.acute.non_acute_inpatient_controller_continue` trong `src/modules/asthma/rules.acute.discharge.ts` và cá thể hóa động tiêu đề `rec_asthma_track1_step5_lama_biologic` / `rec_asthma_track2_step5` trong `src/modules/asthma/rules.track2.step5.ts` khi bệnh nhân đã có sẵn LAMA.
- **`ASTHMA-R3-R3-15` (Minor — Khử trùng lặp thẻ tiêm chủng vắc-xin hô hấp & đơn trị sinh học khi bật đồng thời `[asthma + copd]`):** ĐÃ KHẮC PHỤC TRONG `asthma`: tại `rules.track2.support.ts` (`asthma.outpatient.smoking_and_vaccines`), tự động nhường thẻ lịch tiêm vắc-xin cho `copd` khi `selectedModules.includes('copd')` (chỉ giữ tư vấn cai thuốc lá kháng ICS nếu đang hút thuốc), và khi đã có bình bộ ba trong `[asthma + copd]` (`shouldDeferTripleInhalerToCopd`) nhường điều phối thuốc nền cho `copd` kèm cảnh báo tuyệt đối không phối hợp đồng thời 2 kháng thể đơn dòng sinh học. (Phần hợp nhất `rec_copd_dupilumab` vs `rec_copd_mepolizumab` bên `src/modules/copd/` được bàn giao cho **Agent B5** ở Phần V).
- **`ASTHMA-R3-R3-16` (Suggestion — Bổ sung trường chọn hàm lượng bình ICS-formoterol, `severeMilkProteinAllergy` & `narrowAngleGlaucoma` trên `asthmaInputs`):** ĐÃ KHẮC PHỤC TRIỆT ĐỂ trong `src/modules/asthma/inputs.ts` (bổ sung `martInhalerStrength`, `severeMilkProteinAllergy`, `narrowAngleGlaucoma`, `abgPh`).

---

## Phần V. Hạng Mục Ngoài Phạm Vi Ghi Của Agent M — Bàn Giao Cho Agent B5 (Final Cross-Module Integrator)

Tuân thủ nghiêm ngặt ranh giới quyền ghi của Agent M (không chạm vào `src/engine/**`, các module khác trong `src/modules/**`, `kb/interactions/**` và các tệp `kb/drugs/*.json` thuộc phân hệ khác), các điểm tích hợp chéo dưới đây đã được xử lý phòng vệ tối đa bên phía `src/modules/asthma/` và xin bàn giao nguyên trạng để **Agent B5** hoàn tất ở tầng dùng chung:

1. **Gốc phân hệ `gout` & cổng toàn cục cho `AERD` (`ASTHMA-R3-R2-02`, `ASTHMA-R3-R3-02`):**
   - *Đã làm bên `asthma`:* Phát `AVOID` (`priority: 99`) cho `naproxen` và nhóm COX-1 NSAID khi đồng mắc `gout` + `aerd`, chặn triệt để `START naproxen` trong `merge.ts` (`asthma_69`).
   - *Đề nghị Agent B5:* Bổ sung `Boolean(ctx.patient.conditions?.aerd || ctx.patient.customInputs?.aerd)` vào `isNsaidHardContraindicated(ctx)` tại `src/modules/gout/helpers.safety.ts`, ánh xạ `aerd` trong `src/engine/safety/gates.ts` và `kb/drugs/naproxen.json` để module `gout` chủ động rẽ nhánh kê ngay `prednisolone` cắt cơn gút cấp trên bệnh nhân AERD.
2. **Gắn `drugId: 'magnesium_sulfate'` bên phân hệ `htn` (`ASTHMA-R3-R2-03`):**
   - *Đã làm bên `asthma`:* Kiểm tra `hasConcurrentPreeclampsiaMgso4(ctx)` phát `AVOID` không truyền chồng liều `2 g` MgSO₄ hen cấp lên phác đồ Zuspan `4 g + 1 g/h`.
   - *Đề nghị Agent B5:* Gắn `drugId: 'magnesium_sulfate'` cho `rec_htn_preeclampsia_mgso4` trong `src/modules/htn/` để `merge.ts` tự động hợp nhất theo hoạt chất ở tầng engine.
3. **Cổng chặn khởi trị/chuyển đổi chẹn beta nội trú bên phân hệ `hf` (`ASTHMA-R3-R2-13`, `ASTHMA-R3-R3-01`):**
   - *Đề nghị Agent B5:* Trong `src/modules/hf/` (nội trú & ngoại trú), chặn khởi trị chẹn beta (`bisoprolol`, `metoprolol_succinate`) và chặn pass cổng `Ổn định trước xuất viện` khi bệnh nhân đang có cơn co thắt phế quản cấp / suy hô hấp cấp (`customInputs.isAcuteExacerbation === true`, `silentChest === true`, `spo2 < 90%`, `respiratoryRate > 30`); ngược lại, khi bệnh nhân HFrEF nội trú ổn định ngoài cơn cấp (`isAcuteExacerbation === false`) đang bị `asthma` phát `STOP carvedilol`, bổ sung lệnh `SWITCH` sang chẹn beta chọn lọc beta-1 (`bisoprolol` / `metoprolol_succinate`) liều thấp trước xuất viện giống ngoại trú.
4. **Lọc thuốc đã `STOP` trong bộ phát hiện trùng lặp `src/engine/safety/duplicates.ts` (`ASTHMA-R3-R2-17`):**
   - *Đề nghị Agent B5:* Trong `src/engine/safety/duplicates.ts`, loại trừ mọi thuốc trong `currentMeds` đã nhận khuyến cáo `action === 'STOP'` (không chỉ `switchFrom`) trước khi tính cảnh báo `dup.laba` / `dup.ics` để triệt tiêu cảnh báo giả khi dừng 2 LABA đơn trị cũ.
5. **Chuẩn hóa danh mục tương tác `kb/interactions/diabetes_respiratory.json` (`ASTHMA-R3-R2-01`, `ASTHMA-R3-R2-10`):**
   - *Đề nghị Agent B5:* (a) Gỡ `beclometasone`, `beclometasone_formoterol` và `beclometasone_glycopyrronium_formoterol` khỏi cảnh báo mức `critical` của `ix.ics_laba_strong_cyp3a4` để đồng bộ dược động học với khuyến cáo chuyển đổi an toàn sang nền Beclometasone; bổ sung `indacaterol_glycopyrronium_mometasone` vào nhóm nhạy cảm CYP3A4; (b) Mở rộng `ix.laba_monotherapy_asthma` bao gồm `glycopyrronium_indacaterol`, `umeclidinium_vilanterol`, `tiotropium_olodaterol` và nhóm LAMA đơn trị thiếu ICS.
6. **Hồ sơ thuốc ngoài quyền sở hữu của Agent M (`ASTHMA-R3-R2-07`, `R2-11`, `R2-15`, `ASTHMA-R3-R3-15`):**
   - *Đề nghị Agent B5:* (a) Cập nhật `kb/drugs/budesonide_glycopyrronium_formoterol.json` bổ sung hàm lượng Hen phế quản ≥ 12 tuổi (`160/14.4/4.8 mcg` x 2 nhát BID); (b) Tạo mới `kb/drugs/hydrocortisone.json` (100 mg TM theo QĐ 5850/BYT); (c) Bổ sung cảnh báo loại trừ `bloodEosinophils > 1500/µL` & EGPA vào `kb/drugs/dupilumab.json`; (d) Bổ sung gate `age < 18` vào `fluticasone_furoate_umeclidinium_vilanterol.json` & `beclometasone_glycopyrronium_formoterol.json`; (e) Hợp nhất lựa chọn đơn trị sinh học giữa `rec_copd_dupilumab` và `rec_copd_mepolizumab` trong `src/modules/copd/`.
