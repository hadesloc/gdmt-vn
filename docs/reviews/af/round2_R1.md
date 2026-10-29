# Báo Cáo Thẩm Định Độc Lập Vòng 2 — Module Rung Nhĩ (`af`)
**Vai trò**: **R1 – Chuyên gia Phác đồ Tim mạch – Điện sinh lý Độc lập (Guideline Specialist)**  
**Vòng duyệt**: Vòng 2 (`Round 2`)  
**Phạm vi đối chiếu**:
- **Mã nguồn & Engine**: Toàn bộ 10 tệp `src/modules/af/*.ts` (`index.ts`, `inputs.ts`, `matrices.ts`, `pathways.ts`, `presets.ts`, `rules.ts`, `rulesHelpers.ts`, `rulesInpatient.ts`, `rulesOac.ts`, `rulesRateRhythm.ts`) và các bộ tính toán/an toàn liên quan (`src/engine/derive.ts`, `calculators/cha2ds2va.ts`, `calculators/crcl.ts`, `calculators/doacDose.ts`, `mergeConflictGroups.ts`, `safety/gates.ts`, `safety/interactions.ts`).
- **Cơ sở tri thức (KB)**: `kb/thresholds/af.json` (42 ngưỡng), `kb/citations/af.json` (86 trích dẫn), `kb/interactions/anticoagulant.json`, `cardiovascular.json`, `qt_prolongation.json`, cùng toàn bộ 12 tệp thuốc AF + `digoxin.json`, `bisoprolol.json`.
- **Tài liệu nguồn gốc đối chiếu trực tiếp từ PDF (đã khử ký tự ngắt trang `\f`)**:
  1. **ESC 2024 Guidelines for the management of atrial fibrillation** (`ESC_2024_atrial_fibrillation.pdf`, 107 trang).
  2. **2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation** (`ACC_AHA_2023_Atrial_Fibrillation_Guideline.pdf`, 171 trang).
  3. **2025 ESC Guidelines for the management of cardiovascular disease and pregnancy** (`ESC_2025_cardiovascular_diseases_during_pregnancy_management_of.pdf`).
  4. **Nhãn thuốc chính thức FDA**: Apixaban (*Eliquis*), Rivaroxaban (*Xarelto*), Dabigatran (*Pradaxa*), Edoxaban (*Savaysa*), Warfarin (*Coumadin*), Amiodarone, Diltiazem.
  5. **Nguồn Việt Nam**: Đã kiểm tra `Medical_Library_2026/06_Viet_Nam/` và `docs/SOURCES_STATUS.md` (dòng 100 xác nhận khuyến cáo Rung nhĩ VNHA 2022 chưa có bản PDF trong kho chuẩn).

---

## 1. Tóm Tắt Phán Quyết Vòng 2

| Mức độ nghiêm trọng | Số lượng | Ý nghĩa theo `REVIEW_PROTOCOL.md` |
|---|---:|---|
| **Critical** | **5** | Nguy cơ gây hại trực tiếp / tử vong cho bệnh nhân nếu làm theo y lệnh của hệ thống |
| **Major** | **6** | Bỏ sót khuyến cáo **Class I**, sai lệch lớn so với phác đồ gốc, mâu thuẫn nội bộ hoặc sai bản chất trích dẫn |
| **Minor** | **3** | Lệch biên hẹp, thiếu cảnh báo phụ quanh thủ thuật ở suy thận nặng, ngưỡng thừa / tài liệu lệch |
| **Suggestion** | **1** | Đề xuất hoàn thiện kiểm soát nhịp sớm trong 12 tháng đầu (EAST-AFNET 4, Class IIa) |
| **Tổng cộng** | **15** | **KẾT LUẬN VÒNG 2: `FAIL`** *(Yêu cầu PASS: 0 Critical & 0 Major)* |

---

## 2. Thẩm Định Độc Lập Việc Khắc Phục Các Lỗi Vòng 1

