# Báo cáo Kiểm định Độc lập Vòng 2 — Module Rối loạn Lipid Máu (`lipid`)
## Vai trò: R3 – Phản biện An toàn Lâm sàng Đối nghịch (Adversarial Clinical Safety Tester)

- **Ngày thực hiện**: 27/10/2026
- **Phạm vi kiểm định**: Toàn bộ pipeline thực thi thực tế `evaluate(patient, settings)` đối với module `lipid` đơn lẻ (`['lipid']`) và đa bệnh lý phối hợp (`['lipid', 'ckd', 'dm2', 'htn', 'gout', 'af']`), bao gồm `src/modules/lipid/*`, `src/engine/calculators/ldlTarget.ts`, `src/engine/calculators/score2.ts`, `src/engine/units.ts`, `src/engine/safety/*`, `src/engine/merge.ts`, `src/engine/note.ts` và `kb/*`.
- **Nguyên tắc độc lập**: Hoàn toàn độc lập trong Vòng 2 (không đọc bất kỳ báo cáo nào của R1 hay R2 Vòng 2); không chỉnh sửa bất kỳ tệp nào trong `src/`, `kb/`, `tests/`.
- **Bộ kịch bản thực nghiệm (`docs/reviews/lipid/scratch/`)**:
  - `scenarios_part1.ts` + `scenarios_part2.ts` + `run_r3_round2.ts` + `vite_runner.ts`: **67 kịch bản bệnh nhân đối nghịch** + **15 lượt kiểm thử 5 `lipidPresets` trên 3 hồ sơ (`INTL`, `VN`, `US`)** + **16 lượt quét vi biên số học (`CK`, `ALT`, `TG`)**.
  - `probe_extra.ts`: **9 kịch bản đối nghịch chuyên sâu bổ sung** (`ADV-R2-68` → `ADV-R2-75`, gồm tách `70A/70B`).
  - **Tổng số lượt chạy `evaluate()` thực tế**: **107 lượt thực thi** (gồm **76 kịch bản lâm sàng đối nghịch độc lập**, vượt yêu cầu tối thiểu 50–65 kịch bản).

---

## 1. Thống kê Tổng hợp Kết quả Kiểm định

### 1.1. Phân bổ kịch bản theo 5 nhóm trọng tâm

| Nhóm kiểm thử đối nghịch | Mã kịch bản | Số kịch bản | Kết quả chính |
|---|---|---:|---|
| **1. Hồi quy Vòng 1 & Cổng an toàn cơ quan / thai kỳ** | `ADV-R2-01` → `ADV-R2-16`, `68`, `69`, `72` | 19 | Thai kỳ 9 thuốc hạ lipid STOP sạch 100%; tiêu cơ vân `CK >= 10x` và viêm gan ACS nội viện chặn tốt. **Phát hiện lỗ hổng**: `CK 4–10x ULN` bỏ quên Fenofibrate; lọc máu không ASCVD đang dùng statin bị leo thang lên PCSK9i; `statinIntolerance` đang uống Simva 40 mg vẫn START thêm Bempedoic acid. |
| **2. Chuyển đổi đơn vị, Giá trị biên & Fail-Closed QA-1** | `ADV-R2-17` → `ADV-R2-32` (+ 16 vi biên) | 17 (+16) | Fail-closed thiếu `ldl` và thiếu `egfr` chặn tốt. **Phát hiện lỗ hổng**: `LDL = 100 mg/dL` bị làm tròn thành `2.59 mmol/L < 2.6` báo đạt đích giả; bất nhất `<= 1.4` (ngoại trú) vs `< 1.4` (nội viện); 2 ô UI `nonHdl` & `apob` bị bỏ chết hoàn toàn; gợi ý Rosuvastatin 20–40 mg khi thiếu `scr`. |
| **3. Phân tầng nguy cơ, Leo thang đa bậc & Đổi Profile** | `ADV-R2-33` → `ADV-R2-47`, `73` → `75` (+ 15 Presets) | 19 (+15) | Đích kép giảm `>= 50%`, `< 1.0 mmol/L` tái phát ACS, ĐTĐ `>= 20 năm`, `LDL >= 4.9` hoạt động tốt. **Phát hiện lỗ hổng**: 4 "vùng chết" 0 khuyến cáo (FH theo điểm `DLCN >= 6`, High-risk trên Statin+Eze, Moderate-risk trên Statin liều thấp, Bộ 3 chưa đạt đích); người già suy yếu `> 75t` tiên phát bị ép `START` Statin liều cao 40–80 mg. |
| **4. Đa bệnh lý & Tương tác thuốc chéo (Cross-Module DDI)** | `ADV-R2-49` → `ADV-R2-62`, `70A`, `70B`, `71` | 17 | Tương tác Colchicine + Statin + CKD G4 chặn xuất sắc. **Phát hiện lỗ hổng CRITICAL**: `CONTINUE Simvastatin 20 mg` + `Diltiazem` mâu thuẫn trần `<= 10 mg`; `CONTINUE Simva 40 / Prava 80` + `Bempedoic acid`; bỏ sót hoàn toàn tương tác xuất huyết `Fenofibrate + Warfarin`; `CONTINUE Pitavastatin 4 mg` ở CKD G3b/G4 (vượt trần FDA `<= 2 mg`); `ddiBlocksStandardStatinStart` khóa nhầm `Rosuvastatin + Clarithromycin`. |
| **5. Hiển thị UI, Trùng nhóm thuốc & `noteText`** | `ADV-R2-63` → `ADV-R2-66` | 4 | Gộp phác đồ 6 module (`ADV-R2-66`) mượt, 5 Presets 0 cảnh báo giả. **Phát hiện lỗ hổng**: `note.ts` làm rơi toàn bộ `r.warnings` (cảnh báo rung nhĩ/chảy máu của Icosapent ethyl, cảnh báo NPO viêm tụy) và không in `TG`, `ALT`, `CK`; trùng 2 Statin chỉ `CONTINUE` 1 thuốc mà không `STOP` thuốc kia; thiếu dặn cách giờ `Ezetimibe + Cholestyramine`. |

