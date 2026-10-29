# Báo Cáo Thẩm Định Độc Lập Vòng 1 — Module Suy Tim (`hf`)
## Vai trò: R2 – Chuyên Gia Dược Lâm Sàng (Clinical Pharmacy Reviewer)

- **Module thẩm định**: `hf` (`src/modules/hf/*`, `kb/drugs/*.json`, `kb/thresholds/hf.json`, `kb/citations/hf.json`, `kb/interactions/*.json`, `src/engine/safety/*`)
- **Vòng duyệt**: Vòng 1 (Độc lập hoàn toàn — không đọc báo cáo của R1 và R3)
- **Ngày thẩm định**: 2026-10-27
- **Script kiểm chứng thực nghiệm**:
  - `docs/reviews/hf/scratch/r2_audit.ts` (kiểm định tự động schema/trích dẫn/dải thận toàn bộ 24 thuốc, 29 ngưỡng và 2 ma trận thận)
  - `docs/reviews/hf/scratch/r2_live_runner.ts` (chạy trực tiếp đồ thị module Vite SSR trên 14 kịch bản lâm sàng dược học C1–C13)
- **Tài liệu gốc đối chiếu trực tiếp (mở trang PDF)**:
  1. `01_Noi_Khoa/Tim_Mach/ESC_2026_Heart_Failure_Guideline.pdf` (trang 32–38, 47–54, 65–68, 74)
  2. `01_Noi_Khoa/Tim_Mach/ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf` (Tables S5–S9 trang 12–20, Table S14 trang 25, Section 9.1 & Table S26 trang 42–44)
  3. `06_Viet_Nam/BYT_1857_Huong_dan_suy_tim_signed_8e519ed3f9.pdf` (Bảng 6 & Bảng 7, trang 15–19)
  4. `01_Noi_Khoa/Tim_Mach/ACC_2026_ECDP_HFpEF.pdf` (Tables 3, 4, 5, trang 13–16)
  5. `01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2025_cardiovascular_diseases_during_pregnancy_management_of.pdf` (Section 5 trang 28–34, Rec Table 20 trang 75)
  6. **15 Nhãn thuốc gốc FDA / EMA SmPC** tại `09_Nhan_Thuoc/`: `FDA_label_sacubitril_valsartan.pdf`, `EMA/bisoprolol_Cardicor_SmPC.pdf`, `FDA_label_carvedilol.pdf`, `FDA_label_spironolactone.pdf`, `FDA_label_eplerenone.pdf`, `FDA_label_ivabradine.pdf`, `FDA_label_vericiguat.pdf` (Rev 01/2026), `FDA_label_digoxin.pdf` (Rev 10/2025), `FDA_label_bumetanide.pdf`, `FDA_label_finerenone.pdf` (Rev 09/2026), `FDA_label_dapagliflozin.pdf` (Rev 06/2026), `FDA_label_empagliflozin.pdf` (Rev 01/2026), `FDA_label_semaglutide.pdf`, `FDA_label_tirzepatide.pdf` (Rev 08/2026).

---

## 1. Tóm Tắt Kết Quả Thẩm Định (Executive Summary)

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã Finding | Ý nghĩa theo `REVIEW_PROTOCOL.md` |
|---|---:|---|---|
| **Critical** | **8** | `HF-R2-01` → `HF-R2-08` | Có thể gây hại trực tiếp / đe dọa tính mạng bệnh nhân nếu làm theo y lệnh |
| **Major** | **9** | `HF-R2-09` → `HF-R2-17` | Sai liều/phác đồ/chứng cứ nhãn thuốc & guideline, thiếu chỉ định quan trọng, trích dẫn giả tạo |
| **Minor** | **4** | `HF-R2-18` → `HF-R2-21` | Lệch mô tả ô ma trận, khác biệt ngưỡng giữa nhãn US/ESC, biệt dược/hàm lượng tại VN |
| **Suggestion** | **2** | `HF-R2-22` → `HF-R2-23` | Tối ưu hiển thị chuỗi liều `fmtDose()` và tính liều sắt tĩnh mạch theo cân nặng/Hb |
| **TỔNG CỘNG** | **23** | `round1_R2.json` | **KẾT LUẬN VÒNG 1: FAIL** |

### Các nguy cơ an toàn dược lâm sàng nổi bật nhất:
1. **Lỗi mượn sai ngưỡng sinh lý làm liều thuốc mg / xét nghiệm (QA-10)**: Hiển thị liều không tồn tại **Spironolactone 30 mg uống cách ngày** ở CKD G3b (`matrices.ts:53,185`), dùng ngưỡng eGFR 50 và `HR 50 / 5 = 10` làm liều đích MRA/BB (`rules.ts:152,411`), và dùng `30 * 3 = 90` làm mất chẩn đoán thiếu sắt ở dải **Ferritin 90–99 ng/mL** (`rules.ts:567`).
2. **Kê trùng lặp nhóm thuốc gây độc tính tử vong**: Bệnh nhân đang dùng `Eplerenone 50 mg` bị kê chồng `Spironolactone 50 mg` (2 MRA → tăng kali máu ngừng tim); bệnh nhân HFpEF đang dùng `Finerenone 20 mg` bị ra lệnh **ngừng Finerenone để chuyển sang Spironolactone**; bệnh nhân đang dùng `Carvedilol 25 mg x 2` bị kê chồng `Bisoprolol 10 mg`.
3. **Kê đại trà phác đồ HFrEF (Class I) cho mọi bệnh nhân HFpEF**: Mọi bệnh nhân `LVEF ≥ 50%` đều bị ra lệnh `START Bisoprolol 1.25 mg` (Class I) và `START Sacubitril/Valsartan 49/51 mg bid` (Class I) do điều kiện `hasHfDiagnosis || ef < 50`.
4. **Lỗ hổng khởi trị ARNI, MRA và xử trí nội viện cấp**: Bỏ sót kiểm tra ACEi trong `currentMeds` làm cổng washout 36 giờ báo sai `true` (nguy cơ phù mạch thanh quản); vẫn `START ARNI` khi `K+ = 5.3 mmol/L`, thiếu `K+/eGFR`, hoặc `eGFR < 15`; không phát lệnh `STOP Eplerenone/Spironolactone` đang uống khi `eGFR = 10.8 mL/min/1.73m²`; tiêm tĩnh mạch Furosemide và khởi trị Spironolactone ngay trên bệnh nhân nội viện đẳng tích đang **sốc tụt huyết áp (`SBP = 85 mmHg`)**; chèn liều uống ngoại trú `20 mg x 3 lần/ngày` vào y lệnh truyền tĩnh mạch giãn mạch cấp cứu.
5. **Thiếu tương tác chống chỉ định kinh điển**: Chưa có luật tương tác cho `Isosorbide dinitrate + Sildenafil/Tadalafil/Riociguat`, `Vericiguat + Riociguat / PDE-5i`, `Eplerenone + Clarithromycin/Ketoconazole/Itraconazole` (chống chỉ định tuyệt đối) & `Verapamil/Diltiazem` (trần liều ≤ 25 mg/ngày), và `MRA/RASi + Trimethoprim (Co-trimoxazole)`.

---

## 2. Chi Tiết Các Phát Hiện (Detailed Findings)

### A. Nhóm CRITICAL (`HF-R2-01` đến `HF-R2-08`)

#### `[HF-R2-01]` (CRITICAL | `matrix` | `hfMatrixHFrEF` & `hfMatrixHFpEF` – Spironolactone G3b)
- **Vấn đề**: Cả hai bảng ma trận thận HFrEF (`src/modules/hf/matrices.ts:53`) và HFpEF (`src/modules/hf/matrices.ts:185`) viết:
  ```ts
  dose: `Khởi đầu ${th('hf.mra.egfr_min_initiate')} mg uống cách ngày`
  ```
  Vì `hf.mra.egfr_min_initiate = 30` (đơn vị `mL/min/1.73m²`), giao diện hiển thị **"Khởi đầu 30 mg uống cách ngày"**. Không tồn tại viên Spironolactone 30 mg (chỉ có viên 25 mg, 50 mg, 100 mg) và liều này sai so với liều chỉnh thận.
- **Bằng chứng đối chiếu**:
  - `FDA_label_spironolactone.pdf`, trang 5 (§2.2 *Dosage in Heart Failure*): *"Patients with an eGFR between 30 and 50 mL/min/1.73 m²: Consider initiating therapy at **25 mg every other day**."*
  - `ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf`, trang 18 (Table S8): *"Starting dose: 25 mg daily (**12.5 mg daily or 25 mg every other day** if eGFR 30–49 mL/min/1.73 m²)."*
