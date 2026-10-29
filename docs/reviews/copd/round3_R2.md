# Báo Cáo Kiểm Định Độc Lập Vòng 3 – Reviewer R2 (Dược Lâm Sàng Hô Hấp & Nhãn Thuốc)
## Phân hệ: Bệnh Phổi Tắc Nghẽn Mạn Tính (`copd`) – GDMT-VN

- **Reviewer**: R2 – Chuyên gia Dược lâm sàng Hô hấp & Kiểm toán Nhãn thuốc (Independent Clinical Respiratory Pharmacist & Drug Label Auditor)
- **Vòng kiểm định**: Round 3 (Hậu kiểm toàn diện khắc phục Vòng 2 + Kiểm định đối kháng dược lâm sàng chuyên sâu trước phát hành)
- **Ngày thực hiện**: 27/10/2026
- **Cam kết độc lập nội vòng**: Thực hiện hoàn toàn độc lập theo `docs/REVIEW_PROTOCOL.md`; tuyệt đối không đọc, liệt kê hay tham chiếu bất kỳ tệp Vòng 3 nào của Reviewer R1 hoặc R3; không chỉnh sửa bất kỳ tệp nào trong `src/`, `kb/`, `tests/`, `tools/`.
- **Phạm vi & Phương pháp kiểm định Vòng 3**:
  1. **Hậu kiểm 100% phát hiện Vòng 2 của R2** (`COPD-R2-201` → `COPD-R2-211` trong `docs/reviews/copd/round2_R2.json`) và kiểm chứng chéo toàn bộ tuyên bố khắc phục trong `docs/reviews/copd/round2_RESPONSE.md` trực tiếp trên mã nguồn thực tế.
  2. **Kiểm toán 100% mã nguồn phân hệ `copd` sau tái cấu trúc & liên thông đa bệnh**:
     - `src/modules/copd/{index.ts, inputs.ts, helpers.ts, rules.ts, rules.safety.ts, rules.initial.ts, rules.followup.ts, rules.escalation.ts, rules.inpatient.ts, matrices.ts, pathways.ts, presets.ts}`
     - Tầng Engine & đa mô-đun liên đới: `src/engine/{evaluate.ts, merge.ts, types.ts}`, `src/engine/safety/{gates.ts, duplicates.ts, interactions.ts, reviewMeds.ts}`, `src/modules/hf/rules.hfref.ts`, `src/kb-types/{index.ts, access.ts, interactions.ts}`.
  3. **Kiểm toán tự động toàn bộ 26 tệp `DrugEntry` Hô hấp – Steroid – Chẹn beta** (19 tệp COPD chuyên biệt + 7 tệp dùng chung `salbutamol`, `ipratropium`, `prednisolone`, `methylprednisolone`, `budesonide_formoterol`, `fluticasone_salmeterol`, `fluticasone_vilanterol`, cùng `carvedilol`, `sotalol`): kiểm tra `fmtDose()`, `renalBand()` tại 5 mốc `eGFR = 5 / 12 / 25 / 45 / 90 mL/phút/1.73m²`, `pregnancy`, `lactation`, `contraindications`, `qtRisk`, `vnBrands` và `citationIds`.
  4. **Xác thực nguyên văn 100% trích dẫn gốc (`Medical_Library_2026`)**:
     - Chạy công cụ đối khớp văn bản PDF chuẩn trên toàn bộ **74/74 trích dẫn** trong `kb/citations/copd.json` (`docs/reviews/copd/scratch/r2_source_verification.ts`) và trích xuất trực tiếp văn bản gốc từ `GOLD_2026_Report.pdf`, `BYT_2131_COPD_2026.pdf`, `GINA_2026_Report.pdf`, `ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf`, `FDA_label_carvedilol.pdf`, `FDA_label_roflumilast.pdf`, `FDA_label_budesonide_glycopyrronium_formoterol.pdf`, `Ultibro_Breezhaler_SmPC.pdf`, `Trimbow_SmPC.pdf`.
  5. **Thực thi 36 kịch bản kiểm thử động trên pipeline `evaluate()` thực tế** (`docs/reviews/copd/scratch/r2_round3_audit.ts`, `r2_round3_audit_batch2.ts`, `r2_round3_audit_batch3.ts`): bao phủ đa bệnh `['hf', 'copd']`, glôcôm góc đóng / bí tiểu, dị ứng đạm sữa bò, tương tác CYP3A4 / QT, đợt cấp nội viện dùng `Methylprednisolone`, suy gan `Child-Pugh A/B/C`, thai kỳ / cho con bú, và toàn bộ 5 `copdPresets` chính thức.

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM ĐỊNH VÒNG 3 & PHÁN QUYẾT

| Mức độ nghiêm trọng (Severity) | Số lượng | Mã phát hiện | Tóm tắt trọng tâm dược lâm sàng & an toàn người bệnh |
|---|:---:|---|---|
| **CRITICAL** (Nguy cơ gây hại trực tiếp / tử vong) | **1** | `COPD-R3-R2-01` | **Đứt gãy trụ cột Chẹn beta ở bệnh nhân đồng mắc HFrEF + COPD đang dùng Carvedilol**: Trái ngược trực tiếp với tuyên bố tại `round2_RESPONSE.md` (dòng 226), `NON_SELECTIVE_BB_IDS` vẫn chứa `'carvedilol'` và phát lệnh cứng `STOP carvedilol` (`priority: 97`). Khi chạy đa bệnh `['hf', 'copd']`, `STOP` (`ACTION_PRIORITY = 105`) đè bẹp hoàn toàn `UPTITRATE`/`CONTINUE carvedilol` của `hf.fmt.bb` mà không có lệnh `SWITCH`/`START` sang `bisoprolol`/`metoprolol_succinate`, gây **ngừng đột ngột chẹn beta** và **làm mất trắng 1 trong 4 trụ cột cứu sống của HFrEF**. |
| **MAJOR** (Sai lệch guideline / nhãn thuốc / mất thuốc nền / bỏ lọt DDI chống chỉ định) | **6** | `COPD-R3-R2-02`<br>`COPD-R3-R2-03`<br>`COPD-R3-R2-04`<br>`COPD-R3-R2-05`<br>`COPD-R3-R2-06`<br>`COPD-R3-R2-07` | - **`COPD-R3-R2-02`**: Chuỗi 4 lỗi liên hoàn ở nhánh kháng cholinergic (`narrowAngleGlaucoma` / `urinaryRetention`): (1) không có trường nhập trên UI (`inputs.ts`) → mã chết; (2) kê nhầm liều cắt cơn AIR của Hen Bậc 1–2 (`1 nhát x khi cần`) cho COPD Nhóm E nặng; (3) bỏ trống `0` thuốc giãn phế quản khi tái khám/xuất viện; (4) vẫn gợi ý khí dung `Salbutamol ± Ipratropium` không cảnh báo glôcôm do mặt nạ.<br>- **`COPD-R3-R2-03`**: Bỏ lọt hoàn toàn cảnh báo tương tác **Chống chỉ định** (BYT QĐ 2131/2026 Phụ lục 11 STT 34) giữa `salmeterol` đơn chất / `umeclidinium_vilanterol` (`Anoro Ellipta`) + `clarithromycin`/`erythromycin`/`voriconazole`/`posaconazole` (`0` alert!).<br>- **`COPD-R3-R2-04`**: `copd.inpatient.systemic_steroid` chỉ kiểm tra `prednisolone`/`prednisone`, bỏ qua `methylprednisolone` (`Medrol`/`Solu-Medrol`), gây lệnh chồng nghịch lý `SWITCH: Ngừng Methylprednisolone để thay bằng Prednisolone / Methylprednisolone` + báo động giả `CRITICAL dup.systemic_steroid` và nguy cơ suy thượng thận cấp.<br>- **`COPD-R3-R2-05`**: Lỗ hổng bảo vệ phản vệ đạm sữa bò (lactose DPI): bỏ sót `Seretide Accuhaler`, `Symbicort Turbuhaler`, `fluticasone_vilanterol.json`, gợi ý nhầm `Spiriva HandiHaler 18 mcg` DPI, và `STOP Trelegy` nội viện nhưng bỏ trống `0` thuốc xuất viện.<br>- **`COPD-R3-R2-06`**: Thiếu hoàn toàn lệnh `CONTINUE` cho mọi thuốc hít ngoài bộ ba (`lama_mono`, `laba_mono`, `laba_lama`, `ics_laba` — kể cả trên chính Preset chính thức `copd_preset_followup_roflumilast`) và thiếu `azithromycin_continue` / `biologic_continue` (dù `round2_RESPONSE.md` dòng 109–110 ghi đã bổ sung).<br>- **`COPD-R3-R2-07`**: Mâu thuẫn phân tầng suy gan `Child-Pugh A` trên Roflumilast (tích kèm `liverDisease` bị chặn sai là Child-Pugh B/C; không tích thì mất sạch cảnh báo tăng 51% AUC) và không thực thi `roflumilast.lactation = 'avoid'` ở phụ nữ cho con bú. |
| **MINOR** (Rà soát an toàn phụ / siêu dữ liệu KB) | **2** | `COPD-R3-R2-08`<br>`COPD-R3-R2-09` | - **`COPD-R3-R2-08`**: Phối hợp định kỳ SAMA (`ipratropium`) + LAMA không cảnh báo trùng kháng cholinergic; `theophylline 600 mg/ngày` trên nền xơ gan `Child-Pugh C` hoặc đợt cấp không có khuyến cáo giảm liều / ngừng / theo dõi TDM.<br>- **`COPD-R3-R2-09`**: 16/19 tệp thuốc COPD thiếu trường `lactation`; `Trelegy` và `Breztri` thiếu ghi chú tăng phơi nhiễm ICS 2.5–3 lần ở suy gan Child-Pugh B/C; lặp đôi citation `'byt.copd.2026.triple_therapy_indication'` tại 8 vị trí trong `rules.followup.ts`. |
| **SUGGESTION** (Tối ưu tư vấn lâm sàng đặc thù) | **1** | `COPD-R3-R2-10` | Bổ sung lưu ý hội chẩn Sản – Hô hấp khi gợi ý `CONSIDER` khởi trị mới `azithromycin` dự phòng 1 năm hoặc thuốc sinh học (`dupilumab`, `mepolizumab`) trên thai phụ mắc COPD nặng. |
| **TỔNG CỘNG** | **10** | `COPD-R3-R2-01` → `10` | Chi tiết chuẩn hóa JSON tại `docs/reviews/copd/round3_R2.json`. |

### PHÁN QUYẾT THẨM ĐỊNH VÒNG 3 (FINAL VERDICT): **FAIL**
*(Theo tiêu chuẩn nghiêm ngặt tại `docs/REVIEW_PROTOCOL.md`, phân hệ chỉ được cấp `PASS` khi đạt đồng thời `0 critical` và `0 major`. Dù đợt khắc phục Vòng 2 đã giải quyết rất tốt nhiều vấn đề nền tảng như dải thận `eGFR 0 → ∞`, toàn vẹn 74/74 trích dẫn nguyên văn và cơ chế fail-closed phế dung kế, việc tích hợp các quy tắc an toàn mới đã phát sinh 1 lỗi mức **Critical** gây mất trụ cột chẹn beta trong HFrEF và còn tồn đọng/hồi quy **6 lỗi Major** cần khắc phục dứt điểm).*

