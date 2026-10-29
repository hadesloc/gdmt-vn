# Báo Cáo Thẩm Định Độc Lập Vòng 4 — Phân Hệ `copd` (Bệnh Phổi Tắc Nghẽn Mạn Tính)

- **Vai trò thẩm định**: Reviewer R3 — Kiểm thử Đối kháng An toàn Lâm sàng Độc lập (*Adversarial Clinical Safety Tester*)
- **Phân hệ đánh giá**: `copd` (`src/modules/copd/*`, `kb/thresholds/copd.json`, `kb/citations/copd.json`, `kb/drugs/*.json`, `src/engine/*`, `src/safety/*`, `src/ui/*`)
- **Phương pháp kiểm định**: Đọc đối chiếu toàn bộ 35 tệp mã nguồn phân hệ `copd` (88 quy tắc lâm sàng), tầng lõi suy diễn (`evaluate.ts`, `derive.ts`, `merge.ts`, `note.ts`, `units.ts`, `calculators/gold.ts`), tầng an toàn dược lý (`reviewMeds`, `duplicates`, `interactions`) và **thực thi trực tiếp 138 kịch bản bệnh nhân đối kháng qua hàm `evaluate(patient, settings)`** kèm bộ kiểm tra tự động toàn bộ trích dẫn/ngưỡng KB.
- **Tính độc lập**: Tuân thủ tuyệt đối quy chế mù đôi của Hội đồng Thẩm định Y khoa — hoàn toàn không đọc bất kỳ báo cáo Vòng 4 nào của R1 hoặc R2.
- **Phán quyết cuối cùng (Final Verdict)**: **`FAIL` (KHÔNG ĐẠT)**

---

## 1. Tóm Tắt Điều Hành & Thống Kê Phát Hiện

| Mức độ nghiêm trọng (`severity`) | Số lượng | Điều kiện thông qua (`PASS`) | Đánh giá |
| :--- | :---: | :---: | :---: |
| **`critical` (Nguy kịch — Đe dọa an toàn tính mạng)** | **4** | `0` | ❌ Vi phạm |
| **`major` (Nghiêm trọng — Sai lệch phác đồ / Fail-closed)** | **8** | `0` | ❌ Vi phạm |
| **`minor` (Trung bình — Thiếu sót tầm soát / Bậc thang nhỏ)** | **2** | Cho phép có điều kiện | ⚠️ Cần sửa |
| **`suggestion` (Khuyến nghị cải tiến UX / Đồng bộ dữ liệu)** | **1** | Không chặn | 💡 Đề xuất |
| **Tổng cộng** | **15** | `0 critical` & `0 major` | **`FAIL`** |

### Điểm sáng ghi nhận sau đợt nâng cấp Vòng 3
1. **Kiến trúc mô-đun hóa & chuẩn hóa ngưỡng KB xuất sắc**: Toàn bộ 35 tệp trong `src/modules/copd/` đều dưới ngưỡng 400 dòng, 88 quy tắc có định danh duy nhất, **100% quy tắc và ô ma trận có trích dẫn hợp lệ với nguyên văn không rỗng** trong `kb/citations/copd.json`, không còn con số ma thuật cứng trong mã nguồn, và chế độ `onlyReviewed: true` vận hành chính xác.
2. **12/17 lỗi an toàn của Vòng 3 đã được khắc phục triệt để**: Phân biệt chính xác toan chuyển hóa với toan hô hấp khi chỉ định NIV, chặn NIV khi sốc/hôn mê, dừng mọi LAMA khi glôcôm góc đóng hẹp/bí tiểu cấp (kể cả khi chưa có hô hấp ký) và chuyển sang nhánh không chứa LAMA, giữ nguyên cả 2 bình của bộ ba mở (`Spiriva + Symbicort`), chỉ gợi ý 1 thuốc sinh học duy nhất (ưu tiên Dupilumab khi viêm phế quản mạn, Mepolizumab khi không có viêm phế quản mạn), tách ngưỡng Home NIV `PaCO₂ ≥ 53 mmHg` (BYT Việt Nam) so với `> 53 mmHg` (GOLD/ATS), bổ sung phục hồi chức năng hô hấp, tiêm chủng 6 vắc-xin, phân độ GOLD 1–4 và bảng kiểm xuất viện nội trú.

### Nguyên nhân cốt lõi dẫn đến phán quyết `FAIL` ở Vòng 4
Qua 138 ca lâm sàng đối kháng chạy thực tế trên `evaluate(patient, settings)`, chúng tôi phát hiện **4 lỗ hổng mức `critical`** và **8 lỗi mức `major`** phát sinh từ sự lệch pha bối cảnh điều trị (`setting: 'both'` vs `'outpatient'` / `'inpatient'`), phụ thuộc mù quáng vào ô tích thủ công `acuteExacerbation`, chỉ quét phần tử thuốc đầu tiên (`findCurrentMedInSet`) thay vì toàn bộ danh sách thuốc độc hại, và xử lý thiếu sót các mã thuốc gốc đa dạng bào chế trong KB:
1. **`COPD-R4-R3-01` (`critical`)**: Lệnh `STOP` "ma" (*Phantom `STOP`*) ở bối cảnh nội trú (`setting: 'inpatient'`) cắt sạch toàn bộ thuốc hít nền tảng (`Trelegy`, `Seretide`, hoặc cả 2 bình `Spiriva + Symbicort`) mà **không kê bất kỳ thuốc thay thế nào**, đẩy bệnh nhân COPD nội trú về trạng thái **0 thuốc giãn phế quản**.
2. **`COPD-R4-R3-02` (`critical`)**: Khi bác sĩ nhập đầy đủ thông số ngừng thở / lơ mơ / toan hô hấp mất bù (`pH = 7.20–7.24`, `PaCO₂ = 68–74 mmHg`, `SpO₂ = 80%`) nhưng quên tích ô `acuteExacerbation`, hệ thống bỏ qua toàn bộ phác đồ hồi sức hô hấp (NKQ/IMV/NIV/SABA khí dung/steroid) và kê nhầm **thở oxy dài hạn tại nhà ≥ 15 giờ/ngày (LTOT) + tiêm vắc-xin thường quy** như bệnh nhân ổn định!
3. **`COPD-R4-R3-03` (`critical`)**: Bệnh nhân có tiền sử **phản vệ đạm sữa bò nặng** đang dùng bình bột khô nhập bằng mã KB gốc (`{ drugId: 'tiotropium', name: 'Spiriva HandiHaler 18mcg DPI' }` hoặc `{ drugId: 'budesonide_formoterol', name: 'Symbicort Turbuhaler 160/4.5 DPI' }`) lại nhận lệnh **`CONTINUE` tiếp tục hít bình DPI chứa lactose**, và khi chưa có hô hấp ký mà dùng 2 bình DPI (`spiriva_handihaler + seretide_accuhaler`) thì chỉ dừng bình thứ nhất, để lọt `seretide_accuhaler` tiếp tục hoạt động.
4. **`COPD-R4-R3-04` (`critical`)**: Trong đợt cấp suy hô hấp tăng CO₂ toan máu (`pH 7.30, PaCO₂ 58 mmHg`), bệnh nhân đang dùng đồng thời `morphine + diazepam` hoặc `theophylline + aminophylline` chỉ nhận lệnh `STOP` cho thuốc đầu tiên, bỏ lọt **`diazepam`** và **`aminophylline`** đang hoạt động!

---

## 2. Bảng Đối Chiếu Kiểm Chứng Hồi Quy 17 Phát Hiện Vòng 3 (`COPD-R3-R3-01` → `17`)

