# BÁO CÁO THẨM ĐỊNH DƯỢC LÂM SÀNG & AN TOÀN THUỐC ĐỘC LẬP — VÒNG 2 (ROUND 2)
## Module: Tăng huyết áp (`htn`) — Hệ thống GDMT-VN

- **Vai trò thẩm định**: **Reviewer R2** — Dược sĩ Lâm sàng & Kiểm toán An toàn Thuốc Độc lập (*Clinical Pharmacist & Medication Safety Auditor*)
- **Vòng thẩm định**: Round 2 (Độc lập hoàn toàn — không tham khảo bất kỳ tài liệu Vòng 2 nào của R1 hay R3)
- **Ngày hoàn thành**: 2026-10-27
- **Phạm vi kiểm toán thực tế**:
  - **100% mã nguồn module `htn` (13/13 file)**: `index.ts`, `inputs.ts`, `helpers.ts`, `matrix.ts`, `pathway.ts`, `presets.ts`, `rules.outpatient.ts`, `rules.outpatient.safety.ts`, `rules.outpatient.steps.ts`, `rules.outpatient.special.ts`, `rules.inpatient.ts`, `rules.inpatient.emergency.ts`, `rules.inpatient.neuro_preg.ts`.
  - **100% lõi Engine & Safety Pipeline (14 file)**: `evaluate.ts`, `merge.ts`, `mergeConflictGroups.ts`, `types.ts` và toàn bộ 11 file trong `src/engine/safety/`.
  - **100% Cơ sở tri thức Dược học & Trích dẫn**: toàn bộ 18 hồ sơ thuốc thuộc sở hữu `htn` (`amlodipine`, `nifedipine`, `felodipine`, `lercanidipine`, `indapamide`, `hydrochlorothiazide`, `chlorthalidone`, `doxazosin`, `methyldopa`, `clonidine`, `moxonidine`, `nicardipine`, `labetalol`, `nitroglycerin`, `urapidil`, `esmolol`, `sodium_nitroprusside`, `clevidipine`) + 16 hồ sơ thuốc dùng chung (`perindopril`, `ramipril`, `enalapril`, `lisinopril`, `captopril`, `losartan`, `valsartan`, `telmisartan`, `spironolactone`, `eplerenone`, `bisoprolol`, `hydralazine`, `furosemide`, `diltiazem`, `verapamil`, `magnesium_sulfate`), 155 ngưỡng `kb/thresholds/htn.json`, 125 trích dẫn `kb/citations/htn.json`, và 88 quy tắc tương tác trong `kb/interactions/*.json`.
  - **Đối chiếu tài liệu gốc sơ cấp offline (`Medical_Library_2026`)**: ESC 2024 Elevated BP & Hypertension, AHA/ACC 2025 High Blood Pressure Guideline, VSH/VNHA 2022, KDIGO 2021 BP in CKD & KDIGO 2024 CKD, Hướng dẫn Bộ Y tế QĐ 2388/QĐ-BYT 2024 (Bệnh thận mạn), cùng các nhãn thuốc gốc EMA SmPC / FDA Prescribing Information (`Coversyl`, `Natrilix SR`, `Zanidip`, `Physiotens`, `Ebrantil`, `Norvasc`, `Cozaar`, `Inspra`, `Cleviprex`, `Chlorthalidone`, `Catapres`, `Cardura`).
  - **Kiểm thử động thực tế (`evaluate()` Runtime Audit)**: 42 kịch bản dược lâm sàng ngoại trú & nội viện trên cả 3 hệ quy chiếu `INTL`, `VN`, `US`.

---

## 1. TỔNG HỢP SỐ LƯỢNG PHÁT HIỆN & PHÁN QUYẾT VÒNG 2

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã định danh | Điều kiện mở khóa xuất bản |
| :--- | :---: | :--- | :--- |
| **CRITICAL** (Nguy kịch / Mất an toàn trực tiếp) | **5** | `HTN-R2-R2-01` → `HTN-R2-R2-05` | Bắt buộc = 0 mới được PASS |
| **MAJOR** (Trọng yếu / Sai lệch liều, DDI, QA-7, Matrix) | **11** | `HTN-R2-R2-06` → `HTN-R2-R2-16` | Bắt buộc = 0 mới được PASS |
| **MINOR** (Nhỏ / Tinh chỉnh logic & hiển thị) | **4** | `HTN-R2-R2-17` → `HTN-R2-R2-20` | Khuyến nghị sửa triệt để |
| **SUGGESTION** (Đề xuất nâng cao Dược lâm sàng) | **2** | `HTN-R2-R2-21` → `HTN-R2-R2-22` | Tối ưu trải nghiệm thực hành |
| **TỔNG CỘNG** | **22** | | **PHÁN QUYẾT: `FAIL`** |

---

## 2. ĐỐI CHIẾU KẾT QUẢ KHẮC PHỤC TỪ VÒNG 1 (`round1_R2.json` & `round1_RESPONSE.md`)

### 2.1. Các cải tiến Vòng 1 đã thực thi tốt và đạt chuẩn an toàn dược
1. **Mở rộng từ điển thuốc THA**: Đã xây dựng đủ 18 hồ sơ thuốc riêng biệt thuộc module `htn` (bổ sung đầy đủ thuốc đường tĩnh mạch ICU `nicardipine`, `labetalol`, `nitroglycerin`, `urapidil`, `esmolol`, `sodium_nitroprusside`, `clevidipine` và các thuốc uống bậc 2–4 `nifedipine`, `felodipine`, `lercanidipine`, `chlorthalidone`, `hydrochlorothiazide`, `doxazosin`, `methyldopa`, `clonidine`, `moxonidine`).
2. **Kiểm định cú pháp trích dẫn và ngưỡng số học**: Toàn bộ **125/125 trích dẫn** trong `kb/citations/htn.json` khớp nguyên văn với tài liệu gốc (`0 lỗi trích dẫn đứt gãy`), và toàn bộ **155/155 ngưỡng số** trong `kb/thresholds/htn.json` khớp số học với câu trích dẫn (0 orphan numbers).
3. **Phân nhánh điều trị Cấp cứu Tăng huyết áp nội viện theo HMOD**: Đã tách bạch rõ THA nặng không tổn thương cơ quan đích cấp (cấm hạ áp nhanh đường tĩnh mạch) với 8 bệnh cảnh HMOD đặc hiệu: Bóc tách ĐMC cấp (chẹn beta đạt `HR < 60 bpm` trước khi truyền giãn mạch), Phù phổi cấp huyết động (Nitroglycerin + Furosemide, cấm chẹn beta, chặn tuyệt đối PDE-5i), Đột quỵ nhồi máu não (ngưỡng tiêu sợi huyết `< 185/110` vs không tiêu sợi huyết `≥ 220/120`), Xuất huyết não cấp (đích mượt `140–160 mmHg`, tránh hạ `< 130 mmHg`), Tiền sản giật nặng/Sản giật (cấm Nitroprusside do độc tính cyanide thai nhi).
4. **Cổng an toàn Spironolactone đa hệ quy chiếu**: Đã phân nhánh chính xác ngưỡng lọc cầu thận khởi trị Spironolactone ở THA kháng trị (`eGFR ≥ 30` theo ESC 2024 / VSH 2022 ở `INTL`/`VN` so với `eGFR ≥ 45` theo AHA/ACC 2025 ở `US`) và yêu cầu `K⁺ ≤ 4.5 mmol/L`.
5. **Tương tác kinh điển nguy kịch**: Đã chặn tốt `Nitroglycerin / Nitroprusside + PDE-5i`, cảnh báo hội chứng dội ngược khi ngừng `Clonidine + Chẹn beta` ở trạng thái huyết áp bình thường/cao, chuyển đổi `Methyldopa` khi có trầm cảm/hậu sản, và chuyển đổi lợi tiểu Thiazide sang Losartan/Amlodipine trên bệnh nhân Gút.

