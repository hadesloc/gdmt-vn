# BÁO CÁO PHẢN BIỆN AN TOÀN ĐỐI NGHỊCH ĐỘC LẬP (ADVERSARIAL SAFETY REVIEW) – VÒNG 2
## Module: Đái tháo đường típ 2 (`dm2`) – GDMT-VN

> **Vai trò**: R3 – Phản biện an toàn lâm sàng độc lập (`R3_adversarial_tester`)  
> **Vòng đánh giá**: Vòng 2 (`Round 2` – độc lập hoàn toàn, không đọc báo cáo Vòng 2 của R1/R2)  
> **Ngày thực hiện**: 27/10/2026  
> **Quy chuẩn đối chiếu**: [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md), [QA_FINDINGS.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/QA_FINDINGS.md), ADA Standards of Care 2026 (Ch. 6, 9, 10, 11, 13, 15, 16), Đồng thuận ADA/EASD/JBDS/DTI 2024 về DKA/HHS, KDIGO 2022/2024, Quyết định 5481/QĐ-BYT (2020) & 1353/QĐ-BYT (2021), Nhãn thuốc FDA/EMA.  
> **Bộ kiểm thử thực thi thật (`evaluate()`)**: **96 kịch bản đối nghịch** chạy trực tiếp qua Vite SSR runner ([run_r3_vite.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_vite.ts)):
> - Bộ chính 80 kịch bản: [round2_r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/round2_r3_adversarial.ts) → [round2_r3_results.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/round2_r3_results.json)
> - Bộ thăm dò chuyên sâu 16 kịch bản: [round2_r3_deep_probes.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/round2_r3_deep_probes.ts) → [round2_r3_deep_results.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/round2_r3_deep_results.json)
> - File JSON chuẩn hóa theo giao thức: [round2_R3.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/round2_R3.json)

---

## 1. Tóm Tắt Kết Quả & Kết Luận Vòng 2

| Mức độ nghiêm trọng (`severity`) | Số lượng | Tiêu chí PASS theo giao thức | Trạng thái |
|---|:---:|:---:|:---:|
| **CRITICAL** (Nguy cơ gây hại trực tiếp cho người bệnh nếu làm theo) | **9** | `= 0` | ❌ KHÔNG ĐẠT |
| **MAJOR** (Sai guideline / sai liều / bỏ sót khuyến cáo Class I) | **7** | `= 0` | ❌ KHÔNG ĐẠT |
| **MINOR** (Lỗi hiển thị UI / câu chữ tiếng Việt / ngữ cảnh phụ) | **3** | — | ⚠️ CẦN SỬA |
| **SUGGESTION** (Đề xuất hoàn thiện ma trận, lộ trình & nhãn) | **1** | — | 💡 KHUYẾN NGHỊ |
| **TỔNG CỘNG** | **20** | `0 critical, 0 major` | **KẾT LUẬN: FAIL** |