| Mã Vòng 3 | Nội dung lỗi ở Vòng 3 | Trạng thái Vòng 4 | Bằng chứng thực nghiệm trên `evaluate()` Vòng 4 |
| :--- | :--- | :---: | :--- |
| **`COPD-R3-R3-01`** | Bỏ sót suy hô hấp cấp đe dọa tính mạng ở ngoại trú khi chưa bật cờ `acuteExacerbation` | ⚠️ **Sửa một phần — Còn lỗ hổng `critical`** | Đã bắt được ở ngoại trú khi có `RR > 24` hoặc `respiratoryArrest`, **NHƯNG** thất bại hoàn toàn ở `setting: 'inpatient'` (`D01`), bỏ sót toan hô hấp nặng `pH 7.24, PaCO₂ 68` ở ngoại trú khi `SpO₂ ≥ 90%` nhờ thở oxy (`D02`), và vẫn kê nhầm LTOT tại nhà ở `D03` → **Xem `COPD-R4-R3-02`**. |
| **`COPD-R3-R3-02`** | Phớt lờ chống chỉ định LAMA (glôcôm góc đóng hẹp, bí tiểu cấp) và SAMA khí dung | ✅ **Đã khắc phục hoàn toàn** | Kiểm chứng trên `A04`–`A07`: dừng toàn bộ LAMA đơn/đôi/ba (kể cả khi thiếu hô hấp ký), hạ bậc/nâng bậc sang nhánh không có LAMA (`formoterol` / `budesonide_formoterol`), đợt cấp chỉ dùng SABA khí dung đơn thuần không kèm Ipratropium. |
| **`COPD-R3-R3-03`** | Nguy cơ sốc phản vệ đạm sữa bò do bình bột khô DPI chứa lactose | ⚠️ **Sửa một phần — Còn lỗ hổng `critical`** | Đã chặn các mã thuộc `DPI_INHALER_IDS` đơn lẻ (`A08`), **NHƯNG** phát lệnh `CONTINUE` sai trên `Spiriva HandiHaler DPI` / `Symbicort Turbuhaler DPI` khi nhập qua `drugId` gốc (`P05`, `P06`, `Q03`) và để lọt bình DPI thứ hai khi thiếu hô hấp ký (`E04`) → **Xem `COPD-R4-R3-03`**. |
| **`COPD-R3-R3-04`** | Thở máy NIV sai trên toan chuyển hóa / sốc / hôn mê & cảnh báo quá oxy sai khi tự thở khí trời | ⚠️ **Sửa một phần — Còn lỗi `major` ở ngoại trú** | Đã phân biệt đúng toan chuyển hóa (`A09`), chống chỉ định NIV khi sốc/hôn mê (`A10`), và không báo giảm oxy ở nội trú khi `onSupplementalOxygen: false` (`A11`). Tuy nhiên ở ngoại trú (`onSupplementalOxygen` để trống/`undefined`), bệnh nhân đợt cấp nhẹ thở khí trời `SpO₂ 95%` vẫn bị báo nhầm giảm oxy (`D04`, `P14`) → **Xem `COPD-R4-R3-08`**. |
| **`COPD-R3-R3-05`** | Tự động dừng Carvedilol ở suy tim HFrEF không bảo vệ & ghi đè liều steroid nền mạn tính | ⚠️ **Sửa một phần — Phát sinh hồi quy `major`** | Đã sửa cho Carvedilol đường uống nhịp tim bình thường (`A12`) và cảnh báo steroid nền trong đợt cấp (`A13`), **NHƯNG** lại tự động đổi thuốc nhỏ mắt trị glôcôm `Timolol 0.5%` sang thuốc uống `Bisoprolol 1.25 mg` (`E10`), mâu thuẫn khi `HR = 42 bpm` (`E11`), tắt nhầm quy tắc dừng `sotalol`/`timolol_ophthalmic` khi `conditions.asthma = true` (`Q01`, `Q02`), và bỏ trống cảnh báo steroid uống mạn tính khi COPD ổn định (`P01`, `P02`) → **Xem `COPD-R4-R3-05` & `COPD-R4-R3-07`**. |
| **`COPD-R3-R3-06`** | Phá vỡ bộ ba mở hợp lệ (`Spiriva + Symbicort`) và bỏ sót trùng lặp SAMA + LAMA | ✅ **Đã khắc phục hoàn toàn** | Kiểm chứng trên `A15` & `A16`: giữ nguyên `CONTINUE` cho cả hai bình của bộ ba mở khi ổn định, phát `STOP ipratropium` khi đang dùng LAMA nền. |
| **`COPD-R3-R3-07`** | Bỏ sót chống chỉ định Roflumilast, Azithromycin dài hạn, thuốc ức chế TKTW và Xanthin | ⚠️ **Sửa một phần — Còn lỗ hổng `critical` & `major`** | Đã chặn đúng Roflumilast (Child-Pugh B/C, BMI < 18.5, thai kỳ, trầm cảm) và Azithromycin (lọc máu, QTc dài, giảm thính lực, nghi NTM) (`A17`–`A22`), **NHƯNG** chỉ dừng 1 thuốc đầu tiên khi dùng kép `morphine + diazepam` (`D05`) hoặc `theophylline + aminophylline` (`D06`), và không tính liều độc `mg/kg/ngày` của Theophylline (`P03`) → **Xem `COPD-R4-R3-04` & `COPD-R4-R3-07`**. |
| **`COPD-R3-R3-08`** | Bỏ sót nâng bậc/hạ bậc ICS ở nhóm LABA đơn, ICS đơn và lạm dụng ICS nguy cơ viêm phổi | ⚠️ **Phát sinh lỗi hồi quy `critical` ở nội trú** | Logic ngoại trú hoạt động tốt (`A23`–`A25`), **NHƯNG** việc tách `stop_superseded_inhaler` (`setting: 'both'`) khỏi `inappropriate_ics_de_escalation` (`setting: 'outpatient'`) đã sinh ra lỗi **Phantom `STOP`** cắt sạch toàn bộ thuốc hít ở bệnh nhân nội trú (`E01`, `P07`, `P08`) → **Xem `COPD-R4-R3-01`**. |
| **`COPD-R3-R3-09`** | Chẩn đoán quá mức COPD ở người cao tuổi và tự gán Nhóm A khi thiếu thang điểm `CAT` | ⚠️ **Đã sửa trong `copd` — Còn lỗi ở tầng lõi `engine`** | Phân hệ `copd` đã chặn đúng khi thiếu `CAT` và cảnh báo LLN ở người ≥ 70 tuổi (`A26`, `A27`), **NHƯNG** `src/engine/derive.ts` và `note.ts` vẫn tự gán `Group A` trong văn bản bệnh án và làm tròn lệch tại `0.696` (`A27`, `C02`, `C04`) → **Xem `COPD-R4-R3-11`**. |
| **`COPD-R3-R3-10`** | Gợi ý đồng thời 2 thuốc sinh học (Dupilumab + Mepolizumab) không loại trừ nhau | ⚠️ **Đã sửa khởi trị — Còn thiếu `STOP` khi trùng lặp thuốc đang dùng** | Khởi trị mới chỉ gợi ý đúng 1 thuốc sinh học duy nhất (`A28`, `A29`), **NHƯNG** khi `currentMeds` đang có sẵn 2 thuốc sinh học (`A14`, `P04`) lại thiếu lệnh `STOP` thuốc dư thừa, và chặn oan thuốc sinh học khi bệnh nhân chống chỉ định LAMA (`P17`) → **Xem `COPD-R4-R3-10` & `COPD-R4-R3-12`**. |
| **`COPD-R3-R3-11`** | Dự phòng VTE nội viện kê trùng lặp trên bệnh nhân đang dùng kháng đông / đang chảy máu | ⚠️ **Sửa cho `currentMeds` — Lọt khi khởi trị chéo `['copd', 'af']` & HIT** | Đã chặn khi kháng đông nằm sẵn trong `currentMeds` hoặc đang chảy máu (`A30`, `A31`), **NHƯNG** vẫn kê kép `START Apixaban + START LMWH` khi chạy chung phân hệ `af` (`F08`) và bỏ sót tiền sử HIT / tiểu cầu thấp (`P15`) → **Xem `COPD-R4-R3-09`**. |
| **`COPD-R3-R3-12`** | Thiếu phục hồi chức năng hô hấp, LTOT `PaO₂ 56–59` kèm tâm phế mạn/đa hồng cầu và vắc-xin | ✅ **Đã khắc phục hoàn toàn** | Kiểm chứng trên `A32`–`A34`: phát đầy đủ phục hồi chức năng hô hấp cho Nhóm B/E, LTOT khi `PaO₂ = 58 mmHg` kèm tăng áp phổi/Hct > 55%, và lịch 6 vắc-xin. |
| **`COPD-R3-R3-13`** | Không xuất kết quả phân độ tắc nghẽn luồng khí GOLD 1–4 trong khuyến cáo | ✅ **Đã khắc phục hoàn toàn** | Kiểm chứng trên `C05`–`C08`: quy tắc `copd.diagnosis.gold_severity_grade` phân loại chính xác các biên `FEV₁` 80%, 50%, 30%. |
| **`COPD-R3-R3-14`** | Thở máy NIV tại nhà áp cứng một ngưỡng duy nhất, thiếu tiêu chuẩn pH > 7.35 | ✅ **Đã khắc phục hoàn toàn** | Kiểm chứng trên `C15`–`C17`: phân nhánh chính xác `PaCO₂ = 53 mmHg` (`VN_BYT` kích hoạt `≥ 53`, `INTL_GOLD`/`US_AHA` yêu cầu `> 53`) và kiểm tra sau nhập viện + không toan máu cấp. |
| **`COPD-R3-R3-15`** | Thiếu quy tắc xuất viện & tái khám 1–4 tuần sau đợt cấp nội trú | ✅ **Đã khắc phục hoàn toàn** | Kiểm chứng trên nội trú (`copd.inpatient.discharge_checklist`): đầy đủ kiểm tra kỹ thuật hít, tối ưu LABA+LAMA, phục hồi chức năng trong 4 tuần và tái khám 1–4 tuần (cần mở rộng thêm cho đợt cấp ngoại trú như nêu tại `COPD-R4-R3-08`). |
| **`COPD-R3-R3-16`** | Sử dụng con số ma thuật cứng thay vì tra cứu ngưỡng từ `kb/thresholds/copd.json` | ✅ **Đã khắc phục hoàn toàn** | Đã chuyển toàn bộ ngưỡng lâm sàng vào `kb/thresholds/copd.json` thông qua `th()` / `thFor()`. |
| **`COPD-R3-R3-17`** | Tệp quy tắc phình to vượt giới hạn dòng mã nguồn quy định | ✅ **Đã khắc phục hoàn toàn** | Toàn bộ 35 tệp trong `src/modules/copd/` được tách mạch lạc theo chức năng lâm sàng, mỗi tệp đều dưới 400 dòng. |

---

