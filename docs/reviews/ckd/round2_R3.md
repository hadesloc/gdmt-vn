# Báo cáo Thẩm định Phản biện An toàn Độc lập — Vòng 2 (Round 2 · R3 Adversarial Safety Review): Module Bệnh thận mạn (`ckd`)

- **Vai trò thẩm định**: **R3 — Phản biện An toàn Lâm sàng (Adversarial Safety Reviewer)** (Độc lập Vòng 2; không đọc báo cáo Vòng 2 của R1/R2; không chỉnh sửa mã nguồn `src/**`, `kb/**`, `tests/**`).
- **Đối tượng kiểm thử**: Pipeline thực thi thật [`evaluate()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/evaluate.ts#L44-L167), [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts), [`rules.inpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.ts), [`merge.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/merge.ts), [`reviewMeds.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMeds.ts), [`duplicates.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/duplicates.ts), [`interactions.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/interactions.ts), [`derive.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/derive.ts) và KB [`kb/thresholds/ckd.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/ckd.json), [`kb/drugs/`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/finerenone.json).
- **Kịch bản kiểm thử thực nghiệm**: **130 kịch bản bệnh nhân đối kháng** chạy trực tiếp qua `npx vite-node` (**53 kịch bản hồi quy Vòng 1** `ADV_CKD_01..50` + biến thể profile `VN`/`US` và **77 kịch bản mới Vòng 2** `R2_ADV_01..77`).
  - Script kiểm thử: [round2_r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_adversarial.ts)
  - Kết quả đầu ra đầy đủ (18.301 dòng): [round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts)
  - Dữ liệu JSON chuẩn schema `REVIEW_PROTOCOL.md`: [round2_R3.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/round2_R3.json)
- **Kết luận Vòng 2 (Verdict)**: **FAIL** (`5 Critical`, `7 Major`, `3 Minor`, `2 Suggestion`).

---

## 1. Tóm tắt Điều hành & Thống kê Phát hiện

| Mức độ (`severity`) | Số lượng | Mã phát hiện | Tác động an toàn lâm sàng cốt lõi |
|---|---:|---|---|
| **Critical** | **5** | `CKD-R2-R3-01` .. `05` | (1) Bỏ lọt **Finerenone đang uống trên BN chạy thận nhân tạo** có Cr sau lọc làm `eGFR >= 15`; (2) Bỏ lọt hoàn toàn **Indomethacin** trong AKI nội viện & Triple Whammy + bỏ sót `STOP` Ibuprofen khi dùng cùng **Torsemide** hoặc AKI qua `baselineScr`; (3) **Fail-open khởi trị SGLT2i** khi thiếu `sbp` (`passed: true`); (4) **Toan chuyển hóa nặng ngoại trú `HCO3- = 7 mmol/L`** không chuyển Cấp cứu mà chỉ kê viên uống Bicarbonat + khởi trị SGLT2i; (5) Ép **đích HA `< 120 mmHg` ở phụ nữ mang thai** & báo **"Đạt mục tiêu kiểm soát" ở sốc `SBP = 78 mmHg`** kèm kê mới thuốc mạn tính giữa cơn sốc / `K+ >= 6.0`. |
| **Major** | **7** | `CKD-R2-R3-06` .. `12` | (6) **Tăng liều Perindopril vượt trần liều thận** ở CKD G4 (`eGFR = 22.7`) và khi `egfr = undefined` (`scr = 260`); (7) Vẫn kê **Finerenone cho HFrEF (`LVEF <= 40%`)** khi chưa bật tab `hf` (chưa dứt điểm `R3-CKD-07`); (8) Xung đột đa module biến **Jardiance đang uống thành `[AVOID]`** + khuyên dùng Dapagliflozin, sinh thẻ rác `[AVOID] CHỐNG CHỈ ĐỊNH PHỐI HỢP`, tự `SWITCH` Losartan sang ARNI ở HFpEF (`LVEF = 55%`) kèm cảnh báo giả `dup.rasi_arni`, và `lipid` kê mới Statin trên BN lọc máu; (9) Kê **RASi cho CKD G3aA2 không ĐTĐ không THA (`SBP = 118`)** kèm sai trích dẫn A3; (10) Mạo nhận **Statin 1A Rec 3.15.1.1 khi `egfr = undefined`**, thiếu `missingInputRec` cho `age`/`sex`, không tính được `egfrCys` đơn độc; (11) Lỗ hổng **AKI nội viện với Furosemide**, nội viện `K+ = 5.1–5.5` rỗng khuyến cáo, chưa gắn `drugId` K+-binder nội viện (`R3-CKD-15`), câu gate sai `"K+ 5.2 >= 6.5"`; (12) `ACTION_PRIORITY['AVOID'] > 'STOP'` **hạ cấp lệnh `STOP` thuốc độc thai nhi đang uống thành `AVOID`** + bắn cảnh báo tương tác giả trên thuốc đã `STOP`/`HOLD`. |
| **Minor** | **3** | `CKD-R2-R3-13` .. `15` | Trùng lặp thẻ ngừng thuốc gộp tên nhiều thuốc vào 1 `drugId`; nhãn `BYT 2024 / ESC 2026` hiển thị nhầm ở profile `US` + thiếu luật `CONTINUE` cho Finerenone / Statin lọc máu; ngưỡng truyền dịch dự phòng cản quang `eGFR < 60` quá rộng cho CT tĩnh mạch thường quy ở G3a. |
| **Suggestion** | **2** | `CKD-R2-R3-16` .. `17` | Đồng bộ dự phòng `customInputs.pregnant` vào `hasCondition`; rút gọn chuỗi `fmtDose` quá dài trên `title`. |
| **Tổng cộng** | **17** | | **FAIL** (theo chuẩn `0 critical, 0 major` của `docs/REVIEW_PROTOCOL.md`) |

---

## 2. Kiểm toán Hồi quy Vòng 1 (Round 1 Regression Audit)

