# Báo cáo Kiểm định Độc lập Vòng 3 – Vai R1 (Chuyên gia Hô hấp / Dị ứng & Kiểm định Guideline)

- **Phân hệ kiểm định**: `asthma` (Hen phế quản người lớn & trẻ vị thành niên ≥ 12 tuổi)
- **Vòng & Vai kiểm định**: **Round 3 – Reviewer R1** (Độc lập hoàn toàn; tuân thủ nghiêm ngặt `docs/REVIEW_PROTOCOL.md`, không đọc bất kỳ báo cáo `round3_R2*` hoặc `round3_R3*`, không chỉnh sửa mã nguồn/KB/test)
- **Nguồn tài liệu đối chiếu trực tiếp từ kho PDF & bộ đệm trang (`Medical_Library_2026`)**:
  1. **GINA 2026 Global Strategy for Asthma Management and Prevention** (`01_Noi_Khoa\Ho_Hap\GINA_2026_Strategy_Report.pdf`)
  2. **GINA 2026 Summary Guide for Asthma Management and Prevention** (`01_Noi_Khoa\Ho_Hap\GINA_2026_Summary_Guide.pdf`)
  3. **Bộ Y tế QĐ 1851/QĐ-BYT (2020)** – *Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi* (`06_Viet_Nam\BYT_1851_2020_Hen_phe_quan_NL_va_TE_ge12.pdf`)
  4. **Bộ Y tế QĐ 5850/QĐ-BYT (2021)** – *Quy trình lâm sàng chẩn đoán và điều trị hen phế quản ở người lớn và trẻ em ≥ 12 tuổi* (`06_Viet_Nam\BYT_5850_2021_Quy_trinh_hen_phe_quan.pdf`)
  5. **Nhãn thuốc FDA DailyMed / EMA SmPC** và toàn bộ **21 hồ sơ thuốc sở hữu** trong `kb/drugs/*.json`, **69 trích dẫn** trong `kb/citations/asthma.json`, **74 ngưỡng** trong `kb/thresholds/asthma.json`
- **Thực nghiệm Runtime**: Chạy kiểm định trực tiếp `evaluate()`, `computeGina()` và bộ trích xuất trang PDF thông qua các script độc lập tại `docs/reviews/asthma/scratch/r1_*.ts` (`r1_pdf_extract.ts`, `r1_inspect_guideline_pages.ts`, `r1_check_kb_and_gina.ts`, `r1_search_gina_exact.ts`, `r1_evaluate_scenarios.ts`, `r1_verify_details.ts`).

---

## I. Kiểm toán Khắc phục Vòng 2 & Kiểm toán Kho Tri thức (KB)

### 1. Đối chiếu các sửa đổi sau Vòng 2 (`round2_R1` & `round2_RESPONSE.md`)
| Mã Vòng 2 | Nội dung | Đánh giá thực tế tại Vòng 3 |
|---|---|---|
| `R1-ASTHMA-V2-01` | Bảo toàn `beclometasone_formoterol` (Foster) ở Track 1 & khóa trần quá liều MART (`> 12` nhát/ngày) | **Đạt phần cốt lõi, còn rò rỉ nhỏ ở xuất viện**: Track 1 giữ đúng Foster, `isMartOveruse` chặn tốt Track 1/Track 2 và `discharge_plan`; tuy nhiên quên chặn ở `discharge_ocs` và nhánh nội viện của `action_plan_generator` (xem `ASTHMA-R3-R1-10`). |
| `R1-ASTHMA-V2-02` | Chốt chặn fail-closed sinh hiệu cơn hen cấp nội viện (`missingTriage`) | **Đạt một phần / Lọt lưới**: Đã chặn khi bỏ trống *cả hai* `spo2` và `respiratoryRate`, nhưng dùng toán tử `\|\|` thay vì `&&` (`helpers.ts:434`), khiến ca chỉ nhập `RR = 24` mà trống `SpO2` vượt qua fail-closed. Đồng thời xuất hiện hồi quy làm rơi `fev1Pct` khỏi `evaluateAcuteAsthma()` (xem `ASTHMA-R3-R1-03`). |
| `R1-ASTHMA-V2-03` | Phân tách NSAID ức chế COX-1 (`STOP`) vs ức chế chọn lọc COX-2 (`celecoxib`, `etoricoxib` — `MONITOR >= 2h`) trên cơ địa AERD | **Đạt hoàn toàn**: Đúng GINA 2026 (Evidence B). |
| `R1-ASTHMA-V2-04` | Dùng `SWITCH` kèm `switchFrom` qua `resolveControllerAction` để triệt tiêu cảnh báo giả `dup.ics` / `dup.laba` | **Đạt trên nhóm ICS, nhưng phát sinh kẽ hở nghiêm trọng với LABA+LAMA thiếu ICS**: Đổi giữa các bình chứa ICS rất sạch; song khi bệnh nhân đang dùng `glycopyrronium_indacaterol` (Ultibro) không có ICS, lệch mã thuốc làm `mergeClassResolver` ghi đè thành `CONTINUE` thuốc chống chỉ định (xem `ASTHMA-R3-R1-02`). |
| `R1-ASTHMA-V2-05` | Bổ sung `partly_controlled_step_up_consider` cho GINA kiểm soát một phần (1–2/4 tiêu chí) | **Đạt hoàn toàn**: Khớp GINA 2026 & QĐ 1851/QĐ-BYT. |
| `R1-ASTHMA-V2-06` | Nêu đủ cả hai dạng bào chế Symbicort Turbuhaler DPI & Rapihaler pMDI trong đơn xuất viện | **Đạt hoàn toàn**: Khớp thực tế lưu hành tại Việt Nam. |
| `R1-ASTHMA-V2-07` | Cá thể hóa `action_plan_generator` theo đúng hoạt chất và bậc điều trị | **Đạt tốt** (còn rò rỉ khi `isMartOveruse` nội viện — xem `ASTHMA-R3-R1-10`). |
| `R1-ASTHMA-V2-08` | Chuẩn hóa điều kiện thai kỳ | **Đạt hoàn toàn**: Chặn hạ bậc trong thai kỳ và phát `MONITOR` duy trì ICS an toàn. |