---

## 2. HẬU KIỂM 100% PHÁT HIỆN VÒNG 2 CỦA R2 & ĐỐI CHIẾU `round2_RESPONSE.md`

### 2.1. Bảng hậu kiểm 11 phát hiện Vòng 2 của Reviewer R2 (`COPD-R2-201` → `COPD-R2-211`)

| Mã Vòng 2 | Mức độ V2 | Nội dung phát hiện Vòng 2 | Trạng thái Vòng 3 | Kết quả kiểm chứng độc lập trên mã nguồn & Runtime Vòng 3 |
|---|:---:|---|:---:|---|
| `COPD-R2-201` | Critical | Hồi quy `START` → `CONTINUE` làm mất liều cấp cứu của `salbutamol` & `prednisolone` nội viện. | ⚠️ **SỬA MỘT PHẦN (CÒN LỖ HỔNG MAJOR)** | Đã đổi sang `UPTITRATE` chính xác cho `salbutamol` và `prednisolone` (`rules.inpatient.ts` dòng 175, 220) và giữ `curMed.unit` trong `merge.ts`. **Tuy nhiên** quy tắc bỏ quên hoàn toàn `methylprednisolone` (`Medrol`/`Solu-Medrol`), gây lệnh `SWITCH` nghịch lý và báo động giả `dup.systemic_steroid` → **`COPD-R3-R2-04`**. |
| `COPD-R2-202` | Major | Trích dẫn bị cắt xén của `ix.roflumilast_theophylline`, mâu thuẫn nội tại và thiếu tương tác CYP3A4 của Roflumilast. | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | `ix.roflumilast_theophylline` đã chỉnh về `severity: 'major'` với quote chuẩn FDA §14.1; bổ sung đầy đủ `ix.roflumilast_strong_cyp3a4_inducers` (`contraindicated`, BYT 2131 STT 35) và `ix.roflumilast_cyp_inhibitors` (`major`), đồng bộ với `getRoflumilastContraReasons(ctx)` (kiểm chứng kịch bản `B2_5c`, `B2_5d`). |
| `COPD-R2-203` | Major | 4 quy tắc `CONSIDER` ngoại trú không kiểm tra `currentMeds` (lùi liều Roflumilast về 250 mcg, chồng 2 sinh học). | ⚠️ **SỬA MỘT PHẦN (SAI LỆCH BÁO CÁO)** | Đã chặn sinh lại `CONSIDER`, chặn chồng 2 kháng thể đơn dòng (`hasAnyRespiratoryBiologic`) và thêm `roflumilast_continue` (`500 mcg/ngày`). **Tuy nhiên**, trái với tuyên bố tại `round2_RESPONSE.md` (dòng 109–110), hai quy tắc `azithromycin_continue` và `biologic_continue` **không hề tồn tại trong mã nguồn** → **`COPD-R3-R2-06`**. |
| `COPD-R2-204` | Major | Gate nhẹ cân Roflumilast bỏ qua `BMI < 18.5` và đọc trường `underweight`, `childPugh` chưa có trong `inputs.ts`. | ⚠️ **SỬA MỘT PHẦN (PHÁT SINH LỖI LOGIC)** | Đã kiểm tra chính xác `BMI < 18.5 kg/m²` (kịch bản `H4a` tại BMI 17.8 chặn chuẩn xác) và thêm `customInputs.childPugh` vào `inputs.ts`. **Tuy nhiên**, phân tầng `Child-Pugh A` bị mâu thuẫn logic nghiêm trọng với `conditions.liverDisease` và thiếu cảnh báo tăng 51% AUC → **`COPD-R3-R2-07`**. |
| `COPD-R2-205` | Major | 18/19 tệp thuốc thiếu dải thận `eGFR < 15` và phân loại sai `rec` ở `eGFR < 30` cho nhóm Glycopyrronium & Spiolto. | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | Kiểm tra tự động 19/19 thuốc COPD tại `eGFR = 5, 12, 25, 45, 90`: **0 khoảng trống `undefined`**; cả 4 thuốc chứa Glycopyrronium và `Spiolto` đều trả về `caution/caution` tại `eGFR < 30` kèm trích dẫn nguyên văn FDA/EMA; `azithromycin` chặn `contra` khi `eGFR < 10`. |
| `COPD-R2-206` | Major | Vi phạm Fail-Closed khi `fev1FvcRatio === undefined` ở `ics_monotherapy_stop`, `ltot_oxygen`, `home_niv`. | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | Cả 3 quy tắc đã khóa chặt qua `hasConfirmedCopdSpirometry(ctx)` / `hasConfirmedStableCopd(ctx)`, kèm quy tắc an toàn `unconfirmed_hypoxemia_evaluation` khi hạ oxy máu chưa có phế dung kế. |
| `COPD-R2-207` | Major | Vi phạm QA-7 trên 38/38 trường `pregnancy`/`lactation`, liều `mepolizumab 100 mg` và bí tiểu LAMA. | ⚠️ **SỬA TỐT QA-7, CÒN KHUYẾT `lactation`** | Toàn bộ **74/74 trích dẫn** trong `kb/citations/copd.json` khớp nguyên văn 100% với PDF gốc; liều `mepolizumab 100 mg Q4W` và cảnh báo bí tiểu LAMA đã có trích dẫn chuẩn. **Tuy nhiên**, 16/19 tệp thuốc bị bỏ trống hoàn toàn trường `lactation` (`COPD-R3-R2-09`) và `roflumilast.lactation = 'avoid'` chưa được thực thi ở runtime (`COPD-R3-R2-07`). |
| `COPD-R2-208` | Minor | Chưa tra cứu động `qtRisk` (Propafenone) và thiếu `InteractionRule` cho Salmeterol + ức chế mạnh CYP3A4. | ❌ **CHƯA SỬA DDI CYP3A4 (NÂNG LÊN MAJOR)** | Tra cứu động `qtRisk` trên KB đã hoạt động tốt (chặn `propafenone`). **Nhưng** tương tác **Chống chỉ định** theo BYT 2131/2026 STT 34 giữa `salmeterol` đơn chất / `umeclidinium_vilanterol` (`Anoro`) + `clarithromycin` vẫn trả về `0` cảnh báo do kẹt phân quyền giữa các agent Vòng 2 → **`COPD-R3-R2-03`**. |
| `COPD-R2-209` | Minor | Câu chữ cũ trong `azithromycin.json` và chuỗi giải thích nằm trong `vnBrands`. | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | `azithromycin.json` đã cập nhật rõ cho người hiện không hút thuốc; mảng `vnBrands` trên cả 19 tệp thuốc đã sạch hoàn toàn. |
| `COPD-R2-210` | Minor | `copdMatrixTherapy` (`continue: 'caution'` ở Nhóm A/B), thiếu `Anoro` trong `copdMatrixDevices`, nút `PlanRow.tsx`. | ✅ **ĐÃ SỬA TRONG MODULE COPD** | `copdMatrixTherapy` và `copdMatrixDevices` đã cập nhật chuẩn xác theo GOLD 2026 và BYT 2131/2026. *(Lưu ý nhỏ ngoài phạm vi COPD: `src/ui/PlanRow.tsx` dòng 175 vẫn giữ chuỗi `"📊 Xem ma trận thận"`).* |
| `COPD-R2-211` | Suggestion | Chuẩn hóa `amount`/`unit` của 4 thuốc FDC và xuất dòng nhắc kháng cholinergic trên `warnings`. | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | Cả 4 FDC (`Spiolto`: `2 nhát`, `Anoro`: `1 liều`, `Ultibro`: `1 viên nang`, `Trelegy`: `1 liều`) và `LAMA_WARNING_VI` đã hiển thị đồng nhất, rõ ràng. |

### 2.2. Phát hiện bất đồng bộ nghiêm trọng giữa `round2_RESPONSE.md` và mã nguồn thực tế

Quá trình kiểm toán độc lập đối chiếu từng dòng trong `docs/reviews/copd/round2_RESPONSE.md` với mã nguồn thực thi đã phát hiện **2 tuyên bố sai lệch trực tiếp** và **3 lỗ hổng hồi quy từ các bản vá chéo Vòng 2**:

1. **Tuyên bố sai lệch #1 (`round2_RESPONSE.md` mục 4.9 `[R3-R2-COPD-09]`, dòng 226)**:
   - Báo cáo giải trình viết: *"không gắn chống chỉ định giả cho `carvedilol` đang ổn định ở HFrEF"*.
   - **Sự thật trong mã nguồn**: `src/modules/copd/helpers.ts` dòng 169–176 khai báo `export const NON_SELECTIVE_BB_IDS = new Set(['propranolol', 'nadolol', 'timolol', 'pindolol', 'carvedilol', 'labetalol', 'sotalol', 'carteolol'])`, khiến `copd.safety.non_selective_bb_stop` phát lệnh cứng `STOP carvedilol` đè sập trụ cột chẹn beta của phân hệ Suy tim (`COPD-R3-R2-01` — **CRITICAL**).
2. **Tuyên bố sai lệch #2 (`round2_RESPONSE.md` mục 3.3 `[COPD-R2-203]`, dòng 109–110)**:
   - Báo cáo giải trình viết: *"bổ sung 2 quy tắc duy trì chuyên biệt `copd.escalation.roflumilast_continue` ... và `copd.escalation.azithromycin_continue`"*, *"thêm `copd.escalation.biologic_continue`"*.
   - **Sự thật trong mã nguồn**: Trong `src/modules/copd/rules.escalation.ts` chỉ có duy nhất `copd.followup.roflumilast_continue` (dòng 150–177); hoàn toàn **không có** `azithromycin_continue` hay `biologic_continue` (`COPD-R3-R2-06` — **MAJOR**).
3. **Ba hồi quy từ bản vá chéo Vòng 2**:
   - Bản vá `[R3-R2-COPD-06]` thêm nhánh chống chỉ định kháng cholinergic (`narrowAngleGlaucoma` / `urinaryRetention`) nhưng quên khai báo input trên UI, gọi nhầm liều cắt cơn AIR của Hen (`1 nhát x khi cần`) cho COPD Nhóm E, và bỏ trống thuốc giãn phế quản ở tái khám/xuất viện (`COPD-R3-R2-02` — **MAJOR**).
   - Bản vá `[R3-R2-COPD-06]` / `[R3-R2-COPD-04]` cho dị ứng đạm sữa bò bỏ sót `Seretide Accuhaler`, `Symbicort Turbuhaler`, `fluticasone_vilanterol`, `Spiriva HandiHaler 18 mcg` và làm mất thuốc xuất viện nội viện (`COPD-R3-R2-05` — **MAJOR**).
   - Bản vá `[COPD-R1V2-02]` chỉ viết lệnh `CONTINUE` cho bộ ba (`continue_triple`), khiến mọi bệnh nhân ngoại trú đang dùng `LAMA`, `LABA`, `LABA+LAMA` (kể cả Preset chính thức số 5) không có y lệnh duy trì thuốc nền (`COPD-R3-R2-06` — **MAJOR**).

