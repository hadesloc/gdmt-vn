# Báo cáo Kiểm định Độc lập Vòng 2 — Vai R2 (Dược lâm sàng)
**Module**: Bệnh thận mạn (`ckd`)  
**Vai trò**: R2 — Chuyên gia Dược lâm sàng Độc lập (Round 2 Clinical Pharmacist Reviewer)  
**Ngày kiểm định**: 2026-10-27  
**Phạm vi kiểm định**:
1. **Hậu kiểm 100% các phát hiện Dược lâm sàng Vòng 1** (`round1_R2.json`, các mục liên quan thuốc/liều của R1/R3 Vòng 1, và đồng bộ `finerenone.json` với HF 2026).
2. **Rà soát độc lập từ đầu (full fresh audit)**:
   - Toàn bộ **18 hồ sơ thuốc (`DrugEntry`)** do CKD sở hữu trong `kb/drugs/`: 3 SGLT2i (`dapagliflozin`, `empagliflozin`, `canagliflozin`), 5 ACEi (`enalapril`, `perindopril`, `lisinopril`, `ramipril`, `captopril`), 5 ARB (`losartan`, `valsartan`, `telmisartan`, `irbesartan`, `candesartan`), 1 nsMRA (`finerenone`), 3 chất gắn kali (`patiromer`, `sodium_zirconium_cyclosilicate`, `calcium_polystyrene_sulfonate`), 1 chất kiềm hóa (`sodium_bicarbonate`).
   - Toàn bộ **Ma trận bằng chứng an toàn thận** `src/modules/ckd/matrix.ts` (18 hàng × 8 cột: `G1`, `G2`, `G3a`, `G3b`, `G4`, `G5`, `Lọc máu`, `AKI`).
   - Toàn bộ quy tắc kê đơn, chuẩn độ, rà soát thuốc đang dùng và tương tác thuốc tại `src/modules/ckd/rules.outpatient.ts`, `src/modules/ckd/rules.inpatient.ts`, `kb/interactions/renal_rasi.json`, `kb/thresholds/ckd.json`, `kb/citations/ckd.json`.
   - Đối chiếu trực tiếp văn bản nguyên gốc từ nhãn FDA (`Farxiga`, `Jardiance`, `Invokana`, `Kerendia` rev. 9/2026, `Vasotec`, `Capoten`, `Cozaar`, `Atacand`, `Veltassa`, `Lokelma`), SmPC EMA/MHRA (`Coversyl Arginine`, `Calcium Resonium`), và hướng dẫn lâm sàng (`KDIGO 2024 CKD`, `UKKA 2022 Acute Hyperkalaemia`, `ESC 2026 HF`, `BYT 2024 BTM`) thông qua các script kiểm định trong `docs/reviews/ckd/scratch/round2_r2_*.ts`.

---

## Phần 1. Bảng Hậu kiểm 100% Phát hiện Vòng 1 (Post-Check)

