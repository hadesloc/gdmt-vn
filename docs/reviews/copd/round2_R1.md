# Báo Cáo Kiểm Định Độc Lập Vòng 2 – Module COPD (`copd`)
**Vai trò:** Reviewer R1 – Chuyên gia Hô hấp & Kiểm định Guideline Độc lập  
**Vòng duyệt:** Vòng 2 (Post-verification Vòng 1 + Kiểm định toàn diện từ đầu)  
**Nguồn đối chiếu chuẩn:**
1. **GOLD 2026 Report** (*Global Strategy for Prevention, Diagnosis and Management of COPD – 2026 Report*, `01_Noi_Khoa/Ho_Hap/GOLD_2026_Report.pdf`)
2. **Bộ Y tế Việt Nam – Quyết định 2131/QĐ-BYT (14/07/2026)** (*Hướng dẫn chẩn đoán và điều trị Bệnh phổi tắc nghẽn mạn tính*, `08_Bo_sung_ON_CALL/BYT_2131_COPD_2026.pdf`)
3. **Nhãn thuốc FDA** (`FDA_label_roflumilast.pdf` – Daliresp; `FDA_label_dupilumab.pdf` – Dupixent)

---

## 1. Tóm Tắt Phương Pháp & Phạm Vi Kiểm Định Vòng 2

1. **Kiểm tra tĩnh & QA tự động toàn kho tri thức:**
   - Chạy `npm run verify:kb`: Module `copd` đạt **0 lỗi / 0 cảnh báo** trên toàn bộ các cổng QA-1, QA-7, QA-8, QA-10.
   - Chạy `npx vitest run tests/modules/copd/invariants.test.ts`: **43/43 bài kiểm thử vượt qua** (40 golden cases `copd_01..copd_40` + 12.000 ca bất biến + 10.000 ca fail-closed).
2. **Đối chiếu nguyên văn PDF gốc (`docs/reviews/copd/scratch/round2_r1_pdf_audit.ts` & `round2_r1_verify.ts`):**
   - Mở và đối chiếu trực tiếp văn bản gốc từng trang PDF của **GOLD 2026** và **BYT QĐ 2131/2026** với toàn bộ **54 trích dẫn** (`kb/citations/copd.json`), **45 ngưỡng lâm sàng** (`kb/thresholds/copd.json`), **19 thuốc sở hữu + 3 thuốc cấp cứu dùng chung** (`kb/drugs/*.json`), 2 ma trận (`matrices.ts`), cây quyết định (`pathways.ts`), biểu mẫu nhập liệu (`inputs.ts` + `PatientForm.tsx`) và 2.368 dòng quy tắc (`src/modules/copd/rules.ts`).
   - Kết quả đối chiếu câu trích dẫn nguyên văn (`quote` + `pdfPage`): **54/54 trích dẫn khớp 100% nguyên văn trên đúng trang PDF** (0 trích dẫn bịa đặt hay sai lệch ngữ cảnh y khoa; có 24 mục lệch số trang in `printedPage` được ghi nhận ở mức `minor`).
3. **Thực thi động pipeline `evaluate()` thật (`docs/reviews/copd/scratch/round2_r1_verify.ts` & `round2_r1_full_audit.ts`):**
   - Kiểm chứng độc lập toàn bộ các ca lâm sàng trọng tâm của Vòng 1 và chạy thêm **2.000 ca mô phỏng đa chuyên khoa Hen – COPD (`selectedModules: ['copd', 'asthma']`) với đúng tên biến kiểm soát GINA thực tế**, cùng các ca biên về thuốc đang dùng (`currentMeds`), suy thận giai đoạn cuối (`eGFR < 10 mL/phút`) và thiếu dữ liệu sinh hiệu (`restingSpo2`, `fev1FvcRatio`, `age`).

---

## 2. Hậu Kiểm Toàn Bộ Kết Quả Sửa Đổi Sau Vòng 1 (Post-Verification)