## 3. Tổng Hợp Ma Trận 138 Kịch Bản Kiểm Thử Đối Kháng Trực Tiếp (`evaluate()`)

Toàn bộ kết quả dưới đây được thu thập trực tiếp bằng cách gọi hàm `evaluate(patient, settings)` thực tế của hệ thống trên **138 kịch bản lâm sàng độc lập** (chia thành 9 nhóm kiểm thử từ `A` đến `G`, `P`, `Q`), kết hợp kiểm định tự động cấu trúc KB:

| Nhóm kịch bản | Số lượng ca | Phạm vi tấn công đối kháng lâm sàng | Kết quả chính ghi nhận |
| :--- | :---: | :--- | :--- |
| **Nhóm A (`A01`–`A34`)** | 34 | Kiểm chứng hồi quy trực tiếp toàn bộ 17 lỗi Vòng 3 trên các ca điển hình và ca biên | Xác nhận 12 mục sửa sạch; phát hiện thiếu `STOP` thuốc sinh học trùng lặp (`A14`) và lộ lỗi `derived.goldGroup = 'A'` khi thiếu `CAT` (`A27`). |
| **Nhóm B (`B01`–`B12`)** | 12 | Chạy toàn bộ 4 preset COPD qua 3 hồ sơ (`VN_BYT`, `INTL_GOLD`, `US_AHA`) và mô phỏng đúng luồng nạp preset của `AppShell.tsx` | Phát hiện preset nội trú `copd_preset_inpatient_exac_0245` thiếu `setting: 'inpatient'` làm `AppShell` ép chạy ngoại trú (`COPD-R4-R3-06`). |
| **Nhóm C (`C01`–`C24`)** | 24 | Kiểm thử biên số học cực hạn (*Boundary Fuzzing*): `FEV₁/FVC` (`0.696`, `0.699`, `0.700`), `FEV₁%` (`80/79.9/50/49.9/30/29.9`), `mMRC`, `CAT`, `EOS` (`99/100/299/300`), `pH` (`7.35/7.36`), `PaCO₂` (`45/46/52.9/53/53.1`), `SpO₂` (`88/89/92/93`), `PaO₂` (`55/56/59/60`), `BMI` (`18.4/18.5`) | Phát hiện lệch làm tròn tại `FEV₁/FVC = 0.696` giữa `derive.ts` (`.toFixed(2) -> 0.70`) và `copd` (`.toFixed(3) -> 0.696`) cùng gán nhầm `Group A` khi trống cả hai thang triệu chứng (`C02`, `C04` — `COPD-R4-R3-11`). |
| **Nhóm D (`D01`–`D12`)** | 12 | Ngừng thở, toan hô hấp mất bù nặng, sốc, hôn mê, đợt cấp ngoại trú thở khí trời, đa thuốc ức chế TKTW (`morphine + diazepam`), đa thuốc xanthin (`theophylline + aminophylline`) | Phát hiện 2 lỗi `critical` (`D01`–`D03` bỏ sót suy hô hấp cấp/ngừng thở khi quên tích cờ `acuteExacerbation` — `COPD-R4-R3-02`; `D05`–`D06` để sót `diazepam` và `aminophylline` — `COPD-R4-R3-04`) và lỗi báo giảm oxy sai ở ngoại trú (`D04` — `COPD-R4-R3-08`). |
| **Nhóm E (`E01`–`E15`)** | 15 | Ma trận đa bình hít, hạ bậc ICS ở nội trú, dị ứng đạm sữa bò nhiều bình DPI không có hô hấp ký, chồng chéo `priorPneumonia + narrowAngleGlaucoma`, nhỏ mắt `timolol_ophthalmic`, nhịp chậm `HR = 42` | Phát hiện **Phantom `STOP` nội trú** (`E01` — `COPD-R4-R3-01`), lọt bình DPI thứ hai (`E04` — `COPD-R4-R3-03`), đổi thuốc nhỏ mắt glôcôm sang `Bisoprolol` uống (`E10` — `COPD-R4-R3-05`), và câu giải thích lâm sàng sai sự thật (`E06`, `E07` — `COPD-R4-R3-10`). |
| **Nhóm F (`F01`–`F10`)** | 10 | Tương tác đa phân hệ thực tế: `['copd', 'asthma']`, `['copd', 'hf']`, `['copd', 'af']`, `['copd', 'ckd']`, `['copd', 'htn', 'diabetes']` | Phát hiện kê trùng lặp `START Apixaban` + `START LMWH` ở `['copd', 'af']` (`F08` — `COPD-R4-R3-09`) và lỗi thiếu `try/catch` dòng 81 trong `evaluate.ts` làm sập phiên đánh giá đa phân hệ `['copd', 'asthma']` (`F01`–`F06` — `COPD-R4-R3-12`). |
| **Nhóm G (`G01`–`G04`)** | 4 | Đối kháng chuyển đổi đơn vị SI ↔ Conventional (`creatinine` µmol/L ↔ mg/dL, `PaO₂`/`PaCO₂` kPa ↔ mmHg) & dữ liệu cực đoan/âm/rỗng | Hệ thống chuyển đổi đơn vị SI/Conventional cho `creatinine` hoạt động nhất quán, không phát sinh lỗi `NaN` hay chia cho `0`. |
| **Nhóm P (`P01`–`P24`)** | 24 | Thăm dò chuyên sâu: steroid uống mạn tính (`Prednisolone`/`Medrol`), quá liều độc `Theophylline 17.8 mg/kg/ngày + Ciprofloxacin`, mã KB gốc `tiotropium` HandiHaler / `budesonide_formoterol` Turbuhaler, `Benralizumab + Dupilumab`, HIT + giảm tiểu cầu, AATD người trẻ không hút thuốc, `onlyReviewed: true` | Xác nhận thêm lỗi `critical` trên mã KB gốc HandiHaler/Turbuhaler (`P05`, `P06`), Phantom `STOP` cả 2 bình bộ ba mở nội trú (`P08`), thiếu quy tắc steroid uống mạn & liều độc Theophylline (`P01`–`P03`), bỏ sót HIT (`P15`), chặn oan thuốc sinh học khi chống chỉ định LAMA (`P17`), và khóa nhầm AATD sau LDCT (`P09`, `P10`). |
| **Nhóm Q (`Q01`–`Q03`)** | 3 | Thăm dò mù chéo `conditions.asthma = true` khi chỉ chạy `selectedModules: ['copd']` trên `propranolol + timolol_ophthalmic` và `sotalol + nadolol`, cùng `tiotropium` HandiHaler khi thiếu hô hấp ký | Xác nhận `timolol_ophthalmic` (`Q01`) và `sotalol` (`Q02`) bị bỏ lọt hoàn toàn không có lệnh `STOP`, và `Spiriva HandiHaler DPI` khi thiếu hô hấp ký (`Q03`) chỉ phát `MONITOR` thay vì `STOP`. |

> **Kết quả kiểm định tự động KB & Trích dẫn**: Quét tự động toàn bộ `copdModule.rules` (88 quy tắc) và `copdModule.matrices` đối chiếu với `kb/citations/*.json` và `kb/thresholds/copd.json`: **88/88 quy tắc có định danh duy nhất, 0 trích dẫn thiếu, 0 trích dẫn có `quote` rỗng, 0 ngưỡng thiếu**.

---

## 4. Phân Tích Chi Tiết Từng Phát Hiện Vòng 4 (`COPD-R4-R3-01` → `COPD-R4-R3-15`)

---

### 4.1. Nhóm Mức Độ `CRITICAL` (4 Phát Hiện — Đe Dọa Trực Tiếp An Toàn Bệnh Nhân)

#### [COPD-R4-R3-01] Lệnh `STOP` "ma" (*Phantom `STOP`*) xoá sạch toàn bộ thuốc hít nền tảng mà không kê thuốc thay thế ở bệnh nhân COPD ổn định điều trị nội trú (`setting: 'inpatient'`)
- **Mức độ**: `critical` | **Loại mục**: `rule` | **Định danh**: `copd.safety.stop_superseded_inhaler`
- **Vị trí mã nguồn**:
  - `src/modules/copd/helpers.inhalers.ts:196-207` (`isInappropriateIcsDeEscalationCandidate`)
  - `src/modules/copd/helpers.inhalers_plan.ts:69-88` (`resolveInhalerPlan`)
  - `src/modules/copd/rules.safety.inhalers_stop.ts:68-103` (`copd.safety.stop_superseded_inhaler_0..3` — khai báo `setting: 'both'`)
  - `src/modules/copd/rules.followup.continue.ts:109` (`copd.followup.continue_controlled_inhaler` — khai báo `setting: 'both'`)
  - `src/modules/copd/rules.followup.stepup_ics.ts:263-272` (`copd.followup.inappropriate_ics_de_escalation` — khai báo `setting: 'outpatient'`)
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  - **Đầu vào (`E01`, `P07`, `P08`)**: Bệnh nhân COPD 66 tuổi nhập viện điều trị nội trú vì bệnh lý khác không phải đợt cấp (`setting: 'inpatient'`, `acuteExacerbation: false`, `FEV₁/FVC = 0.56`, `FEV₁ = 58%`, `mMRC = 1`, `CAT = 6`, `0` đợt cấp/năm, `bloodEos = 50 tế bào/µL`, không có tiền sử viêm phổi, không hen). Thuốc đang dùng hàng ngày:
    - `E01`: `Trelegy Ellipta` (`fluticasone_furoate_umeclidinium_vilanterol`)
    - `P07`: `Seretide Evohaler` (`fluticasone_salmeterol`)
    - `P08`: Bộ ba mở `Spiriva Respimat` (`tiotropium`) + `Symbicort Rapihaler` (`budesonide_formoterol`)
  - **Đầu ra thực tế từ `evaluate()`**:
    - Ở `E01`: Phát lệnh **`STOP fluticasone_furoate_umeclidinium_vilanterol`: *"Ngừng bình hít cũ (Trelegy Ellipta) khi chuyển sang Tiotropium/Olodaterol"*** — nhưng **KHÔNG hề có lệnh `START tiotropium_olodaterol`** nào trong kế hoạch điều trị!
    - Ở `P08`: Phát đồng thời **2 lệnh `STOP`** cắt sạch **CẢ `tiotropium` LẪN `budesonide_formoterol`**, chặn luôn lệnh `CONTINUE`, và **KHÔNG kê bất kỳ thuốc giãn phế quản nào thay thế**!