Toàn bộ 50 kịch bản phá vỡ của R3 Vòng 1 (`ADV_CKD_01..50` + biến thể `VN`/`US`) đã được chạy lại nguyên bản trên mã nguồn sau sửa đổi:

| Mã Vòng 1 | Nội dung lỗi Vòng 1 | Kịch bản kiểm chứng | Trạng thái Vòng 2 | Ghi chú kiểm chứng thực nghiệm |
|---|---|---|---|---|
| **R3-CKD-01 / 02** | Thai kỳ khởi trị SGLT2i/Finerenone/Statin & không `STOP` thuốc độc phôi thai đang uống | `ADV_CKD_31`, `ADV_CKD_32`, `R2_ADV_11..16` | **MỘT PHẦN (FAIL phụ)** | Đã chặn khởi trị mới ở thai kỳ (`ADV_CKD_31`) và đã sinh `STOP` ở ngoại trú chỉ bật `ckd` (`R2_ADV_12`). **NHƯNG**: vẫn ép đích `SBP < 120 mmHg` trong thai kỳ (`CKD-R2-R3-05`), và khi bật kèm `lipid` hoặc ở nội viện AKI (`R2_ADV_13`, `R2_ADV_16`), `AVOID` đè mất `STOP` trên thuốc đang uống (`CKD-R2-R3-12`). |
| **R3-CKD-03** | Nội viện `K+ >= 6.0` hoặc ngoại trú `K+ >= 6.0` thiếu xử trí khẩn | `ADV_CKD_20..24`, `R2_ADV_32..37` | **MỘT PHẦN (FAIL phụ)** | Đã có `STOP` RASi/MRA + `REFER` cấp cứu ở ngoại trú `K+ >= 6.0`. **NHƯNG** ngoại trú `K+ = 6.0–6.6` vẫn đồng thời kê mới `[START] Dapagliflozin + Atorvastatin` (`CKD-R2-R3-05`), nội viện nhận thẻ `"CHUYỂN CẤP CỨU KHẨN CẤP"`, và `ADV_CKD_24` in sai `"K+ 5.2 >= 6.5"` (`CKD-R2-R3-11`). |
| **R3-CKD-04** | Phối hợp kép 2 MRA (`Spironolactone + Finerenone`) | `ADV_CKD_37`, `R2_ADV_18`, `R2_ADV_21` | **ĐÃ SỬA (PASS)** | Không bao giờ kê đồng thời 2 MRA; nếu BN đang uống sẵn cả hai (`ADV_CKD_37`), phát `[STOP] Finerenone` + cảnh báo đỏ `dup.mra`. |
| **R3-CKD-05** | Đang dùng kép ACEi + ARB vừa báo `STOP` vừa báo `UPTITRATE` | `ADV_CKD_35`, `R2_ADV_23` | **ĐÃ SỬA (PASS)** | Đã chặn hoàn toàn `rasi_uptitrate` và `rasi_monitoring` khi đang dùng kép ACEi + ARB hoặc ACEi/ARB + ARNI (`STOP` dứt khoát thuốc trùng). |
| **R3-CKD-06** | Ngoại trú `K+ = 5.6` không `HOLD` RASi/MRA; `SBP = 82` vẫn `START` SGLT2i | `ADV_CKD_18`, `ADV_CKD_19`, `ADV_CKD_25`, `R2_ADV_29`, `R2_ADV_38` | **ĐÃ SỬA (PASS)** | `K+ = 5.6` đã `HOLD` cả RASi lẫn Finerenone + `START` K+-binder; `SBP = 82` hoặc `78` đã chặn `START` SGLT2i/RASi và `HOLD` thuốc hạ áp đang dùng. |
| **R3-CKD-07** | HFrEF đang dùng ARNI bị khuyên thêm ACEi; HFrEF bị kê Finerenone | `ADV_CKD_36`, `R2_ADV_17`, `R2_ADV_19`, `R2_ADV_20` | **CHƯA TRIỆT ĐỂ (FAIL)** | Đã bảo vệ tốt ARNI không bị lùi về ACEi (`R2_ADV_17`). **NHƯNG** khi HFrEF (`LVEF = 28%–30%`) chưa bật tab `hf` (`R2_ADV_19`, `R2_ADV_20`), `finerenone_indication` vẫn kê `[START] Finerenone` (`CKD-R2-R3-07`)! |
| **R3-CKD-08** | Thiếu `sbp` (`sbp = undefined`) bị Fail-open | `ADV_CKD_28`, `R2_ADV_06` | **CHƯA SỬA (FAIL)** | `rasi_initiate` đã fail-closed (`DEFER`), nhưng `sglt2i_initiate` vẫn fail-open `[START] Dapagliflozin` với `passed: true` (`CKD-R2-R3-03`)! |
| **R3-CKD-09** | Liều Perindopril khởi trị chưa giảm theo mức lọc cầu thận G3b–G4 | `ADV_CKD_05`, `R2_ADV_59` | **MỘT PHẦN (FAIL chuẩn độ)** | Khởi trị mới ở `eGFR < 45` đã giảm liều (`2.5 mg cách ngày` ở G4). **NHƯNG** luật tăng liều `rasi_uptitrate` lại quên trần thận, ép tăng Perindopril 5 mg lên 10 mg ở `eGFR = 22.7` (`CKD-R2-R3-06`)! |
| **R3-CKD-10** | Nội viện AKI chỉ phát 1 thẻ `HOLD` chung làm sót `drugId` các thuốc ngày ốm khác; Triple Whammy NSAID | `ADV_CKD_38..41`, `R2_ADV_59..67` | **MỘT PHẦN (FAIL NSAID/Diuretic)** | Đã tách `hold_aki_<drugId>` cho từng thuốc SGLT2i/RASi/MRA/Metformin và `STOP` Meloxicam/Ibuprofen + Furosemide. **NHƯNG** bỏ lọt hoàn toàn `Indomethacin`, sai chính tả `torasemide` vs `torsemide`, bỏ sót `hasScrRise` ở `avoid_nsaids` (`CKD-R2-R3-02`), và bỏ ngỏ `Furosemide` trong AKI (`CKD-R2-R3-11`). |
| **R3-CKD-11** | `SBP = 112` có `UACR = 120` (A3) không khởi trị RASi; Statin tuổi 18–49 | `ADV_CKD_42`, `ADV_CKD_45` | **ĐÃ SỬA (PASS)** | Đã khởi trị RASi khi `SBP >= 100` có A3 và phân tầng Statin 18–49 tuổi có ĐTĐ/ASCVD (2A). |
| **R3-CKD-13 / 14** | Lọc máu định kỳ `eGFR < 15` chặn SGLT2i/Statin mới; K+-binder theo profile VN vs INTL/US | `ADV_CKD_11..12`, `ADV_CKD_47_VN/US` | **MỘT PHẦN (FAIL Finerenone HD)** | Lọc máu ở `eGFR < 15` hoạt động đúng, K+-binder phân biệt đúng `Kayexalate/Kalimate` (VN) vs `Patiromer` (INTL/US). **NHƯNG** nếu sau buổi chạy thận `scr` giảm làm `eGFR >= 15` (`R2_ADV_10`), `Finerenone` đang uống bị bỏ lọt hoàn toàn (`CKD-R2-R3-01`)! |
| **R3-CKD-15** | Nội viện hạ kali bằng SZC/Kayexalate chưa gắn `drugId` để kích hoạt cảnh báo cách liều uống 2 giờ | `ADV_CKD_21`, `ADV_CKD_22`, `R2_ADV_36`, `R2_ADV_37` | **CHƯA SỬA (FAIL)** | Dù `round1_RESPONSE.md` ghi đã sửa, `rules.inpatient.ts` vẫn không gắn `drugId` cho chất gắn kali trong nội viện (`CKD-R2-R3-11`). |