| Nhóm vấn đề Vòng 1 (Mã tham chiếu) | Nội dung cốt lõi cần hậu kiểm | Trạng thái Vòng 2 | Đánh giá chi tiết của R1 |
|---|---|:---:|---|
| **1. Phân nhóm E theo GOLD 2026 & BYT 2131** (`COPD-R1-02`, `R2-04`, `R3-02`) | `≥ 1` đợt cấp mức độ vừa **hoặc** `≥ 1` đợt nhập viện xếp vào Nhóm E | **Một phần** (Còn lỗi ở `gold.ts`) | `src/modules/copd/rules.ts` (`copd.exacerbation_moderate_group_e = 1`), `inputs.ts`, `pathways.ts`, `COPD.md` đã sửa đúng. Tuy nhiên máy tính trung tâm `src/engine/calculators/gold.ts` vẫn giữ cứng `>= 2` đợt vừa và có lỗi `else if` giữa `CAT` và `mMRC` (**xem `COPD-R1V2-07`**). |
| **2. Cấm đơn trị ICS & Chống trùng lặp LAMA/LABA** (`R3-COPD-01`, `R3-04`, `R3-05`) | Ngừng ICS đơn trị ở COPD không hen; ngừng LAMA/LABA thừa khi nâng bậc | **Đã sửa tốt** (Đơn module) | `copd.safety.ics_monotherapy_stop`, `duplicate_lama_stop`, `duplicate_laba_stop`, `stop_superseded_inhaler` và `duplicates.ts` hoạt động chính xác khi chạy riêng module `copd`. |
| **3. Chồng lấp Hen – COPD (ACO) & Đa module `['copd', 'asthma']`** (`COPD-R1-12`, `R3-01`, `R3-16`) | Bắt buộc có nền ICS; không kê LABA/LAMA thiếu ICS; không kê trùng 2 ICS-LABA | **Còn lỗi nghiêm trọng** | Ở chế độ đơn module `['copd']` (`conditions.priorAsthma = true`), hệ thống kê Triple/thêm LAMA đúng. Nhưng khi đồng chọn `['copd', 'asthma']`, thiếu `age` làm kê **Tiotropium đơn độc không có ICS** (`critical` – **`COPD-R1V2-01`**), đồng thời BN đang dùng `Trelegy` bị tước mất LAMA và BN dùng `Seretide` ở GINA Bậc 4–5 bị trùng 2 ICS + 2 LABA (`major` – **`COPD-R1V2-02`**). |
| **4. Khí dung SABA ± SAMA & Steroid đợt cấp cấp cứu** (`COPD-R1-01`, `R2-11`, `R3-03`) | Bổ sung SABA ± SAMA khí dung đầu tay; cô lập khỏi BN nhập viện thường quy | **Còn lỗi tương tác `merge.ts`** | Đã cô lập tốt `acuteExacerbation === true` và tạo `copd.inpatient.short_acting_bronchodilators`. Tuy nhiên khi BN đã có sẵn `salbutamol` xịt cắt cơn hoặc `prednisolone` liều thấp trong `currentMeds`, `merge.ts` biến `START` thành `CONTINUE [2 nhát khi khó thở / 5 mg/ngày]`, xóa mất liều cấp cứu (**xem `COPD-R1V2-03`**). |
| **5. Lưu đồ theo dõi Khó thở vs Đợt cấp** (`COPD-R1-03`, `R1-06`, `R1-07`, `R2-12`) | Mono LAMA/LABA + đợt cấp → LABA+LAMA (`<300`) hoặc Triple (`≥300`); ICS+LABA → nâng Triple / chuyển LABA+LAMA; LABA+LAMA còn khó thở → đổi thiết bị/hoạt chất + PHCN | **Đã khắc phục triệt để** | Các luật `mono_exac_step_up_laba_lama`, `mono_exac_step_up_triple` (kèm `profileDiff` phân biệt sắc thái GOLD 2026 trang 66 vs BYT 2131 trang 15), `ics_laba_step_up_or_switch` và `dyspnea_on_laba_lama` hoạt động chuẩn xác. |
| **6. Liều bình hít bộ ba Breztri & Trimbow** (`COPD-R2-01`) | Sửa từ `1 nhát × 2` thành **`2 nhát × 2 lần/ngày`** | **Đã khắc phục triệt để** | Cả `budesonide_glycopyrronium_formoterol.json` và `beclometasone_glycopyrronium_formoterol.json` đều đã chuẩn hóa `amount: 2, unit: "nhát", frequency: "2 lần/ngày"`. |
| **7. An toàn Roflumilast** (`COPD-R2-02`, `R3-07`) | Hạ `START` → `CONSIDER`; chặn Child-Pugh B/C / bệnh gan, sụt cân, trầm cảm/tự sát, thai kỳ | **Còn thiếu trường UI** | Logic trong `rules.ts` và `roflumilast.json` đã tốt, **nhưng** `inputs.ts` và `PatientForm.tsx` quên tạo ô nhập liệu `depression` / `severeDepression`, khiến bác sĩ trên UI không thể bật cờ chặn tâm thần (**xem `COPD-R1V2-05`**). |
| **8. An toàn & Đối tượng Azithromycin** (`COPD-R2-03`, `R2-08`, `R3-06`, `R3-08`) | Hạ `START` → `CONSIDER`; chặn thuốc kéo dài QTc (`amiodarone`...), QTc dài, giảm thính lực, NTM; mở cho cả `'former'` và `'never'` smoker | **Còn thiếu cổng suy thận nặng** | Đã sửa tốt QTc, thính lực, NTM và tình trạng hút thuốc. Tuy nhiên còn bỏ sót chống chỉ định **"không dùng ở người suy thận nặng (`GFR < 10 mL/phút`)"** theo BYT QĐ 2131/2026 trang 15 (**xem `COPD-R1V2-06`**). |
| **9. Chỉ định Mepolizumab & Ma trận** (`COPD-R1-05`, `R2-06`, `R2-14`) | Mở cho cả có và không có viêm phế quản mạn (`BCAT ≥ 300`); bật profile `'VN'`; đưa vào `copdMatrixTherapy` | **Đã khắc phục triệt để** | Đã bỏ điều kiện chặn `!isChronicBronchitis`, thêm `'VN'` + `profileDiff` và bổ sung hàng `mepolizumab` trong `copdMatrixTherapy` (chỉ cần thêm lưu ý không phối hợp đồng thời 2 mAb ở mức `minor`). |
| **10. Tiêu chuẩn kháng sinh Anthonisen** (`COPD-R1-04`, `R1-10`, `R2-13`, `R3-11`) | Yêu cầu bắt buộc đờm mủ hoặc suy hô hấp toan hô hấp cấp cần thở máy (`pH ≤ 7.35 & PaCO₂ ≥ 45`); bổ sung phân tầng *Pseudomonas* theo BYT | **Đã khắc phục triệt để** | `copd.inpatient.antibiotics` chỉ kích hoạt khi `purulentSputum || (ph <= 7.35 && paco2 >= 45)` và có `profileDiff` phân tầng *P. aeruginosa* theo Bảng 3.4 BYT 2131/2026. |
| **11. Oxy đợt cấp (`88–92%`, cảnh báo `> 92%`) & NIV cấp (`pH ≤ 7.35 & PaCO₂ ≥ 45`)** (`COPD-R1-14`, `R3-10`) | Đích `SpO₂ 88–92%`, cảnh báo tránh thở oxy quá mức khi `SpO₂ > 92%`, NIV cấp chuẩn xác | **Còn vi phạm Fail-Closed ở Oxy** | Cảnh báo `avoid_hyperoxia` (`SpO₂ > 92%`) và `niv_bipap` hoạt động đúng. Tuy nhiên `controlled_oxygen` vẫn phát `START` khi `restingSpo2 === undefined` và khi tự thở khí phòng `SpO₂ = 91–92%` ngoại trú (**xem `COPD-R1V2-04`**). |
| **12. Oxy dài hạn LTOT & Home NIV** (`COPD-R1-09`, `R1-13`, `R3-13`) | LTOT chuẩn (`PaO₂ ≤ 55` / `SpO₂ ≤ 88%`) + mở rộng khi tâm phế mạn/đa hồng cầu (`PaO₂ ≤ 59` / `SpO₂ < 90%` [`≤ 89%`]); Home NIV khi tăng CO₂ mạn | **Còn thiếu kiểm tra phế dung kế** | Ngưỡng `SpO₂ ≤ 88%` và mở rộng `< 90%` (`89%`) khi có tâm phế mạn/đa hồng cầu đã đúng chuẩn GOLD 2026 (p. 76) & BYT 2131 (p. 16). Tuy nhiên `ltot_oxygen` chưa gọi `hasConfirmedCopdSpirometry(ctx)` nên phát `START` cả khi chưa nhập `fev1FvcRatio` (**xem `COPD-R1V2-04`**), và `home_niv` dùng `> 53` bỏ lọt biên `= 53 mmHg` của BYT (**xem `COPD-R1V2-09`**). |
| **13. Phân độ GOLD 1–4, Dự phòng VTE nội viện, Checklist xuất viện, Theophylline** (`COPD-R1-08`, `R1-11`, `R2-07`) | Bổ sung phân độ GOLD 1–4, LMWH nội viện, checklist xuất viện, cảnh báo không dùng Theophylline thường quy | **Đã khắc phục triệt để** | Cả 4 quy tắc mới hoạt động chính xác, đúng ngữ cảnh nội viện/ngoại trú và trích dẫn chuẩn. |
| **14. Dữ liệu biệt dược VN & Dạng dùng thuốc** (`COPD-R2-09`, `R2-10`) | Đính chính biệt dược chưa lưu hành đơn chất tại VN (`umeclidinium`, `aclidinium`, `vilanterol`) và dạng dùng `salmeterol` | **Còn sót trong `COPD.md`** | Các tệp JSON trong `kb/drugs/` đã cập nhật đầy đủ; riêng bảng tổng hợp trong `docs/modules/COPD.md` chưa đồng bộ lại (**xem `COPD-R1V2-10`**). |

