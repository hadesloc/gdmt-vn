# Báo Cáo Thẩm Định An Toàn Lâm Sàng Độc Lập – Vòng 3 (Round 3)
## Vai trò: Reviewer R3 – Phản Biện Đối Kháng An Toàn Lâm Sàng (Adversarial Clinical Safety Tester)

- **Module thẩm định:** `lipid` – Rối loạn lipid máu & Dự phòng Tim mạch (`src/modules/lipid/*`, `src/engine/safety/*`, `kb/drugs/*`, `kb/thresholds/lipid.json`, `kb/interactions/*`)
- **Ngày thẩm định:** 27/10/2026
- **Tính độc lập:** Độc lập tuyệt đối 100% trong Vòng 3 (không đọc bất kỳ báo cáo `round3_R1*` hay `round3_R2*` nào; không chỉnh sửa mã nguồn hay KB).
- **Phương pháp kiểm thử:** Thiết kế và thực thi trực tiếp **113 kịch bản bệnh nhân đối kháng sống** (`96` kịch bản Lô 1 `A01–F86` + `17` kịch bản Lô 2 chuyên sâu `G87a–G98`) qua hàm `evaluate(patient, settings)` thật của engine trên cả 3 hồ sơ (`INTL`, `VN`, `US`), 2 môi trường (`outpatient`, `inpatient`) và 2 hệ đơn vị (`SI` vs `US`).
- **Kết luận thẩm định (Verdict):** **`FAIL`** *(7 Critical, 8 Major, 3 Minor, 1 Suggestion — tổng cộng 19 phát hiện có bằng chứng thực nghiệm)*

---

## 1. Tổng Quan Kết Quả Kiểm Thử Đối Kháng

| Mức độ nghiêm trọng (`severity`) | Số lượng | Ý nghĩa lâm sàng theo `docs/REVIEW_PROTOCOL.md` | Mã định danh Finding |
|---|---:|---|---|
| **Critical** | **7** | Có thể gây hại trực tiếp / đe dọa tính mạng bệnh nhân nếu bác sĩ làm theo khuyến cáo của engine | `LIPID-R3-R3-01` → `LIPID-R3-R3-07` |
| **Major** | **8** | Sai lệch guideline/liều trần, bỏ sót khuyến cáo Class I ở STEMI cấp, mâu thuẫn nội tại hoặc sai lệch đơn vị/UI nghiêm trọng | `LIPID-R3-R3-08` → `LIPID-R3-R3-15` |
| **Minor** | **3** | Thiếu tối ưu hóa ở ca biên đặc thù (Friedewald TG cao, chuyển tuyến thai kỳ nguy cơ cực cao, PK chủng tộc Châu Á ngoài profile VN) | `LIPID-R3-R3-16` → `LIPID-R3-R3-18` |
| **Suggestion** | **1** | Đề xuất tinh chỉnh cá thể hóa liều khởi đầu ở người rất cao tuổi (≥ 80 tuổi) suy yếu nặng kèm kỳ vọng sống ngắn | `LIPID-R3-R3-19` |
| **Tổng cộng** | **19** | **Kết luận bắt buộc (có ≥ 1 Critical / Major): `FAIL`** | |

### Tóm tắt 7 lỗ hổng An Toàn Nghiêm Trọng Nhất (`Critical`)
1. **`LIPID-R3-R3-01` – Lọt hoàn toàn phụ nữ đang cho con bú (`breastfeeding` / `lactation`):** Dù KB và tiêu đề luật ghi rõ *"Thai kỳ / cho con bú"*, mã nguồn chỉ kiểm tra `pregnant`, khiến bà mẹ sau sinh đang cho con bú không được ngừng `Atorvastatin`, `Ezetimibe`, `Fenofibrate` mà còn bị kê thêm `Evolocumab`, `Icosapent ethyl` hoặc khởi trị mới `Atorvastatin 40–80 mg` (`D49`, `D50`).
2. **`LIPID-R3-R3-02` – Mù hoàn toàn với viên phối hợp liều cố định FDC (`atorvastatin_ezetimibe`, `rosuvastatin_ezetimibe`, `simvastatin_ezetimibe`, `amlodipine_atorvastatin`):** Thai phụ đang uống `atorvastatin_ezetimibe` không nhận được lệnh `STOP` (`E59`); bệnh nhân uống `simvastatin_ezetimibe 40/10 mg + clarithromycin` bị bỏ lọt hoàn toàn chống chỉ định gây tiêu cơ vân tử vong với `alerts = []` và bị kê chồng thêm `Rosuvastatin` (`E60`); bệnh nhân CKD G4 uống `rosuvastatin_ezetimibe 20/10 mg` bị kê chồng thêm `Atorvastatin 40–80 mg` (`E58`, `E61`).
3. **`LIPID-R3-R3-03` – Xung đột ngược chiều làm NGỪNG SẠCH 100% Statin ở bệnh nhân ASCVD dùng trùng ≥ 2 Statin:** `lipid` cứng nhắc ngừng `statins[1]` theo thứ tự nhập mảng, trong khi `reviewMedsSpecialized.ts` ngừng statin có hoạt lực thấp hơn theo `STATIN_POTENCY_RANK`. Khi nhập `[pravastatin 40 mg, atorvastatin 40 mg]` (`G87b`) hoặc 3 statin (`E62`), hai engine cùng lúc phát lệnh `STOP` lên **TẤT CẢ các Statin**, tước bỏ hoàn toàn thuốc bảo vệ tim mạch của bệnh nhân ASCVD!
4. **`LIPID-R3-R3-04` – Xơ gan mất bù `Child-Pugh B / C` (`customInputs.childPugh`) bị kê liều tối đa `Atorvastatin 40–80 mg + Fenofibrate 145–200 mg + Ezetimibe + Bempedoic acid`:** AUC Atorvastatin tăng ~11 lần và Cmax tăng ~16 lần ở Child-Pugh B, nhưng cả Child-Pugh B (`B27`) lẫn suy gan giai đoạn cuối Child-Pugh C (`G88a`, `G88b`) đều lọt lưới 100% với `alerts = []`; ngược lại xơ gan còn bù `Child-Pugh A` (`B29`) lại bị chặn oan Statin.
5. **`LIPID-R3-R3-05` – Viêm tụy cấp do tăng Triglyceride đang diễn tiến (`acutePancreatitis: true`, `TG = 12.8–15.0 mmol/L`) bị kê đơn uống ngoại trú không chuyển viện cấp cứu, kê Statin uống khi đang NPO, hoặc trả về `0 khuyến cáo`:** Khám ngoại trú không có `REFER` cấp cứu (`B20`); nội viện đang nhịn ăn NPO vẫn phát `START atorvastatin 40–80 mg uống` (`B21`); đặc biệt nếu nhập viện vì viêm tụy cấp mà ở nhà đã có `Atorvastatin + Fenofibrate` (`B22`) thì engine trả về **`recommendations = []` (trắng tinh 0 hướng dẫn!)**.
6. **`LIPID-R3-R3-06` – Lọc máu chu kỳ (`onDialysis: true`) làm vô hiệu hóa trần thận FDA `≤ 10 mg/ngày` của `Rosuvastatin`:** Do điều kiện loại trừ sai `!safety.onDialysis`, bệnh nhân chạy thận nhân tạo đang uống `Rosuvastatin 40 mg/ngày` (`C40`) được lệnh `CONTINUE` nguyên liều độc cơ `40 mg/ngày` với `alerts = []` (mâu thuẫn trực tiếp với nhãn FDA Crestor và chính bảng `matrix.egfr.statin.ts` dòng 125 của module).
7. **`LIPID-R3-R3-07` – Bỏ sót tương tác `Paxlovid (nirmatrelvir_ritonavir)` + `Rosuvastatin 40 mg`:** Ritonavir ức chế OATP1B1/BCRP làm tăng 4 lần Cmax và 2 lần AUC Rosuvastatin (FDA giới hạn `≤ 10 mg/ngày`), nhưng ở `E68` engine cho duy trì `Rosuvastatin 40 mg` + thêm `Ezetimibe` với `alerts = []`.

---

## 2. Kiểm Chứng Hồi Quy Các Bản Vá Từ Vòng 2 (Positive Regressions Verified)

Trước khi đi vào các lỗi phát hiện mới, kết quả chạy thực nghiệm xác nhận nhiều bản sửa sau Vòng 2 của đội phát triển đã hoạt động **chính xác và vững chắc**:

| Hạng mục từng lỗi ở Vòng 2 | Kịch bản kiểm chứng Vòng 3 | Kết quả thực nghiệm Vòng 3 |
|---|---|---|
| Nội viện STEMI `<24h` thiếu `LDL-C` nền | `B13_Inpt_ACS_MissingLDL` | **PASS** – Khởi trị ngay `Atorvastatin 40–80 mg` + `MONITOR` bilan lipid trong 24h đầu. |
| Nội viện STEMI `<24h` kèm CKD G4 (`eGFR < 30`) | `B14_Inpt_ACS_CKDG4` | **PASS** – Ưu tiên `Atorvastatin 40–80 mg`, không gợi ý `Rosuvastatin 20–40 mg`. |
| Nội viện STEMI `<24h` đã dùng `Atorva 80 + Ezetimibe 10` chưa đạt đích | `B16_Inpt_ACS_MaxDual` | **PASS** – Bổ sung sớm `Evolocumab 140 mg q2w` ngay trong viện + `CONTINUE` nền đôi. |
| Độc tính cơ Fenofibrate ở `CK = 6.5x ULN` và `CK ≥ 10x ULN` | `B23`, `B24`, `B25`, `G97` | **PASS (về ngừng thuốc)** – Đã `HOLD` cả Statin lẫn Fenofibrate ở `6.5x ULN` và `STOP` cả hai + `REFER` cấp cứu ngay tại biên `10.0x ULN` (kể cả khi `CK = 9.99x` vs `10.0x` trong `G97`). |
| Tăng men gan cấp `ALT = 4.5x ULN` kèm CKD G4 + Fenofibrate | `B26`, `C37` | **PASS (về cảnh báo gan/thận)** – Không còn bị nuốt cảnh báo `ALT` khi đi kèm CKD nặng. |
| Trần thận `Pitavastatin ≤ 2 mg` (CKD G3a–G5D) & `Pravastatin ≤ 40 mg` (CKD G4–G5D) | `C35`, `C36`, `G89` | **PASS** – Đã phát `REDUCE` chuẩn xác ở cả CKD chưa lọc máu lẫn lọc máu. |
| Lọc máu chu kỳ không có ASCVD (4D / AURORA / KDIGO 2024) | `C38`, `C41`, `C44` | **PASS** – Không khởi trị mới Statin/Non-statin khi không có ASCVD; nếu đang dùng sẵn `Atorvastatin 20 mg` thì chỉ `CONTINUE`, không tự ý leo thang lên PCSK9i. |
| Tương tác `Simvastatin + Diltiazem/Verapamil/Dronedarone (≤ 10 mg)`, `Amlodipine/Amiodarone/Bempedoic (≤ 20 mg)`, `Ticagrelor + Rosuvastatin (≤ 20 mg)` trên viên đơn chất | `E69`, `E70`, `E71`, `E72`, `G91a` | **PASS** – Giữ đúng trần đơn chất; đặc biệt ở `G91a` (`Simva 40 + Verapamil + Ticagrelor`), khi chuyển sang Rosuvastatin engine đã tự khống chế trần `Rosuvastatin 20 mg/ngày`! |
| Tương tác xuất huyết `Fenofibrate + Warfarin` | `E74_Warfarin_Fenofibrate` | **PASS** – Đã có cảnh báo tương tác tăng INR và thẻ `rec_lipid_ddi_vka_inr_monitor`. |
| Bệnh nhân HIV ≥ 40 tuổi dùng phác đồ có `Ritonavir` (REPRIEVE) | `D57_HIV_Ritonavir` | **PASS** – Chọn chuẩn xác `Pitavastatin 4 mg/ngày` tránh tương tác CYP3A4. |
| Mục tiêu kép ESC (`< đích tuyệt đối` VÀ `giảm ≥ 50% so với baselineLdl`) + FH qua `dlcnScore ≥ 6` + Đích phụ `Non-HDL`/`ApoB` | `F86`, `G96`, `A09` | **PASS** – Khi `LDL = 1.35 < 1.4` nhưng mức giảm mới đạt `43.7% < 50%` so với `baselineLdl = 2.4` (`G96`), engine phát hiện đúng chưa đạt mục tiêu kép và tăng liều `Atorvastatin` lên `40–80 mg`! |
| Va chạm liên module (`lipid` + `ckd`, `dm2`, `hf`, `htn`, `af`, `gout`, `copd`, `asthma`) & Fail-closed thiếu `eGFR` | `F77`–`F85` | **PASS** – Suy tim HFrEF đơn thuần không bị ép nhầm thành ASCVD (`F77`); chạy chung `ckd`/`dm2` không sinh thẻ Statin trùng lặp (`F78`, `F79`); thiếu `scr`/`eGFR` khi `TG = 7.5 mmol/L` (`F84`) khóa an toàn không kê mù `Fenofibrate` mà phát `missing_input_egfr`. |

---

## 3. Ma Trận Toàn Bộ 113 Kịch Bản Đối Kháng Đã Thực Thi (`evaluate()`)

### Nhóm A – Presets, Chuyển Đổi Hệ Đơn Vị SI ↔ US, Ngưỡng Biên & Hồ Sơ `INTL / VN / US` (18 kịch bản)

| Mã KB | Hồ sơ / Môi trường | Đầu vào đối kháng chính | Kết quả `evaluate()` thực tế | Đánh giá |
|---|---|---|---|---|
| `A01`–`A05` (`x3` profiles = 15 lượt) | `INTL`, `VN`, `US` | Chạy toàn bộ 5 `lipidPresets` chuẩn với đúng `setting` thủ công | Preset 1–5 sinh phác đồ hợp lệ khi truyền tay `setting: 'inpatient'` cho Preset 1; `VN` ẩn Bempedoic acid hợp lý | **PASS** |
| `A06_UI_Preset1_Bug` | UI `AppShell.tsx` | Đang ở `inpatient`, chọn `lipid_preset_1_acs_inpatient` qua `applyPresetSelection` | Do thiếu `preset.setting`, UI bị ép ngược về `'outpatient'`, mất sạch 3 luật nội viện STEMI `<24h` | **FAIL** (`LIPID-R3-R3-09`) |
| `A07_US_Boundary_100mgdL` | `US` / `mg_dL` | ĐTĐ nguy cơ trung bình, `ldl = 100 mg/dL` (đích `< 100 mg/dL`), `ldl = 55 mg/dL` (đích `< 55 mg/dL`) | Đã sửa lỗi làm tròn Vòng 2: nhận diện đúng `100 mg/dL` và `55 mg/dL` là CHƯA đạt đích `< 100` / `< 55` | **PASS** |
| `A08_TopLevel_NonHdl_US` | `US` / `mg_dL` | Truyền `nonHdl: 135` (`mg/dL`) theo đúng `id: 'nonHdl'` trong `inputs.ts` | Không được quy đổi sang `mmol/L` → hiểu nhầm thành **`135 mmol/L` (~5.220 mg/dL)**! | **FAIL** (`LIPID-R3-R3-15`) |
| `A09_Secondary_ApoB_Discordance` | `INTL` / `SI` | ASCVD + ĐTĐ trên `Atorva 40`, `LDL = 1.25 < 1.4` nhưng `customInputs.nonHdl = 3.2`, `apob = 92` | Nhận diện bất tương hợp Non-HDL/ApoB và khuyên tối ưu hóa liệu pháp hạ ApoB | **PASS** |
| `A10_Lpa_US` | `US` / `mg_dL` | Phòng ngừa tiên phát trung bình, `customInputs.lpaNmol = 110 nmol/L` (`< 125` ngưỡng ACC 2026) | Bỏ quên `lipid.lpa.acc_risk_enhancing_nmol = 125`, dùng ngưỡng ESC `> 105` → nâng bậc Statin sai | **FAIL** (`LIPID-R3-R3-14`) |
| `A11_Extreme_Target_1_0` | `INTL` & `US` | Nhồi máu cơ tim tái phát trong 2 năm (`recurrentAcsWithin2Years: true`) trên `Atorva 80 + Eze 10`, `LDL = 1.2` | Kích hoạt đúng đích `< 1.0 mmol/L` (`< 40 mg/dL`) Class IIb, phát `CONSIDER evolocumab` | **PASS** |
| `A12_FH_DLCN_Score7` | `INTL` / `outpatient` | `dlcnScore: 7` (không tick `familialHypercholesterolemia`), `Atorva 80 + Eze 10`, `LDL = 2.3` | Đã sửa lỗi Vòng 2: nhận diện FH lâm sàng và phát `[START] evolocumab` + `CONTINUE` nền đôi | **PASS** |

### Nhóm B – Nội Viện ACS `<24h`, Viêm Tụy Cấp Tăng TG, Tiêu Cơ Vân, Xơ Gan Mất Bù, Nhược Cơ & Suy Giáp (20 kịch bản)

