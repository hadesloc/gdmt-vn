# Báo cáo Kiểm thử Đối kháng An toàn Lâm sàng Độc lập — Module Bệnh thận mạn & Tổn thương thận cấp (`ckd`) — Vòng 4 (Reviewer R3)

- **Vai trò**: Reviewer R3 — Kiểm thử Đối kháng An toàn Lâm sàng Độc lập (*Independent Adversarial Clinical Safety Tester*)
- **Module đánh giá**: `ckd` (*Chronic Kidney Disease & Acute Kidney Injury*) + giao tiếp an toàn liên module (`dm2`, `htn`, `hf`, `lipid`, `af`, `cad`, `gout`) và tầng an toàn chung (`src/engine/safety/*`, `src/engine/merge*.ts`, `src/ui/AppShell.tsx`, `src/ui/PatientForm.tsx`)
- **Phạm vi đọc & kiểm chứng thực nghiệm**:
  - Đọc toàn bộ **23/23 tệp mã nguồn** trong `src/modules/ckd/`, `kb/thresholds/ckd.json`, các tệp dược thư `kb/drugs/*.json` liên quan, toàn bộ tầng `src/engine/safety/*.ts`, `src/engine/merge*.ts`, `src/engine/calculators/egfr.ts`, `src/engine/units.ts`, `src/ui/AppShell.tsx`, `src/ui/PatientForm.tsx`, cùng hồ sơ đối chiếu Vòng 3 (`round3_R3.json`, `round3_RESPONSE.md`). Tuyệt đối độc lập (không đọc bất kỳ báo cáo Vòng 4 nào của R1/R2).
  - Thực thi trực tiếp **95 kịch bản lâm sàng đối kháng (`S01`–`S95`)** qua `evaluate(patient, settings)` thật (nạp qua Vite SSR runtime, không giả lập, không sửa đổi mã nguồn dự án và đã dọn sạch 100% tệp chạy tạm sau kiểm thử).
- **Tổng hợp phát hiện Vòng 4**: **12 phát hiện** (**4 `critical`**, **6 `major`**, **2 `minor`**)
- **Kết luận Vòng 4**: **FAIL** *(Quy tắc Hội đồng: chỉ PASS khi `0 critical` VÀ `0 major`)*

---

## 1. Kiểm chứng Hồi quy Vòng 3 (`round3_R3.json` — 9 hạng mục)

| Mã Vòng 3 | Nội dung cốt lõi | Kịch bản kiểm chứng live Vòng 4 | Trạng thái | Nhận xét kiểm chứng thực nghiệm |
|---|---|---|---|---|
| `CKD-R3-R3-01` | Sai số mũ `-0.432` thay vì `-1.328` trong phương trình `CKD-EPI 2012 Cystatin C` (`egfr.ts:66`) & thiếu fallback `egfr` khi `crcl = undefined` | `S01`, `S02`, `S03`, `S85` | **ĐÃ SỬA TRIỆT ĐỂ** | `cysHighExponent = -1.328` khớp chuẩn Inker NEJM 2012: `CysC = 2.1` (nam 66t) $\rightarrow$ `eGFR = 28.1` (G4, chặn Metformin); `CysC = 3.5` (nữ 68t) $\rightarrow$ `eGFR = 13.1` (G5, phát `[STOP]` Finerenone & Metformin); khi `weight = undefined` (`crcl = undefined`), `Perindopril 8 mg` ở G4 vẫn được phát `[REDUCE]`. |
| `CKD-R3-R3-02` | Click `ckdPresets` trên `AppShell.tsx` không chuyển `setting` (`inpatient` vs `outpatient`) và nhân đôi hệ số đơn vị khi đang chọn hệ Mỹ (`mg_dL`, `mg_g`) | `S04`–`S11` (8 tổ hợp: 4 preset $\times$ SI / US) | **ĐÃ SỬA TRIỆT ĐỂ** | `applyPresetSelection` đồng bộ chính xác `setting` (`outpatient` cho BN 1–2, `inpatient` cho BN 3–4) và quy đổi khứ hồi SI $\leftrightarrow$ US với sai số `egfrDiff = 0.0000`, khớp 100% danh sách khuyến cáo ở cả 4 ca mẫu (BN 4 giữ nguyên gói cấp cứu 5 bước UKKA Calcium Gluconate + Insulin-Glucose + SZC). |
| `CKD-R3-R3-03` | Rò rỉ `[START]` thuốc mạn tính liên module giữa cơn cấp cứu ngoại trú & ghi đè ngược `Fail-Closed DEFER` thành `START` | `S12`, `S13`, `S14`, `S26`, `S28` | **SỬA MỘT PHẦN (CÒN LỖ HỔNG CRITICAL)** | Đã sửa tốt cho AKI ngoại trú (`S12`), sốc `SBP < 90` + `K+ >= 6.0` (`S13`), và bảo tồn `Fail-Closed DEFER` khi `sbp = undefined` (`S14`). **Tuy nhiên**, `src/engine/safety/clinicalStates.ts:282–308` bỏ quên `patient.hco3 < 12`, khiến toan chuyển hóa nặng `HCO3- = 9.0 mmol/L` vẫn rò rỉ `[START] Dapagliflozin 10 mg` từ `dm2` (`S28` $\rightarrow$ **`CKD-R4-R3-01`**)! |
| `CKD-R3-R3-04` | Bỏ lọt chống chỉ định `Semaglutide` (K giáp thể tủy `MTC` / `MEN 2`, tiền sử viêm tụy cấp) khi chạy đơn module `['ckd']` | `S15` (3 biến thể) | **ĐÃ SỬA TRIỆT ĐỂ** | Đơn module `['ckd']` đã phát `[STOP]` Semaglutide đang dùng khi có `mtcMen2History` / `acutePancreatitis` và phát `[AVOID]` khi có `historyPancreatitis`. *(Lưu ý: phát sinh lỗi phân loại `Telmisartan` ở Child-Pugh B tại `S57` $\rightarrow$ **`CKD-R4-R3-08`**).* |
| `CKD-R3-R3-05` | Giảm liều sai ARB thải qua gan-mật (`Losartan`, `Valsartan`) ở G4; bỏ sót giảm liều `Perindopril` trên BN lọc máu; nhầm chữ *"vào ngày lọc máu"* ở G5 chưa lọc | `S16` (3 biến thể) | **ĐÃ SỬA TRIỆT ĐỂ** | `Losartan 100 mg` ở G4 (`eGFR = 23.6`) được duy trì đúng bảo vệ thận; `Perindopril 10 mg` trên BN lọc máu nhận `[REDUCE] 2.5 mg vào ngày lọc máu`; `Perindopril 5 mg` ở G5 chưa lọc máu nhận `[REDUCE] 2.5 mg cách ngày (chưa lọc máu...)`. |
| `CKD-R3-R3-06` | Toán tử `>` thay vì `>=` ở điểm cắt UACR nghiên cứu FLOW (`10` & `30 mg/mmol`) và bỏ sót `Semaglutide` ở ĐTĐ2 + CKD G4 (`eGFR 15–19`) | `S17` (3 biến thể) | **ĐÃ SỬA TRIỆT ĐỂ** | Cả 3 ca biên (`eGFR = 39.8, UACR = 10.0`; `eGFR = 59.0, UACR = 30.0`; `eGFR = 19.0` G4 không dùng được Metformin/SGLT2i) đều phát đúng `[START] Semaglutide`. |
| `CKD-R3-R3-07` | Kê viên uống `NaHCO3` ngoại trú khi `HCO3- < 12 mmol/L` & cào bằng truyền dịch dự phòng cản quang ở `eGFR 30–44` | `S18`, `S28`–`S30`, `S87`, `S92` | **SỬA MỘT PHẦN (CÒN LỖ HỔNG CRITICAL & MAJOR)** | Đơn module ngoại trú đã phát `[REFER]` khi `HCO3- < 12` và nội viện đã phân tầng CI-AKI `< 30` vs `30–44`. **Tuy nhiên**: (1) Không tạm ngừng SGLT2i/Metformin đang dùng khi `HCO3- = 9.0` và nội viện `HCO3- = 8.0–17.9` trả về `[]` (**`CKD-R4-R3-01`**); (2) Ngoại trú `contrastPlanned = true` bị bỏ trắng hoàn toàn (**`CKD-R4-R3-10`**). |
| `CKD-R3-R3-08` | Trùng lặp 2 thẻ `REFER` cấp cứu tăng Kali ngoại trú & nhầm văn phong *"Chuyển Cấp cứu"* cho bệnh nhân đã nằm nội viện | `S07`, `S13`, `S20`, `S22` | **ĐÃ SỬA TRIỆT ĐỂ** | Khử trùng lặp chính xác thẻ `REFER` ở ngoại trú `K+ >= 6.0` và dùng đúng tiêu đề xử trí nội viện tại chỗ khi `setting = 'inpatient'`. |
| `CKD-R3-R3-09` | Thiếu cảnh báo khi bỏ trống giới tính (`sex = undefined`) & sai mô tả Preset 2 | `S18`, `S81`, `S05` | **ĐÃ SỬA TRIỆT ĐỂ** | Khi `sex = undefined`, Engine xuất cảnh báo rõ ràng `'Cần nhập giới tính để đánh giá'` (`missing_sex`) và không tính sai eGFR. |

