# Báo cáo Kiểm định Độc lập Vòng 1 — Phân hệ Tăng huyết áp (`htn`)
**Vai trò:** Reviewer R2 – Dược sĩ Lâm sàng (Clinical Pharmacology & Drug Knowledge Base Auditor)  
**Ngày kiểm định:** 27/10/2026  
**Phạm vi kiểm định (Read-Only):**
- Toàn bộ mã nguồn phân hệ `src/modules/htn/` (`index.ts`, `inputs.ts`, `matrix.ts`, `pathway.ts`, `presets.ts`, `rules.outpatient.ts`, `rules.inpatient.ts`).
- **18 thuốc sở hữu của `htn`** trong `kb/drugs/`: `amlodipine`, `nifedipine`, `felodipine`, `lercanidipine`, `indapamide`, `hydrochlorothiazide`, `chlorthalidone`, `doxazosin`, `methyldopa`, `clonidine`, `moxonidine`, `nicardipine`, `labetalol`, `nitroglycerin`, `urapidil`, `esmolol`, `sodium_nitroprusside`, `clevidipine`.
- **9 thuốc dùng chéo liên phân hệ** trong `kb/drugs/`: `perindopril`, `losartan`, `valsartan`, `telmisartan`, `spironolactone`, `eplerenone`, `bisoprolol`, `furosemide`, `magnesium_sulfate`.
- Tài liệu gốc đối chiếu trực tiếp tại `Medical_Library_2026`: Nhãn thuốc FDA DailyMed (`Norvasc`, `Chlorthalidone USP`, `Cleviprex`, `Catapres`, `Cardura`, `Cozaar`, `Aldactone`) & EMA/HPRA SmPC (`Zanidip`, `Natrilix SR`, `Physiotens`, `Ebrantil IV`, `Coversyl Arginine`, `Cardicor`), cùng `ESC 2024 Elevated BP & Hypertension`, `ESC 2025 CVD in Pregnancy`, `AHA/ACC 2025 High Blood Pressure Guideline`, `VSH/VNHA 2022`.
- Chạy kiểm chứng thực tế `evaluate()`, `thFor()`, `drug()`, `dose()`, `fmtDose()` qua Vitest (`docs/reviews/htn/scratch/r2_verify_runtime.test.ts`).

---

## 1. Tổng hợp Kết quả Kiểm định

| Mức độ (`severity`) | Số lượng | Phân bố theo loại (`itemType`) | Ý nghĩa theo `REVIEW_PROTOCOL.md` |
|---|---:|---|---|
| **Critical** | **9** | `drug` (2), `rule` (5), `matrix` (1), `missing` (1) | Có nguy cơ gây hại trực tiếp / đe dọa tính mạng bệnh nhân nếu thực hành theo khuyến cáo xuất ra |
| **Major** | **19** | `drug` (11), `rule` (4), `matrix` (2), `threshold` (1), `rule/drug` (1) | Sai liều nhãn thuốc/guideline, bỏ sót chống chỉ định/suy gan, mâu thuẫn `matrix.ts` vs `DrugEntry` (QA-8), trích dẫn giả định (QA-7), dùng nhầm ngưỡng trùng số (QA-10) |
| **Minor** | **3** | `ui` (1), `drug` (2) | Chuỗi hiển thị `fmtDose()` lặp từ / lỗi `"undefined undefined"`, thiếu biệt dược gốc phổ biến tại VN (`Norvasc`, `Aldomet`, `Perdipine`) và hàm lượng viên |
| **Suggestion** | **3** | `missing` (2), `matrix` (1) | Ánh xạ chế phẩm viên phối hợp SPC tại VN, tự động sinh `htnRenalMatrix` từ `DrugEntry.renal`, hướng dẫn ngưng thuốc trước xét nghiệm ARR |
| **Tổng cộng** | **34** | File dữ liệu máy đọc: `docs/reviews/htn/round1_R2.json` | **Kết luận Vòng 1 (Vai R2): FAIL** |

---

## 2. Chi tiết Các Phát hiện Nghiêm trọng (`CRITICAL`: `HTN-R2-01` → `HTN-R2-09`)

### [HTN-R2-01] `critical` | `drug` | `lercanidipine` — Cho phép dùng liều 10 mg/ngày ở suy thận nặng (`eGFR < 30` & lọc máu) và bỏ sót chống chỉ định tương tác CYP3A4 mạnh / Ciclosporin (tăng AUC gấp 15 lần)
- **Hiện trạng trong KB & Module:**
  - `kb/drugs/lercanidipine.json` (dòng 47–55) khai báo dải thận `"eGFRTo": 30` là `"initiate": "caution", "continue": "caution", "dose": "10 mg 1 lần/ngày"`.
  - Trường `contraindications` (dòng 71–77) chỉ có duy nhất `[{"condition": "severe_liver_disease"}]`.
  - `lercanidipine` hoàn toàn vắng mặt khỏi `htnRenalMatrix` và không có bất kỳ quy tắc `STOP`/`AVOID` nào trong `rules.outpatient.ts` khi `eGFR < 30 mL/min/1.73m²`.
- **Bằng chứng gốc & Runtime:**
  - **`Zanidip_SmPC.pdf` (EMA/HPRA, Mục 4.2 trang 1 & Mục 4.3 Contraindications trang 2):**
    > *"ZANIDIP is contraindicated in patients with severe hepatic impairment or in patients with severe renal impairment ( GFR < 30 ml/min), including patients undergoing dialysis."*  
    > *"4.3 Contraindications: ... Left ventricular outflow tract obstruction; Untreated congestive cardiac failure; Unstable angina pectoris or recent (within 1 month) myocardial infarction; Severe hepatic impairment; Severe renal impairment (GFR < 30 ml/min), including patients undergoing dialysis; Co-administration of: strong inhibitors of CYP3A4 (see section 4.5), ciclosporin (see section 4.5), grapefruit or grapefruit juice."*
  - **`Zanidip_SmPC.pdf` (Mục 4.4 trang 2 & Mục 4.5 trang 3):** Ketoconazole làm tăng AUC đồng phân có hoạt tính S-lercanidipine **gấp 15 lần** và $C_{\max}$ **gấp 8 lần**; ciclosporin làm tăng nồng độ lercanidipine huyết tương **gấp 3 lần**; ở bệnh nhân thẩm phân phúc mạc, lercanidipine gây dịch lọc màng bụng đục do tăng triglycerid dễ chẩn đoán nhầm với viêm phúc mạc nhiễm trùng.
  - **Runtime `evaluate()` Ca C1** (Nam 68 tuổi, `scr = 310 µmol/L` $\rightarrow$ `eGFR ~17 mL/min/1.73m²`, đang dùng `lercanidipine 10 mg` + `losartan 50 mg`): Engine **không phát bất kỳ lệnh `STOP`/`AVOID` nào cho `lercanidipine`**. **Ca C12** (đang dùng `lercanidipine` + `ketoconazole` + `ciclosporin`): `alerts = []`.
- **Hướng khắc phục:** Đổi dải `eGFR < 30` (và lọc máu) trong `lercanidipine.json` thành `"contra"`, bổ sung đầy đủ mã chống chỉ định (`severe_renal_failure`, `dialysis`, `strong_cyp3a4_inhibitors`, `ciclosporin`, `lvot_obstruction`, `decompensated_heart_failure`, `unstable_angina`), thêm vào `htnRenalMatrix` và thêm quy tắc dừng/chuyển sang `amlodipine`/`nifedipine LA` khi `eGFR < 30`.

---

