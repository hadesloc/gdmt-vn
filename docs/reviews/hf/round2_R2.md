# Báo Cáo Thẩm Định Độc Lập Vòng 2 — Module Suy Tim (`hf`)
## Vai trò: R2 – Chuyên Gia Dược Lâm Sàng & Kiểm Toán An Toàn Thuốc (Clinical Pharmacist & Drug Safety Auditor)

- **Module thẩm định**: `hf` (`src/modules/hf/*`, 17 tệp thuốc HF + 7 tệp thuốc dùng chéo trong `kb/drugs/*.json`, `kb/thresholds/hf.json`, `kb/citations/hf.json`, `kb/interactions/*.json`, `src/engine/safety/*`, `src/engine/mergeConflictGroups.ts`)
- **Vòng thẩm định**: **Vòng 2 (Độc lập tuyệt đối — tuân thủ nghiêm ngặt quy tắc không đọc bất kỳ tệp `round2_R1*` hay `round2_R3*` nào)**
- **Ngày thẩm định**: 2026-10-27
- **Phương pháp kiểm chứng**:
  1. Hậu kiểm đối chiếu từng mục một giữa `docs/reviews/hf/round1_R2.md` (`HF-R2-01` → `HF-R2-23` + `ASTHMA-R2-208`), báo cáo phản hồi của kỹ sư `docs/reviews/hf/round1_RESPONSE.md` và mã nguồn thực tế hiện tại.
  2. Chạy thực nghiệm trực tiếp hàm `evaluate()` qua Vite SSR trên **> 40 kịch bản lâm sàng dược học biên** (viên phối hợp liều cố định ACEi/SGLT2i, suy gan Child-Pugh C đang dùng đa trị liệu, sốc tim ngoại trú/chuyển tuyến, block AV độ II–III / suy nút xoang, dị ứng thuốc `patient.allergies` & `allergyAceiArb`, huyết áp giáp biên / CKD G3b đang duy trì liều thấp, thiếu nhịp ECG khi đang dùng Ivabradine, `HFimpEF` dùng kèm Diltiazem, Eplerenone + Fluconazole, Digoxin + Amiodarone/Clarithromycin/Cyclosporine, truyền sắt tĩnh mạch khi `Hb > 15 g/dL` / `TSAT 55%` / nhiễm khuẩn huyết, thời kỳ cho con bú).
  3. Đối chiếu nguyên văn từng trang PDF gốc trong `Medical_Library_2026` (`ESC_2026_Heart_Failure_Guideline.pdf`, `ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf`, `ACC_2026_ECDP_HFpEF.pdf`, `BYT_1857_Huong_dan_suy_tim_signed_8e519ed3f9.pdf`, và các nhãn thuốc gốc FDA / EMA SmPC: Entresto, Cardicor, Coreg, Aldactone, Inspra, Corlanor, Verquvo, Lanoxin, Kerendia, Farxiga).

---

## 1. Tóm Tắt Kết Quả Thẩm Định Vòng 2 (Executive Summary)

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã Finding | Ý nghĩa theo `docs/REVIEW_PROTOCOL.md` |
|---|---:|---|---|
| **Critical** | **6** | `HF-R2-R2-01` → `HF-R2-R2-06` | Nguy cơ gây tổn hại nặng / tử vong trực tiếp nếu thực hiện theo y lệnh của hệ thống |
| **Major** | **8** | `HF-R2-R2-07` → `HF-R2-R2-14` | Sai bậc liều/tương tác thuốc quan trọng, báo cáo khắc phục sai sự thật, vi phạm toàn vẹn trích dẫn `QA-2`/`QA-7`/`QA-10` |
| **Minor** | **3** | `HF-R2-R2-15` → `HF-R2-R2-17` | Thiếu cảnh báo điện giải/vô niệu lợi tiểu quai, chặn quá tay nitrat ngậm PRN với Vericiguat, thiếu khác biệt nhãn US/ESC của Dapagliflozin |
| **Suggestion** | **1** | `HF-R2-R2-18` | Đồng bộ định dạng chuỗi liều khởi đầu `24/26 mg` của Sacubitril/valsartan |
| **TỔNG CỘNG** | **18** | `round2_R2.json` | **PHÁN QUYẾT VÒNG 2: `FAIL`** |

### Ghi nhận tiến bộ thực chất sau Vòng 1:
- Đã tách mô-đun hóa `src/modules/hf/` rõ ràng theo kiểu hình (`hfref`, `hfmref`, `hfpef`, `hfimpef`) và chặn Fail-Closed khi `lvef === undefined` (`HF-R2-03`).
- Đã xóa bỏ triệt để các phép toán mượn ngưỡng sinh lý làm liều thuốc/xét nghiệm (`30 mg Spironolactone cách ngày`, `30 * 3 = 90` Ferritin, `50 / 5 = 10` Bisoprolol) và bổ sung `quantity` cho toàn bộ 75 ngưỡng trong `kb/thresholds/hf.json` (`HF-R2-01`, `HF-R2-04`, `HF-R2-15`).
- Đã thực thi tốt chỉ đạo `ASTHMA-R2-208` (không gợi ý Carvedilol ở bệnh nhân hen phế quản, tự động chuyển sang chẹn beta chọn lọc $\beta_1$), cập nhật Finerenone 10→20→40 mg ở HFmrEF/HFpEF (`HF-R2-10`), Semaglutide 2.4 mg / Tirzepatide 15 mg LOE B1 (`HF-R2-11`), đồng bộ ngưỡng `HR < 50 bpm` trong `vitalAndRenalGates.ts` (`HF-R2-14`), và đưa phác đồ ngoại trú `Hydralazine + ISDN` vào vận hành (`HF-R2-17`).

### Các rào cản an toàn nghiêm trọng khiến Module `hf` bắt buộc **`FAIL`** ở Vòng 2:
1. **Hai mục được báo cáo "ĐÃ KHẮC PHỤC" trong `round1_RESPONSE.md` nhưng hoàn toàn KHÔNG tồn tại trong mã nguồn / KB**:
   - **`HF-R2-13` (Suy gan `hepatic`)**: `round1_RESPONSE.md:15,78` và `docs/modules/HF.md:73` tuyên bố đã bổ sung `hepatic` (`childA`, `childB`, `childC`) cho **17/17** thuốc HF, nhưng thực tế **0/17 tệp JSON có trường `hepatic`**! Trên `evaluate()`, bệnh nhân **xơ gan mất bù Child-Pugh C** vẫn bị kê mới `START Sacubitril/valsartan` và bị ra lệnh **`UPTITRATE` đồng loạt Carvedilol, Sacubitril/valsartan, Ivabradine, Eplerenone, Vericiguat** (`HF-R2-R2-02`).
   - **`HF-R2-23` (Tính liều sắt tĩnh mạch theo cân nặng & Hb)**: `round1_RESPONSE.md:88` tuyên bố đã cập nhật `hf.amt.iv_iron` theo `weight` và `Hb`, nhưng `rules.devices_iron.ts` hoàn toàn không đọc `weight` hay `hb`, vẫn kê truyền sắt ngay cả khi **`Hb = 16.2 g/dL`**, **`TSAT = 55%` (quá tải sắt)**, **nhiễm khuẩn huyết cấp** và in ra chuỗi liều ghép hỏng (`HF-R2-R2-11`).
2. **Bỏ lọt viên phối hợp liều cố định (FDC) chứa ACEi gây mất hoàn toàn cổng nghỉ 36 giờ (nguy cơ phù mạch tử vong)**: Bệnh nhân đang uống `perindopril_amlodipine` (Coveram) hoặc `perindopril_indapamide` (Preterax) bị ra lệnh `START Sacubitril/valsartan` uống chồng ngay lập tức với `washoutHours = undefined` và `0` cảnh báo tương tác (`HF-R2-R2-01`).
3. **Mù hoàn toàn dị ứng thuốc (`patient.allergies` & `allergyAceiArb` trong `hf.fmt.arni`)**: Bệnh nhân có `allergyAceiArb: true` hoặc `allergies: ['valsartan', 'furosemide']` vẫn bị kê `START Sacubitril/valsartan` và `START Furosemide` (`HF-R2-R2-03`).
4. **Ghi đè liều đích lên thẻ `CONTINUE` ở bệnh nhân không đủ điều kiện tăng liều**: Thẻ `[CONTINUE] Tiếp tục duy trì Spironolactone` ở CKD G3b (`eGFR = 35`) in `dose: "50 mg x 1 lần/ngày"` (gấp đôi trần thận 25 mg!), và `[CONTINUE] Sacubitril/valsartan` khi `SBP = 96 mmHg` in `dose: "97/103 mg x 2 lần/ngày"` (`HF-R2-R2-05`).
5. **10 mã chống chỉ định tim mạch trong KB thuốc HF là mã chết + `UPTITRATE` chẹn beta khi sốc tim ngoại trú + kê chồng 2 chẹn beta với `metoprolol_tartrate`** (`HF-R2-R2-04`), và **vi phạm Fail-Closed phát lệnh `STOP Ivabradine` giả khi chưa nhập nhịp ECG + `UPTITRATE Ivabradine` chung với `Diltiazem` ở `HFimpEF`** (`HF-R2-R2-06`).
6. **Vi phạm toàn vẹn trích dẫn `QA-2`/`QA-7`/`QA-10`**: 6 tệp sản xuất trong `src/modules/hf/` vẫn lấy trích dẫn từ `kb/citations/_sample.json`, 5 ngưỡng trong `kb/thresholds/hf.json` gắn trích dẫn của thuốc khác, và 12/17 tệp thuốc HF gắn câu `quote` không chứa thông tin lâm sàng đang khẳng định (`HF-R2-R2-14`).

---

## 2. Bảng Hậu Kiểm Độc Lập 23 Phát Hiện Vòng 1 (`HF-R2-01` → `HF-R2-23`) & `ASTHMA-R2-208`

