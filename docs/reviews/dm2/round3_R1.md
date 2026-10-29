# Báo Cáo Thẩm Định Y Khoa Độc Lập Vòng 3 – Module Đái Tháo Đường Típ 2 (`dm2`)

- **Vai trò thẩm định:** **R1 – Chuyên gia Phác đồ Nội tiết – Đái tháo đường Độc lập (Guideline Specialist)**
- **Module:** `dm2` (Đái tháo đường típ 2 – Ngoại trú, Nội trú, Chu phẫu & Cấp cứu Tăng đường huyết)
- **Vòng thẩm định:** Vòng 3 (`Round 3`)
- **Phán quyết (Verdict):** **`FAIL`** *(3 Critical, 6 Major, 5 Minor, 1 Suggestion — Quy tắc Hội đồng: chỉ `PASS` khi `0 Critical` và `0 Major`)*
- **Cơ sở phác đồ gốc đối chiếu nguyên văn (Local Medical Library 2026):**
  1. **ADA Standards of Care in Diabetes – 2026** (*Diabetes Care* 2026;49(Suppl. 1): Ch. 6 Glycemic Goals, Ch. 9 Pharmacologic Approaches, Ch. 10 Cardiovascular Disease & Risk Management, Ch. 11 Chronic Kidney Disease & Risk Management, Ch. 12 Retinopathy/Neuropathy/Foot Care, Ch. 13 Older Adults, Ch. 15 Management of Diabetes in Pregnancy, Ch. 16 Diabetes Care in the Hospital).
  2. **ADA/EASD/JBDS/DTI Consensus Report (2024):** *Hyperglycemic Crises in Adults With Diabetes* (*Diabetes Care* 2024;47(8):1257–1275).
  3. **KDIGO 2022 Clinical Practice Guideline for Diabetes Management in CKD** & **KDIGO 2025 Commentary on GLP-1 RAs**.
  4. **ESC 2023 Guidelines for the Management of Cardiovascular Disease in Patients with Diabetes**.
  5. **Bộ Y tế Việt Nam:** Quyết định **5481/QĐ-BYT** (30/12/2020) & Quyết định **1353/QĐ-BYT** (23/02/2021) về Hướng dẫn chẩn đoán và điều trị Đái tháo đường típ 2.
  6. **Nhãn thuốc gốc FDA DailyMed / EMA SmPC:** Metformin (*Glucophage*), Empagliflozin (*Jardiance*), Dapagliflozin (*Farxiga*), Canagliflozin (*Invokana*), Semaglutide (*Ozempic*, *Rybelsus*), Dulaglutide (*Trulicity*), Liraglutide (*Victoza*), Tirzepatide (*Mounjaro*), Sitagliptin (*Januvia*), Saxagliptin (*Onglyza*), Linagliptin (*Tradjenta*), Vildagliptin (*Galvus*), Pioglitazone (*Actos*), Glimepiride (*Amaryl*), Gliclazide (*Diamicron*), Acarbose, Finerenone (*Kerendia*) và nhóm Insulin.

---

## Phần 1. Tổng Quan Điều Hành & Ghi Nhận Tiến Bộ Sau Vòng 2

### 1.1. Tóm tắt số lượng phát hiện Vòng 3

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã phát hiện | Tác động tới Phán quyết |
|---|---:|---|---|
| **Critical (Nghiêm trọng – Đe dọa an toàn người bệnh)** | **3** | `DM2-R3-R1-01`, `DM2-R3-R1-02`, `DM2-R3-R1-03` | **Chặn `PASS` bắt buộc** |
| **Major (Lớn – Sai lệch phác đồ / Mất cổng an toàn / Đứt trích dẫn)** | **6** | `DM2-R3-R1-04` → `DM2-R3-R1-09` | **Chặn `PASS` bắt buộc** |
| **Minor (Nhỏ – Tinh chỉnh phân tầng / Minh bạch hồ sơ VN / Đồng bộ tài liệu)** | **5** | `DM2-R3-R1-10` → `DM2-R3-R1-14` | Khuyến nghị sửa cùng đợt |
| **Suggestion (Đề xuất hoàn thiện biên lâm sàng)** | **1** | `DM2-R3-R1-15` | Tùy chọn nâng cấp |
| **TỔNG CỘNG** | **15** | `DM2-R3-R1-01` → `DM2-R3-R1-15` | **Verdict: `FAIL`** |

### 1.2. Những cải tiến nổi bật đã được kiểm chứng đạt chuẩn sau Vòng 2
Qua kiểm tra toàn bộ **23/23 tệp mã nguồn** trong `src/modules/dm2/`, cơ sở tri thức `kb/`, pipeline dùng chung `src/engine/` và chạy thực tế hơn **40 kịch bản lâm sàng qua `evaluate()`**, chuyên gia R1 ghi nhận đợt khắc phục Vòng 2 đã đạt được nhiều bước tiến rất đáng kể:

1. **Kiến trúc mô-đun hóa sạch (`< 20 KB` / tệp):** Cả 23 tệp trong `src/modules/dm2/` đều có dung lượng dưới ngưỡng `20.000 bytes` (lớn nhất `rules.glycemic.ts` = `19.686 B`), phân tách rõ ràng theo miền lâm sàng.
2. **Độ trung thực trích dẫn nguyên văn trong `kb/citations/dm2.json`:** Chạy công cụ kiểm định tự động `verifyCitation()` trên toàn bộ **145/145 mục trích dẫn** trong `kb/citations/dm2.json` xác nhận **100% chuỗi `quote` khớp nguyên văn với tài liệu PDF/HTML gốc** trong thư viện y khoa cục bộ (`0` trích dẫn bịa đặt text). Toàn bộ `citationIds` trong `kb/drugs/**` cũng hợp lệ `100%`.
3. **An toàn Kali máu Fail-Closed trong DKA & ICU:** Cả `dm2.inpatient.dka_hhs_emergency` (`rules.dka.ts`) và `dm2.inpatient.icu_iv_insulin` (`rules.crisis.ts`) đều chặn cứng truyền insulin tĩnh mạch khi `K+ < 3.5 mmol/L` **hoặc thiếu xét nghiệm `K+` (`k === undefined`)**, phát lệnh `[HOLD]` `insulin_regular` và hướng dẫn bù Kali trước.
4. **Thai kỳ, Cho con bú, Lọc máu, Suy gan, MTC/MEN2 & Viêm tụy:**
   - Dừng toàn bộ thuốc viên hạ đường huyết, SGLT2i và GLP-1/GIP-GLP-1 RA khi mang thai nhưng bảo toàn an toàn phác đồ Insulin (`B10`).
   - Hàm `getEffectiveEgfr(ctx)` chặn triệt để lỗi lọt eGFR cũ ở bệnh nhân lọc máu (`dialysis: true`, `eGFR = 60` nhập nhầm vẫn dừng cứng Metformin & SGLT2i – `B17`).
   - Bóc tách chính xác viên phối hợp liều cố định FDC (`empagliflozin_metformin`, `sitagliptin_metformin`, `janumet`, `synjardy`, `xigduo`...) và biệt dược thương mại trong `helpers.drugs.ts`.
   - Chặn trùng nhóm nội bộ 2 Sulfonylurea, 2 Insulin nền dài, 2 DPP-4i, 2 GLP-1/GIP-GLP-1 RA; dừng thuốc độc gan khi `liverDisease`/`cirrhosis`/`ALT > 3× ULN`; dừng toàn bộ GLP-1 RA + DPP-4i khi có tiền sử viêm tụy cấp (`historyPancreatitis`).
5. **Nuôi ăn qua sonde, Corticoid, Hạ đường huyết cấp & Quy đổi đơn vị BeAM:**
   - Phác đồ nuôi ăn qua sonde liên tục chia insulin mỗi 6 giờ kèm cảnh báo truyền ngay Dextrose 10% nếu ngưng/tắc sonde (`B11`).
   - Phác đồ NPH buổi sáng cho tăng đường huyết do glucocorticoid chạy song hành cùng Glargine nền buổi tối mà không bị `merge.ts` triệt tiêu (`B16`).
   - Quy đổi đúng đơn vị `mg_dL` → `mmol/L` cho `bedtimeToMorningDiff` (`30 mg/dL = 1.67 mmol/L` không còn báo động giả Overbasalization – `S6`).
   - Quy tắc `15-15` hạ đường huyết cấp (`glucose < 3.9 mmol/L`) khóa toàn bộ khởi trị/tăng liều và cảnh báo bắt buộc dùng **glucose đơn (dextrose)** thay vì đường mía (sucrose) khi bệnh nhân đang uống `acarbose` (`S8`).
   - Bổ sung đánh giá `Finerenone` cho ĐTĐ típ 2 kèm CKD còn albumin niệu (`B13`) và loại trừ `Aspirin` khi đang dùng thuốc kháng đông đường uống hoặc có tiền sử xuất huyết tiêu hóa (`S10C`).