### [HTN-R2-02] `critical` | `matrix` | `htnRenalMatrix.methyldopa.g4` — Ghi ngược chỉ dẫn chỉnh liều thận thành `"Giảm khoảng cách liều"` (uống dày hơn!) ở suy thận nặng CKD G4
- **Hiện trạng:** Trong `src/modules/htn/matrix.ts` (dòng 226), ô `methyldopa.g4` ghi:
  `g4: { initiate: 'caution', continue: 'caution', note: 'Giảm khoảng cách liều', citationIds: ['vsh.htn.2022.drugs_table_other'] }`.
- **Phân tích dược động học & nguy cơ lâm sàng:**
  - Methyldopa và chất chuyển hóa liên hợp sulfat còn hoạt tính thải trừ chủ yếu qua thận; thời gian bán thải kéo dài từ ~2 giờ lên 4–16 giờ khi suy thận nặng. Do đó, phải **kéo dài / tăng khoảng cách giữa các liều** (ví dụ từ mỗi 8 giờ giãn ra mỗi 12–24 giờ).
  - Cụm từ `"Giảm khoảng cách liều"` mang nghĩa rút ngắn thời gian giữa các lần uống (tăng số lần dùng trong ngày), dẫn đến tích lũy thuốc cấp tính, tụt huyết áp tư thế nặng, nhịp chậm và lơ mơ/ức chế thần kinh trung ương.
  - Ngoài ra, `kb/drugs/methyldopa.json` (dòng 39–45) lại ghi `eGFRFrom: 15 -> initiate: 'ok', continue: 'ok', dose: '250–500 mg x 2 lần/ngày'`, mâu thuẫn trực tiếp với `htnRenalMatrix`.
- **Hướng khắc phục:** Sửa ngay thành `'Kéo dài khoảng cách giữa các liều (mỗi 12–24 giờ)'` và đồng bộ `methyldopa.json` với `htnRenalMatrix`.

---

### [HTN-R2-03] `critical` | `drug` | `moxonidine` — Quá liều đơn tối đa ở suy thận vừa (`GFR 30–59 mL/min`) và bỏ sót chống chỉ định suy tim HFpEF/HFmrEF, nhịp chậm `< 50 bpm`, block AV độ II–III
- **Hiện trạng:** `kb/drugs/moxonidine.json` (dòng 38–45) đặt `"eGFRFrom": 30, "initiate": "ok", "continue": "ok", "dose": "0.2–0.4 mg 1 lần/ngày"` (cho phép uống liều đơn **0.4 mg 1 lần/ngày** ở bệnh nhân suy thận vừa!), `contraindications` chỉ có `"hfref"` và `"severe_renal_failure"`, và toàn bộ file gắn duy nhất citation `"esc.hf.2026.moxonidine_contra"` (vi phạm QA-7).
- **Bằng chứng gốc & Runtime:**
  - **`Physiotens_moxonidine_SmPC.html` (EMA/HPRA, Mục 4.2 Posology & Mục 5.2):**
    > *"In patients with moderately impaired renal function (GFR > 30 ml/min but < 60 ml/min), the single dose should be not more than 0.2 mg and the daily dose not more than 0.4 mg moxonidine."* (AUC tăng 85%, độ thanh thải giảm 52%).
  - **`Physiotens_moxonidine_SmPC.html` (Mục 4.3 Contraindications):**
    > *"Moxonidine is contraindicated in patients with: ... sick sinus syndrome; bradycardia (resting heart rate < 50 beats/minute); atrio-ventricular-block 2nd and 3rd degree; cardiac insufficiency."* (Chống chỉ định cho **mọi suy tim**, không riêng HFrEF!).
  - **Runtime `evaluate()` Ca C2** (Nữ 64 tuổi, `scr = 150 µmol/L` $\rightarrow$ `eGFR ~35`, `HR = 48 bpm`, `conditions.hfpef = true`, đang dùng `moxonidine 0.4 mg` 1 lần/ngày): Engine **không phát bất kỳ lệnh `STOP`/`AVOID`/`REDUCE` nào**.
- **Hướng khắc phục:** Tách dải `eGFR 30–59 mL/min` (`caution`, liều đơn tối đa `0.2 mg/lần`, tổng liều tối đa `0.4 mg/ngày` chia 2 lần), bổ sung chống chỉ định `heart_failure` (mọi phân suất tống máu), `severe_bradycardia` (`HR < 50 bpm`), `sick_sinus_syndrome`, `second_third_degree_av_block`, và trích dẫn đúng `Physiotens SmPC`.

---

### [HTN-R2-04] `critical` | `rule` | `htn.inpatient.differentiate_crisis` — Đè xóa toàn bộ phác đồ đột quỵ/xuất huyết não do trùng `drugId: 'nicardipine'`, truyền thuốc giãn mạch đơn độc trong bóc tách ĐMC / ACS, và bỏ lọt hẹp van ĐMC khít
- **Hiện trạng & Bằng chứng Runtime `evaluate()`:**
  Trong `src/modules/htn/rules.inpatient.ts` (dòng 118–145), hễ `HA ≥ 180/120 mmHg` kèm bất kỳ `hasAcuteHmod = true`, luật `differentiate_crisis` phát `rec_htn_hypertensive_emergency_general` với `action: 'START', drugId: 'nicardipine', priority: 100`.
  1. **Xóa mất khuyến cáo chuyên biệt do gộp `drugId`:** Vì `mergeRecommendations` khử trùng theo `drugId: 'nicardipine'` và giữ khuyến cáo `priority: 100`, toàn bộ các khuyến cáo chuyên biệt mang `priority: 98–99` (`stroke_thrombolysis` hạ `≤ 185/110` trước rtPA, `stroke_no_thrombolysis` giảm MAP 15%, `intracerebral_hemorrhage` đích `130–140`, `hypertensive_encephalopathy`) **bị ghi đè và biến mất hoàn toàn khỏi kết quả**! Kiểm chứng **Ca C8b/C8c** (`BP 196/114`, `acuteIschemicStroke = true`, `thrombolysisEligible = true`): `rec_htn_emergency_stroke_thrombolysis` biến mất khỏi `plan.recommendations`!
  2. **Bóc tách động mạch chủ cấp (Ca C10, `BP 190/108`):** Phát đồng thời `[START] Nicardipine 5 mg/h` (`priority: 100`) bên cạnh `Esmolol` — thậm chí ngay cả khi `Esmolol` bị `HOLD`/`AVOID` (ví dụ kèm phù phổi cấp), engine vẫn phát lệnh truyền `Nicardipine` đơn độc gây phản xạ nhịp nhanh giao cảm làm tăng lực xé thành động mạch chủ ($dP/dt$), vi phạm quy tắc bắt buộc của `AHA/ACC 2025` Table 27 (trang 75).
  3. **Tiền sản giật nặng (`BP ≥ 180/120`):** Phát song song cả `[START] Nicardipine IV` lẫn `[START] Labetalol IV` ngay từ đầu, gây nguy cơ tụt HA mẹ đột ngột và suy thai cấp.
  4. **Hội chứng mạch vành cấp (`acuteAcsWithin24h`):** Không có luật riêng nên rơi vào `[START] Nicardipine IV` đơn độc (phản xạ nhịp nhanh làm tăng tiêu thụ oxy cơ tim; `VSH 2022` Bảng 14 trang 40 & `AHA/ACC 2025` Table 27 trang 75 yêu cầu `Nitroglycerin IV` / chẹn beta).
  5. **Hẹp van động mạch chủ khít (`severe_aortic_stenosis`):** Kiểm chứng **Ca C8b** (`conditions.severe_aortic_stenosis = true`) cho thấy engine vẫn phát `[START] nicardipine`, vi phạm chống chỉ định tuyệt đối tại `AHA/ACC 2025` Table 26 (trang 74: *"Contraindicated in advanced aortic stenosis"*) và chính `nicardipine.json`.
