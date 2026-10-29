# Báo Cáo Thẩm Định Chuyên Môn Độc Lập Vòng 2 – Reviewer R2 (Dược Sĩ Lâm Sàng)
## Module: Bệnh Phổi Tắc Nghẽn Mạn Tính (`copd`) – GDMT-VN

- **Reviewer**: R2 – Dược sĩ lâm sàng (Independent Clinical Pharmacist – Hô hấp & An toàn thuốc)
- **Vòng thẩm định**: Round 2 (Hậu kiểm khắc phục Vòng 1 + Kiểm định sâu độc lập toàn diện)
- **Ngày thực hiện**: 27/10/2026
- ** Cam kết độc lập**: Thực hiện hoàn toàn độc lập theo `docs/REVIEW_PROTOCOL.md`; tuyệt đối không đọc/tham chiếu bất kỳ tài liệu Vòng 2 nào của R1 hoặc R3.
- **Phạm vi & Phương pháp kiểm định**:
  1. **Hậu kiểm 100% 14 phát hiện Vòng 1 của R2** (`COPD-R2-01` → `COPD-R2-14`) và đối chiếu các thay đổi dược lý trong `docs/reviews/copd/round1_RESPONSE.md`.
  2. **Kiểm định từng trường trên toàn bộ 19 tệp `DrugEntry` COPD** trong `kb/drugs/` (`tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`, `indacaterol`, `olodaterol`, `salmeterol`, `vilanterol`, `tiotropium_olodaterol`, `umeclidinium_vilanterol`, `glycopyrronium_indacaterol`, `fluticasone_furoate_umeclidinium_vilanterol`, `budesonide_glycopyrronium_formoterol`, `beclometasone_glycopyrronium_formoterol`, `roflumilast`, `azithromycin`, `dupilumab`, `mepolizumab`, `theophylline`) cùng 2 thuốc cấp cứu dùng chung (`salbutamol`, `prednisolone`).
  3. **Kiểm định mã nguồn lâm sàng & tầng an toàn**: `src/modules/copd/{index.ts, inputs.ts, rules.ts, matrices.ts, pathways.ts, presets.ts}`, `kb/thresholds/copd.json`, `kb/citations/{copd.json, interactions.json}`, `kb/interactions/{diabetes_respiratory.json, qt_prolongation.json}`, `src/engine/{evaluate.ts, merge.ts}`, `src/engine/safety/{gates.ts, duplicates.ts, interactions.ts, reviewMeds.ts}`, `src/ui/{PlanRow.tsx, MatrixView.tsx}`.
  4. **Đối chiếu trực tiếp tài liệu gốc sơ cấp (`Medical_Library_2026`)**:
     - `GOLD_2026_Report.pdf` (Báo cáo GOLD 2026 toàn văn)
     - `BYT_2131_COPD_2026.pdf` (Quyết định 2131/QĐ-BYT năm 2026 – đặc biệt Bảng 0.1 tr. 20, Phụ lục 1 Liều thuốc tr. 66–71, Phụ lục 11 Tương tác thuốc chống chỉ định tr. 107–122)
     - Nhãn thuốc gốc FDA & EMA: `FDA_label_roflumilast.pdf`, `FDA_label_dupilumab.pdf`, `FDA_label_budesonide_glycopyrronium_formoterol.pdf` (Breztri), `FDA_label_aclidinium.pdf`, `FDA_label_azithromycin.pdf`, `Ultibro_Breezhaler_SmPC.pdf` (EMA), `Trimbow_SmPC.pdf` (EMA).
  5. **Thực thi kiểm thử động (`vitest`)**:
     - `npx vitest run tests/modules/copd/invariants.test.ts`: **43/43 bài test PASS** (12.000 ca ngẫu nhiên đa kịch bản + 10.000 ca kiểm chứng fail-closed khuyết dữ liệu + 41 ca chuẩn golden).
     - Bộ kiểm thử dược lâm sàng chuyên biệt Vòng 2 (`docs/reviews/copd/scratch/round2_r2_audit.test.ts`): kiểm tra tự động `fmtDose()`, `renalBand()` tại eGFR = 90 / 25 / 12 mL/min/1.73m², đối khớp 54/54 trích dẫn nguyên văn trong `kb/citations/copd.json`, kiểm tra 38/38 trường `pregnancy`/`lactation`, chạy 5 presets ở cả 2 hồ sơ `INTL` & `VN`, và 9 kịch bản đối nghịch dược lâm sàng (Cases A → H).

---

## 1. TỔNG QUAN KẾT QUẢ THẨM ĐỊNH VÒNG 2

| Mức độ nghiêm trọng (Severity) | Số lượng | Mã phát hiện | Tóm tắt trọng tâm dược lâm sàng |
|---|:---:|---|---|
| **CRITICAL** (Nguy cơ gây hại trực tiếp) | **1** | `COPD-R2-201` | **Hồi quy nghiêm trọng trong đợt cấp nội viện**: Gán `drugId='salbutamol'` và `drugId='prednisolone'` với `action='START'` khiến `mergeRecommendations()` tự động đổi thành `CONTINUE` nếu bệnh nhân đã có sẵn Salbutamol xịt cắt cơn tại nhà (100 mcg) hoặc Prednisolone liều thấp mạn tính (5 mg/ngày) trong `currentMeds` — xóa sạch liều cấp cứu, gây **thiếu liều corticoid đợt cấp gấp 8 lần** (`5` thay vì `40 mg/ngày × 5 ngày`) và làm **mất đơn vị liều** trên Salbutamol (`'100'` trần trụi không rõ mcg hay mg). |
| **MAJOR** (Sai lệch guideline / nhãn thuốc / QA-1 / QA-7) | **6** | `COPD-R2-202`<br>`COPD-R2-203`<br>`COPD-R2-204`<br>`COPD-R2-205`<br>`COPD-R2-206`<br>`COPD-R2-207` | - **`COPD-R2-202`**: Trích dẫn `fda.roflumilast.concomitant_theophylline` cắt xén 7 chữ đầu câu phủ định (*"No significant drug interactions were observed when..."*) để gán ngược chiều (vi phạm QA-7); `evaluate()` vừa gợi ý `CONSIDER roflumilast` vừa báo động đỏ `ix.roflumilast_theophylline`; bỏ sót tương tác chống chỉ định Roflumilast + cảm ứng mạnh CYP3A4 (Rifampin, Carbamazepine, Phenytoin, Phenobarbital — BYT 2131 Phụ lục 11 STT 35) và ức chế CYP3A4/CYP1A2.<br>- **`COPD-R2-203`**: Cả 4 quy tắc `CONSIDER` ngoại trú (`roflumilast`, `azithromycin`, `dupilumab`, `mepolizumab`) không kiểm tra `currentMeds`: bệnh nhân đang duy trì Roflumilast 500 mcg bị gợi ý lùi về liều dò không hiệu lực 250 mcg; bệnh nhân đang dùng kháng thể đơn dòng vẫn bị gợi ý chồng thêm sinh học thứ hai.<br>- **`COPD-R2-204`**: Gate nhẹ cân của Roflumilast bỏ qua `ctx.derived.bmi < 18.5` (bệnh nhân suy kiệt 38 kg / 168 cm, BMI 13.5 kg/m² vẫn được gợi ý `CONSIDER roflumilast`) và đọc các trường `underweight`, `childPugh` không tồn tại trong `copdInputs`.<br>- **`COPD-R2-205`**: 18/19 thuốc COPD thiếu dải thận `eGFR < 15` (`renalBand(id, 12) === undefined`); cả 4 thuốc chứa Glycopyrronium (Seebri, Ultibro, Breztri, Trimbow) và Spiolto trả về `rec/rec` ở eGFR = 25 trái với nhãn FDA/EMA (AUC tăng gấp 2.2 lần khi GFR < 30 / lọc máu → chỉ dùng khi lợi ích vượt nguy cơ `caution`).<br>- **`COPD-R2-206`**: Vi phạm Fail-Closed (QA-1/QA-9) ở 3 quy tắc (`ics_monotherapy_stop`, `ltot_oxygen`, `home_niv`) khi `fev1FvcRatio === undefined` — tự động cắt Pulmicort mà không kê thuốc thay thế và chỉ định LTOT tại nhà khi chưa xác nhận COPD.<br>- **`COPD-R2-207`**: Vi phạm QA-7 trên 38/38 trường `pregnancy` & `lactation` của 19 thuốc COPD (gắn citation phân nhóm GOLD Group A / liều hít không hề nhắc đến thai kỳ/cho con bú); liều `100 mg mỗi 4 tuần` của `mepolizumab.json` không có trong citation gắn kèm; cảnh báo bí tiểu/tuyến tiền liệt của LAMA gắn citation chỉ nói về glôcôm mặt nạ. |
| **MINOR** (Thiếu đồng bộ phụ / vệ sinh dữ liệu / ma trận) | **3** | `COPD-R2-208`<br>`COPD-R2-209`<br>`COPD-R2-210` | - **`COPD-R2-208`**: `QT_PROLONGING_DRUG_IDS` gán cứng nên bỏ lọt `propafenone` (`qtRisk: 'known'`) gây mâu thuẫn vừa gợi ý Azithromycin vừa báo xoắn đỉnh; thiếu `InteractionRule` cho Salmeterol + ức chế mạnh CYP3A4 (Clarithromycin — BYT 2131 STT 34).<br>- **`COPD-R2-209`**: `azithromycin.json` còn sót câu cũ *"đã ngừng hút thuốc"*; 5 tệp thuốc lưu câu văn giải thích tình trạng lưu hành bên trong mảng `vnBrands`; `Trimbow` chưa đối chiếu Bảng 0.1 BYT 2131/2026.<br>- **`COPD-R2-210`**: `copdMatrixTherapy` đặt `continue: 'not_rec'` thay vì `'caution'` cho bộ ba ICS ở Nhóm A/B (chưa phản ánh quy tắc không tự ý rút ICS của GOLD 2026 tr. 77); `copdMatrixDevices` thiếu `umeclidinium_vilanterol` (Anoro Ellipta); nút UI `PlanRow.tsx` gán nhãn cứng `"📊 Xem ma trận thận"`. |
| **SUGGESTION** (Đề xuất hoàn thiện hiển thị) | **1** | `COPD-R2-211` | Chuẩn hóa `start.amount` + `unit` của 4 thuốc phối hợp cố định (Spiolto, Anoro, Ultibro, Trelegy) theo số nhát/liều/viên nang đồng bộ với Breztri/Trimbow, và hiển thị dòng nhắc thận trọng glôcôm góc đóng / bí tiểu trên `warnings` khi kê LAMA. |
| **TỔNG CỘNG** | **11** | `COPD-R2-201` → `211` | Đầy đủ cấu trúc JSON tại `docs/reviews/copd/round2_R2.json`. |