### 2.2. Các cam kết trong `round1_RESPONSE.md` CHƯA được thực thi hoặc thực thi lỗi trong mã nguồn thực tế
Qua kiểm tra trực tiếp mã nguồn và chạy `evaluate()` độc lập, R2 phát hiện **3 tuyên bố "đã sửa 100%" trong `docs/reviews/htn/round1_RESPONSE.md` không khớp với code thực tế**:
1. **Chỉnh liều thận Perindopril (`round1_RESPONSE.md` dòng 87)**: Văn bản phản hồi tuyên bố đã chỉnh liều Perindopril xuống `2.5 mg cách ngày` ở CKD G4. **Thực tế**, `src/modules/htn/rules.outpatient.steps.ts` (dòng 522, 633, 912) vẫn gán cứng `th('htn.perindopril.dose_start_adult')` = **5 mg/ngày** cho mọi bệnh nhân suy thận G3b, G4, G5 và lọc máu (`HTN-R2-R2-03`).
2. **Ma trận bệnh đồng mắc `htnComorbidityMatrix` (`round1_RESPONSE.md` dòng 57 & 86 — R1-HTN-26 & HTN-R2-17)**: Văn bản phản hồi tuyên bố đã tách `hfref` và `hfpef` thành 2 cột riêng và đổi lợi tiểu Thiazide ở cột `gout` sang `'avoid'`. **Thực tế**, `src/modules/htn/matrix.ts` vẫn chỉ có duy nhất cột `hfref` (thiếu hoàn toàn cột `hfpef`) và ô `indapamide.gout` vẫn giữ `caution/caution` (`HTN-R2-R2-15`).
3. **Tuân thủ chuẩn ngữ nghĩa trích dẫn QA-7**: Nhiều hồ sơ thuốc mới tạo ở Vòng 1 (`lercanidipine`, `moxonidine`, `urapidil`, `methyldopa`, `chlorthalidone`, `hydrochlorothiazide`, cùng rule tương tác `ix.lercanidipine_cyp3a4_cyclosporine`) gắn trích dẫn chéo của thuốc khác (như lấy nhãn FDA Amlodipine gắn cho Lercanidipine, lấy bảng chống chỉ định Chẹn beta gắn cho Moxonidine/Clonidine, lấy câu thai kỳ Thiazide gắn cho mục cho con bú của 12 thuốc khác nhau) dù file SmPC/FDA gốc đã nằm sẵn trong `Medical_Library_2026/09_Nhan_Thuoc/` (`HTN-R2-R2-13`, `HTN-R2-R2-14`).

---

## 3. CHI TIẾT CÁC PHÁT HIỆN MỨC ĐỘ NGUY KỊCH (`CRITICAL` — 5 MỤC)

### [HTN-R2-R2-01] `CRITICAL` — Hệ thống mù hoàn toàn với tất cả viên phối hợp liều cố định hạ áp (SPCs / FDCs) xuyên suốt KB, phân loại thuốc, trùng lặp, chống chỉ định thai kỳ/phù mạch/suy thận và tương tác thuốc
- **Loại mục**: `missing` | **Vị trí**: `src/engine/safety/drugClassify.ts`, `src/modules/htn/helpers.ts`, `kb/drugs/`
- **Phân tích dược lâm sàng**:
  ESC 2024 (Class I, Level B), AHA/ACC 2025, VSH/VNHA 2022 và chính các rule trong `src/modules/htn/rules.outpatient.steps.ts` đều khuyến cáo khởi trị và nâng bậc bằng **viên phối hợp cố định (SPC)** như `Coveram` (`amlodipine_perindopril`), `Preterax`/`Noliprel` (`perindopril_indapamide`), `Triplixam` (`perindopril_indapamide_amlodipine`), `Exforge` (`amlodipine_valsartan`), `Exforge HCT`, `Twynsta` (`telmisartan_amlodipine`), `Micardis Plus` (`telmisartan_hydrochlorothiazide`), `Hyzaar` (`losartan_hydrochlorothiazide`), `Cozaar XQ` (`amlodipine_losartan`), `CoAprovel` (`irbesartan_hydrochlorothiazide`), `Concor AM` (`bisoprolol_amlodipine`). Thế nhưng khác với ĐTĐ típ 2 và Hen/COPD đã có bảng phân rã hoạt chất FDC trong `src/engine/safety/drugClassify.ts`, **không có bất kỳ viên SPC hạ áp nào trong `kb/drugs/` hay `FDC_COMPONENTS` / `KB_DRUG_ALIASES`**.
