# Báo cáo Kiểm định Độc lập Vòng 2 — Vai R2 (Dược lâm sàng) — Module Đái tháo đường típ 2 (`dm2`)

- **Module kiểm định**: `dm2` (`src/modules/dm2/**`, 22 tệp `DrugEntry` thuộc quyền sở hữu của Agent F tại `kb/drugs/*.json` + 3 SGLT2i dùng chung, `kb/thresholds/dm2.json`, `kb/citations/dm2.json`, `kb/interactions/diabetes_respiratory.json`, và các cổng an toàn dùng chung `src/engine/safety/**`)
- **Vai trò**: **R2 – Dược sĩ Lâm sàng Độc lập (Vòng 2)** (tuân thủ tuyệt đối `docs/REVIEW_PROTOCOL.md`: kiểm định độc lập 100%, không đọc bất kỳ báo cáo Vòng 2 nào của R1/R3, không chỉnh sửa mã nguồn hay KB chính thức)
- **Nguồn đối chiếu nguyên bản đã mở kiểm chứng trực tiếp qua `tools/kb/quoteSearch.ts`**:
  - Nhãn gốc FDA / EMA (`Medical_Library_2026/09_Nhan_Thuoc/`): `FDA_label_metformin.pdf`, `FDA_label_sitagliptin.pdf`, `FDA_label_saxagliptin.pdf`, `vildagliptin_Galvus_EMA_SmPC.pdf`, `FDA_label_semaglutide_ozempic.pdf`, `FDA_label_semaglutide_rybelsus.pdf`, `FDA_label_tirzepatide.pdf`, `FDA_label_pioglitazone.pdf`, `FDA_label_glimepiride.pdf`, `FDA_label_acarbose.pdf`
  - Hướng dẫn điều trị (`Medical_Library_2026/01_Noi_Khoa/Dai_Thao_Duong/`): `ADA_2026_SOC_9_Pharmacologic_Approaches_to_Glycemic_Treatment.pdf`, `ADA_2026_SOC_11_Chronic_Kidney_Disease_and_Risk_Management.pdf`, `ADA_2026_SOC_13_Older_Adults.pdf`, `ADA_2026_SOC_15_Management_of_Diabetes_in_Pregnancy.pdf`, `ADA_2026_SOC_16_Diabetes_Care_in_the_Hospital.pdf`, `KDIGO_2022_Diabetes_Management_in_CKD.pdf`, `BYT_2020_5481_Chan_doan_Dieu_tri_DTD_tip2.pdf`, `BYT_2021_1353_Huong_dan_Su_dung_Insulin.pdf`
- **Kiểm chứng thực thi tự động (`vitest` & kịch bản `tsx` chạy `evaluate()` thật)**:
  - `npx vitest run tests/modules/dm2/invariants.test.ts` → **PASS** (17.500 ca lâm sàng ngẫu nhiên & kiểm thử fail-closed QA-1, 0 vi phạm)
  - `npx vitest run tests/golden/_runner.test.ts -t "dm2"` → **PASS** (94/94 ca chuẩn vàng DM2)
  - Kịch bản kiểm định R2 Vòng 2 tại `docs/reviews/dm2/scratch/`:
    - `round2_r2_audit.ts`: Kiểm tra schema 22 `DrugEntry` (`validateDrugEntry`), quét `scanModulesLint` trên toàn bộ 7 tệp mã nguồn `dm2` (0 lỗi, 0 cảnh báo), kết xuất toàn bộ 154 ô (22×7) của `dm2MatrixEgfr()` và 54 ô (9×6) của `dm2MatrixComorbidity()`.
    - `round2_r2_scenarios.ts` & `round2_r2_final_verify.ts`: Chạy trực tiếp đường ống `evaluate()` trên 35+ bệnh cảnh dược lâm sàng thực tế (dải eGFR biên 11.4 / 13.8 / 15.7 / 18.2 / 25.1 / 36.6 / 52.5 / 89.0, thuốc cản quang iod, đa thuốc DPP-4i/GLP-1/SU/Insulin, suy gan ALT > 3× ULN, MTC/MEN2, thai kỳ, DKA/HHS với K+ < 3.3, NPO + Corticoid nội viện, chu phẫu SGLT2i, người cao tuổi suy yếu).

---

## Phần 1. Hậu kiểm 100% các Finding Vòng 1 của R2 (16/16 ĐÃ KHẮC PHỤC)

Toàn bộ 16 phát hiện dược lâm sàng từ báo cáo Vòng 1 (`docs/reviews/dm2/round1_R2.md`) và mục đồng bộ liên module Suy tim (`hf`) đã được đối chiếu lại trên mã nguồn, KB và kết quả chạy `evaluate()` thực tế:

| Mã Vòng 1 | Nội dung cốt lõi | Trạng thái Vòng 2 | Bằng chứng hậu kiểm cụ thể |
|---|---|---|---|
| **DM2-R2-01** | `gliclazide`, `glimepiride`, `acarbose` thiếu chặn `contra` / `STOP` khi `eGFR < 30` | **ĐÃ SỬA ĐÚNG** | Cả 3 tệp JSON đã đặt `initiate: "contra", continue: "contra"` ở dải `[0, 30]`; `severeRenalStopRules` (`rules.outpatient.ts` dòng 379–423) phát `STOP` đích danh từng thuốc ở cả nội/ngoại trú; `reviewCurrentMedications` cũng phát `STOP` khi chỉ chọn module `htn` (Kịch bản 2A, 2B). |
| **DM2-R2-02** | Khởi trị mới `semaglutide` / GLP-1 RA chưa chặn ở `eGFR < 15` hoặc lọc máu | **ĐÃ SỬA ĐÚNG** | `cardiorenal_glp1` fail-closed khi thiếu `egfr`, phát `AVOID` khi chưa dùng GLP-1 RA mà `egfr < 15` (`dm2.glp1.egfr_min`), và cho phép `CONTINUE` theo dõi dịch nếu đang dùng sẵn (Kịch bản 4A, 4B, 4C). |
| **DM2-R2-03** | Nhóm GLP-1 RA / GIP-GLP-1 RA thiếu Boxed Warning MTC & MEN 2 | **ĐÃ SỬA ĐÚNG** | Đã thêm `mtc`, `men2` vào cả 5 tệp Incretin (`semaglutide`, `semaglutide_oral`, `dulaglutide`, `liraglutide`, `tirzepatide`), công tắc `historyMtcOrMen2` trong `inputs.ts`, chặn `AVOID` khi khởi mới và `mtcMen2StopRules` phát `STOP` khẩn cấp khi đang dùng. |
| **DM2-R2-04** | Phác đồ truyền tĩnh mạch DKA/HHS chưa gắn `drugId: "insulin_regular"` | **ĐÃ SỬA ĐÚNG** | Đã tạo mới `kb/drugs/insulin_regular.json` (Actrapid / Humulin R 100 U/mL, IV/SC, cổng `K+ < 3.5`), gắn vào toàn bộ nhánh `dka_hhs_emergency`: `HOLD` khi `K+ = 3.1`, `START` `0.1 U/kg/giờ` cho DKA / euDKA, `START` `0.05 U/kg/giờ` cho HHS thuần túy (Kịch bản 5A–5D). |
| **DM2-R2-05** | Tiêu chuẩn thoát HHS nội viện dùng nhầm tiêu chuẩn toan DKA | **ĐÃ SỬA ĐÚNG** | Nhánh `isHhsPure` (`rules.inpatient.ts` dòng 282–296) đã tách riêng tiêu chuẩn ADA: áp lực thẩm thấu hữu hiệu `< 300 mOsm/kg`, glucose `< 13.9 mmol/L (250 mg/dL)`, tiểu `> 0.5 mL/kg/giờ`, tỉnh táo thần kinh (`ada.dm2.2024.hhs_resolution`). |
| **DM2-R2-06** | Ma trận thận `dm2MatrixEgfr` thiếu 10/22 thuốc và bị `no_data` ở G1–G3a | **ĐÃ SỬA ĐÚNG** | `DM2_MATRIX_DRUG_IDS` (`matrix.ts` dòng 17–40) đủ 22/22 thuốc sở hữu; kiểm tra tự động toàn bộ 154 ô (22×7) cho kết quả **0 ô `no_data`** (xem lưu ý hiển thị liều duy trì Incretin ở `DM2-R2-R2-06`). |
| **DM2-R2-07** | Basal-Bolus nội viện gộp chung 2 thuốc trên 1 thẻ `insulin_glargine` | **ĐÃ SỬA ĐÚNG** | Đã tách thành `basal_bolus_regimen` (`insulin_glargine`) và `prandial_bolus_regimen` (`insulin_aspart`, tự chuyển `HOLD` khi NPO — xem tinh chỉnh nhỏ `DM2-R2-R2-08`). |
| **DM2-R2-08** | Tạm ngừng SGLT2i chu phẫu chỉ chạy nội viện và gắn cứng `dapagliflozin` | **ĐÃ SỬA ĐÚNG** | `perioperativeSglt2iHoldRules` (`rules.inpatient.ts` dòng 521–572) chạy `setting: 'both'`, sinh riêng cho `dapagliflozin`, `empagliflozin` (ngừng ≥ 3 ngày), `canagliflozin` (ngừng ≥ 4 ngày theo nhãn FDA). |
| **DM2-R2-09** | Xuống thang người cao tuổi không chỉ đích danh thuốc/liều và vẫn gạ thêm GLP-1/SGLT2i | **ĐÃ SỬA ĐÚNG** | `deintensification` + `deintensification_insulin_companion` phát `REDUCE` đích danh `gliclazide` (-50% xuống 30 mg hoặc ngừng) và `insulin_glargine` (-20% từ 25 U xuống ~20 U), đồng thời `DEFER` SGLT2i/GLP-1 RA ở nhóm `very_complex` (Kịch bản 6B). |
| **DM2-R2-10** | 21/21 thuốc thiếu metadata thai kỳ/cho con bú & thiếu luật `STOP` thuốc viên thai kỳ | **ĐÃ SỬA ĐÚNG** | Đủ 22/22 tệp JSON có `pregnancy` & `lactation`; `pregnancyStopRules` phát `STOP` ngay lập tức cho toàn bộ 17 thuốc ngoài insulin và `pregnancy_insulin` phát `START` `insulin_glargine` (Kịch bản 6A). |
| **DM2-R2-11** | `vildagliptin` thiếu chống chỉ định suy gan / `ALT, AST > 3× ULN` | **ĐÃ SỬA ĐÚNG** | Đã cập nhật `vildagliptin.json`, ngưỡng `dm2.vildagliptin.alt_uln_max = 3`, input `altUlnTimes` và luật `vildagliptin_hepatic_stop` (`STOP` khi có bệnh gan hoặc `altUlnTimes > 3`, Kịch bản 3F; xem lưu ý liên chuyên khoa ngoài DM2 tại `DM2-R2-R2-07`). |
| **DM2-R2-12** | `insulin_glargine.json` thiếu cảnh báo không quy đổi 1:1 giữa U-100 và U-300 | **ĐÃ SỬA ĐÚNG** | Đã bổ sung cảnh báo hạ liều 20% khi chuyển Toujeo U-300 sang Lantus U-100 vào `insulin_glargine.json` kèm trích dẫn `byt.insulin.2021.glargine_u300_switch`. |
| **DM2-R2-13** | `insulin_premix.json` ghi thời điểm tiêm đồng nhất "ngay trước ăn" cho cả Mixtard 30 | **ĐÃ SỬA ĐÚNG** | `dosing.start.note` và `titration` trong `insulin_premix.json` đã tách rõ Mixtard 30 tiêm trước ăn 30 phút và Novomix/Humalog Mix tiêm 0–15 phút trước ăn (`byt.insulin.2021.premix_timing`). |
| **DM2-R2-14** | Mục tiêu glucose nội viện chưa phân tầng ICU vs khoa thường | **ĐÃ SỬA ĐÚNG** | `inpatient_glycemic_target` phân nhánh rõ ICU `7.8 – 10.0 mmol/L (140–180 mg/dL)` vs khoa thường `5.6 – 10.0 mmol/L (100–180 mg/dL)` theo ADA 2026 Ch. 16. |
| **DM2-R2-15** | `dulaglutide` và `tirzepatide` thiếu ghi chú tình trạng lưu hành thực tế tại Việt Nam | **ĐÃ SỬA ĐÚNG** | Đã cập nhật ghi chú khan hiếm / chưa phân phối thương mại rộng rãi tại VN trên `dulaglutide.json` và `tirzepatide.json`. |
| **DM2-R2-16** | Trần `maxDose` của `semaglutide` (1.0 mg) và `tirzepatide` (10 mg) thấp hơn nhãn gốc | **ĐÃ SỬA ĐÚNG** | `semaglutide.json` đã nâng `maxDose` lên `"2.0 mg x 1 lần/tuần (Ozempic ĐTĐ2) / 2.4 mg x 1 lần/tuần (Wegovy béo phì)"`; `tirzepatide.json` nâng `maxDose` lên `"15 mg x 1 lần/tuần"`. |
| **HF-CROSS** | Đồng bộ dừng kép `pioglitazone` và `saxagliptin` khi suy tim | **ĐÃ SỬA ĐÚNG** | Hai luật độc lập `pioglitazone_hf` và `saxagliptin_hf` cùng phát 2 lệnh `STOP` song song khi bệnh nhân suy tim đang dùng cả hai thuốc (Kịch bản 6C). |

---

## Phần 2. Bảng Kiểm định Toàn diện 22 Dược điển (`DrugEntry`) thuộc Sở hữu `dm2`

Tất cả 22 tệp JSON vượt qua bộ kiểm định cấu trúc `validateDrugEntry` (`0` lỗi cú pháp, đủ `pregnancy`/`lactation`/`citationIds`). Kết quả đối chiếu dược lâm sàng chi tiết:

| # | `drugId` | Liều khởi đầu / Đích / Tối đa | Chỉnh liều Thận (`renalAdjustment`) & Gan | Chống chỉ định & Cảnh báo Hộp đen | Tương tác & Biệt dược VN | Đánh giá Vòng 2 |
|---|---|---|---|---|---|---|
| 1 | `metformin` | 500 mg / 1000 mg × 2 / 2000 mg/ngày | `<30`: `contra/contra`; `30–45`: `avoid/caution` tối đa 1000 mg/ngày; `≥45`: `ok/ok`. Gan nặng: `contra` | Suy thận eGFR <30, toan chuyển hóa/DKA, suy gan/tim mất bù | Đủ Glucophage/XR, Panfor. **Lỗi `CRITICAL` (`DM2-R2-R2-01`)**: Luật ngoại trú vẫn `CONTINUE`/`START` khi `contrastPlanned: true` ở eGFR 30–60! | **Cần sửa luật cản quang & liều `REDUCE` (`DM2-R2-R2-01`, `03`)** |
| 2 | `gliclazide` | 30 mg MR / 60 mg / 120 mg/ngày | `<30`: `contra/contra`; `30–60`: `caution` tối đa 60 mg/ngày | ĐTĐ1, DKA, suy thận/gan nặng, miconazole | Diamicron MR 30/60, Predian. **Lỗi `MAJOR` (`DM2-R2-R2-03`)**: Đang uống 120 mg ở eGFR 30–59 chưa có lệnh `REDUCE` về ≤60 mg | **Cần bổ sung `REDUCE` thận & chuẩn hóa `classes` (`su`)** |
| 3 | `glimepiride` | 1 mg / 2–4 mg / 6 mg/ngày | `<30`: `contra/contra`; `30–60`: khởi 1 mg | ĐTĐ1, DKA, suy thận/gan nặng, dị ứng sulfonamid | Amaryl 1/2/4 mg. Đã chặn `STOP` đúng ở eGFR <30 | **Đạt** (bổ sung `'su'` vào `classes`) |
| 4 | `acarbose` | 25 mg / 50 mg × 3 / 300 mg/ngày | `<30`: `contra/contra`; `≥30`: `ok` | Tắc ruột, viêm loét đại tràng, xơ gan, eGFR <30 | Glucobay 50/100 mg. Lưu ý tránh dùng đường mía khi hạ ĐH | **Đạt** (bổ sung `'ag_inhibitor'` vào `classes`) |
| 5 | `pioglitazone` | 15 mg / 30 mg / 45 mg/ngày | Không chỉnh liều thận (`[0,15]` thiếu chuỗi `maxDose` trên ma trận) | Boxed Warning Suy tim NYHA I–IV (`heart_failure`), K bàng quang, ALT >2.5× ULN | Actos, Pionorm 15/30 mg | **Nhỏ (`DM2-R2-R2-06`)**: Điền `maxDose` cho cột G5/Dialysis |
| 6 | `sitagliptin` | 100 mg / 100 mg / 100 mg/ngày | `<30` & lọc máu: 25 mg/ngày; `30–45`: 50 mg/ngày; `≥45`: 100 mg/ngày | Quá mẫn nặng, viêm tụy cấp | Januvia 50/100 mg. **Lỗi `MAJOR` (`DM2-R2-R2-03`)**: Đang uống 100 mg ở eGFR <45 / <30 không phát lệnh `REDUCE`! | **Cần bổ sung luật `REDUCE` liều thận** |
| 7 | `linagliptin` | 5 mg / 5 mg / 5 mg/ngày | `0–999` + lọc máu: 5 mg/ngày (thải qua mật >80%) | Quá mẫn, viêm tụy cấp | Trajenta 5 mg. An toàn suốt dải CKD G1–G5D | **Đạt xuất sắc** (cần gọi tên ở CKD G5 `DM2-R2-R2-05`) |
| 8 | `vildagliptin` | 50 mg / 50 mg × 2 / 100 mg/ngày | `<50` & lọc máu: 50 mg × 1/ngày; Gan / ALT >3× ULN: `contra` | `severe_hepatic_impairment`, viêm tụy cấp | Galvus 50 mg. **Lỗi `MAJOR` (`DM2-R2-R2-03`)**: Đang uống 50 mg × 2 ở eGFR <50 không phát lệnh `REDUCE`! | **Cần bổ sung `REDUCE` thận & quét gan liên module (`DM2-R2-R2-07`)** |
| 9 | `saxagliptin` | 5 mg / 5 mg / 5 mg/ngày | `≤45` & lọc máu: 2.5 mg/ngày | Quá mẫn, tiền sử suy tim (`heart_failure` — SAVOR-TIMI 53) | Onglyza 2.5/5 mg. **2 lỗi `MAJOR` (`DM2-R2-R2-03`, `04`)**: Thiếu `REDUCE` thận & thiếu tương tác ức chế mạnh CYP3A4 (trần 2.5 mg/ngày) | **Cần bổ sung `REDUCE` thận & tương tác CYP3A4** |
| 10 | `semaglutide` | 0.25 mg / 0.5–1.0 mg / 2.0–2.4 mg/tuần | `<15` & lọc máu: `avoid/caution`; `≥15`: `ok/ok` | Boxed Warning `mtc`, `men2`, thai kỳ | Ozempic 0.25/0.5/1 mg. Liều ma trận G1–G4 chỉ hiện `"0.25 mg"` (`DM2-R2-R2-06`) | **Đạt dược điển** (sửa `CONTINUE` liều ở `DM2-R2-R2-02`) |
| 11 | `semaglutide_oral` | 3 mg / 7–14 mg / 14 mg/ngày | `<15` & lọc máu: `avoid/caution`; `≥15`: `ok/ok` | Boxed Warning `mtc`, `men2`, thai kỳ | Rybelsus 3/7/14 mg. **Lỗi `MAJOR` (`DM2-R2-R2-02`)**: Lệnh `CONTINUE` gán nhầm `"0.25 mg tiêm dưới da 1 lần/tuần"`! | **Cần sửa khẩn lỗi gán nhầm đường tiêm & liều ma trận 3 mg** |
| 12 | `dulaglutide` | 0.75 mg / 1.5 mg / 4.5 mg/tuần | `<15` & lọc máu: `avoid/caution`; `≥15`: `ok/ok` | Boxed Warning `mtc`, `men2`, thai kỳ | Trulicity (đã ghi chú khan hiếm tại VN). Lệnh `CONTINUE` bị gán nhầm liều `0.25 mg` | **Cần sửa liều `CONTINUE` (`DM2-R2-R2-02`) & ma trận** |
| 13 | `liraglutide` | 0.6 mg / 1.2–1.8 mg / 1.8 mg/ngày | `<15` & lọc máu: `avoid/caution`; `≥15`: `ok/ok` | Boxed Warning `mtc`, `men2`, thai kỳ | Victoza 6 mg/mL. **Lỗi `MAJOR` (`DM2-R2-R2-02`)**: Lệnh `CONTINUE` gán nhầm `"0.25 mg x 1 lần/tuần"`! | **Cần sửa liều/nhịp dùng `CONTINUE` (`DM2-R2-R2-02`)** |
| 14 | `tirzepatide` | 2.5 mg / 5–15 mg / 15 mg/tuần | `<15` & lọc máu: `avoid/caution`; `≥15`: `ok/ok` | Boxed Warning `mtc`, `men2`, thai kỳ; giảm hấp thu thuốc tránh thai uống | Mounjaro (đã ghi chú lưu hành VN). **Lỗi `MAJOR` (`DM2-R2-R2-02`)**: Lệnh `CONTINUE` gán nhầm `"0.25 mg/tuần"`! | **Cần sửa liều `CONTINUE` (`DM2-R2-R2-02`) & ma trận** |
| 15 | `insulin_glargine` | 10 U (0.1–0.2 U/kg) | `<60` & lọc máu: giảm 20–30% liều tránh hạ ĐH | Hạ ĐH cấp (`glucose < 3.9`) | Lantus Solostar U-100, Toujeo U-300, Basaglar. Đã có lưu ý U-100/U-300 | **Đạt** (gợi ý chuyển ghi chú U-300 sang `cautions`) |
| 16 | `insulin_degludec` | 10 U (0.1–0.2 U/kg) | `<60` & lọc máu: chuẩn độ thận trọng | Hạ ĐH cấp | Tresiba FlexTouch 100 U/mL | **Đạt** (thêm `'insulin'` vào `classes`) |
| 17 | `insulin_detemir` | 10 U (0.1–0.2 U/kg, 1–2 lần/ngày) | `<60` & lọc máu: giảm liều thận trọng | Hạ ĐH cấp | Levemir FlexPen 100 U/mL | **Đạt** (thêm `'insulin'` vào `classes`) |
| 18 | `insulin_nph` | 10 U (0.1–0.2 U/kg, 1–2 lần/ngày) | `<60` & lọc máu: giảm 25–50% liều | Hạ ĐH cấp | Insulatard, Humulin N, SciLin N. Khớp tốt phác đồ Corticoid nội viện | **Đạt** (thêm `'insulin'` vào `classes`) |
| 19 | `insulin_aspart` | 4 U hoặc 10% liều nền / bữa | `<60` & lọc máu: giảm liều bolus | Hạ ĐH cấp | NovoRapid FlexPen 100 U/mL. Lưu ý lệnh `HOLD` thừa khi NPO chưa dùng thuốc (`DM2-R2-R2-08`) | **Đạt dược điển** (tinh chỉnh luật NPO) |
| 20 | `insulin_lispro` | 4 U hoặc 10% liều nền / bữa | `<60` & lọc máu: giảm liều bolus | Hạ ĐH cấp | Humalog KwikPen 100 U/mL | **Đạt** (thêm `'insulin'` vào `classes`) |
| 21 | `insulin_premix` | 10–12 U chia 2 lần/ngày | `<60` & lọc máu: thận trọng cao nguy cơ hạ ĐH xa bữa ăn | Hạ ĐH cấp, NPO nội viện | Mixtard 30, Novomix 30, Humalog Mix 25/50. Đã phân biệt 30 phút vs 0–15 phút | **Đạt** (gợi ý làm rõ `components`/`forms` KwikPen ở `DM2-R2-R2-09`) |
| 22 | `insulin_regular` *(mới)* | IV 0.1 U/kg/giờ (DKA) / 0.05 U/kg/giờ (HHS); SC 4 U trước ăn 30 phút | `<60` & lọc máu: giảm liều theo ĐH mao mạch | Hạ ĐH cấp (`glucose < 3.9`), hạ kali máu chưa bù (`k < 3.5`) | Actrapid HM, Humulin R, SciLin R 100 U/mL | **Đạt tốt** (bổ sung `'insulin'` vào `classes` & `diabetes_respiratory.json` `DM2-R2-R2-07`) |