---

## 3. KIỂM TOÁN DƯỢC THƯ, TRÍCH DẪN NGUYÊN VĂN & MA TRẬN VÒNG 3

### 3.1. Bảng kiểm toán tự động 19 tệp thuốc COPD (`kb/drugs/*.json`)

| STT | `drugId` | Liều chuẩn hóa `fmtDose(start)` | Dải thận `eGFR` (`5 / 12 / 25 / 45 / 90`) | `pregnancy` / `lactation` | `qtRisk` & Chống chỉ định KB | Đánh giá Vòng 3 |
|:---:|---|---|---|---|---|---|
| 1 | `tiotropium` | `5 mcg x 1 lần/ngày (hít)` *(kèm ghi chú HandiHaler 18 mcg)* | `caution / caution / caution / caution / rec` | `no_data` / ❌ `NONE` | `none`; `narrow_angle_glaucoma_or_urinary_retention` | Liều & thận đạt chuẩn. Cần tách cảnh báo lactose cho dạng HandiHaler 18 mcg (`COPD-R3-R2-05`) & bổ sung `lactation` (`COPD-R3-R2-09`). |
| 2 | `umeclidinium` | `62.5 mcg x 1 lần/ngày (hít)` | `rec / rec / rec / rec / rec` | `no_data` / ❌ `NONE` | `none`; glaucoma/urinary + `severe_milk_protein_allergy` | Đạt chuẩn liều, thận, lactose DPI. Thiếu `lactation` (`COPD-R3-R2-09`). |
| 3 | `glycopyrronium` | `50 mcg x 1 lần/ngày (hít)` | `caution / caution / caution / rec / rec` | `caution` / ❌ `NONE` | `none`; glaucoma/urinary + `severe_milk_protein_allergy` | Đã sửa tốt dải thận `< 30: caution`. Thiếu `lactation` (`COPD-R3-R2-09`). |
| 4 | `aclidinium` | `400 mcg x 2 lần/ngày (hít)` | `rec / rec / rec / rec / rec` | `caution` / ❌ `NONE` | `none`; glaucoma/urinary + `severe_milk_protein_allergy` | Đạt chuẩn liều, thận, trích dẫn FDA Tudorza. Thiếu `lactation` (`COPD-R3-R2-09`). |
| 5 | `indacaterol` | `150 mcg x 1 lần/ngày (hít)` (max `300 mcg`) | `rec / rec / rec / rec / rec` | `caution` / ❌ `NONE` | `none`; `asthma_monotherapy_without_ics` + `severe_milk_protein_allergy` | Đạt chuẩn BYT 2131 tr. 66. Thiếu `lactation` (`COPD-R3-R2-09`). |
| 6 | `olodaterol` | `5 mcg x 1 lần/ngày (hít)` | `rec / rec / rec / rec / rec` | `no_data` / ❌ `NONE` | `none`; `asthma_monotherapy_without_ics` | Đạt chuẩn SMI Respimat (không lactose). Thiếu `lactation` (`COPD-R3-R2-09`). |
| 7 | `salmeterol` | `50 mcg x 2 lần/ngày (hít)` | `rec / rec / rec / rec / rec` | `no_data` / ❌ `NONE` | ❌ `qtRisk: none`; `asthma_monotherapy`, `strong_cyp3a4_inhibitors` | **Lỗi Major (`COPD-R3-R2-03`)**: chưa có `InteractionRule` chạy động với Clarithromycin/CYP3A4 mạnh và thiếu `qtRisk: 'conditional'`. |
| 8 | `vilanterol` | `25 mcg x 1 lần/ngày (hít)` | `rec / rec / rec / rec / rec` | `no_data` / ❌ `NONE` | ❌ `qtRisk: none`; `asthma_monotherapy` + `severe_milk_protein_allergy` | **Lỗi Major (`COPD-R3-R2-03`)**: bỏ lọt DDI CYP3A4 mạnh và thiếu `qtRisk: 'conditional'`. |
| 9 | `tiotropium_olodaterol` | `2 nhát x 1 lần/ngày (hít)` (Spiolto 2.5/2.5 mcg) | `caution / caution / caution / caution / rec` | `caution` / ❌ `NONE` | `none`; `asthma_without_ics`, glaucoma/urinary | Đã đồng bộ dải thận `< 50: caution` với `tiotropium` và chuẩn hóa `2 nhát`. Thiếu `lactation`. |
| 10 | `umeclidinium_vilanterol` | `1 liều x 1 lần/ngày (hít)` (Anoro 62.5/25 mcg) | `rec / rec / rec / rec / rec` | `caution` / ❌ `NONE` | ❌ `qtRisk: none`; `asthma_without_ics`, `severe_milk_protein_allergy`, glaucoma/urinary | **Lỗi Major (`COPD-R3-R2-03`)**: `Anoro + Clarithromycin` xuất `0` cảnh báo tương tác CYP3A4! |
| 11 | `glycopyrronium_indacaterol` | `1 viên nang x 1 lần/ngày (hít)` (Ultibro 110/50 mcg) | `caution / caution / caution / rec / rec` | `caution` / ❌ `NONE` | `none`; `asthma_without_ics`, `severe_milk_protein_allergy`, glaucoma/urinary | Đã sửa tốt dải thận `< 30: caution` và đơn vị `1 viên nang`. Thiếu `lactation`. |
| 12 | `fluticasone_furoate_umeclidinium_vilanterol` | `1 liều x 1 lần/ngày (hít)` (Trelegy 100/62.5/25 mcg) | `rec / rec / rec / rec / rec` | `caution` / ❌ `NONE` | ❌ `qtRisk: none`; `severe_milk_protein_allergy`, glaucoma/urinary | Cần thêm `qtRisk: 'conditional'` (`COPD-R3-R2-03`), lưu ý tăng 3x FF ở suy gan Child-Pugh B/C & `lactation` (`COPD-R3-R2-09`). |
| 13 | `budesonide_glycopyrronium_formoterol` | `2 nhát x 2 lần/ngày (hít)` (Breztri 160/7.2/4.8 mcg) | `caution / caution / caution / rec / rec` | `caution` / ❌ `NONE` | `none`; glaucoma/urinary | Liều & dải thận `< 30: caution` rất chuẩn. Cần thêm ghi chú tăng 2.5x budesonide ở Child-Pugh C & `lactation` (`COPD-R3-R2-09`). |
| 14 | `beclometasone_glycopyrronium_formoterol` | `2 nhát x 2 lần/ngày (hít)` (Trimbow 87/9/5 mcg) | `caution / caution / caution / rec / rec` | `caution` / ❌ `NONE` | `none`; glaucoma/urinary | Đã sửa dải thận `< 30: caution` & `vnBrands: []`. Thiếu `lactation` (`COPD-R3-R2-09`). |
| 15 | `roflumilast` | `250 mcg x 1 lần/ngày (uống)` × 4 tuần → `500 mcg x 1 lần/ngày` | `caution / caution / caution / rec / rec` | `caution` / `avoid` | `none`; `moderate_severe_hepatic_impairment_child_pugh_b_c` | **Lỗi Major (`COPD-R3-R2-07`)**: mâu thuẫn logic `Child-Pugh A` và chưa chặn khi đang cho con bú (`lactation: 'avoid'`). |
| 16 | `azithromycin` | `250 mg x 1 lần/ngày (uống)` (hoặc `500 mg x 3 lần/tuần`) | `contra (5)` / `caution (12)` / `rec` / `rec` / `rec` | `caution` / `caution` | `qtRisk: known`; `history_of_cholestatic_jaundice`, `severe_renal_impairment_gfr_lt_10` | Hoàn chỉnh 100% siêu dữ liệu dược thư. Thiếu quy tắc `azithromycin_continue` ở tái khám (`COPD-R3-R2-06`). |
| 17 | `dupilumab` | `300 mg x mỗi 2 tuần (tiêm dưới da)` | `rec / rec / rec / rec / rec` | `caution` / `caution` | `none`; `known_hypersensitivity_dupilumab` | Hoàn chỉnh 100% siêu dữ liệu dược thư. Thiếu quy tắc `biologic_continue` ở tái khám (`COPD-R3-R2-06`). |
| 18 | `mepolizumab` | `100 mg x mỗi 4 tuần (tiêm dưới da)` | `rec / rec / rec / rec / rec` | `caution` / ❌ `NONE` | `none`; `known_hypersensitivity` | Đã có trích dẫn chuẩn `gina.copd.2026.mepolizumab_100mg_q4w`. Thiếu `lactation` (`COPD-R3-R2-09`) & `biologic_continue` (`COPD-R3-R2-06`). |
| 19 | `theophylline` | `100 mg x 2 lần/ngày (uống)` (TDM `5–15 mcg/mL`) | `caution / caution / caution / rec / rec` | `no_data` / ❌ `NONE` | `none`; `active_peptic_ulcer_or_uncontrolled_seizure` | Cần bổ sung quy tắc rà soát an toàn trên nền xơ gan / đợt cấp (`COPD-R3-R2-08`) và `lactation` (`COPD-R3-R2-09`). |

### 3.2. Kết quả xác thực nguyên văn trích dẫn (`kb/citations/copd.json`) & Presets

- **Xác thực trích dẫn PDF (`r2_source_verification.ts`)**: Toàn bộ **74/74 mục trích dẫn** trong `kb/citations/copd.json` đạt **100% khớp nguyên văn chính xác (`EXACT = 74, ADJ/CROSS = 0, FAIL = 0`)** ngay tại đúng `pdfPage` khai báo trên các tài liệu PDF chuẩn trong `Medical_Library_2026`. Không có bất kỳ trích dẫn bịa đặt hay cắt xén sai nghĩa nào trong `kb/citations/copd.json`.
- **Kiểm thử 5 `copdPresets` chính thức (`r2_round3_audit_batch3.ts`)**:
  - `copd_preset_group_a`, `copd_preset_group_b`, `copd_preset_group_e_triple`, `copd_preset_inpatient_exac_0245`: Hoạt động đúng phác đồ GOLD 2026 & BYT QĐ 2131/2026.
  - `copd_preset_followup_roflumilast`: Bộc lộ trực tiếp lỗi **`COPD-R3-R2-06`** — bệnh nhân đang dùng `tiotropium_olodaterol` tái khám nhưng đầu ra hoàn toàn vắng bóng lệnh `CONTINUE tiotropium_olodaterol`!

---

## 4. PHÂN TÍCH CHI TIẾT 10 PHÁT HIỆN VÒNG 3 (`COPD-R3-R2-01` → `COPD-R3-R2-10`)

---

### [COPD-R3-R2-01] (CRITICAL) — Đứt gãy trụ cột Chẹn beta giảm tử vong và nguy cơ ngừng thuốc đột ngột ở bệnh nhân đồng mắc HFrEF + COPD đang điều trị bằng Carvedilol