---

## 3. Các Phát Hiện Kiểm Định Chi Tiết Trong Vòng 2

### 3.1. Mức Nghiêm Trọng Tối Khẩn (`CRITICAL` – 1 phát hiện)

#### `[COPD-R1V2-01]` Kê đơn LAMA đơn trị (`Tiotropium`) KHÔNG kèm ICS (hoặc thiếu LABA duy trì) khi đồng chọn đa module Hen – COPD (`['copd', 'asthma']`)
- **Phân loại:** `rule` | **Mục:** `copd.outpatient.aco_mandatory_ics` / `willAsthmaModulePrescribeIcsLaba` (`src/modules/copd/rules.ts` dòng 138–161)
- **Nội dung phát hiện:**
  Khi người dùng đồng chọn 2 module `['copd', 'asthma']` cho bệnh nhân chồng lấp Hen – COPD (ACO), hàm `willAsthmaModulePrescribeIcsLaba(ctx)` trong `src/modules/copd/rules.ts` có 2 lỗ hổng logic:
  1. Dòng 141 viết `if (age !== undefined && age < 12) return false;` — khi `age === undefined` (chưa nhập tuổi), hàm trả về **`true`** nếu đã trả lời 4 câu hỏi GINA! Ngược lại, `src/modules/asthma/rules.ts` (`isAdultOrAdolescent`) áp dụng fail-closed nghiêm ngặt (`age !== undefined && age >= 12`), nên chặn toàn bộ các luật kê ICS-LABA và chỉ sinh khuyến cáo `missing_input_age` (`CONSIDER`). Kết quả: module `copd` tưởng nhầm `asthma` đã kê ICS-LABA nên phát lệnh **`[START] Tiotropium` đơn độc mà không có bất kỳ thuốc ICS nào trong toàn bộ phác đồ**!
  2. Hàm không kiểm tra `currentTrack === 'track2'`. Khi bệnh nhân theo GINA Track 2 bậc 1–2, module `asthma` chỉ kê ICS đơn chất (`fluticasone_propionate`) + SABA khi cần (không có LABA), trong khi module `copd` ghi tiêu đề sai sự thật *"Phối hợp thêm LAMA (Tiotropium) trên nền ICS-formoterol"* và để bệnh nhân COPD Nhóm B/E nhiều triệu chứng thiếu hẳn thành phần LABA duy trì.
- **Bằng chứng đối chiếu:**
  - **GOLD 2026 Report** (PDF p. 76, trang in 65, Chapter 3): *"If patients with COPD have concomitant asthma they should be treated like patients with asthma. Under these circumstances the use of an ICS is mandatory."*
  - **BYT QĐ 2131/QĐ-BYT 2026** (PDF p. 23, trang in 13, Mục 2.3.1): Bệnh nhân có đặc điểm hen đồng mắc bắt buộc điều trị nền tảng có chứa ICS; không điều trị duy trì bằng thuốc giãn phế quản tác dụng dài đơn độc không kèm ICS.
  - **Đầu ra `evaluate()` thực tế (`round2_r1_verify.ts` kịch bản `[3C]`):**
    - Input: `age: undefined`, `selectedModules: ['copd', 'asthma']`, `fev1FvcRatio: 0.58, fev1PredPct: 55, mmrc: 2, cat: 15, moderateExacerbations: 1`, 4 câu GINA đã trả lời.
    - Output: `[copd] rec_copd_aco_add_lama: START: tiotropium` + `[asthma] missing_input_age: CONSIDER` (0 thuốc chứa ICS!). Trong mô phỏng 2.000 ca đa module (`round2_r1_full_audit.ts`), lỗi kê LAMA thiếu ICS xảy ra ở **241/2.000 ca (12.05%)**.
- **Đề xuất sửa chữa:**
  Trong `willAsthmaModulePrescribeIcsLaba(ctx)` (`src/modules/copd/rules.ts` dòng 138–161):
  1. Đổi thành fail-closed đồng bộ tuyệt đối với module `asthma`: `if (age === undefined || age < 12) return false;`.
  2. Kiểm tra `ci.currentTrack`: nếu `ci.currentTrack === 'track2'` ở bậc thấp chỉ kê ICS đơn chất, trả về `false` (hoặc điều phối để đảm bảo phác đồ cuối luôn đủ cả 3 thành phần ICS + LABA + LAMA ở bệnh nhân COPD Nhóm B/E đồng mắc hen).

---

### 3.2. Mức Nghiêm Trọng Lớn (`MAJOR` – 6 phát hiện)

