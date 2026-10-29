# BÁO CÁO PHẢN HỒI & KHẮC PHỤC THẨM ĐỊNH VÒNG 1 (ROUND 1 RESPONSE)
## Module: Rung Nhĩ (`af`) – Hệ Thống Khuyến Cáo GDMT-VN

**Người phản hồi:** Agent J2 – Chuyên gia Nhịp học kiêm Kỹ sư GDMT-VN  
**Kính gửi:** Hội đồng thẩm định (R1 – Guideline Checker, R2 – Clinical Pharmacist, R3 – Adversarial Safety Reviewer) & Agent Điều Phối Viên  
**Ngày cập nhật:** 27/10/2026  
**Trạng thái hiện tại:** **Đã khắc phục toàn bộ phát hiện Vòng 1, sẵn sàng trình Hội đồng Vòng 2** *(chưa tự công nhận PASS; chờ Hội đồng Vòng 2 thẩm định độc lập)*

---

## 1. TỔNG QUAN KẾT QUẢ KHẮC PHỤC & CHUẨN HÓA QA-10

| Hội đồng Vòng 1 | Kết luận Vòng 1 | Tổng số phát hiện | Tiến độ xử lý của Agent J2 | Trạng thái trình Vòng 2 |
|---|:---:|:---:|---|:---:|
| **R1 (Guideline Checker)** | FAIL | 3 Critical, 7 Major, 2 Minor, 1 Suggestion (13 mục) | Đã khắc phục 13/13 phát hiện | **Đã khắc phục — Sẵn sàng trình Vòng 2** |
| **R2 (Clinical Pharmacist)** | FAIL | 2 Critical, 8 Major, 3 Minor, 1 Suggestion (14 mục) | Đã khắc phục 14/14 phát hiện | **Đã khắc phục — Sẵn sàng trình Vòng 2** |
| **R3 (Adversarial Safety)** | FAIL | 7 Critical, 7 Major, 2 Minor, 1 Suggestion (17 mục) | Đã khắc phục 17/17 phát hiện | **Đã khắc phục — Sẵn sàng trình Vòng 2** |

### Kết quả kiểm chứng tự động (Automated Verification):
- **TypeScript (`npx tsc --noEmit`):** **0 lỗi**.
- **KB & RulesLint (`npm run verify:kb`):**
  - Toàn bộ **86 trích dẫn nguyên văn** trong `kb/citations/af.json` khớp 100% tài liệu gốc PDF/FDA (`0` lỗi quote, `0` số mồ côi).
  - Toàn bộ **42 ngưỡng lâm sàng** trong `kb/thresholds/af.json` có đầy đủ trường `quantity` chuẩn QA-10 (`0` `WARN_THRESHOLD_MISSING_QUANTITY`).
  - Toàn bộ **12 thuốc do Agent J sở hữu** có đầy đủ `pregnancy`, `lactation`, `contraindications`, `classes`, `components: []`, `qtRisk` và đồng bộ cả `eGFRFrom`/`eGFRTo` lẫn `crclFrom`/`crclTo` (`0` cảnh báo thiếu trường).
  - Toàn bộ **54 hồ sơ `kb/review/`** (42 ngưỡng `af.*` + 12 thuốc sở hữu) đã cập nhật `contentHash` khớp 100% ở mức tối đa `status: "auto_checked"`.
  - Linter tĩnh `rulesLint` trên 10 files trong `src/modules/af/**`: **`0` lỗi, `0` cảnh báo** ở tất cả các cột (`defaultNumberErrors = 0`, `moduleConstErrors = 0`, `qa10QuantityMismatchErrors = 0`, `literalThresholdWarnings = 0`, `literalInTextWarnings = 0`, `doseNotInCitationWarnings = 0`).