- **Loại mục**: `rule`
- **Định danh**: `copd.safety.non_selective_bb_stop` (`src/modules/copd/rules.safety.ts` dòng 145–188; `src/modules/copd/helpers.ts` dòng 169–176; tương tác với `src/modules/hf/rules.hfref.ts` dòng 214–223 và `src/engine/merge.ts`)
- **Phân tích cơ chế lỗi & nguy cơ lâm sàng trực tiếp**:
  1. Trong `docs/reviews/copd/round2_RESPONSE.md` (mục 4.9, dòng 226), báo cáo khắc phục khẳng định quy tắc mới *"không gắn chống chỉ định giả cho `carvedilol` đang ổn định ở HFrEF"*. Thế nhưng kiểm tra trực tiếp `src/modules/copd/helpers.ts` (dòng 169–176) cho thấy `'carvedilol'` **vẫn nằm nguyên trong tập `NON_SELECTIVE_BB_IDS`**:
     ```ts
     export const NON_SELECTIVE_BB_IDS = new Set([
       'propranolol', 'nadolol', 'timolol', 'pindolol',
       'carvedilol', 'labetalol', 'sotalol', 'carteolol',
     ]);
     ```
  2. Quy tắc `copd.safety.non_selective_bb_stop` (`src/modules/copd/rules.safety.ts` dòng 145–188) phát lệnh cứng `action: 'STOP'`, `drugId: 'carvedilol'`, `priority: 97` cho mọi bệnh nhân COPD đang dùng bất kỳ thuốc nào trong `NON_SELECTIVE_BB_IDS`, **bất kể bệnh nhân có đồng mắc Suy tim phân suất tống máu giảm (HFrEF) hay bệnh mạch vành sau nhồi máu cơ tim hay không**.
  3. Nguy hiểm hơn, khi bác sĩ đánh giá bệnh nhân đồng mắc **HFrEF + COPD** (`selectedModules: ['hf', 'copd']`):
     - Tại `src/modules/hf/rules.hfref.ts` (dòng 214–223), quy tắc trụ cột `hf.fmt.bb` nhận thấy bệnh nhân đã có `carvedilol` trong `currentMeds` nên phát lệnh `UPTITRATE carvedilol` (hoặc `CONTINUE` nếu đã đạt đích `25 mg x 2 lần/ngày`).
     - Tại tầng hợp nhất `src/engine/merge.ts`, do cùng `drugId: 'carvedilol'`, lệnh `STOP` (`ACTION_PRIORITY = 105`) từ module COPD **đè bẹp và xóa sổ hoàn toàn** lệnh `UPTITRATE`/`CONTINUE carvedilol` (`ACTION_PRIORITY = 70` / `60`) của module Suy tim!
     - Đồng thời **không có bất kỳ quy tắc nào phát lệnh `SWITCH` hay `START` `bisoprolol` / `metoprolol_succinate`**.
  4. **Hậu quả lâm sàng thảm khốc**:
     - Phác đồ hợp nhất cuối cùng ra lệnh **NGỪNG Carvedilol** và để bệnh nhân HFrEF (LVEF 30%) chỉ còn **3/4 trụ cột** (`ARNI + SGLT2i + MRA`, **0 thuốc chẹn beta**).
     - Việc ngừng đột ngột Carvedilol ở bệnh nhân suy tim / bệnh mạch vành vi phạm trực tiếp cảnh báo trọng yếu của FDA, có thể khởi phát cơn đau thắt ngực không ổn định, nhồi máu cơ tim cấp, loạn nhịp thất ác tính và suy tim mất bù cấp.
- **Bằng chứng kiểm chứng động & y văn gốc**:
  - **Runtime `evaluate()` — Kịch bản H2a** (`r2_round3_audit.ts`: Nam 66 tuổi, HFrEF LVEF 30%, NYHA II + COPD GOLD 3 ổn định, không hen, `selectedModules: ['hf', 'copd']`, đang dùng `carvedilol 12.5 mg BID`, `sacubitril_valsartan`, `dapagliflozin`, `spironolactone`, `tiotropium_olodaterol`):
    - Đầu ra thực tế:
      - `[REC] STOP | id=rec_copd_stop_non_selective_bb | drug=carvedilol | "NGỪNG / CHUYỂN ĐỔI thuốc chẹn beta không chọn lọc (Carvedilol)"`
      - `[REC] CONTINUE | drug=dapagliflozin`
      - `[REC] CONTINUE | drug=sacubitril_valsartan`
      - `[REC] UPTITRATE | drug=spironolactone`
      - `[REC] CONTINUE | drug=tiotropium_olodaterol`
      - **→ Mất trắng hoàn toàn thuốc chẹn beta trong phác đồ điều trị HFrEF!**
  - **Nhãn thuốc FDA Coreg (`FDA_label_carvedilol.pdf`)**:
    - Section 4 Contraindications (PDF p. 5): Chỉ chống chỉ định ở *"Bronchial asthma or related bronchospastic conditions"*, **không chống chỉ định ở COPD không co thắt phế quản phản ứng**.
    - Section 5.1 Cessation of Therapy (PDF p. 6): Cảnh báo nghiêm ngặt **không ngừng đột ngột Carvedilol** do nguy cơ nhồi máu cơ tim và loạn nhịp thất; bắt buộc giảm liều từ từ hoặc chuyển đổi gối đầu.
    - Section 5.5 Nonallergic Bronchospasm (PDF p. 7): Cho phép dùng thận trọng liều thấp nhất có hiệu quả ở bệnh nhân viêm phế quản mạn / khí phế thũng có suy tim.
  - **ESC 2026 Heart Failure Guidelines — Supplementary Table S6** (PDF p. 14): *"COPD is not a contraindication"* đối với thuốc chẹn beta trong HFrEF (ưu tiên chẹn beta chọn lọc beta-1 trên thực hành).
  - **GOLD 2026** (PDF p. 127) & **Bộ Y tế QĐ 2131/QĐ-BYT 2026** (PDF p. 51–53 / tr. 41–43): Khuyến cáo ưu tiên sử dụng thuốc chẹn beta-1 chọn lọc tim (`bisoprolol`, `metoprolol succinate`, `nebivolol`) cho người bệnh COPD có chỉ định tim mạch và duy trì đầy đủ điều trị suy tim theo hướng dẫn.
- **Hướng khắc phục chuẩn xác**:
  1. Tại `copd.safety.non_selective_bb_stop` (`src/modules/copd/rules.safety.ts`): Tách rõ 2 bối cảnh lâm sàng:
     - **Khi bệnh nhân có chỉ định bắt buộc chẹn beta tim mạch** (`hasCondition(ctx, 'hf') || (ctx.normalized.lvef !== undefined && ctx.normalized.lvef <= 40) || hasCondition(ctx, 'ascvd') || hasCondition(ctx, 'af')`): Tuyệt đối **KHÔNG** phát lệnh `STOP` đơn độc. Phát `action: 'SWITCH'`, `drugId: 'bisoprolol'`, `switchFrom: bbId` (chuyển đổi gối đầu tương đương liều sang chẹn beta-1 chọn lọc tim như **Bisoprolol** khởi đầu 1.25–2.5 mg/ngày → đích 10 mg/ngày hoặc **Metoprolol succinate** 12.5–25 mg/ngày → đích 200 mg/ngày; nếu là `carvedilol` đang dung nạp hoàn toàn ổn định ở HFrEF ngoài đợt cấp co thắt phế quản nặng, có thể dùng `CONSIDER`/`SWITCH` chuyển sang Bisoprolol kèm cảnh báo **tuyệt đối không ngừng đột ngột chẹn beta** theo FDA Coreg §5.1).
     - **Khi không có chỉ định bắt buộc suy tim/mạch vành** (ví dụ đang dùng `propranolol` trị run tay hoặc tăng huyết áp đơn thuần): Giữ hướng dẫn ngừng giảm liều dần và thay bằng nhóm thuốc khác hoặc chẹn beta-1 chọn lọc.
  2. Đồng bộ `ix.bb_non_selective_asthma` trong `src/engine/safety/interactions.ts` (dòng 180–188) để phân biệt rạch ròi giữa **Hen phế quản** (chống chỉ định tuyệt đối mọi chẹn beta không chọn lọc) và **COPD không kèm hen** (tránh/chuyển đổi sang chẹn beta-1 chọn lọc tim, không ngừng đột ngột ở HFrEF).

---

### [COPD-R3-R2-02] (MAJOR) — Chuỗi 4 lỗi liên hoàn ở nhánh chống chỉ định kháng cholinergic (`narrowAngleGlaucoma` / `urinaryRetention`): thiếu input UI, kê nhầm liều cắt cơn AIR của Hen cho COPD Nhóm E, bỏ trống thuốc giãn phế quản ở tái khám/xuất viện và thiếu cảnh báo khí dung mặt nạ

- **Loại mục**: `rule`
- **Định danh**: `copd.outpatient.lama_contra_alternative` (`src/modules/copd/rules.initial.ts` dòng 190–225), `src/modules/copd/inputs.ts`, `src/modules/copd/rules.followup.ts`, `src/modules/copd/rules.inpatient.ts`
- **Phân tích 4 lỗi liên hoàn**:
  1. **Mã chết trên giao diện người dùng (UI Dead Code)**:
     - Quét toàn bộ thư mục `src/` xác nhận hai khóa `narrowAngleGlaucoma` và `urinaryRetention` chỉ được đọc trong `src/modules/copd/helpers.ts` (dòng 558–567) và `src/engine/safety/gates.ts` (dòng 155–160), nhưng **hoàn toàn không được khai báo** trong `src/modules/copd/inputs.ts` lẫn `STANDARD_CONDITIONS`. Bác sĩ trên UI không có bất kỳ ô chọn nào để nhập tình trạng Glôcôm góc đóng hoặc Bí tiểu / Tắc nghẽn cổ bàng quang!
  2. **Sai liều nghiêm trọng ở COPD Nhóm E có BCAT ≥ 300 /µL — lấy nhầm chế độ cắt cơn AIR của Hen Bậc 1–2**:
     - Khi truyền `urinaryRetention: true` cho bệnh nhân mới chẩn đoán COPD Nhóm E nặng có BCAT ≥ 300 /µL (`rules.initial.ts` dòng 207), quy tắc `copd.outpatient.lama_contra_alternative` gọi `fmtDose(dose('budesonide_formoterol', 'start'))`.
     - Do tệp dùng chung `kb/drugs/budesonide_formoterol.json` đặt `start` theo phác đồ cắt cơn AIR của Hen Bậc 1–2 (`amount: 1, unit: 'nhát', frequency: 'khi cần'`), bệnh nhân COPD Nhóm E (2 đợt cấp + 1 nhập viện, FEV₁ 48%, CAT 22) bị kê liều:
       > **`1 nhát x khi cần (hít) - Với hàm lượng 160/4.5 mcg: AIR (Bậc 1–2) 1 nhát khi cần...`**
     - Trong khi theo **Bộ Y tế QĐ 2131/QĐ-BYT 2026 Phụ lục 1 (PDF p. 69 / tr. 59)**, chế độ chỉ hít khi cần (AIR) không được phê duyệt cho COPD; liều duy trì chuẩn của Budesonide/Formoterol 160/4.5 mcg trong COPD là **`2 liều x 2 lần/ngày` (4 liều/ngày)**.
  3. **Bỏ trống 0 thuốc giãn phế quản khi tái khám ngoại trú và khi xuất viện sau đợt cấp**:
     - Ở ngoại trú tái khám (`rules.followup.ts`): Bệnh nhân có `urinaryRetention: true` đang dùng `indacaterol` 150 mcg vẫn còn khó thở nhiều (CAT 18) hoặc đợt cấp tái phát bị chặn toàn bộ quy tắc nâng bậc chứa LAMA nhưng không có quy tắc dự phòng (như tăng `indacaterol` lên `300 mcg/ngày` hoặc chuyển sang `ICS + LABA` liều cố định khi BCAT ≥ 100 /µL), kết quả xuất **`0` khuyến cáo thuốc giãn phế quản**.
     - Ở đợt cấp nội viện (`copd.inpatient.discharge_controller` tại `rules.inpatient.ts` dòng 336): Câu lệnh `if (hasAnticholinergicContra(ctx)) return false;` chặn luôn việc kê thuốc duy trì xuất viện mà không có nhánh thay thế không chứa LAMA.
  4. **Thiếu cảnh báo tránh khí dung Ipratropium qua mặt nạ trong đợt cấp**:
     - Trong đợt cấp nội viện có `narrowAngleGlaucoma: true` (**Kịch bản H1f**), `copd.inpatient.short_acting_bronchodilators` vẫn phát y lệnh chung *"Salbutamol 2.5 mg (± phối hợp Ipratropium 0.5 mg) phun khí dung"* mà không cảnh báo chỉ dùng SABA đơn thuần hoặc bắt buộc dùng ống ngậm miệng (mouthpiece) thay vì mặt nạ (facemask) để tránh khởi phát cơn glôcôm góc đóng cấp theo GOLD 2026 (PDF p. 157: *"Use of solutions with a facemask can precipitate acute glaucoma"*).