#### `[COPD-R1V2-02]` Xung đột đa module `['copd', 'asthma']`: Tự động rút bỏ LAMA ở bệnh nhân đang dùng Triple (`Trelegy` → `Symbicort`) và kê trùng 2 ICS + 2 LABA ở bệnh nhân đang dùng `Seretide`
- **Phân loại:** `rule` | **Mục:** `copd.followup.aco_step_up_triple` & `findSupersededInhalerToStop` (`src/modules/copd/rules.ts` dòng 373–504)
- **Nội dung phát hiện:**
  1. **Tự động tước bỏ LAMA trên bệnh nhân COPD nặng đang dùng bộ ba thuốc (`Triple`):** Module `copd` hiện không phát hành khuyến cáo `CONTINUE` cho bệnh nhân đã ổn định trên `fluticasone_furoate_umeclidinium_vilanterol` (`Trelegy`), `budesonide_glycopyrronium_formoterol` (`Breztri`) hoặc `beclometasone_glycopyrronium_formoterol` (`Trimbow`). Khi đồng chọn module `asthma`, do `ICS_CONTAINING_DRUGS` của `asthma/rules.ts` (dòng 30–42) không chứa 3 thuốc Triple này, module `asthma` phát `START budesonide_formoterol` và `merge.ts` tự động sinh lệnh **`[SWITCH] CHUYỂN ĐỔI: Ngừng Trelegy Ellipta để thay bằng Budesonide / Formoterol`**, làm mất hoàn toàn thành phần LAMA của bệnh nhân GOLD 3–4 (kể cả khi bệnh nhân đang có đợt cấp tái phát!).
  2. **Kê chồng 2 bình hít chứa ICS + LABA (`Seretide` + `Symbicort`) khi GINA ở Bậc 4–5:** Khi bệnh nhân đang dùng `fluticasone_salmeterol` (`Seretide`) có đợt cấp ở `currentStep: 3`, module `asthma` phát hành `action: 'UPTITRATE', drugId: 'budesonide_formoterol'` (hành động `UPTITRATE` không kích hoạt cơ chế `SWITCH` của `merge.ts` vốn chỉ quét `action === 'START'`). Cùng lúc đó, `findSupersededInhalerToStop` của `copd` đặt `targetDrugId = 'tiotropium'` nên không phát lệnh `STOP` cho `Seretide`. Hệ quả là bệnh nhân dùng song song `Seretide` + `Symbicort` + `Tiotropium` (trùng 2 ICS và 2 LABA).
- **Bằng chứng đối chiếu:**
  - **GOLD 2026 Report** (PDF p. 76–77, trang in 65–66, Figure 3.11) & **GINA 2026** (Step 4–5): Không hạ bậc rút LAMA ở bệnh nhân COPD nặng / có đợt cấp đồng mắc hen; nghiêm cấm phối hợp 2 LABA hoặc 2 bình hít ICS+LABA.
  - **Đầu ra `evaluate()` thực tế (`round2_r1_verify.ts` kịch bản `[3D]`, `[3F]` & `round2_r1_full_audit.ts`):**
    - `[3F]`: BN GOLD 3 (`FEV₁ = 45%`) ổn định trên `Trelegy Ellipta` -> Output: `[SWITCH] Ngừng Trelegy Ellipta để thay bằng Budesonide / Formoterol` + `[START] budesonide_formoterol` (mất LAMA!).
    - `[3D]`: BN đang dùng `Seretide 250/50 mcg`, `currentStep: 3`, có 2 đợt cấp vừa -> Output: `[UPTITRATE] budesonide_formoterol` + `[START] tiotropium` (không có lệnh ngừng `Seretide`; tái hiện ở **546/2.000 ca trùng ≥2 LABA** và **653/2.000 ca trùng ≥2 ICS** trong mô phỏng đa module).
- **Đề xuất sửa chữa:**
  1. Bổ sung quy tắc duy trì (`CONTINUE`) cho bình hít Triple đang dùng hiệu quả trong `src/modules/copd/rules.ts` (hoặc nếu chuyển nền sang MART `budesonide_formoterol` khi đồng chọn `asthma` thì bắt buộc đồng thời `START tiotropium` để giữ đủ 3 thành phần ICS + LAMA + LABA).
  2. Trong `findSupersededInhalerToStop` (`src/modules/copd/rules.ts` dòng 473–495), khi `asthmaHandlesIcsLaba === true` và `targetDrugId === 'tiotropium'`, phát lệnh `STOP` tường minh cho mọi bình hít `ICS+LABA` cũ khác `budesonide_formoterol` (`fluticasone_salmeterol`, `fluticasone_furoate_vilanterol`, `beclometasone_formoterol`).

---

#### `[COPD-R1V2-03]` Mất y lệnh khí dung SABA ± SAMA cấp cứu và Prednisolone 40 mg × 5 ngày trong đợt cấp khi bệnh nhân đã có sẵn `salbutamol` / `prednisolone` trong `currentMeds`
- **Phân loại:** `rule` | **Mục:** `copd.inpatient.short_acting_bronchodilators` & `copd.inpatient.systemic_steroid` (`src/modules/copd/rules.ts` dòng 2031–2064, 2132–2162)
- **Nội dung phát hiện:**
  Đa số bệnh nhân COPD đã được quản lý ngoại trú đều có sẵn bình xịt cắt cơn `salbutamol` khi cần (`2 nhát khi khó thở`) trong danh sách thuốc đang dùng (`currentMeds`), và một số bệnh nhân đang dùng `prednisolone` liều thấp mạn tính (`5 mg/ngày`). Vì 2 quy tắc đợt cấp phát hành cứng `action: 'START'` với `drugId: 'salbutamol'` và `drugId: 'prednisolone'`, bước hợp nhất trong `src/engine/merge.ts` (dòng 509–519) thấy trùng `drugId` trong `currentMeds` nên **tự động đổi `START` thành `CONTINUE` và ghi đè trường `dose` bằng liều ngoại trú cũ**!
