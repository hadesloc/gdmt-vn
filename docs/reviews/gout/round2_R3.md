# BÁO CÁO PHẢN BIỆN AN TOÀN ĐỐI NGHỊCH ĐỘC LẬP (ADVERSARIAL REVIEW) – VÒNG 2
## Module: Bệnh Gút (`gout`) – GDMT-VN

> **Reviewer**: **R3 – Chuyên gia Phản biện An toàn Lâm sàng & Kiểm thử Biên đối nghịch (Adversarial Clinical Safety & Edge-Case Tester)**  
> **Vòng đánh giá**: **Round 2 (Kiểm định độc lập sau khắc phục Vòng 1)**  
> **Quy chuẩn áp dụng**: [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md), [QA_FINDINGS.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/QA_FINDINGS.md), [MODULE_CONTRACT.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/MODULE_CONTRACT.md)  
> **Cam kết độc lập**: Hoàn toàn độc lập (không đọc bất kỳ tài liệu Vòng 2 nào của R1/R2; chỉ đọc mã nguồn hiện hành, KB, `round1_R3.md`, `round1_RESPONSE.md` và chạy trực tiếp `evaluate()`). Không chỉnh sửa bất kỳ tệp nào trong `src/`, `kb/`, `tests/`, `tools/`.  
> **Quy mô thực thi trực tiếp `evaluate()`**: **102 kịch bản đối nghịch (`S01` – `S102`)** trải rộng trên cả 3 hồ sơ (`INTL` / `VN` / `US`), 2 bối cảnh (`outpatient` / `inpatient`), 2 hệ đơn vị (`SI µmol/L` ↔ `Quy ước mg/dL`), và phối hợp đa bệnh lý từ 1 đến **7 module đồng thời** (`gout`, `ckd`, `htn`, `hf`, `dm2`, `af`, `lipid`).  
> **Báo cáo JSON chuẩn hóa**: [round2_R3.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/gout/round2_R3.json)

---

## 0. Tóm Tắt Kết Quả & Kết Luận Vòng 2

| Mức độ nghiêm trọng (`severity`) | Số lượng | Ngưỡng qua vòng (`PASS`) | Đánh giá |
|---|:---:|:---:|:---:|
| **`critical`** (Nguy cơ gây hại trực tiếp / tử vong / bỏ lọt chống chỉ định tuyệt đối / sập engine / hồi quy đơn vị) | **10** | `= 0` | ❌ **KHÔNG ĐẠT** |
| **`major`** (Sai lệch phác đồ lớn / thiếu cảnh báo bắt buộc / mâu thuẫn đa module / lọt liều thận) | **6** | `= 0` | ❌ **KHÔNG ĐẠT** |
| **`minor`** (Lỗi hiển thị liều trên thẻ chặn, nhiễu sàng lọc HLA-B*58:01, quy đổi nhãn đích urat) | **2** | Cho phép nếu nhỏ | ⚠️ **CẦN SỬA** |
| **`suggestion`** (Gợi ý cải tiến tùy chọn) | **0** | - | - |
| **TỔNG CỘNG** | **18** | `0 critical, 0 major` | **VERDICT: FAIL** |

> [!CAUTION]
> **KẾT LUẬN VÒNG 2 (REVIEWER R3): `FAIL` (KHÔNG ĐẠT)**  
> Mặc dù bản cập nhật sau Vòng 1 đã tách kiến trúc module `src/modules/gout/` rõ ràng (16 tệp chuyên biệt) và xử lý tốt phần lớn lỗi Vòng 1 trên hệ đơn vị SI (`µmol/L`), kiểm thử đối kháng Vòng 2 qua **102 ca chạy trực tiếp `evaluate()`** đã phát hiện **10 lỗi `CRITICAL`** và **6 lỗi `MAJOR`**, nổi bật gồm:
> 1. **`GOUT-R2-R3-01` (Hồi quy nghiêm trọng từ bản vá `R3-GOUT-15`)**: Khi bật hệ đơn vị quy ước `units.urat = 'mg_dL'`, `helpers.ts` đem `ctx.patient.uricAcid` (**đã bị `evaluate.ts` nhân `59.48` sang `µmol/L`**) đi so sánh trực tiếp với các ngưỡng `mg/dL` (`6.0`, `5.0`, `3.0`, `9.0`, `8.0`)! Hệ quả: 100% bệnh nhân đang dùng ULT dù đã đạt đích sâu (`4.5 mg/dL` hay thậm chí `2.0 mg/dL` dưới sàn an toàn) đều bị kết luận sai là **chưa đạt đích** và bị ra lệnh **`[UPTITRATE]` ULT + `[START:colchicine]`**; đồng thời 100% ca cơn gút đầu tiên nhẹ (kể cả **Preset 5 `gout_preset_first_flare_mild`** hay `sUA = 5.0 mg/dL`) bị gắn nhầm `> 9 mg/dL` và kê oan Allopurinol + Colchicine (`S60`, `S61`, `S62`, `S102`).
> 2. **`GOUT-R2-R3-02` & `GOUT-R2-R3-03` (Viêm khớp nhiễm khuẩn, Nhiễm trùng tiến triển & Chống chỉ định Steroid)**:
>    - Nhánh thai kỳ trong `rules.flare.ts:57` chạy **trước** kiểm tra nhiễm trùng khiến thai phụ nghi viêm khớp nhiễm khuẩn (`septicArthritisSuspected: true`) bị kê **`[START:prednisolone]` uống hoặc tiêm nội khớp thẳng vào khớp nghi mủ** (`S24`); `hasActiveInfection` bỏ sót `customInputs.septicArthritisSuspected` (`S22`) và sốt cao `39.2°C` trên viêm đơn khớp cấp (`S23`); khi `eGFR` bình thường, bệnh nhân có `conditions.septicArthritisSuspected: true` không nhận được bất kỳ thẻ `[REFER]` chọc dò dịch khớp khẩn cấp nào (`S21`, `S26`).
>    - Luật dự phòng `gout.prophylaxis.flare` (`rules.prophylaxis.ts:239-256`) tự động kê **`[START:prednisolone]` kéo dài 3–6 tháng** bất chấp `activeInfection: true` (`S25`), `steroidContraindicated: true` (`S79`, `S80`), hoặc `dkaSuspected: true` (`S78`).
> 3. **`GOUT-R2-R3-04` (Bỏ lọt tương tác tử vong Colchicine + `Paxlovid` / `nirmatrelvir_ritonavir`)**: Không dừng Colchicine đang uống (`S43`) và chủ động kê mới `[START:colchicine] 1.2 + 0.6 mg` trên bệnh nhân đang điều trị COVID-19 bằng `nirmatrelvir_ritonavir` (`S44`).
> 4. **`GOUT-R2-R3-05` (Regex tách tần suất `freq` bỏ sót `'2 lần/ngày'` / `'3 lần/ngày'` & thiếu trần độc tính mạn Colchicine)**: Đọc nhầm `Allopurinol 300 mg, freq: '3 lần/ngày'` (`900 mg/ngày > trần 800 mg`) thành `300 mg/ngày` rồi tăng liều tiếp (`S70`); bỏ lọt hoàn toàn liều ngộ độc `Colchicine 1 mg, freq: '3 lần/ngày'` (`3 mg/ngày` mạn tính!) không phát bất kỳ cảnh báo giảm/ngừng nào (`S71`, `S72`).
> 5. **`GOUT-R2-R3-06` (Mù thuốc hạ áp viên phối hợp FDC `valsartan_hctz` / `losartan_hctz` / `perindopril_indapamide`)**: Bỏ lọt **Triple Whammy AKI** khi kê `[START:naproxen] 500 mg × 2` trên nền `valsartan_hctz` (`Co-Diovan`, chứa sẵn cả ARB + HCTZ) (`S53`), bỏ lọt đổi Thiazide (`S75`) hoặc khuyên đổi sang Losartan trùng lặp ARB (`S76`).
> 6. **`GOUT-R2-R3-07`, `08`, `09`, `10`**: Xơ gan Child-Pugh B/C không đồng bộ `liverDisease`, kê Colchicine không giảm liều và tăng liều Febuxostat lên `120 mg` trên Child-Pugh C (`S81`, `S82`, `S83`, `S98`); tăng liều Probenecid/Benzbromarone trên bệnh nhân **tăng sản xuất acid uric nội sinh** ở `INTL`/`US` (`S88`, `S89`); phát lệnh **`[STOP:aspirin]` khẩn cấp** ở bệnh nhân mới đặt stent mạch vành (`recentAcs: true`) chỉ có tiền sử xuất huyết cũ (`bleedingHistory: true`) (`S97`); và sập engine `TypeError: patient.currentMeds is not iterable` khi thiếu mảng `currentMeds` (`S16`).

---

## 1. Kiểm Chứng Khắc Phục 19 Phát Hiện Vòng 1 Của R3 (`R3-GOUT-01` → `R3-GOUT-19`)

