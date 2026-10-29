# BÁO CÁO THẨM ĐỊNH ĐỘC LẬP VÒNG 3 — PHÂN HỆ RỐI LOẠN LIPID MÁU (`lipid`)
**Vai trò**: Reviewer R2 — Dược sĩ Lâm sàng & Kiểm toán An toàn Thuốc Độc lập (Clinical Pharmacist & Medication Safety Auditor)  
**Phân hệ kiểm toán**: `lipid` (Rối loạn lipid máu) & Tầng An toàn Thuốc Dùng chung (`src/engine/safety/**`)  
**Vòng đánh giá**: Round 3  
**Phán quyết độc lập**: **`FAIL`** *(Quy tắc bất khả xâm phạm: chỉ `PASS` khi `0 Critical` và `0 Major`)*

---

## 1. Tóm tắt Điều hành & Phạm vi Kiểm toán

### 1.1. Thống kê Phát hiện Vòng 3

| Mức độ nghiêm trọng (Severity) | Số lượng | Mã định danh phát hiện | Tác động đối với Phán quyết |
| :--- | :---: | :--- | :--- |
| **Critical (Nguy kịch / Chết người)** | **6** | `LIPID-R3-R2-01` → `LIPID-R3-R2-06` | Chặn `PASS` bắt buộc |
| **Major (Nghiêm trọng)** | **7** | `LIPID-R3-R2-07` → `LIPID-R3-R2-13` | Chặn `PASS` bắt buộc |
| **Minor (Trung bình / Nhỏ)** | **2** | `LIPID-R3-R2-14` → `LIPID-R3-R2-15` | Cần khắc phục để hoàn thiện |
| **Suggestion (Đề xuất kiến trúc)** | **1** | `LIPID-R3-R2-16` | Nâng cấp bền vững toàn hệ thống |
| **TỔNG CỘNG** | **16** | `16 phát hiện độc lập` | **PHÁN QUYẾT: `FAIL`** |

### 1.2. Phạm vi Đọc Mã nguồn, Tri thức (KB), Tài liệu Gốc & Thực thi Thực tế

1. **100% Mã nguồn Phân hệ & Engine An toàn (Không bỏ sót tệp nào)**:
   - Toàn bộ **28/28 tệp** trong `src/modules/lipid/**` (`index.ts`, `inputs.ts`, `presets.ts`, `pathway.ts`, `helpers*.ts`, `rules*.ts`, `matrix*.ts`), tất cả đều đã tuân thủ quy chuẩn kích thước `< 20 KB`/tệp.
   - Toàn bộ tầng Engine dùng chung trong `src/engine/`: `evaluate.ts`, `merge.ts`, `mergeConflictGroups.ts`, `mergeClassResolver.ts`, `types.ts`, `calculators/ldlTarget.ts`, và `src/engine/safety/{clinicalStates,drugClassify,duplicateRules,duplicates,gates,interactions,organAndCrisisGates,reviewMeds,reviewMedsSpecialized,reviewMedsVitalsAndRenal,vitalAndRenalGates}.ts`.
2. **Kiểm toán Danh mục 17 Thuốc Hạ Lipid Mục tiêu trong `kb/drugs/*.json`**:
   - **13/17 thuốc đã có tệp KB đầy đủ**: `atorvastatin`, `rosuvastatin`, `pitavastatin`, `simvastatin`, `pravastatin`, `ezetimibe`, `bempedoic_acid`, `inclisiran`, `evolocumab`, `alirocumab`, `fenofibrate`, `icosapent_ethyl`, `omega3` (tương ứng `omega3_ethyl_esters` nhưng thiếu bí danh ánh xạ).
   - **4/17 thuốc CHƯA CÓ tệp KB trong `kb/drugs/`**: `fluvastatin`, `lovastatin`, `cholestyramine`, `colesevelam` *(xem chi tiết tại `LIPID-R3-R2-02` & `LIPID-R3-R2-11`)*.
3. **Kiểm định Nguyên văn 100% Trích dẫn (Citation Verification) đối chiếu PDF gốc trong `Medical_Library_2026`**:
   - Đã đối chiếu tự động và kiểm tra chéo thủ công toàn bộ **122/122 trích dẫn** trong `kb/citations/lipid.json` và **13/13 trích dẫn** trong `kb/citations/interactions_lipid.json` (tổng **135/135 trích dẫn**): **100% khớp nguyên văn (0 lỗi trích dẫn ma, 0 sai lệch văn bản gốc)** với các tài liệu PDF chuẩn trong `C:\Users\hades\OneDrive\Desktop\Medical_Library_2026`:
     - `01_Noi_Khoa/Tim_Mach/ACC_AHA_2026_Dyslipidemia_Guideline.pdf`
     - `01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2019_dyslipidaemias_base.pdf` & `ESC_2025_dyslipidaemias.pdf`
     - `10_Bo_Y_Te_VN/QĐ_3759_2020_Roi_loan_lipid_mau.pdf` & `QĐ_2388_2024_Benh_than_man.pdf`
     - `09_Nhan_Thuoc/FDA/FDA_label_{atorvastatin,rosuvastatin,bempedoic_acid,ezetimibe}.pdf`
   - *Lưu ý*: Dù văn bản của cả 135 trích dẫn đều khớp nguyên văn PDF, kiểm toán phát hiện **2 chỗ gắn sai ID trích dẫn chéo hoạt chất** (gắn nhãn Rosuvastatin cho Fenofibrate và gắn trần 20 mg Atorvastatin cho lệnh ngừng Simvastatin — xem `LIPID-R3-R2-12`).
4. **Ghi nhận Kết quả Khắc phục Vòng 2 -> Vòng 3**:
   - Đội phát triển đã khắc phục xuất sắc **14/14 lỗi dược lâm sàng của Vòng 2**: tách chuẩn xác trần Simvastatin `≤ 10 mg/ngày` với Diltiazem/Verapamil/Dronedarone và `≤ 20 mg/ngày` với Amlodipine/Amiodarone/Ranolazine; mở khóa phối hợp Ezetimibe/PCSK9i cho Rosuvastatin và Atorvastatin `≤ 20 mg` khi dùng Clarithromycin; thực thi trần Simvastatin `≤ 20 mg` & Pravastatin `≤ 40 mg` với Bempedoic acid; bổ sung tương tác `ix.fibrate_warfarin` & `ix.rosuvastatin_warfarin_inr`; tạm ngừng Fenofibrate/Ezetimibe/Bempedoic acid khi tăng CK/ALT cấp; thực thi trần thận Pitavastatin `≤ 2 mg/ngày` (`eGFR < 60`) và Pravastatin `≤ 40 mg/ngày` (`eGFR < 30`).
5. **Thực nghiệm Đối kháng Vòng 3 (`evaluate()` & `applyPresetSelection()`)**:
   - Đã chạy thực tế **46 kịch bản lâm sàng đa thuốc / đa bệnh lý góc khuất** và **5 ca bệnh mẫu chính thức** qua hàm `evaluate()` thật (không đọc code chay, không giả định), chứng minh trực tiếp **16 phát hiện dưới đây**.

---

## 2. Bảng Tổng hợp 16 Phát hiện Kiểm toán Vòng 3