- **Bằng chứng đối chiếu:**
  - **GOLD 2026 Report** (PDF p. 114, trang in 103, Chapter 4) & **BYT QĐ 2131/QĐ-BYT 2026** (PDF p. 36–37, trang in 26–27, Mục 3.4.4): Trong đợt cấp COPD cần *"Tăng liều và/hoặc tần suất các thuốc giãn phế quản tác dụng ngắn đang sử dụng: ưu tiên thuốc cường beta 2 tác dụng ngắn (salbutamol 2,5-5mg phun khí dung... mỗi 4-6 giờ)"* và *"Prednisolon hoặc methylprednisolon đường toàn thân 40mg/ngày trong 5 ngày"*.
  - **Đầu ra `evaluate()` thực tế (`round2_r1_verify.ts` kịch bản `[3G]` & `round2_r1_full_audit.ts` kịch bản `[C2]`):**
    - Input: Đợt cấp nội viện suy hô hấp toan hô hấp cấp (`acuteExacerbation: true, restingSpo2: 86, abgPh: 7.32, abgPaco2: 52`) với `currentMeds: [{ drugId: 'salbutamol', dose: '2 nhát khi khó thở' }, { drugId: 'prednisolone', dose: '5 mg/ngày' }]`.
    - Output thực tế:
      - `[CONTINUE] TIẾP TỤC DUY TRÌ Salbutamol ± Ipratropium (SABA ± SAMA) [Liều hiện tại: 2 nhát khi khó thở]` (kèm lý giải *"không khởi trị lại từ đầu"*, mất hoàn toàn liều khí dung `2.5–5 mg mỗi 4–6 giờ`!).
      - `[CONTINUE] TIẾP TỤC DUY TRÌ Prednisolone / Methylprednisolone [Liều hiện tại: 5 mg/ngày]` (mất hoàn toàn liều `40 mg/ngày × 5 ngày`!).
- **Đề xuất sửa chữa:**
  Trong `copd.inpatient.short_acting_bronchodilators` và `copd.inpatient.systemic_steroid`, kiểm tra xem `'salbutamol'` / `'prednisolone'` đã tồn tại trong `ctx.normalized.currentMeds` hay chưa; nếu đã có, phát hành `action: 'UPTITRATE'` (thay vì `'START'`) để `merge.ts` giữ nguyên y lệnh tăng liều khí dung cấp cứu và liều tấn công steroid 40 mg × 5 ngày.

---

#### `[COPD-R1V2-04]` Vi phạm nguyên tắc Fail-Closed (QA-1 / QA-9) và chỉ định thừa `START` thở oxy ở `copd.inpatient.controlled_oxygen` & `copd.nonpharm.ltot_oxygen`
- **Phân loại:** `rule` | **Mục:** `copd.inpatient.controlled_oxygen` (`rules.ts` dòng 2067–2097) & `copd.nonpharm.ltot_oxygen` (`rules.ts` dòng 1939–1998)
- **Nội dung phát hiện:**
  1. **Thiếu `restingSpo2` vẫn phát lệnh `START` thở oxy (`controlled_oxygen`):** Điều kiện `when` tại dòng 2077 viết `return spo2 === undefined || spo2 <= thFor('restingSpo2', 'copd.oxygen_target_spo2_max');` với `setting: 'both'`. Khi chưa nhập `restingSpo2` (`undefined`), kể cả ở phòng khám ngoại trú, engine phát thẳng **`[START] Thở oxy có kiểm soát: Đích SpO₂ 88–92%`** thay vì yêu cầu đo SpO₂ (`CONSIDER`).
  2. **Tự thở khí phòng đạt `SpO₂ = 91–92%` vẫn bị phát lệnh `START` thở oxy:** Ngưỡng `copd.oxygen_target_spo2_max = 92%` là **cận trên của đích bão hòa oxy**, không phải ngưỡng chẩn đoán giảm oxy máu để bắt đầu thở oxy! Theo phân loại Rome (GOLD 2026), đợt cấp nhẹ tự thở khí phòng có `SaO₂ ≥ 92%` (hoặc COPD nền mạn tính đạt `88–92%` khí phòng) không có chỉ định bắt đầu thở oxy bổ sung (chỉ cần `MONITOR` theo dõi giữ đích `88–92%`).
  3. **Chưa có phế dung kế (`fev1FvcRatio === undefined`) vẫn phát lệnh `START` thở oxy dài hạn tại nhà LTOT (`ltot_oxygen`):** Tại dòng 1952–1953, `ltot_oxygen` chỉ chặn khi `fev1Fvc !== undefined && fev1Fvc >= 0.70` mà không gọi `hasConfirmedCopdSpirometry(ctx)`. Khi `fev1FvcRatio === undefined` và `restingSpo2 = 86%`, engine vừa báo thiếu phế dung kế nhưng vẫn phát thẳng `[START] Chỉ định Oxy trị liệu dài hạn tại nhà (LTOT) ≥ 15 giờ/ngày` cho bệnh nhân chưa được xác nhận chẩn đoán COPD.
- **Bằng chứng đối chiếu:**
  - **GOLD 2026 Report** (PDF p. 112, trang in 101, Chapter 4): *"When patients with a COPD exacerbation come to the ED, **if hypoxemic** they should be started on controlled oxygen therapy and titrated to a target saturation of 88-92%."* & Phân loại Rome (PDF p. 105, trang in 94, Figure 4.2): Đợt cấp nhẹ có *"Resting SaO2 ≥ 92% breathing ambient air"*.
  - **BYT QĐ 2131/QĐ-BYT 2026** (PDF p. 36, trang in 26, Mục 3.4.3 & 3.4.4): Đợt cấp nhẹ ngoại trú không chỉ định thở oxy.
  - **Đầu ra `evaluate()` thực tế:** Kịch bản `[3H]`, `[3I]`, `[3J-2]` trong `docs/reviews/copd/scratch/round2_r1_verify.ts`.
- **Đề xuất sửa chữa:**
  1. Tách `missing_input_restingSpo2` (`action: 'CONSIDER'`) khi `acuteExacerbation && spo2 === undefined`.
  2. Trong `controlled_oxygen`, chỉ phát `action: 'START'` khi giảm oxy máu (`spo2 < 88%` hoặc `pao2 < 60 mmHg`, hoặc `spo2 < 90%` nội viện) và phát `action: 'MONITOR'` khi `88% <= spo2 <= 92%` để hướng dẫn giữ đích bão hòa `88–92%`.
  3. Trong `copd.nonpharm.ltot_oxygen` (và `copd.outpatient.home_niv`), gọi `hasConfirmedCopdSpirometry(ctx)` để đảm bảo fail-closed khi chưa nhập phế dung kế.