| Mã KB | Môi trường | Đầu vào đối kháng chính | Kết quả `evaluate()` thực tế | Đánh giá |
|---|---|---|---|---|
| `B13_Inpt_ACS_MissingLDL` | `inpatient` | STEMI `<24h`, `ldl: undefined` | `[START] atorvastatin 40–80 mg` + `[MONITOR]` xét nghiệm bilan lipid | **PASS** |
| `B14_Inpt_ACS_CKDG4` | `inpatient` | STEMI `<24h`, `scr: 260 µmol/L` (`eGFR ~ 21`), `ldl: 3.6` | `[START] atorvastatin 40–80 mg` + `[CONSIDER] ezetimibe 10 mg` (tránh Rosuva liều cao) | **PASS** |
| `B15_Inpt_ACS_PriorModStatin` | `inpatient` | STEMI `<24h`, đang dùng `Atorvastatin 20 mg`, `ldl: 2.4` | `[UPTITRATE] atorvastatin 40–80 mg` + `[START] ezetimibe 10 mg` | **PASS** |
| `B16_Inpt_ACS_MaxDual` | `inpatient` | STEMI `<24h`, đang dùng `Atorva 80 + Ezetimibe 10`, `ldl: 2.1` | `[START] evolocumab 140 mg q2w` + `[CONTINUE]` Atorva & Ezetimibe | **PASS** |
| `B17_ACS_Simva_Gemfibrozil` | `inpatient` | STEMI `<24h`, toa nhà `Simvastatin 20 mg + Gemfibrozil 600 mg`, `ldl: 3.4` | Chỉ `[STOP] gemfibrozil` + `[CONSIDER] ezetimibe ("cùng Statin cường độ cao")`, **0 lệnh đổi/tăng Simvastatin 20 mg**! | **FAIL** (`LIPID-R3-R3-08`) |
| `B18_Inpt_ACS_Rhabdo_CK14x` | `inpatient` | STEMI `<24h`, `ckUlnTimes: 14.0`, `ldl: 3.5` | Chặn an toàn Statin (`[AVOID] atorvastatin`) + `[REFER]` cấp cứu tiêu cơ vân | **PASS** |
| `B19_Inpt_ACS_ALT5x` | `inpatient` | STEMI `<24h`, `altUlnTimes: 5.2`, đang dùng `Atorva 40 + Eze 10` | `[HOLD] atorvastatin` + `[HOLD] ezetimibe` | **PASS** |
| `B20_Outpatient_AcutePancreatitis_OralTrap` | `outpatient` | Đang viêm tụy cấp `acutePancreatitis: true`, `tg: 14.2 mmol/L` (1257 mg/dL), `ldl: 3.9` | Kê đơn uống về nhà `START atorvastatin 40–80` + `START fenofibrate` + `CONSIDER ezetimibe`, **0 lệnh `REFER` cấp cứu / NPO**! | **FAIL** (`LIPID-R3-R3-05`) |
| `B21_Inpatient_AcutePancreatitis_NPO_Trap` | `inpatient` | Viêm tụy cấp nội viện đang NPO, `tg: 15.0 mmol/L`, `ldl: 3.6`, ASCVD | Vẫn phát ngay `[START] atorvastatin 40–80 mg uống` + `[START] fenofibrate uống` giữa pha NPO cấp | **FAIL** (`LIPID-R3-R3-05`) |
| `B22_Inpatient_AcutePancreatitis_ExistingOralMeds` | `inpatient` | Viêm tụy cấp nội viện `tg: 12.8 mmol/L`, ở nhà đang uống `Atorva 40 + Fenofibrate 145` | Trả về **`recommendations: []` (0 khuyến cáo!)** — mất trắng hướng dẫn cấp cứu NPO / Insulin / lọc huyết tương | **FAIL** (`LIPID-R3-R3-05`) |
| `B23_CK_Rhabdo_15x` | `outpatient` | ASCVD đang dùng `Atorva 80 + Fenofibrate 145`, `ckUlnTimes: 15`, `tg: 3.2` | `STOP` Atorva & Fenofibrate + `REFER` cấp cứu, NHƯNG lại phát mâu thuẫn `[CONSIDER] icosapent_ethyl ... trên nền Statin` | **FAIL** (`LIPID-R3-R3-10`) |
| `B24_CK_Boundary_10x` | `outpatient` | Biên chính xác `ckUlnTimes: 10.0`, đang dùng `Rosuvastatin 20`, `tg: 2.6` | `STOP rosuvastatin` + `REFER`, NHƯNG vẫn phát `[CONSIDER] icosapent_ethyl ... trên nền Statin` | **FAIL** (`LIPID-R3-R3-10`) |
| `B25_CK_Moderate_6_5x` | `outpatient` | `ckUlnTimes: 6.5`, đang dùng `Atorva 40 + Fenofibrate 145`, `tg: 2.9` | `HOLD` cả Atorva & Fenofibrate, NHƯNG vẫn phát `[CONSIDER] icosapent_ethyl ... trên nền Statin` | **FAIL** (`LIPID-R3-R3-10`) |
| `B26_ALT_Acute_4_5x` | `outpatient` | `altUlnTimes: 4.5`, đang dùng `Atorva 40 + Eze 10 + Feno 145`, `tg: 3.0` | `HOLD` cả 3 thuốc, NHƯNG vẫn phát `[CONSIDER] icosapent_ethyl ... trên nền Statin` | **FAIL** (`LIPID-R3-R3-10`) |
| `B27_ChildPughB_CustomOnly_Naive` | `outpatient` | Xơ gan mất bù `customInputs: { childPugh: 'B', altUlnTimes: 1.8 }`, ASCVD `ldl: 3.8`, `tg: 6.5` | Kê chống chỉ định **`START atorvastatin 40–80` + `START fenofibrate 145–200` + `CONSIDER ezetimibe`**, `alerts: []`! | **FAIL** (`LIPID-R3-R3-04`) |
| `B28_ChildPughB_Cond` | `outpatient` | `conditions: { decompensated_cirrhosis: true }`, đang dùng `Atorva 40`, `tg: 2.8` | `HOLD atorvastatin`, NHƯNG vẫn phát `[CONSIDER] icosapent_ethyl ... trên nền Statin` | **FAIL** (`LIPID-R3-R3-10`) |
| `B29_ChildPughA_Compensated` | `outpatient` | Xơ gan còn bù `conditions: { cirrhosis: true }`, `customInputs: { childPugh: 'A', altUlnTimes: 1.2 }`, ASCVD `ldl: 3.5` | Chặn nhầm `[AVOID] atorvastatin` (mâu thuẫn `clinicalStates.ts:35` cho phép Statin ở Child-Pugh A) | **FAIL** (`LIPID-R3-R3-04`) |
| `B30_Myasthenia_Gravis` | `outpatient` | Nhược cơ `myasthenia_gravis: true` + `Pyridostigmine`, đang dùng `Atorvastatin 80` | `CONTINUE atorvastatin` với `warnings: []`, `alerts: []` (thiếu cảnh báo nặng nhược cơ EMA/FDA) | **FAIL** (`LIPID-R3-R3-12`) |
| `B31_Untreated_Hypothyroidism` | `outpatient` | Suy giáp nặng chưa điều trị `tsh: 58 mIU/L`, `ckUlnTimes: 3.2`, `ldl: 5.1` | Phát thẳng `[START] atorvastatin 40–80 mg` (`warnings: []`) thay vì bù giáp trước để tránh tiêu cơ vân | **FAIL** (`LIPID-R3-R3-12`) |
| `B32_Gallbladder_Disease_Fenofibrate` | `outpatient` | Bệnh sỏi túi mật `cholelithiasis: true`, `gallbladderDisease: true`, `tg: 7.2 mmol/L` | Phát `[START] fenofibrate 145–200 mg` bất chấp chống chỉ định tuyệt đối bệnh túi mật của FDA/KB | **FAIL** (`LIPID-R3-R3-11`) |

### Nhóm C – Phổ Suy Thận Nặng CKD G3b / G4 / G5 & Chạy Thận Nhân Tạo Chu Kỳ (14 kịch bản)