### 1.3. Vì sao module `dm2` vẫn bắt buộc nhận phán quyết `FAIL` ở Vòng 3?
Mặc dù bộ kiểm thử hiện hữu (`63 golden cases` + `20.500 random invariants`) đều xanh, thẩm định lâm sàng độc lập phát hiện **các bản vá Vòng 2 đã vô tình tạo ra những lỗi hồi quy y khoa nghiêm trọng ở chính những ca bệnh thực tế nằm ngoài kịch bản test hẹp**, cộng thêm một số cam kết trong `round2_RESPONSE.md` chưa khớp với mã nguồn thực thi:
1. **`DM2-R3-R1-01` (Critical):** Mọi bệnh nhân `≥ 75 tuổi` (dù khỏe mạnh) hoặc sức khỏe `complex` đang **mất kiểm soát đường huyết nặng (`HbA1c 9.2%–10.8%`, `FPG 13.5–16.2 mmol/L`, không hạ ĐH)** đều bị cắt giảm `-20%` liều insulin nền và bị khóa toàn bộ tăng bậc điều trị!
2. **`DM2-R3-R1-02` (Critical):** Mới chỉ tick nghi ngờ lâm sàng `dkaSuspected: true` (chưa có bất kỳ xét nghiệm khí máu/ceton nào) hoặc toan chuyển hóa không do ceton (nhiễm khuẩn huyết/toan lactic có `glucose = 11.5 mmol/L`, chưa đo BHB) đã bị truyền thẳng Regular insulin cố định `0.1 U/kg/h` và **cấm vĩnh viễn SGLT2i suốt đời**; ngược lại ca **Mixed DKA–HHS** có `BHB = 3.6 mmol/L` nhưng `pH = 7.35` lại bị truyền thiếu 50% liều insulin (`0.05` thay vì `0.1 U/kg/h`).
3. **`DM2-R3-R1-03` (Critical):** Bệnh nhân nội trú đang tiêm **Mixtard 30 / NovoMix 30 (`insulin_premix`)** ăn bình thường bị khởi trị chồng thêm `Insulin Glargine` + `Insulin Aspart 3 bữa` mà không `STOP`/`HOLD` `insulin_premix` và không có cảnh báo trùng lặp (cộng dồn 3 loại insulin!).
4. **6 lỗi Major (`DM2-R3-R1-04` → `09`):** Hỏng chế độ nội trú ở `Preset 4`; thiếu giảm 25% insulin nền trước mổ nội trú + tự ý `START` mới GLP-1 RA ngay trước mổ + thiếu cảnh báo hít sặc phổi khi gây mê; bỏ sót `STOP` Canagliflozin khi có loét bàn chân ĐTĐ ở ngoại trú không bệnh tim–thận và ở nội trú; chẩn đoán nhầm DKA cổ điển (`glucose 200–249 mg/dL`) thành `Euglycemic DKA`; 5 mã trích dẫn `fda.*.pregnancy` không tồn tại trong toàn bộ KB + nhiều trích dẫn lệch ngữ cảnh từ `DM2-R1-213` chưa sửa thực chất; cổng `vitalAndRenalGates.ts` ghi đè ngược `CONTINUE` → `REDUCE` cho Metformin `500 mg/ngày` ở CKD G3b tạo khuyến cáo tự mâu thuẫn.

---

## Phần 2. Kiểm Toán Độc Lập 47/47 Hạng Mục Vòng 2 (`round2_RESPONSE.md`)

### 2.1. Kiểm toán 18 phát hiện của R1 Vòng 2 (`DM2-R1-201` → `DM2-R1-218`)

| Mã Vòng 2 | Mức độ cũ | Tuyên bố `round2_RESPONSE.md` | Kết quả kiểm định độc lập Vòng 3 | Tham chiếu Vòng 3 |
|---|---|---|---|---|
| `DM2-R1-201` | Critical | Đã sửa `isMixedDkaHhs = effOsm > 300 && (hasAcidosis \|\| hasKetonemia)` | **KHẮC PHỤC MỘT PHẦN – CÒN LỖI CRITICAL:** Mã thực tế tại `helpers.ts:295,309` viết `hasHhsHyperosmolar && (isDkaCore \|\| hasAcidosis)` — bỏ sót `hasKetonemia` khi `pH >= 7.30` & `HCO3 >= 18` (`B1`: truyền 0.05 thay vì 0.1 U/kg/h). | **`DM2-R3-R1-02`** |
| `DM2-R1-202` | Critical | Đã thêm Dextrose 5–10% ngay từ đầu cho `isEuDka` | **KHẮC PHỤC MỘT PHẦN – LỖI MAJOR:** Đã có Dextrose ngay từ đầu, nhưng đặt nhầm ngưỡng chẩn đoán `isEuDka` là `< 13.9 mmol/L` (`250 mg/dL`) thay vì `< 11.1 mmol/L` (`200 mg/dL`), gọi nhầm DKA cổ điển `200–249 mg/dL` là Euglycemic DKA (`B3`). | **`DM2-R3-R1-07`** |
| `DM2-R1-203` | Critical | Tách `isIsolatedKetonemia` không truyền mù quáng 0.1 U/kg/h | **ĐÃ KHẮC PHỤC** cho `bloodKetones >= 3.0` đơn độc (`B4`), **NHƯNG PHÁT SINH LỖI NGƯỢC** khi `bloodKetones === undefined` kèm toan chuyển hóa (`B2`) hoặc `dkaSuspected: true` (`B7`) lại truyền thẳng 0.1 U/kg/h! | **`DM2-R3-R1-02`** |
| `DM2-R1-204` | Critical | Thêm `REFER` cấp cứu ngoại trú + `Preset 4` | **KHẮC PHỤC MỘT PHẦN – LỖI MAJOR UI:** Luật `REFER` ngoại trú hoạt động tốt, nhưng `Preset 4` (`dm2_preset_inpatient_dka_emergency`) quên `setting: 'inpatient'` nên bị nhảy về ngoại trú thay vì minh họa hoãn insulin bù K+ nội viện! | **`DM2-R3-R1-04`** |
| `DM2-R1-205` | Critical | Đọc `serumBicarb`/`hco3` và tự tính `2*Na + Glucose` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`helpers.ts:261-276`, kiểm chứng qua `B1`). | Đạt |
| `DM2-R1-206` | Major | Sửa NPH corticoid (chỉ START khi tăng ĐH, fail-closed weight, giữ Glargine) | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`rules.periop.ts`, kiểm chứng qua `B16`). | Đạt |
| `DM2-R1-207` | Major | Nuôi ăn sonde mỗi 6 giờ + cảnh báo Dextrose 10% nếu ngưng sonde | **ĐÃ KHẮC PHỤC** cho ca chưa dùng Premix (`B11`); riêng ca đang dùng `insulin_premix` cần thêm lệnh `STOP`/`HOLD` Premix. | **`DM2-R3-R1-03`** |
| `DM2-R1-208` | Major | Chuẩn hóa `hasCondition(ctx, 'ascvd' \| ...)` bắt đủ `strokeOrTia`, `pad` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`helpers.ts:183-239`, kiểm chứng qua `S10A`). | Đạt |
| `DM2-R1-209` | Major | Thêm `dm2.outpatient.glycemic_step_up` chống trì trệ điều trị | **ĐÃ KHẮC PHỤC** cho người `< 75` tuổi khỏe mạnh, nhưng bị khóa oan ở người `>= 75` tuổi / `complex` do `shouldDeintensifyHypoMeds(ctx)`. | **`DM2-R3-R1-01`** |
| `DM2-R1-210` | Major | Quy đổi đơn vị `bedtimeToMorningDiff` (`mg/dL` ↔ `mmol/L`) + tách tiêu đề | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`inputs.ts`, `helpers.ts`, `rules.insulin.titrate.ts`, kiểm chứng qua `S6` & `B19`). | Đạt |
| `DM2-R1-211` | Major | Phân tầng tuổi cho Statin (`< 40`, `40–75`, ASCVD) | **KHẮC PHỤC MỘT PHẦN – CÒN LỖI MINOR & CITATION:** Chưa tách nhóm `> 75 tuổi` / `very_complex` chưa dùng statin (gắn nhầm nhãn Rec 10.18 của nhóm 40–75) và trích dẫn `ada.dm2.2026.statin_secondary` lại chứa văn bản Rec 10.20 dự phòng tiên phát. | **`DM2-R3-R1-08`**, **`DM2-R3-R1-13`** |
| `DM2-R1-212` | Major | Thêm `historyPancreatitis` và `STOP` toàn bộ GLP-1 RA + DPP-4i | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`rules.safety.contra.ts`, kiểm chứng qua `B18`). | Đạt |
| `DM2-R1-213` | Major | Sửa triệt để cả 5 nhóm trích dẫn lệch ngữ cảnh | **CHƯA KHẮC PHỤC ĐÚNG CAM KẾT – LỖI MAJOR:** Vẫn giữ `basal_half_tdd_05` (T1D!), `kdigo...t2d_basal_bolus_05` (Table S73 nội viện), `flow_egfr_15` (endpoint nghiên cứu), `elderly_age_75` (statin!), `hba1c_goals` (ngoại trú gắn cho nội trú/HA), `metformin_formulations_p68` + thêm 5 mã ma `fda.*.pregnancy`! | **`DM2-R3-R1-08`** |
| `DM2-R1-214` | Major | Trích dẫn FDA/EMA chính chủ cho `kb/drugs/*.json` | **ĐÃ KHẮC PHỤC** trên `kb/drugs/*.json` (`0` lỗi thiếu ID), nhưng `rules.safety.contra.ts:27-33` lại phát 5 mã `fda.*.pregnancy` không tồn tại. | **`DM2-R3-R1-08`** |
| `DM2-R1-215` | Minor | Thêm `ckd_finerenone_consider` & nhánh `HFpEF + béo phì` cho GLP-1/GIP-GLP-1 | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`rules.cvrisk.ts`, `rules.cardiorenal.glp1.ts`, kiểm chứng qua `B13`). | Đạt |
| `DM2-R1-216` | Minor | Chu phẫu tạm ngừng thuốc uống + giảm 20–25% insulin nền ở `setting: 'both'` | **CHƯA KHẮC PHỤC ĐÚNG CAM KẾT – LỖI MAJOR:** `outpatientPeriopBasalReduceRules` chỉ đặt `setting: 'outpatient'`, khiến nội trú NPO trước mổ giữ nguyên 100% liều Glargine 40 U (`B9b`); đồng thời thiếu kiểm soát GLP-1 RA chu phẫu (`B9a`, `S7A`). | **`DM2-R3-R1-05`** |
| `DM2-R1-217` | Minor | Thêm công tắc `dkaSuspected` vào `inputs.ts` | **PHÁT SINH LỖI CRITICAL:** Công tắc được thêm vào `inputs.ts`, nhưng thay vì bật cảnh báo tầm soát xét nghiệm như mô tả trên giao diện, nó kích hoạt truyền thẳng Regular insulin 0.1 U/kg/h và cấm vĩnh viễn SGLT2i (`B7`). | **`DM2-R3-R1-02`** |
| `DM2-R1-218` | Suggestion | Thêm trích dẫn ESC 2023 + KDIGO 2025, đủ 3 khóa `profileDiff`, `classOfRec` | **ĐÃ KHẮC PHỤC** trên 8 khối `profileDiff` hiện có; riêng ngưỡng K+ `< 3.5` vs `< 3.3` của Bộ Y tế trong DKA nên bổ sung thêm `profileDiff`. | **`DM2-R3-R1-12`** |