### 1.2. Tổng hợp số lượng phát hiện theo mức độ nghiêm trọng

| Mức độ (`severity`) | Số lượng | Mã phát hiện (`id`) | Ý nghĩa theo `REVIEW_PROTOCOL.md` |
|---|---:|---|---|
| **`critical`** | **5** | `LIPID-R2-R3-01` → `LIPID-R2-R3-05` | Nguy cơ gây hại trực tiếp cho bệnh nhân nếu làm theo (tiêu cơ vân do quá liều trần DDI/thận, không ngừng fibrate khi độc cơ cấp, xuất huyết nặng do tương tác Warfarin + Fenofibrate). |
| **`major`** | **7** | `LIPID-R2-R3-06` → `LIPID-R2-R3-12` | Sai lệch khuyến cáo guideline / bỏ sót leo thang Class I (FH DLCN ≥ 6, DDI khóa nhầm thuốc an toàn) / bỏ chết trường đích phụ Non-HDL & ApoB / sai lệch làm tròn đơn vị biên `100 mg/dL`. |
| **`minor`** | **2** | `LIPID-R2-R3-13` → `LIPID-R2-R3-14` | Làm rơi mảng cảnh báo `warnings` và chỉ số `TG/ALT/CK` trong `noteText`; xử lý chưa trọn vẹn khi toa hiện tại trùng 2 statin hoặc dùng kèm nhựa gắn acid mật. |
| **`suggestion`** | **1** | `LIPID-R2-R3-15` | Tinh chỉnh phân hóa văn bản `profile` (`US` vs `VN` vs `INTL`) và hiển thị song ngữ đơn vị `mg/dL` trong câu chữ giải thích. |
| **Tổng cộng** | **15** | `round2_R3.json` | **Kết luận Vòng 2: `FAIL`** (còn 5 `critical`, 7 `major`). |

---

## 2. Kiểm tra Hồi quy Vòng 1 (Round 1 Regression Verification)

| Hạng mục lỗi Vòng 1 | Kịch bản kiểm chứng Vòng 2 | Trạng thái | Ghi nhận thực tế từ `evaluate()` |
|---|---|---|---|
| **R3-01**: Viêm gan cấp (`ALT >= 3x`) / Tiêu cơ vân (`CK > 10x`) ở nội viện ACS `<24h` | `ADV-R2-10`, `ADV-R2-12` | **ĐÃ KHẮC PHỤC (PASS)** | Chặn hoàn toàn khởi trị/tăng liều Statin nội viện ACS; phát `[AVOID] atorvastatin` (khi `ALT = 5.2x`) và `[STOP] atorvastatin` + `[REFER]` bù dịch (khi `CK = 14x`). |
| **R3-02**: Thai kỳ / cho con bú đang dùng đa thuốc hạ lipid | `ADV-R2-01`, `ADV-R2-02` | **ĐÃ KHẮC PHỤC XUẤT SẮC (PASS)** | Phát lệnh `[STOP]` đầy đủ cho cả **9 hoạt chất**: Atorvastatin, Rosuvastatin, Ezetimibe, Fenofibrate, Evolocumab, Alirocumab, Inclisiran, Bempedoic acid, Icosapent ethyl, Omega-3; 0 lệnh `START`/`UPTITRATE` ở cả ngoại trú và nội viện ACS. |
| **R3-03**: Tương tác Statin + Clarithromycin / Cyclosporine / Gemfibrozil / Amiodarone / Colchicine | `ADV-R2-49` → `ADV-R2-59` | **KHẮC PHỤC MỘT PHẦN (CÒN LỖ HỔNG)** | Đã chặn khởi trị mới Atorvastatin liều cao khi có Clarithromycin/Cyclosporine/Gemfibrozil và `STOP` Colchicine ở CKD G4. **Tuy nhiên** phát sinh lỗi bậc 2: sai trần Simvastatin + Diltiazem/Verapamil (`LIPID-R2-R3-01`) và khóa nhầm cả Rosuvastatin an toàn (`LIPID-R2-R3-07`). |
| **R3-04**: Đang dùng liều độc Simvastatin 80 mg/ngày | `ADV-R2-64` | **ĐÃ KHẮC PHỤC (PASS)** | Dù `LDL = 1.2 mmol/L` đã đạt đích, hệ thống chặn `CONTINUE`, phát `[STOP] simvastatin` + `[SWITCH] atorvastatin 40–80 mg/ngày`. |
| **R3-05**: Cổng Gút & Acid uric (`> 420 µmol/L`) khi kê Bempedoic acid | `ADV-R2-06`, `ADV-R2-17` | **ĐÃ KHẮC PHỤC (PASS)** | Ở `uricAcid = 7.5 mg/dL` (`446.1 µmol/L`), phát `[DEFER] bempedoic_acid` và chuyển sang `Ezetimibe + Evolocumab`. (Lưu ý lỗi mới khi BN vẫn đang uống Simva 40 mg: `LIPID-R2-R3-02`). |
| **R3-06**: Phân tách xử trí `CK >= 10x ULN` vs `CK 4–10x ULN` | `ADV-R2-03`, `ADV-R2-04`, `ADV-R2-05` | **KHẮC PHỤC MỘT PHẦN (CÒN LỖ HỔNG)** | Ở `CK = 15x ULN` (`ADV-R2-03`) đã `STOP` cả Statin + Fenofibrate và `REFER` cấp cứu. **Tuy nhiên** ở `CK = 6.5x ULN` (`4–10x`), hệ thống bỏ quên hoàn toàn Fenofibrate (`LIPID-R2-R3-03`). |
| **R3-07 & R3-08**: Leo thang Step 2 Ezetimibe / Step 3 PCSK9i & Đích `< 1.0 mmol/L` tái phát ACS | `ADV-R2-20`, `ADV-R2-21`, `ADV-R2-34` | **ĐÃ KHẮC PHỤC (PASS)** | Bổ sung đúng Ezetimibe và Evolocumab hướng tới đích `< 1.0 mmol/L` khi `recurrentAcsWithin2Years: true`. (Còn sót lỗi `dlcnScore >= 6` ở Step 3: `LIPID-R2-R3-08`). |
| **R3-09 → R3-18**: Đích kép `>= 50%`, `LDL >= 4.9`, ĐTĐ `>= 20y`, Nội viện không ACS, Icosapent trên nền Statin, `STOP` Fenofibrate ở `eGFR < 30`, Fail-closed thiếu `ldl`/`egfr` | `ADV-R2-11`, `13`, `15`, `16`, `20`, `22`, `26`–`28`, `41`, `43`, `75` | **ĐÃ KHẮC PHỤC (PASS)** | Toàn bộ 10 điểm này hoạt động chính xác theo thiết kế. |

