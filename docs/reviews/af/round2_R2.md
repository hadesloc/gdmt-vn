# BÁO CÁO THẨM ĐỊNH DƯỢC LÂM SÀNG & AN TOÀN THUỐC – VÒNG 2 (ROUND 2)
## Module: Rung nhĩ (`af` – Atrial Fibrillation)

- **Chuyên gia thẩm định**: **R2 – Dược sĩ Lâm sàng & Kiểm định An toàn Thuốc độc lập** (*Independent Clinical Pharmacist & Medication Safety Auditor*)
- **Vòng thẩm định**: Vòng 2 (*Round 2 – Post-Remediation Audit & Deep Adversarial Pharmacotherapy Testing*)
- **Ngày thực hiện**: `2026-10-27`
- **Phạm vi kiểm định**:
  - Mã nguồn module `af`: `src/modules/af/{index,inputs,rules,rulesHelpers,rulesOac,rulesRateRhythm,rulesInpatient,matrices,pathways,presets}.ts`
  - Tầng máy tính & an toàn thuốc dùng chung: `src/engine/{evaluate,derive,units,merge,mergeConflictGroups}.ts`, `src/engine/calculators/{doacDose,crcl,egfr,cha2ds2va}.ts`, `src/engine/safety/{gates,vitalAndRenalGates,organAndCrisisGates,reviewMeds,reviewMedsVitalsAndRenal,interactions,drugClassify,duplicateRules}.ts`, `src/kb-types/access.ts`
  - Cơ sở tri thức Dược & Tương tác: 17 tệp `kb/drugs/*.json` nhóm chống đông / kiểm soát tần số / chống loạn nhịp, `kb/thresholds/af.json`, `kb/citations/{af,interactions}.json`, `kb/interactions/{anticoagulant,cardiovascular,qt_prolongation}.json`
  - Tài liệu gốc đối chiếu nguyên văn (`Medical_Library_2026`): **ESC 2024 AF Guidelines**, **ACC/AHA/ACCP/HRS 2023 AF Guideline**, **ESC 2025 Pregnancy Cardiovascular Guidelines**, và các **Nhãn thuốc gốc FDA** (*Eliquis, Xarelto, Pradaxa, Savaysa, Coumadin, Cordarone, Lanoxin, Cardizem*)
- **Tổng hợp số lượng phát hiện Vòng 2**: **18 phát hiện**
  - **Nghiêm trọng (`critical`)**: **7** (`AF-R2-R2-01` → `AF-R2-R2-07`)
  - **Lớn (`major`)**: **8** (`AF-R2-R2-08` → `AF-R2-R2-15`)
  - **Nhỏ (`minor`)**: **2** (`AF-R2-R2-16` → `AF-R2-R2-17`)
  - **Kiến nghị (`suggestion`)**: **1** (`AF-R2-R2-18`)
- **PHÁN QUYẾT VÒNG 2 (`VERDICT`)**: **`FAIL`** *(Bắt buộc `FAIL` theo quy chế `REVIEW_PROTOCOL.md` do còn 7 lỗi `critical` và 8 lỗi `major` liên quan trực tiếp đến an toàn kê đơn và liều dùng)*

---

## PHẦN 1. HẬU KIỂM 100% CÁC PHÁT HIỆN VÒNG 1 CỦA R2 (`AF-R2-01` → `AF-R2-14`) & CÁC MỤC DƯỢC LÂM SÀNG LIÊN QUAN

Nhóm phát triển đã nỗ lực tách cấu trúc module `af` thành các tệp chuyên biệt (`rulesOac.ts`, `rulesRateRhythm.ts`, `rulesInpatient.ts`, `rulesHelpers.ts`), bổ sung nhiều cổng chặn quan trọng (Dronedarone PALLAS/ANDROMEDA, Sotalol `CrCl < 40`, Rivaroxaban bệnh gan, thai kỳ với Diltiazem/OAC/Amiodarone, cập nhật biệt dược tại Việt Nam). Tuy nhiên, hậu kiểm thực nghiệm bằng `evaluate()` cho thấy nhiều bản vá ở Vòng 1 chỉ xử lý bề mặt hoặc tạo ra lỗ hổng mới:

| Mã Vòng 1 | Nội dung phát hiện ở Vòng 1 | Trạng thái hậu kiểm Vòng 2 | Nhận xét kiểm chứng thực nghiệm (`evaluate()` & mã nguồn) |
| :--- | :--- | :---: | :--- |
| **`AF-R2-01`** | `rec_af_aad_no_shd` kê Flecainide khi `CrCl < 35 mL/phút` | **ĐẠT MỘT PHẦN** | Nhánh không mang thai (`rulesRateRhythm.ts:949`) và `stop_class_ic_cad_hfref` (`L669`) đã chặn `CrCl < 35`. **Tuy nhiên**: (1) Nhánh thai kỳ (`rulesRateRhythm.ts:881`) khi thiếu `SCr` (`crcl === undefined`) vẫn phát `[CONSIDER] Flecainide` không fail-closed; (2) Tầng safety chung (`vitalAndRenalGates.ts:200`, `reviewMedsVitalsAndRenal.ts:190`) chỉ bật `useCrcl` cho DOAC nên đánh giá Flecainide/Sotalol theo `eGFR` thay vì `CrCl` (**`AF-R2-R2-14`**). |
| **`AF-R2-02`** | Thiếu bắt buộc phối hợp thuốc ức chế nút AV khi kê Flecainide/Propafenone | **ĐẠT (CÓ LỖI PHỤ WPW)** | Đã thêm cảnh báo bắt buộc kèm thuốc chẹn nút AV trong `rec_af_aad_no_shd` (`rulesRateRhythm.ts:961`). Tuy nhiên chưa có cổng ngoại trừ **WPW / Pre-excited AF**, nơi việc phối hợp thuốc chẹn nút AV lại bị chống chỉ định tuyệt đối (**`AF-R2-R2-05`**). |
| **`AF-R2-03`** | Rơi mất cảnh báo hộp đen FDA của Edoxaban khi `CrCl > 95 mL/phút` | **ĐÃ KHẮC PHỤC** | Đã bổ sung quy tắc `af.oac.edoxaban_high_crcl_warning` (`rulesOac.ts:785`) và cột `crcl_gt95` trong ma trận. Chỉ còn lệch biên điểm đúng `CrCl = 95.0` trong `edoxaban.json` (**`AF-R2-R2-15`**). |
| **`AF-R2-04`** | Đồng thời `START` cả Diltiazem IV và Bisoprolol uống ở ca cấp cứu RVR | **ĐÃ KHẮC PHỤC HÀNH ĐỘNG, PHÁT SINH LỖI LIỀU CẤP** | Quy tắc ngoại trú đã hạ xuống `CONSIDER` phương án thay thế khi nội viện đã `START` Diltiazem. Tuy nhiên chính khuyến cáo cấp cứu `rec_af_acute_rate_preserved` trên Preset 5 nay lại xuất nhầm **liều uống** `"60 mg x 3 lần/ngày (uống)"` thay vì liều tiêm tĩnh mạch (**`AF-R2-R2-01`**)! |
| **`AF-R2-05`** | Sotalol đặt sai ngưỡng thận `30` thay vì `40 mL/phút` và sai tham số `gate_sotalol_qt` | **ĐẠT MỘT PHẦN** | Đã sửa ngưỡng `CrCl < 40` trong `sotalol.json` và `rulesRateRhythm.ts:782`, sửa `gate_sotalol_qt` sang `parameter: "qtc", threshold: 500`. **Tuy nhiên** toàn bộ engine KHÔNG BAO GIỜ đọc mảng `kbDrug.gates` nên bệnh nhân có `QTc = 530 ms` vẫn không được `STOP Sotalol` (**`AF-R2-R2-09`**)! |
| **`AF-R2-06`** | Chuỗi liều thô của Apixaban & lỗi hố làm tròn `CrCl 29.1–29.9` trong `doacDose.ts` | **KHẮC PHỤC MỘT PHẦN / LỖI MỚI** | Trường `dose` đã gọn đẹp, nhưng `src/engine/calculators/doacDose.ts` gốc (`L36, 44, 54`) **chưa hề được sửa** (vẫn giữ `29` và `49`); bản bọc `resolveAfDoacDose` lại đánh rơi `potentPgpInhibitor` của Edoxaban (**`AF-R2-R2-02`**) và lộ lỗi lệch hệ số quy đổi `SCr = 1.5 mg/dL` (`88.4` vs `88.42`) (**`AF-R2-R2-03`**). |
| **`AF-R2-07`** | Gán nhầm `REDUCE` khi bệnh nhân đã uống đúng liều giảm DOAC | **KHẮC PHỤC MỘT PHẦN / LỖI MỚI** | Đã viết `resolveDoacCurrentAction`, nhưng hàm này bỏ qua `med.unit` (`'viên'`) và `med.freq` (`'1 lần/ngày'`), gây xác nhận nhầm ca quá liều gấp đôi `Eliquis 5mg x 1 viên BID` thành liều giảm hợp lý (**`AF-R2-R2-07`**); đồng thời lỗi `REDUCE` giả vẫn lặp lại nguyên xi trên **Sotalol** ở `CrCl 40–60` (**`AF-R2-R2-09`**). |
| **`AF-R2-08`** | Sai tên biệt dược tại Việt Nam của Edoxaban, Propafenone, Sotalol | **ĐÃ KHẮC PHỤC** | Đã cập nhật đúng `Lixiana` (`edoxaban.json`), `Rytmonorm` (`propafenone.json`), `Sotalex` (`sotalol.json`). |
| **`AF-R2-09`** | Preset 1 thiếu `lvef` làm mất khuyến cáo Rate Control | **ĐÃ KHẮC PHỤC** | Preset 1 đã có `lvef: 55` và sinh đúng `[START] Bisoprolol`, đồng thời bổ sung fail-closed khi thiếu `lvef`. |
| **`AF-R2-10`** | Chuỗi liều giữ chỗ `'Theo phân độ chẹn beta'` | **ĐẠT CHO `START`, LỖI CHO `UPTITRATE`** | Đã thay bằng `getCleanStartDose('bisoprolol')` = `"1.25 mg x 1 lần/ngày (uống)"`, nhưng do dùng chung hàm này cho cả `UPTITRATE` nên bệnh nhân đang uống Bisoprolol `5 mg/ngày` bị khuyên "tăng liều" xuống... `1.25 mg/ngày` (**`AF-R2-R2-01`**)! |
| **`AF-R2-11`** | Ma trận `afMatrixDoacCrCl` thiếu cột `CrCl > 95` cho Edoxaban | **ĐÃ KHẮC PHỤC (CÒN LỖI BIÊN 50 & 95)** | Đã tách cột `crcl_gt95`, nhưng `renalBand('edoxaban', 50, 'crcl')` và `renalBand('edoxaban', 95, 'crcl')` bị lệch điểm biên do khoảng nửa mở `[from, to)` (**`AF-R2-R2-15`**). |
| **`AF-R2-12`** | Thiếu ghi chú ngoại lệ Clarithromycin trong `apixaban.json` | **MÂU THUẪN TRỰC TIẾP VỚI KB INTERACTIONS** | `apixaban.json:118` đã ghi rõ không cần chỉnh liều với Clarithromycin, **nhưng** `kb/interactions/anticoagulant.json` (`ix.doac_strong_cyp3a4_pgp_inhibitors`) lại đưa `"clarithromycin"` vào danh sách `contraindicated` với Apixaban (**`AF-R2-R2-04`**)! |
| **`AF-R2-13`** | Amiodarone TM thiếu cảnh báo tương kỵ NaCl 0.9% & viêm tĩnh mạch ngoại vi | **ĐÃ KHẮC PHỤC TRONG KB** | Đã cập nhật đầy đủ trong `kb/drugs/amiodarone.json` (`L23–25, 113`). Tuy nhiên quy tắc nội viện `af.inpatient.acute_rate_hfref` lại xuất nhầm liều uống thay vì liều truyền trong Dextrose 5% (**`AF-R2-R2-01`**). |
| **`AF-R2-14`** | Bổ sung hoạt chất Acenocoumarol (Sintrom) cho Profile Việt Nam | **NÂNG CẤP THÀNH CRITICAL (`AF-R2-R2-06`)** | Vòng 1 ghi nhận bị hoãn; kiểm thử động Vòng 2 chứng minh khi bệnh nhân VN nhập `acenocoumarol` (`Sintrom`), hệ thống kê chồng thêm `Apixaban` hoặc `Warfarin` với **0 cảnh báo trùng lặp**, không dừng thuốc ở phụ nữ mang thai và không tạm ngưng trước phẫu thuật nguy cơ cao! |

---

## PHẦN 2. KẾT QUẢ KIỂM ĐỊNH TỰ ĐỘNG KB, TRÍCH DẪN PDF & BỘ TEST BẤT BIẾN

1. **Trình kiểm tra tĩnh `npm run verify:kb`**: Báo cáo `0 lỗi` cú pháp trên 10 tệp module `af` và kho KB. Điều này cho thấy các lỗi dược lâm sàng nghiêm trọng phát hiện ở Vòng 2 đều là **lỗi ngữ nghĩa lâm sàng – dược động học – tích hợp đa tầng** vượt ngoài khả năng quét biểu thức chính quy của công cụ tĩnh.
2. **Bộ kiểm thử bất biến an toàn `npx vitest run tests/modules/af`**: **ĐANG THẤT BẠI (`1 failed`, ~436 vi phạm / 10.000 ca ngẫu nhiên)** tại `tests/modules/af/invariants.test.ts` do xung đột công thức tính độ thanh thải thận ở người béo phì giữa `src/engine/derive.ts` (`crclActual`) và `src/engine/calculators/crcl.ts` (`recommendedCrCl = crclAdjusted`) — phân tích chi tiết tại **`AF-R2-R2-14`**.
3. **Kiểm toán đối chiếu nguyên văn PDF (`Medical_Library_2026`)**:
   - Toàn bộ các chuỗi `quote` tiếng Anh trong `kb/citations/af.json` và `kb/citations/interactions.json` đều tồn tại nguyên văn trong tệp PDF/HTML gốc (không có trích dẫn bịa đặt).
   - Phát hiện **3 trích dẫn sai lệch trang PDF / sai số hiệu Bảng** trong `kb/citations/interactions.json` (**`AF-R2-R2-17`**) và **5 trường hợp gán sai trích dẫn không chứa nội dung chứng minh** trong `dronedarone.json`, `sotalol.json`, `flecainide.json`, `propafenone.json` (**`AF-R2-R2-15`**).

---

## PHẦN 3. CHI TIẾT CÁC PHÁT HIỆN VÒNG 2 (`AF-R2-R2-01` → `AF-R2-R2-18`)

### A. Nhóm Mức độ Nghiêm trọng (`CRITICAL` – 7 phát hiện)