| Mã Vòng 1 | Nội dung cốt lõi | Trạng thái ở Vòng 2 | Ghi nhận của Chuyên gia R1 Vòng 2 |
|---|---|---|---|
| `AF-R1-01` | RVR nội viện tự kê Diltiazem khi `lvef === undefined` | **Đã sửa nhưng phát sinh lỗi mới (`AF-R2-R1-02`)** | Đã chặn Non-DHP CCB khi chưa có `LVEF`, chuyển sang Amiodarone/Digoxin kèm yêu cầu POCUS. Tuy nhiên hàm mới `getCleanStartDose()` lại làm mất hoàn toàn liều **tiêm tĩnh mạch cấp**, khiến mọi ca cấp cứu RVR xuất ra liều **uống**! |
| `AF-R1-02` | Bỏ sót `STOP` Flecainide/Propafenone ở CAD/HFrEF (CAST) | **Đạt (Verified)** | Đã tách rule độc lập `af.rhythm.stop_class_ic_shd` (`priority: 100`) cho CAD, PAD, tiền sử ĐQ/TIA, HFrEF, HCM và `CrCl < 35 mL/phút`. |
| `AF-R1-03` | Bỏ sót OAC Class I-B ở HCM & Cardiac Amyloidosis khi `CHA₂DS₂-VA = 0` | **Đạt (Verified)** | Đã bổ sung kiểm tra `hypertrophicCardiomyopathy` và `cardiacAmyloidosis` chỉ định OAC bất kể điểm `CHA₂DS₂-VA`. |
| `AF-R1-04` | Dừng Non-DHP CCB ở HFrEF làm mất khuyến cáo khởi trị BB/Digoxin | **Đạt một phần (`AF-R2-R1-08`)** | Đã tách rule `stop_non_dhp_ccb_hfref`, nhưng ở BN HFrEF đang dùng sẵn BB liều thấp mà nhịp vẫn nhanh `128 bpm`, rule `reduced_lvef` vẫn chỉ báo `CONTINUE` mà không tối ưu liều hoặc phối hợp thêm Digoxin. |
| `AF-R1-05` | Chưa tách profile `US` (`CHA₂DS₂-VASc`) vs `INTL` (`CHA₂DS₂-VA`) | **Đạt phần lớn (`AF-R2-R1-07`)** | Đã tách `CHA₂DS₂-VASc` (Nam ≥ 2 / Nữ ≥ 3 Class 1; Nam 1 / Nữ 2 Class 2a), song ở Nữ `CHA₂DS₂-VASc = 1` gate vẫn hiện nhầm `threshold: 0`. |
| `AF-R1-06` | Ghi sai FDA cấm DOAC khi `CrCl < 15 mL/phút` / lọc máu | **Đạt (Verified)** | Profile `US` đã cho phép cân nhắc Warfarin hoặc Apixaban theo ACC/AHA 2023 Section 6.8.4 Rec 3 (Class 2b) & nhãn FDA Eliquis. |
| `AF-R1-07` | Trích dẫn nhầm Figure 12 cho `CHA₂DS₂-VA = 0` không dùng OAC | **Đạt (Verified)** | Đã cập nhật sang ESC 2024 Recommendation Table 6 / Section 6.1. |
| `AF-R1-08` | Trích dẫn nhầm liều Diltiazem cho chống chỉ định `LVEF ≤ 40%` | **Đạt câu trích, còn lỗi metadata (`AF-R2-R1-11`)** | Câu `quote` đã sửa thành `"Contraindicated if LVEF ≤40%."`, nhưng tự gắn `cor: "III", loe: "B"` lên Table 12 (vốn không có cột Class/LOE). |
| `AF-R1-09` | Thiếu chuyển VKA sang DOAC khi `TTR < 70%` (Class I-B) | **Đạt cho `TTR < 70%`, hở `TTR ≥ 70%` / `undefined` (`AF-R2-R1-07`)** | Đã thêm `af.oac.vka_ttr_switch_doac`, nhưng khi `vkaTtr ≥ 70%` hoặc bỏ trống `vkaTtr`, toàn bộ trụ cột `[A]` biến mất! |
| `AF-R1-10` | Mốc chuyển nhịp sớm 48h cũ thay vì `< 24h` (ESC 2024) | **Đạt mốc 24h, còn lỗi `permanent AF` & `<24h` nguy cơ thấp (`AF-R2-R1-09`)** | Đã đổi sang `< 24 giờ`, nhưng rule vẫn chạy nhầm cho cả `permanent AF`! |
| `AF-R1-11` | Số giả `value: 12` / `value: 48` trong gate chuyển nhịp | **Đạt (Verified)** | Đã bỏ số giờ tự bịa khỏi `gates`. |
| `AF-R1-12` | Gộp chung liều tiêm cấp và liều uống mạn | **THẤT BẠI NGHIÊM TRỌNG (`AF-R2-R1-02`)** | Thay vì tách liều IV riêng cho nội viện, `getCleanStartDose()` cắt sạch phần mô tả IV và ép mọi rule cấp cứu nội viện xuất ra liều **uống**! |
| `AF-R1-13` | Chỉ có 1 trích dẫn từ ACC/AHA 2023 | **Đạt số lượng, sai số bảng (`AF-R2-R1-11`)** | Đã tăng lên 10 trích dẫn ACC/AHA 2023 + 3 trích dẫn ESC 2025 Pregnancy, nhưng ghi nhầm `Table 19` thay vì `Table 18` ở trang 56. |
| `AF-R2-14` *(R2 Vòng 1)* | Thiếu thuốc `acenocoumarol` (Sintrom) tại Việt Nam | **CHƯA THỰC HIỆN (`AF-R2-R1-05`)** | Dù `round1_RESPONSE.md` ghi đã giải quyết 14/14 mục R2, `kb/drugs/acenocoumarol.json` vẫn chưa tồn tại, gây kê chồng Warfarin lên Sintrom! |

---

## 3. Chi Tiết 15 Phát Hiện Chuyên Môn Vòng 2

### Nhóm CRITICAL (Nguy cơ gây hại trực tiếp cho người bệnh)

#### `[AF-R2-R1-01]` (CRITICAL · `missing` · `af.rate_rhythm.wpw_preexcited_af`)
**Bỏ sót hoàn toàn hội chứng Wolff-Parkinson-White (WPW) / Rung nhĩ tiền kích thích qua đường dẫn truyền phụ (Pre-excited AF); hệ thống kê đơn trực tiếp các thuốc chẹn nút nhĩ thất bị chống chỉ định Class III: Harm (Diltiazem, Chẹn beta, Amiodarone, Digoxin)**

