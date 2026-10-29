# Báo Cáo Thẩm Định Chuyên Khoa Độc Lập — Vòng 2 (Reviewer R1)

- **Mô-đun thẩm định**: `gout` (Bệnh Gút — Cấp tính & Mạn tính / Tăng Acid Uric Máu Có Triệu Chứng)
- **Vai trò phản biện**: **Reviewer R1** — Bác sĩ Chuyên khoa Cơ Xương Khớp & Gút Độc lập (*Guideline & Rheumatology Specialist*)
- **Chế độ thẩm định**: Độc lập – Mù đôi Vòng 2 (*Blind Peer Review*, không tham khảo nhận xét của R2/R3 Vòng 2; chỉ đối chiếu mã nguồn thực tế, kết quả thực thi `evaluate()`, văn bản gốc PDF trong `Medical_Library_2026` và hồ sơ khắc phục Vòng 1)
- **Hệ quy chiếu hướng dẫn & nhãn thuốc đối chiếu nguyên văn**:
  1. **ACR 2020** Guideline for the Management of Gout (*FitzGerald et al., Arthritis Care & Research 2020;72:744–760* — `ACR_2020_Gout_Guideline.pdf`)
  2. **EULAR 2016** Updated Evidence-Based Recommendations for the Management of Gout (*Richette et al., Ann Rheum Dis 2017;76:29–42* — `EULAR_2016_Gout_Recommendations.pdf`)
  3. **KDIGO 2024** Clinical Practice Guideline for the Evaluation and Management of CKD — Section 3.14 Hyperuricemia (`KDIGO_2024_CKD.pdf`)
  4. **Bộ Y tế Việt Nam — QĐ 361/QĐ-BYT (2014)**: Hướng dẫn chẩn đoán và điều trị các bệnh cơ xương khớp — Bài Bệnh Gút & Sử dụng NSAID (`BYT_361_2014_Co_Xuong_Khop_Gout.pdf`)
  5. **Bộ Y tế Việt Nam — QĐ 2388/QĐ-BYT (2024)**: Hướng dẫn chẩn đoán và điều trị Bệnh thận mạn — Mục 4.7 Tăng acid uric máu, Bảng 21 & Bảng 22 (`BYT_2024_CKD.pdf`)
  6. **Nhãn thuốc pháp quy FDA & EMA**: FDA **Colcrys** (`FDA_label_colchicine.pdf`), FDA **Zyloprim** (`FDA_label_allopurinol.pdf`), FDA **Uloric** (`FDA_label_febuxostat.pdf`), FDA **Celebrex** (`FDA_label_celecoxib.pdf`), EMA/ANSM **Desuric — Benzbromarone** (`Desuric_benzbromarone_SmPC.pdf`), EMA **Arcoxia — Etoricoxib** (`Arcoxia_SmPC.pdf`), và kiểm tra chéo tệp `FDA_label_probenecid.pdf` (**Orlynvah**).

---

## 1. Tổng Quan Đánh Giá & Bảng Tổng Hợp Mức Độ Lỗi

Sau Vòng 1, mô-đun `gout` đã có nhiều cải tiến đáng ghi nhận về kiến trúc lâm sàng:
- Đã tách biệt rõ ràng ba hệ hồ sơ hướng dẫn **`VN`** (BYT 361/2014 + BYT 2024 CKD: hoãn mở đầu ULT mới 1–2 tuần sau cơn gút cấp, đích urat `< 320 µmol/L` khi có hạt tophi, viên Colchicine 1 mg), **`INTL`** (EULAR 2016: đích `< 300 µmol/L` khi có tophi/hủy khớp, cảnh báo không duy trì `< 3 mg/dL` kéo dài nhiều năm, tránh Colchicine khi GFR `< 30 mL/phút`) và **`US`** (ACR 2020 / FDA: cho phép khởi trị ULT ngay trong cơn cấp kèm chống viêm, đích `< 6 mg/dL` chuẩn).
- Đã khắc phục lỗi kích hoạt nhầm cơn gút cấp nội viện (`R3-GOUT-04` fail-closed `customInputs.acuteFlare === true`), bổ sung quy tắc chặn trùng lặp 2 thuốc XOI (`allopurinol + febuxostat`), chặn tuyệt đối `azathioprine / 6-MP + XOI`, bổ sung xử trí bệnh nhân không uống được (`NPO` -> Glucocorticoid đường tiêm), chườm đá lạnh bổ trợ, cảnh báo hộp đen tim mạch FDA CARES của Febuxostat, và bảo toàn lợi tiểu quai ở bệnh nhân suy tim.

