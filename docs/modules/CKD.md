# GDMT-VN – Báo Cáo Chuyên Môn Module Bệnh Thận Mạn (CKD)

*Tác giả: Agent E / Agent E2 / Agent E3 / Agent E4 / Agent E5 – Chuyên gia Thận học & Kỹ sư Module CKD*  
*Phiên bản: 5.0 (Post-Round-4 Comprehensive Remediation & `< 20 KB` Modular Architecture Release)*  
*Cập nhật: 28/10/2026*  

---

## 1. Phạm Vi Lâm Sàng & Mục Tiêu

Module **Bệnh Thận Mạn (Chronic Kidney Disease – CKD)** hỗ trợ bác sĩ lâm sàng tối ưu hóa phác đồ điều trị nội khoa chuẩn y học chứng cứ (Guideline-Directed Medical Therapy – GDMT) cho người trưởng thành (≥ 18 tuổi) mắc bệnh thận mạn ở mọi giai đoạn:

- **Phân loại toàn diện & Cổng xác nhận chẩn đoán theo KDIGO 2024:** Kết hợp 6 dải mức lọc cầu thận ước tính (`G1`: ≥90, `G2`: 60–89, `G3a`: 45–59, `G3b`: 30–44, `G4`: 15–29, `G5`: <15 mL/phút/1.73m²; tích hợp cả `eGFRcr` và `eGFRcr-cys` kèm gợi ý xét nghiệm Cystatin C xác nhận ở `G3aA1` — KDIGO 2024 Rec 1.2.2.1, **Grade 1C**) và 3 mức albumin niệu (`A1`: <3, `A2`: 3–30, `A3`: >30 mg/mmol). Áp dụng vị từ xác nhận bằng chứng CKD (`hasConfirmedCkdEvidence`) để ngăn điều trị quá mức (`Statin`, đích `HA < 120 mmHg`, `Sick-day`) trên bệnh nhân tầm soát có chức năng thận bình thường `G1–G2 A1`.
- **Tích hợp hạ tầng an toàn chuẩn hóa cấp Engine (Round 4):**
  - **Bộ phân tích tổng liều ngày Fail-Closed (`parseCurrentDailyDoseMg` + `doseParser.ts`):** Nhân chính xác tần suất dùng thuốc (`2–4 lần/ngày`, `BID`/`TID`/`QID`, `cách ngày`, `1 lần/tuần`, `ngày lọc máu`) cho cả thuốc đơn chất và viên phối hợp liều cố định (FDC); tự động chặn Fail-Closed (`DEFER` Finerenone / không tăng liều mù) khi chuỗi liều tự do không phân tích được ra mg/ngày.
  - **Phân rã viên phối hợp liều cố định (`fdcMap.ts`):** Nhận diện đầy đủ từng hoạt chất thành phần trong FDC (`empagliflozin_metformin`, `dapagliflozin_metformin`, `sitagliptin_metformin`, `amlodipine_perindopril`, `valsartan_amlodipine`, `telmisartan_amlodipine`, `losartan_hctz`, `irbesartan_hctz`, `perindopril_indapamide`, ...) để kiểm tra chống chỉ định `Metformin` khi `eGFR < 30` / toan chuyển hóa / tiêm cản quang (đồng thời chuyển cầu nối sang SGLT2i đơn chất), chống chỉ định thai kỳ, AKI, tăng kali máu và phối hợp kép hệ RAA.
  - **An toàn Cho con bú (`lactation`) & Dị ứng đặc hiệu (`allergy`):** Chặn `STOP`/`AVOID` đối với thuốc chống chỉ định hoặc tránh dùng khi cho con bú (`Statin`, `SGLT2i`, `Finerenone`, `ARB`, `Semaglutide`) và tự động chuyển hướng sang `Enalapril` tương thích cho con bú; kiểm tra đầy đủ `allergyAceiArb` (cả thuốc đang dùng lẫn kê mới), `priorAngioedema` (cấm tuyệt đối ACEi/ARNI; cho phép cân nhắc thận trọng ARB kèm giám sát) và danh sách dị ứng hoạt chất/nhóm thuốc của bệnh nhân.
  - **Bất biến hiển thị an toàn liều (`dose: undefined`):** Mọi thẻ khuyến cáo mang hành động `STOP`, `AVOID`, `HOLD`, `DEFER` hoặc `REFER` đều được đảm bảo `dose === undefined` và tiêu đề phản ánh đúng lý do an toàn.