---

#### `[COPD-R1V2-05]` Cổng an toàn chống chỉ định tâm thần (trầm cảm / ý nghĩ tự sát) của Roflumilast bị bỏ sót trên giao diện nhập liệu UI (`inputs.ts` & `PatientForm.tsx`)
- **Phân loại:** `ui` | **Mục:** `copd.safety.roflumilast_contraindicated` (`src/modules/copd/inputs.ts` & `src/modules/copd/rules.ts` dòng 305–312)
- **Nội dung phát hiện:**
  Sau Vòng 1, `getRoflumilastContraReasons(ctx)` trong `src/modules/copd/rules.ts` (dòng 305–312) đã được bổ sung kiểm tra `cond.depression`, `ci.severeDepression`, `ci.suicidalIdeation`. Tuy nhiên, kiểm tra toàn bộ mã nguồn UI (`src/ui/PatientForm.tsx` dòng 601–634 và `src/modules/copd/inputs.ts` dòng 120–169) cho thấy: `PatientForm.tsx` chỉ hiển thị 4 hộp kiểm toàn cục (`pregnant`, `priorAngioedema`, `ascvd`, `liverDisease`), còn `copd/inputs.ts` đã thêm `unexplainedWeightLoss`, `qtcProlonged`, `hearingImpairment`, `ntmInfection` nhưng **bỏ quên hoàn toàn trường nhập liệu trầm cảm / ý nghĩ tự sát**. Do đó, bác sĩ thao tác trên giao diện ứng dụng không có bất kỳ cách nào nhập tiền sử trầm cảm nặng để kích hoạt cổng chặn `AVOID`/`STOP` Roflumilast.
- **Bằng chứng đối chiếu:**
  - **GOLD 2026 Report** (PDF p. 77 & p. 162, trang in 66 & 151): *"Roflumilast should also be used with caution in patients with depression."*
  - **Nhãn FDA Daliresp** (`fda.copd.roflumilast_psychiatric_weight`, Section 5.1): Cảnh báo nguy cơ trầm cảm, lo âu và ý nghĩ/hành vi tự sát; cân nhắc kỹ rủi ro ở người có tiền sử trầm cảm/tự sát.
  - **Kiểm tra mã nguồn:** `docs/reviews/copd/scratch/round2_r1_full_audit.ts` (Mục A).
- **Đề xuất sửa chữa:**
  Bổ sung trường boolean `conditions.depression` (hoặc `customInputs.severeDepression`, `labelVi`: *"Trầm cảm nặng hoặc tiền sử ý nghĩ / hành vi tự sát"*) vào nhóm `copd_biomarker_phenotype` trong `src/modules/copd/inputs.ts`.

---

#### `[COPD-R1V2-06]` Bỏ sót chống chỉ định suy thận nặng (`GFR < 10 mL/phút`) đối với Azithromycin dự phòng dài hạn theo Quyết định 2131/QĐ-BYT 2026
- **Phân loại:** `drug` | **Mục:** `azithromycin` (`kb/drugs/azithromycin.json` dòng 34–44 & `src/modules/copd/rules.ts` dòng 320–341)
- **Nội dung phát hiện:**
  Hướng dẫn quốc gia của Bộ Y tế (QĐ 2131/QĐ-BYT 2026) quy định rõ **không dùng Azithromycin dự phòng đợt cấp ở người suy thận nặng (`GFR < 10 mL/phút`)**. Tuy nhiên trong `kb/drugs/azithromycin.json`, mảng `"renal"` chỉ khai báo một dải duy nhất từ `eGFRFrom: 15` trở lên (bỏ trống khoảng `< 15`), khiến `evaluateSafetyGates` trả về `renalBand === undefined` và cho phép thuốc đi qua. Đồng thời `getAzithromycinContraReasons(ctx)` trong `rules.ts` cũng không kiểm tra `eGFR`/`CrCl`.
- **Bằng chứng đối chiếu:**
  - **BYT QĐ 2131/QĐ-BYT 2026** (PDF p. 25, trang in 15, Mục 2.3.2b): *"Thêm macrolide: Azithromycin cho người từng hút thuốc... chống chỉ định khi QTc > 450ms, ngừng thuốc nếu kéo dài thêm khoảng QT hoặc QTc > 450ms, **không dùng ở người suy thận nặng (GFR<10ml/min)**."*
  - **Đầu ra `evaluate()` thực tế (`round2_r1_full_audit.ts` kịch bản `[C1]`):** Bệnh nhân nam 65 tuổi, `scr: 680 µmol/L` (`derived.egfr = 7.2 mL/min/1.73m² < 10`), `profile: 'VN'`, đang dùng Triple còn đợt cấp -> Engine vẫn xuất `[CONSIDER] rec_copd_azithromycin_prophylaxis` mà không có bất kỳ cảnh báo hay cổng chặn suy thận nào.
- **Đề xuất sửa chữa:**
  1. Bổ sung dải thận `eGFRTo: 10` (`initiate: "contra"`, `continue: "contra"`, đính kèm `byt.copd.2026.followup_roflumilast_azithro`) và dải thận trọng `eGFRFrom: 10, eGFRTo: 15` vào `kb/drugs/azithromycin.json`.
  2. Bổ sung kiểm tra `egfr < 10` (hoặc `crcl < 10`) vào `getAzithromycinContraReasons(ctx)` trong `src/modules/copd/rules.ts`.

---