| Mã KB | Bối cảnh thận | Đầu vào đối kháng chính | Kết quả `evaluate()` thực tế | Đánh giá |
|---|---|---|---|---|
| `C33_CKDG3b_Fenofibrate145` | CKD G3b (`eGFR = 38`) | Đang dùng `Fenofibrate 145 mg`, `tg: 6.2` | `[REDUCE] fenofibrate` xuống chế phẩm liều thấp (`40–54 mg/ngày`) | **PASS** |
| `C34_CKDG4_Rosuva40_Feno145` | CKD G4 (`eGFR = 22`) | Đang dùng `Rosuvastatin 40 mg + Fenofibrate 145 mg` | `[STOP] fenofibrate` + `[REDUCE] rosuvastatin ≤ 10 mg/ngày` | **PASS** |
| `C35_CKDG3b_Pitavastatin4` | CKD G3b (`eGFR = 41`) | Đang dùng `Pitavastatin 4 mg`, `ldl: 1.5` | `[REDUCE] pitavastatin ≤ 2 mg/ngày` | **PASS** |
| `C36_CKDG4_Pravastatin80` | CKD G4 (`eGFR = 23`) | Đang dùng `Pravastatin 80 mg`, `ldl: 1.6` | `[REDUCE] pravastatin ≤ 40 mg/ngày` | **PASS** |
| `C37_CKDG4_ALT4_8_Feno` | CKD G4 (`eGFR = 21`) | `altUlnTimes: 4.8`, đang dùng `Fenofibrate 145`, ASCVD `ldl: 3.2` | Đã sửa lỗi Vòng 2: phát cả `[STOP] fenofibrate` (do thận) VÀ `[AVOID] atorvastatin` (do gan `ALT = 4.8x`) | **PASS** |
| `C38_Dialysis_Naive_NoASCVD` | Lọc máu (`onDialysis`) | ĐTĐ, không ASCVD, chưa dùng thuốc, `ldl: 3.4` | `[AVOID]` không khởi trị mới Statin (4D / AURORA / KDIGO 2024) | **PASS** |
| `C39_Dialysis_Naive_WithASCVD` | Lọc máu (`onDialysis`) | Có ASCVD (tiền sử NMCT), chưa dùng thuốc, `ldl: 3.5` | `[CONSIDER] atorvastatin 10–20 mg/ngày` thận trọng | **PASS** |
| `C40_Dialysis_Existing_Rosuvastatin40` | Lọc máu (`onDialysis`) | Đang dùng **`Rosuvastatin 40 mg/ngày`**, không ASCVD, `scr: 620 µmol/L` | **`[CONTINUE] rosuvastatin` ở nguyên liều độc tính 40 mg/ngày**, `alerts: []`, **0 lệnh `REDUCE ≤ 10 mg`**! | **FAIL** (`LIPID-R3-R3-06`) |
| `C41_Dialysis_Existing_Atorva20_NoASCVD` | Lọc máu (`onDialysis`) | Không ASCVD, đang dùng `Atorvastatin 20 mg`, `ldl: 2.3` | Đã sửa lỗi Vòng 2: chỉ `[CONTINUE] atorvastatin`, không leo thang PCSK9i | **PASS** |
| `C42_Dialysis_Existing_Atorva40_WithASCVD` | Lọc máu (`onDialysis`) | Có ASCVD, đang dùng `Atorvastatin 40 mg`, `ldl: 2.4` | Phối hợp `[START] ezetimibe 10 mg` + `[CONTINUE] atorvastatin` an toàn qua đường mật | **PASS** |
| `C43_Dialysis_SevereHTG` | Lọc máu (`onDialysis`) | `tg: 8.5 mmol/L`, chưa dùng fibrate | `[AVOID] fenofibrate` + hướng dẫn dùng `Omega-3 (2–4 g/ngày)` | **PASS** |
| `C44_Dialysis_NoASCVD_StatinIntol` | Lọc máu (`onDialysis`) | Không ASCVD + `statinIntolerance: true`, `ldl: 3.6` | Không kê nhầm Bempedoic/Ezetimibe | **PASS** |
| `C45_Dialysis_ASCVD_StatinIntol` | Lọc máu (`onDialysis`) | Có ASCVD + `statinIntolerance: true`, `ldl: 3.4` | Phát `[START] bempedoic_acid 180 mg` dù `matrix.egfr.ts:154` ghi `dialysis: not_rec`! | **FAIL** (`LIPID-R3-R3-11`) |
| `C46_CKDG4_Naive_ASCVD` | CKD G4 (`eGFR = 20`) | ASCVD chưa dùng thuốc, `ldl: 3.7` | Ưu tiên `[START] atorvastatin 40–80 mg` không cần chỉnh liều thận | **PASS** |

### Nhóm D – Thai Kỳ, Cho Con Bú, Phụ Nữ Tuổi Sinh Đẻ, Dị Ứng Đa Thuốc, Chủng Tộc Châu Á, Cao Tuổi Suy Yếu & HIV (11 kịch bản)

| Mã KB | Nhóm dân số đặc biệt | Đầu vào đối kháng chính | Kết quả `evaluate()` thực tế | Đánh giá |
|---|---|---|---|---|
| `D47_Pregnant_Severe_HTG` | Thai kỳ T2 | `pregnant: true`, `tg: 7.2 mmol/L`, chưa dùng thuốc | Phát `[AVOID] atorvastatin` nhưng thiếu thẻ `[REFER]` chuyên khoa Sản – Nội tiết cho tăng TG nặng thai kỳ | **FAIL (Minor)** (`LIPID-R3-R3-17`) |
| `D48_Pregnant_5LipidMeds` | Thai kỳ | `pregnant: true`, đang dùng 5 thuốc đơn chất (`Atorva + Eze + Evolocumab + Feno + Omega3`) | Phát đủ **5 lệnh `STOP`** cho cả 5 thuốc (`lipid` ngừng 4 + `reviewMeds` ngừng `omega3`) | **PASS** |
| `D49_Breastfeeding_On_Meds` | Cho con bú | `pregnant: false`, `breastfeeding: true`, `lactation: true`, đang dùng `Atorva 40 + Eze 10 + Feno 145` | **0 lệnh `STOP`**; phát `CONTINUE atorvastatin`, `CONTINUE ezetimibe`, **`START evolocumab`**, `CONSIDER icosapent_ethyl`! | **FAIL** (`LIPID-R3-R3-01`) |
| `D50_Breastfeeding_Naive_FH` | Cho con bú | `pregnant: false`, `breastfeeding: true`, FH `ldl: 5.8`, chưa dùng thuốc | Phát **`[START] atorvastatin 40–80 mg/ngày`** với `alerts: []`! | **FAIL** (`LIPID-R3-R3-01`) |
| `D51_WOCBP_Age25_FH` | Nữ 25 tuổi (WOCBP) | Nữ 25 tuổi FH `ldl: 5.5`, `pregnant: false` | `[START] atorvastatin 40–80 mg` với `warnings: []` (0 lời dặn tránh thai / ngưng trước mang thai 1–2 tháng) | **FAIL** (`LIPID-R3-R3-13`) |
| `D52_Pregnant_HoFH_ASCVD` | Thai kỳ + HoFH | `pregnant: true`, `ascvd: true`, `familialHypercholesterolemia: true`, `ldl: 10.5 mmol/L` | Chỉ có `[AVOID] atorvastatin`, thiếu thẻ `[REFER]` lọc huyết tương `LDL apheresis` cấp thiết | **FAIL (Minor)** (`LIPID-R3-R3-17`) |
| `D53_Multi_Drug_Allergies` | Dị ứng đa thuốc | Dị ứng/phản vệ với `atorvastatin`, `fenofibrate`, `ezetimibe` (`ldl: 3.9, tg: 6.4`) | Vẫn kê nguyên xi **`START atorvastatin` + `START fenofibrate` + `CONSIDER ezetimibe`**, `alerts: []`! | **FAIL** (`LIPID-R3-R3-13`) |
| `D54_Asian_Flag_US_Profile` | Người Châu Á (`US`) | `profile: 'US'`, `asian: true`, `ethnicity: 'asian'`, ASCVD `ldl: 3.4` | Gợi ý `Rosuvastatin 20–40 mg` không kèm lưu ý FDA Asian PK (`2x AUC`, thận trọng liều `40 mg`) | **FAIL (Minor)** (`LIPID-R3-R3-18`) |
| `D55_Elderly_79yo_Frail_Primary` | 79 tuổi suy yếu | Phòng ngừa tiên phát, `age: 79`, `frailty: true`, `ldl: 3.6` | Đã sửa tốt từ Vòng 2: hạ xuống `[CONSIDER] atorvastatin 10–20 mg/ngày` | **PASS** |
| `D56_Elderly_84yo_Frail_LimitedLifespan_ASCVD` | 84 tuổi suy yếu nặng | Phòng ngừa thứ phát, `age: 84`, `42 kg`, `eGFR = 47`, `frailty + limitedLifespan`, `ldl: 3.9` | Kê ngay `Atorvastatin 40–80 mg` + `CONSIDER Ezetimibe` chưa có ghi chú khởi đầu liều vừa theo dung nạp | **Suggestion** (`LIPID-R3-R3-19`) |
| `D57_HIV_Ritonavir` | HIV ≥ 40 tuổi | Nam 48 tuổi `hiv: true` đang dùng `ritonavir`, `ldl: 3.3` | Chọn đúng `[CONSIDER] pitavastatin 4 mg/ngày` (REPRIEVE) | **PASS** |

### Nhóm E – Phối Hợp Cố Định (FDC), Trùng Lặp Đa Statin & Ma Trận Bẫy Tương Tác Thuốc (19 kịch bản)