| Mã Vòng 1 | Mức độ V1 | Báo cáo của Kỹ sư (`round1_RESPONSE.md`) | Kết quả hậu kiểm thực tế của R2 ở Vòng 2 | Tham chiếu Vòng 2 |
|---|---|---|---|---|
| `ASTHMA-R2-208` | Critical | Đã khắc phục triệt để | **ĐẠT** — Khi có `asthma`/`priorAsthma`, chỉ `CONSIDER` hoặc `SWITCH` sang `bisoprolol`/`metoprolol_succinate`, không xuất chuỗi `"Carvedilol"`. | — |
| `HF-R2-01` | Critical | Đã khắc phục (`12.5 mg/ngày` hoặc `25 mg cách ngày` ở G3b) | **ĐẠT** — Cả hai bảng trong `src/modules/hf/matrices.ts:71,205` đã hiển thị đúng `"12.5 mg/ngày (hoặc 25 mg cách ngày)"`. | — |
| `HF-R2-02` | Critical | Đã khắc phục (quét nhóm MRA & BB, dùng `dose(id, 'target')`) | **MỘT PHẦN (CÒN LỖ HỔNG NGHIÊM TRỌNG)** — Đã hết kê chồng `eplerenone + spironolactone`, nhưng: (1) bỏ sót `metoprolol_tartrate` gây kê chồng `bisoprolol + metoprolol_tartrate`; (2) `parseNumericDoseValue` mù tần suất coi `Carvedilol 25 mg x 1 lần/ngày` là đạt đích; (3) chấp nhận sai `Finerenone` làm MRA cho HFrEF; (4) thẻ `CONTINUE` ghi đè liều đích. | `HF-R2-R2-04`, `HF-R2-R2-05`, `HF-R2-R2-08`, `HF-R2-R2-09` |
| `HF-R2-03` | Critical | Đã khắc phục (tách kiểu hình LVEF + Fail-Closed) | **ĐẠT** — `getHfPhenotype(ctx)` tách chuẩn `hfref`/`hfmref`/`hfpef`/`hfimpef` và phát `missing_input_lvef` khi thiếu `lvef`. | — |
| `HF-R2-04` | Critical | Đã khắc phục (`ferritin < 100` hoặc `100–299 & TSAT < 20%`) | **ĐẠT (về ngưỡng chẩn đoán)** — Ferritin `90–99 ng/mL` đã được nhận diện đúng qua `hf.iron.ferritin_abs_max = 100`. | — |
| `HF-R2-05` | Critical | Đã khắc phục (quét `ACEI_IDS`, cổng `K+ > 5.4`, `eGFR < 15`) | **KHÔNG ĐẠT (HỒI QUY / LỖ HỔNG CRITICAL)** — (1) Bỏ lọt hoàn toàn FDC chứa ACEi (`perindopril_amlodipine`, `perindopril_indapamide`...) -> kê `START ARNI` ngay không washout 36h; (2) Bỏ quên `allergyAceiArb`; (3) ARB liều thấp vẫn kê `49/51 mg`; (4) Mã nguồn dùng `k > 5.5` (khác `5.4` trong báo cáo) và vẫn `START` ARNI mới khi `K+ = 5.4 mmol/L`. | `HF-R2-R2-01`, `HF-R2-R2-03`, `HF-R2-R2-07` |
| `HF-R2-06` | Critical | Đã khắc phục (`contra` khi `< 30` cho sMRA; chặn Vericiguat `< 15`) | **ĐẠT** — `spironolactone.json`, `eplerenone.json` đã đổi `eGFR < 30` sang `contra` (phát lệnh `STOP` đúng) và `vericiguat` đã chặn `eGFR < 15`. | — |
| `HF-R2-07` | Critical | Đã khắc phục (chặn lợi tiểu TM khi sốc/đẳng tích; tách liều truyền TM giãn mạch) | **ĐẠT** — `rules.inpatient.ts` đã chặn lợi tiểu TM khi `euvolaemic` / sốc `SBP < 90` và viết đúng tốc độ truyền mcg/phút cho giãn mạch tĩnh mạch. | — |
| `HF-R2-08` | Critical | Đã khắc phục trong HF + ghi nhận chéo `interactions.json` | **MỘT PHẦN (CÒN LỖ HỔNG MAJOR/CRITICAL)** — Đã chặn PDE-5i × Nitrate/Vericiguat và CYP3A4 mạnh × Eplerenone/Ivabradine/Finerenone ở tầng luật, nhưng **bỏ sót hoàn toàn**: (1) `Ivabradine + Diltiazem/Verapamil` (tăng liều Ivabradine chung với Diltiazem ở HFimpEF!); (2) `Eplerenone + CYP3A4 vừa (Fluconazole/Verapamil)` vẫn tăng lên `50 mg` (vượt trần 25 mg FDA) & thiếu `eplerenone` trong `renal_rasi.json`; (3) thiếu P-gp (`Clarithromycin`/`Cyclosporine`/`Itraconazole`) với `Digoxin` & sai `maxDose: 0.125 mg` với `Amiodarone`; (4) thiếu `MRA + Trimethoprim`. | `HF-R2-R2-06`, `HF-R2-R2-09`, `HF-R2-R2-10` |
| `HF-R2-09` | Major | Đã khắc phục 100% trích dẫn trên 17 thuốc & 75 ngưỡng | **BÁO CÁO KHÔNG ĐÚNG THỰC TẾ** — 6 tệp `src/modules/hf/*.ts` vẫn dùng `_sample.json`; 5 ngưỡng trong `kb/thresholds/hf.json` gắn trích dẫn nhầm hoạt chất khác; 12/17 tệp thuốc HF có `quote` không chứa thông tin lâm sàng đang viện dẫn. | `HF-R2-R2-14` |
| `HF-R2-10` | Major | Đã khắc phục Finerenone 10→20→40 mg & ma trận HFpEF | **ĐẠT (ở HFmrEF/HFpEF)** — `finerenone.json`, `rules.hfpef.ts` và `matrices.ts` đã cập nhật đúng bậc liều 10→20 mg và 20→40 mg Class I ESC 2026 (tuy nhiên lại để lọt `finerenone` sang `rules.hfref.ts` ở HFrEF — xem `HF-R2-R2-09`). | `HF-R2-R2-09` |
| `HF-R2-11` | Major | Đã khắc phục Semaglutide/Tirzepatide Class IIa LOE B1 | **ĐẠT** — Cả `rules.hfpef.ts`, `semaglutide.json` (Wegovy 2.4 mg) và `tirzepatide.json` (tối đa 15 mg/tuần) đều đã chuẩn xác. | — |
| `HF-R2-12` | Major | Đã khắc phục liều tuổi/thận của Digoxin, Ivabradine, Vericiguat | **MỘT PHẦN** — Đã giảm liều Ivabradine `2.5 mg BID` khi `>= 75` tuổi và Digoxin `62.5 mcg` khi `>= 70` tuổi / `eGFR < 60`, nhưng: (1) Ivabradine phát lệnh `STOP` giả khi `rhythm === undefined`; (2) Digoxin không giảm liều khi dùng kèm `amiodarone`/P-gp inhibitor và không chặn `wpw_afib`; (3) các mã CCĐ trong JSON là mã chết. | `HF-R2-R2-04`, `HF-R2-R2-06`, `HF-R2-R2-10` |
| `HF-R2-13` | Major | *"Bổ sung đầy đủ trường phân tầng suy gan `hepatic` (`childA`, `childB`, `childC`) cho **17/17** thuốc HF"* | **BÁO CÁO SAI SỰ THẬT (CRITICAL)** — **0/17** tệp thuốc HF có trường `hepatic`! Bệnh nhân Child-Pugh C vẫn bị kê `START ARNI` và `UPTITRATE` đồng loạt Carvedilol, ARNI, Ivabradine, Eplerenone, Vericiguat! | `HF-R2-R2-02` |
| `HF-R2-14` | Major | Đã khắc phục ngưỡng `HR < 50 bpm` | **ĐẠT** — `vitalAndRenalGates.ts:491` và `kb/thresholds/hf.json` đã đồng bộ thống nhất ngưỡng `< 50 bpm`. | — |
| `HF-R2-15` | Major | Đã bổ sung 100% trường `quantity` cho 75 ngưỡng | **ĐẠT** — 75/75 ngưỡng trong `kb/thresholds/hf.json` có đầy đủ `quantity` và dùng `thFor()`. | — |
| `HF-R2-16` | Major | Đã phủ kín dải thận `< 15`, `maxDose`, `components` ARNI, `classes` | **ĐẠT** — 17/17 thuốc HF có dải thận `< 15`, `maxDose`, `sacubitril_valsartan` có `components`, và các thuốc dùng chéo đã có `classes`. | — |
| `HF-R2-17` | Major | Đã bổ sung luật ngoại trú `Hydralazine + ISDN` | **ĐẠT** — `hf.fmt.rasi_intolerant_fallback` (`rules.hfref.ts:132`) đã hoạt động (lưu ý sửa lỗi đồng phát với `START ARNI` khi `allergyAceiArb = true` tại `HF-R2-R2-03`). | `HF-R2-R2-03` |
| `HF-R2-18` | Minor | Đã sửa cột G5 của ARNI trong `matrices.ts` & mô tả thận G4 | **ĐẠT** — Cột G5 và `sacubitril_valsartan.json` đã mô tả nhất quán. | — |
| `HF-R2-19` | Minor | Ghi nhận chéo Agent E (`dapagliflozin` US `25` vs ESC `20` & ngưng trước mổ) | **CHƯA KHẮC PHỤC** — `evaluateHfSglt2i` vẫn áp cứng `eGFR >= 20` ở profile `US` và chưa có quy tắc tạm ngưng ≥ 3 ngày trước đại phẫu. | `HF-R2-R2-17` |
| `HF-R2-20` | Minor | Đã chuẩn hóa `pregnancy`/`lactation` và giữ nguyên lệnh `STOP` trong thai kỳ | **MỘT PHẦN** — Lệnh `STOP` trong thai kỳ đã giữ đúng (`gates.ts:91`), nhưng **cổng an toàn cho con bú (`lactating`/`breastfeeding`) hoàn toàn chưa được triển khai** trong engine và module `hf`! | `HF-R2-R2-13` |
| `HF-R2-21` | Minor | Đã hiệu đính biệt dược & hàm lượng tại Việt Nam | **ĐẠT** — Đã cập nhật `Monofer`, `Betaloc ZOK 100 mg`, `Concor Cor`, `Coryol`/`Talliton`, `Aldactone`. | — |
| `HF-R2-22` | Suggestion | Đã viết lại `formatHfDose` không lặp `x x ` | **ĐẠT (còn 1 chi tiết nhỏ)** — Hết lỗi `x x `, chỉ còn tiền tố `"Viên nén bao phim 24/26 mg (50 mg)"` của ARNI liều thấp. | `HF-R2-R2-18` |
| `HF-R2-23` | Suggestion | *"Đã bổ sung hướng dẫn chọn liều truyền TM theo cân nặng (`< 70` vs `>= 70 kg`) và Hemoglobin"* | **BÁO CÁO SAI SỰ THẬT (MAJOR)** — `rules.devices_iron.ts` hoàn toàn không đọc `weight` hay `hb`, kê truyền sắt cả khi `Hb = 16.2 g/dL`, `TSAT = 55%`, `sepsis`, kèm chuỗi `dose` bị ghép hỏng. | `HF-R2-R2-11` |

---

## 3. Chi Tiết 18 Phát Hiện Vòng 2 (`HF-R2-R2-01` → `HF-R2-R2-18`)

### A. Nhóm CRITICAL (`6` phát hiện: `HF-R2-R2-01` → `HF-R2-R2-06`)

#### `[HF-R2-R2-01]` (CRITICAL | `rule` | `hf.fmt.arni` & `sacubitril_valsartan` — Bỏ lọt viên phối hợp liều cố định chứa ACEi gây mất hoàn toàn khoảng nghỉ 36 giờ → Phù mạch thanh quản tử vong)
- **Mô tả vấn đề**: Tại Việt Nam, tỷ lệ rất lớn bệnh nhân tăng huyết áp – suy tim ngoại trú đang dùng viên phối hợp liều cố định (FDC) chứa ức chế men chuyển như **`perindopril_amlodipine`** (*Coveram*), **`perindopril_indapamide`** (*Preterax* / *Coversyl Plus*), **`perindopril_amlodipine_indapamide`** (*Triplixam*), **`enalapril_hydrochlorothiazide`** hoặc **`lisinopril_hydrochlorothiazide`**. Tuy nhiên:
  1. `ACEI_IDS` trong `src/modules/hf/helpers.ts:24-27` chỉ khai báo 10 chuỗi hoạt chất đơn lẻ và `findCurrentMed(ctx, ACEI_IDS)` (`helpers.ts:51-54`) chỉ so khớp bằng `===`.
  2. Thư mục `kb/drugs/` chưa khai báo các FDC ACEi/ARB này, đồng thời `src/engine/safety/drugClassify.ts` và `src/engine/safety/interactions.ts` không phân rã thành phần hoạt chất từ `drugId` ghép.