- **Khuyến nghị sửa**: Sửa trực tiếp thành `'Khởi đầu 12.5 mg/ngày hoặc 25 mg uống cách ngày'`, chấm dứt mượn ngưỡng thận `th()` làm số mg thuốc.

---

#### `[HF-R2-02]` (CRITICAL | `rule` | `hf.fmt.mra` & `hf.fmt.bb` – Kê trùng lặp MRA / Chẹn beta & mượn sai ngưỡng làm liều đích)
- **Vấn đề**:
  1. `hf.fmt.mra` (`src/modules/hf/rules.ts:146,152`) chỉ tìm `'spironolactone'` và so sánh liều với `th('hf.mra.egfr_caution')` (`50 mL/min/1.73m²`!). Nếu bệnh nhân đang uống `eplerenone 50 mg/ngày` (đã đạt liều đích), `currentDose` của spironolactone bằng `undefined`, rule kê thêm **`UPTITRATE Spironolactone 50 mg/ngày`** chồng lên Eplerenone! Nghiêm trọng hơn, trên bệnh nhân HFpEF đang uống `finerenone 20 mg/ngày`, engine ra lệnh **`START Spironolactone 25 mg`** kèm **`SWITCH: Ngừng Finerenone để thay bằng Spironolactone`**!
  2. `hf.fmt.bb` (`src/modules/hf/rules.ts:405,411`) chỉ tìm `'bisoprolol'` và tính liều đích bằng `th('hf.bb.hr_min_start') / 5` (`50 bpm / 5 = 10`!). Bệnh nhân đang uống `carvedilol 25 mg x 2 lần/ngày`, `metoprolol_succinate 200 mg`, hoặc `nebivolol 10 mg` đều bị kê chồng **`UPTITRATE Bisoprolol (đích 10 mg)`**.
- **Bằng chứng thực nghiệm (`r2_live_runner.ts`)**:
  - **Ca C2** (`HFrEF LVEF 30%`, đang dùng `eplerenone 50 mg od`, `carvedilol 25 mg bid`, `valsartan 160 mg bid`, `dapagliflozin 10 mg od`):
    - `[REC] rec_hf_mra => UPTITRATE | drug=spironolactone | dose="50 mg x 1 lần/ngày..."`
    - `[REC] rec_hf_bb => UPTITRATE | drug=bisoprolol | dose="Chuẩn độ tăng bậc liều mỗi 2–4 tuần (đích 10 mg...)"`
    - Kích hoạt đồng thời 3 cảnh báo trùng lặp thuốc: `dup_dup.mra`, `ix.dual_mra`, `dup_dup.bb`!
  - **Ca C11** (`HFpEF LVEF 55%`, đang dùng `finerenone 20 mg od`):
    - `[REC] rec_hf_mra => START | drug=spironolactone | dose="25 mg x 1 lần/ngày..."`
    - `[REC] switch_old_finerenone_for_spironolactone => SWITCH | title="CHUYỂN ĐỔI: Ngừng Finerenone để thay bằng Spironolactone (hoặc Eplerenone)"`
  - **Nhãn gốc**: `FDA_label_spironolactone.pdf` trang 6 (§4 Contraindications): *"ALDACTONE is contraindicated in patients with: ... Concomitant use of eplerenone."*
- **Khuyến nghị sửa**: Nhận diện đầy đủ tất cả hoạt chất cùng nhóm trong `currentMeds` (`spironolactone`, `eplerenone`, `finerenone` cho MRA; `bisoprolol`, `carvedilol`, `metoprolol_succinate`, `nebivolol` cho chẹn beta), lấy liều đích từ chính `drug(activeDrugId).target` (chú ý `carvedilol` 25 mg bid hoặc 50 mg bid nếu `weight > 85 kg`), giữ nguyên hoạt chất đang dung nạp để `CONTINUE` / `UPTITRATE`.

---

#### `[HF-R2-03]` (CRITICAL | `rule` | `hf.fmt.bb`, `hf.fmt.arni`, `hf.amt.iv_iron` – Kê nhầm phác đồ Class I HFrEF cho mọi bệnh nhân HFpEF)
- **Vấn đề**: Tại `src/modules/hf/rules.ts:236` (`hf.fmt.arni`), `376` (`hf.fmt.bb`) và `543` (`hf.amt.iv_iron`), hàm `when()` viết `return hasHfDiagnosis || ef < 50;`. Khi chọn module Suy tim, `hasHfDiagnosis` luôn là `true`, khiến cả bệnh nhân `LVEF = 55–65%` (HFpEF) cũng bị kê thường quy **Bisoprolol (Class I)**, **Sacubitril/Valsartan (Class I)** và truyền sắt tĩnh mạch.
- **Bằng chứng thực nghiệm & Guideline**:
  - **Ca C1** (`LVEF = 55%, NYHA II, nhịp xoang HR 72 bpm, HA 120/75 mmHg, đẳng tích`): Engine xuất `rec_hf_arni => START sacubitril_valsartan 49/51 mg bid` (Class I) và `rec_hf_bb => START bisoprolol 1.25 mg od` (Class I).
  - `ESC_2026_Heart_Failure_Guideline.pdf`, trang 37–38 (Rec Table 5): Với HFpEF (`LVEF ≥ 50%`), chỉ **SGLT2i** và **MRA** đạt **Class I, Level A**; chẹn beta và ARNI **không** nằm trong khuyến cáo điều trị HFpEF (ở HFmrEF `LVEF 41–49%`, ARNI/ACEi/ARB và BB chỉ đạt Class IIb, Level C).
  - `ACC_2026_ECDP_HFpEF.pdf`, trang 13–15: Chẹn beta không có chỉ định cho HFpEF nếu không có bệnh đồng mắc bắt buộc (có thể gây hại do suy nút xoang/chronotropic incompetence); ARNI chỉ mức Class 2b ưu tiên khi LVEF sát ngưỡng dưới 50%.
  - `ESC_2026_Heart_Failure_Guideline.pdf`, trang 68 (Rec Table 19): Sắt tĩnh mạch chỉ khuyến cáo cho **HFrEF có triệu chứng** kèm thiếu sắt (`LVEF ≤ 45%`), không khuyến cáo cho HFpEF.
- **Khuyến nghị sửa**: Phân nhánh chặt theo `patient.lvef` (`≤ 40%` HFrEF vs `41–49%` HFmrEF vs `≥ 50%` HFpEF); nếu chưa nhập `lvef`, phát khuyến cáo yêu cầu nhập LVEF để phân tầng trước khi kê ARNI/BB/sắt tĩnh mạch.

---

#### `[HF-R2-04]` (CRITICAL | `rule` | `hf.amt.iv_iron` – Phép nhân `30 * 3 = 90` bỏ sót thiếu sắt ở Ferritin 90–99 ng/mL)
- **Vấn đề**: Tại `src/modules/hf/rules.ts:567`:
  ```ts
  return ferritin < th('hf.mra.egfr_min_initiate') * 3 || (ferritin <= 299 && tsat !== undefined && tsat < th('hf.sglt2i.egfr_initiate_min'));
  ```
  Do mượn `30 * 3 = 90` thay vì `100`, mọi bệnh nhân HFrEF có **Ferritin = 90–99 ng/mL và TSAT ≥ 20%** đều bị bỏ sót chẩn đoán thiếu sắt tuyệt đối!
- **Bằng chứng thực nghiệm & Guideline**:
  - **Ca C4** (`HFrEF LVEF 30%, NYHA II, ferritin: 95, tsat: 22`): Không có khuyến cáo bù sắt tĩnh mạch lẫn tầm soát sắt nào được xuất ra.
  - `ESC_2026_Heart_Failure_Guideline.pdf`, trang 66–68 (Section 10.2.3 & Rec Table 19): Định nghĩa thiếu sắt chuẩn là *"serum ferritin <100 ng/mL, or serum ferritin 100–299 ng/mL with TSAT <20%"*.
- **Khuyến nghị sửa**: Tạo 3 ngưỡng chuyên biệt trong `kb/thresholds/hf.json` (`100 ng/mL`, `299 ng/mL`, `20 %`) với `quantity` đúng chuẩn và thay thế vào `hf.amt.iv_iron`.

---

