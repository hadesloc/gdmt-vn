# Báo cáo Phản biện An toàn Đối kháng (Round 1 – Reviewer R3)
## Module: Tăng huyết áp (`htn`)

- **Vai trò**: R3 – Chuyên gia Phản biện An toàn Đối kháng (Adversarial Safety Tester)
- **Vòng đánh giá**: Round 1 (Độc lập 100% — không đọc báo cáo R1/R2, không sửa mã nguồn hay KB)
- **Kịch bản kiểm thử thực nghiệm**: `docs/reviews/htn/scratch/r3_adversarial.ts`
- **Quy mô chạy thật `evaluate()`**: **75 kịch bản bệnh nhân đối kháng (`ADV_HTN_01` → `ADV_HTN_75`) + 5 ca mẫu (`htnPresets`) = 80 ca lâm sàng** (tổng cộng **126 lượt gọi `evaluate()`** trải đều 3 bộ tiêu chuẩn `INTL` [ESC 2024 / KDIGO], `VN` [VSH/VNHA 2022 & BYT], `US` [AHA/ACC 2025] và 2 bối cảnh `outpatient` / `inpatient`).
- **Tệp JSON chuẩn hóa**: `docs/reviews/htn/round1_R3.json`

---

## 1. Tổng quan Kết quả Kiểm định An toàn

| Mức độ nghiêm trọng (`severity`) | Số lượng | Ý nghĩa lâm sàng theo `REVIEW_PROTOCOL.md` |
|---|---:|---|
| 🔴 **`critical`** | **11** | **Có thể gây nguy hại trực tiếp / tử vong cho bệnh nhân nếu làm theo** (nuốt mất y lệnh `MgSO4` và cửa sổ đích hạ áp nội viện trong đột quỵ/xuất huyết não/tiền sản giật; bỏ lọt cấp cứu sản khoa `≥ 160/110 mmHg`; truyền giãn mạch `Nicardipine IV` đơn độc khi chưa biết nhịp tim trong bóc tách ĐMC cấp; kê chồng `Sacubitril/Valsartan + RASi SPC`; bỏ lọt `STOP` ACEi ở hẹp ĐM thận 2 bên; vi phạm fail-closed kê RASi khi thiếu `K⁺`/`SCr`; bỏ lọt trùng 2 ACEi / 2 ARB / sai chính tả `torasemide` gây kê trùng 2 lợi tiểu quai; kê `Nicardipine IV` đơn trị trong hội chứng vành cấp...) |
| 🟠 **`major`** | **6** | **Sai lệch guideline Class I, vi phạm QA-9 / QA-10, điều trị quá mức người già suy yếu hoặc sai thuật ngữ liều thận** (fallthrough ngầm sang `Doxazosin` khi thiếu `HR`; ép cụ già 88 tuổi suy yếu hạ HA `< 130/80 mmHg` ở Profile `US`; giữ `HCTZ` / kê `Indapamide` trên bệnh nhân Gút; vùng mù `130–139/80–89 mmHg` ở Bước 2–3; mượn sai ID ngưỡng tiền sản giật cho đột quỵ; ma trận thận ghi ngược `"Giảm khoảng cách liều"` cho Methyldopa ở CKD G4) |
| 🟡 **`minor`** | **1** | **Lỗi hiển thị UI tiếng Việt gây nhiễu nhận thức** (`fmtDose` lặp đôi câu chữ và nhúng liều tiêm TM suy tim cấp vào tiêu đề đơn ngoại trú; gọi sốc `76/48 mmHg` là `"Tăng huyết áp đã đạt đích"`; nhãn `"Labetalol tiêm truyền"` dùng chung cho đường uống) |
| 🔵 **`suggestion`** | **1** | **Đề xuất hoàn thiện an toàn nội viện** (phát lệnh `[HOLD]` tường minh đối với chẹn beta đường uống đang dùng tại nhà khi vào phù phổi cấp do tim) |
| **Tổng cộng** | **19** | **Kết luận bắt buộc: `FAIL`** |

---

## 2. Những Cơ chế An toàn ĐÃ ĐẠT (Điểm sáng ghi nhận)

Qua 126 lượt chạy `evaluate()`, các chốt chặn sau hoạt động chính xác:
1. **Fail-closed huyết áp đầu vào (`ADV_HTN_01` → `03`)**: Khi thiếu `sbp` hoặc `dbp`, cả ngoại trú lẫn nội viện đều dừng an toàn và phát `missing_input_sbp` / `missing_input_dbp`, không kê thuốc mù.
2. **Cổng an toàn Spironolactone ở Bước 4 (`ADV_HTN_08`, `30`, `31`)**: Fail-closed chuẩn khi thiếu `K⁺` hoặc `eGFR`; phát `[AVOID]` chặn Spironolactone chính xác khi `K⁺ > 4.5 mmol/L` (`4.9`, `5.8`) hoặc suy thận nặng, đồng thời tự động kích hoạt tầm soát cường aldosteron nguyên phát (`ARR`) khi hạ kali máu (`ADV_HTN_73`).
3. **Ngừng Thiazide chuyển sang lợi tiểu quai ở CKD G4 (`ADV_HTN_31`)**: Khi `eGFR = 24 < 30 mL/min/1.73m²`, hệ thống phát `[STOP] Indapamide` và chuyển sang `Furosemide` chính xác.
4. **Tương tác tử vong PDE-5i + Nitrat trong phù phổi cấp (`ADV_HTN_58`, `59`)**: Chặn tuyệt đối `[AVOID] Nitroglycerin IV` và bật `SafetyAlert [critical] ix.pde5i_nitrate_vericiguat` khi bệnh nhân đang dùng `Sildenafil`.
5. **Bảo tồn tưới máu não trong đột quỵ thiếu máu não không tiêu sợi huyết (`ADV_HTN_60`) và Cơn THA khẩn cấp không HMOD (`ADV_HTN_54`)**: Ở HA `195/105` nhồi máu não không rtPA, hệ thống phát `[HOLD]` không hạ áp vội; ở HA `195/115` nội viện không HMOD, hệ thống phát `[CONTINUE]` tối ưu thuốc uống, cấm tiêm bolus IV / ngậm Nifedipine dưới lưỡi.
6. **Phối hợp chéo ACEi + ARB và ACEi + ARNI (`ADV_HTN_26`, `29`)**: Phát hiện và phát lệnh `[STOP]` kèm cảnh báo khoảng nghỉ 36 giờ (`ix.acei_arni_washout`).

---

## 3. Phân tích Chi tiết Các Phát hiện Nghiêm trọng (`R3-HTN-01` → `R3-HTN-19`)

### 🔴 NHÓM CRITICAL (11 phát hiện — Nguy cơ tai biến trực tiếp trên bệnh nhân)

#### `R3-HTN-01` [CRITICAL | `rule` | `htn.inpatient.differentiate_crisis`]
**`differentiate_crisis` phát `[START] nicardipine` (priority 100) trước mọi rule HMOD nội viện, khiến `merge.ts` nuốt sạch đích huyết áp chuyên biệt, làm mất y lệnh `Magnesium sulfate` trong tiền sản giật, truyền Nicardipine IV sai chỉ định khi HA đã đạt ngưỡng rtPA/ICH, và kê chồng 2 thuốc IV cùng lúc**