- **Bằng chứng thực nghiệm `evaluate()` trực tiếp**:
  - **Đầu vào (`Case A1b/A1c` & `Part2 Case 1`)**: Nam 62 tuổi, HFrEF (`LVEF = 30%, NYHA II, SBP = 128 mmHg, HR = 72 bpm, K+ = 4.4 mmol/L, SCr = 1.0 mg/dL`), `currentMeds: [{ drugId: 'perindopril_amlodipine', dose: '5/5 mg', freq: '1 lần/ngày' }]`.
  - **Đầu ra thực tế**:
    - `rec_hf_arni`: **`[START] Khởi trị Sacubitril/valsartan (ARNI) nền tảng (liều thấp 24/26 mg x 2 lần/ngày)`** với **`washoutHours: undefined`**!
    - **0 khuyến cáo `SWITCH` hay `HOLD`** đối với `perindopril_amlodipine`.
    - `plan.alerts`: **`0` cảnh báo trùng lặp nhóm** và **`0` cảnh báo tương tác `ix.acei_arni_washout`**! Bệnh nhân sẽ uống chồng Entresto ngay trong ngày đang còn Perindopril lưu hành trong máu.
- **Bằng chứng tài liệu gốc**:
  - `09_Nhan_Thuoc/FDA/FDA_label_sacubitril_valsartan.pdf`, **trang 4** (§2.1) & **trang 8** (§4 *Contraindications*):
    > *"ENTRESTO is contraindicated: ... with concomitant use of angiotensin-converting enzyme (ACE) inhibitors. **Do not administer within 36 hours of switching from or to an ACE inhibitor** [see Drug Interactions (7.1)]."*
  - `01_Noi_Khoa/Tim_Mach/ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf`, **trang 12** (Table S5):
    > *"Contraindications: ... Concomitant ACE-I use (**must leave >=36 h washout window between last ACE-I dose and first ARNI dose to minimize risk of angio-oedema**)."*
- **Khuyến nghị sửa**: Bổ sung các FDC ACEi/ARB phổ biến vào `kb/drugs/` với đầy đủ `components` & `classes`, đồng thời cập nhật `findCurrentMed` (`helpers.ts`), `drugClassify.ts`, `gates.ts` và `interactions.ts` kiểm tra cả `drug(id).components` lẫn tách token theo dấu `'_'` để nhận diện mọi chế phẩm chứa ACEi/ARB, bắt buộc phát lệnh `SWITCH`/`HOLD` kèm `washoutHours: 36`.

---

#### `[HF-R2-R2-02]` (CRITICAL | `drug` | 17 thuốc HF & `evaluateHepaticSafety` — Báo cáo sai sự thật về `HF-R2-13` (`hepatic` = `undefined` ở 17/17 thuốc HF) & Ra lệnh `START`/`UPTITRATE` thuốc chống chỉ định trên bệnh nhân xơ gan mất bù Child-Pugh C)
- **Mô tả vấn đề**:
  1. `docs/reviews/hf/round1_RESPONSE.md:15,78` và `docs/modules/HF.md:73` khẳng định đã bổ sung đầy đủ trường `hepatic` (`childA`, `childB`, `childC`) cho **17/17** thuốc thuộc sở hữu HF. Kiểm tra thực nghiệm toàn bộ 17 tệp `kb/drugs/*.json` của HF chứng minh **0/17 tệp có thuộc tính `hepatic`** (`hepatic === undefined` 100%), và interface `DrugEntry` tại `src/kb-types/index.ts:240-264` thậm chí chưa định nghĩa trường này!
  2. Tại `src/engine/safety/clinicalStates.ts:180-194`, hàm `evaluateHepaticSafety` bỏ sót toàn bộ nhóm thuốc suy tim chuyển hóa mạnh qua gan (`sacubitril_valsartan`, `carvedilol`, `nebivolol`, `ivabradine`, `eplerenone`, `vericiguat`, `torsemide`, `bumetanide`).
  3. Tại `src/modules/hf/rules.hfref.ts:113`, `hasCondition(ctx, 'liverDisease')` coi mọi bệnh lý gan (kể cả Child-Pugh C / xơ gan mất bù) chỉ cần giảm nửa liều khởi đầu ARNI (`24/26 mg`), và khi bệnh nhân đang dùng thuốc (`activeArni`, `activeBb`, `activeIva` ở `rules.hfref_amt.ts:25,32`, `activeMra`, `activeVer`) thì không có bất kỳ hàng rào chặn suy gan nặng nào!
- **Bằng chứng thực nghiệm `evaluate()` trực tiếp**:
  - **Ca `A4a`** (HFrEF chưa điều trị, `conditions: { hf: true, decompensatedCirrhosis: true, liverDisease: true }`, `customInputs: { childPugh: 'C' }`): Engine xuất **`[START] Khởi trị Sacubitril/valsartan (liều thấp 24/26 mg x 2 lần/ngày)`**!
  - **Ca `A4b`** (HFrEF tiến triển sang xơ gan mất bù `decompensatedCirrhosis: true, childPugh: 'C'` trên nền đang uống `sacubitril_valsartan 49/51 mg BID`, `carvedilol 12.5 mg BID`, `ivabradine 5 mg BID`, `eplerenone 25 mg OD`, `vericiguat 2.5 mg OD`): Engine phát đồng loạt **5 y lệnh tăng liều**:
    - **`[UPTITRATE] Tăng liều Carvedilol`** (chống chỉ định tuyệt đối ở suy gan nặng!)
    - **`[UPTITRATE] Tăng liều Sacubitril/valsartan lên 97/103 mg x 2 lần/ngày`** (không khuyến cáo ở Child-Pugh C!)
    - **`[UPTITRATE] Tăng liều Ivabradine lên 7.5 mg x 2 lần/ngày`** (chống chỉ định tuyệt đối ở suy gan nặng!)
    - **`[UPTITRATE] Tăng liều Eplerenone lên 50 mg x 1 lần/ngày`**
    - **`[UPTITRATE] Tăng liều Vericiguat lên 10 mg x 1 lần/ngày`**
    - Và **`0` lệnh `STOP`**!
- **Bằng chứng tài liệu gốc**:
  - `09_Nhan_Thuoc/FDA/FDA_label_sacubitril_valsartan.pdf`, **trang 2 & 15** (§2.8 & §8.6): *"Severe Hepatic Impairment (Child-Pugh C): **Use of ENTRESTO is not recommended**."* (AUC sacubitrilat và valsartan tăng gấp > 2 lần ở suy gan vừa, chưa nghiên cứu ở Child-Pugh C).
  - `09_Nhan_Thuoc/FDA/FDA_label_ivabradine.pdf`, **trang 1 & 5** (§4 *Contraindications*): *"Corlanor is contraindicated in patients with: ... **Severe hepatic impairment** [see Use in Specific Populations (8.6)]."*
  - `09_Nhan_Thuoc/FDA/FDA_label_carvedilol.pdf`, §4 *Contraindications*: Chống chỉ định tuyệt đối ở bệnh nhân suy gan biểu hiện lâm sàng / suy gan nặng.
  - `09_Nhan_Thuoc/FDA/FDA_label_eplerenone.pdf`, **trang 13** (§8.6): Chưa có dữ liệu an toàn ở suy gan nặng Child-Pugh C; `09_Nhan_Thuoc/FDA/FDA_label_finerenone.pdf`, **trang 10** (§8.6): *"Avoid use of Kerendia in patients with severe hepatic impairment (Child Pugh C)."*
- **Khuyến nghị sửa**: Bổ sung kiểu `HepaticRule` vào `src/kb-types/index.ts`, cập nhật thực sự trường `hepatic` kèm trích dẫn nhãn gốc cho cả 17 tệp JSON thuốc HF, và nối cổng suy gan (`decompensatedCirrhosis` / `childPugh === 'C'`) vào cả `clinicalStates.ts`, `reviewMeds.ts`, `rules.hfref.ts` và `rules.hfref_amt.ts` để `STOP`/`AVOID` các thuốc chống chỉ định ở Child-Pugh C.

---

#### `[HF-R2-R2-03]` (CRITICAL | `rule` | `hf.fmt.arni` & `gates.ts` — Không kiểm tra `patient.allergies` và bỏ quên `conditions.allergyAceiArb` trong `hf.fmt.arni` → Kê `START Sacubitril/valsartan` & `Furosemide` cho bệnh nhân dị ứng)
- **Mô tả vấn đề**:
  1. Toàn bộ `src/engine/safety/gates.ts`, `organAndCrisisGates.ts`, `vitalAndRenalGates.ts`, `reviewMeds.ts` và `src/modules/hf/*.ts` hoàn toàn **không kiểm tra mảng `patient.allergies`** đối với các thuốc tim mạch (ngoại trừ kiểm tra hẹp dị ứng đạm sữa bò cho thuốc hít hô hấp tại `gates.ts:315`).
  2. Ngay trong `src/modules/hf/rules.hfref.ts:34`, luật `hf.fmt.arni` chỉ chặn `isPregnant(ctx) || hasCondition(ctx, 'priorAngioedema')` mà **quên hoàn toàn `hasCondition(ctx, 'allergyAceiArb')`**, trong khi luật dự phòng `hf.fmt.rasi_intolerant_fallback` ở dòng `135` ngay bên dưới lại dùng chính `hasCondition(ctx, 'allergyAceiArb')` để kích hoạt `Hydralazine + ISDN`!
- **Bằng chứng thực nghiệm `evaluate()` trực tiếp**:
  - **Ca `A3`** (`conditions: { hf: true, allergyAceiArb: true }`): Engine xuất mâu thuẫn trực diện ngay trên cùng một phác đồ:
    - **`[START] Khởi trị Sacubitril/valsartan (ARNI) nền tảng`** (`priority: 95`)
    - VÀ **`[CONSIDER] Cân nhắc phối hợp Hydralazine + Isosorbide dinitrate khi không dung nạp ARNI/ACEi/ARB`** (`priority: 76`)!
  - **Ca `Part2 Case 12`** (`allergies: ['valsartan', 'sacubitril', 'furosemide', 'sulfonamide']`, sung huyết `overt`): Engine xuất **`[START] Sacubitril/valsartan`** (chứa Valsartan!) và **`[START] Furosemide 20–40 mg`** với `0` cảnh báo dị ứng!
- **Bằng chứng tài liệu gốc**:
  - `09_Nhan_Thuoc/FDA/FDA_label_sacubitril_valsartan.pdf`, **trang 8** (§4 *Contraindications*): *"ENTRESTO is contraindicated: • **in patients with hypersensitivity to any component**."*
  - `01_Noi_Khoa/Tim_Mach/ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf`, **trang 12** (Table S5) & **trang 16** (Table S7): *"Contraindications: Known allergic reaction/other adverse reaction (drug-specific)."*
