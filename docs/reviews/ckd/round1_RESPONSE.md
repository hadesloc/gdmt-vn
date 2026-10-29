# Báo Cáo Giải Trình, Hoàn Thiện Post-Round-1 & Chuẩn Hóa QA-10 (Round 1 Response)
## Module Bệnh Thận Mạn (CKD) – GDMT-VN

*Tác giả: Agent E2 – Chuyên gia Thận học & Kỹ sư Module CKD (Post-Round-1 Polish & QA-10)*  
*Người nhận: Hội đồng Thẩm định (R1 – Guideline Checker, R2 – Clinical Pharmacist, R3 – Adversarial Safety Reviewer) & Điều phối viên*  
*Ngày cập nhật: 27/10/2026*  

---

## 1. TỔNG QUAN KẾT QUẢ KHẮC PHỤC & CHUẨN HÓA QA-10

Sau khi rà soát toàn diện 3 báo cáo thẩm định độc lập Vòng 1 (**43 phát hiện tổng cộng**: 12 từ R1, 16 từ R2, 15 từ R3) cùng phụ lục đồng bộ liên chuyên khoa Thận–Suy tim từ Điều phối viên, Agent E2 đã hoàn tất **100% các hạng mục kỹ thuật, dược lâm sàng và an toàn người bệnh**:

1. **Khắc phục triệt để 43/43 phát hiện từ R1, R2, R3** (bao gồm toàn bộ nhóm Critical, Major, Minor và Suggestion) với **100% các phát hiện Critical & Major đều có ít nhất 1 Golden Case hồi quy khóa cứng** trong `tests/golden/ckd/` (nâng tổng số ca chuẩn CKD lên **49 ca**, từ `ckd_01` đến `ckd_48` + `ckd_sglt2i_sample`).
2. **Chuẩn hóa kiến trúc QA-10 (`quantity` + `thFor`) trên toàn bộ Module CKD**:
   - Toàn bộ **64 ngưỡng lâm sàng** trong `kb/thresholds/ckd.json` đều đã khai báo đại lượng chuẩn hóa `quantity` (`egfr`, `scr`, `k`, `hco3`, `sbp`, `uacr`, `age`, `duration_days`, `duration_weeks`, `percent`, `ratio`, `dose_mg`, `dose_g`, `dose_iu`, `volume_ml`...) và tách bạch tuyệt đối nguyên tắc **"1 ý nghĩa lâm sàng = 1 Threshold ID độc lập"** (không mượn chéo ngưỡng giữa Finerenone và RASi, không lấy ngưỡng chuyển tuyến nhân đôi làm ngưỡng cản quang, không lấy đích hạ áp làm sàn an toàn huyết động).
   - 100% phép đọc ngưỡng trong `src/modules/ckd/rules.outpatient.ts` và `src/modules/ckd/rules.inpatient.ts` sử dụng `thFor(expectedQuantity, id)` thay vì `th(id)`.
3. **Chuẩn hóa 18/18 thuốc sở hữu trong `kb/drugs/` & Đồng bộ `finerenone.json` cho Suy tim LVEF ≥ 40%**:
   - Đầy đủ `classes`, `components: []`, `pregnancy`, `lactation`, `contraindications`, `gates`, `vnBrands` thực tế tại Việt Nam và đồng bộ hash `kb/review/*.json` ở mức tối đa `"auto_checked"`.
   - Phân định chuẩn xác mức độ thai kỳ theo đúng nhãn FDA/EMA gốc: `pregnancy.status = 'contra'` cho 10 thuốc ACEi/ARB (FDA Boxed Warning gây độc/tử vong thai nhi); `pregnancy.status = 'avoid'` cho 3 thuốc SGLT2i và Finerenone (FDA Section 8.1 *Not recommended during 2nd/3rd trimesters / pregnancy* — tránh gán sai nhãn Boxed Warning); `pregnancy.status = 'caution'` cho 3 chất gắn kali và Natri Bicarbonat.
   - Bổ sung vào `kb/drugs/finerenone.json`: `classes: ["mra_nonsteroidal", "mra"]`, hàm lượng `Viên nén bao phim 40 mg`, và phác đồ chuẩn độ cho cả hai chỉ định **CKD kèm ĐTĐ2 (`10 -> 20 mg/ngày`)** lẫn **Suy tim LVEF ≥ 40% HFmrEF/HFpEF (`10 -> 20 mg/ngày` khi eGFR 25–<60; `20 -> 40 mg/ngày` khi eGFR ≥ 60)** kèm trích dẫn nguyên văn từ ESC 2026 HF Table 11 và FDA Kerendia Label (Section 2.3 & 3).