### 2.2. Kiểm toán 9 phát hiện của R2 Vòng 2 (`DM2-R2-R2-01` → `DM2-R2-R2-09`)

| Mã Vòng 2 | Mức độ cũ | Tuyên bố `round2_RESPONSE.md` | Kết quả kiểm định độc lập Vòng 3 | Tham chiếu Vòng 3 |
|---|---|---|---|---|
| `DM2-R2-R2-01` | Critical | Thêm `contrastPlanned` và `HOLD`/`DEFER` Metformin 48h khi `eGFR <= 60` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`inputs.ts`, `rules.glycemic.ts`). | Đạt |
| `DM2-R2-R2-02` | Major | Giữ nguyên đúng liều đang dùng khi `CONTINUE` GLP-1 RA / SGLT2i | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`helpers.drugs.ts`, `rules.cardiorenal.*`). | Đạt |
| `DM2-R2-R2-03` | Major | Giảm liều thận DPP-4i/Gliclazide + giữ `CONTINUE` Metformin `<= 1000 mg` ở G3b | **KHẮC PHỤC MỘT PHẦN – LỖI MAJOR:** DPP-4i/Gliclazide đạt tốt, nhưng Metformin `500 mg/ngày` ở `eGFR 39` bị `vitalAndRenalGates.ts:85` ghi đè ngược `CONTINUE -> REDUCE` (`S5`)! | **`DM2-R3-R1-09`** |
| `DM2-R2-R2-04` | Major | Giảm liều `saxagliptin <= 2.5 mg/ngày` khi dùng kèm ức chế mạnh CYP3A4/5 | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (cả trong `rules.safety.renal.ts` lẫn `kb/interactions/diabetes_respiratory.json`). | Đạt |
| `DM2-R2-R2-05` | Major | `glycemic_step_up` cho thể gầy và `linagliptin` ở CKD G4–G5 / suy gan | **ĐÃ KHẮC PHỤC** (trừ việc bị khóa oan bởi `shouldDeintensifyHypoMeds` ở người `>= 75` tuổi). | **`DM2-R3-R1-01`** |
| `DM2-R2-R2-06` | Minor | Hiển thị khoảng liều duy trì Incretin và cột G5 của `pioglitazone` trên `matrix.ts` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`matrix.ts`, `kb/drugs/*.json`). | Đạt |
| `DM2-R2-R2-07` | Minor | Chuẩn hóa `classes` và chặn trùng nhóm 2 SU / 2 Basal / 2 DPP-4i / 2 GLP-1 | **KHẮC PHỤC MỘT PHẦN:** Chặn tốt trùng 2 thuốc cùng phân nhóm ngoại trú, nhưng bỏ lọt trùng `insulin_premix` + `Glargine` + `Aspart` nội viện (`S4`)! | **`DM2-R3-R1-03`** |
| `DM2-R2-R2-08` | Minor | Khi NPO chỉ `HOLD` đúng hoạt chất insulin bữa ăn/premix đang dùng | **ĐÃ KHẮC PHỤC** khi `eatingStatus === 'npo'`, nhưng quên `STOP`/`HOLD` `insulin_premix` khi `eatingStatus === 'normal' \| 'poor' \| 'tube_feeding'` (`S4`). | **`DM2-R3-R1-03`** |
| `DM2-R2-R2-09` | Suggestion | Phân biệt Premix người vs Premix analog và lưu ý U-100 ↔ U-300 Glargine | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`kb/drugs/insulin_premix.json`, `insulin_glargine.json`). | Đạt |

### 2.3. Kiểm toán 20 phát hiện của R3 Vòng 2 (`R3-R2-DM2-01` → `R3-R2-DM2-20`)

| Mã Vòng 2 | Mức độ cũ | Tuyên bố `round2_RESPONSE.md` | Kết quả kiểm định độc lập Vòng 3 | Tham chiếu Vòng 3 |
|---|---|---|---|---|
| `R3-R2-DM2-01` | Critical | Không khởi mới Basal-Bolus nội viện khi chưa dùng insulin và `glucose < 10.0 mmol/L` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`rules.inpatient.ts`, kiểm chứng qua `Preset 3` khi hạ glucose & kịch bản kiểm thử). | Đạt |
| `R3-R2-DM2-02` | Critical | `REFER` cấp cứu ngoại trú + `STOP` vĩnh viễn SGLT2i + khóa khởi trị mạn | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** cho ca xác định DKA/HHS ngoại trú. | Đạt |
| `R3-R2-DM2-03` | Critical | Nhận diện đầy đủ Mixed DKA–HHS và toan chưa đo ceton | **PHÁT SINH 2 LỖI CRITICAL:** Bỏ sót Mixed DKA–HHS khi `BHB >= 3.0` mà `pH >= 7.30` (`B1`); đồng thời gán mọi toan chuyển hóa chưa đo ceton có `glucose >= 11.1` thành DKA xác định truyền 0.1 U/kg/h + cấm SGLT2i suốt đời (`B2`). | **`DM2-R3-R1-02`** |
| `R3-R2-DM2-04` | Critical | Xây dựng `basal_insulin_maintenance` chỉnh liều cho `HbA1c < 10%` | **KHẮC PHỤC MỘT PHẦN:** Hoạt động tốt ở người `< 75` tuổi khỏe mạnh, nhưng bị khóa cứng bởi `!shouldDeintensifyHypoMeds(ctx)` ở mọi người `>= 75` tuổi hoặc `complex` (`S2A–S2C`). | **`DM2-R3-R1-01`** |
| `R3-R2-DM2-05` | Critical | Xử lý người cao tuổi suy yếu (`resolveElderlyStatus`, `STOP` SU, giảm liều) | **GÂY LỖI HỒI QUY CRITICAL NHẤT VÒNG 3:** `shouldDeintensifyHypoMeds(ctx)` trả về `true` vô điều kiện cho mọi `age >= 75` hoặc `complex`/`very_complex`, tự động cắt `-20%` insulin nền ngay cả khi `HbA1c = 10.8%`, `FPG = 16.2 mmol/L` (`S2A`, `S2B`, `S2C`)! | **`DM2-R3-R1-01`** |
| `R3-R2-DM2-06` | Critical | Cổng chặn chéo hạ ĐH cấp & chu phẫu SGLT2i với module `hf`/`ckd` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`organAndCrisisGates.ts` đã kiểm tra `plannedSurgery` và hạ ĐH cấp toàn cục). | Đạt |
| `R3-R2-DM2-07` | Critical | Giải mã biệt dược & tách thành phần FDC trong `helpers.drugs.ts` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`helpers.drugs.ts`). | Đạt |
| `R3-R2-DM2-08` | Critical | Phát `[STOP]` khi trùng 2 SU, 2 Basal, 2 DPP-4i, 2 GLP-1 RA | **KHẮC PHỤC MỘT PHẦN:** Chưa chặn trùng `insulin_premix` + Basal-Bolus nội viện (`S4`) và còn báo giả Overbasalization sau khi `STOP` 1 lọ basal trùng (`B14a`). | **`DM2-R3-R1-03`**, **`DM2-R3-R1-14`** |
| `R3-R2-DM2-09` | Critical | Thêm `dm2.inpatient.icu_iv_insulin` có cổng chặn K+ fail-closed | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`rules.crisis.ts`, kiểm chứng qua `B6a`, `B6b`). | Đạt |
| `R3-R2-DM2-10` | Major | `glycemic_step_up` cho thể gầy và CKD G4–G5 + MTC + chu phẫu (`linagliptin`) | **ĐÃ KHẮC PHỤC** (lưu ý mở khóa cho người `>= 75` tuổi tăng ĐH tại `DM2-R3-R1-01`). | **`DM2-R3-R1-01`** |
| `R3-R2-DM2-11` | Major | `STOP` vĩnh viễn SGLT2i trong DKA/euDKA thắng `HOLD` chu phẫu | **KHẮC PHỤC MỘT PHẦN:** Đúng khi đã xác định DKA/euDKA, nhưng bắn nhầm `STOP` vĩnh viễn suốt đời khi mới chỉ nghi ngờ `dkaSuspected` hoặc toan lactic chưa đo BHB (`B2`, `B7`). | **`DM2-R3-R1-02`** |
| `R3-R2-DM2-12` | Major | Sửa 3 lỗi trong `steroid_induced_hyperglycemia` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`rules.periop.ts`, kiểm chứng qua `B16`). | Đạt |
| `R3-R2-DM2-13` | Major | Giảm liều thận `sitagliptin`, `saxagliptin`, `vildagliptin`, `gliclazide` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`rules.safety.renal.ts`). | Đạt |
| `R3-R2-DM2-14` | Major | `STOP` thuốc độc gan khi `liverDisease` / `cirrhosis` / `ALT > 3× ULN` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`rules.safety.dup_hepatic.ts`). | Đạt |
| `R3-R2-DM2-15` | Major | `activeFootUlcer` tránh/ngừng `canagliflozin` và thận trọng SGLT2i | **KHẮC PHỤC MỘT PHẦN – CÒN LỖI MAJOR:** Chỉ chạy trong `dm2.outpatient.cardiorenal_sglt2i`, nên bỏ sót hoàn toàn `STOP` Canagliflozin ở ngoại trú không HF/CKD/ASCVD (`B8b`) và ở nội trú (`B8c`)! | **`DM2-R3-R1-06`** |
| `R3-R2-DM2-16` | Major | Loại trừ `Aspirin` khi dùng kháng đông OAC hoặc tiền sử xuất huyết | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`rules.cvrisk.ts`, kiểm chứng qua `S10C`). | Đạt |
| `R3-R2-DM2-17` | Minor | Đồng bộ quy đổi đơn vị `bedtimeToMorningDiff` và tiêu đề Overbasalization | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`S6`, `B19`). | Đạt |
| `R3-R2-DM2-18` | Minor | Nuôi ăn sonde q6h + `HOLD` thuốc uống nội trú | **ĐÃ KHẮC PHỤC** (cần bổ sung `HOLD` GLP-1 RA nội trú cấp tính tại `DM2-R3-R1-05` và `STOP`/`HOLD` `insulin_premix` tại `DM2-R3-R1-03`). | **`DM2-R3-R1-03`**, **`DM2-R3-R1-05`** |
| `R3-R2-DM2-19` | Minor | Xóa lặp chữ `"1 lần/tuần"` và giữ liều đang dùng khi `CONTINUE` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`helpers.drugs.ts`). | Đạt |
| `R3-R2-DM2-20` | Suggestion | Mở rộng `matrix.ts` + tính động `status` trong `pathway.ts` theo `RuleContext` | **CHƯA ĐÚNG CAM KẾT Ở `pathway.ts`:** `matrix.ts` đã tốt, nhưng `pathway.ts:16-95` vẫn gán cứng hằng tĩnh `'completed'`, `'active'`, `'upcoming'` không hề nhận `RuleContext`! | **`DM2-R3-R1-11`** |