#### `[HF-R2-05]` (CRITICAL | `rule` | `hf.fmt.arni` – Bỏ lọt ACEi trong `currentMeds` gây mất cổng nghỉ 36 giờ, fail-open khi tăng K+ / thiếu K+-eGFR / eGFR < 15)
- **Vấn đề**:
  1. **Mất cổng Washout 36 giờ**: `src/modules/hf/rules.ts:249` chỉ đọc `customInputs.takingAcei` mà không kiểm tra `patient.currentMeds`. Khi bệnh nhân đang uống `enalapril` trong `currentMeds` nhưng không tích ô `takingAcei`, cổng washout báo sai **`Washout ACEi: true ("Không đang dùng ACEi hoặc đã đủ 36 giờ washout")`** và ra lệnh `START Sacubitril/Valsartan 49/51 mg` ngay lập tức (kèm lệnh `SWITCH Enalapril` tự động không hề ghi khoảng nghỉ 36 giờ trên tiêu đề) — nguy cơ phù mạch thanh quản tử vong! Ngoài ra nếu bệnh nhân chưa từng dùng ACEi/ARB (RASi-naive), rule vẫn kê `49/51 mg bid` thay vì `24/26 mg bid` theo nhãn FDA §2.6.
  2. **Fail-open khi K+ > 5.2 mmol/L hoặc thiếu xét nghiệm**: Dòng 342 viết `const canStart = angioedemaPassed && washoutPassed && sbpPassed;` (bỏ quên `kPassed` và `egfr`). Ở **Ca C6a** (`K+ = 5.3 mmol/L`), dù cổng K+ báo `false`, engine vẫn xuất `START 49/51 mg bid`! Ở **Ca C6b** (`scr: undefined, k: undefined`), engine vẫn xuất `START 49/51 mg bid` dù chưa có xét nghiệm thận và kali!
  3. **Khởi trị ở ESRD (`eGFR < 15`)**: Ở **Ca C9** (`eGFR = 10.8 mL/min/1.73m²`), engine vẫn xuất `START 24/26 mg bid`, trái với `sacubitril_valsartan.json` (`renal[2].initiate = "not_rec"`).
- **Bằng chứng đối chiếu**: `FDA_label_sacubitril_valsartan.pdf` trang 4 (§2.1), trang 7 (§2.6 RASi-naive `24/26 mg bid`, §2.7 `eGFR < 30` `24/26 mg bid`), trang 8 (§4 Contraindications: *"Do not administer within 36 hours of switching from or to an ACE inhibitor"*); `ESC_2026` Table S5 trang 13 (`K+ > 5.0 mmol/L`, `eGFR < 30`).
- **Khuyến nghị sửa**: Quét `currentMeds` tìm mọi thuốc nhóm `acei`/`arb`; bắt buộc `HOLD`/chờ đủ **≥ 36 giờ sau liều ACEi cuối cùng** trước khi dùng ARNI; khởi đầu `24/26 mg bid` cho bệnh nhân chưa dùng RASi hoặc dùng RASi liều thấp; đưa `kPassed` và điều kiện có sẵn `K+`/`eGFR ≥ 15` vào `canStart`.

---

#### `[HF-R2-06]` (CRITICAL | `drug` | `eplerenone`, `spironolactone`, `vericiguat` – Không ngừng MRA đang uống khi eGFR < 30 và không chặn Vericiguat khi eGFR < 15)
- **Vấn đề**:
  1. `kb/drugs/eplerenone.json` (`renal[2]`) và `kb/drugs/spironolactone.json` (`renal[2]`) gán dải `eGFR 0–30` là `"initiate": "not_rec", "continue": "not_rec"` thay vì `"contra"`. Vì `reviewCurrentMedications` (`src/engine/safety/reviewMeds.ts:411`) chỉ phát lệnh `STOP` khi `band.continue === 'contra'`, bệnh nhân suy thận giai đoạn cuối (`eGFR = 10.8 mL/min/1.73m²`, **Ca C9**) đang uống `Eplerenone 25 mg` hoàn toàn **không nhận được lệnh `STOP`**!
  2. `hf.amt.vericiguat` không kiểm tra `eGFR`, nên tại `eGFR = 10.8` (**Ca C9**) vẫn xuất `CONSIDER Vericiguat 2.5 mg` bất chấp `vericiguat.json` (`renal[1]: initiate = "not_rec"` khi `< 15`).
- **Bằng chứng đối chiếu**:
  - `FDA_label_eplerenone.pdf` trang 5 (§4 Contraindications): *"INSPRA is contraindicated in all patients with: ... creatinine clearance ≤30 mL/min."*
  - `ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf` trang 18 (Table S8): *"Contraindications: ... Severe renal dysfunction (eGFR <30 mL/min/1.73 m²)."*
  - `FDA_label_vericiguat.pdf` trang 7 (§8.6): *"VERQUVO has not been studied in patients with eGFR <15 mL/min/1.73 m² at treatment initiation or on dialysis."*
- **Khuyến nghị sửa**: Đổi `renal[2]` của `eplerenone.json` và `spironolactone.json` sang `"initiate": "contra", "continue": "contra"`, và thêm cổng chặn `eGFR < 15` trong `hf.amt.vericiguat` + `gates.ts`.

---

#### `[HF-R2-07]` (CRITICAL | `rule` | `hf.inpatient.iv_diuretic`, `hf.inpatient.vasodilator`, `hf.fmt.mra` – Kê lợi tiểu tĩnh mạch & MRA khi đang sốc tụt HA; trộn liều uống ngoại trú vào thuốc giãn mạch tĩnh mạch)
- **Vấn đề**:
  1. **Ca C12a** (`setting: 'inpatient', congestion: 'euvolaemic', sbp: 85 mmHg`): Dù bệnh nhân đẳng tích và đang **sốc tụt huyết áp (`SBP 85 mmHg`)**, `hf.inpatient.iv_diuretic` (`rules.ts:1046`) vẫn ra lệnh **`START Furosemide tĩnh mạch`**, đồng thời `hf.fmt.mra` vẫn ra lệnh **`START Spironolactone 25 mg`**!
  2. **Ca C12b** (`setting: 'inpatient', congestion: 'severe', sbp: 135 mmHg`): `hf.inpatient.vasodilator` (`rules.ts:1100–1125`) dùng `fmtDose(dose('isosorbide_dinitrate', 'start'))`, hiển thị liều **`"20 mg x 3 lần/ngày (uống/tiêm truyền) - Ngoại trú: 20 mg uống 3 lần/ngày phối hợp Hydralazine..."`** trong y lệnh giãn mạch tĩnh mạch cấp cứu!
- **Bằng chứng đối chiếu**: `ESC_2026_Heart_Failure_Guideline.pdf` trang 50 (Rec Table 9: lợi tiểu quai TM chỉ định khi có *fluid overload*, chống chỉ định làm giảm thể tích trên bệnh nhân giảm tưới máu/sốc khi chưa bù dịch/vận mạch); `ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf` trang 25 (Table S14: Nitroglycerin TM `10–20 µg/min → tối đa 200 µg/min`; ISDN TM `1 mg/h → tối đa 10 mg/h`).
- **Khuyến nghị sửa**: Kiểm tra bắt buộc tình trạng sung huyết (`congestion !== 'euvolaemic'`) và huyết động (`SBP ≥ 90 mmHg`) trước khi khởi trị lợi tiểu quai TM và MRA; viết chuỗi liều truyền tĩnh mạch riêng cho `hf.inpatient.vasodilator`.

---

#### `[HF-R2-08]` (CRITICAL | `missing` | Thiếu tương tác thuốc chống chỉ định tử vong của nhóm thuốc Suy tim & lỗ hổng `CONSIDER` trong `checkInteractions`)
- **Vấn đề**: Rà soát toàn bộ 7 file `kb/interactions/*.json` và `src/engine/safety/interactions.ts` chứng minh hệ thống **bỏ sót hoàn toàn** các cặp tương tác chống chỉ định kinh điển sau:
  1. **Nitrate hữu cơ (`isosorbide_dinitrate`, `nitroglycerin`) + PDE-5i (`sildenafil`, `tadalafil`, `vardenafil`) hoặc `riociguat`**: Chống chỉ định tuyệt đối (hạ HA trụy mạch kháng trị, nhồi máu cơ tim tử vong).
  2. **`vericiguat` + `riociguat`** (Chống chỉ định tuyệt đối — `FDA_label_vericiguat.pdf` §4 trang 3) và **`vericiguat` + PDE-5i (`sildenafil`, `tadalafil`)** (Không khuyến cáo — §7.2 trang 5; kiểm chứng tại **Ca C10**: `vericiguat + sildenafil` phát **0 cảnh báo**!).
  3. **`eplerenone` + chất ức chế mạnh CYP3A4 (`clarithromycin`, `ketoconazole`, `itraconazole`, `ritonavir`)**: Chống chỉ định tuyệt đối (`FDA_label_eplerenone.pdf` §4 trang 5 — tăng AUC Eplerenone ~5 lần gây tăng kali máu tử vong; kiểm chứng tại **Ca C8**: `eplerenone 50 mg + clarithromycin 500 mg` phát **0 cảnh báo**!) và **`eplerenone` + chất ức chế vừa CYP3A4 (`verapamil`, `diltiazem`, `erythromycin`, `fluconazole`)**: Giới hạn liều tối đa **≤ 25 mg x 1 lần/ngày** (§2.4 & §7.1 trang 3, 6).
  4. **MRA (`spironolactone`, `eplerenone`, `finerenone`) / RASi + `trimethoprim` / `cotrimoxazole`**: Nguy cơ cao tăng kali máu cấp nhập viện/tử vong (`FDA_label_spironolactone.pdf` §7.1 trang 7).
  5. **Lỗ hổng `CONSIDER` trong `interactions.ts:284`**: Chỉ quét `START | UPTITRATE | CONTINUE`, bỏ qua `CONSIDER`. Tại **Ca C8**, bệnh nhân đang uống `clarithromycin` vẫn được gợi ý `CONSIDER Ivabradine 5 mg bid` mà **không hề phát cảnh báo chống chỉ định `ix.ivabradine_strong_cyp3a4`**! (Tương tự thiếu `aliskiren` trong `drugIds` của `ix.dual_rasi`, thiếu `clarithromycin`/`itraconazole`/`spironolactone` với `digoxin`, và thiếu `loop_diuretic + lithium/aminoglycoside`).