- **Cơ chế lỗi trong mã nguồn**:
  - `src/modules/htn/rules.inpatient.ts` (dòng 118–145): Bất cứ khi nào `SBP >= 180 || DBP >= 120` kèm bất kỳ HMOD nào, Rule 1 (`differentiate_crisis`) luôn chạy ĐẦU TIÊN và phát `rec_htn_hypertensive_emergency_general` với `action: 'START', drugId: 'nicardipine', priority: 100`.
  - Ngay sau đó, các Rule HMOD chuyên biệt số 4 (`stroke_thrombolysis`), số 5 (`stroke_no_thrombolysis`), số 6 (`intracerebral_hemorrhage`), số 7 (`preeclampsia_emergency` nhánh có hen/nhịp chậm), và số 8 (`hypertensive_encephalopathy`) **cũng phát khuyến cáo mang cùng `drugId: 'nicardipine'`**.
  - Khi đi qua `mergeRecommendations()` (`src/engine/merge.ts` dòng 589):
    `const recWins = ACTION_PRIORITY[rec.action] > ACTION_PRIORITY[existing.action];`
    Vì `START` (60) `>` `START` (60) là **`false`**, bản ghi đến trước (`rec_htn_hypertensive_emergency_general`) thắng tuyệt đối và **xóa sổ hoàn toàn** khuyến cáo HMOD chuyên biệt!
- **Bằng chứng thực nghiệm từ `evaluate()`**:
  1. **`ADV_HTN_53`** (*Sản phụ Tiền sản giật nặng + Hen phế quản, HA `185/115 mmHg`*): Rule 7 chọn `nicardipine` kèm **y lệnh `Magnesium sulfate (MgSO4)` dự phòng co giật sản giật** và đích `< 160/105 mmHg`, nhưng bị Rule 1 đè mất sạch! Output thực tế mất hoàn toàn `MgSO4`!
  2. **`ADV_HTN_63`** (*Đột quỵ nhồi máu não cấp có chỉ định rtPA, HA `182/102 mmHg` — ĐÃ ĐẠT ngưỡng an toàn `≤ 185/110 mmHg`*): Rule 4 phát `[MONITOR]` không cần hạ thêm, nhưng Rule 1 thấy `SBP = 182 >= 180` nên phát **`[START] Nicardipine 5 mg/h IV`** (`START` 60 đè chết `MONITOR` 10), ra y lệnh truyền hạ áp không cần thiết trước tiêu sợi huyết!
  3. **`ADV_HTN_67`** (*Xuất huyết não cấp ICH, HA `180/105 mmHg`*): Rule 6 phát `[MONITOR]` duy trì dải `130–180 mmHg`, nhưng bị Rule 1 đè bằng **`[START] Nicardipine 5 mg/h IV`**!
  4. **`ADV_HTN_62` (`195/105` rtPA), `ADV_HTN_61` (`228/126` stroke không rtPA), `ADV_HTN_64` (`215/115` ICH), `ADV_HTN_75` (`215/125` bệnh não THA)**: Toàn bộ con số đích sống còn (`< 185/110`, giảm `15% MAP`, cửa sổ `130–180 mmHg` cấm hạ `< 130`, giảm `20–25% MAP`) đều biến mất khỏi kết quả trả về cho bác sĩ!
  5. **`ADV_HTN_52`** (*Tiền sản giật nặng không hen, HA `185/122 mmHg`*): Vì Rule 1 phát `drugId: 'nicardipine'` còn Rule 7 phát `drugId: 'labetalol'`, hệ thống ra y lệnh **`START` đồng thời cả `Nicardipine 5 mg/h IV` LẪN `Labetalol 20 mg bolus IV`** (`Actions(START:2)`) -> tụt huyết áp mẹ thảm khốc và suy thai cấp!
  6. **`ADV_HTN_58`** (*Phù phổi cấp HA `210/120`*): Thẻ `rec_htn_hypertensive_emergency_general` viết trong rationale `"Nicardipine tiêm truyền hoặc Labetalol"` ngay cạnh thẻ `[AVOID] CHỐNG CHỈ ĐỊNH thuốc chẹn beta giao cảm trong Phù phổi cấp do tim`!

---

#### `R3-HTN-02` [CRITICAL | `missing` | `htn.emergency.obstetric_threshold_160_110`]
**Mù hoàn toàn trước ngưỡng Cấp cứu tăng huyết áp sản khoa (`HA ≥ 160/110 mmHg`) ở cả Ngoại trú lẫn Nội viện**

- **Bằng chứng thực nghiệm từ `evaluate()`**:
  - Theo ESC 2024 (`esc.htn.2024.preeclampsia_emergency`), VSH 2022 (`vsh.htn.2022.pregnancy_emergency_160_110`) và AHA/ACC 2025 (`aha.acc.2025.pregnancy_severe_160`), **HA `≥ 160/110 mmHg` ở thai phụ là cấp cứu sản khoa tối khẩn** (nguy cơ xuất huyết não mẹ và sản giật, phải nhập viện hạ áp trong 15–60 phút), không được đợi tới `180/120 mmHg`.
  1. **`ADV_HTN_48`** (*Outpatient, `pregnant: true, severePreeclampsiaEclampsia: true`, HA `165/112 mmHg`*):
     - `checkEmergencyRedFlags` (`reviewMeds.ts:82`) đợi `>= 180/120` -> `REFER = 0`.
     - `pregnancy_safe_initiation` (`rules.outpatient.ts:1659`) thấy `severePreeclampsiaEclampsia` thì `return false` -> `START = 0`.
     - `preeclampsia_emergency` chỉ chạy ở `inpatient`.
     - **Output trên cả 3 profile `INTL`/`VN`/`US`**: Chỉ còn đúng 1 dòng `[CONSIDER] Phân loại: Tăng huyết áp` — **0 lệnh `REFER` cấp cứu, 0 thuốc hạ áp, 0 `MgSO4`, 0 `Alert`**!
  2. **`ADV_HTN_49`** (*Outpatient, `pregnant: true`, HA `165/112 mmHg`*): `REFER = 0`, bình thản kê đơn ngoại trú `Methyldopa 250 mg` uống về nhà!
  3. **`ADV_HTN_50`** (*Inpatient, `pregnant: true` chưa tick `severePreeclampsiaEclampsia`, HA `175/115 mmHg`*): Trả về **`Actions(NONE) | Alerts(0)` — rỗng hoàn toàn 0 khuyến cáo**!

---

#### `R3-HTN-03` [CRITICAL | `rule` | `htn.inpatient.aortic_dissection`]
**Ba sai sót nguy hiểm tính mạng trong Bóc tách động mạch chủ cấp (`ADV_HTN_10`, `ADV_HTN_55`, `ADV_HTN_57`)**