- **Vitest Golden Cases (`tests/golden/af/`):** **52 ca chuẩn lâm sàng (`af_01`–`af_52`) PASS 100%**.
- **Vitest Property-Based Invariants (`tests/modules/af/invariants.test.ts`):** **20.000 ca ngẫu nhiên hóa đa bối cảnh (`outpatient` + `inpatient`, `INTL` / `VN` / `US`) đạt 0 vi phạm**:
  - Suite 1 (10.000 ca kiểm tra 14 bất biến an toàn lâm sàng): **0 vi phạm**.
  - Suite 2 (10.000 ca QA-1 & QA-9 Fail-Closed toàn diện): **0 vi phạm**.

---

## 2. KHẮC PHỤC TRỌNG TÂM 1: LOẠI TRỪ TƯƠNG HỖ CHẸN BETA + NON-DHP CCB (PHÒNG VÔ TÂM THU / BLOCK AV HOÀN TOÀN)

Triển khai đồng bộ tại `src/modules/af/rulesRateRhythm.ts` và `src/modules/af/rulesInpatient.ts`, trích dẫn nguyên văn `esc.af.2024.rate_avoid_bb_ccb_combo` (ESC 2024 Section 7.1.2, tr. 39):

1. **Chưa dùng nền Chẹn beta hay Non-DHP CCB (`LVEF > 40%`):**
   - **Nội viện đáp ứng thất nhanh (RVR, `HR ≥ 110 bpm`, không mang thai):** Chỉ phát **1 lệnh `START` duy nhất** cho `diltiazem` (`af.inpatient.rvr_acute_rate_control`), trong khi phương án `bisoprolol` ở `af.rate.preserved_lvef` chỉ dừng ở mức `CONSIDER` (khi không có hen phế quản) kèm cảnh báo tường minh: *"CHỈ dùng nếu không chọn hoặc không dung nạp Diltiazem — CẤM phối hợp IV đồng thời do nguy cơ vô tâm thu và block nhĩ thất hoàn toàn"* (`af_27_inpatient_rvr_diltiazem_from_oncall.json`).
   - **Ngoại trú (`LVEF > 40%`):** Chỉ phát **1 lệnh `START` duy nhất** (`bisoprolol`, hoặc `diltiazem`/`verapamil` nếu có hen phế quản).
2. **ĐÃ ĐANG DÙNG Chẹn beta nền (`onBb && !onCcb`):**
   - Cả nội viện RVR lẫn ngoại trú chỉ tối ưu hóa chính thuốc chẹn beta đang dùng (`UPTITRATE` / `CONTINUE`, gợi ý phối hợp thêm Digoxin nếu chưa đạt đích) — **TUYỆT ĐỐI KHÔNG phát sinh `START` hay `CONSIDER` cho `diltiazem` hoặc `verapamil`** (`af_46_inpatient_rvr_on_bb_no_diltiazem.json`).
3. **ĐÃ ĐANG DÙNG Diltiazem / Verapamil nền (`onValidCcb && !onBb`):**
   - Tối ưu hóa chính Non-DHP CCB đang dùng (`UPTITRATE` / `CONTINUE`) — **TUYỆT ĐỐI KHÔNG phát sinh `START` hay `CONSIDER` cho bất kỳ Chẹn beta nào** (`af_47_inpatient_rvr_on_diltiazem_no_bb.json`).
4. **ĐANG DÙNG CHỒNG CHÉO CẢ Chẹn beta + Non-DHP CCB (`onBb && onCcb`):**
   - Quy tắc `af.rate.stop_dual_av_blockade` phát lệnh `STOP` ngay thuốc chồng chéo và chỉ duy trì đơn trị 1 nhóm (`af_48_rate_stop_dual_bb_ccb_combo.json`).
5. **Thiếu `LVEF` (`ef === undefined`):**
   - Fail-closed 100% (`missingInputRec('af', 'lvef', ...)`), không bao giờ khởi trị mù `diltiazem`, `verapamil`, `flecainide` hay `propafenone` (`af_40_inpatient_rvr_missing_lvef_fail_closed.json`).

