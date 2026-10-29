# BÁO CÁO PHẢN BIỆN AN TOÀN ĐỐI NGHỊCH (ADVERSARIAL REVIEW) – VÒNG 1
## Module: Bệnh Gút (Gout) – GDMT-VN

> **Reviewer**: R3 – Chuyên gia Phản biện An toàn Đối kháng (Adversarial Safety Tester)  
> **Phiên bản engine**: 0.1.0  
> **Ngày thực hiện**: 27/10/2026  
> **Quy chuẩn đánh giá**: Tuân thủ [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md)  
> **Dữ liệu kiểm thử**: Bộ **65 ca bệnh nhân đối nghịch hiểm hóc** (`ADV_GOUT_01` – `ADV_GOUT_65`) + **15 lượt đối chiếu chéo đa Profile** (`INTL` / `VN` / `US`) trên 5 presets chuẩn chạy thực thi trực tiếp qua `evaluate()` ([r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/gout/scratch/r3_adversarial.ts))  
> **Bằng chứng thực nghiệm thô**: [r3_adversarial_results.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/gout/scratch/r3_adversarial_results.json)  
> **Báo cáo JSON chuẩn hóa**: [round1_R3.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/gout/round1_R3.json)

---

## 1. Tóm Tắt Kết Quả & Kết Luận

| Mức độ nghiêm trọng | Số lượng | Tiêu chí chấp thuận | Trạng thái |
|---|:---:|:---:|:---:|
| **CRITICAL** (Nguy cơ gây hại trực tiếp / tử vong / bỏ lọt chống chỉ định tuyệt đối) | **8** | = 0 | ❌ KHÔNG ĐẠT |
| **MAJOR** (Sai lệch guideline / Thiếu cảnh báo bắt buộc / Ngõ cụt điều trị / Fail-open) | **7** | = 0 | ❌ KHÔNG ĐẠT |
| **MINOR** (Liều không khớp dạng bào chế VN / Cảnh báo giả dương tính / Thẻ đích thừa) | **3** | - | ⚠️ CẦN SỬA |
| **SUGGESTION** (Bổ sung trường giao diện cho logic sẵn có) | **1** | - | 💡 THAM KHẢO |
| **TỔNG CỘNG** | **19** | - | **KẾT LUẬN: FAIL** |

> [!CAUTION]
> **KẾT LUẬN VÒNG 1: FAIL (KHÔNG ĐẠT)**  
> Module Gút (`gout`) hiện tại có **8 lỗi CRITICAL** và **7 lỗi MAJOR** được chứng minh trực tiếp trên đầu ra thực thi `evaluate()`. Các nguy cơ an toàn người bệnh nghiêm trọng nhất bao gồm:
> 1. **Hoàn toàn mù trước phác đồ phối hợp trùng lặp 2 thuốc XOI (`allopurinol` + `febuxostat`)**: Không phát `STOP`, không phát cảnh báo trùng nhóm, thậm chí ra lệnh **`UPTITRATE` tăng liều đồng thời cả hai thuốc** (`ADV_GOUT_50`).
> 2. **Ra lệnh `CONTINUE` và `UPTITRATE` Allopurinol ở bệnh nhân ĐÃ DỊ ỨNG Allopurinol (`allopurinolIntolerant = true`)**: Nguy cơ kích hoạt hội chứng hoại tử thượng bì nhiễm độc SJS/TEN/DRESS tử vong (`ADV_GOUT_35`, `ADV_GOUT_49`).
> 3. **Rò rỉ NSAID / COX-2i trên bệnh nhân sau Nhồi máu cơ tim cấp và Suy tim HFrEF**: Không phát `STOP` khi bệnh nhân vừa NMCT cấp đang tự uống `diclofenac 75 mg` hoặc `etoricoxib 120 mg` (`ADV_GOUT_28`, `ADV_GOUT_29`), và vẫn kê mới `[START] Naproxen 500 mg x 2` khi người dùng tích ô UI `"Có tiền sử bệnh tim mạch"` (`hasCvd = true`, `ADV_GOUT_27`) hoặc nhập `LVEF = 28%` (`ADV_GOUT_26`).
> 4. **Bịa đặt giả tạo cơn gút cấp ở 100% bệnh nhân nội viện (`inpatient`) có tiền sử gút**: Khi chưa tích `acuteFlare`, hệ thống tự động kê liều nạp Colchicine cấp cho mọi bệnh nhân nhập viện vì suy tim cấp hoặc bệnh nội khoa khác (`ADV_GOUT_33`, `ADV_GOUT_34`).
> 5. **Ra lệnh `CONTINUE Colchicine 1 mg/ngày` kéo dài 3–6 tháng trên bệnh nhân suy thận nặng CKD G4 (`eGFR = 18`)**: Lỗi tương tác giữa `gout.prophylaxis.flare` và `merge.ts` ghi đè mất liều giảm thận, duy trì liều gấp > 3 lần trần an toàn (`ADV_GOUT_12`).
> 6. **Kê đơn `[START] Naproxen` và `[CONTINUE] Aspirin` trên bệnh nhân đang xuất huyết nội sọ cấp (`acuteIntracerebralHemorrhage = true`)** (`ADV_GOUT_23`).
> 7. **Chuẩn độ `UPTITRATE` vượt trần FDA (`Allopurinol 800 mg -> +100 mg`) và vượt gấp 4 lần trần suy thận giai đoạn cuối (`eGFR = 8` lên `400 mg/ngày`; `Febuxostat 80 mg` giữ nguyên ở `eGFR = 18`)** (`ADV_GOUT_13`, `ADV_GOUT_14`, `ADV_GOUT_57`).
> 8. **Bỏ sót không `STOP` thuốc ULT thứ hai (`probenecid`) ở phụ nữ mang thai** và đánh rơi lệnh `CONTINUE Allopurinol` trong cơn cấp do lỗi chỉ đọc phần tử đầu tiên `findMed(...)` (`ADV_GOUT_32`, `ADV_GOUT_59`).