---

## 3. Chi tiết Các Phát hiện Vòng 2 (`Critical` & `Major`)

### [LIPID-R2-R3-01] `CRITICAL` — Mâu thuẫn quá liều trần nguy hiểm (nguy cơ tiêu cơ vân) khi phối hợp Simvastatin 20–40 mg với Diltiazem / Verapamil / Amiodarone
- **Loại / Định danh**: `rule` — `src/engine/safety/reviewMeds.ts` (dòng 865–885) & `lipid.goal.achieved_maintain` (`src/modules/lipid/rules.outpatient.ts` dòng 1574–1615)
- **Bằng chứng thực nghiệm**:
  1. **`ADV-R2-49`** (*Nam 60t, ASCVD + THA, `LDL = 1.2 mmol/L`, đang dùng `Simvastatin 20 mg + Diltiazem 120 mg`*):
     - `recommendations`: Sinh `[CONTINUE] simvastatin` (`rec_lipid_goal_achieved_continue`): *"Tiếp tục duy trì simvastatin — Đã đạt mục tiêu LDL-C (< 1.4 mmol/L)... Tuyệt đối không tự ý ngừng thuốc; duy trì phác đồ hiện tại"*.
     - `alerts`: Đồng thời phát `[CRITICAL] ix.statin_diltiazem`: *"[CẢNH BÁO QUÁ LIỀU TRẦN: Liều simvastatin hiện tại 20 mg vượt mức tối đa cho phép 10 mg]"*.
  2. **`ADV-R2-50`** (*`Simvastatin 40 mg + Verapamil 240 mg`, `LDL = 1.3 mmol/L`*):
     - `reviewMeds.ts` sinh `[REDUCE] simvastatin` với **`dose: "Tối đa 20 mg/ngày"`** và tiêu đề **`"GIẢM LIỀU Simvastatin ≤ 20 mg/ngày (Dùng cùng Amlodipine / Amiodarone / Diltiazem / Verapamil)"`** — cao gấp đôi liều trần tối đa 10 mg/ngày của FDA/ACC (`acc.lipid.2026.simva_diltiazem_verapamil`, `lipid.dose.simva_diltiazem_max = 10`), mâu thuẫn trực diện với chính `alerts` (`tối đa cho phép 10 mg`)!
  3. **`ADV-R2-52`** (*`Simvastatin 40 mg + Amiodarone 200 mg`, `LDL = 2.2 mmol/L`*):
     - Phát đồng thời `[REDUCE] simvastatin (Tối đa 20 mg/ngày)` VÀ `[SWITCH] atorvastatin (40–80 mg/ngày)` → gây nổ cảnh báo giả `[WARNING/duplicate] dup.statin: Trùng lặp 2 thuốc nhóm Statin` và `[CRITICAL] ix.statin_amiodarone`.
- **Hướng khắc phục**: Tách riêng Diltiazem/Verapamil trong `reviewMeds.ts` (kích hoạt khi `simvastatin > 10 mg`, đặt `dose: "Tối đa 10 mg/ngày"`); chặn `lipid.goal.achieved_maintain` phát `CONTINUE` khi statin đang vượt trần DDI; và trong `merge.ts` loại bỏ `REDUCE` statin cũ khi đã có lệnh `SWITCH` sang statin mới (ưu tiên Rosuvastatin không qua CYP3A4).