- **Khuyến nghị sửa**: Bổ sung đầy đủ các luật tương tác trên vào `kb/interactions/cardiovascular.json` & `renal_rasi.json`, đồng thời quét cả các đề xuất `CONSIDER` trong `checkInteractions` (hoặc chặn ngay trong `when()` của rule).

---

### B. Nhóm MAJOR (`HF-R2-09` đến `HF-R2-17`)

#### `[HF-R2-09]` (MAJOR | `citation` | Trích dẫn sai nội dung / không liên quan trên 15/17 thuốc HF, 7/7 thuốc dùng chéo và 5 ngưỡng HF)
- **Vấn đề**: Kiểm định tự động bằng `r2_audit.ts` Mục 1 & 2 chứng minh phần lớn `citationIds` trong `kb/drugs/*.json` và một số ngưỡng trong `kb/thresholds/hf.json` tuy tồn tại ID nhưng nội dung `quote` **không hề chứa hoạt chất, thông số thận hay thai kỳ/cho con bú**:
  - `hydralazine.json`: dẫn duy nhất `esc.hf.2026.loop_diuretics_chronic` (đoạn văn về lợi tiểu quai, 0 chữ Hydralazine!) cho mọi trường.
  - `bisoprolol`, `carvedilol`, `metoprolol_succinate`, `nebivolol`: dẫn `esc.hf.2026.bb_guidance_table_s6` cho `pregnancy`, `lactation`, `renal` (Table S6 trang 14–15 không có thai kỳ, cho con bú hay ngưỡng eGFR 15/20/30; `esc.hf.2026.bb_doses` cắt mất dòng Nebivolol).
  - `sacubitril_valsartan.json`: dẫn `fda.hf.sacubitril_angioedema` (phù mạch §4) cho `pregnancy` và `lactation`.
  - `spironolactone.json`: dẫn `fda.hf.spironolactone_dose_renal` (§2.2 liều thận) cho `pregnancy` và `lactation`.
  - `vericiguat`, `digoxin`, `ferric_carboxymaltose`, `ferric_derisomaltose`: dẫn câu khuyến cáo hiệu quả 1 dòng cho cả `renal`, `pregnancy`, `lactation`; `ivabradine` dẫn `pregnancy_contra` cho `lactation` và `ivabradine_rec` cho `renal`.
  - `furosemide`, `torsemide`, `bumetanide`: dẫn `loop_diuretics_chronic` (không có tên thuốc/liều/thận) thay vì `loop_diuretics_doses_table_s7` & nhãn FDA; `isosorbide_dinitrate` dẫn `acute_vasodilators`.
  - `kb/thresholds/hf.json`: `hf.digoxin.ef_max` (`40`) dẫn nhầm `esc.hf.2026.icd_primary_prevention` (nói về ICD LVEF ≤ 35%!); `hf.arni.sbp_low_dose` (`110`), `hf.digoxin.hr_min` (`50`), `hf.acute.shock_sbp` (`90`) dẫn trích dẫn không chứa con số tương ứng.
- **Khuyến nghị sửa**: Trích xuất nguyên văn §2, §4, §7, §8.1, §8.2, §8.6, §8.7 từ 15 file PDF nhãn thuốc trong `09_Nhan_Thuoc/` và ESC 2026 / ESC 2025 Pregnancy vào `kb/citations/hf.json` rồi gắn đúng từng trường.

---

#### `[HF-R2-10]` (MAJOR | `drug` / `matrix` / `rule` | `finerenone` chưa cập nhật hàm lượng 40 mg, bậc liều HFpEF 20→40 mg và mức khuyến cáo Class I A theo ESC 2026 / FDA 09/2026)
- **Vấn đề**:
  1. `kb/drugs/finerenone.json` chỉ có hàm lượng 10 mg, 20 mg và liều đích `20 mg/ngày` (của CKD-T2D), thiếu viên **40 mg** và phác đồ suy tim `LVEF ≥ 40%`: **`eGFR ≥ 60`: khởi đầu 20 mg od → đích 40 mg od; `eGFR 25 đến < 60`: khởi đầu 10 mg od → đích 20 mg od** (`ESC_2026` Table 11 trang 37; `ACC_2026` Table 4 trang 14; `FDA_label_finerenone.pdf` Rev 09/2026 trang 1, 3).
  2. `hfMatrixHFpEF` (`matrices.ts:180`) ghi sai MRA ở HFpEF là **`Class IIb`** thay vì **Class I, Level A** (`ESC_2026` Rec Table 5 trang 37), và gộp chung `Spironolactone / Finerenone` dùng ngưỡng `eGFR < 30` của Spironolactone thay vì ngưỡng khởi trị `eGFR ≥ 25` / duy trì `eGFR ≥ 15` của Finerenone.
- **Khuyến nghị sửa**: Cập nhật `finerenone.json` (thêm `classes: ["mra_nonsteroidal"]`, viên 40 mg, bậc liều HF 10→20 mg và 20→40 mg), tách riêng hàng `Finerenone` trong `hfMatrixHFpEF` (Class I), và hỗ trợ `finerenone` trong `hf.fmt.mra` khi `LVEF ≥ 40%`.

---

#### `[HF-R2-11]` (MAJOR | `drug` / `rule` | `semaglutide` [Ozempic 1 mg vs Wegovy 2.4 mg], `tirzepatide` [đích 5 mg vs 15 mg] và sai LOE A thay vì B ở HFpEF kèm béo phì)
- **Vấn đề**:
  1. `hf.comorbid.obesity_glp1` (`rules.ts:897`) nêu đích **Semaglutide 2.4 mg/tuần** (STEP-HFpEF), nhưng `kb/drugs/semaglutide.json` khai báo bút tiêm **Ozempic** (`target: 1 mg/tuần`, không có nấc 1.7 mg và 2.4 mg của Wegovy).
  2. `tirzepatide.json` dừng `target` ở **5 mg/tuần**, trong khi thử nghiệm SUMMIT / `ACC_2026` Table 4 trang 14 / `FDA_label_tirzepatide.pdf` chuẩn độ lên tới **15 mg/tuần** (`maxDose: "15 mg/tuần"`).
  3. Cả `rules.ts:911` và `esc.hf.2026.glp1_obesity` ghi `loe: "A"`, trong khi `ESC_2026` Rec Table 18 (trang 65) xếp **Class IIa, Level B**.
- **Khuyến nghị sửa**: Đổi `loe` sang `'B'`; cập nhật đầy đủ bậc chuẩn độ 0.25→0.5→1.0→1.7→2.4 mg/tuần cho Semaglutide (kèm lưu ý thực tế nguồn cung Wegovy vs Ozempic tại VN) và 2.5→5→7.5→10→12.5→15 mg/tuần cho Tirzepatide.

---