- **Bằng chứng thực nghiệm `evaluate()`**:
  - **Kê trùng lặp nguy hiểm**: Bệnh nhân đang uống `amlodipine_perindopril` (`Coveram 5/5`), `amlodipine_valsartan` (`Exforge 5/80`) hoặc `perindopril_indapamide_amlodipine` (`Triplixam`) có HA 156/96 mmHg → `countCoreClasses()` trả về `0`, hệ thống phát lệnh `[START] amlodipine 5 mg` + `[START] perindopril 5 mg` chồng trực tiếp lên viên SPC đang dùng với **0 cảnh báo trùng lặp** (`alerts = 0`).
  - **Bỏ lọt Boxed Warning độc tính bào thai**: Thai phụ 30 tuổi (`conditions.pregnant = true`, HA 148/94 mmHg) đang uống `losartan_hydrochlorothiazide` (`Hyzaar`) và `amlodipine_perindopril` (`Coveram`) → **0 thẻ `[STOP]`**, chỉ phát `[START] methyldopa` chồng lên ARB + ACEi + HCTZ!
  - **Bỏ lọt chống chỉ định sống còn**: Bệnh nhân có tiền sử phù mạch (`priorAngioedema: true`) + `K⁺ = 6.2 mmol/L` + hẹp ĐM thận hai bên đang uống `perindopril_indapamide` (`Preterax`) → **0 thẻ `[STOP]`**. Bệnh nhân CKD G4 (`SCr 310 µmol/L`, `eGFR ~18`) đang uống `Triplixam` không bị dừng `indapamide` mà còn bị kê thêm `Coveram`!
  - **Bỏ lọt Phong tỏa kép hệ RAS (Dual RASi)**: Bệnh nhân đang uống `amlodipine_perindopril` + `losartan 50 mg` → **0 thẻ `[STOP]`**, **0 cảnh báo `ix.dual_rasi`**, thậm chí hệ thống kê thêm `amlodipine 5 mg`.
- **Hướng khắc phục bắt buộc**:
  1. Bổ sung ánh xạ phân rã đầy đủ các viên SPC hạ áp 2 và 3 thành phần (cả mã INN ghép lẫn biệt dược thông dụng tại VN) vào `FDC_COMPONENTS` và `KB_DRUG_ALIASES` trong `src/engine/safety/drugClassify.ts`.
  2. Cập nhật `getMedIds()` / `hasActiveClass()` trong `src/modules/htn/helpers.ts`, `reviewMeds*.ts`, `duplicates.ts` và `interactions.ts` dùng danh sách hoạt chất sau phân rã (`getExpandedDrugIds`) để mọi cổng an toàn bắt chính xác từng thành phần của viên SPC.
  3. Khai báo các hồ sơ SPC chủ lực trong `kb/drugs/*.json` kèm mảng `components` chuẩn.

---

### [HTN-R2-R2-02] `CRITICAL` — Rule `htn.inpatient.preeclampsia_mgso4` bỏ trống `drugId`, đi vòng qua Safety Pipeline và thiếu toàn bộ cổng an toàn sinh tử của Magnesium sulfate
- **Loại mục**: `rule` | **Vị trí**: `src/modules/htn/rules.inpatient.neuro_preg.ts:562-590`
- **Phân tích dược lâm sàng**:
  `rec_htn_preeclampsia_mgso4` phát lệnh `[START]` truyền tĩnh mạch Magnesium sulfate (`liều nạp 4 g IV, duy trì 1 g/giờ`) nhưng **không khai báo `drugId: 'magnesium_sulfate'`**. Việc bỏ trống `drugId` vô hiệu hóa toàn bộ `evaluateSafetyGates`, `mergeRecommendations`, `checkDuplicates` và `checkInteractions`:
  1. **Suy thận nặng / Thiểu niệu – Vô niệu / Lọc máu (`eGFR < 30`)**: Mg²⁺ thải trừ hoàn toàn qua thận; truyền liên tục `1 g/giờ` nguyên liều ở thai phụ vô niệu/CKD nặng gây ngộ độc magie cấp (mất phản xạ bánh chè > 4–5 mmol/L, liệt cơ hô hấp > 5–6.5 mmol/L, vô tâm thu > 10 mmol/L). Thực nghiệm Probe C1 (`SCr 420 µmol/L`, `eGFR ~11`, `dialysis: true`) chứng minh hệ thống vẫn phát nguyên văn y lệnh `duy trì 1 g/giờ` — trái ngược trực tiếp với chính `kb/drugs/magnesium_sulfate.json:39-47`.
  2. **Nhược cơ nặng (`myastheniaGravis`) & Block nhĩ thất cao độ (`avBlock2or3`)**: Probe C2 chứng minh hệ thống vẫn phát `[START]` bất chấp `contraindications` trong `kb/drugs/magnesium_sulfate.json:83-97`.
  3. **Nạp chồng liều bolus 4 g IV lần 2**: Khi `currentMeds` đã có `magnesium_sulfate`, do thiếu `drugId` nên `mergeRecommendations` không đổi `START` → `CONTINUE` mà phát lệnh nạp thêm bolus 4 g IV lần hai!
  4. **Hiệp đồng tụt huyết áp & ức chế thần kinh-cơ với CCB**: Không có cảnh báo hay rule tương tác khi dùng đồng thời `magnesium_sulfate` + `nifedipine` / `nicardipine` (ESC 2024 p. 3979 / PDF p. 74: *"Concomitant use of CCBs and magnesium sulfate can result in hypotension due to potential synergism"*).
- **Hướng khắc phục bắt buộc**:
  1. Gắn `drugId: 'magnesium_sulfate'` cho `rec_htn_preeclampsia_mgso4`.
  2. Phân nhánh ngay trong rule: khi `eGFR < 30` / `CrCl < 30` / `onDialysis`, giảm 50% truyền duy trì (`0.5 g/giờ`) hoặc ngưng truyền duy trì và định lượng Mg²⁺ huyết thanh mỗi 4–6 giờ, kiểm tra phản xạ bánh chè, nhịp thở ≥ 16 lần/phút, nước tiểu ≥ 30 mL/giờ, luôn chuẩn bị sẵn ống **Calcium gluconate 10% 10 mL (1 g)** tiêm TM chậm làm chất đối kháng đặc hiệu. Chặn `AVOID` khi có nhược cơ nặng hoặc block nhĩ thất cao độ chưa đặt máy tạo nhịp.
  3. Bổ sung rule tương tác `ix.magnesium_sulfate_ccb` (`severity: 'major'`) trong `kb/interactions/cardiovascular.json`.

---