---

## 2. Bảng Tổng hợp 95 Kịch bản Kiểm thử Đối kháng Trực tiếp (`S01`–`S95`)

| Nhóm kiểm thử | Mã kịch bản | Tóm tắt cấu hình đối kháng & biên độ | Kết quả an toàn thực nghiệm |
|---|---|---|---|
| **1. Hồi quy Vòng 3 & Hệ đơn vị / Presets** | `S01`–`S18` (18 ca) | Cystatin C đơn độc (`2.1`, `3.5`, `0.75 mg/L`); 4 `ckdPresets` $\times$ SI / US (`mg_dL`, `mg_g`); AKI ngoại trú đa module; sốc `SBP = 82` + `K+ = 6.3`; `sbp = undefined` Fail-Closed; GLP-1 `MTC`/`MEN2`/viêm tụy; RASi G4/G5/HD; FLOW biên `UACR = 10` & `30`; `HCO3- = 9.5`; CI-AKI `eGFR = 24` vs `38`; `sex = undefined` | `16/18` đạt chuẩn an toàn; phát hiện điểm mù tiếp diễn khi mở rộng sang đa module/nội viện ở `S28`–`S30` |
| **2. Tăng Kali máu & Độc tính cơ tim trên ECG** | `S19`–`S27`, `S93` (10 ca) | Biên `K+ = 5.0, 5.1, 5.5, 5.6, 5.9, 6.0, 6.8 mmol/L` (ngoại trú vs nội viện); tăng K+ tái phát trên K-binder; **`S26` (`K+ = 5.4` + `ecgHyperkalemia = true` ngoại trú)**; **`S93` (`K+ = 5.8` + `ecgHyperkalemia = true` ngoại trú vs nội viện)** | **PHÁT HIỆN CRITICAL (`CKD-R4-R3-02`)**: Ngoại trú có biến đổi ECG tăng K+ (`K+ = 5.4` & `5.8`) phát **0 thẻ `REFER` cấp cứu**, không giữ `Losartan` ở `K+ = 5.4` và phát **`[CONTINUE] Finerenone 10 mg`**! |
| **3. Toan chuyển hóa cấp/mạn, euDKA & MALA** | `S28`–`S33`, `S87` (7 ca) | `HCO3- = 7.9, 8.0, 9.0, 11.5, 11.9, 12.0, 15.0, 17.9, 18.0 mmol/L`; ngoại trú đa module (`['ckd','dm2','htn','lipid','af']`); đang uống `Dapagliflozin + Metformin` ở `HCO3- = 9.0`; nội viện `HCO3- = 8.0–15.0`; trần `NaHCO3 4000 mg/ngày` | **PHÁT HIỆN CRITICAL (`CKD-R4-R3-01`)**: `S28` rò rỉ **`[START] Dapagliflozin 10 mg`** ở `HCO3- = 9.0`; `S29` phát **`[CONTINUE]` Dapagliflozin + Metformin**; `S30`/`S87` nội viện `HCO3- = 8.0–15.0` trả về **`[]` (0 khuyến cáo)**! Trần `NaHCO3 4000 mg` (`S32`) hoạt động tốt. |
| **4. Biên độ eGFR / UACR của SGLT2i, RASi, Finerenone, GLP-1 RA** | `S34`–`S48` (15 ca) | `eGFR = 14.9, 15.0, 19.9, 20.0, 24.9, 25.0, 29.9, 30.0, 44.9, 45.0, 59.9, 60.0`; A1/A2/A3 không ĐTĐ vs ĐTĐ; **`S43` (`baselineScr: 70 -> scr: 93 µmol/L`, tăng `+32.9%` trên Losartan)**; Finerenone ở HFmrEF/HFpEF `40 mg` vs HFrEF `LVEF = 35%` | Biên số học `eGFR`/`UACR` chính xác; **PHÁT HIỆN MAJOR (`CKD-R4-R3-06`)**: `S43` tăng Creatinin `+32.9%` (`> 30%`) bị bỏ lọt, phát **`[UPTITRATE] Losartan 100 mg`**! |
| **5. Statin, Huyết áp, Lão khoa Suy yếu & Xơ gan Child-Pugh A/B/C** | `S49`–`S59`, `S88`, `S94`, `S95` (14 ca) | Tuổi `44` nguy cơ 10 năm `15%` / ghép thận (`S49`, `S94`); **`Rosuvastatin 20 mg` & `40 mg` ở G4 `CrCl = 19.9` & lọc máu (`S51`, `S88`)**; cụ bà `82–84` tuổi suy yếu + hạ HA tư thế `HA = 128/76` & `134/72` (`S53`, `S95`); Child-Pugh A/B/C trên Losartan, Telmisartan (`S57`), Finerenone, Atorvastatin | **3 PHÁT HIỆN MAJOR + 1 MINOR**: Bỏ sót trần `Rosuvastatin <= 10 mg` & phát `[CONTINUE] Rosuvastatin 40 mg` lọc máu (**`CKD-R4-R3-07`**); ép `[UPTITRATE] SBP < 120` khi hạ HA tư thế/suy yếu & `[STOP]` oan Telmisartan ở Child-Pugh B (**`CKD-R4-R3-08`**); thiếu tiêu chí nguy cơ 10 năm `> 10%` tuổi 18–49 (**`CKD-R4-R3-11`**). |
| **6. Thai kỳ, Cho con bú, Dị ứng, Hẹp ĐM thận & Suy thượng thận** | `S60`–`S63`, `S90`, `S91` (6 ca) | Thai kỳ đa thuốc độc phôi thai (`S63`); **Đang cho con bú `breastfeeding = true` (`S60`)**; **`allergyAceiArb = true` & `priorAngioedema = true` (`S61`, `S90`)**; **`renalBruit = true` (`S62`)**; **`adrenalInsufficiency = true` + Finerenone (`S91`)** | Thai kỳ (`S63`) chặn tốt 100%; **PHÁT HIỆN CRITICAL (`CKD-R4-R3-04`)** cho `allergyAceiArb`, `adrenalInsufficiency`, `renalBruit`; **PHÁT HIỆN MAJOR (`CKD-R4-R3-09`)** cho `lactation` & gộp checkbox UI. |
| **7. Viên phối hợp (FDC), Phối hợp kép RAA/MRA & Tương tác CYP3A4** | `S64`–`S70`, `S86`, `S89` (9 ca) | **`Synjardy` (`empagliflozin_metformin`) ở G4 `eGFR = 21.4`, lọc máu, AKI nội viện (`S64`, `S86`)**; **`losartan_hctz` + `amlodipine_perindopril` ở `K+ = 6.2` (`S65`)**; **`Aliskiren 150 mg` + `Losartan 50 mg` (`S67`)**; Finerenone + Spironolactone (`S66`); Finerenone + Itraconazole (`S68`) vs Diltiazem (`S69`, `S89`); NSAID (`S70`) | Finerenone + Spironolactone (`S66`) & Itraconazole (`S68`) chặn tốt; **PHÁT HIỆN CRITICAL (`CKD-R4-R3-03`)** với FDC (`[CONTINUE] Synjardy` ở `eGFR = 21.4`!); **PHÁT HIỆN MAJOR (`CKD-R4-R3-05`)** với `Aliskiren + Losartan`; **MINOR (`CKD-R4-R3-12`)** với Diltiazem/Candesartan. |
| **8. Nội viện AKI, Cản quang ngoại trú, Lọc máu cấp cứu & Đa bệnh lý** | `S71`–`S80`, `S92` (11 ca) | AKI giai đoạn 1–3, SADMANS hold, hội chứng tim-thận quá tải dịch (`S73`), chỉ định RRT cấp cứu AEIOU (`S74`), **chụp cản quang ngoại trú `contrastPlanned = true` trên `Metformin` ở `eGFR = 38.2` (`S92`)**, đa module `ckd+hf+af+dm2+htn+lipid+gout` (`S75`–`S80`) | Nội viện AKI & RRT hoạt động chắc chắn; **PHÁT HIỆN MAJOR (`CKD-R4-R3-10`)**: Ngoại trú `contrastPlanned = true` bỏ sót dự phòng cản quang và không giữ `Metformin` trước tiêm cản quang! |
| **9. Bền vững đầu vào thiếu / cực đoan (Fail-Closed & Edge Inputs)** | `S81`–`S85` (5 ca) | Rỗng hoàn toàn; thiếu `k`, thiếu `sbp`, thiếu `scr` & `cystatinC`; `uacr = 0`; béo phì `150 kg` vs suy kiệt `34 kg`; thiếu `weight` (`crcl = undefined`) trên thuốc thải qua thận | Không crash (`0` ngoại lệ runtime trên toàn bộ 95 ca); Fail-Closed thiếu `k` và thiếu `sbp` hoạt động ổn định. |