#### `[HF-R2-12]` (MAJOR | `drug` / `rule` | Sai liều khởi đầu theo tuổi/thận của `digoxin` & `ivabradine`, thiếu cập nhật nhãn FDA 01/2026 của `vericiguat`, và thiếu chống chỉ định suy gan/loạn nhịp)
- **Vấn đề**:
  1. **`digoxin`**: `hf.amt.digoxin` luôn kê `0.125 mg/ngày` ngay cả trên bệnh nhân nữ **82 tuổi, 48 kg, `eGFR = 19.7`** (**Ca C10**), gây nguy cơ ngộ độc Digitalis cao (ESC 2026 Table 11 trang 37 khuyến cáo khởi đầu `62.5 µg o.d.`, giảm cách ngày khi suy thận nặng, giữ nồng độ `< 1.2 ng/mL`); `digoxin.json` thiếu chống chỉ định `ventricular_fibrillation` và `wpw_syndrome` (`FDA_label_digoxin.pdf` §4, §5.1).
  2. **`ivabradine`**: `hf.amt.ivabradine` luôn kê `5 mg x 2 lần/ngày` ở người **78 tuổi** (**Ca C8**), trong khi ≥ 75 tuổi phải khởi đầu **2.5 mg x 2 lần/ngày**; `ivabradine.json` thiếu `hepatic` (`Child-Pugh C: contra` theo FDA Corlanor §4) và chống chỉ định suy nút xoang, block AV độ II–III, suy tim mất bù cấp, phụ thuộc máy tạo nhịp, dùng thuốc ức chế mạnh CYP3A4.
  3. **`vericiguat`**: Thiếu `hepatic` (`Child-Pugh C: not_rec`), thiếu chống chỉ định `riociguat`, và chưa ghi nhận nhãn **FDA Verquvo Rev 01/2026** (§2.1 trang 1, 3) nâng liều khởi đầu chuẩn lên **5 mg x 1 lần/ngày cùng thức ăn** (2.5 mg/ngày nếu có nguy cơ hạ HA triệu chứng; trong khi ESC 2026 Table 11 giữ 2.5 mg/ngày).
- **Khuyến nghị sửa**: Cá thể hóa liều khởi đầu theo `age`, `weight`, `egfr` trong `hf.amt.digoxin` và `hf.amt.ivabradine`; bổ sung `hepatic`, `contraindications`, và ghi chú khác biệt liều khởi đầu Vericiguat giữa `INTL/VN` (2.5 mg) và `US` (5 mg).

---

#### `[HF-R2-13]` (MAJOR | `drug` / `rule` | Toàn bộ 17 thuốc HF thiếu trường suy gan `hepatic`, thiếu chống chỉ định hen/suy gan của Carvedilol, liều > 85 kg và chọn lọc β1 trong thai kỳ)
- **Vấn đề**:
  1. Cả **17/17 thuốc sở hữu bởi HF** đều có `hepatic: undefined`! Tại **Ca C13** (`asthma: true, liverDisease: true`, đang dùng `carvedilol 12.5 mg bid`), `reviewCurrentMedications` không phát bất kỳ lệnh `STOP` nào dù `FDA_label_carvedilol.pdf` §4 (trang 5) chống chỉ định tuyệt đối trong **suy gan nặng** và **hen phế quản** (*tử vong do status asthmaticus sau liều đơn*)! Tương tự `nebivolol` chống chỉ định ở Child-Pugh C, và `sacubitril_valsartan` bắt buộc giảm nửa liều khởi đầu (`24/26 mg bid`) ở Child-Pugh B và tránh dùng ở Child-Pugh C (`FDA_label_sacubitril_valsartan.pdf` §2.8 trang 7).
  2. Trong thai kỳ (**Ca C7**), bệnh nhân HFrEF đang uống `carvedilol` không được hướng dẫn chuyển sang chẹn beta chọn lọc β1 (`bisoprolol` / `metoprolol_succinate`, Class I LOE C theo ESC 2026 Rec Table 27 trang 74). Ngoài ra `carvedilol.json` thiếu đích **50 mg x 2 lần/ngày khi cân nặng > 85 kg** (ESC Table 11 trang 37; FDA Coreg §2.1).
- **Khuyến nghị sửa**: Điền đầy đủ `hepatic` cho các thuốc HF và nối cổng `liverDisease` trong engine; bổ sung `reactive_airway_disease`, `cardiogenic_shock`, `av_block_2_3`, `sick_sinus_syndrome` vào `contraindications` của 4 thuốc BB; cập nhật `reviewMeds.ts` xử lý `reactive_airway_disease` và hướng dẫn chuyển sang β1-selective BB trong thai kỳ.

---

#### `[HF-R2-14]` (MAJOR | `rule` | Mâu thuẫn cổng tần số tim `HR < 55 bpm` toàn cục vs `HR ≥ 50 bpm` của module HF)
- **Vấn đề**: Ở **Ca C5** (`HR = 52 bpm`), khuyến cáo `rec_hf_bb` xuất đồng thời 2 cổng đối nghịch nhau trên cùng một thẻ: `HR: true ("Nhịp tim 52 bpm ≥ 50: Đạt tiêu chuẩn an toàn tần số tim")` và `HR: false ("Nhịp tim 52 bpm < 55 bpm: Chống chỉ định/tạm hoãn...")` do `src/engine/safety/gates.ts:484` hardcode `< 55` trong khi `rules.ts` và ESC 2026 Table S6 (trang 15) dùng `< 50 bpm`.
- **Khuyến nghị sửa**: Đồng bộ ngưỡng chặn `HOLD` về `< 50 bpm` theo `th('hf.bb.hr_min_start')` / ESC Table S6 (dải `50–54 bpm` chỉ hiện lưu ý thận trọng, đặc biệt khi duy trì Carvedilol theo FDA §2.1).

---

#### `[HF-R2-15]` (MAJOR | `threshold` | Toàn bộ 29/29 ngưỡng trong `kb/thresholds/hf.json` thiếu trường `quantity`)
- **Vấn đề**: Tất cả 29 mục trong `kb/thresholds/hf.json` đều để `quantity: undefined`, vô hiệu hóa hàng rào kiểm tra kiểu đại lượng ngữ nghĩa của `KB_AUTHORING.md` §4.3 và `QA_FINDINGS.md` QA-10.
- **Khuyến nghị sửa**: Bổ sung `quantity` cho toàn bộ 29 ngưỡng hiện hữu và các ngưỡng thiếu sắt / thận mới.

---

#### `[HF-R2-16]` (MAJOR | `drug` | Rỗng `renalBand` ở eGFR < 15 cho `torsemide`/`bumetanide`/`isosorbide_dinitrate`, thiếu `components` FDC của ARNI, thiếu `classes` của 4 thuốc dùng chéo và thiếu `maxDose` của 13 thuốc HF)
- **Vấn đề**:
  1. `torsemide.json`, `bumetanide.json`, `isosorbide_dinitrate.json` chỉ khai báo `eGFRFrom: 15`, làm `renalBand(id, egfr)` trả về `undefined` khi `eGFR < 15`.
  2. `sacubitril_valsartan.json` thiếu `components: ["sacubitril", "valsartan"]`.
  3. `empagliflozin.json`, `finerenone.json`, `enalapril.json`, `valsartan.json` đều có `classes: undefined`.
  4. 13/17 thuốc HF để `maxDose: undefined` (thiếu trần liều quan trọng như `furosemide` 600 mg/ngày, `torsemide` 200 mg/ngày, `bumetanide` 10 mg/ngày theo ESC Table S7 trang 16).
- **Khuyến nghị sửa**: Bổ sung dải thận `0–15`, `components`, `classes` và `maxDose` đầy đủ cho các file JSON trên.

---

#### `[HF-R2-17]` (MAJOR | `missing` | Thiếu hoàn toàn luật kê đơn ngoại trú `Hydralazine + Isosorbide dinitrate` trong `rules.ts`)
- **Vấn đề**: Hai file `hydralazine.json` và `isosorbide_dinitrate.json` đã có trong KB nhưng `rules.ts` không có bất kỳ luật ngoại trú nào kê phối hợp H-ISDN cho bệnh nhân HFrEF không dung nạp/chống chỉ định cả ACEi/ARB lẫn ARNI (bao gồm thai kỳ có HFrEF hoặc suy thận/tăng kali không dùng được RASi — ESC 2026 Class IIb B; ESC 2025 Pregnancy Rec Table 20) hoặc bệnh nhân da đen NYHA III–IV kháng trị (ESC 2026 Class IIa B; BYT 1857 Bảng 7).
- **Khuyến nghị sửa**: Bổ sung luật `hf.amt.hydralazine_isdn` đúng chỉ định và bậc liều `37.5/20 mg x 3 lần/ngày → 75/40 mg x 3 lần/ngày`.

---

### C. Nhóm MINOR (`HF-R2-18` đến `HF-R2-21`) & SUGGESTION (`HF-R2-22` đến `HF-R2-23`)