### Bảng Thống Kê Trạng Thái Nghiệm Thu
| Thẩm định viên | Tổng số phát hiện | Critical / Major | Số phát hiện đã khóa cứng bằng Code + KB + Test | Trạng thái |
|---|:---:|:---:|:---:|:---:|
| **Reviewer R1 (Guideline)** | 12 | 2 Critical, 5 Major | **12 / 12 (100%)** | **FIXED & LOCKED** |
| **Reviewer R2 (Pharmacy)** | 16 (+1 HF Addendum) | 1 Critical, 10 Major | **16 / 16 + Addendum (100%)** | **FIXED & LOCKED** |
| **Reviewer R3 (Adversarial Safety)** | 15 | 7 Critical, 6 Major | **15 / 15 (100%)** | **FIXED & LOCKED** |

---

## 2. MA TRẬN ĐỐI CHIẾU TOÀN BỘ 43 PHÁT HIỆN (R1, R2, R3) & CA KIỂM THỬ HỒI QUY

### 2.1. Báo Cáo Reviewer R1 (`round1_R1.json` — 12/12 mục)

| Mã Finding | Mức độ | Tóm tắt phát hiện | Giải pháp kỹ thuật & lâm sàng đã triển khai | Golden Case / Kiểm thử khóa hồi quy |
|---|:---:|---|---|---|
| **CKD-R1-01** | 🔴 Critical | Chỉ định lọc máu cấp cứu kích hoạt sai khi toan nhẹ–vừa (`HCO3⁻ < 18` mmol/L) và `K⁺ ≥ 6.5` chưa qua điều trị nội khoa | Tách ngưỡng chuyên biệt `ckd.dialysis.hco3_emergency_max = 8` mmol/L (`quantity: 'hco3'`, BYT 2024 trang 66) và `ckd.dialysis.k_refractory_min = 6.5` (`quantity: 'k'`). Chỉ kích hoạt `rec_ckd_emergency_rrt` khi `hco3 < 8`, hoặc `k >= 6.5` kháng trị nội khoa / trên BN đang lọc máu chu kỳ (UKKA 2022 Rec 18.1), hoặc vô niệu ≥ 12h / quá tải dịch kháng lợi tiểu. | `ckd_31_inpatient_aki_hco3_17_no_rrt.json`, `ckd_23_inpatient_aki_stage3_rrt.json`, `invariants.test.ts` (Bất biến 12) |
| **CKD-R1-02** | 🔴 Critical | Dùng nhầm đích hạ áp (`120 mmHg`) làm cổng an toàn tối thiểu chặn khởi trị/chuẩn độ RASi ở BN huyết áp bình thường có đạm niệu A3 | Khai báo ngưỡng an toàn huyết động độc lập `ckd.rasi.sbp_initiate_min = 100` mmHg (`quantity: 'sbp'`, KDIGO 2021 BP / KDIGO 2024 PP 3.6.5). Giữ `120 mmHg` làm đích điều trị, kiểm tra cổng dưới `sbp >= 100 mmHg`. | `ckd_03_rasi_a3_nondm.json`, `ckd_32_normotensive_sbp112_a3_start_rasi.json`, `invariants.test.ts` (Bất biến 5) |
| **CKD-R1-03** | 🟠 Major | Bỏ sót khuyến cáo Statin Class 1B cho BN CKD ≥ 50 tuổi có `eGFR ≥ 60` (G1–G2) | Cập nhật `ckd.outpatient.statin_indication`: Bao phủ mọi BN CKD ≥ 50 tuổi (`eGFR < 60` -> Class 1A Rec 3.15.1.1; `eGFR ≥ 60` -> Class 1B Rec 3.15.1.2) và BN 18–49 tuổi có ĐTĐ/ASCVD (`ckd.statin.adult_age_min = 18` -> Class 2A Rec 3.15.1.3). | `ckd_30_statin_g1_elderly.json`, `ckd_12_statin_elderly_ckd.json`, `invariants.test.ts` (Bất biến 14) |
| **CKD-R1-04** | 🟠 Major | AKI Stage 3 xếp sai cho mọi BN CKD có `SCr ≥ 353.6` µmol/L không kèm tăng cấp tính; hardcode `353.6` | Dùng `thFor('scr', 'ckd.aki.stage3_scr_abs')` (353.6) kết hợp bắt buộc mức tăng cấp tính `currentScr - baselineScr >= thFor('scr', 'ckd.aki.scr_increase_stage1')` (26.5 µmol/L theo KDIGO 2012 Bảng 2 / BYT 2024 trang 70) hoặc `ratio >= thFor('ratio', 'ckd.aki.scr_ratio_stage3')` (3.0). | `ckd_33_inpatient_ckd4_scr355_not_stage3.json`, `ckd_23_inpatient_aki_stage3_rrt.json`, `invariants.test.ts` (Bất biến 13) |
| **CKD-R1-05** | 🟠 Major | Gán sai citation `fig_48` và phóng đại `STOP` NSAID cho mọi giai đoạn CKD | Thay bằng `kdigo.ckd.2024.nsaid_nephrotoxicity_p132` + `byt.ckd.2024.nsaid_contra_egfr_30`, tách ngưỡng `ckd.nsaid.egfr_contra = 30` (`quantity: 'egfr'`): phát `STOP` khẩn khi `eGFR < 30`, AKI hoặc phối hợp bộ ba *Triple Whammy* (RASi + lợi tiểu + NSAID); phát `AVOID` (khuyên tránh dùng kéo dài, ưu tiên Paracetamol) khi `eGFR ≥ 30`. | `ckd_09_stop_nsaid_ckd.json` (G4 -> `STOP`), `ckd_34_nsaid_ckd_g3a_avoid.json` (G3a -> `AVOID`), `invariants.test.ts` (Bất biến 8) |
| **CKD-R1-06** | 🟠 Major | Thiếu cảnh báo an toàn ngoại trú khi `K⁺ > 5.5` mmol/L ở BN đang dùng RASi / Finerenone | Bổ sung `ckd.outpatient.hyperkalemia_hold_rasi_mra` (`5.5 < K⁺ < 6.0` -> `HOLD`), `ckd.outpatient.hyperkalemia_emergency_refer` (`K⁺ ≥ 6.0` -> `REFER` Cấp cứu), mở rộng `chronic_hyperkalemia_binders` cho toàn dải `5.0 < K⁺ < 6.0` và khóa `rasi_monitoring` (2–4 tuần) khi `K⁺ > 5.5`. | `ckd_27_outpatient_hyperk_mild_hold_binder.json`, `ckd_28_outpatient_hyperk_severe_emergency_refer.json`, `invariants.test.ts` (Bất biến 11) |
| **CKD-R1-07** | 🟠 Major | Thiếu quy tắc chuẩn độ Finerenone 10 -> 20 mg; dùng nhầm ngưỡng Finerenone (`4.8`) sang chuẩn độ RASi | Bổ sung `ckd.outpatient.finerenone_uptitrate` (`K⁺ ≤ 4.8`, `eGFR ≥ 25` -> `UPTITRATE` 20 mg). Tách ngưỡng riêng `ckd.rasi.k_uptitrate_max = 5.0` (`quantity: 'k'`) cho `rasi_uptitrate` (cho phép chuẩn độ RASi khi `K⁺ ≤ 5.0`). | `ckd_29_finerenone_uptitrate_to_20mg.json`, `ckd_47_rasi_uptitrate_k49.json`, `invariants.test.ts` (Bất biến 6) |
| **CKD-R1-08** | 🟡 Minor | Luôn phát `START` Natri Bicarbonat ngay cả khi BN đã đang dùng | Kiểm tra `sodium_bicarbonate` trong `currentMeds`: nếu đã có mà `HCO3⁻ < 18` mmol/L -> trả về `UPTITRATE` tăng liều lên 2–4 g/ngày để đạt đích 22–26 mmol/L. | `ckd_10_metabolic_acidosis_bicarb.json` & kiểm tra logic `metabolic_acidosis` |
| **CKD-R1-09** | 🟡 Minor | Thiếu `profileDiff` và hardcode `5.0` trong `chronic_hyperkalemia_binders` | Bổ sung đầy đủ `profileDiff` (`INTL`, `VN`, `US`) và thay số literal bằng `thFor('k', 'ckd.rasi.k_initiate_max')`. | `ckd_11_chronic_hyperk_binder.json`, `ckd_36_vn_profile_kalimate_binder.json`, `verify:kb` (0 literal) |
| **CKD-R1-10** | 🟡 Minor | Tính `th('ckd.referral.egfr_threshold') * 2` và hardcode `60` trong `contrast_aki_prevention` | Khai báo ngưỡng độc lập `ckd.contrast.egfr_risk_threshold = 60` (`quantity: 'egfr'`, KDIGO 2012 AKI Section 4) và đọc qua `thFor('egfr', 'ckd.contrast.egfr_risk_threshold')`. | `ckd_26_inpatient_ci_aki_prevention.json`, `verify:kb` |
| **CKD-R1-11** | 🟡 Minor | Chưa khai thác ngưỡng chuyển tuyến KFRE 5 năm mức `3%` (`ckd.kfre.referral_5y_min`) | Tích hợp `computeKfre` vào `getKfre5y(ctx)` và bổ sung rule `ckd.outpatient.consider_nephrology_referral_kfre` phát `CONSIDER` khi `3% ≤ KFRE 5 năm < 5%` (và `REFER` khi `≥ 5%`). | `ckd_48_consider_refer_kfre_3_to_5.json` |
| **CKD-R1-12** | 💡 Suggestion | Rationale khởi trị SGLT2i ghi cứng nhóm `1A` cho cả phân nhóm `2B` | Phân nhánh động trong `sglt2i_initiate`: hiển thị `Khuyến cáo nhóm 1A` khi có ĐTĐ2 / Suy tim / `UACR ≥ 20 mg/mmol` và `Khuyến cáo nhóm 2B (Rec 3.7.3)` khi chỉ đạt tiêu chí `eGFR 20–45` không ĐTĐ2, `UACR < 20`. | `ckd_01_sglt2i_t2d_g3a.json`, `rules.outpatient.ts` |