1. **Truyền giãn mạch `Nicardipine IV` đơn độc khi thiếu `HR` (`ADV_HTN_10`: `aorticDissection: true, HA 200/110, hr: undefined`)**: Trong khi `aortic_dissection` dừng lại hỏi `missing_input_hr`, `differentiate_crisis` vẫn phát ngay **`[START] Nicardipine 5 mg/h IV`**! Dùng thuốc giãn mạch động mạch khi chưa chẹn beta làm bật phản xạ giao cảm tăng nhịp tim và lực tống máu thất trái ($dP/dt$), xé rách lan rộng thành động mạch chủ gây vỡ ĐMC tử vong tức thì.
2. **Kê mù `Esmolol` + gợi ý `Labetalol` trên bệnh nhân Hen phế quản (`ADV_HTN_55`: `aorticDissection: true, asthma: true, HA 200/110, HR 96`)**: Không kiểm tra `asthma`, `Alerts(0)`, rationale gợi ý `Labetalol` (chẹn beta không chọn lọc gây co thắt phế quản ngừng thở), và bỏ sót phác đồ thay thế non-DHP CCB đường tĩnh mạch (`Diltiazem` / `Verapamil`) khi chống chỉ định chẹn beta.
3. **Bỏ mặc không hạ áp khi `HR < 60 bpm` nhưng `SBP` còn `120–179 mmHg` (`ADV_HTN_57`: `HA 165/95, HR = 48 bpm`)**: Output chỉ có `[MONITOR] Nhịp tim đã đạt đích`, **`byAction.START = 0`** — không phát lệnh truyền `Nicardipine IV` để kéo `SBP = 165 mmHg` xuống đích sống còn `< 120 mmHg`!

---

#### `R3-HTN-04` [CRITICAL | `rule` | `htn.outpatient.step1_dual_combination`]
**Vi phạm Fail-Closed (QA-1 & QA-9): Khởi trị `RASi + Amlodipine SPC` hoặc `Perindopril` khi thiếu `K⁺`, thiếu `SCr`/`eGFR`, hoặc thiếu `Tuổi` (`ADV_HTN_04`, `05`, `06`)**

- Trong `src/modules/htn/rules.outpatient.ts` (dòng 405–406, 472–493, 709–733):
  - `rasiContra` viết `(k !== undefined && k > kRasiMax) || hasBilateralRas` -> khi `k === undefined` và `scr === undefined`, hệ thống mặc định bệnh nhân an toàn (`false`) và **kê thẳng `[START] RASi + Amlodipine 5 mg (SPC)` (`ADV_HTN_04`) hoặc `[START] Perindopril 2.5 mg` (`ADV_HTN_05`)** mà không hề gọi `missingInputRec` yêu cầu `K⁺` và `eGFR`!
  - Khi `age === undefined` (`ADV_HTN_06`), `isFrailOrElderlyMono` mặc định `false` và `derived.egfr` cũng `undefined`, nhưng hệ thống vẫn kê viên đôi `RASi + Amlodipine 5 mg`!

---

#### `R3-HTN-05` [CRITICAL | `rule` | `htn.outpatient.step1_dual_combination`]
**Viên phối hợp đôi `RASi + Amlodipine (SPC)` ngụy trang dưới `drugId: 'amlodipine'` làm tê liệt bộ chặn tương tác đa module, gây kê chồng `Sacubitril/Valsartan (ARNI)` + `RASi SPC` (`ADV_HTN_70`)**

- Trong `rules.outpatient.ts` (dòng 511, 542, 636), các thẻ SPC hai thuốc (`RASi + Amlodipine`, `Amlodipine + ARB`, `Amlodipine + Losartan`) chỉ gán `drugId: 'amlodipine'`.
- Khi chạy đa module `selectedModules: ['htn', 'hf']` trên bệnh nhân HFrEF (`LVEF 30%, HA 158/96`, chưa dùng thuốc — **`ADV_HTN_70`**), `evaluate()` xuất đồng thời trong cùng một phác đồ với `Alerts(0)`:
  - `[START] Sacubitril / Valsartan (ARNI) 49/51 mg x 2 lần/ngày` (từ module `hf`)
  - `[START] Khởi trị phối hợp đôi liều cố định (SPC): RASi + Amlodipine` (từ module `htn`)
  - `[START] Spironolactone 25 mg` (từ module `hf`)
- Do `merge.ts` chỉ nhìn thấy `drugId: 'amlodipine'` (`dhp_ccb`), cơ chế khử trùng lặp `rasi_arni` và chặn chống chỉ định tuyệt đối Class III Harm `ARNI + ACEi/ARB` bị vô hiệu hóa hoàn toàn -> nguy cơ **phù mạch thanh quản tử vong, suy thận cấp và tăng kali máu ác tính**!

---

#### `R3-HTN-06` [CRITICAL | `rule` | `htn.outpatient.rasi_contra_hyperkalemia_or_ras`]
**Hẹp động mạch thận hai bên đang uống `Perindopril` bị bỏ sót `STOP` (`ADV_HTN_38`) & Các quy tắc Bước 1–4 khuyên gộp thuốc vừa bị `STOP`/`HOLD` vào viên SPC (`ADV_HTN_36`, `41`, `71`, `74`)**

1. **`ADV_HTN_38`** (*`bilateralRenalArteryStenosis: true`, đang uống `perindopril 5 mg`, HA `162/98`*): Rule `rasi_contra_hyperkalemia_or_ras` (`rules.outpatient.ts:791`) thoát sớm nếu bệnh nhân đã có RASi trong `currentMeds`, còn `reviewMeds.ts` không kiểm tra hẹp ĐM thận 2 bên. Kết quả: **`STOP = 0, Alerts = 0`**, và Bước 1 phát `[START] Phối hợp thêm Amlodipine để hoàn thiện phác đồ 2 thuốc (ưu tiên viên cố định SPC)` — bảo bác sĩ giữ nguyên Perindopril trên hẹp ĐM thận 2 bên!
2. **`ADV_HTN_36` & `ADV_HTN_71`** (*Tiền sử phù mạch `priorAngioedema: true` đang uống `perindopril` hoặc `sacubitril_valsartan`*): Vừa phát `[STOP] NGỪNG NGAY Perindopril / Sacubitril-Valsartan`, vừa phát đồng thời `[START] Phối hợp thêm Amlodipine để hoàn thiện phác đồ 2 thuốc (ưu tiên viên cố định SPC)`!
3. **`ADV_HTN_74`** (*Block AV độ 2–3 + `HR = 44 bpm` đang uống `bisoprolol + diltiazem`*): Vừa `[HOLD] Diltiazem`, vừa khuyên `[START] Phối hợp thêm Perindopril cùng CCB hiện tại (ưu tiên viên SPC)`!
4. **`ADV_HTN_41`** (*Tăng kali máu ác tính `K⁺ = 6.3 mmol/L`*): Giữa lúc `[REFER] CẤP CỨU K⁺ = 6.3` và `[STOP] Perindopril`, Bước 4 vẫn phát `[START] Bisoprolol 1.25 mg`!

---

#### `R3-HTN-07` [CRITICAL | `rule` | `htn.outpatient.eval_bp_target`]
**Ba lỗ hổng an toàn Thai kỳ: Đích huyết áp quá thấp (`120–129/70–79` hoặc `< 120 mmHg`), bỏ lọt `Hydrochlorothiazide` đang uống, và kê mù `Methyldopa` khi viêm gan / trầm cảm nặng (`ADV_HTN_45`, `46`, `47`, `htn_preset_pregnancy_safe`)**