- **`[HF-R2-18]` (MINOR | `matrix` / `drug`)**: Ô G5 (`< 15`) của Sacubitril/Valsartan tại `matrices.ts:87` mượn nhầm `th('hf.sglt2i.egfr_initiate_min')` sinh câu *"Dữ liệu còn hạn chế khi eGFR dưới 20"* trong cột `< 15`; đồng thời `sacubitril_valsartan.json` (`start.description`) ghi giảm nửa liều `24/26 mg bid` cho `eGFR 30–60` nhưng quên nêu nhóm bắt buộc trên nhãn FDA §2.7 là **`eGFR < 30 mL/min/1.73m²`**.
- **`[HF-R2-19]` (MINOR | `drug`)**: `dapagliflozin.json` đặt ngưỡng khởi trị `eGFR ≥ 20` nhưng chỉ dẫn nhãn FDA (trong khi nhãn `FDA_label_dapagliflozin.pdf` trang 5 & ACC 2026 Table 5 là **`eGFR ≥ 25`**, còn `≥ 20` là của ESC 2026 Table S9 / KDIGO 2024); cần dẫn nguồn ESC Table S9, ghi rõ khác biệt `US` (`25`) vs `INTL/VN` (`20`), và bổ sung quy tắc **ngưng SGLT2i ≥ 3 ngày trước đại phẫu/nhịn ăn kéo dài** phòng toan ceton đẳng đường huyết.
- **`[HF-R2-20]` (MINOR | `drug` / `merge`)**: Chuẩn hóa phân loại và ghi chú thai kỳ/cho con bú của `spironolactone` (giải thích rõ mâu thuẫn ESC Table S8 `contra` vs FDA §8.2/ESC 2025 Pregnancy tương thích khi cho con bú), `hydralazine` (`caution` thay vì `compatible`), `vericiguat` (bổ sung yêu cầu Boxed Warning tránh thai trong điều trị + **1 tháng sau ngưng thuốc**), và giữ nguyên lệnh `STOP` thay vì hạ xuống `AVOID` khi thai phụ đang uống thuốc gây quái thai trong `currentMeds` (**Ca C7**).
- **`[HF-R2-21]` (MINOR | `drug`)**: Hiệu đính biệt dược & hàm lượng tại Việt Nam: đổi `Monoferric` → **`Monofer`** cho `ferric_derisomaltose`; thêm viên **`100 mg`** (`Betaloc ZOK 100 mg`) cho `metoprolol_succinate`; thêm **`Concor Cor`** + bậc `3.75 mg`, `7.5 mg` cho `bisoprolol`; thêm **`Talliton`**, **`Coryol`** cho `carvedilol`; thêm **`Aldactone`** cho `spironolactone`; ghi chú tính khan hiếm của `bumetanide`, `eplerenone`, `hydralazine` uống tại bệnh viện VN.
- **`[HF-R2-22]` (SUGGESTION | `ui`)**: Tối ưu `fmtDose()` (`rules.ts:39–44`) để không lặp lại hai lần hàm lượng và số lần dùng trên tiêu đề thẻ khuyến cáo.
- **`[HF-R2-23]` (SUGGESTION | `drug`)**: Tự động tính liều `ferric_carboxymaltose` / `ferric_derisomaltose` theo bảng `weight` × `hb` (tạm hoãn nếu `Hb > 15 g/dL`) và nhắc nguy cơ hạ phospho máu khi truyền lặp lại Ferric carboxymaltose.

---

## 3. Bảng Kiểm Định Dược Lâm Sàng Toàn Bộ 24 Thuốc Liên Quan Module Suy Tim

### 3.1. 17 Thuốc Thuộc Sở Hữu Của Module `hf` (`kb/drugs/*.json`)