> [!CAUTION]
> **KẾT LUẬN VÒNG 2: FAIL (KHÔNG ĐẠT)**  
> Ghi nhận nỗ lực rất lớn sau Vòng 1: nhóm phát triển đã khắc phục triệt để nhiều lỗ hổng quan trọng (chặn Semaglutide ở MTC/MEN2, dừng toàn bộ thuốc uống/tiêm chống chỉ định và chuyển sang Insulin trong thai kỳ, phân tầng K⁺ `< 3.5` và `> 5.0 mmol/L` trong DKA, tách đồng thời Pioglitazone + Saxagliptin + Sitagliptin ở suy tim, xử trí đường đơn Glucose nguyên chất khi đang dùng Acarbose, khóa fail-closed khi thiếu cân nặng/eGFR).  
> Tuy nhiên, khi mở rộng kiểm thử đối nghịch lên **96 kịch bản thực tế trên `evaluate()`**, module `dm2` và tầng an toàn chung của engine vẫn bộc lộ **9 lỗi CRITICAL** và **7 lỗi MAJOR** có thể gây tai biến nghiêm trọng trên lâm sàng:
> 1. **Nội viện bình đường huyết bị tiêm 32 U Insulin/ngày** (`DP_02`): Bệnh nhân nội viện chưa từng dùng insulin có `glucose = 4.5 mmol/L`, `HbA1c = 5.9%` vẫn bị chỉ định `[START] Glargine 16 U + Aspart 5 U × 3 bữa` do thiếu kiểm tra ngưỡng khởi trị `≥ 10.0 mmol/L` ([R3-R2-DM2-01](#r3-r2-dm2-01)).
> 2. **Cấp cứu DKA / euDKA / HHS tại phòng khám ngoại trú không được chuyển viện mà còn bị kê thêm SGLT2i & Metformin** (`ADV_13`, `ADV_14`, `ADV_15`, `ADV_50` — [R3-R2-DM2-02](#r3-r2-dm2-02)).
> 3. **Bỏ sót 3 thể cấp cứu tăng đường huyết nội viện nguy kịch** (`DP_03`, `ADV_16`, `ADV_17`): HHS kèm toan lactic (`pH 7.24, BHB 1.2`), HHS không nhập tay ALTT dù `2×Na + Glu = 334 mOsm/kg`, và DKA tại viện tuyến chưa có máy đo BHB máu bị đẩy nhầm sang tiêm insulin dưới da thường quy ([R3-R2-DM2-03](#r3-r2-dm2-03)).
> 4. **Mất trắng hoàn toàn y lệnh Insulin nền ngoại trú khi `HbA1c < 10.0%`** (`ADV_01..ADV_04`): Ở đúng kịch bản bắt buộc `insulin_glargine 44 U` + `HbA1c = 8.9%`, insulin biến mất khỏi cả `recommendations` lẫn `noteText` ([R3-R2-DM2-04](#r3-r2-dm2-04)).
> 5. **Cụ già 84 tuổi suy yếu, suy kiệt (`BMI 18.4`, `HbA1c = 6.1%`) bị gán nhãn "Người cao tuổi khỏe mạnh" và kê mới đồng thời Semaglutide + Metformin + Dapagliflozin** do bỏ qua `conditions.frailty` & `conditions.limitedLifespan` ([R3-R2-DM2-05](#r3-r2-dm2-05)).
> 6. **Rò rỉ liên module `[dm2, hf, ckd]`**: Module HF kê `[START] Dapagliflozin` ngay trước phẫu thuật chương trình (`ADV_19`) và kê `[START] Bisoprolol + Dapagliflozin + Semaglutide` ngay giữa cơn hạ đường huyết cấp `2.4 mmol/L` (`ADV_21` — [R3-R2-DM2-06](#r3-r2-dm2-06)).
> 7. **Bỏ lọt biệt dược/bí danh (`lantus`, `glibenclamide`) trong hạ đường huyết `2.6 mmol/L` và bỏ lọt viên phối hợp FDC (`empagliflozin_metformin`, `sitagliptin_metformin`) khi `eGFR = 22` sắp mổ** (`ADV_44`, `ADV_57` — [R3-R2-DM2-07](#r3-r2-dm2-07)).
> 8. **Không phát hiện trùng lặp 2 Sulfonylurea (`Gliclazide + Glimepiride`) hoặc 2 Insulin nền (`Glargine + Degludec`)** (`ADV_45`, `ADV_46` — [R3-R2-DM2-08](#r3-r2-dm2-08)).
> 9. **Khoa Hồi sức tích cực (`ICU`) bị "mồ côi" hoàn toàn phác đồ Insulin tĩnh mạch** khi tăng đường huyết nặng không do DKA/HHS (`DP_01`, `ADV_32` — [R3-R2-DM2-09](#r3-r2-dm2-09)).

---

## 2. Đánh Giá Trực Tiếp 8 Kịch Bản Bắt Buộc Trong Yêu Cầu Kiểm Định Vòng 2

| # | Kịch bản bắt buộc | Mã test chạy thật | Kết quả `evaluate()` thực tế | Đánh giá |
|---|---|---|---|---|
| **1a** | **DKA + Hạ kali máu** (`K⁺ = 3.1 mmol/L`, `glucose = 22`, `pH = 7.15`, `BHB = 5.2`) | `R1_01`, `PRE_04`, `ADV_08` (thiếu `K⁺`) | Phát chính xác `[HOLD insulin_regular]`: *"CẤP CỨU DKA: TẠM HOÃN INSULIN — Bù Kali tĩnh mạch trước (K⁺ = 3.1 mmol/L < 3.5 mmol/L)"*. Khi thiếu `K⁺` (`ADV_08`) cũng chặn fail-closed không cho truyền insulin mù. | ✅ **PASS** |
| **1b** | **DKA + Tăng kali máu** (`K⁺ = 5.6 mmol/L`, và `K⁺ = 6.3 mmol/L`) | `R1_02`, `ADV_09` | Phát `[START insulin_regular] 7.5 U/h` với tiêu đề tách bạch rõ: *"CẤP CỨU DKA: Bù dịch + Truyền Insulin TM + Chưa bù Kali (K⁺ > 5.0)"* (sửa triệt để lỗi tiêu đề "Bù Kali" ở Vòng 1). | ✅ **PASS** |
| **1c** | **Euglycemic DKA đang dùng SGLT2i** (`glucose = 9.8 mmol/L`, `dapagliflozin`, `pH = 7.21`, `BHB = 4.5`) | `R1_04` (nội viện), `ADV_07` (kèm mổ), `ADV_14` (ngoại trú) | - Nội viện (`R1_04`): Nhận diện đúng euDKA (`[START insulin_regular] 7.0 U/h`), **nhưng** chỉ phát `[HOLD dapagliflozin]` tạm thời thay vì `[STOP]` vĩnh viễn ([R3-R2-DM2-11](#r3-r2-dm2-11)).<br>- Kèm mổ (`ADV_07`): Hướng dẫn sai *"Chỉ dùng lại khi bệnh nhân đã ăn uống ổn định"*!<br>- Ngoại trú (`ADV_14`): **Bỏ sót hoàn toàn euDKA**, phát `[CONTINUE empagliflozin]` + `[START metformin]`, không `REFER` ([R3-R2-DM2-02](#r3-r2-dm2-02))! | ❌ **PARTIAL FAIL** |
| **2** | **Hạ đường huyết cấp** (`glucose = 2.9 mmol/L`, đang dùng `glimepiride` + `insulin_glargine` + `acarbose`) | `R1_05`, `R1_06`, `ADV_06`, `ADV_44`, `ADV_21` | - Với mã thuốc gốc (`R1_05`, `R1_06`): **Đúng hoàn toàn** — phát cấp cứu Glucose nguyên chất/Dextrose TM (cấm đường mía sucrose do Acarbose) và `[HOLD]` cả `glimepiride` lẫn `insulin_glargine`.<br>- **Nhưng** khi nhập alias hợp lệ `lantus` + `glibenclamide` (`ADV_44`) → **0 lệnh HOLD** ([R3-R2-DM2-07](#r3-r2-dm2-07)); khi bật đa module `[dm2, hf, ckd]` (`ADV_21`) → kê `[START] Bisoprolol + Dapagliflozin + Semaglutide` giữa cơn hạ đường huyết `2.4 mmol/L` ([R3-R2-DM2-06](#r3-r2-dm2-06)). | ❌ **PARTIAL FAIL** |
| **3** | **Ngoại trú đang tiêm `insulin_glargine 44 U` tối, `HbA1c = 8.9%`** | `ADV_01` (`8.9%`), `ADV_02`, `ADV_03` (`6.8%`), `ADV_04` (`9.9%`), `R1_07` (`10.6%`) | Bản sửa Vòng 1 chỉ sửa nhánh `HbA1c ≥ 10.0%` (`R1_07` phát `[UPTITRATE]`). Tại **`HbA1c = 8.9%`** (`ADV_01`), `insulin_glargine 44 U` **biến mất hoàn toàn** khỏi đầu ra (không `UPTITRATE`, không `CONTINUE`, mất sạch khỏi `noteText`!). | ❌ **FAIL (CRITICAL)** ([R3-R2-DM2-04](#r3-r2-dm2-04)) |
| **4** | **Bệnh nhân Suy tim đang uống đồng thời `pioglitazone` + `saxagliptin` + `sitagliptin`, được chỉ định `semaglutide`** | `R1_14` (thuốc đơn), `ADV_57` (viên FDC) | - Với thuốc đơn (`R1_14`): **Đúng hoàn toàn** — phát đồng thời `[STOP pioglitazone]`, `[STOP saxagliptin]`, `[STOP sitagliptin]` mà không còn đè mất nhau trong `merge.ts`.<br>- **Nhưng** nếu dùng viên phối hợp `sitagliptin_metformin` (`ADV_57`) thì không bị `STOP` ([R3-R2-DM2-07](#r3-r2-dm2-07)). | ⚠️ **PASS thuốc đơn / FAIL FDC** |
| **5** | **Phụ nữ mang thai đang dùng `metformin` + `empagliflozin` + `semaglutide` + `gliclazide`** | `R1_10`, `ADV_12` (nội viện), `DP_07` (đang có sẵn Insulin), `DP_08` | **Đúng về mặt lâm sàng**: Phát đầy đủ `[STOP]` cho cả 4 thuốc (`metformin`, `empagliflozin`, `semaglutide`, `gliclazide`), chặn sạch nhánh tim-thận/statin/ACEi và khởi trị/duy trì phác đồ Insulin thai kỳ an toàn ở cả ngoại trú lẫn nội trú (chỉ còn lỗi nhỏ câu chữ thiếu dấu chấm ở `DP_07` — [R3-R2-DM2-19](#r3-r2-dm2-19)). | ✅ **PASS lâm sàng** |
| **6** | **Cụ già 84 tuổi suy yếu (frail), `HbA1c = 6.1%`, đang uống `glimepiride 4 mg`** | `R1_17` (chọn tay dropdown) vs `ADV_10` (tích checkbox UI `frailty` + `limitedLifespan`) | - Nếu chọn tay dropdown `elderlyHealthStatus = "very_complex"` (`R1_17`): đặt đích `< 8.0%` và giảm liều SU.<br>- **Nhưng** nếu bác sĩ tích đúng 2 ô chuẩn trên UI `conditions.frailty = true` & `conditions.limitedLifespan = true` (`ADV_10`, BMI `18.4`): hệ thống gán nhãn **"Người cao tuổi khỏe mạnh"**, kê mới **`[START] Semaglutide` + `[START] Metformin` + `[START] Dapagliflozin`** ở `HbA1c = 6.1%` và chỉ `[REDUCE]` thay vì `[STOP]` Glimepiride! | ❌ **FAIL (CRITICAL)** ([R3-R2-DM2-05](#r3-r2-dm2-05)) |

---

## 3. Kiểm Tra Hồi Quy 18 Bản Sửa Từ Vòng 1 (`R1_01` – `R1_18` & `PRE_01` – `PRE_04`)

| Mã kịch bản | Nội dung hồi quy từ Vòng 1 | Kết quả chạy thật Vòng 2 | Kết luận |
|---|---|---|---|
| `R1_01`, `PRE_04` | DKA + `K⁺ = 3.1 / 3.2 mmol/L` hoãn truyền insulin | `[HOLD insulin_regular]`, yêu cầu bù K⁺ tĩnh mạch đạt `≥ 3.5 mmol/L` trước | ✅ Đã sửa tốt |
| `R1_02` | DKA + `K⁺ = 5.6 mmol/L` không ghi "Bù Kali" trên tiêu đề | Tiêu đề in chuẩn `"Chưa bù Kali (K⁺ > 5.0)"`, tốc độ `7.5 U/h` | ✅ Đã sửa tốt |
| `R1_03` | HHS thuần túy (`Glu 38, Osm 338, pH 7.36, BHB 0.4`) không chạy trùng Basal-Bolus dưới da | Chỉ chạy `[START insulin_regular] 3.5 U/h` (`0.05 U/kg/h`), chặn sạch Basal-Bolus | ✅ Đã sửa tốt (nhưng xem `DP_03`, `ADV_16`) |
| `R1_04` | euDKA trên nền Dapagliflozin (`Glu 9.8, pH 7.21, BHB 4.5`) | Bắt được DKA, nhưng Dapagliflozin chỉ `HOLD` thay vì `STOP` | ⚠️ Chưa triệt để ([R3-R2-DM2-11](#r3-r2-dm2-11)) |
| `R1_05`, `R1_06` | Hạ ĐH cấp `2.9 / 2.1 mmol/L` trên nền SU + Insulin + Acarbose | Cấp cứu Glucose nguyên chất / Dextrose TM + `[HOLD]` SU & Insulin | ✅ Đã sửa tốt cho ID chuẩn |
| `R1_07`, `R1_08` | Đang tiêm Glargine `44 U`, `HbA1c = 10.6%` (kèm/không kèm hạ ĐH gần đây) | `R1_07` phát `[UPTITRATE]` `+2–4 U`; `R1_08` chặn tăng liều và cảnh báo hạ ĐH | ⚠️ Đúng ở `≥ 10%`, hỏng hoàn toàn ở `< 10%` ([R3-R2-DM2-04](#r3-r2-dm2-04)) |
| `R1_09` | Tiền sử MTC / MEN2 + Béo phì + ASCVD (`historyMtcOrMen2: true`) | `[AVOID semaglutide]`, không kê GLP-1 RA | ✅ Đã sửa tốt |
| `R1_10` | Thai kỳ đang dùng `metformin + empagliflozin + semaglutide + gliclazide` | `[STOP]` cả 4 thuốc + `[START insulin_glargine]` thai kỳ | ✅ Đã sửa tốt |
| `R1_11` | Đang dùng Sitagliptin được khởi trị Semaglutide | `[START semaglutide]` + `[STOP sitagliptin]` tự động | ✅ Đã sửa tốt cho thuốc đơn |
| `R1_12` | Đang có loét bàn chân ĐTĐ / nguy cơ đoạn chi (`R3-DM2-11`) | Chưa có trường trong `inputs.ts`, vẫn `[START dapagliflozin]` không cảnh báo | ❌ Chưa sửa ([R3-R2-DM2-15](#r3-r2-dm2-15)) |
| `R1_13` | Overbasalization thiếu cân nặng (`weight: undefined`) | Không crash `NaN`/`Infinity`, phát thiếu dữ liệu cân nặng an toàn | ✅ Đã sửa tốt |
| `R1_14` | Suy tim đang dùng `pioglitazone + saxagliptin + sitagliptin` | Phát đồng thời cả 3 lệnh `[STOP]`, không bị `merge.ts` nuốt mất | ✅ Đã sửa tốt |
| `R1_15` | Nội viện `eGFR = 28` + chụp cản quang đường động mạch đang uống Metformin | `[STOP metformin]` do chống chỉ định thận + cản quang | ✅ Đã sửa tốt |
| `R1_16` | Ngoại trú `eGFR = 22` đang uống Metformin vs chưa uống Metformin | Đang uống → `[STOP metformin]`; chưa uống (`ADV_36`) → `[AVOID]` | ✅ Đã sửa tốt cho thuốc đơn |
| `R1_17` | Cụ 84 tuổi chọn tay `elderlyHealthStatus = "very_complex"`, `HbA1c = 6.1%` | Đích `< 8.0%`, phát giảm cường độ điều trị | ⚠️ Hỏng khi dùng `conditions.frailty` ([R3-R2-DM2-05](#r3-r2-dm2-05)) |
| `R1_18` | Chuyển đổi đơn vị US (`glucose = 250 mg/dL`, `scr = 1.8 mg/dL`) | Quy đổi chuẩn sang `mmol/L` & `µmol/L` cho các trường cơ bản | ✅ Đúng (trừ `bedtimeToMorningDiff` — [R3-R2-DM2-17](#r3-r2-dm2-17)) |
| `PRE_01..PRE_03` | 3 Preset tích hợp sẵn trong `presets.ts` | Hoạt động ổn định, không phát sinh mâu thuẫn nội bộ | ✅ Đạt |

---

## 4. Ma Trận 74 Kịch Bản Đối Nghịch Mới Thiết Kế Riêng Cho Vòng 2 (`ADV_01..ADV_58`, `DP_01..DP_16`)

| Nhóm kiểm thử đối nghịch | Các mã kịch bản đã chạy trên `evaluate()` | Phát hiện chính |
|---|---|---|
| **1. Khoảng trống Insulin nền ngoại trú (`HbA1c < 10%`) & Overbasalization** | `ADV_01`, `ADV_02`, `ADV_03`, `ADV_04`, `ADV_05`, `DP_10`, `DP_11` | **CRITICAL** [R3-R2-DM2-04](#r3-r2-dm2-04): Mất sạch y lệnh insulin khi `HbA1c = 6.8%–9.9%`. **MINOR** [R3-R2-DM2-17](#r3-r2-dm2-17): Tiêu đề sai `"0.27 U/kg/ngày (> 0.5 U/kg/ngày)"` khi kích hoạt bởi `BeAM`. |
| **2. Cấp cứu DKA / euDKA / HHS (Nội viện vs Ngoại trú & Ranh giới sinh hóa)** | `ADV_07`, `ADV_08`, `ADV_09`, `ADV_13`, `ADV_14`, `ADV_15`, `ADV_16`, `ADV_17`, `ADV_18`, `ADV_50`, `DP_03` | **CRITICAL** [R3-R2-DM2-02](#r3-r2-dm2-02): DKA/euDKA/HHS ngoại trú bị kê SGLT2i + Metformin, không `REFER`. **CRITICAL** [R3-R2-DM2-03](#r3-r2-dm2-03): Bỏ sót HHS toan lactic (`DP_03`), HHS không nhập tay ALTT (`ADV_16`), DKA thiếu máy BHB (`ADV_17`). **MAJOR** [R3-R2-DM2-11](#r3-r2-dm2-11): euDKA chỉ `HOLD` SGLT2i thay vì `STOP`. |
| **3. Nội viện Khoa Thường, ICU, Nhịn ăn (NPO), Sonde dạ dày & Bình đường huyết** | `ADV_31`, `ADV_32`, `ADV_33`, `ADV_34`, `DP_01`, `DP_02`, `DP_04`, `DP_05`, `DP_06` | **CRITICAL** [R3-R2-DM2-01](#r3-r2-dm2-01): Bình ĐH (`glucose = 4.5`) bị kê `32 U` insulin/ngày (`DP_02`). **CRITICAL** [R3-R2-DM2-09](#r3-r2-dm2-09): ICU tăng ĐH `16.8 mmol/L` bị bỏ rơi `0` y lệnh insulin (`DP_01`, `ADV_32`). **MINOR** [R3-R2-DM2-18](#r3-r2-dm2-18): Sonde liên tục kê tiêm "trước 3 bữa ăn" (`DP_05`); NPO không `HOLD` TZD/Acarbose/DPP4i (`DP_04`). |
| **4. Người cao tuổi, Suy yếu (`frailty`), Kỳ vọng sống ngắn & Hạ đường huyết cấp** | `ADV_06`, `ADV_10`, `ADV_26`, `ADV_27` | **CRITICAL** [R3-R2-DM2-05](#r3-r2-dm2-05): Cụ 84 tuổi suy yếu BMI `18.4`, `HbA1c = 6.1%` bị gán "khỏe mạnh" và kê mới Semaglutide + Metformin + Dapagliflozin (`ADV_10`). |
| **5. Xung đột Liên Module (`[dm2, hf, ckd, htn, af, dyslip]`)** | `ADV_19`, `ADV_20`, `ADV_21`, `ADV_22`, `DP_15`, `DP_16` | **CRITICAL** [R3-R2-DM2-06](#r3-r2-dm2-06): Module HF kê `[START] Dapagliflozin` trước mổ (`ADV_19`) và kê Bisoprolol + SGLT2i + GLP-1 RA giữa cơn hạ ĐH `2.4 mmol/L` (`ADV_21`). **MAJOR** [R3-R2-DM2-16](#r3-r2-dm2-16): Kê thêm Aspirin trên nền Apixaban (`DP_16`). |
| **6. Bí danh biệt dược (Aliases), Viên phối hợp FDC & Trùng lặp nhóm thuốc** | `ADV_11`, `ADV_44`, `ADV_45`, `ADV_46`, `ADV_47`, `ADV_57` | **CRITICAL** [R3-R2-DM2-07](#r3-r2-dm2-07): Không `HOLD` `lantus`/`glibenclamide` khi `glucose = 2.6` (`ADV_44`); không `STOP` `empagliflozin_metformin`/`sitagliptin_metformin` ở `eGFR = 22` sắp mổ (`ADV_57`). **CRITICAL** [R3-R2-DM2-08](#r3-r2-dm2-08): Bỏ lọt 2 SU (`ADV_45`) & 2 Basal Insulin (`ADV_46`). |
| **7. Ranh giới Thận (`eGFR` / Lọc máu), Gan (`liverDisease` / `ALT`), Tuyến tụy, Liệt dạ dày** | `ADV_24`, `ADV_25`, `ADV_35`..`ADV_43`, `ADV_48`, `ADV_49`, `ADV_58` | Lọc máu (`ADV_40`, `ADV_41`), viêm tụy/liệt dạ dày (`ADV_24`, `ADV_25`) hoạt động tốt. Phát hiện **MAJOR** [R3-R2-DM2-13](#r3-r2-dm2-13) (quá liều gấp 4× `sitagliptin 100 mg` ở `eGFR = 22`, `ADV_58`) và **MAJOR** [R3-R2-DM2-14](#r3-r2-dm2-14) (xơ gan/ALT `4.2×` vẫn `CONTINUE` Metformin & bỏ qua Pioglitazone/SU, `ADV_48`). |
| **8. Corticoid, Bàn chân ĐTĐ, Khoảng trống Phác đồ Bậc 2 & Chuyển đổi Profile (`INTL/VN/US`)** | `ADV_12`, `ADV_23`, `ADV_28`, `ADV_29`, `ADV_30`, `ADV_51`..`ADV_56`, `DP_07`..`DP_09`, `DP_12`..`DP_14` | **MAJOR** [R3-R2-DM2-10](#r3-r2-dm2-10) (trống phác đồ bậc 2 ở `HbA1c 8.4–8.6%`, `DP_12`, `DP_13`), **MAJOR** [R3-R2-DM2-12](#r3-r2-dm2-12) (3 lỗi phác đồ NPH corticoid, `ADV_28..30`), **MAJOR** [R3-R2-DM2-15](#r3-r2-dm2-15) (loét bàn chân ĐTĐ, `ADV_23`). |

---

## 5. Chi Tiết 20 Phát Hiện Kiểm Định An Toàn Lâm Sàng Vòng 2

### PHẦN A — 9 PHÁT HIỆN MỨC ĐỘ CRITICAL (`R3-R2-DM2-01` → `R3-R2-DM2-09`)

#### 🔴 `R3-R2-DM2-01` [CRITICAL | `rule` | `dm2.inpatient.basal_bolus_regimen`] — Bệnh nhân nội viện bình đường huyết (`glucose = 4.5 mmol/L`, `HbA1c = 5.9%`) chưa từng dùng insulin vẫn bị chỉ định KHỞI TRỊ Basal-Bolus `32 U/ngày` {#r3-r2-dm2-01}
- **Bằng chứng thực thi (`DP_02`)**:
  - **Input**: Nam 58 tuổi, nhập khoa Nội thường (`setting: "inpatient"`, `inpatientUnit: "ward"`, `inpatientEating: "normal"`), `weight: 70 kg`, **`glucose: 4.5 mmol/L` (81 mg/dL)**, **`hba1c: 5.9%`**, tiền sử ĐTĐ2 kiểm soát bằng chế độ ăn (`currentMeds: []`).
  - **Output `evaluate()` thực tế**:
    - `[START] insulin_glargine` (`rec_dm2_inpatient_basal_bolus`): *"Phác đồ Insulin nền (Basal) nội viện: Insulin Glargine — Tổng liều TDD ước tính: 32 đơn vị/ngày; Liều nền (Basal): 16 đơn vị tiêm dưới da 1 lần/ngày"*
    - `[START] insulin_aspart` (`rec_dm2_inpatient_prandial_bolus`): *"Phác đồ Insulin bữa ăn (Bolus) nội viện: Insulin Aspart — Tổng liều bữa ăn ~16 đơn vị/ngày, chia 5 đơn vị tiêm dưới da ngay trước 3 bữa ăn chính"*
- **Nguyên nhân mã nguồn**: Trong [rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L264-L274) và [rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L356-L363), hàm `when(ctx)` chỉ chặn khi `glucose < 3.9 mmol/L` (`!isActivelyHypoglycemicCtx(ctx)`), **hoàn toàn thiếu điều kiện ngưỡng khởi trị insulin nội viện `glucose >= 10.0 mmol/L` (180 mg/dL)** hoặc kiểm tra bệnh nhân vốn đang dùng insulin ngoại trú.
- **Nguy cơ lâm sàng**: Tiêm `32 đơn vị/ngày` insulin ngoại sinh cho bệnh nhân chưa từng dùng insulin đang có đường huyết `4.5 mmol/L` chắc chắn gây hạ đường huyết nặng nội viện, co giật, tổn thương não không hồi phục hoặc tử vong (trái ngược hoàn toàn ADA 2026 Ch. 16 Rec 16.4 Class I/A: chỉ khởi trị insulin nội viện khi tăng đường huyết dai dẳng `≥ 180 mg/dL [10.0 mmol/L]`).
- **Hướng khắc phục**: Trong `when(ctx)` của `basal_bolus_regimen` và `prandial_bolus_regimen`, chỉ cho phép `START` mới khi `glucose >= thFor("glucose", "dm2.glucose.inpatient_target_max_mmol")` (`10.0 mmol/L`) hoặc khi bệnh nhân đã đang dùng insulin ngoại trú (chuyển đổi phác đồ nội trú) / vừa tạm ngừng thuốc uống và đường huyết vượt đích. Khi `3.9 ≤ glucose < 10.0 mmol/L` ở BN chưa dùng insulin: phát `[MONITOR]` theo dõi đường huyết mao mạch trước bữa ăn & trước ngủ.

---

#### 🔴 `R3-R2-DM2-02` [CRITICAL | `rule` | `dm2.outpatient.cardiorenal_sglt2i`] — Cấp cứu DKA, Euglycemic DKA, HHS và tăng ceton máu tại phòng khám ngoại trú KHÔNG được chuyển cấp cứu (`REFER`) mà còn bị kê `[START]` / `[CONTINUE]` SGLT2i và Metformin {#r3-r2-dm2-02}
- **Bằng chứng thực thi (`ADV_13`, `ADV_14`, `ADV_15`, `ADV_50`)**:
  1. **`ADV_13` (DKA cấp tại phòng khám ngoại trú)**: `setting: "outpatient"`, `glucose: 24.0 mmol/L`, `bloodKetones: 4.6 mmol/L`, `venousPh: 7.16`, `serumBicarb: 10 mmol/L`, `conditions: { dm: true, hf: true }`.  
     → **Output `evaluate()`**: Phát **`[START] dapagliflozin 10 mg`** + **`[START] metformin 500–2000 mg`** + `[START] insulin_glargine 10 U` tiêm tối; **`0` khuyến cáo `REFER` cấp cứu**!
  2. **`ADV_14` (Euglycemic DKA ngoại trú đang uống `empagliflozin 10 mg`)**: `setting: "outpatient"`, `glucose: 10.2 mmol/L`, `bloodKetones: 4.2 mmol/L`, `venousPh: 7.22`, `serumBicarb: 13 mmol/L`.  
     → **Output `evaluate()`**: Phát **`[CONTINUE] empagliflozin 10 mg`** + **`[START] metformin`**, không `STOP` SGLT2i, không `REFER`!
  3. **`ADV_15` (HHS ngoại trú: `glucose = 36.0 mmol/L`, `effectiveOsmolality = 332 mOsm/kg`)**: Phát **`[START] dapagliflozin`** + **`[START] metformin`**, không `REFER`!
  4. **`ADV_50` (Dị hóa sụt cân cấp + tăng ceton máu: `BMI 18.2`, `catabolicSymptoms: true`, `bloodKetones: 2.2 mmol/L`, `glucose: 19.5 mmol/L`)**: Phát **`[START] dapagliflozin 10 mg`** ngay trên nền ketonemia cấp.
- **Nguyên nhân mã nguồn**: `dm2.inpatient.dka_hhs_emergency` trong [rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L172) chỉ chạy khi `setting: "inpatient"`, trong khi toàn bộ [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L687-L821) và [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L1071-L1104) không hề kiểm tra `bloodKetones`, `venousPh`, `serumBicarb` hay `effectiveOsmolality`.
- **Nguy cơ lâm sàng**: Kê SGLT2i và Metformin cho bệnh nhân đang DKA/euDKA/HHS ngoại trú làm trầm trọng kịch phát nhiễm toan ceton + toan acid lactic + sốc giảm thể tích, đồng thời trì hoãn cấp cứu hồi sức gây tử vong.
- **Hướng khắc phục**: Thêm luật ưu tiên tối cao `dm2.outpatient.hyperglycemic_crisis_refer` (`action: "REFER"`, `priority: 100`) khi phát hiện dấu hiệu DKA/euDKA/HHS hoặc `bloodKetones >= 1.5 mmol/L` / `venousPh < 7.30` / `serumBicarb < 18` / `glucose >= 33.3 mmol/L`, đồng thời phát `[STOP]` SGLT2i, `[HOLD]` Metformin/SU và khóa toàn bộ các luật khởi trị thuốc uống/tiêm mạn tính.

---

#### 🔴 `R3-R2-DM2-03` [CRITICAL | `rule` | `dm2.inpatient.dka_hhs_emergency`] — Hàm `evaluateHyperglycemicCrisis` bỏ sót 3 thể cấp cứu tăng đường huyết đe dọa tính mạng nội viện (`DP_03`, `ADV_16`, `ADV_17`) {#r3-r2-dm2-03}
- **Bằng chứng thực thi**:
  1. **Thể HHS kèm toan chuyển hóa / toan lactic (`DP_03`)**: `glucose: 40.0 mmol/L`, `effectiveOsmolality: 340 mOsm/kg`, `venousPh: 7.24`, `serumBicarb: 14 mmol/L`, `bloodKetones: 1.2 mmol/L` (`< 3.0`).  
     → Do `ketones 1.2 < 3.0` nên `isDka = false`; do `venousPh 7.24 < 7.30` nên dòng `const noAcidosis = ph >= dkaPh` tại [rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L68-L75) đánh `isHhs = false` → **`isCrisis = false`!** Bệnh nhân đường huyết `40 mmol/L`, ALTT `340 mOsm/kg`, `pH 7.24` chỉ được kê tiêm dưới da `Glargine 10 U + Aspart 3 U × 3 bữa`!
  2. **HHS điển hình có `Na⁺` và `Glucose` cao nhưng bác sĩ để trống ô `effectiveOsmolality` (`ADV_16`)**: `glucose: 38.0 mmol/L`, `na: 148 mmol/L` → ALTT hiệu dụng tính toán `2 × 148 + 38 = 334 mOsm/kg` (`> 300 mOsm/kg` theo đúng công thức tại [dm2.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/dm2.json#L277)). Do [rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L44) chỉ đọc `customInputs.effectiveOsmolality` mà không tự tính `2 * na + glucose` nên **`isHhs = false`**!
  3. **Bệnh viện tuyến không có xét nghiệm Beta-hydroxybutyrate máu (`ADV_17`)**: `glucose: 28.0 mmol/L`, `venousPh: 7.12`, `serumBicarb: 8 mmol/L`, `bloodKetones: undefined`. Hệ thống đánh `isDka = false` và kê tiêm dưới da thường quy mà không có bất kỳ cảnh báo cấp cứu nghi ngờ DKA nào!
- **Hướng khắc phục**:
  1. Tự động suy diễn `effectiveOsmolality = customOsm ?? (na !== undefined && glucose !== undefined ? 2 * na + glucose : undefined)`.
  2. Khi `glucose >= 33.3 mmol/L` và `effOsm > 300 mOsm/kg`: luôn xác định là cấp cứu tăng đường huyết (`isCrisis = true`); nếu có kèm toan (`pH < 7.30` hoặc `HCO3 < 18`) thì phân loại **Thể hỗn hợp DKA-HHS / HHS kèm toan** và dùng tốc độ truyền insulin TM `0.1 U/kg/h` theo Đồng thuận 2024.
  3. Khi `glucose >= 13.9 mmol/L` kèm toan chuyển hóa rõ (`pH < 7.30` hoặc `HCO3 < 18`) nhưng thiếu `bloodKetones`: kích hoạt cảnh báo cấp cứu nghi ngờ DKA (fail-closed) và yêu cầu làm ngay ceton máu/niệu + khí máu.

---

#### 🔴 `R3-R2-DM2-04` [CRITICAL | `rule` | `dm2.outpatient.early_insulin`] — Mất trắng hoàn toàn y lệnh Insulin nền ngoại trú ở mọi bệnh nhân có `HbA1c < 10.0%` (bao gồm kịch bản bắt buộc `HbA1c = 8.9%` trên nền `Glargine 44 U`) {#r3-r2-dm2-04}
- **Bằng chứng thực thi (`ADV_01`, `ADV_02`, `ADV_03`, `ADV_04`)**:
  - **`ADV_01` (Kịch bản bắt buộc #3)**: Nam 61 tuổi, `weight: 90 kg`, `glucose: 9.6 mmol/L`, **`hba1c: 8.9%`**, `currentMeds: [{ drugId: "metformin", dose: "2000 mg" }, { drugId: "insulin_glargine", dose: "44 U" }]`.
  - **Output `evaluate()` thực tế**: Chỉ sinh ra 5 khuyến cáo (`MONITOR HbA1c < 7.0%`, `CONTINUE metformin`, `UPTITRATE huyết áp`, `MONITOR Statin`, `MONITOR tầm soát biến chứng`). **`insulin_glargine` biến mất hoàn toàn** — không có `UPTITRATE`, không có `CONTINUE`, và trong bản ghi chú lâm sàng `plan.noteText` cũng mất dấu hoàn toàn mũi tiêm 44 đơn vị của bệnh nhân!
  - Tương tự ở `ADV_04` (`HbA1c = 9.9%`, `glucose = 16.5 mmol/L`, `Glargine 16 U`) và `ADV_03` (`HbA1c = 6.8%` đã đạt đích, `Glargine 28 U`): đều mất sạch y lệnh insulin!
- **Nguyên nhân mã nguồn**: Tại [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L1153-L1164), bản sửa Vòng 1 đặt nhánh `UPTITRATE` bên trong `dm2.outpatient.early_insulin` vốn bị khóa bởi điều kiện `hba1c >= 10.0 || glucose >= 16.7`, trong khi `reviewCurrentMedications` không tự động sinh `CONTINUE` cho insulin của module DM2.
- **Nguy cơ lâm sàng**: Bác sĩ sao chép `noteText` hoặc đơn gợi ý làm bệnh nhân đang phụ thuộc `44 U` insulin nền ngừng tiêm đột ngột (nguy cơ DKA/tăng ĐH cấp), hoặc bị bỏ mặc trì trệ điều trị ở `HbA1c = 8.9%–9.9%`.
- **Hướng khắc phục**: Tách luật độc lập `dm2.outpatient.basal_insulin_titration_and_maintenance` cho mọi bệnh nhân ngoại trú đang dùng insulin nền (`hasAnyInsulin && !isPregnant && !isActivelyHypo && !coveredByEarlyInsulin && !coveredByDeintensification`): phát `[UPTITRATE]` (`+2` đến `+4 U` mỗi 3 ngày theo FPG nếu chưa đạt đích HbA1c và chưa overbasalization/hạ ĐH) hoặc `[CONTINUE]` duy trì liều hiện tại khi đã đạt đích an toàn.

---

#### 🔴 `R3-R2-DM2-05` [CRITICAL | `rule` | `dm2.outpatient.hba1c_target`] — Bỏ qua `conditions.frailty` & `conditions.limitedLifespan`, gán cụ già 84 tuổi suy kiệt (`BMI 18.4`, `HbA1c = 6.1%`) là "Người cao tuổi khỏe mạnh" và kê mới 3 thuốc (`Semaglutide + Metformin + Dapagliflozin`) {#r3-r2-dm2-05}
- **Bằng chứng thực thi (`ADV_10` — Kịch bản bắt buộc #6 với checkbox UI chuẩn)**:
  - **Input**: Nữ 84 tuổi, `weight: 46 kg`, `height: 158 cm` (**`BMI = 18.4 kg/m²`** — thiếu cân/suy dinh dưỡng), `scr: 105 µmol/L` (`eGFR ~ 45`), **`hba1c: 6.1%`**, `conditions: { dm: true, ckd: true, frailty: true, limitedLifespan: true }`, `customInputs: { elderlyHealthStatus: "not_elderly" }` *(giá trị mặc định ban đầu tại [inputs.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/inputs.ts#L37))*, `currentMeds: [{ drugId: "glimepiride", dose: "4 mg" }]`.
  - **Output `evaluate()` thực tế**:
    1. `[MONITOR]` Mục tiêu HbA1c `< 7.0 – 7.5%` với lý giải: ***"Người cao tuổi khỏe mạnh, ít bệnh đồng mắc, kỳ vọng sống còn dài"*** ([rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L625-L660))!
    2. **`[START] semaglutide 0.25 mg/tuần`** (gây chán ăn, sụt cân và teo cơ sarcopenia nặng cho cụ bà 84 tuổi `46 kg`, `BMI 18.4`!).
    3. **`[START] metformin 500–2000 mg/ngày`** (khởi mới thuốc hạ đường huyết dù `HbA1c` đã `6.1%` — [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L1071-L1104) không hề kiểm tra ngưỡng dưới HbA1c!).
    4. **`[START] dapagliflozin 10 mg`**.
    5. Chỉ `[REDUCE]` `glimepiride` xuống nửa liều thay vì `[STOP]` hẳn Sulfonylurea ở cụ 84 tuổi suy yếu có `HbA1c = 6.1%`.
- **Hướng khắc phục**:
  1. Đồng bộ tự động trong helper phân tầng cao tuổi: nếu `hasCondition(ctx, "limitedLifespan")` → ánh xạ tối thiểu `"very_complex"`; nếu `hasCondition(ctx, "frailty")` → ánh xạ tối thiểu `"complex"` (hoặc `"very_complex"` khi `≥ 80 tuổi` / `BMI < 18.5`).
  2. Chặn `START` mới Metformin khi bệnh nhân chưa dùng mà `HbA1c < 6.5%` (đặc biệt ở người cao tuổi/suy yếu).
  3. Chuyển Semaglutide sang `CONSIDER`/`DEFER` kèm cảnh báo suy mòn cơ khi người cao tuổi suy yếu có `BMI < 18.5–20 kg/m²`.
  4. Phát `[STOP]` hẳn Sulfonylurea (thay vì `REDUCE`) khi người cao tuổi suy yếu/kỳ vọng sống hạn chế có `HbA1c < 6.5%`.

---

#### 🔴 `R3-R2-DM2-06` [CRITICAL | `rule` | `src/engine/safety/gates.ts`] — Rò rỉ an toàn liên module (`[dm2, hf, ckd]`): Module HF kê `[START] Dapagliflozin` ngay trước phẫu thuật và kê `Bisoprolol + Dapagliflozin + Semaglutide` ngay giữa cơn hạ đường huyết cấp `2.4 mmol/L` {#r3-r2-dm2-06}
- **Bằng chứng thực thi (`ADV_19`, `ADV_21`)**:
  1. **`ADV_19` (Chu phẫu đa module)**: `selectedModules: ["dm2", "hf", "ckd"]`, `lvef: 35%`, `customInputs: { plannedSurgery: true }` (mổ lớn sau 2 ngày). Module `dm2` tự chặn SGLT2i đúng luật, nhưng module `hf` phát **`[hf:START dapagliflozin] 10 mg`** xuyên thủng [gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts) ra thẳng y lệnh cuối cùng (vi phạm nhãn FDA & ADA 2026 Ch. 16: bắt buộc ngừng SGLT2i `3–4 ngày` trước mổ để ngừa euDKA chu phẫu).
  2. **`ADV_21` (Hạ đường huyết nặng đa module: `glucose = 2.4 mmol/L`)**: `selectedModules: ["dm2", "hf", "ckd", "htn"]`. Trong khi `dm2` phát lệnh cấp cứu tiêm Glucose tĩnh mạch ngay lập tức, y lệnh tổng hợp đồng thời phát **`[hf:START dapagliflozin]`**, **`[ckd:START semaglutide]`**, và nguy hiểm nhất là **`[hf:START bisoprolol]`** (chẹn beta che lấp nhịp nhanh/run tay báo động hạ đường huyết và ức chế phân giải glycogen gan ngay trong cơn hạ đường huyết mức độ 2–3!).
- **Hướng khắc phục**: Bổ sung 2 cổng chặn toàn cục trong `evaluateSafetyGates` ([gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts)): (1) Khi `plannedSurgery === true` → chuyển mọi `START/UPTITRATE/CONTINUE/CONSIDER` của nhóm SGLT2i ở tất cả các module sang `HOLD`/`DEFER`; (2) Khi `glucose < 3.9 mmol/L` → hoãn (`HOLD`/`DEFER`) toàn bộ các lệnh khởi trị mới thuốc hạ đường huyết và chẹn beta từ mọi module cho đến khi đường huyết thoát cơn cấp.

---

#### 🔴 `R3-R2-DM2-07` [CRITICAL | `rule` | `dm2.outpatient.acute_hypo_hold`] — Không nhận diện bí danh hợp lệ (`lantus`, `glargine`, `glibenclamide`) trong cơn hạ đường huyết `2.6 mmol/L` và bỏ lọt viên phối hợp FDC (`empagliflozin_metformin`, `sitagliptin_metformin`) khi `eGFR = 22` sắp mổ {#r3-r2-dm2-07}
- **Bằng chứng thực thi (`ADV_44`, `ADV_57`)**:
  1. **`ADV_44` (`glucose = 2.6 mmol/L`, đang dùng `lantus 30 U` + `glibenclamide 5 mg`)**: Dù `CANONICAL_BASAL_ALIAS` tại [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L76-L90) và [merge.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/merge.ts#L156) chính thức khai báo hỗ trợ `"lantus"`, `"glargine"`, `"toujeo"`, `"tresiba"`, `"levemir"`, `"insulatard"`, mảng `HYPO_CAUSING_DRUGS` tại [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L331-L350) chỉ so khớp chuỗi cứng `m.drugId.toLowerCase() === drugId`, khiến Output phát **`0` lệnh `HOLD`** cho cả `lantus` lẫn `glibenclamide` ngay giữa cơn hạ đường huyết `2.6 mmol/L`!
  2. **`ADV_57` (`eGFR = 22 mL/phút`, `plannedSurgery: true`, đang uống `empagliflozin_metformin` + `sitagliptin_metformin`)**: Output phát `[AVOID metformin]` (như thể bệnh nhân chưa dùng Metformin!), **không phát `STOP` cho 2 viên chứa Metformin ở `eGFR = 22`** (nguy cơ toan lactic tử vong), **không `HOLD` empagliflozin trước mổ**, và kê `[START semaglutide]` trùng lặp ngay trên nền `sitagliptin_metformin` (`alerts = []`)!
- **Hướng khắc phục**: Xây dựng bộ chuẩn hóa `expandDm2MedicationComponents(drugId)` ánh xạ toàn bộ alias insulin/SU (`lantus -> insulin_glargine`, `glibenclamide/glyburide`, `glipizide`, `repaglinide`...) và tách thành phần hoạt chất của mọi viên FDC ĐTĐ (`*_metformin`, `dapagliflozin_*`, `empagliflozin_*`, `sitagliptin_*`, `linagliptin_*`, `vildagliptin_*`) áp dụng đồng bộ cho tất cả các luật `STOP`/`HOLD` của DM2 và `gates.ts` / `duplicates.ts`.

---

#### 🔴 `R3-R2-DM2-08` [CRITICAL | `rule` | `src/engine/safety/duplicates.ts`] — Không phát hiện trùng lặp 2 thuốc Sulfonylurea (`Gliclazide + Glimepiride`) hoặc 2 loại Insulin nền (`Insulin Glargine + Insulin Degludec`) {#r3-r2-dm2-08}
- **Bằng chứng thực thi (`ADV_45`, `ADV_46`)**:
  - **`ADV_45`**: `currentMeds: [metformin 2000 mg, gliclazide 60 mg, glimepiride 4 mg]` → `alerts = []`, `0` khuyến cáo `STOP`/cảnh báo trùng nhóm Sulfonylurea!
  - **`ADV_46`**: `currentMeds: [insulin_glargine 26 U, insulin_degludec 24 U]` → `alerts = []`, `0` cảnh báo tiêm trùng 2 insulin nền tác dụng kéo dài!
- **Nguyên nhân mã nguồn**: `DUPLICATE_CLASS_RULES` trong [duplicates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/duplicates.ts#L100-L244) mới chỉ kiểm tra `dup.sglt2i` và `dup.dpp4_glp1`, hoàn toàn thiếu quy tắc kiểm tra trùng nhóm Sulfonylurea (`su` / `sulfonylurea`), trùng nhóm Insulin nền (`insulin_basal`) và trùng nhóm Insulin nhanh (`insulin_bolus`).
- **Hướng khắc phục**: Bổ sung `dup.sulfonylurea` (`severity: "critical"`), `dup.insulin_basal` (`severity: "critical"`, trừ ngoại lệ phối hợp NPH buổi sáng có chủ đích khi dùng steroid nếu có cờ riêng) và `dup.insulin_bolus` (`severity: "critical"`) vào [duplicates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/duplicates.ts) kèm đề xuất dừng bớt 1 thuốc trong `reviewCurrentMedications`.

---

#### 🔴 `R3-R2-DM2-09` [CRITICAL | `missing` | `dm2.inpatient.icu_iv_insulin`] — Bệnh nhân nặng nằm khoa Hồi sức tích cực (`inpatientUnit = "icu"`) tăng đường huyết nặng không do DKA/HHS bị bỏ rơi hoàn toàn (`0` y lệnh insulin) {#r3-r2-dm2-09}
- **Bằng chứng thực thi (`DP_01`, `ADV_32`)**:
  - **`DP_01`**: `setting: "inpatient"`, `inpatientUnit: "icu"`, `glucose: 16.8 mmol/L` (302 mg/dL), `k: 4.2 mmol/L`, `bloodKetones: 0.4 mmol/L`, `venousPh: 7.38`.  
    → **Output `evaluate()`**: Chỉ có **duy nhất 1 dòng `[MONITOR]`** *"Mục tiêu glucose máu nội viện: 7.8 – 10.0 mmol/L (140–180 mg/dL)"*, **không có bất kỳ y lệnh truyền tĩnh mạch insulin nào**!
  - **`ADV_32`**: `inpatientUnit: "icu"`, `glucose: 12.8 mmol/L`, `k: 2.9 mmol/L` (hạ kali máu nặng) → Cũng chỉ có 1 dòng `MONITOR`, không cảnh báo hoãn insulin bù K⁺!
- **Nguyên nhân mã nguồn**: Sau Vòng 1, `basal_bolus_regimen` ([rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L270)) và `prandial_bolus_regimen` ([rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L361)) đã thêm `!isIcuSetting(ctx)` để tránh tiêm dưới da ở BN sốc/ICU, nhưng tác giả quên bổ sung luật đối ứng `dm2.inpatient.icu_iv_insulin` cho bệnh nhân ICU không phải DKA/HHS!
- **Hướng khắc phục**: Bổ sung luật `dm2.inpatient.icu_iv_insulin` (ADA 2026 Ch. 16 Rec 16.4–16.5, Class I / LOE A & QĐ 1353/QĐ-BYT): khi `isIcuSetting(ctx) && !isHyperglycemicCrisis(ctx) && glucose >= 10.0 mmol/L`, kiểm tra fail-closed `K⁺` máu (`< 3.5 mmol/L` hoặc thiếu `K⁺` → `[HOLD insulin_regular]` bù K⁺ trước; `K⁺ >= 3.5 mmol/L` → `[START insulin_regular]` truyền tĩnh mạch liên tục bằng bơm tiêm điện chỉnh theo phác đồ ICU mỗi 1–2 giờ đạt đích `7.8–10.0 mmol/L`).

---

### PHẦN B — 7 PHÁT HIỆN MỨC ĐỘ MAJOR (`R3-R2-DM2-10` → `R3-R2-DM2-16`)

#### 🟠 `R3-R2-DM2-10` [MAJOR | `missing` | `dm2.outpatient.step2_escalation`] — Thiếu hoàn toàn luật phối hợp thuốc bậc 2 (Step-2 intensification) cho `7.0% ≤ HbA1c < 10.0%` không kèm ASCVD/HF/CKD/Béo phì (hoặc khi bị chặn GLP-1 RA / SGLT2i) {#r3-r2-dm2-10}
- **Bằng chứng thực thi (`DP_12`, `DP_13`)**:
  - **`DP_12`**: Nam 58 tuổi, `BMI 22.9 kg/m²`, `eGFR 92 mL/phút`, `glucose 8.5 mmol/L`, **`hba1c: 8.4%`**, đang uống tối đa `metformin 2000 mg/ngày`, không có ASCVD/HF/CKD.  
    → **Output `evaluate()`**: Chỉ phát `[CONTINUE] Metformin`, **không đề xuất phối hợp thêm bất kỳ thuốc hạ đường huyết bậc 2 nào** (SGLT2i, GLP-1 RA, DPP-4i, Gliclazide MR hay Pioglitazone), vi phạm khuyến cáo Class I / Mức A của ADA 2026 Ch. 9 Rec 9.4–9.11 (tránh trì trệ lâm sàng — *therapeutic inertia*) và Phác đồ bậc 2 của Bộ Y tế (QĐ 5481/QĐ-BYT).
  - **`DP_13`**: Nữ 64 tuổi, CKD G4 (`eGFR = 26 mL/phút`), **`hba1c: 8.6%`**, tiền sử MTC (`historyMtcOrMen2: true`) + sắp phẫu thuật (`plannedSurgery: true`), đang uống `metformin 1000 mg`.  
    → **Output `evaluate()`**: Phát `[STOP] Metformin` + `[AVOID] Semaglutide`, bỏ mặc bệnh nhân `HbA1c = 8.6%` với **`0` thuốc kiểm soát đường huyết nào được gợi ý thay thế** (bỏ sót hoàn toàn **Linagliptin 5 mg/ngày** an toàn ở mọi mức eGFR hoặc khởi trị Insulin nền)!
- **Hướng khắc phục**: Bổ sung luật `dm2.outpatient.step2_glycemic_escalation` kích hoạt khi `HbA1c` vượt mục tiêu cá thể hóa (`< 10.0%`, `glucose < 16.7 mmol/L`) mà chưa có thuốc mới được khởi trị từ nhánh tim-thận-cân nặng, phân tầng gợi ý DPP-4i (ưu tiên Linagliptin khi suy thận/cao tuổi), SGLT2i/GLP-1 RA (nếu không chống chỉ định), hoặc Gliclazide MR / Pioglitazone khi ưu tiên chi phí thấp BHYT.

---

#### 🟠 `R3-R2-DM2-11` [MAJOR | `rule` | `dm2.inpatient.hold_sglt2i_acute_dapagliflozin`] — Biến chứng Euglycemic DKA do SGLT2i chỉ phát lệnh TẠM NGỪNG (`HOLD`) thay vì NGỪNG HẲN (`STOP`), và hướng dẫn dùng lại ngay sau ăn ở bệnh nhân phẫu thuật {#r3-r2-dm2-11}
- **Bằng chứng thực thi (`R1_04`, `ADV_07`)**:
  - **`R1_04` (Kịch bản bắt buộc #1c)**: `setting: "inpatient"`, `glucose: 9.8 mmol/L`, `venousPh: 7.21`, `serumBicarb: 12`, `bloodKetones: 4.5 mmol/L`, đang dùng `dapagliflozin 10 mg`. Hệ thống chỉ phát `[HOLD dapagliflozin]` *"Tạm ngừng Dapagliflozin trong giai đoạn bệnh cấp tính nội viện"*.
  - **`ADV_07` (Cùng bệnh nhân euDKA có kèm `plannedSurgery: true`)**: Do [rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L128-L158) ưu tiên nhánh chu phẫu, hệ thống in câu hướng dẫn nguy hiểm: ***"Chỉ dùng lại khi bệnh nhân đã ăn uống ổn định và không còn nguy cơ mất dịch"*** ngay trên bệnh nhân đang bị toan ceton do SGLT2i!
- **Hướng khắc phục**: Theo Đồng thuận DKA/HHS 2024 và ADA 2026 Ch. 9/16, khi đã xảy ra DKA/euDKA trên nền SGLT2i (`isDka === true` hoặc `bloodKetones >= 3.0`), bắt buộc phát khuyến cáo riêng với `action: "STOP"` (`priority: 99`), tiêu đề *"NGỪNG HẲN [SGLT2i] do biến chứng Toan ceton (DKA / Euglycemic DKA)"* và khuyến cáo không tái sử dụng thường quy sau xuất viện.

---

#### 🟠 `R3-R2-DM2-12` [MAJOR | `rule` | `dm2.inpatient.steroid_induced_hyperglycemia`] — Ba lỗi đồng thời trong phác đồ Insulin NPH cho tăng đường huyết do Corticoid {#r3-r2-dm2-12}
- **Bằng chứng thực thi (`ADV_28`, `ADV_29`, `ADV_30`)**:
  1. **Kê `[START] Insulin NPH ~12 U` cho bệnh nhân có đường huyết hoàn toàn bình thường (`ADV_29`)**: `onSteroidTherapy: true`, `glucose: 5.1 mmol/L`, `hba1c: 5.8%`, `weight: 60 kg` → Vẫn phát `[START] insulin_nph` ([rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L473-L518) không kiểm tra ngưỡng tăng đường huyết!).
  2. **Bị `merge.ts` triệt tiêu mất mũi NPH buổi sáng khi bệnh nhân ngoại trú đang tiêm sẵn Glargine buổi tối (`ADV_28`)**: `onSteroidTherapy: true`, `glucose: 14.5 mmol/L`, đang dùng `insulin_glargine 30 U` → Do cả hai cùng thuộc nhóm xung đột `basal_insulins` tại [merge.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/merge.ts#L152-L157), `[CONTINUE] insulin_glargine` đè rớt hoàn toàn `[START] insulin_nph` (trái với ADA 2026 Ch. 16: NPH buổi sáng được tiêm **bổ sung thêm** trên nền insulin nền sẵn có để phủ đỉnh Prednisone buổi chiều).
  3. **Vi phạm quy tắc fail-closed QA-1 khi thiếu cân nặng (`ADV_30`)**: `weight: undefined` vẫn phát `action: "START"` thay vì `missingInputRec` / `CONSIDER`.
- **Hướng khắc phục**: (1) Yêu cầu có tăng đường huyết (`glucose >= 7.8–10.0 mmol/L` hoặc `hba1c >= 7.0%`) trước khi `START` NPH (nếu bình thường thì `MONITOR` đường huyết buổi chiều); (2) Áp dụng `missingInputRec` khi `weight === undefined`; (3) Cho phép NPH phối hợp bổ sung cùng insulin nền trong bối cảnh `onSteroidTherapy === true` mà không bị `merge.ts` xóa mất.

---

#### 🟠 `R3-R2-DM2-13` [MAJOR | `drug` | `sitagliptin`] — Không giảm liều (`REDUCE`) khi bệnh nhân suy thận nặng (`eGFR = 22`) đang uống quá liều gấp 4 lần `Sitagliptin 100 mg/ngày` {#r3-r2-dm2-13}
- **Bằng chứng thực thi (`ADV_58`)**: Nam 66 tuổi, `scr: 255 µmol/L` (`eGFR = 22 mL/phút/1.73m²` — CKD G4), `historyMtcOrMen2: true`, `currentMeds: [{ drugId: "sitagliptin", dose: "100 mg" }]`.  
  → **Output `evaluate()`**: Hoàn toàn **không có khuyến cáo `REDUCE` hay cảnh báo quá liều thận**, để mặc bệnh nhân tiếp tục uống `100 mg/ngày` (gấp **4 lần** trần tối đa `25 mg/ngày` ở `eGFR < 30` theo nhãn FDA Januvia và [sitagliptin.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/sitagliptin.json#L50-L59)).
- **Nguyên nhân mã nguồn**: [reviewMeds.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMeds.ts#L482) và [gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts#L421) chỉ can thiệp khi `renalBand.status` là `"contra"` hoặc `"not_rec"`, bỏ qua các thuốc có `status: "caution"` / `"rec"` nhưng yêu cầu hạ trần liều bắt buộc theo thận (`Sitagliptin`: `≤ 50 mg` khi `eGFR 30–<45`, `≤ 25 mg` khi `eGFR < 30`; `Saxagliptin`: `≤ 2.5 mg` khi `eGFR < 45`).
- **Hướng khắc phục**: Thêm luật rà soát liều thận DPP-4i trong `rules.outpatient.ts` (hoặc kiểm tra trần liều số học trong `reviewMeds.ts`) để phát `[REDUCE]` Sitagliptin xuống `25 mg/ngày` (`eGFR < 30`) / `50 mg/ngày` (`eGFR 30–<45`) và Saxagliptin xuống `2.5 mg/ngày` (`eGFR < 45`).

---

#### 🟠 `R3-R2-DM2-14` [MAJOR | `rule` | `dm2.outpatient.vildagliptin_hepatic`] — Xơ gan / bệnh gan mạn kèm `ALT = 4.2× ULN` chỉ dừng Vildagliptin nhưng vẫn phát `[CONTINUE] Metformin 2000 mg` và bỏ lọt `Pioglitazone` + `Gliclazide` {#r3-r2-dm2-14}
- **Bằng chứng thực thi (`ADV_48`)**: `conditions: { dm: true, liverDisease: true }`, `customInputs: { altUlnTimes: 4.2 }`, `currentMeds: [metformin 2000 mg, pioglitazone 30 mg, gliclazide 60 mg, vildagliptin 50 mg]`.  
  → **Output `evaluate()`**: Chỉ `[STOP] vildagliptin`, trong khi phát **`[CONTINUE] Metformin (500–2000 mg/ngày)`** và bỏ qua hoàn toàn `pioglitazone 30 mg` cùng `gliclazide 60 mg`!
- **Nguyên nhân mã nguồn**: [gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts#L916-L958) chưa ánh xạ các mã chống chỉ định `hepatic_impairment` / `severe_hepatic_impairment`, và module DM2 chưa có luật dừng Pioglitazone khi `altUlnTimes > 2.5–3.0` hoặc bệnh gan hoạt động (nhãn FDA Actos), cũng như thận trọng/ngừng Metformin (nguy cơ toan lactic do giảm thanh thải lactat gan) và Sulfonylurea (nguy cơ hạ đường huyết nặng kéo dài — SmPC EMA Gliclazide tại [dm2.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/dm2.json#L797)) ở suy gan/xơ gan mất bù.
- **Hướng khắc phục**: Bổ sung luật an toàn gan cho Pioglitazone (`ALT > 2.5–3× ULN` hoặc `liverDisease`), Metformin và Sulfonylurea, đồng thời ánh xạ đầy đủ `contra.code` về gan & MTC/MEN2 trong `gates.ts` / `reviewMeds.ts`.

---

#### 🟠 `R3-R2-DM2-15` [MAJOR | `missing` | `dm2.outpatient.cardiorenal_sglt2i`] — Chưa bổ sung trường giao diện và cảnh báo SGLT2i cho bệnh nhân đang có Loét bàn chân ĐTĐ cấp / hoại thư / tiền sử đoạn chi (`R3-DM2-11` tồn đọng từ Vòng 1) {#r3-r2-dm2-15}
- **Bằng chứng thực thi (`R1_12`, `ADV_23`)**: Kiểm tra toàn bộ [inputs.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/inputs.ts#L1-L184) và [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L687-L821): hoàn toàn chưa có trường nhập liệu loét bàn chân / hoại thư / tiền sử đoạn chi, và `evaluate()` vẫn phát `[START] dapagliflozin 10 mg` không kèm bất kỳ cảnh báo chăm sóc bàn chân hay cân nhắc trì hoãn nào.
- **Hướng khắc phục**: Thêm `customInputs.activeFootUlcer` vào [inputs.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/inputs.ts) và chuyển `START` SGLT2i sang `CONSIDER`/`DEFER` kèm cảnh báo bắt buộc khám mạch máu – bàn chân sát (tránh tuyệt đối Canagliflozin theo cảnh báo CANVAS & ADA 2026 Ch. 12).

---

#### 🟠 `R3-R2-DM2-16` [MAJOR | `rule` | `dm2.outpatient.aspirin_secondary`] — Khuyến cáo dùng thêm `Aspirin 75–162 mg/ngày` ngay trên bệnh nhân đang dùng thuốc chống đông đường uống (`Apixaban`) hoặc có tiền sử xuất huyết {#r3-r2-dm2-16}
- **Bằng chứng thực thi (`DP_16`)**: Nam 70 tuổi, Rung nhĩ kèm bệnh mạch vành mạn ổn định (`selectedModules: ["dm2", "af"]`, `conditions: { dm: true, ascvd: true, af: true, onAnticoagulant: true }`, đang uống `apixaban 5 mg × 2`).  
  → **Output `evaluate()`**: Phát đồng thời `[af:CONTINUE apixaban]` **VÀ** `[dm2:CONSIDER]` *"Duy trì kháng tiểu cầu dự phòng thứ phát ASCVD (Aspirin 75–162 mg/ngày)"*! Ngay chính dòng `rationale` tại [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L1716) viết *"(trừ khi có chống chỉ định hoặc đang dùng thuốc chống đông đường uống)"*, nhưng `when(ctx)` tại dòng `1702` lại không kiểm tra `onAnticoagulant` hay `bleedingHistory` (vi phạm ESC 2024 AF Class III – Harm).
- **Hướng khắc phục**: Loại trừ trong `when(ctx)` của `dm2.outpatient.aspirin_secondary` khi `hasCondition(ctx, "bleedingHistory") || hasCondition(ctx, "pepticUlcer")`, hoặc khi bệnh nhân đang dùng kháng đông đường uống (`onAnticoagulant` / DOAC / VKA trong `currentMeds`) mà không có `recentAcs`.

---

### PHẦN C — 3 PHÁT HIỆN MỨC ĐỘ MINOR & 1 SUGGESTION (`R3-R2-DM2-17` → `R3-R2-DM2-20`)

#### 🟡 `R3-R2-DM2-17` [MINOR | `ui` | `dm2.outpatient.overbasalization`] — Tiêu đề Overbasalization in nghịch lý toán học sai sự thật `"0.27 U/kg/ngày (> 0.5 U/kg/ngày)"` và `bedtimeToMorningDiff` không đổi đơn vị `mg/dL` {#r3-r2-dm2-17}
- **Bằng chứng (`DP_10`, `DP_11`)**: Khi bệnh nhân nặng `75 kg` tiêm `Glargine 20 U` (`0.27 U/kg/ngày`) nhưng có chênh lệch đường huyết tối–sáng `bedtimeToMorningDiff = 3.4 mmol/L`, [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L1298-L1301) sinh tiêu đề: **`"Cảnh báo quá liều insulin nền (Overbasalization): 0.27 U/kg/ngày (> 0.5 U/kg/ngày)"`**! Ngoài ra `bedtimeToMorningDiff` ([inputs.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/inputs.ts#L89-L97)) không được quy đổi khi chọn đơn vị US `mg/dL`.
- **Hướng khắc phục**: Chỉ in `(> 0.5 U/kg/ngày)` khi `dosePerKg > maxDosePerKg`; nếu kích hoạt do `diff >= diffThresh` thì hiển thị rõ lý do chênh lệch BeAM trên tiêu đề, và bổ sung quy đổi đơn vị cho `bedtimeToMorningDiff`.

---

#### 🟡 `R3-R2-DM2-18` [MINOR | `rule` | `dm2.inpatient.prandial_bolus_regimen`] — Nuôi ăn sonde liên tục (`tube_feeding`) vẫn kê tiêm Aspart "ngay trước 3 bữa ăn chính" và NPO không `HOLD` Pioglitazone / Acarbose / DPP-4i {#r3-r2-dm2-18}
- **Bằng chứng (`DP_05`, `DP_04`)**: Ở `DP_05` (`inpatientEating: "tube_feeding"`), [rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L385) gộp chung sonde liên tục với ăn miệng 3 bữa nên hướng dẫn tiêm Aspart *"ngay trước 3 bữa ăn chính"* (thay vì chia mỗi 4–6 giờ + cảnh báo truyền Dextrose 10% nếu tuột/tắc sonde theo ADA 2026 Ch. 16). Ở `DP_04` (`inpatientEating: "npo"`), bệnh nhân đang uống `pioglitazone + acarbose + linagliptin` không được `HOLD` thuốc viên dù nhịn ăn hoàn toàn, làm kích hoạt cảnh báo đỏ tương tác `Pioglitazone + Insulin`.
- **Hướng khắc phục**: Tách nhánh riêng cho `tube_feeding` và bổ sung luật `HOLD` toàn bộ thuốc uống hạ đường huyết khi bệnh nhân nội viện đang `npo` (và tạm ngừng Pioglitazone/Acarbose khi chuyển sang phác đồ insulin nội viện).

---

#### 🟡 `R3-R2-DM2-19` [MINOR | `ui` | `dm2.outpatient.cardiorenal_glp1`] — Lặp câu chữ liều Semaglutide (kể cả khi `CONTINUE`), thiếu dấu chấm nối câu trong thai kỳ, và tiêu đề `dup.dpp4_glp1` báo sai tên nhóm {#r3-r2-dm2-19}
- **Bằng chứng (`R1_07`, `DP_07`, `ADV_11`, `ADV_47`)**:
  1. Liều Semaglutide bị lặp đôi: `"Khởi đầu 0.25 mg x 1 lần/tuần (tiêm dưới da) - 0.25 mg tiêm dưới da 1 lần/tuần x 4 tuần..."`, và khi bệnh nhân đang tiêm `Semaglutide 1 mg` (`ADV_47`), hành động `[CONTINUE]` vẫn hiển thị `"Khởi đầu 0.25 mg..."`.
  2. Rationale ngừng thuốc thai kỳ (`DP_07`) bị dính chữ không chấm câu: `"...ngừng trước khi thụ thai Cần ngừng ngay..."`.
  3. Cảnh báo `dup.dpp4_glp1` luôn in cứng tiêu đề `"Phối hợp DPP-4i và GLP-1 RA"` ngay cả khi bệnh nhân dùng 2 DPP-4i (`ADV_11`: Sitagliptin + Linagliptin), dùng 2 GLP-1/GIP-GLP1 RA (`ADV_47`: Semaglutide + Tirzepatide), hoặc khi toàn bộ các thuốc đó đã có lệnh `[STOP]` trong thai kỳ (`DP_07`).
- **Hướng khắc phục**: Khử lặp mô tả trong `semaglutide.json` / `fmtDose`, dùng liều duy trì/hiện tại cho `CONTINUE`, đảm bảo dấu chấm câu trước khi ghép chuỗi, và tách tiêu đề động cho `dup.dpp4_glp1` (đồng thời ẩn cảnh báo trùng lặp đối với thuốc đã bị `STOP`).

---

#### 💡 `R3-R2-DM2-20` [SUGGESTION | `matrix` | `src/modules/dm2/matrix.ts`] — Bổ sung SGLT2i vào ma trận thận DM2, động hóa `pathway.ts` và tách nhãn Thai kỳ vs Cho con bú {#r3-r2-dm2-20}
- **Bằng chứng**: (1) [matrix.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/matrix.ts#L12-L46) chưa hiển thị `dapagliflozin`/`empagliflozin` trong bảng tra cứu thận ĐTĐ2 và cột `G4 (15–29)` lấy mẫu duy nhất tại `egfr = 20`; (2) [pathway.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/pathway.ts#L20-L56) dùng `status` tĩnh và còn số `44` viết cứng ở dòng `37`; (3) `STANDARD_CONDITIONS.pregnant` tại [types.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/types.ts#L189-L192) gộp chung *"Mang thai / Cho con bú"* khiến phụ nữ đang cho con bú bị `STOP` cả Metformin (dù Metformin tương thích cho con bú).

---

## 6. Đánh Giá Giao Diện (UI), Ghi Chú Bệnh Án (`noteText`) & Thuật Ngữ Tiếng Việt

1. **Chất lượng ngôn ngữ y khoa tiếng Việt**: Phần lớn các khuyến cáo mới sửa sau Vòng 1 (đặc biệt là cụm DKA/HHS theo K⁺, cấp cứu hạ đường huyết có phân biệt Acarbose, thai kỳ, suy tim) có văn phong tiếng Việt chuẩn xác, mạch lạc, rõ liều lượng và hành động lâm sàng.
2. **Điểm mù UX nguy hiểm nhất trên biểu mẫu nhập liệu**: Sự tồn tại song song nhưng **không liên thông** giữa 2 checkbox chuẩn ở thanh bệnh đồng mắc chung (`conditions.frailty` – *"Hội chứng suy yếu"*, `conditions.limitedLifespan` – *"Kỳ vọng sống hạn chế"*) và dropdown riêng bên dưới của module DM2 (`customInputs.elderlyHealthStatus` mặc định là `"not_elderly"` — *"Không áp dụng / Người trưởng thành trẻ"*). Trên thực tế lâm sàng, bác sĩ tích vào ô *"Hội chứng suy yếu"* ở phần bệnh nền sẽ mặc định tin rằng hệ thống đã hiểu bệnh nhân suy yếu — việc module DM2 phớt lờ cờ này dẫn thẳng đến thảm họa kê 3 thuốc mới ở `ADV_10` ([R3-R2-DM2-05](#r3-r2-dm2-05)).
3. **Tính toàn vẹn của Ghi chú bệnh án (`plan.noteText`)**: Khi một thuốc cốt lõi đang dùng như `insulin_glargine 44 U` không được bất kỳ rule nào phát `CONTINUE` hay `UPTITRATE` (`ADV_01..ADV_04`), bản tóm tắt bệnh án `noteText` tạo ra một kế hoạch điều trị chỉ còn `Metformin` đơn độc — rất dễ gây sai sót sao chép y lệnh (medication reconciliation error) tại phòng khám ngoại trú đông bệnh nhân.

---

## 7. Kết Luận Cuối Cùng Của Reviewer R3 (Vòng 2)

- **Tổng số kịch bản `evaluate()` thực thi kiểm chứng**: **96 kịch bản** (`80` kịch bản chính + `16` kịch bản thăm dò chuyên sâu, mã thoát `0`, `100%` bằng chứng đối chiếu trực tiếp từ đầu ra engine).
- **Tổng hợp lỗi phát hiện**: **`9` Critical**, **`7` Major**, **`3` Minor**, **`1` Suggestion** (Tổng: **`20` findings**).
- **KẾT LUẬN CHÍNH THỨC**: **FAIL** *(Chưa đạt tiêu chuẩn an toàn lâm sàng `0 critical, 0 major` theo [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md) để cấp chứng nhận `ai_multi_reviewed`; đề nghị chuyển sang Vòng 3 sau khi khắc phục triệt để 9 lỗi Critical và 7 lỗi Major nêu trên).*