1. **Đích hạ áp sai nguy hiểm cho thai nhi**: `eval_bp_target` không kiểm tra `pregnant`. Ngay trên preset mẫu `htn_preset_pregnancy_safe` (`pregnant: true, HA 152/95`), Profile `INTL` ra đích **`120–129/70–79 mmHg`**, Profile `US` ra đích **`< 130/80 mmHg`**, và khi thai phụ kèm CKD (`ADV_HTN_47`) ra đích **`< 120 mmHg đo chuẩn hóa (KDIGO 2021)`** — mâu thuẫn trực tiếp với đích `< 140/90 mmHg` (tránh DBP `< 80 mmHg`) của ESC 2024 / VSH 2022 và gây thiếu máu bánh nhau!
2. **Bỏ lọt lợi tiểu Thiazide trong thai kỳ (`ADV_HTN_45`)**: Dù comment dòng 1611 trong `rules.outpatient.ts` ghi rõ `RASi / MRA / THIAZIDE -> STOP`, dòng 1622 lại quên `THIAZIDE_IDS`, khiến thai phụ đang uống `hydrochlorothiazide 25 mg` không nhận được lệnh `STOP`/`SWITCH` nào.
3. **Kê mù `Methyldopa` trên bệnh nhân Bệnh gan tiến triển + Trầm cảm nặng (`ADV_HTN_46`)**: `pregnancy_safe_initiation` gán cứng `methyldopa` mà không kiểm tra `liverDisease` / `depression`, còn `gates.ts` bỏ qua 2 mã chống chỉ định `active_liver_disease` và `depression` trong `kb/drugs/methyldopa.json`.

---

#### `R3-HTN-08` [CRITICAL | `rule` | `htn.outpatient.ban_dual_rasi`]
**Uống trùng 2 ACEi hoặc 2 ARB không có lệnh `STOP` (`ADV_HTN_27`, `28`), sai chính tả `'torasemide'` vs `'torsemide'` gây kê chồng 2 lợi tiểu quai (`ADV_HTN_32`), và mù hoàn toàn trước trùng 2 CCB / 2 Thiazide (`ADV_HTN_34`)**

1. **`ADV_HTN_27` (`enalapril + perindopril`) & `ADV_HTN_28` (`losartan + telmisartan`)**: `ban_dual_rasi` (`rules.outpatient.ts:1574`) tính `(hasAcei ? 1 : 0) + (hasArb ? 1 : 0) + (hasArni ? 1 : 0) >= 2`. Khi uống 2 thuốc cùng nhóm ACEi hoặc 2 thuốc cùng nhóm ARB, tổng chỉ bằng `1` -> **`byAction.STOP = 0`**!
2. **`ADV_HTN_32` (Lỗi chính tả `'torasemide'` vs `'torsemide'`)**: KB định nghĩa `kb/drugs/torsemide.json` (`id: "torsemide"`), nhưng `LOOP_IDS` (`rules.outpatient.ts:43`) viết `'torasemide'`. Bệnh nhân suy thận nặng (`eGFR = 24`) đang uống `telmisartan + amlodipine + torsemide 10 mg` bị hệ thống kê chồng thêm **`[START] Furosemide 20 mg`** (2 lợi tiểu quai cùng lúc -> mất nước cấp, suy thận cấp trước thận, hạ K⁺ nặng, độc tai)!
3. **`ADV_HTN_34` (`amlodipine + nifedipine` VÀ `hydrochlorothiazide + indapamide`)**: `STOP = 0` và `Alerts = 0`!

---

#### `R3-HTN-09` [CRITICAL | `missing` | `htn.outpatient.acute_hmod_and_crisis_guard`]
**Bệnh nhân Ngoại trú có Đột quỵ cấp (`ADV_HTN_69`) bị bỏ sót `REFER` và bị kê viên uống hạ áp thường quy gây tổn thương vùng tranh tối tranh sáng; Cơn THA `225/130 mmHg` (`ADV_HTN_21`) vừa `REFER` cấp cứu vừa kê đơn ngoại trú**

- **`ADV_HTN_69`** (*Outpatient, `acuteIschemicStroke: true`, HA `175/102 mmHg`*): `REFER = 0`, `Alerts = 0`, phát `[START] RASi + Amlodipine 5 mg (SPC)`! Hạ áp đường uống ở đột quỵ thiếu máu não cấp có HA `< 220/120 mmHg` vi phạm chống chỉ định Class III Harm, làm giảm tưới máu não và mở rộng vùng nhồi máu!
- **`ADV_HTN_20` (`180/110`) & `ADV_HTN_21` (`225/130`)**: Phát song song `[REFER] CHUYỂN CẤP CỨU KHẨN CẤP` và `[START] Khởi trị phối hợp đôi liều cố định (SPC): RASi + Amlodipine` trên cùng màn hình ngoại trú.

---

#### `R3-HTN-10` [CRITICAL | `missing` | `htn.inpatient.acute_acs_emergency`]
**Thiếu quy tắc nội viện cho Cấp cứu THA kèm Hội chứng vành cấp (`acuteAcsWithin24h = true`, `ADV_HTN_68`), dẫn đến kê `Nicardipine IV` đơn trị gây nhịp nhanh phản xạ thiếu máu cơ tim**

- Dù `src/modules/htn/inputs.ts:154` cung cấp nút bật `acuteAcsWithin24h` ("Hội chứng vành cấp < 24h") và `kb/citations/htn.json:426` đã có trích dẫn `vsh.htn.2022.emergency_coronary`, tệp `rules.inpatient.ts` lại hoàn toàn không có rule xử trí ACS!
- Chạy `ADV_HTN_68` (`inpatient, acuteAcsWithin24h: true, HA 195/110, HR 98`): Hệ thống kê đơn độc **`[START] Nicardipine 5 mg/h IV`** thay vì **`Nitroglycerin IV` + `Esmolol/Labetalol IV`** (đích `SBP < 140 mmHg`), gây nguy cơ nhịp nhanh phản xạ và hiện tượng cướp máu mạch vành làm lan rộng ổ nhồi máu cơ tim!

---

#### `R3-HTN-11` [CRITICAL | `rule` | `htn.outpatient.compelling_beta_blocker`]
**Bốn lỗ hổng sinh hiệu & điện giải: Khởi trị `Bisoprolol` khi huyết áp thấp `95/60 mmHg` (`ADV_HTN_13`), bỏ lọt `HOLD` `Doxazosin`/`Methyldopa`/`Clonidine` khi tụt HA `82/52 mmHg` (`ADV_HTN_12`), bỏ lọt `HOLD`/`STOP` `HCTZ` khi hạ kali máu nặng `K⁺ = 2.8 mmol/L` (`ADV_HTN_73`), và thiếu `STOP` chẹn beta/non-DHP CCB khi `avBlock2or3` có `HR ≥ 50 bpm`**

1. **`ADV_HTN_13`** (`sbp: 95, dbp: 60, ascvd: true`): `compelling_beta_blocker` (`rules.outpatient.ts:1495`) không kiểm tra `sbp`, vẫn phát `[START] Bisoprolol 1.25 mg` (thậm chí ở `sbp = 82 mmHg` cũng vẫn chạy!).
2. **`ADV_HTN_12`** (`sbp: 82, dbp: 52`, đang uống `perindopril + doxazosin + methyldopa + clonidine`): Chỉ `HOLD` `perindopril`; bỏ lọt cả `doxazosin`, `methyldopa`, `clonidine` do thiếu nhóm trong `isBpLoweringMed` (`reviewMeds.ts:732`).
3. **`ADV_HTN_73`** (`k: 2.8 mmol/L`, đang uống `hydrochlorothiazide 25 mg`): Không `HOLD`/`STOP` HCTZ và không có Red Flag cấp cứu hạ kali máu nặng `< 3.0 mmol/L` (nguy cơ xoắn đỉnh / rung thất).
4. **Block nhĩ thất độ 2–3 không máy tạo nhịp (`avBlock2or3 = true`)**: `reviewMeds.ts` chỉ `HOLD` khi `hr < 50`, không phát `STOP` khi `HR >= 50 bpm`.