#### `[COPD-R1V2-07]` Máy tính trung tâm `computeGold()` và `derivePatientData()` vẫn giữ ngưỡng cũ của GOLD 2023 (`≥ 2` đợt vừa) và có lỗi `else if` xếp nhầm `mMRC ≥ 2, CAT < 10` vào Nhóm A
- **Phân loại:** `rule` | **Mục:** `src/engine/calculators/gold.ts` (dòng 48, 100–128) & `src/engine/derive.ts` (dòng 103–135)
- **Nội dung phát hiện:**
  Khi module `copd` được cập nhật lên chuẩn GOLD 2026 ở Vòng 1, bộ máy tính nền tảng `src/engine/calculators/gold.ts` (được xuất trong Calculator Registry `src/engine/calculators/index.ts` và gọi trực tiếp bởi `derivePatientData`) bị bỏ sót không cập nhật và tồn tại 2 lỗi phân nhóm sai:
  1. Dòng 48 vẫn đặt `moderateExacerbationsThreshold: 2` (`"Nhóm A/B: 0 hoặc 1 đợt cấp vừa"` theo GOLD 2023 cũ), trái ngược hoàn toàn với GOLD 2026 & BYT 2131/2026 (`≥ 1` đợt cấp vừa là Nhóm E).
  2. Dòng 100–105 viết `if (input.cat !== undefined) { isHighSymptom = input.cat >= 10; } else if (input.mmrc !== undefined) { isHighSymptom = input.mmrc >= 2; }`. Do dùng `else if`, bất cứ khi nào bệnh nhân có `CAT < 10` nhưng `mMRC ≥ 2` (ví dụ `mMRC = 2, CAT = 8`), `computeGold` bỏ qua hoàn toàn `mMRC` và xếp bệnh nhân vào **Nhóm A** thay vì **Nhóm B**!
  3. Trong `src/engine/derive.ts` (dòng 109–135), khi thiếu tiền sử đợt cấp vẫn gán mặc định `?? 0` và vẫn xuất `derived.goldGrade`/`derived.goldGroup` ngay cả khi `fev1FvcRatio >= 0.70` (chưa đủ tiêu chuẩn chẩn đoán COPD).
- **Bằng chứng đối chiếu:**
  - **GOLD 2026 Report** (PDF p. 54, trang in 43, Figure 2.10) & **BYT QĐ 2131/QĐ-BYT 2026** (PDF p. 18, trang in 8, Bảng 1.4): Nhóm E khi có `≥ 1` đợt cấp vừa/nặng; Nhóm B khi `mMRC ≥ 2` **HOẶC** `CAT ≥ 10`.
  - **Đầu ra `evaluate()` thực tế (`round2_r1_verify.ts` kịch bản `[3A]` & `[3B]`):**
    - `[3A]` (`moderateExacerbations: 1, mmrc: 1, cat: 7`): `derived.goldGroup === 'A'` nhưng khuyến cáo điều trị là `rec_copd_init_group_e_laba_lama` (Nhóm E)!
    - `[3B]` (`mmrc: 2, cat: 8, moderateExacerbations: 0`): `derived.goldGroup === 'A'` nhưng khuyến cáo điều trị là `rec_copd_init_group_b` (Nhóm B)!
- **Đề xuất sửa chữa:**
  Trong `src/engine/calculators/gold.ts`: đổi `moderateExacerbationsThreshold: 1`, cập nhật chuỗi mô tả Nhóm A/B/E theo GOLD 2026, và sửa `isHighSymptom = (input.cat !== undefined && input.cat >= 10) || (input.mmrc !== undefined && input.mmrc >= 2);`. Trong `src/engine/derive.ts`, chỉ gán `goldGrade`/`goldGroup` khi `postBdrRatio !== undefined && postBdrRatio < 0.70` và không gán mặc định `?? 0` khi thiếu tiền sử đợt cấp.

---

### 3.3. Mức Độ Nhỏ (`MINOR` – 3 phát hiện)

#### `[COPD-R1V2-08]` Lệch số trang in (`printedPage` lùi 3 trang ở 24/54 trích dẫn GOLD 2026) và nhầm `Chapter 3` thay vì `Appendix 3` ở trang PDF 161, 163
- **Phân loại:** `citation` | **Mục:** `kb/citations/copd.json` & `src/modules/copd/rules.ts`
- **Nội dung & Bằng chứng:**
  - Tất cả **54/54** trích dẫn đều khớp nguyên văn 100% trên đúng `pdfPage`. Tuy nhiên trên header của `GOLD_2026_Report.pdf`, số trang in thực tế tuân theo công thức `printedPage = pdfPage - 11` (ví dụ `pdfPage = 54` có trang in `"43"`, `pdfPage = 75` → `"64"`, `pdfPage = 77` → `"66"`, `pdfPage = 161` → `"150"`, `pdfPage = 163` → `"152"`). 6 trích dẫn mới thêm ở Vòng 1 đã ghi đúng `pdfPage - 11`, trong khi 24 trích dẫn ban đầu ghi `pdfPage - 14` (`"40"`, `"61"`, `"63"`, `"147"`, `"149"`...).
  - Bốn trích dẫn ở `pdfPage: 161` và `163` (`followup_exac_eos_100_300`, `followup_eos_less_100_pneumonia`, `azithromycin_dose_warnings`, `azithromycin_safety`) ghi `locator: "Chapter 3 / ..."` nhưng thực tế nằm trong **Appendix 3 (Overview of the evidence: Pharmacotherapy)**. Trong `rules.ts`, dòng 901 ghi `"GOLD 2026 (trang 64)"` (trang in) trong khi dòng 1794 ghi `"GOLD 2026 (trang 77)"` và dòng 1877 ghi `"GOLD 2026 (trang 89)"` (trang PDF).
- **Đề xuất sửa chữa:** Đồng bộ `printedPage = String(pdfPage - 11)` cho 24 trích dẫn GOLD 2026, sửa `locator` trang PDF 157–163 sang `"Appendix 3"`, và thống nhất cách ghi trang trong `rules.ts`.

---

