# BÁO CÁO PHẢN HỒI & KHẮC PHỤC THẨM ĐỊNH Y KHOA ĐỘC LẬP VÒNG 4 – PHÂN HỆ COPD (`copd`)

- **Phân hệ**: Bệnh phổi tắc nghẽn mạn tính (`src/modules/copd/**`, `kb/citations/copd.json`, `kb/thresholds/copd.json`, 23 tệp dược thư sở hữu bởi COPD `kb/drugs/*.json` & `kb/review/*.json`, `tests/modules/copd/**`, `tests/golden/copd/**`)
- **Đơn vị thực hiện**: **Agent L5 – Kỹ sư Khắc phục Thẩm định Vòng 4 Phân hệ COPD (`copd`)**
- **Tài liệu chuẩn đối chiếu nguyên văn**:
  1. **GOLD 2026 Report** (*Global Strategy for Prevention, Diagnosis and Management of COPD – 2026 Report*)
  2. **Bộ Y tế Việt Nam – Quyết định 2131/QĐ-BYT ngày 14/07/2026** (*Hướng dẫn chẩn đoán và điều trị Bệnh phổi tắc nghẽn mạn tính*, bao gồm Phụ lục 1 tr. 68–70, Phụ lục 10 tr. 102–104, Phụ lục 11 tr. 107–120)
  3. **Bộ Y tế Việt Nam – Quyết định 2767/QĐ-BYT (2023)** & **Hướng dẫn Dự phòng Huyết khối Tĩnh mạch Bộ Y tế (2023)**
  4. **GINA 2026 Strategy** (đối chiếu chồng lấp Hen – COPD / ACO, lạm dụng SABA, DDI CYP3A4, thai kỳ)
  5. **Nhãn thuốc gốc FDA DailyMed & EMA SmPC**: *Daliresp* (roflumilast), *Dupixent* (dupilumab), *Nucala* (mepolizumab), *Zithromax* (azithromycin), *Coreg* (carvedilol), *Spiriva* (tiotropium), *Tudorza/Eklira* (aclidinium), *Breztri Aerosphere*, *Trelegy Ellipta*, *Anoro Ellipta*, *Advair Diskus*, *Ultibro Breezhaler*, *Trimbow*, *Fostair/Foster*, *Theophylline*.

---

## 1. Tổng Quan Điều Hành & Kết Quả Cổng Kiểm Định (Executive Summary)

Toàn bộ **46 phát hiện thẩm định độc lập Vòng 4** từ 3 hội đồng phản biện mù đôi (**R1**: 10 mục `COPD-R4-R1-01..10`; **R2**: 21 mục `COPD-R4-R2-01..21`; **R3**: 15 mục `COPD-R4-R3-01..15`) — bao gồm **100% lỗi `critical` (10/10)**, **100% lỗi `major` (21/21)** và **100% mục `minor`/`suggestion` (15/15)** thuộc phạm vi COPD — đã được khắc phục triệt để và kiểm chứng tự động bằng thực nghiệm `evaluate()`:

| Cổng kiểm định bắt buộc (Verification Gate) | Tiêu chuẩn | Kết quả thực tế | Trạng thái |
| :--- | :---: | :--- | :---: |
| **1. Giới hạn kích thước tệp `< 20.480 bytes`** (`src/modules/copd/**` & `tests/modules/copd/**`) | `< 20.480 B` (100% tệp `.ts`) | **48/48 tệp `.ts` ĐẠT** (lớn nhất `20.444 B`, **0 tệp vượt trần**) | ✅ **PASS** |
| **2. Biên dịch kiểu tĩnh TypeScript** (`npx tsc --noEmit`) | `0` lỗi trong `copd` | **`0` lỗi TypeScript** trên toàn bộ `src/modules/copd/**` & `tests/modules/copd/**` | ✅ **PASS** |
| **3. Kiểm định Cơ sở Tri thức & QA Lint** (`npm run verify:kb`) | `0` lỗi, `0` cảnh báo | **`copd \| files: 41 \| err: 0 \| qaOk: 57 \| litWarn: 0`**; toàn kho **239 tệp (`0 lỗi; 0 cảnh báo`)** | ✅ **PASS** |
| **4. Kiểm thử Đơn vị, Bất biến 22.000 ca & Đối kháng Vòng 4** (`npx vitest run tests/modules/copd/`) | 100% PASS | **6/6 tệp test PASS** (**91 bài test**: 12.000 ca ngẫu nhiên + 10.000 ca fail-closed + 68 ca chuẩn + 20 kịch bản đối kháng Vòng 4, **0 vi phạm**) | ✅ **PASS** |
| **5. Kiểm thử Golden Runner liên phân hệ** (`npx vitest run tests/golden/_runner.test.ts -t "copd_"`) | 100% PASS | **140/140 bài test PASS** (`0` lỗi, `0` cảnh báo console `[require.ts]`) | ✅ **PASS** |

---

## 2. Kiến Trúc Mô-đun Hóa `< 20 KB` (`41` tệp nguồn + `7` tệp kiểm thử)

Toàn bộ `src/modules/copd/` (**41 tệp `.ts`**) và `tests/modules/copd/` (**7 tệp `.ts`**, sau khi tách `invariants.test.ts` cũ `42.672 B` thành 7 mô-đun chuyên biệt) đều nhỏ hơn nghiêm ngặt ngưỡng `20.480 B`:

| Nhóm tệp | Danh sách tệp & Dung lượng (Bytes) | Trần tối đa |
| :--- | :--- | :---: |
| **`src/modules/copd/` (41 tệp)** | `rules.escalation.biologics.ts` (`20.444`), `rules.inpatient.vte_discharge.ts` (`20.265`), `rules.safety.systemic.ts` (`20.130`), `helpers.clinical.ts` (`19.595`), `rules.inpatient.bronch_o2.ts` (`18.389`), `rules.safety.cardio.ts` (`17.679`), `helpers.constants.ts` (`17.499`), `rules.escalation.oral.ts` (`17.063`), `rules.safety.inhalers_device.ts` (`17.055`), `rules.inpatient.vent_icu.ts` (`16.617`), `rules.initial.ts` (`15.555`), `rules.followup.stepup_bronch.ts` (`15.446`), `rules.followup.continue.ts` (`14.711`), `rules.followup.stepup_ics.ts` (`13.842`), `rules.nonpharm.prevention.ts` (`13.562`), `rules.safety.inhalers_stop.ts` (`13.375`), `helpers.inhalers_plan.ts` (`13.122`), `matrices.therapy.ts` (`12.951`), `rules.inpatient.meds.ts` (`12.930`), `matrices.devices.ts` (`12.864`), `helpers.oral_safety.ts` (`12.367`), `inputs.stable.ts` (`12.309`), `helpers.inhalers.ts` (`12.160`), `rules.diagnosis.ts` (`12.005`), `rules.nonpharm.ts` (`11.316`), `rules.inpatient.abx.ts` (`9.973`), `rules.followup.aco.ts` (`8.763`), `helpers.aco.ts` (`7.641`), `helpers.drug_sets.ts` (`6.813`), `inputs.acute.ts` (`6.112`), `presets.ts` (`5.548`), `pathways.ts` (`3.525`), và 9 barrel files (`112–673 B`) | **`20.444 B` < `20.480 B`** |
| **`tests/modules/copd/` (7 tệp)** | `round4.critical.test.ts` (`19.220`), `invariants.random.test.ts` (`17.296`), `round4.minor.test.ts` (`12.088`), `invariants.helpers.ts` (`11.146`), `round4.major.test.ts` (`10.379`), `invariants.failclosed.test.ts` (`8.399`), `golden.copd.test.ts` (`3.756`) | **`19.220 B` < `20.480 B`** |

---

## 3. Giải Trình Chi Tiết Hội Đồng R1 (`COPD-R4-R1-01` → `COPD-R4-R1-10`)

