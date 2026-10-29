# Báo cáo Kiểm thử Đối kháng An toàn Lâm sàng Độc lập — Vòng 2 (Reviewer R3)
## Phân hệ: Rung nhĩ (`af` — Atrial Fibrillation / AF-CARE)

- **Người đánh giá**: Reviewer R3 — Independent Adversarial Clinical Safety Tester (Vòng 2)
- **Phạm vi kiểm định**: Toàn bộ `src/modules/af/*`, `kb/thresholds/af.json`, `kb/citations/af.json`, `kb/drugs/*`, `kb/interactions/*`, cùng tầng máy tính liều & an toàn dùng chung (`src/engine/calculators/{doacDose,cha2ds2va,crcl}.ts`, `src/engine/units.ts`, `src/engine/types.ts`, `src/engine/safety/*`, `src/engine/mergeConflictGroups.ts`).
- **Phương pháp thực nghiệm**: Thực thi trực tiếp **83 kịch bản lâm sàng đối kháng (`S01`–`S83`)** đi xuyên qua hàm `evaluate(patient, settings)` thật (nạp qua Vite SSR runtime, kiểm tra đầy đủ cả 3 hồ sơ hướng dẫn `INTL`, `VN`, `US`, cả 2 bối cảnh `outpatient` / `inpatient`, cả 2 hệ đơn vị `µmol/L` / `mg/dL`, và phối hợp đa chuyên khoa `af + hf + ckd + htn + dm2 + copd + gout + lipid`).
- **Tính độc lập**: Tuân thủ tuyệt đối quy chế mù đôi — không đọc bất kỳ tệp đánh giá Vòng 2 nào của R1 hay R2.

---

## 1. Tổng quan Kết quả Kiểm định & Thống kê Lỗi

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã định danh | Ý nghĩa theo `REVIEW_PROTOCOL.md` |
| :--- | :---: | :--- | :--- |
| **Critical** | **12** | `AF-R2-R3-01` → `AF-R2-R3-12` | Nguy cơ gây hại lâm sàng trực tiếp, đe dọa tính mạng (rung thất trên WPW, kê DOAC giữa xuất huyết não cấp, quá liều gấp đôi Apixaban do lỗi đơn vị `mg/dL`, lọc máu dùng Dabigatran 150 mg BID, bỏ lọt QTc 530 ms / K+ 2.8 mmol/L, mâu thuẫn DDI DOAC, kê chồng lên Sintrom/Enoxaparin, mù dị ứng phản vệ...) |
| **Major** | **9** | `AF-R2-R3-13` → `AF-R2-R3-21` | Sai lệch phác đồ đáng kể (cộng đúp `CHA₂DS₂-VA` & dừng nhầm nhóm IC ở đột quỵ/PAD, lỗi Preset 5 & liều uống RVR cấp + cảnh báo DDI giả, chặn nhầm xơ gan Child-Pugh A, 4 sai lệch hồ sơ `US`/FDA, bỏ lọt `ticagrelor`/`clopidogrel`, bỏ sót chống đông chuyển nhịp ngoại trú, gộp chung Mang thai / Cho con bú...) |
| **Minor** | **4** | `AF-R2-R3-22` → `AF-R2-R3-25` | Chưa hoàn thiện nhánh chu phẫu VKA, gợi ý `dronedarone` Class I cho HCM, chưa siết đích `< 80 bpm` khi còn triệu chứng EHRA III–IV, thiếu nhận diện cường giáp cấp |
| **Suggestion** | **2** | `AF-R2-R3-26` → `AF-R2-R3-27` | Cải tiến trường biểu mẫu `af/inputs.ts` và tách kiểm tra DDI giữa thuốc kê chính thức với thẻ tham khảo `CONSIDER` |
| **Tổng cộng** | **27** | `27 findings` / `83 live scenarios` | **Phán quyết bắt buộc: `FAIL`** (`12 critical > 0`, `9 major > 0`) |

---

## 2. Đối chiếu Kết quả Khắc phục sau Vòng 1 (Round 1 Regression & Fix Audit)

Qua chạy thực nghiệm đối chứng, nhiều lỗi nghiêm trọng từ Vòng 1 đã được đội phát triển sửa tốt, song một số bản vá mới chỉ giải quyết bề nổi hoặc tạo hiệu ứng phụ dây chuyền:

1. **Đã sửa triệt để (Verified Fixed)**:
   - `R3-AF-01` (Nội viện RVR thiếu `LVEF` kê nhầm Diltiazem): Đã kiểm chứng tại **`S31`** (`lvef: undefined`, nội viện HR 145 bpm) — hệ thống đã fail-closed an toàn, không còn kê mù Diltiazem IV.
   - `R3-AF-03` (Gán cứng `drugId: 'diltiazem'` khi dừng `verapamil` ở HFrEF): Đã kiểm chứng tại **`S34`** (`LVEF 30%`, đang dùng `verapamil`) — xuất đúng `[STOP] drug=verapamil`.
   - `R3-AF-05` (Quên `isDoseReduced = true` cho Dabigatran ở `CrCl 30–49 mL/min` trên hồ sơ `INTL`/`VN`): Đã kiểm chứng tại **`S04`** — đã hạ đúng xuống `110 mg x 2 lần/ngày` ở hồ sơ `INTL`/`VN` (tuy nhiên phát sinh lỗi ở hồ sơ `US` — xem `AF-R2-R3-16`).
   - `R3-AF-07` (`periprocedural_doac_hold` bị khóa cứng ở `inpatient`): Đã kiểm chứng tại **`S81`** (`setting: 'outpatient'`, phòng khám tiền mê ngoại trú) — đã phát đúng `[HOLD] Apixaban 48 giờ` ở cả ngoại trú lẫn nội trú.