- **Hai bối cảnh lâm sàng chuyên biệt (`outpatient` & `inpatient`):**
  - **Ngoại trú (Outpatient):**
    1. `SGLT2i` (`Dapagliflozin`, `Empagliflozin`, `Canagliflozin`): khởi trị `Dapagliflozin`/`Empagliflozin` khi `eGFR ≥ 20`; tách biệt chuẩn nhãn FDA `Invokana` (`Canagliflozin` không khởi trị mới khi `eGFR < 30`, chỉ duy trì `100 mg/ngày` nếu đã dùng ở ĐTĐ2 có albumin niệu `> 300 mg/ngày`); `HOLD` khẩn cấp khi toan chuyển hóa nặng (`HCO₃⁻ < 12 mmol/L`) hoặc nghi ngờ DKA; `DEFER` quanh thủ thuật cản quang nguy cơ cao.
    2. `RASi` (`ACEi` / `ARB`): tách biệt dược động học **ARB thải trừ qua gan–mật** (`Losartan` khởi đầu `25 mg` khi có suy gan nhẹ–vừa trong nhánh chọn thuốc hiện hành; `Candesartan` không nằm trong danh sách tự chọn khởi trị, nhưng thuốc đang dùng được rà soát và chuẩn độ theo đáp ứng/dung nạp, không áp trần duy trì giả tạo `16 mg/ngày` ở `Child-Pugh B`; `Telmisartan` giới hạn trần `≤ 40 mg/ngày` ở `Child-Pugh A/B` và chỉ `STOP`/`AVOID` ở `Child-Pugh C` hoặc tắc mật; `Candesartan` & `Sacubitril/Valsartan` `STOP` ở `Child-Pugh C`) với **ACEi thải trừ qua thận**; bổ sung cổng `STOP`/`AVOID` cho hẹp động mạch thận hai bên xác định, `DEFER` thăm dò Doppler khi có tiếng thổi động mạch thận (`renalBruit`), `STOP` khi phối hợp với chất ức chế trực tiếp Renin (`Aliskiren`), và `HOLD` ngay khi `Creatinin tăng > 30%` so với nền (KDIGO 2024 PP 3.6.3 / Figure 24).
    3. `nsMRA Finerenone`: chặn tuyệt đối (`STOP`/`AVOID`) khi suy tuyến thượng thận (`adrenalInsufficiency`), dùng chất ức chế CYP3A4 mạnh, `HFrEF`, `CKD G5`, lọc máu hoặc `Child-Pugh C`; tự động `DEFER` khi RASi hiện tại đang vượt trần thận/gan hoặc `SCr tăng > 30%`; hạ bậc từ `START` xuống `CONSIDER` ở vùng xám `4.8 < K⁺ ≤ 5.0 mmol/L` (FDA Kerendia Section 2.2) và đính kèm cảnh báo theo dõi `K⁺` trong 4 tuần khi dùng kèm chất ức chế CYP3A4 trung bình (`Diltiazem`, `Verapamil`, `Fluconazole`, `Erythromycin`, `Amiodarone`).
    4. `GLP-1 RA Semaglutide tiêm dưới da`: bảo vệ tim–thận theo thử nghiệm FLOW (ESC 2026 Bảng 12 **Class I, Level A**; ADA 2026 **Rec 11.7b**) và cầu nối ở `CKD G4 (15 ≤ eGFR < 25)`; tích hợp cổng `STOP`/`AVOID` cho tiền sử **MTC / MEN 2**, **viêm tụy cấp**, **cho con bú**, **dị ứng** và giảm liều **Sulfonylurea / Insulin**.
    5. `Statin`: bao phủ KDIGO 2024 Rec 3.15.1.1 (**1A** — statin hoặc phối hợp `statin + ezetimibe` ở `G3a–G5 ≥ 50 tuổi`), Rec 3.15.1.2 (**1B**), Rec 3.15.1.3 (**2A** — người trưởng thành 18–49 tuổi có ĐTĐ, ASCVD, đột quỵ hoặc **nguy cơ biến cố mạch vành 10 năm > 10%**), và ghép thận trưởng thành (ESC 2026 Bảng 10 **Class IIa-B**); áp trần thận `Rosuvastatin ≤ 10 mg/ngày` ở `CKD G4–G5` và trên bệnh nhân lọc máu chu kỳ (không `CONTINUE` liều `20–40 mg`); chặn `AVOID` khi đang dùng `Gemfibrozil` hoặc `Cyclosporine`.
    6. **Huyết áp, Toan kiềm & Điện giải ngoại trú:** Loại trừ bệnh nhân lọc máu chu kỳ khỏi mục tiêu `SBP < 120 mmHg` ở mọi hồ sơ; áp mục tiêu nới lỏng `< 140/90 mmHg` cho người suy yếu (`frailty`), hạ HA tư thế (`orthostaticHypotension`), kỳ vọng sống hạn chế hoặc `≥ 85 tuổi`; chuyển cấp cứu nội viện (`REFER`) và `HOLD` toàn bộ thuốc giữ kali ngay khi tăng kali ngoại trú (`K⁺ > 5.0`) kèm biến đổi ECG (`ecgHyperkalemia`); chỉ định đúng liều `Lokelma (SZC) 5 g x 1 lần/ngày vào ngày không lọc máu` trên bệnh nhân thận nhân tạo chu kỳ; chặn `Calcium Polystyrene Sulfonate` khi có tắc ruột/liệt ruột/tăng canxi máu; tích hợp đầy đủ `KFRE 2 năm (> 10% & > 40% — bảo tồn tĩnh mạch chi trên làm AVF)` và `KFRE 5 năm (≥ 5%)`.
  - **Nội viện (Inpatient):** Phân độ KDIGO AKI Stage 1–3, `HOLD` từng thuốc ngày ốm (bao gồm FDC), kiểm chứng `POC K⁺` trước khi kích hoạt phác đồ hạ kali cấp cứu UKKA 2022 (`DEFER` khí máu tại giường nếu thiếu `K⁺`, `MONITOR` loại trừ STEMI tối cấp nếu `K⁺ ≤ 5.0`, chỉ tiêm `Calcium Gluconate` tĩnh mạch ngay khi có biến đổi ECG hoặc `K⁺ > 7.0` ở hồ sơ `VN`), xử trí toan chuyển hóa nội viện lấp kín dải `HCO₃⁻ 8.0–17.9 mmol/L` (bù bicarbonat tĩnh mạch khi `HCO₃⁻ ≤ 10 mmol/L`), dự phòng `CI-AKI` mở rộng cho cả nội trú và ngoại trú (`setting: 'both'`) kèm y lệnh độc lập `HOLD Metformin` quanh thủ thuật cản quang.