Tuy nhiên, qua **kiểm định thực thi trực tiếp hàm `evaluate()` trên các kịch bản bệnh nhân biên** kết hợp **đối chiếu từng dòng mã nguồn và từng trang PDF nguyên văn**, Vòng 2 phát hiện **15 vấn đề** — trong đó có **4 lỗi mức `critical`** và **7 lỗi mức `major`** ảnh hưởng trực tiếp tới an toàn người bệnh (kê quá liều/nhầm thuốc do lỗi quy đổi kép đơn vị `mg/dL`, kê chồng liều nạp Colchicine cắt cơn trên nền dự phòng ở bệnh nhân suy thận/suy gan/CYP3A4i, kê trực tiếp Naproxen cho người dị ứng NSAID hoặc bỏ rơi bệnh nhân AERD không có thuốc cắt cơn, duy trì liều độc thận Allopurinol 600 mg ở eGFR 8 mL/phút và Febuxostat 80 mg ở eGFR 18 mL/phút), cùng **2 hạng mục từ Vòng 1 được báo cáo "đã sửa" trong `round1_RESPONSE.md` nhưng thực tế chưa được khắc phục trong mã nguồn/KB** (`R1-GOUT-005` Orlynvah và `R1-GOUT-014` phác đồ phối hợp cắt cơn đa khớp nặng).

| Mức độ nghiêm trọng (Severity) | Số lượng | Mã định danh phát hiện |
| :--- | :---: | :--- |
| **Critical** (Nguy cơ tai biến điều trị / sai lệch phác đồ nghiêm trọng) | **4** | `GOUT-R2-R1-01`, `GOUT-R2-R1-02`, `GOUT-R2-R1-03`, `GOUT-R2-R1-04` |
| **Major** (Sai lệch hướng dẫn lớn / tương tác nặng / lỗ hổng cổng an toàn) | **7** | `GOUT-R2-R1-05`, `GOUT-R2-R1-06`, `GOUT-R2-R1-07`, `GOUT-R2-R1-08`, `GOUT-R2-R1-09`, `GOUT-R2-R1-10`, `GOUT-R2-R1-11` |
| **Minor** (Thiếu sót thứ yếu / lỗi siêu dữ liệu trích dẫn / parser tần suất) | **3** | `GOUT-R2-R1-12`, `GOUT-R2-R1-13`, `GOUT-R2-R1-14` |
| **Suggestion** (Đề xuất tối ưu hóa trải nghiệm & giáo dục người bệnh) | **1** | `GOUT-R2-R1-15` |
| **Tổng cộng** | **15** | **Kết luận bắt buộc theo quy chế (`critical > 0` hoặc `major > 0`): `FAIL`** |

---

## 2. Phân Tích Chi Tiết Các Phát Hiện Mức CRITICAL (4 Phát Hiện)

### `GOUT-R2-R1-01` [CRITICAL] — Lỗi quy đổi kép đơn vị Acid uric (`units.urat === 'mg_dL'`) làm hỏng toàn bộ chiến lược Treat-to-Target và phân tầng chỉ định ULT
- **Vị trí lỗi**: `src/modules/gout/helpers.ts` (`isUrateBelowTarget` dòng 381–383, `isUrateBelowLongTermFloor` dòng 392–395, `assessUltIndication` dòng 456–459 & 481–484) kết hợp `src/engine/evaluate.ts` (dòng 50–58) và `src/engine/units.ts` (dòng 264–266).
- **Cơ chế gây lỗi**:
  1. Khi người dùng chọn đơn vị Acid uric là `mg/dL` (`settings.units.urat === 'mg_dL'`), hàm `normalizePatientUnits()` (`src/engine/units.ts:264-266`) đã nhân `patient.uricAcid` với `59.48` để đổi sang đơn vị chuẩn nội bộ SI `µmol/L` (ví dụ `4.5 mg/dL` $\rightarrow$ `267.7 µmol/L`).
  2. Ngay sau đó, `evaluate()` (`src/engine/evaluate.ts:56-58`) khởi tạo `ctx = { patient: normalized, normalized, derived, settings }` — tức **`ctx.patient.uricAcid` ĐÃ LÀ `µmol/L` (`267.7`), KHÔNG CÒN LÀ `mg/dL`**.
  3. Thế nhưng 4 nhánh logic trong `src/modules/gout/helpers.ts` lại lấy `ctx.patient.uricAcid` đem so sánh trực tiếp với ngưỡng `mg/dL` (`6.0`, `3.0`, `9.0`, `8.0`):
     - `isUrateBelowTarget`: `267.7 < 6` $\rightarrow$ **luôn `false`** với mọi bệnh nhân có sUA $\ge 0.11\text{ mg/dL}$!
     - `isUrateBelowLongTermFloor`: `119.0 < 3` (khi sUA gốc = `2.0 mg/dL`) $\rightarrow$ **luôn `false`**, vô hiệu hóa hoàn toàn cảnh báo hạ acid uric máu quá mức `< 3 mg/dL` của EULAR 2016!
     - `assessUltIndication`: `297.4 > 9` (khi sUA gốc = `5.0 mg/dL`) $\rightarrow$ **luôn `true`** với mọi bệnh nhân có sUA $\ge 0.16\text{ mg/dL}$!