2. **Sửa một phần hoặc gây hồi quy mới (Partial Fix / Regression)**:
   - `R3-AF-04` (Ánh xạ `ascvd` cho `CHA₂DS₂-VA`): Bản vá đưa cả `'strokeOrTia'` và `'pad'` vào `CONDITION_SYNONYM_GROUPS.ascvd`, vô tình làm **cộng đúp +1 điểm `CHA₂DS₂-VA`** ở bệnh nhân đột quỵ đơn độc (`S11`: điểm 3 thay vì 2) và **phát lệnh `[STOP]` sai Flecainide/Propafenone vì "Bệnh mạch vành"** ở bệnh nhân chỉ bị đột quỵ hoặc PAD ngoại biên (`S11`, `S12` — `AF-R2-R3-13`).
   - `R3-AF-02` (Thai kỳ): Đã chặn DOAC và dừng Warfarin ở thai phụ rung nhĩ không van tim (`S67`), nhưng lại **dừng nhầm ngang Warfarin ngoại trú ở thai phụ mang van tim cơ học** (`S68` — `AF-R2-R3-11`), **bỏ lọt hoàn toàn `acenocoumarol` (Sintrom) gây quái thai** (`S82` — `AF-R2-R3-06`), và **đảo ngược chỉ định khi cho con bú** (`S70` — `AF-R2-R3-21`).
   - `R3-AF-06` (Sốc tụt huyết áp ngoại trú): Đã phát lệnh `[REFER]` cấp cứu, nhưng vẫn đồng thời kê viên uống `[START] Apixaban 5 mg BID` + hẹn triệt đốt PVI ngay giữa cơn sốc tim, in sai `"SBP 95 < 90 mmHg"`, và quên `[HOLD]` `digoxin` (`S24`, `S25` — `AF-R2-R3-18`).

---

## 3. Ma trận 83 Kịch bản Kiểm thử Đối kháng Thực nghiệm (`S01`–`S83`)

| Nhóm kiểm thử | Kịch bản (`ID`) | Trọng tâm tấn công đối kháng | Kết quả thực nghiệm |
| :--- | :--- | :--- | :--- |
| **A. Presets & Biên liều DOAC / Đơn vị** | `S01`–`S10`, `S78`, `S79` | 5 ca mẫu UI (`presets.ts`), chuẩn ABC Apixaban ở `µmol/L` vs `mg/dL` (`1.50 mg/dL`), Cockcroft-Gault béo phì thiếu chiều cao, biên `CrCl = 50.0` & `CrCl > 95` ở `US` | Phát hiện lỗi chí mạng `1.5 mg/dL -> 132.6 < 133` (`S07`, `S09`), Preset 5 mất `inpatient` (`S05`), béo phì `115 kg` tăng liều sai (`S10`), lỗi FDA `CrCl = 50` & `> 95` (`S78`, `S79`) |
| **B. Điểm `CHA₂DS₂-VA`, Van tim & Bệnh cơ tim đặc biệt** | `S11`–`S20`, `S76`, `S77` | Đột quỵ đơn độc, PAD đơn độc, nữ giới `CHA₂DS₂-VA = 0`, hẹp hai lá, van cơ học, HCM (`hcm` vs `hypertrophicCardiomyopathy`), Amyloidosis (`amyloidosis` vs `cardiacAmyloidosis`), `US` DOAC | Lộ lỗi cộng đúp `CHA₂DS₂-VA` + dừng nhầm IC (`S11`, `S12`), mù khóa `hcm`/`amyloidosis` (`S16`, `S17`), tiếp tục kê Diltiazem/Digoxin trên Amyloidosis (`S77`), 4 lỗi hồ sơ `US` (`S18`–`S20`) |
| **C. Cấp cứu Huyết động, WPW & Cổng Fail-Closed** | `S21`–`S35` | WPW + AF (`S21`–`S23`), sốc tim ngoại/nội trú (`S24`, `S25`), suy nút xoang / blốc AV II–III (`S27`), khuyết `sbp`/`scr`/`lvef`/`weight` (`S29`–`S31`), COPD cấp dùng `propranolol` (`S33`), HFrEF/sung huyết (`S34`, `S35`) | Kê Beta-blocker/Diltiazem/Verapamil và giữ Digoxin trên WPW (`S21`–`S23`), kê Bisoprolol trên blốc AV II–III (`S27`) & sung huyết cấp (`S35`), giữ Propranolol ở COPD SpO2 86% (`S33`), fail-open khi thiếu `sbp` (`S29`) |
| **D. Kiểm soát Nhịp, QTc & Rối loạn Điện giải** | `S36`–`S42` | Chuyển đổi rung nhĩ vĩnh viễn dừng AAD, Flecainide ở `CrCl < 35`, Dronedarone ở HFrEF/suy gan, Sotalol ở `QTc = 530 ms` (`S41`), hạ Kali `K+ = 2.8 mmol/L` trên Sotalol + Digoxin (`S42`) | Bỏ lọt hoàn toàn `QTc = 530 ms` không dừng Sotalol (`S41`), không tạm ngưng Digoxin và còn gợi ý Amiodarone khi `K+ = 2.8 mmol/L` (`S42`) |
| **E. Xuất huyết Cấp, Lọc máu, Gan & APS** | `S43`–`S51` | Xuất huyết não cấp (`S43`), xuất huyết tiêu hóa nặng (`S44`), tiểu cầu `22 G/L` (`S45`), APS nguy cơ cao (`S46`), chạy thận nhân tạo `SCr = 115` sau lọc (`S47`, `S48`), xơ gan Child-Pugh A/B/C (`S49`–`S51`) | Kê/duy trì DOAC giữa xuất huyết não & tiêu hóa cấp (`S43`–`S45`), chạy thận nhân tạo được duy trì Dabigatran 150 mg BID (`S48`), APS duy trì Rivaroxaban (`S46`), chặn/dừng sai ở Child-Pugh A (`S49`, `S50`) |
| **F. Tương tác Thuốc DDI, Kháng tiểu cầu & Sintrom/LMWH** | `S52`–`S63`, `S80` | Edoxaban + Dronedarone (`S52`), Apixaban + Ritonavir (`S54`), Rivaroxaban + Itraconazole (`S55`), Carbamazepine + DOAC (`S56`), Dabigatran + Dronedarone (`S57`), ACS/CAD + `ticagrelor`/`clopidogrel` (`S59`, `S60`, `S80`), `acenocoumarol` & `enoxaparin` (`S61`–`S63`) | 5 mâu thuẫn chí mạng giữa lệnh kê DOAC và cảnh báo DDI (`S52`–`S57`), bỏ lọt `ticagrelor` & `clopidogrel` (`S59`, `S60`, `S80`), kê chồng Apixaban/Warfarin lên Sintrom & Enoxaparin (`S61`–`S63`) |
| **G. Chu phẫu, Chuyển nhịp, Thai kỳ, Cho con bú & Dị ứng** | `S64`–`S70`, `S81`–`S83` | Ngưng DOAC tiền phẫu (`S64`, `S65`, `S81`), chuyển nhịp ngoại trú `≥ 48h` ở `CHA₂DS₂-VA = 0` (`S66`), thai kỳ không van vs van cơ học vs Sintrom (`S67`, `S68`, `S82`), cho con bú (`S70`), phản vệ `apixaban` (`S83`) | Bỏ sót OAC quanh chuyển nhịp ngoại trú (`S66`), dừng ngang Warfarin ở thai phụ van cơ học (`S68`), bỏ lọt Sintrom ở thai phụ (`S82`), kê Apixaban khi cho con bú (`S70`) và khi dị ứng phản vệ Apixaban (`S83`) |
| **H. Phân tích Liều/Đơn vị & Đa chuyên khoa Phức hợp** | `S71`–`S75` | Đơn vị `'viên'` (`S71`), tần suất `'1 lần/ngày'` cho Apixaban (`S72`), chạy đồng thời 6–8 module (`af + hf + ckd + htn + dm2 + copd + gout + lipid`) (`S73`, `S74`), cường giáp cấp (`S75`) | Lọt cả quá liều `'1 viên'` lẫn thiếu nửa liều `'1 lần/ngày'` (`S71`, `S72`); đa chuyên khoa gộp nhóm thuốc chạy ổn định không sập nhưng mang theo các lỗi an toàn nền của AF |

