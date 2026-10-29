# Báo cáo Kiểm thử Đối kháng An toàn Lâm sàng Độc lập — Vòng 2 (Reviewer R3)
## Phân hệ: Tăng huyết áp (`htn` — Hypertension)

- **Người đánh giá**: Reviewer R3 — Kiểm thử Đối kháng An toàn Lâm sàng Độc lập (*Independent Adversarial Clinical Safety Tester*, Vòng 2)
- **Phạm vi kiểm định**: Toàn bộ 13 tệp mã nguồn `src/modules/htn/*` (`index.ts`, `inputs.ts`, `helpers.ts`, `rules.outpatient.safety.ts`, `rules.outpatient.steps.ts`, `rules.outpatient.special.ts`, `rules.inpatient.emergency.ts`, `rules.inpatient.neuro_preg.ts`, `matrix.ts`, `pathway.ts`, `presets.ts`), cơ sở tri thức `kb/citations/htn.json`, `kb/thresholds/htn.json`, 18 hồ sơ thuốc sở hữu trong `kb/drugs/*.json`, giao diện nạp mẫu `src/ui/AppShell.tsx`, cùng toàn bộ tầng an toàn & hợp nhất dùng chung (`src/engine/{evaluate,units,derive,merge,mergeConflictGroups,types}.ts`, `src/engine/safety/*`).
- **Phương pháp thực nghiệm**: Thực thi trực tiếp **100 kịch bản lâm sàng đối kháng sống (`S01`–`S100`)** đi xuyên qua hàm `evaluate(patient, settings)` thật (kiểm tra toàn bộ 5 `htnPresets` × 3 hồ sơ `INTL` / `VN` / `US`, chuyển đổi hai chiều hệ đơn vị SI ↔ US, đối chiếu ngoại trú `outpatient` vs nội viện `inpatient`, viên phối hợp cố định SPC, cấp cứu THA có/không HMOD, rối loạn điện giải – AKI, thai kỳ – hậu sản – cho con bú, va chạm đa chuyên khoa `htn + ckd / hf / af / dm2 / gout / asthma / copd / lipid`, và kiểm định bất biến Fail-Closed).
- **Tính độc lập**: Tuân thủ tuyệt đối quy chế mù đôi Vòng 2 — không đọc bất kỳ tệp đánh giá `round2_R1*` hay `round2_R2*` nào; không chỉnh sửa bất kỳ tệp nào trong `src/**`, `kb/**`, `tests/**`, `tools/**`; đã dọn sạch 100% tệp kiểm thử tạm thời trong thư mục scratch sau khi thu thập bằng chứng.

---

## 1. Tổng quan Kết quả Kiểm định & Thống kê Phát hiện

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã định danh | Tóm tắt rủi ro lâm sàng cốt lõi |
| :--- | :---: | :--- | :--- |
| **Critical** | **5** | `HTN-R2-R3-01` → `HTN-R2-R3-05` | **(1)** Mù hoàn toàn với viên phối hợp cố định hạ áp SPC (`Coveram`, `Exforge`, `Twynsta`, `Hyzaar`, `Preterax`, `Triplixam`) — bỏ lọt `STOP`/`HOLD` khi mang thai, tiền sản giật, phù mạch, `K+ = 6.2`, hẹp ĐM thận 2 bên, sốc `SBP = 82`, AKI, đồng thời kê chồng `Perindopril + Amlodipine` lên `Telmisartan/Amlodipine` (Dual RASi Class III + Double CCB, `alerts = []`); **(2)** `preeclampsia_mgso4` fail-open khi thiếu `sbp`, thiếu `drugId` gây nạp chồng bolus `4 g IV` lần 2, và truyền `MgSO4 4 g + 1 g/h` bất chấp Nhược cơ, Block AV độ 2–3, suy thận lọc máu `eGFR = 11.8`; **(3)** Điểm mù AKI giai đoạn 2–3 (`SCr` tăng gấp `2.1×`) không `HOLD`/`STOP` `Perindopril` và `Indapamide` đang uống; **(4)** Cờ đỏ toàn cục `emergency_hypertensive_crisis` (`priority: 100`) ra lệnh truyền thuốc hạ áp tĩnh mạch ngay trong THA nặng không HMOD và Đột quỵ nhồi máu não không tiêu sợi huyết `198/108 mmHg` (mâu thuẫn Class III: Harm); **(5)** Mù hoàn toàn với Hạ natri máu nguy kịch (`Na+ = 116–118 mmol/L`): vừa không ngừng `Indapamide`, vừa chủ động `[START] Indapamide SR 1.5 mg` ở Bước 2 ngay khi `Na+ = 118 mmol/L`. |
| **Major** | **6** | `HTN-R2-R3-06` → `HTN-R2-R3-11` | **(6)** Tiền sản giật nặng (`preeclampsia_emergency`) truyền `Nicardipine IV` vào Hẹp khít van ĐMC; **(7)** Đột quỵ sau lấy huyết khối cơ học (`postReperfusionEvt`) bị gắn nhầm nhãn *"trước bolus rtPA"*; **(8)** Lỗi cắt cụt `.find()` / phần tử cuối bỏ lọt `Indapamide` ở hạ K+ nặng `K+ = 2.8` (nguy cơ xoắn đỉnh), bỏ lọt 2/3 thuốc CCB trùng lặp (`alerts = []`), bỏ lọt `Clonidine + HCTZ` khi hạ HA tư thế; **(9)** Bỏ qua HBPM/ABPM trong nâng bậc thuốc (tăng bậc sai ở hiệu ứng áo choàng trắng & bỏ sót THA ẩn giấu); **(10)** Bỏ không nối cờ chuẩn `allergyAceiArb`, `renalBruit` và bỏ lọt `Aliskiren` trong thai kỳ & Dual RASi; **(11)** Lỗ hổng hậu sản & cho con bú (`breastfeeding`): kê mới `Perindopril` (`lactation: avoid`) và không ngừng `Losartan + Indapamide` khi đang cho con bú. |
| **Minor** | **2** | `HTN-R2-R3-12` → `HTN-R2-R3-13` | **(12)** `parseMedDoseMg` bỏ qua đơn vị `'viên'` và tần suất `freq` (biến đơn 3 thuốc nền `1 viên` thành liều thấp `1 mg <= 2.5 mg` làm chặn mất `Spironolactone` Bước 4) + tiêu đề tầm soát ARR gộp nhầm OSA/tiếng thổi ĐM thận; **(13)** Mâu thuẫn đích HA liên module `htn` (`< 140/90`) vs `ckd` (`UPTITRATE SBP < 120`) ở cụ già 88 tuổi suy yếu hạ HA tư thế + thiếu cảnh báo J-curve khi `DBP = 56 < 60 mmHg` ở bệnh mạch vành. |
| **Suggestion** | **1** | `HTN-R2-R3-14` | Bổ sung 1–2 ca mẫu nội viện (`inpatient`) vào `htnPresets` để kiểm thử & trình diễn trực quan luồng Cấp cứu THA trên UI. |
| **Tổng cộng** | **14** | `14 findings` / `100 live scenarios` | **Phán quyết bắt buộc: `FAIL`** (`5 critical > 0`, `6 major > 0`) |