| # | Drug ID | Liều khởi đầu / Đích / Tối đa | Chỉnh liều Thận (`renal`) & Gan (`hepatic`) | Chống chỉ định, Tương tác & Thai kỳ/Cho con bú | Dạng bào chế & Biệt dược VN | Trích dẫn (`citationIds`) | Kết luận R2 |
|---:|---|---|---|---|---|---|---|
| 1 | `sacubitril_valsartan` | 49/51 mg bid (24/26 mg bid nếu chưa dùng RASi, SBP 100–110, suy thận nặng/gan vừa) → 97/103 mg bid. Thiếu `maxDose` (`194/206 mg/ngày`) & thiếu `eGFR < 30` trong `start.description` (`HF-R2-18`). | Thận: G4 giảm khởi đầu 24/26 bid; G5 `<15` `not_rec` nhưng rule vẫn `START` (`HF-R2-05`). Gan: **Thiếu hoàn toàn** (FDA §2.8: Child-Pugh B 24/26 bid; Child-Pugh C tránh dùng — `HF-R2-13`). | Thiếu `components: ["sacubitril","valsartan"]` (`HF-R2-16`). Rule bỏ lọt ACEi trong `currentMeds` mất washout 36h (`HF-R2-05`). Thiếu `aliskiren` trong `ix.dual_rasi` (`HF-R2-08`). | Viên 50 mg (24/26), 100 mg (49/51), 200 mg (97/103) — `Entresto`, `Uperio` (Đúng chuẩn VN). | `pregnancy` & `lactation` dẫn nhầm `sacubitril_angioedema` (`HF-R2-09`). | **FAIL** |
| 2 | `bisoprolol` | 1.25 mg od → 10 mg od. Thiếu bậc `3.75 mg`, `7.5 mg` (SmPC §4.2) & thiếu `maxDose: "10 mg/ngày"`. | Thận: Đúng (thận trọng <20, tối đa 10 mg). Gan: **Thiếu** (SmPC: tối đa 10 mg/ngày ở suy gan nặng — `HF-R2-13`). | Thiếu CCĐ sốc tim, suy tim mất bù cấp, block AV độ II–III, suy nút xoang, hen nặng (`HF-R2-13`). Xung đột cổng `HR < 55` vs `< 50` (`HF-R2-14`). | Viên 1.25, 2.5, 5, 10 mg — thiếu biệt dược suy tim **`Concor Cor`** (2.5 mg bẻ đôi tại VN — `HF-R2-21`). | `renal`, `pregnancy`, `lactation` dẫn sai `bb_guidance_table_s6` (`HF-R2-09`). | **FAIL** |
| 3 | `carvedilol` | 3.125 mg bid → 25 mg bid. **Thiếu đích 50 mg bid khi > 85 kg** (ESC Table 11 / FDA §2.1) & thiếu `maxDose` (`HF-R2-13`). | Thận: Đúng. Gan: **Thiếu CCĐ tuyệt đối ở suy gan nặng** (FDA §4 — `HF-R2-13`). | **Thiếu CCĐ hen phế quản** (`reactive_airway_disease`) nên không `STOP` ở Ca C13; không chuyển sang β1-selective trong thai kỳ Ca C7 (`HF-R2-13`). | Viên 6.25, 12.5, 25 mg (3.125 mg bẻ đôi viên 6.25 mg) — thiếu **`Talliton`**, **`Coryol`** (`HF-R2-21`). | `renal`, `pregnancy`, `lactation` dẫn sai `bb_guidance_table_s6` (`HF-R2-09`). | **FAIL** |
| 4 | `metoprolol_succinate` | 12.5–25 mg od → 200 mg od. Thiếu `maxDose: "200 mg/ngày"` (`HF-R2-16`). Bị kê chồng `bisoprolol` bởi `hf.fmt.bb` (`HF-R2-02`). | Thận: Không cần chỉnh liều (Đúng). Gan: **Thiếu** lưu ý giảm liều/tăng chậm ở suy gan do chuyển hóa qua gan/CYP2D6 (`HF-R2-13`). | Thiếu CCĐ sốc tim, block AV độ II–III, suy nút xoang (`HF-R2-13`). An toàn ưu tiên (cùng bisoprolol) trong thai kỳ (ESC 2026 Class I C). | `forms` chỉ có 25 mg & 50 mg — **bỏ sót viên ER 100 mg** (`Betaloc ZOK 100 mg` — `HF-R2-21`). | `renal`, `pregnancy`, `lactation` dẫn sai `bb_guidance_table_s6` (`HF-R2-09`). | **FAIL** |
| 5 | `nebivolol` | 1.25 mg od → 10 mg od. Thiếu `maxDose: "10 mg/ngày"`. Bị kê chồng `bisoprolol` bởi `hf.fmt.bb` (`HF-R2-02`). | Thận: Khởi đầu 2.5 mg ở suy thận nặng, thận trọng <15. Gan: **Thiếu CCĐ tuyệt đối ở Child-Pugh C** (`HF-R2-13`). | Thiếu CCĐ sốc tim, block AV độ II–III, suy nút xoang, suy gan (`HF-R2-13`). Lưu ý ESC: chủ yếu dữ liệu SENIORS ≥70 tuổi, chưa giảm tử vong rõ. | Viên 2.5 mg (hiếm tại VN), 5 mg (`Nebilet` có rãnh chia tư 1.25 mg — tốt). | `bb_doses` bị cắt mất dòng Nebivolol; `table_s6` không có thận/thai kỳ (`HF-R2-09`). | **FAIL** |
| 6 | `spironolactone` | 25 mg od (12.5 mg od / 25 mg cách ngày nếu eGFR 30–49) → 50 mg od. **Ô ma trận G3b in sai "30 mg cách ngày"** (`HF-R2-01`). | Thận: `renal[2]` (`<30`) để `not_rec` thay vì `contra` làm mất lệnh `STOP` khi suy thận nặng (`HF-R2-06`). Gan: Thiếu lưu ý xơ gan cổ trướng/bệnh não gan. | Thiếu tương tác với **Co-trimoxazole (Trimethoprim)** & Digoxin (`HF-R2-08`). Thiếu cổng `SBP < 90` ở Ca C12a (`HF-R2-07`). Ghi chú cho con bú cần làm rõ ESC S8 vs FDA §8.2 (`HF-R2-20`). | Viên 25, 50, 100 mg — thiếu biệt dược gốc **`Aldactone`** (`HF-R2-21`). | `pregnancy` & `lactation` dẫn sai §2.2 liều thận (`HF-R2-09`). | **FAIL** |
| 7 | `eplerenone` | 25 mg od → 50 mg od. Bị `hf.fmt.mra` kê chồng `spironolactone 50 mg` (`HF-R2-02`). Thiếu `maxDose: "50 mg/ngày"`. | Thận: **FDA §4 CCĐ tuyệt đối khi CrCl ≤ 30**, nhưng `renal[2]` để `not_rec` làm Ca C9 (`eGFR 10.8`) không phát lệnh `STOP` (`HF-R2-06`)! Gan: Thiếu Child-Pugh C. | **Thiếu hoàn toàn tương tác CYP3A4 mạnh (CCĐ tuyệt đối với Clarithromycin/Azole) & CYP3A4 vừa (Verapamil/Diltiazem trần ≤ 25 mg/ngày)** (`HF-R2-08`). | Viên 25, 50 mg (`Inspra` — rất ít sẵn có tại VN, cần ghi chú cung ứng — `HF-R2-21`). | Dẫn `mra_doses` & `table_s8` nhưng thiếu trích dẫn nhãn FDA Inspra §4/§7 (`HF-R2-09`). | **FAIL** |
| 8 | `ivabradine` | 5 mg bid cùng bữa ăn → 7.5 mg bid. **Rule không giảm còn 2.5 mg bid khi ≥ 75 tuổi** ở Ca C8 (`HF-R2-12`). Thiếu `maxDose: "15 mg/ngày"`. | Thận: Thận trọng `<15` (`not_rec` khởi trị). Gan: **Thiếu CCĐ tuyệt đối ở suy gan nặng Child-Pugh C** (FDA Corlanor §4 — `HF-R2-12`). | Thiếu CCĐ suy nút xoang, block AV độ II–III, suy tim cấp, phụ thuộc máy tạo nhịp. Ca C8 đang uống `clarithromycin` vẫn đề xuất `CONSIDER ivabradine` không báo động (`HF-R2-08`). | Viên 5 mg (có vạch bẻ đôi 2.5 mg), 7.5 mg — `Procoralan` (Đúng chuẩn VN). | `lactation` dẫn nhầm `pregnancy_contra`; `renal` dẫn nhầm `ivabradine_rec` (`HF-R2-09`). | **FAIL** |
| 9 | `vericiguat` | 2.5 mg od cùng thức ăn (ESC 2026) vs **5 mg od chuẩn mới theo FDA Rev 01/2026** → 10 mg od (`HF-R2-12`). Thiếu `maxDose: "10 mg/ngày"`. | Thận: `renal[1]` `<15` là `not_rec`, nhưng **rule vẫn kê ở `eGFR 10.8`** Ca C9 (`HF-R2-06`). Gan: Thiếu Child-Pugh C (`not_rec` — FDA §8.7). | **Thiếu tương tác CCĐ với `riociguat` & không khuyến cáo với `sildenafil`/`tadalafil`** (`HF-R2-08`). Thiếu yêu cầu Boxed Warning tránh thai thêm 1 tháng sau ngưng (`HF-R2-20`). | Viên 2.5, 5, 10 mg — `Verquvo` (Đúng chuẩn VN). | Dẫn câu 1 dòng `vericiguat_rec` cho cả thận, thai kỳ, cho con bú, SBP (`HF-R2-09`). | **FAIL** |
| 10 | `digoxin` | `start: 0.125 mg od`. **Rule kê cứng 0.125 mg/ngày cho cụ 82 tuổi, 48 kg, eGFR 19.7** ở Ca C10 (lẽ ra 0.0625 mg od / cách ngày — `HF-R2-12`). | Thận: Chỉnh liều rất mạnh theo CrCl/eGFR (thải 50–70% nguyên dạng qua thận). Gan: Không cần chỉnh liều. | Thiếu CCĐ **rung thất (`ventricular_fibrillation`)** & **WPW + rung nhĩ** (`HF-R2-12`). Thiếu tương tác P-gp với `clarithromycin`, `itraconazole`, `spironolactone` (`HF-R2-08`). | Viên 0.25 mg (bẻ đôi 0.125 mg; tại VN rất thiếu viên 0.0625 mg nên thường dùng 1/2 viên 0.25 mg cách ngày!), ống 0.5 mg/2 mL. | Dẫn `digoxin_rec` cho cả thận, thai kỳ, cho con bú, CCĐ (`HF-R2-09`). | **FAIL** |
| 11 | `furosemide` | 20–40 mg/ngày. Thiếu `maxDose: "600 mg/ngày"` (ESC Table S7 — `HF-R2-16`). Rule nội viện kê tiêm TM ngay cả khi đẳng tích + sốc `SBP 85` (`HF-R2-07`). | Thận: Có đủ dải tới `<15` (cần liều cao hơn ở CKD nặng; CCĐ nếu vô niệu). Gan: Thận trọng hôn mê gan/xơ gan mất bù. | Thiếu tương tác độc tai cộng hợp với Aminoglycoside & ngộ độc Lithium của lợi tiểu quai (`HF-R2-08`). | Viên 40 mg, ống tiêm 20 mg/2 mL — `Lasix`, `Furosemid` (Đúng chuẩn VN). | Dẫn `loop_diuretics_chronic` (không có liều/thận/thai kỳ) thay vì Table S7 (`HF-R2-09`). | **FAIL** |
| 12 | `torsemide` | 10–20 mg/ngày. Thiếu `maxDose: "200 mg/ngày"` (ESC Table S7 — `HF-R2-16`). | **Thiếu dải thận `eGFR < 15`** (`renalBand` trả về `undefined` — `HF-R2-16`). Gan: Thận trọng xơ gan (chuyển hóa gan 80%). | Tương tự nhóm lợi tiểu quai (thiếu CCĐ vô niệu `anuria`, tương tác Lithium/NSAID/Aminoglycoside). | Viên 5, 10, 20 mg — `Demadex`, `Torsemed` (Đúng). | Dẫn `loop_diuretics_chronic` không chứa tên Torsemide (`HF-R2-09`). | **FAIL** |
| 13 | `bumetanide` | 0.5–1 mg → 1–5 mg/ngày. Thiếu `maxDose: "10 mg/ngày"` (ESC Table S7 & FDA §2 — `HF-R2-16`). | **Thiếu dải thận `eGFR < 15`** (`renalBand` trả về `undefined` — `HF-R2-16`). Gan: CCĐ trong hôn mê gan (FDA §4). | Thiếu `bumetanide` trong danh sách `drugIds` của `ix.triple_whammy` tại `renal_rasi.json`; thiếu tương tác Lithium & Aminoglycoside (`HF-R2-08`). | Viên 1 mg, ống 0.5 mg/2 mL — `Burinex` (rất hiếm tại VN, cần ghi chú — `HF-R2-21`). | Dẫn `loop_diuretics_chronic` thay vì `FDA_label_bumetanide.pdf` & Table S7 (`HF-R2-09`). | **FAIL** |
| 14 | `hydralazine` | 37.5 mg tid → 75 mg tid, `maxDose: "300 mg/ngày"` (Đúng ESC Table 11). **Không có bất kỳ rule nào trong `rules.ts` sử dụng** (`HF-R2-17`)! | Thận: Giảm tần suất q8–12h khi eGFR < 30. Gan: Thận trọng. | Đặt `pregnancy: "compatible"` chưa chuẩn (nên là `"caution"` theo FDA/ESC 2025 — `HF-R2-20`); lưu ý hội chứng giống lupus khi dùng kéo dài liều cao. | Viên 25, 50 mg — `Apresoline` đường uống rất khan hiếm tại VN (`HF-R2-21`). | **100% trích dẫn giả tạo**: dẫn `loop_diuretics_chronic` (0 chữ Hydralazine — `HF-R2-09`)! | **FAIL** |
| 15 | `isosorbide_dinitrate` | 20 mg tid → 40 mg tid, `maxDose: "120 mg/ngày"`. **Bị chèn nhầm liều uống ngoại trú vào y lệnh truyền TM cấp cứu** (`HF-R2-07`), thiếu rule ngoại trú H-ISDN (`HF-R2-17`). | **Thiếu dải thận `eGFR < 15`** (`renalBand` trả về `undefined` — `HF-R2-16`). | **Thiếu tương tác CCĐ tử vong với Sildenafil / Tadalafil / Vardenafil / Riociguat** (`HF-R2-08`)! | Viên 10, 20 mg, ngậm dưới lưỡi 5 mg, ống truyền 10 mg/10 mL — `Risordan`, `Isoket` (Đúng). | Dẫn `acute_vasodilators` cho cả liều uống, thận và thai kỳ (`HF-R2-09`). | **FAIL** |
| 16 | `ferric_carboxymaltose` | 500–1000 mg TM, `maxDose: "1000 mg/lần truyền (tối đa 1000 mg/tuần)"` (Đúng). Bị lỗi `30 * 3 = 90` làm sót Ferritin 90–99 (`HF-R2-04`) & nổ nhầm ở HFpEF (`HF-R2-03`). | Không cần chỉnh liều thận. | Cần gợi ý bảng liều theo cân nặng × Hb (hoãn khi `Hb > 15 g/dL`) và nhắc nguy cơ hạ phospho máu khi truyền lặp lại (`HF-R2-23`). | Lọ 500 mg/10 mL (50 mg sắt/mL) — `Ferinject` (Đúng chuẩn VN). | `renal`, `pregnancy`, `lactation` dẫn `iron_rec` không chứa thông tin tương ứng (`HF-R2-09`). | **FAIL** |
| 17 | `ferric_derisomaltose` | 1000 mg TM (tối đa 20 mg/kg), `maxDose: "20 mg/kg (thường tối đa 1000–1500 mg/lần)"` (Đúng). | Không cần chỉnh liều thận. | Tương tự `ferric_carboxymaltose` (ưu điểm truyền 1 lần liều cao, ít gây hạ phospho máu hơn FCM). | **Sai biệt dược VN**: ghi `Monoferric` (tên Mỹ), tại VN là **`Monofer`** (`HF-R2-21`). | `renal`, `pregnancy`, `lactation` dẫn `iron_rec` không chứa thông tin tương ứng (`HF-R2-09`). | **FAIL** |