#### 1. `AF-R2-R2-01` — [CRITICAL | `rule` | `af.inpatient.acute_rate_preserved`] Quy tắc kiểm soát tần số cấp nội viện xuất nhầm liều ĐƯỜNG UỐNG thay vì phác đồ TIÊM/TRUYỀN TĨNH MẠCH, và nhánh `UPTITRATE`/`CONTINUE` ghi đè liều duy trì hiện tại bằng liều khởi đầu thấp nhất
- **Vị trí mã nguồn**: `src/modules/af/rulesInpatient.ts` (dòng 125, 151, 187, 208, 237, 303), `src/modules/af/rulesRateRhythm.ts` (dòng 378, 411), `src/modules/af/rulesOac.ts` (dòng 546).
- **Bằng chứng thực thi `evaluate()`**:
  1. **Preset 5 (`af_preset_inpatient_rvr_emergency`: nữ 78 tuổi, HR = 145 bpm, LVEF = 55%, `setting: 'inpatient'`)**: Sinh khuyến cáo `[START] rec_af_acute_rate_preserved (diltiazem)` nhưng trường liều là `dose: "60 mg x 3 lần/ngày (uống)"` (liều viên uống mạn tính!) thay vì liều bolus + truyền tĩnh mạch cấp cứu.
  2. **RVR cấp trên nền HFrEF (`HR = 142 bpm, LVEF = 30%, setting: 'inpatient'`)**: Tiêu đề ghi rõ *"Kiểm soát tần số cấp trong HFrEF: Amiodarone IV hoặc Digoxin IV (HR 142 bpm)"*, nhưng trường `dose` xuất ra `"200 mg x 3 lần/ngày (uống)"` (phác đồ nạp đường uống ngoại trú!). Ở thai phụ HFrEF kèm RVR cấp (`L125`), trường `dose` của Digoxin xuất ra `"0.0625–0.125 mg x 1 lần/ngày (uống)"` (liều duy trì uống cực thấp, hoàn toàn không có tác dụng khống chế cơn nhịp nhanh thất 142 bpm cấp cứu).
  3. **Ghi đè tụt liều ngược khi `UPTITRATE` / `CONTINUE`**: Bệnh nhân đang uống `Bisoprolol 5 mg x 1 lần/ngày` + `Warfarin 5 mg x 1 lần/ngày` (kèm HCM, nhịp thất chưa đạt đích `HR = 118 bpm`): `evaluate()` phát `[UPTITRATE] rec_af_rate_preserved_ef (bisoprolol) | dose: "1.25 mg x 1 lần/ngày (uống)"` (giảm liều đi 4 lần!) và `[CONTINUE] rec_af_hcm_amyloidosis_vka (warfarin) | dose: "2.5 mg x 1 lần/ngày (uống)"` (tự ý cắt nửa liều Warfarin đang ổn định của bệnh nhân!).
- **Bằng chứng tài liệu gốc**: ESC 2024 AF Guidelines, Table 12 (*Drugs for rate control in AF*, PDF p. 39–40):
  > *"Diltiazem: Intravenous administration: 0.25 mg/kg i.v. bolus over 5 min, then 5–15 mg/h."*
  > *"Digoxin: 0.5 mg i.v. bolus (0.75–1.5 mg over 24 h in divided doses)."*
  > *"Amiodarone: 300 mg i.v. diluted in 250 mL 5% dextrose over 30–60 min (preferably via central venous cannula), followed by 900–1200 mg i.v. over 24 h."*
  > *"Bisoprolol: Usual oral maintenance dose range: 1.25–20 mg once daily."*
- **Đề xuất sửa**: Tách riêng chuỗi liều tĩnh mạch cấp cứu cho các quy tắc nội viện RVR; khi `action === 'UPTITRATE'`, hiển thị liều hiện tại kèm hướng dẫn chuẩn độ tăng dần tới liều đích/tối đa (`drug.target` / `drug.max`); khi `action === 'CONTINUE'`, giữ nguyên liều đang dùng ổn định của bệnh nhân.

---

#### 2. `AF-R2-R2-02` — [CRITICAL | `rule` | `resolveAfDoacDose`] Bỏ quên tham số `potentPgpInhibitor` của Edoxaban (và `highBleedingRisk` của Dabigatran), xúi giục TĂNG GẤP ĐÔI LIỀU Edoxaban từ 30 mg lên 60 mg/ngày khi đang dùng kèm Dronedarone
- **Vị trí mã nguồn**: `src/modules/af/rulesHelpers.ts` (dòng 93–155), `src/modules/af/rulesOac.ts` (dòng 933–956).
- **Bằng chứng thực thi `evaluate()`**:
  - Bệnh nhân nam 70 tuổi, 72 kg, SCr 85 µmol/L (`CrCl = 78.6 mL/phút`), có bệnh mạch vành đang dùng đúng phác đồ giảm liều chuẩn **`edoxaban 30 mg x 1 lần/ngày + dronedarone 400 mg x 2 lần/ngày`**:
    - Do `resolveAfDoacDose` không truyền `potentPgpInhibitor` vào `computeDoacDose`, hệ thống kết luận `isDoseReduced = false` và phát khuyến cáo **`[UPTITRATE] rec_af_doac_dosing_edoxaban: Tăng lên liều chuẩn đầy đủ Edoxaban: 60 mg x 1 lần/ngày | dose: "60 mg x 1 lần/ngày"`**, trong khi ngay bên dưới lại phát cảnh báo đỏ **`[critical/interaction] ix.edoxaban_p_gp_inhibitors`** (yêu cầu tối đa 30 mg/ngày)!
    - Nếu bệnh nhân đang dùng quá liều `edoxaban 60 mg + dronedarone 400 mg BID`, hệ thống phát **`[CONTINUE] Chỉ định liều chuẩn Edoxaban: 60 mg x 1 lần/ngày`** thay vì `REDUCE` xuống 30 mg!
- **Bằng chứng tài liệu gốc**: ESC 2024 AF Guidelines, Table 11 (PDF p. 32):
  > *"Edoxaban: Standard dose 60 mg once daily. Dose reduction if any apply: (i) moderate or severe renal impairment (creatinine clearance 15–50 mL/min) (ii) body weight ≤60 kg (iii) concomitant use of ciclosporin, dronedarone, erythromycin, or ketoconazole -> 30 mg once daily."*
- **Đề xuất sửa**: Trong `resolveAfDoacDose` (`rulesHelpers.ts`), kiểm tra sự hiện diện của `dronedarone`, `cyclosporine`/`ciclosporin`, `erythromycin`, `ketoconazole` trong `ctx.patient.currentMeds` để truyền `potentPgpInhibitor: true`; đồng thời truyền `highBleedingRisk` cho Dabigatran theo đúng tiêu chí ESC Table 11.

---