*(3 thuốc SGLT2i dùng chung `dapagliflozin`, `empagliflozin`, `canagliflozin` có dữ liệu dược điển chính xác; tuy nhiên luật `dm2.outpatient.cardiorenal_sglt2i` đang gán nhầm liều `10 mg/ngày` của Dapagliflozin cho `canagliflozin` khi `CONTINUE` — xem `DM2-R2-R2-02`.)*

---

## Phần 3. Chi tiết các Phát hiện Dược lâm sàng Vòng 2 (`round2_R2.json`)

Tổng cộng có **9 phát hiện** kiểm chứng được bằng trích dẫn nguyên văn nhãn gốc/guideline và đầu ra `evaluate()` thực tế:
- **`critical`**: **1** (`DM2-R2-R2-01`)
- **`major`**: **4** (`DM2-R2-R2-02`, `DM2-R2-R2-03`, `DM2-R2-R2-04`, `DM2-R2-R2-05`)
- **`minor`**: **3** (`DM2-R2-R2-06`, `DM2-R2-R2-07`, `DM2-R2-R2-08`)
- **`suggestion`**: **1** (`DM2-R2-R2-09`)

---

### [CRITICAL] `DM2-R2-R2-01` — Luật ngoại trú `dm2.outpatient.metformin` phát lệnh `CONTINUE` (500–2000 mg/ngày) hoặc `START` ngay trước tiêm thuốc cản quang chứa iod ở BN eGFR 30–60 (hoặc suy tim/bệnh gan), mâu thuẫn trực tiếp với Cảnh báo Hộp đen MALA; đồng thời thiếu công tắc `contrastPlanned` trong `src/modules/dm2/inputs.ts`

- **Phân loại**: `rule` | **Đối tượng**: `dm2.outpatient.metformin` (`src/modules/dm2/rules.outpatient.ts` dòng 1010–1144) & `src/modules/dm2/inputs.ts`
- **Bằng chứng kiểm chứng**:
  1. **Nhãn gốc FDA (`09_Nhan_Thuoc/FDA/FDA_label_metformin.pdf`, Section 2.6 tr. 8 & Section 5.2 *Lactic Acidosis* tr. 10)**:
     > *"Discontinue ... metformin hydrochloride tablets at the time of, or prior to, an iodinated contrast imaging procedure in patients with an eGFR between 30 and 60 mL/min; in patients with a history of liver disease, alcoholism, or heart failure; or in patients who will be administered intra-arterial iodinated contrast. Re-evaluate eGFR 48 hours after the imaging procedure; restart ... if renal function is stable."*
  2. **Dược điển nội bộ (`kb/drugs/metformin.json` dòng 27)**: Ghi rõ *"Tạm ngưng trước và sau tiêm thuốc cản quang đường tĩnh mạch 48 giờ (nếu eGFR 30-60, bệnh gan, nghiện rượu, suy tim)"*.
  3. **Đầu ra chạy `evaluate()` thực tế (`docs/reviews/dm2/scratch/round2_r2_scenarios.ts`, Kịch bản 1D & 1E)**:
     - **Input**: Nam 58 tuổi, `scr = 135 µmol/L` → **`eGFR = 52.5 mL/phút/1.73m²`** (nằm giữa vùng nguy cơ 30–60), `customInputs: { contrastPlanned: true }`, `setting: 'outpatient'`, `selectedModules: ['dm2']`:
       - **Kịch bản 1D** (đang uống `metformin 1000 mg × 2 lần/ngày`): Engine phát khuyến cáo **`[CONTINUE] (dm2/rec_dm2_metformin) Tiếp tục duy trì Metformin | dose="500–2000 mg/ngày theo khả năng dung nạp"`** ngay cùng lúc với `[ALERT:critical] (ix.metformin_iodinated_contrast) Chống chỉ định Tạm thời / Nguy cơ Nhiễm toan Lactic: Metformin + Thuốc cản quang chứa Iod`!
       - **Kịch bản 1E** (chưa từng dùng Metformin): Engine phát khuyến cáo **`[START] (dm2/rec_dm2_metformin) Khởi trị Metformin kiểm soát đường huyết nền tảng | dose="500 mg x 1–2 lần/ngày"`** ngay trước chụp cản quang!
     - Hơn nữa, `src/modules/dm2/inputs.ts` có trường `plannedSurgery` (để tạm ngưng SGLT2i chu phẫu) nhưng **không có trường `contrastPlanned`**, nên trên giao diện độc lập của module `dm2`, bác sĩ không có nút khai báo bệnh nhân sắp chụp CT/mạch vành có cản quang.