- **Bằng chứng kiểm chứng động**:
  - Xem kết quả chạy thực tế các kịch bản **H1c**, **H1e**, **H1f** trong `docs/reviews/copd/scratch/r2_round3_audit.ts`.
- **Hướng khắc phục**:
  1. Khai báo 2 trường boolean `customInputs.narrowAngleGlaucoma` (*"Glôcôm góc đóng chưa kiểm soát"*) và `customInputs.urinaryRetention` (*"Bí tiểu cấp hoặc tắc nghẽn đường ra bàng quang / phì đại tiền liệt tuyến có triệu chứng nặng"*) vào `src/modules/copd/inputs.ts`.
  2. Tại `copd.outpatient.lama_contra_alternative` (`rules.initial.ts` dòng 207): Truyền chuỗi liều duy trì cố định chuẩn COPD cho `budesonide_formoterol`: `'2 nhát (160/4.5 mcg/nhát) x 2 lần/ngày (hít duy trì cố định cho COPD; tổng 4 nhát/ngày)'` kèm trích dẫn `byt.copd.2026` Phụ lục 1 PDF p. 69.
  3. Bổ sung nhánh không chứa LAMA cho `rules.followup.ts` (duy trì/tăng liều `indacaterol` 150 → 300 mcg/ngày hoặc chuyển sang `budesonide_formoterol` 160/4.5 mcg × 2 nhát × 2 lần/ngày khi Nhóm E có BCAT ≥ 100 /µL) và cho `copd.inpatient.discharge_controller`.
  4. Tại `copd.inpatient.short_acting_bronchodilators`: Khi `hasAnticholinergicContra(ctx)` = true, khuyến cáo dùng **Salbutamol đơn thuần** (tránh phối hợp Ipratropium; nếu bắt buộc dùng phải qua ống ngậm miệng, tuyệt đối tránh mặt nạ khí dung hở vào mắt).

---

### [COPD-R3-R2-03] (MAJOR) — Bỏ lọt hoàn toàn cảnh báo tương tác thuốc Chống chỉ định giữa Salmeterol đơn chất / Vilanterol (`Anoro Ellipta`) với các thuốc ức chế mạnh CYP3A4 (BYT QĐ 2131/2026 Phụ lục 11 STT 34 & GINA 2026)

- **Loại mục**: `drug` (liên đới `kb/interactions/diabetes_respiratory.json` & `kb/drugs/*.json`)
- **Định danh**: `ix.ics_laba_strong_cyp3a4` (`kb/interactions/diabetes_respiratory.json`), `salmeterol`, `vilanterol`, `umeclidinium_vilanterol`, `fluticasone_furoate_umeclidinium_vilanterol`
- **Phân tích cơ chế & bằng chứng y văn gốc**:
  - Quy tắc `ix.ics_laba_strong_cyp3a4` hiện tại trong `kb/interactions/diabetes_respiratory.json` chỉ quét các phân lớp có chứa ICS (`classes: ['ics', 'ics_laba', 'ics_lama_laba']`). Do đó, mọi chế phẩm chứa **Salmeterol** hoặc **Vilanterol** thuộc nhóm `laba` hoặc `laba_lama` (đặc biệt là **`umeclidinium_vilanterol` – Anoro Ellipta**, thuốc phối hợp đôi đầu tay rất phổ biến ở bệnh nhân COPD Nhóm B/E tại Việt Nam, và **`salmeterol` – Serevent**) bị lọt lưới hoàn toàn!
  - Đồng thời, danh sách chất ức chế CYP3A4 ở vế B hiện mới có `ritonavir`, `itraconazole`, `ketoconazole`, `clarithromycin`, bỏ sót **`erythromycin`**, **`voriconazole`** và **`posaconazole`** (rất hay gặp ở bệnh nhân COPD nhiễm nấm *Aspergillus* phổi mạn tính hoặc dùng macrolide).
  - **Kiểm chứng động (`r2_round3_audit_batch2.ts`)**:
    - **Kịch bản B2_5a** (`currentMeds: ['salmeterol', 'clarithromycin']`): `alerts = []` (**0 cảnh báo!**).
    - **Kịch bản B2_5b** (`currentMeds: ['umeclidinium_vilanterol', 'clarithromycin']`): `alerts = []` (**0 cảnh báo!**).
  - **Đối chiếu pháp quy Bộ Y tế QĐ 2131/QĐ-BYT 2026 — Phụ lục 11 (Danh mục tương tác thuốc chống chỉ định), STT 34 (PDF p. 120 / tr. 110)**:
    > *"Salmeterol + Các thuốc ức chế mạnh CYP3A4 (clarithromycin, erythromycin, roxithromycin, itraconazol, posaconazol, voriconazol, boceprevir, các thuốc ức chế protease điều trị HIV*) → Tăng nồng độ salmeterol trong huyết thanh, tăng nguy cơ phản ứng có hại (bao gồm cả các phản ứng trên tim mạch như đau thắt ngực, tăng hoặc hạ huyết áp, nhịp tim nhanh) → **Chống chỉ định phối hợp**. Cân nhắc thay salmeterol bằng các thuốc chủ vận beta-2 khác không phụ thuộc vào chuyển hóa qua CYP3A4 như formoterol."*
  - **Đối chiếu GINA 2026** (PDF p. 47 / `gina.asthma.2026.ix_cyp3a4_ics_laba_p47`):
    > *"...may increase the risk of cardiovascular adverse effects of the LABAs salmeterol and vilanterol (**alone or in combination with ICS**). Concomitant use of these medications is not recommended."*
  - Ngoài ra, kiểm tra siêu dữ liệu QT phát hiện sự thiếu đồng bộ giữa các tệp thuốc: `fluticasone_salmeterol.json` và `fluticasone_vilanterol.json` đã gắn `"qtRisk": "conditional"`, nhưng `salmeterol.json`, `vilanterol.json`, `umeclidinium_vilanterol.json` và `fluticasone_furoate_umeclidinium_vilanterol.json` vẫn đang để `"qtRisk": "none"`.
- **Hướng khắc phục**:
  1. Trong `kb/interactions/diabetes_respiratory.json`: Bổ sung quy tắc `ix.salmeterol_strong_cyp3a4` (`severity: 'contraindicated'` cho `salmeterol`, `fluticasone_salmeterol` theo BYT 2131/2026 STT 34) và mở rộng bao phủ `vilanterol`, `umeclidinium_vilanterol` (`severity: 'major'` theo GINA 2026 p. 47 & nhãn FDA Anoro Ellipta §7.1); bổ sung `erythromycin`, `voriconazole`, `posaconazole` vào danh sách thuốc ức chế CYP3A4.
  2. Cập nhật `"qtRisk": "conditional"` trong `kb/drugs/{salmeterol, vilanterol, umeclidinium_vilanterol, fluticasone_furoate_umeclidinium_vilanterol}.json`.

---

### [COPD-R3-R2-04] (MAJOR) — Quy tắc Corticoid toàn thân đợt cấp nội viện (`copd.inpatient.systemic_steroid`) bỏ qua `methylprednisolone`, sinh lệnh `SWITCH` nghịch lý, báo động giả `dup.systemic_steroid` và nguy cơ suy thượng thận cấp

- **Loại mục**: `rule`
- **Định danh**: `copd.inpatient.systemic_steroid` (`src/modules/copd/rules.inpatient.ts` dòng 214–245)
- **Phân tích cơ chế lỗi & thực tế bệnh viện Việt Nam**:
  - Tại các khoa Cấp cứu, Hô hấp và Nội tổng hợp ở Việt Nam, **`methylprednisolone`** (**Medrol** 4 mg / 16 mg đường uống và **Solu-Medrol** 40 mg tiêm tĩnh mạch) là corticoid toàn thân được sử dụng phổ biến hơn cả Prednisolone. Chính **QĐ 2131/QĐ-BYT 2026 (PDF p. 98 / tr. 88)** cũng ghi song song hai lựa chọn ngang hàng: *"Corticosteroid: prednisolon (uống) 1mg/kg/ngày; hoặc **methylprednisolon 1mg/kg/ngày, uống hoặc tiêm tĩnh mạch**... Thời gian điều trị: 5 ngày"*.
  - Thế nhưng tại `src/modules/copd/rules.inpatient.ts` (dòng 220), quy tắc chỉ kiểm tra:
    ```ts
    const alreadyOnPred = hasCurrentMed(ctx, 'prednisolone') || hasCurrentMed(ctx, 'prednisone');
    ```
    mà **hoàn toàn không kiểm tra `methylprednisolone`** (hay `hydrocortisone` / `dexamethasone`), đồng thời luôn gắn cứng `action: 'START'`, `drugId: 'prednisolone'`.
  - **Hệ quả kép khi chạy `evaluate()`**:
    1. **Trường hợp 1 — Bệnh nhân đã được tiêm/uống `methylprednisolone 40 mg` xử trí đợt cấp tại Cấp cứu (`Kịch bản MP40` trong `r2_round3_audit_batch3.ts`)**:
       - Hệ thống phát `[REC] START prednisolone 40 mg` → `merge.ts` tự động sinh thêm thẻ thứ hai cực kỳ phi lý:
         > **`[REC] SWITCH switch_old_methylprednisolone_for_prednisolone`: `"CHUYỂN ĐỔI: Ngừng Methylprednisolone để thay bằng Prednisolone / Methylprednisolone"`**
       - Cùng lúc đó, `duplicates.ts` bắn cảnh báo đỏ:
         > **`[ALERT] CRITICAL | dup.systemic_steroid | "Trùng lặp 2 thuốc cùng nhóm Corticosteroid đường toàn thân [methylprednisolone, prednisolone]"`**
    2. **Trường hợp 2 — Bệnh nhân đang uống `methylprednisolone 4 mg/ngày` mạn tính tại nhà (ví dụ vì viêm khớp dạng thấp hoặc COPD phụ thuộc corticoid, `Kịch bản H3b`)**:
       - Ngoài việc gây ra cặp lệnh `SWITCH` nghịch lý và báo động giả `CRITICAL` nêu trên, việc hướng dẫn ngừng hẳn sau 5 ngày (*"tối đa 5 ngày (ngừng ngay, không cần giảm liều dần)"*) ở người đang phụ thuộc corticoid ngoại sinh dài ngày mà không nhắc lùi về liều nền `4 mg/ngày` sẽ gây nguy cơ **suy thượng thận cấp (adrenal crisis)**.