- **Phân tích nguyên nhân & hậu quả lâm sàng**:
  - `isInappropriateIcsDeEscalationCandidate` không kiểm tra bối cảnh ngoại trú, khiến `resolveInhalerPlan` trả về `{ action: 'start_dual', drugId: 'tiotropium_olodaterol' }` ngay cả khi `setting === 'inpatient'`. Do quy tắc cắt thuốc cũ (`stop_superseded_inhaler`) chạy ở `'both'` còn quy tắc kê thuốc mới (`inappropriate_ics_de_escalation`) chỉ chạy ở `'outpatient'`, hệ thống tạo ra một lệnh cắt thuốc "mồ côi" xóa sạch toàn bộ phác đồ giãn phế quản của người bệnh đang nằm viện, gây nguy cơ cao bùng phát co thắt phế quản và suy hô hấp cấp nội viện (trái với GOLD 2026 chương 3 & 4).
- **Hướng khắc phục**:
  1. Tại `isInappropriateIcsDeEscalationCandidate` (`src/modules/copd/helpers.inhalers.ts:196`), thêm ngay `if (ctx.settings.setting !== 'outpatient') return false;` (khi không có biến chứng viêm phổi cấp cần rút ICS ngay, bệnh nhân COPD ổn định đang nằm viện cần được duy trì `CONTINUE` thuốc hít nền tảng hiện có và đánh giá điều chỉnh bậc ở phòng khám ngoại trú).
  2. Tại `copd.safety.stop_superseded_inhaler` (`src/modules/copd/rules.safety.inhalers_stop.ts:68`), đồng bộ `setting: 'outpatient'` (hoặc kiểm tra chặt chẽ rằng quy tắc `START`/`SWITCH` đích thực sự được kích hoạt trong bối cảnh hiện tại trước khi phát lệnh `STOP`).

---

#### [COPD-R4-R3-02] Bỏ sót hoàn toàn ngừng thở và toan hô hấp cấp mất bù đe dọa tính mạng (`pH ≤ 7.25`, `PaCO₂ 68–74 mmHg`, `SpO₂ 80%`) và kê nhầm thở oxy dài hạn tại nhà (LTOT) + tiêm chủng thường quy khi chưa tích ô `acuteExacerbation`
- **Mức độ**: `critical` | **Loại mục**: `rule` | **Định danh**: `copd.inpatient.vent_icu`
- **Vị trí mã nguồn**:
  - `src/modules/copd/helpers.clinical.ts:273-346` (`isAcuteExacerbation`, `hasOutpatientAcuteRespiratoryFailure`)
  - `src/modules/copd/rules.inpatient.vent_icu.ts:48, 225`
  - `src/modules/copd/rules.nonpharm.ts:181, 258` (`copd.nonpharm.ltot_indication`, `copd.nonpharm.vaccinations`)
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  1. **Kịch bản `D01` (Nội trú — Ngừng thở & Toan hô hấp nặng `pH 7.20`)**:
     - Đầu vào: `setting: 'inpatient'`, `respiratoryArrest: true`, `alteredMentalStatus: true`, `abgPh: 7.20`, `abgPaco2: 74 mmHg`, `restingSpo2: 80%`, `respiratoryRate: 35 lần/phút`, người dùng quên tích ô `acuteExacerbation`.
     - Đầu ra thực tế: `isAcuteExacerbation(ctx)` trả về `false` vì ở nhánh nội trú chỉ kiểm tra `Boolean(ci.acuteExacerbation)`! Hệ thống **không phát bất kỳ khuyến cáo đặt nội khí quản (IMV), NIV, oxy kiểm soát hay thuốc cắt cơn nào**, mà lại coi bệnh nhân đang ổn định để kê: **`START tiotropium_olodaterol` (`rec_copd_initial_group_e`) + `START Thở oxy dài hạn tại nhà ≥ 15 giờ/ngày (LTOT)` (`rec_copd_ltot_severe_hypoxemia`) + `MONITOR Tiêm chủng đầy đủ 6 loại vắc-xin` (`rec_copd_vaccinations`)**!
  2. **Kịch bản `D02` (Ngoại trú — Toan hô hấp cấp mất bù nặng `pH 7.24, PaCO₂ 68 mmHg` trên nền đang thở oxy `SpO₂ 91%`)**:
     - Đầu vào: `setting: 'outpatient'`, `abgPh: 7.24`, `abgPaco2: 68 mmHg`, `restingSpo2: 91%`, chưa tích `acuteExacerbation`.
     - Đầu ra thực tế: Tại `helpers.clinical.ts:331`, điều kiện `ph <= 7.25 && paco2 > 45` bị khóa cứng sau `Boolean(ci.acuteExacerbation)`, khiến `hasOutpatientAcuteRespiratoryFailure` trả về `false`! Hệ thống bỏ qua hoàn toàn tình trạng toan máu nguy kịch (`pH 7.24`) và kê đơn ngoại trú ổn định (`Spiolto + Phục hồi chức năng hô hấp + Vắc-xin`).
  3. **Kịch bản `D03` (Ngoại trú — Suy hô hấp giảm oxy nặng `SpO₂ 80%` + co kéo cơ hô hấp phụ, chưa đo nhịp thở/ABG)**:
     - Đầu vào: `setting: 'outpatient'`, `restingSpo2: 80%`, `accessoryMuscleUse: true`, `increasedDyspnea: true`, `purulentSputum: true`, chưa tích `acuteExacerbation`.
     - Đầu ra thực tế: Vì `explicitAcuteFieldProvided` (`helpers.clinical.ts:292-298`) quên kiểm tra `restingSpo2 < 90` và `accessoryMuscleUse`, `isAcuteExacerbation` trả về `false`, dẫn đến hệ thống vừa báo chuyển cấp cứu vừa kê song song **thở oxy dài hạn tại nhà ≥ 15 giờ/ngày (LTOT)** ngay trong cơn thiếu oxy cấp — vi phạm trực tiếp GOLD 2026 và Quyết định 2131/QĐ-BYT 2026 (chỉ định LTOT bắt buộc đánh giá ở giai đoạn bệnh ổn định và đo lại sau 60–90 ngày).
- **Hướng khắc phục**:
  1. Đổi `hasOutpatientAcuteRespiratoryFailure` thành hàm dùng chung cho cả nội trú và ngoại trú `hasAcuteRespiratoryFailureSigns(ctx)` và **xóa bỏ cổng `Boolean(ci.acuteExacerbation)`** trước điều kiện toan hô hấp mất bù (`ph <= 7.35 && paco2 > 45`). Khi bệnh nhân COPD có ngừng thở, rối loạn huyết động, rối loạn tri giác, khó thở dữ dội lúc nghỉ, co kéo cơ hô hấp phụ, `RR > 24`, `SpO₂ < 90%` kèm triệu chứng cấp hoặc toan hô hấp `pH ≤ 7.35` & `PaCO₂ > 45 mmHg`, hệ thống phải tự động bật chế độ xử trí cấp cứu ở **cả `inpatient` và `outpatient`**.
  2. Chặn tuyệt đối các quy tắc giai đoạn ổn định (`ltot_indication`, `pulmonary_rehab`, `vaccinations`, `initial_*`) bất cứ khi nào `hasAcuteRespiratoryFailureSigns(ctx) === true`.

---