- **Khuyến nghị sửa**: Chặn `sacubitril_valsartan` trong `rules.hfref.ts:34` khi `hasCondition(ctx, 'allergyAceiArb')` (hoặc dị ứng thành phần trong `patient.allergies`), đồng thời triển khai bộ đối chiếu dị ứng thuốc chuẩn hóa trong `gates.ts` và `reviewMeds.ts` khớp `patient.allergies` với `id`, `inn`, `components`, `vnBrands` và nhóm cấu trúc.

---

#### `[HF-R2-R2-04]` (CRITICAL | `rule` | `hf.fmt.bb`, `gates.ts` & `mergeConflictGroups.ts` — `UPTITRATE` chẹn beta khi sốc tim/đang truyền vận mạch, 10 mã chống chỉ định tim mạch là mã chết, và kê chồng 2 chẹn beta với `metoprolol_tartrate`)
- **Mô tả vấn đề**:
  1. **Sốc tim / đang truyền thuốc vận mạch–tăng co bóp (`cardiogenicShock` / `onInotropes`)**: Tại `src/modules/hf/rules.hfref.ts:191`, điều kiện `if (!activeBb && (congestion === 'overt' || isAcutelyDecompensated(ctx)))` chỉ kiểm tra khi **chưa dùng** chẹn beta (`!activeBb`). Nếu bệnh nhân đang dùng `bisoprolol 2.5 mg` ở phòng khám cấp cứu/chuyển tuyến có cờ `cardiogenicShock: true` hoặc `onInotropes: true` (huyết áp tâm thu được thuốc vận mạch nâng lên `95 mmHg`), luật đi thẳng xuống nhánh tăng liều!
  2. **10 mã chống chỉ định trong JSON thuốc HF là mã chết (dead code)**: Các tệp JSON của thuốc HF đã khai báo các mã `av_block_2_3`, `sick_sinus_syndrome`, `cardiogenic_shock`, `severe_bradycardia`, `acute_decompensated_hf`, `severe_hepatic_impairment`, `ventricular_fibrillation`, `wpw_afib`, `anuria`, `iron_overload`, nhưng kiểm tra `src/engine/safety/gates.ts:294-335` và `src/engine/safety/reviewMeds.ts:398-411` cho thấy **không một mã nào trong 10 mã này được viết nhánh kiểm tra**!
  3. **Kê trùng lặp 2 thuốc chẹn beta với `metoprolol_tartrate`**: `HF_BB_IDS` (`helpers.ts:15`) chỉ chứa 4 BB suy tim, còn `mergeConflictGroups.ts:228` (`beta_blockers`) liệt kê `metoprolol_succinate`, `atenolol`, `propranolol`, `sotalol` nhưng **bỏ sót `metoprolol_tartrate` / `metoprolol` / `nadolol` / `timolol`**. (Ngoài ra ở nội trú sốc tim `SBP = 82 mmHg`, `hf.inpatient.continue_bb` tại `rules.inpatient.ts:116` cũng bỏ sót không `HOLD` nếu bệnh nhân đang uống `atenolol` hoặc `metoprolol_tartrate`).
- **Bằng chứng thực nghiệm `evaluate()` trực tiếp**:
  - **Ca `B3`** (`setting: 'outpatient', customInputs: { cardiogenicShock: true, onInotropes: true }, sbp: 95, hr: 88`, đang dùng `bisoprolol 2.5 mg`): Engine xuất **`[UPTITRATE] Tăng liều Bisoprolol hướng tới liều đích 10 mg`**!
  - **Ca `B5`** (`av_block_2_3: true, sick_sinus_syndrome: true, hr: 62`, chưa đặt máy tạo nhịp, đang dùng `bisoprolol 2.5 mg`): Engine xuất **`[UPTITRATE] Tăng liều Bisoprolol`**!
  - **Ca `B4b` & `Part2 Case 3`** (HFrEF đang uống `metoprolol_tartrate 50 mg x 2 lần/ngày`): Engine xuất **`[START] Khởi trị chẹn beta suy tim: Bisoprolol 1.25 mg x 1 lần/ngày`** mà **không có lệnh `SWITCH` và `0` cảnh báo trùng lặp trong `plan.alerts`**!
- **Bằng chứng tài liệu gốc**:
  - `01_Noi_Khoa/Tim_Mach/ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf`, **trang 14** (Table S6): *"Contraindications: • Second- or third-degree AV block (in the absence of a permanent pacemaker). • Sick sinus syndrome (in the absence of a permanent pacemaker)."*
  - `09_Nhan_Thuoc/EMA/bisoprolol_Cardicor_SmPC.pdf`, §4.3 *Contraindications*: Chống chỉ định tuyệt đối trong suy tim cấp hoặc đợt mất bù cần thuốc tăng co bóp tĩnh mạch, sốc tim, block AV độ II–III, hội chứng suy nút xoang.
- **Khuyến nghị sửa**: (1) Trong `rules.hfref.ts`, kiểm tra `isShockOrInotrope(ctx)` cho cả nhánh `activeBb` để phát `HOLD`/`STOP` ngay lập tức, và không `UPTITRATE` khi `congestion === 'overt'`; (2) Nối đầy đủ 10 mã `contraindications` vào `gates.ts:294` & `reviewMeds.ts:398` (miễn trừ `av_block_2_3`/`sick_sinus_syndrome` khi `hasPacemaker === true`); (3) Quét đầy đủ các chẹn beta ngoài nhóm HFrEF (`metoprolol_tartrate`, `atenolol`, `propranolol`, `nadolol`, `sotalol`, `labetalol`, `timolol`) trong `helpers.ts`, `rules.hfref.ts` (`SWITCH`), `rules.inpatient.ts` (`HOLD` khi sốc) và `mergeConflictGroups.ts:228`.

---

#### `[HF-R2-R2-05]` (CRITICAL | `rule` | `hf.fmt.arni`, `hf.fmt.bb`, `hf.fmt.mra` — Thẻ `CONTINUE` ghi đè liều đang dùng bằng liều đích tối đa `50 mg` Spironolactone ở CKD G3b & `97/103 mg` ARNI khi hạ huyết áp!)
- **Mô tả vấn đề**: Khi bệnh nhân đang dùng liều thấp/trung bình và **không được phép tăng liều** (ví dụ `SBP = 96 mmHg < 100` đối với ARNI; `eGFR = 35 mL/min/1.73m²` đạt trần thận `25 mg/ngày` đối với Spironolactone; đang sung huyết đối với Bisoprolol), mã nguồn tại `src/modules/hf/rules.hfref.ts:105,219,272` đổi nhãn hành động sang `act = 'CONTINUE'` ("Tiếp tục duy trì...") nhưng lại **dùng chung chuỗi `dose` của nhánh `UPTITRATE` / `START`**!
- **Bằng chứng thực nghiệm `evaluate()` trực tiếp (`Case B2`)**:
  - **Đầu vào**: Bệnh nhân HFrEF (`LVEF 30%, SBP = 96 mmHg, HR = 68 bpm, K+ = 4.6 mmol/L, eGFR = 35 mL/min/1.73m², congestion = 'overt'`), đang uống ổn định `sacubitril_valsartan 24/26 mg BID`, `bisoprolol 5 mg OD`, `spironolactone 25 mg OD`.
  - **Đầu ra thực tế**:
    1. `rec_hf_arni`: `action: 'CONTINUE'`, `title: "Tiếp tục duy trì Sacubitril/valsartan"`, nhưng **`dose: "97/103 mg x 2 lần/ngày (uống)"`** — **tăng gấp 4 lần liều ngay lúc `SBP = 96 mmHg`**!
    2. `rec_hf_mra`: `action: 'CONTINUE'`, `title: "Tiếp tục duy trì Spironolactone"`, nhưng **`dose: "50 mg x 1 lần/ngày (uống)"`** — **vượt gấp đôi trần an toàn thận `25 mg/ngày` ở CKD G3b (`eGFR = 35`), nguy cơ tăng kali máu ngừng tim**!
    3. `rec_hf_bb`: `action: 'CONTINUE'`, `title: "Tiếp tục duy trì Bisoprolol"`, nhưng **`dose: "1.25 mg x 1 lần/ngày (uống); đích 10 mg x 1 lần/ngày (uống)"`** — **ghi lùi liều đang uống 5 mg về 1.25 mg**!
- **Bằng chứng tài liệu gốc**: `09_Nhan_Thuoc/FDA/FDA_label_spironolactone.pdf` §2.2 & `kb/drugs/spironolactone.json:29` (ở `eGFR 30–50 mL/min/1.73 m²`, liều duy trì tối đa không quá `25 mg/ngày`); `ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf` trang 13, 18 (Tables S5 & S8).
- **Khuyến nghị sửa**: Trong `rules.hfref.ts` (và `rules.hfpef.ts`), khi `act === 'CONTINUE'`, bắt buộc xuất đúng liều hiện tại từ `activeMed` (kèm chú thích lý do giữ liều / trần liều thận), tuyệt đối không gán `dose(..., 'target')` hay `dose(..., 'start')` vào thẻ `CONTINUE`.

---

#### `[HF-R2-R2-06]` (CRITICAL | `rule` | `hf.amt.ivabradine` — Vi phạm Fail-Closed phát lệnh `STOP Ivabradine` giả khi chưa nhập nhịp ECG, và ra lệnh `UPTITRATE Ivabradine` chung với `Diltiazem` ở `HFimpEF`)
- **Mô tả vấn đề**:
  1. **Vi phạm Fail-Closed (`QA-1` / `QA-9`)**: Tại `src/modules/hf/rules.hfref_amt.ts:32`, nhánh `if (activeIva)` kiểm tra `if (isPregnant(ctx) || ctx.patient.rhythm !== 'sinus' || onStrongCyp)` **trước khi** kiểm tra `ctx.patient.rhythm === undefined` (dòng 48). Khi bác sĩ chưa chọn trường nhịp tim trên biểu mẫu (`rhythm === undefined`), phép so sánh `undefined !== 'sinus'` trả về `true` và hệ thống lập tức phát lệnh **`[STOP] Ngưng Ivabradine do chống chỉ định (thai kỳ / mất nhịp xoang / ức chế mạnh CYP3A4)`** trên bệnh nhân nhịp xoang đang điều trị ổn định!
  2. **Kê tăng liều Ivabradine ngay trên nền `Diltiazem` / `Verapamil` ở `HFimpEF`**: Diltiazem và Verapamil vừa là chất ức chế CYP3A4 mức độ trung bình (làm tăng AUC Ivabradine gấp 2–3 lần), vừa ức chế trực tiếp nút xoang và dẫn truyền nhĩ thất (hiệp đồng dược lực học làm giảm nhịp tim sâu). Thế nhưng cả `rules.hfref_amt.ts:30` lẫn `gates.ts:198` đều chỉ kiểm tra `STRONG_CYP3A4_IDS` (bỏ qua `diltiazem`/`verapamil`), và ở bệnh nhân `HFimpEF` (`LVEF = 52%, priorLvef = 28%`), `hf.safety.harmful_meds` (`rules.hfref_amt.ts:178`) cũng bỏ lọt không dừng `diltiazem`!