### 2. Kiểm toán 69/69 Trích dẫn PDF (`kb/citations/asthma.json`) & Trích dẫn liên phân hệ
- Script `r1_pdf_extract.ts` đối chiếu tự động toàn bộ **69/69 mục** trong `kb/citations/asthma.json` với văn bản trang PDF gốc (đã khử `\f`): **69/69 khớp nguyên văn chính xác đúng số trang (`exact = 69, fail = 0`)**.
- **Tuy nhiên**, kiểm toán ngữ nghĩa chiều sâu phát hiện **3 trích dẫn liên phân hệ vay mượn từ `kb/citations/htn.json`** (`esc.hf.2026.supp_diuretic_cautions`, `esc.htn.2024.ckd_loop_diuretic`, `esc.htn.2024.preeclampsia_mgso4`) đang được gắn vào ngưỡng hiệu chỉnh thận/huyết áp của `magnesium_sulfate` trong cơn hen cấp **chỉ vì trùng khớp con số `30`, `90`, `1`** trong khi nội dung gốc nói về thuốc lợi tiểu suy tim/tăng huyết áp và truyền duy trì sản giật `1 g/giờ` (xem `ASTHMA-R3-R1-07`).

---

## II. Bảng Tổng hợp Phát hiện Kiểm định Vòng 3 – R1