- **Bằng chứng từ Guideline gốc**:
  - **ACC/AHA/ACCP/HRS 2023 AF Guideline, Section 10.6 (*Wolff-Parkinson-White and Preexcitation Syndromes*), Recommendation 4 (PDF p. 111, tr. 219 — COR `3: Harm`, LOE `B-NR`)**:
    > *"For patients with AF with anterograde accessory pathway conduction (preexcited AF), pharmacological agents that block atrioventricular nodal conduction (verapamil, diltiazem, amiodarone, digoxin, adenosine, or beta blockers) are contraindicated due to risk of precipitating VF or hemodynamic deterioration."*
  - Cùng mục Section 10.6: **Rec 1 (`COR 1, LOE B-NR`)** sốc điện chuyển nhịp khẩn nếu rối loạn huyết động; **Rec 2 (`COR 1, LOE B-NR`)** triệt đốt đường dẫn truyền phụ qua catheter; **Rec 3 (`COR 1, LOE C-LD`)** dùng **Ibutilide IV** hoặc **Procainamide IV** nếu huyết động ổn định.
  - **ESC 2024 AF Guidelines, Table 12 footnote `a` (PDF p. 40, tr. 3353)**:
    > *"All rate control drugs are contraindicated in Wolff–Parkinson–White syndrome; also intravenous amiodarone."*
  - **ESC 2024 Section 9.11 (PDF p. 57–58, tr. 3370–3371)** & **Recommendation Table 28 (PDF p. 56, Class `I`, Level `C` cho thai kỳ)**: nhấn mạnh tránh mọi thuốc điều biến nút AV và tránh cả amiodarone; có thể chuyển nhịp bằng thuốc với **ibutilide** hoặc **flecainide** (thận trọng propafenone).
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`**:
  - Dù `kb/drugs/digoxin.json` (dòng 110–116) có khai báo `contraindications: [{ "code": "wpw_afib" }]`, toàn bộ `src/modules/af/` và `src/engine/safety/gates.ts` không hề có trường nhập liệu hay quy tắc kiểm tra WPW / tiền kích thích thất.
  - Chạy `evaluate()` nội viện cho BN nam 32 tuổi rung nhĩ tiền kích thích WPW (`hr: 165, lvef: 58, sbp: 118, conditions: { af: true, wpw: true, wpw_afib: true }`):
    - Xuất `[START] id=rec_af_acute_rate_preserved drug=diltiazem`
    - Xuất `[CONSIDER] id=rec_af_rate_preserved_ef drug=bisoprolol`
    - Xuất `[CONSIDER] id=rec_af_aad_no_shd drug=flecainide | title="Kiểm soát nhịp: Flecainide (hoặc Propafenone) — BẮT BUỘC KÈM THUỐC CHẸN NÚT AV"`!
  - Chạy ngoại trú BN WPW đang uống `digoxin 0.125 mg` (`hr: 128`): hệ thống **không dừng `digoxin`** mà còn khởi trị thêm `bisoprolol`! Việc ức chế nút AV làm mất cạnh tranh dẫn truyền ẩn, tạo điều kiện cho xung rung nhĩ > 250–300 chu kỳ/phút dẫn truyền 1:1 qua bó Kent xuống thất gây **rung thất (VF) và ngừng tuần hoàn**.
- **Hướng khắc phục**:
  1. Bổ sung cờ lâm sàng `wpwPreexcitation` vào `src/modules/af/inputs.ts` và nối với `wpw_afib` trong `safety/gates.ts`.
  2. Tạo quy tắc khẩn cấp `af.rate_rhythm.wpw_preexcited_af` (`priority: 100`): phát lệnh `STOP` mọi thuốc chẹn nút AV đang dùng (`diltiazem`, `verapamil`, chẹn beta, `digoxin`, `amiodarone`); chặn toàn bộ các rule kiểm soát tần số bằng thuốc chẹn nút AV và bỏ yêu cầu kèm thuốc chẹn nút AV khi dùng Flecainide; hướng dẫn sốc điện đồng bộ ngay nếu huyết động không ổn định (Class I), Ibutilide IV / Procainamide IV / Flecainide nếu ổn định (Class I), và chuyển Điện sinh lý triệt đốt đường phụ qua catheter (Class I).

---

#### `[AF-R2-R1-02]` (CRITICAL · `rule` · `af.inpatient.rvr_acute_rate_control`)
**Cấp cứu nội viện rung nhĩ đáp ứng thất nhanh (`HR ≥ 110 bpm`, kể cả Preset 5 `af_preset_inpatient_rvr_emergency`) gắn tiêu đề thuốc tĩnh mạch nhưng trả về liều uống duy trì/liều nạp ngoại trú, đồng thời kích hoạt giả cảnh báo tương tác đỏ `ix.bb_non_dhp_ccb` trên Preset 5**

- **Bằng chứng từ Guideline gốc — ESC 2024 Table 12 (PDF p. 39–40, tr. 3352–3353)**:
  - **Diltiazem IV cấp**: *"0.25 mg/kg i.v. bolus over 5 min, then 5–15 mg/h"* (khác hẳn liều uống duy trì *"60 mg three times daily"*).
  - **Amiodarone IV cấp**: *"300 mg i.v. diluted in 250 mL 5% dextrose over 30–60 min (preferably via central venous cannula), followed by 900–1200 mg i.v. over 24 h"* (khác hẳn phác đồ nạp uống 4 tuần *"200 mg three times daily for 4 weeks"*).
  - **Digoxin IV cấp**: *"0.5 mg i.v. bolus (0.75–1.5 mg over 24 h in divided doses)"* (khác hẳn liều uống duy trì *"0.0625–0.25 mg once daily"*).
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`**:
  - Hàm `getCleanStartDose(drugId)` (`src/modules/af/rulesHelpers.ts:62-71`) chỉ lấy `start.amount + unit + frequency + (route)` từ `kb/drugs/*.json` (nơi cả `diltiazem`, `amiodarone`, `digoxin` đều có `route = "uống"`).
  - Chạy `evaluate()` trên **Preset 5 chuẩn của hệ thống (`af_preset_inpatient_rvr_emergency`, `inpatient`, `HR = 145 bpm`, `LVEF = 55%`)**:
    - Xuất `[START] id=rec_af_acute_rate_preserved drug=diltiazem | dose="60 mg x 3 lần/ngày (uống)"`!
    - Đồng thời `af.rate.preserved_lvef` (`rulesRateRhythm.ts:303-326`) xuất thêm `[CONSIDER] id=rec_af_rate_preserved_ef drug=bisoprolol | dose="1.25 mg x 1 lần/ngày (uống)"`, khiến bộ gác tương tác phát báo động đỏ giả tạo `<ALERT:critical:interaction> id=ix.bb_non_dhp_ccb (Phát hiện: bisoprolol, diltiazem)` ngay trên ca mẫu!
  - Chạy nội viện RVR + HFrEF (`HR = 150 bpm, LVEF = 30%`): tiêu đề ghi **`"Amiodarone IV hoặc Digoxin IV (HR 150 bpm)"`** nhưng dòng liều ngay bên dưới ghi **`dose="200 mg x 3 lần/ngày (uống)"`**! Khi kèm thai kỳ + HFrEF (`HR = 145 bpm, LVEF = 35%`): trả về `drug=digoxin | dose="0.0625–0.125 mg x 1 lần/ngày (uống)"`.
