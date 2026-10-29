# BÁO CÁO KIỂM ĐỊNH ĐỘC LẬP VÒNG 2 — PHÂN HỆ TĂNG HUYẾT ÁP (`htn`)

- **Vai trò kiểm định**: **R1 – Bác sĩ Chuyên khoa Tim mạch & Tăng huyết áp Độc lập (Cardiology & Guideline Verification Specialist)**
- **Vòng kiểm định**: **Vòng 2 (Round 2 Medical Review Board — Độc lập 100%)**
- **Phân hệ được kiểm định**: `htn` (`src/modules/htn/**` — 13 tệp mã nguồn / 39 quy tắc lâm sàng [24 ngoại trú/chung + 15 nội viện], 2 ma trận tra cứu `htnComorbidityMatrix` & `htnRenalMatrix`, `kb/citations/htn.json` [125 trích dẫn], `kb/thresholds/htn.json` [155 ngưỡng], 18 hồ sơ thuốc sở hữu `htn` + 8 hồ sơ thuốc dùng chung trong `kb/drugs/*.json`, tích hợp engine `src/engine/**`, `docs/modules/HTN.md`)
- **Phương pháp đối chiếu**:
  1. Đọc kiểm tra dòng-theo-dòng toàn bộ 13 tệp mã nguồn `src/modules/htn/**`, tầng hợp nhất & cổng an toàn `src/engine/{evaluate,merge,require}.ts`, `src/engine/safety/{reviewMeds,gates,drugClassify}.ts`.
  2. Thực thi kiểm thử truy vết runtime 21 kịch bản lâm sàng hiểm hóc (`S1` → `S21`) đi qua toàn bộ pipeline chuẩn hóa đơn vị → suy diễn dữ liệu → chạy rule → rà soát thuốc nền → cổng an toàn thận/gan/thai kỳ/chống chỉ định → hợp nhất đa khuyến cáo (`mergeRecommendations`).
  3. Đối chiếu nguyên văn từng trang tài liệu gốc trong `Medical_Library_2026`:
     - **ESC 2024** Guidelines for the management of elevated blood pressure and hypertension (`ESC_2024_elevated_blood_pressure_and_hypertension.pdf`)
     - **AHA/ACC 2025** Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults (`AHA_ACC_2025_High_Blood_Pressure_Guideline.pdf`)
     - **VSH/VNHA 2022** Khuyến cáo Chẩn đoán & Điều trị Tăng huyết áp (`VSH_VNHA_2022_Tang_Huyet_Ap.pdf`)
     - **BYT 3192/QĐ-BYT (2010)** Hướng dẫn chẩn đoán và điều trị tăng huyết áp (`BYT_3192_2010_Tang_Huyet_Ap.pdf`)
     - **KDIGO 2021** Clinical Practice Guideline for the Management of Blood Pressure in Chronic Kidney Disease (`KDIGO_2021_Blood_Pressure_in_CKD.pdf`)
     - **ESC 2025** Guidelines for the management of cardiovascular diseases during pregnancy (`ESC_2025_cardiovascular_diseases_during_pregnancy_management_of.pdf`)
     - **Nhãn thuốc gốc EMA / FDA** trong `09_Nhan_Thuoc/` (`Zanidip_SmPC.pdf`, `Ebrantil_urapidil_SmPC.pdf`, `Physiotens_moxonidine_SmPC.html`, FDA labels của `chlorthalidone`, `clevidipine`, `clonidine`, `doxazosin`).
- **Tệp dữ liệu có cấu trúc đi kèm**: `docs/reviews/htn/round2_R1.json`

---

## 1. Tổng hợp kết quả kiểm định Vòng 2

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã phát hiện (`id`) | Ý nghĩa theo `docs/REVIEW_PROTOCOL.md` |
| :--- | :---: | :--- | :--- |
| **`critical`** | **6** | `R2-R1-HTN-01` → `R2-R1-HTN-06` | Sai lệch y khoa đe dọa trực tiếp tính mạng người bệnh / thai nhi, làm mù cổng an toàn thuốc nguy cơ cao, xóa mất chẹn beta tĩnh mạch trong bóc tách ĐMC cấp hoặc bỏ lọt thuốc độc bào thai; **chặn phát hành bắt buộc**. |
| **`major`** | **8** | `R2-R1-HTN-07` → `R2-R1-HTN-14` | Khuyến cáo Class I / COR 1 hoặc trì hoãn theo ESC 2024 chưa được khắc phục dù `round1_RESPONSE.md` báo cáo đã sửa; vi phạm diện rộng QA-7 / QA-8 / QA-10; sai lệch trích dẫn nguyên văn PDF / COR-LOE; tự mâu thuẫn đích SBP xuất huyết não; **chặn nghiệm thu Vòng 2**. |
| **`minor`** | **4** | `R2-R1-HTN-15` → `R2-R1-HTN-18` | Thiếu cảnh báo hạ áp dưới sàn VSH 2022 ở người cao tuổi đang dùng đa thuốc, chưa phân nhánh đích DBP `< 110` vs `< 105 mmHg` trong tiền sản giật cấp cứu, lỗi lặp chữ `"tĩnh mạch"` trên giao diện và thiếu `kb/drugs/aliskiren.json`. |
| **`suggestion`** | **2** | `R2-R1-HTN-19` → `R2-R1-HTN-20` | Đề xuất bổ sung tư vấn Aspirin liều thấp dự phòng tiền sản giật (Class I / COR 1) và cảnh báo cơn THA kịch phát do tăng catecholamine / u tủy thượng thận (chẹn alpha trước chẹn beta). |
| **TỔNG CỘNG** | **20** | `R2-R1-HTN-01` → `R2-R1-HTN-20` | **Kết luận Vòng 2: `FAIL`** *(Điều kiện `PASS`: `0 critical` và `0 major`)* |

### Thống kê theo phân loại đối tượng (`itemType`)
- `rule`: **15** (`6 critical`, `6 major`, `2 minor`, `1 suggestion` qua `missing`)
- `citation`: **2** (`2 major`)
- `threshold`: **1** (`1 major`)
- `drug`: **1** (`1 minor`)
- `ui`: **1** (`1 minor`)
- `missing`: **2** (`2 suggestion`)

---

## 2. Đánh giá tiến độ khắc phục sau Vòng 1 (`docs/reviews/htn/round1_RESPONSE.md`)

### 2.1. Các hạng mục Vòng 1 đã được khắc phục tốt
1. **`R1-HTN-01` (`differentiate_crisis`)**: Đã gỡ bỏ hoàn toàn `drugId: 'nicardipine'` khỏi thẻ phân tầng cấp cứu tổng quát (`rules.inpatient.ts:138-151`), chấm dứt lỗi tự động truyền Nicardipine cho mọi ca cấp cứu nội viện và bổ sung quy tắc chuyên biệt cho Hội chứng vành cấp (`acute_coronary_syndrome`).
2. **`R1-HTN-05` (`eval_bp_target` trong thai kỳ) & `R1-HTN-16` (`atenolol`, `MRA` thai kỳ)**: Đã tách riêng mục tiêu huyết áp thai kỳ `< 140/90 mmHg` kèm giới hạn sàn bảo vệ tuần hoàn tử cung – nhau thai `≥ 110/80 mmHg`, đồng thời bổ sung quy tắc ngừng Atenolol, Spironolactone/Eplerenone và Sodium nitroprusside trong thai kỳ.
3. **`R1-HTN-06` (`lercanidipine` suy thận)**: Đã sửa dải thận `G4`/`G5` của Lercanidipine trong cả `kb/drugs/lercanidipine.json` và `htnRenalMatrix` sang chống chỉ định khi `eGFR < 30 mL/phút/1.73m²` hoặc lọc máu.
4. **`R1-HTN-08` (`stroke_thrombolysis` EVT Harm) & `R1-HTN-12` (`spironolactone` Bước 3)**: Đã bổ sung cảnh báo tránh hạ SBP tích cực `< 140 mmHg` sau lấy huyết khối cơ học thành công (ESC 2024 / AHA 2025 Class III Harm) và phân nhánh đúng ngưỡng `eGFR ≥ 30` (ESC 2024 Class IIa) so với `eGFR ≥ 45` (VSH 2022 / AHA 2025) cho Spironolactone ở THA kháng trị.
5. **Tái cấu trúc mô-đun**: Đã tách mã nguồn `rules.outpatient.*` và `rules.inpatient.*` thành các tệp chuyên đề rõ ràng và bổ sung các quy tắc an toàn cho hạ huyết áp tư thế, gút cấp, block nhĩ thất cao độ.