- **Hướng khắc phục**:
  - Tại `copd.inpatient.systemic_steroid` (`src/modules/copd/rules.inpatient.ts` dòng 218–242):
    - Nếu bệnh nhân đã có `methylprednisolone` trong `currentMeds`: gắn `drugId: 'methylprednisolone'` thay vì `'prednisolone'`.
      - Nếu liều hiện tại `≥ 32 mg/ngày`: phát `action: 'CONTINUE'` (*"Tiếp tục Methylprednisolone 32–40 mg/ngày (ưu tiên chuyển sang đường uống ngay khi uống được) cho đủ tổng liệu trình 5 ngày"*).
      - Nếu liều hiện tại `< 32 mg/ngày` (hoặc chưa rõ liều): phát `action: 'UPTITRATE'` tăng lên liều đợt cấp `32–40 mg/ngày × 5 ngày`, kèm cảnh báo rõ: *"Nếu bệnh nhân đang dùng corticoid đường toàn thân kéo dài (> 3 tuần) trước nhập viện, sau 5 ngày liều cao cần quay về liều duy trì nền thay vì ngừng đột ngột để phòng suy thượng thận cấp."*
    - Tương tự cho `prednisolone`: nếu liều hiện tại `≥ 30 mg/ngày` thì `CONTINUE` cho đủ 5 ngày; nếu `< 30 mg/ngày` thì `UPTITRATE` kèm lưu ý quay về liều nền.

---

### [COPD-R3-R2-05] (MAJOR) — Lỗ hổng bảo vệ dị ứng nặng / phản vệ với protein sữa bò (tá dược lactose DPI): bỏ sót `Seretide Accuhaler`, `Symbicort Turbuhaler`, `Relvar`, `Spiriva HandiHaler 18 mcg` và làm mất thuốc xuất viện trong đợt cấp nội viện

- **Loại mục**: `rule`
- **Định danh**: `copd.safety.dpi_inhaler_switch` (`src/modules/copd/rules.safety.ts`), `DPI_INHALER_IDS` (`src/modules/copd/helpers.ts` dòng 116–131), `kb/drugs/{fluticasone_vilanterol, tiotropium}.json`, `copd.inpatient.discharge_controller` (`src/modules/copd/rules.inpatient.ts`)
- **Phân tích 3 lỗ hổng dược bào chế & an toàn lâm sàng**:
  1. **Bỏ sót các bình hít chứa lactose phổ biến hàng đầu tại Việt Nam**:
     - `fluticasone_vilanterol.json` (**Relvar / Breo Ellipta** — 100% chỉ tồn tại dưới dạng bột khô DPI chứa lactose monohydrate có vết protein sữa bò, chống chỉ định tuyệt đối tại Section 4 nhãn FDA Breo Ellipta) có mặt trong `DPI_INHALER_IDS` nhưng **thiếu mã `severe_milk_protein_allergy` trong `kb/drugs/fluticasone_vilanterol.json`** (`gates.ts` không chặn khi đồng mắc Hen–COPD kê Relvar!).
     - `fluticasone_salmeterol` (**Seretide Accuhaler/Diskus** — bột khô chứa lactose có protein sữa, FDA Advair Diskus Section 4 Contraindications) và `budesonide_formoterol` (**Symbicort Turbuhaler** — bột khô chứa lactose) có cả dạng DPI và pMDI trên thị trường, nhưng hiện **không có mặt trong `DPI_INHALER_IDS`** và không phát bất kỳ cảnh báo nào khi `severeMilkProteinAllergy = true` (**Kịch bản B2_4b & H3c**: `0` cảnh báo, `0` khuyến cáo kiểm tra/đổi sang dạng bình xịt định liều pMDI Evohaler / Rapihaler!).
  2. **`tiotropium.json` gợi ý cả `HandiHaler 18 mcg` (DPI chứa lactose) cho bệnh nhân dị ứng nặng protein sữa**:
     - Tệp `kb/drugs/tiotropium.json` gộp chung cả `Spiriva Respimat 2.5 mcg` (SMI dạng phun sương mù mềm không chứa lactose) và `Spiriva HandiHaler 18 mcg` (viên nang bột khô DPI chứa lactose có vết protein sữa, chống chỉ định tại nhãn FDA Spiriva HandiHaler Section 4). Khi bệnh nhân có `severeMilkProteinAllergy: true` đang dùng `tiotropium 18 mcg` (**Kịch bản H3e**) hoặc mới khởi trị Nhóm A, hệ thống vẫn hiển thị `"(hoặc HandiHaler 18 mcg: 1 viên x 1 lần/ngày)"` mà không cảnh báo bắt buộc chỉ dùng **Spiriva Respimat**.
  3. **Mất thuốc duy trì xuất viện khi bệnh nhân dị ứng protein sữa nhập viện vì đợt cấp COPD**:
     - Trong **Kịch bản H3d** (`setting: 'inpatient'`, `acuteExacerbation: true`, `severeMilkProteinAllergy: true`, đang dùng `Trelegy Ellipta`):
       - `reviewCurrentMedications` phát lệnh `STOP NGỪNG NGAY Fluticasone furoate/Umeclidinium/Vilanterol` (do chống chỉ định dị ứng sữa bò).
       - Tuy nhiên `copd.safety.dpi_inhaler_switch` bị tắt trong đợt cấp (`if (isAcuteExacerbation(ctx)) return false;`), còn `copd.inpatient.discharge_controller` thấy bệnh nhân đã có `eff === 'triple'` trong `currentMeds` nên cũng trả về `false`!
       - Kết quả: Bệnh nhân bị lệnh **STOP Trelegy** nhưng xuất viện với **0 thuốc hít duy trì thay thế** (lẽ ra phải được chuyển sang bình pMDI không lactose `Breztri Aerosphere`).
- **Hướng khắc phục**:
  1. Bổ sung mục `severe_milk_protein_allergy` vào `contraindications` của `kb/drugs/fluticasone_vilanterol.json`.
  2. Bổ sung quy tắc cảnh báo dạng bào chế trong `src/modules/copd/rules.safety.ts`: Khi `hasMilkProteinAllergy(ctx)` hoặc `hasWeakInspiratoryFlow(ctx)` = true mà bệnh nhân đang dùng hoặc được kê `tiotropium`, `fluticasone_salmeterol`, `budesonide_formoterol`, xuất cảnh báo rõ ràng bắt buộc chọn dạng **SMI / pMDI + buồng đệm không chứa lactose** (`Spiriva Respimat`, `Seretide Evohaler pMDI`, `Symbicort Rapihaler pMDI`), tuyệt đối tránh dạng bột khô (`HandiHaler 18 mcg`, `Accuhaler`, `Turbuhaler`).
  3. Tại `copd.inpatient.discharge_controller` (`src/modules/copd/rules.inpatient.ts`), nếu thuốc hít nền hiện tại trong `currentMeds` thuộc `DPI_INHALER_IDS` và `hasMilkProteinAllergy(ctx)` (hoặc `hasWeakInspiratoryFlow(ctx)`) = true, phát lệnh `SWITCH` sang chế phẩm pMDI/SMI tương đương (`budesonide_glycopyrronium_formoterol` hoặc `tiotropium_olodaterol`) khi chuẩn bị xuất viện.

---

### [COPD-R3-R2-06] (MAJOR) — Thiếu hoàn toàn y lệnh duy trì (`CONTINUE`) cho mọi thuốc hít ngoài bộ ba (`lama_mono`, `laba_mono`, `laba_lama`, `ics_laba`) và cho các thuốc cộng thêm dài hạn (`azithromycin`, `dupilumab`, `mepolizumab`) khi tái khám ngoại trú

- **Loại mục**: `rule`
- **Định danh**: `src/modules/copd/rules.followup.ts` (`copd.followup.continue_triple`), `src/modules/copd/rules.escalation.ts`
- **Phân tích cơ chế & bằng chứng kiểm thử**:
  1. **Mất y lệnh duy trì thuốc hít nền cho đa số bệnh nhân COPD ngoại trú**:
     - Trong toàn bộ `src/modules/copd/rules.followup.ts`, chỉ có duy nhất một quy tắc duy trì là `copd.followup.continue_triple` (chỉ chạy khi `eff === 'triple'`).
     - Mọi bệnh nhân COPD tái khám đang dùng **`lama_mono`** (`Spiriva`), **`laba_mono`** (`Onbrez`, `Striverdi`), **`laba_lama`** (`Spiolto`, `Anoro`, `Ultibro`) hoặc **`ics_laba`** hợp lệ (khi đồng mắc Hen ổn định) mà không đổi bình hít đều **không nhận được bất kỳ y lệnh `CONTINUE` nào**!
     - Bằng chứng trực quan nhất là chạy chính **Preset chính thức số 5 của hệ thống** (`copd_preset_followup_roflumilast` — *"COPD theo dõi: Thất bại với LABA+LAMA, BCAT < 100, Viêm phế quản mạn"*, đang dùng `tiotropium_olodaterol`): Đầu ra chỉ có `AVOID ICS`, `CONSIDER roflumilast`, `CONSIDER azithromycin` — **hoàn toàn mất dấu `tiotropium_olodaterol`** trong phác đồ thuốc và phiếu tóm tắt bệnh án (`noteText`)! Tương tự, bệnh nhân Nhóm A ổn định trên `tiotropium` (**B2_1**) hay Nhóm B ổn định trên `tiotropium_olodaterol` (**B2_2**) nhận về **`0` khuyến cáo thuốc**.
  2. **Thiếu `azithromycin_continue` và `biologic_continue` trái với báo cáo `round2_RESPONSE.md`**:
     - Như đã chỉ ra ở Mục 2.2, dù `round2_RESPONSE.md` (dòng 109–110) tuyên bố đã thêm `copd.escalation.azithromycin_continue` và `copd.escalation.biologic_continue`, hai quy tắc này không tồn tại trong `src/modules/copd/rules.escalation.ts`.
     - Trong **Kịch bản H4e** (bệnh nhân đang duy trì `Trelegy` + `azithromycin 250 mg` + `dupilumab 300 mg`), đầu ra chỉ có `CONTINUE Trelegy` và bỏ rơi hoàn toàn `azithromycin` lẫn `dupilumab`. Với `azithromycin`, điều này làm mất luôn dòng nhắc an toàn cực kỳ quan trọng của **GOLD 2026 (PDF p. 77)**: theo dõi định kỳ khoảng QTc, kiểm tra thính lực (ù tai/nghe kém), men gan và **đánh giá lại việc ngừng sau tối đa 1 năm** do chưa có dữ liệu hiệu quả/an toàn vượt quá 1 năm và nguy cơ kháng macrolide.