---

## 3. Kết quả Quét Biên Toàn diện Vòng 2 (Boundary & Comorbidity Sweep Matrix)

### 3.1. Kiểm thử Fail-Closed khi Thiếu Dữ liệu (`R2_ADV_01` .. `R2_ADV_09`)

| Thông số bị thiếu (`undefined`) | Kịch bản | Hành vi thực tế của `evaluate()` | Đánh giá |
|---|---|---|---|
| `scr = undefined` (`cystatinC` trống) | `ADV_CKD_27`, `R2_ADV_01` | Chặn SGLT2i/RASi/Finerenone, phát `missing_input_scr`. **Lỗi**: vẫn `[START] Atorvastatin` gán cứng `1A Rec 3.15.1.1` (yêu cầu `eGFR < 60`) dù chưa biết `eGFR`. | **FAIL (`CKD-R2-R3-10`)** |
| `scr = undefined`, **đã có `cystatinC = 1.8 mg/L`** | `R2_ADV_02` | `derive.ts:35` chặn không tính `egfrCys` khi thiếu `scr` -> `egfr = undefined`, vẫn đòi nhập `scr`! | **FAIL (`CKD-R2-R3-10`)** |
| `age = undefined` hoặc `sex = undefined` (có `scr = 175–260`) | `R2_ADV_03`, `R2_ADV_09` | `egfr = undefined`; **0 thẻ `missingInputRec` cho `age`/`sex`**; ở `R2_ADV_09` (`scr = 260`) vẫn **`[UPTITRATE] Perindopril` mù quáng**! | **FAIL (`CKD-R2-R3-06`, `10`)** |
| `uacr = undefined` | `R2_ADV_04` | Phát `missing_input_uacr`; ĐTĐ2 `eGFR = 51.6` vẫn khởi trị SGLT2i 1A hợp lệ, chặn Finerenone. | **PASS** |
| `k = undefined` | `ADV_CKD_26`, `R2_ADV_05` | Phát `missing_input_k`; cả `rec_ckd_rasi_start` và `rec_ckd_finerenone_start` đều fail-closed về `DEFER` (`passed: false`). | **PASS** |
| `sbp = undefined` | `ADV_CKD_28`, `R2_ADV_06` | `rec_ckd_rasi_start` -> `DEFER`, **nhưng `rec_ckd_sglt2i_start` FAIL-OPEN -> `[START] Dapagliflozin` với `passed: true` (`"Chưa có số đo HA"`)**; thiếu `missing_input_sbp`. | **FAIL (`CKD-R2-R3-03`)** |
| `hco3 = undefined` | `R2_ADV_07` | Không tự ý kê Natri Bicarbonat. | **PASS** |

### 3.2. Quét Biên Kali máu `K+`, Huyết áp `SBP`, Mức lọc cầu thận `eGFR`, Bicarbonat `HCO3-`