| Mã Vòng 1 | Nội dung phát hiện ở Vòng 1 | Trạng thái Vòng 2 | Bằng chứng xác minh trên Code / KB / Engine |
|---|---|---|---|
| **CKD-R2-01** *(Critical)* | Lọc máu cấp cứu nhầm ngưỡng `HCO3- < 18` thay vì `< 8 mmol/L` | **ĐÃ SỬA ĐÚNG** | `src/modules/ckd/rules.inpatient.ts:371,389` đã dùng `thFor('hco3', 'ckd.dialysis.hco3_emergency_max')` = `8` mmol/L (khớp BYT 2024 tr. 66 `byt.ckd.2024.emergency_acidosis_hco3_8`). |
| **CKD-R2-02** *(Major)* | `calcium_polystyrene_sulfonate.json` ghi nhầm `"Resonium A"` (SPS) và thiếu `Kalimate`/`K-Pion` | **ĐÃ SỬA BIỆT DƯỢC** *(còn sót 2 lỗi dược lý mới phát hiện)* | `calcium_polystyrene_sulfonate.json` đã bỏ `"Resonium A"`, cập nhật `vnBrands: ["Kalimate", "K-Pion", "Calcium Resonium"]`. Tuy nhiên còn sót lỗi giãn cách uống `2 giờ` thay vì `3 giờ` (**CKD-R2-R2-06**) và ngưỡng K+ `< 4.0` thay vì `< 5.0 mmol/L` (**CKD-R2-R2-03**). |
| **CKD-R2-03** *(Major)* | `sodium_zirconium_cyclosilicate.json` ghi nhầm `"5 mg cách ngày"` (sai đơn vị 1.000 lần) | **ĐÃ SỬA ĐÚNG** | `target.description` đã sửa thành `"Liều duy trì 10 g 1 lần/ngày (hoặc 5 g cách ngày - 15 g/ngày)"` khớp nhãn FDA Lokelma Mục 2.1. |
| **CKD-R2-04** *(Major)* | Cột `AKI` của `ckdMatrix` hiển thị `'ok'`/`'caution'` cho SGLT2i/RASi/Finerenone | **ĐÃ SỬA CHO 14 THUỐC — PHÁT SINH LỖI Ở 4 THUỐC CÒN LẠI** | 14 thuốc thuộc `akiHoldIds` đã trả về `contra`/`contra` kèm ghi chú HOLD. Tuy nhiên nhánh `else` gán cứng `'rec'`/`'rec'` cho cả CPS, Patiromer, SZC và NaHCO3 trong AKI (**CKD-R2-R2-05**). |
| **CKD-R2-05** *(Major)* | Cột `G4 (15–29)` lấy mẫu ở `eGFR = 15` làm SGLT2i & Finerenone bị gắn `not_rec` toàn dải G4 | **ĐÃ SỬA ĐÚNG** | `getG4Cell()` (`matrix.ts:68-96`) đã phân tầng `caution` kèm ghi chú rõ ngưỡng cắt `eGFR ≥ 20` (SGLT2i) và `eGFR ≥ 25` (Finerenone). |
| **CKD-R2-06** *(Major)* | Thiếu khuyến cáo `CONTINUE` cho bệnh nhân đang dùng SGLT2i có `eGFR ≥ 20` | **ĐÃ SỬA ĐÚNG** | Đã bổ sung luật `ckd.outpatient.sglt2i_continue` (`rules.outpatient.ts:157-212`), kiểm chứng động ở Probe A1/A2 phát `CONTINUE Dapagliflozin 10 mg/ngày`. |
| **CKD-R2-07** *(Major)* | `canagliflozin.json` (`Invokana`) & `patiromer.json` (`Veltassa`) gắn biệt dược chưa lưu hành phổ biến tại VN | **ĐÃ SỬA ĐÚNG** | Cả hai file đã đặt `"vnBrands": []`; các luật khởi trị mặc định ở profile `'VN'` không kê đơn tự động 2 thuốc này. |
| **CKD-R2-08** *(Major)* | `sodium_bicarbonate.json` mâu thuẫn tần suất `3 lần/ngày` vs `2–3 lần/ngày` | **ĐÃ SỬA ĐÚNG** | Đã đồng bộ `frequency: "2–3 lần/ngày"`, `description: "500–1000 mg x 2–3 lần/ngày (tổng 1–2 g/ngày)"`. |
| **CKD-R2-09** *(Major)* | Thiếu cảnh báo washout 36 giờ ACEi ↔ ARNI ở 4/5 file ACEi | **ĐÃ SỬA ĐÚNG** | Cả 5 file ACEi (`enalapril`, `perindopril`, `lisinopril`, `ramipril`, `captopril`) đều có cảnh báo 36h; kiểm chứng động Probe E xác nhận cả 5 ACEi đều phát `ix.acei_arni_washout`, `dup.rasi_arni` và `STOP`. |
| **CKD-R2-10** *(Major)* | Thiếu trường `pregnancy` ở toàn bộ 18 file thuốc CKD | **ĐÃ SỬA ĐÚNG** | Cả 18 thuốc đã có `pregnancy` phân tầng đúng nhãn gốc: 10 ACEi/ARB = `'contra'` (Boxed Warning FDA); 3 SGLT2i + `finerenone` = `'avoid'` (FDA Section 8.1); 3 K-binders + `sodium_bicarbonate` = `'caution'`. Kiểm chứng động Probe F xác nhận cả 14 thuốc nguy cơ cao phát `STOP` khi có thai. |
| **CKD-R2-11** *(Minor)* | Ngưỡng `ckd.contrast.egfr_risk_threshold` mồ côi | **ĐÃ SỬA ĐÚNG** | `rules.inpatient.ts:413` đã gọi `thFor('egfr', 'ckd.contrast.egfr_risk_threshold')` (= 60). |
| **CKD-R2-12** *(Minor)* | `fmtDose(dose('finerenone', 'target'))` lặp mô tả dài trong `title`/`dose` | **CHƯA SỬA** *(nặng hơn do kéo thêm liều 40 mg của HF)* | `round1_RESPONSE.md` ghi đã sửa nhưng `rules.outpatient.ts:685-689, 780-782` vẫn giữ nguyên, nay xuất cả hướng dẫn 40 mg của HFmrEF/HFpEF vào `title`/`dose` của CKD thuần túy (**CKD-R2-R2-07**). |
| **CKD-R2-13** *(Minor)* | Biệt dược Mỹ (`Vasotec`, `Prinivil`, `Altace`) trong `vnBrands` | **ĐÃ SỬA ĐÚNG** | Đã thay bằng biệt dược thực tế tại VN (`Renitec`/`Ednyt`/`Enap`, `Zestril`/`Diroton`, `Tritace`/`Cardace`). |
| **CKD-R2-14** *(Minor)* | `canagliflozin.json` thiếu lưu ý ngừng ≥ 3 ngày trước phẫu thuật lớn | **ĐÃ SỬA ĐÚNG** | Đã bổ sung tại `canagliflozin.json:77` (khớp FDA Invokana Section 2.5 tr. 5: *"at least 3 days"*). |
| **CKD-R2-15** *(Minor)* | `patiromer.json` thiếu cảnh báo hạ magnesi máu | **ĐÃ SỬA ĐÚNG** | Đã bổ sung tại `patiromer.json:66` (khớp FDA Veltassa Section 5.2 tr. 1). |
| **CKD-R2-16** *(Suggestion)* | Mở rộng `ckdMatrix` từ 8 lên đủ 18 thuốc CKD | **ĐÃ TRIỂN KHAI** | `matrix.ts` đã bao phủ đủ 18 thuốc CKD (cần tinh chỉnh thêm một số ô ở `AKI`, `G5`, `Dialysis` nêu tại Phần 2). |
| **R2-HF-SYNC** | Đồng bộ `finerenone.json`: viên 40 mg, liều HFmrEF/HFpEF LVEF ≥ 40% (`10→20` & `20→40 mg`), lưu ý CYP2C8 ở 40 mg | **ĐÃ ĐỒNG BỘ ĐÚNG** | Đối chiếu nguyên văn nhãn FDA Kerendia (rev. 9/2026, tr. 1, 4–5, 8) và ESC 2026 HF Table 11 (tr. 37): khớp chính xác hàm lượng 10/20/40 mg, ngưỡng eGFR 25–<60 vs ≥60 và tương tác cơ chất nhạy cảm CYP2C8 ở liều 40 mg. |