---

## 3. KHẮC PHỤC TRỌNG TÂM 2: CHUẨN HÓA TOÀN DIỆN 12 THUỐC DO AGENT J SỞ HỮU (`kb/drugs/*.json`)

| Thuốc (`id`) | `pregnancy.status` | `lactation.status` | Điểm cập nhật cốt lõi về Chống chỉ định / Thận / Tương tác |
|---|:---:|:---:|---|
| `warfarin` | `contra` | `safe` | Chống chỉ định tuyệt đối thai kỳ (hội chứng warfarin bào thai); cho phép dùng khi cho con bú (`fda.warfarin.pregnancy_contra`, `esc.preg.2025.vka_pregnancy_teratogenic`). |
| `apixaban` | `avoid` | `avoid` | Tránh dùng trong thai kỳ & cho con bú (`esc.preg.2025.doac_not_recommended`, `fda.apixaban.pregnancy_lactation`); bổ sung lưu ý tương tác với Clarithromycin (`acc.af.2023.apixaban_clarithromycin`). |
| `rivaroxaban` | `avoid` | `avoid` | Chống chỉ định ở xơ gan Child-Pugh B/C (`fda.rivaroxaban.hepatic_contra`, `acc.af.2023.doac_child_pugh`); bắt buộc uống liều 15 mg / 20 mg cùng bữa ăn. |
| `dabigatran` | `avoid` | `avoid` | Chống chỉ định khi `CrCl < 30 mL/phút` (`esc.af.2024.dabigatran_crcl_contra`), van cơ học (`RE-ALIGN`), chất ức chế P-gp mạnh. |
| `edoxaban` | `avoid` | `avoid` | Bổ sung dải thận `≥ 95 mL/phút` (`initiate: "caution"`) cảnh báo Hộp đen FDA giảm hiệu lực ngừa đột quỵ (`fda.edoxaban.af_dose`, **AF-R1-10 / AF-R2-11**). |
| `amiodarone` | `avoid` | `avoid` | Tránh dùng trong thai kỳ & cho con bú do độc tính tuyến giáp thai nhi (`esc.preg.2025.amiodarone_contra`, `fda.amiodarone.pregnancy_lactation`); bổ sung lưu ý pha truyền IV chỉ trong Glucose 5% (D5W) (**AF-R2-13**); `qtRisk: "known"`. |
| `dronedarone` | `avoid` | `avoid` | Chống chỉ định ở rung nhĩ vĩnh viễn (`PALLAS`), suy tim HFrEF / NYHA III–IV (`ANDROMEDA`), suy gan nặng và thai kỳ (`esc.af.2024.dronedarone_permanent_af_contra`, `acc.af.2023.dronedarone_hf_contra`); `qtRisk: "known"`. |
| `flecainide` | `caution` | `caution` | Cân nhắc dưới giám sát chuyên khoa trong thai kỳ khi không có bệnh tim cấu trúc (`esc.af.2024.pregnancy_rhythm_flec_prop`, `esc.preg.2025.flecainide_sotalol_propafenone`); cấm khi CAD, HFrEF hoặc `CrCl < 35 mL/phút`; `qtRisk: "known"`. |
| `propafenone` | `caution` | `caution` | Cấm ở bệnh mạch vành / HFrEF (`CAST`) và hen phế quản co thắt nặng; cân nhắc thận trọng trong thai kỳ khi không có bệnh tim cấu trúc. |
| `sotalol` | `caution` | `avoid` | Sửa ngưỡng chống chỉ định thận trong AF từ `30` lên `CrCl < 40 mL/phút` và dải giãn liều 1 lần/ngày `CrCl 40–60 mL/phút` (`acc.af.2023.sotalol_renal_40`, **AF-R2-05**); tránh cho con bú do cô đặc cao trong sữa mẹ (`esc.preg.2025.sotalol_pregnancy_lactation`); `qtRisk: "known"`. |
| `diltiazem` | `avoid` | `avoid` | Không khuyến cáo trong thai kỳ & cho con bú do độc tính phôi xương thực nghiệm (`esc.preg.2025.diltiazem_verapamil`, `fda.diltiazem.pregnancy_lactation`); thêm rule `af.rate.stop_diltiazem_pregnancy` phát lệnh `STOP` nếu thai phụ đang dùng (`af_49`); cấm khi `LVEF ≤ 40%`. |
| `verapamil` | `caution` | `caution` | Có thể cân nhắc đường uống kiểm soát tần số trong thai kỳ khi không dùng được chẹn beta (`esc.af.2024.pregnancy_rate_verapamil`); cấm khi `LVEF ≤ 40%`; giảm liều Dabigatran/Edoxaban dùng kèm. |