- **Bằng chứng thực nghiệm `evaluate()` trực tiếp**:
  - **Ca `E1a`** (HFrEF đang dùng `ivabradine 5 mg BID + bisoprolol 10 mg OD`, `hr: 76 bpm`, `rhythm: undefined`): Xuất **`[STOP] Ngưng Ivabradine do chống chỉ định (thai kỳ / mất nhịp xoang / ức chế mạnh CYP3A4)`**!
  - **Ca `E1c`** (`LVEF: 52, priorLvef: 28` [`hfimpef`], `rhythm: 'sinus', hr: 76 bpm`, đang dùng `ivabradine 5 mg BID + diltiazem 120 mg`): Không có lệnh `STOP Diltiazem`, xuất **`[UPTITRATE] Tăng liều Ivabradine kiểm soát tần số xoang 7.5 mg x 2 lần/ngày`**!
- **Bằng chứng tài liệu gốc**:
  - `09_Nhan_Thuoc/FDA/FDA_label_ivabradine.pdf`, **trang 6** (§5.3 *Bradycardia and Conduction Disturbances*):
    > *"Concurrent use of **verapamil or diltiazem** will increase Corlanor exposure, may themselves contribute to heart rate lowering, and **should be avoided** [see Clinical Pharmacology (12.3)]."* (Nhãn EMA Procoralan SmPC §4.3 xếp phối hợp Ivabradine với Verapamil hoặc Diltiazem là **chống chỉ định tuyệt đối**).
- **Khuyến nghị sửa**: (1) Đặt kiểm tra `if (ctx.patient.rhythm === undefined) return missingInputRec('hf', 'rhythm', ...)` lên đầu hàm `produce()` trong `rules.hfref_amt.ts`; (2) Bổ sung `diltiazem` và `verapamil` vào danh sách chống chỉ định phối hợp với `ivabradine` trong `rules.hfref_amt.ts`, `gates.ts` và `kb/interactions/cardiovascular.json`.

---

### B. Nhóm MAJOR (`8` phát hiện: `HF-R2-R2-07` → `HF-R2-R2-14`)

#### `[HF-R2-R2-07]` (MAJOR | `rule` | `hf.fmt.arni` — Khởi trị quá liều `49/51 mg BID` khi chuyển từ ARB liều thấp & bất nhất cổng Kali máu khởi trị ARNI ở `K+ = 5.3–5.5 mmol/L`)
- **Mô tả & Bằng chứng**:
  1. Tại `src/modules/hf/rules.hfref.ts:113`: `const useLow = sbp < sbpLow || egfr < egfrMod || hasCondition(ctx, 'liverDisease') || (!activeAcei && !activeArb);`. Khi bệnh nhân đang uống ARB liều thấp (`valsartan 40 mg x 2 lần/ngày` hoặc `losartan 25 mg x 1 lần/ngày` — **Ca `A2`**), biến `activeArb` khác `undefined` làm `useLow = false` -> hệ thống kê thẳng **`49/51 mg x 2 lần/ngày`** thay vì **`24/26 mg x 2 lần/ngày`**, trái với `FDA_label_sacubitril_valsartan.pdf` **trang 7** (§2.6: *"for patients previously taking low doses of these agents, start ENTRESTO at half the usually recommended starting dose"*) và `ESC_2026` Supp Table S5 **trang 13** (*"Not on target dose of ACE-I/ARB: Starting dose 24/26 mg b.i.d."*).
  2. Tài liệu `docs/modules/HF.md:77` và `round1_RESPONSE.md:70,103` ghi chặn ARNI khi `K+ > 5.4 mmol/L`, nhưng `kb/thresholds/hf.json:149` đặt `hf.arni.k_max_hold = 5.5` và `rules.hfref.ts:82,116` dùng `k > 5.5` cho cả khởi trị mới! Ở **Ca `A5`** (`K+ = 5.4 mmol/L`, chưa dùng RASi), trong khi Spironolactone đã bị `HOLD`, hệ thống vẫn ra lệnh **`[START] Khởi trị Sacubitril/valsartan`** ngay trên bệnh nhân tăng kali máu `5.4 mmol/L` (ESC Table S5 trang 12 yêu cầu thận trọng/tối ưu kali khi `K+ > 5.0 mmol/L`).
- **Khuyến nghị sửa**: Đánh giá tổng liều quy đổi hàng ngày của ACEi/ARB trước chuyển đổi để chọn `24/26 mg BID` khi liều trước đó thấp/trung bình thấp, và tách ngưỡng khởi trị mới ARNI (`HOLD`/`DEFER` khi `K+ > 5.0–5.2 mmol/L`) khỏi ngưỡng tạm hoãn khi đang duy trì (`K+ > 5.5 mmol/L`).

---

#### `[HF-R2-R2-08]` (MAJOR | `rule` | `helpers.ts` & `hf.fmt.bb` / `hf.amt.ivabradine` — `parseNumericDoseValue` mù tần suất dùng thuốc, coi `Carvedilol 25 mg x 1 lần/ngày` là đạt đích và kích hoạt sớm sai chỉ định `Ivabradine`)
- **Mô tả & Bằng chứng**:
  1. `parseNumericDoseValue` (`src/modules/hf/helpers.ts:75-116`) chỉ đọc con số đầu tiên (`25`) trong `med.dose` mà bỏ qua hoàn toàn `med.freq` (`1 lần/ngày` vs `2 lần/ngày`). Ở **Ca `Part2 Case 2`** (`weight: 70 kg, hr: 76 bpm, rhythm: 'sinus'`, đang dùng `carvedilol 25 mg x 1 lần/ngày` = `25 mg/ngày`, mới bằng **50%** liều đích `25 mg x 2 lần/ngày = 50 mg/ngày`), hàm `isAtOrAboveTargetDose` trả về `true`! Hệ quả kép: `rec_hf_bb` báo **`[CONTINUE]`** (bỏ lỡ chuẩn độ chẹn beta) VÀ `rec_hf_ivabradine` (`rules.hfref_amt.ts:45`) nổ sớm **`[CONSIDER] Phối hợp Ivabradine 5 mg x 2 lần/ngày`** trái chỉ định ESC 2026 trang 34!
  2. Ngược lại, ở **Ca `B1b`** (`weight = 90 kg > 85 kg`, đang dùng `carvedilol 25 mg x 2 lần/ngày`), `rec_hf_bb` (`rules.hfref.ts:219`) phát `[UPTITRATE]` nhưng trường `dose` vẫn in sai **`"3.125 mg x 2 lần/ngày (uống); đích 25 mg x 2 lần/ngày (uống)"`** thay vì đích **`50 mg x 2 lần/ngày`** (ESC 2026 Supp Table S6 **trang 14**: *"Target dose: 25 mg b.i.d. (50 mg b.i.d. if >85 kg)"*).
- **Khuyến nghị sửa**: Nhân hệ số tần suất dùng mỗi ngày (`freqMultiplier`) khi tính tổng liều ngày trong `isAtOrAboveTargetDose` (từ chối đoán nếu chỉ ghi `"1 viên"`), và hiển thị đúng đích `50 mg x 2 lần/ngày` khi `bbId === 'carvedilol' && weight > 85`.

---

#### `[HF-R2-R2-09]` (MAJOR | `rule` | `hf.fmt.mra` & `kb/interactions/renal_rasi.json` — Tăng liều `Eplerenone 50 mg` vượt trần FDA khi dùng kèm chất ức chế CYP3A4 vừa, không dừng MRA trùng lặp trong `currentMeds`, và chấp nhận `Finerenone` làm MRA cho HFrEF)
- **Mô tả & Bằng chứng**:
  1. **Eplerenone + CYP3A4 vừa/mạnh**: Theo `09_Nhan_Thuoc/FDA/FDA_label_eplerenone.pdf` **trang 4** (§2.4) & **trang 15** (§12.3): khi dùng kèm chất ức chế CYP3A4 mức độ vừa (`erythromycin`, `verapamil`, `saquinavir`, `fluconazole` — làm tăng AUC Eplerenone 100–190%), **không được vượt quá `25 mg x 1 lần/ngày`**. Thế nhưng ở **Ca `C2c`** (`eplerenone 25 mg OD + fluconazole 200 mg OD`), hệ thống vẫn ra lệnh **`[UPTITRATE] Tăng liều Eplerenone hướng tới liều đích 50 mg x 1 lần/ngày`** với `0` cảnh báo tương tác! Đồng thời `kb/interactions/renal_rasi.json:104` chỉ có `ix.finerenone_strong_cyp3a4`, bỏ quên `eplerenone` và bỏ sót tương tác tăng kali máu giữa MRA với `trimethoprim`/`cotrimoxazole`.
  2. **2 thuốc MRA sẵn trong `currentMeds`**: Ở **Ca `C1a` & `Part2 Case 4`** (`spironolactone 25 mg + eplerenone 25 mg`), hệ thống xuất `[UPTITRATE] Spironolactone 50 mg` mà không phát thẻ `[STOP] Eplerenone`.
  3. **`Finerenone` trong HFrEF (`LVEF <= 40%`)**: Vì `src/modules/hf/rules.hfref.ts:232` quét `ALL_MRA_IDS`, ở **Ca `C1b`** (`LVEF = 28%` đang uống `finerenone 10 mg`), hệ thống xuất **`[UPTITRATE] Finerenone 20 mg`** với danh nghĩa trụ cột Class I-A HFrEF! Theo `FDA_label_finerenone.pdf` **trang 1, 3, 14** và ESC 2026, Finerenone chỉ được phê duyệt cho suy tim `LVEF ≥ 40%`, còn ở HFrEF chỉ MRA steroid (`spironolactone`/`eplerenone`) có chứng cứ giảm tử vong Class I-A.
  4. **Dấu so sánh `K+ = 6.0`**: `rules.hfref.ts:261` và `rules.hfpef.ts:76` viết `k > 6.0` thay vì `k >= 6.0` (FDA Inspra Table 1 trang 4 ghi `≥6.0: Withhold`).
- **Khuyến nghị sửa**: Giới hạn trần Eplerenone `<= 25 mg OD` khi phối hợp `fluconazole`/`erythromycin`/`verapamil`/`diltiazem`, bổ sung tương tác CYP3A4 mạnh & vừa của Eplerenone + `MRA × trimethoprim` vào `renal_rasi.json`, phát thẻ `STOP` khi có ≥ 2 MRA trong `currentMeds`, chỉ dùng `STEROIDAL_MRA_IDS` cho Class I-A HFrEF, và sửa `k >= 6.0`.

---

#### `[HF-R2-R2-10]` (MAJOR | `rule` | `hf.amt.digoxin` & `ix.amiodarone_digoxin` — Không giảm 50% liều Digoxin khi dùng cùng Amiodarone / thuốc ức chế P-gp, sai `maxDose: 0.125 mg`, thiếu tương tác Clarithromycin/Cyclosporine/Itraconazole, và bỏ sót CCĐ WPW + rung nhĩ)
- **Mô tả & Bằng chứng**:
  1. Ở **Ca `E2a` & `Part2 Case 7`** (nam 55 tuổi, HFrEF + rung nhĩ `HR 92 bpm, eGFR 75, K+ 4.2`, đang uống `amiodarone 200 mg`), `hf.amt.digoxin` (`src/modules/hf/rules.hfref_amt.ts:152`) vẫn kê **`[CONSIDER] Digoxin 125 mcg (hoặc 62.5 mcg) x 1 lần/ngày`** thay vì bắt buộc giảm nửa liều xuống `62.5 mcg/ngày` (hoặc cách ngày). Tệ hơn, `kb/interactions/cardiovascular.json:65` (`ix.amiodarone_digoxin`) đặt `"maxDose": 0.125, "unit": "mg"` (= `125 mcg`, tức liều chưa giảm!).
  2. Ở **Ca `Part2 Case 8`** (đang uống `digoxin 0.25 mg` + `clarithromycin 500 mg` + `cyclosporine 100 mg`), engine xuất `[CONTINUE] Digoxin` và **`0` cảnh báo tương tác** vì `clarithromycin`, `itraconazole`, `cyclosporine`, `dronedarone`, `propafenone`, `spironolactone` hoàn toàn vắng mặt trong các luật tương tác của `digoxin`!
  3. Khi `K+ = 3.1 mmol/L` (hạ kali máu nặng làm nhạy cảm độc tính Digitalis) mà chưa dùng Digoxin, dòng `135` trả về `null` im lặng; khi có `wpw_afib: true` (`FDA_label_digoxin.pdf` **trang 2** §5.1 cảnh báo rung thất tử vong do tăng dẫn truyền qua đường phụ), hệ thống vẫn gợi ý `[CONSIDER] Digoxin`!