#### [COPD-R4-R3-03] Lỗ hổng phản vệ đạm sữa bò nặng (`severeMilkProteinAllergy`): phát lệnh `CONTINUE` trực tiếp trên bình bột khô `Spiriva HandiHaler DPI` / `Symbicort Turbuhaler DPI` khi nhập qua mã KB gốc và để sót bình DPI thứ hai khi thiếu hô hấp ký
- **Mức độ**: `critical` | **Loại mục**: `rule` | **Định danh**: `copd.safety.dpi_milk_allergy_stop_without_spiro`
- **Vị trí mã nguồn**:
  - `src/modules/copd/helpers.inhalers.ts:165-178` (`getActiveDpiInhalerMed`)
  - `src/modules/copd/rules.safety.inhalers_device.ts:80-109` (`copd.safety.dpi_milk_allergy_stop_without_spiro`, `copd.safety.dual_form_lactose_device_guard`)
  - `src/modules/copd/rules.followup.continue.ts:50-75` (`copd.followup.continue_controlled_inhaler`)
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  1. **Kịch bản `P05`, `P06` & `Q03` (Nhập thuốc bằng mã KB gốc kèm tên thiết bị DPI)**:
     - Trong danh mục KB hiện hành (`kb/drugs/`), các hoạt chất phổ biến nhất là `tiotropium`, `budesonide_formoterol`, `beclometasone_formoterol`. Trên thực tế lâm sàng, bác sĩ/dược sĩ thường chọn mã `tiotropium` với tên hiển thị `'Spiriva HandiHaler 18mcg DPI'` (`P05`, `Q03`) hoặc `budesonide_formoterol` với tên `'Symbicort Turbuhaler 160/4.5 DPI'` (`P06`).
     - Tại `helpers.inhalers.ts:165-178`, `getActiveDpiInhalerMed` hoàn toàn không quét các mã này và không đọc từ khóa thiết bị bột khô trong `med.name`.
     - Kết quả thực tế từ `evaluate()` trên bệnh nhân có **`severeMilkProteinAllergy: true`**:
       - Ở `P05`: Hệ thống **không dừng thuốc** mà phát thẳng lệnh **`CONTINUE tiotropium`: *"Tiếp tục duy trì phác đồ thuốc hít nền tảng hiện tại (Spiriva HandiHaler 18mcg DPI)"***!
       - Ở `P06` (kèm tiền sử hen): Hệ thống phát lệnh **`CONTINUE budesonide_formoterol` (`Symbicort Turbuhaler 160/4.5 DPI`)** kèm hướng dẫn hít cắt cơn MART tối đa 12 nhát/ngày, đồng thời nhánh văn bản MART ghi đè làm **biến mất hoàn toàn cảnh báo bắt buộc dùng dạng Rapihaler pMDI không chứa lactose**!
       - Ở `Q03` (chưa có hô hấp ký): Hệ thống chỉ phát thẻ `MONITOR` nhắc kiểm soát cấp phát thay vì lệnh `STOP` khẩn cấp bình `HandiHaler DPI` đang hít.
  2. **Kịch bản `E04` (Đang dùng 2 bình DPI `spiriva_handihaler` + `seretide_accuhaler` nhưng chưa có hô hấp ký)**:
     - Quy tắc `copd.safety.dpi_milk_allergy_stop_without_spiro` chỉ có 1 khe đơn lẻ. `evaluate()` chỉ phát `STOP spiriva_handihaler`, bỏ mặc **`seretide_accuhaler` (chứa tá dược lactose monohydrate có vết đạm sữa bò — chống chỉ định tuyệt đối gây phản vệ tử vong theo nhãn FDA Advair Diskus / Seretide Accuhaler)** tiếp tục hoạt động mà không có lệnh `STOP`!
- **Hướng khắc phục**:
  1. Xây dựng hàm `getAllActiveDpiInhalerMeds(ctx): CurrentMed[]` bắt toàn bộ: (a) `DPI_INHALER_IDS`, `salmeterol`, `fluticasone_salmeterol`; và (b) mọi thuốc thuộc `DUAL_FORM_LACTOSE_RISK_IDS` có `med.name` khớp biểu thức `/handihaler|turbuhaler|accuhaler|diskus|ellipta|breezhaler|nexthaler|gendis|dpi|bột khô/i`.
  2. Chuyển cả `dpi_milk_allergy_stop_without_spiro` lẫn `dpi_inhaler_stop` sang cơ chế sinh quy tắc đa khe (`0..3`) để dừng **tất cả** các bình DPI đang dùng.
  3. Tại `continue_controlled_inhaler`, cấm phát `CONTINUE` cho bất kỳ thuốc nào thuộc `getAllActiveDpiInhalerMeds(ctx)` khi `hasSevereMilkProteinAllergy(ctx) === true`, và luôn giữ chú thích bắt buộc dạng pMDI/SMI không chứa lactose kể cả ở nhánh MART.

---

#### [COPD-R4-R3-04] Chỉ phát 1 lệnh `STOP` đơn lẻ (`findCurrentMedInSet`), để lọt thuốc ức chế thần kinh trung ương thứ hai (`Diazepam` đi kèm `Morphine`) và xanthin thứ hai (`Aminophylline` đi kèm `Theophylline`) trong suy hô hấp tăng CO₂ toan máu cấp
- **Mức độ**: `critical` | **Loại mục**: `rule` | **Định danh**: `copd.safety.cns_depressant_hypercapnia_stop`
- **Vị trí mã nguồn**:
  - `src/modules/copd/rules.safety.systemic.ts:151-185` (`copd.safety.cns_depressant_hypercapnia_stop`)
  - `src/modules/copd/rules.safety.systemic.ts:243-280` (`copd.safety.methylxanthine_acute_stop`)
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  - **Kịch bản `D05`**: Bệnh nhân đợt cấp COPD nội trú suy hô hấp tăng CO₂ toan máu (`pH = 7.30`, `PaCO₂ = 58 mmHg`, `SpO₂ = 88%`) đang dùng `morphine` giảm đau và `diazepam` an thần. `evaluate()` chỉ phát `STOP morphine`, còn **`diazepam` hoàn toàn không có lệnh `STOP`**!
  - **Kịch bản `D06`**: Bệnh nhân đợt cấp COPD nội trú đang uống `theophylline` tại nhà và được truyền thêm `aminophylline` tĩnh mạch. `evaluate()` chỉ phát `STOP theophylline`, để lọt **`aminophylline` tiếp tục hoạt động không bị phát lệnh `STOP`**!
- **Cơ sở y văn**: GOLD 2026 (Chương 4 — Quản lý đợt cấp) và Quyết định 2131/QĐ-BYT 2026 chống chỉ định các thuốc an thần/benzodiazepine/opioid gây ức chế trung tâm hô hấp ở bệnh nhân suy hô hấp tăng CO₂ mất bù, đồng thời khuyến cáo không dùng methylxanthine đường tĩnh mạch trong đợt cấp COPD (Evidence B) do khoảng điều trị cực hẹp và nguy cơ loạn nhịp thất/co giật tử vong — đặc biệt nguy hiểm khi chồng lấp hai dẫn xuất xanthin.
- **Hướng khắc phục**: Chuyển cả hai quy tắc sang sinh đa khe (`0..3`) sử dụng `findAllCurrentMedsInSet(ctx, CNS_DEPRESSANT_IDS)` và `findAllCurrentMedsInSet(ctx, METHYLXANTHINE_IDS)` để phát lệnh `STOP` riêng biệt cho từng thuốc nguy hiểm đang hiện diện trong `currentMeds`.

---

### 4.2. Nhóm Mức Độ `MAJOR` (8 Phát Hiện — Sai Lệch Phác Đồ & Vi Phạm Nguyên Tắc An Toàn)

#### [COPD-R4-R3-05] Tự động chuyển thuốc nhỏ mắt trị glôcôm (`Timolol 0.5% ophthalmic`) sang thuốc uống toàn thân `Bisoprolol 1.25 mg` (`E10`), mâu thuẫn khi nhịp chậm nặng `HR < 50 bpm` (`E11`), và tắt nhầm quy tắc dừng `Sotalol`/`Timolol nhỏ mắt` khi có `conditions.asthma = true` (`Q01`, `Q02`)
- **Mức độ**: `major` | **Loại mục**: `rule` | **Định danh**: `copd.safety.non_selective_bb_switch_selective`
- **Vị trí mã nguồn**: `src/modules/copd/helpers.constants.ts:261`, `src/modules/copd/rules.safety.systemic.ts:21-37, 61, 105-148`.
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  1. **Kịch bản `E10` (`Timolol 0.5% nhỏ mắt` trên bệnh nhân COPD + ASCVD)**: `evaluate()` phát lệnh `STOP timolol_ophthalmic` kèm **`SWITCH bisoprolol`: *"CHUYỂN ĐỔI từ Timolol 0.5% nhỏ mắt sang chẹn beta-1 chọn lọc tim Bisoprolol 1.25 mg uống"*** và cảnh báo hội chứng cai chẹn beta gây nhồi máu cơ tim! Việc thay thuốc nhỏ mắt hạ nhãn áp bằng viên uống Bisoprolol khiến bệnh nhân **mất điều trị glôcôm** (nguy cơ mù lòa do tăng nhãn áp) thay vì đổi sang thuốc nhỏ mắt nhóm prostaglandin (`latanoprost`/`travoprost`), ức chế carbonic anhydrase tại chỗ (`dorzolamide`/`brinzolamide`) hoặc `betaxolol` nhỏ mắt chọn lọc beta-1.
  2. **Kịch bản `E11` (COPD + HFrEF đang dùng `carvedilol`, nhịp tim `HR = 42 bpm`, `SBP = 118 mmHg`)**: `canAutoSwitchToSelectiveBb` chỉ kiểm tra `sbp < 90` mà bỏ quên `hr < 50`, dẫn đến `evaluate()` phát đồng thời hai y lệnh tự mâu thuẫn: vừa bảo chuyển sang `Bisoprolol`, vừa phát thẻ `HOLD bisoprolol` do nhịp tim `< 50 bpm`!
  3. **Kịch bản `Q01` & `Q02` (`selectedModules: ['copd']`, `conditions.asthma: true`)**: Dòng 22 trả về `[]` ngay khi thấy `hasCondition(ctx, 'asthma')`, dù người dùng chỉ chọn chạy phân hệ `copd`. Do bộ rà soát thuốc toàn cục (`reviewMeds`) không bao phủ `timolol_ophthalmic` và `sotalol`, kết quả thực tế là **`timolol_ophthalmic` ở `Q01` và `sotalol` ở `Q02` bị bỏ lọt hoàn toàn không có bất kỳ lệnh `STOP` nào**!