---

## 4. GIẢI TRÌNH CHI TIẾT TOÀN BỘ PHÁT HIỆN VÒNG 1 (R1, R2, R3) & QA-10

### 4.1 Nhóm Lỗi Critical & Major về An Toàn Lâm Sàng
- **AF-R1-01 / R3-AF-01 (Fail-closed LVEF ở nội viện RVR & ngoại trú):** Cả `af.inpatient.rvr_acute_rate_control`, `af.rate.missing_lvef`, và `af.rhythm.aad_selection` đều kiểm tra `ef === undefined` đầu tiên qua `need(ctx, 'lvef')` và trả về `missingInputRec('af', 'lvef', ...)`. Đồng thời kiểm tra tường minh `sbp === undefined` trong RVR nội viện trước khi truyền thuốc hạ nhịp.
- **AF-R1-02 / R3-AF-05 (Dừng thuốc chống loạn nhịp chống chỉ định):**
  - `af.rhythm.stop_class_ic_cad_hfref`: Phát lệnh `STOP` ngay `flecainide` / `propafenone` khi có CAD (`ascvd`/`vascularDisease`/`cad`), HCM, `LVEF ≤ 40%`, `CrCl < 35 mL/phút` (với Flecainide), hoặc `afType === 'permanent'`.
  - `af.rhythm.stop_dronedarone_contra`: Phát lệnh `STOP` ngay `dronedarone` khi `afType === 'permanent'` (PALLAS — `af_52`), `LVEF ≤ 40%`, `NYHA III–IV` (ANDROMEDA), hoặc `liverDisease`.
  - `af.rhythm.stop_sotalol_contra`: Phát lệnh `STOP` ngay `sotalol` khi `CrCl < 40 mL/phút` (`af_42`), `LVEF ≤ 40%`, `asthma`, hoặc `afType === 'permanent'`.
- **AF-R1-03 (HCM & Cardiac Amyloidosis Class I OAC):** Quy tắc `af.oac.hcm_amyloidosis_oac` chỉ định chống đông bắt buộc Class I bất kể điểm CHA₂DS₂-VA = 0 (`af_35`).
- **AF-R1-04 & R3-AF-03 & R3-AF-11 (Kiểm soát tần số trong HFrEF):**
  - `af.rate.stop_non_dhp_hfref` phát lệnh `STOP` đúng hoạt chất bệnh nhân đang dùng (`verapamil` hoặc `diltiazem`, `af_21`, `af_34`) mà không chặn quy tắc điều trị HFrEF.
  - `af.rate.reduced_lvef`: Ở nội viện RVR mất bù cấp chưa dùng chẹn beta, phát lệnh `DEFER` khởi trị mới chẹn beta uống cho tới khi hết sung huyết (**R3-AF-11**), trong khi `af.inpatient.rvr_acute_rate_control` kiểm soát nhịp cấp bằng Amiodarone IV / Digoxin IV (hoặc Digoxin ở thai kỳ).