---

## 2. Kiến Trúc Mô-đun Hóa `< 20 KB` (`src/modules/ckd/` & `tests/modules/ckd/`)

Toàn bộ mã nguồn module `ckd` được tổ chức thành **30 tệp `.ts` chuyên biệt** và bộ kiểm thử đơn vị gồm **4 tệp `.ts` độc lập**, đảm bảo **100% tệp có dung lượng nghiêm ngặt `< 20,480` bytes (`< 20 KB`)**:

| Nhóm chức năng | Tệp mã nguồn (`src/modules/ckd/`) | Nội dung trách nhiệm |
|---|---|---|
| **Đăng ký & Siêu dữ liệu UI** | `index.ts`, `inputs.ts`, `presets.ts`, `pathway.ts`, `matrix.ts` | Khai báo `ckdModule`, trường đầu vào lâm sàng (bổ sung `adrenalInsufficiency`, `bilateralRenalArteryStenosis`, `bowelObstruction`, `dkaSuspected`, `contrastRouteIntraArterial`, `statin10yCvRiskPct`), 4 presets, lưu đồ 4 trụ cột và Ma trận Bằng chứng 18 thuốc (tách ghi chú lọc máu ARB vs ACEi, Canagliflozin G4 & SZC ngày không lọc máu) |
| **Tiện ích Dùng chung** | `helpers.drugs.ts`, `helpers.conditions.ts`, `helpers.ts` | Phân rã FDC (`fdcMap`), nhận diện Aliskiren/CYP3A4/Gemfibrozil, `parseCurrentDailyDoseMg` (`doseParser`), `hasConfirmedCkdEvidence`, `hasExcessiveRasiCreatinineRise` (`> 30%`), `getKfre2y`/`getKfre5y`, cổng suy gan/cho con bú/dị ứng/cấp cứu |
| **Tổng hợp Quy tắc** | `rules.ts` | Hợp nhất toàn bộ phân hệ quy tắc ngoại trú, liên bối cảnh (`both`) và nội viện |
| **An toàn Cấp cứu & Chống chỉ định** | `rules.outpatient.safety.ts`, `rules.outpatient.safety_extra.ts`, `rules.outpatient.rasi_safety.ts` | Thai kỳ & cho con bú (kể cả FDC), dị ứng thuốc/nhóm RASi, sốc/tụt HA, tăng K⁺ ngoại trú kèm biến đổi ECG (`REFER` + `HOLD`), AKI ngoại trú, suy gan Child-Pugh A/B/C (`Telmisartan`, `Candesartan`, `ARNI`), phối hợp kép RAA + `Aliskiren`, và `HOLD` RASi khi `SCr tăng > 30%` |
| **4 Trụ cột & Statin** | `rules.outpatient.sglt2i.ts`, `rules.outpatient.rasi.ts`, `rules.outpatient.rasi_titration.ts`, `rules.outpatient.finerenone.ts`, `rules.outpatient.finerenone_titration.ts`, `rules.outpatient.finerenone_safety.ts`, `rules.outpatient.glp1ra.ts`, `rules.outpatient.statin.ts` | Khởi trị, cầu nối FDC sang đơn chất, chuẩn độ, trần liều thận/gan, vùng xám `K⁺ 4.9–5.0`, CYP3A4 vừa, `Statin` người trẻ nguy cơ 10 năm `> 10%` / ghép thận và trần `Rosuvastatin ≤ 10 mg` ở G4–G5/lọc máu |
| **Huyết áp, Toan kiềm & K-binders** | `rules.outpatient.bp.ts`, `rules.outpatient.acidosis.ts`, `rules.outpatient.kbinders.ts` | Đích HA loại trừ lọc máu & nới lỏng ở suy yếu/`≥ 85 tuổi`, `HOLD` SGLT2i/Metformin khi `HCO₃⁻ < 12`, trần `NaHCO₃ 4000 mg/ngày`, `Lokelma 5 g` ngày không lọc máu & chặn `CPS` khi tắc ruột |
| **NSAID, Ngày ốm & Chuyển tuyến** | `rules.outpatient.nsaid_sickday.ts`, `rules.outpatient.referral_diagnostics.ts` | Chặn NSAID / Triple Whammy, giáo dục ngày ốm có kiểm chứng CKD/SADMAN, `KFRE 2 năm (> 10% / > 40%)` & `5 năm (≥ 5%)`, xác nhận Cystatin C `G3aA1` |
| **Nội viện & Thủ thuật Cản quang** | `rules.inpatient.aki.ts`, `rules.inpatient.hyperkalemia.ts`, `rules.inpatient.hyperkalemia_moderate.ts`, `rules.inpatient.acidosis.ts`, `rules.inpatient.rrt_contrast.ts` | Phân độ AKI 1–3, kiểm chứng `POC K⁺` & ECG theo UKKA 2022, xử trí toan nội viện `HCO₃⁻ 8–17.9 mmol/L`, chỉ định RRT cấp cứu và dự phòng `CI-AKI` + `HOLD Metformin` cho cả nội/ngoại trú |