#### 3. `AF-R2-R2-03` — [CRITICAL | `threshold` | `doacDose.apixaban`] Bất đồng bộ hệ số quy đổi Creatinin (`88.4` tại `units.ts` so với `88.42` tại `egfr.ts`) làm trượt tiêu chuẩn giảm liều Apixaban ngay tại ngưỡng `SCr = 1.5 mg/dL`, và `computeDoacDose` gốc vẫn giữ lỗi hố số thực `CrCl 29.1–29.9` & `49.1–49.9`
- **Vị trí mã nguồn**: `src/engine/units.ts` (dòng 18, 27, 247), `src/engine/calculators/egfr.ts` (dòng 71, 79), `src/engine/calculators/doacDose.ts` (dòng 36, 44, 54, 74, 103, 108, 133, 162), `src/modules/af/rulesHelpers.ts` (dòng 114–129).
- **Bằng chứng thực thi `evaluate()` & `computeDoacDose()`**:
  1. **Trượt ngưỡng `SCr = 1.5 mg/dL` gây quá liều gấp đôi**: Khi chọn đơn vị `units.cr = 'mg_dL'` (`profile: 'US'`), nhập cụ ông `age: 82`, `weight: 72 kg`, `scr: 1.5` (thỏa đúng 2/3 tiêu chí ABC của nhãn FDA Eliquis: tuổi ≥ 80 và SCr ≥ 1.5 mg/dL, `CrCl = 38.7 mL/phút`):
     - `units.ts` nhân `1.5 * 88.4 = 132.6 µmol/L`.
     - `doacDose.ts` gọi `convertScrToMgDl(132.6, 'umol/L')` trong `egfr.ts` chia ngược cho **`88.42`** ra `1.49966 mg/dL < 1.5`!
     - `evaluate()` xuất **`[START] rec_af_oac_high_risk (apixaban) | dose: "5 mg x 2 lần/ngày"`** thay vì `"2.5 mg x 2 lần/ngày"`!
  2. **Lỗi tồn đọng trong `doacDose.ts`**: Gọi trực tiếp `computeDoacDose({ drug: 'apixaban', ..., crcl: 29.5 })` và `computeDoacDose({ drug: 'rivaroxaban', ..., crcl: 49.5 })` vẫn trả về `isDoseReduced: false` do `doacDose.ts` chưa sửa `<= 29` và `<= 49`. Ngoài ra, `rulesHelpers.ts:115` áp cứng tiêu chuẩn EMA (giảm liều Apixaban đơn độc theo `CrCl 15–29`) cho cả `profile: 'US'`, và `L128` dùng `crcl < 50` làm thiếu điểm `CrCl === 50.0` của Rivaroxaban theo nhãn FDA (`CrCl 15 to 50 mL/min`).
- **Bằng chứng tài liệu gốc**: FDA Eliquis Label, Section 2.1 (PDF p. 1 & p. 5):
  > *"In patients with at least 2 of the following characteristics: age greater than or equal to 80 years, body weight less than or equal to 60 kg, or serum creatinine greater than or equal to 1.5 mg/dL, the recommended dose is 2.5 mg orally twice daily."*
- **Đề xuất sửa**: Đồng bộ tuyệt đối hằng số quy đổi Creatinin giữa `units.ts` và `egfr.ts` (hoặc truyền thẳng `scrMgDl` gốc chưa làm tròn), sửa trực tiếp các phép so sánh số thực trong `doacDose.ts`, và tôn trọng sự khác biệt nhãn EMA/ESC vs FDA theo `profile`.

---

#### 4. `AF-R2-R2-04` — [CRITICAL | `rule` | `af.oac.high_risk_start_doac`] Tương tác dược động học chống chỉ định của DOAC và Dronedarone không hề chặn/chỉnh liều trong quy tắc kê đơn, trong khi `Clarithromycin + Apixaban` lại bị báo động giả `contraindicated`
- **Vị trí mã nguồn**: `src/modules/af/rulesOac.ts`, `src/modules/af/rulesRateRhythm.ts` (dòng 929), `src/engine/safety/gates.ts` (dòng 198), `src/engine/safety/reviewMeds.ts` (dòng 202), `kb/interactions/anticoagulant.json` (dòng 3–41).
- **Bằng chứng thực thi `evaluate()`**:
  1. **Chất cảm ứng mạnh CYP3A4/P-gp (`Rifampin 600 mg`, `Carbamazepine 200 mg`)**: Hệ thống vẫn phát **`[START] Apixaban 5 mg x 2 lần/ngày`** và **`[CONTINUE] Rivaroxaban 20 mg`** (sụt giảm >50–66% diện tích dưới đường cong AUC gây đột quỵ nhồi máu não, lẽ ra phải chống chỉ định DOAC và chuyển sang Warfarin theo dõi INR).
  2. **Chất ức chế kép mạnh CYP3A4/P-gp (`Ketoconazole 200 mg`)**: Hệ thống vẫn phát **`[CONTINUE] Rivaroxaban 20 mg`** (tăng 2.6 lần AUC gây xuất huyết nặng) và **`[START] Apixaban 5 mg x 2 lần/ngày`** nguyên liều đầy đủ (nhãn FDA bắt buộc giảm 50% xuống `2.5 mg BID`, ESC khuyến cáo tránh dùng).
  3. **Bệnh nhân mạch vành đang uống `Dabigatran 150 mg BID` (`EHRA = 3`)**: `rulesRateRhythm.ts:929` chủ động phát **`[CONSIDER] Dronedarone 400 mg x 2 lần/ngày`** cùng **`[CONTINUE] Dabigatran 150 mg x 2 lần/ngày`** — kê trực tiếp cặp tương tác chống chỉ định!
  4. **`Dronedarone 400 mg BID + Itraconazole 200 mg`**: Hệ thống phát **`[CONTINUE] Dronedarone`** với **0 cảnh báo tương tác cho Dronedarone** (tăng gấp 17 lần nồng độ Dronedarone gây xoắn đỉnh tử vong!).
  5. **Báo động giả `Clarithromycin + Apixaban`**: `ix.doac_strong_cyp3a4_pgp_inhibitors` gắn `severity: "contraindicated"` cho `clarithromycin` với cả 4 DOAC, tự mâu thuẫn trực diện với `apixaban.json:118` và nhãn FDA Eliquis.
- **Bằng chứng tài liệu gốc**:
  - ACC/AHA 2023 AF Guideline (PDF p. 41–42): *"strong CYP3A4 and/or p-glycoprotein inducers such as rifampin, phenytoin, phenobarbital, primidone, carbamazepine, or St. John’s wort may lower DOAC plasma levels and increase the risks of stroke or systemic embolism... Avoid use."*
  - FDA Eliquis Label, Section 7.1 (PDF p. 17): *"the dose of ELIQUIS should be decreased by 50% when coadministered with drugs that are combined P-gp and strong CYP3A4 inhibitors (e.g., ketoconazole, itraconazole, ritonavir)... Although clarithromycin is a combined P-gp and strong CYP3A4 inhibitor, pharmacokinetic data suggest that no dose adjustment is necessary with concomitant administration with ELIQUIS."*
  - FDA Xarelto Label, Section 7.3 (PDF p. 30): *"Avoid concomitant administration of XARELTO with known combined P-gp and strong CYP3A inhibitors (e.g., ketoconazole and ritonavir)."*
- **Đề xuất sửa**: Đưa toàn bộ chất cảm ứng mạnh và chất ức chế mạnh CYP3A4/P-gp vào `gates.ts`, `reviewMeds.ts`, `rulesOac.ts`, `rulesRateRhythm.ts`; bổ sung quy tắc tương tác `Dronedarone + Strong CYP3A4 Inhibitors`; tách `clarithromycin` khỏi danh sách `contraindicated` với Apixaban/Edoxaban.

---

#### 5. `AF-R2-R2-05` — [CRITICAL | `missing` | `wpw_pre_excited_af`] Bỏ sót hoàn toàn Hội chứng Wolff-Parkinson-White (WPW) / Rung nhĩ tiền kích thích, kê đơn thuốc chẹn nút nhĩ thất gây nguy cơ rung thất và đột tử
- **Vị trí mã nguồn**: `src/modules/af/inputs.ts`, `src/modules/af/rulesInpatient.ts`, `src/modules/af/rulesRateRhythm.ts`, `src/engine/safety/gates.ts` (dòng 298–335), `src/engine/safety/reviewMeds.ts` (dòng 398–412), `kb/drugs/digoxin.json` (dòng 111 khai báo `wpw_afib` nhưng không được nối vào bất kỳ cổng nào).
- **Bằng chứng thực thi `evaluate()`**:
  - Bệnh nhân nhập viện cấp cứu `HR = 155 bpm`, `conditions: { af: true, wpw: true, wpw_afib: true }`: Hệ thống phát **`[START] Diltiazem`**, **`[CONSIDER] Bisoprolol`**, và **`[CONSIDER] Flecainide — BẮT BUỘC KÈM THUỐC CHẸN NÚT AV`**! Dùng thuốc ức chế nút AV trên nền WPW + AF làm mất dẫn truyền ẩn qua nút AV, đẩy xung nhĩ dẫn truyền 1:1 qua đường phụ xuống thất (>250–300 ck/phút) gây **rung thất (VF) và tử vong**.