---

### 🟠 NHÓM MAJOR (6 phát hiện — Vi phạm Guideline / QA-9 / QA-10 / Over-treatment / Ma trận)

#### `R3-HTN-12` [MAJOR | `rule` | `htn.outpatient.step3_resistant_alternative`]
- **Vi phạm trực tiếp QA-9 (`ADV_HTN_09`)**: Dòng 1388 của `rules.outpatient.ts` gộp `hr === undefined` chung vào `bbContraindicated`, nên khi người dùng quên nhập nhịp tim trên bệnh nhân THA kháng trị (`K⁺ = 4.9` chặn Spironolactone), hệ thống âm thầm bỏ qua thuốc ưu tiên `Bisoprolol` và rẽ nhánh `else` kê luôn `[START] Doxazosin 1 mg` thay vì trả về `missingInputRec('htn', 'hr')`. Lỗi tương tự tại `compelling_beta_blocker` dòng 1502 làm mất khuyến cáo Class I chẹn beta ở bệnh nhân HFrEF / sau MI khi thiếu `hr`.

#### `R3-HTN-13` [MAJOR | `rule` | `htn.outpatient.step1_dual_combination`]
- **Điều trị quá mức người già 86–88 tuổi suy yếu + hạ huyết áp tư thế (`ADV_HTN_22` → `25`, `htn_preset_elderly_monotherapy`)**:
  - Dưới Profile `US`, `eval_bp_target` quên hoàn toàn nhánh `needsLenientTarget`, ép cụ già 86–88 tuổi suy yếu đạt đích `< 130/80 mmHg`; ở `ADV_HTN_23` (`HA 134/76`), `US` vẫn khởi trị `Amlodipine 2.5 mg`; ở `ADV_HTN_24` (`HA 135/76` đang uống `Amlodipine 2.5 mg`), `US` bồi thêm `Perindopril 2.5 mg`!
  - Ở `ADV_HTN_25` (88 tuổi, suy yếu + hạ HA tư thế đứng đang uống `Perindopril 2.5 + Amlodipine 2.5`, HA `144/78`), Bước 2 kê thẳng lợi tiểu `Indapamide 1.5 mg` mà không chỉnh liều chậm hay cảnh báo té ngã gãy cổ xương đùi.

#### `R3-HTN-14` [MAJOR | `rule` | `htn.outpatient.step2_triple_combination`]
- **Quản lý sai bệnh đồng mắc Gút (`ADV_HTN_42` → `44`, `htn_preset_gout_caution`)**:
  - Đang uống `Hydrochlorothiazide 25 mg` kèm Gút và acid uric `540 µmol/L` (`ADV_HTN_42`, `43`): Không hề có lệnh `SWITCH`/`STOP` sang `Losartan`/`CCB`, thậm chí khuyên giữ HCTZ để phối hợp thêm `Amlodipine`!
  - Ở Bước 2 (`ADV_HTN_44`), kê thẳng `Indapamide 1.5 mg` trên bệnh nhân Gút mà không cảnh báo tăng acid uric hay khuyên đổi `Perindopril` sang `Losartan`.
  - Ngay trên preset `htn_preset_gout_caution` dưới Profile `VN`, `isVnLowRiskGrade1` chạy trước `gout` làm mất sạch khuyến cáo phối hợp `Losartan`.

#### `R3-HTN-15` [MAJOR | `rule` | `htn.outpatient.step2_triple_combination`]
- **Vùng mù điều trị `130–139 / 80–89 mmHg` ở Bước 1b/2/3 (`ADV_HTN_72`) & Chẩn đoán sớm THA kháng trị khi chưa tối ưu liều**:
  - `eval_bp_target` đặt đích `< 130/80 mmHg` (hoặc `120–129/70–79`), nhưng `step2_triple_combination` và `step3_resistant_spironolactone` lại đóng cứng điều kiện `SBP >= 140 || DBP >= 90` trên cả 3 profile, khiến bệnh nhân Đái tháo đường / CKD đang uống 2–3 thuốc có HA `135/84 mmHg` không nhận được bất kỳ hướng dẫn `TITRATE` hay `START` nào. Đồng thời `step3` dán nhãn THA kháng trị ngay cả khi bệnh nhân mới dùng liều khởi đầu thấp nhất của 3 thuốc.

#### `R3-HTN-16` [MAJOR | `threshold` | `htn.inpatient.qa10_and_profile_thresholds`]
- **Vi phạm QA-10, lệch ngưỡng Profile `INTL` vs `US` của Spironolactone, và khoảng trống phù phổi cấp dùng Sildenafil (`ADV_HTN_59`)**:
  - `rules.inpatient.ts:449` mượn `htn.emergency.preeclampsia_dbp` (`105`) của tiền sản giật dùng cho đột quỵ tiêu sợi huyết; dòng `614` mượn `htn.bp.sbp_hypertension` (`140`) ngoại trú dùng cho xuất huyết não; dòng `847` mượn `sbp_grade2`/`dbp_grade2` ngoại trú dùng cho bệnh não THA.
  - `rules.outpatient.ts:1199` đóng cứng `htn.spiro.egfr_min_initiate = 45` (AHA/ACC 2025) cho cả `INTL` và `VN`, bỏ quên `htn.spiro.egfr_contra_esc = 30` (ESC 2024) đã khai báo sẵn trong `kb/thresholds/htn.json:319`.
  - Ở `ADV_HTN_59` (phù phổi cấp HA `170/105` đang uống `Sildenafil`), khi Nitroglycerin bị `AVOID` và `SBP < 180`, không có thuốc tĩnh mạch thay thế nào được `START` (`START = 0`).

#### `R3-HTN-17` [MAJOR | `matrix` | `htnRenalMatrix_and_htnComorbidityMatrix`]
- **Ngược nghĩa nguy hiểm trong `htnRenalMatrix` (`src/modules/htn/matrix.ts:226`) & Mâu thuẫn ma trận**:
  - Hàng `methyldopa` ở cột `g4` ghi **`"Giảm khoảng cách liều"`** — nghĩa tiếng Việt là rút ngắn khoảng cách giữa các liều (uống dày hơn, gây quá liều tích lũy ở suy thận nặng!), ngược hoàn toàn với **"Kéo dài (tăng) khoảng cách giữa các liều"**.
  - Hàng `hydrochlorothiazide` ở `g4` ghi `continue: 'caution'` mâu thuẫn với rule `ckd_thiazide_to_loop` phát lệnh `STOP` ở `eGFR < 30`.
  - Hàng `indapamide` ở `hfref` và hàng `bisoprolol` ở `pregnancy` đều bị tô xanh `'rec'` gây hiểu lầm lâm sàng.

---

### 🟡 NHÓM MINOR & 🔵 SUGGESTION (2 phát hiện)