#### `[COPD-R1V2-09]` Sắc thái ngưỡng biên `PaCO₂ ≥ 53 mmHg` của Home NIV theo BYT 2131/2026, lưu ý không phối hợp đồng thời 2 thuốc sinh học (`Dupilumab` + `Mepolizumab`), và ưu tiên tiền sử nhập viện của Roflumilast
- **Phân loại:** `rule` | **Mục:** `copd.outpatient.home_niv`, `dupilumab_indication`, `mepolizumab_indication`, `roflumilast_indication`
- **Nội dung & Bằng chứng:**
  1. **Home NIV:** BYT QĐ 2131/QĐ-BYT 2026 (PDF p. 27, trang in 17, Mục 2.6b) quy định *"tăng CO₂ máu ban ngày (`PaCO₂ ≥ 53 mmHg`) và tiền sử nhập viện gần đây"*, trong khi `rules.ts` dòng 1865 dùng `paco2 > 53` nên bỏ lọt đúng giá trị biên `PaCO₂ = 53 mmHg` ở profile `VN` và chưa đính kèm trích dẫn BYT trang 17.
  2. **Hai thuốc sinh học đồng xuất hiện:** Khi `BCAT ≥ 300 /µL` kèm viêm phế quản mạn trên nền Triple còn đợt cấp, cả `rec_copd_dupilumab` (`CONSIDER`) và `rec_copd_mepolizumab` (`CONSIDER`) cùng xuất hiện nhưng văn bản `rationale` chưa nhắc rõ bác sĩ **chỉ chọn đơn trị MỘT trong hai kháng thể đơn dòng** (*"dupilumab ... or mepolizumab"*, GOLD 2026 PDF p. 77 / trang in 66).
  3. **Roflumilast:** GOLD 2026 (PDF p. 77, trang in 66) và BYT 2131 (PDF p. 25, trang in 15) nhấn mạnh nhóm hưởng lợi rõ nhất là có tiền sử nhập viện vì đợt cấp trong năm trước; nên nêu rõ điểm này trong `rationale`.
- **Đề xuất sửa chữa:** Bổ sung trích dẫn BYT 2131 trang 17 và hỗ trợ `paco2 >= 53` cho profile `VN` ở `home_niv`; thêm câu cảnh báo không phối hợp đồng thời 2 thuốc sinh học vào `rationale` của `Dupilumab`/`Mepolizumab`; nhấn mạnh vai trò tiền sử nhập viện ở `roflumilast_indication`.

---

#### `[COPD-R1V2-10]` Chưa đồng bộ bảng biệt dược tại VN trong `docs/modules/COPD.md` và sai tên biến kiểm soát hen GINA trong `tests/modules/copd/invariants.test.ts`
- **Phân loại:** `ui` | **Mục:** `docs/modules/COPD.md` (dòng 66, 68, 72, 103) & `tests/modules/copd/invariants.test.ts` (dòng 217–223)
- **Nội dung & Bằng chứng:**
  1. Bảng 19 thuốc trong `docs/modules/COPD.md` (dòng 66, 68, 72) vẫn ghi `Incruse Ellipta`, `Eklira Genuair`, `Ellipta` là "Tên biệt dược tại VN" dù `kb/drugs/*.json` đã sửa thành *"Chưa lưu hành đơn chất tại VN"*, và mục `inputs.ts` trong `COPD.md` chưa cập nhật lựa chọn `'ics_laba'` cùng các cờ an toàn mới.
  2. Trong `tests/modules/copd/invariants.test.ts` (dòng 217–223), bộ sinh ca ngẫu nhiên truyền `symptomDaysPerWeek`, `nightWakingPerMonth`, `sabaUsePerWeek`, `asthmaTrack` (không tồn tại trong `src/modules/asthma/inputs.ts`) thay vì `daytimeSymptomsMoreThanTwiceWeek`, `nightWakingDueToAsthma`, `relieverNeededMoreThanTwiceWeek`, `activityLimitationDueToAsthma`, `currentTrack`, làm các luật ngoại trú của `asthma` không bao giờ kích hoạt trong 12.000 ca fuzzing và bỏ lọt các lỗi đa module `COPD-R1V2-01` & `COPD-R1V2-02`.
- **Đề xuất sửa chữa:** Đồng bộ lại `docs/modules/COPD.md` khớp với `kb/drugs/*.json` và `inputs.ts`; sửa đúng tên các trường GINA trong `tests/modules/copd/invariants.test.ts` và bổ sung bất biến kiểm tra luôn có ICS khi đồng mắc Hen – COPD.

---

## 4. Tổng Hợp Thống Kê & Kết Luận Vòng 2

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã phát hiện |
|---|:---:|---|
| **`critical`** | **1** | `COPD-R1V2-01` |
| **`major`** | **6** | `COPD-R1V2-02`, `COPD-R1V2-03`, `COPD-R1V2-04`, `COPD-R1V2-05`, `COPD-R1V2-06`, `COPD-R1V2-07` |
| **`minor`** | **3** | `COPD-R1V2-08`, `COPD-R1V2-09`, `COPD-R1V2-10` |
| **`suggestion`** | **0** | — |
| **Tổng cộng** | **10** | — |

**Đánh giá chung của Chuyên gia R1:**  
Đợt chỉnh sửa sau Vòng 1 đã giải quyết rất tốt phần lớn các quy tắc điều trị COPD đơn chuyên khoa (phân nhóm E `≥ 1` đợt cấp vừa trong `rules.ts`, cấm ICS đơn trị, lưu đồ nâng bậc từ đơn trị LAMA/LABA và từ ICS+LABA, chuẩn hóa liều Breztri/Trimbow `2 nhát × 2 lần/ngày`, mở khóa Mepolizumab không phụ thuộc viêm phế quản mạn, tiêu chuẩn kháng sinh Anthonisen, cảnh báo tăng oxy quá mức `SpO₂ > 92%`, LTOT mở rộng khi tâm phế mạn/đa hồng cầu và cô lập quy tắc đợt cấp khỏi bệnh nhân nhập viện thường quy). Tuy nhiên, qua kiểm thử động đa chuyên khoa và đối chiếu sát từng dòng mã nguồn – UI – PDF gốc ở Vòng 2, vẫn còn **1 lỗi `critical`** (kê đơn LAMA đơn trị thiếu ICS khi đồng chọn module Hen – COPD mà thiếu tuổi) và **6 lỗi `major`** (xung đột tước LAMA / trùng 2 ICS-LABA khi đồng chọn module Hen; `merge.ts` ghi đè mất liều khí dung SABA và steroid đợt cấp khi thuốc có sẵn trong `currentMeds`; vi phạm fail-closed `START` ở quy tắc oxy; thiếu ô nhập trầm cảm trên UI cho cổng chặn Roflumilast; thiếu cổng chặn `GFR < 10 mL/phút` của Azithromycin theo BYT 2131/2026; và máy tính `gold.ts` chưa cập nhật lên GOLD 2026).

**KẾT LUẬN CUỐI CÙNG: FAIL**