| Mã ID | Mức độ | Phân loại | Vị trí trọng tâm | Tóm tắt phát hiện cốt lõi |
| :--- | :---: | :---: | :--- | :--- |
| `LIPID-R3-R2-01` | **CRITICAL** | `rule` | `helpers.safety.ts`, `drugClassify.ts`, `reviewMeds.ts` | Mù hoàn toàn với mọi viên phối hợp cố định FDC (`rosuvastatin_ezetimibe`, `atorvastatin_ezetimibe`, `simvastatin_ezetimibe`, `amlodipine_atorvastatin`, `bempedoic_acid_ezetimibe`) -> kê chồng gấp đôi Statin + Ezetimibe và bỏ sót 100% lệnh `STOP`/`HOLD`/`REDUCE` ở thai kỳ, CK 15x ULN, ALT 5x ULN, eGFR=20, Simvastatin + Clarithromycin. |
| `LIPID-R3-R2-02` | **CRITICAL** | `drug` | `kb/drugs/`, `helpers.safety.ts`, `rules.ddi.cyp.ts`, `statin.json` | Thiếu 4/17 tệp KB (`lovastatin`, `fluvastatin`, `cholestyramine`, `colesevelam`) + bỏ quên `lovastatin` trong DDI -> phát lệnh `[CONTINUE] lovastatin` 40 mg cùng `clarithromycin` hoặc `nirmatrelvir_ritonavir` (Paxlovid) với `0` cảnh báo; thiếu bí danh `omega3_ethyl_esters`. |
| `LIPID-R3-R2-03` | **CRITICAL** | `rule` | `helpers.safety.ts`, `rules.safety.organ.ts`, `reviewMeds.ts` | Cổng Cho con bú (`breastfeeding` / `lactation`) là code chết 100%: không ngừng thuốc đang uống và trực tiếp kê mới `[START]` Atorvastatin 40–80 mg, Fenofibrate 145–200 mg, Ezetimibe cho sản phụ đang cho con bú. |
| `LIPID-R3-R2-04` | **CRITICAL** | `rule` | `helpers.safety.ts` vs `rules.ddi.cyp.ts`, `rules.safety.renal.ts` | Bất đối xứng giữa `hasDoseViolation` và luật hạ liều gây "hố đen điều trị" (`0` khuyến cáo Statin) khi dùng `Atorvastatin 40–80 mg + Erythromycin` hoặc `Pravastatin` (không ghi mg) ở `eGFR < 30` / kèm `Clarithromycin`. |
| `LIPID-R3-R2-05` | **CRITICAL** | `rule` | `helpers.safety.ts` (`getMedDoseMg`), `reviewMedsSpecialized.ts` | Bỏ qua hoàn toàn tần suất `freq` (`'2 lần/ngày'`) và đơn vị `unit='viên'` -> khuyên `[CONTINUE]` Pitavastatin 4 mg/ngày ở CKD G3b, Rosuvastatin 20 mg/ngày ở CKD G4, Simvastatin 40 mg/ngày + Amlodipine, và bỏ lọt Lipanthyl 200M `1 viên` ở CKD G3b. |
| `LIPID-R3-R2-06` | **CRITICAL** | `rule` | `src/modules/lipid/**`, `gates.ts`, `reviewMeds.ts` | Không có cổng sàng lọc dị ứng thuốc (`allergies` / quá mẫn phản vệ, phù mạch, SJS/TEN): kê `[START]` và `[CONTINUE]` chính hoạt chất bệnh nhân đã khai báo dị ứng. |
| `LIPID-R3-R2-07` | **MAJOR** | `rule` | `rules.statin.special.ts`, `rules.ddi.cyp.ts`, `rules.ddi.oatp.ts` | Kê trùng 2 Statin cùng lúc (`[START] Pitavastatin 4 mg` + `[CONSIDER] Rosuvastatin 5–10 mg`, `0` cảnh báo trùng) ở bệnh nhân HIV + ASCVD dùng ARV có Ritonavir; bỏ sót trần `Rosuvastatin ≤ 10 mg/ngày` với `Atazanavir/ritonavir` & `Lopinavir/ritonavir`. |
| `LIPID-R3-R2-08` | **MAJOR** | `interaction` | `helpers.safety.ts`, `rules.ddi.oatp.ts`, `statin.json` | Bỏ sót tương tác OATP1B1/BCRP nặng của Rosuvastatin với `Darolutamide` (trần ≤ 5 mg), `Regorafenib` / `Capmatinib` (trần ≤ 10 mg), `Febuxostat` / `Teriflunomide` / `Tafamidis` (≤ 20 mg) và `Sofosbuvir/velpatasvir/voxilaprevir` (tránh phối hợp). |
| `LIPID-R3-R2-09` | **MAJOR** | `rule` | `rules.intolerance.ts`, `rules.safety.muscle.ts`, `reviewMeds.ts` | Bỏ lọt hoàn toàn biến cố Đứt gân (`tendonRuptureHistory`) và Gút cấp trên bệnh nhân đang dùng `bempedoic_acid` ở 3 nhánh ngoài nhánh hẹp `isIntoleranceEscalationActive` (phối hợp trên nền Statin, đã đạt đích LDL-C, nội trú ACS); dùng `HOLD` thay vì `STOP` khi đứt gân. |
| `LIPID-R3-R2-10` | **MAJOR** | `rule` | `rules.tg.ts`, `clinicalStates.ts`, `reviewMeds.ts` | Bỏ sót chống chỉ định Sỏi túi mật (`cholelithiasis` / `gallbladderDisease`) của Fenofibrate (vẫn kê mới `[START] Fenofibrate 145–200 mg`); `evaluateHepaticSafety` bỏ sót `fenofibrate` & `ezetimibe` ở bệnh gan hoạt động / Child-Pugh B khi chạy module khác. |
| `LIPID-R3-R2-11` | **MAJOR** | `interaction` | `rules.safety.organ.ts`, `rules.tg.ts`, `lipid_ddi.json` | Nhựa gắn acid mật (`cholestyramine`, `colesevelam`): không `[STOP]` khi `TG ≥ 5.6 mmol/L` (nguy cơ viêm tụy cấp), gợi ý dùng ở thai phụ có `TG ≥ 3.4 mmol/L`, và thiếu toàn bộ tương tác cản trở hấp thu Warfarin, Levothyroxine, Digoxin, Lợi tiểu. |
| `LIPID-R3-R2-12` | **MAJOR** | `citation` | `rules.tg.ts`, `gates.ts`, `reviewMeds.ts`, `statin.json` | Gắn nhầm trích dẫn Rosuvastatin cho Fenofibrate + Warfarin & trích dẫn Atorvastatin cho Simvastatin + CYP3A4; mâu thuẫn `[CONTINUE] Atorvastatin 10 mg + Itraconazole` với `[CRITICAL] Chống chỉ định`; rò rỉ `doseLimit` Rosuvastatin sang Pravastatin/Fluvastatin; thiếu `Pitavastatin + Erythromycin/Rifampin` trong KB chung. |
| `LIPID-R3-R2-13` | **MAJOR** | `ui` | `presets.ts`, `kb/thresholds/lipid.json`, `rules.safety.renal.ts` | Ca mẫu cấp cứu `lipid_preset_1_acs_inpatient` thiếu `setting: 'inpatient'` làm UI ép về ngoại trú tắt sạch luật ACS 24h; `lipid_preset_4` không sinh Bempedoic acid như mô tả; báo giảm liều giả với `Lipanthyl 67 mg` tại Việt Nam do chốt cứng `> 40 mg`. |
| `LIPID-R3-R2-14` | **MINOR** | `drug` | `kb/drugs/*.json`, `rules.safety.muscle.ts` | Thiếu cảnh báo cấp nhóm mới của FDA/EMA về khởi phát mới / làm nặng thêm Nhược cơ toàn thân & Nhược cơ thể mắt (`myasthenia_gravis` / `ocular_myasthenia`) với Statin và Ezetimibe. |
| `LIPID-R3-R2-15` | **MINOR** | `matrix` | `matrix.egfr.statin.ts`, `simvastatin.json`, `omega3.json` | Sai biến liều `Rosuvastatin` ở cột `g3b` (`5–20 mg` thay vì `5–40 mg`) và `Atorvastatin` ở cột `g5` (`20–40 mg`); thiếu cảnh báo thận trọng `Simvastatin 40 mg` ở `eGFR < 30`; mâu thuẫn tần suất liều đích trong `omega3.json`. |
| `LIPID-R3-R2-16` | **SUGGESTION** | `ui` | `gates.ts`, `interactions.ts`, `schema.ts` | Đề xuất bộ thông dịch tự động `kbDrug.gates` ở tầng Engine chung và nâng cấp `InteractionEntry.doseLimits[]` đa hoạt chất để triệt tiêu lệch luật giữa các phân hệ. |

---

## 3. Phân tích Chuyên sâu Từng Phát hiện & Bằng chứng Đối chiếu

### NHÓM CRITICAL (6 PHÁT HIỆN NGUY KỊCH)

---

#### [LIPID-R3-R2-01] CRITICAL — Mù hoàn toàn với Viên phối hợp cố định hạ mỡ máu (FDC: `rosuvastatin_ezetimibe`, `atorvastatin_ezetimibe`, `simvastatin_ezetimibe`, `amlodipine_atorvastatin`, `bempedoic_acid_ezetimibe`)