| Mã KB | Bẫy phối hợp / DDI | Đầu vào đối kháng chính | Kết quả `evaluate()` thực tế | Đánh giá |
|---|---|---|---|---|
| `E58_FDC_RosuvaEze_CKDG4` | FDC + CKD G4 | `rosuvastatin_ezetimibe 20/10 mg` ở BN CKD G4 (`eGFR = 19`), `ldl: 2.1` | Không giảm liều Rosuva ≤ 10 mg mà **kê chồng thêm `[START] atorvastatin 40–80 mg`**! | **FAIL** (`LIPID-R3-R3-02`) |
| `E59_FDC_AtorvaEze_Pregnant` | FDC + Thai kỳ | `atorvastatin_ezetimibe 40/10 mg` ở thai phụ `pregnant: true` | **0 lệnh `STOP`** viên FDC gây quái thai đang uống! | **FAIL** (`LIPID-R3-R3-02`) |
| `E60_FDC_SimvaEze_Clarithromycin` | FDC + CYP3A4 mạnh | `simvastatin_ezetimibe 40/10 mg + clarithromycin 500 mg BID` | **0 lệnh `STOP`/`HOLD`**, `alerts: []`, và kê chồng thêm `CONSIDER rosuvastatin`! | **FAIL** (`LIPID-R3-R3-02`) |
| `E61_FDC_AmlodipineAtorva_Caduet` | FDC Tim mạch – Lipid | `amlodipine_atorvastatin 5/20 mg` (Caduet), ASCVD `ldl: 2.4` | Không nhận ra Atorvastatin 20 mg, kê chồng `[START] atorvastatin 40–80 mg`! | **FAIL** (`LIPID-R3-R3-02`) |
| `E62_Triple_Duplicate_Statins` | Trùng 3 Statin | `[atorvastatin 40, rosuvastatin 20, simvastatin 20]`, ASCVD `ldl: 1.9` | Ra lệnh **`STOP` cả 3 Statin** cùng lúc + phát mâu thuẫn `START ezetimibe`! | **FAIL** (`LIPID-R3-R3-03`) |
| `E63_Gemfibrozil_Atorva40` | OATP1B1 / UGT | Ngoại trú ASCVD `Atorvastatin 40 + Gemfibrozil 600`, `tg: 6.2` | `[STOP] gemfibrozil` + chuyển sang `Fenofibrate` an toàn | **PASS** |
| `E64_Cyclosporine_Atorva20` | Ghép tạng (`Cyclosporine`) | `Atorvastatin 20 + Cyclosporine 100`, ASCVD `ldl: 2.6` | `[STOP] atorvastatin` + `[SWITCH] rosuvastatin ≤ 5 mg/ngày` | **PASS** |
| `E65_Cyclosporine_Rosuva5` | Ghép tạng tại trần 5 mg | `Rosuvastatin 5 mg + Cyclosporine 100`, ASCVD `ldl: 2.5` | Đã sửa lỗi Vòng 2: giữ `Rosuvastatin 5 mg` và nâng bậc sang `Ezetimibe`/`PCSK9i` thận trọng | **PASS** |
| `E66_Cyclosporine_Rosuva20` | Ghép tạng vượt trần | `Rosuvastatin 20 mg + Cyclosporine 100` | `[REDUCE] rosuvastatin ≤ 5 mg/ngày` | **PASS** |
| `E67_Paxlovid_Atorva40` | COVID-19 (`Paxlovid`) | `Atorvastatin 40 + nirmatrelvir_ritonavir`, `tg: 2.4` | `[HOLD] atorvastatin`, NHƯNG gợi ý đổi Rosuvastatin thiếu trần `≤ 10 mg` & phát nhầm `CONSIDER icosapent_ethyl` | **FAIL** (`LIPID-R3-R3-07`, `10`) |
| `E68_Paxlovid_Rosuva40` | COVID-19 (`Paxlovid`) | **`Rosuvastatin 40 mg + nirmatrelvir_ritonavir`**, ASCVD `ldl: 1.9` | **0 cảnh báo (`alerts: []`), 0 giảm liều `≤ 10 mg`**, phát `START ezetimibe` giữ nguyên Rosuva 40 mg! | **FAIL** (`LIPID-R3-R3-07`) |
| `E69_Clarithro_Atorva40_vs_20` | Macrolide (`Clarithromycin`) | `Atorvastatin 40 mg + Clarithromycin` (`ldl: 2.2`) | `[REDUCE] atorvastatin ≤ 20 mg` (hoặc đổi sang Rosuvastatin) chuẩn xác | **PASS** |
| `E70_Ticagrelor_Rosuva40` | BCRP (`Ticagrelor`) | Sau đặt stent `Ticagrelor 90 BID + Rosuvastatin 40 mg` | `[REDUCE] rosuvastatin ≤ 20 mg/ngày` | **PASS** |
| `E71_Diltiazem_Verapamil_Dronedarone_Simva20` | CYP3A4 vừa (`Cap 10`) | `Simvastatin 20 mg + Diltiazem 120 mg`, ASCVD `ldl: 1.2` (đã đạt đích) | Đã sửa lỗi Vòng 2: `[REDUCE] simvastatin ≤ 10 mg/ngày`, không còn `CONTINUE` mâu thuẫn | **PASS** |
| `E72_Amiodarone_Ranolazine_Simva40` | CYP3A4 (`Cap 20`) | `Simvastatin 40 mg + Amiodarone 200 mg`, ASCVD `ldl: 2.2` | `[STOP] simvastatin` + `[SWITCH] rosuvastatin 20–40 mg` sạch không trùng lặp | **PASS** |
| `E73_Bempedoic_Prava80_Tendon_Gout` | Bempedoic + Gút + Đứt gân | Đang uống `Pravastatin 80 + Bempedoic acid 180`, bị `gout: true`, `uricAcid: 510`, `tendonRuptureHistory: true` | Giảm Pravastatin ≤ 40 mg, NHƯNG **0 lệnh `HOLD`/`STOP` `bempedoic_acid`** đang gây gút/đứt gân! | **FAIL** (`LIPID-R3-R3-11`) |
| `E74_Warfarin_Fenofibrate` | VKA + Fibrate | `Warfarin 5 mg + Fenofibrate 145 mg`, `af: true` | Phát cảnh báo tương tác INR + `[MONITOR]` PT/INR sát | **PASS** |
| `E75_Colchicine_Statin_CKD` | Gút + CKD + Statin | `Colchicine 0.5 + Atorvastatin 40` trên nền CKD G3b (`eGFR = 36`) | Phát cảnh báo nguy cơ bệnh cơ do phối hợp Colchicine + Statin trên nền CKD | **PASS** |
| `E76_Cholestyramine_Ezetimibe` | Nhựa gắn acid mật | Đang dùng `Atorva 80 + Cholestyramine`, thêm `Ezetimibe` | Đã sửa lỗi Vòng 2: dặn uống Ezetimibe trước ≥ 2 giờ hoặc sau ≥ 4 giờ so với nhựa mật | **PASS** |

### Nhóm F – Va Chạm Đa Module & Kiểm Thử Fail-Closed Khi Thiếu Dữ Liệu (10 kịch bản)

| Mã KB | Bối cảnh đa bệnh lý / Fail-closed | Đầu vào đối kháng chính | Kết quả `evaluate()` thực tế | Đánh giá |
|---|---|---|---|---|
| `F77_Pure_HFrEF_NoASCVD` | `['lipid', 'hf']` | HFrEF `lvef: 32%` không mạch vành, không ASCVD, `ldl: 3.1` | Không xếp nhầm HFrEF vào ASCVD, không ép `START` Statin cường độ cao (CORONA / GISSI-HF) | **PASS** |
| `F78_Lipid_CKD_DualModule` | `['lipid', 'ckd']` | CKD G3bA3 + ĐTĐ, `ldl: 3.2` | Phân quyền sạch: chỉ 1 thẻ Statin duy nhất từ `lipid`, không trùng thẻ Statin từ `ckd` | **PASS** |
| `F79_Lipid_DM2_HTN` | `['lipid', 'dm2', 'htn']` | ĐTĐ 12 năm + THA độ 2, `ldl: 3.4` | Phối hợp hài hòa SGLT2i + RASi + Statin cường độ cao không xung đột | **PASS** |
| `F80_Lipid_AF_OAC_Icosapent` | `['lipid', 'af']` | Rung nhĩ đang dùng `Apixaban 5 BID` + `Atorva 80`, `tg: 3.1` | Cá thể hóa rõ cảnh báo tái phát rung nhĩ & xuất huyết ngay trong `rationale` của `icosapent_ethyl` | **PASS** |
| `F81_Lipid_Gout_Febuxostat_Rosuva40` | `['lipid', 'gout']` | Gút đang dùng `Febuxostat 80 mg + Rosuvastatin 40 mg` | Bắt đúng tương tác BCRP `Febuxostat + Rosuvastatin` → `[REDUCE] rosuvastatin ≤ 20 mg` | **PASS** |
| `F82_Lipid_COPD_Asthma` | `['lipid', 'copd', 'asthma']` | COPD + ASCVD dùng LABA/LAMA + Statin | Hoạt động trơn tru, không tương tác giả | **PASS** |
| `F83_FailClosed_AllLabsMissing` | Fail-closed toàn phần | Ngoại trú ASCVD có `ldl: undefined, tg: undefined, scr: undefined, alt: undefined, ck: undefined` | Không giả định số mặc định; yêu cầu bổ sung xét nghiệm `ldl` nền trước khi phân tầng ngoại trú | **PASS** |
| `F84_FailClosed_MissingEGFR_HighTG` | Fail-closed thận | `tg: 7.5 mmol/L`, `ldl: 3.8`, ASCVD, **`scr: undefined` (`eGFR: undefined`)** | **Khóa an toàn Fenofibrate** (`missing_input_egfr`), ưu tiên Atorvastatin không phụ thuộc thận | **PASS** |
| `F85_FailClosed_MissingTG` | Fail-closed TG | ASCVD `ldl: 2.8`, `tg: undefined` | Xử lý LDL-C bình thường, không kích hoạt nhầm luật TG | **PASS** |
| `F86_DualGoal_Unmet50Pct` | Mục tiêu kép ESC | ASCVD `baselineLdl: 2.4`, đang dùng `Atorva 20`, `ldl: 1.36` (`< 1.4` nhưng mới giảm `43.3% < 50%`) | Nhận diện chưa đạt giảm ≥ 50% so với nền → `[UPTITRATE] atorvastatin 40–80 mg` | **PASS** |