- **Bằng chứng thực thi `evaluate()`**:
  - **Ca X1a** (`profile: 'US'`, `units.urat = 'mg_dL'`, đang dùng `Allopurinol 300 mg/ngày`, `uricAcid = 4.5 mg/dL` — đã kiểm soát rất tốt dưới đích `< 6.0 mg/dL`): Hệ thống phát lệnh **`[UPTITRATE] rec_gout_allopurinol_uptitrate` ("Tăng thêm 100 mg mỗi 2–5 tuần tới đích urat, tối đa 800 mg/ngày")** kèm **`[START] rec_gout_colchicine_prophylaxis` (3–6 tháng)**, ngay phía trên thẻ `[MONITOR] Mục tiêu Acid uric huyết thanh cần đạt và duy trì: < 6 mg/dL`!
  - **Ca X1b** (`profile: 'US'`, `units.urat = 'mg_dL'`, cơn gút đầu tiên nhẹ, không CKD, không sỏi thận, `uricAcid = 5.0 mg/dL` bình thường): Hệ thống kết luận sai **`"Acid uric máu rất cao (> 535 µmol/L [9 mg/dL])"`** và kê oan **`[START] Allopurinol 100 mg/ngày` + `Colchicine dự phòng 3–6 tháng`**, vi phạm trực tiếp **ACR 2020** (`ACR_2020_Gout_Guideline.pdf`, Table 2, PDF p. 8 / tr. 749: *"Initiating ULT is conditionally recommended against in patients experiencing their first flare"*).
  - *Lý do bộ kiểm thử hiện hữu bỏ lọt*: Golden test `gout_40_us_mgdl_unit_boundary_6_0_uptitrate.json` chỉ kiểm tra duy nhất giá trị `uricAcid = 6.0 mg/dL` (vốn mong đợi kết quả `UPTITRATE`), nên phép so sánh sai `356.9 < 6.0 === false` tình cờ cho kết quả trùng khớp!
- **Hướng khắc phục**: Bảo toàn giá trị gốc trước chuẩn hóa (ví dụ `rawPatient` trong `RuleContext` hoặc `uratMgDlToUmolL(targetMgDl)`) thay vì đọc `ctx.patient.uricAcid` như `mg/dL`; bổ sung ngay golden tests ở hệ `mg/dL` cho `sUA = 4.5 mg/dL` (`CONTINUE`), `sUA = 2.2 mg/dL` (`cảnh báo sàn < 3 mg/dL`) và `sUA = 7.5 mg/dL` ở cơn đầu tiên (`DEFER`).

---

### `GOUT-R2-R1-02` [CRITICAL] — Kê liều nạp cắt cơn gút cấp Colchicine chồng trực tiếp lên bệnh nhân đang dùng Colchicine dự phòng kèm suy thận, suy gan hoặc thuốc ức chế CYP3A4
- **Vị trí lỗi**: `src/modules/gout/helpers.safety.ts` (`checkColchicineSafety`, dòng 193–301), `src/modules/gout/rules.flare.ts` (dòng 173–249) và `src/engine/merge.ts`.
- **Đối chiếu nhãn thuốc pháp quy FDA Colcrys (`FDA_label_colchicine.pdf`)**:
  - **Section 2.4 — Drug Interactions (PDF p. 9)**: *"Treatment of gout flares with COLCRYS is **not recommended** in patients receiving prophylactic dose of COLCRYS and CYP3A4 inhibitors."*
  - **Section 2.5 — Renal Impairment (PDF p. 9)**: *"Treatment of gout flares with COLCRYS is **not recommended** in patients with **renal impairment** who are receiving COLCRYS for prophylaxis."*
  - **Section 2.6 — Hepatic Impairment (PDF p. 10)**: *"Treatment of gout flares with COLCRYS is **not recommended** in patients with **hepatic impairment** who are receiving COLCRYS for prophylaxis."*
  - **Section 2.1 — Gout Flares (PDF p. 4, áp dụng cho người chức năng thận–gan bình thường không tương tác thuốc)**: *"Wait 12 hours and then resume the prophylactic dose."*
- **Bằng chứng thực thi `evaluate()`**:
  - Do `checkColchicineSafety()` hoàn toàn không kiểm tra `isOnMed(ctx, ['colchicine'])`, khi bệnh nhân đang uống `Allopurinol 100 mg + Colchicine dự phòng 0.5 mg/ngày` bị bùng phát cơn gút cấp:
    - **Ca A1** (`SCr = 170 µmol/L` $\rightarrow$ `eGFR = 37 mL/phút/1.73m²` CKD G3b): Hệ thống phát **`[CONTINUE] rec_gout_colchicine_acute_flare: dose="1.2 mg ngay khi khởi phát cơn, sau đó 0.6 mg sau 1 giờ" [Đang dùng nền: 0.5 mg]`** thay vì tránh dùng Colchicine cắt cơn và chuyển sang Corticosteroid!
    - **Ca A2** (xơ gan `Child-Pugh B` / `liverDisease: true` đang dùng `Colchicine 0.5 mg/ngày`) và **Ca A3** (đang dùng `Colchicine 0.5 mg/ngày + Fluconazole 200 mg` ức chế vừa CYP3A4): Hệ thống đều kê tiếp liều nạp cắt cơn Colchicine trên nền dự phòng!
    - **Ca A4** (thận–gan bình thường đang dùng `Colchicine 0.5 mg/ngày`): Gộp thẻ mà không dặn bệnh nhân **tạm nghỉ 12 giờ** trước khi uống lại viên dự phòng hàng ngày.