- **Vị trí mã nguồn**: `src/modules/lipid/helpers.safety.ts:46-71, 141-190`, `src/engine/safety/drugClassify.ts:116-245`, `src/engine/safety/duplicates.ts`, `src/engine/safety/reviewMeds.ts`.
- **Phân tích Dược lâm sàng & Cơ chế lỗi**:
  Tại Việt Nam và quốc tế, đa số bệnh nhân nguy cơ tim mạch cao/rất cao đang điều trị ngoại trú sử dụng **viên phối hợp cố định (Single-Pill Combination / FDC)** để tăng tuân thủ theo khuyến cáo Class I của ESC/EAS: `rosuvastatin_ezetimibe` (Rosuzet / Crestor-Zetia), `atorvastatin_ezetimibe` (Atozet), `simvastatin_ezetimibe` (Inegy / Vytorin), `amlodipine_atorvastatin` (Caduet), `bempedoic_acid_ezetimibe` (Nexlizet / Nustendi). Tuy nhiên, khác với phân hệ `dm2` và `htn` đã có bản đồ phân rã FDC, cả `drugClassify.ts` lẫn `lipid/helpers.safety.ts` hoàn toàn không nhận diện và không phân rã bất kỳ viên FDC hạ mỡ máu nào!
- **Bằng chứng thực thi `evaluate()`**:
  1. **Kê chồng gấp đôi Statin cường độ cao + Ezetimibe (`FDC_01`, `FDC_02`, `FDC_03`, `FDC_08`)**:
     - `FDC_01` (ASCVD, LDL 2.8 mmol/L, đang uống `rosuvastatin_ezetimibe 20/10 mg`) & `FDC_02` (`atorvastatin_ezetimibe 40/10 mg`): Xuất trực tiếp **`[START] rec_lipid_step1_high_statin (drug=atorvastatin, dose='40–80 mg 1 lần/ngày')` + `[CONSIDER] rec_lipid_upfront_ezetimibe_combo (drug=ezetimibe, dose='10 mg 1 lần/ngày')`** kèm **`ALERTS: (0 alerts)`** -> Bệnh nhân uống chồng 2 Statin cường độ cao + 2 viên Ezetimibe!
     - `FDC_03` (`amlodipine_atorvastatin` Caduet `5/40 mg`): Xuất chồng **`[START] atorvastatin 40–80 mg/ngày`**, `ALERTS (0)`.
     - `FDC_08` (`bempedoic_acid_ezetimibe` Nexlizet `180/10 mg` kèm đứt gân + gút): Xuất **0 lệnh `STOP` Nexlizet**, còn kê chồng **`[START] ezetimibe 10 mg/ngày`**.
  2. **Bỏ lọt 100% lệnh `STOP`/`HOLD`/`REDUCE` trong các cấp cứu nội khoa & thai kỳ (`FDC_04`, `FDC_05`, `FDC_06`, `FDC_07`)**:
     - `FDC_04` (Thai phụ 32 tuổi FH đang uống `rosuvastatin_ezetimibe 20/10 mg`): **0 lệnh `[STOP]`**, `ALERTS (0)`.
     - `FDC_05` (Tiêu cơ vân cấp `ckUlnTimes = 15` + Tổn thương gan cấp `altUlnTimes = 5` đang uống `simvastatin_ezetimibe 10/40 mg`): **0 lệnh `[STOP]`/`[HOLD]`** viên Inegy!
     - `FDC_06` (CKD G4 `eGFR = 20 mL/phút/1.73m²` đang uống `rosuvastatin_ezetimibe 20/10 mg` — gấp đôi trần thận 10 mg của Rosuvastatin): **0 lệnh `[REDUCE]`/`[SWITCH]`**, `ALERTS (0)`.
     - `FDC_07` (Đang uống `simvastatin_ezetimibe 10/40 mg` + `clarithromycin 500 mg BID` — chống chỉ định tuyệt đối gây tiêu cơ vân tử vong): **0 lệnh `[STOP]`/`[HOLD]`** và **`ALERTS: (0 alerts)`**!
- **Bằng chứng Tài liệu gốc (`Medical_Library_2026`)**:
  - `ESC_2019_dyslipidaemias_base.pdf` (p. 42 & pp. 51–53): *"Lipid-lowering drugs should not be given when pregnancy is planned, during pregnancy, or during the breastfeeding period"*; *"If CK ≥ 10x ULN: stop treatment, check renal function"*; *"If ALT ≥ 3x ULN: stop lipid-lowering therapy or reduce dose"*.
  - `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` (Table 20 p. 76 & Table 27 p. 98); `FDA_label_rosuvastatin.pdf` (Sec 2.5, p. 6: `CLcr < 30` tối đa `10 mg/ngày`).
- **Hướng khắc phục chi tiết**:
  1. Bổ sung `LIPID_FDC_COMPONENTS_MAP` vào cả `src/engine/safety/drugClassify.ts` (`getExpandedDrugIds()` & `getNormalizedDrugClasses()`) và `src/modules/lipid/helpers.safety.ts`: ánh xạ đầy đủ `rosuvastatin_ezetimibe`/`rosuzet`, `atorvastatin_ezetimibe`/`atozet`/`liptruzet`, `simvastatin_ezetimibe`/`inegy`/`vytorin`, `amlodipine_atorvastatin`/`caduet`, `bempedoic_acid_ezetimibe`/`nexlizet`/`nustendi`, `pravastatin_fenofibrate`, `simvastatin_fenofibrate`.
  2. Xây dựng hàm tách liều từng hoạt chất `getFdcComponentDoseMg(med, componentId)` (nhận diện chuẩn cả `'20/10'` lẫn `'10/20'` dựa vào hàm lượng cố định `ezetimibe = 10 mg`, `bempedoic_acid = 180 mg`, `amlodipine = 2.5|5|10 mg`).
  3. Khi 1 thành phần bị chống chỉ định (ví dụ Atorvastatin trong Caduet ở thai kỳ/viêm gan cấp, hoặc Bempedoic acid trong Nexlizet khi đứt gân), phát `[STOP]`/`[SWITCH]` trực tiếp trên viên FDC và hướng dẫn đổi sang viên đơn chất của thành phần còn an toàn (như Amlodipine hoặc Ezetimibe đơn chất).

---

#### [LIPID-R3-R2-02] CRITICAL — Thiếu 4/17 Hồ sơ Thuốc cốt lõi (`lovastatin`, `fluvastatin`, `cholestyramine`, `colesevelam`) kéo theo Lệnh `[CONTINUE]` Lovastatin 40 mg cùng Clarithromycin / Paxlovid với `0` Cảnh báo

- **Vị trí mã nguồn**: `kb/drugs/`, `src/modules/lipid/helpers.safety.ts:46-54, 323-375`, `src/modules/lipid/rules.ddi.cyp.ts`, `src/modules/lipid/rules.ddi.cv.ts`, `src/engine/safety/gates.ts:198`, `src/engine/safety/reviewMeds.ts:202`, `kb/interactions/statin.json`.
- **Phân tích Dược lâm sàng & Cơ chế lỗi**:
  1. Thư mục `kb/drugs/` thiếu 4 trong số 17 thuốc hạ lipid cốt lõi (`lovastatin.json`, `fluvastatin.json`, `cholestyramine.json`, `colesevelam.json`), đồng thời thiếu ánh xạ bí danh `omega3_ethyl_esters` -> `omega3`.
  2. Nguy hiểm nhất: `lovastatin` và `fluvastatin` **ĐÃ ĐƯỢC ĐƯA VÀO `STATIN_DRUG_IDS`** (`helpers.safety.ts:46-54`), khiến hệ thống nhận diện bệnh nhân đang uống statin, **NHƯNG** cả hai hoạt chất này lại bị bỏ quên hoàn toàn trong `hasDoseViolation()`, `rules.ddi.cyp.ts`, `rules.ddi.cv.ts`, `gates.ts`, `reviewMeds.ts` và các mục CYP3A4/tim mạch trong `kb/interactions/statin.json`! Lovastatin chuyển hóa phụ thuộc hoàn toàn vào CYP3A4 tại ruột và gan (tương tự Simvastatin), bị chống chỉ định tuyệt đối khi dùng cùng Clarithromycin, Itraconazole, Ketoconazole, Posaconazole, Ritonavir, Nirmatrelvir/ritonavir (Paxlovid), Cobicistat.