---

### 2.2. Báo Cáo Reviewer R2 (`round1_R2.json` — 16/16 mục + Phụ lục Suy tim LVEF ≥ 40%)

| Mã Finding | Mức độ | Tóm tắt phát hiện | Giải pháp kỹ thuật & dược lâm sàng đã triển khai | Golden Case / Kiểm thử khóa hồi quy |
|---|:---:|---|---|---|
| **CKD-R2-01** | 🔴 Critical | Chỉ định lọc máu cấp cứu kích hoạt sai ở BN có `HCO3⁻ = 17` mmol/L | Đã tách `ckd.dialysis.hco3_emergency_max = 8` mmol/L (`quantity: 'hco3'`); BN toan nhẹ–vừa chỉ nhận bù kiềm, tuyệt đối không lọc máu cấp. | `ckd_31_inpatient_aki_hco3_17_no_rrt.json`, Bất biến 12 |
| **CKD-R2-02** | 🟠 Major | Gắn nhầm biệt dược `Resonium A` (muối Na⁺) vào `calcium_polystyrene_sulfonate` | Xóa hoàn toàn `Resonium A`; cập nhật `vnBrands: ["Kalimate", "K-Pion", "Calcium Resonium"]` và đồng bộ tên gọi `Nhựa trao đổi ion Calcium Polystyrene Sulfonate (Kalimate)` trên toàn bộ rules. | `ckd_36_vn_profile_kalimate_binder.json`, `verify:kb` |
| **CKD-R2-03** | 🟠 Major | Sai thứ nguyên liều duy trì SZC (`"5 mg cách ngày"` thay vì `5 g`) | Sửa chuẩn xác trong `kb/drugs/sodium_zirconium_cyclosilicate.json` thành `"5 g cách ngày đến 15 g/ngày"` khớp FDA Lokelma Section 2.1. | `ckd_24_inpatient_hyperkalemia_severe.json`, `verify:kb` |
| **CKD-R2-04** | 🟠 Major | Ô AKI trong `matrix.ts` trả về `continue: 'caution'` mâu thuẫn với lệnh `HOLD` nội viện | Chuyển cột AKI của toàn bộ SGLT2i, ACEi, ARB, Finerenone sang `{ initiate: 'contra', continue: 'contra' }` kèm ghi chú tường minh `"Tạm ngừng khẩn cấp (HOLD) trong đợt cấp AKI..."`. | `invariants.test.ts` (Suite 3: Kiểm định ma trận 18 thuốc) |
| **CKD-R2-05** | 🟠 Major | Cột G4 (15–29) trong `matrix.ts` dễ gây hiểu nhầm tại điểm cắt eGFR 20 (SGLT2i) và 25 (Finerenone) | Bổ sung `note` chi tiết cho ô G4 của 3 SGLT2i (`eGFR 20–29: Khởi trị 10 mg; eGFR 15–19: Không khởi trị mới, chỉ duy trì`) và Finerenone (`eGFR 25–29: Khởi trị 10 mg; eGFR 15–24: Không khuyến cáo khởi trị`). | `invariants.test.ts` (Suite 3: Kiểm định ranh giới G4) |
| **CKD-R2-06** | 🟠 Major | Bỏ sót khuyến cáo `CONTINUE` SGLT2i khi BN đang dùng thuốc và `eGFR ≥ 20` | Bổ sung luật `ckd.outpatient.sglt2i_continue` phát `CONTINUE` liều chuẩn khi `eGFR ≥ 20`, không lọc máu và không mang thai. | `ckd_35_sglt2i_continue_egfr_ge20.json` |
| **CKD-R2-07** | 🟠 Major | `canagliflozin` và `patiromer` liệt kê `vnBrands` chưa có số đăng ký lưu hành đại trà tại VN | Đặt `vnBrands: []` cho cả hai thuốc, ghi rõ tình trạng lưu hành tham chiếu quốc tế trong KB. | `kb/drugs/canagliflozin.json`, `patiromer.json`, `verify:kb` |
| **CKD-R2-08** | 🟠 Major | Mâu thuẫn số học liều `sodium_bicarbonate` (`1000 mg x 2–3 lần` vs `1–2 g/ngày`) | Chuẩn hóa `start: { amount: 500, unit: "mg", frequency: "2–3 lần/ngày", description: "500–1000 mg x 2–3 lần/ngày (tổng 1–2 g/ngày)" }`. | `ckd_10_metabolic_acidosis_bicarb.json`, `verify:kb` |
| **CKD-R2-09** | 🟠 Major | Thiếu cảnh báo washout 36 giờ khi chuyển đổi sang/từ ARNI ở 4 thuốc ACEi | Bổ sung cảnh báo bắt buộc ngưng ACEi tối thiểu 36 giờ trước khi dùng Sacubitril/Valsartan vào cả 5 thuốc ACEi (`enalapril`, `perindopril`, `lisinopril`, `ramipril`, `captopril`). | `kb/drugs/*.json` (5 ACEi), `verify:kb` |
| **CKD-R2-10** | 🟠 Major | Thiếu Gate thai kỳ và metadata an toàn thai kỳ trên 10 thuốc RASi | Bổ sung `gate_<drug>_pregnancy` (`action: 'contra'`), `pregnancy: { status: 'contra' }` (FDA Boxed Warning) và `contraindications` vào toàn bộ 10 thuốc ACEi/ARB; chuẩn hóa đủ 18/18 thuốc sở hữu. | `ckd_19_rasi_contra_pregnancy.json`, `ckd_38_pregnancy_stop_current_teratogens.json`, `verify:kb` (0 thuốc thiếu) |
| **CKD-R2-11** | 🟠 Major | Phép nhân `th('ckd.referral.egfr_threshold') * 2` trong `contrast_aki_prevention` | Thay hoàn toàn bằng `thFor('egfr', 'ckd.contrast.egfr_risk_threshold')` (60 mL/phút/1.73m²). | `ckd_26_inpatient_ci_aki_prevention.json` |
| **CKD-R2-12** | 🟡 Minor | Tiêu đề khởi trị Finerenone bị lặp cụm điều kiện eGFR dài do `fmtDose` | Tính liều đích danh theo dải eGFR của từng BN (`10 mg x 1 lần/ngày` hoặc `20 mg x 1 lần/ngày`) hiển thị gọn trên tiêu đề và trường `dose`. | `ckd_05_finerenone_t2d_on_rasi.json`, `ckd_06_finerenone_g2_start_20mg.json` |
| **CKD-R2-13** | 🟡 Minor | Biệt dược thị trường Mỹ (`Vasotec`, `Prinivil`, `Altace`) trong `vnBrands` | Đổi sang các biệt dược lưu hành thực tế tại Việt Nam (`Renitec`, `Ednyt`, `Enap`; `Zestril`, `Diroton`; `Tritace`, `Cardace`). | `kb/drugs/enalapril.json`, `lisinopril.json`, `ramipril.json` |
| **CKD-R2-14** | 🟡 Minor | `canagliflozin.json` thiếu cảnh báo ngưng ≥ 3 ngày trước đại phẫu | Bổ sung cảnh báo tạm ngừng ít nhất 3 ngày trước phẫu thuật lớn để phòng toan ceton đẳng đường huyết (FDA Invokana Section 5.2). | `kb/drugs/canagliflozin.json` |
| **CKD-R2-15** | 🟡 Minor | `patiromer.json` thiếu cảnh báo hạ magie máu | Bổ sung cảnh báo theo dõi magie huyết thanh định kỳ do thuốc gắn kết ion Mg²⁺ tại đường tiêu hóa (FDA Veltassa Section 5.1). | `kb/drugs/patiromer.json` |
| **CKD-R2-16** | 💡 Suggestion | `ckdMatrix` chỉ liệt kê 10 thuốc | Mở rộng `ckdMatrix` bao phủ đầy đủ **18/18 hoạt chất sở hữu** (3 SGLT2i, 5 ACEi, 5 ARB, Finerenone, 3 K-binder, Natri Bicarbonat). | `invariants.test.ts` (Suite 3: `expect(ckdMatrix.rows).toHaveLength(18)`) |
| **R2-HF-SYNC** *(Phụ lục Điều phối viên)* | 🟠 High-Priority | Đồng bộ `finerenone.json` cho chỉ định Suy tim LVEF ≥ 40% (HFmrEF/HFpEF) theo ESC 2026 HF Table 11 & FDA Kerendia Label | Cập nhật `classes: ["mra_nonsteroidal", "mra"]`, bổ sung `Viên nén bao phim 40 mg` vào `forms`, ghi rõ phác đồ HF LVEF ≥ 40% (`10 -> 20 mg` khi eGFR 25–<60; `20 -> 40 mg` khi eGFR ≥ 60) và tương tác CYP2C8 ở mức 40 mg kèm 3 trích dẫn nguyên văn (`esc.hf.2026.table_11_finerenone_doses`, `fda.finerenone.hf_lvef40_dosing`, `fda.finerenone.strengths_10_20_40`). | `verify:kb` (0 lỗi/0 cảnh báo trên `finerenone`) & 74/74 HF Golden Tests PASS |