### PHÁN QUYẾT THẨM ĐỊNH VÒNG 2 (VERDICT): **FAIL**
*(Theo `docs/REVIEW_PROTOCOL.md`, module chỉ đạt `PASS` khi còn `0 critical` và `0 major`. Module COPD đã có bước tiến rất lớn sau Vòng 1 nhưng phát sinh 1 lỗi hồi quy mức Critical khi tích hợp `drugId` nội viện và còn 6 lỗi Major về tính toàn vẹn bằng chứng QA-7, dược động học suy thận nặng và cơ chế fail-closed).*

---

## 2. BẢNG HẬU KIỂM 100% CÁC PHÁT HIỆN VÒNG 1 CỦA R2 (`COPD-R2-01` → `COPD-R2-14`)

| Mã Vòng 1 | Mức độ V1 | Nội dung phát hiện Vòng 1 | Trạng thái sau sửa | Đánh giá độc lập Vòng 2 của R2 |
|---|:---:|---|:---:|---|
| `COPD-R2-01` | Critical | Nguy cơ thiếu 50% liều ở Breztri (`amount: 160 mcg`) và Trimbow (`amount: 87 mcg`). | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | Cả hai tệp đã đổi sang `amount: 2`, `unit: "nhát"`, `frequency: "2 lần/ngày"`. Kiểm chứng động `fmtDose()` xuất rõ: `"2 nhát x 2 lần/ngày (hít) - Hít 2 nhát x 2 lần/ngày (sáng 2 nhát, tối 2 nhát)..."`, khớp 100% nhãn FDA Breztri và EMA Trimbow. |
| `COPD-R2-02` | Critical | Khởi trị Roflumilast ở bệnh nhân xơ gan / suy gan Child-Pugh B/C do thiếu Gate an toàn. | ⚠️ **SỬA MỘT PHẦN** | Đã thêm `copd.safety.roflumilast_contraindicated` và chặn `liverDisease`/`cirrhosis`, trầm cảm/tự sát, sụt cân. **Tuy nhiên** còn sót 2 điểm: (1) bỏ qua `ctx.derived.bmi < 18.5` khi bệnh nhân suy kiệt nặng nhưng chưa tích tay ô `unexplainedWeightLoss` (`COPD-R2-204`); (2) đọc `ci.underweight` và `ci.childPugh` vốn không có trong `copdInputs`. |
| `COPD-R2-03` | Major | Kháng sinh đợt cấp sai tiêu chuẩn Anthonisen (kê ngay khi đờm trắng chỉ vì tăng thể tích). | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | `copd.inpatient.antibiotics` (`rules.ts` dòng 2170–2185) nay bắt buộc `purulentSputum === true` (kèm ≥ 1 triệu chứng chính khác hoặc đờm mủ rõ) HOẶC chỉ định thông khí cơ học (`pH <= 7.35 && PaCO2 >= 45`). Đúng chuẩn GOLD 2026 tr. 114 & BYT 2131/2026. |
| `COPD-R2-04` | Major | Bỏ sót thuốc giãn phế quản tác dụng ngắn (SABA ± SAMA) trong đợt cấp nội viện. | ❌ **PHÁT SINH HỒI QUY CRITICAL** | Đã bổ sung `copd.inpatient.short_acting_bronchodilators` rất tốt cho bệnh nhân chưa có thuốc tại nhà. **Nhưng** do gắn `action: 'START'` + `drugId: 'salbutamol'`, nếu bệnh nhân đã có Ventolin 100 mcg tại nhà trong `currentMeds`, `merge.ts` ghi đè thành `CONTINUE [Liều hiện tại: 100]` mất sạch đơn vị và mất liều khí dung cấp cứu (`COPD-R2-201`). |
| `COPD-R2-05` | Major | Chỉ định Oxy dài hạn tại nhà (LTOT) sai thời điểm ngay trong đợt cấp. | ⚠️ **ĐÃ SỬA ĐỢT CẤP, CÒN SÓT FAIL-CLOSED** | Đã thêm `if (isAcuteExacerbation(ctx)) return false;` chặn đúng trong đợt cấp. Tuy nhiên khi chưa nhập `fev1FvcRatio` (`undefined`), LTOT vẫn kích hoạt trước khi xác nhận chẩn đoán COPD (`COPD-R2-206`). |
| `COPD-R2-06` | Major | Loại trừ sai Mepolizumab khi có viêm phế quản mạn. | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | Đã bỏ điều kiện chặn `chronicBronchitis` trong `copd.followup.mepolizumab_indication`, đúng nguyên văn GOLD 2026 tr. 77 (*"with and without chronic bronchitis"*). (Cần bổ sung kiểm tra `currentMeds` theo `COPD-R2-203` và citation liều `100 mg` theo `COPD-R2-207`). |
| `COPD-R2-07` | Major | Corticoid và Kháng sinh nội viện thiếu `drugId`. | ❌ **PHÁT SINH HỒI QUY CRITICAL** | Đã gắn `drugId: 'prednisolone'` cho steroid nội viện (kháng sinh để không gắn cứng 1 hoạt chất kèm giải thích hợp lý do phổ Pseudomonas thay đổi). **Tuy nhiên** gắn `action: 'START'` + `drugId: 'prednisolone'` khiến bệnh nhân đang uống Prednisolone 5 mg mạn tính tại nhà bị `merge.ts` kẹt ở liều `'5'` thay vì tăng lên 40 mg/ngày × 5 ngày (`COPD-R2-201`). |
| `COPD-R2-08` | Major | `copdMatrixTherapy` gán `initiate: 'rec'` cho thuốc add-on (Roflumilast, Azithromycin, Dupilumab). | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | Tất cả các thuốc theo dõi leo thang (`roflumilast`, `azithromycin`, `dupilumab`, `mepolizumab`) trong `copdMatrixTherapy` đã chuyển sang `initiate: 'not_rec'` và `continue: 'rec'`/`'caution'` kèm ghi chú rõ chỉ bổ sung khi đợt cấp tái phát trên nền thuốc hít. |
| `COPD-R2-09` | Major | `vnBrands` sai thực tế lưu hành tại Việt Nam. | ⚠️ **SỬA MỘT PHẦN** | Đã bỏ các biệt dược gán sai, nhưng lại đưa câu văn giải thích dài vào trong mảng `vnBrands` (`"Chỉ lưu hành dạng phối hợp Anoro/Trelegy"`, `"Eklira Genuair (chưa lưu hành tại VN)"`) làm hiển thị lệch trên UI tìm kiếm/ma trận (`COPD-R2-209`). |
| `COPD-R2-10` | Minor | `copdMatrixDevices` gán `drugId` giả cho hàng tiêu chí cơ học. | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | `copdMatrixDevices` đã được thiết kế lại chuẩn mực theo 5 đại diện thuốc – bình hít thực tế (`tiotropium`, `tiotropium_olodaterol`, `glycopyrronium_indacaterol`, `fluticasone_furoate_umeclidinium_vilanterol`, `budesonide_glycopyrronium_formoterol`) đối chiếu qua 4 cột nhóm thiết bị (`smi_respimat`, `pmdi`, `dpi`, `nebulizer`). |
| `COPD-R2-11` | Minor | Thiếu cảnh báo Glaucoma góc đóng và Bí tiểu trên nhóm thuốc LAMA. | ⚠️ **SỬA MỘT PHẦN** | Cả 10 tệp thuốc chứa LAMA đã được bổ sung mục `narrow_angle_glaucoma_or_urinary_retention` trong `contraindications`. Tuy nhiên citation gắn kèm (`gold.copd.2026.lama_glaucoma_caution`) chỉ nói về glôcôm do mặt nạ khí dung chứ chưa chứa nội dung bí tiểu/tuyến tiền liệt (`COPD-R2-207`), và cảnh báo chưa hiển thị lên `warnings` lúc kê đơn (`COPD-R2-211`). |
| `COPD-R2-12` | Minor | Azithromycin dự phòng loại trừ người chưa từng hút thuốc (`never` smoker). | ✅ **ĐÃ SỬA LOGIC** | `rules.ts` (dòng 1592) nay dùng `smoking === 'former' \|\| smoking === 'never'`, mở khóa chỉ định đúng đắn cho bệnh nhân COPD do khói sinh khối tại Việt Nam. Chỉ còn sót một cụm chữ cũ trong `azithromycin.json` `start.description` (`COPD-R2-209`). |
| `COPD-R2-13` | Minor | Thiếu Gate QTc cho Azithromycin và cảnh báo độc tính/TDM cho Theophylline. | ⚠️ **SỬA MỘT PHẦN** | Đã thêm kiểm tra `qtc >= 450 ms`, khiếm thính, tương tác đa thuốc QT (`ix.qt_multi_drug_pool`), cảnh báo TDM `8–12 mcg/mL` và tương tác Theophylline + Ciprofloxacin/Fluvoxamine. Tuy nhiên citation của `ix.roflumilast_theophylline` bị cắt xén ngược nghĩa (`COPD-R2-202`) và `QT_PROLONGING_DRUG_IDS` gán cứng bỏ sót `propafenone` (`COPD-R2-208`). |
| `COPD-R2-14` | Suggestion | Mở rộng Mepolizumab sang hồ sơ `'VN'` kèm `profileDiff` và đưa vào ma trận. | ✅ **ĐÃ SỬA TRIỆT ĐỂ** | `copd.followup.mepolizumab_indication` đã hỗ trợ `profiles: ['INTL', 'VN']` kèm `profileDiff` rất chuẩn xác về tình trạng cấp phép Nucala tại Việt Nam và đã có hàng riêng trong `copdMatrixTherapy`. |