---

## 3. Kết Quả Kiểm Định Toàn Diện (Post-Round-4)

```text
============================================================
         GDMT-VN CKD MODULE VERIFICATION SUMMARY            
============================================================
1. Modular File Size Gate (<20KB): ✔ ĐẠT 100% (30/30 tệp src + 4/4 tệp test < 20,480 bytes)
2. TypeScript Strict Typecheck:    ✔ ĐẠT (0 lỗi trên toàn bộ src/modules/ckd & tests/modules/ckd)
3. Verbatim Quote & KB Verify:     ✔ ĐẠT 100% (ckd | files: 30 | err: 0 | qaOk: 71 | litWarn: 0)
4. COR/LOE & Citation Attribution: ✔ ĐẠT 100% (Làm sạch COR/LOE cho Practice Points/Not Graded; 19 trích dẫn PDF mới)
5. Golden Cases Runner (CKD):      ✔ ĐẠT 100% (85/85 ca chuẩn CKD: ckd_01..ckd_84 + sample)
6. Property-Based Invariants:      ✔ ĐẠT 100% (0 vi phạm / 10.000 ca ngẫu nhiên, 23 bất biến an toàn)
7. Fail-Closed Missing Inputs:     ✔ ĐẠT 100% (0 vi phạm / 6.000 ca xóa scr, k, sbp, uacr, age, sex)
8. Evidence Matrix & Presets:      ✔ ĐẠT 100% (18 dòng phân tầng chuẩn FDA/KDIGO/BYT, 4 presets đúng setting)
============================================================
```

---

## 4. Giới Hạn Lâm Sàng & Lưu Ý Sử Dụng