---

## 2. Đối chiếu Khắc phục sau Vòng 1 & Các Phân hệ Vận hành Tốt (Verified Safe Areas)

Qua 100 kịch bản thực nghiệm trực tiếp, nhiều điểm yếu cốt lõi của Vòng 1 đã được đội phát triển cấu trúc lại rất bài bản và vượt qua kiểm thử khắc nghiệt:

1. **Bóc tách động mạch chủ cấp (`aorticDissection`) — Kiểm soát tần số trước giãn mạch (`S45`, `S46`, `S47`, `S48`)**:
   - Đã tách thành bộ đôi quy tắc chặt chẽ: khi thiếu nhịp tim (`hr: undefined` ở `S45`), hệ thống **fail-closed hoàn toàn** (chỉ phát `missing_input_hr`, tuyệt đối không truyền mù `Nicardipine` đơn độc gây dội tăng lực xé thành mạch $dP/dt$).
   - Khi chống chỉ định chẹn beta do Block AV độ 2–3 chưa tạo nhịp (`S47`) hoặc Hen + HFrEF (`S46`), hệ thống khóa `Nicardipine` sang `[AVOID]` để ngăn nhịp nhanh phản xạ; khi có Hẹp khít van ĐMC (`S48`), tự động chuyển thuốc giãn mạch sang `Urapidil` thay cho `Nicardipine`.
2. **Phù phổi cấp huyết động do tim (`acutePulmonaryEdema` — `S56`, `S57`, `S58`)**:
   - Phối hợp chuẩn xác `Nitroglycerin IV` + `Furosemide IV`, tự động phát `[HOLD]` chẹn beta đường uống đang dùng tại nhà (`bisoprolol` ở `S57`) hoặc `[AVOID]` chẹn beta tĩnh mạch, đồng thời phát `[AVOID] Nitroglycerin` và chuyển sang `Urapidil` / `Nicardipine` khi bệnh nhân đã dùng chất ức chế PDE-5 (`sildenafil` ở `S58`).
3. **THA kháng trị Bước 4 (`spironolactone`) & Phân kỳ Hồ sơ `INTL`/`VN` vs `US` (`S07`–`S09`, `S62`, `S88`, `S89`, `S93`)**:
   - Đã fail-closed chuẩn xác khi thiếu `scr` (`S88`) hoặc thiếu `k` (`S89`).
   - Đã phân biệt chính xác ngưỡng lọc cầu thận giữa `INTL`/`VN` (`eGFR >= 30`, ESC 2024) và `US` (`eGFR >= 45`, AHA/ACC 2025): tại `eGFR = 39.8 mL/phút` (`S93`, Profile `US`) và `eGFR = 24.3 mL/phút` (`S62`, Profile `INTL`), hệ thống chặn `[AVOID] Spironolactone` và chuyển sang phương án thay thế (`Bisoprolol` / `Doxazosin` / lợi tiểu quai).
4. **Chuyển đổi Hệ đơn vị SI ↔ US & Các Quy tắc Đơn chất Ngoại trú (`S19`–`S25`, `S59`–`S61`, `S71`, `S74`, `S75`, `S90`)**:
   - Khử lệch đơn vị Creatinin (`mg/dL` ↔ `µmol/L`) và Acid uric (`mg/dL` ↔ `µmol/L`) nhất quán tuyệt đối trong `S19`–`S22`.
   - Khởi trị đơn trị liệu / thay đổi lối sống đúng cho THA Giai đoạn 1 nguy cơ thấp trên Profile `US` (`S25`); tránh `Methyldopa` trên thai phụ có tiền sử trầm cảm (`S71` chuyển sang `Labetalol`); chặn `Lercanidipine` khi dùng chất ức chế mạnh CYP3A4 hoặc `eGFR < 30` (`S75`); ngừng `Moxonidine` trên HFrEF (`S74`, thử nghiệm MOXCON); fail-closed khi thiếu tuổi làm `eGFR = undefined` dù `SCr = 280 µmol/L` (`S90`).

---

## 3. Ma trận Bao phủ 100 Kịch bản Kiểm thử Đối kháng (`S01`–`S100`)