---

### 3.2. 7 Thuốc Dùng Chéo Trong Module `hf` (`kb/drugs/*.json`)

| # | Drug ID | Đánh giá liều & tích hợp với Module `hf` | Các phát hiện cần khắc phục |
|---:|---|---|---|
| 1 | `dapagliflozin` | 10 mg od (Đúng chuẩn HFrEF/HFmrEF/HFpEF). Có `classes: ["sglt2i"]`. | `renal[1]` đặt khởi trị từ `eGFR ≥ 20` nhưng dẫn nguồn FDA (nhãn FDA Farxiga 06/2026 & ACC 2026 là `≥ 25`, còn `≥ 20` là ESC Table S9/KDIGO); thiếu lưu ý ngưng ≥ 3 ngày trước đại phẫu (`HF-R2-19`). |
| 2 | `empagliflozin` | 10 mg od (Đúng chuẩn HF). Ngưỡng khởi trị `eGFR ≥ 20` khớp cả ESC Table S9 và ACC 2026 Table 5. | **Thiếu `classes: ["sglt2i"]`** (`undefined` — `HF-R2-16`); `lactation` dẫn nhầm citation thận; thiếu lưu ý ngưng ≥ 3 ngày trước đại phẫu (`HF-R2-19`). |
| 3 | `finerenone` | Chỉ có viên 10, 20 mg & đích 20 mg của CKD-T2D. **Bị `hf.fmt.mra` ra lệnh ngừng để chuyển sang Spironolactone ở HFpEF (Ca C11)**! | **Thiếu viên 40 mg & bậc liều HFmrEF/HFpEF (10→20 mg khi eGFR 25–<60; 20→40 mg khi eGFR ≥ 60)** theo ESC 2026 Table 11 & FDA 09/2026 (`HF-R2-10`); **thiếu `classes: ["mra_nonsteroidal"]`** (`HF-R2-16`); ma trận HFpEF ghi sai Class IIb & cắt nhầm ở eGFR 30 thay vì 25 (`HF-R2-10`). |
| 4 | `enalapril` | 2.5 mg bid → 10–20 mg bid (Đúng ESC Table 11). | **Thiếu `classes: ["acei"]`** (`HF-R2-16`); khi có trong `currentMeds`, `hf.fmt.arni` bỏ lọt cổng washout 36h (`HF-R2-05`); `renal` dẫn nhầm citation liều HTN (`HF-R2-09`). |
| 5 | `valsartan` | KB đang để liều khởi đầu HTN `80 mg x 1 lần/ngày → 160–320 mg/ngày` (trong khi HFrEF theo ESC Table 11 là `40 mg x 2 lần/ngày → 160 mg x 2 lần/ngày`). | **Thiếu `classes: ["arb"]`** (`HF-R2-16`); khi kê thay thế ARNI/ACEi ở HFrEF cần lưu ý bậc liều suy tim `40 mg bid → 160 mg bid` thay vì `80 mg od`. |
| 6 | `semaglutide` | KB khai báo **Ozempic** (`0.25 → 0.5 → 1 mg/tuần`), mâu thuẫn với lý giải **2.4 mg/tuần** (Wegovy) trong `hf.comorbid.obesity_glp1`. | Bất tương xứng chế phẩm Ozempic vs Wegovy 2.4 mg & sai `loe: "A"` thay vì `"B"` theo ESC 2026 Rec Table 18 (`HF-R2-11`). |
| 7 | `tirzepatide` | KB dừng `target` ở `5 mg/tuần`, thiếu `maxDose`. | Cần mở bậc chuẩn độ tới **15 mg/tuần** (`maxDose: "15 mg/tuần"`) theo SUMMIT / ACC 2026 Table 4 / nhãn FDA Mounjaro (`HF-R2-11`). |

---

## 4. Kết Luận Cuối Cùng (Final Verdict)

Căn cứ `docs/REVIEW_PROTOCOL.md` (yêu cầu **PASS** chỉ đạt được khi `critical == 0` và `major == 0`), với **8 phát hiện Critical** và **9 phát hiện Major** đã được chứng minh bằng cả đối chiếu nguyên văn guideline/nhãn gốc lẫn thực nghiệm chạy engine:

> **KẾT LUẬN: FAIL**

### Điều kiện bắt buộc để đạt PASS ở Vòng 2:
1. Xóa triệt để toàn bộ các lỗi mượn chéo ngưỡng sinh lý làm liều thuốc/ferritin (`HF-R2-01`, `HF-R2-02`, `HF-R2-04`, `HF-R2-18`) và điền đủ `quantity` cho toàn bộ `kb/thresholds/hf.json` (`HF-R2-15`).
2. Nhận diện đầy đủ các hoạt chất cùng nhóm trong `currentMeds` cho MRA, Chẹn beta, ACEi/ARB (bắt buộc cổng nghỉ ≥ 36 giờ khi đang dùng ACEi), phân tầng chính xác HFrEF vs HFmrEF vs HFpEF theo LVEF (`HF-R2-02`, `HF-R2-03`, `HF-R2-05`).
3. Khắc phục an toàn thận, gan, huyết động nội viện và tương tác thuốc chống chỉ định (`HF-R2-06`, `HF-R2-07`, `HF-R2-08`, `HF-R2-12`, `HF-R2-13`, `HF-R2-14`, `HF-R2-16`).
4. Cập nhật đầy đủ Finerenone 20–40 mg (Class I HFpEF), Semaglutide/Tirzepatide (LOE B), luật ngoại trú H-ISDN, biệt dược/hàm lượng tại Việt Nam và ánh xạ lại toàn bộ `citationIds` đúng nguyên văn nhãn thuốc FDA/EMA & ESC 2026 (`HF-R2-09`, `HF-R2-10`, `HF-R2-11`, `HF-R2-17`, `HF-R2-21`).