- **Hướng khắc phục**: Trong `checkColchicineSafety(ctx)`, nếu `isOnMed(ctx, ['colchicine'])` kèm `hasRenalImpairment || hasHepaticImpairment || modInhib`, bắt buộc đặt `avoidFlare = true` để chuyển thuốc cắt cơn cấp sang Corticosteroid/NSAID an toàn; nếu thận–gan bình thường và không có CYP3A4i/P-gpi thì ghi rõ hướng dẫn tạm ngừng liều dự phòng 12 giờ sau liều cắt cơn.

---

### `GOUT-R2-R1-03` [CRITICAL] — Bỏ qua tiền sử dị ứng thuốc (`patient.allergies`) với NSAID/Colchicine/Steroid (kê trực tiếp Naproxen cho người dị ứng NSAID) và đẩy bệnh nhân `AERD` vào ngõ cụt mất thuốc cắt cơn
- **Vị trí lỗi**: `src/modules/gout/helpers.safety.ts` (dòng 37–52, 193–301, 304–366), `src/modules/gout/helpers.ts` (dòng 329–335), `src/modules/gout/rules.flare.ts` (dòng 251–286) và `src/modules/gout/rules.prophylaxis.ts` (dòng 222–237).
- **Bằng chứng thực thi `evaluate()`**:
  - **Ca X3 (Dị ứng NSAID)**: Bệnh nhân có `allergies: ["naproxen", "nsaid"]` đang dùng Clarithromycin vào cơn gút cấp $\rightarrow$ Hệ thống phát lệnh **`[START] rec_gout_nsaid_acute_flare: drug=naproxen, dose="500 mg x 2 lần/ngày sau ăn trong 5 ngày"`** với **0 cảnh báo dị ứng**, vi phạm chống chỉ định tuyệt đối của **BYT 361/2014** (tr. 198: *"+ Tiền sử dị ứng, mẫn cảm với thuốc"*). Nguyên nhân do `getAllergyList(ctx)` trong module Gút mới chỉ kiểm tra `allopurinol`, `febuxostat` và `58:01`, còn cổng chung `gates.ts` không quét dị ứng chung cho NSAID/Colchicine/Steroid/Uricosuric.
  - **Ca X2 (Bệnh hô hấp kịch phát do Aspirin/NSAID — `conditions.aerd = true` / tam chứng Samter)**: Bệnh nhân AERD đang dùng Clarithromycin vào cơn gút cấp $\rightarrow$ Do `isNsaidHardContraindicated()` không kiểm tra `aerd`, `rules.flare.ts` chọn `START naproxen` (thay vì rơi xuống `START prednisolone` ở dòng 288); sau đó `organAndCrisisGates.ts` chặn `naproxen` thành `[AVOID]` $\rightarrow$ Bệnh nhân chỉ nhận hai thẻ `[AVOID] colchicine` và `[AVOID] naproxen` mà **không được kê Prednisolone để cắt cơn gút cấp**!
- **Hướng khắc phục**: Đưa kiểm tra dị ứng thuốc từ `getAllergyList(ctx)` và cờ `aerd` vào ngay trong `isNsaidHardContraindicated`, `checkColchicineSafety`, `isSteroidContraindicated`, `isProbenecidContraindicated`, `isBenzbromaroneContraindicated` (đồng thời bổ sung lưới chặn dị ứng tổng quát tại `src/engine/safety/gates.ts`).

---