---

## 3. KIỂM ĐỊNH ĐỘC LẬP TOÀN BỘ 19 TỆP THUỐC COPD (`kb/drugs/*.json`)

Bảng dưới đây tổng hợp kết quả rà soát từng trường dữ liệu dược lâm sàng và kết quả chạy hàm `fmtDose()`, `renalBand(id, 90 / 25 / 12)` trên cả 19 tệp thuốc của module COPD:

| STT | `drugId` | Nhóm dược lý & `components` | Liều khởi đầu / tối đa & Thiết bị hít | `renalBand` tại eGFR 90 / 25 / 12 | `pregnancy` & `lactation` (QA-7) | Đánh giá dược lâm sàng Vòng 2 |
|:---:|---|---|---|---|---|---|
| 1 | `tiotropium` | `LAMA` | `5 mcg x 1 lần/ngày` (2 nhát Respimat 2.5 mcg) hoặc `18 mcg` HandiHaler; max `18 mcg/ngày`. | 90: `rec`<br>25: `caution`<br>12: `caution` | `caution` / `caution` (**Lỗi QA-7**: gắn citation liều BYT) | **Tốt nhất về dải thận** (thuốc duy nhất phủ kín eGFR 0→∞ và gắn `caution` ở eGFR < 50). Cần sửa citation thai kỳ & bí tiểu (`COPD-R2-207`). |
| 2 | `umeclidinium` | `LAMA` | `62.5 mcg x 1 lần/ngày` (giao phổi 55 mcg, DPI Ellipta); max `62.5 mcg`. | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Đúng liều nhãn FDA Incruse. Thiếu dải thận `< 15` (`COPD-R2-205`); `vnBrands` chứa câu văn giải thích (`COPD-R2-209`). |
| 3 | `glycopyrronium` | `LAMA` | `50 mcg x 1 lần/ngày` (giao phổi 44 mcg, nang hít DPI Breezhaler — tuyệt đối không nuốt). | 90: `rec`<br>25: ❌ `rec` (sai)<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | **Lỗi thận Major (`COPD-R2-205`)**: AUC tăng gấp 2.2 lần khi GFR < 30 / ESRD; bắt buộc đặt `caution` ở eGFR < 30 và phủ dải `< 15`. |
| 4 | `aclidinium` | `LAMA` | `400 mcg x 2 lần/ngày` (giao phổi 322 mcg, DPI Genuair); max `800 mcg/ngày`. | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Aclidinium thủy phân nhanh trong huyết tương (< 1% thải qua nước tiểu theo `FDA_label_aclidinium.pdf` tr. 9), không cần chỉnh liều suy thận nhưng cần phủ dải `0–15` để không trả về `undefined`. |
| 5 | `indacaterol` | `LABA` | `150 mcg x 1 lần/ngày` (tối đa `300 mcg` khi khó thở nặng, DPI Breezhaler). | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Liều đúng Phụ lục 1 BYT 2131/2026 tr. 66 (Onbrez 150–300 mcg). Thiếu dải thận `< 15` (`COPD-R2-205`). |
| 6 | `olodaterol` | `LABA` | `5 mcg x 1 lần/ngày` (2 nhát SMI Respimat 2.5 mcg); max `5 mcg`. | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Đúng liều Striverdi Respimat. Thiếu dải thận `< 15` (`COPD-R2-205`); vệ sinh `vnBrands` (`COPD-R2-209`). |
| 7 | `salmeterol` | `LABA` | `50 mcg x 2 lần/ngày` (pMDI / DPI); max `100 mcg/ngày`. | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Đúng liều chuẩn. Cần chuyển cảnh báo chống chỉ định phối hợp ức chế mạnh CYP3A4 (Clarithromycin, Itraconazole — BYT 2131 STT 34) thành `InteractionRule` chạy động (`COPD-R2-208`). |
| 8 | `vilanterol` | `LABA` | `25 mcg x 1 lần/ngày` (chỉ có trong phối hợp cố định DPI Ellipta). | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Đúng hàm lượng thành phần. Thiếu dải thận `< 15` (`COPD-R2-205`); `vnBrands` chứa câu giải thích (`COPD-R2-209`). |
| 9 | `tiotropium_olodaterol` | `LAMA`, `LABA` (`tiotropium` + `olodaterol`) | `2 nhát` (`5/5 mcg`) `x 1 lần/ngày` (SMI Spiolto Respimat 2.5/2.5 mcg/nhát). | 90: `rec`<br>25: ❌ `rec` (mâu thuẫn)<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | **Mâu thuẫn thận (`COPD-R2-205`)**: Chứa chính `tiotropium` (đang là `caution` ở eGFR < 50 trong `tiotropium.json`) nhưng Spiolto lại để `rec` ở eGFR = 25 và `undefined` ở eGFR = 12! |
| 10 | `umeclidinium_vilanterol` | `LAMA`, `LABA` (`umeclidinium` + `vilanterol`) | `1 liều` (`62.5/25 mcg`) `x 1 lần/ngày` (DPI Anoro Ellipta). | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Liều đúng FDA & BYT 2131 tr. 68. Thiếu dải thận `< 15` (`COPD-R2-205`); nên đưa thêm vào `copdMatrixDevices` (`COPD-R2-210`). |
| 11 | `glycopyrronium_indacaterol` | `LAMA`, `LABA` (`glycopyrronium` + `indacaterol`) | `1 viên nang` (`110/50 mcg`, giao phổi 85/43 mcg) `x 1 lần/ngày` (DPI Ultibro Breezhaler). | 90: `rec`<br>25: ❌ `rec` (sai SmPC)<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | **Lỗi thận Major (`COPD-R2-205`)**: `Ultibro_Breezhaler_SmPC.pdf` tr. 3–4 quy định ở suy thận nặng (GFR < 30) / ESRD lọc máu chỉ dùng khi lợi ích vượt nguy cơ (AUC glycopyrronium tăng 2.2 lần). |
| 12 | `fluticasone_furoate_umeclidinium_vilanterol` | `ICS`, `LAMA`, `LABA` | `1 liều` (`100/62.5/25 mcg`) `x 1 lần/ngày` (DPI Trelegy Ellipta); súc miệng sau hít. | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Liều và hướng dẫn súc miệng rất chuẩn theo FDA & BYT 2131 tr. 67. Thiếu dải thận `< 15` (`COPD-R2-205`). |
| 13 | `budesonide_glycopyrronium_formoterol` | `ICS`, `LAMA`, `LABA` | `2 nhát x 2 lần/ngày` (pMDI Breztri Aerosphere 160/7.2/4.8 mcg/nhát; tổng 4 nhát/ngày). | 90: `rec`<br>25: ❌ `rec` (sai FDA)<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Đã khắc phục xuất sắc lỗi liều Vòng 1 (`COPD-R2-01`). **Cần sửa thận (`COPD-R2-205`)**: `FDA_label_budesonide_glycopyrronium_formoterol.pdf` tr. 21 Section 8.7 quy định CrCl ≤ 30 hoặc lọc máu chỉ dùng khi lợi ích vượt nguy cơ (`caution`). |
| 14 | `beclometasone_glycopyrronium_formoterol` | `ICS`, `LAMA`, `LABA` | `2 nhát x 2 lần/ngày` (pMDI hạt siêu mịn Trimbow 87/9/5 mcg/nhát; tổng 4 nhát/ngày). | 90: `rec`<br>25: ❌ `rec` (sai SmPC)<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Đã khắc phục lỗi liều Vòng 1 (`COPD-R2-01`). **Cần sửa thận (`COPD-R2-205`)** theo `Trimbow_SmPC.pdf` tr. 3 Section 4.2 (GFR < 30 / ESRD: chỉ dùng khi lợi ích vượt nguy cơ) và chú thích tình trạng lưu hành VN (`COPD-R2-209`). |
| 15 | `roflumilast` | `PDE4_inhibitor` | Khởi đầu `250 mcg x 1 lần/ngày` × 4 tuần → duy trì `500 mcg x 1 lần/ngày` (uống). | 90: `rec`<br>25: `caution`<br>12: ❌ `undefined` | `caution` / `not_rec` (**Lỗi QA-7**) | Đúng phác đồ dò liều 4 tuần giảm bỏ trị tiêu hóa theo FDA Daliresp tr. 3 (lưu ý 250 mcg không phải liều điều trị hiệu lực → xem `COPD-R2-203`). Cần sửa tương tác CYP3A4/theophylline (`COPD-R2-202`), BMI < 18.5 (`COPD-R2-204`), dải thận `< 15` (`COPD-R2-205`). |
| 16 | `azithromycin` | `macrolide_prophylaxis` | `250 mg x 1 lần/ngày` hoặc `500 mg x 3 lần/tuần` (uống dự phòng tối đa 1 năm); `qtRisk: 'known'`. | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Đúng liều GOLD 2026 tr. 77 & 162. Tại GFR < 10 mL/min, AUC tăng 35% và Cmax tăng 61% (`FDA_label_azithromycin.pdf` tr. 15) → cần dải `< 15: caution` (`COPD-R2-205`), đồng bộ `qtRisk` động (`COPD-R2-208`) và sửa câu mô tả hút thuốc (`COPD-R2-209`). |
| 17 | `dupilumab` | `biologic_anti_il4ra` | `300 mg mỗi 2 tuần` tiêm dưới da (không dùng liều nạp trong COPD); max `300 mg Q2W`. | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Liều khớp tuyệt đối `FDA_label_dupilumab.pdf` Section 2.8 (300 mg SC Q2W). Cần chặn gợi ý trùng sinh học (`COPD-R2-203`), phủ dải thận `0–15` (`COPD-R2-205`) và gắn citation thai kỳ từ nhãn FDA Dupixent (`COPD-R2-207`). |
| 18 | `mepolizumab` | `biologic_anti_il5` | `100 mg mỗi 4 tuần` tiêm dưới da; max `100 mg Q4W`. | 90: `rec`<br>25: `rec`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Liều 100 mg SC Q4W đúng phác đồ COPD (MATINEE / FDA 2025), **nhưng** citation gắn kèm (`gold.copd.2026.biologics_dupilumab_mepolizumab`) chưa có con số `100 mg` (`COPD-R2-207`). Cần chặn trùng sinh học (`COPD-R2-203`) và phủ dải thận `< 15`. |
| 19 | `theophylline` | `methylxanthine` | Khởi đầu `100 mg x 2 lần/ngày` (viên SR), chỉnh theo TDM đích `5–15 mcg/mL` (tối ưu `8–12`), max `600 mg/ngày`. | 90: `rec`<br>25: `caution`<br>12: ❌ `undefined` | `caution` / `caution` (**Lỗi QA-7**) | Đã có cảnh báo khoảng điều trị hẹp, ngộ độc > 20 mcg/mL (loạn nhịp thất, co giật) và tương tác Ciprofloxacin/Fluvoxamine rất tốt. Cần bổ sung dải thận `< 15: caution/not_rec` do tích lũy chất chuyển hóa 1,3-dimethyluric acid ở bệnh nhân suy thận giai đoạn cuối (`COPD-R2-205`). |