- **Hướng khắc phục**:
  1. Bổ sung trường liều tiêm tĩnh mạch cấp cứu chuẩn hóa (`acuteIv`) trong KB thuốc đối chiếu ESC 2024 Table 12 & ACC/AHA 2023 Table 17 và dùng helper riêng `getAcuteIvDose(drugId)` cho `rulesInpatient.ts`.
  2. Không phát song song một recommendation thứ hai có gắn `drugId: 'bisoprolol'` trong `af.rate.preserved_lvef` khi `af.inpatient.rvr_acute_rate_control` đã phát lệnh `[START] diltiazem` cho bệnh nhân chưa dùng thuốc nền.

---

#### `[AF-R2-R1-03]` (CRITICAL · `rule` · `af.oac.doac_dose_adjustment`)
**Bỏ sót hoàn toàn tương tác thuốc ức chế mạnh bơm P-gp (`dronedarone`, `cyclosporine`, `erythromycin`, `ketoconazole`, `itraconazole`) trong `resolveAfDoacDose`, dẫn tới ra lệnh `[UPTITRATE]` tăng gấp đôi liều Edoxaban lên `60 mg` trên nền Dronedarone và không chặn phối hợp chống chỉ định `Dabigatran + Dronedarone`**

- **Bằng chứng từ Guideline & Nhãn thuốc gốc**:
  - **ESC 2024 Table 11 (PDF p. 32, tr. 3345)**: Edoxaban bắt buộc giảm từ `60 mg` xuống **`30 mg once daily`** khi có 1 trong 3 tiêu chuẩn: *(i) CrCl 15–50 mL/min; (ii) cân nặng ≤ 60 kg; (iii) dùng đồng thời **ciclosporin, dronedarone, erythromycin, hoặc ketoconazole***. *(Lưu ý khác biệt vùng quan trọng: ở Hoa Kỳ, ACC/AHA 2023 Table 13 PDF p. 42 & nhãn FDA Savaysa Section 7.3 PDF p. 16 quy định không giảm liều Edoxaban khi dùng thuốc ức chế P-gp — cần tách `profileDiff` INTL/VN vs US!)*.
  - **ESC 2024 Figure 9 (PDF p. 30)** & EMA SmPC: Dabigatran **chống chỉ định** phối hợp với `dronedarone`, `ketoconazole` toàn thân, `itraconazole`, `cyclosporine`. Tại Hoa Kỳ, **ACC/AHA 2023 Table 13 (PDF p. 42, tr. 150)** quy định với `dronedarone` hoặc `ketoconazole` toàn thân: giảm Dabigatran xuống **`75 mg twice daily`** nếu `CrCl 30–50 mL/min` và tránh phối hợp nếu `CrCl < 30 mL/min`.
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`**:
  - Trong `src/modules/af/rulesHelpers.ts:104-112`, `resolveAfDoacDose` gọi `computeDoacDose({ drugId, age, weightKg, scrUmolL, crcl, verapamil })` mà **bỏ quên hoàn toàn tham số `potentPgpInhibitor`** (dù `doacDose.ts:24, 134` đã viết sẵn!).
  - Thực nghiệm `evaluate()` ngoại trú `INTL` cho BN nam 68 tuổi (`72 kg, SCr 85 µmol/L, CrCl = 74.9 mL/phút`) đang được bác sĩ kê đúng chuẩn **`edoxaban 30 mg QD + dronedarone 400 mg BID`**: hệ thống phát lệnh **`[UPTITRATE] id=rec_af_doac_dosing_edoxaban | title="Tăng lên liều chuẩn đầy đủ Edoxaban: 60 mg x 1 lần/ngày"`** (tăng gấp đôi nồng độ thuốc gây xuất huyết tiêu hóa/nội sọ nặng!), mâu thuẫn trực diện với cảnh báo đỏ `ix.edoxaban_p_gp_inhibitors` ngay bên dưới!
  - Thực nghiệm BN nữ 74 tuổi (`CrCl = 36.7 mL/phút`) dùng `dabigatran 150 mg BID + dronedarone 400 mg BID`: ở `INTL` hệ thống khuyên `Dabigatran 110 mg x 2 lần/ngày` (thay vì `STOP/SWITCH` theo chống chỉ định EMA); ở `US` hệ thống cũng khuyên `110 mg x 2 lần/ngày` (liều 110 mg không được FDA cấp phép cho NVAF tại Mỹ, và bỏ qua mức `75 mg x 2 lần/ngày` của ACC/AHA 2023 Table 13!).
- **Hướng khắc phục**:
  1. Truyền đầy đủ `potentPgpInhibitor` vào `computeDoacDose` ở profile `INTL`/`VN` cho 4 thuốc `dronedarone`, `cyclosporine`/`ciclosporin`, `erythromycin`, `ketoconazole` (và giữ 60 mg kèm `profileDiff` ở profile `US`).
  2. Chặn `STOP`/`SWITCH` phối hợp `dabigatran` với chất ức chế mạnh P-gp ở `INTL`/`VN`; ở `US` áp đúng liều `75 mg x 2 lần/ngày` khi `CrCl 30–50 mL/phút` kèm `dronedarone`/`ketoconazole` và `150 mg x 2 lần/ngày` cho liều chuẩn.
  3. Truyền thêm cờ `highBleedingRisk` (tuổi 75–79, viêm thực quản/dạ dày hoặc tiền sử xuất huyết tiêu hóa) cho Dabigatran `110 mg BID` ở `INTL`/`VN` theo ESC 2024 Table 11.

---

#### `[AF-R2-R1-04]` (CRITICAL · `rule` · `src/engine/derive.ts + af.oac.doac_dose_adjustment`)
**Công thức tính `CrCl` cho DOAC tự động thay thế cân nặng thực (`actual body weight`) bằng cân nặng hiệu chỉnh (`ABW`) và tự bịa chiều cao `165 cm` khi thiếu chiều cao — làm vô hiệu hóa cảnh báo hộp đen FDA chống chỉ định Edoxaban khi `CrCl > 95 mL/phút` và gây giảm liều DOAC sai Class III: Harm**

- **Bằng chứng từ Guideline & Nhãn FDA gốc**:
  - **ACC/AHA 2023 Table 13 (PDF p. 42, tr. 150)**: ghi nguyên văn tiêu đề: ***"Renal dosing adjustment based on actual body weight"*** (cả 4 thử nghiệm RCT bản lề RE-LY, ROCKET-AF, ARISTOTLE, ENGAGE AF-TIMI 48 đều dùng Cockcroft-Gault theo cân nặng thực tế `actual body weight`).
  - **FDA Label Savaysa (Edoxaban), Boxed Warning & Section 2.1 (PDF p. 1, 4–5)**:
    > *"SAVAYSA should not be used in patients with CrCL > 95 mL/min. In the ENGAGE AF-TIMI 48 study, nonvalvular atrial fibrillation patients with CrCL > 95 mL/min had an increased rate of ischemic stroke with SAVAYSA 60 mg once daily compared to patients treated with warfarin [HR 2.16 (1.17, 3.97)]."*
  - **ESC 2024 Rec Table 7 (PDF p. 31 — Class `III`, Level `B`)** & **ACC/AHA 2023 Section 6.3.1.1 Rec 3 (PDF p. 41 — COR `3: Harm`, LOE `B-NR`)**: cấm giảm liều DOAC khi không thỏa đúng tiêu chuẩn thử nghiệm để tránh đột quỵ thiếu máu não do dùng dưới liều.
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`**:
  - Tại `src/engine/derive.ts:77-84`, hệ thống gọi `computeCrcl({ ..., height: patient.height || 165 })` rồi lấy `crclRes.recommendedCrCl` (vốn tự chuyển sang `crclAbw` hễ `weight > 1.2 * IBW` tại `crcl.ts:48-60`).
  - **Hệ quả 1 — Bỏ lọt Boxed Warning Edoxaban gây đột quỵ**: Chạy `evaluate()` ở profile `US` cho BN nam 62 tuổi (`weight: 105 kg, height: 170 cm, scr: 90 µmol/L`) đang uống `edoxaban 60 mg`: Cockcroft-Gault cân nặng thực **`crclActual = 111.7 mL/phút` (`> 95` -> CHỐNG CHỈ ĐỊNH HỘP ĐEN FDA!)**, nhưng `derived.crcl` bị kéo xuống `86.7 mL/phút`, vượt qua toàn bộ hàng rào an toàn và trả về **`[CONTINUE] Chỉ định liều chuẩn Edoxaban: 60 mg x 1 lần/ngày`**!
  - **Hệ quả 2 — Giảm liều DOAC sai Class III: Harm gây đột quỵ**: Chạy `evaluate()` cho BN nữ 74 tuổi (`weight: 82 kg, height: 155 cm, scr: 115 µmol/L`) đang uống `rivaroxaban 20 mg`: Cockcroft-Gault cân nặng thực **`crclActual = 52.7 mL/phút` (`≥ 50` -> bắt buộc giữ liều 20 mg)**, nhưng `derived.crcl` bị ép xuống `36.8 mL/phút` và ra lệnh **`[REDUCE] Chỉ định giảm liều Rivaroxaban: 15 mg x 1 lần/ngày`**! Nghiêm trọng hơn, ở BN nữ 74 tuổi (`weight: 72 kg, scr: 105 µmol/L`) **không nhập chiều cao (`height: undefined`)**, hệ thống tự bịa `height = 165 cm` rồi áp ABW kéo `CrCl` từ `50.8` xuống `41.3 mL/phút`, cũng ra lệnh giảm liều sai `[REDUCE] Rivaroxaban 15 mg`!