- **Mức độ nguy hiểm**: Làm theo khuyến cáo `[CONTINUE] 500–2000 mg/ngày` hoặc `[START]` Metformin khi tiêm cản quang trên nền eGFR 30–60 (hoặc suy tim/bệnh gan) vi phạm trực tiếp Cảnh báo Hộp đen FDA và có thể dẫn đến nhiễm toan lactic do tích lũy Metformin khi thận giảm lọc cấp sau cản quang (MALA — tỷ lệ tử vong tới ~50%).
- **Hướng khắc phục đề xuất**:
  1. Bổ sung trường boolean `contrastPlanned` (*"Dự kiến chụp/can thiệp có thuốc cản quang chứa iod trong 48 giờ tới"*) vào nhóm *"Chu phẫu & Tình huống đặc biệt"* của `src/modules/dm2/inputs.ts` (dùng chung khóa `customInputs.contrastPlanned` với module `ckd`).
  2. Trong `dm2.outpatient.metformin` (`rules.outpatient.ts` dòng 1029): Khi `Boolean(ctx.patient.customInputs?.contrastPlanned)` và bệnh nhân có `egfr < 60` (hoặc chưa có `egfr`, hoặc kèm `hf` / `liverDisease` / `cirrhosis`), phát `action: 'HOLD'` nếu đang dùng Metformin (*"Tạm ngừng Metformin trước/tại thời điểm tiêm thuốc cản quang chứa iod; định lượng lại eGFR sau 48 giờ và chỉ dùng lại khi chức năng thận ổn định"*) hoặc `action: 'DEFER'` nếu chưa dùng Metformin, viện dẫn `fda.metformin.iodinated_contrast_precaution`.

---

### [MAJOR] `DM2-R2-R2-02` — Kê sai liều lượng, sai tần suất và sai đường dùng trên lệnh `CONTINUE` của `dm2.outpatient.cardiorenal_glp1` và `dm2.outpatient.cardiorenal_sglt2i`

- **Phân loại**: `rule` | **Đối tượng**: `dm2.outpatient.cardiorenal_glp1` & `dm2.outpatient.cardiorenal_sglt2i` (`src/modules/dm2/rules.outpatient.ts` dòng 719–793 & 873–980)
- **Bằng chứng kiểm chứng**:
  1. **Mã nguồn**:
     - `cardiorenal_glp1` (dòng 873–878 & 976–980): Lấy đúng `targetDrugId` theo thuốc bệnh nhân đang dùng (`semaglutide_oral`, `tirzepatide`, `liraglutide`, `dulaglutide`, `semaglutide`), đặt `action = 'CONTINUE'`, nhưng biến `dose` lại truyền cứng `startDoseStr = 'Khởi đầu ' + fmtDose(dose('semaglutide', 'start'))`!
     - `cardiorenal_sglt2i` (dòng 719–723 & 790–792): Lấy đúng `targetDrugId` (`canagliflozin`, `empagliflozin`, `dapagliflozin`), đặt `action = 'CONTINUE'`, nhưng biến `dose` truyền cứng `fmtDose(dose('dapagliflozin', 'start'))` (`10 mg x 1 lần/ngày`)!
  2. **Nhãn gốc FDA**:
     - `09_Nhan_Thuoc/FDA/FDA_label_semaglutide_rybelsus.pdf` (tr. 1): Viên uống hàng ngày `3 mg` (khởi đầu 30 ngày), duy trì `7 mg` hoặc `14 mg uống 1 lần/ngày` — hoàn toàn không phải thuốc tiêm dưới da `0.25 mg/tuần`.
     - `09_Nhan_Thuoc/FDA/FDA_label_tirzepatide.pdf` (tr. 1): Khởi đầu `2.5 mg/tuần`, duy trì `5 mg, 10 mg hoặc 15 mg/tuần` — không tồn tại hàm lượng `0.25 mg`.
     - `kb/drugs/liraglutide.json`: Tiêm hàng ngày `1.2–1.8 mg x 1 lần/ngày` (không phải hàng tuần `0.25 mg`).
     - `kb/drugs/canagliflozin.json`: Viên uống `100 mg` – `300 mg x 1 lần/ngày` (không tồn tại viên `10 mg` — sai lệch thấp gấp 10 lần).
  3. **Đầu ra chạy `evaluate()` thực tế (`docs/reviews/dm2/scratch/round2_r2_final_verify.ts`, Case A1–A4)**:
     - **Case A1** (đang uống `semaglutide_oral 14 mg x 1 lần/ngày` + ASCVD):
       `[CONTINUE] (dm2/rec_dm2_glp1_cardiorenal) drug=semaglutide_oral | title="Tiếp tục Semaglutide (Uống) bảo vệ tim mạch - thận" | dose="Khởi đầu 0.25 mg x 1 lần/tuần (tiêm dưới da) - 0.25 mg tiêm dưới da 1 lần/tuần x 4 tuần (liều thích nghi giảm tác dụng phụ tiêu hóa)"`
     - **Case A2** (đang tiêm `tirzepatide 10 mg x 1 lần/tuần` + Béo phì):
       `[CONTINUE] drug=tirzepatide | title="Tiếp tục Tirzepatide bảo vệ tim mạch - thận" | dose="Khởi đầu 0.25 mg x 1 lần/tuần (tiêm dưới da)..."`
     - **Case A3** (đang tiêm `liraglutide 1.8 mg x 1 lần/ngày` + ASCVD):
       `[CONTINUE] drug=liraglutide | title="Tiếp tục Liraglutide bảo vệ tim mạch - thận" | dose="Khởi đầu 0.25 mg x 1 lần/tuần (tiêm dưới da)..."`
     - **Case A4** (đang uống `canagliflozin 100 mg x 1 lần/ngày` + Suy tim):
       `[CONTINUE] (dm2/rec_dm2_sglt2i_cardiorenal) drug=canagliflozin | title="Tiếp tục Canagliflozin bảo vệ tim - thận" | dose="10 mg x 1 lần/ngày (uống) - 10 mg uống buổi sáng"`