| Nhóm kiểm thử | Kịch bản | Trọng tâm lâm sàng & Kỹ thuật | Kết quả thực nghiệm |
| :--- | :---: | :--- | :--- |
| **A. Presets & Hồ sơ đa hướng dẫn (`INTL`/`VN`/`US`) + Governance** | `S01`–`S18` | 5 `htnPresets` × 3 Profile (`S01`–`S15`); luồng giữ `setting: 'inpatient'` khi nạp preset trên `AppShell.tsx` (`S16`–`S17`); chế độ `onlyReviewed: true` (`S18`). | 5 preset ngoại trú đúng phác đồ; ghi nhận thiếu preset nội viện (`HTN-R2-R3-14`). |
| **B. Chuyển đổi đơn vị SI ↔ US, Biến thiên Profile & HBPM/ABPM** | `S19`–`S26` | Khớp SI ↔ US cho `scr` (`0.9` / `1.45` / `2.1` / `3.2 mg/dL`) & `sua` (`8.8 mg/dL`); AKI `2.1× baselineScr` (`S23`); Giai đoạn 1 US (`S24`–`S25`); White-Coat vs Masked HTN (`S26`). | **FAIL ở `S23`** (AKI không `HOLD` `perindopril`/`indapamide` — `HTN-R2-R3-03`) & **`S26`** (tăng bậc sai ở áo choàng trắng — `HTN-R2-R3-09`). |
| **C. Viên phối hợp cố định SPC & Trùng lặp đa thuốc** | `S27`–`S38`, `S99`–`S100` | `amlodipine_perindopril` (`Coveram`), `valsartan_amlodipine` (`Exforge`), `telmisartan_amlodipine` (`Twynsta`), `losartan_hctz` (`Hyzaar`), `perindopril_indapamide` (`Preterax`), `triplixam` trong thai kỳ, tiền sản giật, phù mạch, `K+ = 6.2`, hẹp ĐM thận 2 bên, sốc, AKI, hạ Na+, Gút; trùng 3 CCB (`S38`). | **FAIL nghiêm trọng toàn bộ `S27`–`S38`, `S99`, `S100`** (`HTN-R2-R3-01` & `HTN-R2-R3-08`). |
| **D. Cấp cứu THA nội viện vs Khẩn cấp / Không HMOD** | `S39`–`S58`, `S95` | THA rất cao không HMOD (`S39`–`S40`); Nhồi máu não không rtPA (`S41`), có rtPA (`S42`), sau EVT (`S43`); Xuất huyết não (`S44`); Bóc tách ĐMC (`S45`–`S48`); Tiền sản giật + Nhược cơ / Block AV / Lọc máu / Đang truyền MgSO4 / Hẹp van ĐMC (`S49`–`S55`, `S95`); Phù phổi cấp (`S56`–`S58`). | **FAIL ở `S39`, `S41`** (`HTN-R2-R3-04`), **`S43`** (`HTN-R2-R3-07`), **`S49`–`S51`, `S95`** (`HTN-R2-R3-02`), **`S55`** (`HTN-R2-R3-06`). |
| **E. Huyết động thấp, Rối loạn điện giải & Thận** | `S59`–`S66`, `S93`–`S94`, `S97` | Sốc nội viện/ngoại trú `SBP = 82–84` (`S59`–`S60`); Block AV (`S61`); Kháng trị `eGFR = 24.3` & `39.8` (`S62`, `S93`); Hạ Na+ nặng `116–118 mmol/L` (`S63`–`S64`, `S94`); Hạ K+ nặng `2.8 mmol/L` (`S65`–`S66`); Hạ HA tư thế đa thuốc (`S97`). | **FAIL ở `S63`–`S64`, `S94`** (`HTN-R2-R3-05`) & **`S65`–`S66`, `S97`** (`HTN-R2-R3-08`). |
| **F. Quần thể đặc biệt & Phối hợp đa module** | `S67`–`S83`, `S98` | Hẹp ĐM thận 2 bên (`S67`); `renalBruit` (`S68`); `allergyAceiArb` (`S69`); `aliskiren` (`S70`); Thai kỳ + Trầm cảm (`S71`); Hậu sản & Cho con bú (`S72`, `S98`); Phù mạch (`S73`); `moxonidine` (`S74`); `lercanidipine` (`S75`); Cụ già 88t suy yếu CKD (`S76`); Va chạm `hf`/`af`/`dm2`/`gout`/`asthma`/`copd`/`lipid` (`S77`–`S83`). | **FAIL ở `S68`–`S70`** (`HTN-R2-R3-10`), **`S72`, `S98`** (`HTN-R2-R3-11`), **`S76`** (`HTN-R2-R3-13`). |
| **G. Kiểm định Fail-Closed, Parse liều `'viên'` & Biên huyết áp** | `S84`–`S92`, `S96` | Thiếu `sbp`/`dbp`/`scr`/`k`/`age` (`S84`–`S90`); THA tâm thu/tâm trương đơn độc & CAD `DBP = 56` (`S91`); Tầm soát thứ phát (`S92`); Nhập liều `1 viên` ở THA kháng trị (`S96`). | **FAIL ở `S87`** (`HTN-R2-R3-02`) & **`S91`, `S92`, `S96`** (`HTN-R2-R3-12`, `HTN-R2-R3-13`). |

---

## 4. Phân tích Chi tiết Các Phát hiện An toàn Lâm sàng

### 4.1. Nhóm Lỗi Mức độ Nghiêm trọng Tối đa (`CRITICAL` — 5 phát hiện)

#### `[HTN-R2-R3-01]` (CRITICAL) — Mù hoàn toàn với Viên phối hợp cố định hạ áp (SPC) trên toàn bộ KB, Cổng an toàn, Rà soát thuốc đang dùng & Thang nâng bậc điều trị
- **Vị trí lỗi**: `kb/drugs/*`, `src/modules/htn/helpers.ts:15-46`, `src/engine/safety/drugClassify.ts`, `src/engine/safety/vitalAndRenalGates.ts`, `src/engine/safety/duplicateRules.ts`.
- **Cơ chế gây hại lâm sàng**:
  - ESC 2024 (Class I), AHA/ACC 2025 (COR 1) và VSH/VNHA 2022 đều đặt **viên phối hợp cố định (SPC)** làm nền tảng điều trị Bước 1 và Bước 2; chính văn bản khuyến cáo của module `htn` khuyên bác sĩ kê đơn **Coveram (`amlodipine_perindopril`), Exforge (`valsartan_amlodipine`), Twynsta (`telmisartan_amlodipine`), Preterax (`perindopril_indapamide`), Hyzaar (`losartan_hctz`) và Triplixam (`perindopril_indapamide_amlodipine`)**.
  - Tuy nhiên, không một mã thuốc SPC hạ áp nào có mặt trong `kb/drugs/` hay các hằng số phân lớp `ACEI_IDS`, `ARB_IDS`, `CCB_IDS`, `THIAZIDE_IDS`. Khi người bệnh đang uống bất kỳ viên SPC nào:
    1. **Không bao giờ được `[STOP]` / `[HOLD]` khi xảy ra chống chỉ định tuyệt đối**: Thai phụ uống tiếp ACEi/ARB gây suy thận thai nhi, thiểu ối, biến dạng hộp sọ và thai lưu; bệnh nhân phù mạch do ACEi uống tiếp Perindopril gây phù thanh quản ngạt thở; bệnh nhân `K+ = 6.2 mmol/L` uống tiếp ARB gây rung thất/vô tâm thu; bệnh nhân sốc `SBP = 82 mmHg` uống tiếp 2 viên SPC gây trụy mạch không hồi phục.
    2. **Kê chồng phác đồ cấm Class III (Dual RASi ACEi + ARB) và quá liều gấp đôi CCB mà `alerts = []`**: Vì `countCoreClasses(ctx)` đếm viên SPC bằng `0`, hệ thống coi bệnh nhân như chưa điều trị và kê mới `Perindopril 5 mg + Amlodipine 5 mg` chồng trực tiếp lên `Telmisartan/Amlodipine` hoặc `Losartan/HCTZ`!