- **Hướng khắc phục**:
  1. Xóa ngay biểu thức tự bịa chiều cao `patient.height || 165` trong `src/engine/derive.ts`.
  2. Xuất tường minh `derived.crclActual` (Cockcroft-Gault cân nặng thực) và sử dụng `crclActual` cho toàn bộ phân tầng chống chỉ định và chỉnh liều DOAC theo đúng chuẩn ACC/AHA 2023 Table 13 và 4 thử nghiệm RCT bản lề.

---

#### `[AF-R2-R1-05]` (CRITICAL · `rule` · `af.oac.mechanical_mitral_vka + af.inpatient.periprocedural_vka_hold`)
**Chưa nhận diện `acenocoumarol` (Sintrom — thuốc kháng vitamin K chủ lực tại Việt Nam), gây kê chồng `Warfarin` lên `Sintrom` và bỏ sót tạm ngừng VKA trước phẫu thuật**

- **Bằng chứng thực nghiệm `evaluate()`**:
  - Dù `round1_RESPONSE.md` báo cáo đã hoàn thành 14/14 mục R2 (gồm `AF-R2-14` Acenocoumarol), tệp `kb/drugs/acenocoumarol.json` vẫn chưa tồn tại, `mergeConflictGroups.ts:193` không có `'acenocoumarol'`, và `rulesOac.ts:130` / `rulesInpatient.ts:424` chỉ kiểm tra `['warfarin']`.
  - Chạy `evaluate()` ở profile `VN`, `inpatient` cho BN nữ 54 tuổi mang van hai lá cơ học đang uống `acenocoumarol` (`Sintrom 4 mg`) chuẩn bị phẫu thuật nguy cơ chảy máu cao (`plannedProcedureRisk: 'high'`):
    - Hệ thống phát **`[START] id=rec_af_valvular_vka drug=warfarin | title="Khởi trị Warfarin (Kháng vitamin K) chuẩn độ theo INR"`** chồng trực tiếp lên Sintrom đang uống mà không có bất kỳ cảnh báo trùng lặp thuốc chống đông nào!
    - Bỏ sót hoàn toàn khuyến cáo tạm ngừng VKA và bắc cầu Heparin trước phẫu thuật nguy cơ cao!