- **Bằng chứng tài liệu gốc**: ESC 2024 AF Guidelines, Section 9.11 (PDF p. 57–58):
  > *"Patients with Wolff–Parkinson–White syndrome and AF are at risk of fast ventricular rates from rapid conduction of atrial electrical activity to the ventricles via the accessory pathway, potentially leading to ventricular fibrillation and sudden death... in pre-excited AF, atrioventricular node-modulating drugs should be avoided... Amiodarone should be avoided in pre-excited AF."*
- **Đề xuất sửa**: Thêm biến điều kiện `wpw` vào `STANDARD_CONDITIONS` & `inputs.ts`; nối `wpw_afib` trong `gates.ts` / `reviewMeds.ts` để `STOP`/`AVOID` toàn bộ Beta-blocker, Diltiazem, Verapamil, Digoxin, Amiodarone; hướng dẫn sốc điện đồng bộ cấp cứu hoặc Ibutilide / Procainamide / Flecainide (tuyệt đối KHÔNG kèm thuốc chẹn nút AV) và `REFER` triệt đốt đường phụ qua catheter.

---

#### 6. `AF-R2-R2-06` — [CRITICAL | `missing` | `acenocoumarol`] Acenocoumarol (`Sintrom` — chiếm 80–90% VKA tại Việt Nam) và Enoxaparin/Heparin hoàn toàn không được nhận diện, gây kê chồng 2 thuốc chống đông, bỏ sót quái thai và bỏ sót ngưng thuốc trước đại phẫu
- **Vị trí mã nguồn**: `kb/drugs/` (thiếu `acenocoumarol.json`), `src/engine/safety/{drugClassify,duplicateRules}.ts`, `src/engine/mergeConflictGroups.ts`, `kb/interactions/anticoagulant.json` (`ix.duplicate_anticoagulants`), `src/modules/af/{rulesOac,rulesInpatient}.ts`.
- **Bằng chứng thực thi `evaluate()` (Profile `'VN'`)**:
  1. **Rung nhĩ không do van tim đang uống `Sintrom 4mg` (`acenocoumarol 2 mg/ngày`)**: Hệ thống phát **`[START] Apixaban 5 mg x 2 lần/ngày`** chồng lên Sintrom với **0 cảnh báo trùng lặp chống đông**!
  2. **Van tim cơ học đang uống `Sintrom`**: Hệ thống phát **`[START] Warfarin`** chồng lên Sintrom (**trùng lặp 2 thuốc kháng vitamin K**)!
  3. **Phụ nữ mang thai đang uống `Sintrom`**: Hệ thống **KHÔNG phát lệnh `STOP acenocoumarol`** (nguy cơ quái thai warfarin/coumarin embryopathy)!
  4. **Chuẩn bị phẫu thuật nguy cơ chảy máu cao (`plannedProcedureRisk: 'high_risk'`) đang uống `Sintrom`**: Không tạm ngưng Sintrom mà còn **`[START] Apixaban 5 mg x 2 lần/ngày`** ngay trước mổ!
  5. **Nội viện đang tiêm `Enoxaparin 60 mg BID`**: Hệ thống phát **`[START] Apixaban 5 mg x 2 lần/ngày`** với **0 cảnh báo trùng lặp chống đông**!
- **Bằng chứng tài liệu gốc**: ESC 2025 Pregnancy Cardiovascular Guidelines (PDF p. 29): *"according to current guidelines this equals doses of ≤5 mg of warfarin, ≤2 mg/day acenocoumarol, ≤3 mg/day phenprocoumon"* & FDA Eliquis Label Section 7.3 (PDF p. 17).
- **Đề xuất sửa**: Bổ sung `kb/drugs/acenocoumarol.json` (`Sintrom 4 mg`, `Sintrom 1 mg`), đăng ký đầy đủ `acenocoumarol` (và nhận diện lớp chống đông tiêm `enoxaparin`, `heparin`, `fondaparinux`) vào `drugClassify.ts`, `duplicateRules.ts`, `mergeConflictGroups.ts`, `ix.duplicate_anticoagulants` và toàn bộ quy tắc VKA/thai kỳ/tiền phẫu của module `af`.

---

#### 7. `AF-R2-R2-07` — [CRITICAL | `rule` | `resolveDoacCurrentAction`] Bộ phân tích liều DOAC đang dùng bỏ qua `med.unit` (`'viên'`) và `med.freq` (`'1 lần/ngày'`), xác nhận nhầm ca QUÁ LIỀU GẤP ĐÔI thành "liều giảm hợp lý" và ca DƯỚI LIỀU 50% thành "liều chuẩn đầy đủ"
- **Vị trí mã nguồn**: `src/modules/af/rulesHelpers.ts` (dòng 49–60, 160–192), `src/modules/af/rulesOac.ts` (dòng 880–970).
- **Bằng chứng thực thi `evaluate()`**:
  1. **Quá liều gấp đôi bị xác nhận là an toàn**: Cụ bà 84 tuổi, 48 kg, SCr 145 µmol/L (`CrCl = 21.1 mL/phút`, bắt buộc dùng Apixaban `2.5 mg BID`) nhập thuốc đang uống `{ drugId: 'apixaban', name: 'Eliquis 5mg', dose: 1, unit: 'viên', freq: '2 lần/ngày' }` (tức đang uống **10 mg/ngày**). Hàm `parseNumericDoseMg` lấy `curDose = 1 <= 2.5` nên hệ thống phát **`[CONTINUE] Duy trì liều giảm hợp lý Apixaban: 2.5 mg x 2 lần/ngày`**!
  2. **Dưới liều 50% bị bỏ lọt**: Bệnh nhân 70 tuổi (`CrCl = 72 mL/phút`) uống sai phác đồ `{ drugId: 'apixaban', dose: 5, unit: 'mg', freq: '1 lần/ngày' }` (chỉ uống 1 lần/ngày = 50% liều chuẩn): `curDose = 5 === 5` nên hệ thống phát **`[CONTINUE] Chỉ định liều chuẩn Apixaban: 5 mg x 2 lần/ngày`** mà không cảnh báo thiếu liều buổi tối!
- **Bằng chứng tài liệu gốc**: ESC 2024 AF Guidelines, Rec Table 7 (PDF p. 31–32): *"Reduced dose DOAC therapy is not recommended, unless patients meet DOAC-specific criteria, to prevent underdosing and avoidable thromboembolic events (Class III, Level B)."*
- **Đề xuất sửa**: Chỉ so sánh số học khi `med.unit === 'mg'` (hoặc quy đổi hàm lượng từ tên thuốc khi đơn vị là `'viên'`, nếu không xác định được phải fail-closed); bắt buộc kiểm tra `med.freq` là 2 lần/ngày đối với `apixaban` và `dabigatran`.

---

### B. Nhóm Mức độ Lớn (`MAJOR` – 8 phát hiện)