- **Bằng chứng thực thi `evaluate()`**:
  - `KB_01` (`lovastatin 40 mg + clarithromycin 500 mg`, ASCVD đạt đích LDL 1.2 mmol/L): Xuất trực tiếp **`[CONTINUE] rec_lipid_goal_achieved_continue (drug=lovastatin, title='Tiếp tục duy trì lovastatin liều hiện tại')`** kèm **`ALERTS: (0 alerts)`**!
  - `KB_02` (`lovastatin 40 mg + nirmatrelvir_ritonavir` [Paxlovid], LDL 1.2 mmol/L): Xuất trực tiếp **`[CONTINUE] rec_lipid_goal_achieved_continue (drug=lovastatin)`** kèm **`ALERTS: (0 alerts)`**!
  - `KB_03` (`lovastatin 40 mg + diltiazem 180 mg`, vượt gấp đôi trần FDA 20 mg/ngày): **`ALERTS: (0 alerts)`**.
  - `KB_05` (`fluvastatin 80 mg + cyclosporine 100 mg`, vượt gấp đôi trần tối đa `20 mg x 2 lần/ngày`): Xuất **`[CONTINUE] rec_lipid_goal_achieved_continue (drug=fluvastatin)`**.
  - `KB_06` (Đang uống `atorvastatin 40 mg + omega3_ethyl_esters 4 g/ngày`, TG 3.2 mmol/L): Không nhận ra `omega3_ethyl_esters` nên kê chồng **`[CONSIDER] icosapent_ethyl 4 g/ngày`** với `ALERTS (0)`.
- **Bằng chứng Tài liệu gốc (`Medical_Library_2026`)**:
  - `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` (Sec 5.2, p. 100): *"Lovastatin and simvastatin undergo significant CYP3A4 metabolism, whereas atorvastatin is metabolized to a lesser extent via this pathway. Consequently, lovastatin and simvastatin exhibit the highest number of clinically significant DDI among statins."*
  - `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` (Table 22 pp. 81–82 & Table 27 p. 98): *"Lovastatin — Contraindicated"* (với cobicistat/ritonavir/strong CYP3A4 inhibitors); *"Amiodarone + Lovastatin: Limit dose of lovastatin to 40 mg daily; Amlodipine + Lovastatin: Limit dose of lovastatin to 20 mg daily; Diltiazem + Lovastatin: Limit dose of lovastatin to 20 mg daily; Dronedarone + Lovastatin: Limit dose of lovastatin to 10 mg daily; Gemfibrozil + Lovastatin: Avoid combination; Ranolazine + Lovastatin: should not exceed 20 mg daily; Verapamil + Lovastatin: Limit dose of lovastatin to 20 mg daily; Cyclosporine + Fluvastatin: Limit to 20 mg twice daily"*.
- **Hướng khắc phục chi tiết**:
  1. Bổ sung đầy đủ 4 tệp `kb/drugs/{lovastatin,fluvastatin,cholestyramine,colesevelam}.json`.
  2. Đưa `lovastatin` vào cùng nhóm chống chỉ định tuyệt đối với `simvastatin` trước mọi chất ức chế mạnh CYP3A4 (và Erythromycin/Gemfibrozil/Cyclosporine) trong `helpers.safety.ts`, `rules.ddi.cyp.ts`, `gates.ts`, `reviewMeds.ts`, và `kb/interactions/statin.json`; thực thi trần Lovastatin (`≤10 mg` với Dronedarone; `≤20 mg` với Diltiazem/Verapamil/Amlodipine/Ranolazine; `≤40 mg` với Amiodarone/Ticagrelor) và trần Fluvastatin (`≤40 mg/ngày` chia 2 lần với Cyclosporine/Fluconazole).
  3. Ánh xạ `omega3_ethyl_esters` / `omacor` / `lovaza` -> `omega3` trong `KB_DRUG_ALIASES` và bổ sung quy tắc chặn trùng lặp nhóm chế phẩm Omega-3 (`icosapent_ethyl` + `omega3`).

---

#### [LIPID-R3-R2-03] CRITICAL — Cổng an toàn Cho con bú (`breastfeeding` / `lactation`) là Code chết hoàn toàn (Không dừng thuốc cũ & Kê mới Statin, Fenofibrate, Ezetimibe cho sản phụ đang cho con bú)

- **Vị trí mã nguồn**: `src/modules/lipid/index.ts:23-24`, `src/modules/lipid/helpers.safety.ts:124-125, 207`, `src/modules/lipid/rules.safety.organ.ts:39, 48, 65, 104`, `src/engine/safety/reviewMeds.ts:40`, `src/engine/safety/vitalAndRenalGates.ts:517`.
- **Phân tích Dược lâm sàng & Cơ chế lỗi**:
  Mã nguồn đã đăng ký `'breastfeeding'` và `'lactation'` vào `CUSTOM_LIPID_FLAGS`, các tệp KB thuốc đều ghi rõ `lactation.status: "contra"` hoặc `"avoid"`, và ngay tiêu đề hiển thị của `rules.safety.organ.ts` cũng viết *"mang thai hoặc cho con bú"*. Tuy nhiên, ở phần điều kiện logic (`when` và `assessStatinSafety`), lập trình viên chỉ kiểm tra duy nhất `hasCondition(ctx, 'pregnant')`, quên hoàn toàn `breastfeeding` / `lactation`!
- **Bằng chứng thực thi `evaluate()`**:
  - `LAC_01` (Sản phụ 30 tuổi đang cho con bú với `conditions: { breastfeeding: true, familialHypercholesterolemia: true }`, `customInputs: { breastfeeding: true, lactation: true }`, đang uống `atorvastatin 40 mg + fenofibrate 145 mg + bempedoic_acid 180 mg`): Xuất **0 lệnh `[STOP]`**, ngược lại còn phát **`[CONTINUE] atorvastatin` + `[START] ezetimibe 10 mg/ngày` + `[CONSIDER] icosapent_ethyl`**!
  - `LAC_02` (Sản phụ 29 tuổi đang cho con bú chưa dùng thuốc, FH LDL 5.4 mmol/L, TG 7.2 mmol/L): Kê đơn trực tiếp **`[START] Atorvastatin 40–80 mg/ngày` + `[START] Fenofibrate 145–200 mg/ngày`**!
- **Bằng chứng Tài liệu gốc (`Medical_Library_2026`)**:
  - `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` (Table 20, p. 76): Statins, Ezetimibe, Bempedoic acid, PCSK9 mAb, Inclisiran, Fibrates đều ghi *"Avoid use"* trong thời kỳ cho con bú (*"If taken during pregnancy, lactation can be resumed 5 days after last dose of fibric acid derivatives"*); Table 25 (p. 95): Statins Contraindications: *"Acute liver failure; decompensated cirrhosis; lactation"*; Table 26 (p. 96): Fibrates Contraindications: *"Severe renal dysfunction; active liver disease; gallbladder disease; during lactation"*.
  - `ESC_2019_dyslipidaemias_base.pdf` (p. 42): *"Lipid-lowering drugs should not be given when pregnancy is planned, during pregnancy, or during the breastfeeding period."*
  - `FDA_label_rosuvastatin.pdf` (p. 2 & p. 33): *"Lactation: Breastfeeding not recommended during treatment with CRESTOR"* / *"Do not breastfeed while taking CRESTOR"*; `FDA_label_atorvastatin.pdf` (p. 2): *"Lactation: Breastfeeding not recommended during treatment with LIPITOR"*.