---

## 2. Phương Pháp Kiểm Thử Đối Nghịch (Adversarial Methodology)

Reviewer R3 đã thiết kế và chạy thực thi **65 kịch bản bệnh nhân đối nghịch** trong [r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/gout/scratch/r3_adversarial.ts) cùng **15 lượt đối chiếu chéo đa Profile (`INTL` / `VN` / `US`)**, tấn công trực diện vào 10 trục lâm sàng hiểm hóc:

| Trục kiểm thử | Kịch bản (`ADV_GOUT_*`) | Mục tiêu công phá an toàn |
|---|:---:|---|
| **1. Dữ liệu khuyết thiếu (Fail-closed)** | `01` – `08` | Thiếu `scr`/`egfr`, thiếu `uricAcid`, thiếu `goutFlaresYear`, thiếu `hlab5801`; đang dùng `colchicine + verapamil` nhưng thiếu `scr`. |
| **2. Cơn gút cấp + CKD G4/G5 & Lọc máu** | `09` – `14` | `eGFR = 18`, `eGFR = 8`, `onDialysis = true` (kể cả khi `scr = undefined`), đang tự uống NSAID/Colchicine, đang dùng Colchicine 1 mg/ngày hoặc Febuxostat 80 mg/ngày. |
| **3. ĐTĐ2 mất kiểm soát & Nhiễm trùng cấp** | `15` – `18` | `HbA1c = 10.5%`, `Glucose = 18.0–24.5 mmol/L`, nghi ngờ DKA (`dkaSuspected = true`), nhiễm nấm/nhiễm trùng toàn thân khi phải dùng Prednisolone 30–35 mg/ngày hoặc dự phòng 3–6 tháng. |
| **4. Xuất huyết tiêu hóa, Nội sọ & Chống đông** | `19` – `24` | Loét dạ dày xuất huyết + Clarithromycin, Apixaban + Naproxen, Rivaroxaban + Diltiazem + CKD G3b, Warfarin + Indomethacin, Xuất huyết nội sọ cấp (`ICH`), AF dùng Apixaban + Aspirin. |
| **5. Suy tim HFrEF & Sau Nhồi máu cơ tim** | `25` – `30` | `LVEF 28%` (có và không tích cờ `hf`), ô UI `hasCvd = true`, sau NMCT cấp (`recentAcs = true`) đang tự uống Diclofenac 75 mg / Etoricoxib 120 mg, bảo toàn lợi tiểu quai Furosemide ở HFrEF. |
| **6. Đang dùng ULT trong cơn cấp & Nội viện** | `31` – `35` | Đang uống `allopurinol 300 mg` ổn định, phối hợp `probenecid + allopurinol` khi `eGFR = 22`, bệnh nhân nội viện không có cơn cấp (`customInputs: {}`), dị ứng Allopurinol trong cơn cấp. |
| **7. Bẫy tương tác Colchicine tử vong** | `36` – `43` | `clarithromycin`, `cyclosporine`, `verapamil`, `diltiazem + CKD G3a`, `atorvastatin 80 mg + CKD G3b`, `rosuvastatin 20 mg + CKD G4`, `amiodarone + CKD G3b`, bùng cơn cấp khi đang uống Colchicine dự phòng. |
| **8. Azathioprine/6-MP, HLA-B*58:01 & Trùng XOI** | `44` – `53` | `azathioprine` / `mercaptopurine` (chưa dùng ULT & đang dùng Allopurinol/Febuxostat), người Việt `HLA-B*58:01 (+)` và `not_done`, dị ứng Allopurinol ngoài cơn cấp, trùng 2 XOI (`allopurinol + febuxostat`), CVD dùng Febuxostat (FDA CARES). |
| **9. Uricosuric, Vượt trần liều, Thai kỳ & Không triệu chứng** | `54` – `61` | Sỏi thận / `eGFR = 24` / xơ gan dùng `probenecid` & `benzbromarone`, kịch trần `allopurinol 800 mg`, thai kỳ + cơn cấp / đa thuốc ULT, tăng acid uric không triệu chứng (`580 µmol/L`, 0 cơn; hoặc đang uống nhầm Allopurinol). |
| **10. Đa Profile (`INTL`/`US`/`VN`), Đơn vị & Đa module** | `62` – `65` + 15 Preset runs | Đích tophi trên `US`, sai số biên đơn vị `6.0 mg/dL`, xung đột `gout + htn` khi đổi `hydrochlorothiazide` sang `losartan` ở BN tăng Kali máu (`K+ = 5.8`) / hẹp ĐM thận (`renalBruit = true`). |

---

## 3. Các Điểm Sáng An Toàn Đã Vượt Qua Kiểm Thử (Safety Barriers Verified)