| Mã Finding | Mức độ (`severity`) | Loại (`itemType`) | Đối tượng (`itemId`) | Tóm tắt phát hiện |
|---|---|---|---|---|
| `ASTHMA-R3-R1-01` | **critical** | `rule` | `asthma.acute.*` / `preset_asthma_acute_severe_er` | Điểm mù hoàn toàn với cơn hen cấp ở ngoại trú (`outpatient`): làm hỏng Preset #5 (`preset_asthma_acute_severe_er` thiếu `setting: 'inpatient'`) và gây đảo ngược an toàn trên ca cơn hen nguy kịch tại phòng khám (`STOP salbutamol`, bỏ sót `STOP diazepam`, kê AIR 1 nhát khi cần, 0 `REFER` cấp cứu/ICU). |
| `ASTHMA-R3-R1-02` | **critical** | `rule` | `asthma.safety.laba_only_prohibited` / `LABA_WITHOUT_ICS_DRUGS` | Sai mã KB của `glycopyrronium_indacaterol` (Ultibro) thành `'indacaterol_glycopyrronium'` và bỏ sót LAMA đơn trị (`tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`) không kèm ICS -> `mergeClassResolver` xóa đơn ICS-formoterol và phát lệnh **`CONTINUE Indacaterol/Glycopyrronium`** (chống chỉ định FDA Boxed Warning / nguy cơ tử vong). |
| `ASTHMA-R3-R1-03` | **critical** | `rule` | `evaluateAcuteAsthma` / `missing_vitals_triage` | Hạ thấp phân tầng cơn hen cấp nội viện ở 4 kịch bản nguy hiểm: (1) bỏ rơi `fev1Pct <= 50%` / `< 30%` làm mất gói cơn nặng và mất `magnesium_sulfate` khi `FEV1 = 25%`; (2) bỏ sót thở chậm tiền ngừng thở (`RR = 8`) & nhịp chậm (`HR = 42`); (3) bỏ sót tụt huyết áp (`SBP = 80`) khi chưa tích cờ `isAcuteExacerbation`; (4) `hasMinVitals` dùng `\|\|` thay vì `&&` làm lọt lưới thiếu `SpO2`. |
| `ASTHMA-R3-R1-04` | **major** | `rule` | `asthma.outpatient.track2_step3_4` / `step5_controller_continue` | Hạ bậc Track 2 Bậc 3 dặn *"ngừng thành phần LABA"* trái ngược GINA 2026 Box 4-13 (Chứng cứ A) & QĐ 1851 Bảng 8 đồng thời tự mâu thuẫn với `drugId: 'fluticasone_salmeterol'`; nâng bậc Bậc 4 trên `mometasone_formoterol` giữ nguyên liều thấp Bậc 3 (`100/5 mcg` thay vì `200/5 mcg`). |
| `ASTHMA-R3-R1-05` | **major** | `missing` | `asthma.safety.methylxanthines_not_recommended` | Thiếu hoàn toàn quy tắc cảnh báo / `STOP` `theophylline` và cấm `aminophylline` tiêm tĩnh mạch trong cả cơn hen cấp lẫn hen mạn tính (GINA 2026 PDF pp. 101, 190 & QĐ 1851 PDF p. 46), dù `theophylline.json` có sẵn trong KB. |
| `ASTHMA-R3-R1-06` | **major** | `rule` | `asthma.acute.severe_ipratropium_combo` | Bỏ sót khuyến cáo Chứng cứ A phối hợp `ipratropium` cùng SABA cho đợt cấp hen mức độ trung bình tại Cấp cứu / nội viện (GINA 2026 PDF p. 186; QĐ 1851 Bảng 10 & PDF p. 46). |
| `ASTHMA-R3-R1-07` | **major** | `citation` | `magnesium_renal_*` / `magnesium_sulfate.json` | Trích dẫn kiểu "chỉ khớp con số" (`30`, `90`, `1`): dùng trích dẫn lợi tiểu suy tim/THA kháng trị và truyền sản giật `1 g/h` để chứng minh liều đơn `1 g` hiệu chỉnh thận của `magnesium_sulfate` trong hen cấp. |
| `ASTHMA-R3-R1-08` | **major** | `rule` | `step5_controller_continue` / `step5_severe_management` | Thiếu giới hạn tuổi `≥ 18 tuổi` cho các bình bộ ba Trimbow (`beclometasone_glycopyrronium_formoterol`), Trelegy (`fluticasone_furoate_umeclidinium_vilanterol`), Enerzair: phát lệnh `CONTINUE` Trimbow cho trẻ vị thành niên 14 tuổi trái GINA 2026 PDF p. 246 & p. 26. |
| `ASTHMA-R3-R1-09` | **major** | `ui` | `customInputs.smokingStatus` / `computeGina` / `missing_gina_control` | (1) `smoking_and_vaccines` không đọc `customInputs.smokingStatus === 'current'` trên form Hen; (2) Máy tính `computeGina` báo `"Không kiểm soát"` khi 3/4 câu dương tính + 1 câu trống nhưng engine báo `'missing'` và hiển thị sai tên biến thô `daytimeSymptomsMoreThanTwiceWeek`. |
| `ASTHMA-R3-R1-10` | **minor** | `rule` | `asthma.inpatient.discharge_ocs` / `action_plan_generator` | Khi `totalDailyPuffsUsed > 12` ở nội viện, `discharge_plan` bị chặn nhưng `discharge_ocs` vẫn phát đơn xuất viện `Prednisolone` uống không kèm ICS, song song với lệnh `CHUYỂN CẤP CỨU NGAY`. |
| `ASTHMA-R3-R1-11` | **minor** | `rule` | `asthma.outpatient.track1_*` | Khi chuyển từ Track 2 (`ICS + SABA rời`) sang Track 1 AIR/MART (`ICS-formoterol`), không phát lệnh `STOP` bình SABA rời trong `currentMeds` theo GINA 2026 PDF p. 183. |
| `ASTHMA-R3-R1-12` | **suggestion** | `ui` | `allergicRhinitis`, `gerd`, `obesity` & `citationIds` | 3 checkbox bệnh đồng mắc trên form Hen hiện là dead inputs (chưa sinh tư vấn cá thể hóa theo GINA / QĐ 1851); lặp đúp mã trích dẫn `'byt.asthma.2021.action_plan_zones'` trong `rules.track2.ts`. |

**Tổng cộng**: **12 phát hiện** — **`3 critical`**, **`6 major`**, **`2 minor`**, **`1 suggestion`**.

---

## III. Phân tích Chi tiết Từng Phát hiện & Bằng chứng Đối chiếu