### `GOUT-R2-R1-04` [CRITICAL] — Duy trì nguyên liều quá liều độc thận nghiêm trọng của Allopurinol (600 mg/ngày ở CKD G5 eGFR 8 mL/phút) và Febuxostat (80 mg/ngày ở CKD G4 eGFR 18 mL/phút)
- **Vị trí lỗi**: `src/modules/gout/rules.ult.ts` (dòng 128–158, 170–221, 339–345) và `src/modules/gout/rules.flare.ts` (`gout.acute_flare.continue_ult`, dòng 330–369).
- **Bằng chứng thực thi `evaluate()` & Đối chiếu hướng dẫn**:
  1. **Ngoài cơn gút cấp (`Ca E1a`)**: Bệnh nhân trên hồ sơ `VN` có `SCr = 520 µmol/L` (**`eGFR = 8 mL/phút/1.73m²`**, suy thận mạn giai đoạn cuối CKD G5) đang uống **`Allopurinol 600 mg/ngày`**, `uricAcid = 290 µmol/L`. Do `gout.allopurinol.uptitrate` kiểm tra `if (belowTarget)` ở dòng 142 **trước khi** kiểm tra chức năng thận (và không có nhánh `REDUCE`), hệ thống phát **`[CONTINUE] rec_gout_allopurinol_continue: "Tiếp tục duy trì Allopurinol ở liều hiện tại"`** — duy trì liều gấp **6 lần** mức tối đa `100 mg/ngày` cho `CrCl < 10 mL/phút` theo nhãn **FDA Zyloprim** (`FDA_label_allopurinol.pdf`, p. 9: *"When the creatinine clearance is less than 10 mL/min, the daily dosage should not exceed 100 mg"*) và **EULAR 2016 Rec 9** (`EULAR_2016_Gout_Recommendations.pdf`, pp. 3, 8), làm tăng vọt nồng độ oxypurinol huyết tương gây hội chứng quá mẫn AHS/DRESS/TEN và suy tủy tử vong.
  2. **Trong cơn gút cấp (`Ca E2` & `Ca X5`)**: Do cả `gout.allopurinol.uptitrate` (dòng 131) và `gout.febuxostat.manage` (dòng 340) đều tắt khi `isAcuteGoutFlare(ctx) === true`, trong khi `gout.acute_flare.continue_ult` (`rules.flare.ts:355-367`) phát cứng `[CONTINUE] ở liều hiện tại`:
     - **Ca E2**: Bệnh nhân `eGFR = 18 mL/phút` đang uống `Febuxostat 80 mg/ngày` vào cơn gút cấp $\rightarrow$ Hệ thống tắt quy tắc giảm liều thận và phát **`[CONTINUE] febuxostat | dose=80 mg | "TIẾP TỤC febuxostat ở liều hiện tại"`**, trái nhãn **FDA Uloric** (`FDA_label_febuxostat.pdf`, Sections 2.2 & 8.6, pp. 1, 10: giới hạn tối đa `40 mg x 1 lần/ngày` khi `CrCl 15–29 mL/phút`).
     - **Ca X5**: Bệnh nhân `eGFR = 8 mL/phút` đang uống `Allopurinol 600 mg/ngày` vào cơn gút cấp $\rightarrow$ Hệ thống phát **`[CONTINUE] allopurinol | dose=600 mg`**.
- **Hướng khắc phục**: Tách quy tắc giảm liều quá trần thận (`REDUCE` Febuxostat về `<= 40 mg/ngày` khi `eGFR/CrCl < 30`; `REDUCE` Allopurinol vượt trần thận/trần tuyệt đối) thành quy tắc an toàn độc lập chạy trước `belowTarget` và chạy cả trong cơn gút cấp (hiệu chỉnh về trần an toàn thận, không ngừng đột ngột hoàn toàn), đồng thời chặn `gout.acute_flare.continue_ult` phát thẻ `CONTINUE` trùng lặp khi thuốc đó đã có lệnh `REDUCE`.

---

## 3. Phân Tích Chi Tiết Các Phát Hiện Mức MAJOR (7 Phát Hiện)

### `GOUT-R2-R1-05` [MAJOR] — Xung đột đa mô-đun trên ca mẫu số 1 (`gout_preset_acute_monoarthritis_ckd` ở hồ sơ `INTL` & `US`) tự gây `[ALERT:critical] ix.statin_colchicine` và tự mâu thuẫn liều `0.6 mg` vs `0.5 mg`
- Chạy `evaluate()` trực tiếp trên `gout_preset_acute_monoarthritis_ckd` (`selectedModules: ['gout', 'ckd']`, `SCr = 150 µmol/L` $\rightarrow$ `eGFR = 45 mL/phút`, `acuteFlare: true`) ở hồ sơ `INTL` và `US`:
  - Module `ckd` khởi trị `[START] Atorvastatin 20 mg`, còn module `gout` khởi trị `[START] Allopurinol <= 50 mg` + `[START] Colchicine dự phòng` ngay giữa cơn gút cấp (cùng lúc đã kê Corticosteroid cắt cơn), làm bộ kiểm tra tương tác thuốc phát nổ **`[ALERT:critical] ix.statin_colchicine` ("Tránh phối hợp ở bệnh nhân có suy thận hoặc suy gan. Phát hiện: atorvastatin, colchicine")**!
  - Đồng thời trên hồ sơ `US` (`src/modules/gout/rules.prophylaxis.ts:180-185`), thẻ `rec_gout_colchicine_prophylaxis` kê liều **`0.6 mg x 1 lần/ngày`** nhưng dòng cảnh báo ngay bên dưới lại ghi cứng **`"Giới hạn liều dự phòng tối đa 0.5 mg/ngày"`** — tự mâu thuẫn trực tiếp trên cùng một thẻ khuyến cáo.