### Nhóm G – Lô Kiểm Thử Đào Sâu Lần 2 Xác Thực Cơ Chế Gốc (17 kịch bản: `G87a`–`G98`)

| Mã KB | Giả thuyết đối kháng chuyên sâu | Kết quả `evaluate()` thực tế | Đánh giá |
|---|---|---|---|
| `G87a_TwoStatins_LowFirst_HighSecond` | `[simvastatin 20, rosuvastatin 20]`, ASCVD `ldl: 2.2` | Phát 3 lệnh xung đột: `STOP rosuvastatin` + `STOP simvastatin` + `SWITCH simvastatin -> atorvastatin`! | **FAIL** (`LIPID-R3-R3-03`) |
| `G87b_TwoStatins_PravaFirst_AtorvaSecond` | `[pravastatin 40, atorvastatin 40]`, ASCVD `ldl: 2.0`, `tg: 2.1` | **`STOP atorvastatin` + `STOP pravastatin` (mất sạch 100% Statin)** + `CONSIDER icosapent_ethyl`! | **FAIL** (`LIPID-R3-R3-03`, `10`) |
| `G88a_ChildPughC_Intolerance_Eze_Bempedoic` | Xơ gan mất bù giai đoạn cuối `customInputs.childPugh = 'C'`, không dung nạp statin | Kê mới **`START bempedoic_acid 180 mg` + `START ezetimibe 10 mg`**, `alerts: []`! | **FAIL** (`LIPID-R3-R3-04`) |
| `G88b_ChildPughC_Existing_Eze_Bempedoic` | `customInputs.childPugh = 'C'`, đang uống `Ezetimibe + Bempedoic acid` | Phát **`CONTINUE ezetimibe` + `CONTINUE bempedoic_acid`**, `alerts: []`! | **FAIL** (`LIPID-R3-R3-04`) |
| `G89_Dialysis_Pravastatin80` | Lọc máu `onDialysis: true`, đang dùng `Pravastatin 80 mg` | `REDUCE pravastatin ≤ 40 mg` hoạt động đúng (chứng minh lỗi ở `C40` là do nhánh `!safety.onDialysis` riêng của Rosuvastatin!) | **PASS** |
| `G90_Dialysis_ASCVD_Intol_Existing_Bempedoic` | Lọc máu `onDialysis: true`, đang dùng `Bempedoic acid 180 mg` | `CONTINUE bempedoic_acid` dù `matrix.egfr.ts:154` ghi `continue: 'not_rec'` | **FAIL** (`LIPID-R3-R3-11`) |
| `G91a_Switch_Simva40_Verapamil_Ticagrelor` | `Simvastatin 40 + Verapamil + Ticagrelor` | Khi chuyển sang Rosuvastatin, engine ghìm đúng trần `Rosuvastatin 20 mg` do có Ticagrelor | **PASS** |
| `G91b_Switch_Simva40_Amiodarone_CKDG4` | `Simvastatin 40 + Amiodarone` trên nền CKD G4 (`eGFR = 20`) | Tự động chuyển sang `Atorvastatin 40–80 mg` (tránh Rosuvastatin ở CKD G4) | **PASS** |
| `G91c_Switch_Prava80_Clarithro_VN` | `profile: 'VN'`, `Pravastatin 80 + Clarithromycin`, ASCVD `ldl: 2.5` | Phát `SWITCH rosuvastatin 20–40 mg` thiếu cảnh báo trần 40 mg ở người Châu Á (`fda.rosuvastatin.asian_pk`) | **FAIL (Minor)** (`LIPID-R3-R3-18`) |
| `G92a_Inpatient_ACS_Naive_Clarithromycin` | Nội viện STEMI `<24h`, chưa dùng statin, đang uống `Clarithromycin` | Chỉ phát `DEFER atorvastatin` + **`CONSIDER rosuvastatin 5–10 mg`** (mất chỉ định Class I cường độ cao `Rosuvastatin 20–40 mg`!) | **FAIL** (`LIPID-R3-R3-08`) |
| `G92b_Inpatient_ACS_Atorva20_Clarithromycin` | Nội viện STEMI `<24h`, đang uống `Atorvastatin 20 + Clarithromycin`, `ldl: 2.9` | Gọi nhầm `Atorvastatin 20 mg` là *"liều tối đa dung nạp"* mà không hẹn nâng lên `40–80 mg` sau đợt kháng sinh | **FAIL** (`LIPID-R3-R3-08`) |
| `G93_US_Units_FullNote` | Toàn bộ đơn vị hệ Mỹ (`mg/dL`, `mg/g`), `lpa: 68 mg/dL`, `lpaNmol: 110` | `noteText` Mục 2 in cứng số thực 4 chữ số thập phân hệ SI (`LDL-C: 3.7497 mmol/L`) và làm mất `Lp(a)` | **FAIL** (`LIPID-R3-R3-14`, `15`) |
| `G94_Primary_Extreme_HTG_LowRisk` | Nam 35 tuổi khỏe mạnh, `ldl: 2.5`, `tg: 9.8 mmol/L` | Chỉ khởi trị `Fenofibrate` phòng viêm tụy, không kê nhầm Statin | **PASS** |
| `G95_HighTG_FalselyLowLDL_ASCVD_Naive` | ASCVD chưa dùng thuốc, `tg: 6.2`, `tc: 7.0`, `hdl: 1.1` (`Non-HDL = 5.9`), `ldl: 1.2` (Friedewald thấp giả) | Bỏ lỡ Statin cường độ cao `40–80 mg` (chỉ kê `20–40 mg`) và thiếu cảnh báo Friedewald vô hiệu khi `TG > 4.5 mmol/L` | **FAIL (Minor)** (`LIPID-R3-R3-16`) |
| `G96_DualGoal_ExactBoundary_US` | `US` / `mg_dL`, `baselineLdl: 93 mg/dL`, `ldl: 52 mg/dL` (`< 55` nhưng giảm `< 50%`) | Tăng liều chuẩn xác để đạt mục tiêu kép | **PASS** |
| `G97_CK_9_99_vs_10_0` | Kiểm tra biên sát nút `ckUlnTimes: 9.99` vs `10.0` | `9.99` → `HOLD` (bệnh cơ vừa); `10.0` → `STOP` + `REFER` cấp cứu tiêu cơ vân | **PASS** |
| `G98_WOCBP_Bempedoic_Start` | Nữ 26 tuổi ASCVD + không dung nạp statin, `pregnant: false` | Phát `START bempedoic_acid` + `START ezetimibe` không có cảnh báo ngừa thai / ngưng trước mang thai | **FAIL** (`LIPID-R3-R3-13`) |

---

## 4. Phân Tích Chi Tiết Từng Phát Hiện & Đề Xuất Sửa Lỗi (`suggestedFix`)

### 4.1 Nhóm CRITICAL (7 phát hiện)