| Mã Vòng 1 | Mức độ V1 | Nội dung phát hiện Vòng 1 | Trạng thái tại Vòng 2 | Bằng chứng kiểm chứng thực nghiệm Vòng 2 |
|---|:---:|---|:---:|---|
| `R3-GOUT-01` | `CRITICAL` | Mù phác đồ trùng lặp 2 thuốc XOI (`allopurinol` + `febuxostat`), tăng liều cả hai | ✅ **ĐÃ KHẮC PHỤC** | Đã có `gout.safety.duplicate_xoi` (`rules.safety.ult.ts`), nhóm `xoi` trong `duplicates.ts` & `merge.ts`, phát `[STOP]` 1 trong 2 XOI kèm cảnh báo. |
| `R3-GOUT-02` | `CRITICAL` | Ra lệnh `CONTINUE` / `UPTITRATE` Allopurinol ở BN đã dị ứng Allopurinol (`allopurinolIntolerant=true`) | ✅ **ĐÃ KHẮC PHỤC** | Đã có `gout.safety.allopurinol_intolerant_active` phát `[STOP:allopurinol]` ngay cả trong cơn cấp và chuyển nhánh Febuxostat (`S36`). |
| `R3-GOUT-03` | `CRITICAL` | Không dừng Diclofenac/Etoricoxib sau NMCT cấp, kê Naproxen khi `hasCvd=true` hoặc `LVEF=28%` | ✅ **ĐÃ KHẮC PHỤC** | `S50` (`LVEF 30%` + `etoricoxib`) phát đúng `[STOP:etoricoxib]`; `hasEstablishedCvd` & `hasHeartFailure` đã đọc `customInputs.hasCvd`, `recentAcs`, `lvef < 50`. |
| `R3-GOUT-04` | `CRITICAL` | Bịa đặt cơn gút cấp ở 100% BN nội viện (`inpatient`) khi chưa nhập `acuteFlare` | ✅ **ĐÃ KHẮC PHỤC** | `isAcuteGoutFlare()` chỉ trả `true` khi `customInputs.acuteFlare === true`; kiểm chứng sạch trên `S18`. |
| `R3-GOUT-05` | `CRITICAL` | `CONTINUE Colchicine 1 mg/ngày` ở CKD G4 do va chạm `prophylaxis` + `merge.ts` | ⚠️ **KHẮC PHỤC MỘT PHẦN** | Trường hợp ghi `dose: 1` đơn thuần đã giảm liều tốt, NHƯNG khi ghi tần suất `freq: '3 lần/ngày'` (`S72`) hoặc `1 mg × 3 lần/ngày` ở eGFR bình thường (`S71`) vẫn lọt lưới → xem **`GOUT-R2-R3-05`**. |
| `R3-GOUT-06` | `CRITICAL` | Kê `START Naproxen` & `CONTINUE Aspirin` khi đang xuất huyết nội sọ cấp (`ICH`) | ⚠️ **QUÁ TAY CHIỀU NGƯỢC LẠI** | Đã chặn Naproxen khi `ICH`, NHƯNG do gộp chung `hasPepticUlcerOrBleed()` nên BN sau ACS/stent chỉ có **tiền sử xuất huyết cũ** (`bleedingHistory=true`) cũng bị phát lệnh **`[STOP:aspirin]` khẩn cấp** (`S97`) → xem **`GOUT-R2-R3-09`**. |
| `R3-GOUT-07` | `CRITICAL` | Tăng liều XOI vượt trần FDA `800 mg` và vượt trần suy thận `eGFR=8` / giữ `Febuxostat 80 mg` ở `eGFR=18` | ⚠️ **KHẮC PHỤC MỘT PHẦN** | Dạng số `dose: 800` đã chặn tốt, NHƯNG lỗi tách liều `freq: '3 lần/ngày'` (`300 mg × 3 = 900 mg`, `S70`) và đơn vị `'2 viên'` Febuxostat ở CKD G4 (`S73`) làm lọt lại cả 2 trần này → xem **`GOUT-R2-R3-05`**, **`GOUT-R2-R3-13`**. |
| `R3-GOUT-08` | `CRITICAL` | `findMed` chỉ lấy thuốc đầu làm sót `STOP probenecid` ở thai kỳ & rơi `CONTINUE allopurinol` | ✅ **ĐÃ KHẮC PHỤC** | Đã chuyển sang `findAllMeds()`, dừng toàn bộ ULT trong thai kỳ (`S84`) và giữ đúng ULT hợp lệ trong cơn cấp (`S54`, `S55`). |
| `R3-GOUT-09` | `MAJOR` | Kê Prednisolone 30–35 mg & dự phòng 3–6 tháng trên ĐTĐ mất kiểm soát nặng / DKA / nhiễm trùng không cảnh báo | ❌ **CHƯA ĐẠT / CÒN LỖI NẶNG** | Đã chặn cắt cơn khi tích tay `dkaSuspected=true`, NHƯNG: (1) luật dự phòng `gout.prophylaxis.flare` vẫn kê **`[START:prednisolone]` 3–6 tháng** ngay giữa `activeInfection=true` (`S25`), `steroidContraindicated=true` (`S79`, `S80`) và `dkaSuspected=true` (`S78`); (2) khi `glucose=22 mmol/L` + `pepticUlcer=true` mà chưa tích `dkaSuspected` vẫn kê uống Prednisolone `30–35 mg/ngày` (`S77`) → xem **`GOUT-R2-R3-02`**, **`GOUT-R2-R3-03`**, **`GOUT-R2-R3-11`**. |
| `R3-GOUT-10` | `MAJOR` | Colchicine fail-open khi thiếu `scr`, kê trên `Statin + CKD`, sót `Amiodarone` | ⚠️ **KHẮC PHỤC MỘT PHẦN** | Đã chặn khi `atorvastatin`/`amiodarone` nằm sẵn trong `currentMeds` (`S48`, `S92`), NHƯNG bỏ sót **`nirmatrelvir_ritonavir` (`Paxlovid`)** (`S43`, `S44` → **`GOUT-R2-R3-04`**) và khi đánh giá đồng thời `gout + ckd` (Preset 1 `S01`, `S03`), module `ckd` kê mới `atorvastatin 20 mg` cùng lúc module `gout` kê mới `colchicine` (`GOUT-R2-R3-16`). |
| `R3-GOUT-11` | `MAJOR` | Tăng acid uric không triệu chứng đang uống nhầm Allopurinol bị `UPTITRATE` | ✅ **ĐÃ KHẮC PHỤC** | Đã chặn chuẩn độ tăng liều và bổ sung rà soát ngừng ULT không có chỉ định khi `asymptomaticHyperuricemia === true`. |
| `R3-GOUT-12` | `MAJOR` | Gán `drugId: 'losartan'` trong `SWITCH` Thiazide gây `[HOLD:losartan]` giả khi `K+ = 5.8` | ⚠️ **KHẮC PHỤC MỘT PHẦN** | Đã sửa khi dùng đơn chất `hydrochlorothiazide` (`S10`–`S12`), NHƯNG mù hoàn toàn viên phối hợp FDC `losartan_hctz` / `valsartan_hctz` (`S75`, `S76` → **`GOUT-R2-R3-06`**). |
| `R3-GOUT-13` | `MAJOR` | Ngõ cụt điều trị khi `STOP` Allopurinol do `HLA-B*58:01 (+)` và khi dùng `Azathioprine` | ⚠️ **KHẮC PHỤC MỘT PHẦN** | Đã sửa tốt khi truyền chữ thường `hlab5801: 'positive'` (`S32`, `S34`) và `azathioprine` (`S39`), NHƯNG khi truyền khóa camelCase `hlaB5801: 'positive'` (được `gates.ts` hỗ trợ) lại tái phát ngõ cụt mất Febuxostat (`S33`, `S35` → **`GOUT-R2-R3-12`**). |
| `R3-GOUT-14` | `MAJOR` | Mâu thuẫn trên `Profile VN` khi `hlab5801 = 'not_done'` | ✅ **ĐÃ KHẮC PHỤC** | Trên `VN` (`S02`, `S29`) đã kèm cảnh báo rõ ràng về xét nghiệm `HLA-B*58:01` và theo dõi phản ứng da SCAR. (Tuy nhiên còn lỗi nhiễu nhỏ ở BN đang dùng sẵn Febuxostat/Benzbromarone → **`GOUT-R2-R3-18`**). |
| `R3-GOUT-15` | `MAJOR` | Sai số biên đơn vị `6.0 mg/dL` và lệch chuẩn đích tophi trên `US` | ❌ **HỒI QUY CRITICAL (`REGRESSION`)** | Đích `US` ở chế độ SI đã sửa, **NHƯNG bản vá đơn vị `mg/dL` trong `helpers.ts` đọc nhầm `ctx.patient.uricAcid` (đã quy đổi sang `µmol/L` tại `evaluate.ts:50-61`) đem so sánh với `6.0` / `5.0` / `3.0` / `9.0`**, làm hỏng toàn bộ nhánh ULT khi bật `units.urat = 'mg_dL'` (`S60`, `S61`, `S62`, `S102` → **`GOUT-R2-R3-01`**)! |
| `R3-GOUT-16` | `MINOR` | Liều Colchicine `0.3 mg/ngày` trên `Profile VN` không khớp viên `1 mg` | ✅ **ĐÃ KHẮC PHỤC** | Trên `Profile VN` đã chuyển sang liều thực tế bẻ đôi viên `0.5 mg` cách ngày / hàng ngày tùy mức lọc cầu thận. |
| `R3-GOUT-17` | `MINOR` | Cảnh báo giả `ix.nsaid_corticosteroid_gi_bleed` giữa NSAID đã `STOP` và Prednisolone mới | ✅ **ĐÃ KHẮC PHỤC** | `S49`, `S50`, `S51` dừng Indomethacin/Etoricoxib/Meloxicam và khởi trị Prednisolone/Colchicine không còn bắn alert giả với thuốc đã `STOP`. |
| `R3-GOUT-18` | `MINOR` | Hiện thẻ đích `< 360` khi `DEFER` ULT; `CONTINUE aspirin` cứng khi dùng kèm Apixaban | ✅ **ĐÃ KHẮC PHỤC** | `Preset 5` ở chế độ SI (`S13`–`S15`) và `S59` không còn hiện thẻ đích urat thừa khi chưa có chỉ định ULT. |
| `R3-GOUT-19` | `SUGGESTION` | Bổ sung các trường đầu vào nâng cao vào `src/modules/gout/inputs.ts` | ✅ **ĐÃ KHẮC PHỤC** | Đã cập nhật đầy đủ các trường lâm sàng trong `src/modules/gout/inputs.ts`. |

---

## 2. Bảng Tổng Hợp 102 Kịch Bản Đối Nghịch Đã Thực Thi Qua `evaluate()` (`S01` → `S102`)

Toàn bộ 102 kịch bản dưới đây được nạp và thực thi trực tiếp qua hàm `evaluate(patient, settings)` thật của `src/engine/evaluate.ts` (sử dụng Vite SSR loader nạp nguyên vẹn `import.meta.glob` của toàn bộ 8 module và KB JSON):