- **Hướng khắc phục:** Chuyển `rec_htn_hypertensive_emergency_general` thành khuyến cáo điều phối nhập ICU (`action: 'REFER'` hoặc `'MONITOR'`, **không gán `drugId: 'nicardipine'`**) khi đã có luật HMOD chuyên biệt đảm nhận chọn thuốc; bổ sung luật riêng cho `acuteAcsWithin24h`; bổ sung cổng kiểm tra `severe_aortic_stenosis` ở mọi luật kê `nicardipine`/`clevidipine`.

---

### [HTN-R2-05] `critical` | `rule` | `htn.outpatient.step1_dual_combination` — Vô hiệu hóa toàn bộ kiểm tra tương tác thuốc của RASi khi kê viên đôi SPC và khởi trị RASi ngay cả khi đang tăng kali máu (`K+ = 5.1–5.5 mmol/L`)
- **Hiện trạng & Bằng chứng Runtime `evaluate()`:**
  1. Trong `src/modules/htn/rules.outpatient.ts` (dòng 369–376), khuyến cáo `rec_htn_step1_dual_spc` (*"Khởi trị phối hợp đôi liều cố định (SPC): RASi + Amlodipine"*) chỉ gắn `drugId: 'amlodipine'`. Do đó `checkInteractions` và `evaluateSafetyGates` chỉ kiểm tra `amlodipine` mà **bỏ qua hoàn toàn thành phần RASi**!
     - **Kiểm chứng Ca C4c** (Nam 50 tuổi, `HA 168/102 mmHg`, đang dùng `lithium 600 mg` + `amiloride 5 mg` + `potassium_chloride 600 mg`): Engine phát `REC [START] id=rec_htn_step1_dual_spc` (*"Khởi trị phối hợp đôi liều cố định (SPC): RASi + Amlodipine"*) với **`alerts = []` (0 cảnh báo!)**, trong khi ở **Ca C4b** (khi có mặt mã thuốc RASi tường minh) engine lập tức báo **3 `ALERT [critical]`** (`ix.rasi_mra_potassium_sparing`, `ix.rasi_mra_k_supplements`, `ix.rasi_lithium`)!
  2. Biến `rasiContra` (dòng 316) dùng `htn.rasi.k_max_initiate = 5.5 mmol/L` (`kVal > 5.5`), dẫn đến ở **Ca C4 (`K+ = 5.4 mmol/L`)** engine vẫn khởi trị mới RASi trên nền tăng kali máu!
- **Hướng khắc phục:** Phát 2 khuyến cáo `START` tường minh cho từng hoạt chất (ví dụ `perindopril`/`losartan` + `amlodipine` kèm hướng dẫn gộp viên SPC) hoặc hỗ trợ mảng `componentDrugIds` trong `checkInteractions`/`evaluateSafetyGates`; hạ ngưỡng kali máu tối đa cho phép **khởi trị mới** RASi ngoại trú xuống `≤ 5.0 mmol/L` (giữ mốc `> 5.5 mmol/L` cho quy tắc `STOP` thuốc đang dùng).

---

### [HTN-R2-06] `critical` | `rule` | `htn.inpatient.preeclampsia_emergency` — Bỏ lọt COPD, suy tim mất bù & block AV độ II–III khi tiêm Labetalol tĩnh mạch và dùng nhầm hồ sơ `magnesium_sulfate` hen phế quản (2 g) cho sản giật
- **Hiện trạng & Bằng chứng:**
  1. `rules.inpatient.ts` (dòng 756–760): `contraLabetalol` chỉ kiểm tra `asthma`, `acutePulmonaryEdema` và `hr < 60`, bỏ sót `copd`, `hfref` / `decompensated_heart_failure`, `second_third_degree_av_block`.
     - **Kiểm chứng Ca C9** (Thai phụ 34 tuổi, `BP 172/114`, `severePreeclampsiaEclampsia = true`, `copd = true`, `hfref = true`, `decompensated_heart_failure = true`): Engine xuất **`REC [START] drugId=labetalol`** đồng thời tự mâu thuẫn với **`ALERT [critical] ix.bb_non_selective_asthma`** ngay bên dưới!
     - **`AHA/ACC 2025` Table 26 (trang 74):** *"Labetalol: Contraindicated in reactive airway or obstructive pulmonary disease. Avoid in HF... should not be given in patients with second- or third-degree heart block or bradycardia."*
  2. Khuyến cáo nối chuỗi `"+ Magnesium sulfate"` vào tên thuốc Labetalol mà không có liều sản khoa, trong khi `kb/drugs/magnesium_sulfate.json` chỉ khai báo `"class": "Bronchodilator Adjuvant"`, `"start": "2 g truyền tĩnh mạch chậm trong 20 phút cho cơn hen cấp nặng"` (thiếu hụt nghiêm trọng so với phác đồ Zuspan sản khoa: **liều nạp 4–6 g TM trong 15–20 phút + duy trì 1–2 g/giờ**, kiểm soát phản xạ gân bánh chè, nhịp thở, lượng nước tiểu `≥ 25–30 mL/giờ`, chỉnh liều suy thận và chất đối kháng Calcium gluconate 10%).
- **Hướng khắc phục:** Mở rộng `contraLabetalol` bao gồm `copd`, `hfref`, `decompensated_heart_failure`, `av_block_2_3`, `sick_sinus_syndrome` để tự động chuyển sang `nicardipine` IV; tách khuyến cáo `Magnesium sulfate` sản khoa riêng với đúng liều nạp 4–6 g + duy trì 1–2 g/h và cổng an toàn thận/thiểu niệu.

---

### [HTN-R2-07] `critical` | `rule` | `htn.inpatient.aortic_dissection` — Khởi trị bolus Esmolol 500 mcg/kg/phút bất chấp suy tim mất bù hoặc đang dùng Diltiazem/Verapamil
- **Hiện trạng & Bằng chứng:**
  - `rules.inpatient.ts` (dòng 182–265) chỉ kiểm tra `acutePulmonaryEdema`, `sbp < 90` và `hr < 60`.
  - **Kiểm chứng Ca C10** (`aorticDissection = true`, `decompensated_heart_failure = true`, đang dùng `diltiazem 120 mg`, `BP 190/108`, `HR 96`): Engine phát **`REC [START] drugId=esmolol` (nạp 500 mcg/kg/phút)** đồng thời phát **`ALERT [critical] ix.bb_non_dhp_ccb`** (nguy cơ vô tâm thu, block nhĩ thất hoàn toàn và sốc tim)!
  - **`AHA/ACC 2025` Table 26 (trang 74):** *"Esmolol: Contraindicated in patients with concurrent beta-blocker therapy, bradycardia, or decompensated HF."*
- **Hướng khắc phục:** Kiểm tra đầy đủ suy tim mất bù, block AV độ II–III, suy nút xoang, hen phế quản cấp, đang dùng `diltiazem`/`verapamil` hoặc chẹn beta trước khi nạp `esmolol`; hướng dẫn dùng non-DHP CCB kiểm soát nhịp khi chống chỉ định chẹn beta do bệnh phổi tắc nghẽn/hen.

---