> **Lưu ý kiểm toán trích dẫn PDF**: Chạy kiểm định tự động toàn bộ **70 trích dẫn** được tham chiếu bởi 18 hồ sơ thuốc CKD và `kb/citations/ckd.json` đối chiếu trực tiếp với văn bản PDF/HTML gốc trong `Medical_Library_2026`: **70/70 trích dẫn khớp văn bản nguồn (0 trích dẫn giả, 0 lệch trang vượt cửa sổ)**. Bộ test bất biến `tests/modules/ckd/invariants.test.ts` (15.000 ca ngẫu nhiên & fail-closed) vượt qua **3/3 tests**.

---

## Phần 2. Tổng hợp Phát hiện Mới & Tồn đọng ở Vòng 2

Tổng số phát hiện Vòng 2: **13 phát hiện** (**0 Critical**, **6 Major**, **6 Minor**, **1 Suggestion**).

### 2.1. Nhóm Major (6 phát hiện — Bắt buộc khắc phục trước khi PASS)

#### 1. `[CKD-R2-R2-01]` (Major — Rule/Interaction: `ix.rasi_mra_potassium_sparing`)
- **Mô tả**: Trong `kb/interactions/renal_rasi.json` (dòng 176–188), luật chống chỉ định phối hợp thuốc lợi tiểu giữ kali (`amiloride`, `triamterene`) với RASi/MRA (`ix.rasi_mra_potassium_sparing`, `severity: "contraindicated"`) chỉ liệt kê `"losartan"` và `"valsartan"` (cùng `"sacubitril_valsartan"`), bỏ sót **3/5 hoạt chất ARB của module CKD** (`telmisartan`, `irbesartan`, `candesartan`). Do KB có 6 thuốc mang lớp chuẩn hóa `'arb'` (`3/6 = 50% < ngưỡng 60%` tại `isClassWideTarget()` ở `src/engine/safety/interactions.ts:66`), cơ chế khớp theo nhóm `'arb'` trả về `false`.
- **Hệ quả lâm sàng & Bằng chứng động**: Bệnh nhân CKD dùng `telmisartan + amiloride`, `irbesartan + amiloride`, hoặc `candesartan + amiloride` nhận **0 cảnh báo tương tác (`alerts = []`)** và thậm chí còn được khuyến cáo **`UPTITRATE` `telmisartan`/`irbesartan`** (`rec_ckd_rasi_uptitrate`)! *(Lưu ý thêm: `ix.triple_whammy`, `ix.rasi_mra_k_supplements`, `ix.rasi_lithium` trong `renal_rasi.json` cũng đang thiếu `irbesartan` và `candesartan` trong `drugIds`).*
- **Đề xuất sửa**: Điền đủ cả 5 ARB (`losartan`, `valsartan`, `telmisartan`, `irbesartan`, `candesartan`) vào `drugIds` của cả 4 luật tương tác trong `kb/interactions/renal_rasi.json`, đồng thời chặn `UPTITRATE` RASi khi đang dùng kèm thuốc lợi tiểu giữ kali / MRA.