- **Hướng khắc phục**: Tạo `kb/drugs/acenocoumarol.json`, thêm `'acenocoumarol'` vào `anticoagulants` trong `mergeConflictGroups.ts` / `drugClassify.ts` / `anticoagulant.json`, và dùng hằng `VKA_IDS = ['warfarin', 'acenocoumarol']` trong toàn bộ `rulesOac.ts` và `rulesInpatient.ts`.

---

### Nhóm MAJOR (Bỏ sót khuyến cáo Class I, sai lệch phác đồ lớn hoặc mâu thuẫn y lệnh)

#### `[AF-R2-R1-06]` (MAJOR · `missing` · `af.oac.acs_pci_antithrombotic + af.oac.stop_unnecessary_antiplatelet`)
**Bỏ sót phác đồ Class I, Level A cho Rung nhĩ kèm Hội chứng vành cấp / PCI (`recentAcs = true`) và dừng thiếu `ticagrelor`/`prasugrel`/DAPT khi `recentAcs = false`**
- **Guideline gốc**: **ESC 2024 Recommendation Table 24 (PDF p. 53, tr. 3366 — Class `I`, Level `A`)** và **ACC/AHA 2023 Section 6.8.1 Recs 1–2 (PDF p. 58, tr. 166 — COR `1`, LOE `A`)** khuyến cáo ưu tiên DOAC hơn VKA, ngừng sớm Aspirin (`≤ 1 tuần` theo ESC 2024; `1–4 tuần` theo ACC/AHA 2023), duy trì phác đồ kép `DOAC + ức chế P2Y12 (ưu tiên clopidogrel, tránh ticagrelor/prasugrel)` trong 6–12 tháng rồi chuyển sang đơn trị OAC (Class `III-B` nếu kéo dài kháng tiểu cầu > 12 tháng ở CAD ổn định).
- **Thực nghiệm `evaluate()`**:
  - Ca `ACS-1` (`recentAcs: true`, đang dùng `aspirin 81 + ticagrelor 90`): hệ thống chỉ thêm `[START] Apixaban 5 mg x 2 lần/ngày` mà không có hướng dẫn ngừng sớm Aspirin hay đổi Ticagrelor sang Clopidogrel -> đẩy BN vào phác đồ 3 thuốc kéo dài với Ticagrelor!
  - Ca `ACS-2A` (`recentAcs: false`, ổn định đang dùng `apixaban 5 + ticagrelor 90`): `rulesOac.ts:439` chỉ tìm `['aspirin', 'clopidogrel']` nên **bỏ sót hoàn toàn `ticagrelor` và `prasugrel`**!
  - Ca `ACS-2B` (`recentAcs: false`, đang dùng `apixaban 5 + aspirin 81 + clopidogrel 75`): `findCurrentMed` chỉ lấy thuốc đầu tiên nên chỉ dừng `aspirin` và để mặc `clopidogrel` chạy tiếp!

#### `[AF-R2-R1-07]` (MAJOR · `rule` · `af.oac.risk_stratification + af.oac.doac_dose_adjustment + af.oac.vka_ttr_switch_doac`)
**Ba lỗi lớn ở trụ cột `[A]` Dự phòng đột quỵ: mâu thuẫn `[AVOID]` + `[CONTINUE]` DOAC khi nguy cơ thấp; mất trắng khuyến cáo `[A]` khi dùng Warfarin ổn định; và lệch phác đồ `US` cho Dabigatran `CrCl 15–29 mL/phút`**
1. **Mâu thuẫn trực diện trên cùng bệnh nhân**: Nam 45 tuổi `CHA₂DS₂-VA = 0` ngoại trú đang uống `apixaban 5 mg` nhận đồng thời `[CONTINUE] Chỉ định liều chuẩn Apixaban: 5 mg x 2 lần/ngày` (`priority: 90`) VÀ `[AVOID] Không chỉ định thuốc chống đông dài hạn...` (`priority: 75`).
2. **Khoảng trống hoàn toàn khi dùng Warfarin ở NVAF**: Nam 70 tuổi (`CHA₂DS₂-VA = 4`) đang uống `warfarin 5 mg` với `vkaTtr: 80` (hoặc chưa nhập `vkaTtr`) nhận **0 khuyến cáo thuộc trụ cột `[A]`** — bỏ sót đích INR 2.0–3.0 (Class I-B), nhắc nhập `vkaTtr`, và lưu ý cân nhắc đổi sang DOAC hoặc giữ nguyên VKA ở người cao tuổi ≥ 75 suy yếu/đa thuốc theo thử nghiệm FRAIL-AF (ESC 2024 Rec Table 7, Class IIb, Level B).
3. **Lệch profile `US`**: `rulesOac.ts:888-900` phát lệnh `[STOP] Dabigatran` khi `CrCl < 30 mL/phút` ngay cả trên profile `US`, trái với **ACC/AHA 2023 Table 13 (PDF p. 42)** & nhãn FDA Pradaxa (`75 mg BID` cho `CrCl 15–30 mL/phút`); đồng thời ở nữ đơn độc `CHA₂DS₂-VASc = 1` (`US`), gate hiện nhầm `threshold: 0` thay vì `1`.

#### `[AF-R2-R1-08]` (MAJOR · `rule` · `af.rate.reduced_lvef + af.rate.preserved_lvef`)
**Ba sai lệch kiểm soát tần số thất so với ESC 2024 Recommendation Table 14 (PDF p. 38)**
1. **HFrEF ngoại trú nhịp thất nhanh không được chỉnh liều hay phối hợp Digoxin (`RATE-2`)**: Ở `LVEF = 32%, HR = 128 bpm` đang uống `bisoprolol 2.5 mg`, `rulesRateRhythm.ts:580-606` không kiểm tra `hr` mà chỉ báo `[CONTINUE] Duy trì Bisoprolol` kèm gate `"Nhịp tim 128 bpm trong giới hạn an toàn"`, bỏ sót Class I-B / Class IIa-C tối ưu liều chẹn beta và phối hợp Digoxin.
2. **Bỏ qua mục tiêu kiểm soát chặt `< 80 bpm` khi còn triệu chứng (`RATE-1`)**: BN `EHRA = 3`, `HR = 98 bpm` trên nền `bisoprolol 2.5 mg` vẫn chỉ báo `[CONTINUE]` vì code chỉ so với ngưỡng lỏng `110 bpm` thay vì `af.rate.target_strict = 80 bpm` (ESC 2024 Rec Table 14 Class IIa-B).
3. **Khởi trị Bisoprolol không cần thiết khi nhịp nghỉ đã chậm/bình thường và không triệu chứng (`RATE-3`)**: BN `LVEF = 60%, EHRA = 1, HR = 55 bpm` chưa dùng thuốc vẫn bị phát `[START] Khởi trị Bisoprolol 1.25 mg`!