### [HTN-R2-R2-03] `CRITICAL` — Kê quá liều gấp 2–4 lần khuyến cáo SmPC cho `perindopril` ở CKD G3b–G5/lọc máu, vi phạm hướng dẫn Bộ Y tế 2024 ở profile `VN`, và bỏ sót giảm liều `perindopril` đang dùng liều cao
- **Loại mục**: `rule` | **Vị trí**: `src/modules/htn/rules.outpatient.steps.ts:522, 633, 912` & `src/engine/safety/reviewMedsVitalsAndRenal.ts`
- **Phân tích & Bằng chứng thực nghiệm**:
  - Trái với cam kết trong `round1_RESPONSE.md` (dòng 87), các rule khởi trị ngoại trú luôn lấy cứng `th('htn.perindopril.dose_start_adult')` = **5 mg uống 1 lần/ngày** bất kể chức năng thận:
    - **Probe B1** (`SCr 165 µmol/L`, `CrCl ~43 mL/phút`, CKD G3b): Kê `5 mg/ngày` → **gấp 2 lần** bảng chỉnh liều EMA Coversyl SmPC (`09_Nhan_Thuoc/EMA/perindopril_Coversyl_SmPC.pdf`, p. 2, Table 1: `30 < ClCR < 60: 2.5 mg per day`).
    - **Probe B2** (`SCr 260 µmol/L`, `CrCl ~27 mL/phút`, CKD G4): Kê `5 mg/ngày (ưu tiên gộp trong viên SPC cùng Amlodipine)` → **gấp 4 lần** liều EMA Coversyl SmPC (`15 < ClCR < 30: 2.5 mg every other day`) và khuyên dùng viên phối hợp cố định hàng ngày vốn không thể chia cách ngày!
    - **Probe B3** (`SCr 260 µmol/L`, `CrCl ~27 mL/phút`, `profile: 'VN'`): Vẫn kê `perindopril 5 mg/ngày` mặc dù Hướng dẫn Bộ Y tế Việt Nam QĐ 2388/QĐ-BYT 2024 (`06_Viet_Nam/BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf`, p. 38, Bảng 12) quy định rõ: *"Perindopril: Không sử dụng khi CrCl <30 ml/phút"*!
    - **Probe B4** (`SCr 650 µmol/L`, `dialysis: true`): Vẫn kê `5 mg/ngày` thay vì `2.5 mg vào ngày lọc máu (uống sau buổi lọc)`!
    - **Probe B5** (`CrCl ~27 mL/phút`, đang uống sẵn `perindopril 10 mg/ngày` — **gấp 8 lần** liều SmPC!): Phát **0 thẻ `[REDUCE]`**!
- **Hướng khắc phục bắt buộc**:
  1. Tra cứu trực tiếp `renalBand('perindopril', crcl, 'crcl')` trong `rules.outpatient.steps.ts`: khởi đầu `2.5 mg/ngày` khi `30 ≤ CrCl < 60`; ở `CrCl < 30`, nếu `profile === 'VN'` tự động chuyển sang ARB không thải qua thận (`losartan 25–50 mg/ngày` / `telmisartan 40 mg/ngày` theo Bảng 12 QĐ 2388/QĐ-BYT), còn ở `INTL`/`US` hoặc ưu tiên ARB để duy trì chế độ uống hàng ngày, hoặc nếu kê Perindopril phải hiển thị chính xác `2.5 mg cách ngày` (G4) / `2.5 mg sau buổi lọc máu` (HD) và bỏ gợi ý gộp viên SPC hàng ngày.
  2. Bổ sung kiểm tra trần liều thận cho ACEi (`perindopril`, `ramipril`, `lisinopril`, `enalapril`) trong `reviewMedsVitalsAndRenal.ts` để phát thẻ `[REDUCE]` / `[SWITCH]` khi vượt trần.

---

### [HTN-R2-R2-04] `CRITICAL` — Chống chỉ định Hẹp khít van động mạch chủ (`severeAorticStenosis`): `preeclampsia_emergency` kê thẳng IV `nicardipine`, còn `selectIvAgentAvoidingSevereAs` kê bolus `urapidil` mâu thuẫn với chính `kb/drugs/urapidil.json`
- **Loại mục**: `rule` | **Vị trí**: `src/modules/htn/rules.inpatient.neuro_preg.ts:503-525` & `src/modules/htn/helpers.ts`
- **Phân tích & Bằng chứng thực nghiệm**:
  1. Trong `htn.inpatient.preeclampsia_emergency`, khi `contraLabetalol` đúng (ví dụ `asthma: true` hoặc `hr < 60`), code gán cứng `drugId: 'nicardipine'` mà **quên kiểm tra `isSevereAorticStenosis(ctx)`**. Thực nghiệm **Probe C3** (`severePreeclampsiaEclampsia: true`, `asthma: true`, `severeAorticStenosis: true`) chứng minh hệ thống phát lệnh `[START] nicardipine 5 mg/giờ` với `alerts = 0` — vi phạm chống chỉ định tuyệt đối của AHA/ACC 2025 Table 26 (*"Contraindicated in advanced aortic stenosis"*) và `kb/drugs/nicardipine.json:98-103`.
  2. Trong các cấp cứu THA khác (**Probes C4, C4b, D4, D5**), khi có `severeAorticStenosis: true` kèm chống chỉ định chẹn beta, hàm `selectIvAgentAvoidingSevereAs()` chọn `drugId: 'urapidil'` và kê tiêm tĩnh mạch chậm `12.5–25 mg trong 20 giây` — mâu thuẫn trực tiếp với chính `kb/drugs/urapidil.json:95-101` (đang khai báo `code: "severe_aortic_stenosis"` là chống chỉ định!) và SmPC Ebrantil (`09_Nhan_Thuoc/EMA/Ebrantil_urapidil_SmPC.pdf`, p. 3: Mục 4.3 chống chỉ định *Aortenisthmusstenose* [hẹp eo ĐMC]; Mục 4.4 yêu cầu thận trọng tối đa ở suy tim cơ học do hẹp van ĐMC/hai lá vì hạ áp nhanh gây nhịp chậm hoặc ngừng tim).
- **Hướng khắc phục bắt buộc**:
  1. Kiểm tra `isSevereAorticStenosis(ctx)` trong `preeclampsia_emergency` trước khi kê `nicardipine`; đồng thời kích hoạt kiểm tra `DrugEntry.contraindications` ở tầng `gates.ts` / `reviewMeds.ts`.
  2. Chuẩn hóa lại `kb/drugs/urapidil.json` (tách `aortic_coarctation` ở Mục 4.3 với thận trọng đặc biệt ở `severe_aortic_stenosis` Mục 4.4) và nếu buộc phải dùng thuốc truyền chuẩn độ tại ICU khi có hẹp khít van ĐMC + chống chỉ định chẹn beta, bắt buộc cảnh báo dò liều cực thấp qua bơm tiêm điện dưới theo dõi HA động mạch xâm lấn (không tiêm bolus nhanh 25 mg/20 giây).

---