- **Hướng khắc phục**:
  1. Xử lý riêng `timolol_ophthalmic` / `med.route === 'ophthalmic'`: phát lệnh `STOP`/`SWITCH` hội chẩn chuyên khoa Mắt đổi sang thuốc nhỏ mắt không ức chế beta-2 phế quản (prostaglandin / ức chế anhydrase / betaxolol nhỏ mắt), tuyệt đối không kê Bisoprolol uống thay thuốc nhỏ mắt.
  2. Bổ sung `hr !== undefined && hr < 50` (và block AV độ 2–3) vào `canAutoSwitchToSelectiveBb`.
  3. Chỉ nhường quyền khi `ctx.normalized.selectedModules.includes('asthma')` thực sự được chọn chạy, và chuyển `non_selective_bb_stop` sang đa khe (`0..3`).

---

#### [COPD-R4-R3-06] Ca mẫu nội trú `"Đợt cấp COPD nội trú — 02:45 sáng, giường 08 khoa Nội hô hấp"` thiếu khai báo `setting: 'inpatient'` và `respiratoryRate: 30`, khiến `AppShell` ép chạy ngoại trú
- **Mức độ**: `major` | **Loại mục**: `ui` | **Định danh**: `copd_preset_inpatient_exac_0245`
- **Vị trí mã nguồn**: `src/modules/copd/presets.ts:103-134`, `src/ui/AppShell.tsx:86-89`.
- **Bằng chứng tái hiện trực tiếp**:
  - Trong `AppShell.tsx:86`, `const targetSetting = preset.setting ?? 'outpatient'`. Do `copd_preset_inpatient_exac_0245` quên khai báo `setting: 'inpatient'`, ngay khi bác sĩ chọn ca mẫu nội trú giường 08 khoa Nội hô hấp trên giao diện, hệ thống lập tức ép `setting` về `'outpatient'`!
  - Kết quả thực tế (`B_preset_appshell_copd_preset_inpatient_exac_0245`): (1) Phát lệnh vô lý `rec_copd_outpatient_emergency_refer` (*"Suy hô hấp cấp trên bệnh nhân ngoại trú: Cần chuyển Cấp cứu / Nhập viện ngay"*); (2) Khuyến cáo thời gian kháng sinh ngoại trú `5–7 ngày` thay vì nội trú nặng `7–10 ngày` theo QĐ 2131/QĐ-BYT; (3) Biến mất hoàn toàn dự phòng huyết khối VTE nội viện (`rec_copd_vte_prophylaxis`) và bảng kiểm xuất viện (`rec_copd_discharge_checklist`). Ngoài ra tiêu đề ghi rõ `"nhịp thở 30"` nhưng `customInputs.copd` lại thiếu `respiratoryRate: 30`.
- **Hướng khắc phục**: Khai báo tường minh `setting: 'inpatient'` và `respiratoryRate: 30` cho `copd_preset_inpatient_exac_0245` (cùng `setting: 'outpatient'` cho 3 preset ngoại trú còn lại) trong `src/modules/copd/presets.ts`.

---

#### [COPD-R4-R3-07] Thiếu hoàn toàn quy tắc cảnh báo / giảm liều corticosteroid đường uống dùng duy trì kéo dài ở COPD ổn định (`P01`, `P02`) và không tính toán kiểm tra số học ngưỡng liều độc Theophylline `≥ 10 mg/kg/ngày` (`P03`, `E12`)
- **Mức độ**: `major` | **Loại mục**: `missing` | **Định danh**: `copd.safety.chronic_oral_steroid_avoid_taper`
- **Vị trí mã nguồn**: `src/modules/copd/helpers.constants.ts:203-211`, `src/modules/copd/rules.safety.systemic.ts:188-240`.
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  1. **Kịch bản `P01` & `P02` (COPD ngoại trú ổn định đang uống `Prednisolone 10 mg/ngày` hoặc `Medrol 16 mg/ngày` kéo dài)**: `evaluate()` trả về **0 cảnh báo, 0 khuyến cáo tránh dùng hay giảm liều từ từ**, vi phạm khuyến cáo **Evidence A** của GOLD 2026 (*"Long-term treatment with oral corticosteroids has numerous side effects with no evidence of benefits"* — gây bệnh cơ hô hấp do steroid làm yếu cơ hoành, suy thượng thận cấp nếu ngưng đột ngột, loãng xương gãy lún đốt sống, đái tháo đường, viêm phổi).
  2. **Kịch bản `P03` (Bệnh nhân 45 kg uống `Theophylline 400 mg x 2 lần/ngày = 800 mg/ngày = 17.8 mg/kg/ngày` kèm `Ciprofloxacin`)**: Tại `rules.safety.systemic.ts:208`, ngưỡng `copd.theophylline_max_mg_kg_day` (`10 mg/kg/ngày` theo QĐ 2131/QĐ-BYT) chỉ được chèn vào văn bản mà **không hề tính toán tổng liều hàng ngày chia cho `weightKg`**. Kết quả: bệnh nhân đang uống liều độc gấp gần 2 lần trần tối đa kèm thuốc ức chế mạnh CYP1A2 (`Ciprofloxacin`) chỉ nhận được một thẻ `CONSIDER` ưu tiên thấp (`priority: 72`, `tierOrder: 1`) thay vì cảnh báo quá liều `REDUCE`/`STOP` khẩn cấp!
- **Hướng khắc phục**:
  1. Thêm quy tắc `copd.safety.chronic_oral_steroid_taper` khi `!isAcuteExacerbation(ctx)` và có `SYSTEMIC_STEROID_IDS` trong `currentMeds`: phát khuyến cáo `REDUCE` / `AVOID` (GOLD 2026 Evidence A), hướng dẫn tối ưu hóa thuốc hít nền tảng và giảm liều corticosteroid uống từ từ (taper) để phòng suy thượng thận cấp.
  2. Tại `copd.safety.theophylline_chronic_review`, tính tổng liều `mg/ngày` từ `med.dose` + `med.freq` chia cho `weightKg` và kiểm tra đồng thời thuốc ức chế CYP1A2 (`ciprofloxacin`, `fluvoxamine`, `clarithromycin`, `erythromycin`): nếu vượt ngưỡng `10 mg/kg/ngày` hoặc có tương tác tăng nồng độ mạnh, phát lệnh `REDUCE` / `STOP` ưu tiên cao kèm chỉ định đo nồng độ Theophylline máu.

---

#### [COPD-R4-R3-08] Đợt cấp COPD mức độ nhẹ ngoại trú đang thở khí trời (`SpO₂ 94–95%`) bị báo nhầm "giảm/ngừng oxy bổ sung để giữ đích 88–92%", bị ép làm khí máu động mạch cấp cứu, và bị bỏ trống thuốc giãn phế quản duy trì sau đợt cấp
- **Mức độ**: `major` | **Loại mục**: `rule` | **Định danh**: `copd.inpatient.avoid_hyperoxia`
- **Vị trí mã nguồn**: `src/modules/copd/rules.inpatient.bronch_o2.ts:203-242`, `src/modules/copd/rules.inpatient.vent_icu.ts:183-210`, `src/modules/copd/rules.inpatient.vte_discharge.ts:132-185`.
- **Bằng chứng tái hiện trực tiếp qua `evaluate()` (`D04` & `P14`)**:
  - Bệnh nhân khám ngoại trú vì đợt cấp nhẹ (`setting: 'outpatient'`, ho khạc đờm tăng, khó thở nhẹ, nhịp thở `19 lần/phút`, tự thở khí trời đạt `SpO₂ = 95%`, công tắc `onSupplementalOxygen` để mặc định `undefined`):
    1. Do dòng 209 viết `const assumingO2InExac = ci.onSupplementalOxygen !== false`, hệ thống mặc định coi bệnh nhân phòng khám đang thở oxy và phát thẻ `rec_copd_inpatient_avoid_hyperoxia`: ***"SpO₂ hiện tại 95% > 92%: Không thở oxy liều cao; giảm/ngừng oxy bổ sung để giữ đích 88–92%"*** cho một người đang thở khí trời!
    2. Quy tắc `copd.inpatient.abg_required` (`setting: 'both'`) ép mọi đợt cấp ngoại trú `SpO₂ 95%` phải làm **Khí máu động mạch cấp cứu (`missing_input_abgPh`)** — thủ thuật xâm lấn không có chỉ định ở đợt cấp nhẹ ngoại trú không thiếu oxy máu (GOLD 2026 & QĐ 2131/QĐ-BYT).
    3. Ở `P14` (bệnh nhân chưa từng dùng thuốc hít duy trì), toàn bộ quy tắc khởi trị nền bị tắt trong đợt cấp, trong khi `discharge_checklist` lại khóa ở `setting: 'inpatient'`, khiến bệnh nhân ngoại trú kết thúc đợt cấp mà không có bất kỳ khuyến cáo khởi trị thuốc giãn phế quản duy trì hay lịch hẹn tái khám sau 1–4 tuần.