#### 2. `[CKD-R2-R2-02]` (Major — Rule: `ckd.outpatient.rasi_uptitrate`)
- **Mô tả**: Luật `ckd.outpatient.rasi_uptitrate` (`src/modules/ckd/rules.outpatient.ts:512-521`) chỉ kiểm tra `currentDoseNum >= rasiEntry.target.amount` (liều đích ở chức năng thận bình thường: Perindopril `10 mg`, Ramipril `10 mg`, Enalapril `20 mg`, Lisinopril `40 mg`) mà hoàn toàn bỏ qua trần liều thận theo `CrCl`/`eGFR` trong `DrugEntry.renal`.
- **Hệ quả lâm sàng & Bằng chứng**:
  - Bệnh nhân nữ 72 tuổi, 50 kg, `scr = 250 µmol/L` (**eGFR ≈ 18.2 mL/phút/1.73m² [G4], CrCl ≈ 16.5 mL/phút**), đang dùng `perindopril 2.5 mg/ngày` (đã **cao gấp đôi** liều khuyến cáo SmPC Coversyl Bảng 1 cho `15 < CrCl < 30` là `2.5 mg cách ngày`!), vẫn bị engine phát `[REC] UPTITRATE rec_ckd_rasi_uptitrate ("Tăng liều Perindopril đến liều tối đa dung nạp")`.
  - Lỗi tương tự xảy ra với `ramipril 5 mg/ngày` (đã chạm trần `1.25–5 mg/ngày` khi `eGFR < 30`), `enalapril 10 mg/ngày` (đã chạm trần `2.5–10 mg/ngày` ở G4) và `lisinopril 5 mg/ngày`.
  - Đối chiếu EMA Coversyl SmPC Table 1 (tr. 2) và KDIGO 2024 PP 3.6.1 (*"highest **approved** dose that is tolerated"*).
- **Đề xuất sửa**: Đối chiếu trần liều trong `renalBand()` hiện tại của bệnh nhân trước khi phát `UPTITRATE` cho nhóm ACEi/ARB có chỉnh liều thận.