### [HTN-R2-R2-05] `CRITICAL` — Bỏ trống 100% cổng an toàn Hạ natri máu (`patient.na`) đối với nhóm lợi tiểu Thiazide / Thiazide-like (`chlorthalidone`, `indapamide`, `hydrochlorothiazide`)
- **Loại mục**: `missing` | **Vị trí**: `src/engine/safety/vitalAndRenalGates.ts`, `reviewMedsVitalsAndRenal.ts`, `src/modules/htn/rules.outpatient.steps.ts`, `kb/drugs/*.json`
- **Phân tích & Bằng chứng thực nghiệm**:
  - Dù `Patient` có trường `na?: number` (`src/engine/types.ts:519`), toàn bộ hệ thống không có một dòng code nào kiểm tra `patient.na`.
  - **Probe D1**: Bệnh nhân đang dùng `chlorthalidone 25 mg/ngày` có `na = 122 mmol/L` (hạ natri máu nặng đe dọa phù não / co giật) → **0 thẻ `[STOP]`/`[HOLD]`**.
  - **Probe D1b**: Bệnh nhân có `na = 122 mmol/L` đang dùng `perindopril + amlodipine` chưa đạt đích HA → Bước 2 chủ động phát lệnh **`[START] indapamide 1.5 mg/ngày`** trực tiếp vào bệnh nhân hạ natri máu nặng!
- **Hướng khắc phục bắt buộc**:
  1. Bổ sung `gates` thông số `Na` vào `indapamide.json`, `chlorthalidone.json`, `hydrochlorothiazide.json` và hỗ trợ `parameter: 'Na'` trong `vitalAndRenalGates.ts` + `reviewMedsVitalsAndRenal.ts`: phát `[STOP]` ngay khi `Na < 130 mmol/L` (kèm `[REFER]` cấp cứu nội viện khi `Na < 125 mmol/L`) và `[HOLD]` / chặn khởi trị mới Thiazide ở Bước 2 khi `Na < 135 mmol/L`.

---

## 4. CHI TIẾT CÁC PHÁT HIỆN MỨC ĐỘ TRỌNG YẾU (`MAJOR` — 11 MỤC)

### [HTN-R2-R2-06] `MAJOR` — Thiếu đầu vào và cổng an toàn Thời kỳ cho con bú (`breastfeeding`), dẫn đến kê đầu tay `perindopril` cho sản phụ hậu sản bất chấp `lactation: "avoid"`
- **Vị trí**: `src/engine/types.ts:192`, `src/modules/htn/inputs.ts`, `src/engine/safety/reviewMeds.ts`, `src/modules/htn/rules.outpatient.*`
- **Bằng chứng**: `STANDARD_CONDITIONS.pregnant` gộp chung `"Mang thai / Cho con bú"`. Khi sản phụ sau sinh bật `customInputs.postpartum: true` và `pregnant: false` (**Probes C7, C7b, C7c**), hệ thống vừa phát `[SWITCH]` khuyên đổi Methyldopa sang Nifedipine LA / Amlodipine / Labetalol, vừa phát lệnh **`[START] perindopril 5 mg/ngày`** — trái với chính `kb/drugs/perindopril.json:128` (`lactation.status: "avoid"`, Coversyl SmPC p. 8: *"Coversyl Arginine is not recommended... during breast-feeding"*). Đồng thời không phát `[STOP]` khi bà mẹ cho con bú đang uống `lercanidipine` (Zanidip SmPC p. 4: *"should not be used during breast-feeding"*), `urapidil` (Ebrantil SmPC p. 3: *"Stillzeit" — kontraindiziert*), `moxonidine`, `clonidine`, `chlorthalidone`, `indapamide`, hay nhóm ARB.
- **Khắc phục**: Tách riêng `conditions.breastfeeding`, kiểm tra `drugEntry.lactation.status` trong `reviewMeds.ts`, và bổ sung nhánh chọn thuốc an toàn thời kỳ cho con bú (Nifedipine LA / Amlodipine / Labetalol / Enalapril hoặc Captopril theo ESC 2024 Section 9.5.3 & VSH 2022 Bảng 16).

### [HTN-R2-R2-07] `MAJOR` — Lỗi dùng `.find()` trong `rules.outpatient.safety.ts` bỏ lọt thuốc nguy hiểm thứ hai trên cùng bệnh nhân (hạ kali máu nặng dùng 2 lợi tiểu; hẹp ĐM thận hai bên kèm `aliskiren`)
- **Vị trí**: `src/modules/htn/rules.outpatient.safety.ts:639, 813` & `src/modules/htn/rules.inpatient.neuro_preg.ts`
- **Bằng chứng**:
  - **Probe D2** (`k: 2.9 mmol/L`, đang dùng `chlorthalidone 12.5 mg` + `furosemide 40 mg`): `.find()` chỉ phát `[HOLD]` cho `chlorthalidone`, còn **`furosemide 40 mg` không hề bị `[HOLD]`** dù `K⁺ = 2.9 mmol/L` có nguy cơ xoắn đỉnh cấp tính!
  - **Probe D10** (`bilateralRenalArteryStenosis: true`, ĐTĐ + `eGFR ~45`, đang dùng `aliskiren` + `sacubitril_valsartan`): `.find()` chỉ phát `[STOP]` cho `sacubitril_valsartan`, bỏ lọt hoàn toàn `aliskiren` (cả ở cổng hẹp ĐM thận hai bên, cổng chống chỉ định `aliskiren + ĐTĐ/eGFR < 60`, lẫn `ban_dual_rasi`!).
- **Khắc phục**: Đưa kiểm tra hạ kali máu (`K⁺ < 3.5` cho mọi lợi tiểu thiazide & quai) và hẹp ĐM thận hai bên / Dual RASi (bao phủ đủ `acei`, `arb`, `arni`, `dri`/`aliskiren`) vào vòng lặp duyệt từng thuốc trong `reviewMedsVitalsAndRenal.ts` và `reviewMeds.ts`.

### [HTN-R2-R2-08] `MAJOR` — Xung đột y lệnh tại `SBP < 90 mmHg` trên bệnh nhân dùng `clonidine` + Chẹn beta: phát đồng thời `[HOLD] clonidine` và `[HOLD] bisoprolol` gây nguy cơ cơn tăng huyết áp dội ngược
- **Vị trí**: `src/modules/htn/rules.outpatient.safety.ts` (`hypotension_hold_therapy`) & `src/engine/safety/reviewMedsVitalsAndRenal.ts`
- **Bằng chứng**: **Probe D9** (`SBP = 82/52 mmHg`, đang dùng `clonidine` + `bisoprolol`) xuất cùng lúc `[HOLD] clonidine`, `[HOLD] bisoprolol` VÀ `[MONITOR] "BẮT BUỘC ngừng Chẹn beta trước vài ngày rồi mới giảm dần clonidine"`. Ngừng đột ngột Clonidine khi Bisoprolol còn tồn lưu gây kích thích alpha-1 không đối kháng (AHA/ACC 2025 Table 17 p. 47).
- **Khắc phục**: Khi tụt huyết áp ở bệnh nhân phối hợp `clonidine`/`moxonidine` + Chẹn beta, phát `[REFER]` chuyển Cấp cứu/Nội viện theo dõi sát, tạm ngưng ngay Chẹn beta (và thuốc giãn mạch/lợi tiểu khác) trước, và giảm liều Clonidine có kiểm soát nội viện.