| Mã | Hồ sơ / Bối cảnh / Đơn vị | Tóm tắt ca lâm sàng & Mục tiêu công phá | Tóm tắt đầu ra thực tế từ `evaluate()` | Kết quả / Mã lỗi |
|:---:|:---:|---|---|:---:|
| `S01` | `INTL` / Out / SI | Preset 1 `gout_preset_acute_monoarthritis_ckd` (`gout`+`ckd`, `scr=150` eGFR 43, cơn cấp khớp gối) | `[START:prednisolone]` nội khớp + `[START:allopurinol]` 50–100 mg + **`[START:colchicine]` 0.5 mg + `[START:atorvastatin]` 20 mg** + Alert `ix.statin_colchicine` | ⚠️ `GOUT-R2-R3-16` |
| `S02` | `VN` / Out / SI | Preset 1 `gout_preset_acute_monoarthritis_ckd` trên hồ sơ BYT Việt Nam | `[START:prednisolone]` nội khớp + `[DEFER]` ULT 1–2 tuần qua cơn cấp (đúng QĐ 361/BYT) + `[START:atorvastatin]` 20 mg | ✅ PASS |
| `S03` | `US` / Out / SI | Preset 1 `gout_preset_acute_monoarthritis_ckd` trên hồ sơ ACR/FDA Hoa Kỳ | `[START:prednisolone]` nội khớp + `[START:allopurinol]` + **`[START:colchicine]` 0.6 mg + `[START:atorvastatin]` 20 mg** + Alert `ix.statin_colchicine` | ⚠️ `GOUT-R2-R3-16` |
| `S04` | `INTL` / Out / SI | Preset 2 `gout_preset_chronic_tophaceous_severe` (`sUA=620`, tophi, 4 cơn/năm, `hlab5801=negative`) | `[START:allopurinol]` 100 mg + `[START:colchicine]` 0.5–1 mg dự phòng 3–6 tháng + đích `< 300 µmol/L` | ✅ PASS |
| `S05` | `VN` / Out / SI | Preset 2 `gout_preset_chronic_tophaceous_severe` trên hồ sơ BYT | `[START:allopurinol]` 100 mg + `[START:colchicine]` + tiêu đề đích ghi **`< 320 µmol/L (< 5 mg/dL)`** (lệch quy đổi 320 µmol/L = 5.4 mg/dL) | ⚠️ `GOUT-R2-R3-18` |
| `S06` | `US` / Out / SI | Preset 2 `gout_preset_chronic_tophaceous_severe` trên hồ sơ US | `[START:allopurinol]` 100 mg + `[START:colchicine]` 0.6 mg + đích `< 360 µmol/L (< 6 mg/dL)` đúng ACR 2020 | ✅ PASS |
| `S07` | `INTL` / Out / SI | Preset 3 `gout_preset_hlab5801_positive` (`hlab5801='positive'`, 3 cơn/năm) | `[AVOID:allopurinol]` (còn dính chuỗi `dose` của START) + `[START:febuxostat]` 40–80 mg + `[START:colchicine]` | ⚠️ `GOUT-R2-R3-17` |
| `S08` | `VN` / Out / SI | Preset 3 `gout_preset_hlab5801_positive` trên hồ sơ VN | `[AVOID:allopurinol]` + `[START:febuxostat]` 40 mg + `[START:colchicine]` | ⚠️ `GOUT-R2-R3-17` |
| `S09` | `US` / Out / SI | Preset 3 `gout_preset_hlab5801_positive` trên hồ sơ US | `[AVOID:allopurinol]` + `[START:febuxostat]` 40 mg + `[START:colchicine]` 0.6 mg | ⚠️ `GOUT-R2-R3-17` |
| `S10` | `INTL` / Out / SI | Preset 4 `gout_preset_htn_on_thiazide` (`gout`+`htn`, đang dùng `hydrochlorothiazide 25 mg`) | `[SWITCH:hydrochlorothiazide]` đổi sang Losartan + `[START:allopurinol]` 100 mg + `[START:colchicine]` | ✅ PASS |
| `S11` | `VN` / Out / SI | Preset 4 `gout_preset_htn_on_thiazide` trên hồ sơ VN | `[SWITCH:hydrochlorothiazide]` sang Losartan + `[START:allopurinol]` + `[START:colchicine]` | ✅ PASS |
| `S12` | `US` / Out / SI | Preset 4 `gout_preset_htn_on_thiazide` trên hồ sơ US | `[SWITCH:hydrochlorothiazide]` sang Losartan + `[START:allopurinol]` + `[START:colchicine]` | ✅ PASS |
| `S13` | `INTL` / Out / SI | Preset 5 `gout_preset_first_flare_mild` (cơn đầu nhẹ, `sUA=440`, không biến chứng) | `[DEFER]` Chưa chỉ định ULT + Tư vấn lối sống (0 kê thuốc oan) | ✅ PASS |
| `S14` | `VN` / Out / SI | Preset 5 `gout_preset_first_flare_mild` trên hồ sơ VN | `[DEFER]` Chưa chỉ định ULT + Tư vấn lối sống | ✅ PASS |
| `S15` | `US` / Out / SI | Preset 5 `gout_preset_first_flare_mild` trên hồ sơ US (chế độ SI) | `[DEFER]` Chưa chỉ định ULT + Tư vấn lối sống | ✅ PASS |
| `S16` | `INTL` / Out / SI | Đầu vào tối thiểu hợp lệ `{ age: 50, sex: 'male', selectedModules: ['gout'] }` **không truyền `currentMeds`** | **CRASH**: `TypeError: patient.currentMeds is not iterable` tại `src/engine/units.ts:242`! | ❌ `GOUT-R2-R3-10` |
| `S17` | `INTL` / Out / SI | Đầu vào thiếu toàn bộ xét nghiệm (`age:50, sex:'male', conditions:{}, currentMeds:[]`) | Fail-closed: `0 START/UPTITRATE`, yêu cầu bổ sung `eGFR` & `uricAcid` | ✅ PASS |
| `S18` | `VN` / Inp / SI | Đầu vào thiếu xét nghiệm ở bệnh nhân nội trú (`inpatient`, không tích `acuteFlare`) | Fail-closed: không bịa cơn gút cấp nội viện (`R3-GOUT-04` đã được vá), `0 START` | ✅ PASS |
| `S19` | `US` / Out / SI | Rỗng cả tuổi và giới (`{ selectedModules:['gout'], conditions:{}, currentMeds:[] }`) | Không crash, fail-closed an toàn, đòi dữ liệu đầu vào thiết yếu | ✅ PASS |
| `S20` | `US` / Out / SI | Đang cơn gút cấp (`acuteFlare=true`) nhưng thiếu hoàn toàn `scr` và `uricAcid` | Chặn tuyệt đối Colchicine/NSAID/XOI khi chưa rõ chức năng thận; đòi `scr`/`egfr` | ✅ PASS |
| `S21` | `INTL` / Out / SI | Nghi viêm khớp nhiễm khuẩn (`conditions.septicArthritisSuspected=true`), `scr=82`, viêm đơn khớp lớn | **KHÔNG có thẻ `[REFER]` chọc dò dịch khớp cấp cứu**; lặng lẽ kê `[START:colchicine]` uống + `[START:allopurinol]`! | ❌ `GOUT-R2-R3-02` |
| `S22` | `INTL` / Out / SI | Nghi viêm khớp nhiễm khuẩn qua `customInputs.septicArthritisSuspected=true`, viêm đơn khớp lớn | **Kê `[START:prednisolone]` tiêm Corticosteroid nội khớp** thẳng vào khớp đang nghi nhiễm khuẩn! | ❌ `GOUT-R2-R3-02` |
| `S23` | `INTL` / Out / SI | Viêm đơn khớp lớn sưng nóng đỏ cấp + **Sốt cao `39.2°C` (`fever=true`)** | **Kê `[START:prednisolone]` tiêm Corticosteroid nội khớp** mà không cảnh báo loại trừ viêm khớp mủ! | ❌ `GOUT-R2-R3-02` |
| `S24` | `INTL` / Out / SI | **Thai phụ (`pregnant=true`) + Nghi viêm khớp nhiễm khuẩn (`septicArthritisSuspected=true`)** | Nhánh thai kỳ chạy trước nhiễm trùng → kê **`[START:prednisolone]` 30–35 mg/ngày hoặc tiêm nội khớp**! | ❌ `GOUT-R2-R3-02` |
| `S25` | `INTL` / Out / SI | CKD G4 (`scr=255`) + `activeInfection=true` + `tophi=true` + `acuteFlare=true` | `rules.flare` phát `[REFER]` nhiễm trùng, nhưng `rules.prophylaxis` đồng thời phát **`[START:prednisolone]` uống 3–6 tháng**! | ❌ `GOUT-R2-R3-03` |
| `S26` | `INTL` / Inp / SI | Nội trú (`inpatient`) cơn cấp + `conditions.septicArthritisSuspected=true`, `scr=88` | **0 thẻ `[REFER]` chọc hút/cấy dịch khớp**; kê `[START:colchicine]` + `[START:allopurinol]` | ❌ `GOUT-R2-R3-02` |
| `S27` | `VN` / Inp / SI | Nội trú (`VN`) cơn cấp + `activeInfection=true` + CKD G4 (`scr=265`) | Do `VN` hoãn khởi trị ULT trong cơn cấp nên không rơi vào `prophylaxis`, phát đúng `[REFER]` + `[DEFER]` | ✅ PASS |
| `S28` | `INTL` / Out / SI | Người gốc Đông Nam Á (`southeastAsianDescent=true`), chưa làm `HLA-B*58:01` (`not_done`) | Phát `[CONSIDER]` sàng lọc `HLA-B*58:01` + cảnh báo SCAR trên thẻ `[START:allopurinol]` | ✅ PASS |
| `S29` | `VN` / Out / SI | Hồ sơ `VN`, tophi, `hlab5801='not_done'` | Có cảnh báo `HLA-B*58:01`; nhãn đích urat ghi `< 320 µmol/L (< 5 mg/dL)` lệch quy đổi | ⚠️ `GOUT-R2-R3-18` |
| `S30` | `US` / Out / SI | Hồ sơ `US` + người gốc Đông Nam Á (`southeastAsianDescent=true`), `hlab5801='not_done'` | Phát đúng khuyến cáo sàng lọc `HLA-B*58:01` theo ACR 2020 | ✅ PASS |
| `S31` | `US` / Out / SI | Người gốc Âu (`southeastAsianDescent=false`) trên hồ sơ `US` | Không ép sàng lọc `HLA-B*58:01` thường quy (đúng ACR 2020 conditional) | ✅ PASS |
| `S32` | `INTL` / Out / SI | `HLA-B*58:01` dương tính truyền khóa thường `hlab5801: 'positive'`, chưa dùng ULT | `[AVOID:allopurinol]` + `[START:febuxostat]` + `[START:colchicine]` (thẻ `AVOID` dính chuỗi `dose`) | ⚠️ `GOUT-R2-R3-17` |
| `S33` | `INTL` / Out / SI | `HLA-B*58:01` dương tính truyền khóa camelCase **`hlaB5801: 'positive'`**, chưa dùng ULT | `gates.ts` chặn `[AVOID:allopurinol]`, nhưng `helpers.safety.ts` mù khóa camelCase → **MẤT `[START:febuxostat]`, vẫn kê `[START:colchicine]`**! | ❌ `GOUT-R2-R3-12` |
| `S34` | `VN` / Out / SI | Đang uống `allopurinol 100 mg` có `hlab5801: 'positive'` (chữ thường) | Phát `[STOP:allopurinol]` khẩn cấp + chuyển sang `[START:febuxostat]` 40 mg | ✅ PASS |
| `S35` | `VN` / Out / SI | Đang uống `allopurinol 100 mg` có **`hlaB5801: 'positive'`** (camelCase) | `medReview` phát `[STOP:allopurinol]`, nhưng module Gút **bỏ sót không khởi trị `[START:febuxostat]` thay thế**! | ❌ `GOUT-R2-R3-12` |
| `S36` | `INTL` / Out / SI | Tiền sử dị ứng nặng / SCAR với Allopurinol (`allopurinolIntolerant=true`) chuyển sang Febuxostat | Phát `[START:febuxostat]` nhưng **`warnings: undefined` — thiếu cảnh báo theo dõi phát ban/quá mẫn da** (FDA Uloric 5.3 / EULAR 2016) | ❌ `GOUT-R2-R3-15` |
| `S37` | `INTL` / Out / SI | Đang dùng đồng thời `allopurinol 300 mg` + `azathioprine 100 mg` | Phát `[STOP:allopurinol]` khẩn cấp + `SafetyAlert` mức `CRITICAL` (`ix.allopurinol_azathioprine`) | ✅ PASS |
| `S38` | `US` / Out / SI | Đang dùng đồng thời `febuxostat 40 mg` + `mercaptopurine 50 mg` | Phát `[STOP:febuxostat]` khẩn cấp + `SafetyAlert` mức `CRITICAL` (`ix.febuxostat_azathioprine`) | ✅ PASS |
| `S39` | `INTL` / Out / SI | Bệnh nhân chưa dùng ULT đang điều trị `azathioprine 100 mg` cần hạ urat | Chặn tuyệt đối cả Allopurinol & Febuxostat, mở nhánh đánh giá Uricosuric / hội chẩn | ✅ PASS |
| `S40` | `INTL` / Out / SI | Đang dùng `colchicine 0.5 mg` + `clarithromycin 500 mg` (eGFR bình thường) | Phát `[STOP:colchicine]` khẩn cấp + `SafetyAlert` mức `CRITICAL` | ✅ PASS |
| `S41` | `VN` / Out / SI | Đang dùng `colchicine 0.5 mg` + `itraconazole 200 mg` trên nền CKD G3b | Phát `[STOP:colchicine]` khẩn cấp + `SafetyAlert` | ✅ PASS |
| `S42` | `US` / Out / SI | Cơn gút cấp trên bệnh nhân đang uống đơn chất `ritonavir 100 mg` | Chặn tuyệt đối Colchicine, chuyển sang kháng viêm thay thế an toàn | ✅ PASS |
| `S43` | `US` / Out / SI | Đang dùng `colchicine 0.6 mg` + **`nirmatrelvir_ritonavir` (`Paxlovid`)** trên CKD G3a | **0 thẻ `[STOP:colchicine]`, 0 `SafetyAlert`** — bỏ lọt hoàn toàn tương tác tử vong với Paxlovid! | ❌ `GOUT-R2-R3-04` |
| `S44` | `US` / Out / SI | Cơn gút cấp trên bệnh nhân đang điều trị COVID-19 bằng **`nirmatrelvir_ritonavir` (`Paxlovid`)** | **Kê mới `[START:colchicine]` 1.2 mg + 0.6 mg sau 1 giờ** ngay trên nền Paxlovid! | ❌ `GOUT-R2-R3-04` |
| `S45` | `INTL` / Out / SI | Ghép thận CKD G3b đang dùng `colchicine 0.5 mg` + `cyclosporine 100 mg` | Phát `[STOP:colchicine]` khẩn cấp + `SafetyAlert` | ✅ PASS |
| `S46` | `INTL` / Out / SI | Đang dùng `colchicine 1 mg` + `diltiazem 120 mg` (ức chế CYP3A4 vừa, eGFR bình thường) | Phát `[REDUCE:colchicine]` giảm liều an toàn do tương tác Diltiazem | ✅ PASS |
| `S47` | `US` / Out / SI | Đa module (`gout`+`lipid`+`htn`): `colchicine 0.6 mg` + `verapamil` + `simvastatin 40 mg` ở CKD G3a | Phát `[STOP:colchicine]` + xử lý tương tác Simvastatin–Verapamil | ✅ PASS |
| `S48` | `INTL` / Out / SI | Đa module (`gout`+`af`+`lipid`): `colchicine 0.5 mg` + `amiodarone` + `rosuvastatin` + `apixaban` ở CKD G3b | Phát `[STOP:colchicine]` (đã nhận diện P-gp inhibitor `amiodarone` + CKD) | ✅ PASS |
| `S49` | `INTL` / Out / SI | Đa module (`gout`+`af`): Đang uống `indomethacin 50 mg` + `apixaban 5 mg` trong cơn gút cấp | Phát `[STOP:indomethacin]`, chặn Naproxen, chuyển sang Colchicine/Steroid, không bắn alert giả | ✅ PASS |
| `S50` | `VN` / Out / SI | Đa module (`gout`+`hf`): Đang uống `etoricoxib 90 mg` trên suy tim HFrEF (`LVEF 30%`) | Phát `[STOP:etoricoxib]` khẩn cấp, tối ưu trụ cột suy tim | ✅ PASS |
| `S51` | `VN` / Out / SI | Đang uống `meloxicam 15 mg` (NSAID ngoài KB) + `warfarin 5 mg` + `pepticUlcer=true` | Nhận diện đúng `meloxicam` là NSAID, phát `[STOP:meloxicam]`, bảo vệ dạ dày | ✅ PASS |
| `S52` | `INTL` / Out / SI | Bẫy Triple Whammy đơn chất: `lisinopril` + `furosemide` + `ritonavir` trong cơn cấp | `isTripleWhammyRisk()` nhận diện ACEi + lợi tiểu → chặn `[START:naproxen]`, chuyển sang Prednisolone | ✅ PASS |
| `S53` | `INTL` / Out / SI | **Bẫy Triple Whammy FDC**: `valsartan_hctz 80/12.5 mg` (`Co-Diovan`) + `ritonavir` trong cơn cấp | **Kê `[START:naproxen]` 500 mg × 2 lần/ngày** tạo bộ ba độc thận cấp ARB + HCTZ + NSAID! | ❌ `GOUT-R2-R3-06` |
| `S54` | `INTL` / Out / SI | Đang uống `allopurinol 300 mg` (`sUA=410`) khi bùng cơn gút cấp | Phát `[CONTINUE:allopurinol]` (không ngừng và không tăng liều giữa cơn cấp) | ✅ PASS |
| `S55` | `VN` / Out / SI | Đang uống `febuxostat 40 mg` đạt đích (`sUA=330`) khi bùng cơn gút cấp | Phát `[CONTINUE:febuxostat]`, nhưng **dư thẻ `[CONSIDER]` sàng lọc `HLA-B*58:01` cho Allopurinol** | ⚠️ `GOUT-R2-R3-18` |
| `S56` | `US` / Out / SI | Chưa dùng ULT, đang cơn cấp + 3 cơn/năm trên hồ sơ `US` | Cho phép khởi trị sớm `[START:allopurinol]` ngay trong cơn cấp kèm kháng viêm (đúng ACR 2020 conditional) | ✅ PASS |
| `S57` | `INTL` / Out / SI | Chưa dùng ULT, đang cơn cấp + 3 cơn/năm trên hồ sơ `INTL` | Xử trí cắt cơn cấp + khởi trị ULT kèm lưu ý khác biệt EULAR/ACR | ✅ PASS |
| `S58` | `VN` / Out / SI | Chưa dùng ULT, đang cơn cấp + 3 cơn/năm trên hồ sơ `VN` | Phát `[DEFER]` (`rec_gout_ult_defer_flare`) chờ 1–2 tuần hết viêm cấp mới khởi trị ULT (đúng BYT 361/2014) | ✅ PASS |
| `S59` | `US` / Out / SI | Cơn gút cấp đầu tiên không biến chứng (`sUA=440 µmol/L`, `scr=80`) ở chế độ SI | Cắt cơn cấp + `[DEFER]` chưa khởi trị ULT | ✅ PASS |
| `S60` | `US` / Out / **`mg/dL`** | **Chế độ `mg/dL`**: Đang uống `allopurinol 300 mg`, **`sUA = 4.5 mg/dL` (đã đạt sâu dưới đích `< 6.0`!)** | **Bị ra lệnh `[UPTITRATE:allopurinol]` thêm 100 mg + `[START:colchicine]`** (do đem `267.7 µmol/L` so với `6.0`)! | ❌ `GOUT-R2-R3-01` |
| `S61` | `INTL` / Out / **`mg/dL`** | **Chế độ `mg/dL`**: Đang uống `febuxostat 80 mg`, **`sUA = 2.0 mg/dL` (`< sàn 3.0 mg/dL` EULAR!)** | Bỏ lọt `[REDUCE]` sàn dưới, **ra lệnh ngược `[UPTITRATE:febuxostat]` lên `120 mg/ngày`**! | ❌ `GOUT-R2-R3-01` |
| `S62` | `US` / Out / **`mg/dL`** | **Chế độ `mg/dL`**: Cơn gút đầu tiên nhẹ với **`sUA = 5.0 mg/dL` (hoàn toàn bình thường!)** | Gắn nhầm *"tăng acid uric rất cao > 9 mg/dL"* (`297.4 > 9.0`) → **kê oan `[START:allopurinol]` + `[START:colchicine]`**! | ❌ `GOUT-R2-R3-01` |
| `S63` | `INTL` / Out / SI | Gút tophi ở chế độ SI có `sUA = 340 µmol/L` (`300 ≤ sUA < 360`) trên `allopurinol 200 mg` | Phát `[UPTITRATE:allopurinol]` để đạt đích nghiêm ngặt `< 300 µmol/L` của tophi | ✅ PASS |
| `S64` | `INTL` / Out / SI | Hạ urat quá mức ở chế độ SI (`sUA = 150 µmol/L < 180`) trên `allopurinol 300 mg` | Phát `[REDUCE:allopurinol]` cảnh báo tránh duy trì `< 180 µmol/L` kéo dài (EULAR 2016) | ✅ PASS |
| `S65` | `INTL` / Out / SI | Liều khởi trị Allopurinol trên CKD G3b (`scr=170`, eGFR ~38) | Khởi trị liều thấp an toàn `50–100 mg/ngày` chỉnh theo thận | ✅ PASS |
| `S66` | `US` / Out / SI | Liều khởi trị Allopurinol trên CKD G4 (`scr=275`, eGFR ~21) | Khởi trị `≤ 50 mg/ngày` đúng ACR 2020 cho CKD G4+ | ✅ PASS |
| `S67` | `INTL` / Out / SI | CKD G4 (`CrCl ~15`) + bệnh mạch vành (`cad=true`) đang uống `allopurinol 200 mg` chạm trần thận | Phát `[REFER:allopurinol]` (**không tăng liều**), NHƯNG **vẫn kê nhầm `[START:prednisolone]` dự phòng 3–6 tháng**! | ❌ `GOUT-R2-R3-14` |
| `S68` | `VN` / Out / SI | CKD G4 (`CrCl ~15`) không có CAD đang uống `allopurinol 200 mg` chạm trần thận | Phát `[SWITCH]` cân nhắc chuyển sang Febuxostat chỉnh liều thận + dự phòng | ✅ PASS |
| `S69` | `INTL` / Out / SI | Bẫy tách liều 1: `allopurinol { dose: 100, unit: 'mg', freq: '2 lần/ngày' }` (`= 200 mg/ngày`) | Đọc nhầm thành `100 mg/ngày`, khuyên tăng lên `200 mg/ngày` (bằng đúng liều BN đang uống!) | ❌ `GOUT-R2-R3-05` |
| `S70` | `US` / Out / SI | Bẫy tách liều 2: `allopurinol { dose: 300, unit: 'mg', freq: '3 lần/ngày' }` (**`= 900 mg/ngày > trần 800 mg`**) | Đọc nhầm thành `300 mg/ngày` → **ra lệnh `[UPTITRATE:allopurinol]` vượt trần tối đa FDA 800 mg**! | ❌ `GOUT-R2-R3-05` |
| `S71` | `VN` / Out / SI | Bẫy tách liều 3a: `colchicine { dose: 1, unit: 'mg', freq: '3 lần/ngày' }` (**`3 mg/ngày` mạn tính!**) ở eGFR 95 | **0 thẻ `[STOP]`/`[REDUCE]` Colchicine** — lọt hoàn toàn cả lỗi tách `freq` lẫn thiếu trần duy trì tối đa hàng ngày! | ❌ `GOUT-R2-R3-05` |
| `S72` | `VN` / Out / SI | Bẫy tách liều 3b: `colchicine { dose: 0.5, unit: 'mg', freq: '3 lần/ngày' }` (`1.5 mg/ngày`) ở CKD G3a | Đọc nhầm thành `0.5 mg/ngày` → **bỏ lọt không phát `[REDUCE:colchicine]` trên suy thận**! | ❌ `GOUT-R2-R3-05` |
| `S73` | `VN` / Out / SI | Bẫy đơn vị `'viên'` 4a: `febuxostat { dose: '2 viên' }` (`80–160 mg`) ở **CKD G4 (`eGFR ~20`, trần 40 mg)** | Đọc `'2 viên'` thành `2 mg/ngày` (`<= 40 mg`) → **phát `[CONTINUE:febuxostat]` thay vì giảm liều/hỏi hàm lượng**! | ❌ `GOUT-R2-R3-13` |
| `S74` | `VN` / Out / SI | Bẫy đơn vị `'viên'` 4b: `allopurinol { dose: 1, unit: 'viên' }` (viên 300 mg thông dụng tại VN) | Đọc thành `1 mg/ngày`, tính sai bậc liều hiện tại | ❌ `GOUT-R2-R3-13` |
| `S75` | `INTL` / Out / SI | Đang dùng viên phối hợp `losartan_hctz 50/12.5 mg` (`Hyzaar`) trên BN Gút + THA | **Bỏ lọt hoàn toàn HCTZ trong FDC** (`0` thẻ `rec_gout_switch_thiazide`) | ❌ `GOUT-R2-R3-06` |
| `S76` | `INTL` / Out / SI | Đang dùng `valsartan_hctz 80/12.5 mg` (`Co-Diovan`) + tích `takingThiazide=true` | Không biết trong `valsartan_hctz` đã có ARB → **khuyên đổi sang `losartan` gây nguy cơ trùng 2 ARB** | ❌ `GOUT-R2-R3-06` |
| `S77` | `US` / Out / SI | Lọc máu + **ĐTĐ2 mất kiểm soát nặng (`glucose = 22 mmol/L`, `HbA1c = 10.5%`, chưa tích `dkaSuspected`) + `pepticUlcer=true`** + cơn cấp đa khớp | **Kê `[START:prednisolone]` uống liều cao `30–35 mg/ngày`** trên đường huyết `22 mmol/L` + loét tiêu hóa! | ❌ `GOUT-R2-R3-11` |
| `S78` | `US` / Out / SI | Lọc máu + **Nghi DKA (`dka=true`, `dkaSuspected=true`, `glucose=22`)** + `pepticUlcer=true` + cơn cấp | `rules.prophylaxis` phát `[START:prednisolone]` va chạm `[HOLD:prednisolone]` khiến thẻ `HOLD` dính liều dự phòng 3–6 tháng; vẫn khởi trị ULT ngay giữa cấp cứu DKA | ❌ `GOUT-R2-R3-03`, `17` |
| `S79` | `INTL` / Out / SI | CKD G4 + **`steroidContraindicated=true`** + cơn cấp 1 khớp lớn | `rules.flare` phát `[REFER]` đúng, NHƯNG `rules.prophylaxis` vẫn **kê `[START:prednisolone]` uống 3–6 tháng**! | ❌ `GOUT-R2-R3-03` |
| `S80` | `INTL` / Out / SI | CKD G4 ngoài cơn cấp + **`steroidContraindicated=true`** khởi trị ULT | **Vẫn kê `[START:prednisolone]` uống kéo dài 3–6 tháng** dù đã khai báo chống chỉ định Corticosteroid! | ❌ `GOUT-R2-R3-03` |
| `S81` | `INTL` / Out / SI | Xơ gan **`customInputs.childPugh = 'B'`** (chưa tích `conditions.liverDisease`) đang uống `naproxen 500 mg` | **KHÔNG phát `[STOP:naproxen]`** (do `units.ts` không đồng bộ `childPugh='B'` sang `liverDisease`)! | ❌ `GOUT-R2-R3-07` |
| `S82` | `INTL` / Out / SI | Xơ gan **`customInputs.childPugh = 'C'`** đang uống `colchicine 1 mg` + `febuxostat 80 mg` + `benzbromarone 100 mg` + `naproxen 500 mg` | Dừng Benzbromarone (dính chuỗi `dose` tăng liều), **KHÔNG dừng Naproxen, KHÔNG giảm/dừng Colchicine 1 mg, và `[UPTITRATE:febuxostat]` lên `120 mg/ngày`**! | ❌ `GOUT-R2-R3-07`, `17` |
| `S83` | `INTL` / Out / SI | Xơ gan `conditions.cirrhosis=true` + `childPugh='C'` lên cơn gút cấp, chưa dùng ULT | **Kê `[START:colchicine]` cắt cơn liều đầy đủ `1.2 + 0.6 mg`** không giảm liều hay cảnh báo suy gan nặng! | ❌ `GOUT-R2-R3-07` |
| `S84` | `INTL` / Out / SI | Thai kỳ (`pregnant=true`) đang uống `allopurinol 300 mg` + `colchicine 0.5 mg` | Phát `[STOP:allopurinol]` và `[STOP:colchicine]` bảo vệ thai nhi | ✅ PASS |
| `S85` | `INTL` / Out / SI | Cho con bú (`breastfeeding=true`) đang uống `benzbromarone 50 mg` (`lactation: contra`) | Phát `[STOP:benzbromarone]` chính xác | ✅ PASS |
| `S86` | `INTL` / Out / SI | Cho con bú (`breastfeeding=true`), dị ứng Allopurinol → kiểm tra khởi trị Febuxostat | **Kê `[START:febuxostat]` 40 mg/ngày với `0` cảnh báo cho con bú** (dù `febuxostat.json` ghi `lactation: 'avoid'`)! | ❌ `GOUT-R2-R3-15` |
| `S87` | `US` / Out / SI | Đang dùng `probenecid 500 mg` trên bệnh nhân có tiền sử sỏi thận (`urolithiasis=true`) | Phát `[STOP:probenecid]` chính xác | ✅ PASS |
| `S88` | `INTL` / Out / SI | Đang dùng `benzbromarone 50 mg` + **Tăng sản xuất acid uric nội sinh (`uricAcidOverproduction=true`)** trên `INTL` | **Ra lệnh `[UPTITRATE:benzbromarone]` lên tới 200 mg/ngày** thay vì `[STOP]` (nguy cơ suy thận cấp urat)! | ❌ `GOUT-R2-R3-08` |
| `S89` | `US` / Out / SI | Đang dùng `probenecid 500 mg` + **Tăng sản xuất acid uric nội sinh (`uricAcidOverproduction=true`)** trên `US` | **Ra lệnh `[UPTITRATE:probenecid]` lên tới 2 g/ngày** thay vì `[STOP]`! | ❌ `GOUT-R2-R3-08` |
| `S90` | `VN` / Out / SI | Dị ứng cả 2 XOI, `scr=150` (eGFR ~45) trên hồ sơ `VN` | Khởi trị `benzbromarone` theo ngưỡng MLCT ≥ 30 của BYT CKD 2024 nhưng thiếu ghi chú lưu ý QĐ 361/2014 | ⚠️ `GOUT-R2-R3-18` |
| `S91` | `INTL` / Out / SI | Dị ứng cả 2 XOI, `scr=240` (eGFR ~25 `< 30`) | Chặn tuyệt đối Probenecid & Benzbromarone, phát `[REFER]` chuyên khoa xét Pegloticase | ✅ PASS |
| `S92` | `US` / Out / SI | Đánh giá đồng thời **5 module** (`gout`+`ckd`+`htn`+`dm2`+`lipid`): CAD đang dùng `aspirin 81 mg` + `HCTZ 25 mg` + `atorvastatin 20 mg` | Giữ `[CONTINUE:aspirin]`, đổi HCTZ sang Losartan, chặn Colchicine do CKD+Statin, phối hợp SGLT2i/Statin mượt mà | ✅ PASS |
| `S93` | `INTL` / Out / SI | Đánh giá đồng thời **5 module** tương tự trên hồ sơ `INTL` | Phối hợp nhất quán giữa 5 module, không xung đột hành động cùng thuốc | ✅ PASS |
| `S94` | `INTL` / Out / SI | Stress test **7 module** (`gout`+`ckd`+`htn`+`hf`+`dm2`+`af`+`lipid`), đang dùng Furosemide + Allopurinol + Apixaban + Rosuvastatin, lên cơn cấp | Bảo toàn Furosemide (HFrEF), giữ Allopurinol trong cơn cấp, chặn NSAID (Apixaban+HFrEF+CKD) & Colchicine (CKD+Statin), cắt cơn bằng Steroid; `noteText` sạch không `NaN`/`undefined` | ⚠️ `GOUT-R2-R3-17` |
| `S95` | `US` / Inp / SI | Stress test **7 module** nội trú (`US / inpatient`) | Không crash, không xung đột thuốc dương–âm, `noteText` sạch | ✅ PASS |
| `S96` | `INTL` / Out / SI | CAD đang dùng `aspirin 81 mg` kèm loét tiêu hóa đang hoạt động (`pepticUlcer=true`) | Không phát `CONTINUE` mù quáng khi đang loét/chảy máu cấp | ✅ PASS |
| `S97` | `US` / Out / SI | **Mới đặt stent / ACS gần đây (`cad=true, recentAcs=true`) chỉ có tiền sử xuất huyết cũ (`bleedingHistory=true`, KHÔNG chảy máu cấp)** trên `aspirin 81 mg` | **Phát lệnh `[STOP:aspirin]` *"NGỪNG KHẨN CẤP Aspirin do đang có xuất huyết nội sọ cấp / xuất huyết tiêu hóa tiến triển"*** (nguy cơ tắc stent cấp tử vong)! | ❌ `GOUT-R2-R3-09` |
| `S98` | `INTL` / Out / SI | Xơ gan mất bù `cirrhosis=true, decompensatedCirrhosis=true, childPugh='C'` khởi trị ULT ngoài cơn cấp | **Kê `[START:colchicine]` 0.5–1 mg/ngày kéo dài 3–6 tháng** hoàn toàn không giảm liều hay cảnh báo suy gan nặng! | ❌ `GOUT-R2-R3-07` |
| `S99` | `INTL` / Out / SI | Người gốc Âu (`southeastAsianDescent=false`) trên hồ sơ `INTL`, chưa dùng ULT | Vẫn hiện thẻ `[CONSIDER]` sàng lọc `HLA-B*58:01` viện dẫn lý do người Đông Nam Á | ⚠️ `GOUT-R2-R3-18` |
| `S100` | `VN` / Out / SI | Gút tophi trên hồ sơ `VN` có `sUA = 310 µmol/L` (`< 320` nhưng `> 300`) | Kết luận đã đạt đích `< 320 µmol/L` nhưng tiêu đề ghi mâu thuẫn `< 320 µmol/L (< 5 mg/dL)` | ⚠️ `GOUT-R2-R3-18` |
| `S101` | `US` / Out / SI | Đang dùng `febuxostat 120 mg/ngày` (**vượt trần FDA `80 mg/ngày`**) trên hồ sơ `US`, `sUA = 330` | Phát `[CONTINUE:febuxostat]` *"Tiếp tục duy trì Febuxostat ở liều hiện tại"* thay vì rà soát giảm về trần FDA `≤ 80 mg` | ❌ `GOUT-R2-R3-15` |
| `S102` | `US` / Out / **`mg/dL`** | **Preset chuẩn số 5 (`gout_preset_first_flare_mild`) chuyển sang chế độ đơn vị quy ước `mg/dL`** (`sUA = 7.397 mg/dL`) | Đảo ngược hoàn toàn y lệnh so với chế độ SI (`S15`): **từ `[DEFER]` biến thành `[START:allopurinol]` 100 mg + `[START:colchicine]`**! | ❌ `GOUT-R2-R3-01` |