#### 3. `[CKD-R2-R2-03]` (Major — Missing Safety Rule & KB Threshold: `ckd.hypokalemia_stop_k_binders` / `calcium_polystyrene_sulfonate`)
- **Mô tả**:
  1. Cả 3 chất gắn kali (`patiromer`, `sodium_zirconium_cyclosilicate`, `calcium_polystyrene_sulfonate`) đều khai báo `gates` hạ kali máu trong JSON, nhưng **không có bất kỳ luật nào** trong `rules.outpatient.ts`, `rules.inpatient.ts` hay `reviewMeds.ts` kiểm tra khi bệnh nhân đang uống K-binder trong `currentMeds` mà rơi vào hạ kali máu (`K+ < 3.5–4.0 mmol/L`) hoặc dưới ngưỡng chống chỉ định nhãn của CPS (`K+ < 5.0 mmol/L`).
  2. Trong `kb/drugs/calcium_polystyrene_sulfonate.json` (dòng 51–62, 86–92), ngưỡng chống chỉ định đang ghi sai là `K+ < 4.0 mmol/L` (con số mồ côi không có trong trích dẫn `byt.ckd.2024.potassium_resine_dose`), trong khi SmPC gốc `Calcium_Resonium_SmPC.html` (Section 4.3 Contraindications) chống chỉ định tuyệt đối ngay khi **`K+ < 5.0 mmol/L`**: *"In patients with plasma potassium levels below 5mmol/litre."*
- **Bằng chứng động**: Bệnh nhân CKD (`k = 3.7 mmol/L` hoặc `k = 4.4 mmol/L`) đang uống `calcium_polystyrene_sulfonate 15 g` nhận **0 khuyến cáo `STOP`/`HOLD`**.
- **Đề xuất sửa**: Thêm luật an toàn phát `STOP`/`HOLD` khi đang dùng K-binder mà `K+` thấp (`< 3.5–4.0 mmol/L` cho Patiromer/SZC; `< 5.0 mmol/L` cho CPS cấp tính hoặc `< 4.0 mmol/L` khi duy trì dự phòng), và cập nhật `calcium_polystyrene_sulfonate.json` khớp SmPC Section 4.3.

#### 4. `[CKD-R2-R2-04]` (Major — Rule: `ckd.outpatient.rasi_initiate`)
- **Mô tả**: Luật `ckd.outpatient.rasi_initiate` (`rules.outpatient.ts:281-379`):
  1. Phát khuyến cáo khởi trị mới **`START`** bậc 1 viện dẫn *"Khuyến cáo 1B (KDIGO 2024): Bắt buộc dùng RASi..."* ngay cả ở giai đoạn suy thận giai đoạn cuối chưa lọc máu **G5 (`eGFR < 15 mL/phút/1.73m²`)**, trong khi cả 3 khuyến cáo KDIGO 2024 Rec 3.6.1, 3.6.2, 3.6.3 (PDF tr. 43) đều giới hạn rõ ở **G1–G4** (`eGFR ≥ 15`).
  2. Ở bệnh nhân không ĐTĐ có `eGFR = 10.6` (G5), dòng 371 dùng `Math.max(egfr, g4Min)` ép `egfr` lên `15` để kê Perindopril `"2.5 mg cách ngày"` (mâu thuẫn với chính giải trình `round1_RESPONSE.md` mục `R3-CKD-09` rằng đã chuyển sang Losartan khi `eGFR < 15`).
  3. Ở bệnh nhân có ĐTĐ thuộc G4–G5 (`eGFR < 30`), dòng 369 luôn kê Losartan `50 mg x 1 lần/ngày`, bỏ qua dải chỉnh liều thận trong chính `kb/drugs/losartan.json` (`25–50 mg/ngày` ở G4; `25 mg/ngày` ở G5).
- **Đề xuất sửa**: Giới hạn `START` thường quy cho `eGFR ≥ 15` (G1–G4; ở G5 chưa lọc máu chuyển thành `CONSIDER` thận trọng bởi chuyên khoa Thận), bỏ kẹp giả `Math.max(egfr, g4Min)` cho Perindopril ở G5, và đọc `renalBand('losartan', egfr, 'egfr')` khi `eGFR < 30`.