- **Hướng khắc phục**:
  1. Ở `setting: 'outpatient'`, chỉ kích hoạt `avoid_hyperoxia` khi `ci.onSupplementalOxygen === true` tường minh.
  2. Giới hạn `abg_required` cho `setting === 'inpatient'` hoặc ngoại trú có dấu hiệu nặng (`SpO₂ < 92%`, `RR > 24`, co kéo cơ hô hấp phụ, rối loạn tri giác, đang thở oxy, hoặc tiền sử tăng CO₂).
  3. Bổ sung khuyến cáo tái khám trong 1–4 tuần & khởi trị/tối ưu hóa thuốc giãn phế quản duy trì sau đợt cấp cho cả `setting: 'outpatient'`.

---

#### [COPD-R4-R3-09] Kê trùng lặp chống đông liều điều trị (`START Apixaban`) và dự phòng huyết khối (`START LMWH Enoxaparin`) khi chạy đa phân hệ `['copd', 'af']` (`F08`), đồng thời bỏ sót chống chỉ định HIT và giảm tiểu cầu nặng (`P15`)
- **Mức độ**: `major` | **Loại mục**: `rule` | **Định danh**: `copd.inpatient.vte_prophylaxis`
- **Vị trí mã nguồn**: `src/modules/copd/rules.inpatient.vte_discharge.ts:18-36, 46-68`, `src/engine/mergeConflictGroups.ts`.
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  1. **Kịch bản `F08` (`selectedModules: ['copd', 'af']`, nhập viện đợt cấp COPD kèm rung nhĩ mới phát hiện `CHA₂DS₂-VA ≥ 2`, `currentMeds: []`)**: Phân hệ `af` phát lệnh **`START apixaban` (5 mg x 2 lần/ngày — liều kháng đông điều trị hoàn toàn)**, đồng thời phân hệ `copd` vẫn phát lệnh **`START Enoxaparin (LMWH)`** (`rec_copd_vte_prophylaxis`)! Do `isAlreadyAnticoagulated` chỉ nhìn vào `currentMeds` và `rec_copd_vte_prophylaxis` bỏ trống `drugId`, bộ gộp `merge.ts` không phát hiện được tình trạng dùng kép DOAC liều điều trị + LMWH — gây nguy cơ xuất huyết nội sọ/tiêu hóa nặng.
  2. **Kịch bản `P15` (`hit: true` / `heparinInducedThrombocytopenia: true`, tiểu cầu `35 G/L`)**: `hasBleedingContraindication` không kiểm tra tiền sử giảm tiểu cầu do heparin (HIT) cũng như tiểu cầu `< 50 G/L`, vẫn phát lệnh **`START LMWH`** (chống chỉ định tuyệt đối trên bệnh nhân HIT).
- **Hướng khắc phục**:
  1. Gắn `drugId: 'enoxaparin'` cho `rec_copd_vte_prophylaxis` và thêm quy tắc triệt tiêu trong `merge.ts` / `mergeConflictGroups.ts`: khi kế hoạch điều trị đã có lệnh `START`/`CONTINUE` thuốc kháng đông liều điều trị (`apixaban`, `rivaroxaban`, `dabigatran`, `edoxaban`, `warfarin`), tự động loại bỏ lệnh `START` heparin dự phòng VTE.
  2. Bổ sung kiểm tra `platelets < 50` (chuyển sang dự phòng cơ học IPC) và kiểm tra tiền sử `hit` / `heparin_induced_thrombocytopenia` (tuyệt đối tránh UFH/LMWH).

---

#### [COPD-R4-R3-10] Phát biểu lâm sàng sai sự thật ("đang đáp ứng tốt", "không có biến chứng viêm phổi tái diễn", "khi không có đợt cấp") và chặn oan thuốc sinh học Dupilumab/Mepolizumab ở bệnh nhân có chống chỉ định LAMA (`E06`, `E07`, `P17`)
- **Mức độ**: `major` | **Loại mục**: `rule` | **Định danh**: `copd.followup.continue_controlled_inhaler`
- **Vị trí mã nguồn**: `src/modules/copd/rules.followup.continue.ts:39-89`, `src/modules/copd/rules.followup.stepup_bronch.ts:138-174`, `src/modules/copd/rules.escalation.biologics.ts:47, 108`.
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  1. **Kịch bản `E06` & `P17`**: Bệnh nhân đang dùng `Symbicort` (`budesonide_formoterol`), triệu chứng nặng (`mMRC = 2, CAT = 18`), **2 đợt cấp + 1 lần nhập viện**, `EOS = 350 tế bào/µL`, có **tiền sử viêm phổi (`priorPneumonia: true`)** VÀ **glôcôm góc đóng hẹp (`narrowAngleGlaucoma: true`)**.
     - Kết quả `evaluate()`: Phát thẻ `CONTINUE` khẳng định sai sự thật: ***"Người bệnh đang đáp ứng tốt về triệu chứng và đợt cấp với phác đồ có chứa ICS hiện tại, không có biến chứng viêm phổi tái diễn"***, kèm thẻ `MONITOR` viết sai: ***"GOLD 2026 khuyến cáo không bổ sung ICS chỉ vì khó thở đơn thuần (khi không có đợt cấp / BCAT thấp)"***!
     - Đồng thời, cả **Dupilumab** lẫn **Mepolizumab** đều bị chặn vì `rules.escalation.biologics.ts:47 & 108` yêu cầu cứng `effectiveInhaler === 'triple'` mà quên miễn trừ trường hợp chống chỉ định LAMA (trong khi `rules.escalation.oral.ts:32-39` cho Roflumilast/Azithromycin đã hỗ trợ đúng `effectiveInhaler === 'ics_laba' && hasAnticholinergicContra(ctx)`!).
  2. **Kịch bản `E07`**: Bệnh nhân 3 đợt cấp, 2 nhập viện, `mMRC = 3, CAT = 24` đang dùng `Tiotropium` nhưng chưa có kết quả `bloodEos`: hệ thống vừa đòi nhập `bloodEos` vừa phát thẻ `CONTINUE` tuyên bố *"Người bệnh đang duy trì ổn định trên thuốc giãn phế quản đường hít nền tảng"*!
- **Hướng khắc phục**:
  1. Sửa nội dung văn bản của `continue_controlled_inhaler` theo đúng trạng thái thực tế của người bệnh (phân biệt rõ "duy trì ổn định" với "tạm giữ thuốc hiện tại trong khi chờ kết quả BCAT máu hoặc do chống chỉ định phối hợp LAMA", và cảnh báo theo dõi sát khi `priorPneumonia === true`).
  2. Sửa điều kiện `lama_contra_dyspnea_rehab` chỉ đề cập "không bổ sung ICS" khi bệnh nhân chưa dùng ICS và không có chỉ định ICS.
  3. Tại `rules.escalation.biologics.ts:47 & 108`, cho phép `effectiveInhaler === 'triple' || (effectiveInhaler === 'ics_laba' && hasAnticholinergicContra(ctx))` nhất quán với `rules.escalation.oral.ts`.

---

#### [COPD-R4-R3-11] Vi phạm Fail-Closed và bất đồng bộ làm tròn giữa `engine/derive.ts` – `calculators/gold.ts` – `note.ts` và phân hệ `copd` (`A27`, `C02`, `C04`)
- **Mức độ**: `major` | **Loại mục**: `threshold` | **Định danh**: `engine.derive.goldGroup`
- **Vị trí mã nguồn**: `src/engine/derive.ts:175-191`, `src/engine/calculators/gold.ts:227-249`, `src/engine/note.ts:189`, `src/modules/copd/helpers.clinical.ts:104`.
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  1. **Kịch bản `A27` & `C04` (Thiếu `CAT` với `mMRC = 1`, hoặc thiếu cả `mMRC` lẫn `CAT`)**: Phân hệ `copd` dừng kê đơn và phát `missing_input_symptoms_abe` đúng nguyên tắc fail-closed (vì nếu `CAT ≥ 10` bệnh nhân thuộc **Nhóm B** phải dùng LABA+LAMA chứ không phải Nhóm A). Thế nhưng `derive.ts:183-191` lại tính ra `derived.goldGroup = 'A'` và `plan.noteText` in thẳng vào hồ sơ bệnh án: **`FEV₁: 54% dự đoán (GOLD 2, Group A)`**!
  2. **Kịch bản `C02` (`FEV₁ = 1.392 L, FVC = 2.00 L` — tỷ số thực `0.696 < 0.70`)**: `derive.ts:175` làm tròn `.toFixed(2)` thành `0.70` (báo không tắc nghẽn, `derived.goldGrade = undefined`, bệnh án in `FEV₁/FVC: 0.7`), trong khi phân hệ `copd` làm tròn `.toFixed(3)` thành `0.696 < 0.70` nên vẫn chẩn đoán `GOLD 2` và kê `START tiotropium_olodaterol`!