### `GOUT-R2-R1-06` [MAJOR] — Thiếu tương tác xuất huyết nặng `Benzbromarone + Warfarin` (ức chế mạnh CYP2C9) và bỏ sót suy gan khi truyền `patient.childPugh`
- **Tương tác Benzbromarone + Kháng Vitamin K**: Theo tờ thông tin sản phẩm Châu Âu **`Desuric_benzbromarone_SmPC.pdf` (Section 4.5, p. 2)**: *"Anticoagulants oraux : Augmentation de l’effet anticoagulant oral et du risque hémorragique. Contrôle plus fréquent du taux de prothrombine et surveillance de l’INR. Adaptation de la posologie de l’anticoagulant oral..."* (Benzbromarone ức chế mạnh CYP2C9 làm tăng vọt INR và nguy cơ xuất huyết nặng). Tuy nhiên `kb/drugs/benzbromarone.json:31` để trống `"interactions": []`, và chạy `evaluate()` ca `Benzbromarone 100 mg + Warfarin 5 mg` (`Ca X4`) cho ra **`Alerts (0)`**!
- **Bỏ sót `patient.childPugh`**: Khi bệnh nhân có `childPugh: 'B'` hoặc `'C'` mà không gắn thêm cờ boolean `conditions.liverDisease` (`Ca X6`), `hasCondition(ctx, 'liverDisease')` trả về `false` — làm bỏ lọt hoàn toàn lệnh ngừng/giảm liều **Etoricoxib 120 mg/ngày** trên xơ gan Child-Pugh B (`Arcoxia_SmPC.pdf` pp. 2–3: tối đa `30 mg cách ngày` ở Child-Pugh 7–9, chống chỉ định ở Child-Pugh $\ge 10$), bỏ lọt chống chỉ định suy gan của **Benzbromarone** (`helpers.safety.ts:169`), và bỏ lọt chống chỉ định **Colchicine + CYP3A4i vừa / Statin** trên nền suy gan (`helpers.safety.ts:239, 272`).

### `GOUT-R2-R1-07` [MAJOR] — Trường `flareHoursSinceOnset` bị bỏ quên khỏi `inputs.ts` (dead code) và thiếu phác đồ phối hợp thuốc cho cơn gút cấp nặng đa khớp (báo cáo sai trong `round1_RESPONSE.md` mục `R1-GOUT-014`)
- `src/modules/gout/rules.flare.ts:169` đọc `ctx.normalized.customInputs?.flareHoursSinceOnset` để tránh kê Colchicine khi cơn cấp đã quá 36 giờ, nhưng `src/modules/gout/inputs.ts` **không hề khai báo trường này**, khiến UI không thể nhập giờ khởi phát (vi phạm nguyên tắc dùng sớm trong 12 giờ đầu của **EULAR 2016 Rec 1**, p. 3).
- Hơn nữa, `docs/reviews/gout/round1_RESPONSE.md` (dòng 58, mục `R1-GOUT-014`) ghi nhận đã bổ sung hướng dẫn phối hợp kháng viêm cho cơn gút cấp đa khớp nặng vào `pathway.ts` Step 2, nhưng kiểm tra toàn văn `src/modules/gout/pathway.ts` và `rules.flare.ts` xác nhận **hoàn toàn chưa có** nội dung phối hợp `Colchicine + NSAID` hoặc `Colchicine + Corticosteroid` (và cảnh báo **tránh phối hợp NSAID + Corticosteroid toàn thân** do độc tính tiêu hóa hiệp đồng) theo **EULAR 2016 Rec 2 / Fig 1** (`EULAR_2016_Gout_Recommendations.pdf`, pp. 3–5) và **ACR 2020 PICO 30** (p. 13).

### `GOUT-R2-R1-08` [MAJOR] — Vẫn tiếp tục trích dẫn nhãn kháng sinh tiết niệu **ORLYNVAH (`sulopenem + probenecid`)** cho Probenecid dù `round1_RESPONSE.md` (`R1-GOUT-005`) báo cáo đã gỡ bỏ; gán sai nguồn Etoricoxib HA `> 140/90 mmHg`
- Kiểm tra nguyên văn `Medical_Library_2026/09_Nhan_Thuoc/FDA/FDA_label_probenecid.pdf` trang 1 xác nhận đây là thuốc kháng sinh phối hợp **`ORLYNVAH (sulopenem etzadroxil and probenecid)`** dùng 5 ngày cho nhiễm khuẩn tiết niệu không biến chứng ở phụ nữ, có Mục 5.4 cảnh báo **`"Exacerbation of Gout"`**! Dù `round1_RESPONSE.md` tuyên bố đã xóa, hiện tại `kb/sources.json` (`fda_probenecid`), `kb/citations/gout.json:957-973`, `src/modules/gout/rules.prophylaxis.ts:35, 53`, `kb/drugs/probenecid.json:37, 45` và `kb/citations/interactions.json` vẫn đang trích dẫn trực tiếp tệp Orlynvah này.
- Đồng thời, chống chỉ định Etoricoxib khi HA `> 140/90 mmHg` tại `helpers.safety.ts:348-351` và `kb/drugs/etoricoxib.json` đang gắn sai vào `byt.gout.2014.nsaid_dosing_p201` (trang 201 BYT 361/2014 không hề có mốc `140/90 mmHg`), trong khi tờ SmPC chính thống **`Arcoxia_SmPC.pdf` (p. 3)** có sẵn trong `09_Nhan_Thuoc/EMA/` lại chưa được đăng ký vào `kb/sources.json`.