Trước khi đi vào chi tiết các lỗi cần khắc phục, kiểm thử đối kháng ghi nhận các hàng rào an toàn được thiết kế tốt và hoạt động chính xác:
- **Fail-closed cơ bản khi thiếu `scr`/`uricAcid`/`goutFlaresYear`** (`ADV_GOUT_01`–`05`, `07`, `08`): Khi thiếu hoàn toàn Creatinin ở bệnh nhân mới, hệ thống chặn tuyệt đối không kê mù Colchicine, NSAID, Allopurinol, Probenecid hay Benzbromarone và sinh đúng thẻ `missing_input_egfr` / `missing_input_uricAcid`.
- **Chặn NSAID và Colchicine trong cơn gút cấp trên nền CKD G4/G5 & Lọc máu chu kỳ** (`ADV_GOUT_09`, `ADV_GOUT_10`, `ADV_GOUT_11`): Kể cả khi `onDialysis = true` mà không nhập `scr`, hệ thống vẫn phát `[AVOID/STOP] Colchicine` và `[AVOID/STOP] NSAID`, chuyển sang Corticoid uống hoặc tiêm nội khớp.
- **Bảo vệ nghiêm ngặt nguyên tắc KHÔNG ngừng Allopurinol ổn định trong cơn gút cấp** (`ADV_GOUT_31`): Giữ nguyên `[CONTINUE] Allopurinol 300 mg` ngay cả trên `Profile VN` (trong khi bệnh nhân chưa dùng ULT trên `Profile VN` được trì hoãn `DEFER` 1–2 tuần đúng QĐ 361/BYT tại `ADV_GOUT_10`, `19`, `22`).
- **Tương tác tử vong Azathioprine / 6-Mercaptopurine** (`ADV_GOUT_45`, `ADV_GOUT_46`): Phát lệnh `[STOP]` khẩn cấp cho cả `allopurinol` lẫn `febuxostat` kèm `SafetyAlert` mức `CRITICAL` (`ix.allopurinol_azathioprine`, `ix.febuxostat_azathioprine`).
- **Bảo toàn lợi tiểu quai Furosemide ở bệnh nhân suy tim HFrEF** (`ADV_GOUT_30`): Tuyệt đối không phát lệnh đổi Furosemide sang Losartan/CCB, phối hợp mượt mà với 4 trụ cột HFrEF.
- **Chuyển đổi thông minh Febuxostat trên bệnh nhân có tiền sử CVD theo FDA CARES** (`ADV_GOUT_52`, `ADV_GOUT_53`): Khuyến cáo `[SWITCH]` sang Allopurinol khi `HLA-B*58:01` âm tính (`ADV_GOUT_52`), nhưng giữ an toàn Febuxostat và `[AVOID]` Allopurinol nếu bệnh nhân CVD mang gen `HLA-B*58:01` dương tính (`ADV_GOUT_53`).
- **Chặn chuẩn xác nhóm Uricosuric ở sỏi thận, `eGFR < 30` và xơ gan** (`ADV_GOUT_54`, `55`, `56`): Phát đúng `[STOP]` và `[AVOID]` cho cả `probenecid` và `benzbromarone`.

---

## 4. Chi Tiết Các Phát Hiện Lỗi An Toàn (Detailed Findings)

### 4.1. Nhóm Lỗi Nghiêm Trọng Mức CRITICAL (8 Lỗi)