---

## 3. Phân tích Chi tiết Các Phát hiện Vòng 4 (`CKD-R4-R3-01` $\rightarrow$ `CKD-R4-R3-12`)

---

### [CRITICAL] `CKD-R4-R3-01` — Toan chuyển hóa nặng đe dọa tính mạng (`HCO3- < 12 mmol/L`, ví dụ `9.0 mmol/L`): Rò rỉ `[START] Dapagliflozin` liên module, chủ động phát `[CONTINUE]` SGLT2i + Metformin giữa nguy cơ euDKA / MALA, và mù hoàn toàn ở bối cảnh Nội viện (`8.0 <= HCO3- < 18.0 mmol/L`)

- **Phân loại**: `severity: "critical"` | `itemType: "rule"` | `itemId: "safety.isOutpatientAcuteCrisis_and_ckd.acidosis_acute_safety"`
- **Nguyên nhân gốc trong mã nguồn**:
  1. Ở Vòng 3, module `ckd` đã thêm `hco3Val < 12` vào hàm `isOutpatientAcuteCrisis` cục bộ ([helpers.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L356-L370)), **nhưng** hàm `isOutpatientAcuteCrisis` toàn cục của Engine ([clinicalStates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/clinicalStates.ts#L282-L308)) chỉ kiểm tra `sbp < 90` và `k >= 6.0 / ecgHyperkalemia`, bỏ sót hoàn toàn `patient.hco3 < 12`!
  2. Toàn bộ tầng rà soát thuốc đang dùng ([reviewMedsVitalsAndRenal.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMedsVitalsAndRenal.ts)) và [rules.outpatient.safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.safety.ts) không có cổng tạm ngừng SGLT2i hoặc Metformin khi `hco3 < 12 mmol/L`.
  3. Cả 2 quy tắc toan chuyển hóa trong [rules.outpatient.bp_acidosis.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.bp_acidosis.ts#L197-L255) đều đóng cứng `setting: 'outpatient'`, còn [rules.inpatient.dialysis.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.dialysis.ts#L34) chỉ kích hoạt khi `hco3 < 8` nghiêm ngặt — tạo ra khoảng trống tuyệt đối `8.0 <= HCO3- < 18.0 mmol/L` cho bệnh nhân nội viện!
- **Tái hiện thực nghiệm `evaluate()`**:
  - **Ca `S28` (Ngoại trú đa module, `hco3 = 9.0 mmol/L`)**:
    - *Input*: `setting: 'outpatient'`, `profile: 'INTL'`, nam 62 tuổi, `scr: 155` (`eGFR = 42.9`), `uacr: 55`, `k: 4.6`, `hco3: 9.0`, `sbp: 148`, `dbp: 88`, `hba1c: 8.2`, `selectedModules: ['ckd', 'dm2', 'htn', 'lipid', 'af']`, `conditions: { ckd: true, dm: true, htn: true, af: true }`.
    - *Output thực tế*: Phát `[REFER] (ckd:rec_ckd_acidosis_emergency_refer) CHUYỂN CẤP CỨU NỘI VIỆN KHẨN: Toan chuyển hóa nặng (HCO₃⁻ = 9 < 12 mmol/L)` (trong đó rationale ghi rõ *"KHÔNG... khởi trị SGLT2i ngoại trú"*), nhưng ngay bên dưới phát đồng loạt **`[START] (dm2:rec_dm2_sglt2i_organ_protection) Dapagliflozin 10 mg 1 lần/ngày`**, `[START] Semaglutide`, `[START] Apixaban`, `[START] Atorvastatin`, `[START] Amlodipine`, `[START] Perindopril`!
  - **Ca `S29` & `S87` (Đang uống `Dapagliflozin 10 mg` + `Metformin 1000 mg` khi `hco3 = 9.0 mmol/L`)**:
    - *Output ở `['ckd', 'dm2']` (`S29`)*: Chủ động phát **`[CONTINUE] Tiếp tục Dapagliflozin`** và **`[CONTINUE] Tiếp tục duy trì Metformin (1000 mg/ngày)`** — `0` lệnh `HOLD`/`STOP`!
    - *Output ở nội viện `setting: 'inpatient'` (`S30` & `S87`, kiểm tra tại `hco3 = 8.0, 9.0, 9.5, 11.5, 15.0 mmol/L`)*: Trả về **`recommendations = []` (0 khuyến cáo, 0 cảnh báo)**!
- **Hậu quả lâm sàng & Căn cứ hướng dẫn**:
  - Ở bệnh nhân ĐTĐ + CKD có `HCO3- = 9.0 mmol/L`, hai nguyên nhân hàng đầu đe dọa tử vong tức thì là **nhiễm toan ceton đường huyết bình thường do SGLT2i (euDKA)** và **nhiễm toan acid lactic liên quan Metformin (MALA — tỷ lệ tử vong 30–50%)**. Việc khuyên `[START]` hoặc `[CONTINUE]` Dapagliflozin và Metformin làm trầm trọng thêm tình trạng toan máu dẫn đến trụy mạch và ngừng tuần hoàn; còn việc trả về `[]` ở bệnh nhân nội viện `HCO3- = 8.0–10.0 mmol/L` bỏ sót hoàn toàn chỉ định truyền Natri Bicarbonat tĩnh mạch theo **Hướng dẫn BYT 2024 (Mục 4.10.3.1)**, **ADA 2024 Hyperglycemic Crises Consensus (Bảng 2)** và **KDIGO 2024 PP 3.7.2**.
- **Đề xuất sửa chữa**:
  1. Bổ sung `patient.hco3 !== undefined && patient.hco3 < 12` vào `isOutpatientAcuteCrisis` tại `src/engine/safety/clinicalStates.ts`.
  2. Bổ sung quy tắc `HOLD`/`STOP` khẩn cấp (áp dụng `setting: 'both'`) trong `reviewMedsVitalsAndRenal.ts` và `ckd` đối với mọi chế phẩm chứa **SGLT2i** và **Metformin** khi `hco3 < 12 mmol/L`.
  3. Bổ sung luật nội viện xử trí toan chuyển hóa cho dải `8.0 <= HCO3- < 18.0 mmol/L` (đặc biệt `8.0 <= HCO3- < 12.0 mmol/L`: làm khí máu động mạch, khoảng trống anion, lactat/ceton máu và bù kiềm tĩnh mạch khi `HCO3- <= 10 mmol/L` hoặc `pH < 7.20`).

---

### [CRITICAL] `CKD-R4-R3-02` — Độc tính cơ tim do tăng Kali máu có biến đổi ECG tại ngoại trú (`ecgHyperkalemia = true` với `K+ < 6.0 mmol/L`): Không phát lệnh chuyển Cấp cứu `[REFER]`, không giữ `Losartan` ở `K+ <= 5.5` và chủ động phát `[CONTINUE] Finerenone`

- **Phân loại**: `severity: "critical"` | `itemType: "rule"` | `itemId: "ckd.outpatient.hyperkalemia_ecg_cardiotoxicity"`
- **Nguyên nhân gốc trong mã nguồn**:
  - [clinicalStates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/clinicalStates.ts#L294-L306) đã đánh dấu `ci.ecgHyperkalemia === true` là khủng hoảng cấp cứu ngoại trú (chuyển các lệnh `START` thường quy sang `DEFER: "Ưu tiên xử trí cấp cứu trước"`), **nhưng** tất cả các quy tắc cấp cứu và giữ thuốc giữ Kali lại chỉ nhìn vào con số `k`:
    - [reviewMedsSpecialized.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMedsSpecialized.ts#L41) (`checkEmergencyRedFlags`): chỉ kích hoạt khi `patient.k >= 6.0`.
    - [rules.outpatient.safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.safety.ts#L133-L199): `hyperkalemia_emergency_refer` chỉ chạy khi `k >= 6.0`; `hyperkalemia_hold_*` chỉ chạy khi `k > 5.5`.
    - [helpers.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L356-L370) (`isOutpatientAcuteCrisis` cục bộ của CKD): không kiểm tra `ecgHyperkalemia`, nên `ckd.outpatient.finerenone_continue` ([rules.outpatient.finerenone_safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.finerenone_safety.ts#L220)) vẫn chạy bình thường!
- **Tái hiện thực nghiệm `evaluate()`**:
  - **Ca `S26`**: Ngoại trú (`INTL`), nam 65 tuổi, `scr: 165` (`eGFR = 39.8`), `uacr: 50`, **`k: 5.4 mmol/L`**, `sbp: 136/80`, **`customInputs: { ecgHyperkalemia: true }`** (sóng T cao nhọn / QRS giãn rộng), đang uống `Losartan 50 mg` + `Finerenone 10 mg`.
    - *Output thực tế*: **0 thẻ `[REFER]` cấp cứu**; **0 lệnh `HOLD`/`STOP` Losartan**; phát **`[CONTINUE] (ckd:rec_ckd_finerenone_continue) Tiếp tục duy trì Finerenone (10 mg x 1 lần/ngày)`** và `[START] Patiromer để duy trì liệu pháp RASi/MRA`!
  - **Ca `S93`**: Cùng bệnh nhân nhưng **`k: 5.8 mmol/L` + `ecgHyperkalemia: true`**:
    - *Output thực tế*: Các thẻ khởi trị bị đổi thành `DEFER ("Ưu tiên xử trí cấp cứu trước")` nhưng **vẫn có 0 thẻ `[REFER]` chuyển Cấp cứu** trên toàn màn hình!
- **Hậu quả lâm sàng & Căn cứ hướng dẫn**:
  - Theo **UKKA 2022 Guideline 16.2 (1A)**, khi tăng Kali máu đã gây biến đổi điện tâm đồ (dù nồng độ `K+` huyết thanh mới ở mức `5.3–5.9 mmol/L` do tốc độ tăng K+ nhanh hoặc hạ Calci/toan máu đi kèm), nguy cơ rung thất/vô tâm thu tính bằng phút — bắt buộc tiêm tĩnh mạch ngay muối Calci (Calcium Gluconate 10% 30 mL), chuyển Cấp cứu có monitor tim và ngừng toàn bộ thuốc giữ Kali.
- **Đề xuất sửa chữa**:
  - Đưa điều kiện `hasHyperkalemicEcg` (`Boolean(custom?.ecgHyperkalemia || custom?.ecgHyperkalemiaChanges) && (k === undefined || k > 5.0)`) vào `checkEmergencyRedFlags`, `ckd.outpatient.hyperkalemia_emergency_refer`, `ckd.outpatient.hyperkalemia_hold_*`, `reviewMedsVitalsAndRenal.ts` và `helpers.ts:isOutpatientAcuteCrisis` để phát ngay `[REFER]` cấp cứu, `HOLD`/`STOP` toàn bộ thuốc giữ Kali và chặn `[CONTINUE] Finerenone`.

---

### [CRITICAL] `CKD-R4-R3-03` — Mù an toàn đối với viên phối hợp liều cố định (FDC): Chủ động phát `[CONTINUE] Synjardy (Empagliflozin/Metformin)` ở `eGFR = 21.4 mL/phút/1.73m²`, bỏ sót `STOP`/`HOLD` Synjardy trên bệnh nhân lọc máu / AKI nội viện, và bỏ sót viên phối hợp RASi ở `K+ = 6.2 mmol/L`

- **Phân loại**: `severity: "critical"` | `itemType: "drug"` | `itemId: "fdc_combination_meds_renal_and_hyperk_blindness"`
- **Nguyên nhân gốc trong mã nguồn**:
  1. [mergeConflictGroups.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/mergeConflictGroups.ts) đăng ký `empagliflozin_metformin` và `dapagliflozin_metformin` trong nhóm `sglt2i`, nhưng không có tệp KB `kb/drugs/empagliflozin_metformin.json`, [helpers.drugs.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.drugs.ts#L182-L202) chỉ nhận diện đơn chất, và [reviewMedsVitalsAndRenal.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMedsVitalsAndRenal.ts#L143) kiểm tra cứng `resolvedKbId === 'metformin'`.
  2. Khi chạy `ckd` trên bệnh nhân G4 (`eGFR = 21.4`) đang uống `Synjardy`, `ckd` tưởng bệnh nhân chưa có SGLT2i nên phát `[START] Dapagliflozin 10 mg`; sau đó [mergeClassResolver.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/mergeClassResolver.ts#L146-L240) thấy `empagliflozin_metformin` thuộc nhóm `sglt2i` không bị khóa nên tự động viết đè thành **`[CONTINUE] TIẾP TỤC DUY TRÌ Synjardy (Empagliflozin/Metformin) [Liều hiện tại: 12.5/1000 mg x 2]`**!
  3. Tương tự, các viên phối hợp hạ áp phổ biến tại Việt Nam (`losartan_hctz`, `amlodipine_perindopril`, `perindopril_indapamide`, `valsartan_amlodipine`) không được phân rã thành hoạt chất thành phần khi kiểm tra tăng Kali máu nặng, AKI, thai kỳ hoặc phối hợp kép ACEi + ARB.
- **Tái hiện thực nghiệm `evaluate()`**:
  - **Ca `S86 G4` (`selectedModules: ['ckd']`, `eGFR = 21.4 mL/phút/1.73m²`, đang uống `Synjardy 12.5/1000 mg x 2`)**:
    - *Output thực tế*: Phát trực tiếp **`[CONTINUE] (ckd:rec_ckd_sglt2i_start) TIẾP TỤC DUY TRÌ Synjardy (Empagliflozin/Metformin) [Liều hiện tại: 12.5/1000 mg x 2]`** (tương đương **2.000 mg Metformin/ngày** ở `eGFR = 21.4`!) và **0 lệnh `STOP` Metformin**! *(Ở `S64` khi bật thêm `dm2`, màn hình hiển thị hai lệnh mâu thuẫn trực diện: vừa `[STOP] Metformin` vừa `[CONTINUE] Synjardy 12.5/1000 mg x 2`!).*
  - **Ca `S86 HD` (`onDialysis: true`) & `S86 AKI inpatient` (AKI giai đoạn 2, `SCr 110 -> 240 µmol/L`)**: Đang uống `Synjardy 12.5/1000 mg x 2` $\rightarrow$ **0 lệnh `STOP`/`HOLD`**!
  - **Ca `S65` (`eGFR = 21.1`, `K+ = 6.2 mmol/L`, đang uống đồng thời `losartan_hctz 50/12.5 mg` + `amlodipine_perindopril 5/5 mg`)**: Dù vừa tăng K+ nguy kịch `6.2 mmol/L` vừa trùng lặp ARB + ACEi $\rightarrow$ **0 lệnh `STOP`/`HOLD`** cho cả 2 viên FDC!
- **Đề xuất sửa chữa**:
  - Xây dựng bảng ánh xạ phân rã hoạt chất thành phần (`expandComboComponents(drugId)`) dùng chung cho `reviewMeds*`, `gates.ts`, `mergeClassResolver.ts` và `ckd/helpers.drugs.ts`. Khi bất kỳ thành phần nào của viên FDC vi phạm chống chỉ định (`metformin` ở `eGFR < 30` / lọc máu / AKI / toan máu; `ACEi`/`ARB` ở `K+ > 5.5`, AKI, thai kỳ, phối hợp kép RASi), bắt buộc phát `[STOP]`/`[HOLD]` viên FDC đó (hướng dẫn tách sang hoạt chất đơn lẻ an toàn nếu cần) và khóa `drugId` của FDC trong `effectiveBlockedCurIds`.

---

### [CRITICAL] `CKD-R4-R3-04` — Lọt lưới 3 chống chỉ định nghiêm trọng: Dị ứng ACEi/ARB (`allergyAceiArb = true`), Suy tuyến thượng thận dùng `Finerenone` (`adrenalInsufficiency = true`), và Tiếng thổi / nghi ngờ hẹp động mạch thận hai bên (`renalBruit = true`)

- **Phân loại**: `severity: "critical"` | `itemType: "rule"` | `itemId: "contraindications_rasi_allergy_adrenal_insufficiency_renal_bruit"`
- **Tái hiện thực nghiệm & Phân tích mã nguồn**:
  1. **`conditions.allergyAceiArb = true` (`S61`, `S90`)**:
     - Khi bệnh nhân đang uống `Losartan 50 mg` (`S61`), không có quy tắc nào trong `reviewMeds.ts` hay `ckd` phát `[STOP] Losartan` (hiện chỉ kiểm tra `priorAngioedema` đối với ACEi/ARNI).
     - Khi bệnh nhân chưa dùng RASi và bật `['ckd', 'htn']` (`S90`), thẻ `[AVOID] rec_ckd_rasi_contra_allergy` ([rules.outpatient.rasi.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.rasi.ts#L87-L106)) để trống `drugId: undefined`, nên `mergeClassResolver.ts` không khóa nhóm `rasi`; kết quả là `htn` phát ngay bên dưới **`[START] Khởi trị Bước 1: Amlodipine + Perindopril`** và **`[START] Perindopril 5 mg/ngày`** mâu thuẫn trực diện với thẻ `[AVOID]` trên cùng giao diện!
  2. **Suy tuyến thượng thận (`adrenalInsufficiency = true` / Bệnh Addison) dùng `Finerenone` (`S91`)**:
     - **Nhãn FDA Kerendia (Mục 4 *Contraindications*)** chỉ có 2 chống chỉ định tuyệt đối: dùng chung thuốc ức chế mạnh CYP3A4 và **suy tuyến thượng thận** (đã khai báo tại [finerenone.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/finerenone.json#L188-L195) với `code: "adrenal_insufficiency"`). Tuy nhiên cả `ckd` lẫn `gates.ts`/`reviewMeds.ts` đều không đọc mã này: ở `S91`, Engine vẫn phát **`[START] Khởi trị Finerenone (10 mg 1 lần/ngày)`** và **`[UPTITRATE] Tăng liều Finerenone lên liều đích (20 mg 1 lần/ngày)`**, có nguy cơ thúc đẩy cơn suy thượng thận cấp tăng Kali máu tử vong!
  3. **Tiếng thổi động mạch thận / nghi ngờ hẹp ĐM thận hai bên (`conditions.renalBruit = true`, `S62`)**:
     - Trên bệnh nhân CKD G3b (`eGFR = 39.8`, `HA = 158/94`) có `renalBruit: true`, cả `ckd` và `htn` đều phát `[START] Perindopril` mà không có cảnh báo siêu âm Doppler ĐM thận loại trừ hẹp ĐM thận hai bên / thận độc nhất trước khi ức chế tiểu động mạch đi cầu thận.
- **Đề xuất sửa chữa**:
  1. Bổ sung `[STOP]` thuốc RASi đang dùng khi có `allergyAceiArb`; gán khóa nhóm `rasi` cho `rec_ckd_rasi_contra_allergy` (và tách rõ thông điệp khi chỉ có `priorAngioedema` với ACEi vs dị ứng chéo toàn bộ `allergyAceiArb`).
  2. Thực thi cổng chống chỉ định `adrenalInsufficiency` / `contra.code === 'adrenal_insufficiency'` trong `gates.ts`, `reviewMeds.ts`, `rules.outpatient.finerenone*.ts` và thêm trường này vào `ckdInputs`.
  3. Kiểm tra `renalBruit` / `bilateralRenalArteryStenosis` trước khi phát `[START]` ACEi/ARB.

---

### [MAJOR] `CKD-R4-R3-05` — Bỏ sót hoàn toàn phối hợp kép Thuốc ức chế trực tiếp Renin (`Aliskiren`) + ACEi/ARB trên bệnh nhân CKD / ĐTĐ típ 2 (`S67`)

- **Phân loại**: `severity: "major"` | `itemType: "rule"` | `itemId: "ckd.outpatient.avoid_dual_rasi_missing_dri_aliskiren"`
- **Bằng chứng thực nghiệm (`S67`)**: Bệnh nhân nam 62 tuổi, ĐTĐ típ 2 + CKD G3b (`eGFR = 42.9`), `uacr = 65`, `k = 4.6`, `sbp = 138/82`, đang uống **`Aliskiren 150 mg` + `Losartan 50 mg`**. Do [rules.outpatient.rasi_titration.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.rasi_titration.ts#L81-L88) chỉ kiểm tra `ACEi`, `ARB`, `ARNI` mà bỏ quên DRI (`aliskiren`), Engine trả về **0 lệnh `STOP`, 0 cảnh báo tương tác**, và phát lệnh **`[UPTITRATE] Tăng liều Losartan đến 100 mg/ngày`** chồng lên `Aliskiren`!
- **Căn cứ hướng dẫn**: **KDIGO 2024 Recommendation 3.6.4 (1B)** (*"We recommend avoiding any combination of ACEi, ARB, and direct renin inhibitor (DRI) therapy in patients with CKD, with or without diabetes"*) và chống chỉ định trên nhãn FDA (thử nghiệm ALTITUDE).
- **Đề xuất sửa chữa**: Bổ sung `DRI_DRUG_IDS = ['aliskiren']` vào `helpers.drugs.ts` và `avoid_dual_rasi` / `reviewMeds` để phát `[STOP] Aliskiren` (priority 105) và chặn tăng liều RASi khi chưa ngừng Aliskiren.

---

### [MAJOR] `CKD-R4-R3-06` — Ngưỡng tăng Creatinin `> 30%` sau dùng RASi (`ckd.rasi.creatinine_rise_max_pct`) không được thực thi bằng logic, dẫn đến phát `[UPTITRATE] Losartan` khi SCr tăng `+32.9%` (`S43`)

- **Phân loại**: `severity: "major"` | `itemType: "rule"` | `itemId: "ckd.rasi.creatinine_rise_max_pct_unenforced"`
- **Bằng chứng thực nghiệm (`S43`) & Mã nguồn**:
  - Ngưỡng `ckd.rasi.creatinine_rise_max_pct = 30` chỉ được nối chuỗi văn bản trong `ckd.outpatient.rasi_monitoring` ([rules.outpatient.rasi.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.rasi.ts#L317)), còn `isAkiActive` ([helpers.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L345)) chỉ bắt `scr - baseScr >= 26.5 µmol/L` hoặc `scr / baseScr >= 1.5`.
  - Ở `S43` (nữ 70 tuổi, 48 kg, `baselineScr: 70 µmol/L` $\rightarrow$ `scr: 93 µmol/L`, tức **tăng `+32.86% > 30%`** nhưng chênh `+23 µmol/L < 26.5` và tỷ lệ `1.33 < 1.5`), đang uống `Losartan 50 mg`: Engine không cảnh báo tạm ngừng/giảm liều RASi mà phát **`[UPTITRATE] Tăng liều Losartan đến 100 mg/ngày`** — vi phạm **KDIGO 2024 PP 3.6.4 & Figure 32**.
- **Đề xuất sửa chữa**: Bổ sung kiểm tra `((scr - baselineScr) / baselineScr) * 100 > thFor('percentage', 'ckd.rasi.creatinine_rise_max_pct')` cho bệnh nhân đang dùng RASi/ARNI để chặn `rasi_uptitrate`/`finerenone_start` và phát thẻ `[HOLD]`/`[REDUCE]` đánh giá giảm thể tích / hẹp ĐM thận.

---

### [MAJOR] `CKD-R4-R3-07` — Bỏ sót trần liều thận `Rosuvastatin <= 10 mg/ngày` khi `eGFR / CrCl < 30 mL/phút` ở đơn module `ckd` và chủ động phát `[CONTINUE] Rosuvastatin 40 mg` trên bệnh nhân lọc máu (`S51`, `S85`, `S88`)

- **Phân loại**: `severity: "major"` | `itemType: "drug"` | `itemId: "rosuvastatin_severe_ckd_and_dialysis_dose_cap"`
- **Bằng chứng thực nghiệm (`S51`, `S85`, `S88`)**:
  - Dù [rosuvastatin.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/rosuvastatin.json#L52-L102) khai báo rõ `gate_rosuva_severe_ckd_max` (tối đa `10 mg/ngày` khi `eGFR < 30`, Nhãn FDA Crestor §2.5), hàm `reviewStatinDoseCaps` ([reviewMedsSpecialized.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMedsSpecialized.ts#L385-L551)) chỉ kiểm tra tương tác thuốc của Simvastatin/Pravastatin.
  - Khi chạy `selectedModules: ['ckd']` trên nữ 74 tuổi CKD G4 (`eGFR = 25.2`, `CrCl = 19.9 mL/phút`) đang uống `Rosuvastatin 20 mg` hoặc `40 mg` (`S88`): **0 lệnh `[REDUCE]`**! Nghiêm trọng hơn, trên bệnh nhân lọc máu chu kỳ (`onDialysis: true`) đang uống `Rosuvastatin 40 mg`, [rules.outpatient.statin.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.statin.ts#L166-L212) chủ động phát **`[CONTINUE] Tiếp tục duy trì Rosuvastatin (40 mg) trên bệnh nhân lọc máu chu kỳ`** (gấp 4 lần trần thận, nguy cơ cao tiêu cơ vân cấp!).
- **Đề xuất sửa chữa**: Bổ sung kiểm tra trần liều thận Rosuvastatin (`<= 10 mg/ngày` khi `eGFR < 30` hoặc `CrCl < 30` hoặc `onDialysis`) vào `reviewStatinDoseCaps` / `rules.outpatient.statin.ts` và chặn `statin_continue_dialysis` phát `[CONTINUE]` nguyên liều khi vượt trần.

---

### [MAJOR] `CKD-R4-R3-08` — Áp cứng mục tiêu hạ áp tích cực `SBP < 120 mmHg` (`[UPTITRATE]`) trên bệnh nhân suy yếu / hạ huyết áp tư thế (`frailty`, `orthostaticHypotension`) và phát `[STOP]` sai `Telmisartan 40 mg` ở xơ gan Child-Pugh B (`S53`, `S57`, `S95`)

- **Phân loại**: `severity: "major"` | `itemType: "rule"` | `itemId: "ckd.bp_target_frailty_orthostatic_and_telmisartan_child_pugh_b"`
- **Bằng chứng thực nghiệm**:
  1. **Suy yếu & Hạ HA tư thế (`S53`, `S95`)**: Cụ bà 82–84 tuổi nặng 46 kg có `frailty: true`, `orthostaticHypotension: true`, `HA = 128/76 mmHg` (`S53`) hoặc `134/72 mmHg` (`S95`) vẫn bị [rules.outpatient.bp_acidosis.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.bp_acidosis.ts#L46-L186) phát **`[UPTITRATE] Đích huyết áp tâm thu < 120 mmHg`** và **`[UPTITRATE] Tăng liều Losartan 100 mg`**, trái với **KDIGO 2024 PP 3.4.1** và **ESC 2026 CVD-CKD Table 9** (cảnh báo nguy cơ ngất, té ngã gãy xương và AKI ở hạ HA tư thế / suy yếu).
  2. **Mâu thuẫn `Telmisartan` ở Child-Pugh B (`S57`)**: Trong khi [rules.outpatient.rasi_titration.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.rasi_titration.ts#L190-L198) giữ trần Telmisartan `<= 40 mg/ngày` ở suy gan nhẹ–vừa (chỉ `STOP` ở Child-Pugh C đúng nhãn FDA Micardis & BYT 2024 Bảng 12), tệp `kb/drugs/telmisartan.json:94` đặt `hepatic.status: "contra"`, khiến `clinicalStates.ts:165` phát **`[STOP] NGỪNG NGAY Telmisartan 40 mg (Chống chỉ định trên suy gan vừa–nặng Child-Pugh B)`** kèm câu giải thích tự mâu thuẫn ngay trong thẻ (*"NGỪNG NGAY... không quá 40 mg/ngày ở suy gan nhẹ–trung bình"*).
- **Đề xuất sửa chữa**: Cá thể hóa mục tiêu HA lỏng hơn (`< 130–140 / < 80 mmHg`, không ép `< 120 mmHg`) khi có `orthostaticHypotension` / `frailty` / `limitedLifespan` / `>= 85 tuổi`; chỉnh `hepatic.status` của `telmisartan.json` sang `"caution"` cho Child-Pugh A/B (trần `40 mg/ngày`) và chỉ `"contra"` ở Child-Pugh C / tắc mật.

---

### [MAJOR] `CKD-R4-R3-09` — Bỏ hoang hoàn toàn dữ liệu an toàn cho con bú (`DrugEntry.lactation`) trong Engine/CKD và gộp chung ô tích UI `'Mang thai / Cho con bú'` vào `conditions.pregnant = true` (`S60`)

- **Phân loại**: `severity: "major"` | `itemType: "ui"` | `itemId: "lactation_safety_unenforced_and_patient_form_conflation"`
- **Bằng chứng thực nghiệm (`S60` & `PatientForm.tsx:514`)**:
  1. Trong `src/engine/` và `src/modules/ckd/`, thuộc tính `DrugEntry.lactation` (đã có trong toàn bộ KB với `atorvastatin`/`rosuvastatin`: `'contra'`, `finerenone`/`dapagliflozin`/`semaglutide`: `'avoid'`) có **0 nơi kiểm tra**. Ở `S60` (`breastfeeding: true`, `pregnant: false`), Engine khởi trị đồng loạt `Dapagliflozin 10 mg`, `Semaglutide`, `Atorvastatin 20 mg` và tăng liều `Finerenone 20 mg` mà không có bất kỳ cảnh báo cho con bú nào!
  2. Trên giao diện [PatientForm.tsx](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/PatientForm.tsx#L514), checkbox duy nhất ghi `'Mang thai / Cho con bú'` nhưng ánh xạ thẳng vào `conditions.pregnant = true`, khiến phụ nữ cho con bú bị chẩn đoán nhầm là mang thai (báo giả độc phôi thai/thiểu ối và cấm oan cả Enalapril/Captopril dùng được khi cho con bú).
- **Đề xuất sửa chữa**: Tách riêng 2 ô tích `'Đang mang thai'` (`pregnant`) và `'Đang cho con bú'` (`breastfeeding`) trên `PatientForm.tsx`; thực thi cổng kiểm tra `kbDrug.lactation` trong `gates.ts` và `reviewMeds.ts`.

---

### [MAJOR] `CKD-R4-R3-10` — Dự phòng bệnh thận do thuốc cản quang (`contrastPlanned = true`) đóng cứng `setting: 'inpatient'`, bỏ sót hoàn toàn bệnh nhân CKD ngoại trú chụp CT cản quang và không tạm ngừng `Metformin` (`S92`)

- **Phân loại**: `severity: "major"` | `itemType: "rule"` | `itemId: "ckd.inpatient.contrast_nephropathy_prevention_outpatient_gap"`
- **Bằng chứng thực nghiệm (`S92`)**: Bệnh nhân ngoại trú nam 67 tuổi, CKD G3b (`eGFR = 38.2 mL/phút/1.73m²`), đang uống `Metformin 1000 mg` + `Ibuprofen 400 mg`, có lịch chụp CT tiêm cản quang (`customInputs: { contrastPlanned: true }`), `selectedModules: ['ckd']`. Do [rules.inpatient.aki.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.aki.ts#L118) khóa cứng `setting: 'inpatient'`, Engine phát **0 thẻ dự phòng cản quang**, **0 lệnh `[HOLD] Metformin`** trước tiêm cản quang (trái Nhãn FDA Glucophage §5.1 ở `eGFR 30–60`), đồng thời kê mới `Dapagliflozin 10 mg` + `Losartan 50 mg` ngay trước chụp cản quang!
- **Đề xuất sửa chữa**: Mở rộng quy tắc dự phòng cản quang sang `setting: 'both'`, phát lệnh `[HOLD] Metformin` khi `contrastPlanned === true && egfr < 60` (kiểm tra lại eGFR sau 48 giờ mới dùng lại), và trì hoãn khởi trị mới đồng loạt SGLT2i/RASi ngay trước thủ thuật cản quang ở `eGFR < 45`.

---

### [MINOR] `CKD-R4-R3-11` — Chỉ định Statin ở người trưởng thành trẻ 18–49 tuổi mắc CKD bỏ sót tiêu chí nguy cơ mạch vành 10 năm `> 10%` và ghép thận (`S49`, `S94`)

- **Phân loại**: `severity: "minor"` | `itemType: "missing"` | `itemId: "ckd.outpatient.statin_indication_young_10y_risk_and_transplant"`
- **Bằng chứng (`S49`, `S94`)**: Tại [rules.outpatient.statin.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.statin.ts#L42-L46), biến `isYoungHighRisk` chỉ kiểm tra `ascvd || dm || strokeOrTia`, bỏ sót tiêu chí thứ 4 của **KDIGO 2024 Rec 3.15.1.3 (2A)** là nguy cơ biến cố mạch vành 10 năm `> 10%` (và ghép thận).

---

### [MINOR] `CKD-R4-R3-12` — Chưa đồng bộ chỉnh liều `Candesartan` ở suy gan vừa theo `CKD.md` và thiếu lưu ý theo dõi Kali sát trên thẻ `[UPTITRATE] Finerenone` khi dùng kèm `Diltiazem` (`S89`)

- **Phân loại**: `severity: "minor"` | `itemType: "drug"` | `itemId: "candesartan_hepatic_dosing_doc_mismatch_and_finerenone_moderate_cyp3a4_uptitrate"`
- **Bằng chứng (`S89` & `CKD.md:16`)**:
  1. [CKD.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/modules/CKD.md#L16) ghi module đã thực thi *"giảm nửa liều khởi đầu Losartan/Candesartan ở xơ gan vừa"*, nhưng mã nguồn mới chỉ xử lý cho `Losartan` và `Telmisartan`.
  2. Ở `S89` (`Finerenone 10 mg` + `Diltiazem 120 mg`), dù `plan.alerts` có phát cảnh báo `ix.finerenone_moderate_cyp3a4`, thẻ chính `[UPTITRATE] Finerenone 20 mg` không nhắc trên thẻ về việc Diltiazem (ức chế vừa CYP3A4) làm tăng AUC Finerenone ~2–3 lần cần kiểm tra sát K+ trong 4 tuần (FDA Kerendia §7.1).

---

## 4. Kết luận Thẩm định Độc lập Vòng 4 (Reviewer R3)

- **Tổng số ca kiểm thử đối kháng thực thi qua `evaluate()`**: **95 ca (`S01`–`S95`)**
- **Số phát hiện theo mức độ**:
  - `critical`: **4** (`CKD-R4-R3-01`, `CKD-R4-R3-02`, `CKD-R4-R3-03`, `CKD-R4-R3-04`)
  - `major`: **6** (`CKD-R4-R3-05`, `CKD-R4-R3-06`, `CKD-R4-R3-07`, `CKD-R4-R3-08`, `CKD-R4-R3-09`, `CKD-R4-R3-10`)
  - `minor`: **2** (`CKD-R4-R3-11`, `CKD-R4-R3-12`)
  - `suggestion`: **0**
- **PHÁN QUYẾT CUỐI CÙNG (VERDICT)**: **FAIL**