#### `[AF-R2-R1-09]` (MAJOR · `rule` · `af.inpatient.cardioversion_anticoag_timing + af.oac.risk_stratification`)
**Lỗi logic chuyển nhịp nội viện: kích hoạt cả trên Rung nhĩ vĩnh viễn (`permanent AF`), không xét tiền sử đã chống đông ≥ 3 tuần, và bỏ qua ngoại lệ `< 24 giờ` + `CHA₂DS₂-VA = 0`**
- Chạy **Preset 4 (`afType: 'permanent'`)** ở chế độ `inpatient` lập tức sinh `[HOLD] Hoãn chuyển nhịp sớm: Bắt buộc siêu âm thực quản (TEE) hoặc dùng chống đông hiệu quả ≥ 3 tuần` — phi lý về mặt y khoa vì `permanent AF` (ESC 2024 Table 3, PDF p. 15) là thể bệnh đã thống nhất không chuyển nhịp!
- Đồng thời ở BN `CHA₂DS₂-VA = 0` khởi phát chắc chắn `< 24 giờ`, `rulesOac.ts:817` khẳng định bắt buộc chống đông 4 tuần sau chuyển nhịp cho mọi trường hợp, bỏ qua ngoại lệ tùy chọn (*optional*) trong **ESC 2024 Rec Table 15 (PDF p. 42)** & **Figure 12 (PDF p. 41)**.

#### `[AF-R2-R1-10]` (MAJOR · `rule` · `af.rhythm.catheter_ablation`)
**Bỏ sót khuyến cáo Class I, Level A triệt đốt qua catheter cho `persistent AF` có triệu chứng kháng trị AAD khi `LVEF > 40%`, nhưng lại phát nhầm triệt đốt đầu tay cho `paroxysmal AF` không triệu chứng (`EHRA = 1`)**
- Tại `rulesRateRhythm.ts:1048-1050`, điều kiện `hasHfRef || isParoxysmal` loại bỏ hoàn toàn mọi bệnh nhân `persistent AF` có `LVEF > 40%` (kể cả khi `EHRA = 3–4` kháng thuốc AAD — vốn là chỉ định **Class I, Level A** theo ESC 2024 Rec Table 19 PDF p. 46 & ACC/AHA 2023 Section 8.4 Rec 1 PDF p. 89), trong khi lại phát khuyến cáo triệt đốt cho cả bệnh nhân `paroxysmal AF` hoàn toàn không triệu chứng (`ehraScore: 1`).

#### `[AF-R2-R1-11]` (MAJOR · `citation` · `kb/citations/af.json + kb/interactions/anticoagulant.json`)
**Gắn giả mạo `cor`/`loe` vào bảng liều thuốc & văn xuôi trong `kb/citations/af.json`, sai số bảng `Table 19` (đúng là `Table 18`), và quy tắc tương tác `ix.edoxaban_p_gp_inhibitors` ép giảm liều Edoxaban sai với `verapamil`**
1. **12 trích dẫn ESC 2024 tự bịa `cor`/`loe` không tồn tại trên trang PDF gốc**: `esc.af.2024.vka_only_mechanical_mitral`, `esc.af.2024.table11_doac_dosing`, `esc.af.2024.dabigatran_crcl_contra` (còn dịch sai `eGFR < 30 mL/min/1.73 m²` thành `CrCl < 30 mL/phút`), `esc.af.2024.dronedarone_permanent_af_contra`, `esc.af.2024.diltiazem_dose`, `esc.af.2024.non_dhp_ccb_contra_lvef40`, `esc.af.2024.verapamil_contra_lvef40`, `esc.af.2024.amiodarone_dose_regimen`, `esc.af.2024.table13_flecainide`, `esc.af.2024.table13_propafenone`, `esc.af.2024.table13_dronedarone_sotalol`, `esc.af.2024.flecainide_crcl_35`, cùng `esc.af.2024.aspirin_stop_when_oac` (trích Figure 10 thay vì **Recommendation Table 8, PDF p. 33**).
2. **Sai số bảng ở ACC/AHA 2023**: `acc.af.2023.periprocedural_warfarin_doac` ghi `"locator": "Table 19 / PDF p. 56"`, trong khi văn bản PDF trang 56 (tr. 164) in rõ **`TABLE 18`**.
3. **Mâu thuẫn nguy hiểm tại `ix.edoxaban_p_gp_inhibitors` (`anticoagulant.json:324-360`)**: đưa `"verapamil"` vào danh sách bắt buộc giảm liều Edoxaban xuống `30 mg`, trái ngược trực tiếp với **ESC 2024 Table 11 (PDF p. 32)**, **FDA Savaysa Section 7.3 (PDF p. 16)** và xung đột ngay trên màn hình với khuyến cáo `[CONTINUE] Edoxaban 60 mg` của module `af`!

---

### Nhóm MINOR & SUGGESTION