- **Hướng khắc phục đề xuất**: Khi `action === 'CONTINUE'`, đọc liều đang dùng từ `activeGlp1Med` / `activeSglt2Med` hoặc gọi đúng `fmtDose(dose(targetDrugId, 'target'))` của chính `targetDrugId` đó (kèm lưu ý trần `100 mg/ngày` cho `canagliflozin` khi `egfr < 60`); chỉ dùng `dose('semaglutide', 'start')` và `dose('dapagliflozin', 'start')` khi `action === 'START'`.

---

### [MAJOR] `DM2-R2-R2-03` — Bỏ sót lệnh giảm liều thận (`REDUCE`) khi bệnh nhân CKD đang dùng quá liều `sitagliptin`, `saxagliptin`, `vildagliptin` hoặc `gliclazide`; đồng thời `dm2.outpatient.metformin` phát `REDUCE` mù quáng khi BN đã giảm Metformin về `500 mg/ngày` ở eGFR 30–44

- **Phân loại**: `missing` | **Đối tượng**: `dm2.safety.renal_dose_reduction` & `dm2.outpatient.metformin`
- **Bằng chứng kiểm chứng**:
  1. **Nhãn gốc FDA / EMA**:
     - `09_Nhan_Thuoc/FDA/FDA_label_sitagliptin.pdf` (Section 2.2, tr. 1): *"eGFR ≥30 to <45 mL/min/1.73 m²: 50 mg once daily; eGFR <30 mL/min/1.73 m² (including ESRD on dialysis): 25 mg once daily"* (AUC tăng ~4 lần ở suy thận nặng/ESRD).
     - `09_Nhan_Thuoc/FDA/FDA_label_saxagliptin.pdf` (Section 2.2, tr. 3): *"The dose of ONGLYZA is 2.5 mg once daily for patients with moderate or severe renal impairment, or with ESRD requiring hemodialysis (CrCl ≤50 mL/min)."*
     - `09_Nhan_Thuoc/EMA/vildagliptin_Galvus_EMA_SmPC.pdf` (Section 4.2, tr. 3): *"In patients with moderate or severe renal impairment or with end-stage renal disease (ESRD), the recommended dose of Galvus is 50 mg once daily."*
     - `kb/drugs/gliclazide.json` (`renalAdjustment` `[30, 60]`): *"Tối đa 60 mg/ngày; thận trọng nguy cơ hạ đường huyết"*.
  2. **Đầu ra chạy `evaluate()` thực tế (`round2_r2_scenarios.ts` Kịch bản 3B–3D & `round2_r2_final_verify.ts` Case C1)**:
     - Bất cứ khi nào bệnh nhân không khởi trị được GLP-1 RA (ví dụ `eGFR < 15`, tiền sử `MTC/MEN2`, người già `very_complex`, hoặc BN gầy không có chỉ định tim-thận), DPP-4i không bị dừng bởi GLP-1 RA và được giữ nguyên mà **không hề được kiểm tra trần liều thận**:
       - **Kịch bản 3B**: `eGFR = 25.1` (CKD G4), đang uống `sitagliptin 100 mg x 1 lần/ngày` (**gấp 4 lần** trần FDA 25 mg/ngày) → **0 lệnh `REDUCE`, 0 cảnh báo**!
       - **Kịch bản 3C**: `eGFR = 37.2` (CKD G3b), đang uống `saxagliptin 5 mg x 1 lần/ngày` (**gấp 2 lần** trần FDA 2.5 mg/ngày) → **0 lệnh `REDUCE`, 0 cảnh báo**!
       - **Kịch bản 3D**: `eGFR = 37.2` (CKD G3b), đang uống `vildagliptin 50 mg x 2 lần/ngày` = `100 mg/ngày` (**gấp 2 lần** trần EMA 50 mg/ngày) → **0 lệnh `REDUCE`, 0 cảnh báo**!
     - Ngược lại ở **Case C1** (`eGFR = 36.6`, bệnh nhân đã được chỉnh giảm `metformin 500 mg x 1 lần/ngày` ≤ 1000 mg/ngày): `dm2.outpatient.metformin` dòng 1084 không đọc liều hiện tại mà phát cứng `[REDUCE] Giảm liều Metformin khi suy thận mức độ vừa | dose="Tối đa 1000 mg/ngày"`.
- **Hướng khắc phục đề xuất**:
  1. Bổ sung luật rà soát giảm liều thận (`dm2.safety.renal_reduce_*`, `setting: 'both'`, chạy khi thuốc đó không bị `STOP`) và/hoặc mở rộng `reviewCurrentMedications` kiểm tra tổng liều ngày của `sitagliptin` (`>50 mg` ở eGFR 30–<45; `>25 mg` ở eGFR <30), `saxagliptin` (`>2.5 mg` ở eGFR ≤45), `vildagliptin` (`>50 mg/ngày` ở eGFR <50), và `gliclazide` (`>60 mg/ngày` ở eGFR 30–<60) để phát `action: 'REDUCE'` về đúng liều nhãn.
  2. Trong `dm2.outpatient.metformin` (dòng 1084): tính tổng liều Metformin/ngày từ `currentMeds`; nếu đã `> 0` và `<= 1000 mg/ngày`, phát `action: 'CONTINUE'` (*"Duy trì liều thận trọng hiện tại (≤ 1000 mg/ngày), không tăng liều và theo dõi eGFR mỗi 3–6 tháng"*).

---

### [MAJOR] `DM2-R2-R2-04` — Thiếu tương tác bắt buộc giới hạn liều `saxagliptin` tối đa `2.5 mg/ngày` khi phối hợp với chất ức chế mạnh CYP3A4/5 (`clarithromycin`, `ketoconazole`, `itraconazole`, `ritonavir`...)

- **Phân loại**: `drug` | **Đối tượng**: `saxagliptin` (`kb/drugs/saxagliptin.json` & `kb/interactions/diabetes_respiratory.json`)
- **Bằng chứng kiểm chứng**:
  1. **Nhãn gốc FDA (`09_Nhan_Thuoc/FDA/FDA_label_saxagliptin.pdf`, Section 2.3 tr. 4 & Section 7.1 tr. 8)**:
     > *"2.3 Strong Cytochrome P450 3A4/5 Inhibitors: The dose of ONGLYZA is 2.5 mg once daily when coadministered with strong cytochrome P450 3A4/5 (CYP3A4/5) inhibitors (e.g., ketoconazole, atazanavir, clarithromycin, indinavir, itraconazole, nefazodone, nelfinavir, ritonavir, saquinavir, and telithromycin)."*
  2. **Hiện trạng KB & Chạy `evaluate()` thật (`round2_r2_scenarios.ts`, Kịch bản 3E)**:
     - Điểm này đã được ghi nhận từ Vòng 1 (`round1_R2.md` Bảng Mục 2 hàng 10) nhưng chưa được bổ sung: `kb/drugs/saxagliptin.json` chỉ có `"interactions": ["Không dùng chung với GLP-1 RA"]`; `kb/interactions/diabetes_respiratory.json` chưa có quy tắc `ix.saxagliptin_strong_cyp3a4` (trong khi KB đã có chuẩn `strong_cyp3a4_inhibitor` + `doseLimit` cho `finerenone`, `atorvastatin`, `colchicine`, `apixaban`, `ivabradine`).
     - Khi chạy bệnh nhân dùng `saxagliptin 5 mg x 1 lần/ngày` + `clarithromycin 500 mg x 2 lần/ngày`: Engine xuất **0 lệnh `REDUCE` và 0 cảnh báo tương tác**.