### 2.2. Các cam kết trong `round1_RESPONSE.md` chưa khớp thực tế mã nguồn hoặc phát sinh hồi quy mới
1. **Cam kết dòng 42 (`preeclampsia_mgso4` phát `[START] magnesium_sulfate`)**: Thực tế code phát `action: 'START'` nhưng **bỏ trống `drugId` và `dose`**, làm mù toàn bộ cổng an toàn thận/nhược cơ/block tim và gây cộng dồn liều với module `asthma`, đồng thời kích hoạt nhầm cho cả thai phụ THA nặng đơn thuần không có tiền sản giật (`R2-R1-HTN-01`).
2. **Cam kết dòng 52 (`R1-HTN-14`: tích hợp `uacr` vào Bước 1 & tạo mới `ckd_nephroprotection_rasi`)**: Thực tế **không hề tồn tại** rule `ckd_nephroprotection_rasi` trong toàn bộ `src/modules/htn/`, và `step1_monotherapy` vẫn gán cứng `amlodipine` cho bệnh nhân CKD + ĐTĐ + Albumin niệu đại thể A3 (`R2-R1-HTN-07`).
3. **Cam kết dòng 48 (`R1-HTN-10`: trì hoãn khởi trị thuốc trên `INTL` khi `eGFR < 30` đến `≥ 140/90 mmHg`)**: Thực tế `resolveStep1ZeroMedMode` không hề đọc `egfr < 30`, vẫn kê `START amlodipine 5 mg` ở HA `134/82 mmHg` (`R2-R1-HTN-08`).
4. **Cam kết dòng 51 (`R1-HTN-13`: thu hẹp chỉ định bắt buộc chẹn beta)**: Thực tế vẫn dính đồng nghĩa `ascvd`/`vascularDisease`, vẫn kê Bisoprolol cho rung nhĩ có `HR = 62 bpm`, và vẫn mặc định coi `hf: true, lvef: undefined` là HFrEF (`R2-R1-HTN-09`).
5. **Hồi quy nghiêm trọng mới từ việc sửa Vòng 1**: Chặn sạch 100% thuốc uống ngoại trú ở THA nặng không triệu chứng `≥ 180/120 mmHg` không HMOD (`R2-R1-HTN-06`), xung đột `mergeRecommendations` xóa sạch Esmolol tĩnh mạch trong bóc tách ĐMC cấp khi có chẹn beta uống tại nhà (`R2-R1-HTN-03`), và thiếu loại trừ chéo đa-HMOD tại ICU (`R2-R1-HTN-04`).

---

## 3. Chi tiết các phát hiện mức `CRITICAL` (`R2-R1-HTN-01` đến `R2-R1-HTN-06`)

### `R2-R1-HTN-01` [CRITICAL | `rule` | `htn.inpatient.preeclampsia_mgso4`]
**Truyền Magnesium sulfate sản khoa bỏ trống `drugId`/`dose` làm mù hoàn toàn cổng an toàn suy thận/block tim & khử trùng lặp đa module, truyền thường quy sai chỉ định khi không có tiền sản giật, và kê Furosemide tĩnh mạch vô điều kiện trong phù phổi tiền sản giật**

- **Vị trí mã nguồn**: `src/modules/htn/rules.inpatient.neuro_preg.ts:562-590`, `src/modules/htn/rules.inpatient.emergency.ts:738-773`
- **Mô tả sai lệch & truy vết lâm sàng**:
  1. **Thiếu `drugId: 'magnesium_sulfate'` và `dose` làm mù `evaluateSafetyGates` và gây quá liều đa phân hệ**: Dù `round1_RESPONSE.md` (dòng 42) ghi nhận phát `[START] magnesium_sulfate`, hàm `produce()` tại `neuro_preg.ts:569-590` lại phát `action: 'START'` mà không truyền `drugId` lẫn `dose`. Trong khi đó `kb/drugs/magnesium_sulfate.json:33-57` đã có đầy đủ dải thận `< 30 mL/phút` (*giảm ít nhất 50% liều, tránh truyền duy trì liên tục mù*) và chống chỉ định `myasthenia_gravis`, `heart_block`.
     - *Truy vết runtime `S1`* (`pregnant: true, severePreeclampsiaEclampsia: true, acutePulmonaryEdema: true, avBlock2Or3OrSickSinus: true, egfr: 18, sbp: 175, dbp: 112`): Hệ thống phát thẳng y lệnh `[START] Dự phòng và cắt cơn Sản giật: Magnesium sulfate 4 g tĩnh mạch, duy trì 1 g/giờ` với **`0` cảnh báo suy thận nặng / block nhĩ thất** — nguy cơ ngộ độc Mg²⁺ gây mất phản xạ gân xương, liệt cơ hô hấp và ngừng tim! Đồng thời nếu thai phụ đồng mắc cơn hen phế quản cấp nặng (chạy kèm module `asthma`), `mergeRecommendations` không nhận diện được cùng hoạt chất nên phát song song `4 g IV` + `2 g IV` = **`6 g` bolus Magnesium sulfate**.
  2. **Kích hoạt truyền Zuspan MgSO4 thường quy cho mọi thai phụ có HA `≥ 160/110 mmHg` dù không có tiền sản giật/sản giật**: Điều kiện `when` (dòng 568) là `hasCondition(ctx, 'severePreeclampsiaEclampsia') || isPregnantSevereCrisis(ctx)`.
     - *Truy vết runtime `S2`* (`pregnant: true, sbp: 165, dbp: 112`, không tiền sản giật, không protein niệu, không triệu chứng thần kinh): Vẫn bị phát lệnh `[START]` truyền tĩnh mạch liên tục MgSO4 `4 g + 1 g/giờ`, trái với ESC 2024 (chỉ khuyến cáo MgSO4 cho sản giật hoặc tiền sản giật có THA nặng kèm protein niệu hoặc triệu chứng thần kinh).
  3. **Kê `[START] furosemide 20–40 mg tĩnh mạch` vô điều kiện trong phù phổi cấp do tiền sản giật**: Khi `severePreeclampsiaEclampsia: true` kèm `acutePulmonaryEdema: true`, `pulmonary_edema_loop_diuretic` (`emergency.ts:738-773`) tự động phát lệnh tiêm lợi tiểu quai tĩnh mạch thường quy như suy tim trái mạn mất bù mà không có bất kỳ cảnh báo nào về tình trạng cô đặc máu và giảm thể tích huyết tương nội mạch đặc trưng của tiền sản giật.
- **Bằng chứng nguyên văn PDF**:
  - **ESC 2024**, Section 10.4.1 & Recommendation Table 33 (*PDF p. 74*): *"Magnesium sulfate [4 g i.v. over 5 min, then 1 g/h i.v.; or 5 g intramuscularly (i.m.) into each buttock, then 5 g i.m. every 4 h] is recommended for eclampsia treatment but also for women with pre-eclampsia who have severe hypertension and proteinuria or hypertension and neurological symptoms or signs... Since plasma volume is reduced in pre-eclampsia, diuretic therapy should be avoided."*
  - **ESC 2024**, Rec Table 33 (*Class I, Level C, PDF p. 74*): *"In severe hypertension in pregnancy: drug treatment with i.v. labetalol, oral methyldopa, or oral nifedipine is recommended. Intravenous hydralazine is a second-line option."*
- **Hướng khắc phục**:
  1. Gắn đầy đủ `drugId: 'magnesium_sulfate'`, `drugNameVi` và `dose` vào `preeclampsia_mgso4`; kiểm tra trực tiếp `egfr < 30`, thiểu niệu, nhược cơ và block nhĩ thất cao độ để chặn/giảm ≥ 50% liều và yêu cầu định lượng Mg²⁺ huyết thanh sát.
  2. Chỉ phát `START` truyền MgSO4 khi xác nhận `severePreeclampsiaEclampsia`; nếu chỉ mới có `isPregnantSevereCrisis(ctx)` đơn thuần, phát `CONSIDER`/`MONITOR` đánh giá khẩn protein niệu, tiểu cầu, men gan và dấu hiệu thần kinh tiền sản giật.
  3. Trong `pulmonary_edema_loop_diuretic`, khi có `severePreeclampsiaEclampsia`, hạ từ `START` thường quy xuống `CONSIDER` thận trọng tối đa sau Nitroglycerin tĩnh mạch kèm cảnh báo nguy cơ giảm thể tích tuần hoàn tử cung – nhau thai theo ESC 2024 p. 74.