- **Khuyến nghị sửa**: Bắt buộc hạ liều Digoxin xuống `62.5 mcg/ngày` (hoặc cách ngày) và `REDUCE` nếu đang dùng `>= 125 mcg` khi có `amiodarone` hoặc chất ức chế P-gp; sửa `maxDose` của `ix.amiodarone_digoxin` thành `0.0625 mg` và bổ sung `ix.pgp_inhibitor_digoxin` vào `cardiovascular.json`; chặn `STOP`/`AVOID` khi có `wpw_afib` / `ventricular_fibrillation` / `av_block_2_3`.

---

#### `[HF-R2-R2-11]` (MAJOR | `rule` | `hf.amt.iv_iron` — Báo cáo sai sự thật về `HF-R2-23`, kê truyền sắt tĩnh mạch ngay cả khi `Hb > 15 g/dL`, quá tải sắt `TSAT = 55%`, nhiễm khuẩn huyết cấp và lỗi ghép chuỗi liều)
- **Mô tả & Bằng chứng**:
  1. `round1_RESPONSE.md:88` tuyên bố đã bổ sung phân tầng liều truyền sắt theo cân nặng (`< 70 kg` vs `>= 70 kg`) và `Hemoglobin` trong `rules.devices_iron.ts`, nhưng kiểm tra `src/modules/hf/rules.devices_iron.ts:10-55` không có bất kỳ biến `weight`, `hb`, `sepsis` hay `isPregnant` nào!
  2. Tại dòng `25`: `const ironDef = ferritin < ferAbs || (ferritin <= ferFunc && tsat !== undefined && tsat < tsatMin);` — khi `ferritin = 80 ng/mL` (`< 100`), vế đầu đúng ngay nên bỏ qua hoàn toàn `tsat = 55%` (quá tải sắt)!
  3. Thực nghiệm **Ca `E5`** (`pregnant: true, sepsis: true, hb: 16.2 g/dL, ferritin: 80 ng/mL, tsat: 55%`): Hệ thống vẫn phát **`[START] Bù sắt đường tĩnh mạch: Ferric carboxymaltose`** với chuỗi `dose` bị hỏng ngữ pháp: **`"500–1000 mg x truyền TM liều nạp (tĩnh mạch) (tối đa 500–1000 mg x đánh giá lại Ferritin & TSAT sau 3–6 tháng (tĩnh mạch))"`**!
  4. Đối chiếu `ESC_2026_Heart_Failure_Guideline.pdf` **trang 67** (AFFIRM-AHF / IRONMAN giới hạn `Hb < 15 g/dL`) và nhãn gốc Ferinject SmPC §4.3–4.4 (chống chỉ định quá tải sắt, không truyền khi đang nhiễm khuẩn huyết cấp, tránh trong 3 tháng đầu thai kỳ).
- **Khuyến nghị sửa**: Chặn `AVOID`/`DEFER` khi `hb > 15`, `tsat >= 45`, `sepsis`/nhiễm khuẩn huyết cấp hoặc tam cá nguyệt 1 thai kỳ; tính liều thực tế theo bảng `weight` × `hb` của Ferinject và sửa chuỗi `dose` dùng `titration.maxDose`.

---

#### `[HF-R2-R2-12]` (MAJOR | `rule` | `hf.safety.harmful_meds` — Bỏ lọt `Diltiazem`/`Verapamil` ở `HFimpEF`, đánh rơi `drugId` phụ khi dừng ≥ 2 thuốc gây hại, và thiếu `Cilostazol`, `Alogliptin`, `Itraconazole`, `Doxazosin`)
- **Mô tả & Bằng chứng**:
  1. Tại `src/modules/hf/rules.hfref_amt.ts:178`: `const isPreserved = pheno === 'hfpef' || (lvef !== undefined && lvef >= 50);`. Ở bệnh nhân **`HFimpEF`** (`LVEF = 52%, priorLvef = 28%` — **Ca `F1b`**), `lvef >= 50` làm `isPreserved === true`, khiến `diltiazem 120 mg` và `verapamil 120 mg` **không bị phát lệnh `STOP`** (nguy cơ tái suy giảm LVEF nặng)!
  2. Tại dòng `182–193`, khi có ≥ 2 thuốc gây hại, thẻ `rec_hf_stop_harmful_meds` chỉ gán `drugId: first.drugId`, làm các hoạt chất thứ 2 trở đi không được đưa vào `stoppedOrHeldIds` của tầng hậu kiểm nếu `reviewMeds` không bắt trùng.
  3. Thực nghiệm **Ca `F1a`** (`HFrEF LVEF 30%`, đang dùng `cilostazol 100 mg`, `alogliptin 25 mg`, `doxazosin 4 mg`, `itraconazole 200 mg`): hệ thống phát **`0` lệnh `STOP`/`AVOID`**, dù `cilostazol` và `itraconazole` có **FDA Boxed Warning** trong suy tim, `alogliptin` thuộc nhóm Class III Harm (AHA/ACC 2022), và chẹn alpha-1 (`doxazosin`) không được khuyến cáo điều trị THA ở HFrEF theo `ESC_2026_Heart_Failure_Guideline.pdf` **trang 64**.
- **Khuyến nghị sửa**: Sửa dòng 178 thành `const isPreserved = pheno === 'hfpef';`, tách mỗi thuốc gây hại thành một khuyến cáo `STOP` riêng mang đúng `drugId`, và mở rộng danh sách quét thêm `cilostazol`, `alogliptin`, `itraconazole`, `doxazosin`/`prazosin`/`terazosin`.

---

#### `[HF-R2-R2-13]` (MAJOR | `rule` | `evaluateHfSglt2i` (`helpers.ts`), cổng cho con bú (`lactation`) & `gates.ts` — Mất SGLT2i ở `eGFR < 20` khi dùng viên phối hợp SGLT2i+Metformin, thiếu hoàn toàn cổng cho con bú, và sót `rec.dose` trên thẻ `HOLD`/`AVOID`)
- **Mô tả & Bằng chứng**:
  1. **FDC SGLT2i + Metformin (`dapagliflozin_metformin`, `empagliflozin_metformin`)**: `SGLT2I_IDS` (`helpers.ts:19`) chỉ chứa đơn chất. Ở **Ca `D1b`** (`modules: ['hf', 'dm2']`, `eGFR = 18 mL/min/1.73m²`, đang uống `dapagliflozin_metformin`), module `dm2` dừng Metformin còn module `hf` tưởng bệnh nhân chưa từng dùng SGLT2i nên phát **`[DEFER] Trì hoãn khởi trị mới Dapagliflozin do eGFR dưới ngưỡng`** — làm ngưng oan SGLT2i lẽ ra phải được tách sang viên đơn chất `Dapagliflozin 10 mg` duy trì liên tục tới khi lọc máu (`FDA_label_dapagliflozin.pdf` **trang 5** §2.3 & KDIGO 2024 PP 3.7.1)!
  2. **Thiếu cổng cho con bú (`lactation`)**: Ở **Ca `G1`** (sản phụ HFrEF đang cho con bú), hệ thống vẫn kê **`[START] Sacubitril/valsartan`**, **`[START] Dapagliflozin`** mà không có bất kỳ cảnh báo nào, trái với `ESC_2026` Supp Tables S5, S8, S9 (**trang 12, 18, 19**: xếp *"breastfeeding period"* vào mục **Contraindications**) và `FDA_label_dapagliflozin.pdf` **trang 15** (§8.2).
  3. **Sót `rec.dose` trên thẻ bị chặn bởi `gates.ts`**: Tại `src/engine/safety/gates.ts:368-376`, khi `updatedAction` chuyển thành `AVOID` hoặc `HOLD`, trường `rec.dose` không bị xóa (`Case E1b`: thẻ `[AVOID] CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI Ivabradine` vẫn hiển thị `dose: "5 mg x 2 lần/ngày"`).
- **Khuyến nghị sửa**: Nhận diện FDC SGLT2i trong `helpers.ts` để hướng dẫn `SWITCH` sang đơn chất SGLT2i khi `eGFR < 30`; bổ sung cờ `breastfeeding` vào `inputs.ts` + cổng `lactation` trong `vitalAndRenalGates.ts`; xóa `dose: undefined` trong `gates.ts` khi hành động là `AVOID`/`STOP`/`HOLD`/`DEFER`.

---