### [HTN-R2-08] `critical` | `rule` | `htn.inpatient.hypertensive_encephalopathy` — Phát lệnh `MONITOR` thay vì `START` hạ áp tĩnh mạch ở bệnh não THA có HA `< 160/100 mmHg`
- **Hiện trạng & Bằng chứng:**
  - `rules.inpatient.ts` (dòng 847–875) dùng lại ngưỡng THA Độ 2 ngoại trú (`htn.bp.sbp_grade2 = 160`, `htn.bp.dbp_grade2 = 100`) làm điều kiện `needsLowering`.
  - **Kiểm chứng Ca C11** (Nữ 26 tuổi, `hypertensiveEncephalopathy = true`, lú lẫn/co giật/hội chứng PRES, `HA 156/96 mmHg`): Engine phát **`REC [MONITOR] "Theo dõi sát MAP trong Bệnh não THA (HA hiện tại 156/96 < 160/100 mmHg)"`** và không cho thuốc hạ áp! Ở người trẻ có HA nền 90–100/60 mmHg, ngưỡng tự điều hòa não bị phá vỡ ngay ở 150–159/95 mmHg (`VSH 2022` Bảng 14 trang 40; `AHA/ACC 2025` trang 73, 75).
- **Hướng khắc phục:** Khi đã xác nhận `hypertensiveEncephalopathy = true` và không tụt HA (`SBP ≥ 140` hoặc `DBP ≥ 90 mmHg`), chỉ định kiểm soát hạ MAP 15–25% có kiểm soát tại ICU; tạo Threshold nội viện riêng đúng ngữ nghĩa QA-10.

---

### [HTN-R2-09] `critical` | `missing` | `kb.interactions.htn_critical_ddi` — Thiếu 4 nhóm tương tác thuốc chống chỉ định / đe dọa tính mạng trong KB Interactions
- **Bằng chứng (`getAllInteractions()` & Runtime Ca C12):**
  1. **`lercanidipine` + Chất ức chế mạnh CYP3A4 (`ketoconazole`, `itraconazole`, `ritonavir`, `clarithromycin`) hoặc `ciclosporin`:** Chống chỉ định tuyệt đối (`Zanidip SmPC` trang 2–3: AUC tăng gấp 15 lần với ketoconazole, gấp 3 lần với ciclosporin) — hiện `alerts = []`.
  2. **`clonidine` / `moxonidine` + Chẹn beta (`bisoprolol`, `labetalol`, `carvedilol`, `metoprolol`, `atenolol`):** Nguy cơ cơn tăng huyết áp dội ngược tử vong nếu ngưng clonidine/moxonidine trong khi vẫn duy trì chẹn beta; bắt buộc ngưng chẹn beta trước vài ngày rồi mới giảm liều clonidine từ từ (`FDA Catapres` trang 4; `Cardicor SmPC` trang 4) — hiện `alerts = []`.
  3. **`sodium_nitroprusside` + PDE-5i (`sildenafil`, `tadalafil`, `vardenafil`) hoặc `riociguat`:** Chống chỉ định tuyệt đối do tụt huyết áp kháng trị tử vong (hiện `ix.pde5i_nitrate_vericiguat` mới có `nitroglycerin`, bỏ sót `sodium_nitroprusside`).
  4. **Thiếu `labetalol` trong `ix.bb_non_dhp_ccb` & thiếu tương tác `clonidine` + `diltiazem`/`verapamil`** (`FDA Catapres` trang 6: nhịp chậm xoang nặng phải nhập viện đặt máy tạo nhịp).

---

## 3. Chi tiết Các Phát hiện Quan trọng (`MAJOR`: `HTN-R2-10` → `HTN-R2-28`)

1. **[HTN-R2-10] `urapidil` (`kb/drugs/urapidil.json`):**
   - `lactation.status` đang là `"caution"`, nhưng **`Ebrantil_urapidil_SmPC.pdf` Mục 4.3 (trang 3) & Mục 4.6 (trang 4)** quy định **chống chỉ định hoàn toàn khi cho con bú** (*"4.3 Gegenanzeigen: Stillzeit"*; *"Ebrantil ist deshalb während der Stillzeit kontraindiziert"*).
   - `pregnancy.status` đang là `"compatible"` (gắn `"esc.htn.2025.urapidil_iv"` vốn là `ESC 2025 Pregnancy CVD Guideline` trang 60 chỉ dùng cấp cứu THA nặng), trong khi SmPC Mục 4.6 khuyến cáo không dùng thường quy do độc tính sinh sản động vật và chứa **500 mg propylene glycol / ống 10 mL** (Mục 4.4 trang 3–4).
   - Sai tốc độ tiêm bolus (`5 phút` thay vì `20 giây` cho 25 mg theo SmPC trang 1–2) và trần truyền khởi đầu (SmPC cho phép tới `2 mg/phút = 120 mg/h`, duy trì trung bình `9 mg/h`), thiếu giảm liều suy gan/thận và thiếu chống chỉ định `arteriovenous_shunt`.

2. **[HTN-R2-11] `clevidipine` (`kb/drugs/clevidipine.json`):**
   - Bỏ sót chống chỉ định bắt buộc **`severe_aortic_stenosis`** (`FDA_label_clevidipine.pdf` Mục 4 trang 4: *"Severe aortic stenosis"*).
   - Thiếu trần ngắn hạn `32 mg/h`, giới hạn tải lượng lipid **tối đa 1000 mL / 24 giờ** (trung bình `≤ 21 mg/h`), hủy lọ sau **12 giờ** đâm kim do môi trường phospholipid giàu dinh dưỡng vi khuẩn, và theo dõi tăng HA dội ngược **≥ 8 giờ** sau ngưng truyền (`FDA Cleviprex` trang 3–5; `AHA/ACC 2025` Table 26 trang 74).

3. **[HTN-R2-12] `labetalol` (`kb/drugs/labetalol.json` & `rules.outpatient.ts`):**
   - `labetalol.json` chỉ khai báo **dạng ống tiêm tĩnh mạch** (`"Labetalol tiêm truyền"`, 20 mg bolus IV), trong khi `rules.outpatient.ts` (dòng 56: `PREGNANCY_SAFE_ORAL_IDS`) và `htnComorbidityMatrix` dùng chung mã `'labetalol'` cho **thuốc uống ngoại trú thai kỳ** (liều đúng: viên 100–200 mg, `200–1200 mg/ngày` ở THA chung theo `AHA 2025` Table 13 trang 41 và `200–2400 mg/ngày` chia 2–3 lần ở thai kỳ theo Table 22 trang 65). Thiếu cảnh báo độc tính hoại tử tế bào gan nặng của FDA.

4. **[HTN-R2-13] Lệch liều khởi đầu theo chỉ định ở 3 thuốc dùng chéo (`bisoprolol`, `eplerenone`, `perindopril`) & sai citation `losartan` (`rules.outpatient.ts`):**
   - **`bisoprolol`:** Kê `1.25 mg 1 lần/ngày` (liều suy tim HFrEF của `Cardicor SmPC` trang 1) cho bệnh nhân **THA kháng trị / bệnh mạch vành không suy tim** (Ca C5, C6), trong khi liều khởi đầu/thông thường cho THA là **2.5–5 mg 1 lần/ngày** (`AHA/ACC 2025` Table 13 trang 41: `2.5–10 mg/d`; `VSH 2022` Bảng 10 trang 31: `2.5` – `5–10 mg`).
   - **`eplerenone`:** Kê `25 mg 1 lần/ngày` (liều HFrEF) cho **THA kháng trị bước 4**, trong khi `AHA/ACC 2025` Table 13 (trang 40) & trang 69 quy định **`50–100 mg/ngày` (thường phải chia 2 lần/ngày mới đủ hiệu lực hạ áp)**.
   - **`perindopril`:** Khai báo viên muối **arginine** (`2.5 mg, 5 mg, 10 mg`) nhưng kê `2.5 mg 1 lần/ngày` cho mọi người lớn THA chưa biến chứng (Ca C12), trái với `Coversyl Arginine SmPC` Mục 4.2 (trang 1–2): **khởi đầu chuẩn là `5 mg 1 lần/ngày` buổi sáng khi `ClCR ≥ 60 mL/min`** (`2.5 mg` chỉ dành cho người cao tuổi, `ClCR 30–60`, mất dịch hoặc hoạt hóa RAAS mạnh).
   - **`losartan`:** Dòng 464 & 1058 gắn citation `'fda.losartan.diabetic_nephropathy_dose'` cho bệnh nhân THA kèm gút / tiền sử phù mạch không đái tháo đường (thay vì Mục 2.1 Hypertension của `FDA Cozaar` trang 1).