---

### `R2-R1-HTN-02` [CRITICAL | `rule` | `htn.inpatient.preeclampsia_emergency`]
**Tiền sản giật có chống chỉ định Labetalol kèm hẹp van động mạch chủ nặng vẫn bị kê truyền tĩnh mạch `Nicardipine` (chống chỉ định tuyệt đối), và phù phổi tiền sản giật huyết áp thấp vẫn bị phát lệnh hạ áp `Nitroglycerin`**

- **Vị trí mã nguồn**: `src/modules/htn/rules.inpatient.neuro_preg.ts:450-525`, `src/engine/safety/gates.ts:294-335`
- **Mô tả sai lệch & truy vết lâm sàng**:
  1. **Quên gọi `selectIvAgentAvoidingSevereAs(ctx)` ở nhánh sản khoa**: Ngay đầu tệp `neuro_preg.ts` (dòng 22–47), tác giả đã viết hàm `selectIvAgentAvoidingSevereAs(ctx)` và áp dụng cho đột quỵ thiếu máu não, xuất huyết não và bệnh não THA để tránh Nicardipine khi có `severeAorticStenosis`. Tuy nhiên, ở nhánh `if (contraLabetalol)` của `preeclampsia_emergency` (dòng 503–525), code lại gán cứng `drugId: 'nicardipine'` mà không kiểm tra `isSevereAorticStenosis(ctx)`. Do `gates.ts` cũng chưa ánh xạ mã `'severe_aortic_stenosis'` trong `nicardipine.json`, lỗ hổng lọt hoàn toàn qua cả hai tầng bảo vệ.
     - *Truy vết runtime `S3`* (`pregnant: true, severePreeclampsiaEclampsia: true, asthma: true, severeAorticStenosis: true, sbp: 172, dbp: 112, hr: 88`): Hệ thống kê thẳng `[START] nicardipine 5 mg/giờ` không một lời cảnh báo hẹp van ĐMC khít — nguy cơ giãn mạch ngoại biên đột ngột trên nền cung lượng tim cố định gây tụt áp thảm khốc, thiếu máu mạch vành và tử vong mẹ – thai.
  2. **Nhánh phù phổi cấp chạy trước khi kiểm tra ngưỡng huyết áp**: Khối `if (hasCondition(ctx, 'acutePulmonaryEdema'))` (dòng 450–474) trả về `[START] nitroglycerin 5 mcg/phút (Đích < 160/105 mmHg)` trước dòng `if (sbp < sbpTarget && dbp < dbpTarget) return null;` (dòng 477), khiến thai phụ có HA `102/66 mmHg` vẫn bị phát lệnh truyền hạ áp cấp cứu.
- **Bằng chứng nguyên văn PDF**:
  - **AHA/ACC 2025**, Table 26 (*PDF p. 74*): *"Nicardipine | Initial 5 mg/h, increasing every 5 min by 2.5 mg/h to maximum 15 mg/h | Contraindicated in advanced aortic stenosis."*
  - **ESC 2025 Pregnancy Guidelines**, Section 12 (*PDF p. 10*): *"In severe hypertension, drug treatment with i.v. labetalol, urapidil, nicardipine, or oral short acting nifedipine or methyldopa is recommended for acute reduction in blood pressure."*
- **Hướng khắc phục**: Kiểm tra `isSevereAorticStenosis(ctx)` trong nhánh `contraLabetalol` của `preeclampsia_emergency` (phát `AVOID nicardipine` và chuyển sang lựa chọn thay thế như Urapidil chuẩn độ thận trọng dưới theo dõi huyết động xâm lấn + hội chẩn tim mạch – sản khoa tối khẩn), bổ sung ánh xạ `'severe_aortic_stenosis'` vào `evaluateSafetyGates` (`gates.ts`), và đặt điều kiện kiểm tra ngưỡng huyết áp an toàn trước dòng 450.

---

### `R2-R1-HTN-03` [CRITICAL | `rule` | `htn.inpatient.aortic_dissection`]
**Bệnh nhân bóc tách động mạch chủ cấp đang có thuốc chẹn beta uống tại nhà bị `mergeRecommendations` xóa sạch y lệnh `Esmolol` tĩnh mạch nhưng vẫn truyền đơn độc `Nicardipine` tĩnh mạch gây nguy cơ vỡ ĐMC; đồng thời `acute_coronary_syndrome_alt` bỏ quên cổng chặn `Verapamil/Diltiazem`, chẹn beta nền, COPD và suy tim**

- **Vị trí mã nguồn**: `src/modules/htn/rules.inpatient.emergency.ts:154-315, 322-437, 544-591`, `src/engine/merge.ts:190-240`
- **Mô tả sai lệch & truy vết lâm sàng**:
  1. **Tai biến "giãn mạch đơn độc không chẹn beta tĩnh mạch" trong bóc tách ĐMC cấp**: Khi bệnh nhân nhập cấp cứu vì bóc tách ĐMC cấp có `SBP = 192 mmHg, HR = 84 bpm` và trong danh sách thuốc ngoại trú đang dùng tại nhà có `metoprolol_succinate` (hoặc `bisoprolol`):
     - Tầng rule (`aortic_dissection`): không kiểm tra `concurrent beta-blocker therapy` của AHA/ACC 2025 Table 26 nên vẫn phát liều nạp bolus đầy đủ `Esmolol 500–1000 mcg/kg/phút`.
     - Tầng hợp nhất (`mergeRecommendations`): thấy trong `currentMeds` đã có `metoprolol_succinate` cùng nhóm `beta_blocker` với `esmolol`, nên **tự động biến đổi `[START] esmolol` (truyền tĩnh mạch ICU) thành `[CONTINUE] metoprolol_succinate` (viên uống CR/XL) — xóa trắng hoàn toàn y lệnh chẹn beta tĩnh mạch!** Trong khi đó, quy tắc `aortic_dissection_vasodilator` (dòng 408) thấy không có chống chỉ định chẹn beta nên **VẪN phát lệnh `[START] nicardipine 5 mg/giờ`!**
     - *Truy vết runtime `S5`* (`aorticDissection: true, sbp: 192, dbp: 108, hr: 84, currentMeds: [{drugId: 'metoprolol_succinate'}]`): Kết quả cuối cùng trả cho bác sĩ là `[CONTINUE] metoprolol_succinate` + `[START] nicardipine 5 mg/giờ` — tức truyền giãn mạch DHP tĩnh mạch ngay lập tức trên bệnh nhân đang có `HR = 84 bpm` mà không hề có chẹn beta tĩnh mạch khống chế nhịp, gây phản xạ giao cảm tăng vọt $dP/dt$ và vỡ động mạch chủ!
  2. **Lỗ hổng cổng an toàn Esmolol trong Hội chứng vành cấp có PDE-5i (`acute_coronary_syndrome_alt`, dòng 559–565)**: Biến `canUseEsmolol` chỉ kiểm tra nhịp tim, block AV, hen phế quản và phù phổi cấp nhưng **bỏ quên hoàn toàn** `NDHP_CCB_IDS` (`verapamil`/`diltiazem` — trong khi chính `aortic_dissection` dòng 211 đã chặn vì nguy cơ vô tâm thu!), bỏ quên `BB_IDS` (khiến `START esmolol` bị biến thành `CONTINUE bisoprolol` làm bệnh nhân ACS + PDE-5i mất sạch thuốc hạ áp tĩnh mạch trong truy vết `S4`), và bỏ quên `copd` / `hf`.
- **Bằng chứng nguyên văn PDF**:
  - **AHA/ACC 2025**, Table 26 (*PDF p. 74*): *"Esmolol | Loading dose 500-1,000 mcg/kg/min over 1 min followed by a 50-mcg/kg/min infusion... | Contraindicated in patients with concurrent beta-blocker therapy, bradycardia, or decompensated HF. Monitor for bradycardia. Higher doses may block beta-2 receptors and impact lung function in reactive airway and obstructive pulmonary disease."*
  - **AHA/ACC 2025**, Table 27 (*PDF p. 75*): *"Acute aortic dissection | Beta blockade should precede vasodilator (eg, nicardipine or nitroprusside) administration, if needed for BP control or to prevent reflex tachycardia or inotropic effect; SBP ≤120 mm Hg should be achieved within 20 min."*