#### `[HF-R2-R2-14]` (MAJOR | `citation` | `kb/citations/_sample.json`, `kb/thresholds/hf.json` & 12 tệp thuốc HF — Tiếp tục dùng `_sample.json` trong mã sản xuất, 5 ngưỡng mượn trích dẫn nhầm thuốc khác, và 12/17 thuốc HF lệch ngữ nghĩa trích dẫn)
- **Mô tả & Bằng chứng kiểm định từng dòng**:
  1. **Vi phạm `QA-2` (`_sample.json` trong mã sản xuất)**: `src/modules/hf/helpers.ts:207-208`, `matrices.ts:44-56,170-174`, `pathways.ts:22,60`, `rules.hfpef.ts:14`, `rules.hfref.ts:22`, `rules.hfref_amt.ts:225,227` tham chiếu 28 lần tới `esc.hf.2026.dapagliflozin_hf_rec` (`quote` cụt lủn `"reduce the risk of HF"` tại `kb/citations/_sample.json:30`) và `esc.hf.2026.dapagliflozin_dose_10mg` (`_sample.json:33-40`) — hai mã này không hề có trong `kb/citations/hf.json`!
  2. **5 ngưỡng trong `kb/thresholds/hf.json` dẫn trích dẫn của thuốc hoàn toàn khác (`QA-7`/`QA-10`)**:
     - `hf.arni.egfr_esrd_min` (`15`, dòng 128) → dẫn `esc.hf.2026.mra_table_s4_egfr15` (**MRA**) & `fda.hf.vericiguat_renal_hepatic` (**Vericiguat**).
     - `hf.arni.k_max_hold` (`5.5`, dòng 149) → dẫn `esc.hf.2026.mra_guidance_table_s8` & `esc.hf.2026.mra_table_s4_egfr15` (**MRA**).
     - `hf.digoxin.hr_start_min` (`60`, dòng 706) → dẫn `fda.hf.ivabradine_target_hr_60_age75` (**Ivabradine**).
     - `hf.digoxin.egfr_avoid_max` (`30`, dòng 732) → dẫn `esc.hf.2026.mra_guidance_table_s8` (**MRA**).
     - `hf.digoxin.egfr_low_dose_max` (`60`, dòng 745) → dẫn `esc.hf.2026.sacubitril_valsartan_low_dose` (**Sacubitril/valsartan**).
  3. **12/17 tệp thuốc JSON của HF gắn `quote` không chứa mệnh đề lâm sàng đang viện dẫn**:
     - `sacubitril_valsartan.json:153`: `bilateral_renal_artery_stenosis` dẫn `arni_table_s5_contra_caution`, nhưng `quote` bắt đầu từ dòng dưới nên cắt mất dòng `(2) Known bilateral renal artery stenosis` trên trang 12 Supp.
     - `metoprolol_succinate.json:103` & `nebivolol.json:102`: `lactation` dẫn `pregnancy_bb_switch` (0 chữ sữa mẹ/cho con bú); `nebivolol.json:112`: `severe_hepatic_impairment` dẫn `bb_table_s6_asthma_contra` (0 chữ suy gan).
     - `ivabradine.json:134`: `strong_cyp3a4_inhibitor` dẫn `fda.hf.ivabradine_contra` (`hf.json:835`), nhưng `quote` cắt cụt ngay sau `Severe hepatic impairment ( 4 )`, làm mất dòng `Concomitant use of strong CYP3A4 inhibitors` trên trang 5 nhãn FDA Corlanor.
     - `digoxin.json:98`: `lactation` dẫn `fda.hf.digoxin_preg_lact` chỉ chép §8.1 Pregnancy (trang 13), bỏ sót §8.2 Lactation.
     - `furosemide.json:88-109`, `torsemide.json:74-95`, `bumetanide.json:71-92`: cả `pregnancy`, `lactation`, `anuria` đều dẫn `loop_diuretics_doses_table_s7` (trang 16 Supp — không có chữ nào về thai kỳ, sữa mẹ hay vô niệu).
     - `hydralazine.json:80-93` & `isosorbide_dinitrate.json:60-109`: dẫn `acute_inotropes_shock_sbp90` cho lupus/bóc tách ĐMC/nhồi máu thất phải; dẫn nhãn `vericiguat` cho CCĐ PDE-5i của nitrat; `lactation` dẫn câu không nói về sữa mẹ.
     - `ferric_carboxymaltose.json:70-91` & `ferric_derisomaltose.json:69-90`: dẫn `iron_rec` / `iron_definition` (trang 67) cho `pregnancy`, `lactation`, `iron_overload`/`bacteremia` (0 chữ liên quan trong `quote`).
- **Khuyến nghị sửa**: Đưa 2 trích dẫn SGLT2i chính thức vào `kb/citations/hf.json` (ngắt bỏ `_sample.json`), thay đúng trích dẫn chính danh cho 5 ngưỡng trong `kb/thresholds/hf.json`, và mở rộng/bổ sung trích dẫn nhãn FDA/SmPC tương ứng cho 12 tệp thuốc HF.

---

### C. Nhóm MINOR (`3` phát hiện) & SUGGESTION (`1` phát hiện)

- **`[HF-R2-R2-15]` (MINOR | `rule` | `hf.amt.loop_diuretic` & `matrices.ts`)**: `hf.amt.loop_diuretic` (`rules.hfref_amt.ts:202-238`) chưa chặn chống chỉ định vô niệu (`anuria`) và chưa kèm cảnh báo bù kali / theo dõi hạ natri / tránh gút cấp theo ESC 2026 Supp Table S7 (trang 16–17) khi `K+ <= 3.5 mmol/L`, `Na+ < 135 mmol/L` hoặc có `gout` (**Ca `E4`**); đồng thời `matrices.ts:149,216` ghi nhầm liều thường dùng `40–240 mg` của Furosemide là `"tối đa"` thay vì trần `600 mg/ngày`.
- **`[HF-R2-R2-16]` (MINOR | `rule` | `hf.amt.vericiguat`)**: `NITRATE_OR_SGC_IDS` (`helpers.ts:34`) chặn cứng `[AVOID]` Vericiguat đối với cả bệnh nhân chỉ dùng xịt/viên ngậm dưới lưỡi `nitroglycerin` khi cần (`PRN` cắt cơn đau ngực — **Ca `E3`**), trong khi thử nghiệm VICTORIA & nhãn FDA Verquvo chỉ loại trừ **nitrat tác dụng kéo dài**; dòng `93` của `rules.hfref_amt.ts` trả về `null` im lặng khi thiếu `egfr`; và cần bổ sung `profileDiff` cho nhãn US.
- **`[HF-R2-R2-17]` (MINOR | `drug` | `dapagliflozin` & `evaluateHfSglt2i`)**: Chưa ghi nhận `profileDiff` cho profile `US` theo `FDA_label_dapagliflozin.pdf` **trang 5** (§2.3: không khuyến cáo khởi trị mới Farxiga khi `eGFR < 25 mL/min/1.73m²`, khác với ngưỡng `>= 20` của ESC 2026 Table S9 / Empagliflozin) và quy tắc tạm ngưng SGLT2i ≥ 3 ngày trước đại phẫu / nhịn ăn kéo dài (§2.4) để phòng nhiễm toan ceton đẳng đường huyết.
- **`[HF-R2-R2-18]` (SUGGESTION | `ui` | `sacubitril_valsartan`)**: Chuỗi liều thấp trong `rules.hfref.ts:114` và `matrices.ts:23` ghép trực tiếp `forms[0]` tạo chuỗi `"Viên nén bao phim 24/26 mg (50 mg) x 2 lần/ngày (uống)"` kém đồng nhất với `"49/51 mg x 2 lần/ngày (uống)"`; nên rút gọn thành `"24/26 mg x 2 lần/ngày (uống) (viên 50 mg)"`.

---

## 4. Ma Trận Kiểm Định 17 Thuốc Sở Hữu Module `hf` & 7 Thuốc Dùng Chéo (Vòng 2)

### 4.1. 17 Thuốc Sở Hữu Bởi Module `hf` (`kb/drugs/*.json`)

| # | Drug ID | Dải Thận (`G1–G5 + dialysis`) & `maxDose` | Suy Gan (`hepatic`) | Chống chỉ định, Tương tác & Dị ứng trên Engine | Trích dẫn (`citationIds`) | Kết luận V2 |
|---:|---|---|---|---|---|---|
| 1 | `sacubitril_valsartan` | **ĐẠT** (`<15` `not_rec`, có `components` & `maxDose: 194/206 mg/ngày`) | **THIẾU (`undefined`)** — `START` ở Child-Pugh C & `UPTITRATE` khi xơ gan mất bù (`HF-R2-R2-02`) | Lọt FDC ACEi mất washout 36h (`HF-R2-R2-01`); lọt `allergyAceiArb`/`allergies` (`HF-R2-R2-03`); ghi đè `97/103 mg` lên `CONTINUE` (`HF-R2-R2-05`); ARB liều thấp kê `49/51 mg` & `K+ 5.4` vẫn `START` (`HF-R2-R2-07`) | Lệch quote hẹp ĐM thận 2 bên; 2 ngưỡng ARNI dẫn nhầm MRA/Vericiguat (`HF-R2-R2-14`) | **FAIL** |
| 2 | `bisoprolol` | **ĐẠT** (đủ dải `<15`, `maxDose: 10 mg/ngày`, `Concor Cor`) | **THIẾU (`undefined`)** (SmPC: tối đa 10 mg/ngày ở Child-Pugh C) | `UPTITRATE` khi sốc tim ngoại trú & block AV II–III / suy nút xoang; kê chồng lên `metoprolol_tartrate` (`HF-R2-R2-04`); `CONTINUE` in sai `1.25 mg` (`HF-R2-R2-05`) | **ĐẠT** (trích dẫn Cardicor SmPC & ESC Table S6 khớp nội dung) | **FAIL** |
| 3 | `carvedilol` | **ĐẠT** (đủ dải `<15`, `maxDose: 50–100 mg/ngày`, `Coryol`/`Talliton`) | **THIẾU (`undefined`)** — `UPTITRATE` ở Child-Pugh C dù FDA §4 CCĐ tuyệt đối (`HF-R2-R2-02`) | `25 mg x 1 lần/ngày` bị nhận nhầm đạt đích & in sai đích `25 mg BID` khi `> 85 kg` (`HF-R2-R2-08`); mã CCĐ dẫn truyền chưa nối (`HF-R2-R2-04`) | **ĐẠT** (trích dẫn FDA Coreg & ESC Table S6 khớp nội dung) | **FAIL** |
| 4 | `metoprolol_succinate` | **ĐẠT** (có viên `100 mg` Betaloc ZOK, `maxDose: 200 mg/ngày`) | **THIẾU (`undefined`)** (cần giảm liều/tăng chậm ở suy gan) | Mã CCĐ `av_block_2_3` / `sick_sinus_syndrome` / `cardiogenic_shock` chưa nối (`HF-R2-R2-04`) | `lactation` dẫn nhầm `pregnancy_bb_switch` (`HF-R2-R2-14`) | **FAIL** |
| 5 | `nebivolol` | **ĐẠT** (đủ dải `<15`, `maxDose: 10 mg/ngày`, `Nebilet`) | **THIẾU (`undefined`)** (CCĐ tuyệt đối ở Child-Pugh C) | Mã CCĐ `severe_hepatic_impairment` / `av_block_2_3` chưa nối (`HF-R2-R2-02`, `HF-R2-R2-04`) | `lactation` & `severe_hepatic_impairment` dẫn quote không chứa nội dung (`HF-R2-R2-14`) | **FAIL** |
| 6 | `spironolactone` | **ĐẠT** (`<30` `contra`, G3b `12.5–25 mg`, `Aldactone`) | **THIẾU (`undefined`)** | **Thẻ `CONTINUE` ở CKD G3b (`eGFR 35`) in sai `dose: "50 mg/ngày"`** (`HF-R2-R2-05`); thiếu tương tác `trimethoprim` & không `STOP` khi trùng 2 MRA (`HF-R2-R2-09`) | **ĐẠT** (trích dẫn FDA Aldactone & ESC Table S8 khớp) | **FAIL** |
| 7 | `eplerenone` | **ĐẠT** (`<30` `contra`, `maxDose: 50 mg/ngày`) | **THIẾU (`undefined`)** — `UPTITRATE` ở Child-Pugh C (`HF-R2-R2-02`) | **`UPTITRATE` lên `50 mg` khi đang dùng `fluconazole` (vượt trần 25 mg FDA §2.4)** & thiếu `eplerenone` trong `renal_rasi.json` (`HF-R2-R2-09`) | **ĐẠT** (trích dẫn FDA Inspra & ESC Table S8 khớp) | **FAIL** |
| 8 | `ivabradine` | **ĐẠT** (`2.5 mg BID` khi `>= 75` tuổi, `maxDose: 15 mg/ngày`) | **THIẾU (`undefined`)** — `UPTITRATE` ở Child-Pugh C dù FDA Corlanor §4 CCĐ tuyệt đối (`HF-R2-R2-02`) | **Phát `STOP` giả khi `rhythm === undefined` & `UPTITRATE` chung với `diltiazem` ở `HFimpEF`** (`HF-R2-R2-06`); nổ sớm khi Carvedilol mới `25 mg OD` (`HF-R2-R2-08`) | `fda.hf.ivabradine_contra` cắt mất dòng `strong CYP3A4 inhibitors` (`HF-R2-R2-14`) | **FAIL** |
| 9 | `vericiguat` | **ĐẠT** (chặn `<15` & lọc máu, `maxDose: 10 mg/ngày`, tránh thai + 1 tháng) | **THIẾU (`undefined`)** — `UPTITRATE` ở Child-Pugh C (`HF-R2-R2-02`) | Chặn quá tay `nitroglycerin` ngậm dưới lưỡi `PRN` & trả `null` khi thiếu `egfr` (`HF-R2-R2-16`) | **ĐẠT** (trích dẫn FDA Verquvo & ESC 2026 khớp) | **FAIL** |
| 10 | `digoxin` | **ĐẠT** (`62.5 mcg` khi `>= 70` tuổi / `eGFR < 60`, chặn `< 30`) | **THIẾU (`undefined`)** (ít chuyển hóa gan nhưng thiếu schema) | **Không giảm liều với `amiodarone`/P-gp, sai `maxDose: 0.125 mg`, thiếu DDI `clarithromycin`/`cyclosporine`, bỏ sót `wpw_afib`** (`HF-R2-R2-10`) | `lactation` thiếu §8.2; 3 ngưỡng Digoxin dẫn nhầm Ivabradine/MRA/ARNI (`HF-R2-R2-14`) | **FAIL** |
| 11 | `furosemide` | **ĐẠT** (`maxDose: 600 mg/ngày`, đủ dải `<15`) | **THIẾU (`undefined`)** | Lọt dị ứng `furosemide` (`HF-R2-R2-03`); chưa chặn `anuria` & cảnh báo `K+ <= 3.5` / `Na+ < 135` / `gout`; ma trận ghi nhầm tối đa `40–240 mg` (`HF-R2-R2-15`) | `pregnancy`, `lactation`, `anuria` dẫn Table S7 không chứa nội dung (`HF-R2-R2-14`) | **FAIL** |
| 12 | `torsemide` | **ĐẠT** (đã thêm `<15` & `maxDose: 200 mg/ngày`) | **THIẾU (`undefined`)** (chuyển hóa gan 80%) | Mã `anuria` chưa nối vào `gates.ts` (`HF-R2-R2-04`) | `pregnancy`, `lactation`, `anuria` dẫn Table S7 không chứa nội dung (`HF-R2-R2-14`) | **FAIL** |
| 13 | `bumetanide` | **ĐẠT** (đã thêm `<15` & `maxDose: 10 mg/ngày`) | **THIẾU (`undefined`)** (CCĐ hôn mê gan) | Mã `anuria` chưa nối (`HF-R2-R2-04`) | `pregnancy`, `lactation`, `anuria` dẫn Table S7 không chứa nội dung (`HF-R2-R2-14`) | **FAIL** |
| 14 | `hydralazine` | **ĐẠT** (`maxDose: 300 mg/ngày`, đã có luật ngoại trú H-ISDN) | **THIẾU (`undefined`)** | Nổ đồng thời với `START ARNI` khi `allergyAceiArb = true` (`HF-R2-R2-03`) | `lactation` & CCĐ lupus/bóc tách ĐMC dẫn sai quote (`HF-R2-R2-14`) | **FAIL** |
| 15 | `isosorbide_dinitrate` | **ĐẠT** (đã thêm `<15`, tách liều TM & uống) | **THIẾU (`undefined`)** | Đã chặn PDE-5i ở tầng luật | `lactation`, CCĐ sốc & PDE-5i dẫn sai quote (`HF-R2-R2-14`) | **FAIL** |
| 16 | `ferric_carboxymaltose` | **ĐẠT** (`maxDose: 1000 mg/lần`, `Ferinject`) | **THIẾU (`undefined`)** | **Kê truyền sắt khi `Hb = 16.2`, `TSAT = 55%`, `sepsis`, thai kỳ + hỏng chuỗi `dose`** (`HF-R2-R2-11`) | `pregnancy`, `lactation`, `iron_overload` dẫn `iron_rec` không chứa nội dung (`HF-R2-R2-14`) | **FAIL** |
| 17 | `ferric_derisomaltose` | **ĐẠT** (`Monofer`, `maxDose: 20 mg/kg`) | **THIẾU (`undefined`)** | Chưa nối mã `iron_overload` / `sepsis` (`HF-R2-R2-04`, `HF-R2-R2-11`) | `pregnancy`, `lactation`, `iron_overload` dẫn `iron_rec` không chứa nội dung (`HF-R2-R2-14`) | **FAIL** |