| Trục thông số | Các mốc đã quét thực nghiệm | Kết quả kiểm chứng trên `evaluate()` |
|---|---|---|
| **`K+` (mmol/L)**<br>`4.8, 5.0, 5.1, 5.5, 5.6, 6.0, 6.6` | `R2_ADV_24..37`, `ADV_CKD_14..24` | - `4.8`: Cho phép `UPTITRATE` Finerenone 10 -> 20 mg (`PASS`).<br>- `5.0`: Cho phép `START` RASi & Finerenone, **không** `UPTITRATE` Finerenone (`PASS`, nhưng đang dùng Finerenone 10 mg thiếu thẻ `CONTINUE`).<br>- `5.1` & `5.5`: Ngoại trú chặn khởi trị mới (`DEFER` Finerenone), nếu đang dùng RASi/MRA thì phát `START` K+-binder để duy trì (`PASS`); **Nội viện `K+ = 5.1` (`R2_ADV_34`) trả về rỗng `[]` (`FAIL - CKD-R2-R3-11`)**.<br>- `5.6`: Ngoại trú `HOLD` cả Perindopril & Finerenone + `START` K+-binder (`PASS` an toàn, bị trùng tiêu đề thẻ `CKD-R2-R3-13`).<br>- `6.0` & `6.6`: `STOP` khẩn RASi/MRA + `REFER` cấp cứu, **nhưng ngoại trú vẫn phát `[START] Dapagliflozin + Atorvastatin + Amlodipine` ngay giữa cấp cứu ngừng tim (`FAIL - CKD-R2-R3-05`)**. |
| **`SBP` (mmHg)**<br>`78, 92, 100, 118, 135` | `R2_ADV_38..45`, `ADV_CKD_25, 42, 46` | - `78` (Sốc): `HOLD` Perindopril/Dapagliflozin/Finerenone + `REFER` sốc, **nhưng `rec_ckd_bp_target` báo `[CONTINUE] passed: true "Huyết áp hiện tại 78 mmHg: Đạt mục tiêu kiểm soát"` + vẫn kê `[START]` Statin/Semaglutide/Metformin (`FAIL - CKD-R2-R3-05`)**.<br>- `92`: Chặn khởi trị mới (`DEFER` RASi), không tăng liều RASi (`PASS`), nhưng vẫn `UPTITRATE` Finerenone và báo `"Đạt mục tiêu kiểm soát"`.<br>- `100`: Đạt ngưỡng tối thiểu cho phép `START` RASi & SGLT2i khi có chỉ định A3/ĐTĐ (`PASS`).<br>- `118`: Chưa đạt ngưỡng THA — ở BN **không ĐTĐ, không THA, UACR = 15 (A2)** (`R2_ADV_41`) vẫn tự động **`[START] Perindopril` kèm trích dẫn A3 (`FAIL - CKD-R2-R3-09`)**.<br>- `135`: Khởi trị / tăng liều RASi + SGLT2i + báo chưa đạt đích HA ở cả `INTL` và `VN`/`US` (`PASS`). |
| **`eGFR` (mL/min/1.73m²)**<br>`12 (HD-/HD+), 19.2, 20.1, 24.3, 25.4, 29.5, 30.5, 44.3, 66.9` | `R2_ADV_10`, `R2_ADV_46..52`, `R2_ADV_69..76` | - `12–13.1` (`onDialysis = false`): Chặn SGLT2i/Finerenone/Metformin/GLP-1 RA, `REFER` Thận (`PASS`).<br>- `12–13.1` (`onDialysis = true`): `ckd` chặn Statin mới, **nhưng bật kèm `lipid` (`R2_ADV_47`) bị kê `[START] Atorvastatin liều cao` (`FAIL - CKD-R2-R3-08`)**; nếu sau lọc máu `eGFR = 26` (`R2_ADV_10`), **`Finerenone` đang uống bị bỏ lọt hoàn toàn (`FAIL - CKD-R2-R3-01`)**.<br>- `19.2`: Chặn khởi trị mới SGLT2i & Finerenone (`R2_ADV_69`); nếu đang dùng sẵn SGLT2i thì `CONTINUE` đúng KDIGO PP 3.7.1 (`R2_ADV_70`) (`PASS`).<br>- `20.1` & `22.7`: Cho phép `START` SGLT2i, chặn Finerenone (`R2_ADV_71`); **nhưng ở `eGFR = 22.7` đang dùng `Perindopril 5 mg` (`R2_ADV_49`) lại phát `[UPTITRATE]` vượt trần thận G4 (`FAIL - CKD-R2-R3-06`)**.<br>- `24.3` vs `25.4`: `24.3` chặn `START` Finerenone (`R2_ADV_72`), `25.4` cho phép `START` Finerenone 10 mg (`R2_ADV_73`) (`PASS`).<br>- `29.5` vs `30.5` & `44.3`: `29.5` bắt buộc `STOP` Metformin + `REFER` Thận (`R2_ADV_74`); `30.5` & `44.3` không ĐTĐ UACR A1 khởi trị đúng SGLT2i nhóm 2B Rec 3.7.3 (`R2_ADV_75`, `R2_ADV_76`) (`PASS`).<br>- `66.9` (G2): UACR = 12 không khởi trị SGLT2i (`R2_ADV_50`), UACR = 45 khởi trị SGLT2i 1A (`R2_ADV_51`) (`PASS`). |
| **`HCO3-` (mmol/L)**<br>`7, 15, 22` | `R2_ADV_53..58` | - `7` (Nội viện `R2_ADV_57`): Kích hoạt đúng `CHỈ ĐỊNH LỌC MÁU CẤP CỨU` (`PASS`).<br>- **`7` (Ngoại trú `R2_ADV_53`): `0` lệnh chuyển Cấp cứu, chỉ kê viên uống Bicarbonat 500 mg + `[START] Dapagliflozin` (`FAIL - CKD-R2-R3-04`)**.<br>- `15`: Ngoại trú chưa dùng -> `START` Bicarbonat (`R2_ADV_54`); đang dùng -> `UPTITRATE` 2–4 g/ngày (`R2_ADV_55`) (`PASS`).<br>- `22`: Không kê Bicarbonat (`R2_ADV_56`) (`PASS`). |

---

## 4. Chi tiết 17 Phát hiện Vòng 2 (Kèm Bằng chứng Thực nghiệm & Hướng sửa)

### Nhóm CRITICAL (5 phát hiện — Gây nguy cơ tổn hại trực tiếp nếu làm theo)