- **`[AF-R2-R1-12]` (`minor` · `kb/drugs/edoxaban.json`)**: `renal[0].crclFrom: 95` bao gồm cả `CrCl = 95.0 mL/phút`, lệch so với nhãn FDA Savaysa và ACC/AHA 2023 Table 13 (`> 50 to ≤ 95 mL/min` dùng 60 mg; chỉ chống chỉ định khi `> 95 mL/min`).
- **`[AF-R2-R1-13]` (`minor` · `af.inpatient.periprocedural_doac_hold`)**: Chưa cộng thêm `1–3 ngày` tạm ngừng trước phẫu thuật cho nhóm ức chế Xa khi suy thận nặng (`Rivaroxaban CrCl ≤ 30 mL/phút`, `Apixaban CrCl ≤ 25 mL/phút`) theo chú thích `*` của **ACC/AHA 2023 Table 18 (PDF p. 56)**.
- **`[AF-R2-R1-14]` (`minor` · `kb/thresholds/af.json + docs/modules/AF.md`)**: 4 ngưỡng giảm liều Apixaban trong `kb/thresholds/af.json` bị bỏ không do `doacDose.ts` hardcode trực tiếp `80 / 60 / 133`; `docs/modules/AF.md` dòng 16 ghi nhầm `questions.ts` thay vì `pathways.ts`; cần bổ sung giải thích tường minh cho `profileDiff.VN`.
- **`[AF-R2-R1-15]` (`suggestion` · `af.rhythm.early_rhythm_control_east_afnet4`)**: Đề xuất bổ sung gợi ý cân nhắc kiểm soát nhịp sớm trong vòng 12 tháng đầu kể từ khi chẩn đoán (`afType === 'first_diagnosed'`) ở bệnh nhân `CHA₂DS₂-VA ≥ 2` theo thử nghiệm **EAST-AFNET 4** (**ESC 2024 Rec Table 15 Class IIa, Level B**; **ACC/AHA 2023 Section 8.1 Rec 2 COR 2a, LOE B-R**).

---

## 4. Tổng Hợp Kiểm Tra 86 Trích Dẫn & Khác Biệt Đa Hồ Sơ (`INTL` / `VN` / `US`)

### 4.1. Kiểm định 86 trích dẫn trong `kb/citations/af.json`
- **Tồn tại `sourceId` & khớp nguyên văn `quote` trên PDF gốc**: **86/86 đạt (100%)** sau khi chuẩn hóa ký tự ngắt trang `\f`.
- **Độ chính xác `locator` & tính trung thực của `cor`/`loe`**: **73/86 đạt**, **13/86 cần chỉnh sửa** (chi tiết tại `AF-R2-R1-11`: 12 mục tự gắn `cor`/`loe` vào bảng liều thuốc/văn xuôi + 1 mục sai tên `Table 19` -> `Table 18`).

### 4.2. Ma trận đối chiếu Đa hồ sơ (`INTL` vs `VN` vs `US`)
| Chủ đề lâm sàng | `INTL` (ESC 2024) | `VN` (Thực hành VN / ESC 2024) | `US` (ACC/AHA 2023 + FDA) | Trạng thái hiện tại trong code |
|---|---|---|---|---|
| Thang điểm nguy cơ đột quỵ | `CHA₂DS₂-VA` (≥2 Class I; 1 Class IIa; 0 không OAC) | Kế thừa `CHA₂DS₂-VA` (cần ghi rõ `profileDiff.VN`) | `CHA₂DS₂-VASc` (Nam ≥2/Nữ ≥3 Class 1; Nam 1/Nữ 2 Class 2a) | Đã tách, còn lỗi nhỏ `threshold: 0` ở Nữ score 1 (`AF-R2-R1-07`) |
| Thuốc kháng Vitamin K (VKA) | Warfarin / Acenocoumarol / Phenprocoumon | **Acenocoumarol (Sintrom)** chiếm ưu thế + Warfarin | Warfarin | **Lỗi Critical**: Chưa có `acenocoumarol` (`AF-R2-R1-05`) |
| DOAC ở `CrCl < 15 mL/phút` / Lọc máu | Không khuyến cáo DOAC, ưu tiên VKA | Như `INTL` | Cân nhắc Warfarin hoặc Apixaban (Class 2b) | **Đạt** |
| Dabigatran ở `CrCl 15–29 mL/phút` | Chống chỉ định (`CrCl < 30`) | Chống chỉ định (`CrCl < 30`) | Cho phép `75 mg x 2 lần/ngày` (Table 13 / FDA) | **Lỗi Major**: Cấm cả ở `US` (`AF-R2-R1-07`) |
| Edoxaban + chất ức chế P-gp mạnh (`dronedarone`, `ketoconazole`...) | Giảm liều `30 mg x 1 lần/ngày` (Table 11) | Giảm liều `30 mg x 1 lần/ngày` | Giữ `60 mg x 1 lần/ngày` (Table 13 / FDA Section 7.3) | **Lỗi Critical**: Bỏ sót hoàn toàn ở `resolveAfDoacDose` (`AF-R2-R1-03`) |
| Edoxaban khi `CrCl > 95 mL/phút` | Thận trọng giảm hiệu quả | Thận trọng giảm hiệu quả | **FDA Boxed Warning: Chống chỉ định** | **Lỗi Critical**: Bị lọt ở người béo phì do `derive.ts` dùng ABW (`AF-R2-R1-04`) |
| Ngừng sớm Aspirin sau ACS/PCI kèm AF | `≤ 1 tuần` (Rec Table 24, Class I-A) | `≤ 1 tuần` | `1–4 tuần` (Section 6.8.1, COR 1-A) | **Lỗi Major**: Bỏ sót hoàn toàn quy tắc `recentAcs` (`AF-R2-R1-06`) |

---

## 5. Kết Luận Của Chuyên Gia R1
Module `af` đã có kiến trúc khung AF-CARE rõ ràng và đã xử lý nghiêm túc phần lớn các góp ý của Vòng 1, nhưng **chưa thể đạt chuẩn an toàn lâm sàng để thông qua Vòng 2** do còn tồn tại **5 lỗi Critical** và **6 lỗi Major** có khả năng gây tai biến tim mạch – huyết khối – xuất huyết nghiêm trọng trên thực hành lâm sàng. Đề nghị Module Owner khắc phục triệt để 11 lỗi Critical/Major và 3 lỗi Minor nêu trên trước khi trình duyệt Vòng 3.

**PHÁN QUYẾT VÒNG 2 (R1): `FAIL`**