### [LIPID-R2-R3-02] `CRITICAL` — Khởi trị hoặc duy trì Bempedoic acid 180 mg chồng lên Statin liều cao (Simvastatin 40 mg, Pravastatin 80 mg) gây nguy cơ tiêu cơ vân và mâu thuẫn lệnh
- **Loại / Định danh**: `rule` — `lipid.intolerance.bempedoic_acid` (`rules.outpatient.ts` dòng 1623) & `src/engine/safety/reviewMeds.ts`
- **Bằng chứng thực nghiệm**:
  1. **`ADV-R2-07`** (*`statinIntolerance: true`, BN bị SAMS/dung nạp một phần nhưng trong toa hiện tại vẫn đang uống `Simvastatin 40 mg`, `LDL = 2.6 mmol/L`*): Engine phát `[START] bempedoic_acid 180 mg 1 lần/ngày` mà **không hề phát lệnh `STOP`/`REDUCE` Simvastatin 40 mg**, làm kích hoạt ngay `[CRITICAL] ix.statin_bempedoic` (*"Liều simvastatin hiện tại 40 mg vượt mức tối đa cho phép 20 mg"*). Tương tự ở **`ADV-R2-72`** (`statinIntolerance: true` + `Atorvastatin 40 mg`), engine kê thêm Bempedoic acid + Ezetimibe + Icosapent ethyl trên nền Atorvastatin 40 mg chưa được ngừng.
  2. **`ADV-R2-53`** (*`Simvastatin 40 mg + Bempedoic acid 180 mg`, `LDL = 1.2`*) & **`ADV-R2-54`** (*`Pravastatin 80 mg + Bempedoic acid 180 mg`, `LDL = 1.3`*): Engine phát **`[CONTINUE] simvastatin`** (ở liều 40 mg) và **`[CONTINUE] pravastatin`** (ở liều 80 mg) đối nghịch với cảnh báo `[CRITICAL] ix.statin_bempedoic` (FDA NEXLETOL cấm/tránh phối hợp Simvastatin > 20 mg hoặc Pravastatin > 40 mg do tăng gấp đôi AUC statin). Ngoài ra ở `ADV-R2-54`, chuỗi cảnh báo bị gắn nhầm hậu tố `[Giới hạn liều tối đa simvastatin: ≤ 20 mg]` dù thuốc đang dùng là `pravastatin` (trần ≤ 40 mg).
- **Hướng khắc phục**: Khi `statinIntolerance: true` mà còn statin trong `currentMeds`, bắt buộc phát lệnh `STOP` (hoặc giảm liều dưới trần an toàn) trước khi khởi trị Bempedoic acid; bổ sung quy tắc rà soát trần `Simvastatin <= 20 mg` và `Pravastatin <= 40 mg` khi có `bempedoic_acid` vào `reviewMeds.ts`.

### [LIPID-R2-R3-03] `CRITICAL` — Bỏ sót hoàn toàn độc tính cơ của Fenofibrate khi CK tăng vừa (4x < CK < 10x ULN) ở cả ngoại trú và nội viện ACS
- **Loại / Định danh**: `rule` — `lipid.safety.ck_elevation` (`src/modules/lipid/rules.outpatient.ts` dòng 431–496)
- **Bằng chứng thực nghiệm**:
  - **`ADV-R2-04`** (*Đang uống đơn trị `Fenofibrate 200 mg`, `TG = 6.5 mmol/L`, `ckUlnTimes: 6.5`*): Không có bất kỳ lệnh `HOLD`/`STOP` nào cho Fenofibrate; trái lại vì `activeStatin === null`, engine tưởng nhầm BN chưa điều trị và phát `[DEFER] atorvastatin: "Tạm hoãn khởi trị Statin do CK nền > 4 lần ULN (6.5x ULN)"`, để mặc Fenofibrate 200 mg tiếp tục gây hủy cơ!
  - **`ADV-R2-05`** (*ngoại trú*) & **`ADV-R2-69`** (*nội viện ACS `<24h`*, dùng `Atorvastatin 40 mg + Fenofibrate 145 mg`, `ckUlnTimes: 6.5`): Chỉ phát `[HOLD] atorvastatin`, bỏ sót hoàn toàn `fenofibrate`.
- **Hướng khắc phục**: Bổ sung luật `lipid.safety.ck_hold_fenofibrate` (`setting: 'both'`) phát `[HOLD] fenofibrate` khi `4 < ckUlnTimes < 10` và `hasMed(ctx, 'fenofibrate')`.

### [LIPID-R2-R3-04] `CRITICAL` — Bỏ sót hoàn toàn tương tác xuất huyết đe dọa tính mạng giữa Fenofibrate và Warfarin (VKA) & thiếu cảnh báo khi khởi trị đồng thời Statin liều cao + Fenofibrate ở CKD
- **Loại / Định danh**: `missing` — `kb/interactions/anticoagulant.json` & `lipid.tg.severe_pancreatitis_prevention`
- **Bằng chứng thực nghiệm**:
  - **`ADV-R2-61`** (*`['lipid', 'af']`, van tim cơ học + rung nhĩ đang dùng `Warfarin 5 mg`, `TG = 6.8 mmol/L`*): Engine phát đồng thời `[CONTINUE] warfarin` + `[START] fenofibrate 145–200 mg/ngày` với **`alerts = []` (0 cảnh báo)** và không có bất kỳ lời dặn giảm liều Warfarin hay thử INR nào. Theo nhãn FDA TRICOR (§5.4) và ESC/EAS 2019, Fenofibrate ức chế CYP2C9 làm tăng vọt INR gây xuất huyết nội sọ/tiêu hóa tử vong, bắt buộc giảm ~25–33% liều Warfarin ngay khi bắt đầu Fenofibrate và kiểm tra sát INR sau 3–5 ngày.
  - **`ADV-R2-44`** (*CKD G3b `eGFR = 39`, `TG = 7.2`, `LDL = 2.4`*) & **`ADV-R2-74/75`** (*nội viện `TG = 11.5`*): Khởi trị mới cùng lúc `[START] fenofibrate` + `[START] atorvastatin 40–80 mg/ngày` với **`alerts = []`** (0 cảnh báo độc tính cơ/tăng Creatinin do phối hợp Fibrate + Statin trên nền CKD, trái khuyến cáo KDIGO 2024).
- **Hướng khắc phục**: Thêm ngay quy tắc `ix.fibrate_warfarin` (`critical`/`warning`) vào `kb/interactions/anticoagulant.json` và `ix.statin_fenofibrate` (`warning`, nhấn mạnh ở `eGFR < 60`) vào `kb/interactions/statin.json`.