5. **[HTN-R2-14] `htn.outpatient.step3_resistant_spironolactone` — Áp cứng ngưỡng `eGFR ≥ 45` của Mỹ cho cả hồ sơ `INTL` (ESC 2024) và `VN`:**
   - KB đã có sẵn `htn.spiro.egfr_contra_esc = 30 mL/min/1.73m²` (ESC 2024) và `spironolactone.json` cho phép khởi trị thận trọng `12.5–25 mg/ngày` (hoặc `25 mg cách ngày`) ở `eGFR 30–49`, nhưng `rules.outpatient.ts` dùng cứng `htn.spiro.egfr_min_initiate = 45` cho mọi profile, khiến **Ca C5 (`profile = 'INTL'`, `eGFR = 41`, `K+ = 4.2`)** bị phát lệnh `[AVOID] Spironolactone` sai hướng dẫn ESC 2024.

6. **[HTN-R2-15] `chlorthalidone` (`kb/drugs/chlorthalidone.json`):**
   - Bỏ qua bằng chứng thử nghiệm **CLICK** được khẳng định trong `ESC 2024` (trang 65: *"Chlorthalidone, typically added to a loop diuretic, also effectively lowers BP and reduces microalbuminuria in patients with stage 4 CKD and poorly controlled hypertension"* ở dải `eGFR 15–29 mL/min/1.73m²`).
   - Thiếu chống chỉ định `sulfonamide_allergy` và cảnh báo hôn mê gan (`FDA_label_chlorthalidone.pdf` trang 2); gắn sai citation `aha.acc.2025.table13_chlorthalidone` cho cả thận, thai kỳ, cho con bú và vô niệu (vi phạm QA-7).

7. **[HTN-R2-16] `htnRenalMatrix` (`src/modules/htn/matrix.ts`):**
   - Bỏ sót **11/18 thuốc sở hữu** (`felodipine`, `lercanidipine`, `chlorthalidone`, `clonidine`, `moxonidine`, `labetalol`, `nitroglycerin`, `urapidil`, `esmolol`, `sodium_nitroprusside`, `clevidipine`).
   - Mâu thuẫn trực tiếp với `DrugEntry.renal` ở 4/7 thuốc có mặt (`amlodipine`, `indapamide`, `hydrochlorothiazide`, `methyldopa` — vi phạm QA-8) và gắn các citation bảng liều chung không hề chứa dữ liệu CKD G1–G5/dialysis (vi phạm QA-7).

8. **[HTN-R2-17] `htnComorbidityMatrix` (`src/modules/htn/matrix.ts`):**
   - Hàng `bisoprolol` đánh dấu `pregnancy: 'rec'` (mâu thuẫn `bisoprolol.json` `'caution'` và `Cardicor SmPC` trang 4; `atenolol` là Class III Harm); hàng `indapamide` đánh dấu `hfref: 'rec'` và `pregnancy: 'caution'` (trái với `Natrilix SR SmPC` trang 4 yêu cầu tránh dùng lợi tiểu ở thai kỳ); hàng `amlodipine` đánh dấu `pregnancy: 'rec'` (trong khi `amlodipine.json` là `'caution'` và `lercanidipine` là `'avoid'`); gắn sai citation ở `spironolactone.pregnancy` và `doxazosin.hfref`/`pregnancy`.

9. **[HTN-R2-18] Ba lỗi dùng nhầm ngưỡng trùng số (`QA-10`) trong `rules.inpatient.ts`:**
   - Dòng 448–449 (`stroke_thrombolysis`): Ghép `'htn.emergency.sbp_crisis'` (`180`) và **`'htn.emergency.preeclampsia_dbp'` (`105`)** làm đích duy trì 24h sau tiêu sợi huyết rtPA (`< 180/105 mmHg`)!
   - Dòng 614 (`intracerebral_hemorrhage`): Dùng `'htn.bp.sbp_hypertension'` (`140`) làm đích xuất huyết não cấp.
   - Dòng 847–848 (`hypertensive_encephalopathy`): Dùng `'htn.bp.sbp_grade2'` / `'dbp_grade2'` (`160/100`) làm ngưỡng điều trị cấp cứu nội viện.

10. **[HTN-R2-19] An toàn thuốc thai kỳ & hậu sản (`htn.outpatient.pregnancy_contraindication_rasi`):**
    - Thiếu `drugId` trên lệnh `STOP` (gây trùng thẻ trên UI ở Ca C3), không dừng/chuyển lợi tiểu `hydrochlorothiazide`/`indapamide`/`chlorthalidone` trong thai kỳ, không cảnh báo `atenolol` (COR 3: Harm theo `AHA/ACC 2025` trang 5 & 65), và **bỏ sót hoàn toàn khuyến cáo ngừng `methyldopa` trong vòng 48 giờ sau sinh** do nguy cơ trầm cảm hậu sản (`ESC 2025 Pregnancy CVD` trang 60; `VSH 2022` Bảng 16 trang 44).

11. **[HTN-R2-20] Bỏ trống `hepatic` trên toàn bộ 18/18 thuốc sở hữu:**
    - Cả 18 thuốc sở hữu của `htn` đều có `hepatic: undefined`, bỏ lọt chống chỉ định suy gan nặng/bệnh não gan của `lercanidipine`, `indapamide` (`Natrilix SR SmPC` Mục 4.3 trang 2), `methyldopa`, yêu cầu khởi đầu `2.5 mg` ở suy gan của `amlodipine` và `felodipine`, giảm liều của `nifedipine`, `doxazosin`, `labetalol`, `nicardipine`, `urapidil`, nguy cơ hôn mê gan của nhóm thiazide và nguy cơ ngộ độc cyanid của `sodium_nitroprusside`.