---

### 2.3. Báo Cáo Reviewer R3 (`round1_R3.json` — 15/15 mục)

| Mã Finding | Mức độ | Tóm tắt phát hiện | Giải pháp an toàn đối kháng đã triển khai | Golden Case / Kiểm thử khóa hồi quy |
|---|:---:|---|---|---|
| **R3-CKD-01** | 🔴 Critical | Khởi trị SGLT2i cho phụ nữ mang thai | Khóa cứng `hasCondition(ctx, 'pregnant')` trong `sglt2i_initiate`, `sglt2i_continue`, `finerenone_indication`, `finerenone_uptitrate` và khai báo `pregnancy: { status: 'avoid' }` trên KB. | `ckd_37_pregnancy_t2d_ckd_no_sglt2i_statin_avoid.json`, `invariants.test.ts` (Bất biến 3) |
| **R3-CKD-02** | 🔴 Critical | Thai phụ đang dùng sẵn thuốc độc thai (Enalapril, Atorvastatin, Dapagliflozin) không được phát lệnh `STOP` | Bổ sung luật chủ động `ckd.outpatient.pregnancy_stop_teratogens` (`rec_ckd_pregnancy_stop_teratogens`) phối hợp cùng `reviewCurrentMedications` phát lệnh `STOP` khẩn cấp cho từng thuốc nguy cơ cao đang dùng. | `ckd_38_pregnancy_stop_current_teratogens.json`, `invariants.test.ts` (Bất biến 16) |
| **R3-CKD-03** | 🔴 Critical | Dùng nhầm ngưỡng đích `120 mmHg` làm cổng chặn khởi trị RASi ở BN SBP 112 mmHg kèm đạm niệu A3 | Đã tách `ckd.rasi.sbp_initiate_min = 100` mmHg (`quantity: 'sbp'`); BN SBP 112 mmHg nhận lệnh `START` bình thường. | `ckd_32_normotensive_sbp112_a3_start_rasi.json`, `invariants.test.ts` (Bất biến 5) |
| **R3-CKD-04** | 🔴 Critical | Kê đồng thời `START` Spironolactone (HF) và `START` Finerenone (CKD) trên BN đa bệnh | Loại trừ khởi trị Finerenone khi đang dùng MRA steroid hoặc có HFrEF ưu tiên MRA steroid; bổ sung `ckd.outpatient.avoid_dual_mra` (`STOP` khi dùng trùng) và gắn `classes: ["mra_nonsteroidal", "mra"]` cho `finerenone.json` để `merge.ts` hòa giải đa module. | `ckd_39_multimorbid_hfref_dual_mra_conflict.json`, `invariants.test.ts` (Bất biến 17) |
| **R3-CKD-05** | 🔴 Critical | Khởi trị Dapagliflozin khi tụt huyết áp nặng (`SBP = 82` mmHg) | Tách ngưỡng `ckd.sglt2i.sbp_initiate_min = 100` mmHg (`quantity: 'sbp'`); khi `SBP < 100` mmHg chuyển ngay sang `DEFER` kèm cảnh báo nguy cơ giảm thể tích tuần hoàn. | `ckd_40_hypotension_sbp82_no_sglt2i.json`, `invariants.test.ts` (Bất biến 4) |
| **R3-CKD-06** | 🔴 Critical | Bỏ sót tăng kali máu ngoại trú (`K⁺ = 5.6` và `6.0` mmol/L), đồng thời vẫn hẹn xét nghiệm sau 2–4 tuần | Bổ sung `hyperkalemia_hold_rasi_mra` (`5.5 < K⁺ < 6.0` -> `HOLD`), `hyperkalemia_emergency_refer` (`K⁺ ≥ 6.0` -> `REFER` Cấp cứu), chỉ định chất gắn kali và khóa không cho `rasi_monitoring` hẹn 2–4 tuần khi `K⁺ > 5.5`. | `ckd_27_outpatient_hyperk_mild_hold_binder.json`, `ckd_28_outpatient_hyperk_severe_emergency_refer.json`, `invariants.test.ts` (Bất biến 11) |
| **R3-CKD-07** | 🔴 Critical | Kê đồng thời `START` Perindopril (CKD) và `START` Sacubitril/Valsartan (HF) | Loại trừ BN đang dùng ARNI hoặc có HFrEF thuộc diện ưu tiên ARNI khỏi `rasi_initiate`, mở rộng `avoid_dual_rasi` bắt cả cặp `ACEi/ARB + ARNI`, và chuẩn hóa `classes` (`"raas_inhibitor"`) trên 10 thuốc RASi để đồng bộ `merge.ts`. | `ckd_41_multimorbid_hfref_arni_vs_acei.json`, `invariants.test.ts` (Bất biến 18a) |
| **R3-CKD-08** | 🟠 Major | `bp_target` hiển thị đích `< 120 mmHg` ở profile `INTL` nhưng `SBP = 125` lại báo `CONTINUE` (Đạt mục tiêu) | Sửa đánh giá ngưỡng động trong `bp_target`: với `INTL`/`US`, đích `< 120` mmHg nên `SBP = 125` nhận `UPTITRATE` và `passed: false`; chỉ ở `VN` (đích `120–129`) mới nhận `CONTINUE`. | `ckd_42_bp_target_sbp125_intl_uptitrate.json` |
| **R3-CKD-09** | 🟠 Major | Khởi trị Perindopril ở CKD G4 (`eGFR 15–29`) dùng liều hàng ngày thay vì cách ngày | Tra cứu trực tiếp `renalBand('perindopril', egfr)`: tự động xuất liều `"2.5 mg cách ngày (mỗi 48 giờ)"` khi `eGFR 15–29` (EMA Coversyl SmPC Table 1) và chuyển sang Losartan khi `eGFR < 15`. | `ckd_43_perindopril_g4_renal_dose_q48h.json`, `invariants.test.ts` (Bất biến 15) |
| **R3-CKD-10** | 🟠 Major | Lệnh `HOLD` ngày ốm trong AKI nội viện thiếu `drugId` trên từng thuốc | Giữ `rec_ckd_hold_sick_day` có `drugId` thuốc chính và sinh tự động các luật `ckd.inpatient.hold_aki_<drugId>` cho toàn bộ 18 hoạt chất nhóm ngày ốm, đảm bảo mọi thuốc đang dùng trong đợt AKI đều nhận `HOLD` gắn `drugId` chuẩn. | `ckd_44_inpatient_aki_hold_each_drug_id.json`, `invariants.test.ts` (Bất biến 18b) |
| **R3-CKD-11** | 🟠 Major | Mâu thuẫn giữa `action: 'AVOID'` và tiêu đề `'Khởi trị Statin...'` khi mang thai | Tách nhánh `AVOID` rõ ràng trong `statin_indication` và `rasi_initiate` với tiêu đề `'CHỐNG CHỈ ĐỊNH: Tránh dùng ...'` và không gán liều khởi trị. | `ckd_19_rasi_contra_pregnancy.json`, `ckd_20_rasi_contra_angioedema.json`, `ckd_37_pregnancy_t2d_ckd_no_sglt2i_statin_avoid.json`, Bất biến 16 |
| **R3-CKD-12** | 🟠 Major | Thiếu luật kiểm tra khuyết `scr`, tự tiện `START` Perindopril khi không rõ chức năng thận | Bổ sung `ckd.outpatient.missing_scr_check` (`missingInputRec`) và khóa fail-closed mọi luật khởi trị/chuẩn độ khi `egfr === undefined`. | `ckd_45_missing_scr_fail_closed.json`, `invariants.test.ts` (Suite 2: 5.000 ca xóa trường) |
| **R3-CKD-13** | 🟠 Major | Cảnh báo giả *Triple Whammy* trên BN suy tim dùng ARNI + Spironolactone không có NSAID | Phối hợp cùng bản vá điều kiện `interactions.ts` của Agent B và khóa cứng bằng Golden Case đa bệnh không có NSAID. | `ckd_46_hf_arni_spiro_no_false_triple_whammy.json` |
| **R3-CKD-14** | 🟡 Minor | Trộn lẫn tên biệt dược `"Resonium"` trong tiêu đề với `"Calcium Polystyrene Sulfonate"` | Chuẩn hóa đồng bộ tên dược điển `"Nhựa trao đổi ion Calcium Polystyrene Sulfonate (Kalimate)"` trên toàn module. | `ckd_36_vn_profile_kalimate_binder.json` |
| **R3-CKD-15** | 💡 Suggestion | Gói cấp cứu tăng kali máu nặng UKKA 5 bước thiếu recommendation thành phần có `drugId` | Bổ sung luật `ckd.inpatient.hyperkalemia_severe_szc_order` (`drugId: 'sodium_zirconium_cyclosilicate'`, `action: 'START'`) song hành cùng thẻ tóm tắt 5 bước hồi sức UKKA 2022. | `ckd_24_inpatient_hyperkalemia_severe.json` |