#### 5. `[CKD-R2-R2-05]` (Major — Matrix: `ckdMatrix.aki`)
- **Mô tả**: Tại `src/modules/ckd/matrix.ts` (dòng 128–133), hàm `getAkiCell()` gán cứng `initiate: 'rec', continue: 'rec'` không kèm ghi chú điều kiện cho cả 4 thuốc ngoài `akiHoldIds` (`calcium_polystyrene_sulfonate`, `patiromer`, `sodium_zirconium_cyclosilicate`, `sodium_bicarbonate`) trong cột **`AKI (Đợt cấp)`**.
- **Bằng chứng dược lý**:
  - `calcium_polystyrene_sulfonate` vốn chỉ là `'ok'` ở G1–G5 nhưng sang cột `AKI` lại nhảy lên `'rec'`, trái ngược với **UKKA 2022 Guideline 16.6.3** (tr. 14 & 100): *"We suggest that calcium resonium is not used in the emergency management of severe hyperkalaemia, but may be considered in patients with moderate hyperkalaemia. (2B)"* (khởi phát chậm > 4h, nguy cơ hoại tử đại tràng).
  - `patiromer` có **FDA Limitation of Use** (Section 1, tr. 1): *"Veltassa should not be used as an emergency treatment for life-threatening hyperkalemia because of its delayed onset of action."* (khởi phát 4–7h).
  - AKI không đồng nghĩa mặc định có tăng K+ máu hay toan chuyển hóa.
- **Đề xuất sửa**: Đổi trạng thái cột `AKI` của CPS và Patiromer sang `'caution'` (ghi chú rõ không dùng cấp cứu tăng K+ đe dọa tính mạng do tác dụng chậm), và của SZC / NaHCO3 sang `'caution'` hoặc `'ok'` kèm ghi chú chỉ dùng khi có tăng K+ máu / toan chuyển hóa tương ứng.

#### 6. `[CKD-R2-R2-06]` (Major — Drug & Interaction: `calcium_polystyrene_sulfonate` / `ix.potassium_binder_drug_binding`)
- **Mô tả**: Sai khoảng cách uống cách thuốc khác của Calcium Polystyrene Sulfonate: cả `kb/drugs/calcium_polystyrene_sulfonate.json` (dòng 66: `"Uống cách xa các thuốc khác ít nhất 2 giờ"`) lẫn cảnh báo `ix.potassium_binder_drug_binding` (`kb/interactions/diabetes_respiratory.json:359`) đều ghi **2 giờ**, trong khi **EMA/MHRA SmPC Calcium Resonium** (Section 4.2 & 4.4) bắt buộc cách **ít nhất 3 giờ** trước hoặc sau các thuốc uống khác (và **6 giờ** nếu có liệt dạ dày).
- **Đề xuất sửa**: Cập nhật cả `calcium_polystyrene_sulfonate.json` và `ix.potassium_binder_drug_binding` từ `2 giờ` thành **`ít nhất 3 giờ`** (đồng thời đổi tên `(Resonium)` trong `diabetes_respiratory.json:359` thành `(Kalimate / Calcium Resonium)`).

---

### 2.2. Nhóm Minor (6 phát hiện) & Suggestion (1 phát hiện)