- **Hướng khắc phục**:
  1. Không cho phép `mergeRecommendations` gộp/biến đổi y lệnh thuốc truyền tĩnh mạch cấp cứu tại ICU (`esmolol`, `labetalol` IV) thành `CONTINUE` viên uống ngoại trú tác dụng chậm. Trong `aortic_dissection`, nếu người bệnh đã uống chẹn beta nền tại nhà mà `HR` vẫn `≥ 60 bpm`, cảnh báo tránh tiêm liều bolus nạp đầy đủ mù quáng và hướng dẫn chuẩn độ truyền tĩnh mạch thận trọng không bolus dưới theo dõi huyết động xâm lấn đạt `HR < 60 bpm` trước khi truyền Nicardipine.
  2. Bổ sung kiểm tra `NDHP_CCB_IDS`, `BB_IDS`, `copd`, `hf` vào `canUseEsmolol` của `acute_coronary_syndrome_alt` để chuyển sang Urapidil tĩnh mạch an toàn.

---

### `R2-R1-HTN-04` [CRITICAL | `rule` | `htn.inpatient.pulmonary_edema`]
**Thiếu điều kiện loại trừ chéo giữa các bệnh cảnh cấp cứu nội viện (multi-HMOD), phát đồng thời hai y lệnh trái ngược nhau trực diện tại ICU**

- **Vị trí mã nguồn**: `src/modules/htn/rules.inpatient.emergency.ts:602-605, 702-703`, `src/modules/htn/rules.inpatient.neuro_preg.ts:187-188`
- **Mô tả sai lệch & truy vết lâm sàng**:
  1. **Bóc tách động mạch chủ cấp biến chứng Phù phổi cấp (`aorticDissection: true && acutePulmonaryEdema: true` — bệnh cảnh kinh điển của bóc tách ĐMC lên Stanford type A gây hở van ĐMC cấp)**: Trong khi `acute_coronary_syndrome` (dòng 448) và `hypertensive_encephalopathy` (`neuro_preg.ts:640`) đều có `!hasCondition(ctx, 'aorticDissection')`, thì `pulmonary_edema` (dòng 602) và `pulmonary_edema_alt_vasodilator` (dòng 702) lại quên loại trừ `aorticDissection`.
     - *Truy vết runtime `S6`* (`aorticDissection: true, acutePulmonaryEdema: true, sbp: 195, dbp: 110, hr: 88`): Hệ thống phát cùng lúc thẻ `[AVOID] nicardipine` (*"KHÔNG truyền đơn độc thuốc giãn mạch khi nhịp tim chưa khống chế HR = 88 ≥ 60 bpm làm tăng vọt lực xé dP/dt và gây vỡ bóc tách ĐMC"*) VÀ thẻ `[START] nitroglycerin 5 mcg/phút` (*"Đích SBP < 140 mmHg"*)!
  2. **Đột quỵ thiếu máu não cấp không tiêu sợi huyết đồng mắc bệnh cảnh bắt buộc hạ áp khẩn (`aorticDissection`, `acuteAcsWithin24h`, `acutePulmonaryEdema`, `severePreeclampsiaEclampsia`)**: Quy tắc `stroke_no_thrombolysis` (`neuro_preg.ts:187-188`) quên kiểm tra ngoại lệ bệnh đồng mắc cấp cứu của AHA/ACC 2025 Section 5.3.9.2 Rec 5.
     - *Truy vết runtime `S7`* (`aorticDissection: true, acuteIschemicStroke: true, sbp: 195, dbp: 105, hr: 86`): Hệ thống phát đồng thời `[HOLD] TRÌ HOÃN hạ áp tích cực trong Nhồi máu não không tiêu sợi huyết` VÀ `[START] Esmolol + Nicardipine đưa SBP ≤ 120 mmHg trong 20 phút`!
- **Bằng chứng nguyên văn PDF**:
  - **AHA/ACC 2025**, Section 5.3.9.2 Rec 5 (*COR 3: No Benefit, LOE A, PDF p. 56*) & Supportive Text (*PDF p. 57*): *"In patients with BP <220/120 mm Hg who do not receive IV thrombolysis or endovascular treatment and do not have a comorbid condition requiring urgent antihypertensive treatment, initiating or reinitiating treatment of hypertension within the first 48 to 72 hours after an acute ischemic stroke is not effective..."* & *"It should be noted that early treatment of hypertension is indicated when required by comorbid conditions (eg, concomitant acute coronary event, acute HF, aortic dissection, post-fibrinolysis symptomatic ICH, or preeclampsia/eclampsia)."*
- **Hướng khắc phục**: Bổ sung `!hasCondition(ctx, 'aorticDissection')` vào `pulmonary_edema` & `pulmonary_edema_alt_vasodilator` (thiết kế nhánh hội chẩn phẫu thuật tim mạch tối khẩn riêng cho bóc tách ĐMC biến chứng suy tim cấp/hở chủ cấp); bổ sung loại trừ các bệnh đồng mắc cấp cứu bắt buộc hạ áp ngay vào `stroke_no_thrombolysis`.

---

### `R2-R1-HTN-05` [CRITICAL | `rule` | `htn.outpatient.pregnancy_contraindication_rasi`]
**Lỗi cắt cụt đa thuốc (`rasiList[0]` / `.find()`) làm bỏ lọt thuốc chống chỉ định thứ 2 đang dùng: để lọt `Aliskiren` độc bào thai ở thai phụ nội viện (kèm 0 thuốc thay thế), để lọt `Labetalol` trong phù phổi cấp và để lọt `Clonidine` trong hạ huyết áp tư thế**

- **Vị trí mã nguồn**: `src/modules/htn/rules.outpatient.special.ts:242`, `src/modules/htn/rules.inpatient.emergency.ts:784`, `src/modules/htn/rules.outpatient.safety.ts:840, 868, 961, 1017`, `src/engine/safety/drugClassify.ts:10-19`
- **Mô tả sai lệch & truy vết lâm sàng**:
  Do kiến trúc mỗi `RuleEntry.produce()` chỉ trả về một `Recommendation | null`, nhiều quy tắc an toàn dùng `[0]` hoặc `.find()` trên mảng thuốc đang dùng, làm rơi hoàn toàn thuốc vi phạm thứ 2 trở đi:
  1. **Thai kỳ bỏ lọt `aliskiren` (ức chế trực tiếp renin gây độc thận/tử vong bào thai) và bỏ rơi thai phụ nội viện không thuốc thay thế**: `pregnancy_contraindication_rasi` chỉ dừng `rasiList[0]`. Ở ngoại trú nếu có 2 thuốc ACEi+ARB thì tình cờ `ban_dual_rasi` bắt được thuốc thứ 2, nhưng `ban_dual_rasi` chỉ chạy ở `setting: 'outpatient'` và `aliskiren` chưa có trong `kb/drugs/` lẫn `NON_KB_PREGNANCY_CONTRA_FALLBACK` (`drugClassify.ts`).
     - *Truy vết runtime `S18`* (Inpatient VN `{pregnant: true, sbp: 152, dbp: 96, currentMeds: [losartan, aliskiren, spironolactone]}`): Hệ thống chỉ phát `[STOP] losartan` và `[STOP] spironolactone`, **bỏ lọt hoàn toàn `aliskiren`**, đồng thời xuất **`0` thuốc hạ áp an toàn thay thế** vì `pregnancy_safe_initiation` bị khóa cứng ở `setting: 'outpatient'`!
  2. **Phù phổi cấp nội viện đang dùng 2 chẹn beta (`bisoprolol` + `labetalol`)**: `pulmonary_edema_bb_safety` (`emergency.ts:784`) chỉ phát `[HOLD] bisoprolol`, để mặc `labetalol` tiếp tục ức chế co bóp cơ tim (*truy vết `S17`*).
  3. **Hạ huyết áp tư thế / Block AV độ 2–3 / Gút cấp ngoại trú dùng ≥ 2 thuốc thủ phạm**: Ví dụ bệnh nhân hạ HA tư thế đang uống `doxazosin` + `clonidine` (*truy vết `S16`*) chỉ được `[SWITCH] doxazosin`, để lọt `clonidine` và còn được kê thêm `[START] amlodipine 2.5 mg`.