- **Hướng khắc phục đề xuất**: Cập nhật `interactions` trong `kb/drugs/saxagliptin.json` (kèm citation `fda_label_saxagliptin` tr. 4) và thêm `ix.saxagliptin_strong_cyp3a4` (`severity: "major"`, `doseLimit: { drugId: "saxagliptin", maxDailyMg: 2.5 }`) vào `kb/interactions/diabetes_respiratory.json`.

---

### [MAJOR] `DM2-R2-R2-05` — Khoảng trống điều trị tăng bậc đường huyết ngoại trú khi HbA1c chưa đạt đích (7.0% – 9.9%) ở bệnh nhân ĐTĐ2 thể gầy chưa có biến cố tim-thận và ở bệnh nhân CKD giai đoạn 5 (`eGFR < 15`)

- **Phân loại**: `missing` | **Đối tượng**: `dm2.outpatient.glycemic_step_up` (`src/modules/dm2/rules.outpatient.ts`)
- **Bằng chứng kiểm chứng**:
  1. **Guideline gốc (`ADA_2026_SOC_9...pdf` Rec 9.6, Rec 9.9 & Fig. 9.3 tr. 8–11; `ADA_2026_SOC_11...pdf` tr. 8; `KDIGO_2022_Diabetes_Management_in_CKD.pdf` Fig. 2 tr. 26; `BYT 5481/2020`)**:
     - Tránh trì trệ điều trị (*avoid therapeutic inertia* — Class I / Grade A): khi HbA1c vượt mục tiêu cá thể hóa trên nền Metformin đơn trị tối đa, bắt buộc phối hợp thuốc hạ đường huyết bậc 2 theo mục tiêu ưu tiên (tránh hạ đường huyết, cân nặng, chi phí).
     - Ở CKD giai đoạn 5 (`eGFR < 15 mL/phút/1.73m²`) nơi Metformin, khởi mới SGLT2i, khởi mới GLP-1 RA và Sulfonylurea đều tránh dùng, lựa chọn kiểm soát đường huyết chuẩn theo ADA/KDIGO là **DPP-4i (`linagliptin 5 mg/ngày` không cần chỉnh liều thận, hoặc `sitagliptin 25 mg/ngày`) và/hoặc `insulin nền` liều thấp**.
  2. **Đầu ra chạy `evaluate()` thực tế (`round2_r2_final_verify.ts`, Case D1 & D2)**:
     - **Case D1 (Thể gầy Châu Á rất phổ biến tại Việt Nam)**: Nam 52 tuổi, `BMI = 20.8 kg/m²`, `eGFR = 99.1`, không ASCVD/HF/CKD, **`HbA1c = 8.6%`** dù đã uống `metformin 1000 mg × 2 lần/ngày` (2000 mg/ngày) → Engine chỉ xuất `[MONITOR] Mục tiêu HbA1c cá thể hóa: < 7.0%` và `[CONTINUE] Tiếp tục duy trì Metformin`, **không đề xuất bất kỳ thuốc phối hợp bậc 2 nào**!
     - **Case D2 (CKD giai đoạn 5 chưa lọc máu)**: Nữ 68 tuổi, `eGFR = 11.4 mL/phút/1.73m²`, **`HbA1c = 8.6%`**, `glucose = 10.5 mmol/L`, `currentMeds: []` → Engine xuất 3 thẻ `[AVOID]` (Dapagliflozin, Semaglutide, Metformin) và **không đề xuất bất kỳ thuốc điều trị hạ đường huyết nào** (`linagliptin 5 mg/ngày` hoặc `insulin_glargine` liều thấp)!
- **Hướng khắc phục đề xuất**: Bổ sung quy tắc `dm2.outpatient.glycemic_step_up` kích hoạt khi `hba1c` vượt mục tiêu cá thể hóa nhưng dưới ngưỡng `early_insulin` (`hba1c < 10.0%`, `glucose < 16.7 mmol/L`) và bệnh nhân không có lệnh `START` mới từ SGLT2i/GLP-1 RA (tôn trọng cổng thai kỳ, hạ ĐH cấp và `isOvertreatedFrailDeferral`): gợi ý `linagliptin 5 mg/ngày` (hoặc `insulin_glargine` `0.1 U/kg/ngày`) khi `egfr < 15`, và gợi ý phối hợp bậc 2 cá thể hóa (DPP-4i / SGLT2i / GLP-1 RA / Pioglitazone / Gliclazide MR khi `egfr >= 30`) cho bệnh nhân chưa có bệnh tim-thận-béo phì đã dùng Metformin.

---

### [MINOR] `DM2-R2-R2-06` — Ma trận thận `dm2MatrixEgfr` chỉ hiển thị con số liều khởi đầu làm quen tiêu hóa (không có hiệu lực hạ đường huyết và thiếu nhịp dùng) trên dải G1–G4 cho cả 5 thuốc Incretin, và để trống `dose` của `pioglitazone` ở G5 / Lọc máu

- **Phân loại**: `matrix` | **Đối tượng**: `dm2.matrix.egfr` (`src/modules/dm2/matrix.ts` dòng 88–95 & 5 tệp Incretin + `pioglitazone.json`)
- **Bằng chứng kiểm chứng**:
  - Nhãn `FDA_label_semaglutide_rybelsus.pdf` (Section 2.2, tr. 1 & tr. 5): *"The 3 mg dosage is for treatment initiation and is not effective for glycemic control; after 30 days on the 3 mg dosage, increase the dosage to 7 mg orally once daily."* Tương tự cho Ozempic `0.25 mg`, Victoza `0.6 mg`, Mounjaro `2.5 mg`.
  - Kết xuất `dm2MatrixEgfr()` (`round2_r2_audit.ts`): Các cột G1–G4 xuất cụt lủn `semaglutide: "0.25 mg"`, `semaglutide_oral: "3 mg"`, `dulaglutide: "0.75 mg"`, `liraglutide: "0.6 mg"`, `tirzepatide: "2.5 mg"`; riêng `pioglitazone` ở cột `G5` và `dialysis` có `dose === undefined`.