---

## 3. Chi Tiết 18 Phát Hiện Lỗi An Toàn Vòng 2 (`GOUT-R2-R3-01` → `GOUT-R2-R3-18`)

### 3.1. Nhóm Mức Độ `CRITICAL` (10 Phát Hiện)

#### [`GOUT-R2-R3-01`] (`CRITICAL` | `rule`) Hồi quy nghiêm trọng khi bật hệ đơn vị quy ước (`units.urat = 'mg_dL'`): Đem `ctx.patient.uricAcid` (đã quy đổi sang `µmol/L`) so sánh trực tiếp với ngưỡng `mg/dL`, làm đảo lộn toàn bộ chỉ định & chuẩn độ ULT
- **Định danh mục lỗi**: [helpers.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L379-L398) (`isUrateBelowTarget`, `isUrateBelowLongTermFloor`), [helpers.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L455-L490) (`assessUltIndication`) & [evaluate.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/evaluate.ts#L50-L61)
- **Nguyên nhân gốc rễ (`file:line`)**:
  - Tại [evaluate.ts:50-61](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/evaluate.ts#L50-L61), `normalizePatientUnits(rawPatient, settings)` đã nhân `uricAcid * 59.48` để đổi từ `mg/dL` sang `µmol/L`, sau đó gán đè **`patient: normalized`** vào `RuleContext`!
  - Tuy nhiên khi sửa `R3-GOUT-15`, tác giả viết trong [helpers.ts:381-383](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L381-L383), [392-394](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L392-L394), [457-458](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L457-L458), và [482-483](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L482-L483):
    ```ts
    if (ctx.settings.units.urat === 'mg_dL' && ctx.patient.uricAcid !== undefined) {
      return ctx.patient.uricAcid < getTargetUrateMgDl(ctx); // 267.66 < 6.0 -> LUÔN FALSE!
    }
    ```
  - Vì `ctx.patient` chính là `normalized` (`µmol/L`), mọi giá trị `sUA` thực tế trên lâm sàng (`2.0–12.0 mg/dL` → `119–714 µmol/L`) đều lớn hơn `6.0`, `5.0`, `3.0` và `9.0`!
- **Bằng chứng tái lập qua `evaluate()`**:
  - **`S60`** (`US`, `units.urat = 'mg_dL'`, BN đang uống `allopurinol 300 mg`, `uricAcid = 4.5 mg/dL` đã đạt sâu dưới đích `< 6.0 mg/dL`): Engine kết luận sai chưa đạt đích và ra y lệnh **`[UPTITRATE:allopurinol]` thêm 100 mg/ngày + `[START:colchicine]` 0.6 mg × 3–6 tháng**!
  - **`S61`** (`INTL`, `units.urat = 'mg_dL'`, BN đang uống `febuxostat 80 mg`, `uricAcid = 2.0 mg/dL` thấp hơn sàn EULAR `3.0 mg/dL`): Thay vì phát `[REDUCE:febuxostat]`, engine phát ngược **`[UPTITRATE:febuxostat]` lên `120 mg/ngày`**!
  - **`S62` & `S102`** (`US`, `units.urat = 'mg_dL'`, cơn gút đầu tiên nhẹ không biến chứng với `uricAcid = 5.0 mg/dL` hoặc **Preset 5 `gout_preset_first_flare_mild`** quy đổi sang `7.397 mg/dL`): Bị gắn nhầm *"tăng acid uric rất cao > 9 mg/dL"* (`297.4 > 9.0`) và kê oan **`[START:allopurinol]` 100 mg + `[START:colchicine]`**!
- **Hướng khắc phục**: Xóa toàn bộ các nhánh đọc `ctx.patient.uricAcid` để so với ngưỡng `mg/dL` trong `helpers.ts`. Tính trực tiếp từ giá trị SI chuẩn `const urateUmol = need(ctx, 'urate')`: nếu `ctx.settings.units.urat === 'mg_dL'` thì quy đổi ngược `const urateMgDl = Number((urateUmol / URAT_CONVERSION_FACTOR).toFixed(2))` trước khi so sánh với ngưỡng `mg/dL`, đồng thời bổ sung test bất biến `SI ↔ mg/dL` cho toàn bộ 5 `goutPresets`.

---

#### [`GOUT-R2-R3-02`] (`CRITICAL` | `rule`) Lọt lưới an toàn Viêm khớp nhiễm khuẩn (`Septic Arthritis`) & Sốt cao trên viêm đơn khớp cấp: Tiêm/uống Corticosteroid vào khớp nghi nhiễm mủ ở thai phụ và bỏ sót cảnh báo `[REFER]` chọc dò dịch khớp khẩn cấp
- **Định danh mục lỗi**: `gout.acute_flare.treatment` ([rules.flare.ts:57-100](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.flare.ts#L57-L100)) & `hasActiveInfection` ([helpers.ts:321-327](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L321-L327))
- **Nguyên nhân gốc rễ (`file:line`)**:
  1. Tại [rules.flare.ts:57-72](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.flare.ts#L57-L72), nhánh `if (isPregnant(ctx))` nằm **trước** kiểm tra nhiễm trùng và trả về ngay `[START:prednisolone]` uống `30–35 mg/ngày` hoặc tiêm nội khớp mà không kiểm tra `hasActiveInfection(ctx)` hay `septicArthritisSuspected`!
  2. Tại [helpers.ts:321-327](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L321-L327), `hasActiveInfection()` chỉ đọc `conditions.septicArthritisSuspected` mà bỏ sót `customInputs.septicArthritisSuspected` và sốt cao (`customInputs.fever === true` hoặc `temperature >= 38.5`).
  3. Tại [rules.flare.ts:87-100](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.flare.ts#L87-L100), thẻ `[REFER]` chọc hút dịch khớp loại trừ viêm khớp nhiễm khuẩn chỉ kích hoạt khi **cả 3 nhóm thuốc đều bị chặn** (`colSafety.avoidFlare && nsaidAvoided && steroidBlocked`). Khi BN có `eGFR` bình thường kèm `conditions.septicArthritisSuspected: true`, Colchicine không bị chặn nên hệ thống lặng lẽ kê Colchicine uống + khởi trị Allopurinol với **0 cảnh báo cấp cứu chọc dò dịch khớp**!
- **Bằng chứng tái lập qua `evaluate()`**:
  - **`S24`** (`pregnant: true, septicArthritisSuspected: true`): Phát **`[START:prednisolone]` *"30–35 mg/ngày đường uống trong 3–5 ngày (hoặc tiêm nội khớp nếu viêm đơn khớp lớn)"***!
  - **`S22`** (`customInputs.septicArthritisSuspected: true`) & **`S23`** (`fever: true, temperature: 39.2`): Phát **`[START:prednisolone]` *"Ưu tiên chọc hút và tiêm Corticosteroid nội khớp"***!
  - **`S21` & `S26`** (`conditions.septicArthritisSuspected: true`, `scr = 82–88`, ngoại trú & nội trú): Chỉ phát `[START:colchicine]` + `[START:allopurinol]`, **0 thẻ `[REFER]`** chọc dịch khớp soi nhuộm Gram/cấy vi khuẩn.
- **Hướng khắc phục**: Tách hàm `isSepticArthritisSuspected(ctx)` (kiểm tra cả `conditions.septicArthritisSuspected`, `customInputs.septicArthritisSuspected`, và sốt cao `fever === true || temperature >= 38.5` trên viêm khớp cấp) và đặt chặn **ngay đầu `gout.acute_flare.treatment` (trước cả nhánh thai kỳ)**: bắt buộc phát `[REFER]` cấp cứu chọc hút dịch khớp (tế bào, nhuộm Gram, cấy vi khuẩn, soi tinh thể), cấm tuyệt đối tiêm corticoid nội khớp / corticoid toàn thân và hoãn khởi trị ULT tự chọn.

---

#### [`GOUT-R2-R3-03`] (`CRITICAL` | `rule`) Luật dự phòng `gout.prophylaxis.flare` tự động kê `[START:prednisolone]` kéo dài 3–6 tháng ngay cả khi đang nhiễm trùng nặng, nghi DKA, hoặc chống chỉ định Corticosteroid
- **Định danh mục lỗi**: `gout.prophylaxis.flare` ([rules.prophylaxis.ts:239-256](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.prophylaxis.ts#L239-L256)) & `canInitiateUltNow` ([helpers.safety.ts:380-386](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L380-L386))
- **Nguyên nhân gốc rễ (`file:line`)**: Khi cả Colchicine và NSAID đều bị tránh (ví dụ CKD G4/G5), dòng 239 của `rules.prophylaxis.ts` rơi thẳng vào nhánh dự phòng cuối cùng phát `action: 'START', drugId: 'prednisolone'` kéo dài 3–6 tháng mà **quên hoàn toàn không kiểm tra `isSteroidContraindicated(ctx)`, `hasActiveInfection(ctx)` hay `isDkaSuspected(ctx)`**! Đồng thời `canInitiateUltNow()` vẫn cho khởi trị mới ULT tự chọn ngay giữa nhiễm trùng nặng hoặc DKA cấp.
- **Bằng chứng tái lập qua `evaluate()`**:
  - **`S25`** (`CKD G4` + `activeInfection: true` + `acuteFlare: true`): Vừa phát `[REFER]` vì nhiễm trùng tiến triển, vừa phát **`[START:prednisolone]` uống dự phòng 3–6 tháng**!
  - **`S79` & `S80`** (`CKD G4` + `customInputs.steroidContraindicated: true`): Vẫn phát **`[START:prednisolone]` uống 3–6 tháng**!
  - **`S78`** (`onDialysis: true` + `dka: true` + `dkaSuspected: true` + `acuteFlare: true`): Phát `[START:prednisolone]` va chạm với `[HOLD:prednisolone]` trong `merge.ts` làm thẻ `[HOLD]` dính chuỗi liều dự phòng 3–6 tháng.
- **Hướng khắc phục**: Chặn `isSteroidContraindicated(ctx) || hasActiveInfection(ctx) || isDkaSuspected(ctx)` trước dòng 239 của `rules.prophylaxis.ts` (chuyển sang `[REFER]`/`[CONSIDER]` hội chẩn chuyên khoa thay vì kê Prednisolone), và chặn khởi trị mới ULT tự chọn trong `canInitiateUltNow()` khi đang có nhiễm trùng toàn thân/khớp tiến triển hoặc DKA/HHS cấp.

---

#### [`GOUT-R2-R3-04`] (`CRITICAL` | `drug`) Bỏ lọt hoàn toàn tương tác thuốc gây tử vong giữa Colchicine và `Nirmatrelvir/ritonavir` (`Paxlovid`)
- **Định danh mục lỗi**: `STRONG_CYP3A4_PGP_INHIBITORS` ([helpers.ts:138-149](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L138-L149)), `STRONG_CYP3A4_INHIBITOR_IDS` ([drugClassify.ts:276-284](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/drugClassify.ts#L276-L284)) & [gout_metabolic.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/gout_metabolic.json)
- **Nguyên nhân gốc rễ (`file:line`)**: Danh sách ức chế mạnh CYP3A4/P-gp chỉ so khớp chuỗi đơn chất `'ritonavir'` và `'cobicistat'`, bỏ sót hoàn toàn chế phẩm kháng virus phối hợp cực kỳ phổ biến trên lâm sàng là **`nirmatrelvir_ritonavir` (`Paxlovid`)** cũng như `lopinavir_ritonavir` (`Kaletra`), `darunavir_cobicistat`, `elvitegravir_cobicistat`.
- **Bằng chứng tái lập qua `evaluate()`**:
  - **`S43`** (BN CKD G3a đang dùng `colchicine 0.6 mg` + `nirmatrelvir_ritonavir 300 mg`): **0 thẻ `[STOP:colchicine]`, 0 cảnh báo tương tác**!
  - **`S44`** (BN đang uống `nirmatrelvir_ritonavir 300 mg` lên cơn gút cấp): Engine chủ động kê **`[START:colchicine]` *"1.2 mg ngay khi khởi phát cơn, sau đó 0.6 mg sau 1 giờ"*** — chống chỉ định tuyệt đối theo nhãn FDA Paxlovid & Colcrys do nguy cơ ức chế đồng thời CYP3A4 + P-gp gây suy tủy, tiêu cơ vân, suy đa tạng tử vong!
- **Hướng khắc phục**: Bổ sung `'nirmatrelvir_ritonavir'`, `'paxlovid'`, `'lopinavir_ritonavir'`, `'kaletra'`, `'darunavir_cobicistat'`, `'elvitegravir_cobicistat'` (và tách token thành phần chứa `ritonavir` / `cobicistat` trong `getExpandedDrugIds`) vào cả `helpers.ts`, `drugClassify.ts`, và `kb/interactions/gout_metabolic.json`.

---

#### [`GOUT-R2-R3-05`] (`CRITICAL` | `rule`) Lỗi regex tách tần suất liều (`freq: '2 lần/ngày'`, `'3 lần/ngày'`) và thiếu hoàn toàn trần liều duy trì tối đa hàng ngày của Colchicine (`1.0–1.2 mg/ngày`)
- **Định danh mục lỗi**: `parseMedDailyDoseMg` ([helpers.ts:239](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L239)) & `gout.safety.colchicine_reduce_active` ([rules.safety.antiinflam.ts:240-249](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.safety.antiinflam.ts#L240-L249))
- **Nguyên nhân gốc rễ (`file:line`)**:
  1. Tại [helpers.ts:239](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L239), biểu thức `/(?:x|×)\s*(\d+)\s*lần/` **bắt buộc phải có chữ `x` hoặc `×` phía trước số lần**! Khi trường riêng `CurrentMed.freq` truyền chuẩn tiếng Việt `'2 lần/ngày'` hoặc `'3 lần/ngày'`, regex trượt hoàn toàn và chỉ lấy liều 1 lần uống.
  2. Tại [rules.safety.antiinflam.ts:240-249](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.safety.antiinflam.ts#L240-L249), `gout.safety.colchicine_reduce_active` chỉ kiểm tra khi có suy thận, tuổi > 70 hoặc CYP3A4i vừa, mà **không có trần tối đa tuyệt đối hàng ngày** cho Colchicine duy trì (`1.0 mg/ngày` EULAR/BYT; `1.2 mg/ngày` FDA) ở người ≤ 70 tuổi có `eGFR >= 60`!
- **Bằng chứng tái lập qua `evaluate()`**:
  - **`S70`**: `allopurinol { dose: 300, unit: 'mg', freq: '3 lần/ngày' }` (`= 900 mg/ngày > trần tối đa FDA 800 mg/ngày`) bị đọc thành `300 mg/ngày` và bị ra lệnh **`[UPTITRATE:allopurinol]` thêm 100 mg/ngày**!
  - **`S71`**: BN 50 tuổi (`scr = 80`) ngoài cơn cấp đang uống nhầm liều độc **`colchicine { dose: 1, unit: 'mg', freq: '3 lần/ngày' }` (`3 mg/ngày` mạn tính!)**: **0 thẻ `[STOP]`/`[REDUCE]`, 0 cảnh báo ngộ độc**!
  - **`S72`**: CKD G3a (`scr = 135`) đang uống `colchicine { dose: 0.5, unit: 'mg', freq: '3 lần/ngày' }` (`1.5 mg/ngày` gấp 3 lần trần thận): Bị đọc thành `0.5 mg/ngày` → **lọt lưới giảm liều thận**!
  - **`S69`**: `allopurinol { dose: 100, unit: 'mg', freq: '2 lần/ngày' }` (`200 mg/ngày`) bị đọc thành `100 mg/ngày`.
- **Hướng khắc phục**: Mở rộng regex tần suất trong `parseMedDailyDoseMg()` nhận diện `'2 lần/ngày'`, `'ngày 2 lần'`, `'q8h'`, `'q12h'` (chỉ nhân từ `med.freq` khi `med.dose` chưa chứa cụm nhân lần), và bổ sung trần tuyệt đối ngoài cơn cấp cho Colchicine (`> 1.0 mg/ngày` trên `INTL`/`VN`, `> 1.2 mg/ngày` trên `US` → bắt buộc `[REDUCE]`/`[STOP]` cảnh báo ngộ độc tiêu hóa – thần kinh cơ – tủy xương).

---

#### [`GOUT-R2-R3-06`] (`CRITICAL` | `rule`) Mù thuốc hạ áp viên phối hợp liều cố định (FDC: `valsartan_hctz`, `losartan_hctz`, `perindopril_indapamide`), dẫn tới kê Naproxen gây suy thận cấp "Triple Whammy"
- **Định danh mục lỗi**: `isOnMed` ([helpers.ts:204-217](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L204-L217)), `isTripleWhammyRisk` ([helpers.safety.ts:89-97](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L89-L97)) & [drugClassify.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/drugClassify.ts)
- **Nguyên nhân gốc rễ (`file:line`)**: Dù [hydrochlorothiazide.json:12-14](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/hydrochlorothiazide.json#L12-L14) ghi rõ các biệt dược phối hợp lưu hành rộng rãi tại Việt Nam (`Co-Diovan`, `Hyzaar`, `Micardis Plus`, `Coversyl Plus`), cả `isOnMed()` lẫn `getExpandedDrugIds()` đều không phân rã các mã FDC như `valsartan_hctz`, `losartan_hctz`, `telmisartan_hctz`, `perindopril_indapamide`. Một viên `valsartan_hctz` chứa sẵn **2/3 mảnh ghép của Triple Whammy** (ARB + HCTZ), nhưng `isTripleWhammyRisk()` trả `false`!
- **Bằng chứng tái lập qua `evaluate()`**:
  - **`S53`** (`currentMeds: [{ drugId: 'valsartan_hctz', dose: '80/12.5 mg' }, { drugId: 'ritonavir', dose: 100 }]`, `acuteFlare: true`): Kê **`[START:naproxen]` 500 mg × 2 lần/ngày** tạo trọn bộ **Triple Whammy AKI** (`Valsartan + HCTZ + Naproxen`)!
  - **`S75`** (`losartan_hctz 50/12.5 mg`): Bỏ sót hoàn toàn HCTZ trong FDC (`0` khuyến cáo ngưng/đổi thành phần lợi tiểu Thiazide).
  - **`S76`** (`valsartan_hctz` + `takingThiazide: true`): Khuyên đổi sang `losartan` gây nguy cơ dùng trùng 2 thuốc ARB (`Valsartan` + `Losartan`).
- **Hướng khắc phục**: Bổ sung phân rã FDC hạ áp phổ biến (bản đồ biệt dược + tách hoạt chất qua `'_'` / `'/'` / `'+'` kèm chuẩn hóa alias `hctz` → `hydrochlorothiazide`) trong `getExpandedDrugIds()` (`src/engine/safety/drugClassify.ts`) và dùng `getExpandedDrugIds(m.drugId)` trong `isOnMed` / `findAllMeds` của `src/modules/gout/helpers.ts`.

---

#### [`GOUT-R2-R3-07`] (`CRITICAL` | `rule`) Ba lỗ hổng an toàn nghiêm trọng trên bệnh nhân Xơ gan Child-Pugh B & Child-Pugh C
- **Định danh mục lỗi**: `normalizePatientUnits` ([units.ts:136-190](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/units.ts#L136-L190)), `checkColchicineSafety` ([helpers.safety.ts:239-302](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L239-L302)) & `gout.febuxostat.manage` ([rules.ult.ts:429-448](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ult.ts#L429-L448))
- **Nguyên nhân gốc rễ (`file:line`)**:
  1. `units.ts` không đồng bộ `customInputs.childPugh === 'B' | 'C'` sang `conditions.liverDisease`, nên khi bác sĩ chọn phân độ `Child-Pugh B/C` trên form mà chưa tích riêng `conditions.liverDisease`, `hasLiverDisease(ctx)` trong module Gút trả `false`!
  2. Ngay cả khi đã tích đủ `conditions: { cirrhosis: true, decompensatedCirrhosis: true }` kèm `childPugh: 'C'`, hàm `checkColchicineSafety()` chỉ xét `hasLiver` khi phối hợp CYP3A4i/CKD/Statin mà **bỏ qua hoàn toàn xơ gan mất bù Child-Pugh C đơn độc** — mâu thuẫn trực tiếp với cổng `gate_colchicine_hepatic` (`action: "avoid"`) trong [colchicine.json:105-116](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/colchicine.json#L105-L116)!
  3. Trên Child-Pugh C, `gout.febuxostat.manage` vẫn chuẩn độ tăng liều Febuxostat từ `80 mg` lên **`120 mg/ngày`** (SmPC EMA giới hạn tối đa `80 mg` ở Child-Pugh B và cảnh báo chưa được nghiên cứu ở Child-Pugh C).
- **Bằng chứng tái lập qua `evaluate()`**:
  - **`S81`** (`childPugh: 'B'`, đang uống `naproxen 500 mg`): **KHÔNG phát `[STOP:naproxen]`**!
  - **`S82`** (`childPugh: 'C'`, đang uống `colchicine 1 mg` + `febuxostat 80 mg` + `benzbromarone 100 mg` + `naproxen 500 mg`): **KHÔNG dừng Naproxen, KHÔNG giảm/dừng Colchicine 1 mg**, và phát **`[UPTITRATE:febuxostat]` lên `120 mg/ngày`**!
  - **`S83` & `S98`** (`cirrhosis: true, decompensatedCirrhosis: true, childPugh: 'C'`): Kê **`[START:colchicine]` 1.2 + 0.6 mg cắt cơn** và **`[START:colchicine]` 0.5–1 mg/ngày dự phòng 3–6 tháng** với **0 cảnh báo suy gan**!
- **Hướng khắc phục**: Đồng bộ `childPugh === 'B' || 'C'` sang trạng thái bệnh gan trong `units.ts`; chặn hoặc giảm liều nghiêm ngặt Colchicine trên xơ gan mất bù / Child-Pugh C khớp `kb/drugs/colchicine.json`; và khóa trần Febuxostat `≤ 80 mg/ngày` (hoặc thận trọng tối đa `40–80 mg`) khi Child-Pugh B/C.

---

#### [`GOUT-R2-R3-08`] (`CRITICAL` | `rule`) Tăng liều Probenecid và Benzbromarone thay vì `[STOP]` trên bệnh nhân đã xác định Tăng sản xuất acid uric nội sinh (`uricAcidOverproduction = true`) ở hồ sơ `INTL` và `US`
- **Định danh mục lỗi**: `isProbenecidContraindicated` & `isBenzbromaroneContraindicated` ([helpers.safety.ts:143-173](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L143-L173))
- **Nguyên nhân gốc rễ (`file:line`)**: Tại dòng 143–145 và 161–163 của `helpers.safety.ts`, kiểm tra `customInputs.uricAcidOverproduction` bị nhốt bên trong nhánh `ctx.settings.profile === 'VN'`! ACR 2020 chỉ khuyến cáo không bắt buộc xét nghiệm acid uric niệu 24h thường quy trước điều trị, **nhưng một khi bệnh nhân đã có bằng chứng tăng sản xuất acid uric nội sinh / bài xuất urat niệu > 600–800 mg/24h / hội chứng ly giải khối u**, cả nhãn FDA Benemid, SmPC Benzbromarone lẫn [probenecid.json:87-98](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/probenecid.json#L87-L98) và [benzbromarone.json:88-99](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/benzbromarone.json#L88-L99) đều chống chỉ định tuyệt đối do nguy cơ kết tủa tinh thể urat gây suy thận cấp tắc nghẽn!
- **Bằng chứng tái lập qua `evaluate()`**:
  - **`S88`** (`INTL`, đang uống `benzbromarone 50 mg`, `uricAcidOverproduction: true`): Phát **`[UPTITRATE:benzbromarone]` tăng thêm 50 mg tới tối đa 200 mg/ngày**!
  - **`S89`** (`US`, đang uống `probenecid 500 mg`, `uricAcidOverproduction: true`): Phát **`[UPTITRATE:probenecid]` tăng tới tối đa 2 g/ngày**!
- **Hướng khắc phục**: Đưa kiểm tra `uricAcidOverproduction` / `tumorLysisSyndrome` ra áp dụng chung cho **cả 3 hồ sơ (`INTL`, `US`, `VN`)** trong `isProbenecidContraindicated()` và `isBenzbromaroneContraindicated()` kèm lý do dừng thuốc rõ ràng trong `rules.uricosuric.ts`.

---

#### [`GOUT-R2-R3-09`] (`CRITICAL` | `rule`) Phát lệnh `[STOP:aspirin]` khẩn cấp trên bệnh nhân mới đặt stent mạch vành / sau ACS (`recentAcs = true`) chỉ có tiền sử xuất huyết cũ (`bleedingHistory = true`)
- **Định danh mục lỗi**: `gout.concurrent.keep_aspirin` ([rules.concurrent.ts:200-213](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.concurrent.ts#L200-L213)) & `hasPepticUlcerOrBleed` ([helpers.safety.ts:78-87](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L78-L87))
- **Nguyên nhân gốc rễ (`file:line`)**: Để sửa `R3-GOUT-06` (xuất huyết nội sọ cấp), `rules.concurrent.ts:200` gọi chung hàm `hasPepticUlcerOrBleed(ctx)` vốn gộp cả cờ **tiền sử xuất huyết cũ trong quá khứ** (`conditions.bleedingHistory` / `giBleedHistory`) chung với xuất huyết nội sọ cấp! Kết quả là một bệnh nhân vừa đặt stent mạch vành sau nhồi máu cơ tim (`cad: true, recentAcs: true`), hiện tại huyết động ổn định không chảy máu nhưng trong hồ sơ bệnh án có tích tiền sử xuất huyết tiêu hóa cách đây nhiều năm (`bleedingHistory: true`), bị phát y lệnh đỏ: **`[STOP:aspirin]` *"NGỪNG KHẨN CẤP Aspirin do đang có xuất huyết nội sọ cấp / xuất huyết tiêu hóa tiến triển"*** — gây nguy cơ huyết khối tắc stent cấp tử vong!
- **Bằng chứng tái lập qua `evaluate()`**: **`S97`** (`US`, `conditions: { gout: true, cad: true, recentAcs: true, bleedingHistory: true }`, `currentMeds: [{ drugId: 'aspirin', dose: 81, unit: 'mg' }]`) → Output: `[STOP:aspirin]`.
- **Hướng khắc phục**: Tách riêng `hasActiveMajorBleeding(ctx)` (chỉ `true` khi `acuteIntracerebralHemorrhage` hoặc `activeGiBleed` / xuất huyết tiêu hóa đang diễn tiến) để phát `[STOP:aspirin]`. Nếu chỉ có tiền sử loét/xuất huyết cũ đã ổn định (`bleedingHistory`) trên nền dự phòng thứ phát ASCVD/stent: giữ `[CONTINUE:aspirin]` kèm khuyến cáo bắt buộc phối hợp PPI bảo vệ niêm mạc dạ dày.

---

#### [`GOUT-R2-R3-10`] (`CRITICAL` | `rule`) Engine sập hoàn toàn (`Uncaught TypeError: patient.currentMeds is not iterable`) khi đối tượng `Patient` tối thiểu thiếu mảng `currentMeds`
- **Định danh mục lỗi**: `normalizePatientUnits` ([src/engine/units.ts:242](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/units.ts#L242))
- **Nguyên nhân gốc rễ (`file:line`)**: Dòng 242 của `src/engine/units.ts` thực hiện `currentMeds: [...patient.currentMeds]` trực tiếp mà không có kiểm tra mảng rỗng dự phòng (`Array.isArray(patient.currentMeds) ? [...patient.currentMeds] : []`), vi phạm bất biến zero-crash khi gọi `evaluate()` từ API/tích hợp bên ngoài với đầu vào tối thiểu `{ age: 50, sex: 'male', selectedModules: ['gout'] }`.
- **Bằng chứng tái lập qua `evaluate()`**: **`S16`** → Crash ngay lập tức tại `src/engine/units.ts:242` với ngoại lệ `TypeError: patient.currentMeds is not iterable`.
- **Hướng khắc phục**: Bọc an toàn cả `selectedModules` và `currentMeds` trong `src/engine/units.ts:241-243` bằng `Array.isArray(...) ? [...] : []`.

---

### 3.2. Nhóm Mức Độ `MAJOR` (6 Phát Hiện)

#### [`GOUT-R2-R3-11`] (`MAJOR` | `rule`) Kê đơn `[START:prednisolone]` uống liều cao `30–35 mg/ngày` trên bệnh nhân lọc máu kèm đường huyết tăng rất cao (`glucose = 22 mmol/L`, `HbA1c = 10.5%`) và loét tiêu hóa (`pepticUlcer = true`) khi chưa tích tay `dkaSuspected`
- **Định danh mục lỗi**: `gout.acute_flare.treatment` ([rules.flare.ts:207-225](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.flare.ts#L207-L225)) & `isDkaSuspected` ([helpers.ts:329-339](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L329-L339))
- **Bằng chứng (`S77`)**: Khi `glucose = 22 mmol/L` (`396 mg/dL`), `HbA1c = 10.5%`, `onDialysis = true`, `pepticUlcer = true`, `monoarthritisLargeJoint = false` (chưa tích tay `dkaSuspected`), module `dm2` phải phát ngay `[START:insulin_glargine]` vì tăng đường huyết nặng/dị hóa, nhưng module `gout` vẫn kê uống **`[START:prednisolone]` 30–35 mg/ngày × 3–5 ngày**, đẩy cao nguy cơ hôn mê tăng áp lực thẩm thấu (HHS) / DKA và xuất huyết tiêu hóa.
- **Hướng khắc phục**: Kích hoạt tự động cổng trì hoãn Corticosteroid toàn thân liều cao trong `isDkaSuspected` / `isSteroidContraindicated` khi đường huyết cấp quá ngưỡng nguy hiểm (`need(ctx, 'glucose') >= 16.7–20.0 mmol/L` qua ngưỡng KB) hoặc đang có xuất huyết tiêu hóa cấp, chuyển hướng `[REFER]` ổn định đường huyết nội viện / tiêm nội khớp khu trú / cân nhắc ức chế IL-1.

---

#### [`GOUT-R2-R3-12`] (`MAJOR` | `rule`) Bất đồng bộ khóa camelCase `customInputs.hlaB5801` làm mất thuốc thay thế Febuxostat trên bệnh nhân mang alen `HLA-B*58:01` dương tính
- **Định danh mục lỗi**: `getHlaB5801Status` ([helpers.safety.ts:38](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L38))
- **Bằng chứng (`S33` & `S35`)**: `gates.ts:299`, `reviewMedsSpecialized.ts` và `require.ts:140` đều đọc `customInputs.hlab5801 ?? customInputs.hlaB5801`, nhưng `getHlaB5801Status()` tại `helpers.safety.ts:38` chỉ đọc chữ thường `hlab5801`! Khi truyền `customInputs: { hlaB5801: 'positive' }`: ở `S33` (chưa dùng ULT), Allopurinol bị `gates.ts` chặn thành `[AVOID:allopurinol]`, **không có `[START:febuxostat]`**, nhưng vẫn kê dư `[START:colchicine]` dự phòng; ở `S35` (đang uống Allopurinol), `medReview` phát `[STOP:allopurinol]` nhưng mất hoàn toàn `[START:febuxostat]`.
- **Hướng khắc phục**: Đọc đồng bộ `ctx.normalized.customInputs?.hlab5801 ?? ctx.normalized.customInputs?.hlaB5801` tại `helpers.safety.ts:38`.

---

#### [`GOUT-R2-R3-13`] (`MAJOR` | `rule`) `parseMedDailyDoseMg()` đọc đơn vị `'viên'` thành miligam (`'2 viên'` → `2 mg/ngày`), làm lọt trần suy thận nặng `≤ 40 mg/ngày` của Febuxostat ở CKD G4
- **Định danh mục lỗi**: `parseMedDailyDoseMg` ([helpers.ts:219-249](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L219-L249))
- **Bằng chứng (`S73` & `S74`)**: Tại Việt Nam, đơn thuốc thường ghi theo số viên (`febuxostat: '2 viên'` tương đương `80–160 mg/ngày`, hoặc `allopurinol: { dose: 1, unit: 'viên' }` tương đương `300 mg`). Do `parseMedDailyDoseMg()` mặc định mọi con số không phải `'g'` đều là `'mg'`, ở `S73` (`scr = 280`, CKD G4 `eGFR ~20`, trần tối đa Febuxostat `40 mg/ngày`), `'2 viên'` bị hiểu thành `2 mg/ngày <= 40 mg` và được duyệt **`[CONTINUE:febuxostat]`** thay vì yêu cầu làm rõ hàm lượng viên / giảm liều!
- **Hướng khắc phục**: Fail-closed trả `undefined` trong `parseMedDailyDoseMg()` khi `dose` hoặc `unit` chứa `'viên'` / `'vien'` / `'tab'` / `'cap'` / `'gói'` mà không có hàm lượng `mg`/`mcg`/`g` đi kèm, đồng thời nhắc bác sĩ nhập rõ hàm lượng `mg` trước khi duyệt trần thận hoặc tăng liều.

---

#### [`GOUT-R2-R3-14`] (`MAJOR` | `rule`) Kê đơn nhầm dự phòng `[START:prednisolone]` kéo dài 3–6 tháng ("phantom prophylaxis") khi Allopurinol chạm trần suy thận và chỉ phát `[REFER]` không tăng liều
- **Định danh mục lỗi**: `isUltNewlyStartedOrUptitrated` ([helpers.safety.ts:409-412](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L409-L412))
- **Bằng chứng (`S67`)**: Trên hồ sơ `INTL` (`scr = 290`, `CrCl ~15 mL/phút`, `cad = true`, đang dùng `allopurinol 200 mg`), `gout.allopurinol.manage` chạm `hitRenalCapIntlVn = true` nên chỉ phát `[REFER:allopurinol]` (không tăng liều Allopurinol, không đổi sang Febuxostat do CAD). Tuy nhiên `isUltNewlyStartedOrUptitrated()` chỉ kiểm tra `curDose < 800` mà quên kiểm tra `hitRenalCapIntlVn`, khiến `gout.prophylaxis.flare` vẫn kê mới **`[START:prednisolone]` uống liên tục 3–6 tháng** không có lý do trên bệnh nhân suy thận nặng kèm bệnh mạch vành!
- **Hướng khắc phục**: Đồng bộ điều kiện chạm trần thận `hitRenalCapIntlVn` vào `isUltNewlyStartedOrUptitrated()` (nếu ULT hiện tại chỉ phát `REFER` mà không `START`/`UPTITRATE`/`SWITCH` sang ULT mới thì trả `false`).

---

#### [`GOUT-R2-R3-15`] (`MAJOR` | `drug`) Ba khoảng trống an toàn dược lâm sàng của Febuxostat: Cho con bú (`lactation: 'avoid'`), tiền sử dị ứng nặng Allopurinol (thiếu cảnh báo theo dõi phản ứng da), và duy trì quá trần FDA `80 mg` trên hồ sơ `US`
- **Định danh mục lỗi**: `gout.febuxostat.initiate` & `gout.febuxostat.manage` ([rules.ult.ts:291-449](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ult.ts#L291-L449)) & [febuxostat.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/febuxostat.json)
- **Bằng chứng (`S86`, `S36`, `S101`)**:
  1. **`S86`** (`breastfeeding: true`, `allopurinolIntolerant: true`): Dù `kb/drugs/febuxostat.json` quy định `lactation.status = 'avoid'` (FDA Uloric Mục 8.2 khuyến cáo không cho con bú khi dùng Febuxostat), engine vẫn phát **`[START:febuxostat]` 40 mg/ngày với 0 cảnh báo cho con bú**!
  2. **`S36`** (`allopurinolIntolerant: true`): Khi khởi trị Febuxostat thay thế sau dị ứng Allopurinol, thẻ `[START:febuxostat]` có `warnings: undefined`, thiếu cảnh báo theo dõi sát phát ban / quá mẫn da giai đoạn đầu (FDA Uloric Mục 5.3 & EULAR 2016).
  3. **`S101`** (`US`, đang dùng `febuxostat 120 mg/ngày > trần FDA 80 mg`, `sUA = 330`): Do kiểm tra `belowTarget` đặt trước kiểm tra `curDose >= maxFeb`, engine phát `[CONTINUE:febuxostat]` giữ nguyên liều `120 mg/ngày` trên hồ sơ `US`.
- **Hướng khắc phục**: Kiểm tra `isBreastfeeding(ctx)` đối với Febuxostat (ưu tiên trì hoãn hoặc cảnh báo ngừng cho con bú khớp KB); thêm cảnh báo theo dõi phản ứng quá mẫn da khi `isAllopurinolIntolerant(ctx) === true`; và đặt kiểm tra vượt trần `curDose > maxFeb` lên trước nhánh `belowTarget` trên hồ sơ `US`.

---

#### [`GOUT-R2-R3-16`] (`MAJOR` | `rule`) Mâu thuẫn phối hợp đa module (`gout` + `ckd`) trên bệnh nhân CKD giai đoạn 3b: Đồng khởi trị mới `[START:atorvastatin]` cùng lúc với `[START:colchicine]` 3–6 tháng ngay trên Preset chuẩn số 1
- **Định danh mục lỗi**: `checkColchicineSafety` ([helpers.safety.ts:272-281](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L272-L281)) & Preset 1 (`gout_preset_acute_monoarthritis_ckd`)
- **Bằng chứng (`S01` & `S03`)**: Khi `atorvastatin 20 mg` nằm sẵn trong `currentMeds` ở BN CKD (`eGFR < 60`), `checkColchicineSafety()` chặn cứng không cho dùng Colchicine (`avoidProphylaxis = true`). Thế nhưng ngay trên **Preset chuẩn số 1** (`scr = 150` → `eGFR = 43` CKD G3b, `selectedModules: ['gout', 'ckd']`), module `ckd` kê mới **`[START:atorvastatin]` 20 mg/ngày** đồng thời module `gout` kê mới **`[START:colchicine]` 0.5–0.6 mg/ngày × 3–6 tháng** trong cùng một đơn thuốc (chỉ bắn cảnh báo hậu kiểm `ix.statin_colchicine` ở cuối trang), và đến lần tái khám kế tiếp khi BN nhập 2 thuốc vừa kê vào `currentMeds` thì hệ thống lại quay ngoắt ra lệnh cấm Colchicine!
- **Hướng khắc phục**: Thống nhất quy tắc giữa thuốc đang dùng và thuốc đồng khởi trị trên nền CKD G3 (`eGFR 30–59`): phân tầng rõ nhóm Statin chuyển hóa mạnh qua CYP3A4 (`simvastatin`, `lovastatin` → chống chỉ định/đổi statin) với `rosuvastatin` / `atorvastatin` liều thấp–trung bình (cho phép phối hợp thận trọng với Colchicine giảm liều `≤ 0.5 mg/ngày` kèm cảnh báo theo dõi đau cơ/CK gắn trực tiếp vào thẻ thuốc ở cả lần khởi trị lẫn lần tái khám; chỉ chặn cứng mọi Statin khi `eGFR < 30` hoặc Statin liều rất cao).

---

### 3.3. Nhóm Mức Độ `MINOR` (2 Phát Hiện)

#### [`GOUT-R2-R3-17`] (`MINOR` | `ui`) Các thẻ chặn `[STOP]`, `[AVOID]`, `[HOLD]` vẫn giữ nguyên chuỗi liều kê đơn (`dose`) của thẻ `[START]` / `[UPTITRATE]` trên giao diện và trong bệnh án `noteText`
- **Định danh mục lỗi**: [organAndCrisisGates.ts:139-154](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/organAndCrisisGates.ts#L139-L154), [gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts) & [merge.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/merge.ts)
- **Bằng chứng (`S82`, `S07`–`S09`, `S33`, `S78`)**:
  - `S82`: `noteText` in ra câu mâu thuẫn: **`[STOP:benzbromarone] NGỪNG NGAY Benzbromarone (Chống chỉ định trên gan) [Liều: Tăng thêm 50 mg/ngày tới tối đa 200 mg/ngày]`**!
  - `S07` & `S33`: `[AVOID:allopurinol] CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG Allopurinol [Liều: 100 mg x 1 lần/ngày sau ăn]`.
  - `S78`: `[HOLD:prednisolone]` bị đè liều dự phòng 3–6 tháng từ `merge.ts`.
- **Hướng khắc phục**: Xóa `updatedDose = undefined` mỗi khi cổng an toàn chuyển `action` sang `'STOP' | 'AVOID' | 'HOLD'`, và không gộp trường `dose` của thẻ `START`/`UPTITRATE` vào thẻ thắng cuộc mang hành động `STOP`/`AVOID`/`HOLD` trong `merge.ts`.

---

#### [`GOUT-R2-R3-18`] (`MINOR` | `rule`) Nhiễu thẻ sàng lọc `HLA-B*58:01` ở bệnh nhân đang dùng Febuxostat/Benzbromarone hoặc người gốc Âu trên `INTL`, lệch quy đổi `< 320 µmol/L (< 5 mg/dL)` trên hồ sơ `VN`, và tái sử dụng ngưỡng tuổi của Colchicine cho Uricosuric (QA-10)
- **Định danh mục lỗi**: `gout.safety.hlab5801_screening` ([rules.safety.ult.ts:135-140](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.safety.ult.ts#L135-L140)), `gout.target.urate` ([rules.safety.ult.ts:377](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.safety.ult.ts#L377)) & [helpers.safety.ts:142, 160](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L142-L160)
- **Bằng chứng (`S55`, `S73`, `S88`, `S99`, `S05`, `S29`, `S100`, `S90`)**:
  1. `S55`, `S73`, `S88`: Bệnh nhân đang điều trị bằng `febuxostat` hoặc `benzbromarone` vẫn bị hiện thẻ `[CONSIDER]` khuyên xét nghiệm `HLA-B*58:01` trước khi uống liều Allopurinol đầu tiên; `S99` (`INTL`, `southeastAsianDescent: false`) vẫn kích hoạt thẻ này nhưng rationale lại ghi cho người Đông Nam Á.
  2. `S05`, `S29`, `S100` (`VN`, `tophi: true`): Tiêu đề mục tiêu ghi `< 320 µmol/L (< 5 mg/dL)` trong khi `320 µmol/L = 5.38 mg/dL` (`5.0 mg/dL` là ngưỡng `300 µmol/L` của EULAR).
  3. `helpers.safety.ts:142, 160` tái sử dụng khóa ngưỡng `gout.colchicine.elderly_age_min` cho chống chỉ định tuổi cao của nhóm Uricosuric theo BYT (vi phạm QA-10), và `S90` (`VN`, `eGFR ~45`) thiếu câu lưu ý ngắn về sự khác biệt giữa QĐ 361/BYT 2014 và Hướng dẫn CKD BYT 2024 Bảng 21.
- **Hướng khắc phục**: Chỉ phát `rec_gout_hlab5801_screening` khi đang dự kiến khởi trị hoặc chuyển sang Allopurinol ở nhóm chủng tộc nguy cơ; tách ngưỡng hiển thị `mg/dL` đúng cho đích tophi `VN` (`5.4 mg/dL` hoặc chỉ ghi `< 320 µmol/L theo BYT`); và tách khóa ngưỡng tuổi riêng cho Uricosuric trong `kb/thresholds/gout.json`.

---

## 4. Kết Luận Kiểm Định Độc Lập Vòng 2 (Final Verdict)

- **Tổng số kịch bản đối nghịch đã thực thi trực tiếp qua `evaluate()`**: **102 kịch bản (`S01` – `S102`)**.
- **Tổng hợp phát hiện Vòng 2**:
  - **`critical`**: **10** (`GOUT-R2-R3-01` → `GOUT-R2-R3-10`)
  - **`major`**: **6** (`GOUT-R2-R3-11` → `GOUT-R2-R3-16`)
  - **`minor`**: **2** (`GOUT-R2-R3-17` → `GOUT-R2-R3-18`)
  - **`suggestion`**: **0**
- **PHÁN QUYẾT CUỐI CÙNG CỦA REVIEWER R3 CHO VÒNG 2**: **`FAIL`** (Theo [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md), module chỉ đạt `PASS` khi `0 critical` và `0 major`).