- **Bằng chứng nguyên văn PDF**:
  - **AHA/ACC 2025**, Section 5.5 Rec 5 (*COR 3: Harm, LOE C-LD, PDF p. 64*): *"Individuals with hypertension who are planning a pregnancy or who become pregnant should not be treated with atenolol, ACEi, ARB, direct renin inhibitors, nitroprusside, or MRA to avoid fetal harm."*
  - **VSH/VNHA 2022**, Bảng 16 (*Loại III, Mức C, PDF tr. 44*): *"Chống chỉ định dùng các thuốc ức chế RAS bao gồm Ức chế men chuyển, Chẹn thụ thể Angiotensine II, Ức chế renin trực tiếp, và lợi tiểu kháng thụ thể Mineralocorticoid."*
  - **ESC 2024**, Rec Table 24 (*Class I, Level A, PDF p. 64*): *"switch BP-lowering medications that worsen orthostatic hypotension to an alternative BP-lowering therapy."*
- **Hướng khắc phục**: Bổ sung `'aliskiren'` vào `kb/drugs/aliskiren.json` và `drugClassify.ts`; mở rộng `ban_dual_rasi` và khởi trị thuốc uống thai kỳ (`140–159/90–109 mmHg`) sang `setting: 'both'`; đồng thời nâng cấp tầng `reviewCurrentMedications` hoặc tách quy tắc quét hết mọi phần tử thuốc chống chỉ định thay vì dừng ở phần tử đầu tiên `.find()`.

---

### `R2-R1-HTN-06` [CRITICAL | `rule` | `htn.outpatient.triage_hypertensive_crisis`]
**Bệnh nhân ngoại trú tăng huyết áp nặng không triệu chứng (`HA ≥ 180/120 mmHg`, không có HMOD cấp) bị chặn sạch 100% phác đồ thuốc uống và bị phát lệnh chuyển Cấp cứu đồng loạt, tự mâu thuẫn ngay trong chính văn bản rule**

- **Vị trí mã nguồn**: `src/modules/htn/helpers.ts:302`, `src/modules/htn/rules.outpatient.safety.ts:90-114`, `src/engine/safety/reviewMeds.ts:309-330`
- **Mô tả sai lệch & truy vết lâm sàng**:
  Hàm `isOutpatientCrisisOrUnstable(ctx)` (`helpers.ts:302`) trả về `true` cho mọi trường hợp `sbp >= 180 || dbp >= 120` bất kể có HMOD hay không, qua đó chặn đứng toàn bộ quy tắc khởi trị / nâng bậc thuốc uống Bước 1–3 trong `rules.outpatient.steps.ts`.
  - *Truy vết runtime `S8`* (Outpatient US `{age: 55, sex: 'M', sbp: 186, dbp: 112, egfr: 78, k: 4.2, conditions: {htn: true}, currentMeds: []}` — không đau ngực, không khó thở, không dấu thần kinh, không mang thai): Hệ thống xuất **2 thẻ `[REFER]` chuyển cấp cứu** và **`0` thuốc hạ áp đường uống**, trong khi chính `rationale` của thẻ `triage_hypertensive_crisis` lại viết: *"nếu xác nhận tăng huyết áp nặng đơn thuần KHÔNG có tổn thương cơ quan đích cấp, xử trí an toàn bằng khởi trị hoặc tái lập thuốc hạ áp đường uống ngoại trú, theo dõi sát trong 1–7 ngày"*!
- **Bằng chứng nguyên văn PDF**:
  - **AHA/ACC 2025**, Top Take-Home Message 10 (*PDF p. 6*) & Section 6.2 Synopsis (*PDF p. 73*): *"patients with severe hypertension without evidence of acute target organ damage (previously called hypertensive urgency) should not have aggressive BP lowering in the short-term or be given parenteral antihypertensive drug therapy. Reinstitution or intensification of oral antihypertensive medications, preferably in the outpatient setting, is recommended for these patients."*
  - **ESC 2024**, Section 10.1.1 (*PDF p. 73*): *"While these patients require BP reduction, they do not usually require admission to hospital, and BP reduction is best achieved with oral medication according to the drug treatment algorithm presented in Section 8."*
  - **VSH/VNHA 2022**, Mục 3.6.5 (*PDF tr. 40*): *"Bệnh nhân tăng HA đáng kể nhưng nếu không có tổn thương cơ quan đích cấp tính được gọi là tăng huyết áp khẩn trương (urgent) và thường có thể được điều trị bằng liệu pháp hạ huyết áp đường uống."*
- **Hướng khắc phục**: Chỉ đặt `isOutpatientCrisisOrUnstable = true` và phát `action: 'REFER'` khi có **HMOD cấp**, **thai kỳ HA `≥ 160/110 mmHg`**, hoặc **sinh hiệu/điện giải nguy kịch**. Khi `HA ≥ 180/120 mmHg` đã xác nhận không có HMOD cấp và không mang thai: phát thẻ cảnh báo `MONITOR` (*khám loại trừ HMOD cấp, cấm tuyệt đối Nifedipine ngậm dưới lưỡi, hẹn tái khám sát 1–7 ngày*) đồng thời **cho phép các quy tắc phối hợp thuốc uống Bước 1–3 hoạt động bình thường**.

---

## 4. Chi tiết các phát hiện mức `MAJOR` (`R2-R1-HTN-07` đến `R2-R1-HTN-14`)

### `R2-R1-HTN-07` [MAJOR | `rule` | `htn.outpatient.step1_monotherapy`]
**Lỗi Vòng 1 (`R1-HTN-14`) chưa được sửa dù `round1_RESPONSE.md` báo cáo `100% FIXED`: không tồn tại rule `ckd_nephroprotection_rasi` và `step1_monotherapy` gán cứng `Amlodipine` cho bệnh nhân CKD + Đái tháo đường + Albumin niệu đại thể A3**

- **Vị trí mã nguồn**: `src/modules/htn/rules.outpatient.steps.ts:355-384`, `src/modules/htn/rules.outpatient.special.ts:738-785`
- **Mô tả sai lệch & truy vết lâm sàng**:
  Kiểm tra toàn bộ `src/modules/htn/` xác nhận không hề có quy tắc `ckd_nephroprotection_rasi` như tuyên bố tại `round1_RESPONSE.md` dòng 52; trường `uacr` hiện chỉ được đọc duy nhất ở quy tắc cân nhắc SGLT2i (`ckd_albuminuria_sglt2i_consider`).
  1. Ở mọi nhánh khởi trị đơn trị Bước 1 (US Stage 1 `130–139/80–89`, INTL Elevated BP `130–139/80–89`, VN HA bình thường-cao nguy cơ cao `130–139/85–89`, hoặc người cao tuổi/suy yếu), `step1_monotherapy` gán cứng `drugId: 'amlodipine'`. *Truy vết `S10`* (`US`, `sbp: 134, dbp: 82, egfr: 48, uacr: 45 mg/mmol [~398 mg/g], ckd: true, dm: true`): Bệnh nhân nhận đơn độc **`[START] amlodipine 5 mg/ngày`** thay vì ACEi/ARB bảo vệ thận (COR 1, LOE A)!
  2. *Truy vết `S11`* (`VN`, `sbp: 124, dbp: 76, egfr: 45, uacr: 60 mg/mmol, ckd: true, currentMeds: [amlodipine, indapamide]`): Không có bất kỳ khuyến cáo bổ sung hay chuyển sang ACEi/ARB nào.
- **Bằng chứng nguyên văn PDF**: **AHA/ACC 2025** Section 5.3.1 Rec 4 (*COR 1, LOE A, PDF p. 50*) & Section 5.3.8 Rec 2 (*COR 1, LOE B-R, PDF p. 54*); **KDIGO 2021 BP** Rec 3.2.1 & 3.2.3 (*1B, PDF p. 29*); **ESC 2024** Rec Table 26 (*Class IIa, Level B, PDF p. 65*); **VSH 2022** Hình 4 (*tr. 25*).
- **Hướng khắc phục**: Trong `step1_monotherapy`, ưu tiên khởi trị Perindopril (hoặc Losartan nếu tiền sử ho/phù mạch ACEi) khi người bệnh có albumin niệu `uacr ≥ 3 mg/mmol` (`≥ 30 mg/g`) hoặc `ckd + dm` và đủ điều kiện an toàn thận/kali/thai kỳ; đồng thời cài đặt thực chất quy tắc `ckd_albuminuria_rasi` rà soát phác đồ thiếu RASi.

---

### `R2-R1-HTN-08` [MAJOR | `rule` | `htn.outpatient.step1_monotherapy`]
**Lỗi Vòng 1 (`R1-HTN-10`) chưa được sửa trên profile `INTL`: bệnh nhân CKD nặng G4–G5 (`eGFR < 30 mL/phút/1.73m²`) có Elevated BP `130–139/80–89 mmHg` vẫn bị kê thuốc ngay thay vì trì hoãn đến `> 140/90 mmHg` theo ESC 2024**