---

## 4. Phân tích Chi tiết Các Phát hiện (`Findings`)

### 4.1. Nhóm Mức độ Nghiêm trọng Chí mạng (`CRITICAL` — 12 phát hiện)

#### [AF-R2-R3-01] Bỏ sót hoàn toàn Hội chứng Kích thích sớm / Wolff-Parkinson-White kèm Rung nhĩ (`wpw` / `wpw_afib`): Kê trực tiếp thuốc ức chế nút nhĩ-thất gây Rung thất đột tử
- **Mức độ**: `critical` | **Loại**: `missing` | **Đối tượng**: `af.rate_rhythm.pre_excited_wpw_guard`
- **Bằng chứng thực nghiệm**:
  - **`S21`** (Ngoại trú, nam 29 tuổi, `conditions: { af: true, wpw: true, wpw_afib: true, preExcitedAf: true }`, HR 148 bpm, SBP 118 mmHg, LVEF 60%): `evaluate()` xuất **`[START] (af/rec_af_rate_preserved_ef) drug=bisoprolol | dose="1.25 mg x 1 lần/ngày (uống)"`**, `alerts = 0`.
  - **`S22`** (Nội viện RVR, HR 165 bpm, `wpw: true, wpw_afib: true`): xuất **`[START] (af/rec_af_acute_rate_preserved) drug=diltiazem`** + **`[CONSIDER] bisoprolol`**.
  - **`S23`** (Ngoại trú, `wpw: true, wpw_afib: true`, HR 115 bpm, đang dùng `digoxin 0.125 mg + verapamil 120 mg`): xuất **`[UPTITRATE] verapamil`** và giữ nguyên `digoxin` (`0` lệnh `STOP`), dù chính `kb/drugs/digoxin.json` (dòng 110–115, `fda.hf.digoxin_wpw_af`) đã khai báo `"code": "wpw_afib"` là chống chỉ định tuyệt đối!
- **Cơ chế bệnh sinh & Nguyên nhân gốc**: Ở rung nhĩ dẫn truyền trước qua đường phụ (pre-excited AF), mọi thuốc ức chế nút AV (Beta-blocker, Diltiazem, Verapamil, Digoxin, Amiodarone IV) đều thuộc **Class III (Harm)** theo ESC 2024 AF (Section 7) và ACC/AHA 2023 (Section 7.2.2) vì làm mất cạnh tranh dẫn truyền ẩn tại nút AV và rút ngắn thời kỳ trơ đường phụ, biến rung nhĩ thành **rung thất (VF)**. Hiện cả `src/modules/af/*` lẫn `src/engine/safety/*` đều chưa kiểm tra `wpw` / `wpw_afib`.
- **Khuyến nghị sửa lỗi**: Bổ sung khóa chuẩn `wpw` (đồng nghĩa `wpw_afib`, `preExcitedAf`) vào `src/engine/types.ts` và `src/modules/af/inputs.ts`; phát lệnh `[STOP]` khẩn cấp mọi thuốc chẹn nút AV đang dùng, chặn toàn bộ nhánh kê Beta-blocker/CCB/Digoxin/Amiodarone, và hướng dẫn sốc điện đồng bộ (nếu bất ổn huyết động) hoặc Ibutilide/Procainamide IV (hoặc Flecainide/Propafenone khi không có bệnh tim cấu trúc) + `[REFER]` triệt đốt đường phụ qua catheter.

#### [AF-R2-R3-02] Kê mới và duy trì DOAC liều chuẩn ngay trên bệnh nhân đang Xuất huyết nội sọ cấp (`acuteIntracerebralHemorrhage`), Xuất huyết tiêu hóa nặng (`activeBleeding`) và Tiểu cầu `22 G/L`
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: `af.oac.active_bleeding_ich_thrombocytopenia_guard`
- **Bằng chứng thực nghiệm**:
  - **`S43`** (Nội viện, `acuteIntracerebralHemorrhage: true` — khóa chuẩn có sẵn tại `src/engine/types.ts:90,335`, `activeBleeding: true`, `labs.hb = 6.8 g/dL`, `CHA₂DS₂-VA = 4`): xuất **`[START] (af/rec_af_oac_high_risk) Apixaban 5 mg x 2 lần/ngày`**, `alerts = 0`.
  - **`S44`** (Nội viện, xuất huyết tiêu hóa nặng đang diễn tiến `activeBleeding: true`, `labs.hb = 6.5 g/dL`, đang dùng `rivaroxaban 20 mg`): xuất **`[CONTINUE] Rivaroxaban 20 mg x 1 lần/ngày`**, `alerts = 0`.
  - **`S45`** (Ngoại trú, giảm tiểu cầu rất nặng `labs.platelets = 22 G/L`, đang dùng `apixaban 5 mg BID`): xuất **`[CONTINUE] Apixaban 5 mg x 2 lần/ngày`**, `alerts = 0`.