- **Bằng chứng thực nghiệm (`evaluate()`)**:
  - **`S27`, `S28`, `S37` (Thai kỳ ngoại trú HA `152–154/96`) & `S99` (Tiền sản giật nặng nội viện HA `176/114`)**: Đang dùng `amlodipine_perindopril` (`Coveram 5/5`), `valsartan_amlodipine` (`Exforge 80/5`), `losartan_hctz` (`Hyzaar 50/12.5`), `twynsta`, `triplixam` → **`0` lệnh `STOP`, `alerts = []`**, kê chồng `methyldopa` / `labetalol`.
  - **`S29` (Tiền sử phù mạch `priorAngioedema: true`)**: Đang dùng `amlodipine_perindopril` + `perindopril_indapamide` → **`0` lệnh `STOP`**, kê thêm `[START] amlodipine 5 mg` + `[START] losartan 50 mg` trên nền 2 viên chứa Perindopril!
  - **`S30` (`K+ = 6.2 mmol/L` trên `telmisartan_amlodipine 80/5`) & `S31` (Hẹp ĐM thận hai bên trên `perindopril_indapamide_amlodipine`)**: **`0` lệnh `STOP`/`HOLD`** viên SPC.
  - **`S32` (HA `158/98` trên `telmisartan_amlodipine 40/5`) & `S33` (HA `152/94` trên `losartan_hctz 50/12.5`)**: Xuất **`[START] perindopril 5 mg` + `[START] amlodipine 5 mg`** chồng lên ARB + CCB đang uống → **Phối hợp kép ACEi + ARB (COR 3: Harm) + 2 DHP-CCB với `alerts = []`**!
  - **`S34` (Sốc nội viện `SBP = 82/50 mmHg` trên `amlodipine_perindopril` + `losartan_hctz`)**: `recs = []` (**`0` lệnh `HOLD`**).
  - **`S35` (`Na+ = 118` + Gút trên `perindopril_indapamide`), `S36` (AKI `SCr = 260` vs nền `110`, `eGFR = 16.6` trên `perindopril_indapamide`), `S100` (`htn + gout`, `SUA = 540 µmol/L` trên `losartan_hctz`)**: **`0` lệnh `STOP`/`SWITCH`** viên SPC; ở `S100` còn kê chồng thêm `losartan 50 mg + amlodipine 5 mg` (tổng `100 mg` Losartan + giữ nguyên HCTZ).
- **Hướng khắc phục**: Bổ sung hồ sơ KB cho các viên SPC hạ áp chủ lực tại Việt Nam và cài đặt bảng phân rã thành phần hoạt chất (`SPC_COMPONENT_MAP`) dùng chung giữa `drugClassify.ts`, `duplicateRules.ts`, `vitalAndRenalGates.ts`, `reviewMeds*.ts` và `src/modules/htn/helpers.ts`.

---

#### `[HTN-R2-R3-02]` (CRITICAL) — Quy tắc `htn.inpatient.preeclampsia_mgso4` phát lệnh `[START] Magnesium sulfate` (`4 g IV + 1 g/giờ`) vô điều kiện: Fail-open khi thiếu HA, nạp chồng liều bolus thứ 2, và bỏ qua Nhược cơ, Block AV độ II–III, Suy thận lọc máu
- **Vị trí lỗi**: `src/modules/htn/rules.inpatient.neuro_preg.ts` (dòng `562–590`).
- **Cơ chế gây hại lâm sàng**:
  1. **Vi phạm Fail-Closed (dòng 571)**: `return sbp === undefined || sbp >= sbpHypo;` trả về `true` ngay cả khi chưa nhập huyết áp (`sbp === undefined`). Nếu sản phụ đang choáng mất máu sản khoa / vỡ gan HELLP chưa kịp nhập HA, truyền nhanh `MgSO4 4 g IV` gây giãn mạch tụt áp sụp đổ tuần hoàn.
  2. **Bỏ trống `drugId` (dòng 577–587)**: Không gắn `drugId: 'magnesium_sulfate'`, làm vô hiệu hóa hoàn toàn `kb/drugs/magnesium_sulfate.json`, cổng an toàn `gates.ts` và cơ chế khử trùng `START -> CONTINUE` của `merge.ts`. Nếu sản phụ chuyển tuyến lên **đang truyền sẵn `magnesium_sulfate 1 g/giờ`**, hệ thống ra y lệnh **tiêm nạp thêm 1 liều bolus `4 g IV` lần thứ hai**!
  3. **Bỏ qua chống chỉ định tử vong & tích lũy thận**: Truyền `MgSO4` trên bệnh nhân **Nhược cơ (`myasthenia_gravis`)** phong bế giải phóng acetylcholine tiền synap gây liệt cơ hoành ngừng thở tức thì; trên **Block nhĩ thất độ 2–3 chưa tạo nhịp** gây vô tâm thu; truyền duy trì chuẩn **`1 g/giờ` trên suy thận nặng / vô niệu / lọc máu (`eGFR = 11.8 mL/phút`)** gây ngộ độc magie huyết thanh cấp (> 4–5 mmol/L: mất phản xạ gân xương → liệt hô hấp → ngừng tim).