- **Hướng khắc phục**:
  1. Tại `src/modules/copd/rules.followup.ts`: Bổ sung `copd.followup.continue_controller` phát `action: 'CONTINUE'` cho thuốc hít duy trì hiện hành (`lama_mono`, `laba_mono`, `laba_lama`, hoặc `ics_laba` hợp lệ) khi `hasConfirmedStableCopd(ctx)`, `!hasAnticholinergicContra(ctx)` (với thuốc có LAMA), không thuộc diện phải đổi thiết bị DPI và `getPlannedCopdInhalerChangeDrugId(ctx) === undefined`.
  2. Tại `src/modules/copd/rules.escalation.ts`: Hiện thực hóa đầy đủ 2 quy tắc đã cam kết:
     - `copd.followup.azithromycin_continue`: khi `hasCurrentMed(ctx, 'azithromycin')` và `getAzithromycinContraReasons(ctx).length === 0`, phát `action: 'CONTINUE'` kèm hướng dẫn theo dõi ECG QTc, thính lực, men gan và đánh giá lại lợi ích/nguy cơ kháng thuốc sau 12 tháng (`gold.copd.2026.azithromycin_roflumilast`).
     - `copd.followup.biologic_continue`: khi đang dùng `dupilumab` hoặc `mepolizumab` hợp lệ, phát `action: 'CONTINUE'` (`300 mg SC mỗi 2 tuần` hoặc `100 mg SC mỗi 4 tuần`) kèm theo dõi đáp ứng đợt cấp sau 6–12 tháng.

---

### [COPD-R3-R2-07] (MAJOR) — Hai lỗ hổng an toàn dược lâm sàng của Roflumilast: Mâu thuẫn phân tầng suy gan nhẹ `Child-Pugh A` (chặn sai thành B/C hoặc mất sạch cảnh báo tăng 51% AUC) và bỏ lọt chống chỉ định ở phụ nữ đang cho con bú (`lactation: 'avoid'`)

- **Loại mục**: `rule`
- **Định danh**: `getRoflumilastContraReasons` (`src/modules/copd/helpers.ts` dòng 691–700), `copd.followup.roflumilast_indication` & `copd.followup.roflumilast_continue` (`src/modules/copd/rules.escalation.ts`), `src/modules/copd/inputs.ts`
- **Phân tích chi tiết đối chiếu nhãn thuốc FDA Daliresp**:
  1. **Mâu thuẫn logic nghiêm trọng ở bệnh nhân suy gan nhẹ `Child-Pugh A`**:
     - Theo **Nhãn FDA Daliresp (`FDA_label_roflumilast.pdf` Section 4 tr. 3 & Section 8.6 tr. 9)**: Roflumilast chỉ **chống chỉ định** ở suy gan vừa hoặc nặng (**Child-Pugh B hoặc C**). Ở bệnh nhân suy gan nhẹ (**Child-Pugh A**), AUC của roflumilast tăng **51%** và AUC của chất chuyển hóa có hoạt tính roflumilast N-oxide tăng **24%** → FDA yêu cầu **thận trọng tối đa** khi cân nhắc nguy cơ – lợi ích (không chống chỉ định tuyệt đối, nhưng bắt buộc cảnh báo dược động học).
     - Giao diện `src/modules/copd/inputs.ts` (dòng 161) cũng hứa hẹn đúng điều này với nhãn: `'Child-Pugh A (suy gan nhẹ – thận trọng tối đa Roflumilast)'`.
     - Tuy nhiên trong `getRoflumilastContraReasons(ctx)` (`src/modules/copd/helpers.ts` dòng 691–700):
       ```ts
       if (
         childPugh === 'B' ||
         childPugh === 'C' ||
         hasCondition(ctx, 'cirrhosis') ||
         hasCondition(ctx, 'liverDisease') ||
         Boolean(ci.moderateSevereHepaticImpairment)
       ) {
         reasons.push('Suy gan vừa–nặng (Child-Pugh B/C) hoặc bệnh gan mạn / xơ gan');
       }
       ```
       - **Kịch bản H4b**: Bác sĩ tích ô bệnh đồng mắc chung `conditions.liverDisease = true` (*"Bệnh gan mạn"*) rồi trung thực phân loại mức độ tại mục chuyên khoa là `childPugh = 'A'` → Hệ thống **chặn cứng `AVOID`/`STOP`** và báo sai lý do là *"Suy gan vừa–nặng (Child-Pugh B/C)"*!
       - **Kịch bản H4c**: Bác sĩ không tích ô chung mà chỉ chọn `childPugh = 'A'` → Hệ thống phát `CONSIDER` / `CONTINUE` Roflumilast bình thường như người gan khỏe mạnh, **hoàn toàn không có bất kỳ dòng cảnh báo nào** trong `warnings` hay `rationale` về mức tăng 51% AUC ở Child-Pugh A!
  2. **Không thực thi chống chỉ định cho con bú (`lactation.status = 'avoid'`)**:
     - Tệp `kb/drugs/roflumilast.json` đã khai báo chính xác `lactation: { status: "avoid", notesVi: "...không nên sử dụng ở phụ nữ đang cho con bú", citationIds: ["fda.copd.roflumilast_lactation"] }` theo **FDA Daliresp Section 8.2 (PDF p. 8: *"DALIRESP should not be used during nursing"*)**.
     - Tuy nhiên trong `inputs.ts`, `gates.ts` và `getRoflumilastContraReasons(ctx)` hoàn toàn không kiểm tra trạng thái cho con bú (`breastfeeding` / `lactating`). Chạy **Kịch bản B2_6b** (nữ đang cho con bú đang uống `roflumilast 500 mcg`): hệ thống vẫn phát lệnh **`CONTINUE Roflumilast 500 mcg x 1 lần/ngày`**!
- **Hướng khắc phục**:
  1. Tại `getRoflumilastContraReasons(ctx)` (`helpers.ts` dòng 691–700): Chỉ đưa `hasCondition(ctx, 'liverDisease')` vào lý do chống chỉ định khi `childPugh !== 'A'` (tức khi `childPugh` là `'B'`, `'C'` hoặc chưa phân độ `'none'`/rỗng để đảm bảo fail-closed; nếu vẫn tích `cirrhosis` mà chưa loại trừ B/C thì giữ thận trọng chặt). Đồng thời tại `roflumilast_indication` và `roflumilast_continue`, khi `childPugh === 'A'`, tự động đẩy cảnh báo vào `warnings`: *"Suy gan nhẹ (Child-Pugh A): Phơi nhiễm roflumilast tăng ~51% và N-oxide tăng ~24% (FDA Daliresp §8.6) — cân nhắc kỹ lợi ích/nguy cơ và theo dõi sát tiêu chảy, sụt cân, mất ngủ/trầm cảm."*
  2. Bổ sung trường boolean `customInputs.breastfeeding` (hoặc cờ cho con bú dùng chung toàn hệ thống) và kiểm tra trong `getRoflumilastContraReasons(ctx)` để phát `AVOID`/`STOP` Roflumilast ở phụ nữ đang cho con bú kèm trích dẫn `fda.copd.roflumilast_lactation`.

---

### [COPD-R3-R2-08] (MINOR) — Thiếu cảnh báo trùng lặp kháng cholinergic khi dùng định kỳ SAMA (`ipratropium`) + LAMA và thiếu rà soát giảm liều / TDM cho `theophylline` trên nền xơ gan hoặc đợt cấp

- **Loại mục**: `rule`
- **Định danh**: `src/modules/copd/rules.safety.ts`, `src/engine/safety/duplicates.ts`
- **Phân tích & bằng chứng**:
  1. **Phối hợp SAMA (`ipratropium` – Atrovent / Berodual / Combivent) + LAMA nền tảng**:
     - Tại Việt Nam, bệnh nhân COPD rất thường tiếp tục xịt/khí dung định kỳ Berodual hoặc Combivent (chứa `ipratropium`) ngay cả sau khi đã được kê `Spiriva`, `Spiolto`, `Anoro`, `Ultibro` hoặc `Trelegy`.
     - Chạy **Kịch bản B2_7** (`currentMeds: ['tiotropium_olodaterol', 'ipratropium']`): Hệ thống trả về `alerts = []` và `0` khuyến cáo ngừng Ipratropium định kỳ, dù `kb/drugs/tiotropium.json` ghi rõ *"Tránh dùng đồng thời với các thuốc kháng cholinergic khác"* và **GOLD 2026 (PDF p. 155, 157)** cảnh báo tăng cộng gộp độc tính kháng muscarinic (bí tiểu cấp, glôcôm, khô miệng nặng, nhịp tim nhanh) cũng như tác động đối kháng trên thụ thể M2 tiền synap.
  2. **`Theophylline` liều cao trên nền xơ gan `Child-Pugh C` / suy tim hoặc trong đợt cấp COPD**:
     - Chạy **Kịch bản B2_9** (`conditions: { copd: true, cirrhosis: true }`, `childPugh: 'C'`, đang uống `theophylline 300 mg x 2 lần/ngày` = `600 mg/ngày`): Hệ thống phát `0` cảnh báo an toàn, trong khi xơ gan mất bù làm giảm ≥ 50–70% độ thanh thải gan qua CYP1A2 của theophylline, đẩy nồng độ huyết thanh vượt ngưỡng ngộ độc `> 20 mcg/mL` (gây co giật kháng trị và loạn nhịp thất tử vong). Trong đợt cấp nội viện, **GOLD 2026 (PDF p. 103 & p. 114)** cũng nêu rõ: *"Methylxanthines are not recommended due to increased side effect profiles."*
- **Hướng khắc phục**:
  1. Bổ sung quy tắc an toàn phát hiện đồng sử dụng `ipratropium` + thuốc chứa LAMA ở ngoại trú để khuyến cáo ngừng dùng SAMA định kỳ (chỉ dùng SABA cắt cơn khi cần).
  2. Bổ sung quy tắc `copd.safety.theophylline_review` trong `src/modules/copd/rules.safety.ts`: khuyến cáo không dùng methylxanthine trong đợt cấp COPD, và phát cảnh báo `REDUCE`/`MONITOR` yêu cầu giảm ≥ 50% liều hoặc cân nhắc ngừng kèm đo nồng độ thuốc trong máu (TDM đích `8–12 mcg/mL`) khi người bệnh đang dùng `theophylline` kèm xơ gan/bệnh gan, suy tim, tâm phế mạn hoặc tuổi ≥ 70.