- **Hướng khắc phục chi tiết**:
  1. Bổ sung `'breastfeeding'` (đồng nghĩa `'lactation'`) vào `STANDARD_CONDITIONS` trong `src/engine/types.ts` và thêm công tắc bật trên giao diện `src/modules/lipid/inputs.ts`.
  2. Trong `helpers.safety.ts`, tính `isLactating = hasCondition(ctx, 'breastfeeding') || hasLipidFlag(ctx, 'breastfeeding') || hasLipidFlag(ctx, 'lactation')` và đưa vào `hardBlockedForStatinInit`.
  3. Kích hoạt `[STOP]` và `[AVOID]` trong `rules.safety.organ.ts`, `reviewMeds.ts` và `vitalAndRenalGates.ts` cho mọi thuốc có `kbDrug.lactation?.status === 'contra' | 'avoid'` (chỉ cân nhắc nhựa gắn acid mật không hấp thu vào máu khi `TG < 3.4 mmol/L` hoặc lọc huyết tương LDL cho HoFH; nếu bắt buộc dùng Fenofibrate phòng viêm tụy cấp thì phải hướng dẫn ngừng cho con bú trong suốt đợt dùng và cho tới 5 ngày sau liều cuối).

---

#### [LIPID-R3-R2-04] CRITICAL — "Hố đen điều trị" (0 hành động cho Statin) khi dùng `Atorvastatin 40–80 mg + Erythromycin` và `Pravastatin` (không ghi mg) ở `eGFR < 30` / kèm `Clarithromycin`

- **Vị trí mã nguồn**: `src/modules/lipid/helpers.safety.ts:338-340, 370` đối chiếu `src/modules/lipid/rules.ddi.cyp.ts:128, 237` và `src/modules/lipid/rules.safety.renal.ts:429`.
- **Phân tích Dược lâm sàng & Cơ chế lỗi**:
  - Tại `helpers.safety.ts:338-340`, khi bệnh nhân uống `atorvastatin` có `doseMg > 20 && (hasClarithroOrItra || hasErythromycin)`, hàm `hasDoseViolation()` trả về `true`, làm khóa cứng toàn bộ các luật duy trì (`goal.achieved_maintain`), tăng liều (`intensify`) và phối hợp Ezetimibe/PCSK9i (`step2`, `step3`). Thế nhưng tại `rules.ddi.cyp.ts:128`, luật giảm liều `lipid.safety.ddi_cyp3a4_atorva_cap20` chỉ viết `if (!safety.hasClarithroOrItra) return false;` — **bỏ quên `safety.hasErythromycin`**!
  - Tương tự ở dòng `370` của `helpers.safety.ts`, `pravastatin` đặt `hasDoseViolation = true` khi `(hasSevereCkd || hasClarithroOrItra) && (doseMg === undefined || doseMg > 40)`, trong khi cả `ckd_pravastatin_cap40` (`rules.safety.renal.ts:429`) lẫn `ddi_clarithro_prava_cap40` (`rules.ddi.cyp.ts:237`) đều đòi `doseMg !== undefined && doseMg > 40`!
- **Bằng chứng thực thi `evaluate()`**:
  - `BH_01` (ASCVD chưa đạt đích LDL 2.6 mmol/L đang uống `atorvastatin 40 mg + erythromycin 500 mg QID`) & `BH_02` (ASCVD đạt đích LDL 1.2 mmol/L đang uống `atorvastatin 80 mg + erythromycin 500 mg`): Cả hai đều xuất **0 khuyến cáo cho Atorvastatin và Ezetimibe** (bệnh nhân bị bỏ mặc uống tiếp Atorvastatin 80 mg + Erythromycin!).
  - `BH_03` (`eGFR = 20`, đang uống `{ drugId: 'pravastatin' }` chưa ghi số mg) & `BH_04` (đang uống `{ drugId: 'pravastatin' } + clarithromycin`): Cả hai đều xuất **0 khuyến cáo cho Pravastatin**!
- **Bằng chứng Tài liệu gốc (`Medical_Library_2026`)**:
  - `FDA_label_atorvastatin.pdf` (Sec 7.1, p. 11): *"Strong Inhibitors of CYP 3A4: Concomitant administration of LIPITOR with strong inhibitors of CYP 3A4 can lead to increases in plasma concentrations of atorvastatin... Examples: Erythromycin, clarithromycin, itraconazole, ketoconazole, posaconazole, and voriconazole."*
- **Hướng khắc phục chi tiết**:
  1. Sửa `rules.ddi.cyp.ts:128` thành `if (!safety.hasClarithroOrItra && !safety.hasErythromycin) return false;` và bổ sung kiểm tra trần Atorvastatin `≤ 20 mg` vào `reviewStatinDoseCaps()` (`src/engine/safety/reviewMedsSpecialized.ts`).
  2. Đồng bộ điều kiện `doseMg === undefined || doseMg > 40` cho `ckd_pravastatin_cap40` và `ddi_clarithro_prava_cap40` (theo nguyên tắc Fail-Closed QA-1: khi chưa rõ số mg, phát khuyến cáo rà soát/giới hạn liều `≤ 40 mg/ngày`).

---

#### [LIPID-R3-R2-05] CRITICAL — Lỗi Fail-Open trong `getMedDoseMg()` & `parseDoseMg()` (Bỏ qua Tần suất `freq` và Đơn vị `unit = 'viên'`), khuyên `[CONTINUE]` gấp đôi trần độc cơ ở CKD & DDI

- **Vị trí mã nguồn**: `src/modules/lipid/helpers.safety.ts:157-166` (`getMedDoseMg`), `src/engine/safety/reviewMedsSpecialized.ts:18-28` (`parseDoseMg`).
- **Phân tích Dược lâm sàng & Cơ chế lỗi**:
  Cả hai hàm bóc tách liều đều chỉ lấy con số đầu tiên trong `med.dose`, bỏ qua hoàn toàn tần suất dùng trong ngày (`med.freq`: `'2 lần/ngày'`, `'BID'`, `'Sáng - tối'`) và đơn vị (`med.unit = 'viên'`, `'g'`) cũng như hàm lượng ghi trong tên thuốc (`'Lipanthyl 200M'`).
- **Bằng chứng thực thi `evaluate()`**:
  1. `DOSE_01` (`eGFR = 38` CKD G3b, đang uống `{ drugId: 'pitavastatin', dose: 2, unit: 'mg', freq: '2 lần/ngày' }` = **4 mg/ngày**, gấp đôi trần FDA `2 mg/ngày`): Đọc thành `2 <= 2` -> phát **`[CONTINUE] pitavastatin`** với `ALERTS (0)`!
  2. `DOSE_02` (`eGFR = 22` CKD G4, đang uống `{ drugId: 'rosuvastatin', dose: 10, unit: 'mg', freq: '2 lần/ngày' }` = **20 mg/ngày**, gấp đôi trần FDA `10 mg/ngày`): Đọc thành `10 <= 10` -> phát **`[CONTINUE] rosuvastatin`** với `ALERTS (0)`!
  3. `DOSE_05` (`{ drugId: 'simvastatin', dose: 20, unit: 'mg', freq: '2 lần/ngày' }` = **40 mg/ngày** + `amlodipine 10 mg`, gấp đôi trần FDA `20 mg/ngày`): Đọc thành `20 <= 20` -> phát **`[CONTINUE] simvastatin`**!
  4. `DOSE_03` (`eGFR = 40` CKD G3b, đang uống `{ drugId: 'fenofibrate', name: 'Lipanthyl 200M', dose: 1, unit: 'viên' }` = **200 mg/ngày**): Đọc `fenoDose = 1 <= 40` -> bỏ lọt hoàn toàn lệnh giảm liều thận `rec_lipid_feno_mod_ckd_reduce`!
- **Bằng chứng Tài liệu gốc (`Medical_Library_2026`)**:
  - `FDA_label_rosuvastatin.pdf` (Sec 2.5, p. 6: `CLcr < 30` tối đa `10 mg/ngày`); `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` (Table 27 p. 98 & Sec 4.2.8.8 p. 79: Simvastatin + Amlodipine `≤ 20 mg/ngày`; Pitavastatin `≤ 2 mg/ngày` ở eGFR 15–59; giảm liều Fenofibrate ở eGFR 30–59).
- **Hướng khắc phục chi tiết**:
  Xây dựng hàm chuẩn `parseDailyDoseMg(med: CurrentMed)` dùng chung toàn hệ thống: kiểm tra chặt `med.unit` (`'g'` nhân `1000`, `'mcg'` chia `1000`; nếu `'viên'`/`'cap'`/`'tab'` thì chỉ nhận khi trích xuất được hàm lượng mg rõ ràng từ `med.name`, ngược lại trả về `undefined` theo QA-1 Fail-Closed), sau đó nhân với hệ số tần suất từ `med.freq` (`2 lần`/`bid`/`q12h`/`sáng - tối` -> `×2`; `3 lần`/`tid` -> `×3`; `4 lần`/`qid` -> `×4`).