#### [LIPID-R3-R3-01] Phụ nữ đang cho con bú (`breastfeeding` / `lactation`) lọt hoàn toàn khỏi mọi cổng chống chỉ định
- **Vị trí mã nguồn:** [rules.safety.organ.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/rules.safety.organ.ts#L36-L136), [helpers.safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/helpers.safety.ts#L124-L125), [helpers.safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/helpers.safety.ts#L207)
- **Bằng chứng:**
  - `CUSTOM_LIPID_FLAGS` đã khai báo `'breastfeeding'` và `'lactation'`; `kb/thresholds/lipid.json` đã khai báo `lipid.lactation.fibrate_washout_days = 5`; `rules.safety.organ.ts` đặt tên luật là *"Thai kỳ / cho con bú: Chống chỉ định và ngừng toàn bộ thuốc hạ lipid máu"*, nhưng `when: (ctx) => hasLipidFlag(ctx, 'pregnant')` và `assessStatinSafety()` chỉ kiểm tra duy nhất `'pregnant'`.
  - Ở `D49_Breastfeeding_On_Meds` (`pregnant: false, breastfeeding: true`), bà mẹ đang cho con bú uống `Atorvastatin 40 mg + Ezetimibe 10 mg + Fenofibrate 145 mg` nhận `0` lệnh `STOP`, được khuyên `CONTINUE` Atorvastatin + Ezetimibe, **`START evolocumab`** và `CONSIDER icosapent_ethyl`. Ở `D50`, bà mẹ cho con bú chưa điều trị bị kê **`START atorvastatin 40–80 mg/ngày`**.
- **Đề xuất sửa:** Tạo biến `isPregnantOrLactating = hasLipidFlag(ctx, 'pregnant') || hasLipidFlag(ctx, 'breastfeeding') || hasLipidFlag(ctx, 'lactation')` trong `assessStatinSafety()` và áp dụng xuyên suốt mọi cổng an toàn trong `src/modules/lipid/*` cũng như `src/engine/safety/clinicalStates.ts` & `reviewMeds.ts` (đối chiếu `drug.lactation.status`).

#### [LIPID-R3-R3-02] Mù hoàn toàn với các viên phối hợp liều cố định FDC (`atorvastatin_ezetimibe`, `rosuvastatin_ezetimibe`, `simvastatin_ezetimibe`, `amlodipine_atorvastatin`, `bempedoic_acid_ezetimibe`)
- **Vị trí mã nguồn:** [helpers.safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/helpers.safety.ts#L46-L66), [helpers.safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/helpers.safety.ts#L279-L395), [drugClassify.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/drugClassify.ts#L251-L265)
- **Bằng chứng:**
  - `E59` (`atorvastatin_ezetimibe 40/10 mg` + mang thai): `0` lệnh `STOP`.
  - `E60` (`simvastatin_ezetimibe 40/10 mg + clarithromycin`): `0` lệnh `STOP`/`HOLD`, `alerts: []`, kê chồng thêm `Rosuvastatin` trên nền chống chỉ định tuyệt đối gây tiêu cơ vân tử vong.
  - `E58` (`rosuvastatin_ezetimibe 20/10 mg` ở CKD G4 `eGFR = 19`): Không hạ liều Rosuvastatin ≤ 10 mg mà kê chồng thêm `START atorvastatin 40–80 mg`.
  - `E61` (`amlodipine_atorvastatin 5/20 mg` Caduet): Kê chồng thêm `START atorvastatin 40–80 mg`.
- **Đề xuất sửa:** Bổ sung bảng ánh xạ phân rã FDC (`expandCombinationMed`) cho toàn bộ viên phối hợp Tim mạch – Lipid (`atorvastatin_ezetimibe`, `rosuvastatin_ezetimibe`, `simvastatin_ezetimibe`, `amlodipine_atorvastatin`, `bempedoic_acid_ezetimibe`, `pravastatin_fenofibrate`) tách đúng hoạt chất thành phần và hàm lượng `a/b mg` trước khi đưa vào `reviewMeds`, `interactions`, `duplicates` và `helpers.safety.ts`.

#### [LIPID-R3-R3-03] Xung đột ngược chiều giữa `lipid` và `reviewMedsSpecialized` làm NGỪNG CẢ HAI Statin cùng lúc
- **Vị trí mã nguồn:** [rules.safety.renal.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/rules.safety.renal.ts#L62-L87), [reviewMedsSpecialized.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMedsSpecialized.ts#L347-L377)
- **Bằng chứng:**
  - `lipid.safety.duplicate_statin_stop` luôn ngừng `statins[1]`, còn `reviewDuplicateStatins` luôn ngừng statin có `STATIN_POTENCY_RANK` thấp hơn.
  - Khi `currentMeds = [pravastatin 40 mg, atorvastatin 40 mg]` (`G87b`), `lipid` phát `STOP atorvastatin` còn `reviewMedsSpecialized` phát `STOP pravastatin` → bệnh nhân ASCVD bị cắt sạch **100% Statin**! Ở `E62` (3 statin), cả 3 statin đều bị `STOP` đồng thời phát `START ezetimibe` mâu thuẫn.
- **Đề xuất sửa:** Bỏ luật cắt theo vị trí mảng `statins[1]` trong `rules.safety.renal.ts`; dùng chung thuật toán chọn 1 Statin duy trì tối ưu nhất (`!hasDoseViolation` ưu tiên hàng đầu, sau đó theo `potencyRank` và `doseMg`) cho cả `reviewDuplicateStatins` lẫn `getActiveStatin(ctx)`.

#### [LIPID-R3-R3-04] Xơ gan mất bù `Child-Pugh B / C` (`customInputs.childPugh`) bị kê đơn độc gan liều tối đa, trong khi `Child-Pugh A` bị chặn nhầm Statin
- **Vị trí mã nguồn:** [helpers.safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/helpers.safety.ts#L218-L219), [clinicalStates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/clinicalStates.ts#L35), [clinicalStates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/clinicalStates.ts#L172)
- **Bằng chứng:**
  - `B27` (`customInputs.childPugh = 'B'`): Kê `START atorvastatin 40–80 mg` + `START fenofibrate 145–200 mg` + `CONSIDER ezetimibe 10 mg` (`alerts: []`).
  - `G88a` & `G88b` (`customInputs.childPugh = 'C'`): Kê mới / duy trì `Bempedoic acid 180 mg + Ezetimibe 10 mg` (`alerts: []`).
  - `B29` (`conditions: { cirrhosis: true }, customInputs: { childPugh: 'A', altUlnTimes: 1.2 }`): Phát `[AVOID] atorvastatin` chặn nhầm Statin ở xơ gan còn bù.
- **Đề xuất sửa:** Đọc thống nhất `childPugh` từ cả `customInputs` và `conditions` trong `clinicalStates.ts` và `helpers.safety.ts`: chặn/ngừng toàn bộ Statin, Fenofibrate, Ezetimibe và Bempedoic acid khi `Child-Pugh B/C` hoặc bệnh gan mất bù/`ALT >= 3x ULN`; cho phép Statin thận trọng ở xơ gan còn bù `Child-Pugh A` khi `ALT < 3x ULN`.

#### [LIPID-R3-R3-05] Viêm tụy cấp do tăng Triglyceride đang hoạt động (`acutePancreatitis: true`) thiếu chuyển cấp cứu ngoại trú, kê Statin uống khi NPO nội viện, và trả về `0 khuyến cáo` khi đã có sẵn thuốc nhà
- **Vị trí mã nguồn:** [rules.tg.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/rules.tg.ts#L165-L288), [rules.inpatient.other.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/rules.inpatient.other.ts#L23-L223)
- **Bằng chứng:**
  - `B20` (Ngoại trú viêm tụy cấp, `TG = 14.2 mmol/L`): Kê đơn uống tại nhà Atorvastatin + Fenofibrate + Ezetimibe, `0` lệnh `REFER` nhập viện cấp cứu.
  - `B21` (Nội viện viêm tụy cấp NPO, `TG = 15.0 mmol/L`): Vẫn phát ngay `START atorvastatin 40–80 mg uống`.
  - `B22` (Nội viện viêm tụy cấp `TG = 12.8 mmol/L`, ở nhà đang dùng `Atorvastatin 40 + Fenofibrate 145`): Trả về **`recommendations = []` (0 khuyến cáo)**.
- **Đề xuất sửa:** Khi `acutePancreatitis` dương tính: ở ngoại trú phát `[REFER]` cấp cứu ưu tiên 100 và chặn toàn bộ lệnh kê mới thuốc uống hạ lipid; ở nội viện luôn phát thẻ phác đồ cấp cứu viêm tụy cấp tăng TG (nhịn ăn NPO, tạm hoãn thuốc uống trong pha cấp, bù dịch tinh thể, truyền Insulin thường tĩnh mạch đưa TG < 5.6 mmol/L, đánh giá lọc huyết tương nếu suy tạng, và chỉ dùng lại Fenofibrate + Omega-3 khi ăn uống lại được) bất kể toa nhà đã có Fenofibrate hay chưa.

#### [LIPID-R3-R3-06] Chạy thận nhân tạo (`onDialysis: true`) bỏ lọt liều độc tính `Rosuvastatin 40 mg/ngày`
- **Vị trí mã nguồn:** [rules.safety.renal.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/rules.safety.renal.ts#L307), [helpers.safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/helpers.safety.ts#L346-L348), [matrix.egfr.statin.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/matrix.egfr.statin.ts#L125)
- **Bằng chứng:** Ở `C40_Dialysis_Existing_Rosuvastatin40`, bệnh nhân lọc máu đang uống `Rosuvastatin 40 mg` nhận lệnh `[CONTINUE] rosuvastatin` nguyên liều 40 mg với `alerts: []` do điều kiện loại trừ sai `safety.onDialysis` (trái ngược nhãn FDA Crestor `≤ 10 mg/ngày` và chính `matrix.egfr.statin.ts` dòng 125).
- **Đề xuất sửa:** Gỡ bỏ điều kiện loại trừ `safety.onDialysis` tại `rules.safety.renal.ts:307` và `helpers.safety.ts:347`, đồng thời chặn `lipid.safety.dialysis` phát `CONTINUE` khi `activeStatin.hasDoseViolation === true`.

#### [LIPID-R3-R3-07] Bỏ sót hoàn toàn trần liều `Rosuvastatin ≤ 10 mg/ngày` khi phối hợp `Nirmatrelvir/ritonavir` (Paxlovid) / `Ritonavir` / `Cobicistat`
- **Vị trí mã nguồn:** [kb/interactions/statin.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/statin.json), [rules.ddi.cyp.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/rules.ddi.cyp.ts#L65-L110), [helpers.safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/helpers.safety.ts#L344-L352)
- **Bằng chứng:** Ở `E68_Paxlovid_Rosuva40` (`Rosuvastatin 40 mg + nirmatrelvir_ritonavir`), Cmax Rosuvastatin tăng ~4 lần và AUC tăng ~2 lần do ức chế OATP1B1/BCRP, nhưng engine phát `START ezetimibe` giữ nguyên Rosuvastatin 40 mg với `alerts: []`.
- **Đề xuất sửa:** Bổ sung tương tác `rosuvastatin + (nirmatrelvir_ritonavir | ritonavir | cobicistat | lopinavir_ritonavir)` vào KB tương tác và `rules.ddi.cyp.ts` / `helpers.safety.ts` để giới hạn `Rosuvastatin ≤ 10 mg/ngày` (hoặc tạm ngưng 5 ngày trong đợt dùng Paxlovid).

---

### 4.2 Nhóm MAJOR (8 phát hiện)

- **[LIPID-R3-R3-08] Mất chỉ định Class I Statin cường độ cao ở bệnh nhân nội viện STEMI `<24h` có DDI (`B17`, `G92a`, `G92b`):**
  - `B17` (`STEMI <24h` đang dùng `Simvastatin 20 mg + Gemfibrozil`): Chỉ phát `STOP gemfibrozil` + `CONSIDER ezetimibe`, quên chuyển `Simvastatin 20 mg` lên `Atorvastatin 40–80 mg` / `Rosuvastatin 20–40 mg`.
  - `G92a` (`STEMI <24h` chưa dùng statin, đang uống `Clarithromycin`): Chỉ phát `CONSIDER rosuvastatin 5–10 mg` thay vì `[START] rosuvastatin 20–40 mg` (Rosuvastatin không qua CYP3A4!).
  - `G92b` (`STEMI <24h` đang dùng `Atorvastatin 20 mg + Clarithromycin`): Gọi nhầm `Atorvastatin 20 mg` là *"liều tối đa dung nạp"* mà không hướng dẫn nâng lên `40–80 mg` sau khi hết đợt kháng sinh hoặc đổi sang `Rosuvastatin 20–40 mg`.
- **[LIPID-R3-R3-09] Ca mẫu `lipid_preset_1_acs_inpatient` thiếu `setting: 'inpatient'` (`A06`):** Tại [presets.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/presets.ts#L11-L36), thiếu thuộc tính `setting: 'inpatient'` làm `AppShell.tsx` reset chế độ về `'outpatient'` và tắt sạch bộ luật nội viện ACS.
- **[LIPID-R3-R3-10] Khuyến cáo mâu thuẫn `CONSIDER Icosapent ethyl ... trên nền Statin` khi Statin đang bị `STOP`/`HOLD` vì tiêu cơ vân cấp, viêm gan cấp hoặc DDI (`B23`–`B26`, `B28`, `E67`, `G87b`):** Trong [rules.tg.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/rules.tg.ts#L298-L308), cần chặn ngay khi `safety.hasRhabdoRiskCk || safety.hasModerateCk || safety.hasSevereAlt || activeStatin.hasDoseViolation`.
- **[LIPID-R3-R3-11] Ba lỗ hổng an toàn thuốc Non-Statin (`B32`, `E73`, `C45`, `G90`):**
  1. Kê `Fenofibrate` cho bệnh nhân có sẵn bệnh túi mật / sỏi mật (`B32`), trái chống chỉ định trong `kb/drugs/fenofibrate.json:167`.
  2. Không phát lệnh `HOLD`/`STOP` `Bempedoic acid` đang dùng khi xuất hiện Gút cấp / đứt gân nếu bệnh nhân không có cờ `statinIntolerance: true` hoặc đã đạt đích LDL (`E73`, do `maintain_bempedoic` bị bó hẹp trong `isIntoleranceEscalationActive`).
  3. Kê `START`/`CONTINUE` `Bempedoic acid` trên bệnh nhân chạy thận nhân tạo (`C45`, `G90`), mâu thuẫn trực tiếp với `matrix.egfr.ts:154` (`dialysis: not_rec`).
- **[LIPID-R3-R3-12] Thiếu cổng trì hoãn ở suy giáp nặng chưa điều trị (`TSH = 58 mIU/L` + `CK = 3.2x ULN`, `B31`) và thiếu cảnh báo làm nặng bệnh nhược cơ (`myasthenia_gravis`, `B30`):** Cần ưu tiên bù hormon giáp trước khi khởi trị Statin liều cao ngoại trú để phòng tiêu cơ vân cấp, và gắn cảnh báo theo dõi nhược cơ / nhược cơ thể mắt theo EMA/FDA.
- **[LIPID-R3-R3-13] Thiếu cổng kiểm tra tiền sử dị ứng/phản vệ thuốc (`D53`) và thiếu cảnh báo ngừa thai / ngưng thuốc trước mang thai 1–2 tháng ở phụ nữ tuổi sinh đẻ `15–50 tuổi` (`D51`, `G98`).**
- **[LIPID-R3-R3-14] Hồ sơ `US` bỏ quên ngưỡng `Lp(a) ≥ 125 nmol/L` của ACC/AHA 2026 (`A10`, `G93`):** Ngưỡng `lipid.lpa.acc_risk_enhancing_nmol = 125` trong `kb/thresholds/lipid.json:875` bị bỏ chết trong mã nguồn, khiến `isElevatedLpa()` tại [helpers.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/helpers.ts#L116-L123) dùng cứng ngưỡng ESC `> 105 nmol/L` cho cả hồ sơ Mỹ.
- **[LIPID-R3-R3-15] Lệch chuẩn hóa đơn vị `nonHdl` cấp gốc (`135 mg/dL` bị đọc thành `135 mmol/L`, `A08`) và `noteText` Mục 2 in số thực 4 chữ số thập phân hệ SI ngược cài đặt `mg/dL` kèm mất `Lp(a)` (`G93`).**

---

### 4.3 Nhóm MINOR & SUGGESTION (4 phát hiện)

- **[LIPID-R3-R3-16] (`Minor`) Sai số công thức Friedewald khi `TG > 4.5 mmol/L` ở BN ASCVD chưa điều trị (`G95`):** Khi `TG = 6.2 mmol/L`, `LDL-C = 1.2 mmol/L` (thấp giả tạo) nhưng `Non-HDL-C = 5.9 mmol/L`, engine bỏ lỡ Statin cường độ cao `Atorvastatin 40–80 mg` (chỉ kê `20–40 mg`) và thiếu cảnh báo cần đo LDL-C trực tiếp / điều trị theo Non-HDL-C & ApoB.
- **[LIPID-R3-R3-17] (`Minor`) Thiếu thẻ `[REFER]` chuyên khoa cho thai phụ HoFH/ASCVD (`LDL = 10.5 mmol/L`, `D52`) để lọc `LDL apheresis` và thai phụ tăng TG rất nặng (`TG = 7.2 mmol/L`, `D47`).**
- **[LIPID-R3-R3-18] (`Minor`) Chưa áp dụng cảnh báo dược động học chủng tộc Châu Á của Rosuvastatin (`fda.rosuvastatin.asian_pk`) khi bệnh nhân có cờ `asian: true` ở hồ sơ `US`/`INTL` (`D54`) hoặc khi chuyển đổi sang `Rosuvastatin 20–40 mg` tại hồ sơ `VN` (`G91c`).**
- **[LIPID-R3-R3-19] (`Suggestion`) Bổ sung ghi chú cá thể hóa khởi đầu liều vừa phải và chia sẻ quyết định ở người bệnh rất cao tuổi (`≥ 80 tuổi`) kèm đồng thời `frailty: true` và `limitedLifespan: true` trong dự phòng thứ phát (`D56`).**

---

## 5. Kết Luận Thẩm Định Vòng 3 (Final Verdict)

Mặc dù module `lipid` đã khắc phục thành công nhiều lỗi quan trọng của Vòng 2 (đặc biệt trên nhóm DDI đơn chất, mục tiêu kép ESC, điểm DLCN, đích phụ Non-HDL/ApoB và cơ chế fail-closed khi thiếu eGFR), kiểm thử đối kháng diện rộng 113 kịch bản sống trong Vòng 3 vẫn phát hiện **7 lỗi `critical`** và **8 lỗi `major`** có nguy cơ gây mất an toàn trực tiếp cho người bệnh (lọt hoàn toàn phụ nữ đang cho con bú, mù viên phối hợp FDC trên thai kỳ/CYP3A4/CKD nặng, xung đột làm ngừng sạch mọi Statin ở bệnh nhân ASCVD, kê liều cao trên xơ gan mất bù Child-Pugh B/C, xử trí sai viêm tụy cấp tăng TG đang diễn tiến, bỏ lọt Rosuvastatin 40 mg ở bệnh nhân chạy thận nhân tạo và trên nền Paxlovid).

Theo tiêu chuẩn bắt buộc tại `docs/REVIEW_PROTOCOL.md` (chỉ `PASS` khi `0 critical` VÀ `0 major`):

**KẾT LUẬN CUỐI CÙNG: `FAIL`**