---

## Phần 3. Phân Tích Chi Tiết 15 Phát Hiện Vòng 3 (`DM2-R3-R1-01` → `DM2-R3-R1-15`)

---

### [CRITICAL] `DM2-R3-R1-01` — Giảm 20% liều Insulin nền & Khóa toàn bộ tăng bậc điều trị vô điều kiện ở mọi người bệnh `≥ 75 tuổi` hoặc sức khỏe `complex` đang tăng đường huyết rất nặng (`HbA1c 9.2%–10.8%`)

- **Loại / Định danh:** `rule` | `dm2.outpatient.deintensification` (`src/modules/dm2/rules.safety.deintensify.ts:38-76, 235-373`)
- **Cơ chế lỗi trong mã nguồn:**
  Tại `src/modules/dm2/rules.safety.deintensify.ts:62-68`, hàm `shouldDeintensifyHypoMeds(ctx)` được viết như sau:
  ```ts
  if (elderly === 'complex' || elderly === 'very_complex') return true;
  if (age !== undefined && age >= thFor('age', 'dm2.elderly.high_risk_age')) return true;
  ```
  Hàm này trả về `true` **chỉ dựa trên tuổi (`>= 75`) hoặc phân tầng lão khoa**, hoàn toàn **không kiểm tra** `recentHypo` hay `hba1c` / `glucose` có đang thấp dưới đích cá thể hóa hay không! Nguy hiểm hơn, kết quả của hàm này được dùng để:
  1. Kích hoạt `dm2.outpatient.deintensification` (`dòng 235–373`) phát lệnh **`[REDUCE]` giảm 20% liều insulin nền** (và giảm/dừng Sulfonylurea mà không chuyển sang nhóm thuốc an toàn thay thế);
  2. Khóa cứng cả 3 quy tắc điều trị ngoại trú tại `rules.insulin.titrate.ts:48` (`if (shouldDeintensifyHypoMeds(ctx)) return false;`), `rules.insulin.init.ts:124` và `rules.stepup.ts:50`!
- **Bằng chứng chạy thực nghiệm `evaluate()`:**
  - **Ca `S2A`:** Cụ ông **76 tuổi khỏe mạnh** (`elderlyHealthStatus: 'healthy'`, mục tiêu cá thể hóa `< 7.0–7.5%`), **`HbA1c = 9.2%`**, **`FPG = 13.5 mmol/L` (`243 mg/dL`)**, `recentHypo = false`, đang dùng `Metformin 1000 mg + Insulin Glargine 20 U`:
    → Hệ thống phát **`[REDUCE] Insulin Glargine: Giảm 20% liều hiện tại (từ 20 U xuống ~16 U/ngày)`** và khóa sạch chỉnh tăng liều!
  - **Ca `S2B`:** Cụ bà **77 tuổi khỏe mạnh**, **`HbA1c = 10.8%`**, **`FPG = 16.2 mmol/L` (`292 mg/dL`)**, `recentHypo = false`, đang tiêm `Insulin Glargine 20 U`:
    → Hệ thống vẫn phát **`[REDUCE] Insulin Glargine (-20%, xuống ~16 U/ngày)`** ngay giữa bệnh cảnh tăng đường huyết mất bù nặng có nguy cơ dẫn tới hôn mê tăng áp lực thẩm thấu (HHS)!
  - **Ca `S2C`:** Bệnh nhân **70 tuổi phân tầng `complex`** (mục tiêu `< 8.0%`), **`HbA1c = 9.5%`**, **`FPG = 12.8 mmol/L`**, `recentHypo = false`, đang dùng `Gliclazide 60 mg + Glargine 20 U`:
    → Hệ thống cắt giảm đồng thời cả Gliclazide lẫn Glargine mà không chuyển đổi hay giữ liều kiểm soát triệu chứng!
- **Đối chiếu phác đồ gốc:**
  - **ADA Standards of Care 2026 – Section 13 (Older Adults)** (*Diabetes Care* 2026;49(Suppl. 1):S285–S286, PDF trang 9–10):
    > **Rec 13.14a:** *"Deintensify hypoglycemia-causing medications (e.g., insulin, sulfonylureas, or meglitinides) or switch to a medication class with low hypoglycemia risk for individuals who are at high risk for hypoglycemia, using individualized glycemic goals. **B**"*
    > **Trang S286 (PDF trang 10):** *"Deintensification of glucose-lowering plans can be achieved by either lowering the dose or discontinuing some medications, **as long as individualized glycemic goals are maintained** (114,115)."*
  - Như vậy, ở người cao tuổi có `HbA1c` đang vượt xa mục tiêu cá thể hóa (`9.2%–10.8%` so với đích `< 7.5%` hoặc `< 8.0%`) và không có hạ đường huyết: tuyệt đối **không được giảm liều insulin nền gây mất bù đường huyết**; nếu đang dùng Sulfonylurea thì **chuyển đổi (`SWITCH`)** sang thuốc nguy cơ hạ ĐH thấp (SGLT2i, GLP-1 RA, DPP-4i như Linagliptin) thay vì bỏ mặc tăng đường huyết!
- **Hướng khắc phục bắt buộc:**
  1. Tách riêng hàm `hasHypoglycemiaOrOvertreatment(ctx)`: chỉ trả về `true` khi `recentHypo === true`, `glucose < 4.4 mmol/L`, hoặc `hba1c` (hoặc FPG khi chưa có HbA1c) nằm **dưới ngưỡng dưới an toàn của mục tiêu cá thể hóa** (ví dụ: `< 6.5%` ở người `>= 65–75` tuổi khỏe mạnh đang dùng SU/insulin; `< 7.0%` ở nhóm `complex`; `< 7.5%` ở nhóm `very_complex`). Chỉ khi hàm này `true` mới giảm `-20%` liều insulin nền và mới chặn `basal_insulin_maintenance` / `early_insulin` / `glycemic_step_up`.
  2. Khi người bệnh `>= 75` tuổi hoặc `complex`/`very_complex` đang dùng Sulfonylurea mà `HbA1c` còn vượt mục tiêu cá thể hóa và không hạ ĐH: phát khuyến cáo `SWITCH` / `STOP` SU đi kèm cho phép `glycemic_step_up` hoặc chỉnh liều insulin nền thận trọng để đạt đích cá thể hóa (`< 7.5%` hoặc `< 8.0%`).

---

### [CRITICAL] `DM2-R3-R1-02` — Ba lỗi an toàn nghiêm trọng trong bộ nhận diện và xử trí cơn cấp DKA / HHS (`dkaSuspected` chưa có xét nghiệm, toan chuyển hóa không đo ceton và bỏ sót Mixed DKA–HHS)

- **Loại / Định danh:** `rule` | `dm2.inpatient.dka_hhs_emergency` (`src/modules/dm2/helpers.ts:281-315`, `rules.dka.ts:15-213`, `rules.safety.renal.ts:29-62`)
- **Phân tích 3 cơ chế lỗi cộng hưởng:**
  1. **Lỗi 1 – `dkaSuspected: true` chưa có xét nghiệm vẫn truyền thẳng Regular insulin `0.1 U/kg/h` và cấm SGLT2i suốt đời (`B7`):**
     Trong `src/modules/dm2/inputs.ts:174-177`, công tắc `dkaSuspected` được hướng dẫn cho bác sĩ là: *"Bật cảnh báo tầm soát khí máu tĩnh mạch, ceton máu (β-hydroxybutyrate), điện giải đồ và áp lực thẩm thấu"*. Thế nhưng `helpers.ts:302` gán thẳng `isCrisis = ... || isSuspected`, khiến `rules.dka.ts:21,148` mặc định `syndromeLabel = 'DKA'` và ra y lệnh **`[START] Truyền tĩnh mạch liên tục Regular Insulin 0.1 U/kg/giờ`**, đồng thời `dkaPermanentStopSglt2iRules` (`rules.safety.renal.ts:38`) ra lệnh **`[STOP] Ngừng vĩnh viễn SGLT2i; KHÔNG khởi động lại`** ngay cả khi toàn bộ `venousPh`, `serumBicarb`, `bloodKetones`, `effectiveOsmolality` đều bằng `undefined`!
  2. **Lỗi 2 – Gán mọi toan chuyển hóa chưa đo ceton có `glucose >= 11.1 mmol/L` thành DKA / Euglycemic DKA xác định (`B2`):**
     Tại `helpers.ts:281-285`:
     ```ts
     const isUnmeasuredKetoneAcidosis = ketones === undefined && glucose !== undefined && glucose >= dkaGlucoseMin && hasAcidosis;
     const isDkaCore = hasConfirmedDka || isUnmeasuredKetoneAcidosis;
     ```
     Trong lâm sàng hồi sức nội khoa, hàng ngày có rất nhiều bệnh nhân **nhiễm khuẩn huyết toan lactic, suy thận cấp/mạn toan biến dưỡng, tiêu chảy mất HCO₃⁻** có tăng đường huyết phản ứng nhẹ (`glucose = 11.5 mmol/L` [207 mg/dL], `pH = 7.22`, `HCO3- = 14`, bác sĩ chưa nhập `bloodKetones` và `dkaSuspected = false`). Hệ thống lập tức chẩn đoán khẳng định **Euglycemic DKA**, truyền cố định Regular insulin `0.1 U/kg/h` (`7.0 U/h` — cao gấp 2–3 lần phác đồ tăng ĐH ICU thông thường và không giảm liều theo đáp ứng đường huyết), đồng thời **xóa sổ vĩnh viễn suốt đời thuốc trụ cột bảo vệ tim–thận Dapagliflozin/Empagliflozin** mà không hề yêu cầu xét nghiệm STAT β-hydroxybutyrate máu!
  3. **Lỗi 3 – Bỏ sót thể Hỗn hợp DKA–HHS (`isMixedDkaHhs`) khi `bloodKetones >= 3.0 mmol/L` kèm `pH >= 7.30` (`B1`):**
     Dòng 33 của `round2_RESPONSE.md` giải trình rằng `isMixedDkaHhs` là `effOsm > 300 && (hasAcidosis || hasKetonemia)`. Tuy nhiên mã thực tế tại `helpers.ts:294-295, 309` lại viết:
     ```ts
     const isPureHhs = hasHhsHyperosmolar && !hasAcidosis && !hasKetonemia;
     const isMixedDkaHhs = hasHhsHyperosmolar && (isDkaCore || hasAcidosis);
     ```
     Khi bệnh nhân nôn ói nhiều dẫn đến toan–kiềm hỗn hợp (`glucose = 38 mmol/L`, `Na+ = 149` → `effOsm = 336 > 300`, `pH = 7.35`, `HCO3- = 21`, **`bloodKetones = 3.6 mmol/L >= 3.0`**), cả `isPureHhs` lẫn `isMixedDkaHhs` đều bằng `false`, rơi xuống nhánh mặc định `HHS` đơn thuần: chỉ truyền **`0.05 U/kg/h` (`3.5 U/h` — hụt mất 50% liều insulin)** và bỏ sót điều kiện sạch ceton máu `< 0.6 mmol/L` trước khi ngưng bơm tiêm điện!