- **AF-R1-05 (Hồ sơ Hoa Kỳ `US` — CHA₂DS₂-VASc):** Phân tầng chính xác theo ACC/AHA 2023 dùng 4 ngưỡng QA-10 `af.cha2ds2vasc.us_male_high` (2), `us_female_high` (3), `us_male_intermediate` (1), `us_female_intermediate` (2) (`af_38`).
- **AF-R1-06 & R3-AF-09 (Suy thận nặng `CrCl < 15 mL/phút`):** Quy tắc `af.oac.stop_doac_severe_renal` phát lệnh `STOP` DOAC đang dùng (`af_31`) kèm `profileDiff` phân biệt rõ ESC 2024 (không khuyến cáo DOAC) với ACC/AHA 2023 Class 2b (cân nhắc Warfarin hoặc Apixaban ở lọc máu chu kỳ, trích dẫn `acc.af.2023.esrd_dialysis_apixaban`).
- **AF-R1-07 & AF-R1-08 (Sửa trích dẫn nguyên văn sai lệch):** Đã thay thế và xác thực máy toàn bộ câu trích dẫn nguyên văn từ `esc_2024_af` (`esc.af.2024.cha2ds2va_score_0`, `esc.af.2024.oac_except_low_risk`, `esc.af.2024.diltiazem_dose`, `esc.af.2024.non_dhp_ccb_contra_lvef40`).
- **AF-R1-09 (Chuyển Warfarin sang DOAC khi `TTR < 70%`):** Quy tắc `af.oac.switch_vka_to_doac` phát lệnh `SWITCH` sang Apixaban khi `vkaTtr < 70%` ở bệnh nhân không van cơ học/hẹp hai lá (`af_44`).
- **AF-R1-10 / AF-R2-03 / AF-R2-11 (Cảnh báo Hộp đen Edoxaban `CrCl > 95 mL/phút`):** Hiển thị trong cả `title`, `rationale`, mảng `warnings` của khuyến cáo (`af_30`), dải thận `edoxaban.json` và cột thứ 5 `CrCl > 95 mL/phút` của ma trận `afMatrixDoacCrCl`.
- **AF-R2-01 & AF-R2-02 (An toàn Flecainide/Propafenone):** Chặn Flecainide khi `CrCl < 35 mL/phút` (`af_33`) và bắt buộc cảnh báo dùng kèm thuốc ức chế nút AV để ngừa cuồng nhĩ dẫn truyền 1:1.
- **AF-R2-06 (Khoảng hở số thực `CrCl 29.0–29.9` & `49.0–49.9 mL/phút`):** Hàm `resolveAfDoacDose` trong `src/modules/af/rulesHelpers.ts` xử lý biên liên tục `< 30` và `< 50` mL/phút (`af_50_apixaban_crcl_29_float_boundary.json`).
- **AF-R2-07 (Đối chiếu liều DOAC hiện tại của người bệnh):** Hàm `resolveDoacCurrentAction` đối chiếu `currentMed.dose` với liều đích: nếu đã dùng đúng liều giảm (ví dụ `apixaban 2.5 mg` khi thỏa ≥ 2/3 tiêu chí ABC) sẽ phát `CONTINUE` thay vì phát `REDUCE` sai (`af_51_apixaban_already_reduced_continue.json`); nếu đang giảm liều không đúng tiêu chuẩn sẽ phát `UPTITRATE` lên liều chuẩn.
- **R3-AF-02 (Bảo vệ thai kỳ toàn diện):** Chặn toàn bộ Warfarin/DOAC (`af.oac.pregnancy_safety`, `af_36`), Diltiazem (`af.rate.stop_diltiazem_pregnancy`, `af_49`), Amiodarone và Dronedarone ở phụ nữ mang thai.
- **R3-AF-04 (Đồng bộ cờ bệnh mạch máu):** Hàm `hasCoronaryOrVascularDisease` nhận diện cả `ascvd`, `vascularDisease` và `cad` (`af_37`).
- **R3-AF-06 (Cấp cứu ngoại trú khi mất ổn định huyết động / `SBP < 90 mmHg`):** Quy tắc `af.outpatient.unstable_refer_ed` phát lệnh `REFER` cấp cứu sốc điện đồng bộ ngay lập tức và `af.rate.hold_hypotension_or_bradycardia` tạm ngưng thuốc hạ nhịp đang dùng (`af_41`).
- **R3-AF-07 (Quản lý Warfarin & DOAC chu phẫu + Bắc cầu Heparin):** Quy tắc `af.inpatient.periprocedural_vka_hold` và `af.inpatient.periprocedural_doac_hold` hướng dẫn tạm ngừng Warfarin 5 ngày (bắc cầu Heparin chỉ khi van cơ học / hẹp hai lá / tiền sử đột quỵ, `af_43`) và tạm ngừng DOAC 1–4 ngày theo nguy cơ chảy máu & `CrCl` mà không gây xung đột `CONTINUE` vs `HOLD`.
- **R3-AF-08 (Không phát `AVOID` chống đông sau chuyển nhịp ở bệnh nhân CHA₂DS₂-VA = 0):** Ở nội viện có `afOnset` chuyển nhịp, bệnh nhân điểm 0 nhận hướng dẫn chống đông ngắn hạn 4 tuần quanh chuyển nhịp thay vì `AVOID`.
- **R3-AF-13 (An toàn gan Child-Pugh):** Quy tắc `af.oac.hepatic_safety` phát lệnh `STOP` ngay `rivaroxaban` trên nền bệnh gan (`af_45`) và yêu cầu phân độ Child-Pugh trước khi khởi trị DOAC.
- **AF-R1-11, AF-R1-12, AF-R1-13, AF-R2-09 (Preset 1 LVEF, TTE thường quy, bỏ số giả trong gates, tách liều uống/IV):** Đã hoàn tất 100%.