- **Vị trí mã nguồn**: `src/modules/htn/rules.outpatient.steps.ts:95-145`
- **Mô tả sai lệch & truy vết lâm sàng**: Hàm `resolveStep1ZeroMedMode` hoàn toàn không đọc `egfr < 30`. Vì `hasCondition(ctx, 'ckd')` kích hoạt `hasHighCvRiskComorbidity = true`, bệnh nhân CKD G4 (`egfr = 22`, `BP = 134/82 mmHg`, *truy vết `S12`*) trên profile `INTL` vẫn bị phát lệnh `[START] amlodipine 5 mg/ngày`, trái trực tiếp với quy định trì hoãn khởi trị thuốc của ESC 2024.
- **Bằng chứng nguyên văn PDF**: **ESC 2024**, Section 8.4 (*PDF p. 52*): *"consideration of BP-lowering drug treatment should be deferred until BP is >140/90 mmHg in the following settings: pre-treatment symptomatic orthostatic hypotension, age ≥85 years, clinically significant moderate-to-severe frailty, and/or limited predicted lifespan (<3 years) due to high competing risk (including eGFR < 30 mL/min/1.73 m2)."*
- **Hướng khắc phục**: Trên nhánh `profile === 'INTL'` trong `resolveStep1ZeroMedMode` và `lifestyle_elevated_bp`, bổ sung điều kiện trì hoãn khởi trị thuốc đến `≥ 140/90 mmHg` khi `egfr !== undefined && egfr < 30`.

---

### `R2-R1-HTN-09` [MAJOR | `rule` | `htn.outpatient.compelling_beta_blocker`]
**Lỗi Vòng 1 (`R1-HTN-13`) vẫn tồn tại ở `compelling_beta_blocker`: kê chẹn beta cho mọi bệnh mạch máu ngoại biên/đột quỵ qua đồng nghĩa `ascvd`, kê cho rung nhĩ nhịp `62 bpm`, và vi phạm fail-closed QA-1/QA-9 khi suy tim thiếu `lvef`**

- **Vị trí mã nguồn**: `src/modules/htn/rules.outpatient.special.ts:60-180`, `src/engine/types.ts:419`
- **Mô tả sai lệch & truy vết lâm sàng**:
  1. `hasCondition(ctx, 'cad')` ánh xạ hai chiều với `ascvd` và `vascularDisease`, khiến bệnh nhân chỉ có bệnh động mạch ngoại biên hoặc tiền sử đột quỵ (`ascvd: true`, *truy vết `S13`*) bị kê ngay 3 thuốc hạ áp ở Bước 1 (`bisoprolol` + `amlodipine` + `perindopril`).
  2. `hasAfibIndication` dùng ngưỡng sàn `htn.bb.hr_min_initiate` (`60 bpm`) thay vì ngưỡng cần kiểm soát tần số thất (`≥ 80 bpm`), khiến bệnh nhân rung nhĩ có `HR = 62 bpm` (*truy vết `S14`*) vẫn bị kê Bisoprolol để "kiểm soát tần số thất".
  3. Khi `conditions.hf = true` nhưng `lvef === undefined` (*truy vết `S15`*), rule không phát `missingInputRec('htn', 'lvef', ...)` mà mặc định gán là HFrEF và phát `[START] bisoprolol` mang nhãn `"(suy tim phân suất tống máu giảm)"` — nguy cơ kê chẹn beta sai chỉ định cho bệnh nhân HFpEF (AHA/ACC 2025 Section 5.3.4.2, *PDF p. 53*).
- **Hướng khắc phục**: Tách kiểm tra chỉ định mạch vành khỏi bí danh rộng `ascvd`/`vascularDisease`, yêu cầu `HR ≥ 80 bpm` mới kích hoạt kiểm soát tần số thất trong rung nhĩ, và phát `missingInputRec('htn', 'lvef', ...)` theo chuẩn QA-1/QA-9 khi `hf = true` mà thiếu `lvef`.

---

### `R2-R1-HTN-10` [MAJOR | `citation` | `kb/citations/htn.json`]
**Vi phạm hệ thống QA-7 trên diện rộng: quote cắt xén biến ngưỡng MRA `K > 4.5` thành ngưỡng giả `5.0 mmol/L` cho RASi, quote chép nhầm dòng thuốc hoàn toàn khác tại AHA 2025 Table 13, và 16/18 file thuốc HTN dẫn bảng liều rỗng thay vì nhãn thuốc gốc có sẵn trong thư viện**

- **Vị trí mã nguồn**: `kb/citations/htn.json`, `kb/drugs/*.json` (16/18 file thuốc sở hữu bởi `htn`), `src/modules/htn/matrix.ts`, `kb/thresholds/htn.json`
- **Các bằng chứng sai lệch điển hình qua đối chiếu PDF**:
  1. **`vsh.htn.2022.resistant_k5`** (`kb/citations/htn.json:121-128`, gắn cho `htn.rasi.k_initiate_max = 5.0 mmol/L`): Trên **VSH 2022 Hình 4 (PDF tr. 25)**, câu gốc là chú thích của MRA: *"*** Cẩn trọng khi MLCT < 45 ml/p/1.73m2, K > 4.5 mmol/L"* đứng ngay trước chú thích *"# A: ƯCMC hoặc CTTA hoặc ARNI"*. File trích dẫn đã cắt cụt nửa đầu câu để bắt đầu từ chữ `"5 mmol/L # A: ƯCMC..."`, biến con số `.5` của `4.5 mmol/L` thành ngưỡng giả `5.0 mmol/L` cho ACEi/ARB (trong khi VSH 2022 Bảng 11 tr. 33 quy định chống chỉ định ACEi/ARB là `K > 5.5 mmol/L`, và citation thứ hai `aha.acc.2025.table18_k50` tr. 53 cũng là dòng MRA chứ không phải ACEi/ARB!).
  2. **`aha.acc.2025.table13_eplerenone_furosemide`** (dòng 631–637, gắn cho Furosemide uống/tĩnh mạch): Quote thực tế là `"Losartan 50-100 1 or 2 Olmesartan 20-40 1"` — hoàn toàn **không có một chữ Furosemide hay Eplerenone nào** (dù ngay phía trên/dưới trong AHA 2025 Table 13 p. 40 có dòng thật `"Furosemide 20-80 2"` và `"Eplerenone 50-100 1 or 2"`).
  3. **`aha.acc.2025.table13_losartan_ccb_bb`** (dòng 623–629, gắn cho Losartan ở Bước 1): Quote thực tế chỉ nói về `"Diltiazem ER 120-360 1 Avoid routine use with beta blockers..."` — **không có chữ Losartan nào**!
  4. **16/18 hồ sơ thuốc HTN sở hữu & `htnRenalMatrix` dẫn sai nguồn**: Ví dụ `lercanidipine.json` dẫn `vsh.htn.2022.drugs_table_rasi_bb` (chỉ có 2 con số `"Lercanidipine 10 20"`) cho chống chỉ định GFR < 30, lọc máu, suy gan nặng, ketoconazole tăng 15 lần AUC, ciclosporin tăng 3 lần AUC; `urapidil.json` dẫn câu nói chung về thuốc tiết ít qua sữa mẹ (`esc.htn.2024.pregnancy_lactation_thiazide`, không nhắc tới urapidil) để kết luận chống chỉ định cho con bú; `moxonidine.json` dẫn bảng chống chỉ định chẹn beta cho dải thận eGFR 30–59 và phù mạch — trong khi `Medical_Library_2026/09_Nhan_Thuoc/` đã có sẵn `EMA/Zanidip_SmPC.pdf`, `EMA/Ebrantil_urapidil_SmPC.pdf`, `EMA/Physiotens_moxonidine_SmPC.html` và 4 FDA labels nhưng chưa được đăng ký vào `kb/sources.json`!
- **Hướng khắc phục**: Đăng ký đầy đủ các SmPC/FDA label có sẵn trong `09_Nhan_Thuoc/` vào `kb/sources.json` và trích xuất nguyên văn cho 16 file thuốc & `matrix.ts`; sửa ngay các quote chép lệch dòng tại AHA 2025 Table 13 và gỡ bỏ quote cắt xén `vsh.htn.2022.resistant_k5`.

---

### `R2-R1-HTN-11` [MAJOR | `citation` | `kb/citations/htn.json`]
**Sai lệch COR, LOE, số trang `pdfPage` và số đề mục `locator` giữa `kb/citations/htn.json`, văn bản `rationale` trong rules và tài liệu PDF gốc**