- **Bằng chứng thực nghiệm (`evaluate()`)**:
  - **`S87`** (`sbp: undefined`, `severePreeclampsiaEclampsia: true`): Phát song song `missing_input_sbp` VÀ `[START] rec_htn_preeclampsia_mgso4` (`liều nạp 4 g IV, duy trì 1 g/giờ`).
  - **`S95`** (HA `178/114`, đang truyền `magnesium_sulfate 1 g/giờ` + `labetalol 20 mg`): `labetalol` chuyển sang `[CONTINUE]`, còn `rec_htn_preeclampsia_mgso4` phát **`[START] liều nạp 4 g IV, duy trì 1 g/giờ` lần 2**!
  - **`S49`** (Nhược cơ `myastheniaGravis: true`), **`S50`** (`avBlock2or3: true`), **`S51`** (`scr = 380 µmol/L`, `eGFR = 11.8`, `onDialysis: true`): Cả 3 ca đều xuất nguyên vẹn **`[START] liều nạp 4 g IV, duy trì 1 g/giờ`** với `gatesFailed = []`, `alerts = []`.
- **Hướng khắc phục**: Sửa dòng 571 thành `sbp !== undefined && sbp >= sbpHypo`; gắn `drugId: 'magnesium_sulfate'`; kiểm tra `myastheniaGravis` và `hasAvBlockOrSssWithoutPacer(ctx)` để phát `[AVOID]` (chuyển thuốc chống co giật thay thế); khi `egfr < 30` hoặc `onDialysis` hoặc thiểu niệu, chặn y lệnh truyền duy trì mù `1 g/giờ`, hướng dẫn theo dõi phản xạ gân xương, nhịp thở, nước tiểu mỗi giờ, định lượng $Mg^{2+}$ máu và chuẩn bị Calcium gluconate 10% giải độc.

---

#### `[HTN-R2-R3-03]` (CRITICAL) — Điểm mù Tổn thương thận cấp (AKI): Không phát lệnh `[HOLD]` / `[STOP]` cho RASi (`Perindopril`) và Lợi tiểu (`Indapamide`) đang dùng khi Creatinin tăng vọt gấp > 2 lần nền
- **Vị trí lỗi**: `src/engine/safety/reviewMedsVitalsAndRenal.ts` và `src/modules/htn/rules.outpatient.safety.ts`.
- **Cơ chế gây hại lâm sàng**: Trong đợt AKI giai đoạn 2–3 (hoặc khi Creatinin huyết thanh tăng > 30% sau dùng RASi), tiếp tục duy trì ACEi/ARB làm giãn tiểu động mạch đi cầu thận cộng hưởng với giảm thể tích nội mạch do lợi tiểu Thiazide/Indapamide, làm mất hoàn toàn áp lực siêu lọc cầu thận, biến suy thận cấp chức năng thành hoại tử ống thận cấp và tăng kali máu ác tính (`kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop`, `kdigo.ckd.2024.pp_3_7_2_sick_day_hold`, `aha.acc.2025.egfr_dip_30pct`).
- **Bằng chứng thực nghiệm (`evaluate()`)**:
  - **`S23`** (Đơn vị US, HA `154/92`, `scr = 2.1 mg/dL` so với `baselineScr = 1.0 mg/dL` → **tăng gấp `2.1×` [+110%, KDIGO AKI Stage 2]**, `eGFR = 34.5`, `K+ = 5.1`, đang uống `perindopril 10 mg + indapamide 1.5 mg`): `gates.ts` hoãn đúng thuốc mới (`[DEFER] amlodipine` với `AKI:defer`), **NHƯNG xuất `0` lệnh `HOLD` hay `STOP` cho `perindopril 10 mg` và `indapamide 1.5 mg` đang uống**! Nghịch lý hơn, ngay bên dưới thẻ `rec_htn_monitor_cr_k` lại viết lý thuyết *"ngừng ACEi/ARB khi Creatinin tăng > 30%"* trong khi thực tế Creatinin của bệnh nhân đã tăng **+110%**!
- **Hướng khắc phục**: Bổ sung quy tắc kiểm tra AKI (`hasCondition(ctx, 'aki') || scr - baselineScr >= 26.5 || scr / baselineScr >= 1.5`) và tăng SCr > 30% (`scr / baselineScr > 1.3`) để phát lệnh `[HOLD]` cho **toàn bộ** hoạt chất RASi, ARNI, MRA và lợi tiểu Thiazide đang dùng; đồng thời ẩn gợi ý `rec_htn_ckd_sglt2i_consider` trong giai đoạn AKI cấp.

---

#### `[HTN-R2-R3-04]` (CRITICAL) — Cờ đỏ toàn cục `emergency_hypertensive_crisis` (`reviewMedsSpecialized.ts:109–125`) ra lệnh hạ áp tĩnh mạch mù quáng, đối nghịch trực diện với chống chỉ định Class III: Harm trong THA nặng không HMOD và Đột quỵ nhồi máu não cấp
- **Vị trí lỗi**: `src/engine/safety/reviewMedsSpecialized.ts` (dòng `109–125`).
- **Cơ chế gây hại lâm sàng**: Hàm `checkEmergencyRedFlags` phát thẻ `[REFER] emergency_hypertensive_crisis` ở độ ưu tiên tuyệt đối `priority: 100` cho bất kỳ bệnh nhân nội viện nào có `sbp >= 180 || dbp >= 120` với chỉ thị *"xử trí hạ áp đường tĩnh mạch có kiểm soát và hội chẩn hồi sức"*. Trên bệnh nhân **đột quỵ nhồi máu não cấp không tái thông mạch (`HA < 220/120 mmHg`)**, truyền thuốc hạ áp tĩnh mạch làm sụp đổ cơ chế tự điều hòa lưu lượng máu não, giết chết vùng tranh tối tranh sáng (*ischemic penumbra*) và gây liệt vĩnh viễn (`COR 3: Harm`). Trên bệnh nhân **nội viện tăng HA không triệu chứng không HMOD**, truyền thuốc tĩnh mạch gây AKI, thiếu máu cơ tim và nhồi máu não vùng giáp ranh (`aha.acc.2025.severe_inpatient_harm`, `COR 3: Harm`).
- **Bằng chứng thực nghiệm (`evaluate()`)**:
  - **`S39`** (Nội viện, HA `192/112 mmHg`, không HMOD, Profile `US`): Thẻ đầu tiên (`priority: 100`) ra lệnh *"xử trí hạ áp đường tĩnh mạch có kiểm soát"*, ngay trên thẻ thứ hai (`priority: 95`) ra lệnh *"KHÔNG hạ áp cấp đường tĩnh mạch (COR 3: Harm)"*!
  - **`S41`** (Nội viện, Đột quỵ nhồi máu não cấp không tiêu sợi huyết `HA 198/108 mmHg`): Thẻ đầu tiên (`priority: 100`) ra lệnh *"xử trí hạ áp đường tĩnh mạch có kiểm soát"*, đối đầu trực tiếp với thẻ thứ hai `rec_htn_stroke_no_thrombolysis_hold` (`priority: 98`: *"TRÌ HOÃN hạ áp tích cực trong Nhồi máu não không tiêu sợi huyết"*).