12. **[HTN-R2-21 → HTN-R2-28] Các lỗi nhãn thuốc, chống chỉ định, tương tác & phác đồ trên từng thuốc còn lại:**
    - **`amlodipine` (`HTN-R2-21`):** Giới hạn sai `eGFR < 15 -> 2.5–5 mg` trái với `FDA Norvasc` Mục 12.3 trang 13 (*"may therefore receive the usual initial dose"*); thiếu tương tác `diltiazem`/CYP3A4 mạnh (+60% AUC, trang 7), thiếu `cardiogenic_shock` và cảnh báo hẹp ĐMC khít.
    - **`doxazosin` (`HTN-R2-22`):** Thiếu cảnh báo tăng gấp đôi suy tim (ALLHAT), chống chỉ định quá mẫn quinazoline (`prazosin`/`terazosin`), tương tác hạ HA với PDE-5i & CYP3A4 mạnh, hội chứng IFIS khi mổ đục thủy tinh thể, priapism (`FDA Cardura` trang 4–7); bịa đặt liều thận `1–2 mg` ở `eGFR < 15` (trái Mục 12.3 trang 12) và mâu thuẫn với `htn.doxazosin.dose_max = 2 mg`.
    - **`clonidine` (`HTN-R2-23`):** Thiếu quy tắc rút chẹn beta trước vài ngày khi ngừng clonidine (`FDA Catapres` trang 4), thiếu tương tác `verapamil`/`diltiazem` (nhịp chậm đặt máy tạo nhịp, trang 6) và chống trầm cảm 3 vòng (mất tác dụng hạ áp); gắn sai citation `aha.acc.2025.table13_central_clonidine` cho thận/thai kỳ/cho con bú/nhịp chậm; lệch với `htn.clonidine.dose_max = 0.2 mg`.
    - **`methyldopa` (`HTN-R2-24`):** Trần liều ghi `2000 mg/ngày` (hướng dẫn thai kỳ `AHA 2025` Table 22 trang 65 cho phép tới `3000 mg/ngày`), thiếu cảnh báo trầm cảm sau sinh, chống chỉ định MAOI, và đặc biệt thiếu **tương tác muối sắt uống (`ferrous sulfate/gluconate`)** làm giảm 50–70% hấp thu methyldopa ở thai phụ!
    - **`sodium_nitroprusside` (`HTN-R2-25`):** Thiếu cảnh báo tránh dùng ở bệnh mạch máu não cấp do tăng áp lực nội sọ & tăng tử vong (`AHA 2025` Table 26 trang 74) và hội chứng vành cấp (coronary steal), thiếu chống chỉ định PDE-5i/riociguat & hẹp eo ĐMC, thiếu giới hạn **tối đa 10 phút** ở tốc độ trần `10 mcg/kg/phút`, bọc tránh ánh sáng và giải độc `sodium thiosulfate` / `hydroxocobalamin`.
    - **`nitroglycerin` & `esmolol` (`HTN-R2-26`):** `nitroglycerin` thiếu chống chỉ định nhồi máu cơ tim thất phải, tăng áp lực nội sọ, chèn ép tim, riociguat, khoảng nghỉ PDE-5i 24h vs 48h, dây truyền không PVC; `esmolol` thiếu chống chỉ định đang dùng chẹn beta khác (`AHA 2025` Table 26 trang 74) / `verapamil`/`diltiazem` IV, cảnh báo hoại tử da do thoát mạch và tích lũy chất chuyển hóa ASL-8123 ở ESRD.
    - **`nifedipine`, `felodipine`, `indapamide`, `hydrochlorothiazide` (`HTN-R2-27`):** `nifedipine` không ghi nhận cảnh báo tránh khi cho con bú của `VSH 2022` Bảng 16 (trang 44), lẫn lộn biệt dược `T20 Retard` (20 mg BID) với liều `30 mg OD` LA/GITS, thiếu chống chỉ định `rifampicin` / đau thắt ngực không ổn định; `felodipine` thiếu viên 10 mg ER và tương tác bưởi chùm; `indapamide` & `hydrochlorothiazide` thiếu `sulfonamide_allergy` (và `hepatic_encephalopathy` + tương tác thuốc kéo dài QT gây xoắn đỉnh ở `indapamide`), gắn sai citation Bảng 10 VSH cho thận và cho con bú.
    - **Chuyển ACEi $\rightarrow$ ARB sau phù mạch & Phù phổi cấp (`HTN-R2-28`):** Chưa có lưu ý khoảng nghỉ 6 tuần sau ngừng ACEi (`AHA 2025` Table 13 trang 40) và loại trừ phù mạch do ARB; phù phổi cấp nội viện thiếu phối hợp **Furosemide tĩnh mạch** (`VSH 2022` Bảng 14 trang 40) và thiếu nhánh giãn mạch thay thế khi vướng PDE-5i.

---

## 4. Bảng Kiểm toán Tổng hợp 18 Thuốc Sở hữu của Module `htn`