- **Chi tiết đối chiếu PDF**:
  1. **Gộp khuyến cáo làm sai COR/LOE**: `esc.htn.2024.ckd_rec26` gán chung `cor: "I", loe: "A"` cho cả hàng microalbuminuria vốn chỉ đạt **Class IIa, Level B** (*ESC 2024 PDF p. 65*); `aha.acc.2025.pregnancy_recs` gán chung `loe: "B-R"` làm hạ thấp Rec 1 (labetalol & nifedipine ER) vốn đạt **COR 1, LOE A** (*AHA 2025 PDF p. 64*).
  2. **Sai `pdfPage` trong ESC 2024**: `pregnancy_targets_rec22` & `pregnancy_severe_rec22` ghi `pdfPage: 15` (trang tóm tắt đầu bài) thay vì trang thật của Recommendation Table 22 là **`pdfPage: 60`**; `oh_switch_rec24` ghi `pdfPage: 11` thay vì **`pdfPage: 64`**.
  3. **Sai số mục `locator` trong AHA/ACC 2025**: Ghi `Section 5.3.7` cho CKD (đúng là **`Section 5.3.8`**, p. 54) và ghi `Section 5.3.6.1 / 5.3.6.2` cho xuất huyết não & đột quỵ thiếu máu não (đúng là **`Section 5.3.9.1`** và **`Section 5.3.9.2`**, pp. 55–57).
  4. **Sai COR/LOE trong chuỗi `rationale` hiển thị lâm sàng**: `stroke_no_thrombolysis` (`neuro_preg.ts:226`) viết `"ESC 2024 (Class IIb)"` cho hạ áp khi `≥ 220/110` (đúng là **Class IIa, Level C**); `intracerebral_hemorrhage` (`neuro_preg.ts:321`) viết `"Rec 2, COR 3: Harm"` khi dẫn `ich_rec1` (ngưng thuốc khi `< 130` thuộc Rec 1 COR 2a LOE A, cấm hạ `< 130` khi `SBP > 220` thuộc Rec 3 COR 3: Harm); `preeclampsia_emergency` (`neuro_preg.ts:464`) viết `"loại I mức B (ESC 2024 Section 10.3)"` (đúng là **Section 10.4 / Rec Table 33, Class I, Level C**); `orthostatic_switch_culprits` (`safety.ts:971`) viết `"Class I, Level C"` (đúng là **Class I, Level A**).
- **Hướng khắc phục**: Tách riêng từng dòng khuyến cáo có COR/LOE khác nhau thành các citation độc lập, cập nhật đúng `pdfPage` / `locator`, và đồng bộ toàn bộ chuỗi `rationale` trong code.

---

### `R2-R1-HTN-12` [MAJOR | `threshold` | `src/modules/htn/helpers.ts`]
**Vi phạm QA-8 (gắn nhãn giả `// qa-allow` để nhúng hằng số kali và nhịp tim nguy kịch trong `helpers.ts`), QA-10 (sai `quantity` vật lý trong `kb/thresholds/htn.json`) và mượn chéo threshold `*_target_us` cho profile `INTL`**

- **Vị trí mã nguồn**: `src/modules/htn/helpers.ts:280-283, 305-306`, `kb/thresholds/htn.json:451-538`
- **Chi tiết sai phạm**:
  1. `helpers.ts:305`: `if (k !== undefined && k >= kMaxRasi + 0.5) return true; // qa-allow: unit-conversion` — lạm dụng cờ miễn trừ đổi đơn vị để nhúng hằng số lâm sàng Kali `6.0 mmol/L`.
  2. `helpers.ts:306`: `if (hr !== undefined && (hr < 40 || hr > 150)) return true; // qa-allow: index` — lạm dụng cờ miễn trừ chỉ số mảng để nhúng cứng ngưỡng nhịp tim `< 40` và `> 150 bpm`.
  3. `kb/thresholds/htn.json`: 4 ngưỡng cấp cứu khai báo sai `quantity` so với `unit`: `stroke_no_rtpa_window_h` (`hours` → `duration_days`), `aortic_window_min` (`minutes` → `count`), `mgso4_load_g` (`g` → `dose_mg`) và `mgso4_maint_g_h` (`g/h` → `dose_mg`).
  4. `getUncontrolledBpCutoffs` (`helpers.ts:280-283`): nhánh `INTL` gọi `htn.bp.sbp_target_us` / `dbp_target_us` thay vì ngưỡng của ESC 2024.
- **Hướng khắc phục**: Xóa toàn bộ `// qa-allow` sai mục đích trong `helpers.ts` và đưa các ngưỡng sinh hiệu/điện giải nguy kịch vào `kb/thresholds/htn.json`; chuẩn hóa `quantity` cho 4 ngưỡng cấp cứu; dùng threshold riêng của ESC 2024 cho nhánh `INTL`.

---

### `R2-R1-HTN-13` [MAJOR | `rule` | `htn.inpatient.hypertensive_encephalopathy`]
**Gộp chung Tăng huyết áp chu phẫu (`perioperativeHypertension`) vào quy tắc Bệnh não tăng huyết áp / THA ác tính: gán nhãn chẩn đoán sai trên giao diện, sai ngưỡng DBP kích hoạt (`100` thay vì `90 mmHg`) và thiếu phác đồ đặc thù chu phẫu**

- **Vị trí mã nguồn**: `src/modules/htn/rules.inpatient.neuro_preg.ts:626-741`
- **Mô tả sai lệch**: Bệnh nhân chỉ có `perioperativeHypertension: true` (ví dụ `BP = 175/98 mmHg`, tỉnh táo hoàn toàn, *truy vết `S20`*) bị hiển thị phân tầng `'Cấp cứu Tăng huyết áp (Bệnh não THA / THA ác tính)'` kèm giải thích bệnh não THA, đồng thời bị bỏ sót nếu HA ở vùng `160–160 / 90–99 mmHg` (AHA/ACC 2025 Table 27 định nghĩa THA chu phẫu từ `≥ 160/90 mmHg` hoặc tăng `≥ 20%` so với HA trước mổ `> 15 phút`).
- **Hướng khắc phục**: Tách quy tắc riêng `htn.inpatient.perioperative_hypertension` với ngưỡng `≥ 160/90 mmHg`, hướng dẫn xử trí nguyên nhân chu phẫu (đau, đặt/rút nội khí quản, căng bàng quang, thiếu oxy/ưu thán), duy trì chẹn beta nền và chọn thuốc tĩnh mạch tác dụng ngắn dễ chuẩn độ (`Clevidipine`, `Esmolol`, `Nicardipine`, `Nitroglycerin`) bám sát HA nền trước mổ theo AHA/ACC 2025 Table 27 (*PDF p. 75*) & ESC 2024 Section 10.5 (*PDF p. 74*).

---

### `R2-R1-HTN-14` [MAJOR | `rule` | `htn.inpatient.intracerebral_hemorrhage`]
**Tự mâu thuẫn toán học trực diện giữa `title` và `rationale` khi xuất huyết não cấp nhập viện với `SBP > 230 mmHg` trên profile `INTL` (hoặc `> 250 mmHg` trên `VN`)**

- **Vị trí mã nguồn**: `src/modules/htn/rules.inpatient.neuro_preg.ts:339-382`
- **Mô tả sai lệch & truy vết lâm sàng**: Trong ca xuất huyết não có `SBP = 240 mmHg` trên profile `INTL` (*truy vết `S21`*), biến `windowText` vẫn giữ cứng `'140–160 mmHg'`, khiến dòng tiêu đề chính ra lệnh: **`"Hạ áp mượt trong ICH bằng Nicardipine: Đích SBP 140–160 mmHg"`** (tức yêu cầu giảm `80–100 mmHg`!), trong khi cuối `rationale` lại cảnh báo Class III của ESC 2024: **`"TUYỆT ĐỐI KHÔNG giảm quá 70 mmHg trong 1 giờ đầu (tức không hạ xuống thấp hơn 170 mmHg trong giờ đầu)"`**!
- **Hướng khắc phục**: Khi `sbp - maxDrop70` cao hơn cận trên của cửa sổ đích thông thường (`160 mmHg` ở `INTL` / `180 mmHg` ở `VN`), cập nhật trực tiếp `windowText` trên cả `title` và `rationale` để nêu rõ sàn an toàn giờ đầu `≥ ${sbp - maxDrop70} mmHg` trước khi hạ dần về cửa sổ đích.