### 4.2 Tái cấu trúc Module & Chuẩn hóa 100% QA-10 (`thFor`)
- Tách `src/modules/af/` thành cấu trúc rõ ràng, dễ bảo trì:
  - `src/modules/af/rules.ts` (entrypoint điều phối AF-CARE `[C]`, `[A]`, `[R]`, Nội viện, `[E]`)
  - `src/modules/af/rulesHelpers.ts` (helpers an toàn kiểu, đối chiếu liều DOAC liên tục)
  - `src/modules/af/rulesOac.ts` (trụ cột `[A]` chống đông & an toàn thận/gan/thai kỳ/van tim)
  - `src/modules/af/rulesRateRhythm.ts` (trụ cột `[R]` kiểm soát tần số loại trừ tương hỗ & kiểm soát nhịp)
  - `src/modules/af/rulesInpatient.ts` (cấp cứu sốc điện, RVR theo EF, chuyển nhịp 24h, chu phẫu VKA/DOAC)
  - `src/modules/af/matrices.ts` & `src/modules/af/presets.ts`
- Toàn bộ truy xuất ngưỡng trong `src/modules/af/**` sử dụng 100% `thFor(expectedQuantity, id)` khớp chặt với 42 ngưỡng trong `kb/thresholds/af.json`.

---

## 5. KẾT LUẬN TRÌNH HỘI ĐỒNG VÒNG 2

Agent J2 xác nhận **đã khắc phục toàn bộ phát hiện Vòng 1 (R1, R2, R3), hoàn tất chuẩn hóa QA-10 và đồng bộ 12 hồ sơ thuốc sở hữu**, kiểm chứng tự động đạt 100% trên 52 ca chuẩn Golden Cases và 20.000 ca bất biến an toàn đa bối cảnh. Hồ sơ Module Rung nhĩ (`af`) **sẵn sàng trình Hội đồng thẩm định Vòng 2** xét duyệt độc lập.