### [LIPID-R2-R3-05] `CRITICAL` — Ra lệnh CONTINUE duy trì quá liều thận Pitavastatin 4 mg/ngày ở bệnh nhân CKD giai đoạn 3b–4 (`eGFR < 60`)
- **Loại / Định danh**: `rule` — `lipid.goal.achieved_maintain` & `src/engine/safety/reviewMeds.ts`
- **Bằng chứng thực nghiệm**:
  - **`ADV-R2-70A`** (*CKD G3b `eGFR = 39`, đang dùng `Pitavastatin 4 mg`, `LDL = 1.6 mmol/L`*) và **`ADV-R2-70B`** (*CKD G4 `eGFR = 24`, đang dùng `Pitavastatin 4 mg`, `LDL = 1.2 mmol/L`*): Engine phát **`[CONTINUE] pitavastatin`** (*"Tuyệt đối không tự ý ngừng thuốc; duy trì phác đồ hiện tại"*) với `alerts = []`.
  - Theo nhãn FDA LIVALO và chính `kb/drugs/pitavastatin.json` (`acc.lipid.2026.pitavastatin_dose`), ở `eGFR 15–<60 mL/phút/1.73m²` liều tối đa tuyệt đối của Pitavastatin là **2 mg/ngày** (liều 4 mg làm tăng gấp đôi phơi nhiễm huyết tương gây tiêu cơ vân). Tương tự ở **`ADV-R2-71`** (`eGFR = 18`, `Simvastatin 40 mg`), engine phát `CONTINUE` không kèm cảnh báo thận trọng liều > 20 mg ở suy thận nặng của KDIGO/ESC.
- **Hướng khắc phục**: Bổ sung luật giảm liều `Pitavastatin > 2 mg` xuống `≤ 2 mg/ngày` khi `eGFR < 60` (hoặc lọc máu) và chặn `CONTINUE` ở liều vượt trần thận.

---

### [LIPID-R2-R3-06] `MAJOR` — Bệnh nhân lọc máu chu kỳ KHÔNG có ASCVD đã dùng sẵn Statin bị leo thang sai guideline lên Statin 40–80 mg, Ezetimibe và tiêm PCSK9i (`< 1.4 mmol/L`)
- **Loại / Định danh**: `rule` — `lipid.ckd.dialysis_continue_existing` (`src/modules/lipid/rules.outpatient.ts` dòng 908) & `helpers.ts`
- **Bằng chứng thực nghiệm**:
  - **`ADV-R2-14`** (*`onDialysis: true`, `ascvd: false`, `dm: true`, đang dùng ổn định `Atorvastatin 20 mg`, `LDL = 2.2 mmol/L`*): Phát `[UPTITRATE] atorvastatin (40–80 mg 1 lần/ngày)` hướng tới đích `< 1.4 mmol/L`.
  - **`ADV-R2-68`** (*`onDialysis: true`, `ascvd: false`, đang dùng `Atorvastatin 80 mg + Ezetimibe 10 mg`, `LDL = 1.8 mmol/L`*): Kích hoạt Step 3 phát **`[START] evolocumab 140 mg tiêm dưới da mỗi 2 tuần`** + `[CONSIDER] icosapent_ethyl 4 g/ngày`.
  - **Đối chiếu Guideline**: ESC/EAS 2019 (Class IIa-C) và KDIGO 2024 (Rec 3.15.1.2, dựa trên 4D, AURORA, SHARP) chỉ khuyến cáo **tiếp tục duy trì (`CONTINUE`)** liều statin hoặc statin/ezetimibe đang dung nạp sẵn khi bước vào lọc máu ở bệnh nhân chưa có ASCVD, **không** leo thang lên statin tối đa hay PCSK9i theo đích `< 1.4 mmol/L`.
- **Hướng khắc phục**: Chặn Step 1b / Step 2 / Step 3 khi `onDialysis && !hasAscvdEquivalent(ctx)` và cho luật `dialysis_continue_existing` phát `CONTINUE` liều hiện tại.

### [LIPID-R2-R3-07] `MAJOR` — Cờ `ddiBlocksStandardStatinStart` khóa nhầm toàn bộ lộ trình hạ LDL ở bệnh nhân dùng Statin an toàn không tương tác & bỏ lửng BN ACS nội viện dùng Gemfibrozil
- **Loại / Định danh**: `rule` — `src/modules/lipid/helpers.ts` (dòng 216–218), `rules.outpatient.ts` & `rules.inpatient.ts`
- **Bằng chứng thực nghiệm**:
  1. **`ADV-R2-55`** (*ASCVD, `LDL = 2.6`, đang dùng `Rosuvastatin 20 mg` [không qua CYP3A4] + `Clarithromycin 500 mg`*): Bị khóa sạch Step 1b, Step 2 (`add_ezetimibe`), Step 3 và `CONTINUE` → **0 khuyến cáo hạ LDL-C**.
  2. **`ADV-R2-56`** (*Ghép tạng/CKD kèm ASCVD, `LDL = 2.8`, đang dùng `Rosuvastatin 5 mg` [đúng trần ≤ 5 mg] + `Cyclosporine 100 mg`*): Bị khóa sạch không thể bổ sung PCSK9i hay `CONTINUE` Rosuvastatin 5 mg → **0 khuyến cáo hạ LDL-C**.
  3. **`ADV-R2-57`** (*Nội viện ACS `<24h`, đang uống `Simvastatin 20 mg + Gemfibrozil 600 mg`, `LDL = 3.4`*): Chỉ phát `[STOP] gemfibrozil`, khóa sạch `acs_prior_llt_statin` và `acs_prior_llt_ezetimibe`, bỏ lửng BN STEMI trên Simvastatin 20 mg không được chuyển sang Atorvastatin 40–80 mg + Ezetimibe.
  4. **`ADV-R2-58`** (*ASCVD chưa dùng statin, `LDL = 3.8`, đang uống `Clarithromycin 500 mg`*): Phát `[DEFER] atorvastatin` nhưng luật `upfront_ezetimibe_combo` (thiếu `!safety.ddiBlocksStandardStatinStart`) vẫn chạy và khuyên *"phối hợp sớm Ezetimibe 10 mg/ngày cùng Statin cường độ cao"*, tự mâu thuẫn với lệnh hoãn Statin cường độ cao.