---

#### [LIPID-R3-R2-06] CRITICAL — Bỏ trống hoàn toàn Cổng Sàng lọc Dị ứng / Quá mẫn Thuốc (`allergies`)

- **Vị trí mã nguồn**: `src/modules/lipid/**`, `src/engine/safety/gates.ts`, `src/engine/safety/reviewMeds.ts`.
- **Phân tích & Thực nghiệm `evaluate()`**:
  - `ALG_01` (Bệnh nhân ASCVD chưa dùng thuốc, LDL 3.6 mmol/L, khai báo dị ứng `atorvastatin` ở cả `allergies: ['atorvastatin']`, `customInputs: { allergies: 'atorvastatin' }` và `conditions: { allergy_atorvastatin: true }`): Hệ thống vẫn kê trực tiếp **`[START] Atorvastatin 40–80 mg/ngày`** với `ALERTS (0)`.
  - `ALG_02` (Đang uống `atorvastatin 40 mg + ezetimibe 10 mg` dù đã ghi nhận dị ứng cả hai thuốc): Hệ thống phát **`[CONTINUE] atorvastatin` + `[CONTINUE] ezetimibe`** với `ALERTS (0)`.
- **Bằng chứng Tài liệu gốc (`Medical_Library_2026`)**:
  - `FDA_label_atorvastatin.pdf` (Sec 4, p. 5): *"Hypersensitivity to atorvastatin or any excipients in LIPITOR. Hypersensitivity reactions, including anaphylaxis, angioneurotic edema, erythema multiforme, Stevens-Johnson syndrome, and toxic epidermal necrolysis, have been reported."*
  - `FDA_label_rosuvastatin.pdf` (Sec 4, p. 6); `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` (Table 25 p. 95 & Table 26 p. 96).
- **Hướng khắc phục chi tiết**:
  Bổ sung `allergies?: string[]` vào `Patient` (`src/engine/types.ts`), chặn ở tầng chung `reviewMeds.ts` (`[STOP]` thuốc đang dùng bị dị ứng) & `gates.ts` (`[AVOID]` thuốc định kê bị dị ứng), đồng thời bổ sung bộ chọn hoạt chất thay thế không dị ứng trong `src/modules/lipid/` (ví dụ dị ứng `atorvastatin` -> chuyển sang `rosuvastatin` hoặc `pitavastatin`).

---

### NHÓM MAJOR (7 PHÁT HIỆN NGHIÊM TRỌNG)

---

#### [LIPID-R3-R2-07] MAJOR — Kê trùng 2 Statin cùng lúc ở bệnh nhân HIV + ASCVD dùng ARV có Ritonavir/Cobicistat & Bỏ sót trần `Rosuvastatin ≤ 10 mg` với `Atazanavir/ritonavir`, `Lopinavir/ritonavir`

- **Vị trí mã nguồn**: `src/modules/lipid/rules.statin.special.ts:45-51`, `src/modules/lipid/rules.ddi.cyp.ts:302`, `src/modules/lipid/rules.ddi.oatp.ts`.
- **Thực nghiệm `evaluate()`**:
  - `ROSU_03` (HIV + ASCVD, LDL 3.5 mmol/L, đang dùng `lopinavir_ritonavir`): Do `ddiBlocksStandardStatinStart = true` làm `coveredByHighRiskStart = false`, luật **dự phòng tiên phát** `rec_lipid_hiv_primary_statin` kích hoạt nhầm trên bệnh nhân **dự phòng thứ phát ASCVD** và phát đồng thời **`[START] Pitavastatin 4 mg/ngày` + `[CONSIDER] Rosuvastatin 5–10 mg/ngày`** với `ALERTS (0)`!
  - `ROSU_04` (HIV + ASCVD, LDL 1.3 mmol/L, đang uống `rosuvastatin 40 mg + atazanavir 300 mg + ritonavir 100 mg`): Xuất **`[CONTINUE] rosuvastatin` ở liều 40 mg/ngày** (gấp 4 lần trần tối đa 10 mg/ngày của FDA!) với `ALERTS (0)`.
- **Bằng chứng Tài liệu gốc**: `FDA_label_rosuvastatin.pdf` (Sec 7.1 Table 3, p. 12: Atazanavir/ritonavir & Lopinavir/ritonavir -> khởi đầu 5 mg, tối đa `10 mg/ngày`); `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` (Table 22, pp. 80–82).
- **Hướng khắc phục**: Chặn `lipid.hiv.primary_prevention` khi bệnh nhân đã có ASCVD hoặc FH (`hasAscvdEquivalent(ctx)`), loại trừ phát trùng hai thẻ statin, và bổ sung trần `Rosuvastatin ≤ 10 mg/ngày` cho `atazanavir` / `lopinavir_ritonavir` (cùng lưu ý khởi đầu Pitavastatin 1–2 mg khi dùng với Atazanavir).

---

#### [LIPID-R3-R2-08] MAJOR — Bỏ sót Tương tác Ức chế OATP1B1/BCRP nặng của Rosuvastatin với Thuốc Ung thư & Kháng virus HCV (`Darolutamide` ≤ 5 mg, `Regorafenib` / `Capmatinib` ≤ 10 mg, `Febuxostat` ≤ 20 mg, `Sofosbuvir/velpatasvir/voxilaprevir` tránh phối hợp)

- **Vị trí mã nguồn**: `src/modules/lipid/helpers.safety.ts`, `src/modules/lipid/rules.ddi.oatp.ts`, `kb/interactions/statin.json`.
- **Thực nghiệm `evaluate()`**: Kịch bản `ROSU_01` (`rosuvastatin 20 mg + darolutamide 600 mg BID` — tăng AUC Rosuvastatin **5.2 lần**, trần FDA `5 mg/ngày`) và `ROSU_02` (`rosuvastatin 20 mg + regorafenib 160 mg` — trần FDA `10 mg/ngày`) đều xuất **`[CONTINUE] rosuvastatin` 20 mg/ngày** với **`ALERTS: (0 alerts)`**.
- **Bằng chứng Tài liệu gốc**: `FDA_label_rosuvastatin.pdf` (Sec 7.1, pp. 11–13: *Concomitant Use Not Recommended* với `sofosbuvir/velpatasvir/voxilaprevir` & `ledipasvir/sofosbuvir`; trần `5 mg` với `darolutamide`; trần `10 mg` với `regorafenib`, `capmatinib`, `glecaprevir/pibrentasvir`, `elbasvir/grazoprevir`, `simeprevir`; trần `20 mg` với `febuxostat`, `teriflunomide`, `fostamatinib`, `tafamidis`).
- **Hướng khắc phục**: Bổ sung đầy đủ các chất ức chế OATP1B1/BCRP trên vào `rules.ddi.oatp.ts`, `reviewStatinDoseCaps()` và `kb/interactions/statin.json` (đặc biệt lưu ý `febuxostat` là thuốc cốt lõi của phân hệ `gout` trong chính GDMT-VN!).

---

#### [LIPID-R3-R2-09] MAJOR — Bỏ lọt Đứt gân (`tendonRuptureHistory`) & Gút cấp ở bệnh nhân đang dùng `bempedoic_acid` ngoài nhánh hẹp `isIntoleranceEscalationActive` (và dùng `HOLD` thay vì `STOP` khi đứt gân)