- **`R3-HTN-18` [MINOR | `ui` | `fmtDose_duplicate_text_and_shock_label`]**:
  1. `fmtDose()` ghép lặp đôi câu chữ (`"5 mg x 1 lần/ngày (uống) - 5 mg uống 1 lần/ngày..."`) và nhúng nguyên hướng dẫn tiêm tĩnh mạch suy tim cấp của Furosemide vào tiêu đề thẻ ngoại trú CKD (`ADV_HTN_31`).
  2. Khi bệnh nhân sốc tụt huyết áp `76/48 mmHg` (`ADV_HTN_11`), `eval_bp_target` vẫn hiển thị `"Phân loại: Tăng huyết áp đã đạt đích"`.
  3. `kb/drugs/labetalol.json` đặt `nameVi: "Labetalol tiêm truyền"` nhưng dùng chung ID cho Labetalol đường uống ngoại trú thai kỳ.
- **`R3-HTN-19` [SUGGESTION | `rule` | `htn.inpatient.pulmonary_edema_active_bb_hold`]**:
  - Trong phù phổi cấp do tim (`ADV_HTN_58`), nên phát thêm lệnh `[HOLD]` đích danh thuốc chẹn beta đường uống bệnh nhân đang dùng tại nhà (`metoprolol_succinate`) bên cạnh thẻ `[AVOID]` khởi trị mới.

---

## 4. Bảng Tổng hợp Thực nghiệm 75 Kịch bản Đối kháng + 5 Presets