1. **Đối tượng áp dụng:** Module dành cho người trưởng thành (`≥ 18 tuổi`). Ở phụ nữ mang thai hoặc đang cho con bú, hệ thống thực hiện chức năng **cảnh báo an toàn chủ động** (`STOP`/`AVOID` thuốc chống chỉ định và định hướng hoạt chất tương thích như `Enalapril` trong thời kỳ cho con bú) phối hợp hội chẩn chuyên khoa Sản – Thận.
2. **Phương trình KFRE:** Phương trình dự báo nguy cơ suy thận 4 biến (Tuổi, Giới, eGFR, UACR) được tính toán trực tiếp cho cả nguy cơ **2 năm** (`> 10%` chăm sóc đa chuyên khoa; `> 40%` bảo tồn tĩnh mạch chi trên & chuẩn bị đường vào lọc máu AVF/PD/ghép thận) và **5 năm** (`≥ 5%` chuyển khám chuyên khoa Thận học) ở giai đoạn `G3a–G5 (eGFR < 60 mL/phút/1.73m²)`.
3. **Miễn trừ trách nhiệm:** GDMT-VN là công cụ hỗ trợ quyết định lâm sàng dựa trên bằng chứng, không thay thế phán đoán chuyên môn trực tiếp của bác sĩ điều trị trên từng người bệnh cụ thể.


## Đính chính CL-02b — 28/10/2026

Nội dung mô tả khởi trị candesartan trong `round4_RESPONSE.md` và bản cũ của tài liệu này không khớp danh sách chọn thuốc thực tế. Rule khởi trị hiện chọn từ perindopril/enalapril/losartan/valsartan/lisinopril tùy bệnh cảnh, hoặc enalapril/captopril khi cho con bú; không tự chọn candesartan. CL-02b sửa tài liệu theo mã hiện có, không thêm một thuốc khởi trị mới.

Nhãn Atacand §2.1 (PDF4) cho dải liều người lớn 8–32 mg/ngày, giảm liều khởi đầu xuống8mg ở suy gan trung bình. Khởi liều thấp không tạo trần duy trì16mg; chuẩn độ thuốc đang dùng theo dung nạp, theo dõi HA/SCr/K sau2–4tuần. Giới hạn liều RASi theo thận/gan hiện được tính dùng chung với điều kiện bổ sung finerenone.

Hạ huyết áp tư thế chặn tăng RASi; phần mềm yêu cầu đánh giá và xác nhận mục “Đã đạt liều tối đa dung nạp của ACEi/ARB” khi huyết động ổn định. Cờ hạ huyết áp tư thế đơn lẻ không tự xác nhận liều tối đa dung nạp. Finerenone chỉ có thể khởi trị sau khi thỏa các cổng an toàn còn lại. Xem `docs/reviews/ckd/round5_R1_04_RESPONSE_20261028.md`; chưa clinical CLOSED.

### CL-02c — 29/10/2026

GLP-1 đang dùng được phân biệt hoạt chất/dạng/bằng chứng kết cục. Byetta dạng thường dùng CrCl (ADA≤30), Bydureon BCise dùng eGFR<45; lixisenatide dùng ADA eGFR≤30 thận trọng hơn nhãn<15. Chưa rõ dạng/CrCl/liều/lịch dùng → xác minh, không suy từ eGFR. Chuyển exenatide/lixisenatide sang semaglutide SC chỉ trong đường chỉ định và cổng an toàn hiện hành; không phối hợp hai GLP-1. Bút phối hợp insulin yêu cầu phác đồ insulin thay thế; không tự quy đổi liều. Semaglutide uống/tirzepatide không tự bị coi có FLOW hoặc bắt buộc chuyển; dulaglutide/liraglutide có tín hiệu thận chủ yếu albumin niệu/CVOT. Xem giải trình R5 R1-05; task chưa nghiệm thu lâm sàng.

### CL-02d — nguồn suy gan,29/10/2026

Telmisartan: trần40mg ở suy gan nhẹ–vừa theo EMA§4.2/PDF3; không dùng khi ứ mật/tắc mật/suy gan nặng theo§4.4/PDF4. Candesartan: FDAAtacand§2.1/PDF4 cho khởi đầu8mg ở THA+suy gan trung bình, không đưa liều khi suy gan nặng; SmPCAnh§4.3 cho chống chỉ định suy gan nặng/ứ mật. Nêu rõ chính sách thận trọng dựa SmPC cho cả ba profile, không gọi là chống chỉ định FDA. Bệnh gan chưa phân độ cần đánh giá thêm; không suy là A/B. Không giảm nửa mọi liều hoặc tạo trần duy trì16mg. Ba reviewstate draft; xem giải trình R1-06 và KB-HASH-01 trước reuse.