#### 8. `AF-R2-R2-08` — [MAJOR | `rule` | `af.oac.stop_doac_severe_renal`] Bỏ qua hoàn toàn cờ lọc máu chu kỳ (`conditions.onDialysis`) khi xét nghiệm Creatinin máu sau lọc làm `CrCl` tính toán giả tạo ≥ 15 mL/phút
- **Vị trí mã nguồn**: `src/modules/af/rulesOac.ts`, `kb/drugs/{apixaban,rivaroxaban,dabigatran,edoxaban}.json`, `src/engine/safety/{organAndCrisisGates,reviewMedsVitalsAndRenal}.ts`.
- **Bằng chứng thực thi `evaluate()`**: Bệnh nhân chạy thận nhân tạo chu kỳ (`onDialysis: true`, `profile: 'VN'`) có `SCr = 130 µmol/L` lấy sau buổi lọc máu (`CrCl` tính toán = `46.3 mL/phút`) đang uống `Rivaroxaban 15 mg`: hệ thống phát **`[CONTINUE] Duy trì liều giảm hợp lý Rivaroxaban: 15 mg x 1 lần/ngày`** (hoặc `[START] Apixaban 5 mg BID` nếu chưa dùng OAC), vi phạm khuyến cáo ESC 2024 / VN không dùng DOAC thường quy trên lọc máu.
- **Đề xuất sửa**: Xử lý tường minh `hasCondition(ctx, 'onDialysis')` độc lập với `CrCl` (tương tự cơ chế bảo vệ của `finerenone` trong `organAndCrisisGates.ts:159`): chặn toàn bộ DOAC ở profile `INTL`/`VN`, và ở profile `US` chặn tuyệt đối Dabigatran/Edoxaban/Rivaroxaban 15 mg.

---

#### 9. `AF-R2-R2-09` — [MAJOR | `rule` | `af.rhythm.stop_sotalol_contra`] Mảng `kbDrug.gates` (`QTc > 500 ms` của Sotalol) là dữ liệu chết không được thực thi; bỏ qua hạ kali máu nặng (`K+ < 3.5 mmol/L`) khi dùng Sotalol/Amiodarone/Digoxin; Sotalol ở `CrCl 40–60` phát nhầm `REDUCE` khi đã uống 1 lần/ngày; và Propafenone bỏ sót bệnh gan / hen phế quản
- **Vị trí mã nguồn**: `src/modules/af/rulesRateRhythm.ts` (dòng 665–720, 777–824, 980–1001), `src/engine/safety/{vitalAndRenalGates,reviewMeds}.ts`, `kb/drugs/{sotalol,propafenone}.json`.
- **Bằng chứng thực thi `evaluate()`**:
  - Bệnh nhân có **`QTc = 530 ms`**, **`K+ = 3.0 mmol/L`**, `CrCl = 46.3 mL/phút` đang uống `sotalol 80 mg, freq: '1 lần/ngày'`: Hệ thống **KHÔNG phát `STOP/HOLD Sotalol`** (dù `sotalol.json:77` có `gate_sotalol_qt: qtc > 500 -> contra`), đồng thời phát nhầm **`[REDUCE] Giảm tần suất liều Sotalol xuống 1 lần/ngày`** dù người bệnh đã dùng 1 lần/ngày!
  - Bệnh nhân có `liverDisease: true, asthma: true` đang uống `propafenone 150 mg TID`: không được cảnh báo/ngưng thuốc dù suy gan làm tăng sinh khả dụng Propafenone gấp ~3 lần và hoạt tính chẹn beta của thuốc có thể gây co thắt phế quản.
- **Bằng chứng tài liệu gốc**: ESC 2024 AF Rec Table 17 (PDF p. 43: *"prolonged QTc (>500 ms)"*, Class III) & ACC/AHA 2023 AF (PDF p. 85: *"without significant baseline QT interval prolongation, hypokalemia, hypomagnesemia, or bradycardia, use of sotalol..."*).
- **Đề xuất sửa**: Thực thi `kbDrug.gates` trong `vitalAndRenalGates.ts` / `reviewMeds.ts`; bổ sung trường `qtc` vào `inputs.ts`; chặn/tạm ngưng Sotalol, Amiodarone, Dronedarone, Digoxin khi `K+ < 3.5 mmol/L` (yêu cầu bù K+/Mg2+ đạt K+ ≥ 4.0 mmol/L); kiểm tra `med.freq` trước khi `REDUCE` Sotalol; kiểm tra `liverDisease` và `asthma` cho Propafenone.

---

#### 10. `AF-R2-R2-10` — [MAJOR | `rule` | `af.oac.stop_doac_valvular`] Lỗi `findCurrentMed` đơn lẻ kết hợp gộp nhóm OAC trong `merge.ts` biến khuyến cáo `START Warfarin` thành `[CONTINUE] TIẾP TỤC DUY TRÌ Xarelto 20 mg` ngay trên bệnh nhân Hẹp van hai lá, bỏ lọt thuốc vi phạm thứ hai và in sai biểu thức `SBP 96 < 90 mmHg`
- **Vị trí mã nguồn**: `src/modules/af/rulesOac.ts` (dòng 87), `src/modules/af/rulesRateRhythm.ts` (dòng 98–125, 680), `src/engine/safety/{gates,reviewMeds}.ts` (`L305` / `L400` chỉ kiểm tra `mechanicalValve`, bỏ quên `mitralStenosis`!), `src/engine/merge.ts`.
- **Bằng chứng thực thi `evaluate()`**:
  1. **Đảo ngược khuyến cáo chết người trên Hẹp van hai lá (`Probe P13`)**: Bệnh nhân `mitralStenosis: true` có `[apixaban 5 mg, rivaroxaban 20 mg]` trong `currentMeds`: `stop_doac_valvular` chỉ dừng `apixaban`; `reviewMeds.ts:400` bỏ quên `mitralStenosis`; sau đó `merge.ts` thấy `rivaroxaban` cùng nhóm xung đột `"Thuốc chống đông đường uống (OAC)"` với `warfarin` nên biến đổi `[START] Warfarin` thành **`[CONTINUE] rec_af_valvular_vka (drug=rivaroxaban): TIẾP TỤC DUY TRÌ Xarelto [Liều hiện tại: 20 mg]`**!
  2. **Bệnh mạch vành dùng kép `flecainide + propafenone` (`Probe P11c`)**: Chỉ `STOP propafenone`, để lọt `flecainide`.
  3. **Rối loạn huyết động `hemodynamicStability: 'unstable'` với `SBP = 96 mmHg, HR = 90 bpm` đang dùng `bisoprolol + digoxin` (`Probe M6`)**: Chỉ `HOLD bisoprolol` (bỏ lọt `digoxin`) và in cứng tiêu đề vô lý toán học: **`"Tạm ngưng Bisoprolol: Huyết động không ổn định / Tụt huyết áp (SBP 96 < 90 mmHg)"`**!
- **Đề xuất sửa**: Thêm `mitralStenosis` (và `antiphospholipidSyndrome`) vào cổng chặn DOAC trong `gates.ts` & `reviewMeds.ts`; cấm `merge.ts` quy đổi chéo `START Warfarin` sang `CONTINUE DOAC` khi chỉ định bắt buộc đích danh VKA; chuyển toàn bộ các quy tắc `STOP`/`HOLD` từ `findCurrentMed` sang lặp qua mọi thuốc vi phạm; sửa điều kiện hiển thị chuỗi `SBP < 90 mmHg`.

---