- **Hướng khắc phục**: Khi `selectedModules.includes('htn')`, tắt thẻ chung `emergency_hypertensive_crisis` ở nội viện để nhường cho bộ phân tầng chính xác của module `htn`; khi chạy từ module khác không bật `htn`, sửa văn bản thành yêu cầu tầm soát HMOD cấp trước khi quyết định đường dùng thuốc (tuyệt đối không chỉ định truyền tĩnh mạch mù cho mọi ca $\ge 180/120\text{ mmHg}$).

---

#### `[HTN-R2-R3-05]` (CRITICAL) — Mù hoàn toàn với Hạ natri máu nguy kịch (`patient.na`): Không ngừng Thiazide/Indapamide ở `Na+ = 116 mmol/L` và còn chủ động `[START] Indapamide SR 1.5 mg` ở `Na+ = 118 mmol/L`
- **Vị trí lỗi**: `src/modules/htn/rules.outpatient.safety.ts`, `src/modules/htn/rules.outpatient.steps.ts`, `src/engine/safety/vitalAndRenalGates.ts`, `src/engine/safety/reviewMedsVitalsAndRenal.ts`.
- **Cơ chế gây hại lâm sàng**: Lợi tiểu Thiazide và Thiazide-like (`Indapamide`, `Chlorthalidone`, `HCTZ`) ức chế tái hấp thu $Na^+$-$Cl^-$ tại ống lượn xa mà không ảnh hưởng cơ chế cô đặc tủy thận, là thủ phạm hàng đầu gây hạ natri máu nặng do thuốc. Khởi trị mới hoặc tiếp tục duy trì `Indapamide` khi $Na^+ = 116–118\text{ mmol/L}$ đẩy áp lực thẩm thấu máu giảm sâu cấp tính, gây phù não lan tỏa, trạng thái động kinh và tụt kẹt hạnh nhân tiểu não tử vong.
- **Bằng chứng thực nghiệm (`evaluate()`)**:
  - **`S94`** (Nữ 72 tuổi ngoại trú, HA `156/96`, **`na = 118 mmol/L`**, đang uống `perindopril 5 mg + amlodipine 5 mg`): Hệ thống phát lệnh **`[START] indapamide`** (*"Nâng bậc Bước 2 (Phối hợp ba): Bổ sung Indapamide SR 1.5 mg/ngày"*, `gatesFailed = []`, `alerts = []`)!
  - **`S63` (Nội viện) & `S64` (Ngoại trú)** (**`na = 116 mmol/L`** trên `indapamide 1.5 mg + hydrochlorothiazide 25 mg`): Chỉ ngừng `hydrochlorothiazide` vì trùng nhóm lợi tiểu, giữ nguyên **`indapamide 1.5 mg`** tiếp tục dùng với `0` cảnh báo hạ natri máu!
- **Hướng khắc phục**: Thêm ngưỡng `na` vào `kb/thresholds/htn.json`; phát lệnh `[STOP]`/`[HOLD]` toàn bộ `THIAZIDE_IDS` (kèm `[REFER]` cấp cứu khi `na < 125 mmol/L`) và khóa cứng `canUseThiazide()` / `vitalAndRenalGates.ts` khi `na < 130 mmol/L`.

---

### 4.2. Nhóm Lỗi Nghiêm trọng (`MAJOR` — 6 phát hiện)

#### `[HTN-R2-R3-06]` (MAJOR) — Tiền sản giật nặng (`htn.inpatient.preeclampsia_emergency`) truyền tĩnh mạch `Nicardipine` trực tiếp vào Hẹp khít van động mạch chủ
- **Vị trí lỗi**: `src/modules/htn/rules.inpatient.neuro_preg.ts` (dòng `503–525`).
- **Bằng chứng thực nghiệm**: Tại **`S55`** (Thai phụ 33 tuổi nội viện, `severePreeclampsiaEclampsia: true`, `asthma: true`, `customInputs.severeAorticStenosis: true`, HA `175/112 mmHg`), hệ thống phát **`[START] nicardipine 5 mg/giờ`** với `0` cảnh báo — bất chấp `inputs.ts:120` và `aha.acc.2025.iv_nicardipine` quy định Hẹp khít van ĐMC là chống chỉ định của Nicardipine tĩnh mạch (khác với các luật đột quỵ ở dòng 22–47 cùng tệp vốn đã gọi `selectIvAgentAvoidingSevereAs(ctx)`).
- **Hướng khắc phục**: Kiểm tra `isSevereAorticStenosis(ctx)` trước khi kê `nicardipine` trong `preeclampsia_emergency`; nếu đồng thời chống chỉ định cả `labetalol` lẫn `nicardipine`, phát `[AVOID]` Nicardipine và yêu cầu hội chẩn khẩn Tim mạch – Sản – Hồi sức tại ICU có theo dõi huyết áp động mạch xâm lấn.