| Mã kịch bản | Bối cảnh / Profile | Tóm tắt bệnh cảnh đối kháng | Kết quả `evaluate()` thực tế | Đánh giá an toàn |
|---|---|---|---|---|
| `ADV_HTN_01` | Out / INTL,VN,US | Thiếu SBP (`undefined / 96`) | `[CONSIDER] missing_input_sbp` | ✅ PASS |
| `ADV_HTN_02` | Out / INTL,VN,US | Thiếu DBP (`162 / undefined`) | `[CONSIDER] missing_input_dbp` | ✅ PASS |
| `ADV_HTN_03` | Out / INTL | Thiếu cả SBP & DBP + kèm HF | `[CONSIDER] missing_input_sbp` | ✅ PASS |
| `ADV_HTN_04` | Out / INTL,VN,US | HA `164/98`, thiếu cả `K⁺` và `SCr` | Kê thẳng `[START] RASi + Amlodipine SPC`! | ❌ FAIL (`R3-HTN-04`) |
| `ADV_HTN_05` | Out / INTL | Đang uống Amlodipine, HA `158/96`, thiếu `K⁺` & `SCr` | Kê thẳng `[START] Perindopril 2.5 mg`! | ❌ FAIL (`R3-HTN-04`) |
| `ADV_HTN_06` | Out / INTL,VN,US | HA `162/92`, thiếu `age` (`egfr` cũng `undefined`) | Kê thẳng `[START] RASi + Amlodipine SPC`! | ❌ FAIL (`R3-HTN-04`) |
| `ADV_HTN_07` | Out / INTL | Bước 2 (`Perindopril + Amlodipine`), thiếu `SCr` | `[CONSIDER] missing_input_egfr` | ✅ PASS |
| `ADV_HTN_08` | Out / INTL | Bước 3 kháng trị, thiếu `K⁺` | `[CONSIDER] missing_input_k` | ✅ PASS |
| `ADV_HTN_09` | Out / INTL | Kháng trị `K⁺ = 4.9`, thiếu `HR` (`undefined`) | Không hỏi HR, tự rẽ nhánh kê `[START] Doxazosin`! | ❌ FAIL (`R3-HTN-12`) |
| `ADV_HTN_10` | Inp / INTL | Bóc tách ĐMC cấp HA `200/110`, thiếu `HR` | Kê `[START] Nicardipine IV` đơn độc khi chưa chẹn beta! | ❌ FAIL (`R3-HTN-03`) |
| `ADV_HTN_11` | Out / INTL | Sốc tụt HA `76/48` đang uống 3 thuốc | `HOLD` cả 3 + `REFER` sốc, nhưng gọi là `"đã đạt đích"` | ⚠️ UI (`R3-HTN-18`) |
| `ADV_HTN_12` | Out / INTL | Tụt HA `82/52` uống `Perindopril + Doxazosin + Methyldopa + Clonidine` | Chỉ `HOLD` Perindopril; bỏ lọt 3 thuốc hạ áp kia! | ❌ FAIL (`R3-HTN-11`) |
| `ADV_HTN_13` | Out / INTL,VN,US | HA thấp `95/60` + ASCVD, chưa dùng thuốc | Vẫn kê `[START] Bisoprolol 1.25 mg`! | ❌ FAIL (`R3-HTN-11`) |
| `ADV_HTN_14` | Out / INTL,VN,US | HA bình thường `118/74` | Chỉ phân loại, không kê thuốc (`START: 0`) | ✅ PASS |
| `ADV_HTN_15` | Out / INTL,VN,US | HA `125/78` + ASCVD | Phân loại đúng + BB chỉ định mạch vành | ✅ PASS |
| `ADV_HTN_16` | Out / INTL,VN,US | HA `132/82`, SCORE2 `12%`, PREVENT `9%` | INTL/US khởi trị, VN theo dõi lối sống | ⚠️ Thiếu lối sống trước thuốc ở Elevated BP |
| `ADV_HTN_17` | Out / INTL,VN,US | HA `139/88` nguy cơ thấp | Theo dõi / lối sống trên cả 3 profile (`START: 0`) | ✅ PASS |
| `ADV_HTN_18` | Out / INTL,VN,US | HA đúng mốc `140/90` nguy cơ thấp | INTL/US: SPC; VN: đơn trị Amlodipine | ✅ PASS |
| `ADV_HTN_19` | Out / INTL,VN,US | HA sát ngưỡng `179/109` không HMOD | Khởi trị SPC ngoại trú | ✅ PASS |
| `ADV_HTN_20` | Out / INTL,VN,US | HA `180/110` ngoại trú | Vừa `REFER` cấp cứu vừa `START` SPC ngoại trú | ❌ FAIL (`R3-HTN-09`) |
| `ADV_HTN_21` | Out / INTL | Cơn THA kịch phát `225/130` ngoại trú | Vừa `REFER` cấp cứu vừa `START` SPC ngoại trú | ❌ FAIL (`R3-HTN-09`) |
| `ADV_HTN_22` | Out / INTL,VN,US | Cụ già 88t suy yếu + hạ HA tư thế, HA `156/84` | Đơn trị Amlo 2.5 mg, nhưng US đặt đích `< 130/80`! | ❌ FAIL (`R3-HTN-13`) |
| `ADV_HTN_23` | Out / INTL,VN,US | Cụ già 88t suy yếu + CKD, HA `134/76` | INTL/VN dừng; US vẫn kê `[START] Amlodipine 2.5`! | ❌ FAIL (`R3-HTN-13`) |
| `ADV_HTN_24` | Out / INTL,US | Cụ già 88t suy yếu uống Amlo 2.5, HA `135/76` | US bồi thêm `[START] Perindopril 2.5`! | ❌ FAIL (`R3-HTN-13`) |
| `ADV_HTN_25` | Out / INTL | Cụ già 88t suy yếu + hạ HA tư thế uống 2 thuốc liều 2.5, HA `144/78` | Kê thẳng lợi tiểu `[START] Indapamide 1.5 mg`! | ❌ FAIL (`R3-HTN-13`) |
| `ADV_HTN_26` | Out / INTL | Đang uống `Enalapril + Valsartan` (ACEi + ARB) | `[STOP] Valsartan` + 2 `Critical Alerts` | ✅ PASS |
| `ADV_HTN_27` | Out / INTL | Đang uống `Enalapril + Perindopril` (2 ACEi) | `STOP = 0`! Không phát lệnh ngừng thuốc trùng! | ❌ FAIL (`R3-HTN-08`) |
| `ADV_HTN_28` | Out / INTL | Đang uống `Losartan + Telmisartan` (2 ARB) | `STOP = 0`! Không phát lệnh ngừng thuốc trùng! | ❌ FAIL (`R3-HTN-08`) |
| `ADV_HTN_29` | Out / INTL | Đang uống `Sacubitril/Valsartan + Perindopril` | `[STOP] Perindopril` + cảnh báo washout 36h | ✅ PASS |
| `ADV_HTN_30` | Out / INTL,VN,US | Kháng trị `K⁺ = 4.9` trên 3 thuốc chuẩn | `[AVOID] Spiro` + `[START] Bisoprolol`, không trùng | ✅ PASS |
| `ADV_HTN_31` | Out / INTL | Kháng trị `SCr = 250` (eGFR 24) đang uống Indapamide | `[STOP] Indapamide` + `[AVOID] Spiro` + `[START] Furosemide` | ✅ PASS |
| `ADV_HTN_32` | Out / INTL | CKD G4 (`eGFR 24`) đang uống `Torsemide 10 mg` | Lỗi `'torasemide'` -> kê chồng `[START] Furosemide 20 mg`! | ❌ FAIL (`R3-HTN-08`) |
| `ADV_HTN_33` | Out / INTL | Đang uống `Amlodipine 10 mg`, HA `158/96` | Thêm `Perindopril`, không kê trùng Amlodipine | ✅ PASS |
| `ADV_HTN_34` | Out / INTL | Uống trùng 2 CCB (`Amlo + Nife`) + 2 Thiazide (`HCTZ + Inda`) | `STOP = 0`, `Alerts = 0`! | ❌ FAIL (`R3-HTN-08`) |
| `ADV_HTN_35` | Out / INTL,VN,US | Tiền sử phù mạch, chưa dùng thuốc | `[AVOID] ACEi` + khởi trị `Amlodipine + ARB` | ✅ PASS |
| `ADV_HTN_36` | Out / INTL | Tiền sử phù mạch đang uống `Perindopril` | `[STOP] Perindopril` nhưng lại bảo gộp SPC cùng RASi! | ❌ FAIL (`R3-HTN-06`) |
| `ADV_HTN_37` | Out / INTL | Hẹp ĐM thận 2 bên, chưa dùng thuốc | `[AVOID] RASi` + khởi trị `Amlodipine` | ✅ PASS |
| `ADV_HTN_38` | Out / INTL | Hẹp ĐM thận 2 bên ĐANG UỐNG `Perindopril` | `STOP = 0, Alerts = 0`, khuyên gộp SPC với Perindopril! | ❌ FAIL (`R3-HTN-06`) |
| `ADV_HTN_39` | Out / INTL | `K⁺ = 5.8 mmol/L`, chưa dùng thuốc | `[AVOID] RASi` + khởi trị `Amlodipine` | ✅ PASS |
| `ADV_HTN_40` | Out / INTL | `K⁺ = 5.8 mmol/L` đang uống `Losartan + Amlo + Inda` | `[HOLD] Losartan` + `[AVOID] Spiro` + `[START] Bisoprolol` | ⚠️ Kê thêm BB khi đang tăng K⁺ |
| `ADV_HTN_41` | Out / INTL | `K⁺ = 6.3 mmol/L` cấp cứu trên 3 thuốc | `STOP` Perindopril + `REFER`, nhưng vẫn `START` Bisoprolol! | ❌ FAIL (`R3-HTN-06`) |
| `ADV_HTN_42` | Out / INTL,VN,US | Gút (`uric 540`) đang uống `HCTZ 25`, HA `152/94` | Không `SWITCH` HCTZ, bảo gộp thêm Amlodipine vào HCTZ! | ❌ FAIL (`R3-HTN-14`) |
| `ADV_HTN_43` | Out / INTL | Gút (`uric 530`) đang uống `HCTZ 25`, HA `126/78` | Không khuyên đổi HCTZ sang Losartan/CCB (`SWITCH: 0`) | ❌ FAIL (`R3-HTN-14`) |
| `ADV_HTN_44` | Out / INTL | Gút đang uống `Perindopril + Amlodipine`, HA `154/96` | Kê thẳng `[START] Indapamide 1.5 mg` không cảnh báo gút! | ❌ FAIL (`R3-HTN-14`) |
| `ADV_HTN_45` | Out / INTL,VN,US | Mang thai đang uống `Perindopril + HCTZ + Spiro` | `STOP` Perindopril & Spiro, nhưng BỎ LỌT `HCTZ` + sai đích HA! | ❌ FAIL (`R3-HTN-07`) |
| `ADV_HTN_46` | Out / INTL | Mang thai + Trầm cảm nặng + Bệnh gan tiến triển | Kê mù `[START] Methyldopa` chống chỉ định + sai đích HA! | ❌ FAIL (`R3-HTN-07`) |
| `ADV_HTN_47` | Out / INTL,US | Mang thai + CKD, HA `148/92` | Đặt đích `< 120 mmHg` (KDIGO) cho thai phụ! | ❌ FAIL (`R3-HTN-07`) |
| `ADV_HTN_48` | Out / INTL,VN,US | Tiền sản giật nặng ngoại trú, HA `165/112` | **`START = 0, REFER = 0, Alerts = 0`** (bỏ mặc sản phụ)! | ❌ FAIL (`R3-HTN-02`) |
| `ADV_HTN_49` | Out / INTL,VN,US | Thai phụ ngoại trú HA `165/112` (`≥ 160/110`!) | `REFER = 0`, chỉ kê Methyldopa uống ngoại trú! | ❌ FAIL (`R3-HTN-02`) |
| `ADV_HTN_50` | Inp / INTL,VN,US | Thai phụ nội viện HA `175/115` (chưa tick TSG) | **`Actions(NONE)` — rỗng hoàn toàn 0 khuyến cáo!** | ❌ FAIL (`R3-HTN-02`) |
| `ADV_HTN_51` | Inp / INTL,VN,US | Tiền sản giật nặng nội viện HA `165/112` | `[START] Labetalol IV + MgSO4`, đích `< 160/105` | ✅ PASS |
| `ADV_HTN_52` | Inp / INTL | Tiền sản giật nặng nội viện HA `185/122` | Kê chồng **CẢ `Nicardipine IV` LẪN `Labetalol IV`**! | ❌ FAIL (`R3-HTN-01`) |
| `ADV_HTN_53` | Inp / INTL | Tiền sản giật nặng + Hen phế quản, HA `185/115` | `merge.ts` nuốt sạch thẻ TSG -> **MẤT Y LỆNH `MgSO4`**! | ❌ FAIL (`R3-HTN-01`) |
| `ADV_HTN_54` | Inp / INTL,VN,US | THA khẩn cấp `195/115` không HMOD | `[CONTINUE]` tối ưu thuốc uống, cấm tiêm bolus IV | ✅ PASS |
| `ADV_HTN_55` | Inp / INTL,VN,US | Bóc tách ĐMC cấp `200/110, HR 96` + Hen phế quản | Kê Esmolol + gợi ý Labetalol, `Alerts = 0`, thiếu Diltiazem | ❌ FAIL (`R3-HTN-03`) |
| `ADV_HTN_56` | Inp / INTL | Bóc tách ĐMC cấp `200/110, HR 46` | `[MONITOR]` không nạp thêm Esmolol + `[START] Nicardipine` | ✅ PASS |
| `ADV_HTN_57` | Inp / INTL | Bóc tách ĐMC cấp `165/95, HR 48` | `START = 0`! Không truyền Nicardipine hạ SBP `< 120`! | ❌ FAIL (`R3-HTN-03`) |
| `ADV_HTN_58` | Inp / INTL,VN,US | Phù phổi cấp `210/120` + `Sildenafil` + `Metoprolol` | Chặn NTG + chặn BB, nhưng rationale Rule 1 gợi ý Labetalol! | ❌ FAIL (`R3-HTN-01`) |
| `ADV_HTN_59` | Inp / INTL | Phù phổi cấp `170/105` + `Sildenafil` | Chặn NTG nhưng `START = 0` (không có thuốc thay thế)! | ❌ FAIL (`R3-HTN-16`) |
| `ADV_HTN_60` | Inp / INTL,VN,US | Đột quỵ thiếu máu não `195/105` không rtPA | `[HOLD]` bảo tồn tưới máu não (`≤ 220/120`) | ✅ PASS |
| `ADV_HTN_61` | Inp / INTL | Đột quỵ thiếu máu não `228/126` không rtPA | `merge.ts` nuốt mất đích hạ thận trọng `-15% MAP`! | ❌ FAIL (`R3-HTN-01`) |
| `ADV_HTN_62` | Inp / INTL,VN,US | Đột quỵ thiếu máu não `195/105` CÓ rtPA | `merge.ts` nuốt mất đích `< 185/110` trước rtPA! | ❌ FAIL (`R3-HTN-01`) |
| `ADV_HTN_63` | Inp / INTL | Đột quỵ thiếu máu não `182/102` CÓ rtPA (đã đạt `≤ 185/110`) | Rule 1 đè `MONITOR`, kê nhầm **`[START] Nicardipine IV`**! | ❌ FAIL (`R3-HTN-01`) |
| `ADV_HTN_64` | Inp / INTL,VN,US | Xuất huyết não cấp (ICH) `215/115` | `merge.ts` nuốt mất cửa sổ đích `130–180 mmHg`! | ❌ FAIL (`R3-HTN-01`) |
| `ADV_HTN_65` | Inp / INTL,VN,US | Xuất huyết não cấp (ICH) `145/85` | `[MONITOR]` duy trì dải `130–180 mmHg` | ✅ PASS |
| `ADV_HTN_66` | Inp / INTL | Xuất huyết não cấp (ICH) `124/76` (`< 130`) | `[HOLD]` ngừng hạ áp do dưới ngưỡng an toàn `130` | ✅ PASS |
| `ADV_HTN_67` | Inp / INTL | Xuất huyết não cấp (ICH) đúng biên `180/105` | Rule 1 đè `MONITOR`, kê nhầm **`[START] Nicardipine IV`**! | ❌ FAIL (`R3-HTN-01`) |
| `ADV_HTN_68` | Inp / INTL | Hội chứng vành cấp `< 24h`, HA `195/110, HR 98` | Kê nhầm **`[START] Nicardipine IV` đơn trị** (thiếu NTG + BB)! | ❌ FAIL (`R3-HTN-10`) |
| `ADV_HTN_69` | Out / INTL | Đột quỵ nhồi máu não cấp ngoại trú, HA `175/102` | `REFER = 0`, kê viên uống `RASi + Amlodipine SPC`! | ❌ FAIL (`R3-HTN-09`) |
| `ADV_HTN_70` | Out / INTL | Đa bệnh `htn + hf` (HFrEF EF `30%`, HA `158/96`) | Kê chồng **`Sacubitril/Valsartan` + `RASi + Amlodipine SPC`**! | ❌ FAIL (`R3-HTN-05`) |
| `ADV_HTN_71` | Out / INTL | Tiền sử phù mạch đang uống `Sacubitril/Valsartan` | `[STOP] ARNI`, nhưng Bước 1 bảo gộp Amlodipine với RASi! | ❌ FAIL (`R3-HTN-06`) |
| `ADV_HTN_72` | Out / INTL,VN,US | Nguy cơ rất cao đang uống 2 thuốc, HA `135/84` | Đích `< 130/80` nhưng `step2` không chạy (vùng mù `< 140/90`) | ❌ FAIL (`R3-HTN-15`) |
| `ADV_HTN_73` | Out / INTL | Hạ kali máu nặng `K⁺ = 2.8` đang uống `HCTZ 25` | Không `HOLD`/`STOP` HCTZ, không có Red Flag `K⁺ < 3.0`! | ❌ FAIL (`R3-HTN-11`) |
| `ADV_HTN_74` | Out / INTL | `avBlock2or3` + `HR = 44` uống `Bisoprolol + Diltiazem` | `HOLD` Diltiazem nhưng Bước 1 bảo gộp Perindopril + CCB hiện tại! | ❌ FAIL (`R3-HTN-06`) |
| `ADV_HTN_75` | Inp / INTL,VN,US | Bệnh não THA `215/125` | `merge.ts` nuốt mất tốc độ giảm `20–25% MAP` giờ đầu! | ❌ FAIL (`R3-HTN-01`) |
| `Preset 1` | Out / INTL,VN,US | `htn_preset_grade2_dual_spc` | Đúng phác đồ nhưng `title` lặp chữ liều + ẩn RASi dưới `amlodipine` | ⚠️ (`R3-HTN-05`, `18`) |
| `Preset 2` | Out / INTL,VN,US | `htn_preset_resistant_spiro` | Khởi trị Spironolactone 25 mg chuẩn trên cả 3 profile | ✅ PASS |
| `Preset 3` | Out / INTL,VN,US | `htn_preset_gout_caution` | INTL/US đúng; **VN mất sạch Losartan / cảnh báo Thiazide**! | ❌ FAIL (`R3-HTN-14`) |
| `Preset 4` | Out / INTL,VN,US | `htn_preset_elderly_monotherapy` (86 tuổi) | INTL/VN nới lỏng `< 140`; **US ép đích `< 130/80 mmHg`**! | ❌ FAIL (`R3-HTN-13`) |
| `Preset 5` | Out / INTL,VN,US | `htn_preset_pregnancy_safe` (Thai kỳ) | **INTL ép đích `120–129/70–79`, US ép đích `< 130/80`**! | ❌ FAIL (`R3-HTN-07`) |

---

## 5. Kết luận Duyệt Vòng 1 (Reviewer R3)

Với **11 phát hiện mức `critical`** (có nguy cơ gây tai biến nặng hoặc tử vong nếu bác sĩ/người dùng làm theo y lệnh hệ thống) và **6 phát hiện mức `major`**, module Tăng huyết áp (`htn`) **chưa đạt ngưỡng an toàn lâm sàng để phát hành**.

**KẾT LUẬN: FAIL** *(11 critical, 6 major, 1 minor, 1 suggestion)*