- **Khuyến nghị sửa lỗi**: Đặt rào chắn đầu bảng trong `src/modules/af/rulesOac.ts` và `src/engine/safety/gates.ts`: khi có `acuteIntracerebralHemorrhage`, `activeBleeding`, `majorBleeding` hoặc `platelets < 50 G/L`, lập tức phát `[STOP]`/`[HOLD]` toàn bộ thuốc chống đông kèm hướng dẫn thuốc hóa giải đặc hiệu (`Idarucizumab` cho Dabigatran; `Andexanet alfa` hoặc `4F-PCC` cho ức chế Xa; `Vitamin K IV + 4F-PCC` cho VKA theo ESC 2024 Section 6.5).

#### [AF-R2-R3-03] Lọc máu chu kỳ (`onDialysis = true`) có Creatinin sau lọc thấp vượt mặt toàn bộ cổng thận: Duy trì `Dabigatran 150 mg x 2 lần/ngày` không một lời cảnh báo
- **Mức độ**: `critical` | **Loại**: `drug` | **Đối tượng**: `src/engine/calculators/doacDose.ts` & `kb/drugs/*.json`
- **Bằng chứng thực nghiệm**:
  - **`S47`** (`Profile: INTL`, nam 64 tuổi, `onDialysis: true`, `scr = 115 µmol/L` lấy sau buổi chạy thận -> Cockcroft-Gault tính máy móc `CrCl = 51.4 mL/min`): xuất **`[START] Apixaban 5 mg x 2 lần/ngày`** (`"CrCl 51.4 ≥ 15: Đủ điều kiện chức năng thận"`).
  - **`S48`** (`Profile: INTL`, `onDialysis: true`, `scr = 115 µmol/L` sau lọc, đang uống `dabigatran 150 mg BID`): xuất **`[CONTINUE] Dabigatran 150 mg x 2 lần/ngày`**, `alerts = 0`!
- **Nguyên nhân gốc**: Cả 4 tệp `kb/drugs/{apixaban,rivaroxaban,dabigatran,edoxaban}.json` đều thiếu `{"code": "dialysis"}` trong `contraindications`, và `rulesOac.ts` / `doacDose.ts` chỉ kiểm tra con số `crcl < 15` / `crcl < 30` mà không kiểm tra `hasCondition(ctx, 'onDialysis')`.
- **Khuyến nghị sửa lỗi**: Truyền `onDialysis` vào `computeDoacDose()` và `rulesOac.ts`: vô hiệu hóa hoàn toàn giá trị `CrCl` giả tạo sau lọc máu; chống chỉ định tuyệt đối (`[STOP]`) Dabigatran và Edoxaban ở mọi hồ sơ; chặn khởi trị DOAC thường quy ở hồ sơ `INTL`/`VN` (hội chẩn chuyên khoa Thận – Tim mạch).

#### [AF-R2-R3-04] Bỏ lọt Kéo dài khoảng QT nặng (`QTc = 530 ms > 500 ms`) và Hạ Kali máu nặng (`K+ = 2.8 mmol/L`) trên bệnh nhân dùng `Sotalol` / `Digoxin` / `Amiodarone`
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: `af.rhythm.stop_sotalol_contra` & `src/engine/safety/gates.ts`
- **Bằng chứng thực nghiệm**:
  - **`S41`** (`labs.qtc = 530`, `qt_prolongation: true`, đang dùng `sotalol 80 mg BID`): **`0` lệnh `[STOP]`/`[HOLD]` cho Sotalol** dù chính `kb/drugs/sotalol.json` (dòng 96–126) đã định nghĩa `gate_sotalol_qt` (`qtc > 500 -> contra`) và `esc.af.2024.aad_sotalol_rec` yêu cầu ngưng Sotalol ngay khi `QTc > 500 ms`.
  - **`S42`** (`labs.k = 2.8 mmol/L`, LVEF 35%, đang dùng `sotalol + digoxin`): không tạm ngưng `digoxin` dù `K+ = 2.8 mmol/L` gây ngộ độc Digitalis tối cấp, lại còn phát **`[CONSIDER] Amiodarone 200 mg x 3 lần/ngày`** ngay trên nền hạ Kali nặng gây xoắn đỉnh!
- **Khuyến nghị sửa lỗi**: Bổ sung kiểm tra `qtc > 500` và `qt_prolongation` vào `af.rhythm.stop_sotalol_contra` và `gates.ts`/`reviewMeds.ts`; khi `labs.k < 3.5 mmol/L`, phát `[HOLD]` Digoxin & Sotalol kèm yêu cầu bù Kali đạt `≥ 4.0 mmol/L` trước khi dùng nhóm III hoặc Digoxin.