---

## 3. KẾT QUẢ KIỂM ĐỊNH TỰ ĐỘNG SAU CHUẨN HÓA QA-10

### 3.1. Xác Minh Knowledge Base & Rules Linter (`npm run verify:kb`)
- **Trích dẫn nguyên văn CKD (`kb/citations/ckd.json`)**: 100% khớp máy từng ký tự trong PDF/tài liệu gốc (bao gồm 15 trích dẫn mới từ KDIGO 2024, KDIGO 2021 BP, BYT 2024, ESC 2026 HF Table 11 và nhãn FDA/EMA).
- **Ngưỡng lâm sàng CKD (`kb/thresholds/ckd.json`)**: **64/64 ngưỡng** có đầy đủ đại lượng chuẩn hóa `quantity`, **0 số mồ côi (`ORPHAN_NUMBER`)**, **0 thiếu `quantity`**.
- **Bảng thống kê QA-1, 7, 8 & QA-10 của Module `ckd`**:
  ```text
  MODULE | FILES | LỖI (??/const) | QA-ALLOW HỢP LỆ | QA-ALLOW SAI | SO SÁNH LITERAL | TEXT LITERAL LIỀU | LIỀU LỆCH CITATION
  ckd    |     7 |              0 |               6 |            0 |               0 |                 0 |                  0
  ```