---

## 4. KIỂM ĐỊNH 2 MA TRẬN (`copdMatrixTherapy` & `copdMatrixDevices`) VÀ DỤNG CỤ HÍT TẠI VIỆT NAM

1. **`copdMatrixTherapy` (`src/modules/copd/matrices.ts` dòng 10–205)**:
   - **Điểm đạt xuất sắc**: Phân tách rõ 5 cột lâm sàng (`group_a`, `group_b`, `group_e_low_eos` [< 100], `group_e_mod_eos` [100–299], `group_e_high_eos` [≥ 300]), loại bỏ hoàn toàn ICS+LABA khỏi lựa chọn ưu tiên ở COPD thuần túy, đặt đúng `initiate: 'not_rec'` cho toàn bộ 4 thuốc leo thang theo dõi (`roflumilast`, `azithromycin`, `dupilumab`, `mepolizumab`) và `not_rec/caution` cho `theophylline`.
   - **Điểm cần tinh chỉnh (`COPD-R2-210`)**: Hàng `fluticasone_furoate_umeclidinium_vilanterol` ở cột `group_a` và `group_b` hiện để `continue: 'not_rec'`. Trên lâm sàng, một bệnh nhân từng thuộc Nhóm E có BCAT ≥ 300 được khởi trị đúng SITT năm trước, nhờ đáp ứng tốt nên 12 tháng qua đạt **0 đợt cấp** (tức phân loại hiện tại nếu nhìn theo số đợt cấp năm qua sẽ rơi vào cột 0 đợt cấp). Theo GOLD 2026 tr. 77, **không được tự ý rút ICS** ở bệnh nhân đang đáp ứng tốt trên bộ ba trừ khi ban đầu khởi trị ICS sai chỉ định hoặc bị viêm phổi tái diễn → đổi `continue` sang `'caution'` kèm ghi chú hai nhánh sẽ an toàn hơn.
2. **`copdMatrixDevices` (`src/modules/copd/matrices.ts` dòng 210–353)**:
   - **Điểm đạt xuất sắc**: Đã khắc phục triệt để lỗi kiến trúc Vòng 1 (`COPD-R2-10`). Ma trận nay đối chiếu trực quan 4 công nghệ bình hít (`SMI Respimat`, `pMDI ± Spacer`, `DPI`, `Nebulizer`) trên 5 chế phẩm thực tế tại Việt Nam, nêu rõ yêu cầu PIFR (≥ 30–60 L/phút cho DPI vs không phụ thuộc PIFR ở SMI/khí dung), nguy cơ bấm-hít lệch pha ở pMDI và chỉ định buồng đệm.
   - **Điểm cần tinh chỉnh (`COPD-R2-210`)**: Bổ sung thêm `umeclidinium_vilanterol` (**Anoro Ellipta** — phối hợp đôi DPI 1 lần/ngày có trong Phụ lục 1 BYT 2131/2026 tr. 68) để đủ bộ đại diện LABA+LAMA dạng DPI kháng lực trung bình bên cạnh Breezhaler kháng lực thấp (`Ultibro`), và sửa nhãn nút cứng `"📊 Xem ma trận thận"` tại `src/ui/PlanRow.tsx` dòng 175.

---

## 5. PHÂN TÍCH CHI TIẾT 11 PHÁT HIỆN VÒNG 2 (`COPD-R2-201` → `COPD-R2-211`)

---

### [COPD-R2-201] (CRITICAL) — Hồi quy nghiêm trọng trong đợt cấp COPD nội viện: `mergeRecommendations()` biến `START` thành `CONTINUE` làm thiếu liều Corticoid gấp 8 lần và mất đơn vị liều Salbutamol khi thuốc đã có trong `currentMeds`

- **Loại mục**: `rule`
- **Định danh**: `copd.inpatient.short_acting_bronchodilators`, `copd.inpatient.systemic_steroid` (`src/modules/copd/rules.ts` dòng 2040–2056, 2137–2152; tương tác với `src/engine/merge.ts` dòng 509–520)
- **Phân tích cơ chế & nguy cơ lâm sàng**:
  - Để khắc phục `COPD-R2-04` và `COPD-R2-07` ở Vòng 1, hai quy tắc xử trí đợt cấp nội viện đã được gắn `drugId: 'salbutamol'` và `drugId: 'prednisolone'` với `action: 'START'`.
  - Tuy nhiên trong kiến trúc engine GDMT-VN (`src/engine/merge.ts` dòng 509–520), mọi khuyến cáo mang `action: 'START'` nếu có `drugId` trùng với một thuốc bất kỳ đang nằm trong `ctx.normalized.currentMeds` sẽ bị bộ trộn tự động **chuyển thành `action: 'CONTINUE'`**, xóa toàn bộ chuỗi liều cấp cứu của quy tắc và thay bằng `String(curMed.dose)` (không kèm cả `curMed.unit`!):
    ```ts
    // src/engine/merge.ts dòng 509-520
    if (rec.action === 'START' && rec.drugId) {
      const curMed = currentByDrug.get(rec.drugId);
      if (curMed) {
        return {
          ...rec,
          action: 'CONTINUE',
          title: `TIẾP TỤC DUY TRÌ ${rec.title} — không khởi trị lại từ đầu`,
          dose: curMed.dose !== undefined ? String(curMed.dose) : rec.dose,
        };
      }
    }
    ```
  - Trên thực tế lâm sàng, **đa số bệnh nhân COPD nhập viện vì đợt cấp đều đang có sẵn ống xịt cắt cơn Salbutamol (Ventolin pMDI 100 mcg PRN) tại nhà**, và một tỷ lệ không nhỏ bệnh nhân COPD nặng hoặc có bệnh đồng mắc khớp/thượng thận đang dùng **Prednisolone liều thấp duy trì (ví dụ 5 mg/ngày)**.
  - **Hệ quả trực tiếp khi nhập viện đợt cấp**:
    1. **Thiếu liều Corticoid toàn thân gấp 8 lần**: Thay vì nhận liều điều trị đợt cấp chuẩn **Prednisolone 40 mg/ngày × 5 ngày**, y lệnh biến thành:
       `TIẾP TỤC DUY TRÌ Prednisolone / Methylprednisolone (ngắn ngày) [Liều hiện tại: 5] — không khởi trị lại từ đầu` với `dose: "5"`!
    2. **Mất đơn vị liều nguy hiểm trên Salbutamol & mất hướng dẫn khí dung cấp cứu**: Liều Ventolin xịt tại nhà `100 mcg` bị cắt mất chữ `mcg`, biến thành `dose: "100"` trần trụi (`[Liều hiện tại: 100]`) trong bối cảnh bệnh phòng nội viện vốn dùng đơn vị **mg** cho nang khí dung Salbutamol (2.5–5 mg/lần) hoặc ống tiêm truyền, gây nguy cơ nhầm lẫn đơn vị mcg/mg nghiêm trọng và làm mất phác đồ phun khí dung mỗi 4–6 giờ.
- **Bằng chứng kiểm chứng động & y văn**:
  - Chạy `evaluate()` trong `docs/reviews/copd/scratch/round2_r2_audit.test.ts` (**Case A**: bệnh nhân nhập viện đợt cấp COPD nặng `acuteExacerbation: true`, `restingSpo2: 88%`, `purulentSputum: true`, `currentMeds: [Spiolto, Prednisolone 5 mg, Salbutamol 100 mcg]`):
    - Xuất: `REC [CONTINUE] rec_copd_inpatient_saba_sama | drug=salbutamol | dose="100" | title="TIẾP TỤC DUY TRÌ Salbutamol ± Ipratropium (SABA ± SAMA) [Liều hiện tại: 100] — không khởi trị lại từ đầu"`
    - Xuất: `REC [CONTINUE] rec_copd_inpatient_steroid | drug=prednisolone | dose="5" | title="TIẾP TỤC DUY TRÌ Prednisolone / Methylprednisolone (ngắn ngày) [Liều hiện tại: 5] — không khởi trị lại từ đầu"`
  - `GOLD_2026_Report.pdf` tr. 114: *"Short-acting inhaled beta2-agonists, with or without short-acting anticholinergics, are recommended as the initial bronchodilators to treat an acute exacerbation"* & *"A dose of 40 mg prednisone-equivalent per day for 5 days is recommended."*
  - `BYT_2131_COPD_2026.pdf` Phụ lục 1 tr. 68–69: Salbutamol nang khí dung 2,5–5 mg × 4 lần/ngày; Prednisolon 30–40 mg/ngày.