- **Hướng khắc phục**:
  1. Sửa `derive.ts` và `calculators/gold.ts`: chỉ gán `goldGroup = 'A'` khi **cả hai** `mmrc !== undefined (< 2)` và `cat !== undefined (< 10)` kèm `copdExacerbations !== undefined`; trả về `undefined` khi thiếu dữ liệu phân nhóm.
  2. Thống nhất công thức tính tỷ số `FEV₁/FVC` giữa `derive.ts`, `calculators/gold.ts` và `helpers.clinical.ts` (không làm tròn cụt 2 chữ số trước khi so sánh với ngưỡng `0.70`).

---

#### [COPD-R4-R3-12] Bỏ sót lệnh `STOP` khi dùng trùng lặp 2 thuốc sinh học hô hấp (`A14`, `P04`), lỗ hổng thiếu bọc lỗi tại `src/engine/evaluate.ts:81` làm sập phiên đánh giá đa phân hệ `['copd', 'asthma']` (`F01`–`F06`), và xung đột đích `SpO₂` cấp cứu tiềm ẩn
- **Mức độ**: `major` | **Loại mục**: `rule` | **Định danh**: `copd.followup.biologic_continue`
- **Vị trí mã nguồn**: `src/modules/copd/rules.escalation.biologics.ts:144-187`, `src/engine/evaluate.ts:77-84`, `src/modules/asthma/rules.acute.ts:165-190`, `src/modules/asthma/rules.track2.ts:474-567`.
- **Bằng chứng tái hiện trực tiếp qua `evaluate()`**:
  1. **Kịch bản `A14` (`currentMeds: [dupilumab, mepolizumab]`) & `P04` (`currentMeds: [benralizumab, dupilumab]`)**: Ở `A14`, hệ thống phát `CONTINUE dupilumab` nhưng **không phát lệnh `STOP mepolizumab`**. Ở `P04`, `findCurrentMedInSet` chạm `benralizumab` đầu tiên rồi thoát sớm (`return []`), khiến hệ thống **không phát `STOP benralizumab` mà cũng mất luôn `CONTINUE dupilumab`**!
  2. **Kịch bản `F01`–`F06` (`selectedModules: ['copd', 'asthma']`)**: `evaluate()` sập hoàn toàn với `TypeError` chưa bắt tại `src/engine/evaluate.ts:81` (`rule.profiles.includes`) vì khối `try/catch` bảo vệ lỗi từng quy tắc chỉ bắt đầu ở dòng 84 (sau dòng 78–83). Đồng thời, đối chiếu mã nguồn cho thấy khi chạy chung `['copd', 'asthma']`, bệnh nhân đợt cấp tăng CO₂ có nguy cơ nhận đồng thời đích `SpO₂ 93–95%` (từ Hen) và `88–92%` (từ COPD), cũng như nhận Kế hoạch hành động Hen dùng ICS-formoterol cắt cơn chồng lên bộ ba đóng (`Trelegy`/`Trimbow`).
- **Hướng khắc phục**:
  1. Thêm quy tắc `copd.safety.duplicate_biologic_stop_0..2` dừng các thuốc sinh học hô hấp trùng lặp/không có chỉ định, và sửa `biologic_continue` quét tìm đúng `dupilumab`/`mepolizumab`.
  2. Bọc toàn bộ vòng lặp quy tắc từ dòng 77 của `src/engine/evaluate.ts` vào trong `try/catch`, và thêm quy tắc ưu tiên đích `SpO₂ 88–92%` trong `mergeConflictGroups.ts` khi bệnh nhân Hen + COPD có tăng CO₂ máu.

---

### 4.3. Nhóm Mức Độ `MINOR` & `SUGGESTION` (3 Phát Hiện)

#### [COPD-R4-R3-13] (`minor`) Tầm soát thiếu hụt Alpha-1 Antitrypsin (AATD) bị khóa cứng sau tiêu chuẩn chụp CT phổi liều thấp (`50–80 tuổi`, `≥ 20 bao-năm`), bỏ sót bệnh nhân COPD trẻ tuổi / không hút thuốc (`P09`), trong khi `copd.ldct_quit_years_max` (`15 năm`) không được kiểm tra số học (`P10`)
- **Vị trí mã nguồn**: `src/modules/copd/rules.nonpharm.ts:275-320`.
- **Bằng chứng (`P09` & `P10`)**: Bệnh nhân 41 tuổi không hút thuốc (`smokingStatus: 'never'`, `FEV₁ 38%`) — hình mẫu kinh điển của AATD theo WHO & GOLD 2026 — không nhận được khuyến cáo xét nghiệm AATD vì bị chặn bởi điều kiện LDCT `age >= 50 && packYears >= 20`. Ngược lại, người đã bỏ thuốc 25 năm (`quitYears: 25 > 15`) vẫn được khuyên chụp LDCT hàng năm.
- **Hướng khắc phục**: Tách riêng quy tắc `copd.nonpharm.aatd_screening` (áp dụng cho mọi bệnh nhân COPD chưa từng xét nghiệm AATD, nhấn mạnh người `< 50 tuổi` hoặc không hút thuốc) khỏi `copd.nonpharm.ldct_lung_cancer_screening` (kiểm tra thêm `quitYears <= 15`).

#### [COPD-R4-R3-14] (`minor`) Bệnh nhân GOLD Nhóm A dị ứng đạm sữa bò đang dùng DPI bị nâng bậc quá mức lên `LABA + LAMA` thay vì đơn trị `Tiotropium Respimat` (`E02`), và `switchFrom` chỉ ghi nhận 1 bình DPI đầu tiên trong bộ ba mở (`E09`)
- **Vị trí mã nguồn**: `src/modules/copd/helpers.inhalers.ts:209-251`, `src/modules/copd/rules.safety.inhalers_device.ts:130-162`.
- **Hướng khắc phục**: Bổ sung nhánh kiểm tra GOLD Nhóm A (`mmrc < 2 && cat < 10 && exac === 0 && hosp === 0`) trong `resolveLactoseFreeReplacementTarget` để chuyển sang đơn trị `tiotropium` (`Spiriva Respimat SMI`), và liệt kê đầy đủ tên mọi bình DPI bị thay thế trong thẻ `SWITCH`.

#### [COPD-R4-R3-15] (`suggestion`) Bổ sung trường `quitYears` vào `copdInputs` và đồng bộ tự động giá trị số `qtcMs` của ECG với cờ `prolongedQtc`
- **Vị trí mã nguồn**: `src/modules/copd/inputs.ts`, `src/modules/copd/helpers.clinical.ts:227-237`.
- **Hướng khắc phục**: Thêm trường tùy chọn `quitYears` (số năm đã cai thuốc lá) cho nhóm `smoking_exposure` trong giao diện COPD và cho phép `hasProlongedQtc(ctx)` tự động đọc thông số `qtcMs` số học bên cạnh công tắc boolean `prolongedQtc`.

---

## 5. Điều Kiện Tiên Quyết Để Đạt `PASS` Ở Vòng Tiếp Theo (Exit Criteria)

Để phân hệ `copd` được Hội đồng Thẩm định thông qua (`PASS`), nhóm phát triển cần khắc phục triệt để **toàn bộ 4 phát hiện `critical` (`COPD-R4-R3-01` → `04`) và 8 phát hiện `major` (`COPD-R4-R3-05` → `12`)**, kèm bổ sung kiểm thử tự động cho các ca đối kháng then chốt:
1. Bất biến chuyển đổi thuốc hít: Không bao giờ phát lệnh `STOP` chuyển đổi bình hít khi bối cảnh điều trị (`inpatient`/`outpatient`) chặn quy tắc `START`/`SWITCH` đích (`E01`, `P07`, `P08`).
2. Tự động nhận diện suy hô hấp cấp & toan hô hấp mất bù (`pH ≤ 7.35` & `PaCO₂ > 45 mmHg`, ngừng thở, lơ mơ, `SpO₂ < 90%` cấp) ở cả nội trú lẫn ngoại trú kể cả khi người dùng quên tích ô `acuteExacerbation`, đồng thời khóa chặt LTOT/vắc-xin trong pha cấp (`D01`–`D03`).
3. Chặn 100% thiết bị bột khô chứa lactose (kể cả khi nhập qua mã KB gốc kèm tên `HandiHaler`/`Turbuhaler`/`Accuhaler`/`DPI` và khi dùng ≥ 2 bình DPI chưa có hô hấp ký) ở bệnh nhân phản vệ đạm sữa bò (`P05`, `P06`, `Q03`, `E04`).
4. Sinh lệnh `STOP` đa khe cho toàn bộ thuốc ức chế TKTW và toàn bộ dẫn xuất xanthin trong đợt cấp tăng CO₂ (`D05`, `D06`), kiểm tra liều độc `mg/kg/ngày` của Theophylline (`P03`) và bổ sung quy tắc giảm liều steroid uống mạn tính ở COPD ổn định (`P01`, `P02`).
5. Tách đường dùng nhỏ mắt `timolol_ophthalmic` khỏi quy tắc chuyển sang `Bisoprolol` uống (`E10`), chặn chuyển chẹn beta khi `HR < 50 bpm` (`E11`), sửa preset nội trú `copd_preset_inpatient_exac_0245` (`setting: 'inpatient'`), khử trùng lặp `DOAC + LMWH` + chống chỉ định HIT (`F08`, `P15`), và đồng bộ fail-closed `goldGroup` / làm tròn `FEV₁/FVC` trong `engine/derive.ts` (`A27`, `C02`, `C04`).