#### `[HTN-R2-R3-07]` (MAJOR) — Đột quỵ nhồi máu não sau lấy huyết khối cơ học (`postReperfusionEvt`) bị gắn sai nhãn *"Trước bolus rtPA"* và thiếu cảnh báo tác hại hạ SBP `< 140 mmHg`
- **Vị trí lỗi**: `src/modules/htn/rules.inpatient.neuro_preg.ts` (dòng `68–175`).
- **Bằng chứng thực nghiệm**: Tại **`S43`** (`acuteIschemicStroke: true`, không dùng rtPA, `customInputs.postReperfusionEvt: true`, HA `186/100`), hệ thống xuất tiêu đề *"Hạ áp cấp cứu trước rtPA bằng Urapidil: Đạt < 185/110 mmHg..."* và giải thích *"trước khi bolus rtPA"*, đồng thời bỏ sót cảnh báo COR 3: Harm của AHA/ACC 2025 (`aha.acc.2025.stroke_evt_harm` — ENCHANTED-2/MT, OPTIMAL-BP) về việc tránh hạ tích cực SBP `< 140 mmHg` trong 24–72h sau tái thông EVT.
- **Hướng khắc phục**: Tách nhánh văn bản và hướng dẫn đích huyết áp riêng cho `postReperfusionEvt` (không có `thrombolysisEligible`), bổ sung trích dẫn `aha.acc.2025.stroke_evt_harm`.

#### `[HTN-R2-R3-08]` (MAJOR) — Lỗi cắt cụt phần tử đơn lẻ (`.find()` / phần tử cuối) làm bỏ lọt thuốc nguy hiểm thứ 2–3 trong Hạ kali máu nặng (`K+ = 2.8`), Trùng lặp 3 CCB và Hạ HA tư thế đứng
- **Vị trí lỗi**: `src/modules/htn/rules.outpatient.safety.ts` (dòng `404, 780, 813, 840, 868, 931, 961`) và `src/engine/safety/duplicateRules.ts`.
- **Bằng chứng thực nghiệm**:
  - **`S65` & `S66`** (`K+ = 2.8 mmol/L` trên `furosemide 40 mg + indapamide 1.5 mg`): Dòng `813` chỉ `[HOLD] furosemide`, bỏ mặc **`indapamide 1.5 mg`** tiếp tục uống dù `ema.indapamide.hypokalemia_qt` cảnh báo kéo dài QT gây xoắn đỉnh tử vong khi hạ kali máu!
  - **`S38`** (Đang uống 3 CCB: `amlodipine 10 mg + nifedipine 30 mg + lercanidipine 10 mg`): Dòng `404` chỉ `[STOP] lercanidipine`, để bệnh nhân uống tiếp **`amlodipine 10 mg + nifedipine 30 mg`** với **`alerts = []`** (do `duplicateRules.ts` thiếu quy tắc `dup.ccb` / `dup.dhp_ccb`)!
  - **`S97`** (`orthostaticHypotension: true` trên `doxazosin + clonidine + hydrochlorothiazide`): Dòng `961` chỉ `[SWITCH] doxazosin`, giữ nguyên `clonidine + HCTZ` và kê thêm `amlodipine`.
- **Hướng khắc phục**: Xử lý toàn bộ danh sách thuốc vi phạm (thay vì `.find()` đơn lẻ) và bổ sung `dup.ccb` / `dup.thiazide_diuretic` vào `duplicateRules.ts`.

#### `[HTN-R2-R3-09]` (MAJOR) — Bỏ qua hoàn toàn Huyết áp ngoài phòng khám (`homeSbp`/`homeDbp`, `abpm24hSbp`/`abpm24hDbp`) khi quyết định khởi trị & nâng bậc thuốc
- **Vị trí lỗi**: `src/modules/htn/rules.outpatient.steps.ts` (dòng `100–172, 459, 694, 968`).
- **Bằng chứng thực nghiệm (`S26`)**:
  - **Hiệu ứng áo choàng trắng** (HA phòng khám `152/94`, HBPM `124/76`, ABPM 24h `122/74` trên `perindopril 5 + amlodipine 5`): Hệ thống vẫn phát lệnh **`[START] indapamide SR 1.5 mg/ngày`**, gây nguy cơ tụt HA quá mức tại nhà.
  - **THA ẩn giấu chưa kiểm soát** (HA phòng khám `126/78`, HBPM tại nhà `144/90`): Hệ thống xuất **`0` lệnh nâng bậc/tối ưu thuốc**.
- **Hướng khắc phục**: Đưa kết quả HBPM/ABPM vào hàm đánh giá kiểm soát huyết áp hiệu dụng (`isUncontrolledEffectively`) cho Bước 1, Bước 2 và Bước 3 theo đúng ESC 2024 & AHA/ACC 2025 COR 1.

#### `[HTN-R2-R3-10]` (MAJOR) — Bỏ không nối cờ chuẩn `allergyAceiArb` và `renalBruit`, đồng thời mù hoạt chất ức chế trực tiếp Renin (`aliskiren`) trong thai kỳ & phong bế kép hệ RAS
- **Vị trí lỗi**: `src/engine/types.ts:86-87`, `src/modules/htn/inputs.ts:83`, `src/modules/htn/rules.outpatient.steps.ts`, `src/engine/safety/gates.ts`, `kb/interactions/`.
- **Bằng chứng thực nghiệm**:
  - **`S69`** (`conditions.allergyAceiArb: true`, HA `158/96`): Hệ thống vẫn kê thẳng **`[START] perindopril 5 mg`** với `gatesFailed = []`, `alerts = []`.
  - **`S68`** (`conditions.renalBruit: true`, `eGFR = 44.3`): Vừa phát `[REFER]` nghi ngờ hẹp ĐM thận vừa kê **`[START] perindopril 5 mg`** không chút dè dặt.
  - **`S70`** (`aliskiren 150 mg`): Thai phụ uống `aliskiren` nhận **`0` lệnh `STOP`**; bệnh nhân ĐTĐ2 + CKD uống `aliskiren + perindopril` nhận **`alerts = []`** dù chính tiêu đề `ix.dual_rasi` ghi *"hoặc RASi + Aliskiren"*.