- **Hướng khắc phục đề xuất**: Hiển thị đầy đủ khoảng liều duy trì kèm tần suất (`/tuần` hoặc `/ngày`) cho 5 thuốc Incretin trên dải G1–G4 và bổ sung `maxDose: "15 - 30 mg/ngày (thận trọng giữ dịch)"` cho dải `[0, 15]` của `pioglitazone.json`.

---

### [MINOR] `DM2-R2-R2-07` — Chưa đồng bộ mã nhóm `DrugEntry.classes` với `DrugStandardClass`, gây lọt `insulin_regular` khỏi tương tác hạ đường huyết, lọt cảnh báo trùng 2 SU / 2 Insulin nền, sai tiêu đề khi trùng 2 GLP-1 RA, và lọt chống chỉ định gan `vildagliptin` khi không bật module `dm2`

- **Phân loại**: `drug` | **Đối tượng**: `vildagliptin` / các tệp `kb/drugs/*.json`, `kb/interactions/diabetes_respiratory.json`, `src/engine/safety/duplicates.ts`, `src/engine/safety/reviewMeds.ts`
- **Bằng chứng kiểm chứng**:
  1. `kb/drugs/insulin_regular.json` khai `"classes": ["insulin_bolus", "antidiabetic"]` (thiếu `"insulin"`) và chưa được thêm vào mảng `drugIds` của `ix.su_fluoroquinolones` / `ix.su_nsaid` trong `kb/interactions/diabetes_respiratory.json` (dòng 31–45).
  2. `round2_r2_final_verify.ts` **Case E1**: Dùng đồng thời `gliclazide 60 mg` + `glimepiride 4 mg` + `insulin_glargine 20 U` + `insulin_degludec 20 U` → **0 cảnh báo trùng nhóm**; trong khi **Kịch bản 4D** (`semaglutide` + `liraglutide` + `tirzepatide`, không có DPP-4i) lại phát cảnh báo sai tên `"Phối hợp DPP-4i và GLP-1 RA"`.
  3. `round2_r2_scenarios.ts` **Kịch bản 3G**: Bệnh nhân `liverDisease: true` đang uống `vildagliptin 50 mg × 2` nhưng chỉ chọn module `htn` → `reviewCurrentMedications` mục 2f chưa quét `severe_hepatic_impairment` và `mtc`/`men2` nên xuất **0 lệnh `STOP`**.
- **Hướng khắc phục đề xuất**: Bổ sung các mã chuẩn `'glp1ra'`, `'su'`, `'ag_inhibitor'`, `'insulin'` vào `classes` của các tệp KB (đồng thời thêm `"insulin_regular"` vào `diabetes_respiratory.json`); thêm luật phát hiện trùng nhóm `su` và `insulin_basal` + tách riêng cảnh báo trùng nội bộ GLP-1 RA trong `duplicates.ts`; bổ sung kiểm tra `severe_hepatic_impairment` và `mtc`/`men2` trong `reviewMeds.ts`.

---

### [MINOR] `DM2-R2-R2-08` — Luật nội viện `dm2.inpatient.prandial_bolus_regimen` phát y lệnh `[HOLD] Tạm hoãn Insulin Aspart` ngay cả khi bệnh nhân NPO chưa từng dùng bất kỳ insulin bữa ăn nào

- **Phân loại**: `rule` | **Đối tượng**: `dm2.inpatient.prandial_bolus_regimen` (`src/modules/dm2/rules.inpatient.ts` dòng 489–518)
- **Bằng chứng kiểm chứng**: `round2_r2_scenarios.ts` **Kịch bản 5F** (`currentMeds: []`, `inpatientEating: 'npo'`, `onSteroidTherapy: true`) xuất y lệnh `[HOLD] (dm2/rec_dm2_inpatient_prandial_hold_npo) drug=insulin_aspart | title="Tạm hoãn Insulin Aspart định kỳ trước bữa ăn do bệnh nhân nhịn ăn (NPO)"` dù bệnh nhân chưa hề được kê Insulin Aspart.
- **Hướng khắc phục đề xuất**: Khi `eatingStatus === 'npo'`, chỉ phát `HOLD` nếu `currentMeds` đang có insulin nhanh/hỗn hợp (và gắn đúng `drugId` đang dùng); nếu chưa dùng insulin bữa ăn, trả về `null` (thẻ `basal_bolus_regimen` NPO đã nêu rõ nguyên tắc chỉ tiêm nền + thang hiệu chỉnh).

---

### [SUGGESTION] `DM2-R2-R2-09` — Chuẩn hóa chi tiết bào chế `insulin_premix.json`, tiêu đề nguồn `fda_label_metformin` trong `kb/sources.json`, và kiểu `cautions` trong `DrugEntry`

- **Phân loại**: `drug` | **Đối tượng**: `insulin_premix`, `kb/sources.json`, `src/kb-types/index.ts`
- **Bằng chứng kiểm chứng**:
  1. `kb/drugs/insulin_premix.json` khai `components: ["insulin_regular", "insulin_nph"]` và `forms: ["Bút tiêm FlexPen..."]` nhưng `vnBrands` bao gồm cả `Novomix 30` (biphasic aspart) và `Humalog Mix 25/75, 50/50` (lispro/lispro protamine bút `KwikPen`).
  2. Tệp `09_Nhan_Thuoc/FDA/FDA_label_metformin.pdf` thực tế là nhãn viên phối hợp *"Pioglitazone and metformin hydrochloride tablets (Revised 10/2026)"*, trong khi `kb/sources.json` đặt tên là *"FDA Prescribing Information: Metformin Hydrochloride Tablets (2024)"*.
  3. Trường `"cautions"` mới thêm vào `semaglutide.json` và `tirzepatide.json` chưa được khai báo trong `interface DrugEntry` (`src/kb-types/index.ts`), còn lưu ý chuyển đổi nồng độ U-100/U-300 của `insulin_glargine.json` đang nằm trong mảng `interactions`.
- **Hướng khắc phục đề xuất**: Bổ sung `KwikPen` và ghi chú thành phần analog/human vào `insulin_premix.json`; đồng bộ tiêu đề `fda_label_metformin` trong `kb/sources.json`; thêm `cautions?: string[]` vào `DrugEntry` và chuyển lưu ý U-100/U-300 của `insulin_glargine.json` sang `cautions`.

---

## Phần 4. Kết luận Kiểm định Độc lập Vòng 2 (Verdict)

- **Tổng hợp kết quả Vòng 2 (Vai R2 – Dược lâm sàng)**:
  - Hậu kiểm Vòng 1: **16/16 finding R2 Vòng 1 + mục đồng bộ HF đã được khắc phục đúng**.
  - Phát hiện mới / tồn đọng qua kiểm định sâu toàn module Vòng 2: **1 `critical`**, **4 `major`**, **3 `minor`**, **1 `suggestion`** (tổng cộng 9 mục trong `docs/reviews/dm2/round2_R2.json`).
- **KẾT LUẬN CUỐI CÙNG**: **FAIL** *(còn 1 critical và 4 major cần khắc phục trước khi đạt chuẩn `PASS` 0 critical, 0 major theo `docs/REVIEW_PROTOCOL.md`)*.