- **Hướng khắc phục**:
  - Trong `src/modules/copd/rules.ts` tại `copd.inpatient.short_acting_bronchodilators` (dòng 2042) và `copd.inpatient.systemic_steroid` (dòng 2139): kiểm tra nếu thuốc đã hiện diện trong `ctx.normalized.currentMeds` thì phát sinh `action: 'UPTITRATE'` thay vì `'START'`:
    - `action: hasCurrentMed(ctx, 'salbutamol') ? 'UPTITRATE' : 'START'`
    - `action: hasCurrentMed(ctx, 'prednisolone') ? 'UPTITRATE' : 'START'`
    (`merge.ts` giữ nguyên 100% `dose`, `title`, `rationale` của `UPTITRATE` đồng thời vẫn chạy đầy đủ kiểm tra tương tác thuốc và cảnh báo an toàn trên `drugId`).
  - Khuyến nghị bổ trợ tại `src/engine/merge.ts` dòng 516: nối kèm `curMed.unit` khi định dạng chuỗi liều hiện tại (`curMed.unit ? `${curMed.dose} ${curMed.unit}` : String(curMed.dose)`).

---

### [COPD-R2-202] (MAJOR) — Ba sai sót dược lý & bằng chứng liên hoàn đối với tương tác thuốc của Roflumilast (cắt xén quote ngược nghĩa QA-7, mâu thuẫn nội tại với Theophylline, và bỏ sót tương tác chống chỉ định CYP3A4 theo BYT 2131/2026 & FDA)

- **Loại mục**: `citation` (liên đới `interaction` & `rule`)
- **Định danh**: `fda.roflumilast.concomitant_theophylline` (`kb/citations/interactions.json` dòng 429), `ix.roflumilast_theophylline` (`kb/interactions/diabetes_respiratory.json` dòng 209), `copd.followup.roflumilast_indication` (`src/modules/copd/rules.ts` dòng 287–317, 1492–1558)
- **Phân tích dược lâm sàng**:
  1. **Vi phạm QA-7 nghiêm trọng do cắt bỏ từ phủ định đầu câu**:
     - Trong `kb/citations/interactions.json` (dòng 429), trích dẫn `fda.roflumilast.concomitant_theophylline` đang ghi:
       `"quote": "500 mcg oral roflumilast was administered with inhaled salbutamol, formoterol, budesonide and oral montelukast, digoxin, theophylline, warfarin, sildenafil, midazolam, or antacids."`
     - Kiểm tra trực tiếp trang 12 của `FDA_label_roflumilast.pdf` (Section 12.3 Pharmacokinetics – Drug Interactions), **câu nguyên văn đầy đủ** là:
       > *"No significant drug interactions were observed when 500 mcg oral roflumilast was administered with inhaled salbutamol, formoterol, budesonide and oral montelukast, digoxin, theophylline, warfarin, sildenafil, midazolam, or antacids."*
     - Việc cắt mất 7 chữ đầu `"No significant drug interactions were observed when "` đã biến một câu khẳng định **KHÔNG có tương tác dược động học đáng kể** thành bằng chứng giả cho quy tắc `severity: 'contraindicated'`! Thực tế, lý do không phối hợp Roflumilast + Theophylline theo nhãn FDA nằm ở trang 16 Section 14.1 (*"The use of long-acting beta agonists, long-acting anti-muscarinics, and theophylline were prohibited"* trong thử nghiệm lâm sàng) và EMA Daxas SmPC (thiếu dữ liệu lâm sàng hỗ trợ duy trì phối hợp → **không khuyến cáo / mức `major`**, không phải chống chỉ định dược động học ở trang 12).
  2. **Mâu thuẫn nội tại ngay trong `evaluate()`**:
     - Hàm `getRoflumilastContraReasons(ctx)` (`src/modules/copd/rules.ts` dòng 287–317) không kiểm tra sự hiện diện của `theophylline` trong `currentMeds`. Kết quả khi chạy **Case C1** (bệnh nhân COPD FEV₁ 35%, viêm phế quản mạn, đang uống Theophylline): hệ thống vừa xuất khuyến cáo `REC [CONSIDER] rec_copd_roflumilast` (*"Cân nhắc bổ sung Roflumilast uống"*) vừa đồng thời phát báo động đỏ `ALERT [critical] ix.roflumilast_theophylline` (*"Chống chỉ định phối hợp Roflumilast + Theophylline"*).
  3. **Bỏ sót tương tác chống chỉ định thực sự của Roflumilast với thuốc cảm ứng mạnh CYP3A4 và chất ức chế CYP3A4 / kép CYP3A4+CYP1A2**:
     - Theo **Bộ Y tế QĐ 2131/2026 Phụ lục 11, STT 35 (trang 121)**: Phối hợp **Roflumilast + Các thuốc cảm ứng mạnh CYP3A4 (`carbamazepine`, `phenytoin`, `enzalutamide`, `phenobarbital`, `rifampicin`/`rifampin`)** làm giảm mạnh nồng độ roflumilast huyết thanh, mất hiệu quả điều trị và được Bộ Y tế xếp loại chính thức là **"Chống chỉ định phối hợp"** (nhãn FDA trang 4 Section 5.4 & trang 6 Section 7.1 ghi giảm ~80% hoạt tính ức chế PDE4 toàn phần khi dùng kèm rifampicin).
     - Theo **Nhãn FDA Daliresp trang 6 Section 7.2**: Dùng kèm thuốc ức chế CYP3A4 hoặc ức chế kép CYP3A4 + CYP1A2 (`erythromycin`, `ketoconazole`, `fluvoxamine`, `cimetidine`) làm tăng phơi nhiễm toàn thân của roflumilast và N-oxide, tăng độc tính tiêu hóa/sụt cân/tâm thần.
     - Kiểm chứng động **Case C2** (`currentMeds: [Roflumilast 500 mcg, Rifampin 600 mg]`): hệ thống xuất **0 cảnh báo tương tác**!
- **Hướng khắc phục**:
  1. Thay thế trích dẫn `fda.roflumilast.concomitant_theophylline` bằng câu nguyên văn trang 16 Section 14.1 của `FDA_label_roflumilast.pdf` (điều chỉnh `ix.roflumilast_theophylline` về `severity: 'major'` — không khuyến cáo phối hợp do thiếu dữ liệu lâm sàng và cộng gồn độc tính tiêu hóa/thần kinh) và kiểm tra `hasCurrentMed(ctx, 'theophylline')` trong `getRoflumilastContraReasons(ctx)`.
  2. Bổ sung quy tắc tương tác `ix.roflumilast_cyp3a4_inducers` (`rifampin`, `carbamazepine`, `phenytoin`, `phenobarbital` — trích dẫn `BYT_2131_COPD_2026.pdf` tr. 121 STT 35 & `FDA_label_roflumilast.pdf` tr. 6 Section 7.1) và `ix.roflumilast_cyp_inhibitors` (`erythromycin`, `clarithromycin`, `ketoconazole`, `itraconazole`, `fluvoxamine`, `cimetidine` — FDA tr. 6 Section 7.2), đồng thời kiểm tra thuốc cảm ứng mạnh CYP3A4 trong `getRoflumilastContraReasons(ctx)`.

---

### [COPD-R2-203] (MAJOR) — Cả 4 quy tắc leo thang ngoại trú (`CONSIDER`: Roflumilast, Azithromycin, Dupilumab, Mepolizumab) không kiểm tra `currentMeds`: gợi ý lùi liều Roflumilast về liều dò không hiệu lực 250 mcg và gợi ý chồng 2 thuốc sinh học

- **Loại mục**: `rule`
- **Định danh**: `copd.followup.roflumilast_indication`, `copd.followup.azithromycin_prophylaxis`, `copd.followup.dupilumab_indication`, `copd.followup.mepolizumab_indication` (`src/modules/copd/rules.ts` dòng 1492–1790)
- **Phân tích dược lâm sàng**:
  - Do `mergeRecommendations()` chỉ tự động biến đổi `START -> CONTINUE` mà không can thiệp vào `CONSIDER`, cả 4 quy tắc leo thang ngoại trú hiện không kiểm tra `ctx.normalized.currentMeds`:
    1. **Roflumilast**: Khi bệnh nhân đã đang uống liều điều trị duy trì `roflumilast 500 mcg/ngày` trong `currentMeds` (**Case C2**), hệ thống vẫn phát khuyến cáo `CONSIDER: Cân nhắc bổ sung Roflumilast uống` kèm chuỗi liều khởi đầu **`250 mcg x 1 lần/ngày trong 4 tuần`**. Nhãn FDA Daliresp (trang 3 Section 2) cảnh báo rõ: *"DALIRESP 250 mcg is a starting dose, for the first 4 weeks of treatment only and is not the effective (therapeutic) dose."* Việc hiển thị liều 250 mcg cho bệnh nhân đang dùng ổn định 500 mcg gây nhầm lẫn giảm nửa liều điều trị.
    2. **Azithromycin / Dupilumab / Mepolizumab**: Bệnh nhân đang dùng sẵn chính thuốc đó trong `currentMeds` vẫn nhận thẻ *"Cân nhắc bổ sung..."* như chưa từng dùng.
    3. **Nguy cơ phối hợp chồng hai kháng thể đơn dòng (Dual Biologics)**: Nếu bệnh nhân đã đang tiêm Dupilumab (hoặc Mepolizumab, hoặc một sinh học hô hấp đồng mắc hen như Benralizumab / Omalizumab / Tezepelumab), hệ thống vẫn gợi ý `CONSIDER` thêm kháng thể đơn dòng thứ hai. Ngoài ra, ở bệnh nhân có BCAT ≥ 300 /µL + viêm phế quản mạn chưa dùng sinh học (**Case F**), cả hai thẻ `CONSIDER Dupilumab` và `CONSIDER Mepolizumab` cùng xuất hiện song song nhưng chưa có câu cảnh báo rõ: **"Chỉ lựa chọn MỘT trong hai thuốc sinh học (Dupilumab HOẶC Mepolizumab), không phối hợp đồng thời hai kháng thể đơn dòng."**
- **Hướng khắc phục**:
  1. Tại `when()` của `roflumilast_indication` và `azithromycin_prophylaxis`: chặn phát sinh lại `CONSIDER` khởi trị nếu thuốc đã có trong `ctx.normalized.currentMeds` (hoặc sinh `CONTINUE` ở liều đích `target` `500 mcg x 1 lần/ngày` cho Roflumilast nếu không có chống chỉ định).
  2. Tại `dupilumab_indication` và `mepolizumab_indication`: chặn gợi ý sinh học mới nếu `currentMeds` đã chứa bất kỳ kháng thể đơn dòng hô hấp nào (`dupilumab`, `mepolizumab`, `benralizumab`, `omalizumab`, `tezepelumab`), và bổ sung câu lưu ý chọn 1 trong 2 vào `rationale` / `warnings` của cả hai thẻ.