### `GOUT-R2-R1-09` [MAJOR] — Sàng lọc gen `HLA-B*58:01` bị hỏng hai chiều trên hồ sơ `US` (không thể kích hoạt từ UI cho người gốc Đông Nam Á & người Mỹ gốc Phi) và `INTL` (kích hoạt đại trà vô điều kiện)
- Tại `src/modules/gout/rules.safety.ult.ts:139-140`, điều kiện `return isSea || ctx.settings.profile === 'INTL'`:
  - Trên hồ sơ **`US`**: Do `inputs.ts` không có trường `southeastAsianDescent` cũng như `africanAmericanDescent`, quy tắc sàng lọc `HLA-B*58:01` (`Ca G1`) **không bao giờ kích hoạt được từ giao diện**, bỏ sót khuyến cáo của **ACR 2020** (`ACR_2020_Gout_Guideline.pdf`, Table 3 / PICO 12, p. 10: khuyến cáo xét nghiệm cho cả **người gốc Đông Nam Á** lẫn **người Mỹ gốc Phi — African American**).
  - Trên hồ sơ **`INTL`**: Kích hoạt xét nghiệm `HLA-B*58:01` đại trà cho 100% bệnh nhân (`Ca G2`), mâu thuẫn với cả **EULAR 2016** (p. 8: không sàng lọc đại trà quần thể Châu Âu tỷ lệ lưu hành thấp) và **ACR 2020** (p. 10: khuyến cáo chống sàng lọc đại trà ở các chủng tộc nguy cơ thấp).

### `GOUT-R2-R1-10` [MAJOR] — Nhánh chạm trần Allopurinol trên bệnh nhân có bệnh tim mạch (`ASCVD`/`HF`) gợi ý sai "phối hợp Uricosuric / Pegloticase" ở `eGFR = 15 mL/phút`, và thiếu hội chẩn thoát hiểm khi bệnh nhân lọc máu không dung nạp cả 2 thuốc XOI
- Ở `Ca E1b` (`profile: 'VN'`, `eGFR = 15 mL/phút`, đang dùng `Allopurinol 200 mg/ngày`, `sUA = 460 µmol/L`, kèm `ASCVD`), `rules.ult.ts:184-221` chặn Febuxostat và phát ngay `[REFER] rec_gout_pegloticase_refractory` (*"Hội chẩn xét Pegloticase hoặc phối hợp Uricosuric"*), trong khi Uricosuric **chống chỉ định tuyệt đối ở `eGFR = 15`**, Pegloticase không sẵn có thường quy tại Việt Nam, và theo **ACR 2020** (pp. 8–12) bệnh nhân vẫn có thể chuẩn độ thận trọng Allopurinol từng bậc nhỏ `≤ 50 mg` hoặc chia sẻ quyết định dùng Febuxostat `≤ 40 mg` trước khi xét Pegloticase.
- Ngược lại, ở `Ca F2` (bệnh nhân lọc máu `onDialysis: true`, dị ứng cả Allopurinol và Febuxostat), `selectUltInitDrug` trả về `'none'` nhưng không có quy tắc `REFER` hội chẩn chuyên khoa Khớp – Thận nhân tạo, để trống hoàn toàn hướng xử trí ULT.

### `GOUT-R2-R1-11` [MAJOR] — Kê đơn `Prednisolone` dự phòng kéo dài 3–6 tháng ngay cả khi bệnh nhân đang có nhiễm trùng tiến triển (`activeInfection`), `DKA` hoặc chống chỉ định Corticosteroid (`steroidContraindicated`)
- Khác với `rules.flare.ts:85-135` (kiểm tra chặt `isSteroidContraindicated`, `hasActiveInfection`, `isDkaSuspected`), nhánh cuối của `gout.prophylaxis.flare` (`src/modules/gout/rules.prophylaxis.ts:239-256`) phát thẳng `[START] Prednisolone ... trong 3–6 tháng` mà **không kiểm tra chống chỉ định của Corticosteroid**, gây nguy cơ bùng phát nhiễm khuẩn huyết / nấm xâm lấn hoặc mất bù đường huyết cấp.

---

## 4. Các Phát Hiện Mức MINOR (3) & SUGGESTION (1)