| Thuốc (`id`) | Liều khởi / đích / tối đa trong KB | Thận (`renal`) | Gan (`hepatic`) | Thai kỳ / Cho con bú | Chống chỉ định & Tương tác chính bị thiếu / sai | Đánh giá R2 |
|---|---|---|---|---|---|---|
| `amlodipine` | 5 $\rightarrow$ 10 mg OD (max 10 mg; 2.5 mg người già/suy gan) — **Đúng** | **Sai dải `<15`** (`2.5–5 mg` trái FDA p.13) | **Trống** (thiếu khởi đầu 2.5 mg) | `caution` / `compatible` (`matrix` ghi nhầm `rec`) | Thiếu `cardiogenic_shock`, hẹp ĐMC khít, tương tác `diltiazem`/CYP3A4 mạnh (+60% AUC), thiếu biệt dược `Norvasc` | **Major** (`HTN-R2-20, 21`) |
| `nifedipine` | 30 $\rightarrow$ 60 mg OD LA/GITS (max 90 mg) — **Đúng** (lẫn `T20 Retard` ở `vnBrands`) | Đúng hướng, **sai citation** VSH Bảng 10 | **Trống** (thiếu giảm liều xơ gan) | `compatible` / `compatible` (lệch VSH Bảng 16 p.44) | Thiếu `unstable_angina`, `acute_mi`, `severe_aortic_stenosis`, `rifampicin`/CYP3A4 mạnh; citation cho con bú sai | **Major** (`HTN-R2-20, 27`) |
| `felodipine` | 5 $\rightarrow$ 10 mg OD (max 10 mg; thiếu viên 10 mg ở `forms`) | Đúng hướng, **sai citation** VSH Bảng 10 | **Trống** (thiếu khởi đầu 2.5 mg) | `caution` / `caution` (sai citation VSH Bảng 10) | Thiếu `decompensated_hf`, `unstable_angina`, `acute_mi`, tương tác CYP3A4 mạnh & nước bưởi chùm (tăng AUC >2 lần) | **Major** (`HTN-R2-20, 27`) |
| `lercanidipine` | 10 $\rightarrow$ 20 mg OD trước ăn 15 phút — **Đúng** | **SAI NGHIÊM TRỌNG:** `<30` để `caution 10 mg` thay vì **`contra`**! | **Trống** (dù `contra` có `severe_liver_disease`) | `avoid` / `avoid` — **Đúng** | **Thiếu `severe_renal_failure`/lọc máu, `strong_cyp3a4_inhibitors` (AUC x15), `ciclosporin` (x3), bưởi chùm, LVOT, bữa ăn nhiều mỡ (x4)** | **CRITICAL** (`HTN-R2-01, 09`) |
| `indapamide` | 1.5 mg SR OD (max 2.5 mg IR) — **Đúng** | `<30`: `contra` — **Đúng** (lệch G3b với `matrix`) | **Trống** & **thiếu `hepatic_encephalopathy`!** | `caution` / `avoid` (`matrix` gắn sai citation) | **Thiếu `severe_liver_disease` / `hepatic_encephalopathy`, `sulfonamide_allergy`, tương tác thuốc kéo dài QT / xoắn đỉnh** | **Major** (`HTN-R2-17, 20, 27`) |
| `hydrochlorothiazide` | 12.5 $\rightarrow$ 25 mg OD (max 50 mg) — **Đúng** (nên ghi trần thực hành 25 mg) | Lệch `matrix` (`not_rec` vs `contra` ở G5), **sai citation** | **Trống** (thiếu cảnh báo hôn mê gan) | `caution` / `avoid` (**không tự STOP ở Ca C3!**) | Thiếu `sulfonamide_allergy`, glaucoma góc đóng cấp, nhạy cảm ánh sáng; gắn sai citation VSH Bảng 10 | **Major** (`HTN-R2-16, 19, 27`) |
| `chlorthalidone` | 12.5 $\rightarrow$ 25 mg OD — **Đúng** | **Bỏ sót hiệu quả CKD G4 (CLICK / ESC 2024 p.65)**, sai citation | **Trống** (thiếu cảnh báo hôn mê gan) | `caution` / `avoid` (sai citation AHA Table 13) | Thiếu `sulfonamide_allergy`; mọi trường gắn sai `aha.acc.2025.table13_chlorthalidone`; `vnBrands: []` thiếu ghi chú | **Major** (`HTN-R2-15, 20`) |
| `doxazosin` | 1 $\rightarrow$ 4–8 mg OD tối (max 16 mg; xung đột `dose_max=2 mg`) | **Bịa liều `<15: 1–2 mg`** trái FDA Cardura p.12 | **Trống** (tránh ở Child-Pugh C) | `caution` / `caution` (sai citation AHA Table 13) | **Thiếu cảnh báo suy tim ALLHAT**, `quinazoline_hypersensitivity`, **PDE-5i**, CYP3A4 mạnh, hội chứng mống mắt mềm **IFIS**, priapism | **Major** (`HTN-R2-20, 22`) |
| `methyldopa` | 250 mg BID–TID $\rightarrow$ max 2000 mg (**thiếu mức 3000 mg/ngày thai kỳ**) | **`matrix` G4 ghi ngược `'Giảm khoảng cách liều'`!** | **Trống** (dù `contra` có `active_liver_disease`) | `compatible` / `compatible` (**thiếu NGỪNG sau sinh!**) | **Thiếu cảnh báo trầm cảm hậu sản (ngừng ≤48h sau sinh), tương tác viên sắt uống giảm hấp thu, chống chỉ định MAOI**, thiếu `Aldomet` | **CRITICAL / Major** (`HTN-R2-02, 19, 24`) |
| `clonidine` | 0.1 $\rightarrow$ 0.2 mg BID (max 0.8 mg/ngày; lệch `dose_max=0.2`) | Sai citation AHA Table 13 | **Trống** | `caution` / `avoid` (sai citation AHA Table 13) | **Thiếu quy tắc rút chẹn beta trước vài ngày khi ngừng clonidine**, tương tác `diltiazem`/`verapamil` & TCA, `sick_sinus_syndrome`, `av_block_2_3` | **CRITICAL / Major** (`HTN-R2-09, 23`) |
| `moxonidine` | 0.2 $\rightarrow$ 0.4 mg (max 0.6 mg/ngày, đơn 0.4 mg) | **SAI NGHIÊM TRỌNG:** GFR 30–59 cho uống `0.4 mg 1 lần` (vượt trần đơn `0.2 mg`!) | **Trống** | `avoid` / `avoid` (sai citation ESC HF) | **Thiếu chống chỉ định suy tim HFpEF/HFmrEF, nhịp chậm `<50 bpm`, suy nút xoang, block AV II–III**; toàn bộ gắn sai citation HF | **CRITICAL** (`HTN-R2-03, 09`) |
| `nicardipine` | 5 mg/h + 2.5 mg/h q5–15p $\rightarrow$ max 15 mg/h — **Đúng** | Không chỉnh liều, cần thận trọng suy thận/gan | **Trống** (chuyển hóa gan mạnh, giảm liều xơ gan) | `caution` / `caution` | Có `severe_aortic_stenosis` trong JSON nhưng **engine KHÔNG chặn ở Ca C8b**; thiếu đổi vị trí truyền tĩnh mạch ngoại biên mỗi 12h, thiếu `Perdipine` | **CRITICAL / Minor** (`HTN-R2-04, 20, 30`) |
| `labetalol` | **Chỉ có dạng ống tiêm IV** (20 mg bolus, 0.5–2 mg/p, max 300 mg/24h) | Không chỉnh liều | **Trống** (thiếu cảnh báo hoại tử gan FDA) | `compatible` / `compatible` | **Thiếu hoàn toàn dạng viên uống cho thai kỳ ngoại trú**; thiếu `labetalol` trong `ix.bb_non_dhp_ccb`; luật nội viện bỏ sót `copd`/`hfref` | **CRITICAL / Major** (`HTN-R2-06, 09, 12`) |
| `nitroglycerin` | 5 mcg/p + 5 mcg/p q3–5p $\rightarrow$ max 200 mcg/p — **Đúng** | Đúng | **Trống** | `caution` / `caution` | Thiếu chống chỉ định **nhồi máu thất phải**, tăng áp lực nội sọ, chèn ép tim, `riociguat`, dây truyền không PVC, lờn thuốc sau 24–48h | **Major** (`HTN-R2-26`) |
| `urapidil` | **Sai tốc độ bolus** (`5p` thay vì `20s`) & trần truyền (`40` vs `120 mg/h`) | Thiếu giảm liều suy thận vừa-nặng | **Trống** (thiếu giảm liều suy gan) | **Sai:** `preg=compatible` (nên `caution`), **`lact=caution` (SmPC CHỐNG CHỈ ĐỊNH!)** | Thiếu chống chỉ định cho con bú (`Stillzeit`) & `arteriovenous_shunt`, thiếu cảnh báo **500 mg propylene glycol/ống**; chưa được gọi trong luật nào | **Major** (`HTN-R2-10, 20`) |
| `esmolol` | Nạp 500–1000 mcg/kg/p x 1p, duy trì 50–300 mcg/kg/p — **Đúng** | **Thiếu cảnh báo tích lũy ASL-8123 ở ESRD** | **Trống** | `caution` / `caution` | Thiếu chống chỉ định **đang dùng chẹn beta khác**, `verapamil`/`diltiazem` IV, sốc tim, cảnh báo hoại tử da khi thoát mạch | **CRITICAL / Major** (`HTN-R2-07, 26`) |
| `sodium_nitroprusside` | 0.3–0.5 $\rightarrow$ max 10 mcg/kg/p (**thiếu giới hạn $\le 10$ phút ở mức trần!**) | Cảnh báo thiocyanat khi sCr > 3 mg/dL | **Trống** (nguy cơ nhiễm độc cyanid khi suy gan) | `contra` / `avoid` — **Đúng** | **Thiếu chống chỉ định PDE-5i/riociguat**, tránh dùng trong **đột quỵ/tăng ICP** (`AHA 2025` p.74 tăng tử vong) & ACS (coronary steal), bọc tránh sáng & chất giải độc | **CRITICAL / Major** (`HTN-R2-09, 25`) |
| `clevidipine` | 1–2 mg/h, gấp đôi q90s $\rightarrow$ 21 mg/h (**thiếu trần 32 mg/h & giới hạn 1000 mL/24h**) | Không chỉnh liều | **Trống** | `caution` / `caution` | **Thiếu chống chỉ định bắt buộc `severe_aortic_stenosis` (FDA p.4)**, hủy lọ sau 12h mở nắp, rebound HTN 8h; chưa được gọi trong luật nào | **Major** (`HTN-R2-11`) |

---

## 5. Kiểm toán 9 Thuốc Dùng chéo Liên phân hệ (Cross-Module Drugs) trong Ngữ cảnh `htn`