---

### [COPD-R2-204] (MAJOR) — Lỗ hổng Gate an toàn Roflumilast ở bệnh nhân COPD suy kiệt / nhẹ cân: bỏ qua chỉ số `ctx.derived.bmi < 18.5` và đọc các trường `underweight`, `childPugh` không tồn tại trong `copdInputs`

- **Loại mục**: `rule`
- **Định danh**: `copd.safety.roflumilast_contraindicated`, `copd.followup.roflumilast_indication` (`src/modules/copd/rules.ts` dòng 287–317), `copdInputs` (`src/modules/copd/inputs.ts` dòng 113–170)
- **Phân tích dược lâm sàng**:
  - `GOLD_2026_Report.pdf` (trang 162) quy định rõ: *"In controlled studies an average unexplained weight loss of 2 kg has been seen and weight monitoring during treatment is advised, in addition to **avoiding roflumilast treatment in underweight patients**."*
  - Trong `getRoflumilastContraReasons(ctx)` (`src/modules/copd/rules.ts` dòng 302):
    ```ts
    if (Boolean(ci.unexplainedWeightLoss) || Boolean(ci.underweight)) { ... }
    ```
    - Trường `ci.underweight` **hoàn toàn không tồn tại** trong `copdInputs` (`src/modules/copd/inputs.ts`).
    - Hàm **không hề đọc `ctx.derived.bmi`** dù engine đã tự động tính sẵn BMI từ cân nặng và chiều cao chuẩn của bệnh nhân!
  - Kiểm chứng động **Case B** (bệnh nhân COPD suy kiệt nặng: cân nặng `38 kg`, chiều cao `168 cm` → **`BMI = 13.5 kg/m²`**, FEV₁ 35%, viêm phế quản mạn, bác sĩ không tích tay ô phụ `unexplainedWeightLoss`): engine vẫn phát khuyến cáo `REC [CONSIDER] rec_copd_roflumilast`!
  - Tương tự, dòng 292 của `rules.ts` đọc `ci.childPugh === 'B' || ci.childPugh === 'C'`, nhưng trường `childPugh` cũng chưa được khai báo trong `copdInputs`.
- **Hướng khắc phục**:
  1. Bổ sung ngưỡng `copd.roflumilast_underweight_bmi` (`18.5` kg/m²) vào `kb/thresholds/copd.json` và kiểm tra tự động `ctx.derived.bmi !== undefined && ctx.derived.bmi < thFor('bmi', 'copd.roflumilast_underweight_bmi')` trong `getRoflumilastContraReasons(ctx)`.
  2. Bổ sung trường chọn phân độ suy gan Child-Pugh (hoặc làm rõ nhãn `conditions.liverDisease` bao hàm suy gan trung bình-nặng Child-Pugh B/C) để phân biệt chính xác Child-Pugh A (thận trọng) với Child-Pugh B/C (chống chỉ định tuyệt đối theo FDA Section 4).

---

### [COPD-R2-205] (MAJOR) — Khiếm khuyết dữ liệu dược động học thận trên 18/19 tệp `DrugEntry` COPD: thiếu hoàn toàn dải `eGFR < 15` và phân loại sai mức `rec` ở suy thận nặng (`eGFR < 30`) cho cả 4 thuốc chứa Glycopyrronium & Spiolto

- **Loại mục**: `drug`
- **Định danh**: `glycopyrronium`, `glycopyrronium_indacaterol`, `budesonide_glycopyrronium_formoterol`, `beclometasone_glycopyrronium_formoterol`, `tiotropium_olodaterol`, `azithromycin` (và tổng cộng 18/19 tệp `DrugEntry` COPD trừ `tiotropium`)
- **Phân tích dược động học & đối chiếu nhãn thuốc gốc**:
  1. **18/19 thuốc COPD trả về `undefined` khi `eGFR < 15 mL/min/1.73m²`**:
     - Trừ `tiotropium.json` (có 2 dải `0–50` và `50+`), toàn bộ 18 tệp thuốc COPD còn lại chỉ khai báo duy nhất một phần tử `{ "eGFRFrom": 15, ... }` mà bỏ trống dải `0 <= eGFR < 15`. Kiểm chứng động `renalBand(drugId, 12)` trả về `undefined` trên cả 18 thuốc ở bệnh nhân suy thận giai đoạn cuối (CKD G5 / lọc máu).
  2. **Sai lệch phân loại an toàn thận (`rec` thay vì `caution`) tại `eGFR < 30 mL/min/1.73m²` ở nhóm LAMA thải trừ qua thận**:
     - Glycopyrronium và Tiotropium là các hợp chất amoni bậc bốn thải trừ chủ yếu qua lọc cầu thận và bài tiết tích cực ở ống thận.
     - Đối chiếu trực tiếp nhãn thuốc chính thức trong `Medical_Library_2026`:
       - **`FDA_label_budesonide_glycopyrronium_formoterol.pdf` (Breztri) tr. 21 Section 8.7**: *"In patients with severe renal impairment (creatinine clearance of ≤30 mL/min/1.73 m2) or end-stage renal disease requiring dialysis, BREZTRI AEROSPHERE should only be used if the expected benefit outweighs the potential risk."*
       - **`Ultibro_Breezhaler_SmPC.pdf` (EMA) tr. 3–4 Section 4.2 & 4.4**: *"Systemic exposure (AUC last) to glycopyrronium was on average increased... up to 2.2-fold in subjects with severe renal impairment and ESRD. In patients with severe renal impairment (estimated glomerular filtration rate below 30 ml/min/1.73 m2), including those with end-stage renal disease requiring dialysis, Ultibro Breezhaler should be used only if the expected benefit outweighs the potential risk."*
       - **`Trimbow_SmPC.pdf` (EMA) tr. 3 Section 4.2**: *"Use in patients with severe (GFR <30 mL/min/1.73 m2) renal impairment or end-stage renal (GFR <15 mL/min/1.73 m2) disease requiring dialysis, especially if associated with significant body weight reduction, should be considered only if the expected benefit outweighs the potential risk."*
     - Thế nhưng hiện tại tại `eGFR = 25 mL/min/1.73m²`, cả 4 tệp chứa Glycopyrronium (`glycopyrronium`, `glycopyrronium_indacaterol`, `budesonide_glycopyrronium_formoterol`, `beclometasone_glycopyrronium_formoterol`) và cả `tiotropium_olodaterol` (Spiolto — mâu thuẫn trực tiếp với chính `tiotropium.json`!) đều trả về `initiate: 'rec', continue: 'rec'` (*"Không cần chỉnh liều"*).
     - Với `azithromycin.json`: Nhãn FDA (`FDA_label_azithromycin.pdf` tr. 15) ghi nhận khi GFR < 10 mL/min, Cmax tăng 61% và AUC tăng 35% → cần đặt `caution` ở dải `eGFR < 15` (đặc biệt khi dùng kéo dài 1 năm ở người cao tuổi có nguy cơ kéo dài QTc).
- **Hướng khắc phục**:
  1. Phủ kín dải `eGFRFrom: 0` đến vô cực cho toàn bộ 18 tệp `DrugEntry` COPD để `renalBand()` không bao giờ trả về `undefined`.
  2. Tách dải `eGFRFrom: 0, eGFRTo: 30` với `initiate: 'caution', continue: 'caution'` (kèm `note` theo dõi sát tác dụng kháng cholinergic toàn thân: bí tiểu, glôcôm góc đóng, khô miệng, nhịp nhanh và gắn trích dẫn từ nhãn FDA Breztri / EMA Ultibro / EMA Trimbow) cho cả 4 thuốc chứa Glycopyrronium và `tiotropium_olodaterol`.
  3. Đặt dải `eGFRFrom: 0, eGFRTo: 15` là `caution` cho `azithromycin.json` và `theophylline.json` (tích lũy 1,3-dimethyluric acid ở suy thận giai đoạn cuối).

---

### [COPD-R2-206] (MAJOR) — Vi phạm nguyên tắc Fail-Closed (QA-1 & QA-9) khi chưa có phế dung kế (`fev1FvcRatio === undefined`): tự động phát lệnh `STOP` ngừng ICS đơn trị và `START` Oxy dài hạn tại nhà trước khi xác nhận chẩn đoán COPD

- **Loại mục**: `rule`
- **Định danh**: `copd.safety.ics_monotherapy_stop` (dòng 519–520), `copd.outpatient.home_niv` (dòng 1860–1861), `copd.nonpharm.ltot_oxygen` (dòng 1952–1953) trong `src/modules/copd/rules.ts`
- **Phân tích cơ chế & nguy cơ lâm sàng**:
  - Trong khi toàn bộ các quy tắc khởi trị và leo thang thuốc duy trì COPD đều gọi `hasConfirmedStableCopd(ctx)` (bắt buộc `fev1Fvc !== undefined && fev1Fvc < 0.70`), thì 3 quy tắc trên lại viết điều kiện chặn ngược:
    ```ts
    const fev1Fvc = ctx.patient.labs?.fev1FvcRatio;
    if (fev1Fvc !== undefined && fev1Fvc >= thFor('fev1FvcRatio', 'copd.fev1_fvc_diagnostic')) return false;
    ```
  - Khi người dùng **chưa nhập tỷ lệ FEV₁/FVC** (`fev1Fvc === undefined`), biểu thức `fev1Fvc !== undefined && ...` trả về `false` và cho phép cả 3 quy tắc đi thẳng qua cổng!
  - **Hệ quả nguy hiểm trên lâm sàng (kiểm chứng động Case E: `fev1FvcRatio: undefined`, `restingSpo2: 86%`, `abgPaco2: 55`, `currentMeds: [{ drugId: 'budesonide' }]`)**:
    1. Hệ thống phát ngay `REC [STOP] rec_copd_stop_ics_monotherapy` (*"NGỪNG Corticosteroid dạng hít (ICS) đơn trị — Pulmicort"*) **NHƯNG** đồng thời chặn toàn bộ các quy tắc `START` thuốc giãn phế quản LAMA / LABA+LAMA / SITT (vì chưa có `fev1FvcRatio`), khiến một bệnh nhân khó thở chưa đo chức năng hô hấp (có thể thực chất là **hen phế quản** chưa tích ô tiền sử hen) bị cắt sạch thuốc kiểm soát đường thở mà không có bất kỳ thuốc thay thế nào!
    2. Hệ thống phát đồng thời `REC [START] rec_copd_ltot` (Oxy dài hạn tại nhà ≥ 15 giờ/ngày với đích SpO₂ đặc thù COPD 88–92%) và `REC [CONSIDER] rec_copd_home_niv` ngay bên cạnh dòng nhắc `missing_input_fev1FvcRatio` (*"Cần nhập Tỷ lệ FEV₁/FVC sau giãn phế quản để đánh giá"*).
