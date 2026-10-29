# Báo cáo Thẩm định Y khoa Độc lập – Vòng 3 (Round 3): Phân hệ Bệnh thận mạn & Tổn thương thận cấp (`ckd`)

- **Hội đồng Thẩm định**: Reviewer **R1 – Chuyên gia Thận học & Đối chiếu Guideline (Guideline Specialist)**
- **Phân hệ kiểm định**: Bệnh thận mạn & Tổn thương thận cấp (`ckd` — Ngoại trú & Nội viện)
- **Vòng thẩm định**: Vòng 3 (Hậu kiểm toàn diện 42 phát hiện Vòng 2 + Thẩm định độc lập Vòng 3)
- **Ngày hoàn thành**: `2026-10-27`
- **Cam kết độc lập**: Thực hiện kiểm định độc lập 100% ở chế độ chỉ đọc (`READ-ONLY`) trên mã nguồn, cơ sở tri thức (`kb/`) và thư viện tài liệu gốc (`Medical_Library_2026`); hoàn toàn không đọc bất kỳ tệp kết quả Vòng 3 nào của các giám khảo khác (`round3_R2*`, `round3_R3*`).
- **Tệp dữ liệu cấu trúc đi kèm**: [round3_R1.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/round3_R1.json)

---

## 1. Tổng hợp Kết quả Thẩm định Vòng 3

### 1.1. Bảng thống kê số lượng phát hiện theo mức độ nghiêm trọng

| Mức độ (`severity`) | Định nghĩa theo [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md) | Số lượng Vòng 2 (R1) | Số lượng Vòng 3 (R1) | Mã phát hiện Vòng 3 |
| :--- | :--- | :---: | :---: | :--- |
| **`critical`** | Có thể gây hại trực tiếp cho bệnh nhân nếu làm theo (quá liều độc thận/kali, bỏ sót chống chỉ định tuyệt đối, sai công thức/đơn vị nguy hiểm) | 2 | **0** | *(Không có — toàn bộ lỗi `critical` Vòng 2 của cả 3 giám khảo đã được triệt tiêu)* |
| **`major`** | Sai hướng dẫn điều trị / sai trần liều nhãn gốc, khuyến cáo tự mâu thuẫn lâm sàng, bỏ sót chỉ định nhóm I / 1B, hoặc gãy luồng giao diện cấp cứu | 5 | **6** | `CKD-R3-R1-01`, `CKD-R3-R1-02`, `CKD-R3-R1-03`, `CKD-R3-R1-04`, `CKD-R3-R1-05`, `CKD-R3-R1-06` |
| **`minor`** | Chưa chuẩn xác mức độ COR/LOE, nhầm số bảng Guideline, trùng thẻ thông báo hoặc lỗi hiển thị đơn vị nhỏ không gây hại trực tiếp | 4 | **3** | `CKD-R3-R1-07`, `CKD-R3-R1-08`, `CKD-R3-R1-09` |
| **`suggestion`** | Đề xuất cải thiện trải nghiệm lâm sàng tùy chọn | 1 | **0** | *(Không có)* |
| **TỔNG CỘNG** | | **12** | **9** | |

### 1.2. Đánh giá tổng quan chất lượng sau khắc phục Vòng 2

1. **An toàn người bệnh cốt lõi (`0 critical`)**: Đội ngũ phát triển đã khắc phục triệt để toàn bộ **10/10 phát hiện `critical`** từ cả 3 giám khảo ở Vòng 2 (`CKD-R2-R1-01..02`, `CKD-R2-R3-01..05`). Cụ thể: đã chuẩn hóa đơn vị `baselineScr` (`mg/dL` sang `µmol/L`) trong [helpers.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts), đóng kín cổng huyết động `fail-closed` khi thiếu `sbp` hoặc khi tụt huyết áp cấp (`SBP < 90–100 mmHg`), khóa hoàn toàn chỉ định Finerenone trên bệnh nhân lọc máu định kỳ (`onDialysis`), quét đủ lớp thuốc NSAID (`indomethacin`) + lợi tiểu quai (`torsemide`) trong bộ ba độc thận *Triple Whammy*, bổ sung chuyển tuyến cấp cứu toan chuyển hóa nặng ngoại trú (`HCO3- < 10 mmol/L`), và chặn đích hạ áp tích cực `< 120 mmHg` trên phụ nữ mang thai.
2. **Độ trung thực trích dẫn PDF (`kb/citations/ckd.json`)**: Kiểm tra tự động toàn bộ **107 trích dẫn** trong [ckd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/ckd.json) đối chiếu trực tiếp với văn bản PDF gốc trong `Medical_Library_2026` xác nhận **107/107 (100%)** câu trích dẫn tiếng Anh (`quote`) khớp nguyên văn đúng trang `pdfPage` đã khai báo.
3. **Các tồn tại mức `major` cần xử lý dứt điểm trước khi nghiệm thu (`6 major`)**: Quá trình viết mã bổ sung sau Vòng 2 đã phát sinh hoặc để sót 6 lỗi thực chất về đối chiếu Guideline/nhãn thuốc và tích hợp UI:
   - Không nối `preset.setting` vào [AppShell.tsx](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L510-L513), làm vô hiệu hóa phác đồ cấp cứu nội viện khi người dùng bấm chọn bệnh nhân mẫu **BN 3** và **BN 4** (`CKD-R3-R1-01`).
   - Áp đặt trần liều thận giả tạo cho các thuốc ARB thải trừ qua gan/mật (**Losartan, Valsartan, Telmisartan, Irbesartan**) trong `kb/drugs/*.json` kết hợp quy tắc mới `rasi_renal_dose_reduce`, dẫn đến phát lệnh `[REDUCE]` hạ liều Losartan 100 mg xuống `25–50 mg/ngày` ở CKD G4 trái ngược trực diện với nhãn FDA Cozaar Mục 8.7, Hướng dẫn Bộ Y tế 2024 Bảng 12 và KDIGO 2024 (`CKD-R3-R1-02`).
   - Quy tắc mới `glp1ra_indication` bỏ sót nhóm ĐTĐ2 + CKD G4 (`eGFR 15–24`) không dùng được Metformin & SGLT2i (KDIGO 2024 Rec 3.9.1 `1B` / ADA 2026 Rec 11.7b `A` / BYT 2024 Bảng 45), dùng sai toán tử `>` thay vì `>=` cho ngưỡng UACR của ESC 2026 Bảng 12, và ghi sai mức bằng chứng ESC 2026 (`Level B` thay vì `Level A`) cùng số mục ADA 2026 (`11.4b` thay vì `11.7b`) (`CKD-R3-R1-03`).
   - Cụm quy tắc Finerenone gắn **2 `citationIds` ma không tồn tại trong KB** (`fda.finerenone.hf_40mg_target`, `fda.finerenone.hf_titration_k_5_0`), sai lệch điểm biên `LVEF = 40%` và ngưỡng `K+ < 5.0` (Bảng 3 FDA), đồng thời phát `[START] Finerenone` song song với `[UPTITRATE] RASi` khi RASi chưa tối ưu (`CKD-R3-R1-04`).
   - Quy tắc `rasi_initiate` dùng `sbp >= 129` (cận trên của khoảng bình thường `120–129 mmHg`) làm tiêu chuẩn tăng huyết áp, gây mâu thuẫn trực diện giữa thẻ `CONTINUE` huyết áp đạt đích và thẻ `START` Perindopril hạ áp ở bệnh nhân CKD A1 có `HA = 129/76 mmHg` (`CKD-R3-R1-05`).
   - Quy tắc `contrast_aki_prevention` tuyên bố sai rằng ESC 2026 khuyến cáo **`Class I`** truyền NaCl 0.9% quanh thủ thuật (bản gốc ESC 2026 Bảng 30 là **`Class IIb, Level C`** ở `eGFR < 30`) và phát lệnh bắt buộc `[START]` truyền dịch cho mọi ca chụp CT tĩnh mạch ở cả dải G3b (`eGFR 30–44`) (`CKD-R3-R1-06`).

---