- **Đối chiếu phác đồ gốc:**
  - **ADA/EASD/JBDS/DTI Consensus Report 2024** (*Diabetes Care* 2024;47(8):1262, 1266; PDF trang 6 & 10):
    > **Trang 1262, Fig. 2 (PDF trang 6):** *"Hyperglycemia and/or diabetes must be accompanied by two additional criteria—elevated ketones and metabolic acidosis—for the diagnosis of DKA to be established."* — và tiêu chuẩn HHS đòi hỏi *"Absence of significant ketonemia: β-Hydroxybutyrate concentration <3.0 mmol/L OR urine ketone strip less than 2+"*.
    > **Trang 1266 (PDF trang 10):** *"If significant ketonemia is present (i.e., **β-hydroxybutyrate ≥3.0 mmol/L**, ketonuria ≥2+, pH <7.30, or bicarbonate <18 mmol/L), which represents **mixed DKA/HHS**, then a fixed-rate intravenous insulin infusion should be started at **0.1 units/kg/h** (117)."*
- **Hướng khắc phục bắt buộc:**
  1. Tách riêng trạng thái `isSuspectedUnconfirmed` (khi `dkaSuspected === true` chưa đủ cả 2 tiêu chuẩn ceton + toan, hoặc `hasAcidosis && ketones === undefined && !dkaSuspected`): phát thẻ cấp cứu `[MONITOR]` (`priority: 100`) yêu cầu làm STAT β-hydroxybutyrate máu (hoặc ceton niệu nếu cơ sở không có BHB), khí máu tĩnh mạch, lactate, anion gap, Na⁺/K⁺, ALTT máu, bù dịch tinh thể đẳng trương và **`[HOLD]` tạm thời SGLT2i** trong khi chờ kết quả; chỉ phát phác đồ truyền cố định `0.1 U/kg/h` và `[STOP]` vĩnh viễn SGLT2i khi đã có bằng chứng ceton (`bloodKetones >= 3.0` hoặc bác sĩ xác nhận ceton niệu `>= 2+` đi kèm toan chuyển hóa `pH < 7.30` / `HCO3- < 18`).
  2. Sửa công thức `isMixedDkaHhs` tại `helpers.ts:295,309`: `const isMixedDkaHhs = hasHhsHyperosmolar && (isDkaCore || hasKetonemia || hasAcidosis);`.

---

### [CRITICAL] `DM2-R3-R1-03` — Cộng dồn 3 loại Insulin gây hạ đường huyết nặng nội viện (Triple-Insulin Stacking) khi bệnh nhân đang dùng Insulin trộn sẵn (`insulin_premix`) tại nhà

- **Loại / Định danh:** `rule` | `dm2.inpatient.basal_bolus_regimen` / `dm2.inpatient.prandial_bolus_regimen` (`src/modules/dm2/rules.inpatient.ts:99-104, 169-203, 246-268, 331-355` & `src/engine/safety/duplicateRules.ts:52-62`)
- **Cơ chế lỗi & thực nghiệm `evaluate()` (`S4`):**
  - Tại Việt Nam, số lượng bệnh nhân ĐTĐ típ 2 ngoại trú dùng **Mixtard 30 (70/30) hoặc NovoMix 30 / Humalog Mix (`insulin_premix`)** nhập viện khoa nội/ngoại là cực kỳ lớn.
  - Khi bệnh nhân nội trú (`60 kg`, `glucose = 12.5 mmol/L`, `inpatientEating = 'normal'`, `currentMeds = [{ drugId: 'insulin_premix', name: 'Mixtard 30', dose: '30 U' }]`) được đánh giá:
    1. `dm2.inpatient.prandial_bolus_regimen` (`rules.inpatient.ts:246`) chỉ `HOLD` `insulin_premix` khi `eatingStatus === 'npo'`. Khi ăn bình thường (`'normal'`), ăn kém (`'poor'`) hoặc ăn qua sonde (`'tube_feeding'`), `insulin_premix` **không hề được `STOP`, `HOLD` hay `SWITCH`**.
    2. `basal_bolus_regimen` (`dòng 169`) thấy `existingLongBasalId === undefined` → phát **`[START] Insulin Glargine 14 U/ngày`**.
    3. `prandial_bolus_regimen` (`dòng 331`) thấy `existingRapidId === undefined` → phát **`[START] Insulin Aspart 4 U x 3 bữa ăn`**.
    4. `checkDuplicates` (`duplicateRules.ts:52-62`) và `rules.safety.dup_hepatic.ts` trả về **`0` cảnh báo trùng lặp (`alerts = []`)**!
  - Bệnh nhân bị dùng đồng thời **Mixtard 30 (30 U) + Glargine (14 U) + Aspart (12 U) = 56 U/ngày (0.93 U/kg/ngày)** — nguy cơ hạ đường huyết nặng nội viện cực cao!
- **Đối chiếu phác đồ gốc:**
  - **ADA Standards of Care 2026 – Section 16** (*Diabetes Care* 2026;49(Suppl. 1):S343, PDF trang 5):
    > *"A prospective randomized inpatient study of 70/30 intermediate-acting (NPH)/regular insulin mixture versus basal-bolus therapy showed comparable glycemic outcomes but **significantly increased hypoglycemia in the group receiving the insulin mixture** (77). Therefore, insulin mixtures such as 75/25, 70/30, or 50/50 insulins are not routinely recommended for in-hospital use."*
  - **QĐ 1353/QĐ-BYT (2021)** trang 1–2: khuyến cáo chuyển đổi từ phác đồ insulin trộn sẵn ngoại trú sang phác đồ Basal-Bolus hoặc Basal-Plus trong thời gian nằm viện.
- **Hướng khắc phục bắt buộc:**
  1. Bổ sung luật `dm2.inpatient.stop_home_premix_for_inpatient_regimen` (`setting: 'inpatient'`, `priority: 97`) trong `rules.inpatient.ts`: luôn phát `[HOLD]` / `[STOP]` `insulin_premix` bất cứ khi nào bệnh nhân nội trú chuyển sang phác đồ Basal-Bolus, Basal-Plus, nuôi ăn sonde hoặc truyền insulin tĩnh mạch.
  2. Bổ sung kiểm tra xung đột giữa `insulin_premix` đang dùng và `basal_insulin` / `prandial_insulin` trong `duplicateRules.ts` (hoặc `rules.safety.dup_hepatic.ts`) để bảo vệ đa tầng.

---

### [MAJOR] `DM2-R3-R1-04` — Ca mẫu số 4 (`dm2_preset_inpatient_dka_emergency`) thiếu `setting: 'inpatient'` khiến giao diện ép nhảy về Ngoại trú

- **Loại / Định danh:** `ui` | `dm2_preset_inpatient_dka_emergency` (`src/modules/dm2/presets.ts:130-163` & `src/ui/AppShell.tsx:88`)
- **Bằng chứng thực nghiệm:**
  - Trong `src/modules/dm2/presets.ts:130-163`, Preset 4 (*"BN 4: Cấp cứu Toan ceton ĐTĐ (DKA) kèm Kali thấp (HOÃN INSULIN - BÙ KALI TRƯỚC)"*) bỏ quên `setting: 'inpatient'` (trong khi Preset 3 tại dòng 99 có khai báo `setting: 'inpatient'`).
  - Trong `src/ui/AppShell.tsx:88`, `applyPresetSelection()` gán `setting: preset.setting ?? 'outpatient'`. Kể cả khi người dùng đang đứng ở tab Nội trú và bấm chọn Preset 4, giao diện vẫn bị ép chuyển về Ngoại trú (`outpatient`), không bao giờ chạy `dm2.inpatient.dka_hhs_emergency` (`rec_dm2_dka_hold_insulin_hypokalemia`) mà lại hiển thị các thẻ mạn tính ngoại trú (`HbA1c < 7.0%`, Statin, huyết áp phòng khám, khám mắt/chân hàng năm)!
- **Hướng khắc phục:** Thêm `setting: 'inpatient'` vào `dm2_preset_inpatient_dka_emergency` tại `src/modules/dm2/presets.ts:135`.