### [HTN-R2-R2-09] `MAJOR` — Thiếu chống chỉ định đặc hiệu chỉ định THA của FDA Inspra (`CrCl < 50`, ĐTĐ típ 2 có microalbumin niệu) và thiếu rule tương tác `eplerenone` + chất ức chế CYP3A4 vừa (`diltiazem`, `verapamil`, `erythromycin`, `fluconazole`)
- **Vị trí**: `kb/drugs/eplerenone.json`, `kb/interactions/renal_rasi.json`, `src/engine/safety/reviewMedsVitalsAndRenal.ts`
- **Bằng chứng**: **Probe D6** (`SCr 165 µmol/L`, `eGFR ~38`, `CrCl ~43 mL/phút`, không suy tim, đang uống `eplerenone 50 mg/ngày` + `diltiazem 180 mg/ngày`) trả về **0 thẻ `[STOP]`/`[REDUCE]`** và **0 `SafetyAlert`**, thậm chí còn kê thêm `perindopril 5 mg/ngày`! Nhãn gốc FDA Inspra (`09_Nhan_Thuoc/FDA/FDA_label_eplerenone.pdf`, p. 4–5) quy định rõ: (1) Chống chỉ định trong điều trị THA khi `CrCl < 50 mL/min` hoặc ĐTĐ típ 2 kèm microalbumin niệu; (2) Khi dùng cùng chất ức chế CYP3A4 vừa (`verapamil`, `diltiazem`, `erythromycin`, `fluconazole`), không vượt quá 25 mg x 1 lần/ngày (HFrEF/suy thận) hoặc khởi đầu 25 mg/ngày (THA).
- **Khắc phục**: Bổ sung rule `ix.eplerenone_moderate_cyp3a4` vào `kb/interactions/renal_rasi.json` và thực thi giới hạn liều / chống chỉ định theo chỉ định THA của `eplerenone` trong `reviewMedsVitalsAndRenal.ts`.

### [HTN-R2-R2-10] `MAJOR` — `parseDoseMg()` bỏ qua tần suất dùng nhiều lần/ngày (`freq`) và đơn vị `'viên'`, làm mất thẻ `[REDUCE]` giới hạn liều tương tác (Simvastatin 40 mg/ngày + Amlodipine)
- **Vị trí**: `src/engine/safety/reviewMedsSpecialized.ts:18-28` & `src/engine/safety/interactions.ts`
- **Bằng chứng**: **Probe D7** (`simvastatin` `dose: 20, unit: 'mg', freq: '2 lần/ngày'` = 40 mg/ngày + `amlodipine 10 mg`) và **Probe D7b** (`name: 'Simvastatin 40mg', dose: 1, unit: 'viên'`) đều **bỏ lọt thẻ `REC [REDUCE]`** và không gắn cờ quá liều trần 20 mg/ngày.
- **Khắc phục**: Xây dựng hàm chuẩn hóa tổng liều ngày `getEstimatedDailyDoseMg(med)` nhân theo hệ số tần suất `med.freq` và trích xuất hàm lượng mg từ tên thuốc đơn chất khi `unit === 'viên'`.

### [HTN-R2-R2-11] `MAJOR` — Chưa thực thi cổng chống chỉ định dị ứng đậu nành/trứng & tăng triglyceride nặng của `clevidipine`, dị ứng Sulfonamide của `indapamide`/`chlorthalidone`/`hctz`, và cổng `eGFR < 30` của `sodium_nitroprusside`
- **Vị trí**: `src/modules/htn/inputs.ts`, `rules.inpatient.emergency.ts`, `rules.outpatient.steps.ts`, `kb/drugs/sodium_nitroprusside.json`
- **Bằng chứng**: Nhãn FDA Cleviprex (`09_Nhan_Thuoc/FDA/FDA_label_clevidipine.pdf`, p. 4, Section 4.1–4.2) chống chỉ định khi dị ứng đậu nành/trứng hoặc rối loạn chuyển hóa lipid / viêm tụy cấp kèm tăng lipid máu; nhãn FDA Chlorthalidone (`p. 2`) & SmPC Natrilix SR chống chỉ định khi quá mẫn với dẫn xuất sulfonamide (**Probe D12** chứng minh Bước 2 vẫn kê `indapamide` khi `sulfonamideAllergy: true`).
- **Khắc phục**: Bổ sung đầu vào dị ứng (`sulfonamideAllergy`, `soyEggAllergy`), kiểm tra `patient.tg >= 5.6 mmol/L` cho `clevidipine`, chặn khởi trị/dừng Thiazide khi dị ứng sulfonamide, và thêm gate `eGFR < 30` (`avoid`) cho `sodium_nitroprusside.json`.

### [HTN-R2-R2-12] `MAJOR` — Thiếu cảnh báo ngừng `doxazosin` đang dùng ở bệnh nhân suy tim HFrEF, thiếu rule tương tác `chẹn alpha-1 + PDE-5i` và thiếu rule tương tác chelat hóa `methyldopa + sắt đường uống`
- **Vị trí**: `src/modules/htn/rules.outpatient.special.ts` & `kb/interactions/cardiovascular.json`
- **Bằng chứng**: **Probe D11** (`LVEF = 32%`, đang dùng `doxazosin 4 mg` + `tadalafil 10 mg`) trả về **0 thẻ `[STOP]`/`[SWITCH]` cho Doxazosin** và **0 `SafetyAlert`**; **Probe C6** (thai phụ dùng `methyldopa` + `ferrous_sulfate`) trả về **0 `SafetyAlert`** dù sắt uống cùng lúc làm mất 50–70% hấp thu Methyldopa.
- **Khắc phục**: Thêm rule rà soát `doxazosin` trên nền HFrEF, bổ sung `ix.alpha1_blocker_pde5i` và `ix.methyldopa_oral_iron` vào `kb/interactions/cardiovascular.json`.