#### [AF-R2-R3-05] Năm mâu thuẫn chí mạng giữa lệnh kê DOAC của module AF và tương tác thuốc DDI (`Edoxaban + P-gp`, `Apixaban + Ritonavir`, `Rivaroxaban + Itraconazole`, `DOAC + Carbamazepine`, `Dabigatran + Dronedarone`)
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: `src/modules/af/rulesHelpers.ts` & `rulesOac.ts`
- **Bằng chứng thực nghiệm**:
  1. **`S52`** (`edoxaban 60 mg + dronedarone 400 mg BID`, CrCl 78): xuất **`[CONTINUE] Edoxaban 60 mg ("bắt buộc dùng liều chuẩn đầy đủ")`** thay vì giảm xuống `30 mg OD` (`esc.af.2024.table11_doac_dosing`) do `resolveAfDoacDose` (`rulesHelpers.ts:93-109`) quên truyền `potentPgpInhibitor: true` vào `computeDoacDose`!
  2. **`S54`** (`apixaban 5 mg BID + ritonavir`): xuất **`[CONTINUE] Apixaban 5 mg BID`** thay vì giảm 50% xuống `2.5 mg BID` (`fda.apixaban.strong_cyp3a4_pgp_dose_reduction`).
  3. **`S55`** (`rivaroxaban 20 mg + itraconazole`): xuất **`[CONTINUE] Rivaroxaban 20 mg`** bất chấp chống chỉ định `[critical] ix.rivaroxaban_strong_inhibitors`.
  4. **`S56`** (Rung nhĩ mới mắc `CHA₂DS₂-VA = 3` đang dùng `carbamazepine 400 mg BID`): xuất **`[START] Apixaban 5 mg BID`** bất chấp cảm ứng mạnh làm giảm > 50% nồng độ DOAC gây nhồi máu não (`[critical] ix.doac_strong_inducers`, bắt buộc dùng `warfarin`).
  5. **`S57`** (`dabigatran 150 mg BID + dronedarone`): xuất **`[CONTINUE] Dabigatran 150 mg BID`** bất chấp chống chỉ định phối hợp (`ix.dabigatran_dronedarone`).
- **Khuyến nghị sửa lỗi**: Nối trực tiếp danh mục thuốc ức chế P-gp mạnh, ức chế kép CYP3A4/P-gp mạnh và cảm ứng mạnh CYP3A4/P-gp vào `resolveAfDoacDose` và `rulesOac.ts` để tự động chỉnh liều hoặc chuyển đổi thuốc thống nhất 100% với tầng DDI.

#### [AF-R2-R3-06] Mù hoàn toàn với `Acenocoumarol` (Sintrom) và `Enoxaparin`: Kê chồng thêm Apixaban/Warfarin gây trùng lặp kháng đông (`0` cảnh báo) và bỏ lọt thuốc gây quái thai ở thai phụ
- **Mức độ**: `critical` | **Loại**: `missing` | **Đối tượng**: `acenocoumarol` & `enoxaparin` (`kb/drugs/`, `rulesOac.ts`, `mergeConflictGroups.ts`)
- **Bằng chứng thực nghiệm**:
  - **`S61`** (`Profile: VN`, đang uống `acenocoumarol 2 mg/ngày`, `vkaTtr: 75%`): xuất **`[START] Apixaban 5 mg x 2 lần/ngày`** chồng lên Sintrom, `alerts = 0`.
  - **`S62`** (`Profile: VN`, van cơ học đang uống `acenocoumarol 2 mg/ngày`): xuất **`[START] Warfarin`** chồng lên Sintrom, `alerts = 0`.
  - **`S63`** (Nội viện đang tiêm `enoxaparin 60 mg BID`): xuất **`[START] Apixaban 5 mg BID`** không hướng dẫn ngưng/chuyển tiếp LMWH, `alerts = 0`.
  - **`S82`** (`Profile: VN`, thai phụ `pregnant: true` đang uống `acenocoumarol 2 mg`): **`0` lệnh `[STOP]` Sintrom**, để mặc thai phụ tiếp tục uống thuốc kháng vitamin K gây quái thai!
- **Khuyến nghị sửa lỗi**: Thêm `kb/drugs/acenocoumarol.json` và `kb/drugs/enoxaparin.json`; mở rộng danh sách VKA thành `['warfarin', 'acenocoumarol']` trong toàn bộ `rulesOac.ts`; kiểm tra cả `conditions.onAnticoagulant`; và bổ sung vào `CLASS_CONFLICT_GROUPS.anticoagulants` + `DUPLICATE_CLASS_RULES` + `kb/interactions/anticoagulant.json`.

#### [AF-R2-R3-07] Hai lỗ hổng trên HCM và Cardiac Amyloidosis: Tiếp tục kê `Diltiazem`/`Verapamil` & giữ `Digoxin` trên Amyloidosis (`S77`), và mù khóa đồng nghĩa `hcm`/`amyloidosis` (`S16`, `S17`)
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: `af.oac.hcm_amyloidosis` & `af.rate.preserved_lvef`
- **Bằng chứng thực nghiệm**:
  - **`S77`** (Truyền đúng khóa chuẩn `cardiacAmyloidosis: true`, LVEF 52%, đang dùng `digoxin 0.125 mg + diltiazem 120 mg`): xuất **`[CONTINUE] Duy trì Diltiazem kiểm soát tần số thất`** và bỏ mặc `digoxin` (`0` lệnh `STOP`), bất chấp Digoxin và CCB non-DHP gắn kết sợi amyloid gây blốc tim hoàn toàn, sốc tim và đột tử!
  - **`S16` & `S17`** (Truyền khóa đồng nghĩa phổ biến `hcm: true` hoặc `amyloidosis: true`): hệ thống phát **`[AVOID] Không chỉ định thuốc chống đông dài hạn (CHA₂DS₂-VA = 0)`** (vi phạm Class I `esc.af.2024.hcm_amyloidosis_oac`) và ở `S16` còn phát **`[CONTINUE] Flecainide ("khi không có bệnh tim cấu trúc")`** trên bệnh cơ tim phì đại!
- **Khuyến nghị sửa lỗi**: Đăng ký đồng nghĩa `hcm`/`hocm -> hypertrophicCardiomyopathy` và `amyloidosis`/`attr_cm -> cardiacAmyloidosis` trong `CONDITION_SYNONYM_GROUPS`; thêm luật `[STOP]` và cấm kê `digoxin`, `diltiazem`, `verapamil` khi `hasCondition(ctx, 'cardiacAmyloidosis')`.