---

### [MAJOR] `DM2-R3-R1-05` — Ba lỗ hổng an toàn Chu phẫu: Bỏ sót giảm 25% Insulin nền nội trú NPO trước mổ, tự ý `START` mới GLP-1 RA sát ngày mổ & thiếu cảnh báo hít sặc phổi khi gây mê

- **Loại / Định danh:** `rule` | `dm2.periop.basal_insulin_reduce` (`src/modules/dm2/rules.periop.ts:185-227`, `rules.inpatient.ts:169-203`, `rules.cardiorenal.glp1.ts:36-295`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  1. **Nội trú NPO trước mổ không giảm 25% insulin nền (`B9b`):** Trái với giải trình tại dòng 48 của `round2_RESPONSE.md` rằng luật chu phẫu đặt `setting: 'both'`, mã thực tế `outpatientPeriopBasalReduceRules` (`rules.periop.ts:189`) chỉ đặt `setting: 'outpatient'`. Khi bệnh nhân ngoại khoa nhập viện đêm trước mổ (`setting: 'inpatient'`, `plannedSurgery: true`, `inpatientEating: 'npo'`, đang tiêm `Insulin Glargine 40 U`), `basal_bolus_regimen` (`rules.inpatient.ts:197`) phát **`[CONTINUE] Duy trì liều đang dùng: 40 U`** (giữ nguyên 100% liều nhà thay vì giảm 20–25% xuống 30–32 U!).
  2. **Tự ý `START` mới GLP-1 RA ngay trước phẫu thuật (`B9a`):** `rules.cardiorenal.glp1.ts` không hề kiểm tra `hasPlannedSurgery(ctx)`, dẫn tới việc phát **`[START] Semaglutide 0.25 mg/tuần`** ngay trước cuộc mổ chương trình — đúng vào thời điểm khởi liều gây chậm làm rỗng dạ dày và buồn nôn mạnh nhất (*ADA 2026 SOC 9*, trang S205, PDF trang 23).
  3. **Thiếu cảnh báo hít sặc phổi khi gây mê cho bệnh nhân đang dùng GLP-1 / GIP-GLP-1 RA (`S7A`, `B9b`):** Ở ngoại trú chỉ in `[CONTINUE] Semaglutide 1 mg` không có bất kỳ cảnh báo gây mê nào; ở nội trú NPO bỏ qua hoàn toàn Semaglutide.
- **Đối chiếu phác đồ gốc:**
  - **ADA Standards of Care 2026 – Section 16** (*Diabetes Care* 2026;49(Suppl. 1):S344, S346–S347, PDF trang 6, 8–9):
    > **Trang S346 (PDF trang 8):** *"Compared with usual dosing, a reduction of **25% of basal insulin dose given the evening before surgery** is more likely to achieve perioperative blood glucose goals with a lower risk for hypoglycemia (149). Insulin dose reductions also include NPH insulin to one-half of the dose or long-acting basal insulin analogs to 75–80% of the dose..."*
    > **Trang S347 (PDF trang 9):** *"FDA added a warning to the label of all GLP-1 RA or dual glucose-dependent insulinotropic polypeptide (GIP) and GLP-1 RA medications about the possibility of **pulmonary aspiration during surgeries or procedures requiring general anesthesia or deep sedation** (156)... In individuals with symptoms suggesting delayed gastric emptying (nausea, vomiting, dyspepsia, or abdominal distension), implementation of full stomach precautions may be considered. A liquid nutrition protocol for 24 h before the procedure may be helpful."*
    > **Trang S344 (PDF trang 6):** *"GLP-1 RA drugs should be held for acutely ill individuals in the hospital setting..."*
- **Hướng khắc phục:**
  1. Áp dụng giảm 20–25% liều insulin nền analog tối trước mổ (50% NPH sáng ngày mổ) cho cả `outpatient` và `inpatient` khi `hasPlannedSurgery(ctx)` là `true`.
  2. Chặn `DEFER` khởi mới GLP-1 / GIP-GLP-1 RA trong `rules.cardiorenal.glp1.ts` và `rules.stepup.ts` khi `hasPlannedSurgery(ctx)` là `true`.
  3. Bổ sung quy tắc chu phẫu/nội viện cho bệnh nhân đang dùng GLP-1 / GIP-GLP-1 RA: `HOLD` khi bệnh nội trú cấp tính/NPO và phát cảnh báo hội chẩn gây mê đánh giá triệu chứng chậm rỗng dạ dày, cân nhắc chế độ ăn lỏng 24h trước mổ và quy trình gây mê "dạ dày đầy" (full-stomach precautions).

---

### [MAJOR] `DM2-R3-R1-06` — Loét bàn chân ĐTĐ tiến triển / hoại thư (`activeFootUlcer: true`) bỏ sót lệnh `STOP` Canagliflozin ở ngoại trú chưa có bệnh tim–thận và ở toàn bộ bệnh nhân nội trú

- **Loại / Định danh:** `rule` | `dm2.outpatient.cardiorenal_sglt2i` (`src/modules/dm2/rules.cardiorenal.sglt2.ts:36-43, 177-196` & `rules.safety.renal.ts:137-170`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - Việc kiểm tra `hasActiveFootUlcer(ctx)` để phát `[STOP] Canagliflozin` hiện chỉ nằm bên trong `dm2.outpatient.cardiorenal_sglt2i` (`rules.cardiorenal.sglt2.ts:177`), vốn chỉ chạy khi `setting === 'outpatient'` **VÀ** `hasHf(ctx) || hasCkd(ctx) || hasAscvd(ctx)` (`dòng 42`).
  - **Ca `B8b` (Ngoại trú ĐTĐ típ 2 đơn thuần, `eGFR = 82`, `UACR = 1.2`, không HF/CKD/ASCVD, `activeFootUlcer: true`, đang dùng `Canagliflozin 100 mg`):** trả về **`0` lệnh `STOP`/`HOLD` cho Canagliflozin** và `0` cảnh báo!
  - **Ca `B8c` (Nội trú nhập viện vì nhiễm trùng/hoại thư bàn chân ĐTĐ `activeFootUlcer: true`, đang dùng `Canagliflozin 100 mg`):** chỉ phát `[HOLD]` nội trú chung chung (ngầm hiểu tái sử dụng khi ra viện) thay vì **`[STOP]` ngừng hẳn Canagliflozin** theo nhãn FDA Invokana Section 5.2 (*PDF trang 7: "Lower limb infections, gangrene, and diabetic foot ulcers were the most common precipitating medical events leading to the need for an amputation... Discontinue INVOKANA if these complications occur"*).
- **Hướng khắc phục:** Tách quy tắc an toàn độc lập `dm2.safety.active_foot_ulcer_canagliflozin_stop` (`setting: 'both'`, `priority: 99`, không phụ thuộc `hasHf/hasCkd/hasAscvd`) đặt trong `rules.safety.contra.ts` hoặc `rules.safety.renal.ts`, đồng thời bổ sung alias `priorAmputation` / `footUlcerOrAmputation` vào `hasActiveFootUlcer(ctx)`.

---

### [MAJOR] `DM2-R3-R1-07` — Chẩn đoán nhầm DKA cổ điển mức `Glucose 11.1–13.8 mmol/L` (`200–249 mg/dL`) thành `Euglycemic DKA`

- **Loại / Định danh:** `rule` | `dm2.inpatient.dka_hhs_emergency` (`src/modules/dm2/helpers.ts:297-300`, `rules.dka.ts:130-132, 197-200`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()` (`B3`):**
  - `helpers.ts:297-300` tính `isEuDka = isDkaCore && glucose < thFor('glucose', 'dm2.dka.dextrose_glucose_threshold_mmol')` (`13.9 mmol/L` = `250 mg/dL`) thay vì `< thFor('glucose', 'dm2.dka.glucose_mmol')` (`11.1 mmol/L` = `200 mg/dL`).
  - Ở ca `B3` (`glucose = 12.8 mmol/L` [`230 mg/dL >= 200 mg/dL`], `pH = 7.20`, `HCO3- = 12`, `BHB = 4.2`, không dùng SGLT2i), hệ thống gắn nhãn sai **`"Phác đồ Cấp cứu Euglycemic DKA"`** và trích dẫn `ada.dm2.2024.eudka_dextrose_start` — trong khi chính câu trích dẫn này ghi rõ *"In euglycemic DKA (glucose <200 mg/dL and positive BOHB)"* (*ADA Consensus 2024*, trang 1262 & 1264, PDF trang 6 & 8)!
- **Hướng khắc phục:** Đặt `isEuDka` theo đúng ngưỡng `< 11.1 mmol/L` (`dm2.dka.glucose_mmol`), và tách riêng điều kiện truyền kèm Dextrose 5–10% ngay từ đầu khi `glucose < 13.9 mmol/L` (`dm2.dka.dextrose_glucose_threshold_mmol`).

---

### [MAJOR] `DM2-R3-R1-08` — 5 mã trích dẫn thai kỳ `fda.*.pregnancy` không tồn tại trong toàn bộ KB + nhiều trích dẫn lệch ngữ cảnh từ Vòng 2 (`DM2-R1-213`) chưa được khắc phục thực chất

- **Loại / Định danh:** `citation` | `fda.semaglutide.pregnancy` & `kb/citations/dm2.json` (`src/modules/dm2/rules.safety.contra.ts:27-33`, `rules.insulin.titrate.ts:208,212`, `rules.cardiorenal.glp1.ts`, `rules.cvrisk.ts:127,170`, `kb/thresholds/dm2.json`)
- **Bằng chứng kiểm định tự động toàn cục:**
  1. **5 mã trích dẫn ma (dangling IDs) khi chạy runtime (`B10`):** Bản đồ `PREGNANCY_CITATIONS` tại `src/modules/dm2/rules.safety.contra.ts:27-33` phát ra 5 mã `'fda.semaglutide.pregnancy'`, `'fda.semaglutide_rybelsus.pregnancy'`, `'fda.dulaglutide.pregnancy'`, `'fda.liraglutide.pregnancy'`, `'fda.tirzepatide.pregnancy'`. Quét toàn bộ 12 tệp `kb/citations/*.json` xác nhận **cả 5 mã này hoàn toàn không tồn tại**.
  2. **Các trích dẫn lệch ngữ cảnh từ `DM2-R1-213` vẫn còn nguyên dù `round2_RESPONSE.md` (dòng 45) báo đã sửa:**
     - `ada.dm2.2026.basal_half_tdd_05` (nguyên văn là liều khởi đầu nhiều mũi cho **Đái tháo đường típ 1**!) vẫn được gắn trực tiếp trên quy tắc Overbasalization ĐTĐ típ 2 (`rules.insulin.titrate.ts:208,212`); còn `kdigo.dm2.2022.t2d_basal_bolus_05` gắn cho `dm2.overbasal.dose_per_kg_max` (`kb/thresholds/dm2.json:451`) lại trích tiêu đề bảng phụ lục `Table S73` so sánh liều basal-bolus nội viện `0.5 vs 0.25 U/kg/d`!
     - `ada.dm2.2026.flow_egfr_15` (nguyên văn là **kết cục chính primary outcome** *"onset of persistent eGFR of <15 mL/min/1.73 m2"* của thử nghiệm FLOW — trong khi tiêu chuẩn nhận bệnh của FLOW là `eGFR 25–75`!) vẫn được gắn để chứng minh ngưỡng khởi trị `dm2.glp1.egfr_min = 15` ở `kb/thresholds/dm2.json:255`, `rules.cardiorenal.glp1.ts` (6 chỗ), `pathway.ts:75`, `matrix.ts:74` và 5 tệp thuốc GLP-1.
     - `ada.dm2.2026.elderly_age_75` (nguyên văn là Rec 10.22–10.23 về **dùng Statin ở người > 75 tuổi**!) vẫn được gắn cho ngưỡng tuổi `dm2.elderly.high_risk_age = 75` về **giảm liều thuốc gây hạ đường huyết** (`kb/thresholds/dm2.json:547`).
     - `ada.dm2.2026.statin_secondary` (`kb/citations/dm2.json:193-201`) mang tên dự phòng thứ phát và gắn cho nhánh ASCVD (`rules.cvrisk.ts:170`), nhưng câu `quote` lại là Rec 10.20 dự phòng **tiên phát** tuổi 40–75 (chưa trích Rec 10.26–10.27 dự phòng thứ phát ASCVD ở trang S224!).
     - `byt.dm2.2020.hba1c_goals` (Bảng 4 ngoại trú) vẫn gắn nhầm cho `dm2.glucose.inpatient_target_max` (`kb/thresholds/dm2.json:55`) và huyết áp (`rules.cvrisk.ts:127`); `byt.dm2.2020.metformin_formulations_p68` (hàm lượng viên) vẫn gắn nhầm cho `dm2.metformin.dose_reduced_max` (`kb/thresholds/dm2.json:186`).
- **Hướng khắc phục:** Bổ sung đầy đủ 5 trích dẫn FDA Section 8.1 Pregnancy vào `kb/citations/dm2.json` (hoặc dùng `ada.dm2.2026.pregnancy_glp1`), nâng cấp `verify:kb` quét mọi chuỗi ID trích dẫn trong `src/modules/**`, và thay thế triệt để 6 nhóm trích dẫn lệch ngữ cảnh nêu trên.

---

### [MAJOR] `DM2-R3-R1-09` — Cổng an toàn chung `vitalAndRenalGates.ts` ghi đè ngược `CONTINUE` → `REDUCE` cho Metformin liều thấp an toàn (`500 mg/ngày`) ở CKD G3b (`eGFR 30–44`)

- **Loại / Định danh:** `rule` | `dm2.outpatient.metformin` (`src/modules/dm2/rules.glycemic.ts:304-310` & `src/engine/safety/vitalAndRenalGates.ts:79-91`)
- **Bằng chứng thực nghiệm (`S5`):**
  - Ở bệnh nhân ngoại trú có `eGFR = 39 mL/phút/1.73m²` (`CKD G3b`), `HbA1c = 6.8%`, đang uống `Metformin 500 mg x 1 lần/ngày`: `rules.glycemic.ts:304-310` đã phát đúng `action: 'CONTINUE'` với tiêu đề *"Tiếp tục duy trì Metformin liều thận trọng (500 mg/ngày) phù hợp CKD G3b"*.
  - Tuy nhiên `src/engine/safety/vitalAndRenalGates.ts:85` chạy hậu kiểm và ép cứng `if (rec.action === 'CONTINUE') rec.action = 'REDUCE'`, tạo ra thẻ khuyến cáo tự mâu thuẫn: **`[REDUCE] — Tiếp tục duy trì Metformin liều thận trọng (500 mg/ngày)`**!
- **Hướng khắc phục:** Trong `vitalAndRenalGates.ts:79-91`, khi `30 <= egfr < 45` và tổng liều Metformin hiện tại đã `<= 1000 mg/ngày`, giữ nguyên `rec.action = 'CONTINUE'` (với lưu ý theo dõi eGFR mỗi 3–6 tháng theo KDIGO 2022 Fig. 3 & ADA 2026 SOC 11/13).

---

### Nhóm Phát Hiện Nhỏ (`Minor`) & Đề Xuất (`Suggestion`)

- **`DM2-R3-R1-10` [Minor | `rule` | `dm2.outpatient.early_insulin`]:** Ở bệnh nhân không có triệu chứng dị hóa (`catabolicSymptoms = false`, `glucose = 12.2 mmol/L`, `HbA1c = 10.3%`, `S9`), hệ thống khởi trị đồng thời ngay trong ngày đầu cả `Insulin Glargine` lẫn `Semaglutide` và gắn cứng tiêu đề *"Tăng đường huyết nặng / Dị hóa cấp"*. Nên bỏ chữ *"Dị hóa cấp"* khi `catabolicSymptoms === false`, đối chiếu ngưỡng `A1C > 10%` của ADA 2026 Fig. 9.5 (PDF trang 16 / S198) và hướng dẫn rõ chiến lược ưu tiên/tuần tự hoặc phối hợp tỷ lệ cố định (FRC).
- **`DM2-R3-R1-11` [Minor | `ui` | `dm2.pathway`]:** `src/modules/dm2/pathway.ts:16-95` vẫn là hằng tĩnh gán cứng `'completed'`, `'active'`, `'upcoming'`, mâu thuẫn với giải trình tại `round2_RESPONSE.md:93` và `docs/modules/DM2.md:36`. Cần đồng bộ lại tài liệu hoặc hỗ trợ hàm tính động theo `RuleContext`.
- **`DM2-R3-R1-12` [Minor | `rule` | `dm2.inpatient.dka_hhs_emergency`]:** Bổ sung khối `profileDiff` (`INTL`, `VN`, `US`) giải thích rõ việc áp dụng ngưỡng an toàn cập nhật `K+ < 3.5 mmol/L` (trì hoãn insulin trong DKA) và `ALTT hữu hiệu > 300 mOsm/kg` (tiêu chuẩn HHS) của Đồng thuận ADA 2024 so với mốc `< 3.3 mmol/L` và `> 320 mOsm/kg` trong QĐ 5481/QĐ-BYT (2020) trang 46–47 (`B5a`/`B5b`).
- **`DM2-R3-R1-13` [Minor | `rule` | `dm2.outpatient.statin_prevention`]:** Tách phân tầng khởi mới Statin dự phòng tiên phát cho người `> 75 tuổi` (ADA 2026 Rec 10.23, Mức C – thảo luận lợi ích/nguy cơ, chỉ dùng cường độ trung bình) và người suy kiệt/kỳ vọng sống ngắn `very_complex` / `limitedLifespan` (thời gian đạt lợi ích của Statin `>= 2.5 năm` theo ADA 2026 SOC 13 trang S285), không gắn chung tiêu đề *"Khuyến cáo thường quy... (Rec 10.18)"* của nhóm 40–75 tuổi (`B12b`).
- **`DM2-R3-R1-14` [Minor | `rule` | `dm2.outpatient.overbasalization`]:** Khi bệnh nhân dùng trùng 2 lọ insulin nền (`Glargine 20 U + Degludec 20 U` trên 72 kg, `B14a`) và `Degludec` đã bị phát lệnh `[STOP]`, hàm `extractBasalInsulinInfo` vẫn cộng tổng `40 U` (`0.56 U/kg`) và cảnh báo quá liều trên nền `Glargine 20 U` (`0.28 U/kg`). Cần tính trên liều insulin nền được giữ lại sau khi ngừng lọ trùng lặp.
- **`DM2-R3-R1-15` [Suggestion | `rule` | `dm2.outpatient.metformin` & `inpatientHoldSglt2iRules`]:** (1) Cân nhắc hạ `START` → `CONSIDER` đối với Metformin ở người mới chẩn đoán không biến chứng đã đạt `HbA1c < 6.5%` và FPG bình thường bằng lối sống (`B15`); (2) Bổ sung ghi chú hướng dẫn tiếp tục/khởi trị lại SGLT2i nội viện trước xuất viện cho bệnh nhân Suy tim đã hồi phục ổn định khỏi bệnh cấp tính theo ADA 2026 Rec 16.11 (Mức A, trang S343).

---

## Phần 4. Ma Trận Kiểm Chứng Thực Nghiệm `evaluate()` Trên Các Kịch Bản Lâm Sàng Trọng Điểm

| Mã kịch bản | Tóm tắt bệnh cảnh lâm sàng & Hồ sơ (`INTL` / `VN` / `US`) | Kết quả `evaluate()` thực tế | Đánh giá Y khoa |
|---|---|---|---|
| **Preset 1–3, 5** | 4 ca mẫu ngoại trú/nội trú chuẩn (`cardiorenal`, `elderly frail`, `inpatient basal-bolus`, `severe A1c 10.8%`) | Giữ đúng `setting`, phát khuyến cáo hợp lý | **ĐẠT** |
| **Preset 4** | Ca mẫu DKA kèm hạ K+ máu `3.1 mmol/L` (`dm2_preset_inpatient_dka_emergency`) | Thiếu `setting: 'inpatient'` → nhảy về `outpatient`, mất lệnh `HOLD insulin_regular` | **LỖI MAJOR (`DM2-R3-R1-04`)** |
| **S2A / S2B / S2C** | BN 76–77 tuổi khỏe mạnh (`HbA1c 9.2%–10.8%`, `FPG 13.5–16.2`) & BN 70 tuổi `complex` (`HbA1c 9.5%`), `recentHypo = false` | Tự động **`[REDUCE] -20%` Glargine** + khóa cứng chỉnh liều và tăng bậc | **LỖI CRITICAL (`DM2-R3-R1-01`)** |
| **B1** | Mixed DKA–HHS (`glucose = 38`, `Na = 149` → `effOsm = 336`, `pH = 7.35`, `HCO3 = 21`, `BHB = 3.6`) | Phân loại nhầm `HHS` đơn thuần → truyền `0.05` thay vì `0.1 U/kg/h` | **LỖI CRITICAL (`DM2-R3-R1-02`)** |
| **B2** | Nhiễm khuẩn/toan chuyển hóa không đo ceton (`glucose = 11.5`, `pH = 7.22`, `HCO3 = 14`, `BHB = undefined`, trên nền Dapagliflozin) | Gán khẳng định `Euglycemic DKA` → truyền `0.1 U/kg/h` + **`STOP` vĩnh viễn Dapagliflozin suốt đời** | **LỖI CRITICAL (`DM2-R3-R1-02`)** |
| **B7** | Tick nghi ngờ `dkaSuspected: true` (`glucose = 13.0`, chưa có pH/HCO3/BHB/ALTT, trên nền Dapagliflozin) | Truyền thẳng Regular insulin `0.1 U/kg/h` + **`STOP` vĩnh viễn Dapagliflozin** | **LỖI CRITICAL (`DM2-R3-R1-02`)** |
| **B3** | DKA cổ điển có `glucose = 12.8 mmol/L` (`230 mg/dL`), `pH = 7.20`, `HCO3 = 12`, `BHB = 4.2` | Gắn nhãn sai `"Euglycemic DKA"` (ngưỡng chuẩn `< 11.1 mmol/L` / `200 mg/dL`) | **LỖI MAJOR (`DM2-R3-R1-07`)** |
| **B4** | Tăng ceton máu đơn độc (`BHB = 3.4`, `pH = 7.38`, `HCO3 = 22`, dùng Empagliflozin) | Phát `[MONITOR]` tầm soát khí máu + `[STOP]` Empagliflozin, không truyền mù 0.1 U/kg/h | **ĐẠT** |
| **B5a / B5b** | DKA kèm `K+ = 3.4 mmol/L` ở hồ sơ `VN` và `INTL` | Đều `[HOLD]` insulin bù K+ an toàn, nhưng thiếu `profileDiff` giải thích mốc 3.3 của BYT | **LỖI MINOR (`DM2-R3-R1-12`)** |
| **B6a / B6b** | Nội trú ICU `glucose = 13.5 mmol/L` khi `K+ = undefined` vs `K+ = 4.1` | `K+ = undefined` → `[HOLD]` fail-closed; `K+ = 4.1` → `[START]` bơm tiêm điện Regular insulin | **ĐẠT** |
| **S4** | Nội trú ăn bình thường đang dùng `Mixtard 30` (`insulin_premix 30 U`), `glucose = 12.5` | Khởi mới `Glargine 14 U` + `Aspart 4 U x 3` chồng lên `Mixtard 30` (`0` lệnh STOP/HOLD, `0` alert) | **LỖI CRITICAL (`DM2-R3-R1-03`)** |
| **S5** | Ngoại trú CKD G3b (`eGFR = 39`), `HbA1c = 6.8%`, đang uống `Metformin 500 mg OD` | Phát `[REDUCE]` nhưng tiêu đề ghi `"Tiếp tục duy trì Metformin 500 mg/ngày"` | **LỖI MAJOR (`DM2-R3-R1-09`)** |
| **S6 & B19** | Quy đổi `bedtimeToMorningDiff = 30 mg/dL` vs `60 mg/dL` trên nền Glargine `0.27 U/kg` | `30 mg/dL` (`1.67 mmol/L`) → `[UPTITRATE]` bình thường; `60 mg/dL` (`3.33 mmol/L`) → báo đúng BeAM cao | **ĐẠT** |
| **S7A / B9a / B9b** | Chu phẫu (`plannedSurgery = true`) ngoại trú & nội trú NPO (`Glargine 40 U`, `Semaglutide`) | Nội trú NPO giữ 100% `40 U`; ngoại trú tự `START` mới Semaglutide trước mổ; 0 cảnh báo hít sặc mê | **LỖI MAJOR (`DM2-R3-R1-05`)** |
| **S8** | Hạ đường huyết cấp (`glucose = 3.2 mmol/L`) đang dùng `Gliclazide` + `Acarbose` | Phát Rule-of-15 dùng **glucose đơn (dextrose)** + khóa toàn bộ khởi trị/tăng liều | **ĐẠT** |
| **B8a / B8b / B8c** | Loét bàn chân ĐTĐ tiến triển (`activeFootUlcer = true`) đang dùng `Canagliflozin 100 mg` | `B8a` (có CKD) → `[STOP]`; **`B8b` (không HF/CKD/ASCVD) → 0 STOP**; **`B8c` (nội trú) → chỉ HOLD tạm** | **LỖI MAJOR (`DM2-R3-R1-06`)** |
| **B10** | Thai kỳ (`pregnant = true`) đang dùng `Metformin + Semaglutide + Glargine` | `[STOP]` Metformin & Semaglutide, giữ Glargine, nhưng phát mã ma `fda.semaglutide.pregnancy` | **LỖI MAJOR (`DM2-R3-R1-08`)** |
| **B11 & B16** | Nuôi ăn sonde liên tục (`tube_feeding`) & Tăng đường huyết do Corticoid (`Prednisolone`) | Chia liều q6h + cảnh báo Dextrose 10% khi tắc sonde; phối hợp NPH sáng + giữ Glargine tối | **ĐẠT** |
| **B13 & S10A/C** | Đột quỵ/TIA, CKD còn albumin niệu (`Finerenone`), đang dùng `Apixaban` | Nhận diện đủ ASCVD từ TIA, gợi ý Finerenone hợp lý, chặn Aspirin khi có Apixaban | **ĐẠT** |
| **B17 & B18** | Lọc máu (`dialysis = true`, nhập nhầm `eGFR = 60`) & Tiền sử viêm tụy cấp (`historyPancreatitis`) | Chặn cứng Metformin/SGLT2i theo lọc máu; `[STOP]` toàn bộ GLP-1 RA + DPP-4i khi viêm tụy | **ĐẠT** |

---

## Phần 5. Danh Mục Hành Động Ưu Tiên Để Đạt `PASS` Ở Vòng Tiếp Theo

1. **Khắc phục ngay 3 lỗi `Critical` (`DM2-R3-R1-01`, `02`, `03`):**
   - Sửa điều kiện `shouldDeintensifyHypoMeds` trong `rules.safety.deintensify.ts`: chỉ giảm liều insulin nền và khóa tăng bậc khi có `recentHypo` hoặc đường huyết/HbA1c nằm dưới ngưỡng an toàn của mục tiêu cá thể hóa; khi đường huyết cao ở người lớn tuổi đang dùng SU thì chuyển đổi (`SWITCH`) sang thuốc ít gây hạ ĐH.
   - Tách riêng thẻ xử trí **Nghi ngờ DKA/HHS chờ xét nghiệm** (`dkaSuspected` hoặc toan chuyển hóa chưa đo ceton) khỏi phác đồ DKA xác định (yêu cầu STAT BHB máu + khí máu + điện giải, chỉ `HOLD` tạm SGLT2i thay vì truyền mù 0.1 U/kg/h và cấm SGLT2i suốt đời); bổ sung `hasKetonemia` vào `isMixedDkaHhs` trong `helpers.ts:295,309`.
   - Phát lệnh `[HOLD]` / `[STOP]` bắt buộc cho `insulin_premix` trong `rules.inpatient.ts` mỗi khi bệnh nhân nội trú chuyển sang phác đồ Basal-Bolus / Basal-Plus / nuôi ăn sonde / truyền tĩnh mạch, kèm chặn trùng lặp `insulin_premix` trong `duplicateRules.ts`.
2. **Khắc phục trọn vẹn 6 lỗi `Major` (`DM2-R3-R1-04` → `09`):**
   - Thêm `setting: 'inpatient'` cho `Preset 4` trong `src/modules/dm2/presets.ts:135`.
   - Áp dụng giảm 20–25% insulin nền trước mổ cho cả nội trú (`setting: 'both'`), chặn `DEFER` khởi mới GLP-1 RA trước mổ và bổ sung cảnh báo nguy cơ chậm rỗng dạ dày / hít sặc phổi khi gây mê.
   - Tách quy tắc độc lập `STOP` `canagliflozin` khi `hasActiveFootUlcer(ctx)` (`setting: 'both'`, không phụ thuộc `hasHf/hasCkd/hasAscvd`).
   - Đổi ngưỡng chẩn đoán `isEuDka` về `< 11.1 mmol/L` (`200 mg/dL`), giữ truyền kèm Dextrose từ `< 13.9 mmol/L` (`250 mg/dL`).
   - Bổ sung hoặc thay thế 5 mã đứt gãy `fda.*.pregnancy` và sửa dứt điểm các trích dẫn lệch ngữ cảnh còn tồn đọng từ `DM2-R1-213`.
   - Giữ nguyên `action: 'CONTINUE'` trong `vitalAndRenalGates.ts` khi liều Metformin ở CKD G3b đã `<= 1000 mg/ngày`.
3. **Hoàn thiện 5 lỗi `Minor` & 1 `Suggestion` (`DM2-R3-R1-10` → `15`)** và bổ sung bộ kiểm thử hồi quy cho đúng các ca `S2A–S2C`, `S4`, `S5`, `Preset 4`, `B1`, `B2`, `B3`, `B7`, `B8b–c`, `B9a–b`, `B10`.