### [HTN-R2-R2-13] `MAJOR` — Vi phạm nghiêm trọng chuẩn QA-7 tại `ix.lercanidipine_cyp3a4_cyclosporine`: cả 4 trích dẫn đều lấy nhầm từ nhãn Amlodipine / bảng liều VSH, không có bất kỳ dữ liệu tương tác nào của Lercanidipine
- **Vị trí**: `kb/interactions/cardiovascular.json:296-331`
- **Bằng chứng**: Rule khẳng định Ketoconazole tăng AUC Lercanidipine **15 lần** và Cyclosporine tăng **3 lần**, nhưng gắn `fda.amlodipine.strong_cyp3a_pk_cyclosporine`, `fda.amlodipine.strong_cyp3a_cyclosporine_ddi` (đều của **Amlodipine**!), `aha.acc.2025.table16_ccb_cyp3a4_cyclosporine` (không nhắc Lercanidipine) và `vsh.htn.2022.dhp_ccb_lercanidipine_dose` (chỉ có `"Lercanidipine 10 20"`). Trong khi đó `09_Nhan_Thuoc/EMA/Zanidip_SmPC.pdf` (p. 2–3) có nguyên văn chính xác 100% cả con số 15-fold và 3-fold!
- **Khắc phục**: Đăng ký `Zanidip_SmPC.pdf` vào `kb/sources.json` và thay bằng trích dẫn nguyên văn từ trang 2–3 của Zanidip SmPC.

### [HTN-R2-R2-14] `MAJOR` — Vi phạm hệ thống chuẩn QA-7 xuyên suốt 12 hồ sơ thuốc trong `kb/drugs/*.json` (và lan sang `matrix.ts` + `rules.outpatient.safety.ts`) dù nhãn gốc SmPC/FDA đã có sẵn trong thư viện offline
- **Vị trí**: `kb/drugs/{lercanidipine,moxonidine,urapidil,methyldopa,chlorthalidone,hydrochlorothiazide,clonidine,doxazosin,nifedipine,amlodipine,sodium_nitroprusside,perindopril}.json` & `src/modules/htn/matrix.ts`
- **Bằng chứng tổng hợp**:
  1. `esc.htn.2024.pregnancy_lactation_thiazide` (chỉ nói về thiazide/furosemide trong **thai kỳ**) bị dán vào mục **`lactation`** của **12 thuốc** khác nhau (`amlodipine`, `felodipine`, `lercanidipine`, `doxazosin`, `clonidine`, `moxonidine`, `nicardipine`, `labetalol`, `urapidil`, `esmolol`, `chlorthalidone`, `hydrochlorothiazide`).
  2. `lercanidipine.json` dùng bảng liều VSH (`"Lercanidipine 10 20"`) cho toàn bộ chống chỉ định thận/gan/LVOT/CYP3A4i/ciclosporin thay vì `Zanidip_SmPC.pdf` (p. 2–4).
  3. `moxonidine.json` dùng `esc.htn.2024.resistant_alternatives` cho liều thận và dùng bảng chống chỉ định **Chẹn beta** cho `HR < 50`/block AV thay vì `Physiotens_moxonidine_SmPC.html` (đồng thời cần rà soát chống chỉ định Section 4.3 `cardiac insufficiency` và cập nhật Section 4.4 ở `GFR < 30`).
  4. `urapidil.json` dùng câu phù phổi cấp VSH 2022 cho chỉnh liều thận thay vì `Ebrantil_urapidil_SmPC.pdf` (p. 2–4).
  5. `hydrochlorothiazide.json` & `chlorthalidone.json` dẫn nhầm `ema.indapamide.contraindications_hepatic` cho `sulfonamide_allergy` thay vì `FDA_label_chlorthalidone.pdf` (p. 2).
  6. `nifedipine.json` (mục `cardiogenic_shock`) và `htnRenalMatrix` ô `nifedipine.g5` (`matrix.ts:177`) dẫn nhầm `aha.acc.2025.nifedipine_no_sublingual` (`"Do not use sublingual form."`); `sodium_nitroprusside.json` (`pde5_inhibitor_use`) dẫn nhầm `aha.acc.2025.table27_aortic_acs`; `perindopril.json` (`angioedema_history` & `lactation`) dẫn nhầm `ema.perindopril.pregnancy`; `amlodipine.json` (`hepatic`) dẫn nhầm quote bị cắt cụt trước đoạn suy gan.
- **Khắc phục**: Đăng ký đầy đủ các SmPC/FDA sẵn có trong `09_Nhan_Thuoc/` vào `kb/sources.json` và thay bằng trích dẫn đúng ngữ nghĩa 1-1 cho từng mệnh đề.

### [HTN-R2-R2-15] `MAJOR` — `htnComorbidityMatrix` & `htnRenalMatrix` chưa thực hiện cam kết Vòng 1 (thiếu cột `hfpef`, `gout` của Thiazide vẫn là `caution`) và thiếu hoàn toàn các thuốc trụ cột `perindopril`, `losartan`, `spironolactone`, `eplerenone`, `furosemide` trong bảng chỉnh liều thận
- **Vị trí**: `src/modules/htn/matrix.ts`
- **Bằng chứng**: Kiểm tra runtime Group E xác nhận `htnComorbidityMatrix` chỉ có 9 cột (không có `hfpef`), `indapamide.gout` vẫn là `caution/caution` (mâu thuẫn với `rec_htn_gout_switch_thiazide`), và `htnRenalMatrix` chỉ liệt kê 18 thuốc `htn`-owned mà thiếu hoàn toàn nhóm ACEi (`perindopril`), ARB (`losartan`), MRA (`spironolactone`, `eplerenone`) và Lợi tiểu quai (`furosemide`) vốn là các thuốc trụ cột đang kê đơn trực tiếp trong module THA.
- **Khắc phục**: Tách cột `hfpef`, đổi `indapamide.gout` sang `not_rec/not_rec`, bổ sung `perindopril`, `losartan`, `spironolactone`, `eplerenone`, `furosemide` vào `htnRenalMatrix`, và làm rõ sự khác biệt giữa Labetalol (`rec`) vs Atenolol (`contra`) ở ô thai kỳ của dòng Chẹn beta.