#### [AF-R2-R3-08] Sai số làm tròn đơn vị Creatinin hệ Mỹ (`1.5 mg/dL -> 132.6 µmol/L < 133 µmol/L`) gây quá liều gấp đôi `Apixaban 5 mg BID` ở cụ già ≥ 80 tuổi
- **Mức độ**: `critical` | **Loại**: `threshold` | **Đối tượng**: `src/engine/units.ts` & `src/modules/af/rulesHelpers.ts`
- **Bằng chứng thực nghiệm**:
  - **`S07`** (`Profile: INTL`, `units.cr: 'mg_dL'`, 82 tuổi, 70 kg, `scr = 1.5 mg/dL`) và **`S09`** (`Profile: US`, `units.cr: 'mg_dL'`, 81 tuổi, 72 kg, `scr = 1.5 mg/dL`): cả 2 ca đều đủ 2/3 tiêu chuẩn nhãn FDA Eliquis §2.1 (`age ≥ 80` + `SCr ≥ 1.5 mg/dL`, `fda.apixaban.af_dose`), nhưng `evaluate()` lại xuất **`[CONTINUE] Chỉ định liều chuẩn Apixaban: 5 mg x 2 lần/ngày`** thay vì `[REDUCE] 2.5 mg x 2 lần/ngày`!
- **Nguyên nhân gốc**: `crMgDlToUmolL(1.5)` tính `1.5 * 88.4 = 132.6 µmol/L`, rồi `resolveAfDoacDose` ép `scrUnit: 'umol/L'` khiến `computeDoacDose` so sánh `132.6 >= 133` -> `false`.
- **Khuyến nghị sửa lỗi**: Khi `ctx.settings.units.cr === 'mg_dL'`, truyền trực tiếp `ctx.patient.labs.scr` với `scrUnit: 'mg/dL'` vào `computeDoacDose` để đối sánh chính xác `>= 1.5 mg/dL`.

#### [AF-R2-R3-09] Lỗ hổng phân tích liều/đơn vị/tần suất DOAC (`unit: 'viên'` và `freq: '1 lần/ngày'`) bỏ lọt cả quá liều gấp đôi lẫn thiếu 50% liều ngày
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: `src/modules/af/rulesHelpers.ts` (`parseNumericDoseMg`, `resolveDoacCurrentAction`)
- **Bằng chứng thực nghiệm**:
  - **`S71`** (Nữ 84 tuổi, 52 kg, CrCl 27.6 cần `2.5 mg BID`; đơn đang uống `{ drugId: 'apixaban', dose: 1, unit: 'viên', freq: '2 lần/ngày' }`): đọc `1 <= 2.5` -> phát **`[CONTINUE] Duy trì liều giảm hợp lý Apixaban`**, bỏ lọt nguy cơ bệnh nhân đang uống viên 5 mg x 2 lần/ngày!
  - **`S72`** (Nam 70 tuổi, 75 kg, CrCl 78.6 cần `5 mg BID`; đơn đang uống `{ drugId: 'apixaban', dose: 5, unit: 'mg', freq: '1 lần/ngày' }`): đọc `5 >= 5` -> phát **`[CONTINUE] Chỉ định liều chuẩn Apixaban: 5 mg x 2 lần/ngày`**, bỏ lọt việc bệnh nhân chỉ uống 1 lần/ngày (thiếu 50% liều ngừa đột quỵ)!
- **Khuyến nghị sửa lỗi**: Kiểm tra chặt `med.unit` (chỉ nhận số mg khi đơn vị là `'mg'`) và đối chiếu `med.freq` với chế độ liều bắt buộc `BID` vs `OD` của từng DOAC.

#### [AF-R2-R3-10] Kê `Bisoprolol` trên Blốc nhĩ-thất độ II–III / Suy nút xoang chưa có máy tạo nhịp (`S27`), trên Sung huyết phổi cấp (`S35`), và duy trì `Propranolol` ở Đợt cấp COPD suy hô hấp `SpO2 = 86%` (`S33`)
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: `af.rate.preserved_lvef` & `src/engine/safety/gates.ts`
- **Bằng chứng thực nghiệm**:
  - **`S27`** (`av_block_2_3: true, sickSinus: true`, chưa đặt máy tạo nhịp, HR 124 bpm): xuất **`[START] Bisoprolol 1.25 mg`** + **`[CONSIDER] Flecainide`**, `alerts = 0` (nguy cơ vô tâm thu).
  - **`S35`** (Nội viện suy tim cấp sung huyết `congestion: true`, LVEF 48%): xuất **`[START] Bisoprolol 1.25 mg`** đường uống ngay khi phổi đang ứ dịch cấp.
  - **`S33`** (Nội viện đợt cấp COPD `spo2: 86%, isAcuteExacerbation: true`, đang dùng `propranolol 40 mg BID`): xuất **`[CONTINUE] Duy trì propranolol`** đối đầu trực diện với `[critical] ix.bb_non_selective_asthma`.
- **Khuyến nghị sửa lỗi**: Chặn thuốc chẹn nút AV/AAD khi có `av_block_2_3`/`sickSinus` chưa có pacemaker (`[REFER]` đặt máy tạo nhịp); chặn khởi trị mới chẹn beta uống khi `congestion === true` / `acutePulmonaryEdema`; và phát `[STOP]`/`[SWITCH]` cho chẹn beta không chọn lọc (`propranolol`, `nadolol`) trên bệnh nhân hen/đợt cấp COPD nặng.

#### [AF-R2-R3-11] Duy trì `Rivaroxaban` ở Hội chứng Kháng Phospholipid nguy cơ cao (`aps: true`, `S46`) và ra lệnh dừng ngang `Warfarin` ngoại trú ở Thai phụ mang Van tim cơ học (`S68`)
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: `af.oac.pregnancy_contra` & `rulesOac.ts`
- **Bằng chứng thực nghiệm**:
  - **`S46`** (`aps: true, strokeOrTia: true`, đang dùng `rivaroxaban 20 mg`): xuất **`[CONTINUE] Rivaroxaban 20 mg`**, `alerts = 0` (vi phạm Class III Harm của thử nghiệm TRAPS / ESC 2024).
  - **`S68`** (`pregnant: true, mechanicalValve: true`, đang dùng `warfarin 4 mg`): `af.oac.pregnancy_contra` chạy trước `af.oac.mechanical_valve_or_ms` và phát **`[STOP] NGỪNG NGAY Warfarin`** hướng dẫn đổi sang LMWH ngoại trú thông thường, trái với chính `fda.warfarin.pregnancy_contra` (`kb/citations/af.json:834-841`, Category D) và ESC 2025 Pregnancy (nguy cơ huyết khối kẹt van cơ học tử vong).