#### `[CKD-R2-R3-01]` (CRITICAL · `drug` · `finerenone`) — Bỏ lọt hoàn toàn Finerenone đang uống ở bệnh nhân chạy thận nhân tạo định kỳ có Creatinin sau lọc máu làm `eGFR >= 15`
- **Bằng chứng thực nghiệm (`R2_ADV_10`, [round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L7511-L7646))**:
  - **Input**: Nam 63 tuổi, `conditions: { ckd: true, dm: true, onDialysis: true }`, xét nghiệm máu sau buổi lọc máu `scr = 240 µmol/L` (hệ thống tự tính `eGFR = 26 mL/phút/1.73m²`), `K+ = 4.9 mmol/L`, `currentMeds: [finerenone 10 mg, dapagliflozin 10 mg, metformin 1000 mg]`.
  - **Output `evaluate()`**: `metformin` nhận lệnh `[STOP]`, `dapagliflozin` nhận lệnh `[AVOID]`, riêng **`finerenone` hoàn toàn biến mất (`0` khuyến cáo, `0` cảnh báo)** — đồng nghĩa bác sĩ/bệnh nhân mặc nhiên duy trì Finerenone trên nền chạy thận nhân tạo!
- **Nguyên nhân gốc trong mã nguồn**:
  1. [`kb/drugs/finerenone.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/finerenone.json#L155-L177) thiếu mục `{"code": "dialysis"}` trong mảng `contraindications` (trong khi `dapagliflozin.json` và `metformin.json` đều có).
  2. [`reviewMeds.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMeds.ts#L670-L693) chỉ chặn `drugId === 'finerenone' && egfr !== undefined && egfr < 15`, quên kiểm tra `hasCondition({ normalized: patient }, 'onDialysis')`. Ở bệnh nhân chạy thận định kỳ, nồng độ Creatinin lấy sau lọc máu hoặc ở người suy kiệt cơ rất thường xuyên cho con số công thức CKD-EPI `>= 15–25`.
- **Đề xuất sửa (`suggestedFix`)**: Bổ sung `{"code": "dialysis", ...}` vào `kb/drugs/finerenone.json` và thêm điều kiện `|| hasCondition({ normalized: patient }, 'onDialysis')` tại `reviewMeds.ts:670`.

---

#### `[CKD-R2-R3-02]` (CRITICAL · `rule` · `ckd.outpatient.avoid_nsaids`) — Bỏ lọt hoàn toàn Indomethacin trong AKI nội viện & Triple Whammy; hạ cấp sai lệnh `STOP` Ibuprofen khi dùng cùng Torsemide hoặc AKI qua `baselineScr`
- **Bằng chứng thực nghiệm**:
  1. **`R2_ADV_61` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L16011-L16121))**: CKD G3a (`eGFR = 46.3`) kèm Gout đang uống `indomethacin 50 mg` -> **`0` lệnh `AVOID`/`STOP`**.
  2. **`R2_ADV_62` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L16123-L16262))**: Bộ ba độc thận kinh điển `Losartan 50 mg + Furosemide 40 mg + Indomethacin 50 mg` -> `alerts` phát cảnh báo đỏ `ix.triple_whammy`, nhưng **`recommendations` có `0` lệnh `STOP` Indomethacin**, lại còn phát **`[UPTITRATE] Losartan`** và **`[START] Dapagliflozin`**!
  3. **`R2_ADV_67` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L16969-L17004))**: Bệnh nhân **nội viện đang AKI Giai đoạn 1** (`scr = 165`, `baselineScr = 95`, `akiSuspected = true`) đang uống `indomethacin 50 mg` -> **`0` lệnh `STOP` Indomethacin ngay trong đợt suy thận cấp**!
  4. **`R2_ADV_63` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L16265-L16420))**: `Losartan 50 mg + Torsemide 10 mg + Ibuprofen 400 mg` -> `alerts` nổ `ix.triple_whammy`, nhưng `avoid_nsaids` chỉ phát `[AVOID]` thay vì `[STOP]` vì [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L34-L35) gõ cứng `'torasemide'` lệch với ID chuẩn `'torsemide'` trong KB!
  5. **`R2_ADV_77` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L18234-L18300))**: Nội viện `scr = 180, baselineScr = 95` (`eGFR = 36.7`) đang uống `Ibuprofen 400 mg` -> `aki_staging` báo AKI Giai đoạn 1 và `hold_sick_day` tạm ngừng Losartan, nhưng [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L1380) quên kiểm tra `hasScrRise` nên chỉ phát `[AVOID]` thay vì `[STOP]` Ibuprofen!
  6. **`R2_ADV_64` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L16423-L16556))**: Tích `customInputs.takingNsaid = true` + `Losartan + Furosemide` -> `0` thẻ khuyến cáo ngừng NSAID.
- **Đề xuất sửa (`suggestedFix`)**: Truy vấn nhóm thuốc trực tiếp qua `getNormalizedDrugClasses(id).has('nsaid')` (bao gồm `indomethacin`) và `diuretic` / `loop_diuretic` / `thiazide_diuretic` (bao gồm cả `'torsemide'` và `'torasemide'`); bắt cả `customInputs.takingNsaid`; dùng chung hàm `isAkiActive(ctx)` có kiểm tra `baselineScr` với `rules.inpatient.ts`.

---

#### `[CKD-R2-R3-03]` (CRITICAL · `rule` · `ckd.outpatient.sglt2i_initiate`) — Vi phạm bất biến Fail-Closed khi thiếu `sbp` (`sbp = undefined`): vẫn phát `[START] Dapagliflozin` với cổng an toàn xanh `passed: true`
- **Bằng chứng thực nghiệm (`ADV_CKD_28` dòng 3574 & `R2_ADV_06` [round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L7083-L7102))**:
  - **Input**: `sbp: undefined, dbp: undefined, scr: 160 (eGFR = 41.3), k: 4.5, uacr: 50`.
  - **Output `evaluate()`**: `rec_ckd_rasi_start` chuyển đúng sang `DEFER` (`passed: false`), trái lại `rec_ckd_sglt2i_start` trả về **`action: "START", drugId: "dapagliflozin"`** kèm gate `{ parameter: "SBP", passed: true, messageVi: "Chưa có số đo HA" }`!