### 1. `[CRITICAL]` `ASTHMA-R3-R1-01` — Điểm mù cơn hen cấp ngoại trú (`outpatient`), hỏng Preset #5 và đảo ngược an toàn trong cơn hen nguy kịch tại phòng khám
- **Đối tượng**: [`presets.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/presets.ts#L180-L209), [`evaluateAcuteAsthma`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/helpers.ts#L351-L359), [`rules.acute.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.acute.ts#L60-L430), [`rules.safety.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.safety.ts#L98-L100)
- **Căn cứ Guideline nguyên văn**:
  - **GINA 2026 Summary Guide**, Figure 9 (*"Management of asthma exacerbations in primary care"*, PDF pp. 35–36) & **GINA 2026 Strategy Report**, Box 9-4 (PDF pp. 180–182):
    > *"PRIMARY CARE — Patient presents with acute or sub-acute asthma exacerbation ... SEVERE OR LIFE-THREATENING ... TRANSFER TO ACUTE CARE FACILITY. While waiting: give SABA, ipratropium bromide, O2, systemic corticosteroid."*
  - **Bộ Y tế QĐ 1851/QĐ-BYT (2020)**, Mục 4.4 & Bảng 9 (*"Xử trí đợt cấp hen phế quản ở cơ sở chăm sóc sức khỏe ban đầu"*, PDF pp. 42–43):
    > *"Sắp xếp chuyển BN tới cơ sở cấp cứu: ngay khi có dấu hiệu nặng của đợt cấp, hoặc chuyển ngay tới khoa hồi sức khi có dấu hiệu nguy kịch: vật vã, kích thích, ngủ gà, phổi im lặng. Với những bệnh nhân này: cần khí dung SABA, ipratropium bromide, thở oxy, corticoid toàn thân ngay trước khi chuyển viện."*
- **Bằng chứng thực nghiệm trên `evaluate()`**:
  1. **Preset #5 (`preset_asthma_acute_severe_er`) bị gãy ngay trên giao diện**: Trong `presets.ts:180-209`, ca mẫu *"Cơn hen phế quản cấp nặng tại Cấp cứu — SpO2 88%, RR 32, HR 128, PEF 45%, nói từng từ"* không khai báo `setting: 'inpatient'`. Khi người dùng chọn preset này trên UI (`AppShell.tsx:88`: `setting: preset.setting ?? 'outpatient'`), ứng dụng tự động chuyển sang `outpatient`. Chạy `evaluate()` cho ra **0 khuyến cáo cấp cứu, 0 Oxy, 0 giãn phế quản, 0 corticoid**, chỉ hiện `Cần nhập daytimeSymptomsMoreThanTwiceWeek để đánh giá`!
  2. **Ca phòng khám ngoại trú vào cơn hen đe dọa tính mạng (Ca 2A)**: Giao diện `inputs.ts:166` vẫn hiển thị đầy đủ các trường `isAcuteExacerbation`, `speechAbility`, `silentChest`, `mentalStatus` ở chế độ `outpatient`. Khi bác sĩ phòng khám nhập bệnh nhân 35 tuổi có `isAcuteExacerbation: true`, `silentChest: true` (lồng ngực câm), `mentalStatus: 'drowsy'` (lơ mơ), `spo2: 84%`, `pefPct: 38%`, `speechAbility: 'words'`, đang có `salbutamol` và `diazepam` (4 ô checkbox GINA mặc định `false`), `evaluate()` xuất:
     - `[STOP] NGỪNG phác đồ cắt cơn Salbutamol (Albuterol) (SABA) đơn độc`
     - `[START] Budesonide / Formoterol hít khi cần (AIR-only): Hít 1 nhát mỗi khi có triệu chứng`
     - **Bỏ sót hoàn toàn `[STOP] Diazepam`** (thuốc an thần ức chế hô hấp tối kỵ trong cơn cấp, do `acute_sedatives_contra` bị khóa `setting: 'inpatient'` tại `rules.safety.ts:624`)
     - **Không có `REFER` chuyển Cấp cứu/ICU, không thở Oxy, không khí dung SABA + Ipratropium, không Corticosteroid toàn thân!**
- **Hướng khắc phục**: Thêm `setting: 'inpatient'` vào `preset_asthma_acute_severe_er`; mở `evaluateAcuteAsthma()` nhận diện cơn cấp ở cả `outpatient`; đổi `acute_sedatives_contra` sang `setting: 'both'`; chặn toàn bộ rule hen mạn tính khi `hasAcuteAttack === true` và bổ sung phác đồ cấp cứu ban đầu + `REFER` chuyển tuyến khẩn cấp tại y tế cơ sở theo GINA Box 9-4 & QĐ 1851 Bảng 9.

---

### 2. `[CRITICAL]` `ASTHMA-R3-R1-02` — Sai mã KB `glycopyrronium_indacaterol` & bỏ sót LAMA đơn trị không kèm ICS khiến Engine chủ động khuyên `TIẾP TỤC DUY TRÌ` thuốc chống chỉ định FDA Boxed Warning
- **Đối tượng**: [`helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/helpers.ts#L58-L73), [`rules.safety.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.safety.ts#L167-L210), [`glycopyrronium_indacaterol.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/glycopyrronium_indacaterol.json#L1-L94)
- **Căn cứ Guideline nguyên văn**:
  - **GINA 2026 Strategy Report**, PDF p. 143:
    > *"In particular, treatment with LABA and LAMA alone (i.e., without ICS) is recommended for initial treatment in COPD, but is contraindicated in asthma due to the risk of severe exacerbations and death."*
  - **GINA 2026 Strategy Report**, PDF p. 101 & p. 246:
    > *"Use of long-acting muscarinic antagonists (LAMA) in asthma without concomitant ICS is associated with an increased risk of severe exacerbations."*
    > *"LABA and/or LAMA should not be used without ICS in asthma (or in patients with asthma+COPD) due to increased risk of serious adverse outcomes."*
- **Cơ chế lỗi & Bằng chứng thực nghiệm `evaluate()`**:
  1. Trong `kb/drugs/glycopyrronium_indacaterol.json` (Ultibro Breezhaler), mã chính thức trong KB là `"glycopyrronium_indacaterol"`. Tuy nhiên `LABA_WITHOUT_ICS_DRUGS` tại `helpers.ts:64` lại viết ngược thành `'indacaterol_glycopyrronium'`.
  2. Khi bác sĩ chọn **Indacaterol/Glycopyrronium (Ultibro Breezhaler)** từ ô tìm thuốc cho bệnh nhân hen (không có ICS):
     - `asthma.safety.laba_only_prohibited` **bỏ lọt hoàn toàn** (không sinh `STOP`).
     - Nghiêm trọng gấp bội: trong `src/engine/mergeConflictGroups.ts:281,355`, `'glycopyrronium_indacaterol'` lại được khai báo đúng tên trong nhóm `inhaler_laba` với số thành phần = 2. Do thuốc không nằm trong `blockedCurrentMedIds`, `resolveClassConflicts` coi bình đôi LABA+LAMA tương đương bậc với bình đôi ICS+formoterol (`budesonide_formoterol`), **xóa bỏ đơn `START budesonide_formoterol`** và biến kết quả đầu ra của `evaluate()` thành:
       > `[CONTINUE] id=rec_asthma_track1_step1_2_air | drug=glycopyrronium_indacaterol | title="TIẾP TỤC DUY TRÌ Indacaterol/Glycopyrronium [Liều hiện tại: 110/50 mcg OD]"`
  3. Tương tự, cả 4 hoạt chất LAMA đơn trị trong KB (`tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`) khi dùng không kèm ICS duy trì ở bệnh nhân hen (Ca 4B) không hề bị phát lệnh `STOP` hay cảnh báo an toàn nào.
- **Hướng khắc phục**: Thêm `'glycopyrronium_indacaterol'` (và quét động theo `classes` chứa `'laba'` nhưng không chứa `'ics'`) vào `LABA_WITHOUT_ICS_DRUGS`; đồng thời bổ sung quy tắc `STOP` cho mọi LAMA đơn trị (`tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`) khi bệnh nhân hen không có thuốc chứa ICS duy trì hàng ngày.

---

### 3. `[CRITICAL]` `ASTHMA-R3-R1-03` — Hạ thấp phân tầng mức độ nặng cơn hen cấp nội viện (`fev1Pct <= 50%` / `< 30%`, thở chậm/nhịp chậm tiền ngừng tuần hoàn, tụt huyết áp và sinh hiệu dở dang)
- **Đối tượng**: [`evaluateAcuteAsthma`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/helpers.ts#L367-L435), [`rules.acute.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.acute.ts#L70-L266)
- **Căn cứ Guideline nguyên văn**:
  - **GINA 2026 Strategy Report**, PDF p. 185 & p. 189:
    > *"PEF or FEV1 should be recorded before treatment is initiated"*
    > *"intravenous magnesium (as a single 2 g infusion over 20 minutes) reduces hospital admissions, including in adults with FEV1 <25–30% predicted at presentation (Evidence A)."*
  - **Bộ Y tế QĐ 5850/QĐ-BYT (2021)**, PDF pp. 17–18 (`byt.asthma.2021.acute_classification`):
    > *"Cơn hen nguy kịch — Khi có ít nhất một dấu hiệu: Ngủ gà, lú lẫn; **Thở chậm, có cơn ngừng thở**; **Rối loạn nhịp tim, tụt huyết áp, tím tái**; Lồng ngực im lặng."*
- **4 kịch bản lỗi thực nghiệm trên `evaluate()` (`setting: 'inpatient'`)**:
  1. **Ca 3A (`isAcuteExacerbation: true`, `fev1Pct: 25%`, `pefPct: undefined`, `spo2: 93%`, `RR: 26`)**: `evaluateAcuteAsthma` bỏ sót `fev1Pct`, trả về `isSevere = false` -> Bệnh nhân có **FEV1 chỉ còn 25%** bị kê nhầm phác đồ **cơn nhẹ – trung bình** (mất Ipratropium, mất Steroid TM, và làm tê liệt hoàn toàn nhánh `fev1Pct < 30` của `severe_magnesium_sulfate` tại `rules.acute.ts:264`).
  2. **Ca 3B (`isAcuteExacerbation: true`, `respiratoryRate: 8` lần/phút, `hr: 42` lần/phút, `spo2: 91%`)**: Bệnh nhân kiệt sức cơ hô hấp sắp ngừng thở – ngừng tim nhưng chỉ kiểm tra `rr > 30` và `hr > 120` -> Engine kết luận **cơn nhẹ – trung bình** (xịt pMDI + uống Prednisolone, **0 `REFER` ICU**).
  3. **Ca 3C (`speechAbility: 'words'`, `spo2: 88%`, `RR: 32`, `sbp: 80 mmHg`, quên tích `isAcuteExacerbation`)**: Dòng `helpers.ts:399` gán cứng `Boolean(ci.isAcuteExacerbation) && sbp < 90`, nên dù `hasAcuteAttack` và `isSevere` đều `true`, bệnh nhân đang tụt huyết áp sốc `80 mmHg` bị mất `isLifeThreatening` (không phát `REFER` ICU / chuẩn bị đặt NKQ).
  4. **Ca 3D (`isAcuteExacerbation: true`, `respiratoryRate: 24`, `spo2: undefined`)**: Dòng `helpers.ts:434` viết `spo2 !== undefined || rr !== undefined` thay vì `&&`, khiến ca chưa đo SpO2 vẫn lọt qua chốt fail-closed và nhận phác đồ cơn nhẹ không Oxy.

---

### 4. `[MAJOR]` `ASTHMA-R3-R1-04` — Hạ bậc Track 2 Bậc 3 trái cảnh báo Chứng cứ A của GINA 2026 & Bảng 8 QĐ 1851/QĐ-BYT, kèm lỗi liều Bậc 4 của `mometasone_formoterol`
- **Đối tượng**: [`rules.track2.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track2.ts#L114-L128) và [`rules.track2.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track2.ts#L358-L391)
- **Căn cứ Guideline nguyên văn**:
  - **GINA 2026 Strategy Report**, Box 4-13 (PDF p. 113) & PDF p. 112:
    > Step 3 *"Low-dose ICS-LABA maintenance"* -> *"Reduce ICS-LABA to once daily (Evidence D)"*; cột thận trọng: ***"Caution: Discontinuing LABA may lead to deterioration (Evidence A)"*** (*"stopping LABA was associated with lower lung function and more hospitalizations compared with continuing the same or a lower dose of ICS-LABA"*).
  - **Bộ Y tế QĐ 1851/QĐ-BYT (2020)**, Bảng 8 (PDF p. 22):
    > *"Bậc 3 | Liều thấp ICS/LABA hàng ngày | - Liều thấp ICS/LABA (giảm 50% liều ICS, hoặc dùng cách ngày)"*.
- **Bằng chứng `evaluate()`**:
  - **Ca 5A** (Track 2 Bậc 3 ổn định 6 tháng trên `fluticasone_salmeterol`): xuất `[REDUCE] drugId: 'fluticasone_salmeterol'` nhưng `dose` lại ghi `"Hạ bậc từ Bậc 3 về Bậc 2: Giữ ICS liều thấp duy trì hàng ngày (ngừng thành phần LABA khi đã ổn định dài hạn) + Salbutamol khi cần"` — vừa vi phạm GINA Evidence A & QĐ 1851 Bảng 8, vừa tự mâu thuẫn với chính tên thuốc phối hợp `Fluticasone / Salmeterol` trên thẻ lệnh.
  - **Ca 5B** (Track 2 Bậc 3 không kiểm soát trên `mometasone_formoterol` nâng lên Bậc 4): xuất `[UPTITRATE] title="GINA Track 2 (Bậc 4): Nâng bậc Mometasone / Formoterol..."` nhưng `dose` in `"Track 2 Bậc 3: 2 nhát 100/5 mcg x 2 lần/ngày..."` thay vì hàm lượng trung bình `200/5 mcg x 2 nhát x 2 lần/ngày` (`icsLaba.target`), và lên Bậc 5 lại tự ý ép đổi sang `fluticasone_salmeterol`.

---

### 5. `[MAJOR]` `ASTHMA-R3-R1-05` — Thiếu hoàn toàn quy tắc an toàn với `theophylline` và `aminophylline` trong đợt cấp và điều trị duy trì
- **Đối tượng**: `src/modules/asthma/rules.safety.ts`, [`theophylline.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/theophylline.json)
- **Căn cứ Guideline nguyên văn**:
  - **GINA 2026 Strategy Report**, PDF p. 190:
    > *"Aminophylline and theophylline (not recommended): Intravenous aminophylline and theophylline should not be used in the management of asthma exacerbations, in view of their poor efficacy and safety profile... The use of intravenous aminophylline is associated with severe and potentially fatal side-effects, particularly in patients already treated with sustained-release theophylline."*
  - **GINA 2026 Summary Guide**, PDF pp. 27, 31:
    > *"GINA does not recommend oral salbutamol, oral theophylline, oral epinephrine, or inhaled fenoterol, because of the increased risk of adverse effects."*
  - **Bộ Y tế QĐ 1851/QĐ-BYT (2020)**, PDF p. 46:
    > *"Aminophylline và theophylline tiêm tĩnh mạch không nên sử dụng trong xử trí cơn cấp hen, do hiệu quả kém và khả năng ngộ độc (đặc biệt khi dùng cùng macrolide có thể gây xoắn đỉnh)."*
- **Bằng chứng `evaluate()`**: Ca 3E (nội viện cơn hen cấp có `theophylline` trong `currentMeds`) và Ca 4B (ngoại trú có `theophylline`): 0 khuyến cáo `STOP` / `AVOID` / cảnh báo tương tác.

---

### 6. `[MAJOR]` `ASTHMA-R3-R1-06` — Bỏ sót phối hợp `ipratropium` cho cơn hen cấp mức độ trung bình tại Cấp cứu / nội viện (GINA Evidence A & QĐ 1851/QĐ-BYT)
- **Đối tượng**: [`rules.acute.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.acute.ts#L140-L185)
- **Căn cứ Guideline nguyên văn**:
  - **GINA 2026 Strategy Report**, PDF p. 186:
    > *"For adults and children with moderate-severe exacerbations, treatment in the emergency department with both SABA and ipratropium, a short-acting anticholinergic, was associated with fewer hospitalizations (Evidence A for adults; Evidence B for adolescents/children) and greater improvement in PEF and FEV1, compared with SABA alone (Evidence A, adults/adolescents)."*
  - **Bộ Y tế QĐ 1851/QĐ-BYT (2020)**, Bảng 10 (PDF p. 45) & trang 54 (PDF p. 46):
    > *"Bệnh nhân có đợt cấp trung bình đến nặng, điều trị trong khoa cấp cứu: phối hợp SAMA và SABA cho hiệu quả giãn phế quản tốt hơn, cải thiện FEV1, LLĐ nhiều hơn so với dùng SABA đơn thuần."*
- **Bằng chứng `evaluate()`**: Ca 3E (`speechAbility: 'phrases'`, `spo2: 91%`, `respiratoryRate: 26`, `pefPct: 60%`) không kích hoạt `ipratropium` vì rule chỉ xét `acute.isSevere || acute.isLifeThreatening`.

---

### 7. `[MAJOR]` `ASTHMA-R3-R1-07` — Trích dẫn "khớp con số" sai ngữ cảnh y khoa trên ngưỡng thận & huyết áp của `magnesium_sulfate`
- **Đối tượng**: [`kb/thresholds/asthma.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/asthma.json#L644-L676), [`kb/drugs/magnesium_sulfate.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/magnesium_sulfate.json#L36-L57), [`rules.acute.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.acute.ts#L234-L235)
- **Bằng chứng đối chiếu KB**:
  - `asthma.acute.magnesium_renal_egfr_min` (`30`) và `magnesium_sbp_caution_min` (`90`) gắn `esc.hf.2026.supp_diuretic_cautions` (*"may be made worse by diuretic or patient may not respond to diuretic (especially thiazide diuretic)"*) — nói về thuốc lợi tiểu trong suy tim!
  - `asthma.acute.magnesium_renal_dose_g` (`1` g truyền 1 lần trong 20 phút) gắn `esc.htn.2024.preeclampsia_mgso4` (*"4 g i.v. over 5 min, then 1 g/h i.v. is recommended for eclampsia treatment"*) — lấy con số `1` từ tốc độ truyền duy trì `1 g/giờ` của sản giật!
  - `kb/drugs/magnesium_sulfate.json` dải `eGFR < 30` gắn `esc.htn.2024.ckd_loop_diuretic` (*"loop diuretic is necessary to define resistant hypertension"*).
- **Hướng khắc phục**: Thay bằng trích dẫn chuẩn từ nhãn FDA DailyMed của Magnesium Sulfate Injection (thải trừ thận, nguy cơ tăng magie máu/mất phản xạ gân xương/ức chế hô hấp ở suy thận nặng).

---

### 8. `[MAJOR]` `ASTHMA-R3-R1-08` — Thiếu kiểm tra giới hạn tuổi `≥ 18 tuổi` cho bình hít bộ ba cố định (Trimbow, Trelegy, Enerzair) ở trẻ vị thành niên 12–17 tuổi
- **Đối tượng**: [`rules.track2.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track2.ts#L85-L112) và [`rules.track2.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track2.ts#L243-L261)
- **Căn cứ Guideline nguyên văn**:
  - **GINA 2026 Strategy Report**, PDF p. 246 & **Summary Guide**, PDF p. 26 (`gina.asthma.2026.step5_lama_triplet`):
    > *"Tiotropium, ≥6 years, by mist inhaler, added to separate ICS or ICS-LABA. Combination ICS-LABA-LAMA inhalers: For patients aged ≥18 years, beclometasone-formoterol-glycopyrronium; fluticasone furoate-vilanterol-umeclidinium and mometasone-indacaterol-glycopyrronium. For patients aged ≥12 years, budesonide-formoterol-glycopyrronium."*
- **Bằng chứng `evaluate()`**: Ca 5C (`age: 14`, đang dùng `beclometasone_glycopyrronium_formoterol`): engine phát `[CONTINUE] Tiếp tục duy trì nền bộ ba Bậc 5 (Beclometasone/Glycopyrronium/Formoterol)` mà không có bất kỳ cảnh báo giới hạn tuổi `< 18` nào.

---

### 9. `[MAJOR]` `ASTHMA-R3-R1-09` — Đứt dây `customInputs.smokingStatus` trên form Hen & Mâu thuẫn giữa máy tính `computeGina` với `evaluateGinaControl` (kèm lỗi hiển thị tên biến camelCase)
- **Đối tượng**: [`inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/inputs.ts#L130-L140), [`rules.track2.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track2.ts#L442), [`gina.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/gina.ts#L70-L76), [`helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/helpers.ts#L292-L295), [`rules.track1.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track1.ts#L44)
- **Bằng chứng**:
  1. Chọn `smokingStatus: 'current'` trên form Hen không làm thay đổi khuyến cáo cai thuốc lá vì `smoking_and_vaccines` chỉ đọc `hasCondition(ctx, 'smoker')`.
  2. Khi 3/4 câu GINA là `true` và câu thứ 4 (`activityLimitationDueToAsthma`) bỏ trống: `computeGina` trả về `"Không kiểm soát"`, trong khi `evaluate()` chặn nâng bậc và hiển thị tiêu đề lỗi thô `"Cần nhập daytimeSymptomsMoreThanTwiceWeek để đánh giá"` (sai cả trường đang thiếu lẫn ngôn ngữ hiển thị).

---

### 10. `[MINOR]` `ASTHMA-R3-R1-10` — Rò rỉ `discharge_ocs` & `action_plan_generator` nội viện khi đang quá liều MART (`totalDailyPuffsUsed > 12`)
- **Đối tượng**: [`rules.acute.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.acute.ts#L526-L536), [`rules.track2.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track2.ts#L476-L486)
- **Bằng chứng `evaluate()`**: Khi `setting: 'inpatient'`, `acuteResponseAfter1h: 'good_response'`, `totalDailyPuffsUsed: 14`, engine chặn `discharge_plan` (ICS) nhưng vẫn phát `[START] rec_asthma_discharge_ocs` (kê đơn xuất viện Prednisolone uống không có ICS) cùng lúc với `[REFER] CHUYỂN CẤP CỨU NGAY`.

---

### 11. `[MINOR]` `ASTHMA-R3-R1-11` — Chuyển từ Track 2 sang Track 1 AIR/MART không phát lệnh `STOP` bình SABA rời trong `currentMeds`
- **Đối tượng**: [`rules.track1.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track1.ts#L78-L295)
- **Bằng chứng**: GINA 2026 Strategy Report PDF p. 183 & Summary Guide PDF p. 25 nhấn mạnh bệnh nhân dùng MART không dùng SABA làm thuốc cắt cơn (*"SABA is not needed"* / *"SABA should not be used as a reliever by patients taking MART"*). Ở Ca 4D (`budesonide` + `salbutamol` -> `SWITCH budesonide_formoterol`), `salbutamol` không được `STOP`.

---

### 12. `[SUGGESTION]` `ASTHMA-R3-R1-12` — Khai thác 3 trường bệnh đồng mắc (`allergicRhinitis`, `gerd`, `obesity`) đang để trống logic & dọn mã trích dẫn lặp đúp
- **Đối tượng**: [`inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/inputs.ts#L142-L161), [`rules.track2.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track2.ts#L470-L471)
- **Đề xuất**: Kết nối 3 checkbox đồng mắc vào khuyến cáo quản lý yếu tố nguy cơ thay đổi được (corticosteroid xịt mũi / cân nhắc SLIT mạt nhà khi `FEV1 > 70%`, giảm cân, điều trị GERD có triệu chứng theo GINA 2026 & QĐ 1851 Mục 3.2.4–3.2.5) và xóa phần tử `'byt.asthma.2021.action_plan_zones'` bị lặp tại `rules.track2.ts:471, 562`.

---

## IV. Kết luận Cuối cùng (Final Verdict)

- **Thống kê phát hiện**: `3 critical` · `6 major` · `2 minor` · `1 suggestion` (Tổng: **12 phát hiện**).
- **KẾT LUẬN KIỂM ĐỊNH VÒNG 3 – VAI R1**: **`FAIL`**
  *(Theo `docs/REVIEW_PROTOCOL.md`, phân hệ chỉ đạt `PASS` khi có `0 critical` và `0 major`. Cần khắc phục triệt để 3 lỗi `critical` và 6 lỗi `major` nêu trên trước khi bước sang vòng kiểm định kế tiếp.)*