- **Vị trí mã nguồn**: `src/modules/lipid/rules.intolerance.ts:81-106`, `src/modules/lipid/rules.tg.ts:139-143`, `src/modules/lipid/rules.inpatient.prior.ts:96-100`, `src/engine/safety/reviewMeds.ts`.
- **Thực nghiệm `evaluate()`**: Trong cả 3 kịch bản đang uống `bempedoic_acid 180 mg` kèm `tendonRuptureHistory: true` và `gout: true`: `BEMP_01` (phối hợp trên nền Atorvastatin + Ezetimibe không gắn `statinIntolerance`), `BEMP_02` (`statinIntolerance=true` nhưng LDL đã đạt đích `1.2 mmol/L`), và `BEMP_03` (`setting='inpatient'` ACS cấp) -> hệ thống xuất **0 lệnh `STOP`/`HOLD` Bempedoic acid và `ALERTS (0)`**!
- **Bằng chứng Tài liệu gốc**: `FDA_label_bempedoic_acid.pdf` (Sec 5.2, p. 4): *"Discontinue NEXLETOL immediately if the patient experiences rupture of a tendon... Avoid NEXLETOL in patients who have a history of tendon disorders or tendon rupture."*
- **Hướng khắc phục**: Chuyển quy tắc an toàn cho `bempedoic_acid` đang dùng sang `rules.safety.muscle.ts` (`setting: 'both'`, chạy độc lập với `statinIntolerance` và `isTargetAchieved`) và `reviewMeds.ts`, phát bắt buộc `action: 'STOP'` khi đứt gân và `action: 'HOLD'` khi gút cấp.

---

#### [LIPID-R3-R2-10] MAJOR — Bỏ sót Chống chỉ định Sỏi túi mật (`cholelithiasis` / `gallbladderDisease`) của Fenofibrate & Lọt Chống chỉ định Gan của Fenofibrate / Ezetimibe khi chạy Module liên chuyên khoa

- **Vị trí mã nguồn**: `src/modules/lipid/rules.tg.ts:174`, `src/modules/lipid/rules.inpatient.other.ts:115`, `src/engine/safety/clinicalStates.ts:180-195`, `src/engine/safety/reviewMeds.ts:398-412`.
- **Thực nghiệm `evaluate()`**:
  - `HEP_07` (TG `7.5 mmol/L`, có sỏi túi mật `cholelithiasis: true`): Kê trực tiếp **`[START] Fenofibrate 145–200 mg/ngày`** với `ALERTS (0)`, dù chính `kb/drugs/fenofibrate.json:77-81` đã ghi chống chỉ định `code: "cholelithiasis"`. `HEP_03` (đang uống `fenofibrate 145 mg` có sỏi túi mật): **0 lệnh `[STOP]`**.
  - `HEP_06` (`selectedModules: ['htn']`, `activeLiverDisease: true`, `childPugh: 'B'`, đang uống `fenofibrate 145 mg + ezetimibe 10 mg`): Xuất **0 lệnh `[STOP]`/`[HOLD]`** cho cả hai thuốc do `evaluateHepaticSafety()` chỉ chặn `fenofibrate` ở Child-Pugh C và hoàn toàn không kiểm tra `ezetimibe`.
- **Bằng chứng Tài liệu gốc**: `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` (Table 26 p. 96 & Table 25 p. 95); `FDA_label_ezetimibe.pdf` (Sec 8.7, p. 9).
- **Hướng khắc phục**: Chặn khởi trị và phát `[STOP] fenofibrate` khi có sỏi túi mật / bệnh túi mật (chuyển sang Omega-3 liều cao 4 g/ngày khi TG ≥ 5.6 mmol/L); bổ sung `hepatic.status = "contra"` vào `fenofibrate.json` và đưa cả `fenofibrate` lẫn `ezetimibe` (Child-Pugh B/C, bệnh gan hoạt động) vào `evaluateHepaticSafety()`.

---

#### [LIPID-R3-R2-11] MAJOR — Lỗ hổng An toàn & Tương tác Nhựa gắn Acid mật (`cholestyramine`, `colesevelam`): Chống chỉ định Tăng TG nặng (`≥ 5.6 mmol/L`), Thai kỳ kèm Tăng TG (`≥ 3.4 mmol/L`) & Tương tác Cản trở Hấp thu Warfarin, Levothyroxine, Digoxin, Lợi tiểu

- **Vị trí mã nguồn**: `src/modules/lipid/rules.safety.organ.ts:81-96`, `src/modules/lipid/rules.tg.ts`, `kb/interactions/lipid_ddi.json`.
- **Thực nghiệm `evaluate()`**:
  - `BAS_01` (`tg = 8.2 mmol/L` [~726 mg/dL > ngưỡng chống chỉ định 500 mg/dL], đang uống `colesevelam 3750 mg/ngày`): Phát **0 lệnh `[STOP]` `colesevelam`** (thuốc làm tăng vọt TG thêm gây viêm tụy cấp!).
  - `BAS_02` (Thai phụ FH có `ldl = 5.2 mmol/L` và `tg = 4.5 mmol/L` [~398 mg/dL ≥ 300 mg/dL]): Thẻ `rec_lipid_pregnancy_stop_atorvastatin` vẫn gợi ý nhựa gắn acid mật mà không cảnh báo chống chỉ định khi `TG ≥ 3.4 mmol/L`.
  - `BAS_03` (`cholestyramine + warfarin + levothyroxine + digoxin + furosemide`): Xuất **`ALERTS: (0 alerts)`**.
- **Bằng chứng Tài liệu gốc**: `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` (Table 5 p. 29, Sec 4.2.8.4 pp. 75 & 77: *"They should not be used when TG levels ≥300 mg/dL (3.4 mmol/L)"*; Table 25 p. 95: chống chỉ định `TG > 500 mg/dL` & tiền sử viêm tụy do TG); `ESC_2019_dyslipidaemias_base.pdf` (Sec 8.3.4, p. 31: bắt buộc uống thuốc khác trước ≥ 1 giờ hoặc sau ≥ 4 giờ).
- **Hướng khắc phục**: Phát `[STOP]` nhựa gắn acid mật khi `TG ≥ 5.6 mmol/L` (cảnh báo tránh dùng khi `TG ≥ 3.4 mmol/L`, kể cả trong thai kỳ), và bổ sung `ix.bile_acid_resin_oral_absorption` vào `kb/interactions/lipid_ddi.json` cho Warfarin/Acenocoumarol, Levothyroxine, Digoxin, lợi tiểu Thiazide/Quai, Sulfonylurea, Mycophenolate.

---

#### [LIPID-R3-R2-12] MAJOR — Gắn sai Trích dẫn Chéo Hoạt chất, Tự mâu thuẫn `Atorvastatin ≤ 20 mg + Itraconazole`, Rò rỉ `doseLimit` sai thuốc trong `statin.json` & Thiếu `Pitavastatin + Erythromycin / Rifampin` ở KB chung

- **Vị trí mã nguồn**: `src/modules/lipid/rules.tg.ts:168, 267`, `src/modules/lipid/rules.inpatient.other.ts:109, 199`, `src/engine/safety/gates.ts:203`, `src/engine/safety/reviewMeds.ts:207`, `src/engine/safety/interactions.ts:484-493`, `kb/interactions/statin.json:37-51, 103-119`.
- **Thực nghiệm `evaluate()`**:
  1. `CIT_01` (`tg = 7.5` trên nền `warfarin`): Thẻ `[START] Fenofibrate` gắn nhầm `fda.rosuvastatin.warfarin_inr` (nhãn Rosuvastatin!).
  2. `CIT_02` (`selectedModules: ['htn']`, `simvastatin 40 mg + clarithromycin`): Thẻ `[STOP] Simvastatin` gắn nhầm `fda.atorvastatin.itraconazole_limit_20mg` (nhãn trần 20 mg Atorvastatin!).
  3. `DDI_01` (`atorvastatin 10 mg + itraconazole`): Vừa phát **`[CONTINUE] atorvastatin`** trong phác đồ, vừa phát **`ALERT [critical] ix.statin_itraconazole` (`severity: 'contraindicated'`)** đối nghịch hoàn toàn!
  4. `DDI_02` (`pravastatin 20 mg + cyclosporine`) & `KB_05` (`fluvastatin 80 mg + cyclosporine`): Alert `ix.statin_cyclosporine` in ra câu sai hoạt chất: **`"[Giới hạn liều tối đa rosuvastatin: ≤ 5 mg 1 lần/ngày] (Phát hiện: pravastatin, cyclosporine)"`**!
  5. `DDI_03` (`selectedModules: ['htn']`, `pitavastatin 4 mg + erythromycin 500 mg`): **0 lệnh `REDUCE`** và **`ALERTS: (0 alerts)`**.