---

## 5. Chi tiết các phát hiện mức `MINOR` (`R2-R1-HTN-15` → `R2-R1-HTN-18`) & `SUGGESTION` (`R2-R1-HTN-19` → `R2-R1-HTN-20`)

### `R2-R1-HTN-15` [MINOR | `rule` | `htn.outpatient.eval_bp_target`]
- **Mô tả**: Trên profile `VN` (**VSH/VNHA 2022 Bảng 7 tr. 23 & Hình 6 tr. 46**), bệnh nhân cao tuổi đang dùng phối hợp đa thuốc có HA bị hạ xuống dưới sàn khuyến cáo (ví dụ `112/64 mmHg` ở bệnh nhân 74–82 tuổi, *truy vết `S19`*) hiện chỉ nhận thông báo `"Đã đạt đích"` mà chưa có lưu ý đánh giá triệu chứng giảm tưới máu vành/não hoặc cân nhắc giảm bớt thuốc phối hợp (khác biệt với ESC 2024 Section 9.8.2 *p. 66* không giảm liều nếu hoàn toàn không triệu chứng).
- **Khắc phục**: Bổ sung nhánh cảnh báo hạ áp dưới sàn khi `medCount >= 1 && sbp >= 90` trên profile `VN` kèm `profileDiff` đối chiếu ESC 2024.

### `R2-R1-HTN-16` [MINOR | `rule` | `htn.inpatient.preeclampsia_emergency`]
- **Mô tả**: Dùng chung đích DBP cấp cứu sản khoa `< 105 mmHg` cho cả 3 profile mà chưa tách đích `< 160/< 110 mmHg trong 30–60 phút` của **AHA/ACC 2025 Section 5.5 Rec 3** (*PDF p. 64*) trên profile `US`, đồng thời thiếu `profileDiff` giải thích sự khác biệt thuốc đầu tay giữa `US` (Labetalol IV, Hydralazine IV, Nifedipine IR uống) và `INTL`/`VN` (Labetalol IV, Nicardipine IV).
- **Khắc phục**: Phân nhánh ngưỡng đích DBP cấp cứu thai kỳ theo profile và bổ sung `profileDiff`.

### `R2-R1-HTN-17` [MINOR | `ui` | `src/modules/htn/rules.inpatient.emergency.ts`]
- **Mô tả**: Lặp thừa chữ `"tĩnh mạch"` hai lần liên tiếp trong tiêu đề và nội dung các thẻ nội viện: `"Truyền Nitroglycerin (truyền tĩnh mạch) tĩnh mạch"`, `"Hạ áp cấp cứu sản khoa bằng Nicardipine (truyền tĩnh mạch) tĩnh mạch"`, `"CHỐNG CHỈ ĐỊNH Esmolol (truyền tĩnh mạch) tĩnh mạch"` do `drug(...).nameVi` đã có sẵn hậu tố `"(truyền tĩnh mạch)"`.
- **Khắc phục**: Bỏ từ `"tĩnh mạch"` nối cứng phía sau `${drug(...).nameVi}` đối với các thuốc đường tĩnh mạch trong `rules.inpatient.emergency.ts` và `rules.inpatient.neuro_preg.ts`.

### `R2-R1-HTN-18` [MINOR | `drug` | `aliskiren`]
- **Mô tả**: `'aliskiren'` có mặt trong `RASI_IDS` (`helpers.ts:25`), **AHA/ACC 2025 Table 13** (*PDF p. 41*) và **VSH/VNHA 2022 Bảng 10 & 16** (*tr. 32, 44*), nhưng chưa có tệp `kb/drugs/aliskiren.json`, khiến tầng rà soát thuốc nền chung và cổng an toàn của engine không tự động nhận diện được độc tính thai kỳ và nguy cơ tăng kali máu / suy thận của thuốc này.
- **Khắc phục**: Bổ sung `kb/drugs/aliskiren.json` với đầy đủ phân nhóm, liều `150–300 mg/ngày`, chống chỉ định thai kỳ và phối hợp ACEi/ARB.

### `R2-R1-HTN-19` [SUGGESTION | `missing` | `htn.outpatient.pregnancy_aspirin_prophylaxis`]
- **Đề xuất**: Bổ sung khuyến cáo tư vấn dự phòng tiền sản giật bằng **Aspirin liều thấp** từ tuần thai 12 đến tuần 36 / khi sinh cho phụ nữ mang thai có tăng huyết áp — khuyến cáo đồng thuận Nhóm I trên cả 3 hệ thống (**AHA/ACC 2025 Section 5.5 Rec 2** `81 mg/ngày`, COR 1 LOE B-R *p. 64*; **ESC 2024 Section 9.2.5** `100–150 mg/ngày buổi tối`, *p. 59*; **VSH/VNHA 2022 Bảng 16** `75–162 mg/ngày`, Loại I Mức C *tr. 43*).

### `R2-R1-HTN-20` [SUGGESTION | `missing` | `htn.inpatient.catecholamine_excess_warning`]
- **Đề xuất**: Bổ sung lưu ý an toàn chuyên biệt cho cơn tăng huyết áp kịch phát nghi do tăng tiết catecholamine (u tủy thượng thận / pheochromocytoma, ngộ độc giao cảm hoặc ngưng đột ngột clonidine): **tuyệt đối không dùng chẹn beta giao cảm đơn độc khi chưa phong bế thụ thể alpha đầy đủ** do nguy cơ co mạch alpha không đối kháng làm bùng phát cơn THA ác tính và phù phổi cấp (**ESC 2024 Section 9.14.4 & 10.1.1**, *PDF pp. 72–73*; **AHA/ACC 2025 Table 27**, *PDF p. 75*).

---

## 6. Kết luận thẩm định Vòng 2 (Reviewer R1)

Mặc dù phân hệ Tăng huyết áp (`htn`) đã có bước tiến rõ rệt sau Vòng 1 về cấu trúc mã nguồn và đã giải quyết được một số lỗi nền tảng (`differentiate_crisis`, mục tiêu HA thai kỳ ngoại trú, dải thận Lercanidipine, cổng EVT trong đột quỵ), kiểm định độc lập Vòng 2 phát hiện phân hệ vẫn còn **6 lỗi mức `critical`** và **8 lỗi mức `major`**. Các lỗi này bao gồm:
- Lỗ hổng làm mù cổng an toàn của Magnesium sulfate sản khoa trong suy thận nặng / block nhĩ thất và nguy cơ cộng dồn liều đa phân hệ (`R2-R1-HTN-01`);
- Kê truyền tĩnh mạch Nicardipine chống chỉ định trên thai phụ hẹp van động mạch chủ nặng (`R2-R1-HTN-02`);
- Xung đột hợp nhất `mergeRecommendations` xóa mất Esmolol tĩnh mạch để lại truyền đơn độc Nicardipine trong bóc tách động mạch chủ cấp (`R2-R1-HTN-03`);
- Phát đồng thời hai y lệnh mâu thuẫn trực diện tại ICU khi đồng mắc đa tổn thương cơ quan đích cấp (`R2-R1-HTN-04`);
- Bỏ lọt thuốc độc bào thai thứ hai (`aliskiren`) và các thuốc chống chỉ định thứ hai do lỗi cắt cụt `.find()` (`R2-R1-HTN-05`);
- Chặn sạch thuốc uống ở bệnh nhân ngoại trú THA nặng không triệu chứng không có HMOD (`R2-R1-HTN-06`);
- Ba phát hiện `major` từ Vòng 1 chưa được cài đặt thực chất dù báo cáo đã sửa (`R2-R1-HTN-07`, `R2-R1-HTN-08`, `R2-R1-HTN-09`), cùng sai lệch diện rộng về trích dẫn nguyên văn PDF / QA-7 / QA-8 / QA-10 (`R2-R1-HTN-10`, `R2-R1-HTN-11`, `R2-R1-HTN-12`) và xử trí chu phẫu / xuất huyết não (`R2-R1-HTN-13`, `R2-R1-HTN-14`).

Căn cứ quy tắc nghiệm thu nghiêm ngặt của Hội đồng Y khoa (`verdict` chỉ đạt `PASS` khi có `0 critical` và `0 major`), kết quả thẩm định độc lập Vòng 2 của Reviewer R1 là:

**KẾT LUẬN THẨM ĐỊNH VÒNG 2 (REVIEWER R1): `FAIL`** *(6 critical, 8 major, 4 minor, 2 suggestion — Tổng cộng: 20 phát hiện)*