1. **`GOUT-R2-R1-12` [MINOR] — Chưa rà soát đổi lợi tiểu quai dùng hạ áp đơn thuần (không suy tim / không phù)**: `LOOP_DIURETIC_DRUG_IDS` đã khai báo ở `helpers.ts:185` nhưng `rules.concurrent.ts` chưa có thẻ `CONSIDER` nhắc cân nhắc đổi lợi tiểu quai sang Losartan/CCB khi bệnh nhân dùng để hạ áp đơn thuần không kèm suy tim/phù theo **EULAR 2016 Rec 11** (p. 3).
2. **`GOUT-R2-R1-13` [MINOR] — Lỗi siêu dữ liệu trang in & chuỗi trích dẫn bảng trong `kb/citations/gout.json`**: `acr.gout.2020.against_fenofibrate_switch` ghi `printedPage: "34"` (bản thảo NIHMS) lệch hệ quy chiếu với 34 trích dẫn ACR 2020 còn lại (`"747"–"758"`); hai trích dẫn `byt.ckd.2024.gout_ult_table21` và `byt.ckd.2024.gout_flare_table22` nối nhảy ô bảng làm trượt `verifyCitation`; `rec_gout_urate_target_monitor` đính cứng trích dẫn mục tiêu tophi EULAR/BYT trên hồ sơ `US`.
3. **`GOUT-R2-R1-14` [MINOR] — `parseMedDailyDoseMg` bỏ sót các ký hiệu tần suất phổ biến (`2 lần/ngày` không có chữ `x`, `q12h`, `q8h`, `qid`, `cách ngày`/`q48h`)**: Làm bỏ sót cảnh báo vượt trần liều ngày của Colchicine/Probenecid/ULT khi người dùng nhập tần suất không có tiền tố `x`.
4. **`GOUT-R2-R1-15` [SUGGESTION] — Bổ sung tư vấn chiến lược *"thuốc cắt cơn mang sẵn bên người (pill-in-the-pocket)"***: Nhắc người bệnh luôn chuẩn bị sẵn thuốc cắt cơn cá thể hóa để uống ngay khi có triệu chứng báo hiệu đầu tiên theo **EULAR 2016 Rec 1** (p. 3) và **ACR 2020** (p. 14).

---

## 5. Đối Chiếu Hồ Sơ Khắc Phục Vòng 1 (`round1_RESPONSE.md`)

| Hạng mục Vòng 1 | Tuyên bố trong `round1_RESPONSE.md` | Kết quả kiểm định độc lập Vòng 2 |
| :--- | :--- | :--- |
| Khóa an toàn `acuteFlare` nội viện (`R3-GOUT-04`) | Đã sửa fail-closed | **ĐẠT** — `isAcuteGoutFlare` chỉ bật khi `customInputs.acuteFlare === true` (`gout_33` pass). |
| Chặn trùng lặp 2 XOI & chặn Azathioprine + XOI | Đã bổ sung luật `STOP`/`AVOID` | **ĐẠT** — Hoạt động chính xác trên cả Allopurinol và Febuxostat (`gout_21`, `gout_22`, `gout_31`). |
| Quy đổi đơn vị `mg/dL` tại biên `6.0 mg/dL` | Đã sửa so sánh theo đơn vị gốc | **KHÔNG ĐẠT (`GOUT-R2-R1-01` — CRITICAL)** — Đọc nhầm `ctx.patient.uricAcid` đã chuẩn hóa sang `µmol/L`, gây lỗi quy đổi kép cho toàn bộ bệnh nhân dùng đơn vị `mg/dL`! |
| Gỡ bỏ nhãn kháng sinh Orlynvah (`R1-GOUT-005`) | Đã gỡ bỏ Orlynvah | **KHÔNG ĐẠT (`GOUT-R2-R1-08` — MAJOR)** — `kb/sources.json`, `kb/citations/gout.json`, `probenecid.json` và `rules.prophylaxis.ts` vẫn trích dẫn Orlynvah! |
| Hướng dẫn phối hợp thuốc cho cơn gút đa khớp nặng (`R1-GOUT-014`) | Đã thêm vào `pathway.ts` Step 2 | **KHÔNG ĐẠT (`GOUT-R2-R1-07` — MAJOR)** — Không tồn tại trong cả `pathway.ts` lẫn `rules.flare.ts`. |

---

## 6. Kết Luận Thẩm Định Vòng 2

Mô-đun `gout` có nền tảng cấu trúc tốt nhưng hiện còn tồn tại **4 lỗi mức `critical`** và **7 lỗi mức `major`** về an toàn kê đơn, quy đổi đơn vị xét nghiệm, tương tác thuốc xuất huyết/tiêu cơ vân và độ trung thực nguồn trích dẫn pháp quy. Cần khắc phục triệt để toàn bộ 11 phát hiện `critical`/`major` kèm kiểm thử hồi quy đầy đủ trước khi đưa vào sử dụng lâm sàng.

Verdict: FAIL