- **`[CKD-R2-R2-07]` (Minor — UI/Rule: `ckd.outpatient.finerenone_indication` & `finerenone_uptitrate`)**: Chưa sửa `CKD-R2-12` từ Vòng 1; do `fmtDose(dose('finerenone', 'target'))` nối toàn bộ `description`, bệnh nhân CKD thuần túy (không có suy tim) hiện thấy cả câu `"...trong suy tim LVEF >= 40% (HFmrEF/HFpEF) tăng lên liều đích 40 mg/ngày..."` ngay trong `title` và `dose` (trong khi liều tối đa phê duyệt cho CKD thuần túy chỉ là 20 mg/ngày).
- **`[CKD-R2-R2-08]` (Minor — Matrix: `ckdMatrix.g5_dialysis`)**: (1) `perindopril` ở cột `G5 (< 15, chưa lọc máu)` hiển thị `"2.5 mg vào ngày lọc máu"`; (2) `ramipril`, `valsartan`, `candesartan` chưa tách dải `< 15` nên hiển thị `initiate: 'ok', continue: 'rec'` ở cả G5 và Lọc máu; (3) `getG4Cell()` dòng 97 mượn ID ngưỡng `ckd.sglt2i.egfr_initiate_min` để lấy mẫu cho các thuốc khác.
- **`[CKD-R2-R2-09]` (Minor — Drug: `perindopril`)**: `perindopril.json` dùng liều 2.5 / 5 / 10 mg của muối **Perindopril arginine** (`Coversyl`), nên ghi chú rõ quy đổi với dạng muối **Perindopril erbumine/tert-butylamine** (2 / 4 / 8 mg) lưu hành phổ biến song song tại Việt Nam.
- **`[CKD-R2-R2-10]` (Minor — Drug: `finerenone`, `losartan`, `telmisartan`)**: Bổ sung trường `hepatic` theo nhãn FDA gốc cho `finerenone` (tránh dùng ở Child-Pugh C; theo dõi thêm K+ ở Child-Pugh B — FDA Section 8.6 tr. 10), `losartan` (khởi đầu 25 mg/ngày ở suy gan nhẹ–vừa — FDA Section 2.4 tr. 5) và `telmisartan` (chống chỉ định tắc mật/suy gan nặng, tối đa 40 mg/ngày ở suy gan nhẹ–vừa).
- **`[CKD-R2-R2-11]` (Minor — Drug/Interaction: `calcium_polystyrene_sulfonate` & `ix.szc_binder_separation`)**: `calcium_polystyrene_sulfonate.json` ghi `lactation.status: "compatible"` (trái với SmPC Section 4.6 khuyến cáo tránh dùng trừ khi lợi ích vượt nguy cơ → nên là `'caution'`) và thiếu chống chỉ định tắc ruột (`obstructive_bowel_disease`); ngoài ra dùng `sodium_zirconium_cyclosilicate` cùng thuốc uống đang phát trùng 2 cảnh báo (`ix.potassium_binder_drug_binding` + `ix.szc_binder_separation`).
- **`[CKD-R2-R2-12]` (Minor — Rule/Audit Trail: `ckd.inpatient.hyperkalemia_moderate` & `round1_RESPONSE.md`)**: `round1_RESPONSE.md` dòng 95 ghi đã bổ sung luật `ckd.inpatient.hyperkalemia_severe_szc_order` nhưng không tồn tại trong `rules.inpatient.ts`; `hyperkalemia_moderate` nội viện chưa phân nhánh `profileDiff` (`VN` vs `INTL`) cho chất gắn kali.
- **`[CKD-R2-R2-13]` (Suggestion — Missing Rule: `ckd.outpatient.metabolic_alkalosis_hold_bicarb`)**: Đề xuất bổ sung nhánh `REDUCE`/`HOLD` khi bệnh nhân đang uống `sodium_bicarbonate` mà `HCO3- > 26 mmol/L` (tận dụng ngưỡng `ckd.acidosis.hco3_target_max = 26` đã khai báo sẵn trong `kb/thresholds/ckd.json`).

---

## Phần 3. Kết luận Kiểm định Vòng 2 (Vai R2 — Dược lâm sàng)

- **Critical**: `0`
- **Major**: `6` (`CKD-R2-R2-01` đến `CKD-R2-R2-06`)
- **Minor**: `6` (`CKD-R2-R2-07` đến `CKD-R2-R2-12`)
- **Suggestion**: `1` (`CKD-R2-R2-13`)

**Kết luận cuối cùng**: **FAIL**
*(Lý do: Module đã khắc phục tốt lỗi Critical Vòng 1, đồng bộ chuẩn xác `finerenone.json` với HF 2026 và phân tầng `pregnancy`/washout 36h cho 18 thuốc, nhưng còn 6 lỗi mức Major về bỏ sót 3 ARB trong tương tác thuốc giữ kali, chuẩn độ RASi vượt trần liều thận ở G4, thiếu cơ chế ngừng K-binder khi hạ kali máu kèm sai ngưỡng K+ của CPS, khởi trị RASi 1B ở G5, gán `'rec'` cho CPS/Patiromer ở cột AKI và sai giờ giãn cách uống của CPS).*