#### 11. `AF-R2-R2-11` — [MAJOR | `rule` | `af.oac.stop_unnecessary_antiplatelet`] Quy tắc ngưng kháng tiểu cầu khi dùng OAC bỏ sót hoàn toàn `ticagrelor` và `prasugrel`, chỉ dừng 1 thuốc khi đang dùng DAPT (`aspirin + clopidogrel`), và thiếu cảnh báo hạ bậc P2Y12 khi có ACS/PCI gần đây
- **Vị trí mã nguồn**: `src/modules/af/rulesOac.ts` (dòng 432–464).
- **Bằng chứng thực thi `evaluate()`**:
  - `recentAcs: false` đang uống `apixaban 5 mg BID + ticagrelor 90 mg BID`: **0 khuyến cáo `STOP ticagrelor`**!
  - `recentAcs: false` đang uống `apixaban 5 mg BID + aspirin 81 mg + clopidogrel 75 mg`: Chỉ phát `[STOP] aspirin`, để mặc `clopidogrel` tiếp tục phối hợp vô thời hạn với `apixaban`!
- **Bằng chứng tài liệu gốc**: ESC 2024 AF Guidelines, Recommendation Table 8 (PDF p. 33): *"Adding antiplatelet treatment to oral anticoagulation is not recommended in AF patients with a goal of preventing ischaemic stroke or thromboembolism (Class III, Level B)."*
- **Đề xuất sửa**: Mở rộng mảng kiểm tra tại dòng 438 thành `['aspirin', 'clopidogrel', 'ticagrelor', 'prasugrel']` và phát `STOP` cho tất cả các thuốc kháng tiểu cầu khi `!recentAcs`; khi `recentAcs === true`, phát cảnh báo tránh phối hợp `ticagrelor`/`prasugrel` trong phác đồ 3 thuốc (ưu tiên chuyển sang `clopidogrel` + DOAC).

---

#### 12. `AF-R2-R2-12` — [MAJOR | `missing` | `antiphospholipid_syndrome`] Thiếu điều kiện và cổng chống chỉ định DOAC cho Hội chứng kháng phospholipid huyết khối / dương tính 3 kháng thể (APS)
- **Vị trí mã nguồn**: `src/modules/af/{inputs,rulesOac}.ts`, `kb/drugs/{apixaban,rivaroxaban,dabigatran,edoxaban}.json`.
- **Bằng chứng thực thi `evaluate()`**: Bệnh nhân rung nhĩ có tiền sử đột quỵ kèm APS được hệ thống kê **`[START] Apixaban 5 mg x 2 lần/ngày`** thay vì bắt buộc dùng Warfarin.
- **Bằng chứng tài liệu gốc**: FDA Eliquis Label Section 5.6 (PDF p. 2 & p. 8) & FDA Xarelto Label Section 5.10 (PDF p. 18): *"Increased Risk of Thrombosis in Patients with Triple Positive Antiphospholipid Syndrome: Direct-acting oral anticoagulants (DOACs), including ELIQUIS / XARELTO, are not recommended for use in patients with triple-positive antiphospholipid syndrome."*
- **Đề xuất sửa**: Bổ sung điều kiện `antiphospholipidSyndrome` vào `inputs.ts` / `STANDARD_CONDITIONS` và điều hướng bắt buộc sang VKA (Warfarin/Acenocoumarol) đồng thời `STOP` mọi DOAC.

---

#### 13. `AF-R2-R2-13` — [MAJOR | `ui` | `STANDARD_CONDITIONS.pregnant`] Gộp chung `'Mang thai / Cho con bú'` vào biến `pregnant` gây lệnh giả `STOP Warfarin` ở sản phụ cho con bú có van cơ học, trong khi trạng thái cho con bú độc lập lại kê đơn `Apixaban` và `Amiodarone` (`lactation: avoid`)
- **Vị trí mã nguồn**: `src/engine/types.ts` (dòng 190), `src/modules/af/rulesOac.ts` (dòng 28–66), `src/engine/safety/{gates,reviewMeds}.ts`.
- **Bằng chứng thực thi `evaluate()`**:
  - Sản phụ sau sinh đang cho con bú có van cơ học đang uống `Warfarin 5 mg` tích ô `'Mang thai / Cho con bú'`: hệ thống phát **`[STOP] NGỪNG NGAY Warfarin: Chống chỉ định thuốc chống đông đường uống trong thai kỳ`**, dù Warfarin hoàn toàn tương thích khi cho con bú (`warfarin.json:92`)!
  - Nếu truyền `breastfeeding: true` độc lập: không có bất kỳ cổng nào đọc `kbDrug.lactation.status`, nên hệ thống kê **`[START] Apixaban 5 mg BID`** và **`[CONSIDER] Amiodarone 200 mg TID`** (cả hai đều chống dùng khi cho con bú; FDA Eliquis Label p. 2: *"Lactation: Discontinue drug or discontinue nursing"*).
- **Đề xuất sửa**: Tách riêng `pregnant` (*Đang mang thai*) và `breastfeeding` (*Đang cho con bú*) trong `STANDARD_CONDITIONS`, đồng thời thực thi cổng kiểm tra `kbDrug.lactation.status === 'avoid'` trong `gates.ts`, `reviewMeds.ts` và module `af`.

---

#### 14. `AF-R2-R2-14` — [MAJOR | `threshold` | `derive.crcl_obesity_and_invariants_test`] Xung đột `CrCl` cân nặng thực (`derive.ts`) và `CrCl` hiệu chỉnh béo phì ABW (`crcl.ts`) làm `tests/modules/af/invariants.test.ts` ĐANG FAIL (~436 lỗi), nuốt mất cảnh báo béo phì, dùng nhầm `eGFR` cho Flecainide/Sotalol ở tầng safety chung và bỏ lọt Flecainide thai kỳ khi thiếu `SCr`
- **Vị trí mã nguồn**: `src/engine/derive.ts` (dòng 84), `src/engine/calculators/crcl.ts` (dòng 140–145), `src/engine/safety/{vitalAndRenalGates,reviewMedsVitalsAndRenal}.ts`, `src/modules/af/rulesRateRhythm.ts` (dòng 881), `tests/modules/af/invariants.test.ts` (dòng 145).
- **Bằng chứng thực thi**:
  1. Chạy `npx vitest run tests/modules/af` thất bại tại `Suite 1` với **~436 vi phạm bất biến / 10.000 ca**.
  2. Bệnh nhân béo phì độ III (nữ 75 tuổi, cao 150 cm, nặng 110 kg, BMI 48.9 kg/m², SCr 220 µmol/L: `eGFR = 19`, `CrCl_ABW = 22.0 < 30`, nhưng `CrCl_actual = 33.9 mL/phút`) vẫn được hệ thống cho **`[CONTINUE] Dabigatran 110 mg BID`** mà không có bất kỳ cảnh báo béo phì nào (chuỗi `crclRes.warning` bị vứt bỏ tại `derive.ts:84`).
  3. Nhánh thai kỳ thiếu `SCr` (`crcl === undefined`) tại `rulesRateRhythm.ts:881` vẫn phát `[CONSIDER] Flecainide` không fail-closed; `vitalAndRenalGates.ts:200` và `reviewMedsVitalsAndRenal.ts:190` dùng `eGFR` thay vì `CrCl` cho `flecainide` và `sotalol`.
- **Đề xuất sửa**: Hiển thị cảnh báo `crclRes.warning` và sử dụng `crclAbw` cho các thuốc ưa nước thải trừ qua thận có khoảng điều trị hẹp ở bệnh nhân béo phì nặng (`BMI ≥ 35–40` hoặc khi `crclActual` và `crclAbw` nằm hai phía ngưỡng chống chỉ định); đồng bộ đặc tả với `invariants.test.ts`; bật `useCrcl` cho `flecainide`/`sotalol`/`digoxin`; thêm fail-closed `crcl !== undefined && crcl >= 35` cho Flecainide thai kỳ.