- **Hướng khắc phục**: Phân tách cờ chặn DDI theo cơ chế dược động học của từng hoạt chất statin; không bao giờ chặn bổ sung Ezetimibe/PCSK9i khi BN đang dùng statin không tương tác hoặc đã chạm trần liều an toàn; bổ sung nhánh chuyển đổi statin cường độ cao cho BN ACS đang dùng Gemfibrozil sau khi ngừng Gemfibrozil; thêm cổng chặn DDI cho `upfront_ezetimibe_combo`.

### [LIPID-R2-R3-08] `MAJOR` — Bốn "vùng chết" phác đồ (Treatment Voids — 0 khuyến cáo hạ LDL) & làm rơi thuốc phối hợp khỏi mục `CONTINUE`
- **Loại / Định danh**: `rule` — `isStep3Eligible` (`rules.outpatient.ts` dòng 78), `primary_moderate_low`, `lipid.goal.achieved_maintain`
- **Bằng chứng thực nghiệm**:
  1. **`ADV-R2-37`** (*FH chẩn đoán qua `dlcnScore = 7` [Rất có thể FH], không tick checkbox FH, đang dùng `Atorva 80 + Ezetimibe 10`, `LDL = 2.4 > 1.8`*): `isStep3Eligible` chỉ đọc cờ `familialHypercholesterolemia` mà quên `dlcnScore >= 6` → **bỏ sót khuyến cáo Class I-C bổ sung PCSK9i của ESC 2019** và mất luôn lệnh `CONTINUE` cho cả 2 thuốc!
  2. **`ADV-R2-38`** (*Nguy cơ Cao không FH: ĐTĐ 12 năm, đang dùng `Atorva 80 + Ezetimibe 10`, `LDL = 2.3 > 1.8`*): **0 khuyến cáo hạ LDL** (mất cả `CONTINUE` lẫn `CONSIDER` Bempedoic acid/PCSK9i).
  3. **`ADV-R2-39`** (*Nguy cơ Trung bình: ĐTĐ 4 năm, đang dùng `Atorvastatin 10 mg`, `LDL = 2.9 > 2.6`*): **0 khuyến cáo thuốc** (không tăng liều lên 20 mg, không `CONTINUE`).
  4. **`ADV-R2-40`** (*ASCVD đang dùng bộ 3 `Atorva 80 + Ezetimibe 10 + Evolocumab 140`, `LDL = 1.6 > 1.4`*): **0 khuyến cáo hạ LDL** (rơi cả 3 thuốc khỏi bệnh án).
  5. **`ADV-R2-08`, `ADV-R2-73`, `ADV-R2-34`**: Khi đạt đích trên phác đồ non-statin (`Bempedoic + Ezetimibe`) hoặc phối hợp đa thuốc (`Atorva + Ezetimibe + Evolocumab`), engine chỉ `CONTINUE` riêng statin (hoặc 0 lệnh `CONTINUE` ở `ADV-R2-08`), làm mất Ezetimibe/Bempedoic/Evolocumab trong `noteText`.
- **Hướng khắc phục**: Sửa `isStep3Eligible` dùng chung `hasFh` (bao gồm `dlcnScore >= 6`); bổ sung nhánh xử lý cho High-risk trên bộ đôi, Moderate-risk đang dùng statin chưa đạt đích, và bộ ba chưa đạt đích; mở rộng `goal.achieved_maintain` phát `CONTINUE` cho toàn bộ thuốc hạ LDL hợp lệ đang dùng.

### [LIPID-R2-R3-09] `MAJOR` — Hai ô nhập liệu trên UI (`customInputs.nonHdl` và `customInputs.apob`) bị bỏ chết hoàn toàn (Dead Inputs): Bỏ sót đích phụ Non-HDL-C và ApoB
- **Loại / Định danh**: `missing` — `src/modules/lipid/inputs.ts` (dòng 59–84) & `src/modules/lipid/rules.outpatient.ts`
- **Bằng chứng thực nghiệm**:
  - **`ADV-R2-31`** (*ASCVD + ĐTĐ típ 2, đang dùng `Atorvastatin 40 mg` chưa tối đa, `TG = 280 mg/dL [3.16 mmol/L]`, `LDL = 50 mg/dL [1.29 mmol/L]`, `nonHdl = 150 mg/dL [3.88 mmol/L >> đích 2.2]`, `apob = 95 mg/dL >> đích 65`*): Không có bất kỳ hàm nào trong toàn bộ module `lipid` đọc `nonHdl` hay `apob` (cũng không tự tính `TC - HDL`). Engine báo đã đạt mục tiêu và không tối ưu hóa liều Statin/Ezetimibe dù hạt sinh xơ vữa ApoB/Non-HDL vượt xa đích phụ ESC 2019 Class I-C / IIa-B (`esc.lipid.2019.target_non_hdl`, `esc.lipid.2019.target_apob`).
- **Hướng khắc phục**: Hiện thực hóa quy tắc kiểm tra đích phụ `Non-HDL-C` (`< 2.2 / < 2.6 / < 3.4 mmol/L`, tự tính `TC - HDL` nếu người dùng không nhập trực tiếp) và `ApoB` (`< 65 / < 80 / < 100 mg/dL`) ở bệnh nhân ĐTĐ, béo phì, tăng TG hoặc có LDL-C thấp.