- **Hướng khắc phục**:
  - Đổi điều kiện tại cả 3 vị trí (`rules.ts` dòng 520, 1861, 1953) thành `if (fev1Fvc === undefined || fev1Fvc >= thFor('fev1FvcRatio', 'copd.fev1_fvc_diagnostic')) return false;` (hoặc gọi trực tiếp `if (!hasConfirmedStableCopd(ctx)) return false;` ở LTOT và Home NIV) để đảm bảo fail-closed nhất quán tuyệt đối theo `QA-1` & `QA-9`.

---

### [COPD-R2-207] (MAJOR) — Vi phạm toàn vẹn bằng chứng QA-7 trên 38/38 trường `pregnancy` & `lactation` của 19 thuốc COPD, thiếu trích dẫn con số liều `100 mg` của Mepolizumab, và thiếu trích dẫn bí tiểu của nhóm LAMA

- **Loại mục**: `citation`
- **Định danh**: Trường `pregnancy` & `lactation` trên cả 19 tệp `DrugEntry` COPD; `kb/drugs/mepolizumab.json` (`start`/`max`); `narrow_angle_glaucoma_or_urinary_retention` trên 10 tệp LAMA
- **Phân tích chi tiết đối chiếu `QA-7` (*"Citation gắn cho một khẳng định phải thực sự chứa khẳng định đó"*)**:
  1. **38/38 trường `pregnancy` và `lactation` của 19 thuốc COPD gắn citation không chứa nội dung thai kỳ / cho con bú**:
     - Kiểm thử tự động trong `round2_r2_audit.test.ts` quét toàn bộ 19 tệp thuốc COPD cho thấy cả 19 tệp đều gắn lại các citation nói về phân nhóm A/B/E hoặc liều hít thường quy (ví dụ: `gold.copd.2026.initial_group_a` *"Patients in Group A should be offered bronchodilator treatment..."*, `byt.copd.2026.tiotropium_dose`, `byt.copd.2026.triple_therapy_indication`, `fda.copd.dupilumab_dose`, `fda.copd.roflumilast_dose`) cho mục `pregnancy` và `lactation`, trong khi nội dung nguyên văn của các quote đó có **0 từ** nhắc đến thai kỳ, bào thai hay sữa mẹ!
     - Đáng chú ý, `Medical_Library_2026` hiện **đã có sẵn** nhãn gốc chứa đầy đủ mục 8.1/8.2 (FDA) hoặc 4.6 (EMA SmPC) cho nhiều thuốc trong số này: `FDA_label_roflumilast.pdf` (tr. 7–8), `FDA_label_dupilumab.pdf`, `FDA_label_azithromycin.pdf`, `FDA_label_aclidinium.pdf` (tr. 6–7), `FDA_label_budesonide_glycopyrronium_formoterol.pdf` (tr. 19–20), `Ultibro_Breezhaler_SmPC.pdf` (tr. 6), `Trimbow_SmPC.pdf` (tr. 8).
  2. **Con số liều `100 mg mỗi 4 tuần` trong `kb/drugs/mepolizumab.json` chưa có trích dẫn chứa số liều (Orphan Number)**:
     - `mepolizumab.json` khai báo `amount: 100, unit: "mg", frequency: "mỗi 4 tuần"` và chỉ gắn duy nhất `gold.copd.2026.biologics_dupilumab_mepolizumab` (*"...consider adding dupilumab (if chronic bronchitis) or mepolizumab (with and without chronic bronchitis)."*), đoạn trích dẫn này không hề chứa con số `100 mg` hay `4 weeks`.
  3. **Cảnh báo bí tiểu / tăng sản tuyến tiền liệt của 10 thuốc LAMA gắn citation chỉ nói về glôcôm mặt nạ**:
     - Cả 10 tệp LAMA đều ghi lý do `"Thận trọng ở bệnh nhân glôcôm góc đóng, tăng sản lành tính tuyến tiền liệt hoặc bí tiểu..."` nhưng chỉ gắn `gold.copd.2026.lama_glaucoma_caution` (*"Use of solutions with a facemask can precipitate acute glaucoma"*). Trong khi đó `FDA_label_budesonide_glycopyrronium_formoterol.pdf` (tr. 12 Section 5.15 *Worsening of Narrow-Angle Glaucoma* & Section 5.16 *Worsening of Urinary Retention*), `FDA_label_aclidinium.pdf` (tr. 3 Section 5.3–5.4) và `Ultibro_Breezhaler_SmPC.pdf` (tr. 4 Section 4.4) đều có nguyên văn đầy đủ cả hai cảnh báo này.
- **Hướng khắc phục**:
  1. Trích xuất citation nguyên văn từ mục Pregnancy (8.1 / 4.6) và Lactation (8.2 / 4.6) của các nhãn thuốc FDA/EMA sẵn có trong `Medical_Library_2026`; với các hoạt chất đơn trị chưa có nhãn riêng trong kho nguồn, bổ sung nhãn FDA/EMA tương ứng hoặc để `status: 'no_data', citationIds: []` thay vì gắn sai citation phân nhóm GOLD.
  2. Bổ sung nguồn nhãn FDA Nucala (mepolizumab 100 mg SC Q4W cho COPD) hoặc trích dẫn thử nghiệm MATINEE chứa rõ liều `100 mg every 4 weeks` cho `mepolizumab.json`.
  3. Bổ sung citation từ nhãn FDA/EMA cho cảnh báo bí tiểu / tắc nghẽn cổ bàng quang của nhóm LAMA.

---

### [COPD-R2-208] (MINOR) — Chưa đồng bộ động `qtRisk` của KB thuốc khi chặn Azithromycin dự phòng (bỏ lọt Propafenone) và thiếu `InteractionRule` cho phối hợp chống chỉ định Salmeterol + ức chế mạnh CYP3A4 (BYT 2131/2026 STT 34)

- **Loại mục**: `rule`
- **Định danh**: `QT_PROLONGING_DRUG_IDS` (`src/modules/copd/rules.ts` dòng 73–92, 325), `kb/drugs/salmeterol.json`, `kb/interactions/diabetes_respiratory.json`
- **Phân tích & bằng chứng**:
  1. Trong `src/modules/copd/rules.ts`, hàm `getAzithromycinContraReasons()` chỉ đối chiếu `currentMeds` với tập hằng số gán cứng `QT_PROLONGING_DRUG_IDS` (17 thuốc) mà không tra cứu trường `qtRisk` ngay trong KB thuốc. Khi chạy **Case D** (`currentMeds: [Spiolto, Propafenone]` — trong đó `kb/drugs/propafenone.json` có `qtRisk: 'known'`): module COPD vẫn xuất `REC [CONSIDER] rec_copd_azithromycin_prophylaxis` trong khi tầng an toàn toàn cục đồng thời phát báo động đỏ `ALERT [critical] ix.qt_multi_drug_pool` (*"Cảnh báo Nguy cơ Xoắn đỉnh khi phối hợp ≥ 2 thuốc kéo dài khoảng QT: propafenone, azithromycin"*).
  2. Theo `BYT_2131_COPD_2026.pdf` trang 120 (Phụ lục 11, STT 34): **Salmeterol + Các thuốc ức chế mạnh CYP3A4 (`clarithromycin`, `erythromycin`, `itraconazole`, `ketoconazole`, `ritonavir`...)** làm tăng mạnh nồng độ salmeterol huyết thanh (AUC tăng tới 15 lần với ketoconazole), tăng nguy cơ kéo dài QT và loạn nhịp thất, được Bộ Y tế xếp loại **"Chống chỉ định phối hợp. Cân nhắc thay salmeterol bằng formoterol."** Hiện tại chạy **Case H** (`Salmeterol + Clarithromycin`) sinh **0 cảnh báo tương tác** trên engine.
- **Hướng khắc phục**:
  1. Trong `getAzithromycinContraReasons()`, bổ sung tra cứu động `drug(m.drugId).qtRisk === 'known' || drug(m.drugId).qtRisk === 'possible'` song song với `QT_PROLONGING_DRUG_IDS`.
  2. Bổ sung `InteractionRule` `ix.salmeterol_strong_cyp3a4` vào `kb/interactions/diabetes_respiratory.json` (bao phủ cả `salmeterol` và `fluticasone_salmeterol`, trích dẫn `BYT_2131_COPD_2026.pdf` tr. 120 STT 34).

---

### [COPD-R2-209] (MINOR) — Còn sót câu chữ cũ trong `azithromycin.json` và chuỗi ghi chú tình trạng lưu hành nằm bên trong mảng `vnBrands` của 5 tệp thuốc