- **Nguyên nhân gốc**: Tại [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L103): `const passedSbp = sbp === undefined || sbp >= minSbp;` cho phép `sbp === undefined` vượt cổng an toàn huyết động.
- **Đề xuất sửa (`suggestedFix`)**: Đổi thành `const passedSbp = sbp !== undefined && sbp >= minSbp;` để chuyển về `DEFER` khi thiếu HA, đồng thời bổ sung `missingInputRec('ckd', 'sbp', ...)`.

---

#### `[CKD-R2-R3-04]` (CRITICAL · `rule` · `ckd.outpatient.metabolic_acidosis`) — Toan chuyển hóa nặng đe dọa tính mạng ở ngoại trú (`HCO3- = 7 mmol/L`) không có lệnh chuyển Cấp cứu mà chỉ kê viên uống Natri Bicarbonat + khởi trị SGLT2i
- **Bằng chứng thực nghiệm (`R2_ADV_53`, [round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L15182-L15310))**:
  - **Input**: Ngoại trú, `scr = 185 (eGFR = 34.4), k = 4.9, sbp = 126, hco3 = 7 mmol/L, uacr = 30`.
  - **Output `evaluate()`**: Kê `Natri Bicarbonat 500 mg x 2–3 lần/ngày (uống)` (`priority: 75`), **`[START] Dapagliflozin 10 mg`**, **`[UPTITRATE] Losartan`**, và **`0` thẻ `REFER` chuyển Cấp cứu**! (Trong khi ở nội viện `R2_ADV_57`, cùng `HCO3- = 7 mmol/L` kích hoạt ngay `CHỈ ĐỊNH LỌC MÁU CẤP CỨU` vì `HCO3- < 12 mmol/L`).
- **Đề xuất sửa (`suggestedFix`)**: Bổ sung Red Flag chuyển Cấp cứu khẩn cấp (`action: 'REFER', priority: 100`) khi `hco3 < 12 mmol/L` ở ngoại trú và tạm hoãn khởi trị mới SGLT2i / tăng liều RASi khi đang toan chuyển hóa nặng mất bù.

---

#### `[CKD-R2-R3-05]` (CRITICAL · `rule` · `ckd.outpatient.bp_target`) — Ép đích huyết áp `< 120 mmHg` trong thai kỳ; báo `"Đạt mục tiêu kiểm soát"` khi sốc `SBP = 78 mmHg` và vẫn kê mới thuốc mạn tính giữa cơn cấp cứu (`SBP < 80` hoặc `K+ >= 6.0`)
- **Bằng chứng thực nghiệm**:
  - **Thai kỳ (`ADV_CKD_31`, `ADV_CKD_32`, `R2_ADV_11..14`, [round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L7734-L7746))**: Phát `[UPTITRATE] Đích huyết áp tâm thu < 120 mmHg (KDIGO 2021/2024)` trên phụ nữ mang thai (`SBP = 136–148 mmHg`), gây nguy cơ giảm tưới máu nhau thai.
  - **Sốc tụt huyết áp (`R2_ADV_38` dòng 12994 & `R2_ADV_43` [round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L13798-L13835))**: Tại `SBP = 78 mmHg`, `rec_ckd_bp_target` xuất `action: "CONTINUE", passed: true, messageVi: "Huyết áp hiện tại 78 mmHg: Đạt mục tiêu kiểm soát"`, kèm `[START] Atorvastatin` + `[START] Semaglutide` + `[START] Metformin`!
  - **Cấp cứu tăng kali `K+ = 6.0–6.6 mmol/L` ngoại trú (`R2_ADV_32`, `R2_ADV_33`, dòng 12018 & 12217)**: Vừa phát `REFER` cấp cứu ngừng tim vừa kê đơn mới `[START] Dapagliflozin 10 mg` + `[START] Atorvastatin` + `[START] Amlodipine`.
- **Đề xuất sửa (`suggestedFix`)**: Loại trừ thai kỳ khỏi đích `< 120 mmHg` tại [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L922-L947), thêm cận dưới an toàn `sbp >= 90–100 mmHg` cho `isTargetMet`, và tạm hoãn (`DEFER`) khởi trị thuốc dự phòng mạn tính khi bệnh nhân ngoại trú đang có Red Flag cấp cứu (`sbp < 90 || k >= 6.0 || hco3 < 12`).

---

### Nhóm MAJOR (7 phát hiện — Sai hướng dẫn / Sai liều thận / Xung đột đa module / Sót hồi quy Vòng 1)