## 2. Hậu kiểm Toàn diện 42 Phát hiện Vòng 2 (`Round 2 Post-Remediation Audit`)

Bảng dưới đây kiểm chứng độc lập bằng mã nguồn và thực thi trực tiếp `evaluate()` đối với toàn bộ **42 phát hiện Vòng 2** từ `round2_R1.json` (12 mục), `round2_R2.json` (13 mục) và `round2_R3.json` (17 mục):

### 2.1. Hậu kiểm 12 phát hiện của Reviewer R1 (`CKD-R2-R1-01` → `CKD-R2-R1-12`)

| Mã Vòng 2 | Mức độ V2 | Nội dung tóm tắt | Trạng thái hậu kiểm Vòng 3 | Bằng chứng kiểm chứng thực tế |
| :--- | :---: | :--- | :---: | :--- |
| `CKD-R2-R1-01` | `critical` | Không chuẩn hóa đơn vị `baselineScr` (`mg/dL` vs `µmol/L`) gây chẩn đoán giả AKI Giai đoạn 3 | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Hàm [`getNormalizedBaselineScr`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L53-L61) nhân `88.4` khi `units.cr === 'mg_dL'`; kiểm thử `scr=1.2, baselineScr=1.2 mg/dL` trả về 0 cảnh báo AKI. |
| `CKD-R2-R1-02` | `critical` | `sglt2i_initiate` fail-open khi thiếu `sbp`; `bp_target` báo `CONTINUE` khi tụt HA `SBP = 82–92 mmHg` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | [`sglt2i_initiate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L206) kiểm tra `sbp !== undefined && sbp >= minSbp` (`DEFER` khi thiếu HA); `bp_target` tách riêng nhánh hạ áp/sốc `< 90–100 mmHg` và nhánh thiếu `sbp`. |
| `CKD-R2-R1-03` | `major` | Bỏ sót hoàn toàn trụ cột thứ 4 GLP-1 RA (Semaglutide SC) cho ĐTĐ2 + CKD | **KHẮC PHỤC MỘT PHẦN (CÒN LỖI)** | Đã thêm [`ckd.outpatient.glp1ra_indication`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.extra.ts#L68-L258), nhưng bỏ sót dải `eGFR 15–24` không dùng được SGLT2i/Metformin, sai biên `uacr > 10/30` thay vì `>=`, và ghi sai `ESC Level B` / `ADA 11.4b` → **Xem `CKD-R3-R1-03`**. |
| `CKD-R2-R1-04` | `major` | Chỉ định lọc máu cấp cứu cho mọi BN chưa lọc máu chỉ dựa trên `K+ >= 6.5` đơn độc; dịch thiếu *"haemodialysis patients"* | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | [`emergency_dialysis_indication`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.ts#L569-L598) yêu cầu `onDialysis || refractoryHyperkalemia || isAnuria || ...`; `quoteVi` tại [ckd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/ckd.json#L416) đã dịch đúng *"bệnh nhân đang lọc máu chu kỳ"*. |
| `CKD-R2-R1-05` | `major` | Finerenone kê cho HFrEF `LVEF <= 40%`, thiếu liều đích `40 mg` cho HF `LVEF >= 40%`, tiêu đề dài | **KHẮC PHỤC MỘT PHẦN (PHÁT SINH LỖI MỚI)** | Đã chặn HFrEF và thêm nhánh `40 mg`, rút gọn `title`; tuy nhiên gắn 2 `citationIds` không tồn tại, lệch biên `LVEF = 40%` (`> 40` vs `>= 40`) và sai ngưỡng `K+ < 5.0` ở bước `10 -> 20 mg` HF → **Xem `CKD-R3-R1-04`**. |
| `CKD-R2-R1-06` | `major` | `bp_target` gộp sai hồ sơ `US` vào `VN`, bỏ qua `DBP >= 80`, áp cứng lý giải `eGFR >= 30` cho G4–G5 | **ĐÃ KHẮC PHỤC (CÒN LỖI NHỎ SỐ BẢNG)** | Đã tách rõ 3 profile (`INTL`, `US` `< 130/80`, `VN`), kiểm tra cả `DBP < 80` và tách nhóm `eGFR < 30` / lọc máu; chỉ còn ghi nhầm số bảng ESC `Bảng 11` thay vì `Bảng 9` và dấu `<= 30` trong chuỗi chữ → **Xem `CKD-R3-R1-07`**. |
| `CKD-R2-R1-07` | `major` | Bấm chọn Preset nội viện BN 3 & BN 4 trên UI mặc định không chuyển sang `inpatient` và bị gán nhầm `uacr: 25` | **KHẮC PHỤC DỞ DANG (CÒN LỖI MAJOR)** | Đã sửa `buildPatientFromPreset` không gán nhầm `uacr: 25`, nhưng [AppShell.tsx](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L510-L513) vẫn KHÔNG đọc `preset.setting` để đổi `settings.setting` sang `'inpatient'` → **Xem `CKD-R3-R1-01`**. |
| `CKD-R2-R1-08` | `minor` | Hiển thị `"undefined"` hoặc chuỗi rỗng trong tiêu đề lệnh `HOLD` khi thiếu `CurrentMed.name` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã dùng hàm [`medDisplayName`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L103-L110) tra cứu `drug(id).nameVi` dự phòng trên toàn bộ quy tắc nội/ngoại trú. |
| `CKD-R2-R1-09` | `minor` | Bất nhất lựa chọn/liều Perindopril ở CKD G4–G5 (`VN` CrCl < 30 và cột G5 chưa lọc máu trong `matrix.ts`) | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | `rasi_initiate` chuyển sang `losartan` khi `VN` có `CrCl/eGFR < 30` hoặc G5, `perindopril.json` và `matrix.ts` tách rõ ghi chú G5 chưa lọc máu với lọc máu. |
| `CKD-R2-R1-10` | `minor` | Cột `AKI` của `matrix.ts` gán cứng `rec` cho cả Calcium Resonium, Patiromer và Bicarbonat | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | [`getAkiCell`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/matrix.ts#L139-L195) đã phân tầng chính xác: SZC `ok` (cấp cứu tăng K+), Patiromer `caution`, CPS `avoid` trong cấp cứu tăng K+ nặng (UKKA 16.6.3), Bicarbonat uống `caution`. |
| `CKD-R2-R1-11` | `minor` | Thiếu quy tắc `ckd.inpatient.hyperkalemia_severe_szc_order` dù tài liệu ghi đã có | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã hiện thực hóa [`ckd.inpatient.hyperkalemia_severe_szc_order`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.ts#L397-L448) (`drugId: 'sodium_zirconium_cyclosilicate'`, `10 g x 3 lần/ngày`). |
| `CKD-R2-R1-12` | `suggestion` | `pathway.ts` thiếu trụ cột thứ 4 GLP-1 RA; chưa có gợi ý `Cystatin C` ở nhóm G3aA1 | **ĐÃ KHẮC PHỤC (SAI NHỎ LOE)** | Đã cập nhật [`pathway.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/pathway.ts#L36-L46) đủ 4 trụ cột và thêm `cystatin_c_g3aa1_confirm` (ghi nhầm `Grade 1B` thay vì `1C` → **Xem `CKD-R3-R1-09`**). |

### 2.2. Hậu kiểm 13 phát hiện của Reviewer R2 (`CKD-R2-R2-01` → `CKD-R2-R2-13`)

| Mã Vòng 2 | Mức độ V2 | Nội dung tóm tắt | Trạng thái hậu kiểm Vòng 3 | Bằng chứng kiểm chứng thực tế |
| :--- | :---: | :--- | :---: | :--- |
| `CKD-R2-R2-01` | `major` | Bỏ sót `telmisartan, irbesartan, candesartan` trong `ix.rasi_mra_potassium_sparing` và các luật tương tác RASi | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | [renal_rasi.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/renal_rasi.json#L77-L204) đã liệt kê đầy đủ 6 ARB + ACEi + ARNI; `rasi_uptitrate` chặn chuẩn độ khi dùng kèm lợi tiểu giữ kali/MRA. |
| `CKD-R2-R2-02` | `major` | `rasi_uptitrate` bỏ qua trần liều thận của ACEi thải qua thận (Perindopril, Ramipril, Enalapril, Lisinopril) | **ĐÃ KHẮC PHỤC CHO ACEi NHƯNG GÂY TÁC DỤNG PHỤ TRÊN ARB** | Đã chặn đúng `UPTITRATE` cho ACEi vượt trần thận, nhưng do áp chung hàm cắt trần cho cả ARB có dữ liệu `renal` sai nên gây lỗi hạ liều sai trên Losartan/Valsartan/Telmisartan/Irbesartan → **Xem `CKD-R3-R1-02`**. |
| `CKD-R2-R2-03` | `major` | Thiếu luật `STOP/HOLD` chất gắn kali khi hạ kali máu hoặc CPS khi `K+ < 5.0 mmol/L` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã bổ sung luật dừng K-binder khi hạ kali và dừng CPS khi `K+ < 5.0` (`rec_ckd_hold_cps_k_below_5`), kiểm chứng tại `K+ = 4.4 mmol/L` phát `[STOP]` chính xác. |
| `CKD-R2-R2-04` | `major` | `rasi_initiate` phát `START` 1B ngay cả ở CKD G5 chưa lọc máu (`eGFR < 15`) | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Ở `eGFR < 15` chưa lọc máu, [`rasi_initiate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L510-L535) đã hạ xuống `CONSIDER` thận trọng và chuyển sang ARB thay vì Perindopril. |
| `CKD-R2-R2-05` | `major` | `ckdMatrix.aki` gán `rec` vô điều kiện cho CPS và Patiromer trong đợt cấp AKI | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Trùng `CKD-R2-R1-10`; đã sửa tại `matrix.ts`. |
| `CKD-R2-R2-06` | `major` | Sai khoảng cách uống thuốc kèm của CPS (`2 giờ` thay vì `3 giờ / 6 giờ` theo SmPC) | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | [calcium_polystyrene_sulfonate.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/calcium_polystyrene_sulfonate.json) và [diabetes_respiratory.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/diabetes_respiratory.json#L431) đã cập nhật chuẩn `>= 3 giờ` (`6 giờ` nếu liệt dạ dày). |
| `CKD-R2-R2-07` | `minor` | Tiêu đề `finerenone` nhồi câu mô tả dài kèm liều 40 mg của HF vào thẻ CKD đơn thuần | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã dùng chuỗi liều rút gọn theo đúng chỉ định của từng bệnh nhân. |
| `CKD-R2-R2-08` | `minor` | Bất nhất cột `g4`, `g5`, `dialysis` trong `matrix.ts` và thiếu dải `eGFRTo: 15` của `ramipril, valsartan, candesartan` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã tách ghi chú G5/lọc máu, dùng trung điểm G4 `(15 + 30)/2 = 22.5` tại `matrix.ts` và thêm dải `< 15` (tuy nhiên con số mg của ARB cần chuẩn hóa theo nhãn tại `CKD-R3-R1-02`). |
| `CKD-R2-R2-09` | `minor` | `perindopril.json` chưa ghi rõ dạng muối arginine `2.5/5/10 mg` phân biệt với erbumine `2/4/8 mg` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã cập nhật rõ quy đổi hai dạng muối arginine/erbumine trong `kb/drugs/perindopril.json`. |
| `CKD-R2-R2-10` | `minor` | Thiếu thông tin suy gan (`hepatic`) cho `finerenone`, `losartan`, `telmisartan` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã bổ sung trường `hepatic` kèm citations FDA/BYT cho cả 3 hoạt chất và chống chỉ định tắc mật cho `telmisartan.json`. |
| `CKD-R2-R2-11` | `minor` | `lactation` của CPS ghi sai `compatible`, thiếu chống chỉ định tắc ruột, và trùng 2 alert giãn cách SZC | **KHẮC PHỤC 2/3 Ý (CÒN TRÙNG ALERT SZC)** | Đã sửa `lactation: 'caution'` và thêm `obstructive_bowel_disease` cho CPS, nhưng SZC vẫn còn mặt ở cả `ix.potassium_binder_drug_binding` lẫn `ix.szc_binder_separation` → **Xem `CKD-R3-R1-09`**. |
| `CKD-R2-R2-12` | `minor` | Thiếu `drugId` chất gắn kali và `profileDiff` ở `hyperkalemia_moderate` nội viện | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã gắn `drugId` theo profile (`VN`: CPS/SZC; `INTL/US`: SZC) và bổ sung `profileDiff` đầy đủ trong `rules.inpatient.ts`. |
| `CKD-R2-R2-13` | `suggestion` | Chưa có luật `HOLD/REDUCE` Natri Bicarbonat khi `HCO3- > 26 mmol/L` (kiềm chuyển hóa) | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã bổ sung [`ckd.outpatient.metabolic_alkalosis_hold_bicarb`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.extra.ts#L769-L824), kiểm chứng tại `HCO3- = 28` phát `[HOLD]` chính xác. |

### 2.3. Hậu kiểm 17 phát hiện của Reviewer R3 (`CKD-R2-R3-01` → `CKD-R2-R3-17`)

| Mã Vòng 2 | Mức độ V2 | Nội dung tóm tắt | Trạng thái hậu kiểm Vòng 3 | Bằng chứng kiểm chứng thực tế |
| :--- | :---: | :--- | :---: | :--- |
| `CKD-R2-R3-01` | `critical` | Bệnh nhân đang lọc máu (`onDialysis = true`) có `eGFR` sau lọc `>= 15` đang uống Finerenone bị bỏ lọt | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã thêm chống chỉ định `dialysis` vào `finerenone.json`, chặn tại `reviewMeds.ts` và thêm `rec_ckd_finerenone_stop_dialysis` (`[STOP]`, priority 105). |
| `CKD-R2-R3-02` | `critical` | Luật chắn NSAID bỏ lọt `indomethacin`, sai chính tả `torsemide`, bỏ qua `takingNsaid` và `hasScrRise` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã truy vấn theo lớp thuốc chuẩn hóa KB (`nsaid`, `loop_diuretic`, `thiazide_diuretic`), bắt cờ `takingNsaid` và dùng chung `isAkiActive(ctx)`; kiểm chứng `Indomethacin + Losartan + Torsemide` phát `[STOP]` ngay lập tức. |
| `CKD-R2-R3-03` | `critical` | `sglt2i_initiate` fail-open khi `sbp === undefined` và thiếu `missingInputRec` cho `sbp` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã đóng `fail-closed` (`DEFER`) và bổ sung `missing_sbp_check` nhắc đo huyết áp. |
| `CKD-R2-R3-04` | `critical` | Toan chuyển hóa rất nặng ngoại trú (`HCO3- = 7 mmol/L`) không phát lệnh `REFER` cấp cứu và vẫn kê SGLT2i | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã bổ sung `acidosis_emergency_refer` (`HCO3- < 10 mmol/L` -> `[REFER]`) và hàm `isOutpatientAcuteCrisis(ctx)` chặn khởi trị thuốc mạn tính trong cơn cấp. |
| `CKD-R2-R3-05` | `critical` | `bp_target` ép hạ HA `< 120` trên thai phụ và báo `Đạt mục tiêu` ở sốc `SBP = 78 mmHg` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã chặn đích `< 120` trên thai kỳ, thêm `hypotension_crisis_refer` (`SBP < 90` -> `[REFER]`) và tạm hoãn toàn bộ thuốc dự phòng mạn tính khi cấp cứu. |
| `CKD-R2-R3-06` | `major` | `rasi_uptitrate` tăng liều Perindopril vượt trần thận ở G4 và chạy cả khi `egfr === undefined` | **ĐÃ KHẮC PHỤC CHO ACEi (LỖI PHỤ TRÊN ARB)** | Đã yêu cầu `egfr !== undefined` và chặn trần ACEi; phần lỗi phụ trên ARB ghi nhận tại **`CKD-R3-R1-02`**. |
| `CKD-R2-R3-07` | `major` | Hồi quy kê Finerenone ở HFrEF `LVEF <= 40%` khi bật đơn lẻ module `ckd` | **ĐÃ KHẮC PHỤC** | `finerenone_indication` chuyển sang `AVOID` hướng dẫn ưu tiên MRA steroid khi `lvef <= 40` (lưu ý đồng bộ điểm biên `LVEF = 40%` tại `CKD-R3-R1-04`). |
| `CKD-R2-R3-08` | `major` | Xung đột đa module `merge.ts` sinh thẻ `[AVOID]` giả cho thuốc không uống và kê Statin mới trên lọc máu | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã sửa `resolveClassConflicts` trong `src/engine/merge.ts` giữ thuốc đang dùng hợp lệ và ẩn ứng viên thua cuộc chưa dùng. |
| `CKD-R2-R3-09` | `major` | Bệnh nhân không ĐTĐ, không THA có A2 (`UACR = 15`) bị phát `START` Perindopril gắn nhầm trích dẫn A3 (1B) | **KHẮC PHỤC CHO `SBP <= 128` NHƯNG LỖI BIÊN TẠI `SBP = 129`** | Đã tách đúng nhánh A2 không ĐTĐ không THA (`CONSIDER` 2C), song do viết `sbp >= 129` nên tại `SBP = 129` vẫn bị xếp nhầm vào THA (kể cả ở A1!) → **Xem `CKD-R3-R1-05`**. |
| `CKD-R2-R3-10` | `major` | `statin_indication` gán nhãn 1A khi `egfr === undefined`; thiếu nhắc nhập `age/sex`; chưa tính `egfrCys` đơn độc | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã kiểm tra `egfr !== undefined`, thêm nhắc thiếu `age/sex` và hỗ trợ CKD-EPI 2021 Cystatin C đơn độc trong `derive.ts`. |
| `CKD-R2-R3-11` | `major` | Thiếu rà soát lợi tiểu trong AKI, thiếu xử trí K+ `5.1–5.9` nội viện, sai câu cổng ECG `K+ 5.2 >= 6.5`, và thẻ `CHUYỂN CẤP CỨU` ở nội viện | **KHẮC PHỤC 3/4 Ý (CÒN THẺ CHUYỂN VIỆN NỘI TRÚ)** | Đã thêm rà soát lợi tiểu trong AKI, thêm `inpatient_hyperkalemia_mild` (`5.0 < K+ < 6.0`), sửa câu gate ECG; riêng thẻ `emergency_hyperkalemia_critical` vẫn xuất ở nội viện → **Xem `CKD-R3-R1-08`**. |
| `CKD-R2-R3-12` | `major` | `AVOID` (100) đè `STOP` (90) trên thuốc đang uống và nổ cảnh báo tương tác giả trên thuốc đã `STOP/HOLD` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | `merge.ts` giữ hành động `STOP` cho thuốc trong `currentMeds` và `interactions.ts` loại trừ thuốc đã `STOP/HOLD` khỏi cảnh báo tương tác mới. |
| `CKD-R2-R3-13` | `minor` | Gộp nhiều thuốc vào 1 thẻ `HOLD`, trùng thẻ thai kỳ tổng hợp, và trùng 2 thẻ `REFER` ở `K+ >= 6.0` ngoại trú | **KHẮC PHỤC 2/3 Ý (CÒN TRÙNG 2 THẺ REFER K+ >= 6.0)** | Đã tách thẻ `HOLD`/`STOP` theo từng hoạt chất cá thể, nhưng ngoại trú `K+ >= 6.0` vẫn xuất 2 thẻ `REFER` trùng nhau → **Xem `CKD-R3-R1-08`**. |
| `CKD-R2-R3-14` | `minor` | Nhãn profile `US` sai, thiếu giải thích tăng liều RASi vì đạm niệu, thiếu `CONTINUE` cho Finerenone & Statin lọc máu | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã sửa nhãn `US`, bổ sung giải thích giảm đạm niệu, thêm `finerenone_continue` và `statin_continue_dialysis`. |
| `CKD-R2-R3-15` | `minor` | Ngưỡng `eGFR < 60` của `contrast_aki_prevention` quá rộng cho chụp CT tĩnh mạch G3a | **HẠ XUỐNG `< 45` NHƯNG VẪN RỘNG HƠN ESC 2026 (`< 30`) VÀ GHI SAI `CLASS I`** | Đã hạ G3a xuống `CONSIDER`, nhưng G3b (`30–44`) CT tĩnh mạch vẫn phát `START` kèm câu thuyết minh sai `ESC 2026 Class I` (thực tế là `Class IIb, Level C` ở `< 30`) → **Xem `CKD-R3-R1-06`**. |
| `CKD-R2-R3-16` | `suggestion` | `hasCondition(ctx, 'pregnant')` chưa đọc dự phòng `customInputs.pregnant` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Hàm [`hasCkdFlag`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L31-L42) và `hasCondition` đã kiểm tra dự phòng `customInputs.pregnant`; kiểm chứng phát `[STOP]` đầy đủ. |
| `CKD-R2-R3-17` | `suggestion` | Chuỗi `fmtDose` trong `title` quá dài và lặp thông tin | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** | Đã thay bằng `fmtShortDose` ngắn gọn trên toàn bộ các thẻ khuyến cáo CKD. |

---

## 3. Chi tiết Các Phát hiện Thẩm định Vòng 3 (`CKD-R3-R1-01` → `CKD-R3-R1-09`)

### [CKD-R3-R1-01] (`MAJOR` | `ui` | `ckd.presets.inpatient_context_mismatch`)
**Tiêu đề**: Khắc phục dở dang `CKD-R2-R1-07`: Bấm chọn bệnh nhân mẫu nội viện/cấp cứu **BN 3** & **BN 4** trên giao diện không chuyển `settings.setting` sang `'inpatient'`, làm ẩn toàn bộ phác đồ hồi sức tăng Kali máu nặng 5 bước UKKA và cảnh báo phân độ KDIGO AKI

- **Tệp liên quan**:
  - [AppShell.tsx](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L510-L513)
  - [types.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/types.ts#L669-L674)
  - [presets.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/presets.ts#L78-L154)
- **Phân tích sai lệch**:
  - Báo cáo giải trình [round2_RESPONSE.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/round2_RESPONSE.md#L81-L84) ghi nhận rằng `presets.ts` đã khai báo `setting: 'inpatient'` để `AppShell.tsx` tự động chuyển bối cảnh. Tuy nhiên thực tế kiểm tra mã nguồn cho thấy:
    1. Interface `PresetPatient` tại [types.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/types.ts#L669-L674) không hề khai báo trường `setting?: Setting` (`presets.ts:154` đã dùng ép kiểu `as PresetPatient[]` để bỏ qua kiểm tra kiểu của TypeScript).
    2. Hàm xử lý sự kiện `onClick` tại [AppShell.tsx](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L510-L513) chỉ gọi duy nhất `setPatient(buildPatientFromPreset(preset, patient.selectedModules))` mà hoàn toàn không gọi `setSettings(...)`!
- **Kiểm chứng thực thi `evaluate()` theo đúng luồng `AppShell.tsx`**:
  - **Ca BN 4 (`ckd_preset_4_severe_hyperkalemia_emergency`: Cấp cứu Nội viện – Tăng Kali máu `6.8 mmol/L` có sóng T nhọn & QRS dãn rộng)** khi bấm từ màn hình mặc định (`INITIAL_SETTINGS.setting = 'outpatient'`):
    - Kết quả thực tế: Xuất **0 y lệnh hồi sức nội viện** — vắng mặt hoàn toàn thẻ `[START] rec_ckd_hyperkalemia_severe_bundle` (tiêm tĩnh mạch chậm Calcium Gluconate 10% 30 mL bảo vệ cơ tim + truyền Insulin 10 IU / Glucose 25 g + khí dung Salbutamol) và `[START] rec_ckd_hyperkalemia_severe_szc_order` (Lokelma 10 g x 3 lần/ngày), thay vào đó lại hiện 2 thẻ ngoại trú *"CHUYỂN CẤP CỨU KHẨN CẤP"* cho một bệnh nhân đã có nhãn *"Cấp cứu Nội viện"*!
  - **Ca BN 3 (`ckd_preset_3_inpatient_aki_stage2`: Nội trú – Đợt cấp AKI Giai đoạn 2, SCr tăng `130 -> 280 µmol/L`, thiểu niệu, `K+ = 5.3 mmol/L`)** khi bấm từ màn hình mặc định:
    - Kết quả thực tế: Bỏ sót hoàn toàn thẻ phân độ `[MONITOR] rec_ckd_aki_stage_alert` (*"TỔN THƯƠNG THẬN CẤP TRÊN NỀN MẠN: Giai đoạn 2"*) và `[MONITOR] rec_ckd_inpatient_hyperkalemia_mild`.
  - **Chiều ngược lại**: Nếu người dùng chuyển thanh công cụ sang `Nội trú` để xem BN 4 rồi bấm quay lại **BN 1** hoặc **BN 2** (`setting: 'outpatient'`), toàn bộ 4 trụ cột bảo vệ thận ngoại trú trả về mảng rỗng `[]`.
- **Bằng chứng Guideline gốc**:
  - **UKKA 2022 Acute Hyperkalaemia Guideline – Guideline 16.2 & 16.3.1** (`UKKA_2022_Treatment_Acute_Hyperkalaemia_Adults.pdf`, PDF tr. 12–13):
    > *"Guideline 16.2: We recommend intravenous calcium chloride or calcium gluconate, at an equivalent dose (6.8 mmol), is given to patients with hyperkalaemia in the presence of ECG changes at presentation. (1C)"*
    > *"Guideline 16.3.1: We recommend an infusion of 10 units soluble insulin with 25g glucose for treatment of severe hyperkalaemia (K+ ≥ 6.5 mmol/L) in hospitalised patients. (1B)"*
- **Hướng khắc phục**: Khai báo chính thức `setting?: Setting;` trong `PresetPatient` tại [types.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/types.ts#L669-L674), gỡ `as PresetPatient[]` tại `presets.ts:154`, và bổ sung `if (preset.setting) setSettings((prev) => ({ ...prev, setting: preset.setting! }));` tại [AppShell.tsx](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L510-L513).

---

### [CKD-R3-R1-02] (`MAJOR` | `drug` | `ckd.outpatient.rasi_renal_dose_reduce`)
**Tiêu đề**: Trần liều thận giả tạo của các thuốc ARB thải trừ qua gan/mật (**Losartan, Valsartan, Telmisartan, Irbesartan**) trong `kb/drugs/*.json` kết hợp quy tắc `rasi_renal_dose_reduce` bắt giảm liều sai quy chuẩn nhãn FDA & Hướng dẫn BYT 2024 ở CKD G4–G5

- **Tệp liên quan**:
  - [losartan.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/losartan.json#L48-L66), [valsartan.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/valsartan.json#L47-L65), [telmisartan.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/telmisartan.json#L48-L55), [irbesartan.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/irbesartan.json#L47-L54)
  - [rules.outpatient.extra.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.extra.ts#L264-L355) & [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L660-L760)
- **Phân tích sai lệch**:
  - Khác với nhóm ACEi thải trừ qua thận (Perindopril, Enalapril, Ramipril, Lisinopril), các thuốc ức chế thụ thể AT1 (ARB) như **Losartan, Valsartan, Telmisartan, Irbesartan** thải trừ chủ yếu qua đường gan/mật và không bị lọc qua màng thận nhân tạo. Cả nhãn FDA lẫn Hướng dẫn Bộ Y tế 2024 đều khẳng định **không cần giảm liều tối đa theo mức lọc cầu thận** (trừ khi bệnh nhân đang thiếu dịch nội mạch).
  - Tuy nhiên, `losartan.json` ghi dải `eGFR 15–30: "25–50 mg/ngày"` và `< 15: "25 mg/ngày"` (gán nhầm citation `kdigo.ckd.2024.pp_3_6_7_continue_egfr_below_30` vốn không hề chứa con số trần mg nào); `valsartan.json` ghi `"40–160 mg/ngày"` và `"40–80 mg/ngày"`; `telmisartan.json` ghi `< 15: "20–40 mg/ngày"`; `irbesartan.json` ghi `< 15: "75–150 mg/ngày"`.
  - Khi quy tắc mới `ckd.outpatient.rasi_renal_dose_reduce` quét trần số học từ `renal.dose`, hệ thống vừa phát lệnh **`[REDUCE]` bắt hạ liều ARB đang dung nạp ổn định**, vừa chặn quy tắc `rasi_uptitrate` không cho tăng Losartan từ `50 mg` lên liều đích bảo vệ thận `100 mg/ngày` (thử nghiệm RENAAL) ở CKD G4!
- **Bằng chứng Nhãn FDA & Guideline gốc (nguyên văn)**:
  - **FDA Cozaar (Losartan) Label – Section 2.3 & Section 8.7** (`FDA_label_losartan.pdf`, PDF tr. 5 & tr. 12):
    > *"2.3 Nephropathy in Type 2 Diabetic Patients: The usual starting dose is 50 mg once daily. The dose should be increased to 100 mg once daily based on blood pressure response."*
    > *"8.7 Renal Impairment: Patients with renal insufficiency have elevated plasma concentrations of losartan and its active metabolite compared to subjects with normal renal function. **No dose adjustment is necessary in patients with renal impairment unless a patient with renal impairment is also volume depleted**."*
  - **Hướng dẫn Bộ Y tế 2024 – Bảng 12: Chỉnh liều một số thuốc ƯCMC và ƯCTT trong BTM** (`BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf`, PDF tr. 39):
    > - *"Losartan | Liều khởi đầu: 50 mg, 1 lần/ngày | Liều tối đa: 100 mg | **Không cần điều chỉnh liều lượng. Không thải qua màng lọc thận nhân tạo**"*
    > - *"Valsartan | Liều khởi đầu: 80 mg, 1 lần/ngày | Liều tối đa: 320 mg | **Không có điều chỉnh liều lượng cho CrCl < 30ml/phút- thận trọng khi dùng. Không thải qua màng lọc thận nhân tạo**"*
    > - *"Irbesartan | 150 mg, 1 lần/ngày | 300 mg | **Không cần điều chỉnh liều lượng. Không thải qua lọc thận nhân tạo**"*
    > - *"Telmisartan | 40 mg, 1 lần/ngày | 80 mg | **Không cần điều chỉnh liều lượng. Không thải qua màng lọc thận nhân tạo**"*
  - **KDIGO 2024 CKD Guideline – Practice Point 3.6.1 & 3.6.7** (`KDIGO_2024_CKD_Guideline.pdf`, PDF tr. 44):
    > *"Practice Point 3.6.1: RASi (ACEi or ARB) should be administered using the highest approved dose that is tolerated to achieve the benefits described because the proven benefits were achieved in trials using these doses."*
    > *"Practice Point 3.6.7: Continue ACEi or ARB in people with CKD even when the eGFR falls below 30 ml/min per 1.73 m²."*
- **Kiểm chứng thực thi `evaluate()`** (`r1_final_spotcheck_out.txt` dòng 83–261):
  - Đầu vào: Nam 62 tuổi, ĐTĐ2 + CKD G4A3 ổn định (`scr = 270 µmol/L` -> `eGFR = 22.3 mL/phút/1.73m²`, `SBP = 128/76 mmHg`, `K+ = 4.5 mmol/L`, `UACR = 45 mg/mmol`) đang dung nạp tốt `Losartan 100 mg/ngày` (hoặc `Valsartan 320 mg/ngày`).
  - Đầu ra sai: `[REDUCE] rec_ckd_rasi_renal_reduce`: *"Giảm liều Losartan về mức tối đa theo chức năng thận (25–50 mg/ngày)... liều đang dùng của Losartan vượt trần liều thận được phê duyệt (25–50 mg/ngày), làm tăng nguy cơ tích lũy hoạt chất"*. Tương tự ở `eGFR = 12.4`, hệ thống bắt giảm liều `Telmisartan 80 mg` và `Irbesartan 300 mg`.
- **Hướng khắc phục**: Chuẩn hóa lại `renal.dose` của `losartan.json` (`25–100 mg/ngày` hoặc `50–100 mg/ngày`, khởi đầu `25 mg` nếu giảm thể tích), `valsartan.json` (`80–320 mg/ngày`), `telmisartan.json` (`40–80 mg/ngày`), `irbesartan.json` (`150–300 mg/ngày`, khởi đầu `75 mg` nếu lọc máu/thiếu dịch) đúng theo nhãn FDA và BYT 2024 Bảng 12; đồng thời giới hạn lệnh bắt buộc `[REDUCE]` do tích lũy thận cho nhóm ACEi thải trừ qua thận.

---

### [CKD-R3-R1-03] (`MAJOR` | `rule` | `ckd.outpatient.glp1ra_indication`)
**Tiêu đề**: Quy tắc `ckd.outpatient.glp1ra_indication` bỏ sót chỉ định Class I / 1B ở bệnh nhân ĐTĐ2 + CKD G4 (`eGFR 15–24`) không thể khởi trị Metformin & SGLT2i, sai toán tử biên UACR (`>` thay vì `>=`), và ghi sai COR/LOE của ESC 2026 & số mục ADA 2026

- **Tệp liên quan**:
  - [rules.outpatient.extra.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.extra.ts#L65-L258)
  - [ckd.json (thresholds)](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/ckd.json#L830-L855)
  - [CKD.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/modules/CKD.md#L29)
- **Phân tích 3 sai lệch đối chiếu Guideline**:
  1. **Khoảng trống lâm sàng ở ĐTĐ2 + CKD G4 (`eGFR 15–24 mL/phút/1.73m²`)**: Khi `eGFR < 20` (ví dụ `18.5 mL/phút/1.73m²`), bệnh nhân chống chỉ định tuyệt đối Metformin (`eGFR < 30`), không đủ ngưỡng khởi trị mới SGLT2i (`eGFR < 20`), và không đủ ngưỡng khởi trị Finerenone (`eGFR < 25`). Lúc này **Semaglutide tiêm dưới da (`eGFR >= 15`) là trụ cột kiểm soát đường huyết – bảo vệ tim thận duy nhất còn chỉ định**, được KDIGO 2024 Rec 3.9.1 (`1B`), BYT 2024 Bảng 45 và ADA 2026 Rec 11.7b (`Level A`) khuyến cáo rõ ràng cho nhóm *"unable to use those medications"*. Thế nhưng hàm `when()` tại dòng `97–112` yêu cầu `egfr >= 25` (cho nhánh FLOW) hoặc `hba1c > 7.0` (cho nhánh đường huyết), nên nếu bệnh nhân có `HbA1c <= 7.0%` hoặc chưa nhập `HbA1c` thì trả về `false` (0 khuyến cáo GLP-1 RA)!
  2. **Sai toán tử biên UACR (`>` thay vì `>=`)**: Dòng `101, 106, 168, 169` viết `uacr > flowMidUacr` (`> 10`) và `uacr > flowHighUacr` (`> 30`), trong khi **ESC 2026 Recommendation Table 12** quy định **`uACR >= 10 mg/mmol (>= 100 mg/g)`** và **`uACR >= 30 mg/mmol (>= 300 mg/g)`**.
  3. **Ghi sai mức độ bằng chứng và số mục Guideline**: Dòng `65, 182, 243` (cùng `kb/thresholds/ckd.json:837,847` và `docs/modules/CKD.md:29`) ghi **`ESC 2026 (Bảng 12, Class I Level B)`** và **`ADA 2026 (Mục 11.4b)`**, trong khi bản gốc ESC 2026 Bảng 12 là **`Class I, Level A`** và bản gốc ADA 2026 SOC 11 là **`Recommendation 11.7b (Level A)`**.
- **Bằng chứng Guideline gốc (nguyên văn)**:
  - **KDIGO 2024 CKD Guideline – Recommendation 3.9.1** (`KDIGO_2024_CKD_Guideline.pdf`, PDF tr. 45):
    > *"Recommendation 3.9.1: In adults with T2D and CKD who have not achieved individualized glycemic targets despite use of metformin and SGLT2 inhibitor treatment, **or who are unable to use those medications**, we recommend a long-acting GLP-1 RA (1B)."*
  - **BYT 2024 – Bảng 45** (`BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf`, PDF tr. 135):
    > *"Khuyến cáo bổ sung thuốc đồng vận thụ thể GLP-1 tác dụng kéo dài nếu đường máu không đạt mục tiêu đã xác định cho cá thể với Metformin và SGLT2i, **hoặc nếu BN không thể dùng 2 thuốc này**."*
  - **ADA 2026 Standards of Care Section 11 – Recommendation 11.7b** (`ADA_2026_SOC_11_CKD.pdf`, PDF tr. 7 / S252):
    > *"11.7b To reduce kidney disease progression and cardiovascular risk in people with type 2 diabetes and CKD, a glucagon-like peptide 1 agonist with demonstrated benefit in this population is recommended. **A**"*
  - **ESC 2026 CVD-CKD Guideline – Recommendation Table 12** (`ESC_2026_cvd_chronic_kidney_disease.pdf`, PDF tr. 31):
    > *"A GLP-1RA (subcutaneous semaglutide 1.0 mg/week after dose titration) is recommended in patients with CKD who have type 2 diabetes with eGFR 25–49 mL/min/1.73 m² and **uACR ≥10 mg/mmol (≥100 mg/g)** or eGFR 50–74 mL/min/1.73 m² and **uACR ≥30 mg/mmol (≥300 mg/g)** to reduce the risk of CKD progression and cardiovascular events, irrespective of glycaemic control. | **Class I | Level A**"*
- **Kiểm chứng thực thi `evaluate()`** (`r1_eval_out.txt` dòng 337–420):
  - BN nam 64T ĐTĐ2 + CKD G4A3 (`scr = 310 µmol/L` -> `eGFR = 18.5`, `UACR = 50 mg/mmol`, `HbA1c = 6.9%` hoặc `undefined`, chưa dùng SGLT2i/Metformin) -> **0 khuyến cáo Semaglutide**.
  - BN nam 60T ĐTĐ2 (`eGFR = 40.3`, `UACR = 10 mg/mmol`, `HbA1c = 6.8%`) và BN (`eGFR = 60.2`, `UACR = 30 mg/mmol`, `HbA1c = 6.8%`) -> **0 khuyến cáo Semaglutide**.
- **Hướng khắc phục**: Đổi `uacr >` thành `uacr >=`; bổ sung nhánh chỉ định ở dải `15 <= eGFR < 25` khi bệnh nhân ĐTĐ2 không dùng được SGLT2i/Metformin (hoặc có albumin niệu A2–A3); sửa văn bản thành `ESC 2026 (Bảng 12, Class I, Level A)` và `ADA 2026 (Khuyến cáo 11.7b, Mức A)`.

---

### [CKD-R3-R1-04] (`MAJOR` | `rule` | `ckd.outpatient.finerenone_uptitrate`)
**Tiêu đề**: Bốn lỗi trích dẫn nhãn và logic lâm sàng trong cụm quy tắc Finerenone: (a) 2 `citationIds` ma không tồn tại trong KB, (b) Lệch biên `LVEF = 40%` (`> 40` vs `>= 40`), (c) Sai ngưỡng `K+ < 5.0` khi tăng `10 -> 20 mg` ở suy tim không ĐTĐ, và (d) Phát đồng thời `START Finerenone` + `UPTITRATE RASi` dưới tối đa

- **Tệp liên quan**:
  - [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L868-L1155)
  - [ckd.json (citations)](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/ckd.json#L751-L958)
  - [kbLookup.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/kbLookup.ts#L166-L172)
- **Phân tích & Bằng chứng kiểm chứng**:
  1. **2 `citationIds` ma không tồn tại trong toàn bộ KB (`rules.outpatient.ts:1075-1076`)**: Khi nhánh chuẩn độ `20 mg -> 40 mg` cho suy tim kích hoạt (`isStepTo40Hf`), hàm `produce()` trả về `['fda.finerenone.hf_40mg_target', 'fda.finerenone.hf_titration_k_5_0']`. Cả hai ID này đều không tồn tại trong bất kỳ tệp `kb/citations/*.json` nào (hai ID thật trong `kb/citations/ckd.json:751, 949` là `'fda.finerenone.hf_lvef40_dosing'` và `'fda.finerenone.table_3_hf_titration'`). Kiểm chứng qua `resolveCitationDisplay()` cho thấy giao diện người dùng hiển thị câu giả định chung chung: *"Khuyến cáo điều trị nội khoa theo hướng dẫn thực hành lâm sàng hiện hành."*
  2. **Mâu thuẫn biên `LVEF = 40%` (`rules.outpatient.ts:1037, 1070, 1145`)**: Nhãn **FDA Kerendia Section 1 & Table 3** (`FDA_label_finerenone.pdf`, PDF tr. 1, 4–5) phê duyệt chỉ định suy tim và đích liều `40 mg` cho **`LVEF >= 40%`**, và câu `rationaleText` dòng `1070` cũng in `LVEF >= 40%`. Thế nhưng điều kiện `when()` dòng `1037` viết `lvef > 40`, khiến bệnh nhân có **`LVEF = 40%`** (`eGFR = 72, K+ = 4.4`) đang dùng Finerenone 20 mg bị phát nhầm `[CONTINUE] Tiếp tục duy trì 20 mg` (`r1_eval_out.txt:251-261`).
  3. **Áp nhầm ngưỡng Kali Bảng 2 (`<= 4.8`) thay vì Bảng 3 (`< 5.0`) ở bước `10 -> 20 mg` cho suy tim không ĐTĐ (`rules.outpatient.ts:1036`)**: Nhãn **FDA Kerendia Table 3** (`PDF tr. 5`) quy định với suy tim `LVEF >= 40%`, khi serum potassium **`< 5.0 mEq/L`** thì từ `10 mg` -> *"Increase the dose to 20 mg once daily"*. Kiểm chứng `evaluate()` (`r1_final_spotcheck_out.txt:296-308`): ở bệnh nhân HFpEF không ĐTĐ (`LVEF = 52%, eGFR = 45.8, K+ = 4.9 mmol/L`) đang dùng Finerenone 10 mg, hệ thống chặn `UPTITRATE` và phát nhầm `[CONTINUE] 10 mg` viện dẫn Bảng 2!
  4. **Phát đồng thời `[START] Finerenone 10 mg` song song với `[UPTITRATE] RASi` dưới tối đa (`r1_eval_out.txt:515-522`)**: **KDIGO 2024 Rec 3.8.1** (`PDF tr. 44`) và **BYT 2024** (`PDF tr. 32`) chỉ định Finerenone khi còn albumin niệu dai dẳng ***"despite maximum tolerated dose of RAS inhibitor (RASi)"***. Tuy nhiên khi bệnh nhân đang dùng `Valsartan 80 mg/ngày` (`SBP = 136/82 mmHg, K+ = 4.3`, chưa đánh dấu `rasiMaxTolerated`), hệ thống vừa phát `[UPTITRATE] Tăng liều Valsartan` vừa phát ngay `[START] Khởi trị Finerenone 10 mg` (với lý giải sai thực tế *"dù đã dùng RASi liều tối đa dung nạp"*), làm cộng gộp nguy cơ tăng kali máu và sụt giảm eGFR huyết động cùng lúc.
- **Hướng khắc phục**: Sửa đúng 2 `citationIds` sang `'fda.finerenone.hf_lvef40_dosing'` và `'fda.finerenone.table_3_hf_titration'`; thống nhất toán tử biên LVEF và cho phép ngưỡng `K+ < 5.0` ở bước `10 -> 20 mg` theo FDA Table 3 cho bệnh nhân HF; chuyển Finerenone sang `CONSIDER` / `DEFER` chờ tối ưu xong liều RASi khi `rasi_uptitrate` đang kích hoạt và `rasiMaxTolerated` chưa được xác nhận.

---

### [CKD-R3-R1-05] (`MAJOR` | `rule` | `ckd.outpatient.rasi_initiate`)
**Tiêu đề**: Bệnh nhân CKD A1 huyết áp bình thường ở mức `SBP = 129 mmHg` bị phân loại nhầm là tăng huyết áp (`sbp >= 129`), sinh 2 khuyến cáo tự mâu thuẫn trên cùng màn hình và kê ACEi trái với ESC 2026 Bảng 12 & KDIGO 2024

- **Tệp liên quan**: [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L399-L485)
- **Phân tích & Bằng chứng Guideline gốc**:
  - **ESC 2026 CVD-CKD Guideline – Section 5.2.1 & Recommendation Table 9** (`ESC_2026_cvd_chronic_kidney_disease.pdf`, PDF tr. 25–26):
    > *"A confirmed standardized office blood pressure **≥130/80 mmHg** is therefore recommended to be considered elevated blood pressure necessitating lifestyle optimization and blood pressure-lowering medications to reduce cardiovascular risk in CKD."* (Đích kiểm soát là **`120–129 mmHg`**, bao gồm `129 mmHg`).
  - **ESC 2026 – Recommendation Table 12 footnote `c`** (`PDF tr. 31`) & **KDIGO 2024 PP 3.6.6** (`PDF tr. 44`): loại trừ khởi trị ACEi/ARB ở bệnh nhân CKD không có albumin niệu (A1) kèm huyết áp bình thường và không suy tim.
  - Tại `rules.outpatient.ts:399 & 473`, biến `hasHtn` lại lấy `sbp >= thFor('sbp', 'ckd.bp.target_sbp_esc_max')` (**`129 mmHg`**).
- **Kiểm chứng thực thi `evaluate()`** (`r1_eval_out.txt` dòng 437–446):
  - Đầu vào: Nam 62T, `conditions: { ckd: true }` (`htn: false, dm: false, hf: false`), `eGFR = 48.0` (G3aA1), `UACR = 1.2 mg/mmol`, `HA = 129/76 mmHg`, `K+ = 4.4`, `profile: 'VN'`.
  - Đầu ra mâu thuẫn trực diện:
    1. `[START] rec_ckd_rasi_start`: *"Khởi trị Perindopril (2.5 mg x 1 lần/ngày) — làm nền tảng kiểm soát tăng huyết áp"*
    2. `[CONTINUE] rec_ckd_bp_target`: *"Huyết áp hiện tại 129/76 mmHg: Đạt mục tiêu kiểm soát (120–129 / < 80 mmHg)"*
- **Hướng khắc phục**: Thay điều kiện `sbp >= target_sbp_esc_max` (`129`) bằng `(sbp !== undefined && sbp >= thFor('sbp', 'ckd.bp.target_sbp_acc_aha')) || (dbp !== undefined && dbp >= thFor('dbp', 'ckd.bp.target_dbp_acc_aha'))` (`>= 130/80 mmHg`).

---

### [CKD-R3-R1-06] (`MAJOR` | `rule` | `ckd.inpatient.contrast_aki_prevention`)
**Tiêu đề**: Gán sai phân loại khuyến cáo ESC 2026 (**tuyên bố `Class I` thay vì `Class IIb, Level C`**) và phát lệnh bắt buộc `[START]` truyền NaCl 0.9% tĩnh mạch quá rộng ở cả dải G3b (`eGFR 30–44`) khi chụp CT tĩnh mạch thường quy

- **Tệp liên quan**:
  - [rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.ts#L796-L805)
  - [ckd.json (citations)](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/ckd.json#L894-L903)
- **Bằng chứng Guideline gốc (nguyên văn)**:
  - **ESC 2026 CVD-CKD Guideline – Recommendation Table 30** (`ESC_2026_cvd_chronic_kidney_disease.pdf`, PDF tr. 67):
    > *"Peri-procedural intravenous hydration **may be considered** in patients with an **eGFR <30 mL/min/1.73 m²** not on dialysis, undergoing any procedure requiring administration of iodinated contrast to reduce the risk of CI-AKI. | **Class IIb | Level C**"*
    > *(Lưu ý: Trong Bảng 30, chỉ khuyến cáo dùng thuốc cản quang đẳng/thấp thẩm thấu liều tối thiểu ở bệnh nhân `eGFR < 30` chụp mạch vành/mạch máu mới là `Class I, Level A`)*.
- **Kiểm chứng thực thi `evaluate()`** (`r1_final_spotcheck_out.txt` dòng 10–18):
  - Tại `rules.inpatient.ts:797`, code gán `const isHighRiskStart = egfr < g3aMin || intraArterial` (`eGFR < 45`). Khi chạy với bệnh nhân CKD G3b (`scr = 170 µmol/L` -> `eGFR = 38.8`) chụp CT cản quang tĩnh mạch thông thường (`contrastRouteIntraArterial: false`), hệ thống phát lệnh bắt buộc `[START] rec_ckd_ci_aki_bundle` và in câu sai: *"Truyền NaCl 0.9% tốc độ 1 mL/kg/h trước và sau thủ thuật (ESC 2026 khuyến cáo Class I khi eGFR < 30 mL/phút/1.73m²...)"*.
- **Hướng khắc phục**: Hạ ngưỡng `action: 'START'` xuống `egfr < g3bMin || intraArterial` (`eGFR < 30` hoặc đường động mạch; dải `30–44` đường tĩnh mạch phát `CONSIDER` cá thể hóa tránh quá tải dịch), và sửa văn bản phản ánh đúng mức khuyến cáo **ESC 2026 Bảng 30 (`Class IIb, Level C`)** cho truyền dịch tĩnh mạch quanh thủ thuật.

---

### [CKD-R3-R1-07] (`MINOR` | `rule` | `ckd.outpatient.bp_target`)
**Tiêu đề**: Trích dẫn nhầm số bảng ESC 2026 (`Bảng 11` kháng kết tập tiểu cầu thay vì `Recommendation Table 9` huyết áp), viết ngược dấu bằng tại biên `eGFR = 30` (`<= 30` / `> 30` thay vì `< 30` / `>= 30`), và thiếu citation `byt.ckd.2024.*` ở hồ sơ `VN`

- **Tệp liên quan**: [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L1228-L1319) & [CKD.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/modules/CKD.md#L14-L92)
- **Bằng chứng**: Trong `ESC_2026_cvd_chronic_kidney_disease.pdf`, khuyến cáo huyết áp nằm ở **Recommendation Table 9** (PDF tr. 25–26, phân tách `eGFR >= 30` và `eGFR < 30`), còn **Recommendation Table 11** (PDF tr. 28) là khuyến cáo Class III-B về thuốc chống kết tập tiểu cầu (mã nguồn đã nhầm số `Bảng 11` của `BYT 2024` tr. 36 sang ESC 2026). Ngoài ra code rẽ nhánh `egfr < 30` nhưng chuỗi chữ in `eGFR <= 30` / `eGFR > 30`, và mảng `cids` ở nhánh `VN` chưa gắn `byt.ckd.2024.table_11_bp_targets_esc`.
- **Hướng khắc phục**: Đổi thành `ESC 2026 (Bảng 9...)`, sửa chữ thành `eGFR < 30` / `eGFR >= 30`, và thêm `'byt.ckd.2024.table_11_bp_targets_esc'` vào `cids` của nhánh `VN`.

---

### [CKD-R3-R1-08] (`MINOR` | `rule` | `ckd.outpatient.hyperkalemia_emergency_refer`)
**Tiêu đề**: Vẫn xuất trùng 2 thẻ `[REFER]` ở ngoại trú `K+ >= 6.0 mmol/L` và vẫn hiện thẻ *"CHUYỂN CẤP CỨU KHẨN CẤP"* trên bệnh nhân đã nằm nội viện (`CKD-R2-R3-11` & `CKD-R2-R3-13` chưa dứt điểm)

- **Tệp liên quan**: [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L1563-L1607) & [reviewMeds.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMeds.ts#L46-L62)
- **Bằng chứng**: Trái với giải trình tại `round2_RESPONSE.md:255`, quy tắc `rec_ckd_outpatient_emergency_refer` vẫn còn trong `rules.outpatient.ts` và chạy song song với `emergency_hyperkalemia_critical` của `checkEmergencyRedFlags` (`r1_eval_out.txt:428-435`); đồng thời ở chế độ `inpatient` (`K+ = 6.7`, `r1_final_spotcheck_out.txt:67-76`), `emergency_hyperkalemia_critical` vẫn khuyên *"chuyển ngay tới cơ sở cấp cứu"* ngay cạnh y lệnh tiêm Calcium Gluconate nội viện.
- **Hướng khắc phục**: Khử trùng lặp giữa hai thẻ ở ngoại trú và điều chỉnh `checkEmergencyRedFlags` theo `settings.setting` để không phát lời khuyên chuyển viện ngoại trú cho bệnh nhân đang điều trị nội trú.

---

### [CKD-R3-R1-09] (`MINOR` | `rule` | `ckd.outpatient.cystatin_c_g3aa1_confirm`)
**Tiêu đề**: Ghi nhầm mức độ khuyến cáo KDIGO 2024 Rec 1.2.2.1 thành `Grade 1B` (chuẩn là `1C`), nối lặp đơn vị `"10 mg mg/ngày"` ở `sglt2i_continue`, và bắn trùng 2 alert giãn cách SZC

- **Tệp liên quan**: [rules.outpatient.extra.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.extra.ts#L1042), [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L284-L286), [diabetes_respiratory.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/diabetes_respiratory.json#L417-L535)
- **Bằng chứng**:
  1. `KDIGO_2024_CKD_Guideline.pdf` tr. 36 ghi rõ `Recommendation 1.2.2.1 ... (1C)` (đã lưu đúng `cor: "1", loe: "C"` tại `kb/citations/ckd.json:825`), nhưng `rules.outpatient.extra.ts:1042` viết `Grade 1B`.
  2. Khi `activeSglt2i.dose = '10 mg'` (như trong `presets.ts`), biểu thức `` `${activeSglt2i.dose} ${activeSglt2i.unit || 'mg'}/ngày` `` sinh ra `"10 mg mg/ngày"` (`r1_eval_out.txt:202, 253`).
  3. `sodium_zirconium_cyclosilicate` vẫn nằm đồng thời trong cả `ix.potassium_binder_drug_binding` lẫn `ix.szc_binder_separation`.
- **Hướng khắc phục**: Đổi `Grade 1B` thành `Grade 1C`; kiểm tra tránh nối lặp `'mg'` khi `dose` đã chứa đơn vị; gỡ `sodium_zirconium_cyclosilicate` khỏi một trong hai luật tương tác giãn cách.

---

## 4. Kết luận Thẩm định Độc lập Vòng 3 (Reviewer R1)

Phân hệ `ckd` đã đạt bước tiến lớn về an toàn lâm sàng khi **xóa bỏ hoàn toàn 100% lỗi `critical` của Vòng 2** và đạt **100% độ khớp nguyên văn trích dẫn PDF** trong `kb/citations/ckd.json`. Tuy nhiên, do vẫn còn **6 phát hiện mức `major`** liên quan đến luồng chuyển bối cảnh bệnh nhân mẫu cấp cứu trên UI (`CKD-R3-R1-01`), trần liều thận sai nhãn của nhóm ARB (`CKD-R3-R1-02`), chỉ định và biên UACR của trụ cột thứ 4 GLP-1 RA (`CKD-R3-R1-03`), `citationIds` ma và biên chuẩn độ của Finerenone (`CKD-R3-R1-04`), ngưỡng tăng huyết áp `129 mmHg` tự mâu thuẫn của `rasi_initiate` (`CKD-R3-R1-05`), cùng mức khuyến cáo ESC 2026 truyền dịch cản quang (`CKD-R3-R1-06`), theo tiêu chuẩn nghiệm thu của [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md) (`0 critical, 0 major`), kết quả thẩm định Vòng 3 của Reviewer R1 là:

**FAIL** (`0 critical, 6 major, 3 minor, 0 suggestion`)