### [LIPID-R2-R3-10] `MAJOR` — Sai lệch làm tròn đơn vị `mg/dL -> mmol/L` tại biên `LDL = 100 mg/dL` (báo đạt đích giả, mất chỉ định Statin) & bất nhất dấu `<` vs `<=` tại `LDL = 1.4 mmol/L`
- **Loại / Định danh**: `threshold` — `src/engine/units.ts` (dòng 42–44) & `src/engine/calculators/ldlTarget.ts` (dòng 215)
- **Bằng chứng thực nghiệm**:
  1. **`ADV-R2-18`** (*`units.lipid = 'mg_dL'`, `profile = 'US'`, ĐTĐ 45 tuổi nguy cơ trung bình đích `< 100 mg/dL`, nhập `ldl: 100`*): `cholMgDlToMmolL(100)` làm tròn `(100 / 38.67).toFixed(2) = 2.59 mmol/L` (`< 2.6`) → engine báo đã đạt mục tiêu và tắt hoàn toàn khuyến cáo Statin!
  2. **`ADV-R2-19A` vs `ADV-R2-19B`** (*Cùng thông số `LDL = 1.4 mmol/L` trên nền Atorvastatin 80 mg*): Ngoại trú (`ldlTarget.ts` dùng `<= 1.4`) báo *"LDL-C hiện tại (1.4 mmol/L) đã đạt mục tiêu (< 1.4 mmol/L)"*; trong khi Nội viện ACS (`rules.inpatient.ts` dùng `< 1.4`) coi `1.4 mmol/L` là chưa đạt đích và khởi trị thêm Ezetimibe 10 mg.
- **Hướng khắc phục**: Sửa `ldlTarget.ts` dùng dấu nhỏ hơn nghiêm ngặt `< targetLdlMmol - 1e-9`; giữ tối thiểu 3–4 chữ số thập phân khi quy đổi `mg/dL -> mmol/L` nội bộ (hoặc đối chiếu trực tiếp ngưỡng chuẩn `mg/dL` khi `units.lipid === 'mg_dL'`).

### [LIPID-R2-R3-11] `MAJOR` — Mất cảnh báo viêm gan cấp (`ALT >= 3x ULN`) khi đồng mắc `Fenofibrate + eGFR < 30`, và gợi ý nhầm `Rosuvastatin 20–40 mg` khi thiếu dữ liệu thận (`scr: undefined`)
- **Loại / Định danh**: `rule` — `lipid.safety.alt_elevation` (`rules.outpatient.ts` dòng 181) & `lipid.step1.high_intensity_statin`
- **Bằng chứng thực nghiệm**:
  1. **`ADV-R2-11`** (*ASCVD, `LDL = 3.2`, `altUlnTimes: 4.8`, `scr: 280 -> eGFR = 21.6`, đang dùng `Fenofibrate 145 mg`*): `alt_elevation` tự tắt khi `hasMed('fenofibrate')`, còn `alt_hold_fenofibrate` tự tắt khi `egfr < 30` → biến mất hoàn toàn mọi cảnh báo tổn thương gan cấp `ALT = 4.8x ULN` và lý do không kê Statin!
  2. **`ADV-R2-29`** (*BN ASCVD ngoại trú `ldl: 3.6`, thiếu `scr: undefined`*): `rationale` vẫn gợi ý *"hoặc Rosuvastatin 20–40 mg/ngày"* dù chưa biết chức năng thận (nếu BN suy thận nặng ẩn `eGFR < 30`, liều 20–40 mg bị FDA chống chỉ định).
- **Hướng khắc phục**: Bỏ điều kiện loại trừ `hasMed('fenofibrate')` khỏi nhánh cảnh báo gan của statin; chỉ gợi ý Rosuvastatin 20–40 mg khi đã xác nhận `egfr !== undefined && egfr >= 30 && !onDialysis`.

### [LIPID-R2-R3-12] `MAJOR` — Người cao tuổi > 75 tuổi kèm suy yếu (`frailty: true`) phòng ngừa tiên phát bị chỉ định bắt buộc `[START]` Statin cường độ cao 40–80 mg
- **Loại / Định danh**: `rule` — `lipid.step1.high_intensity_statin` (`rules.outpatient.ts` dòng 1068)
- **Bằng chứng thực nghiệm**:
  - **`ADV-R2-46`** (*Nam 78 tuổi, `frailty: true`, tiên phát không ASCVD/ĐTĐ/CKD, `LDL = 3.6 mmol/L`*): Điểm SCORE2-OP ≥ 10% do tuổi cao khiến engine phát thẳng `[START] atorvastatin 40–80 mg 1 lần/ngày`, trái với ESC/EAS 2019 (Table 22: tiên phát > 75 tuổi chỉ ở mức **Class IIb-B `CONSIDER`**, và **Class I-C** bắt đầu liều thấp–trung bình khi có suy yếu/suy thận/đa thuốc).
- **Hướng khắc phục**: Ở phòng ngừa tiên phát khi `age > 75` hoặc `frailty: true`, chuyển từ `START` liều cao sang `CONSIDER` liều trung bình (Atorvastatin 10–20 mg/ngày) kèm giải thích cá thể hóa theo kỳ vọng sống và dung nạp cơ.

---

## 4. Các Phát hiện Mức `Minor` & `Suggestion`, Kiểm định Presets & Vi Biên