- **Loại mục**: `drug`
- **Định danh**: `azithromycin`, `umeclidinium`, `vilanterol`, `aclidinium`, `olodaterol`, `roflumilast`, `beclometasone_glycopyrronium_formoterol`
- **Phân tích & bằng chứng**:
  1. Trong `kb/drugs/azithromycin.json` (dòng 20), `start.description` vẫn còn nguyên câu cũ từ trước khi sửa `COPD-R2-12`: *"Dự phòng đợt cấp COPD: 250 mg/ngày (hoặc 500 mg x 3 lần/tuần) **cho bệnh nhân đã ngừng hút thuốc** có đợt cấp tái phát"*. Khi kê cho bệnh nhân chưa từng hút thuốc (`never` smoker), thẻ hiển thị mâu thuẫn giữa tiêu đề (*"ở người hiện không hút thuốc"*) và dòng liều (*"cho bệnh nhân đã ngừng hút thuốc"*).
  2. Trong 5 tệp `umeclidinium.json`, `vilanterol.json`, `aclidinium.json`, `olodaterol.json` và `roflumilast.json`, mảng `vnBrands` đang chứa các câu giải thích dài thay vì tên biệt dược thương mại (ví dụ: `"Chỉ lưu hành dạng phối hợp Anoro/Trelegy"`, `"Eklira Genuair (chưa lưu hành tại VN)"`). Giao diện `src/ui/MatrixView.tsx` (dòng 248) render trực tiếp `• Biệt dược: Chỉ lưu hành dạng phối hợp Anoro/Trelegy` và bộ lọc tìm kiếm tên thuốc khớp nhầm các từ phổ thông.
  3. Trong `beclometasone_glycopyrronium_formoterol.json`, `vnBrands` đang để `["Trimbow"]` không kèm lưu ý, trong khi Bảng 0.1 của `BYT_2131_COPD_2026.pdf` (trang 20) mới chỉ liệt kê 2 phối hợp ba thuốc 1 bình hít tại Việt Nam là Budesonide/Glycopyrronium/Formoterol (**Breztri**) và Fluticasone furoate/Umeclidinium/Vilanterol (**Trelegy**).
- **Hướng khắc phục**:
  1. Đổi `azithromycin.json` `start.description` thành *"...cho bệnh nhân hiện không hút thuốc có đợt cấp tái phát"*.
  2. Đặt `vnBrands: []` cho các đơn chất không lưu hành độc lập tại VN (`umeclidinium`, `vilanterol`, `aclidinium`) và chuyển ghi chú tình trạng phân phối sang trường `forms` hoặc mô tả liều; bổ sung chú thích tham chiếu EMA / lưu hành hạn chế cho Trimbow.

---

### [COPD-R2-210] (MINOR) — Ba điểm tinh chỉnh trên `copdMatrixTherapy` (tiếp tục bộ ba ICS ở Nhóm A/B), `copdMatrixDevices` (thiếu Anoro Ellipta) và nhãn nút cứng `"📊 Xem ma trận thận"` trên `PlanRow.tsx`

- **Loại mục**: `matrix`
- **Định danh**: `copdMatrixTherapy`, `copdMatrixDevices` (`src/modules/copd/matrices.ts`), `src/ui/PlanRow.tsx` (dòng 175)
- **Phân tích & bằng chứng**:
  1. Trong `copdMatrixTherapy` (`matrices.ts` dòng 97–108), hàng `fluticasone_furoate_umeclidinium_vilanterol` ở `group_a` và `group_b` đặt `continue: 'not_rec'`. Theo `GOLD_2026_Report.pdf` tr. 77 (*"Patients treated with LABA+LAMA+ICS should not have the ICS component withdrawn unless the ICS was started inappropriately, there has been no response to ICS or they experience significant side-effects or severe or recurrent pneumonia"*), bệnh nhân đang dùng ổn định bộ ba (nên đạt 0 đợt cấp trong năm qua) cần được đánh giá thận trọng (`continue: 'caution'`) chứ không mặc định rút ICS (`not_rec`).
  2. Trong `copdMatrixDevices`, đại diện phối hợp đôi LABA+LAMA dạng bình hít bột khô Ellipta phổ biến tại Việt Nam là `umeclidinium_vilanterol` (**Anoro Ellipta**, Phụ lục 1 BYT 2131/2026 tr. 68) chưa có mặt trong bảng.
  3. Tại `src/ui/PlanRow.tsx` dòng 175, nút bấm mở ma trận đang gán cứng chuỗi `"📊 Xem ma trận thận"`, gây khó hiểu khi bác sĩ đang xem khuyến cáo thuốc hít COPD (bấm vào thực tế mở ma trận phân nhóm A/B/E & BCAT).
- **Hướng khắc phục**:
  1. Đổi `continue` của hàng bộ ba ở cột `group_a` và `group_b` trong `copdMatrixTherapy` từ `'not_rec'` sang `'caution'` kèm ghi chú quy tắc rút ICS của GOLD 2026 tr. 77.
  2. Bổ sung hàng `umeclidinium_vilanterol` (Anoro Ellipta) vào `copdMatrixDevices`.
  3. Đổi nhãn nút tại `PlanRow.tsx` dòng 175 thành `"📊 Xem ma trận thuốc / an toàn"`.

---

### [COPD-R2-211] (SUGGESTION) — Chuẩn hóa hiển thị `amount`/`unit` của 4 thuốc phối hợp cố định (Spiolto, Anoro, Ultibro, Trelegy) và xuất dòng nhắc thận trọng kháng cholinergic trên `warnings`

- **Loại mục**: `drug`
- **Định danh**: `tiotropium_olodaterol`, `umeclidinium_vilanterol`, `glycopyrronium_indacaterol`, `fluticasone_furoate_umeclidinium_vilanterol`; cảnh báo `warnings` của các quy tắc kê LAMA
- **Phân tích & kiến nghị**:
  1. Sau khi sửa Breztri và Trimbow sang `2 nhát x 2 lần/ngày`, hiện còn 4 tệp FDC dạng hít (`tiotropium_olodaterol`, `umeclidinium_vilanterol`, `glycopyrronium_indacaterol`, `fluticasone_furoate_umeclidinium_vilanterol`) vẫn để `start.amount` là hàm lượng của thành phần thứ nhất (`5 mcg`, `62.5 mcg`, `110 mcg`, `100 mcg`), khiến `fmtDose()` mở đầu bằng `"62.5 mcg x 1 lần/ngày (hít) - Hít 1 liều Anoro Ellipta (62.5/25 mcg)..."`. Dù phần mô tả phía sau đã ghi rõ đầy đủ cả 2–3 hoạt chất (không gây sai liều lâm sàng), việc chuẩn hóa sang số đơn vị phân liều (`Spiolto`: `2 nhát`, `Anoro`: `1 liều`, `Ultibro`: `1 viên nang`, `Trelegy`: `1 liều`) sẽ đồng nhất 100% trải nghiệm đọc y lệnh với Breztri và Trimbow.
  2. Cảnh báo `narrow_angle_glaucoma_or_urinary_retention` hiện đã có trong 10 tệp JSON của LAMA nhưng chưa xuất hiện thành dòng nhắc trực tiếp trong `Recommendation.warnings` trên thẻ y lệnh; nên thêm dòng nhắc ngắn *"Thận trọng ở người có glôcôm góc đóng hoặc tăng sản tuyến tiền liệt/bí tiểu; tránh để sương thuốc phun vào mắt"* khi khởi trị LAMA.

---

## 6. KẾT LUẬN & DANH MỤC CHẶN PHÁT HÀNH (RELEASE BLOCKERS)

### Phán quyết cuối cùng của Reviewer R2 (Vòng 2): **FAIL**
- **Tổng số phát hiện**: **11** (`1 Critical`, `6 Major`, `3 Minor`, `1 Suggestion`).
- **Đánh giá tổng thể**: Module `copd` đã có chất lượng kiến trúc, độ phủ lưu đồ GOLD 2026 / Bộ Y tế QĐ 2131/2026 và độ vững chắc kiểm thử bất biến (22.000 ca property tests) rất ấn tượng; 9/14 phát hiện Vòng 1 của R2 (bao gồm lỗi Critical thiếu 50% liều Breztri/Trimbow, tiêu chuẩn Anthonisen kháng sinh, Mepolizumab và ma trận thiết bị) đã được giải quyết triệt để. Tuy nhiên, module **chưa thể phê duyệt phát hành lâm sàng (`PASS`)** cho đến khi xử lý dứt điểm **7 hạng mục chặn phát hành (`1 Critical + 6 Major`)** sau đây:
  1. **`COPD-R2-201` (Critical)**: Đổi `START` → `UPTITRATE` khi `salbutamol` / `prednisolone` đã có trong `currentMeds` ở đợt cấp nội viện (và giữ đơn vị `curMed.unit` trong `merge.ts`) để chấm dứt ngay nguy cơ thiếu liều corticoid 8 lần và mất đơn vị liều khí dung.
  2. **`COPD-R2-202` (Major)**: Sửa trích dẫn bị cắt xén ngược nghĩa `fda.roflumilast.concomitant_theophylline` (QA-7), đồng bộ chặn `theophylline` và bổ sung tương tác chống chỉ định Roflumilast + thuốc cảm ứng mạnh CYP3A4 (BYT 2131 STT 35) & ức chế CYP3A4/CYP1A2.
  3. **`COPD-R2-203` (Major)**: Kiểm tra `currentMeds` ở cả 4 quy tắc `CONSIDER` ngoại trú để không gợi ý lùi Roflumilast 500 mcg về liều dò 250 mcg và không gợi ý chồng 2 kháng thể đơn dòng.
  4. **`COPD-R2-204` (Major)**: Tích hợp kiểm tra tự động `ctx.derived.bmi < 18.5` vào Gate chống chỉ định/thận trọng Roflumilast cho bệnh nhân COPD suy kiệt.
  5. **`COPD-R2-205` (Major)**: Phủ kín dải thận `eGFR < 15` cho toàn bộ 18/19 thuốc COPD và sửa phân loại `eGFR < 30` từ `rec` → `caution` cho cả 4 thuốc chứa Glycopyrronium + Spiolto theo đúng nhãn FDA/EMA.
  6. **`COPD-R2-206` (Major)**: Khóa fail-closed (`fev1Fvc === undefined`) tại `ics_monotherapy_stop`, `ltot_oxygen` và `home_niv`.
  7. **`COPD-R2-207` (Major)**: Thay thế các trích dẫn gắn nhầm trên trường `pregnancy`/`lactation`, bổ sung trích dẫn liều `100 mg Q4W` cho `mepolizumab.json` và trích dẫn bí tiểu cho nhóm LAMA theo chuẩn `QA-7`.