### `COPD-R4-R1-01` (`critical`) — Chuyển sang `methylprednisolone` tĩnh mạch cho bệnh nhân đợt cấp COPD nguy kịch / lơ mơ / ngừng thở / sốc tại ICU thay vì viên uống `prednisolone`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.inpatient.meds.ts:154-232`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.meds.ts#L154-L232), [`helpers.clinical.ts:465-473`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.clinical.ts#L465-L473).
- **Chi tiết khắc phục**:
  - Bổ sung biến `cannotTakeOralOrCritical = isCriticallyUnstableInpatient(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx) || Boolean(ci.cannotTakeOral) || Boolean(ci.unableToSwallow)` tại [`rules.inpatient.meds.ts:154-158`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.meds.ts#L154-L158).
  - Khi bệnh nhân có rối loạn tri giác (`alteredMentalStatus`), ngừng thở (`respiratoryArrest`), tụt huyết áp sốc (`SBP < 90 mmHg`), toan máu nguy kịch (`pH ≤ 7.25`) hoặc không uống được, hệ thống tự động chọn `drugId: 'methylprednisolone'` đường tiêm tĩnh mạch (`Methylprednisolone 40 mg tiêm tĩnh mạch mỗi ngày trong 5 ngày`), loại bỏ hoàn toàn câu gợi ý uống viên nén gây nguy cơ sặc phổi, đồng thời sửa lỗi nội suy liều ở nhánh `SWITCH` (`${predMin}–${predDose} mg`).
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:52-77`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L52-L77).

### `COPD-R4-R1-02` (`major`) — Khử báo động giả ngộ độc oxy (`SpO₂ > 92%`) & đòi chọc ABG ở đợt cấp nhẹ ngoại trú tự thở khí trời; điều chỉnh tiêu đề SABA ngoại trú sang pMDI + buồng đệm
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.inpatient.bronch_o2.ts:95-100, 297-311`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.bronch_o2.ts#L297-L311), [`rules.inpatient.vent_icu.ts:207-230`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.vent_icu.ts#L207-L230).
- **Chi tiết khắc phục**:
  1. Tại [`copd.inpatient.avoid_hyperoxia`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.bronch_o2.ts#L297-L311): Ở `setting: 'outpatient'`, chỉ kích hoạt khi `ci.onSupplementalOxygen === true` tường minh (ở `inpatient`, kích hoạt khi đang thở oxy bổ sung hoặc đã xác nhận tăng `PaCO₂ ≥ 45 mmHg` mà chưa tắt cờ oxy).
  2. Tại [`copd.inpatient.abg_required`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.vent_icu.ts#L207-L230): Ngoại trú nhẹ tự thở khí phòng `SpO₂ ≥ 92%`, `RR ≤ 24`, không co kéo cơ hô hấp phụ không bị ép chọc Khí máu động mạch xâm lấn thường quy.
  3. Tại [`copd.inpatient.short_acting_bronchodilators`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.bronch_o2.ts#L95-L100): Tách riêng tiêu đề & liều đợt cấp nhẹ ngoại trú ưu tiên bình xịt định liều pMDI ± buồng đệm (`2–4 nhát`) thay vì gán cứng khí dung nội viện.
- **Kiểm thử xác nhận**: [`round4.major.test.ts:46-79`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L46-L79).

### `COPD-R4-R1-03` (`major`) — Xử trí khó thở dai dẳng trên nền Triple (`ICS + LAMA + LABA`) & gỡ khóa rút ICS kê sai chỉ định (`EOS < 100`, 0 đợt cấp, không hen) dù còn khó thở
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.inhalers.ts:255-266`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts#L255-L266), [`rules.followup.stepup_bronch.ts:100-156`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.stepup_bronch.ts#L100-L156), [`rules.followup.continue.ts:62-215`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.continue.ts#L62-L215).
- **Chi tiết khắc phục**:
  1. Tại [`isInappropriateIcsDeEscalationCandidate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts#L255-L266): Bỏ chặn `isHighSymptomsConfirmed(ctx)` đối với `eff === 'triple'`, cho phép rút ICS thừa (`Triple -> LABA + LAMA`) khi `0` đợt cấp, không hen, `bloodEos < 100 /µL` (giữ nguyên 2 thuốc giãn phế quản tối đa và tránh nguy cơ viêm phổi do ICS).
  2. Mở rộng quy tắc [`copd.followup.dyspnea_on_laba_lama`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.stepup_bronch.ts#L100-L156) bao phủ cả bệnh nhân khó thở dai dẳng trên nền `'triple'` (hướng dẫn kiểm tra kỹ thuật hít, đổi thiết bị/phân tử, PHCNHH và tầm soát suy tim/tăng áp phổi/thiếu máu theo GOLD 2026 Figure 3.9).
  3. Chuẩn hóa văn bản của `continue_controlled_inhaler` và `continue_triple` theo trạng thái triệu chứng thực tế, không bao giờ gọi bệnh nhân `mMRC ≥ 2` / `CAT ≥ 10` là *"đang kiểm soát ổn định"*.
- **Kiểm thử xác nhận**: [`round4.major.test.ts:81-118`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L81-L118).

### `COPD-R4-R1-04` (`major`) — Chuẩn hóa 100% trích dẫn nhãn gốc FDA / EMA SmPC / BYT trên toàn bộ 23 tệp thuốc COPD & ngưỡng `copd.theophylline_elderly_age`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`kb/citations/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json) (150 trích dẫn nguyên văn), [`kb/thresholds/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/copd.json), 23 tệp `kb/drugs/*.json` sở hữu bởi COPD & `kb/review/*.json`.
- **Chi tiết khắc phục**:
  - Gỡ bỏ hoàn toàn việc mượn câu suy thận của Varenicline (`byt.copd.2023.severe_renal_crcl30` được định danh lại đúng cho Varenicline trong `copd.nonpharm.smoking_cessation`) và gỡ bỏ mảnh câu dịch tễ suy thận `gold.copd.2026.elderly_age_65_70` khỏi `copd.theophylline_elderly_age` (thay bằng trích dẫn dược động học giảm thanh thải Theophylline ở người cao tuổi từ nhãn FDA Theophylline).
  - Bổ sung 36 trích dẫn nguyên văn từ nhãn FDA / EMA SmPC trong `Medical_Library_2026/09_Nhan_Thuoc/` cho `renal`, `pregnancy`, `lactation`, `severe_milk_protein_allergy` (lactose monohydrate), `hypersensitivity` và `cholestatic_jaundice` trên toàn bộ **23/23 tệp thuốc COPD**, cập nhật đầy đủ `contentHash` (`auto_checked`).
- **Kiểm thử xác nhận**: `npm run verify:kb` -> **`0 lỗi; 0 cảnh báo`**; [`round4.minor.test.ts:152-215`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L152-L215).

### `COPD-R4-R1-05` (`major`) — Đồng bộ chuẩn hóa `fev1FvcRatio` dạng `%`, `bcat` và điều kiện xác nhận GOLD Nhóm A
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ TRONG `copd` & ĐỐI CHIẾU `engine`**.
- **Vị trí mã nguồn**: [`helpers.clinical.ts:54-92, 496-501`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.clinical.ts#L54-L92), [`rules.diagnosis.ts:185-221`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.diagnosis.ts#L185-L221); tầng lõi Engine (thuộc phạm vi Agent B — kiểm tra read-only): [`src/engine/derive.ts:141-188`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/derive.ts#L141-L188), [`src/engine/calculators/gold.ts:95-145`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/gold.ts#L95-L145).
- **Chi tiết khắc phục**:
  - Trong `src/modules/copd/helpers.clinical.ts`: `getFev1FvcRatio(ctx)` chuẩn hóa tỷ số `%` (`> 1..100` -> `/ 100`) và đồng bộ làm tròn `.toFixed(2)` khi tính từ `fev1 / fvc` thô để khớp 100% với `derive.ts:143`; `isLowSymptomsConfirmed(ctx)` yêu cầu đầy đủ cả `mmrc < 2` và `cat < 10` theo chuẩn fail-closed GOLD 2026 Figure 2.10.
  - Kiểm chứng read-only tại [`src/engine/derive.ts:171-174`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/derive.ts#L171-L174): Agent B đã xóa nhánh đọc nhầm `customInputs.bcat` khỏi `catVal` và kiểm tra `postBdrRatio < 0.7` trước khi tính `goldGrade`/`goldGroup`. *(Lưu ý phân quyền: `src/engine/calculators/gold.ts` thuộc phạm vi ghi độc quyền của Agent B khi gọi trực tiếp `computeGold()` đơn lẻ ngoài `derivePatientData`).*
- **Kiểm thử xác nhận**: [`invariants.failclosed.test.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/invariants.failclosed.test.ts), [`round4.minor.test.ts:217-243`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L217-L243).

### `COPD-R4-R1-06` (`major`) — Thời gian kháng sinh đợt cấp `5 ngày` (`≤ 5 ngày`) ở hồ sơ `INTL` và `US` theo GOLD 2026
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.inpatient.abx.ts:99-158`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.abx.ts#L99-L158).
- **Chi tiết khắc phục**: Khi `profile` là `'INTL'` hoặc `'US'`, xuất chính xác `5 ngày (≤ 5 ngày theo GOLD 2026)` trên cả `title`, `dose`, `rationale` và `profileDiff.{INTL,US}`, giữ phân tầng `5–7 ngày` (ngoại trú) / `7–10 ngày` (nội trú nặng) riêng cho hồ sơ `'VN'` theo QĐ 2131/QĐ-BYT 2026.
- **Kiểm thử xác nhận**: [`round4.major.test.ts:120-163`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L120-L163).

### `COPD-R4-R1-07` (`minor`) — Tách độc lập tầm soát thiếu hụt Alpha-1 Antitrypsin (AATD) khỏi điều kiện tuổi/gói-năm của LDCT
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.nonpharm.prevention.ts:154-255`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.nonpharm.prevention.ts#L154-L255).
- **Chi tiết khắc phục**: Tách thành 2 quy tắc độc lập: `copd.nonpharm.lung_cancer_ldct_screening` (`50–80 tuổi`, `≥ 20 gói-năm`, đang hút hoặc bỏ thuốc `≤ 15 năm`) và `copd.nonpharm.aatd_screening` (áp dụng cho mọi bệnh nhân COPD ổn định chưa xét nghiệm AATD, đặc biệt nhấn mạnh khởi phát sớm `< 50 tuổi` hoặc không hút thuốc theo WHO / GOLD 2026 p. 59).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:44-89`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L44-L89).

### `COPD-R4-R1-08` (`minor`) — Ánh xạ `conditions.priorAsthma` trong an toàn chẹn beta không chọn lọc & toàn cục
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRONG `copd` & KIỂM CHỨNG `engine`**.
- **Vị trí mã nguồn**: [`helpers.clinical.ts:339-344`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.clinical.ts#L339-L344), [`rules.safety.cardio.ts:28-140`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.cardio.ts#L28-L140); tầng Engine [`src/engine/conditions.ts:43`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/conditions.ts#L43).
- **Chi tiết khắc phục**: `hasConcurrentAsthma(ctx)` nhận diện đầy đủ `conditions.priorAsthma`, `conditions.asthma` và `selectedModules.includes('asthma')`; khi chỉ chạy `['copd']` mà có `priorAsthma` hoặc `asthma`, quy tắc đa khe `copd.safety.non_selective_bb_stop_0..3` chủ động phát lệnh `STOP` mọi thuốc chẹn beta không chọn lọc (kể cả `sotalol`, `nadolol`, `propranolol`, `timolol_ophthalmic`). `priorAsthma` cũng đã có mặt trong `STANDARD_CONDITIONS` của `src/engine/conditions.ts:43`.
- **Kiểm thử xác nhận**: [`round4.major.test.ts:165-208`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L165-L208).

### `COPD-R4-R1-09` (`minor`) — Xóa sạch trường `"cor"` giả lập trên 150/150 trích dẫn COPD, bổ sung trích dẫn COVID-19 cho tiêm chủng & bổ sung `packYears` / `respiratoryRate` / `setting` vào `copdPresets`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`kb/citations/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json), [`rules.nonpharm.prevention.ts:103-152`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.nonpharm.prevention.ts#L103-L152), [`presets.ts:1-145`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/presets.ts#L1-L145).
- **Chi tiết khắc phục**: Xóa 100% trường `"cor"` khỏi các trích dẫn GOLD/GINA/BYT/FDA (chỉ giữ trên nguồn ESC); thêm trích dẫn nguyên văn `gold.copd.2026.vaccine_covid19` (GOLD 2026 PDF p. 61) và chi tiết COVID-19 + Zona bất hoạt tái tổ hợp (`Shingrix`) vào `copd.nonpharm.vaccinations`; bổ sung `packYears: 25` cho `copd_preset_group_a` và `setting: 'inpatient', respiratoryRate: 30` cho `copd_preset_inpatient_exac_0245`.
- **Kiểm thử xác nhận**: [`round4.major.test.ts:210-239`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L210-L239), [`round4.minor.test.ts:152-215`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L152-L215).

### `COPD-R4-R1-10` (`suggestion`) — Bổ sung trích dẫn gốc mục Cai thuốc lá (GOLD 2026 pp. 59–60 & BYT QĐ 2131/2026 Mục 2.1)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.nonpharm.prevention.ts:21-101`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.nonpharm.prevention.ts#L21-L101), [`kb/citations/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json) (`gold.copd.2026.smoking_cessation_pharmacotherapy`, `byt.copd.2026.smoking_cessation_5a`, `byt.copd.2023.severe_renal_crcl30`).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:91-125`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L91-L125).

---

## 4. Giải Trình Chi Tiết Hội Đồng R2 (`COPD-R4-R2-01` → `COPD-R4-R2-21`)

### `COPD-R4-R2-01` (`critical`) — Suy luận tự động thành phần LAMA/LABA/ICS cho mọi alias FDC đảo chiều (`indacaterol_glycopyrronium`, `beclometasone_formoterol_glycopyrronium`...) & chặn kê đè trên bệnh nhân Glôcôm góc đóng / Bí tiểu cấp
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.constants.ts:28-190`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.constants.ts#L28-L190), [`helpers.inhalers.ts:25-78`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts#L25-L78), [`rules.safety.inhalers_stop.ts:110-149`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_stop.ts#L110-L149), [`rules.safety.inhalers_device.ts:24-88`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_device.ts#L24-L88).
- **Chi tiết khắc phục**:
  - Bổ sung đầy đủ các mã đảo chiều hoạt chất (`indacaterol_glycopyrronium`, `beclometasone_formoterol_glycopyrronium`, `budesonide_formoterol_glycopyrronium`, `aclidinium_formoterol`, `formoterol_aclidinium`, `glycopyrronium_formoterol`, `formoterol_glycopyrronium`, `mometasone_indacaterol_glycopyrronium`) vào `INHALER_PROFILES`.
  - Đồng thời nâng cấp `getInhalerProfile(drugId)` tự động phân tích `drug(id).components` và `drug(id).class` từ KB: bất kỳ chế phẩm nào chứa `tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`, `revefenacin` hoặc lớp `'lama'` đều được nhận diện `lama: true`, kích hoạt `STOP` ngay lập tức và phát `SWITCH` (`switchFrom`) sang `olodaterol` / `budesonide_formoterol` để `mergeClassResolver.ts` không bao giờ biến đổi ngược thành `CONTINUE` bình chứa LAMA.
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:79-115`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L79-L115).

### `COPD-R4-R2-02` (`critical`) — Tích hợp sàng lọc chất ức chế mạnh CYP3A4 (bao gồm `roxithromycin`, azole, `ritonavir`/`Paxlovid`) vào toàn bộ quy tắc khởi trị, nâng bậc, duy trì & chuyển đổi bình hít chứa `salmeterol` / `vilanterol` / `fluticasone`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.drug_sets.ts:52-75`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.drug_sets.ts#L52-L75), [`helpers.clinical.ts:180-182`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.clinical.ts#L180-L182), [`helpers.inhalers_plan.ts:28-65`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers_plan.ts#L28-L65), [`rules.safety.inhalers_device.ts:220-296`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_device.ts#L220-L296), [`rules.followup.continue.ts:44-52`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.continue.ts#L44-L52).
- **Chi tiết khắc phục**:
  - Bổ sung `STRONG_CYP3A4_INHIBITOR_IDS` đầy đủ (`clarithromycin`, `erythromycin`, `roxithromycin`, `ketoconazole`, `itraconazole`, `posaconazole`, `voriconazole`, `ritonavir`, `nirmatrelvir_ritonavir`, `cobicistat`, `boceprevir`, `telaprevir`, `atazanavir`, `darunavir`, `lopinavir_ritonavir`).
  - Khi `hasStrongCyp3a4Inhibitor(ctx) === true`: `selectTripleInhaler`, `selectDualBronchodilator` và các rule khởi trị/nâng bậc tự động tránh `Trelegy`/`Anoro`/`Seretide`/`Relvar` để chọn `Breztri`/`Trimbow` hoặc `Spiolto` (`formoterol`/`olodaterol`); nếu bệnh nhân đang dùng sẵn bình chứa `salmeterol`/`vilanterol` (`Seretide`, `Trelegy`, `Anoro`, `Serevent`), quy tắc `copd.safety.cyp3a4_salmeterol_vilanterol_switch` chặn `CONTINUE` và phát lệnh `STOP` + `SWITCH` sang chế phẩm không phụ thuộc CYP3A4 theo đúng Phụ lục 11 STT 34 QĐ 2131/QĐ-BYT 2026 & GINA 2026 p. 133.
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:117-166`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L117-L166).

### `COPD-R4-R2-03` (`critical`) — Bảo vệ không cắt đứt đột ngột `Carvedilol` trong đợt cấp COPD trên nền HFrEF/CAD huyết động ổn định, xử lý đồng bộ `HR < 50 bpm` & cảnh báo chẹn beta ở COPD phụ thuộc oxy dài hạn
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.safety.cardio.ts:28-235`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.cardio.ts#L28-L235).
- **Chi tiết khắc phục**:
  1. Trong đợt cấp COPD trên nền HFrEF/CAD/AF huyết động ổn định (`SBP ≥ 90`, `HR ≥ 50`, không sốc tim/phù phổi cấp, không kèm hen): Không phát `STOP` cắt đột ngột `carvedilol`; phát `REDUCE` / `MONITOR` giữ/giảm nửa liều tạm thời phòng hội chứng cai cường giao cảm (FDA Coreg §5.1) và lên kế hoạch chuyển đổi chéo sang `bisoprolol` ngay khi ổn định trước xuất viện.
  2. Khi có nhịp chậm `HR < 50 bpm` hoặc `SBP < 90 mmHg` hoặc block AV độ II–III trên nền HFrEF/CAD: Phát `HOLD` (`dose: undefined`) thay vì cặp mâu thuẫn `STOP Carvedilol` + `HOLD Bisoprolol`.
  3. Bổ sung cảnh báo đặc thù khi bệnh nhân phụ thuộc oxy dài hạn (`restingSpo2 ≤ 88%` hoặc `onSupplementalOxygen: true`) theo BYT QĐ 2131/QĐ-BYT 2026 Mục 5.2 (tr. 53).
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:168-233`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L168-L233).

### `COPD-R4-R2-04` (`critical`) — Bổ sung đầy đủ SAMA + SABA FDC (`Combivent` – `ipratropium_salbutamol`, `Berodual` – `ipratropium_fenoterol`) vào dược thư KB và các quy tắc chống chỉ định kháng muscarinic / trùng lặp LAMA
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`kb/drugs/ipratropium_salbutamol.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/ipratropium_salbutamol.json), [`kb/drugs/ipratropium_fenoterol.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/ipratropium_fenoterol.json), [`helpers.drug_sets.ts:1-25`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.drug_sets.ts#L1-L25), [`rules.safety.inhalers_stop.ts:201-244`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_stop.ts#L201-L244), [`rules.inpatient.bronch_o2.ts:127-190`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.bronch_o2.ts#L127-L190).
- **Chi tiết khắc phục**: Tạo mới 2 tệp dược thư chuẩn `ipratropium_salbutamol.json` & `ipratropium_fenoterol.json` (kèm review hashes) và mở rộng `SAMA_CONTAINING_IDS` (`ipratropium`, `atrovent`, `ipratropium_salbutamol`, `salbutamol_ipratropium`, `combivent`, `ipratropium_fenoterol`, `fenoterol_ipratropium`, `berodual`, `albuterol_ipratropium`, `duoneb`) trên toàn bộ rule đa khe `sama_on_lama_stop_0..3` và `ipratropium_contra_avoid_0..3` (`STOP` ngay khi đang dùng trên bệnh nhân glôcôm góc đóng / bí tiểu cấp).
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:235-278`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L235-L278).

### `COPD-R4-R2-05` (`critical`) — Đưa `Domperidone` và toàn bộ các thuốc kéo dài khoảng QT vào `QT_PROLONGING_DRUG_IDS` để chặn `Azithromycin` theo Phụ lục 11 STT 3 QĐ 2131/QĐ-BYT 2026
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.drug_sets.ts:27-50`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.drug_sets.ts#L27-L50), [`helpers.oral_safety.ts:175-190`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.oral_safety.ts#L175-L190).
- **Chi tiết khắc phục**: Bổ sung `'domperidone'`, nhóm azole (`fluconazole`, `itraconazole`, `voriconazole`, `posaconazole`, `ketoconazole`), macrolide (`roxithromycin`, `spiramycin`, `clarithromycin`, `erythromycin`), thuốc chống loạn thần/chống nôn (`haloperidol`, `quetiapine`, `risperidone`, `olanzapine`, `chlorpromazine`, `sulpiride`, `amisulpride`, `ondansetron`) và tim mạch (`cilostazol`, `ivabradine`, `ranolazine`) vào `QT_PROLONGING_DRUG_IDS`, kèm trích dẫn nguyên văn `byt.copd.2026.azithromycin_domperidone_contra` (Phụ lục 11 STT 3, PDF tr. 107). Khi có `domperidone`, `copd.followup.azithromycin_prophylaxis` phát `AVOID` (`dose: undefined`) thay vì `CONSIDER`.
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:280-308`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L280-L308).

### `COPD-R4-R2-06` (`major`) — Đa khe (`0..3`) dừng toàn bộ thuốc ức chế TKTƯ (`Morphine` + `Diazepam` + `Pregabalin`/`Gabapentin`) trong suy hô hấp tăng CO₂ toan máu cấp
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.constants.ts:222-246`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.constants.ts#L222-L246), [`rules.safety.systemic.ts:242-302`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.systemic.ts#L242-L302).
- **Chi tiết khắc phục**: Mở rộng `CNS_DEPRESSANT_IDS` thêm `pregabalin`, `gabapentin`, `buprenorphine`, `hydromorphone`, `eszopiclone`, `phenobarbital` và chuyển `cns_depressant_hypercapnia_stop` sang cơ chế sinh đa khe `0..3` bằng `findAllCurrentMedsInSet(ctx, CNS_DEPRESSANT_IDS)` (`dose: undefined` trên mọi lệnh `STOP`).
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:449-490`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L449-L490).

### `COPD-R4-R2-07` (`major`) — Chặn `CONTINUE` bình DPI nhập qua mã gốc (`Spiriva HandiHaler`, `Symbicort Turbuhaler`) khi phản vệ đạm sữa bò & cấp thuốc thay thế không chứa LAMA nội viện khi `STOP` LAMA
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.inhalers.ts:170-218`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts#L170-L218), [`rules.safety.inhalers_device.ts:24-185`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_device.ts#L24-L185), [`rules.inpatient.meds.ts:47-120`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.meds.ts#L47-L120), [`rules.followup.continue.ts:39-105`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.continue.ts#L39-L105).
- **Chi tiết khắc phục**:
  1. Hàm `getAllActiveDpiInhalerMeds(ctx)` quét cả `DPI_INHALER_IDS` lẫn từ khóa thiết bị bột khô trong `med.name` (`/handihaler|turbuhaler|accuhaler|diskus|ellipta|breezhaler|nexthaler|genuair|dpi|bột khô/i`), chặn `CONTINUE` ở cả nội trú lẫn ngoại trú (kể cả nhánh MART của ACO) và phát `STOP` + `SWITCH` sang `Spiriva Respimat SMI` / `Symbicort Rapihaler pMDI + buồng đệm`.
  2. Mở rộng `copd.safety.lama_contra_alternative` hoạt động cho cả bệnh nhân nội trú ổn định huyết động bị `STOP` LAMA do glôcôm góc đóng / bí tiểu cấp để không bị mất trắng thuốc giãn phế quản dài hạn.
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:392-447`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L392-L447).

### `COPD-R4-R2-08` (`major`) — Hiệu chỉnh liều thận kháng sinh từ `eGFR / CrCl < 50 mL/phút` (Phụ lục 10 BYT 2131/2026), cảnh báo đứt gân Achilles do Quinolone + Steroid ở người `≥ 60 tuổi` & tương tác `Warfarin`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.inpatient.abx.ts:66-158`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.abx.ts#L66-L158), [`kb/thresholds/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/copd.json) (`copd.abx_renal_egfr_cutoff = 50`, `copd.abx_renal_crcl_cutoff = 50`, `copd.fq_elderly_age_cutoff = 60`), [`kb/citations/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json) (`byt.copd.2026.abx_renal_levofloxacin`, `byt.copd.2026.abx_renal_ciprofloxacin`, `byt.copd.2026.abx_renal_amox_clav`, `byt.copd.2026.quinolone_elderly_tendon_warning`).
- **Kiểm thử xác nhận**: [`round4.major.test.ts:120-163`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L120-L163).

### `COPD-R4-R2-09` (`major`) — Khôi phục toàn vẹn tham chiếu `kb/drugs/formoterol.json` & bổ sung các tệp thuốc sở hữu bởi COPD (`enoxaparin`, `heparin`, `ipratropium_salbutamol`, `ipratropium_fenoterol`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`kb/drugs/formoterol.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/formoterol.json), [`kb/drugs/enoxaparin.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/enoxaparin.json), [`kb/drugs/heparin.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/heparin.json), [`kb/drugs/ipratropium_salbutamol.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/ipratropium_salbutamol.json), [`kb/drugs/ipratropium_fenoterol.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/ipratropium_fenoterol.json) (+ 5 tệp `kb/review/*.json`).
- **Chi tiết khắc phục**: `hasDrug('formoterol') === true` khép kín toàn bộ `components` trên 5 FDC hô hấp; toàn bộ 23 tệp thuốc thuộc `DRUG_OWNER_MAP['Agent L (COPD)']` đạt chuẩn `npm run verify:kb` 100%.
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:152-215`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L152-L215).

### `COPD-R4-R2-10` (`major`) — Sửa toàn bộ trích dẫn sai trên các tệp thuốc COPD, sửa `pdfPage` của `gold.copd.2026.initial_group_e`, xóa sạch watermark cá nhân và nối hoàn chỉnh các câu quote bị cắt cụt từ
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`kb/citations/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json), 23 tệp `kb/drugs/*.json` của COPD.
- **Chi tiết khắc phục**: Xóa 100% chuỗi watermark `"ngoctlv.kcb_Truong Le Van Ngoc..."`, sửa đúng `pdfPage: 70` (`printedPage: 59`) và câu nguyên văn cho `gold.copd.2026.initial_group_e`, sửa tất cả các câu quote bị cắt dở từ tiếng Việt/Anh, và gắn trích dẫn đúng §4 / §8.6 từ nhãn FDA / SmPC cho từng tệp thuốc.
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:152-215`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L152-L215).

### `COPD-R4-R2-11` (`major`) — Bổ sung `setting: 'inpatient'` và `respiratoryRate: 30` cho preset nội viện `copd_preset_inpatient_exac_0245`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`presets.ts:103-145`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/presets.ts#L103-L145) (đồng thời gắn tường minh `setting: 'outpatient'` cho 3 preset ngoại trú).
- **Kiểm thử xác nhận**: [`round4.major.test.ts:210-239`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L210-L239).

### `COPD-R4-R2-12` (`major`) — Chặn `Roflumilast` khi dùng kèm `fluvoxamine` / `enoxacin` (AUC tăng +156%) & cảnh báo DDI CYP1A2/CYP3A4 mạnh (`Paxlovid`, `ritonavir`, azole, macrolide, `cimetidine`, thuốc tránh thai chứa `ethinyl_estradiol`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.drug_sets.ts:77-108`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.drug_sets.ts#L77-L108), [`helpers.oral_safety.ts:108-165`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.oral_safety.ts#L108-L165), [`rules.escalation.oral.ts:45-198`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.oral.ts#L45-L198).
- **Kiểm thử xác nhận**: [`round4.major.test.ts:241-285`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L241-L285).

### `COPD-R4-R2-13` (`major`) — Phát hiện & phát lệnh `STOP` khi trùng lặp ≥ 2 thuốc sinh học hô hấp, bổ sung sàng lọc ký sinh trùng giun lươn (*Strongyloides*) / viêm túi mật cấp / dải `FEV₁ 30–70%` trên `Dupilumab`, và đồng bộ cảnh báo thai kỳ + tránh vắc xin sống vào `biologic_continue`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.escalation.biologics.ts:55-398`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.biologics.ts#L55-L398), [`kb/citations/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json) (`fda.copd.dupilumab_helminth_warning`, `fda.copd.dupilumab_cholecystitis_fev1_range`).
- **Kiểm thử xác nhận**: [`round4.major.test.ts:287-338`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L287-L338), [`round4.minor.test.ts:91-150`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L91-L150).

### `COPD-R4-R2-14` (`minor`) — Parse chuỗi liều `'40 mg'` và quy đổi tương đương hoạt lực Prednisone (`methylprednisolone 32 mg = prednisone 40 mg`, `dexamethasone × 6.67`, `hydrocortisone × 0.25`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.inpatient.meds.ts:15-45, 160-195`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.meds.ts#L15-L45).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:44-89`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L44-L89).

### `COPD-R4-R2-15` (`minor`) — Hiển thị tường minh cảnh báo thận trọng suy thận nặng (`eGFR < 30 mL/phút`) trên LAMA thải trừ qua thận (`Tiotropium`, `Glycopyrronium`, `Spiolto`, `Ultibro`, `Breztri`, `Trimbow`) & `Azithromycin` (`eGFR 10–15 mL/phút`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.clinical.ts:268-288`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.clinical.ts#L268-L288) (`getLamaWarnings(ctx, drugId)`), [`helpers.oral_safety.ts:255-282`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.oral_safety.ts#L255-L282) (`getAzithromycinCautionWarnings(ctx)`).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:44-89`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L44-L89).

### `COPD-R4-R2-16` (`minor`) — Bổ sung chống chỉ định tiền sử vàng da ứ mật / xơ gan mất bù Child-Pugh C và cảnh báo nhược cơ (*Myasthenia Gravis*) + theo dõi INR `Warfarin` / nồng độ `Digoxin` cho `Azithromycin`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.oral_safety.ts:204-220, 283-307`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.oral_safety.ts#L204-L220), [`kb/citations/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json) (`fda.copd.azithromycin_cholestatic_contra`, `fda.copd.azithromycin_myasthenia_warfarin_digoxin`).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:44-89`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L44-L89), [`invariants.random.test.ts:360-377`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/invariants.random.test.ts#L360-L377).

### `COPD-R4-R2-17` (`minor`) — Xóa sạch `dose` (`dose: undefined`) trên 100% khuyến cáo `STOP` / `AVOID` / `HOLD` / `DEFER`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ TRONG CẢ `copd` VÀ `engine`**.
- **Vị trí mã nguồn**: Tất cả quy tắc `STOP`/`AVOID`/`HOLD` trong `src/modules/copd/rules.*.ts` đặt `dose: undefined`; đồng thời kiểm chứng read-only tại [`src/engine/safety/gates.ts:483-494`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts#L483-L494) (Agent B đã bổ sung `shouldClearDose` xóa tự động `dose` khi cổng an toàn hạ cấp xuống `STOP`/`AVOID`/`HOLD`/`DEFER`).
- **Kiểm thử xác nhận**: Bất biến toàn cục trên 22.000 ca tại [`invariants.helpers.ts:268-276`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/invariants.helpers.ts#L268-L276) & [`round4.critical.test.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts).

### `COPD-R4-R2-18` (`minor`) — Bổ sung dòng `Máy phun khí dung (Nebulizer)` & `pMDI + Buồng đệm có van` cùng cảnh báo tương tác CYP3A4 trên `Anoro`/`Trelegy` trong `copdMatrixDevices`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`matrices.devices.ts:70-156`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/matrices.devices.ts#L70-L156).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:152-215`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L152-L215).

### `COPD-R4-R2-19` (`suggestion`) — Đề cập tùy chọn khí dung `Ensifentrine` (PDE3/PDE4i) trong `profileDiff.INTL` / `profileDiff.US` của nhánh khó thở dai dẳng (GOLD 2026 Figure 3.9 p. 77)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.followup.stepup_bronch.ts:135-154`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.stepup_bronch.ts#L135-L154), [`kb/citations/copd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json) (`gold.copd.2026.ensifentrine_dyspnea`).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:91-150`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L91-L150).

### `COPD-R4-R2-20` (`suggestion`) — Tạo `kb/drugs/enoxaparin.json` & `heparin.json` và gắn `drugId` (`enoxaparin` / `heparin`) cho `copd.inpatient.vte_prophylaxis`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`kb/drugs/enoxaparin.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/enoxaparin.json), [`kb/drugs/heparin.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/heparin.json), [`rules.inpatient.vte_discharge.ts:207-325`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.vte_discharge.ts#L207-L325).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:127-150`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L127-L150).

### `COPD-R4-R2-21` (`suggestion`) — Cá thể hóa cảnh báo thuốc cai thuốc lá (`Bupropion` khi có tiền sử co giật / đang dùng `Theophylline` / corticoid; `Varenicline` giảm liều khi `eGFR < 30`; `NRT` trong mạch vành cấp) & ghi rõ vắc xin Zona tái tổ hợp bất hoạt (`Shingrix`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.nonpharm.prevention.ts:38-152`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.nonpharm.prevention.ts#L38-L152).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:91-125`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L91-L125).

---

## 5. Giải Trình Chi Tiết Hội Đồng R3 (`COPD-R4-R3-01` → `COPD-R4-R3-15`)

### `COPD-R4-R3-01` (`critical`) — Xóa bỏ hoàn toàn lệnh `STOP` "ma" (*Phantom `STOP`*) ở bối cảnh nội trú (`setting: 'inpatient'`) trên `Trelegy`, `Seretide` và bộ ba mở `Spiriva + Symbicort`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.inhalers.ts:255-266`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts#L255-L266), [`rules.safety.inhalers_stop.ts:68-108`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_stop.ts#L68-L108).
- **Chi tiết khắc phục**: Thêm cổng `if (ctx.settings.setting !== 'outpatient') return false;` vào `isInappropriateIcsDeEscalationCandidate(ctx)` và đồng bộ `setting: 'outpatient'` cho `copd.safety.stop_superseded_inhaler_0..3`. Ở bối cảnh nội trú không đợt cấp (`E01`, `P07`, `P08`), người bệnh được duy trì `CONTINUE` đầy đủ phác đồ thuốc hít nền tảng hiện có (0 lệnh `STOP` mồ côi).
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:310-348`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L310-L348) & bất biến không để 0 thuốc giãn phế quản trên 12.000 ca tại [`invariants.random.test.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/invariants.random.test.ts).

### `COPD-R4-R3-02` (`critical`) — Tự động kích hoạt xử trí suy hô hấp cấp / toan hô hấp mất bù (`pH ≤ 7.35` & `PaCO₂ ≥ 45 mmHg`, ngừng thở, lơ mơ, sốc, `SpO₂ < 90%` cấp) ở CẢ nội trú và ngoại trú ngay cả khi quên tích ô `acuteExacerbation`, đồng thời khóa chặt LTOT / tiêm chủng / PHCNHH trong pha cấp
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.clinical.ts:386-464`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.clinical.ts#L386-L464) (`hasAcuteRespiratoryFailureSigns`, `isAcuteExacerbation`), [`rules.nonpharm.ts:28-215`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.nonpharm.ts#L28-L215), [`rules.nonpharm.prevention.ts:109-115`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.nonpharm.prevention.ts#L109-L115).
- **Chi tiết khắc phục**: Xây dựng hàm thống nhất `hasAcuteRespiratoryFailureSigns(ctx)` cho cả `inpatient` và `outpatient` (không phụ thuộc ô tích `acuteExacerbation` khi chưa đặt `false` tường minh); khi phát hiện ngừng thở, toan máu nặng (`pH ≤ 7.25`), toan hô hấp mất bù (`pH ≤ 7.35` & `PaCO₂ ≥ 45`), lơ mơ kèm thiếu oxy/tăng CO₂, thở nhanh `> 30` hoặc `SpO₂ < 90%` kèm dấu hiệu cấp (`D01`, `D02`, `D03`), hệ thống lập tức kích hoạt đầy đủ phác đồ cấp cứu hô hấp (IMV/ICU/NIV/Oxy đích 88–92%/SABA/Methylprednisolone TM) và khóa 100% quy tắc giai đoạn ổn định (`LTOT`, `Home NIV`, `vaccinations`, `pulmonary_rehab`, `initial_*`).
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:350-390`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L350-L390).

### `COPD-R4-R3-03` (`critical`) — Chặn 100% bình bột khô DPI chứa lactose khi phản vệ đạm sữa bò (kể cả nhập qua mã KB gốc `tiotropium` HandiHaler / `budesonide_formoterol` Turbuhaler và đa bình DPI khi chưa có hô hấp ký)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.inhalers.ts:170-218`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts#L170-L218), [`rules.safety.inhalers_device.ts:90-185`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_device.ts#L90-L185), [`rules.followup.continue.ts:39-105`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.continue.ts#L39-L105).
- **Chi tiết khắc phục**: Chuyển cả `dpi_milk_allergy_stop_without_spiro_0..3` và `dpi_inhaler_stop_0..3` sang cơ chế đa khe `0..3` trên `getAllActiveDpiInhalerMeds(ctx)`, đảm bảo dừng toàn bộ các bình DPI trong `P05`, `P06`, `Q03`, `E04` và giữ cảnh báo bắt buộc dạng pMDI/SMI không chứa lactose trên cả nhánh MART.
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:392-447`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L392-L447).

### `COPD-R4-R3-04` (`critical`) — Đa khe (`0..3`) phát lệnh `STOP` cho toàn bộ thuốc ức chế TKTƯ (`Morphine + Diazepam`) và toàn bộ dẫn xuất Xanthin (`Theophylline + Aminophylline`) trong đợt cấp suy hô hấp tăng CO₂
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.safety.systemic.ts:126-168, 242-302`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.systemic.ts#L126-L168).
- **Kiểm thử xác nhận**: [`round4.critical.test.ts:449-490`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.critical.test.ts#L449-L490).

### `COPD-R4-R3-05` (`major`) — Tách riêng thuốc nhỏ mắt `timolol_ophthalmic` (không bao giờ đổi sang viên uống `Bisoprolol`), kiểm tra `HR < 50 bpm` / block AV độ II–III, và không tắt quy tắc dừng `sotalol`/`timolol_ophthalmic` khi chỉ chọn `['copd']` kèm `conditions.asthma = true`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.safety.cardio.ts:28-235`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.cardio.ts#L28-L235).
- **Chi tiết khắc phục**: Tách quy tắc riêng `copd.safety.ophthalmic_bb_stop` phát `STOP` thuốc nhỏ mắt chẹn beta không chọn lọc kèm hội chẩn Mắt đổi sang nhóm prostaglandin (`latanoprost`) / ức chế anhydrase tại chỗ / `betaxolol` nhỏ mắt chọn lọc $\beta_1$; kiểm tra `hr < 50` và `avBlock2Or3` trước khi `SWITCH` sang `bisoprolol`; và chỉ nhường quyền khi `selectedModules.includes('asthma')` thực sự được chạy.
- **Kiểm thử xác nhận**: [`round4.major.test.ts:165-208`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L165-L208).

### `COPD-R4-R3-06` (`major`) — Khai báo `setting: 'inpatient'` và `respiratoryRate: 30` cho `copd_preset_inpatient_exac_0245`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (đồng nhất với `COPD-R4-R2-11` & `COPD-R4-R1-09`).
- **Vị trí mã nguồn**: [`presets.ts:103-145`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/presets.ts#L103-L145).
- **Kiểm thử xác nhận**: [`round4.major.test.ts:210-239`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L210-L239).

### `COPD-R4-R3-07` (`major`) — Bổ sung quy tắc giảm liều dần (taper) Corticosteroid đường uống dùng duy trì mạn tính ở COPD ổn định & tính toán số học liều độc `Theophylline ≥ 10 mg/kg/ngày` + tương tác ức chế CYP1A2
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.safety.systemic.ts:80-124, 170-240`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.systemic.ts#L80-L124).
- **Chi tiết khắc phục**:
  1. Thêm quy tắc `copd.safety.chronic_oral_steroid_taper` khi `!isAcuteExacerbation(ctx)` và có `SYSTEMIC_STEROID_IDS` trong `currentMeds`: phát `REDUCE` (GOLD 2026 Evidence A) hướng dẫn tối ưu hóa thuốc hít nền tảng và giảm liều từ từ phòng suy thượng thận cấp.
  2. Tại `copd.safety.theophylline_chronic_review`: Parse tổng liều hàng ngày từ `med.dose` + `med.freq` chia cho `weight` (`mg/kg/ngày`) và quét chất ức chế CYP1A2 (`ciprofloxacin`, `fluvoxamine`, `clarithromycin`, `erythromycin`, `cimetidine`, `enoxacin`) — phát ngay `REDUCE` ưu tiên cao (`priority: 92`) khi vượt trần `10 mg/kg/ngày` hoặc có tương tác tăng nồng độ độc.
- **Kiểm thử xác nhận**: [`round4.major.test.ts:241-285`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L241-L285).

### `COPD-R4-R3-08` (`major`) — Khử báo nhầm giảm oxy & ép làm ABG ở đợt cấp nhẹ ngoại trú thở khí trời + bổ sung kế hoạch tái khám 1–4 tuần & khởi trị/tối ưu LABD sau đợt cấp ngoại trú
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (đồng nhất với `COPD-R4-R1-02`, kèm bổ sung quy tắc `copd.outpatient.post_exacerbation_followup`).
- **Vị trí mã nguồn**: [`rules.inpatient.bronch_o2.ts:297-311`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.bronch_o2.ts#L297-L311), [`rules.inpatient.vent_icu.ts:207-230`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.vent_icu.ts#L207-L230), [`rules.inpatient.vte_discharge.ts:375-418`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.vte_discharge.ts#L375-L418).
- **Kiểm thử xác nhận**: [`round4.major.test.ts:46-79`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L46-L79).

### `COPD-R4-R3-09` (`major`) — Triệt tiêu kê trùng lặp `DOAC/VKA liều điều trị` + `LMWH dự phòng VTE` khi đồng chọn `['copd', 'af']`, đồng thời chặn tuyệt đối Heparin khi có tiền sử HIT hoặc tiểu cầu `< 50 G/L`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.inpatient.vte_discharge.ts:46-235`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.vte_discharge.ts#L46-L235).
- **Chi tiết khắc phục**:
  1. Hàm `willCoSelectedAfPrescribeOac(ctx)` tính chính xác `computeCha2ds2va` và các cổng an toàn của phân hệ `af` khi đồng chọn `['copd', 'af']`: khi `af` phát lệnh `START` DOAC/VKA liều điều trị đầy đủ, `copd.inpatient.vte_prophylaxis` tự động nhường quyền (0 lệnh kê chồng `Enoxaparin` lên `Apixaban`).
  2. Hàm `hasHitContraindication(ctx)` và `getPlatelets(ctx) < 50 G/L` chặn hoàn toàn `START` LMWH/UFH, phát `AVOID` (`drugId: 'enoxaparin'`, `dose: undefined`) chuyển sang dự phòng VTE cơ học (IPC).
- **Kiểm thử xác nhận**: [`round4.major.test.ts:340-398`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L340-L398).

### `COPD-R4-R3-10` (`major`) — Chuẩn hóa văn bản lâm sàng trung thực trên `continue_controlled_inhaler` / `lama_contra_dyspnea_rehab` & mở khóa thuốc sinh học `Dupilumab`/`Mepolizumab` cho bệnh nhân chống chỉ định LAMA đang dùng `ICS + LABA` tối đa dung nạp
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`rules.followup.continue.ts:60-145`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.continue.ts#L60-L145), [`rules.followup.stepup_bronch.ts:158-205`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.stepup_bronch.ts#L158-L205), [`rules.escalation.biologics.ts:36-44`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.biologics.ts#L36-L44).
- **Chi tiết khắc phục**: Bổ sung `isOnMaximalToleratedInhalerForBiologic(ctx)` chấp nhận `eff === 'triple' || (eff === 'ics_laba' && hasAnticholinergicContra(ctx))` nhất quán với `rules.escalation.oral.ts`; đồng thời sửa văn bản `continue_controlled_inhaler` phản ánh đúng trường hợp chờ `bloodEos`, có `priorPneumonia`, hoặc đang giữ `ICS+LABA` do chống chỉ định LAMA.
- **Kiểm thử xác nhận**: [`round4.major.test.ts:287-338`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L287-L338).

### `COPD-R4-R3-11` (`major`) — Đồng bộ làm tròn `FEV₁/FVC` từ `fev1 / fvc` thô (`0.696 -> 0.70`) giữa `helpers.clinical.ts` và `derive.ts`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRONG `copd` & GHI NHẬN PHÂN QUYỀN `engine`**.
- **Vị trí mã nguồn**: [`helpers.clinical.ts:54-92`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.clinical.ts#L54-L92); kiểm chứng read-only tại [`src/engine/derive.ts:141-188`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/derive.ts#L141-L188).
- **Chi tiết khắc phục**: `getFev1FvcRatio(ctx)` trong `src/modules/copd/helpers.clinical.ts:86-90` đồng bộ chính xác phép làm tròn `Number((fev1 / fvc).toFixed(2))` với `derive.ts:143` khi tính từ `fev1` và `fvc` thô (trong khi giữ nguyên độ chính xác của `customInputs.fev1FvcRatio` nhập trực tiếp), loại bỏ hoàn toàn hiện tượng lệch chẩn đoán ở biên `FEV₁ = 1.392 L, FVC = 2.00 L` (`C02`). *(Lưu ý phân quyền: `src/engine/derive.ts` và `src/engine/calculators/gold.ts` thuộc phạm vi ghi của Agent B).*
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:217-243`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L217-L243).

### `COPD-R4-R3-12` (`major`) — Phát lệnh `STOP` đa khe cho thuốc sinh học hô hấp trùng lặp/không chỉ định (`dupilumab + mepolizumab`, `benralizumab + dupilumab`) & đồng bộ an toàn đa phân hệ `['copd', 'asthma']`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ TRONG CẢ `copd` VÀ `engine`**.
- **Vị trí mã nguồn**: [`rules.escalation.biologics.ts:55-165, 340-398`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.biologics.ts#L55-L165), [`helpers.aco.ts:1-215`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.aco.ts#L1-L215), [`rules.followup.aco.ts:1-210`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.aco.ts#L1-L210); kiểm chứng read-only tại [`src/engine/evaluate.ts:79-97`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/evaluate.ts#L79-L97).
- **Chi tiết khắc phục**:
  1. Quy tắc đa khe `copd.safety.duplicate_biologic_stop_0..2` phát `STOP` (`dose: undefined`) cho các kháng thể đơn dòng hô hấp trùng lặp hoặc không có chỉ định COPD (`benralizumab`, `omalizumab`, `tezepelumab` khi không đồng mắc Hen), đồng thời `biologic_continue` giữ đúng lệnh `CONTINUE` cho `dupilumab`/`mepolizumab` hợp lệ.
  2. Kiểm chứng read-only tại `src/engine/evaluate.ts:79-97`: Agent B đã bọc toàn bộ vòng lặp kiểm tra `rule.profiles` vào trong `try/catch` kèm fallback `Array.isArray(rule.profiles)`. Đồng thời `helpers.aco.ts` & `rules.followup.aco.ts` đã được đồng bộ 100% với phân hệ `asthma` hiện hành (kiểm chứng trên 22.000 ca bất biến + kịch bản `['copd', 'asthma']` 0 lỗi).
- **Kiểm thử xác nhận**: [`round4.major.test.ts:287-338`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.major.test.ts#L287-L338), [`invariants.random.test.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/invariants.random.test.ts).

### `COPD-R4-R3-13` (`minor`) — Tách riêng `copd.nonpharm.aatd_screening` khỏi LDCT và kiểm tra số học ngưỡng `quitYears ≤ 15 năm` (`copd.ldct_quit_years_max`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (đồng nhất với `COPD-R4-R1-07`).
- **Vị trí mã nguồn**: [`rules.nonpharm.prevention.ts:154-255`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.nonpharm.prevention.ts#L154-L255).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:44-89`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L44-L89).

### `COPD-R4-R3-14` (`minor`) — Chuyển sang đơn trị `Tiotropium Respimat` (không nâng bậc quá mức lên `LABA + LAMA`) cho bệnh nhân GOLD Nhóm A dị ứng đạm sữa bò & ghi nhận đầy đủ mọi bình DPI bị thay thế
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`helpers.inhalers.ts:268-315`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts#L268-L315), [`rules.safety.inhalers_device.ts:145-218`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_device.ts#L145-L218).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:44-89`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L44-L89).

### `COPD-R4-R3-15` (`suggestion`) — Bổ sung trường `quitYears` vào `copdInputs` và tự động đồng bộ giá trị số `qtc` / `qtcMs` (> 450 ms) với `hasProlongedQtc(ctx)`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Vị trí mã nguồn**: [`inputs.stable.ts:206-218`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/inputs.stable.ts#L206-L218), [`helpers.clinical.ts:148-178`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.clinical.ts#L148-L178).
- **Kiểm thử xác nhận**: [`round4.minor.test.ts:44-89`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/modules/copd/round4.minor.test.ts#L44-L89).

---

## 6. Bảng Đối Chiếu Nhanh Toàn Bộ 46 Phát Hiện Vòng 4 (100% Traceability Matrix)

| Mã phát hiện | Mức độ | Trạng thái | Tệp khắc phục chính | Tệp kiểm thử xác nhận |
| :--- | :---: | :---: | :--- | :--- |
| `COPD-R4-R1-01` | `critical` | ✅ FIXED | `src/modules/copd/rules.inpatient.meds.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R1-02` | `major` | ✅ FIXED | `rules.inpatient.bronch_o2.ts`, `rules.inpatient.vent_icu.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R1-03` | `major` | ✅ FIXED | `helpers.inhalers.ts`, `rules.followup.stepup_bronch.ts`, `rules.followup.continue.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R1-04` | `major` | ✅ FIXED | `kb/citations/copd.json`, `kb/thresholds/copd.json`, 23 `kb/drugs/*.json` | `npm run verify:kb` & `round4.minor.test.ts` |
| `COPD-R4-R1-05` | `major` | ✅ FIXED | `helpers.clinical.ts`, `rules.diagnosis.ts` (+ Engine `derive.ts`) | `invariants.failclosed.test.ts`, `round4.minor.test.ts` |
| `COPD-R4-R1-06` | `major` | ✅ FIXED | `src/modules/copd/rules.inpatient.abx.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R1-07` | `minor` | ✅ FIXED | `src/modules/copd/rules.nonpharm.prevention.ts` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R1-08` | `minor` | ✅ FIXED | `helpers.clinical.ts`, `rules.safety.cardio.ts` (+ Engine `conditions.ts`) | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R1-09` | `minor` | ✅ FIXED | `kb/citations/copd.json`, `rules.nonpharm.prevention.ts`, `presets.ts` | `round4.major.test.ts`, `round4.minor.test.ts` |
| `COPD-R4-R1-10` | `suggestion` | ✅ FIXED | `rules.nonpharm.prevention.ts`, `kb/citations/copd.json` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R2-01` | `critical` | ✅ FIXED | `helpers.constants.ts`, `helpers.inhalers.ts`, `rules.safety.inhalers_stop.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R2-02` | `critical` | ✅ FIXED | `helpers.drug_sets.ts`, `helpers.inhalers_plan.ts`, `rules.safety.inhalers_device.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R2-03` | `critical` | ✅ FIXED | `src/modules/copd/rules.safety.cardio.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R2-04` | `critical` | ✅ FIXED | `kb/drugs/ipratropium_{salbutamol,fenoterol}.json`, `rules.safety.inhalers_stop.ts`, `rules.inpatient.bronch_o2.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R2-05` | `critical` | ✅ FIXED | `helpers.drug_sets.ts`, `helpers.oral_safety.ts`, `kb/citations/copd.json` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R2-06` | `major` | ✅ FIXED | `helpers.constants.ts`, `rules.safety.systemic.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R2-07` | `major` | ✅ FIXED | `helpers.inhalers.ts`, `rules.safety.inhalers_device.ts`, `rules.inpatient.meds.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R2-08` | `major` | ✅ FIXED | `rules.inpatient.abx.ts`, `kb/thresholds/copd.json`, `kb/citations/copd.json` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R2-09` | `major` | ✅ FIXED | `kb/drugs/{formoterol,enoxaparin,heparin,ipratropium_*}.json` | `npm run verify:kb` & `round4.minor.test.ts` |
| `COPD-R4-R2-10` | `major` | ✅ FIXED | `kb/citations/copd.json`, 23 `kb/drugs/*.json` | `npm run verify:kb` & `round4.minor.test.ts` |
| `COPD-R4-R2-11` | `major` | ✅ FIXED | `src/modules/copd/presets.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R2-12` | `major` | ✅ FIXED | `helpers.drug_sets.ts`, `helpers.oral_safety.ts`, `rules.escalation.oral.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R2-13` | `major` | ✅ FIXED | `src/modules/copd/rules.escalation.biologics.ts` | `round4.major.test.ts`, `round4.minor.test.ts` |
| `COPD-R4-R2-14` | `minor` | ✅ FIXED | `src/modules/copd/rules.inpatient.meds.ts` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R2-15` | `minor` | ✅ FIXED | `helpers.clinical.ts`, `helpers.oral_safety.ts` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R2-16` | `minor` | ✅ FIXED | `helpers.oral_safety.ts`, `kb/citations/copd.json` | `round4.minor.test.ts`, `invariants.random.test.ts` |
| `COPD-R4-R2-17` | `minor` | ✅ FIXED | `src/modules/copd/rules.*.ts` (`dose: undefined`) + Engine `gates.ts` | `invariants.helpers.ts`, `round4.critical.test.ts` |
| `COPD-R4-R2-18` | `minor` | ✅ FIXED | `src/modules/copd/matrices.devices.ts` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R2-19` | `suggestion` | ✅ FIXED | `rules.followup.stepup_bronch.ts`, `kb/citations/copd.json` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R2-20` | `suggestion` | ✅ FIXED | `kb/drugs/{enoxaparin,heparin}.json`, `rules.inpatient.vte_discharge.ts` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R2-21` | `suggestion` | ✅ FIXED | `src/modules/copd/rules.nonpharm.prevention.ts` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R3-01` | `critical` | ✅ FIXED | `helpers.inhalers.ts`, `rules.safety.inhalers_stop.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R3-02` | `critical` | ✅ FIXED | `helpers.clinical.ts`, `rules.nonpharm.ts`, `rules.nonpharm.prevention.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R3-03` | `critical` | ✅ FIXED | `helpers.inhalers.ts`, `rules.safety.inhalers_device.ts`, `rules.followup.continue.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R3-04` | `critical` | ✅ FIXED | `src/modules/copd/rules.safety.systemic.ts` | `tests/modules/copd/round4.critical.test.ts` |
| `COPD-R4-R3-05` | `major` | ✅ FIXED | `src/modules/copd/rules.safety.cardio.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R3-06` | `major` | ✅ FIXED | `src/modules/copd/presets.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R3-07` | `major` | ✅ FIXED | `src/modules/copd/rules.safety.systemic.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R3-08` | `major` | ✅ FIXED | `rules.inpatient.bronch_o2.ts`, `rules.inpatient.vent_icu.ts`, `rules.inpatient.vte_discharge.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R3-09` | `major` | ✅ FIXED | `src/modules/copd/rules.inpatient.vte_discharge.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R3-10` | `major` | ✅ FIXED | `rules.followup.continue.ts`, `rules.followup.stepup_bronch.ts`, `rules.escalation.biologics.ts` | `tests/modules/copd/round4.major.test.ts` |
| `COPD-R4-R3-11` | `major` | ✅ FIXED | `src/modules/copd/helpers.clinical.ts` (+ Engine `derive.ts`) | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R3-12` | `major` | ✅ FIXED | `rules.escalation.biologics.ts`, `helpers.aco.ts`, `rules.followup.aco.ts` (+ Engine `evaluate.ts`) | `round4.major.test.ts`, `invariants.random.test.ts` |
| `COPD-R4-R3-13` | `minor` | ✅ FIXED | `src/modules/copd/rules.nonpharm.prevention.ts` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R3-14` | `minor` | ✅ FIXED | `helpers.inhalers.ts`, `rules.safety.inhalers_device.ts` | `tests/modules/copd/round4.minor.test.ts` |
| `COPD-R4-R3-15` | `suggestion` | ✅ FIXED | `inputs.stable.ts`, `helpers.clinical.ts` | `tests/modules/copd/round4.minor.test.ts` |