- **Hướng khắc phục**: Kiểm tra `hasCondition(ctx, 'allergyAceiArb')` để chặn cả ACEi và ARB; thận trọng/trì hoãn khởi trị RASi khi `renalBruit === true` chờ Doppler ĐM thận; bổ sung `aliskiren` vào KB, luật thai kỳ và `ix.dual_rasi`.

#### `[HTN-R2-R3-11]` (MAJOR) — Lỗ hổng an toàn thuốc Hậu sản & Cho con bú (`postpartum` / `breastfeeding`): Kê mới `Perindopril` và bỏ lọt `Losartan + Indapamide` đều có `lactation.status: "avoid"`
- **Vị trí lỗi**: `src/modules/htn/rules.outpatient.special.ts:476-511, 785`, `rules.outpatient.steps.ts`, `src/engine/safety/gates.ts`, `src/engine/safety/reviewMeds*.ts`.
- **Bằng chứng thực nghiệm**:
  - **`S72`** (Sản phụ 29 tuổi hậu sản đang cho con bú: `postpartum: true`, `breastfeeding: true`, HA `156/96`, đang uống `methyldopa`): Hệ thống phát `[SWITCH]` ngừng `methyldopa` khuyên đổi sang Nifedipine LA / Amlodipine / Labetalol, **NHƯNG ngay bên dưới lại phát `[START] perindopril 5 mg`** dù `kb/drugs/perindopril.json` quy định `lactation.status: "avoid"`!
  - **`S98`** (Bà mẹ 31 tuổi đang cho con bú: `breastfeeding: true`, HA `158/98`, đang uống `losartan 50 mg + indapamide 1.5 mg`): Xuất **`0` lệnh `STOP`/`SWITCH`** dù cả hai thuốc đều có `lactation.status: "avoid"` trong KB; ngoài ra cả `S72` và `S98` đều kích hoạt nhầm thẻ xét nghiệm ARR do `< 40` tuổi.
- **Hướng khắc phục**: Thi hành cổng an toàn `lactation.status === 'avoid'` khi `hasCondition(ctx, 'breastfeeding') || isPostpartum(ctx)` trên cả engine lẫn module `htn` (ưu tiên Nifedipine LA, Amlodipine, Labetalol hoặc Enalapril hậu sản); không tự động bật tầm soát ARR chỉ vì `< 40` tuổi ở phụ nữ hậu sản.

---

### 4.3. Nhóm Lỗi Nhẹ (`MINOR` — 2 phát hiện) & Đề xuất Cải tiến (`SUGGESTION` — 1 phát hiện)

1. **`[HTN-R2-R3-12]` (MINOR) — `parseMedDoseMg` (`helpers.ts:113–121`) bỏ qua đơn vị `'viên'` / `'mcg'` và tần suất `freq`, kèm tiêu đề tầm soát ARR chưa tách biệt cho OSA / Tiếng thổi ĐM thận**:
   - Tại **`S96`**, khi bác sĩ nhập 3 thuốc nền theo đơn vị `'viên'` (`perindopril 1 viên`, `amlodipine 1 viên`, `indapamide 1 viên`), `parseMedDoseMg` trả về `1 <= 2.5 mg` làm hệ thống chẩn đoán nhầm là *"giả kháng trị do liều thấp"* và **chặn mất khuyến cáo khởi trị `Spironolactone` Bước 4**! Cần trả về `undefined` khi `unit === 'viên'` và nhân hệ số tần suất `BID`/`TID`.
   - Tại **`S68` & `S92`**, `rec_htn_screen_aldosteronism` luôn gắn tiêu đề *"Xét nghiệm tỷ số Aldosterone/Renin (ARR)"* ngay cả khi chỉ có `renalBruit` hoặc `snoringOsa`.
2. **`[HTN-R2-R3-13]` (MINOR) — Xung đột đích huyết áp liên module `htn` vs `ckd` trên người rất cao tuổi suy yếu (`S76`) & thiếu lưu ý J-curve khi `DBP < 60 mmHg` ở bệnh mạch vành (`S91`)**:
   - Tại **`S76`** (Nữ 88 tuổi, suy yếu, hạ HA tư thế, CKD A3, HA `136/76 mmHg`), `htn` đặt đúng đích nới lỏng `< 140/90 mmHg` (đã đạt đích), trong khi `ckd` phát song song `[UPTITRATE] Đích huyết áp tâm thu < 120 mmHg` (`priority: 82`).
   - Tại **`S91`** (Nam 74 tuổi bệnh mạch vành, HA `158/56 mmHg`, `DBP = 56 < 60 mmHg`), cần bổ sung cảnh báo thận trọng tưới máu mạch vành tâm trương khi hạ SBP trên bệnh nhân có áp lực mạch rộng và DBP `< 60 mmHg`.
3. **`[HTN-R2-R3-14]` (SUGGESTION) — Bổ sung ca mẫu Cấp cứu Nội viện vào `htnPresets` (`src/modules/htn/presets.ts`)**:
   - Bổ sung 1–2 ca mẫu `setting: 'inpatient'` (vd: Bóc tách ĐMC cấp và Tiền sản giật nặng) bên cạnh 5 ca ngoại trú hiện có.

---

## 5. Kết luận Nghiệm thu Độc lập Vòng 2 (Reviewer R3 Verdict)

Căn cứ tiêu chuẩn nghiệm thu bắt buộc tại `docs/REVIEW_PROTOCOL.md` (`PASS` chỉ được cấp khi **`0 critical` VÀ `0 major`**), phân hệ Tăng huyết áp (`htn`) ở Vòng 2 hiện còn tồn tại **5 lỗi mức `critical`** và **6 lỗi mức `major`** đã được chứng minh thực nghiệm trực tiếp qua **100 kịch bản đối kháng sống (`S01`–`S100`)** trên `evaluate(patient, settings)`.

**Kết luận cuối cùng của Reviewer R3 (Vòng 2): `FAIL`** — Đề nghị khắc phục triệt để 5 phát hiện `critical` và 6 phát hiện `major` trước khi trình thẩm định vòng kế tiếp.