### 4.1. Phát hiện `Minor` & `Suggestion`
- **`[LIPID-R2-R3-13]` (`minor`, `ui` — `src/engine/note.ts`)**:
  - `generateClinicalNote` làm rơi toàn bộ mảng `Recommendation.warnings` khỏi `noteText` (khiến cảnh báo tăng nhập viện vì rung nhĩ 3.1% vs 2.1% và chảy máu của `icosapent_ethyl` ở BN Rung nhĩ + Apixaban trong **`ADV-R2-60`**, cũng như cảnh báo nhịn ăn NPO / truyền Insulin khi `TG = 11.5 > 10 mmol/L` trong **`ADV-R2-74`** không xuất hiện trong bản ghi bệnh án!).
  - Mục `2. CẬN LÂM SÀNG CHÍNH` của `noteText` bỏ sót hoàn toàn `TG`, `TC`, `HDL-C`, `Non-HDL`, `ApoB`, `Lp(a)`, `ALT (x ULN)`, `CK (x ULN)` (ngay cả ở ca viêm tụy `TG = 10.0 mmol/L` và tiêu cơ vân `CK = 15x ULN`), luôn in cứng đơn vị SI bất chấp cài đặt `mg/dL`, và mục 5 in cứng lời dặn theo dõi RASi/ARNI/MRA cho bệnh nhân đơn bệnh `['lipid']`.
- **`[LIPID-R2-R3-14]` (`minor`, `rule` — `reviewMeds.ts` & `interactions.ts`)**:
  - **`ADV-R2-63`** (*Uống trùng `Atorvastatin 40 mg + Rosuvastatin 20 mg`*): Phát cảnh báo `dup.statin` nhưng trong `recommendations` lại khuyên `CONTINUE atorvastatin` mà không phát lệnh `STOP rosuvastatin`.
  - **`ADV-R2-65`** (*`Cholestyramine 4000 mg` + `[START] ezetimibe 10 mg`*): Thiếu cảnh báo uống cách xa thời điểm (`>= 2 giờ trước hoặc >= 4 giờ sau` nhựa gắn acid mật để tránh giảm ~55% hấp thu Ezetimibe).
  - **`ADV-R2-56`** (*`Rosuvastatin 5 mg + Cyclosporine 100 mg`*): Cảnh báo `ix.statin_cyclosporine` vẫn phát mức `critical` dù liều Rosuvastatin 5 mg đã tuân thủ đúng trần tối đa cho phép.
- **`[LIPID-R2-R3-15]` (`suggestion`, `rule` — `lipid.lpa.lifetime_screening` & hiển thị đơn vị)**:
  - Chuyển đổi hồ sơ `US` vs `VN` vs `INTL` trên cả 5 Presets cho kết quả giống hệt nhau 100%; ở `profile: 'US'` câu chữ vẫn trích dẫn tầm soát đại trà Lp(a) của ESC 2025 và hiển thị đích theo `mmol/L` ngay cả khi người dùng bật `units.lipid = 'mg_dL'`.

### 4.2. Kiểm định 5 Bệnh nhân Mẫu (`lipidPresets`) & Quét Vi Biên Số học
- **Toàn bộ 5 `lipidPresets` × 3 hồ sơ (`INTL`, `VN`, `US`) = 15 lượt chạy**:
  - **0 cảnh báo trùng nhóm giả (`dup=0`)**, **0 chuỗi `NaN` / `undefined` / `null`**, đúng phác đồ lâm sàng chuẩn cho cả 5 ca mẫu.
- **Quét vi biên số học (`Micro-Boundary Sweep`)**:
  - `ALT`: `2.99x ULN` → điều trị bình thường; `3.00x ULN` → kích hoạt chính xác `[HOLD] atorvastatin` (`>= 3x ULN`).
  - `CK`: `4.00x ULN` → chưa tạm ngưng (`> 4x ULN`); `4.01x ULN` → `[HOLD] atorvastatin`; `9.99x ULN` → `[HOLD]`; `10.00x ULN` → `[STOP]` + `[REFER]` cấp cứu tiêu cơ vân (`>= 10x ULN`).
  - `TG`: `1.49 mmol/L` → chỉ duy trì statin; `1.50 mmol/L` → kích hoạt chính xác `[CONSIDER] icosapent_ethyl`; `5.59 mmol/L` → Icosapent ethyl; `5.60 mmol/L` → chuyển sang `[START] fenofibrate` phòng viêm tụy cấp.

---

## 5. Kết luận Phản biện Vòng 2 (Final Verdict)

So với Vòng 1, module `lipid` đã có bước tiến rất lớn về kiến trúc an toàn nền tảng (đặc biệt là cổng thai kỳ toàn diện trên 9 thuốc, xử trí tiêu cơ vân cấp `CK >= 10x ULN`, kiểm soát men gan nội viện ACS, cổng Gút/Acid uric cho Bempedoic acid và nguyên tắc Fail-Closed QA-1 khi thiếu `LDL-C`/`eGFR`).

Tuy nhiên, qua **76 kịch bản đối nghịch chuyên sâu (107 lượt chạy `evaluate()`)**, kiểm định viên R3 phát hiện **5 lỗi mức `critical`** và **7 lỗi mức `major`** liên quan đến mâu thuẫn trần liều tương tác thuốc (Diltiazem/Verapamil/Bempedoic acid + Simvastatin/Pravastatin), bỏ sót ngừng Fenofibrate khi độc cơ `CK 4–10x ULN`, bỏ sót tương tác xuất huyết nặng `Fenofibrate + Warfarin`, quá liều thận `Pitavastatin 4 mg` ở CKD G3b–G4, leo thang sai lên PCSK9i ở bệnh nhân lọc máu không có ASCVD, khóa nhầm phác đồ khi dùng Rosuvastatin + Clarithromycin, các vùng chết 0 khuyến cáo (bao gồm FH theo điểm DLCN ≥ 6) và 2 trường đích phụ `Non-HDL` / `ApoB` chưa được hiện thực hóa.

**KẾT LUẬN CUỐI CÙNG: `FAIL`** *(5 critical, 7 major, 2 minor, 1 suggestion — yêu cầu khắc phục triệt để toàn bộ các lỗi `critical` và `major` trước khi nghiệm thu Vòng 3).*