- **Bảng thống kê Thuốc của Agent E (18 thuốc sở hữu)**:
  - Thiếu trường thai kỳ (`pregnancy`): **0 thuốc**.
  - Thiếu mã nhóm chuẩn hóa (`classes`): **0 thuốc**.

### 3.2. Kiểm Tra Kiểu Tĩnh TypeScript (`npx tsc --noEmit`)
- **0 lỗi TypeScript** trên toàn bộ `src/modules/ckd/**` và `tests/modules/ckd/**` (đã xử lý dứt điểm lỗi TS6133 `hasCondition` và đồng bộ kiểu `RuleContext`).

### 3.3. Bộ Kiểm Thử Vitest: Bất Biến An Toàn + Golden Cases (`npx vitest run tests/modules/ckd/invariants.test.ts tests/golden/_runner.test.ts -t "ckd"`)
- **Thực thi đồng thời cả 2 tệp kiểm thử**: **127 / 127 tests PASS (100%)**:
  1. **Golden Cases Runner (`tests/golden/_runner.test.ts -t "ckd"`)**: **49 ca chuẩn CKD** (`ckd_01` -> `ckd_48` + `ckd_sglt2i_sample`) đạt **100% PASS**.
  2. **Property-based Safety Invariants (`tests/modules/ckd/invariants.test.ts`)**:
     - **Suite 1**: Kiểm định **18 bất biến an toàn tuyệt đối** trên **10.000 ca ngẫu nhiên** (bao gồm phân tầng NSAID `< 30` -> `STOP`, `≥ 30` -> `AVOID`; thai kỳ; lọc máu cấp; AKI Stage 3; tăng kali ngoại trú; đa bệnh MRA/ARNI; Perindopril G4; lệnh `HOLD` từng thuốc ngày ốm) -> **0 vi phạm**.
     - **Suite 2 (Fail-Closed QA-1 & QA-9)**: Xóa ngẫu nhiên `scr`, `k`, `sbp`, `uacr`, `age` trên **5.000 ca** -> **0 vi phạm**.
     - **Suite 3 (Evidence Matrix)**: Kiểm định đủ **18 thuốc sở hữu**, cột AKI thống nhất `contra` và ranh giới G4 minh bạch -> **PASS**.
  3. **Kiểm tra tương thích liên chuyên khoa Suy tim (`-t "hf_"`)**: **74 / 74 tests PASS**, xác nhận `finerenone.json` tương thích tuyệt đối với Module HF.

---

## 4. KẾT LUẬN

Module **Bệnh Thận Mạn (`ckd`)** đã hoàn tất 100% yêu cầu chỉnh sửa sau Thẩm định Vòng 1, tuân thủ trọn vẹn chuẩn kiến trúc **QA-10 (`quantity` + `thFor`)**, khóa cứng hồi quy toàn bộ các phát hiện Critical & Major bằng 49 Golden Cases và hơn 15.000 ca kiểm thử bất biến ngẫu nhiên, sẵn sàng bàn giao nghiệm thu!