### [HTN-R2-R2-16] `MAJOR` — Kê cứng liều khởi đầu `losartan` 50 mg/ngày khi suy gan / `eGFR < 15` / đang dùng lợi tiểu (thay vì 25 mg/ngày theo nhãn FDA Cozaar), và thiếu trường đầu vào UI `conditions.aceiIntolerance` (Ho khan do ACEi)
- **Vị trí**: `src/modules/htn/rules.outpatient.steps.ts` & `src/modules/htn/inputs.ts`
- **Bằng chứng**: (1) Nhãn FDA Cozaar Section 2.1 & 2.4 và `kb/drugs/losartan.json:62-66, 113-118` bắt buộc giảm liều khởi đầu Losartan xuống **25 mg/ngày** ở suy gan nhẹ–vừa (AUC tăng 4–5 lần) hoặc giảm thể tích nội mạch / `eGFR < 15`, nhưng `rules.outpatient.steps.ts` luôn kê 50 mg/ngày. (2) `helpers.ts` có hàm `hasAceiIntolerance(ctx)`, nhưng `inputs.ts` và `STANDARD_CONDITIONS` hoàn toàn không có trường `conditions.aceiIntolerance` để bác sĩ tích chọn ho khan do ACEi trên giao diện.
- **Khắc phục**: Bổ sung `conditions.aceiIntolerance` vào `htnInputs` (kèm thẻ `[SWITCH]` ACEi → ARB nếu đang uống ACEi bị ho khan) và hạ liều khởi đầu Losartan xuống 25 mg/ngày khi suy gan / `eGFR < 15` / đang dùng lợi tiểu liều cao.

---

## 5. CHI TIẾT CÁC PHÁT HIỆN MỨC ĐỘ NHỎ (`MINOR` — 4 MỤC) & ĐỀ XUẤT (`SUGGESTION` — 2 MỤC)

1. **[HTN-R2-R2-17] (`minor` — `rules.outpatient.safety.ts`)**: Chưa phát thẻ `[STOP]` trực tiếp khi `currentMeds` đang có `nifedipine` đường ngậm dưới lưỡi (`route: 'sublingual'`) hoặc viên nang giải phóng nhanh 10 mg (**Probe D8**). Cần quét `route`/`name` và phát thẻ `[STOP]` đổi sang viên phóng thích kéo dài LA/GITS/Retard.
2. **[HTN-R2-R2-18] (`minor` — `reviewMedsVitalsAndRenal.ts` & `rules.inpatient.emergency.ts`)**: (a) Biến nhị phân `liverDisease` phát `[STOP]` đồng loạt cho cả `telmisartan` và `lercanidipine` như Child-Pugh C (nên hỗ trợ phân độ Child-Pugh A/B vs C để ở mức nhẹ–vừa chỉ giới hạn `telmisartan ≤ 40 mg/ngày`); (b) Chuỗi tiêu đề/liều thuốc truyền tĩnh mạch ghép bị lặp từ: `"bằng Nicardipine (truyền tĩnh mạch) tĩnh mạch"`.
3. **[HTN-R2-R2-19] (`minor` — `rules.outpatient.steps.ts` & `reviewMedsVitalsAndRenal.ts`)**: (a) Chưa phát thẻ `[REDUCE]` khi bệnh nhân CKD G3a–G3b (`30 ≤ eGFR < 60`) đang dùng `moxonidine 0.6 mg/ngày` vượt trần `0.4 mg/ngày` (**Probe B6**); (b) `step3_resistant_spiro` vẫn đếm các thuốc vừa bị phát lệnh `[STOP]` trong cùng lượt chạy làm đủ 3 nhóm nền để khởi trị ngay Spironolactone (**Probe B8**).
4. **[HTN-R2-R2-20] (`minor` — `kb/drugs/hydralazine.json` & `magnesium_sulfate.json`)**: Bổ sung dạng ống tiêm tĩnh mạch cấp cứu sản khoa (`5–10 mg IV`) vào `hydralazine.json`, và gắn đúng citation `esc.htn.2024.preeclampsia_mgso4` (thay cho `gina.asthma.2026.pregnancy_safety`) cho phác đồ Zuspan trong `magnesium_sulfate.json`.
5. **[HTN-R2-R2-21] (`suggestion` — Sàng lọc THA do thuốc ngoại sinh)**: Mở rộng quét tự động corticosteroid toàn thân, thuốc tránh thai chứa estrogen (COCs), thuốc thông mũi cường giao cảm, SNRI, cyclosporine/tacrolimus, erythropoietin và cam thảo trên `currentMeds` theo AHA/ACC 2025 Table 11 & ESC 2024 Table 10.
6. **[HTN-R2-R2-22] (`suggestion` — Tư vấn Dược lâm sàng ngoại trú)**: Bổ sung hướng dẫn *Sick-day rules* (tạm ngưng RASi/Lợi tiểu/MRA 48–72 giờ khi tiêu chảy, nôn ói, sốt mất nước) và lưu ý phù mắt cá chân do DHP-CCB không đáp ứng với Furosemide (giảm mạnh khi phối hợp sẵn ACEi/ARB trong viên SPC).

---

## 6. KẾT LUẬN & PHÁN QUYẾT THẨM ĐỊNH VÒNG 2

Module Tăng huyết áp (`htn`) đã có bước tiến lớn về kiến trúc phân tầng huyết áp, xử trí 8 thể cấp cứu HMOD nội viện và độ chính xác cú pháp của 125 trích dẫn guideline. Tuy nhiên, dưới góc độ kiểm toán độc lập về **An toàn Thuốc & Dược lâm sàng**, hệ thống vẫn còn **5 lỗi mức độ CRITICAL** (mù hoàn toàn với viên phối hợp cố định SPC gây kê trùng lặp và bỏ lọt chống chỉ định thai kỳ/phù mạch/suy thận; thiếu `drugId` và toàn bộ cổng an toàn thận/nhược cơ/trùng lặp/tương tác CCB của Magnesium sulfate tĩnh mạch; kê quá liều Perindopril gấp 2–4 lần ở suy thận nặng G3b–G5 và vi phạm hướng dẫn Bộ Y tế 2024; kê Nicardipine tĩnh mạch vào hẹp khít van động mạch chủ trong tiền sản giật & mâu thuẫn chống chỉ định Urapidil; thiếu hoàn toàn cổng hạ natri máu `Na⁺` khi dùng/khởi trị Thiazide) cùng **11 lỗi mức độ MAJOR** (an toàn cho con bú hậu sản, lỗi `.find()` bỏ lọt thuốc thứ hai, xung đột ngưng đột ngột Clonidine + Chẹn beta khi tụt áp, Eplerenone CYP3A4i vừa & chống chỉ định THA, lỗi tính liều ngày theo tần suất/viên, vi phạm QA-7 trên `ix.lercanidipine_cyp3a4_cyclosporine` và 12 hồ sơ thuốc, cùng các mục ma trận chưa sửa từ Vòng 1).

Theo quy tắc nghiêm ngặt của Hội đồng Thẩm định Y khoa (`docs/REVIEW_PROTOCOL.md`: chỉ cấp `PASS` khi `0 critical` và `0 major`), kết quả thẩm định Độc lập Vòng 2 của Reviewer R2 là:

**VERDICT: `FAIL`**