### 4.2. 7 Thuốc Dùng Chéo Trong Module `hf`

| # | Drug ID | Kết quả hậu kiểm tích hợp với `hf` ở Vòng 2 | Vấn đề còn tồn đọng |
|---:|---|---|---|
| 1 | `dapagliflozin` | Đúng liều `10 mg OD`, chặn T1DM & lọc máu. | Mất SGLT2i ở `eGFR < 20` khi đang uống FDC `dapagliflozin_metformin` & thiếu cổng cho con bú (`HF-R2-R2-13`); vẫn dùng trích dẫn `_sample.json` (`HF-R2-R2-14`); thiếu `profileDiff` US `eGFR >= 25` & ngưng trước mổ (`HF-R2-R2-17`). |
| 2 | `empagliflozin` | Đã có `classes: ["sglt2i"]`, đúng liều `10 mg OD`. | Tương tự FDC `empagliflozin_metformin`, cổng cho con bú và quy tắc ngưng ≥ 3 ngày trước đại phẫu (`HF-R2-R2-13`, `HF-R2-R2-17`). |
| 3 | `finerenone` | **Rất tốt ở KB (`finerenone.json`)**: đã có viên `40 mg`, bậc `10→20→40 mg`, có cả `hepatic` Child-Pugh C! | Lọt sang `rules.hfref.ts` làm hệ thống chấp nhận sai `Finerenone` làm trụ cột Class I-A cho HFrEF (`LVEF <= 40%` — `HF-R2-R2-09`); thiếu cổng cho con bú (`HF-R2-R2-13`). |
| 4 | `enalapril` | Đã có `classes: ["acei"]`, nhận diện washout 36h cho đơn chất. | Bỏ lọt viên phối hợp `enalapril_hydrochlorothiazide` mất washout 36h (`HF-R2-R2-01`) & lọt dị ứng (`HF-R2-R2-03`). |
| 5 | `valsartan` | Đã có `classes: ["arb"]`, chuyển trực tiếp sang ARNI không cần washout 36h. | Đang uống `valsartan 40 mg BID` (liều thấp) bị chuyển thẳng lên ARNI `49/51 mg BID` thay vì `24/26 mg BID` (`HF-R2-R2-07`); lọt dị ứng `'valsartan'` (`HF-R2-R2-03`). |
| 6 | `semaglutide` | **ĐẠT** — Đã cập nhật bút Wegovy `2.4 mg/tuần`, Class IIa LOE B1, chặn thai kỳ & MTC/MEN2. | Chỉ thiếu cổng cho con bú chung của hệ thống (`HF-R2-R2-13`). |
| 7 | `tirzepatide` | **ĐẠT** — Đã mở bậc chuẩn độ tới `15 mg/tuần` (SUMMIT / ACC 2026), chặn thai kỳ & MTC/MEN2. | Chỉ thiếu cổng cho con bú chung của hệ thống (`HF-R2-R2-13`). |

---

## 5. Phán Quyết Cuối Cùng & Điều Kiện Bắt Buộc Để Đạt `PASS` Ở Vòng 3

Theo quy chế `docs/REVIEW_PROTOCOL.md` (chỉ cấp **`PASS`** khi `0 Critical` và `0 Major`), với **6 phát hiện `Critical`** và **8 phát hiện `Major`** đã được chứng minh bằng thực nghiệm chạy trực tiếp `evaluate()` và đối chiếu nguyên văn tài liệu gốc:

> ### **PHÁN QUYẾT VÒNG 2 (R2 – DƯỢC LÂM SÀNG): `FAIL`**

### Danh sách kiểm tra bắt buộc (Release Gate) trước khi trình duyệt Vòng 3:
1. **Chấm dứt báo cáo khắc phục ảo — Hiện thực hóa thật 100% trong Code & JSON**:
   - Khai báo `hepatic` trong `DrugEntry`, điền đầy đủ cho cả **17/17** thuốc HF, và chặn `STOP`/`AVOID` thực sự ở Child-Pugh C / xơ gan mất bù cho cả khởi trị mới lẫn đang dùng thuốc (`HF-R2-R2-02`).
   - Triển khai thực sự tính liều sắt tĩnh mạch theo `weight` × `hb`, chặn khi `Hb > 15 g/dL`, `TSAT >= 45%`, `sepsis`, tam cá nguyệt 1 và sửa chuỗi `dose` (`HF-R2-R2-11`).
2. **Bịt kín lỗ hổng viên phối hợp (FDC) & Dị ứng thuốc**:
   - Nhận diện mọi FDC chứa ACEi/ARB (`perindopril_amlodipine`, `perindopril_indapamide`...) để cưỡng chế khoảng nghỉ **≥ 36 giờ** trước ARNI (`HF-R2-R2-01`) và nhận diện FDC SGLT2i+Metformin để duy trì đơn chất SGLT2i khi `eGFR < 30` (`HF-R2-R2-13`).
   - Nối cổng `patient.allergies` toàn cục và thêm `hasCondition(ctx, 'allergyAceiArb')` vào `hf.fmt.arni` (`HF-R2-R2-03`).
3. **Sửa dứt điểm lỗi ghi đè liều `CONTINUE`, tần suất liều & cổng dẫn truyền/huyết động**:
   - Thẻ `CONTINUE` chỉ được in liều hiện tại của bệnh nhân, xóa `rec.dose` khi thẻ chuyển sang `HOLD`/`AVOID`/`DEFER` (`HF-R2-R2-05`, `HF-R2-R2-13`).
   - Nhân tần suất dùng/ngày trong `isAtOrAboveTargetDose`, nối đủ 10 mã `contraindications` vào `gates.ts`/`reviewMeds.ts`, chặn `UPTITRATE` BB khi sốc tim ngoại trú, quét `metoprolol_tartrate`/non-HF BB (`HF-R2-R2-04`, `HF-R2-R2-08`).
   - Sửa Fail-Closed `rhythm === undefined` của Ivabradine, chặn `Ivabradine + Diltiazem/Verapamil`, giữ chặn `Diltiazem/Verapamil` ở `HFimpEF`, giới hạn `Eplerenone <= 25 mg` với CYP3A4 vừa, giảm 50% liều `Digoxin` với `Amiodarone`/P-gp và chặn `wpw_afib` (`HF-R2-R2-06`, `HF-R2-R2-09`, `HF-R2-R2-10`, `HF-R2-R2-12`).
4. **Hoàn tất 100% toàn vẹn trích dẫn (`QA-2`, `QA-7`, `QA-10`)**:
   - Ngắt bỏ hoàn toàn `kb/citations/_sample.json` khỏi `src/modules/hf/`, sửa 5 ngưỡng mượn trích dẫn nhầm thuốc trong `kb/thresholds/hf.json`, và cập nhật đúng `quote` nguyên văn cho 12 tệp thuốc HF (`HF-R2-R2-14`).