#### [R3-GOUT-01] Hoàn toàn mù trước phác đồ trùng lặp 2 thuốc XOI (`Allopurinol` + `Febuxostat`), ra lệnh tăng liều đồng thời cả hai thuốc
- **Mức độ**: `CRITICAL` | **Phân loại**: `missing` | **Mục tiêu**: `gout.safety.duplicate_xoi` ([rules.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1559-L1860), [duplicates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/duplicates.ts#L48-L178), [merge.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/merge.ts#L100-L209))
- **Bằng chứng thực nghiệm (`ADV_GOUT_50` & `ADV_GOUT_51`)**:
  - `ADV_GOUT_50`: Bệnh nhân đang uống đồng thời `allopurinol 300 mg` + `febuxostat 40 mg`, `uricAcid = 450 µmol/L`. Đầu ra `evaluate()`:
    - `[UPTITRATE:allopurinol] Chuẩn độ tăng liều Allopurinol thêm 100 mg/ngày`
    - `[UPTITRATE:febuxostat] Tăng liều Febuxostat lên 80 mg/ngày`
    - `STOP = 0`, `alerts = []`!
  - `ADV_GOUT_51` (`uricAcid = 280 µmol/L`): Phát đồng thời `[CONTINUE:allopurinol]` VÀ `[CONTINUE:febuxostat]`, `alerts = []`.
- **Cơ chế lỗi**: Cả 4 tầng bảo vệ (`rules.ts`, `DUPLICATE_CLASS_RULES` trong `duplicates.ts`, `CLASS_CONFLICT_GROUPS` trong `merge.ts`, và `kb/interactions/gout_metabolic.json`) đều thiếu định nghĩa xung đột nhóm `xoi` (`allopurinol` + `febuxostat`). ACR 2020 khuyến cáo chống chỉ định phối hợp hai thuốc XOI do độc tính cộng gộp nặng trên gan, tủy xương và da.
- **Đề xuất sửa**: Bổ sung nhóm `xoi` vào `duplicates.ts`, `merge.ts`, `kb/interactions/gout_metabolic.json` và thêm luật ưu tiên cao `gout.safety.duplicate_xoi` trong `rules.ts` phát lệnh `[STOP]` một trong hai thuốc XOI.

---

#### [R3-GOUT-02] Ra lệnh `CONTINUE` và `UPTITRATE` Allopurinol trên bệnh nhân ĐÃ CÓ TIỀN SỬ DỊ ỨNG Allopurinol (`allopurinolIntolerant = true`)
- **Mức độ**: `CRITICAL` | **Phân loại**: `rule` | **Mục tiêu**: [`gout.allopurinol.uptitrate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1559-L1570) & [`gout.acute_flare.continue_ult`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1166-L1178)
- **Bằng chứng thực nghiệm (`ADV_GOUT_35` & `ADV_GOUT_49`)**:
  - `ADV_GOUT_35` (Nữ 58 tuổi, đang lên cơn gút cấp, `customInputs: { acuteFlare: true, allopurinolIntolerant: true }`, đơn thuốc hiện tại có `allopurinol 100 mg`): Đầu ra `evaluate()` phát `[CONTINUE:allopurinol] TIẾP TỤC Allopurinol (TUYỆT ĐỐI KHÔNG NGỪNG ULT TRONG CƠN GÚT CẤP) (100 mg)`, `STOP = 0`!
  - `ADV_GOUT_49` (Ngoài cơn cấp, `allopurinolIntolerant: true`, đang có `allopurinol 100 mg`, `uricAcid = 480 µmol/L`): Đầu ra `evaluate()` phát `[UPTITRATE:allopurinol] Chuẩn độ tăng liều Allopurinol thêm 100 mg/ngày`, `STOP = 0`!
- **Cơ chế lỗi**: Hàm `isAllopurinolContraindicated(ctx)` ([rules.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L287-L293)) có kiểm tra `allopurinolIntolerant`, nhưng chỉ được dùng cho luật khởi trị mới. Các luật duy trì trong cơn cấp và chuẩn độ tăng liều quên gọi hàm này, đồng thời thiếu hoàn toàn luật an toàn phát lệnh `[STOP]` khẩn cấp khi bệnh nhân dị ứng Allopurinol.
- **Đề xuất sửa**: Thêm luật `gout.safety.allopurinol_intolerant` phát `[STOP:allopurinol]` ngay lập tức (kể cả trong cơn cấp) khi `allopurinolIntolerant === true` hoặc có `'allopurinol'` trong `patient.allergies`, đồng thời chặn `isAllopurinolContraindicated(ctx)` ở mọi luật `CONTINUE` / `UPTITRATE` của Allopurinol.

---

#### [R3-GOUT-03] Bỏ lọt không dừng Diclofenac / Etoricoxib sau Nhồi máu cơ tim cấp và vẫn kê mới Naproxen ở bệnh nhân có `hasCvd = true` hoặc `LVEF = 28%`
- **Mức độ**: `CRITICAL` | **Phân loại**: `rule` | **Mục tiêu**: [`gout.safety.nsaid_contra`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L807-L875) & [`gout.acute_flare.nsaid`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L303-L326)
- **Bằng chứng thực nghiệm (`ADV_GOUT_26`, `ADV_GOUT_27`, `ADV_GOUT_28`, `ADV_GOUT_29`)**:
  - `ADV_GOUT_28` (Nam 62 tuổi vừa NMCT cấp `ascvd: true, recentAcs: true`, đang tự uống `diclofenac 75 mg`): Engine xuất **`STOP = 0`, `alerts = []`**!
  - `ADV_GOUT_29` (Sau NMCT cấp đang tự uống `etoricoxib 120 mg`): Engine xuất **`STOP = 0`, `alerts = []`**!
  - `ADV_GOUT_27` (Tích chọn ô giao diện Gút `"Có tiền sử bệnh tim mạch"` -> `customInputs.hasCvd = true`, đang dùng `clarithromycin`): Engine kê **`[START:naproxen] Naproxen kháng viêm 500 mg x 2 lần/ngày × 5 ngày`** (`NSAID_Eligible: passed = true`)!
  - `ADV_GOUT_26` (Nhập `lvef: 28` nhưng quên tích cờ `conditions.hf`, đang dùng `clarithromycin`): Engine kê **`[START:naproxen] Naproxen kháng viêm 500 mg x 2 lần/ngày × 5 ngày`**!
- **Cơ chế lỗi**:
  1. [`isNsaidHardContraindicated`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L303-L313) không kiểm tra `ascvd`, `recentAcs`, `strokeOrTia`, `hasCvd` và không kiểm tra `lvef < 50`.
  2. [`isNsaidAvoidedInGout`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L318-L326) kiểm tra `conditions.ascvd` nhưng quên đọc `customInputs.hasCvd` (chính là checkbox tim mạch duy nhất trên form Gút tại [inputs.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/inputs.ts#L103-L108)!) và `conditions.strokeOrTia`.
  3. [`gates.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts#L786-L840) không ánh xạ `contra.code === 'heart_failure'` hay `'ischemic_heart_disease'`.
- **Đề xuất sửa**: Hợp nhất kiểm tra suy tim (`conditions.hf || (lvef !== undefined && lvef < 50)`) và bệnh tim mạch xơ vữa (`ascvd || recentAcs || strokeOrTia || customInputs.hasCvd`) vào cả `isNsaidHardContraindicated` (phát lệnh `STOP` khẩn cấp mọi NSAID/COX-2i) và `isNsaidAvoidedInGout`, đồng thời bổ sung cổng chặn tương ứng trong `gates.ts` và `reviewMeds.ts`.

---

#### [R3-GOUT-04] Bịa đặt giả tạo cơn gút cấp ở 100% bệnh nhân nội viện (`inpatient`) có tiền sử gút khi chưa nhập `acuteFlare`
- **Mức độ**: `CRITICAL` | **Phân loại**: `rule` | **Mục tiêu**: [`isAcuteGoutFlare`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L147-L154)
- **Bằng chứng thực nghiệm (`ADV_GOUT_33` & `ADV_GOUT_34`)**:
  - `ADV_GOUT_33` (Nam 68 tuổi nhập viện nội trú `setting: 'inpatient'` vì suy tim mất bù cấp `LVEF 30%`, tiền sử gút ổn định trên `allopurinol 300 mg`, `uricAcid = 310 µmol/L`, `customInputs: {}`): Hệ thống tự bịa ra cơn gút cấp và kê đơn **`[START:colchicine] Colchicine liều thấp: 1.2 mg sau đó 0.6 mg sau 1 giờ`**!
  - `ADV_GOUT_34` (`VN/inpatient`, `customInputs: {}`): Tự kê `[START:colchicine] 1 mg sau đó 0.5 mg sau 1 giờ` và trì hoãn ULT vì "đang cơn cấp"!
- **Cơ chế lỗi**: Dòng 151–153 của [rules.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L151-L153) viết: `if (ctx.settings.setting === 'inpatient') { return Boolean(ctx.normalized.conditions?.gout); }`. Khi người dùng chưa chạm vào checkbox `acuteFlare` (`undefined`), mọi bệnh nhân nội viện có bệnh kèm gút mạn đều bị ép điều trị cắt cơn cấp!
- **Đề xuất sửa**: Sửa `isAcuteGoutFlare(ctx)` chỉ trả về `true` khi `ctx.normalized.customInputs?.acuteFlare === true` (fail-closed).

---

#### [R3-GOUT-05] Ra lệnh `CONTINUE Colchicine 1 mg/ngày` kéo dài 3–6 tháng trên bệnh nhân suy thận mạn nặng CKD G4 (`eGFR = 18 mL/phút/1.73m²`)
- **Mức độ**: `CRITICAL` | **Phân loại**: `rule` | **Mục tiêu**: [`gout.prophylaxis.flare`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L2364-L2405) & [`mergeRecommendations`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/merge.ts#L509-L520)
- **Bằng chứng thực nghiệm (`ADV_GOUT_12`)**:
  - Bệnh nhân CKD G4 (`scr = 310 µmol/L` -> `eGFR = 18.4`), đang uống `colchicine 1 mg/ngày` trong `currentMeds`, khởi trị `allopurinol ≤ 50 mg/ngày`.
  - Đầu ra `evaluate()`: **`[CONTINUE:colchicine] TIẾP TỤC DUY TRÌ Colchicine (Dự phòng cơn bùng phát) [Liều hiện tại: 1] (dose: "1")`**; `STOP = 0`, `REDUCE = 0`!
- **Cơ chế lỗi**: `gout.prophylaxis.flare` tính ra `doseStr = "0.3 mg x 1 lần/ngày (giảm liều do suy thận nặng)"`, nhưng phát `action: 'START'` thay vì `REDUCE` khi bệnh nhân đang dùng sẵn Colchicine. Sau đó `merge.ts` dòng 509–520 tự động biến `START` thành `CONTINUE` và **ghi đè `dose` bằng `curMed.dose` (`"1"`)**, xóa sạch liều giảm thận!
- **Đề xuất sửa**: Kiểm tra nếu `colchicine` đã nằm trong `currentMeds` với liều cao hơn liều trần thận/tương tác thì phát `action: 'REDUCE'` (không phát `START`), đồng thời sửa `merge.ts` không ghi đè mất liều hiệu chỉnh an toàn.

---

#### [R3-GOUT-06] Kê đơn `[START] Naproxen` và `[CONTINUE] Aspirin` trên bệnh nhân đang xuất huyết nội sọ cấp (`acuteIntracerebralHemorrhage = true`)
- **Mức độ**: `CRITICAL` | **Phân loại**: `rule` | **Mục tiêu**: [`hasPepticUlcerOrBleed`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L114-L120)
- **Bằng chứng thực nghiệm (`ADV_GOUT_23`)**:
  - Bệnh nhân nội viện đang xuất huyết nội sọ cấp (`conditions: { gout: true, acuteIntracerebralHemorrhage: true }`), đang dùng `clarithromycin` + `aspirin 81 mg`.
  - Đầu ra `evaluate()`: Phát **`[START:naproxen] Naproxen kháng viêm 500 mg x 2 lần/ngày × 5 ngày`** VÀ **`[CONTINUE:aspirin] Tiếp tục duy trì Aspirin liều thấp (KHÔNG ngừng vì bệnh Gút)`**!
- **Cơ chế lỗi**: `hasPepticUlcerOrBleed(ctx)` chỉ đọc `pepticUlcer` và `bleedingHistory`, quên hoàn toàn `acuteIntracerebralHemorrhage`.
- **Đề xuất sửa**: Đưa `acuteIntracerebralHemorrhage` vào `hasPepticUlcerOrBleed(ctx)` và bổ sung cổng chặn toàn cục trong `gates.ts` / `reviewMeds.ts` chuyển mọi NSAID, kháng tiểu cầu và thuốc chống đông sang `STOP` / `AVOID` khi có xuất huyết nội sọ cấp.

---

#### [R3-GOUT-07] Chuẩn độ tăng liều và duy trì XOI vượt trần tối đa FDA (`Allopurinol > 800 mg/ngày`) và vượt trần suy thận nặng (`eGFR = 8`, `Febuxostat 80 mg` ở `eGFR = 18`)
- **Mức độ**: `CRITICAL` | **Phân loại**: `rule` | **Mục tiêu**: [`gout.allopurinol.uptitrate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1559-L1660) & [`gout.febuxostat.manage`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1775-L1860)
- **Bằng chứng thực nghiệm (`ADV_GOUT_13`, `ADV_GOUT_14`, `ADV_GOUT_57`)**:
  - `ADV_GOUT_57`: Đang uống kịch trần FDA `allopurinol 800 mg/ngày` (`uricAcid = 460 µmol/L`) -> Engine vẫn ra lệnh **`[UPTITRATE:allopurinol] Tăng thêm 100 mg mỗi 2–5 tuần (tối đa 800 mg/ngày)`** (thành 900 mg/ngày!).
  - `ADV_GOUT_13`: Suy thận giai đoạn cuối CKD G5 (`eGFR = 8.0`, `CrCl = 9.4 mL/phút`) đang uống `allopurinol 300 mg/ngày` -> Engine vẫn ra lệnh **`[UPTITRATE:allopurinol] thêm 100 mg/ngày`** (lên 400 mg/ngày, gấp 4 lần trần thận `100 mg/ngày` trong [allopurinol.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/allopurinol.json)).
  - `ADV_GOUT_14`: CKD G4 (`eGFR = 18.4`) trên `Profile US` đang uống `febuxostat 80 mg/ngày` (`uricAcid = 310`) -> Engine phát **`[CONTINUE:febuxostat]`** ở liều 80 mg thay vì `REDUCE` về trần thận FDA `40 mg/ngày` (do dòng 1806 kiểm tra đạt đích urat trước khi kiểm tra `egfr < 30` ở dòng 1833!).
- **Đề xuất sửa**: Đọc và kiểm tra `currentMed.dose` cùng ngưỡng thận `egfr`/`crcl` trước khi phát `UPTITRATE` hoặc `CONTINUE` ở cả `gout.allopurinol.uptitrate` và `gout.febuxostat.manage`.

---

#### [R3-GOUT-08] Lỗi chỉ lấy thuốc đầu tiên `findMed(...)` làm bỏ sót không `STOP` Probenecid trong thai kỳ và đánh rơi `CONTINUE Allopurinol` trong cơn gút cấp
- **Mức độ**: `CRITICAL` | **Phân loại**: `rule` | **Mục tiêu**: [`gout.safety.pregnancy_ult`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L502-L545) & [`gout.acute_flare.continue_ult`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1166-L1220)
- **Bằng chứng thực nghiệm (`ADV_GOUT_59` & `ADV_GOUT_32`)**:
  - `ADV_GOUT_59`: Phụ nữ mang thai đang uống đồng thời `allopurinol 100 mg` + `probenecid 500 mg`. Engine chỉ phát `[STOP:allopurinol]`, còn **`probenecid` hoàn toàn không có lệnh `STOP`**!
  - `ADV_GOUT_32`: Cơn gút cấp đang uống `probenecid 500 mg` + `allopurinol 300 mg` khi `eGFR` tụt xuống `22`. `findMed(ctx, ULT_DRUG_IDS)` bốc trúng `probenecid` đứng đầu mảng rồi bị đè bởi `STOP probenecid`, làm **biến mất hoàn toàn lệnh `[CONTINUE:allopurinol] 300 mg` trong cơn cấp**!
- **Đề xuất sửa**: Tách luật dừng ULT trong thai kỳ cho cả nhóm XOI và nhóm Uricosuric (hoặc quét toàn bộ mảng `currentMeds` trong `reviewMeds.ts`), và lọc bỏ các thuốc ULT đang bị chống chỉ định trước khi chọn thuốc để `CONTINUE` trong cơn cấp.

---

### 4.2. Nhóm Lỗi Nghiêm Trọng Mức MAJOR (7 Lỗi)

#### [R3-GOUT-09] Kê đơn Prednisolone 30–35 mg/ngày (và dự phòng 3–6 tháng) trên bệnh nhân ĐTĐ2 mất kiểm soát nặng (`Glucose 18–24.5`, nghi DKA) & nhiễm trùng toàn thân mà KHÔNG có cảnh báo
- **Mức độ**: `MAJOR` | **Mục tiêu**: [`gout.acute_flare.corticosteroid`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1060-L1160) & [`gout.prophylaxis.flare`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L2440-L2461)
- **Bằng chứng (`ADV_GOUT_15`, `16`, `17`, `18`)**: Ở `HbA1c = 10.5%`, `Glucose = 18.0–24.5 mmol/L` (`dkaSuspected = true`) và nhiễm nấm toàn thân, hệ thống phát `[START:prednisolone] 30–35 mg/ngày` với `warnings: undefined`, không cảnh báo theo dõi đường huyết mao mạch, không yêu cầu loại trừ viêm khớp nhiễm khuẩn/nhiễm nấm toàn thân (`gates.ts` cũng bỏ qua `contra.code === 'systemic_fungal_infection'`). Ngoài ra `rec_gout_steroid_prophylaxis` thiếu con số trần liều `≤ 10 mg/ngày` (ACR 2020).
- **Đề xuất sửa**: Bổ sung `warnings` động bắt buộc kiểm soát đường huyết & loại trừ nhiễm khuẩn khớp/toàn thân (tạm hoãn/ưu tiên tiêm nội khớp đơn khớp nếu `glucose >= 20 mmol/L` hoặc `dkaSuspected`), ghi rõ trần liều dự phòng `5–10 mg/ngày (≤ 10 mg/ngày)`, và ánh xạ `systemic_fungal_infection` trong `gates.ts`.

---

#### [R3-GOUT-10] Ba lỗ hổng an toàn Colchicine: Fail-open khi thiếu `scr`, kê Colchicine trên nền `Statin liều cao + CKD`, và bỏ sót chất ức chế mạnh P-gp `Amiodarone`
- **Mức độ**: `MAJOR` | **Mục tiêu**: [`gout.safety.colchicine`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L247-L280)
- **Bằng chứng (`ADV_GOUT_06`, `ADV_GOUT_40`, `ADV_GOUT_41`, `ADV_GOUT_42`)**:
  1. `ADV_GOUT_06` (`colchicine 1 mg + verapamil 120 mg`, `scr = undefined`): Không phát `missing_input_egfr` và không giảm liều/dừng Colchicine (fail-open tại dòng 258 `egfr !== undefined && egfr < modCypRenalCutoff`).
  2. `ADV_GOUT_40` (`atorvastatin 80 mg + eGFR 35`) & `ADV_GOUT_41` (`rosuvastatin 20 mg + eGFR 20`): Vừa phát `[START:colchicine]` vừa bắn `!CRITICAL:ix.statin_colchicine` yêu cầu tránh phối hợp ở suy thận (nguy cơ tiêu cơ vân cấp).
  3. `ADV_GOUT_42` (`amiodarone 200 mg + eGFR 35`): Phát `[START:colchicine] 1.2 mg + 0.6 mg` liều đầy đủ, `alerts = []`.
- **Đề xuất sửa**: Đảm bảo fail-closed đòi `egfr` khi bệnh nhân đang dùng Colchicine; tránh khởi trị Colchicine khi đang dùng Statin liều cao trên nền `eGFR < 60` (ưu tiên Corticoid ngắn ngày); bổ sung `amiodarone` và `dronedarone` vào nhóm ức chế P-gp.

---

#### [R3-GOUT-11] Tăng acid uric không triệu chứng đang bị kê nhầm Allopurinol lại bị hệ thống ra lệnh `UPTITRATE Allopurinol` + `START Colchicine 3–6 tháng`; giải thích sai khi thiếu `priorFlaresLifetime`
- **Mức độ**: `MAJOR` | **Mục tiêu**: [`gout.allopurinol.uptitrate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1559-L1575) & [`assessUltIndication`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L177-L233)
- **Bằng chứng (`ADV_GOUT_61` & `ADV_GOUT_60`)**:
  - `ADV_GOUT_61` (`asymptomaticHyperuricemia: true`, 0 cơn, không tophi, đang uống nhầm `allopurinol 100 mg`, `uricAcid = 430`): Phát `[UPTITRATE:allopurinol] +100 mg` và `[START:colchicine] 3–6 tháng`!
  - `ADV_GOUT_60` (`uricAcid = 580 µmol/L`, `goutFlaresYear = 0`, bỏ trống `priorFlaresLifetime`): Phát `rationale` sai thực tế: *"Người bệnh mới bị cơn gút đầu tiên... acid uric máu ≤ 535 µmol/L"* (dù `uricAcid = 580 > 535`).
- **Đề xuất sửa**: Chặn `isAsymptomaticHyperuricemia(ctx)` ở các luật `uptitrate`/`manage`/`prophylaxis`, thêm gợi ý rà soát ngừng ULT không chỉ định, và sửa nhánh phân loại khi `goutFlaresYear === 0 && priorFlaresLifetime === undefined`.

---

#### [R3-GOUT-12] Gán sai `drugId: 'losartan'` trong lệnh `SWITCH` lợi tiểu Thiazide làm phát sinh lệnh vô lý `[HOLD] TẠM HOÃN Losartan` khi `K+ = 5.8 mmol/L` (dù bệnh nhân không dùng Losartan)
- **Mức độ**: `MAJOR` | **Mục tiêu**: [`gout.concurrent.switch_thiazide`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L2498-L2555)
- **Bằng chứng (`ADV_GOUT_65`, `ADV_GOUT_64`, `gout_preset_htn_on_thiazide`)**:
  - `ADV_GOUT_65` (`currentMeds: [{ drugId: 'hydrochlorothiazide', dose: '25' }]`, `k = 5.8 mmol/L`, `renalBruit = true`): Do luật không kiểm tra `k > 5.0` hay `renalBruit` và gán `drugId: 'losartan'`, `gates.ts` chặn lại thành **`[HOLD:losartan] TẠM HOÃN Losartan (K⁺ = 5.8 > 5.5 mmol/L)`** trên bệnh nhân hề không uống Losartan, làm mất hoàn toàn khuyến cáo đổi HCTZ sang CCB!
  - Trên `ADV_GOUT_64` và preset chuẩn `gout_preset_htn_on_thiazide`, phác đồ xuất đồng thời `[START:amlodipine]` và `[SWITCH:losartan]` không liều lượng.
- **Đề xuất sửa**: Bổ sung kiểm tra `ctx.normalized.k > 5.0 || ctx.normalized.renalBruit` vào `hasAngioedemaOrRasContra`, và sửa `drugId` của `rec_gout_switch_thiazide_losartan` thành `medId` (`'hydrochlorothiazide'`) thống nhất với nhánh CCB dòng 2515.

---

#### [R3-GOUT-13] Ngõ cụt điều trị (Therapeutic Dead-End) khi `STOP` Allopurinol do `HLA-B*58:01 (+)` và khi dùng `Azathioprine / 6-MP`
- **Mức độ**: `MAJOR` | **Mục tiêu**: [`gout.febuxostat.initiate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1665-L1770) & [`gout.uricosuric.probenecid`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1945-L2035)
- **Bằng chứng (`ADV_GOUT_47` & `ADV_GOUT_44`)**:
  - `ADV_GOUT_47`: Người Việt `HLA-B*58:01 (+)` có 3 cơn gút/năm đang lỡ uống `allopurinol 100 mg` chỉ nhận được `[STOP:allopurinol]` mà không được chuyển sang `febuxostat` (do `canInitiateUltNow` chặn `isOnMed(ctx, ULT_DRUG_IDS)` ngay cả khi thuốc đó vừa bị `STOP`!).
  - `ADV_GOUT_44`: Bệnh nhân gút tophi nặng đang dùng `azathioprine 100 mg` (`eGFR = 84`, không sỏi thận) chỉ nhận được 2 lệnh `[AVOID]` Allopurinol & Febuxostat, bỏ trống hoàn toàn phác đồ ULT thay thế (do `gout.uricosuric.probenecid` đòi cờ ẩn `preferUricosuric` không có trên UI).
- **Đề xuất sửa**: Cho phép `gout.febuxostat.initiate` kích hoạt khi Allopurinol hiện dùng bị `STOP` do `HLA-B*58:01 (+)` / dị ứng; tự động mở nhánh đánh giá Uricosuric (`probenecid`) hoặc `[REFER]` chuyên khoa khi đang dùng Azathioprine / 6-MP.

---

#### [R3-GOUT-14] Mâu thuẫn y lệnh trên `Profile VN` khi chưa làm xét nghiệm `HLA-B*58:01` (`not_done`): Vừa kê `[START] Allopurinol` uống ngay vừa khuyên xét nghiệm `HLA-B*58:01` trước khi khởi trị
- **Mức độ**: `MAJOR` | **Mục tiêu**: [`gout.allopurinol.initiate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1400-L1555)
- **Bằng chứng (`ADV_GOUT_48`)**: Trên `VN/outpatient` với `hlab5801: 'not_done'`, hệ thống phát đồng thời dòng 1 `[START:allopurinol] Khởi trị Allopurinol liều thấp 100 mg/ngày` và dòng 2 `[CONSIDER] Khuyến cáo xét nghiệm alen HLA-B*58:01 trước khi khởi trị Allopurinol`.
- **Đề xuất sửa**: Ở nhóm nguy cơ cao (`profile === 'VN'` hoặc Đông Nam Á) khi chưa có `HLA-B*58:01`, chuyển lệnh khởi trị sang `CONSIDER` hoặc chèn cảnh báo rõ ràng trong `warnings` ưu tiên lấy máu xét nghiệm `HLA-B*58:01` trước khi uống viên đầu tiên (nếu cơ sở có điều kiện) hoặc cân nhắc Febuxostat.

---

#### [R3-GOUT-15] Lệch chuẩn mục tiêu tophi trên `Profile US` và sai số làm tròn đơn vị `mg/dL -> µmol/L` khiến `uricAcid = 6.0 mg/dL` bị tính nhầm là "Đã đạt đích `< 6.0 mg/dL`"
- **Mức độ**: `MAJOR` | **Mục tiêu**: [`kb/thresholds/gout.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/gout.json#L1-L30) & [`src/engine/units.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/units.ts#L22-L26)
- **Bằng chứng (`ADV_GOUT_62` & `ADV_GOUT_63`)**:
  - `ADV_GOUT_62`: Trên `Profile US` (ACR 2020 chỉ đặt đích `< 6 mg/dL`), bệnh nhân có tophi với `uricAcid = 330 µmol/L` (`5.55 mg/dL < 6.0`) bị ép `UPTITRATE Allopurinol` theo ngưỡng `< 300` của EULAR 2016 nhưng lại gắn citation `acr.gout.2020.urate_target_360`.
  - `ADV_GOUT_63`: Khi chọn đơn vị `mg/dL` và nhập `uricAcid = 6.0` (chưa đạt `< 6.0`!), phép tính `6.0 * 59.48 = 356.88 < 360` làm hệ thống kết luận sai `[CONTINUE:allopurinol] Đã đạt đích Acid Uric (< 6 mg/dL)`! (Tương tự `5.0 mg/dL * 59.48 = 297.4 < 300`).
- **Đề xuất sửa**: Chuẩn hóa lại citation/ngưỡng tophi trên `Profile US`, và đồng bộ hệ số quy đổi đơn vị `mg/dL <-> µmol/L` tại biên `6.0 mg/dL` và `5.0 mg/dL`.

---

### 4.3. Nhóm Lỗi MINOR & SUGGESTION (4 Mục)

- **[R3-GOUT-16] (`MINOR` – `threshold`)**: Trên `Profile VN`, hệ thống kê liều Colchicine giảm liều thận/tương tác là `0.3 mg x 1 lần/ngày` ([gout.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/gout.json#L120-L145)), không thể bẻ từ viên nén Colchicine **1 mg** lưu hành tại Việt Nam (nên đổi trên `VN` thành `0.5 mg uống cách ngày` hoặc tránh dùng ở `eGFR < 30`).
- **[R3-GOUT-17] (`MINOR` – `rule`)**: [`checkInteractions`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/interactions.ts#L293-L315) bắn cảnh báo giả dương tính `!CRITICAL:ix.nsaid_corticosteroid_gi_bleed` giữa thuốc NSAID cũ đã có lệnh `[STOP]` (`diclofenac` ở `ADV_GOUT_10`, `etoricoxib` ở `ADV_GOUT_58`) và thuốc `prednisolone` mới `[START]` thay thế.
- **[R3-GOUT-18] (`MINOR` – `rule`)**: [`gout.target.urate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ts#L1265-L1272) vẫn hiện thẻ mục tiêu `< 360 µmol/L ("CHƯA ĐẠT ĐÍCH")` ngay cả khi hệ thống vừa phát `[DEFER] Chưa có chỉ định khởi trị ULT` (`gout_preset_first_flare_mild`, `ADV_GOUT_60`); đồng thời `gout.concurrent.keep_aspirin` phát `[CONTINUE:aspirin]` cứng khi bệnh nhân AF đang dùng kèm Apixaban không có ACS (`ADV_GOUT_24`).
- **[R3-GOUT-19] (`SUGGESTION` – `ui`)**: Bổ sung các trường `preferUricosuric`, `erosions`, `uricAcidOverproduction` vào [`src/modules/gout/inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/inputs.ts) để khớp hoàn toàn với các nhánh logic đã viết trong `rules.ts`.

---

## 5. Kết Luận Kiểm Định Độc Lập (Reviewer R3 Verdict)

- **Tổng số kịch bản đối kháng đã chạy qua `evaluate()`**: **65 ca đối nghịch** + **15 lượt preset đa profile (`INTL` / `VN` / `US`)**.
- **Tổng số phát hiện**: **19** (**8 Critical**, **7 Major**, **3 Minor**, **1 Suggestion**).
- **Trạng thái phê duyệt Vòng 1**: **FAIL** (Yêu cầu khắc phục triệt để toàn bộ 8 lỗi `CRITICAL` và 7 lỗi `MAJOR`, sau đó chạy lại `npx tsx docs/reviews/gout/scratch/r3_adversarial.ts` đạt `0 critical, 0 major` ở Vòng 2).