- **Hướng khắc phục**: Sửa đúng mã trích dẫn theo từng hoạt chất; tách `ix.statin_itraconazole` (Simvastatin/Lovastatin `contraindicated` vs Atorvastatin `major` trần `≤ 20 mg`); kiểm tra `presentSet.has(kbRule.doseLimit.drugId)` tại `interactions.ts:484` và tách trần liều riêng cho Cyclosporine; bổ sung `ix.pitavastatin_erythromycin` (`≤ 1 mg`) & `ix.pitavastatin_rifampin` (`≤ 2 mg`) vào `statin.json` và `reviewStatinDoseCaps()`.

---

#### [LIPID-R3-R2-13] MAJOR — Lỗi Ca bệnh mẫu Cấp cứu ACS thiếu `setting: 'inpatient'`, Ca mẫu Không dung nạp Statin thiếu Bempedoic acid & Báo giảm liều giả với `Lipanthyl 67 mg` tại Việt Nam

- **Vị trí mã nguồn**: `src/modules/lipid/presets.ts:11-36, 88-111`, `src/ui/AppShell.tsx:88`, `kb/thresholds/lipid.json`, `src/modules/lipid/rules.safety.renal.ts:238`.
- **Thực nghiệm `applyPresetSelection()` + `evaluate()`**:
  1. `lipid_preset_1_acs_inpatient` (*"Hội chứng vành cấp (ACS) nhập viện trong 24 giờ đầu"*): Thiếu `setting: 'inpatient'` nên `applyPresetSelection` ép giao diện về `'outpatient'` (kể cả khi đang mở tab Nội viện!), làm mất toàn bộ bộ luật ACS nội viện 24 giờ và hẹn tái khám sai mốc (8 tuần thay vì 4–6 tuần sau ACS).
  2. `lipid_preset_4_statin_intolerance` (*"...Phác đồ Bempedoic acid + Ezetimibe"*): Do `currentMeds: []`, thực tế chỉ sinh `[START] Ezetimibe 10 mg`, không hề sinh Bempedoic acid như tiêu đề và mô tả.
  3. `DOSE_04` (`profile: 'VN'`, `eGFR = 50` CKD G3a, đang uống `Lipanthyl 67 mg` micronized — viên hàm lượng thấp chuẩn duy nhất lưu hành phổ biến tại Việt Nam cho CKD G3): Bị chốt cứng `fenoDose > 40` báo lỗi giả **`[REDUCE] Giảm liều Fenofibrate đang dùng... (từ 40 mg 1 lần/ngày)`**!
- **Hướng khắc phục**: Thêm `setting: 'inpatient'` cho `lipid_preset_1_acs_inpatient`; thêm `ezetimibe 10 mg` vào `currentMeds` của `lipid_preset_4_statin_intolerance`; tại `rules.safety.renal.ts:238`, chỉ kích hoạt `[REDUCE]` khi `fenoDose > 67` (tức các viên liều chuẩn cao 130/145/160/200 mg) và hiển thị dải liều chỉnh thận phù hợp thị trường (`67 mg` micronized tại VN hoặc `40–54 mg` nanocrystal/fenofibrate tại Mỹ).

---

### NHÓM MINOR & SUGGESTION (3 PHÁT HIỆN)

---

#### [LIPID-R3-R2-14] MINOR — Thiếu Cảnh báo Nhược cơ toàn thân / Nhược cơ thể mắt (`myasthenia_gravis` / `ocular_myasthenia`) của nhóm Statin và Ezetimibe

- **Vị trí & Bằng chứng**: `kb/drugs/{atorvastatin,rosuvastatin,simvastatin,pravastatin,pitavastatin,ezetimibe}.json`, kịch bản `MG_01` (`myastheniaGravis: true` trên nền `atorvastatin 80 mg + ezetimibe 10 mg` -> `0` cảnh báo). Đối chiếu `FDA_label_rosuvastatin.pdf` (p. 10) & `FDA_label_atorvastatin.pdf` (p. 10).
- **Khắc phục**: Bổ sung cảnh báo theo dõi sụp mi, nhìn đôi, khó nuốt, yếu cơ hô hấp vào KB thuốc và mảng `warnings` khi bệnh nhân có tiền sử nhược cơ.

---

#### [LIPID-R3-R2-15] MINOR — Sai biến liều trên Ma trận eGFR (`matrix.egfr.statin.ts`), thiếu cảnh báo thận trọng `Simvastatin 40 mg` ở `eGFR < 30` & mâu thuẫn tần suất `target` trong `omega3.json`

- **Vị trí & Bằng chứng**:
  1. `src/modules/lipid/matrix.egfr.statin.ts`: dòng `104` (`Rosuvastatin` cột `g3b`) dùng nhầm `${atorvaModMax}` hiển thị `"5–20 mg/ngày"` thay vì `"5–40 mg/ngày"`; dòng `65` (`Atorvastatin` cột `g5`) hiển thị `"20–40 mg/ngày"` mâu thuẫn với ghi chú không cần chỉnh liều (`10–80 mg/ngày`).
  2. `REN_02` (`eGFR = 18`, `simvastatin 40 mg`): Phát `[CONTINUE]` không kèm cảnh báo thận trọng dù `simvastatin.json:55-63` ghi *"khởi đầu 5 mg/ngày, thận trọng tuyệt đối ở liều > 10 mg"*.
  3. `kb/drugs/omega3.json:21-22`: `start` ghi `2 g, 2 lần/ngày` nhưng `target` lại ghi `4 g, 1 lần/ngày`, và thiếu lưu ý chế phẩm hỗn hợp EPA+DHA có thể làm tăng LDL-C (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Table 26 p. 96).

---

#### [LIPID-R3-R2-16] SUGGESTION — Tự động hóa thực thi `kbDrug.gates` ở tầng Engine chung & Nâng cấp `InteractionEntry.doseLimits[]` đa hoạt chất

- **Đề xuất**: Nâng cấp `InteractionEntry` trong `src/kb-types/schema.ts` hỗ trợ mảng `doseLimits?: Array<{ drugId, maxDose, unit, actionOnExceed }>` và tích hợp bộ thông dịch `kbDrug.gates` vào `evaluateSafetyGates()` / `reviewCurrentMedications()` để mọi trần liều thận/gan/tương tác được bảo vệ xuyên suốt cả 9 phân hệ từ một nguồn chân lý duy nhất.

---

## 4. Điều kiện Tiên quyết để Đạt `PASS` ở Vòng Tiếp theo

Để phân hệ `lipid` đạt chứng nhận an toàn Dược lâm sàng (`verdict: "PASS"`), đội phát triển cần giải quyết triệt để **toàn bộ 6 lỗi `critical` và 7 lỗi `major`** (`LIPID-R3-R2-01` đến `LIPID-R3-R2-13`), trọng tâm theo thứ tự ưu tiên:
1. **Phân rã đầy đủ Viên phối hợp cố định FDC hạ mỡ máu** (`LIPID-R3-R2-01`) ở cả `drugClassify.ts` và `lipid/helpers.safety.ts`.
2. **Bổ sung 4 tệp KB thiếu (`lovastatin`, `fluvastatin`, `cholestyramine`, `colesevelam`) + khóa chặt DDI CYP3A4 của Lovastatin** (`LIPID-R3-R2-02`) và tương tác nhựa gắn acid mật (`LIPID-R3-R2-11`).
3. **Kích hoạt cổng Cho con bú (`breastfeeding` / `lactation`)** (`LIPID-R3-R2-03`) và **cổng Dị ứng thuốc (`allergies`)** (`LIPID-R3-R2-06`).
4. **Xóa bỏ hố đen điều trị `Atorvastatin + Erythromycin` / `Pravastatin` không liều** (`LIPID-R3-R2-04`) và **chuẩn hóa hàm tính tổng liều ngày theo `freq` + `unit`** (`LIPID-R3-R2-05`).
5. **Khắc phục 7 lỗi `major`** về HIV + ARV (`LIPID-R3-R2-07`), Rosuvastatin + Darolutamide/Regorafenib (`LIPID-R3-R2-08`), đứt gân với Bempedoic acid ở mọi nhánh (`LIPID-R3-R2-09`), chống chỉ định sỏi túi mật của Fenofibrate & gan liên chuyên khoa (`LIPID-R3-R2-10`), trích dẫn chéo & xung đột `statin.json` (`LIPID-R3-R2-12`), và `presets.ts` + ngưỡng `Lipanthyl 67 mg` (`LIPID-R3-R2-13`).