---

#### 15. `AF-R2-R2-15` — [MAJOR | `drug` | `edoxaban`] Lệch biên độ thanh thải thận của `renalBand()` tại `CrCl = 50` và `CrCl = 95` (Edoxaban) cùng `CrCl = 60` (Sotalol), kèm gán sai trích dẫn không chứa nội dung chứng minh trong 4 tệp `DrugEntry`
- **Vị trí mã nguồn**: `kb/drugs/edoxaban.json` (dòng 41–77), `kb/drugs/sotalol.json` (dòng 40–65, 158), `kb/drugs/dronedarone.json` (dòng 44, 54, 125), `kb/drugs/flecainide.json` (dòng 132), `kb/drugs/propafenone.json` (dòng 99, 106), `src/kb-types/access.ts` (dòng 276).
- **Bằng chứng thực thi `renalBand()` & kiểm toán KB**:
  - `renalBand('edoxaban', 50, 'crcl')` trả về **`60 mg 1 lần/ngày`** thay vì **`30 mg 1 lần/ngày`** (ESC 2024 Table 11 p. 32 & FDA Savaysa p. 1 quy định `CrCl 15–50 mL/min` phải giảm còn `30 mg OD`).
  - `renalBand('edoxaban', 95, 'crcl')` gắn cảnh báo hộp đen FDA dù nhãn Savaysa cho phép dùng `60 mg OD` đến hết `CrCL ≤ 95 mL/min` (chỉ cấm khi `> 95`).
  - `renalBand('sotalol', 60, 'crcl')` trả về `80–160 mg 2 lần/ngày`, mâu thuẫn với `rulesRateRhythm.ts:984` (`crcl <= 60` giảm còn `80 mg 1 lần/ngày`).
  - `dronedarone.json` và `sotalol.json` dùng câu trích dẫn chỉ nói về liều uống (`esc.af.2024.table13_dronedarone_sotalol`) để chứng minh chống chỉ định suy gan nặng, cơ chế tăng creatinin ống thận và chống chỉ định hen phế quản; `flecainide.json` và `propafenone.json` dùng câu trích dẫn về thai kỳ của Flecainide (`esc.preg.2025.flecainide_sotalol_propafenone`) làm bằng chứng duy nhất cho mục `lactation`.
- **Đề xuất sửa**: Chỉnh ranh giới `crclFrom`/`crclTo` trong `edoxaban.json` và `sotalol.json` khớp khoảng đóng/mở của nhãn thuốc; bổ sung các trích dẫn nguyên văn đúng ngữ nghĩa từ ESC 2024 Table 13 (p. 44) và nhãn FDA/EMA.

---

### C. Nhóm Mức độ Nhỏ (`MINOR` – 2 phát hiện) & Kiến nghị (`SUGGESTION` – 1 phát hiện)

#### 16. `AF-R2-R2-16` — [MINOR | `drug` | `ix.dabigatran_verapamil`] Lỗi cấu hình `maxDose: 150` kèm hàm lượng `75 mg` (chỉ có tại Mỹ) trong `ix.dabigatran_verapamil`, và lệch tên lớp thuốc chống loạn nhịp trong `qt_prolongation.json`
- **Chi tiết**: `kb/interactions/anticoagulant.json:312–318` đặt `maxDose: 150` khiến biểu thức `150 > 150` trong `interactions.ts:487` không bật `doseExceeded` khi bệnh nhân uống Pradaxa `150 mg BID` kèm Verapamil, đồng thời hiển thị `"75 mg x 2 lần/ngày"` thay vì phác đồ chuẩn ESC/Việt Nam `"110 mg x 2 lần/ngày"`. Trong `kb/interactions/qt_prolongation.json:24,57`, mảng `classes` ghi `"antiarrhythmic_class_3"` / `"antiarrhythmic_class_1c"` (không khớp `"antiarrhythmic_iii"` / `"antiarrhythmic_ic"` của `kb/drugs/*.json`) và thiếu `"propafenone"` trong `drugIds`.

#### 17. `AF-R2-R2-17` — [MINOR | `citation` | `esc.af.2024.antiplatelet_oac_not_recommended`] Sai lệch `pdfPage` và số hiệu Bảng (`Table 6` thay vì `Table 11`) trong `kb/citations/interactions.json`
- **Chi tiết**: `esc.af.2024.antiplatelet_oac_not_recommended` ghi `pdfPage: 9` trong khi `locator` là `"Recommendation Table 8 / Section 6.3 / p. 33"` (Recommendation Table 8 nằm ở trang PDF 33); `esc.af.2024.dabigatran_verapamil_dose_reduction` và `esc.af.2024.edoxaban_pgp_30mg` ghi `"Table 6 / DOAC Dose Selection / p. 32"` trong khi trên trang PDF 32 của ESC 2024 đó là **Table 11**.

#### 18. `AF-R2-R2-18` — [SUGGESTION | `missing` | `esmolol_landiolol_iv_rate_control`] Kiến nghị tích hợp Esmolol đường tĩnh mạch (đã có sẵn `kb/drugs/esmolol.json`) làm phương án thay thế kiểm soát tần số cấp trong hồi sức / hậu phẫu theo ESC 2024 Table 12 (PDF p. 39).

---

## PHẦN 4. PHÁN QUYẾT CUỐI CÙNG (`FINAL VERDICT`)

- **Kết luận thẩm định Vòng 2 của Chuyên gia R2 (Dược lâm sàng & An toàn thuốc)**: **`FAIL`**
- **Điều kiện tiên quyết để đạt `PASS` ở vòng kế tiếp**:
  1. Khắc phục triệt để **7 lỗi `critical` (`AF-R2-R2-01` → `AF-R2-R2-07`)**: chuẩn hóa phác đồ tĩnh mạch cấp cứu RVR và liều `UPTITRATE`/`CONTINUE`; truyền đủ `potentPgpInhibitor` cho Edoxaban; đồng bộ hệ số quy đổi Creatinin `88.4` và sửa dứt điểm `doacDose.ts`; bổ sung cổng chặn tương tác CYP3A4/P-gp mạnh (cảm ứng & ức chế) và tách Clarithromycin khỏi danh sách chống chỉ định Apixaban; bổ sung cổng an toàn WPW / Pre-excited AF; bổ sung đầy đủ Acenocoumarol (`Sintrom`) và nhận diện trùng lặp chống đông tiêm; sửa bộ phân tích đơn vị `'viên'` và tần suất `'1 lần/ngày'` của DOAC.
  2. Khắc phục **8 lỗi `major` (`AF-R2-R2-08` → `AF-R2-R2-15`)**: cổng chặn `onDialysis`, thực thi `kbDrug.gates` (`QTc > 500 ms`) & cổng hạ kali máu `K+ < 3.5 mmol/L`, sửa lỗi gộp nhóm OAC của `merge.ts` trên bệnh nhân hẹp van hai lá & lỗi `findCurrentMed` đơn lẻ, mở rộng dừng kháng tiểu cầu (`ticagrelor`, `prasugrel`, DAPT), bổ sung Hội chứng kháng phospholipid (APS), tách `pregnant` khỏi `breastfeeding` kèm cổng `lactation`, đồng bộ `CrCl` béo phì để `tests/modules/af/invariants.test.ts` đạt `0` vi phạm, và chỉnh ranh giới `renalBand()` + trích dẫn trong `DrugEntry`.