#### `[CKD-R2-R3-06]` (MAJOR · `rule` · `ckd.outpatient.rasi_uptitrate`) — Tăng liều Perindopril vượt quá trần liều thận ở CKD G4 (`eGFR = 22.7`) và khi thiếu tuổi làm `egfr = undefined` (`scr = 260 µmol/L`)
- **Bằng chứng (`R2_ADV_49` dòng 14767 & `R2_ADV_09` dòng 7423)**: Tại `eGFR = 22.7` đang uống `Coversyl (Perindopril) 5 mg/ngày`, [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L512-L534) chỉ đối chiếu `target.amount = 10 mg` mà bỏ qua `renalBand` trong [`kb/drugs/perindopril.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/perindopril.json#L48-L65) (`CrCl 30–60`: tối đa `5 mg/ngày`; `CrCl 15–30`: `2.5 mg cách ngày`), nên ra lệnh `[UPTITRATE]` lên `10 mg/ngày`. Ở `R2_ADV_09` (`scr = 260, age = undefined`), dù chưa tính được `eGFR` vẫn ra lệnh `[UPTITRATE] Perindopril`.
- **Đề xuất sửa**: Bắt buộc `egfr !== undefined` trong `rasi_uptitrate` và kiểm tra trần liều theo dải thận của hoạt chất RASi đang dùng trước khi cho phép `UPTITRATE`.

#### `[CKD-R2-R3-07]` (MAJOR · `rule` · `ckd.outpatient.finerenone_indication`) — Chưa khắc phục triệt để `R3-CKD-07`: vẫn kê `[START] Finerenone` cho bệnh nhân HFrEF (`LVEF = 28%–30%`) khi người dùng chưa bật tab `hf`
- **Bằng chứng (`R2_ADV_19` dòng 9425 & `R2_ADV_20` dòng 9540)**: Bệnh nhân có `LVEF = 30%, NYHA II` đang dùng `Sacubitril/Valsartan 100 mg` (chỉ bật module `ckd`) hoặc `LVEF = 28%` đang dùng `Enalapril 10 mg` (bật `ckd + dm2`) vẫn bị kê `[START] Finerenone 10 mg` do [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L640-L661) không kiểm tra `ctx.normalized.lvef <= 40`.
- **Đề xuất sửa**: Thêm `if (ctx.normalized.lvef !== undefined && ctx.normalized.lvef <= 40) return false;` trong `finerenone_indication` (ưu tiên MRA steroid giảm tử vong Class IA ở HFrEF).

#### `[CKD-R2-R3-08]` (MAJOR · `rule` · `merge.resolveClassConflicts`) — Xung đột đa module biến Jardiance đang uống thành `[AVOID]`, sinh thẻ rác `[AVOID] CHỐNG CHỈ ĐỊNH PHỐI HỢP`, tự `SWITCH` Losartan sang ARNI ở HFpEF kèm `dup.rasi_arni` giả, và `lipid` kê mới Statin trên bệnh nhân lọc máu
- **Bằng chứng**:
  1. `ADV_CKD_48` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L5839-L5891)): Đang uống `Empagliflozin 10 mg (Jardiance)` + `Sacubitril/Valsartan`, bật `ckd + dm2 + hf` -> xuất **`[AVOID] CHỐNG CHỈ ĐỊNH PHỐI HỢP: Jardiance`** + **`[CONTINUE] Duy trì Dapagliflozin`**!
  2. `R2_ADV_22` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L10060-L10190)): HFpEF (`LVEF = 55%`) đang uống `Losartan 100 mg` -> tự phát `SWITCH` sang `Sacubitril/Valsartan` + nổ cảnh báo đỏ giả `dup.rasi_arni` (`losartan + Sacubitril / Valsartan`) + thẻ rác `[AVOID] Spironolactone`.
  3. `ADV_CKD_36`, `ADV_CKD_49`, `R2_ADV_17`, `R2_ADV_18`, `R2_ADV_21`: Xuất các thẻ `[AVOID] CHỐNG CHỈ ĐỊNH PHỐI HỢP: Losartan / Perindopril / Finerenone` (với `gates: passed: true`) đứng đầu danh sách cho các thuốc bệnh nhân chưa hề dùng.
  4. `R2_ADV_47` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L14482-L14496)): Đang lọc máu định kỳ chưa dùng Statin, bật `ckd + dm2 + lipid` -> `lipid` kê mới `[START] Atorvastatin liều cao` trái KDIGO 2024 Rec 3.15.2.
- **Đề xuất sửa**: Trong [`merge.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/merge.ts#L284-L458), bảo toàn hoạt chất cùng nhóm bệnh nhân đang dùng hợp lệ trong `currentMeds` (như `empagliflozin`); ẩn ứng viên thua cuộc chưa có trong `currentMeds` thay vì biến thành thẻ `AVOID`; loại thuốc bị `SWITCH` khỏi `effectiveActiveDrugs` tại [`duplicates.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/duplicates.ts#L345); và chặn khởi trị mới Statin tiên phát trên bệnh nhân `onDialysis` ở module `lipid`.

#### `[CKD-R2-R3-09]` (MAJOR · `rule` · `ckd.outpatient.rasi_initiate`) — Tự động `[START] Perindopril` ở bệnh nhân CKD không ĐTĐ, huyết áp bình thường (`SBP = 118/74 mmHg`), chỉ có UACR A2 (`15 mg/mmol`) và gắn sai trích dẫn A3
- **Bằng chứng (`R2_ADV_41`, [round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L13425-L13456))**: Không ĐTĐ, không THA (`SBP = 118`), `UACR = 15 mg/mmol` -> phát `[START] Perindopril` kèm trích dẫn `kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm` (vốn chỉ dành cho A3 `>= 30 mg/mmol`; KDIGO 2024 Rec 3.6.2 mức 2C cho A2 không ĐTĐ yêu cầu kèm THA hoặc cân nhắc cá thể hóa).
- **Đề xuất sửa**: Tách điều kiện `rasi_initiate` tại [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L295-L299) đúng theo 3 khuyến cáo KDIGO 2024 (Rec 3.6.1 A3 1B, Rec 3.6.2 A2+HTN 2C, Rec 3.6.3 DM+A2/A3 1B).

#### `[CKD-R2-R3-10]` (MAJOR · `rule` · `ckd.outpatient.statin_indication`) — Gán sai Statin 1A Rec 3.15.1.1 khi `egfr = undefined`; thiếu `missingInputRec` cho `age`/`sex`; không tính được `egfrCys` đơn độc khi thiếu `scr`
- **Bằng chứng**: `ADV_CKD_27`, `R2_ADV_01..03`, `R2_ADV_08..09` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L6473-L6770)). Tại [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.ts#L1298-L1308), khi `egfr === undefined` hệ thống mặc định gán `1A (KDIGO 2024 Rec 3.15.1.1)` (yêu cầu `eGFR < 60`); thiếu `age`/`sex` không sinh `missingInputRec`; và [`derive.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/derive.ts#L35) chặn tính `egfrCys` khi `scr === undefined`.
- **Đề xuất sửa**: Yêu cầu xác định `egfr` trước khi gán Rec 3.15.1.1 vs 3.15.1.2, thêm `missingInputRec` cho `age`/`sex`, và cho phép tính `egfrCys` độc lập trong `derive.ts`.

#### `[CKD-R2-R3-11]` (MAJOR · `rule` · `ckd.inpatient.hold_sick_day_meds`) — Bỏ ngỏ Furosemide trong AKI nội viện đa thuốc (và bị HF phát `[CONTINUE]` giữa AKI); nội viện `K+ = 5.1–5.5` rỗng khuyến cáo; chưa thực thi `R3-CKD-15`; lỗi chuỗi gate `"K+ 5.2 >= 6.5"` và thẻ chuyển viện ở nội trú
- **Bằng chứng**:
  1. `R2_ADV_65` & `R2_ADV_66` ([round2_r3_results.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/scratch/round2_r3_results.ts#L16558-L16875)): Ca trọng tâm `Metformin + Dapagliflozin + Losartan + Furosemide + Ibuprofen` vào viện vì AKI Giai đoạn 2 (`scr = 230` từ nền `95`, `SBP = 96 mmHg`) -> `ckd` bỏ trống `furosemide`, còn bật kèm `hf` thì phát thẳng `[CONTINUE] Duy trì liều Furosemide` (`priority: 98`) bất chấp AKI do Triple Whammy!
  2. `R2_ADV_34` (dòng 12361): Nội viện `K+ = 5.1` đang uống `Losartan + Finerenone` -> `recs: []`.
  3. `ADV_CKD_24` (dòng 3113): Gate in sai `"K+ 5.2 mmol/L >= 6.5"`; `ADV_CKD_21/22` & `R2_ADV_36/37`: thiếu `drugId` chất gắn kali nội viện và vẫn phát thẻ `"CHUYỂN CẤP CỨU KHẨN CẤP"` cho bệnh nhân nội trú.
- **Đề xuất sửa**: Thêm quy tắc đánh giá dịch / `HOLD` lợi tiểu trong AKI trước thận/Triple Whammy, thêm xử trí `K+ = 5.1–5.9` nội viện, gắn `drugId` chất gắn kali, sửa câu gate tại [`rules.inpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.ts#L273) và tùy biến tiêu đề `checkEmergencyRedFlags` khi `setting === 'inpatient'`.

#### `[CKD-R2-R3-12]` (MAJOR · `rule` · `merge.ACTION_PRIORITY`) — `AVOID` ghi đè làm mất lệnh `STOP` trên thuốc độc thai nhi / chống chỉ định bệnh nhân ĐANG UỐNG; cảnh báo tương tác giả trên thuốc đã `STOP`/`HOLD`
- **Bằng chứng**: `R2_ADV_13` (dòng 8053), `R2_ADV_16` (dòng 8591), `R2_ADV_65` (dòng 16592) — thuốc bệnh nhân đang uống (`Atorvastatin`, `Perindopril`, `Dapagliflozin`, `Finerenone`, `Metformin`) bị đổi từ `STOP` thành `AVOID` do `ACTION_PRIORITY['AVOID'] (100) > 'STOP' (90)`. Đồng thời ở `R2_ADV_14`, `R2_ADV_16`, `R2_ADV_66`, `R2_ADV_68`, `dapagliflozin` đã `STOP`/`HOLD` nhưng vẫn nổ cảnh báo tương tác hạ đường huyết với Insulin mới khởi trị.
- **Đề xuất sửa**: Chuẩn hóa mọi lệnh chặn cứng trên thuốc thuộc `currentMeds` thành `STOP` (`NGỪNG NGAY`), và loại trừ thuốc đã `STOP`/`HOLD` khỏi tập kiểm tra tương tác với thuốc mới khởi trị tại [`interactions.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/interactions.ts#L293-L300).

---

### Nhóm MINOR (3 phát hiện) & SUGGESTION (2 phát hiện)

- **`[CKD-R2-R3-13]` (MINOR · `ckd.outpatient.hyperkalemia_hold_rasi_mra`)**: Gán `drugId: heldMeds[0]?.drugId` cho thẻ gộp nhiều thuốc giữ kali (`R2_ADV_29`, `R2_ADV_32`) và trùng thẻ tổng hợp không `drugId` trong thai kỳ / cấp cứu tăng kali (`R2_ADV_12`, `R2_ADV_32`).
- **`[CKD-R2-R3-14]` (MINOR · `ckd.outpatient.bp_target`)**: Profile `US` vẫn hiện tiêu đề `(BYT 2024 / ESC 2026)` (`ADV_CKD_46_US`); thiếu giải thích tăng liều RASi vì đạm niệu khi HA đã đạt đích; thiếu luật `CONTINUE` cho Finerenone đang dùng ổn định (`R2_ADV_24..26, 70`) và Statin đang dùng khi vào lọc máu (`R2_ADV_48`).
- **`[CKD-R2-R3-15]` (MINOR · `ckd.contrast.egfr_risk_threshold`)**: Ngưỡng `eGFR < 60` (`R2_ADV_68`, `eGFR = 50.8`) phát `[START]` truyền dịch 24 giờ cho mọi ca chụp cản quang là quá rộng so với đồng thuận ACR/ESUR/KDIGO (`< 30` cho cản quang TM thường quy).
- **`[CKD-R2-R3-16]` (SUGGESTION · `conditions.pregnant`)**: Đọc dự phòng `customInputs.pregnant` trong `hasCondition` (`R2_ADV_15`).
- **`[CKD-R2-R3-17]` (SUGGESTION · `fmtDose_title_verbosity`)**: Rút gọn tiêu đề `fmtDose` dài > 220 ký tự ở Finerenone/Dapagliflozin (`R2_ADV_45`, `R2_ADV_73`).

---

## 5. Kết luận Thẩm định Vòng 2

- **Tổng số phát hiện**: `5 Critical` · `7 Major` · `3 Minor` · `2 Suggestion` (Tổng: **17 phát hiện**).
- **Phán quyết cuối cùng**: **FAIL** (chưa đạt tiêu chuẩn `0 critical, 0 major` của `docs/REVIEW_PROTOCOL.md`; cần khắc phục dứt điểm 5 lỗi Critical và 7 lỗi Major trước khi bước sang Vòng 3).