| Thuốc (`id`) | Vai trò trong `htn` | Phát hiện dược lâm sàng khi dùng trong `htn` | Mức độ / Mã lỗi |
|---|---|---|---|
| `perindopril` | ACEi đầu tay ngoại trú | Dùng muối **arginine** (`2.5/5/10 mg`) nhưng `start = 2.5 mg` cho mọi người lớn chức năng thận bình thường thay vì **5 mg buổi sáng** (`Coversyl Arginine SmPC` trang 1–2); `fmtDose(dose('perindopril', 'step'))` sinh `"undefined undefined"`. | **Major / Minor** (`HTN-R2-13, 29`) |
| `losartan` | ARB ưu tiên khi gút / tiền sử phù mạch ACEi | Liều `50 -> 100 mg` đúng, nhưng `rules.outpatient.ts` gắn sai citation bệnh thận ĐTĐ (`fda.losartan.diabetic_nephropathy_dose`) cho bệnh nhân không ĐTĐ và chưa lưu ý khoảng nghỉ 6 tuần sau phù mạch do ACEi (`AHA 2025` Table 13 trang 40). | **Major** (`HTN-R2-13, 28`) |
| `valsartan` | ARB trong `ARB_IDS` | Liều `80 -> 160–320 mg` khớp `AHA 2025` Table 13; `fmtDose(dose('valsartan', 'step'))` sinh `"undefined undefined"`. | **Minor** (`HTN-R2-29`) |
| `telmisartan` | ARB trong `ARB_IDS` | Liều `40 -> 80 mg` khớp nhãn; lưu ý `telmisartan` đang bị thiếu trong mảng `drugIds` của `ix.rasi_mra_potassium_sparing` (dù vẫn khớp qua `classes: ["arb"]`), `step` sinh `"undefined undefined"`. | **Minor** (`HTN-R2-29`) |
| `spironolactone` | Bước 4 đầu tay THA kháng trị | Liều khởi đầu `25 mg` đúng ở `eGFR ≥ 45–50`, nhưng `rules.outpatient.ts` chặn cứng `< 45` trên cả profile `INTL`/`VN` (bỏ qua dải `eGFR 30–44` khởi trị `12.5 mg` hoặc `25 mg cách ngày` theo ESC 2024 & `spironolactone.json`). | **Major** (`HTN-R2-14`) |
| `eplerenone` | Thay thế khi không dung nạp Spironolactone | `rules.outpatient.ts` kê `25 mg 1 lần/ngày` (liều suy tim), thấp hơn phác đồ THA kháng trị `50–100 mg/ngày` (thường chia 2 lần/ngày theo `AHA 2025` Table 13 trang 40 & ESC 2024). | **Major** (`HTN-R2-13`) |
| `bisoprolol` | Chẹn beta cho CAD/AF/HFrEF hoặc bước 4 | `rules.outpatient.ts` kê `1.25 mg 1 lần/ngày` (liều dò HFrEF của `Cardicor SmPC`) cho THA kháng trị / CAD không suy tim (đúng là `2.5–5 mg/ngày`); `htnComorbidityMatrix` đánh dấu nhầm `bisoprolol.pregnancy = 'rec'`; ghi nhầm bắt buộc uống `"sau ăn"`. | **Major / Minor** (`HTN-R2-13, 17, 31`) |
| `furosemide` | Lợi tiểu quai thay thiazide khi `eGFR < 30` | Dùng ở ngoại trú CKD G4–G5 đúng chỉ định, nhưng chuỗi `fmtDose` in cả hướng dẫn *"Suy tim cấp: 20–40 mg TM..."* vào tiêu đề đơn ngoại trú; ngược lại ở **phù phổi cấp nội viện** lại bị bỏ quên không kê kèm `Nitroglycerin IV`! | **Major / Minor** (`HTN-R2-28, 29`) |
| `magnesium_sulfate` | Ngừa/cắt co giật tiền sản giật nặng / sản giật | **SAI CHỈ ĐỊNH & LIỀU NGHIÊM TRỌNG:** `magnesium_sulfate.json` chỉ có liều **hen phế quản cấp 2 g truyền 1 lần**, hoàn toàn không có phác đồ sản khoa Zuspan (nạp 4–6 g + duy trì 1–2 g/h) và cổng độc tính magiê khi thiểu niệu/suy thận! | **CRITICAL** (`HTN-R2-06`) |

---

## 6. Các Phát hiện Nhỏ (`MINOR`) & Đề xuất Cải tiến (`SUGGESTION`)

- **[HTN-R2-29] (`minor` | `ui`):** Chuẩn hóa lại `frequency`, `route`, `description` của 7 thuốc tĩnh mạch nội viện và `furosemide` để `fmtDose()` không sinh câu lặp chữ rườm rà trên tiêu đề khuyến cáo, đồng thời sửa lỗi `"undefined undefined"` khi gọi `fmtDose(dose(id, 'step'))` ở 4 thuốc RASi.
- **[HTN-R2-30] (`minor` | `drug`):** Bổ sung các biệt dược gốc kinh điển tại Việt Nam (`Norvasc` cho `amlodipine`, `Aldomet` cho `methyldopa`, `Perdipine` cho `nicardipine`), thêm viên `10 mg ER` cho `felodipine`, viên `8 mg / 4 mg XL` cho `doxazosin`, và ghi chú tính sẵn có tại bệnh viện VN cho `chlorthalidone` và `clevidipine`.
- **[HTN-R2-31] (`minor` | `drug`):** Bổ sung tương tác bữa ăn giàu chất béo (tăng sinh khả dụng 4 lần) & rượu vào `lercanidipine.json`; chỉnh hướng dẫn dùng `bisoprolol` thành uống buổi sáng không phụ thuộc bữa ăn.
- **[HTN-R2-32] (`suggestion` | `missing`):** Gợi ý các viên phối hợp cố định (SPC) lưu hành phổ biến tại Việt Nam (`Coveram`, `Preterax`/`Coversyl Plus`, `Triplixam`, `Exforge`/`Exforge HCT`, `Twynsta`, `Hyzaar`) kèm danh sách mã hoạt chất thành phần.
- **[HTN-R2-33] (`suggestion` | `matrix`):** Tự động sinh `htnRenalMatrix` từ `DrugEntry.renal` của đủ 18 thuốc sở hữu theo định hướng `QA-8`.
- **[HTN-R2-34] (`suggestion` | `missing`):** Bổ sung thời gian ngưng thuốc gây nhiễu trước xét nghiệm tầm soát cường aldosteron nguyên phát (ARR: ngưng MRA/amiloride/lợi tiểu liều cao ≥ 4 tuần; cầu nối bằng `verapamil SR`, `doxazosin` hoặc `moxonidine` theo `ESC 2024` Table 12 trang 40).

---

## Kết luận Kiểm định Vòng 1 (Vai R2 – Dược lâm sàng)

Do tồn tại **9 phát hiện mức `critical`** (có nguy cơ gây hại trực tiếp cho người bệnh như cho phép dùng `lercanidipine` ở `eGFR < 30`/lọc máu, ghi ngược thành rút ngắn khoảng cách liều `methyldopa` ở CKD G4, quá liều đơn `moxonidine` ở CKD vừa và bỏ lọt chống chỉ định suy tim HFpEF/nhịp chậm, ghi đè mất phác đồ đột quỵ cấp & truyền thuốc giãn mạch đơn độc trong bóc tách ĐMC, bỏ lọt tương tác chết người của RASi trong viên đôi SPC, tiêm `labetalol` ở sản phụ COPD/suy tim và thiếu phác đồ `magnesium_sulfate` sản khoa, bỏ sót 4 nhóm tương tác chống chỉ định trong KB) cùng **19 phát hiện mức `major`**, phân hệ Tăng huyết áp (`htn`) chưa đạt tiêu chuẩn an toàn dược lâm sàng ở Vòng 1.

**KẾT LUẬN: FAIL**