- **Khuyến nghị sửa lỗi**: Chặn cả 4 DOAC khi có `aps` (`[SWITCH]` sang Warfarin); tách nhánh đặc biệt `pregnant && mechanicalValve` để phát `[REFER]` khẩn cấp Pregnancy Heart Team nội trú thay vì ra lệnh tự ngưng ngang Warfarin tại nhà.

#### [AF-R2-R3-12] Mù hoàn toàn với Dị ứng / Phản vệ thuốc (`patient.allergies`): Kê trực tiếp `[START] Apixaban` cho bệnh nhân có `allergies: ['apixaban']`
- **Mức độ**: `critical` | **Loại**: `missing` | **Đối tượng**: `patient.allergies` (`src/engine/safety/gates.ts`, `reviewMeds.ts`, `rulesHelpers.ts`)
- **Bằng chứng thực nghiệm**: **`S83`** (`allergies: ['apixaban']`, `CHA₂DS₂-VA = 3`): xuất **`[START] Apixaban 5 mg x 2 lần/ngày`**, `alerts = 0`, không chuyển sang DOAC khác hay Warfarin.
- **Khuyến nghị sửa lỗi**: Tích hợp kiểm tra `patient.allergies` ở tầng trung tâm `gates.ts` / `reviewMeds.ts` và lọc bỏ thuốc dị ứng trong `selectPreferredDoac()`.

---

### 4.2. Nhóm Mức độ Nghiêm trọng Lớn (`MAJOR` — 9 phát hiện)

1. **`AF-R2-R3-13` (`CONDITION_SYNONYM_GROUPS.ascvd` gộp nhầm `strokeOrTia` & `pad`)**:
   - Tại **`S11`** (nam 48 tuổi, chỉ có `strokeOrTia: true`, mạch vành bình thường, LVEF 60%, đang dùng `flecainide`), `Derived.cha2ds2va = 2` nhưng module AF cộng đúp thành `CHA₂DS₂-VA = 3`, đồng thời phát lệnh sai **`[STOP] DỪNG NGAY Flecainide: Chống chỉ định ở Bệnh mạch vành`**. Tương tự **`S12`** (`pad: true` đơn độc) bị dừng nhầm `propafenone`.
   - *Fix*: Dùng trực tiếp `ctx.derived.cha2ds2va` cho điểm nguy cơ đột quỵ và chỉ kiểm tra bệnh mạch vành thực sự (`cad`, `recentAcs`, `recurrentAcsWithin2Years`) + bệnh tim cấu trúc cho chống chỉ định nhóm IC.

2. **`AF-R2-R3-14` (Lỗi liên hoàn Cấp cứu RVR nội viện & Preset 5)**:
   - **`S05`**: Ca mẫu Preset 5 (`af_preset_inpatient_rvr_emergency`) thiếu `setting: 'inpatient'` nên bị đưa về `'outpatient'`, tắt sạch luật cấp cứu.
   - **`S06` & `S74`**: Khi bật `setting: 'inpatient'`, khuyến cáo `rec_af_acute_rate_preserved` lại ghi liều viên uống **`"60 mg x 3 lần/ngày (uống)"`** thay vì liều tiêm tĩnh mạch `0.25 mg/kg IV bolus`, đồng thời phát kèm `[CONSIDER] bisoprolol` làm nổ cảnh báo giả `[critical] ix.bb_non_dhp_ccb`.

3. **`AF-R2-R3-15` (Chặn và dừng thuốc sai ở Xơ gan còn bù Child-Pugh A)**:
   - **`S49`** (`liverDisease: true, customInputs.childPugh: 'A'`): phát nhầm **`[DEFER] Chưa xác định phân độ Child-Pugh`**, trì hoãn OAC Class I.
   - **`S50`** (Child-Pugh A đang dùng `rivaroxaban 20 mg`): phát nhầm **`[STOP] Ngừng Rivaroxaban: Chống chỉ định ở Child-Pugh B/C`** dù Child-Pugh A được phép dùng cả 4 DOAC (`fda.rivaroxaban.hepatic_contra`, `acc.af.2023.doac_child_pugh`).
   - **`S51`** (Child-Pugh C): văn bản `rationale` khi dừng `apixaban` vẫn chép câu của Child-Pugh B.

4. **`AF-R2-R3-16` (Bốn sai lệch phác đồ Hoa Kỳ khi chạy `Profile: 'US'`)**:
   - **`S18`**: Giảm nhầm Apixaban xuống `2.5 mg BID` ở `CrCl = 27.2` khi chỉ có 1/3 tiêu chuẩn ABC (FDA giữ `5 mg BID`).
   - **`S19` & `S20`**: Ra lệnh `[STOP]` Dabigatran `75 mg BID` ở `CrCl = 24.9` (FDA cấp phép `75 mg BID` cho `CrCl 15–30`) và kê viên không tồn tại tại Mỹ **`110 mg x 2 lần/ngày`** ở `CrCl = 43.3`.
   - **`S78`**: Tại đúng `CrCl = 50.0 mL/min`, vẫn xuất Rivaroxaban `20 mg` thay vì `15 mg` theo bảng nhãn FDA (`CrCl ≤ 50 mL/min`: 15 mg, `fda.rivaroxaban.af_dose`).
   - **`S79`**: Ở `CrCl = 112.6 > 95 mL/min`, bất chấp **FDA Boxed Warning ("Do not use SAVAYSA in patients with CrCL > 95 mL/min"**, `fda.edoxaban.af_dose`), vẫn phát **`[CONTINUE] Edoxaban 60 mg`** thay vì `[STOP]`/`[SWITCH]`.

5. **`AF-R2-R3-17` (Bỏ lọt `Ticagrelor`, `Prasugrel` và thuốc kháng tiểu cầu thứ 2 trên AF + CAD/ACS)**:
   - **`S59`** (`recentAcs: true` dùng `apixaban + aspirin + ticagrelor`): không cảnh báo đổi `ticagrelor -> clopidogrel` và ngưng sớm `aspirin` ≤ 1 tuần (Class III Harm cho P2Y12i mạnh trong phác đồ 3 thuốc).
   - **`S60`** (`recentAcs: false` dùng `apixaban + ticagrelor`): `0` lệnh `[STOP]` do thiếu `'ticagrelor'`/`'prasugrel'`.
   - **`S80`** (`recentAcs: false` dùng `apixaban + aspirin + clopidogrel`): dùng `.find()` nên chỉ `[STOP] aspirin` và bỏ sót `clopidogrel`!