---

### [COPD-R3-R2-09] (MINOR) — Khuyết trường `lactation` trên 16/19 tệp thuốc COPD, thiếu ghi chú tăng phơi nhiễm ICS 2.5–3 lần ở suy gan Child-Pugh B/C trên `Trelegy`/`Breztri` và lặp đôi citation trong `rules.followup.ts`

- **Loại mục**: `drug` (liên đới `kb/drugs/*.json` & `src/modules/copd/rules.followup.ts`)
- **Định danh**: 16/19 tệp `kb/drugs/*.json` của COPD; `fluticasone_furoate_umeclidinium_vilanterol.json`, `budesonide_glycopyrronium_formoterol.json`; `src/modules/copd/rules.followup.ts`
- **Phân tích & bằng chứng**:
  1. **16/19 tệp `DrugEntry` của COPD thiếu trường `lactation`**: Kiểm tra tự động `Part 1` (`r2_round3_audit.ts`) cho thấy khi khắc phục `COPD-R2-207`, chỉ có 3 tệp (`roflumilast`, `azithromycin`, `dupilumab`) được giữ trường `lactation`, còn 16 tệp thuốc COPD khác bị xóa mất trường `lactation` (`undefined`), trong khi toàn bộ các tệp thuốc hô hấp dùng chung bên phân hệ Hen (`salbutamol`, `ipratropium`, `budesonide_formoterol`, `fluticasone_salmeterol`, `fluticasone_vilanterol`, `prednisolone`, `methylprednisolone`) đều có đầy đủ cả `pregnancy` và `lactation`. Đáng chú ý, các tài liệu PDF sẵn có trong kho (`FDA_label_aclidinium.pdf` §8.2, `FDA_label_budesonide_glycopyrronium_formoterol.pdf` §8.2, `Ultibro_Breezhaler_SmPC.pdf` §4.6, `Trimbow_SmPC.pdf` §4.6) đều có sẵn đoạn văn chuẩn về thời kỳ cho con bú; các đơn chất còn lại nên khai báo tường minh `lactation: { status: "no_data", notesVi: "...", citationIds: [] }` đồng bộ với `pregnancy`.
  2. **Thiếu cảnh báo tích lũy ICS toàn thân ở suy gan vừa–nặng trên bộ ba `Trelegy` và `Breztri`**:
     - Theo nhãn **FDA Trelegy Ellipta (§8.7 Hepatic Impairment)**: Phơi nhiễm toàn thân của **fluticasone furoate tăng tới gấp 3 lần** ở bệnh nhân suy gan trung bình hoặc nặng (`Child-Pugh B/C`).
     - Theo nhãn **FDA Breztri Aerosphere (§8.6 Hepatic Impairment, PDF p. 20–21)**: Phơi nhiễm toàn thân của **budesonide tăng khoảng 2.5 lần** ở bệnh nhân suy gan nặng (`Child-Pugh C`).
     - Hiện cả hai tệp JSON và các quy tắc kê bộ ba ở bệnh nhân xơ gan / `Child-Pugh B/C` (**Kịch bản B2_8**) chưa có dòng lưu ý theo dõi tác dụng phụ corticoid toàn thân (ức chế trục hạ đồi – tuyến yên – thượng thận, tăng đường huyết, viêm phổi).
  3. **Trùng lặp chuỗi citation trong mã nguồn**: Tại `src/modules/copd/rules.followup.ts`, phần tử `'byt.copd.2026.triple_therapy_indication'` bị viết lặp đôi liên tiếp trong mảng `citationIds` tại **8 vị trí** (dòng 210–211, 251–252, 395–396, 432–433, 448–449, 484–485, 533–534, 619).
- **Hướng khắc phục**:
  1. Điền đầy đủ trường `lactation` cho 16 tệp `kb/drugs/*.json` của COPD (trích xuất nguyên văn từ nhãn FDA Breztri / Tudorza / EMA Ultibro / Trimbow sẵn có, hoặc đặt `status: 'no_data', citationIds: []` cho đơn chất chưa có nhãn riêng).
  2. Bổ sung lưu ý dược động học suy gan Child-Pugh B/C vào `fluticasone_furoate_umeclidinium_vilanterol.json`, `budesonide_glycopyrronium_formoterol.json` và đẩy cảnh báo ngắn vào `warnings` khi kê bộ ba trên bệnh nhân có `liverDisease` / `cirrhosis` / `childPugh === 'B' || childPugh === 'C'`.
  3. Khử trùng lặp `'byt.copd.2026.triple_therapy_indication'` tại 8 mảng `citationIds` trong `src/modules/copd/rules.followup.ts`.

---

### [COPD-R3-R2-10] (SUGGESTION) — Đính kèm lưu ý hội chẩn Sản – Hô hấp khi gợi ý `CONSIDER` khởi trị mới `azithromycin` dự phòng dài ngày hoặc kháng thể đơn dòng (`dupilumab`, `mepolizumab`) trên thai phụ mắc COPD

- **Loại mục**: `rule`
- **Định danh**: `copd.followup.azithromycin_indication`, `copd.followup.dupilumab_indication`, `copd.followup.mepolizumab_indication` (`src/modules/copd/rules.escalation.ts`)
- **Phân tích & kiến nghị**:
  - Trong **Kịch bản B2_6a** (Nữ 36 tuổi, `conditions.pregnant = true`, COPD GOLD 3 Nhóm E do thiếu hụt alpha-1 antitrypsin / di chứng lao phổi, đang dùng bộ ba nhưng còn đợt cấp, BCAT 350 /µL), hệ thống đã xử lý rất tốt việc phát `STOP`/`AVOID` đối với `roflumilast` và duy trì thuốc hít `Trelegy`.
  - Tuy nhiên hệ thống vẫn phát đồng thời 3 thẻ `CONSIDER` khởi trị mới `azithromycin` dự phòng liên tục 1 năm, `dupilumab` và `mepolizumab` với nguyên văn thông thường mà chưa đính kèm cảnh báo thai kỳ trong `warnings`. Do các kháng thể đơn dòng IgG4/IgG1 (`dupilumab`, `mepolizumab`) vận chuyển chủ động qua nhau thai tăng dần trong tam cá nguyệt 2–3 (`gina.copd.2026.pregnancy_biologics_scarce`) và chưa có thử nghiệm ngẫu nhiên dùng macrolide liên tục 12 tháng trên thai phụ, việc thêm một câu lưu ý hội chẩn chuyên khoa Sản – Hô hấp khi `hasCondition(ctx, 'pregnant') === true` sẽ giúp y lệnh thận trọng và chặt chẽ hơn trên lâm sàng.

---

## 5. KẾT LUẬN & LỘ TRÌNH KHẮC PHỤC ĐỂ ĐẠT `PASS`

### Phán quyết cuối cùng Vòng 3 của Reviewer R2: **FAIL**
- **Thống kê phát hiện**: **`1 Critical`**, **`6 Major`**, **`2 Minor`**, **`1 Suggestion`** (Tổng cộng: **10 phát hiện**).
- **Ghi nhận chất lượng**: Nền tảng kiến trúc 7 tệp quy tắc mới của phân hệ `copd`, độ chính xác tuyệt đối **74/74 trích dẫn nguyên văn PDF**, độ phủ dải thận `eGFR 0 → ∞` trên cả 19 thuốc, cơ chế fail-closed phế dung kế/SpO₂ nội viện và logic xử lý đa bình hít mở (`open dual`/`open triple`) đều đạt chất lượng kỹ thuật rất cao.
- **7 Hạng mục bắt buộc xử lý dứt điểm trước khi cấp `PASS` (`0 Critical` & `0 Major`)**:
  1. **`COPD-R3-R2-01` (Critical)**: Sửa ngay xung đột `STOP carvedilol` ở bệnh nhân đồng mắc HFrEF/tim mạch — chuyển thành `SWITCH` gối đầu sang chẹn beta-1 chọn lọc tim (`bisoprolol` / `metoprolol_succinate`) kèm cảnh báo cấm ngừng đột ngột chẹn beta, bảo toàn đủ 4/4 trụ cột HFrEF.
  2. **`COPD-R3-R2-02` (Major)**: Khai báo `narrowAngleGlaucoma` & `urinaryRetention` trong `copd/inputs.ts`, sửa liều `budesonide_formoterol` ở Nhóm E về liều cố định chuẩn COPD (`2 nhát 160/4.5 mcg × 2 lần/ngày`), bổ sung phác đồ giãn phế quản không LAMA ở tái khám/xuất viện và cảnh báo tránh khí dung Ipratropium qua mặt nạ.
  3. **`COPD-R3-R2-03` (Major)**: Bổ sung `InteractionRule` cho `salmeterol` đơn chất (Chống chỉ định theo BYT 2131/2026 STT 34) và `vilanterol` / `umeclidinium_vilanterol` (`Anoro Ellipta`) khi phối hợp thuốc ức chế mạnh CYP3A4 (gồm cả `clarithromycin`, `erythromycin`, `voriconazole`, `posaconazole`), đồng bộ `qtRisk: 'conditional'`.
  4. **`COPD-R3-R2-04` (Major)**: Nhận diện `methylprednisolone` (`Medrol`/`Solu-Medrol`) trong `copd.inpatient.systemic_steroid` để chấm dứt lệnh `SWITCH` nghịch lý, xóa báo động giả `dup.systemic_steroid` và bảo vệ bệnh nhân phụ thuộc corticoid mạn tính khỏi suy thượng thận cấp.
  5. **`COPD-R3-R2-05` (Major)**: Bổ sung `severe_milk_protein_allergy` vào `fluticasone_vilanterol.json`, cảnh báo bắt buộc dùng dạng SMI/pMDI không lactose cho `tiotropium` (`Respimat`), `fluticasone_salmeterol` (`Evohaler`), `budesonide_formoterol` (`Rapihaler`), và kê bình pMDI thay thế khi xuất viện sau đợt cấp.
  6. **`COPD-R3-R2-06` (Major)**: Bổ sung `copd.followup.continue_controller` cho mọi thuốc hít nền tảng ngoài bộ ba (`lama_mono`, `laba_mono`, `laba_lama`, `ics_laba`) và hiện thực hóa đầy đủ `azithromycin_continue` + `biologic_continue` đúng như cam kết tại `round2_RESPONSE.md`.
  7. **`COPD-R3-R2-07` (Major)**: Sửa phân tầng `Child-Pugh A` trong `getRoflumilastContraReasons(ctx)` (không chặn nhầm thành B/C khi tích kèm `liverDisease`, đồng thời luôn xuất cảnh báo tăng 51% AUC theo FDA Daliresp §8.6) và thực thi chặn Roflumilast ở phụ nữ đang cho con bú.