6. **`AF-R2-R3-18` (Khiếm khuyết trong Sốc / Bất ổn Huyết động `S24`, `S25`)**:
   - **`S24`** (`sbp: 95, hemodynamicStability: 'unstable'`): in sai `"SBP 95 < 90 mmHg"`, quên `[HOLD]` `digoxin`, và cả **`S24`** lẫn **`S25`** (`sbp: 78` sốc tim) đều kê viên uống mạn tính `[START] Apixaban 5 mg BID` + hẹn triệt đốt PVI ngay giữa lúc sốc điện cấp cứu.

7. **`AF-R2-R3-19` (Vi phạm Fail-Closed khi thiếu `sbp` ngoại trú, lịch thận 12 tháng khi thiếu `scr`, và quá ước tính CrCl béo phì khi thiếu `height`)**:
   - **`S29`** (`sbp: undefined`, HR 122): fail-open kê `[START] Bisoprolol 1.25 mg` không cần biết huyết áp.
   - **`S30`** (76 tuổi, thiếu `scr, weight, lvef, hr`): che khuất thẻ thiếu `weight`/`hr` và hẹn xét nghiệm thận thưa tận `12 tháng`.
   - **`S10`** (`weight: 115 kg, height: undefined, scr: 165`): tính `CrCl = 61.6` (so với `eGFR = 38.8`) rồi ra lệnh `[UPTITRATE] Rivaroxaban 15 mg -> 20 mg`.

8. **`AF-R2-R3-20` (Bỏ sót chống đông bắt buộc quanh chuyển nhịp chương trình ngoại trú `S66`)**:
   - **`S66`** (`setting: 'outpatient'`, `afOnset: 'more_than_48h_or_unknown'`, `CHA₂DS₂-VA = 0`, EHRA III): chỉ xuất `[AVOID]` chống đông dài hạn mà mất hoàn toàn quy tắc Class I bắt buộc DOAC ≥ 3 tuần trước chuyển nhịp (hoặc TEE) + ≥ 4 tuần sau chuyển nhịp do `af.inpatient.cardioversion_anticoag` bị khóa cứng ở `inpatient`.

9. **`AF-R2-R3-21` (Gộp chung `"Mang thai / Cho con bú"` làm đảo ngược hoàn toàn thuốc an toàn khi cho con bú `S70`)**:
   - Warfarin không qua sữa mẹ và an toàn khi cho con bú (`fda.warfarin.lactation`, `esc.preg.2025.vka_lactation`), còn Apixaban bị khuyến cáo tránh dùng khi cho con bú (`fda.apixaban.lactation`). Việc gộp chung vào `conditions.pregnant` khiến sản phụ đang bú mẹ uống Warfarin bị dừng thuốc oan nếu tích ô UI, hoặc bị kê nhầm `[START] Apixaban 5 mg BID` nếu truyền `breastfeeding: true` (`S70`).

---

### 4.3. Nhóm Mức độ Nhỏ & Đề xuất Cải tiến (`MINOR` — 4 phát hiện | `SUGGESTION` — 2 phát hiện)

- **`AF-R2-R3-22` (`minor`)**: Bổ sung hướng dẫn chu phẫu cho bệnh nhân đang dùng VKA (`Warfarin`/`Acenocoumarol`: ngưng 3–5 ngày trước mổ nguy cơ chảy máu cao, kiểm tra INR < 1.5, không bắc cầu Heparin thường quy ở AF không van tim theo thử nghiệm BRIDGE).
- **`AF-R2-R3-23` (`minor`)**: Tách riêng HCM (`S76`) khỏi bệnh mạch vành trong `af.rhythm.aad_cad` để không gắn nhãn Class I cho `dronedarone` trên bệnh cơ tim phì đại (ưu tiên PVI hoặc `amiodarone` / `sotalol`).
- **`AF-R2-R3-24` (`minor`)**: Khi bệnh nhân đã dùng thuốc kiểm soát tần số đạt `< 110 bpm` nhưng vẫn còn triệu chứng EHRA III–IV với nhịp nghỉ `80–109 bpm`, bổ sung khuyến cáo chuyển sang đích chặt `< 80 bpm` lúc nghỉ (ESC 2024 Rec Table 14).
- **`AF-R2-R3-25` (`minor`)**: Nhận diện cường giáp / nhiễm độc giáp (`hyperthyroidism` — `S75`) để lưu ý đạt bình giáp trước khi chuyển nhịp/triệt đốt chương trình.
- **`AF-R2-R3-26` (`suggestion`)**: Đưa trực tiếp các trường `customInputs.childPugh`, `conditions.wpw`, `conditions.activeBleeding`, và tách riêng `conditions.breastfeeding` lên `src/modules/af/inputs.ts`.
- **`AF-R2-R3-27` (`suggestion`)**: Tách tập thuốc tham khảo `[CONSIDER]` khỏi tập kê đơn chủ động trong `src/engine/safety/interactions.ts` để triệt tiêu các cảnh báo DDI giả giữa hai phương án thay thế nhau (`S02`, `S06`, `S52`, `S57`, `S74`).

---

## Kết luận (Verdict): **FAIL**

Căn cứ quy tắc nghiệm thu bắt buộc của Hội đồng Kiểm định (`PASS` chỉ được cấp khi `0 critical` VÀ `0 major`), phân hệ Rung nhĩ (`af`) ở Vòng 2 hiện còn tồn tại **12 lỗi mức `critical`** và **9 lỗi mức `major`** đã được chứng minh thực nghiệm trực tiếp qua 83 kịch bản `evaluate(patient, settings)`. Do đó, kết luận kiểm định độc lập của Reviewer R3 ở Vòng 2 là **`FAIL`** — yêu cầu khắc phục triệt để toàn bộ 12 phát hiện `critical` và 9 phát hiện `major` trước khi nghiệm thu lâm sàng.
