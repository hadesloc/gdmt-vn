# Báo Cáo Phản Biện Độc Lập Vòng 2 – Phân hệ Rối Loạn Lipid Máu (`lipid`)

- **Vai trò phản biện:** **R2 – Dược sĩ Lâm sàng Tim mạch – Chuyển hóa (Clinical Pharmacist)**
- **Vòng duyệt:** **Vòng 2 (Round 2 – Độc lập hoàn toàn, không tham khảo báo cáo Vòng 2 của R1/R3)**
- **Ngày hoàn thành:** 27/10/2026
- **Phạm vi kiểm định:**
  - **Hồ sơ dược điển (`kb/drugs/`):** Toàn bộ 13 hoạt chất hạ lipid máu (`atorvastatin`, `rosuvastatin`, `pitavastatin`, `simvastatin`, `pravastatin`, `ezetimibe`, `evolocumab`, `alirocumab`, `inclisiran`, `bempedoic_acid`, `icosapent_ethyl`, `fenofibrate`, `omega3`) và các thuốc tương tác tim mạch – chuyển hóa đi kèm (`diltiazem`, `verapamil`, `amiodarone`, `amlodipine`, `warfarin`, `colchicine`, `ticagrelor`, `febuxostat`, `cyclosporine`, `clarithromycin`, `nirmatrelvir_ritonavir`).
  - **Cơ sở dữ liệu ngưỡng, tương tác & trích dẫn:** `kb/thresholds/lipid.json`, `kb/interactions/{statin,anticoagulant,gout_metabolic,cardiovascular}.json`, `kb/citations/{lipid,interactions}.json`.
  - **Mã nguồn thực thi lâm sàng:** Toàn bộ `src/modules/lipid/{helpers,inputs,rules.outpatient,rules.inpatient,matrix,pathway,presets,index}.ts` và tầng an toàn dùng chung `src/engine/safety/{gates,interactions,reviewMeds,duplicates}.ts`.
  - **Tài liệu đối chiếu nguyên bản (`Medical_Library_2026`):** Nhãn thuốc FDA Hoa Kỳ (Lipitor, Crestor, Zetia, Nexletol, Repatha, Praluent, Leqvio, Tricor, Livalo, Pravachol, Cardizem/Diltiazem, Cordarone, Coumadin, Colcrys), `2026 ACC/AHA/Multisociety Dyslipidemia Guideline` (JACC Vol. 87, No. 19, May 2026), `2019 ESC/EAS Guidelines for the management of dyslipidaemias` & `2025 ESC/EAS Focused Update`, `KDIGO 2024 Clinical Practice Guideline for CKD`.
  - **Kiểm chứng thực thi trực tiếp:** Chạy **41 kịch bản bệnh nhân dược động học – đối nghịch** trực tiếp qua hàm `evaluate()` bằng Vitest (`docs/reviews/lipid/scratch/r2_round2_audit*.test.ts`).

---

## Bảng Tổng Hợp Phát Hiện Vòng 2 (R2 – Dược Lâm Sàng)

| Mức độ (`severity`) | Số lượng | Mã phát hiện (`id`) | Ý nghĩa an toàn người bệnh |
| :--- | :---: | :--- | :--- |
| **Critical** | **5** | `LIPID-R2-R2-01` → `LIPID-R2-R2-05` | Nguy cơ gây hại trực tiếp trên lâm sàng nếu làm theo: quá liều gấp đôi trần FDA gây tiêu cơ vân cấp, "hố đen điều trị" làm mất hoàn toàn thuốc dự phòng thứ phát ở bệnh nhân ASCVD, bỏ sót tương tác xuất huyết nặng Fenofibrate + Warfarin, hoặc không ngừng thuốc ngoài statin khi đang hủy cơ / suy gan cấp. |
| **Major** | **3** | `LIPID-R2-R2-06` → `LIPID-R2-R2-08` | Chưa thực thi trần liều thận bắt buộc của FDA cho Pitavastatin/Pravastatin, thiếu tương tác thường gặp sau ACS/Gút (Rosuvastatin 40 mg + Ticagrelor/Febuxostat, Paxlovid/Cobicistat), và chỉ định cứng nhắc `[START]` Atorvastatin 40–80 mg mới trên bệnh nhân lọc máu chu kỳ. |
| **Minor** | **3** | `LIPID-R2-R2-09` → `LIPID-R2-R2-11` | Lỗi phân liều cấu trúc `target` của Icosapent ethyl (`4 g 1 lần/ngày` thay vì `2 g × 2 lần/ngày`), mượn ngưỡng `ezetimibe` cho liều thận `pravastatin` trong ma trận thận, và thiếu lưu ý dược động học người châu Á + nhầm citation ở nhánh nâng liều Rosuvastatin. |
| **Suggestion** | **1** | `LIPID-R2-R2-12` | Hoàn thiện câu chữ phân biệt rõ thai kỳ với thời kỳ cho con bú và lưu ý khoảng nghỉ 5 ngày sau Fenofibrate theo ACC/AHA 2026 Table 20. |
| **Tổng cộng** | **12** | | **Kết luận Vòng 2: FAIL** |

---

## Phần 1. Hậu Kiểm Khắc Phục 14 Phát Hiện Của R2 Tại Vòng 1 (`LIPID-R2-01` → `LIPID-R2-14`)

| Mã Vòng 1 | Mức độ V1 | Nội dung phát hiện ở Vòng 1 | Kết quả hậu kiểm tại Vòng 2 |
| :--- | :---: | :--- | :--- |
| `LIPID-R2-01` | Critical | Thiếu cổng an toàn thai kỳ cho Fenofibrate và các thuốc ngoài statin. | **ĐÃ KHẮC PHỤC.** Kiểm chứng bằng `Case J3` (`evaluate()` trên sản phụ đang dùng 6 thuốc: Ezetimibe, Evolocumab, Inclisiran, Bempedoic acid, Fenofibrate, Icosapent ethyl): Engine phát đầy đủ 6 lệnh `[STOP]` cho từng hoạt chất; `fenofibrate.json` đã có `gate_feno_pregnancy`. |
| `LIPID-R2-02` | Major | Kê Fenofibrate liều đầy đủ 145–200 mg ở CKD G3a/G3b (`eGFR 30–59`). | **ĐÃ KHẮC PHỤC.** Rule ngoại trú/nội viện đã giảm liều khởi trị xuống `67 mg/ngày` ở `eGFR 30–<60`; kiểm chứng thêm `Case J9` (đang dùng sẵn Fenofibrate 200 mg ở eGFR ~42) phát `[REDUCE] 67 mg 1 lần/ngày`, và `Case J10` (`eGFR ~23`) phát `[STOP] Fenofibrate`. |
| `LIPID-R2-03` | Major | Bỏ sót hoàn toàn bậc 3 ức chế PCSK9 (`evolocumab`, `alirocumab`, `inclisiran`). | **ĐÃ KHẮC PHỤC.** `rules.outpatient.ts` đã bổ sung đầy đủ chuỗi Step 3 (`lipid.step3.add_pcsk9` và nhánh không dung nạp statin `Case J12`). |
| `LIPID-R2-04` | Major | Bỏ sót phối hợp Ezetimibe 10 mg ở bệnh nhân dùng Statin chưa đạt đích nếu `LDL < 3.0`. | **ĐÃ KHẮC PHỤC.** Đã tách riêng phối hợp sớm từ đầu (`upfront_ezetimibe_combo` khi `LDL >= 3.0`) với nâng bậc Step 2 (`lipid.step2.add_ezetimibe_on_statin` ở mọi mức LDL vượt đích trên nền statin cường độ cao — kiểm chứng tại `Case D4`, `F2`). |
| `LIPID-R2-05` | Major | Thiếu tương tác của Simvastatin (Clarithromycin, Amiodarone, Diltiazem, Verapamil) và Statin + Colchicine. | **KHẮC PHỤC MỘT PHẦN — CÒN LỖI CRITICAL MỚI (`LIPID-R2-R2-01`).** Đã nạp `kb/interactions/statin.json` sinh `SafetyAlert` (`Case B1`, `B3`, `J8`), **NHƯNG** logic thực thi giảm liều trong `reviewMeds.ts` áp sai trần `20 mg/ngày` cho cả Diltiazem/Verapamil (cho phép `[CONTINUE] Simvastatin 20 mg` gấp đôi trần FDA 10 mg!). |
| `LIPID-R2-06` | Major | Dùng sai hằng số `lipid.reduction.pcsk9_alone` (60%) làm mốc `eGFR 60`. | **ĐÃ KHẮC PHỤC TRONG RULES** (đã tạo `lipid.safety.egfr_moderate_ckd_max`), nhưng phát sinh lỗi mượn ngưỡng tương tự ở `matrix.ts` cho Pravastatin (`LIPID-R2-R2-10`). |
| `LIPID-R2-07` | Major | Ma trận thận ghi Rosuvastatin lọc máu là `contra` mâu thuẫn KDIGO 2024. | **ĐÃ KHẮC PHỤC.** Ô `rosuvastatin.dialysis` trong `src/modules/lipid/matrix.ts` đã đổi thành `initiate: 'not_rec', continue: 'ok'`. |
| `LIPID-R2-08` | Major | `pitavastatin.json` cho phép liều 4 mg/ngày ở `eGFR 30–59` (vượt trần FDA 2 mg). | **ĐÃ KHẮC PHỤC TRONG JSON — CÒN THIẾU THỰC THI RUNTIME (`LIPID-R2-R2-06`).** Tệp `pitavastatin.json` và `matrix.ts` đã sửa về trần 2 mg/ngày, nhưng engine `evaluate()` không đọc `DrugEntry.gates` nên bệnh nhân CKD G3b đang dùng Pitavastatin 4 mg vẫn nhận lệnh `[CONTINUE]`. |
| `LIPID-R2-09` | Major | Bỏ trống quy tắc xử trí cho nhóm nguy cơ trung bình (Moderate Risk) chưa đạt đích. | **ĐÃ KHẮC PHỤC.** Rule `lipid.step1.primary_moderate_low` (`rules.outpatient.ts` dòng 1211–1290) đã xử trí đầy đủ kèm xét yếu tố tăng cường nguy cơ `Lp(a) > 50 mg/dL`. |
| `LIPID-R2-10` | Major | Phát `[START]` chồng thêm statin mới lên statin cũ thay vì `[SWITCH]`. | **ĐÃ KHẮC PHỤC.** Rule `lipid.step1b.intensify_moderate_statin` (`rules.outpatient.ts` dòng 1371–1390) và `simvastatin_80_switch` đã chuyển sang hành động `SWITCH`. |
| `LIPID-R2-11` | Minor | Trường `vnBrands` chứa tên thương mại Mỹ/châu Âu không lưu hành tại VN. | **ĐÃ KHẮC PHỤC.** Đã làm sạch `vnBrands` của cả 13 thuốc (chỉ giữ biệt dược thực tế tại VN như `Ezetrol`, `Lipanthyl`, `Omacor`; để trống `[]` và chú thích rõ cho `bempedoic_acid`, `icosapent_ethyl`). |
| `LIPID-R2-12` | Minor | Thiếu cảnh báo đứt gân và tiền sử Gút đối với Bempedoic acid. | **ĐÃ KHẮC PHỤC.** Đã cập nhật `bempedoic_acid.json` và rule `rec_lipid_bempedoic_defer_gout` (kiểm chứng ở `Case J12`: tự động `[DEFER]` Bempedoic acid và chuyển sang `[CONSIDER] Evolocumab`). |
| `LIPID-R2-13` | Minor | Ma trận thận `lipidMatrixEgfr` bỏ sót 8/13 thuốc hạ lipid. | **ĐÃ KHẮC PHỤC.** Bảng `lipidMatrixEgfr` trong `src/modules/lipid/matrix.ts` đã bao phủ đủ 13/13 thuốc. |
| `LIPID-R2-14` | Suggestion | Hardcode Atorvastatin làm lu mờ vai trò của Rosuvastatin. | **ĐÃ CẢI THIỆN.** Step 1 nêu rõ phương án thay thế Rosuvastatin trong `rationale`/`profileDiff` và Step 1b hỗ trợ `UPTITRATE` trực tiếp trên nền Rosuvastatin (cần sửa thêm citation & lưu ý châu Á ở `LIPID-R2-R2-11`). |

---

## Phần 2. Chi Tiết Các Phát Hiện Mới Tại Vòng 2 (`LIPID-R2-R2-01` → `LIPID-R2-R2-12`)

### 2.1. Nhóm Phát Hiện Mức Độ Nghiêm Trọng Cực Cao (`CRITICAL` — 5 phát hiện)

---

#### [CRITICAL] `LIPID-R2-R2-01` — Quá liều trần gấp 2 lần (20 mg/ngày thay vì ≤ 10 mg/ngày) khi phối hợp Simvastatin với Diltiazem hoặc Verapamil, và bỏ sót hoàn toàn Dronedarone / Ranolazine
- **Phân loại (`itemType` / `itemId`):** `rule` / `med_review_simvastatin_amlodipine_limit` (`src/engine/safety/reviewMeds.ts` dòng 904–920 & `src/modules/lipid/rules.outpatient.ts`)
- **Mô tả dược lâm sàng:**
  Diltiazem và Verapamil là các chất ức chế vừa CYP3A4 đồng thời ức chế P-gp, làm tăng AUC của Simvastatin lên tới **5 lần** (mạnh hơn nhiều mức tăng ~77% của Amlodipine). Do đó, nhãn thuốc FDA và ACC/AHA 2026 bắt buộc giới hạn liều Simvastatin **tối đa 10 mg/ngày** khi dùng cùng **Diltiazem, Verapamil hoặc Dronedarone** (trong khi Amlodipine, Amiodarone, Ranolazine có trần **20 mg/ngày**). Tuy nhiên:
  1. Trong `src/engine/safety/reviewMeds.ts` (dòng 904), điều kiện kiểm tra gộp chung cả 4 thuốc (`amlodipine`, `amiodarone`, `diltiazem`, `verapamil`) vào ngưỡng `doseNum > 20`! Hệ quả là bệnh nhân đang uống **Simvastatin 20 mg + Diltiazem 180 mg** hoặc **Simvastatin 20 mg + Verapamil 240 mg** (liều gấp đôi mức tối đa cho phép!) lại được `rules.outpatient.ts` phát khuyến cáo **`[CONTINUE] Tiếp tục duy trì simvastatin`** mà không hề bị yêu cầu giảm liều.
  2. Nguy hiểm hơn, khi bệnh nhân uống **Simvastatin 40 mg + Diltiazem 180 mg**, `reviewMeds.ts` (dòng 913–915) chủ động phát lệnh **`[REDUCE] dose="Tối đa 20 mg/ngày"`** và tiêu đề **`"GIẢM LIỀU Simvastatin ≤ 20 mg/ngày (Dùng cùng Amlodipine / Amiodarone / Diltiazem / Verapamil)"`**, hướng dẫn bác sĩ hạ về một mức liều **vẫn cao gấp đôi trần an toàn 10 mg/ngày của FDA** (mâu thuẫn ngay với dòng chữ nhỏ trong chính `rationale` của thẻ đó!).
  3. Đối với **Dronedarone** (trần Simvastatin ≤ 10 mg/ngày) và **Ranolazine** (trần Simvastatin ≤ 20 mg/ngày), hệ thống bỏ sót hoàn toàn cả cảnh báo lẫn giảm liều.
- **Bằng chứng kiểm chứng:**
  - **Kết quả chạy `evaluate()` thực tế:**
    - `Case B1` (`age: 64, scr: 80, ldl: 2.2`, `currentMeds: [{ drugId: 'simvastatin', dose: '20 mg' }, { drugId: 'diltiazem', dose: '180 mg' }]`):
      - Output `recommendations`: `[CONTINUE] (rec_lipid_goal_achieved_continue) drug=simvastatin | title="Tiếp tục duy trì simvastatin — Đã đạt mục tiêu LDL-C (< 2.6 mmol/L)"` (*"Tuyệt đối không tự ý ngừng thuốc; duy trì phác đồ hiện tại"*). Không có bất kỳ khuyến cáo `[REDUCE]` nào!
    - `Case B3` (`ascvd: true, ldl: 1.2`, `currentMeds: [simvastatin 20 mg, ezetimibe 10 mg, verapamil 240 mg]`):
      - Output `recommendations`: `[CONTINUE] (rec_lipid_goal_achieved_continue) drug=simvastatin` ở mức 20 mg/ngày!
    - `Case B2` (`ldl: 2.2`, `currentMeds: [simvastatin 40 mg, diltiazem 180 mg]`):
      - Output `recommendations`: `[REDUCE] (med_review_simvastatin_amlodipine_limit) drug=simvastatin | dose="Tối đa 20 mg/ngày" | title="GIẢM LIỀU Simvastatin ≤ 20 mg/ngày (Dùng cùng Amlodipine / Amiodarone / Diltiazem / Verapamil)"`.
    - `Case J6` (`ascvd: true, ldl: 1.3`, `currentMeds: [simvastatin 40 mg, dronedarone 400 mg, ranolazine 500 mg]`):
      - Output: `[CONTINUE] simvastatin` (40 mg/ngày) và `ALERTS (0)`.
  - **Trích dẫn nguyên văn Nhãn thuốc FDA & Guideline:**
    - **FDA Diltiazem Prescribing Information** (`09_Nhan_Thuoc/FDA/FDA_label_diltiazem.pdf`, Section 7 Drug Interactions, p. 8):
      > *"coadministration of a single 20 mg dose of simvastatin at the end of a 14-day regimen with 120 mg BID diltiazem SR resulted in a 5-fold increase in mean simvastatin AUC versus simvastatin alone... If coadministration of simvastatin with diltiazem is required, limit the daily doses of simvastatin to 10 mg and diltiazem to 240 mg."*
    - **ACC/AHA 2026 Dyslipidemia Guideline** (`01_Noi_Khoa/Tim_Mach/ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Table 27: Clinical Recommendations on Management of DDI With Statins and Cardiovascular Medications, p. 98 / JACC p. 2721):
      > *"Diltiazem — Simvastatin: Limit dose of simvastatin to 10 mg daily"*
      > *"Dronedarone — Simvastatin: Limit dose of simvastatin to 10 mg daily"*
      > *"Verapamil — Simvastatin: Limit dose of simvastatin to 10 mg daily"*
      > *"Ranolazine — Simvastatin: ...doses of lovastatin or simvastatin should not exceed 20 mg daily"*
- **Đề xuất khắc phục (`suggestedFix`):**
  1. Trong `src/engine/safety/reviewMeds.ts`, tách thành 2 nhánh độc lập:
     - Nhóm ức chế trần **10 mg/ngày** (`diltiazem`, `verapamil`, `dronedarone`): kích hoạt `[REDUCE] dose="Tối đa 10 mg/ngày"` ngay khi `doseNum > 10` (và ở bệnh nhân ASCVD cần cường độ cao, khuyến cáo `[SWITCH]` sang statin không qua CYP3A4 như Rosuvastatin hoặc Pravastatin).
     - Nhóm ức chế trần **20 mg/ngày** (`amlodipine`, `amiodarone`, `ranolazine`): kích hoạt `[REDUCE] dose="Tối đa 20 mg/ngày"` khi `doseNum > 20`.
  2. Chặn `lipid.goal.achieved_maintain` phát `[CONTINUE] simvastatin` khi liều hiện tại đang vi phạm trần tương tác.
  3. Bổ sung `ix.statin_dronedarone` (`maxDose: 10` mg) và `ix.statin_ranolazine` (`maxDose: 20` mg) vào `kb/interactions/statin.json`.

---

#### [CRITICAL] `LIPID-R2-R2-02` — "Hố đen điều trị" (0 khuyến cáo thuốc) khi dùng thuốc ức chế mạnh CYP3A4 (hoặc Gemfibrozil) kèm Statin an toàn không qua CYP3A4 (`Rosuvastatin`) hoặc `Atorvastatin ≤ 20 mg`, đồng thời bỏ lọt quá liều `Pitavastatin + Erythromycin` và `Pravastatin + Clarithromycin`
- **Phân loại (`itemType` / `itemId`):** `rule` / `lipid.safety.ddi_cyp3a4_statin` (`src/modules/lipid/helpers.ts` dòng 216 & `src/modules/lipid/rules.outpatient.ts` dòng 826–917)
- **Mô tả dược lâm sàng:**
  Trong `src/modules/lipid/helpers.ts` (dòng 216), hàm `assessStatinSafety()` đặt biến chặn toàn cục:
  ```ts
  const ddiBlocksStandardStatinStart = Boolean(cyclosporineMedId || strongCyp3a4MedId || hasGemfibrozil);
  ```
  Biến này không phân biệt bệnh nhân đang dùng statin nào, mà **khóa cứng đồng loạt** tất cả các quy tắc điều trị bậc thang: Step 1b (`intensify_moderate_statin`), Step 2 (`continue_statin` + `add_ezetimibe_on_statin`), Step 3 (`add_pcsk9` / `bempedoic`), và cả quy tắc duy trì khi đạt đích (`goal.achieved_maintain`). Trong khi đó, quy tắc `lipid.safety.ddi_cyp3a4_statin` (`rules.outpatient.ts` dòng 848–893) lại chỉ xử lý `simvastatin` và `atorvastatin > 20 mg`, trả về `null` cho mọi trường hợp còn lại!
  Lỗi thiết kế kép này tạo ra **4 hậu quả nghiêm trọng trên lâm sàng**:
  1. **Mất trắng phác đồ điều trị trên Rosuvastatin + Clarithromycin (`Case A1`, `A3`):** Rosuvastatin chuyển hóa tối thiểu qua CYP2C9 (không qua CYP3A4) — chính hệ thống gợi ý chuyển sang Rosuvastatin khi dùng Clarithromycin! Thế nhưng nếu bệnh nhân ASCVD đang dùng sẵn `Rosuvastatin 20 mg + Clarithromycin 500 mg` mà `LDL-C = 2.5 mmol/L` (chưa đạt đích `< 1.4`), hệ thống sinh **0 khuyến cáo thuốc** (không thêm Ezetimibe 10 mg, không duy trì Rosuvastatin)!
  2. **Khóa điều trị trên Atorvastatin ≤ 20 mg + Clarithromycin (`Case A2`):** Bệnh nhân ASCVD đang dùng `Atorvastatin 10 mg + Clarithromycin 500 mg` (tuân thủ đúng trần `≤ 20 mg/ngày` của nhãn FDA Lipitor) nhưng `LDL-C = 2.5 mmol/L`: hệ thống cũng sinh **0 khuyến cáo thuốc** (khóa không cho thêm Ezetimibe 10 mg và khóa cả `CONTINUE`), đồng thời `ix.statin_clarithromycin` vẫn bắn cảnh báo `critical` dù liều 10 mg nằm dưới ngưỡng trần 20 mg!
  3. **Bỏ rơi Statin sau khi ngừng Gemfibrozil (`Case H1`):** Bệnh nhân ASCVD có `LDL-C = 2.8 mmol/L` đang uống `Atorvastatin 10 mg + Gemfibrozil 600 mg`: hệ thống phát `[STOP] gemfibrozil`, nhưng do `hasGemfibrozil` làm bật `ddiBlocksStandardStatinStart`, hệ thống bỏ rơi luôn `Atorvastatin` (không tăng liều lên 40–80 mg dù đã ngừng Gemfibrozil, cũng không `CONTINUE`).
  4. **Bỏ lọt quá liều độc cơ qua OATP1B1 trên Pitavastatin + Erythromycin (`Case A4`) và Pravastatin + Clarithromycin (`Case A5`):** Erythromycin ức chế mạnh OATP1B1 làm tăng AUC Pitavastatin 2.8 lần (nhãn FDA Livalo giới hạn tối đa **1 mg/ngày**); Clarithromycin ức chế OATP1B1 làm tăng AUC Pravastatin ~2 lần (nhãn FDA Pravachol giới hạn tối đa **40 mg/ngày**). Cả hai ca `Pitavastatin 4 mg + Erythromycin 500 mg` và `Pravastatin 80 mg + Clarithromycin 500 mg` đều bị bỏ lọt hoàn toàn (`0 khuyến cáo thuốc`, `0 cảnh báo tương tác`)!
- **Bằng chứng kiểm chứng:**
  - **Kết quả chạy `evaluate()` thực tế:**
    - `Case A1` (`ascvd: true, ldl: 2.5`, `currentMeds: [rosuvastatin 20 mg, clarithromycin 500 mg]`): Chỉ xuất 2 thẻ `[MONITOR]` (`Lp(a)` và lịch xét nghiệm) — **0 khuyến cáo thuốc, 0 cảnh báo**.
    - `Case A2` (`ascvd: true, ldl: 2.5`, `currentMeds: [atorvastatin 10 mg, clarithromycin 500 mg]`): Chỉ xuất 2 thẻ `[MONITOR]` — **0 khuyến cáo thuốc**.
    - `Case A4` (`ascvd: true, ldl: 2.2`, `currentMeds: [pitavastatin 4 mg, erythromycin 500 mg]`): **0 khuyến cáo thuốc, `ALERTS (0)`**.
    - `Case A5` (`ascvd: true, ldl: 2.2`, `currentMeds: [pravastatin 80 mg, clarithromycin 500 mg]`): **0 khuyến cáo thuốc, `ALERTS (0)`**.
    - `Case H1` (`ascvd: true, ldl: 2.8, tg: 3.0`, `currentMeds: [atorvastatin 10 mg, gemfibrozil 600 mg]`): Xuất `[STOP] gemfibrozil` + `[CONSIDER] icosapent_ethyl`, mất hoàn toàn khuyến cáo tối ưu/duy trì `atorvastatin` cho đích LDL-C `< 1.4 mmol/L`.
  - **Trích dẫn nguyên văn Nhãn thuốc FDA & Guideline:**
    - **FDA Lipitor (atorvastatin) Label** (`09_Nhan_Thuoc/FDA/FDA_label_atorvastatin.pdf`, Section 2.5, p. 5):
      > *"In patients taking clarithromycin or itraconazole, do not exceed LIPITOR 20 mg once daily."*
    - **ACC/AHA 2026 Dyslipidemia Guideline** (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Section 5.2, p. 100 / JACC p. 2723):
      > *"Lovastatin and simvastatin undergo significant CYP3A4 metabolism, while atorvastatin is metabolized through CYP3A4 to a lesser extent. Fluvastatin, pitavastatin, and rosuvastatin undergo significant metabolism through CYP2C9. Pravastatin does not undergo CYP450 metabolism."*
- **Đề xuất khắc phục (`suggestedFix`):**
  1. Tách `ddiBlocksStandardStatinStart` trong `src/modules/lipid/helpers.ts` theo từng hoạt chất đang dùng:
     - Nếu đang dùng `rosuvastatin`, `strongCyp3a4MedId` **không được chặn** Step 1b / Step 2 (`START ezetimibe`) / Step 3 (`PCSK9i`) / `CONTINUE`.
     - Nếu đang dùng `atorvastatin ≤ 20 mg` kèm `clarithromycin`/`itraconazole`, chỉ chặn việc tự động nâng liều `atorvastatin` lên 40–80 mg ở Step 1b, nhưng **phải mở khóa** Step 2 (`START ezetimibe 10 mg` + `CONTINUE atorvastatin ≤ 20 mg`) để bệnh nhân ASCVD vẫn đạt đích LDL-C an toàn!
     - Khi phát `[STOP] gemfibrozil`, cho phép duy trì/tối ưu hóa statin sau khi ngừng Gemfibrozil.
  2. Trong `lipid.safety.ddi_cyp3a4_statin` và `kb/interactions/statin.json`, bổ sung giới hạn liều OATP1B1: `pitavastatin + erythromycin` (`[REDUCE]` tối đa **1 mg/ngày**) và `pravastatin + clarithromycin` (`[REDUCE]` tối đa **40 mg/ngày**).

---

#### [CRITICAL] `LIPID-R2-R2-03` — Khuyến cáo tiếp tục duy trì `[CONTINUE]` liều độc cơ khi phối hợp Bempedoic acid với Simvastatin > 20 mg/ngày hoặc Pravastatin > 40 mg/ngày, kèm lỗi gắn nhầm `doseLimit`
- **Phân loại (`itemType` / `itemId`):** `rule` / `ix.statin_bempedoic` (`kb/interactions/statin.json` dòng 274–307, `src/modules/lipid/rules.outpatient.ts` & `src/engine/safety/reviewMeds.ts`)
- **Mô tả dược lâm sàng:**
  Bempedoic acid (và chất chuyển hóa glucuronid) ức chế yếu OATP1B1/1B3, làm tăng diện tích dưới đường cong (AUC) của acid simvastatin và pravastatin lên **~2 lần**, gây tăng mạnh nguy cơ bệnh cơ và tiêu cơ vân. Nhãn FDA NEXLETOL và ACC/AHA 2026 cấm dùng phối hợp Bempedoic acid với **Simvastatin > 20 mg/ngày** hoặc **Pravastatin > 40 mg/ngày**.
  Tuy nhiên, trong mã nguồn hiện tại:
  1. Không có bất kỳ quy tắc nào trong `rules.outpatient.ts` hay `reviewMeds.ts` kiểm tra và hạ liều `simvastatin > 20 mg` hoặc `pravastatin > 40 mg` khi có mặt `bempedoic_acid`. Do đó, engine phát trực tiếp thẻ khuyến cáo **`[CONTINUE] Tiếp tục duy trì pravastatin` (80 mg/ngày)** và **`[CONTINUE] Tiếp tục duy trì simvastatin` (40 mg/ngày)** với lời dặn *"Tuyệt đối không tự ý ngừng thuốc; duy trì phác đồ hiện tại"*!
  2. Trong `kb/interactions/statin.json` (`ix.statin_bempedoic`, dòng 297–303), đối tượng `doseLimit` chỉ khai báo duy nhất `simvastatin` (`maxDose: 20`). Khi bệnh nhân uống `Pravastatin 80 mg + Bempedoic acid 180 mg`, `interactions.ts` (dòng 418) không phát hiện được `doseExceeded` của Pravastatin và lại nối thêm dòng chữ sai thuốc: **`[Giới hạn liều tối đa simvastatin: ≤ 20 mg 1 lần/ngày]`** vào cảnh báo của Pravastatin!
- **Bằng chứng kiểm chứng:**
  - **Kết quả chạy `evaluate()` thực tế:**
    - `Case G1 / K2` (`ascvd: true, ldl: 1.3`, `currentMeds: [pravastatin 80 mg, bempedoic_acid 180 mg]`):
      - `recommendations`: `[CONTINUE] (rec_lipid_goal_achieved_continue) drug=pravastatin | title="Tiếp tục duy trì pravastatin — Đã đạt mục tiêu LDL-C (< 1.4 mmol/L)"`.
      - `alerts`: `[critical/interaction] (ix.statin_bempedoic) ... [Giới hạn liều tối đa simvastatin: ≤ 20 mg 1 lần/ngày] (Phát hiện: pravastatin, bempedoic_acid)`.
    - `Case G2` (`ascvd: true, ldl: 1.3`, `currentMeds: [simvastatin 40 mg, bempedoic_acid 180 mg]`):
      - `recommendations`: `[CONTINUE] (rec_lipid_goal_achieved_continue) drug=simvastatin | title="Tiếp tục duy trì simvastatin — Đã đạt mục tiêu LDL-C (< 1.4 mmol/L)"`.
  - **Trích dẫn nguyên văn Nhãn thuốc FDA & Guideline:**
    - **FDA NEXLETOL (bempedoic acid) Label** (`09_Nhan_Thuoc/FDA/FDA_label_bempedoic_acid.pdf`, Highlights of Prescribing Information, Section 7 Drug Interactions, p. 1 & Table 3, p. 8):
      > *"Simvastatin: Avoid concomitant use with simvastatin greater than 20 mg. (7)"*
      > *"Pravastatin: Avoid concomitant use with pravastatin greater than 40 mg. (7)"*
    - **ACC/AHA 2026 Dyslipidemia Guideline** (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Table 27, p. 98 / JACC p. 2721):
      > *"Bempedoic acid — Pravastatin: Limit dose of pravastatin to 40 mg daily"*
      > *"Bempedoic acid — Simvastatin: Limit dose of simvastatin to 20 mg daily"*
- **Đề xuất khắc phục (`suggestedFix`):**
  1. Thêm quy tắc `lipid.safety.ddi_bempedoic_statin_cap` vào `rules.outpatient.ts` (và `reviewMeds.ts`): khi có `bempedoic_acid` đồng thời với `simvastatin > 20 mg` -> phát `[REDUCE] simvastatin` tối đa `20 mg/ngày` (hoặc `[SWITCH]` sang Atorvastatin/Rosuvastatin); khi đồng thời với `pravastatin > 40 mg` -> phát `[REDUCE] pravastatin` tối đa `40 mg/ngày`; chặn `[CONTINUE]` ở liều quá trần.
  2. Tách `ix.statin_bempedoic` trong `kb/interactions/statin.json` thành 2 luật riêng `ix.simvastatin_bempedoic` (`maxDose: 20` mg) và `ix.pravastatin_bempedoic` (`maxDose: 40` mg).

---

#### [CRITICAL] `LIPID-R2-R2-04` — Bỏ sót hoàn toàn tương tác xuất huyết nghiêm trọng giữa Fenofibrate (và Rosuvastatin) với thuốc chống đông kháng Vitamin K (`Warfarin` / `Acenocoumarol`)
- **Phân loại (`itemType` / `itemId`):** `missing` / `ix.fibrate_warfarin` (`kb/interactions/anticoagulant.json`, `kb/interactions/statin.json` & `src/modules/lipid/rules.outpatient.ts`)
- **Mô tả dược lâm sàng:**
  Fenofibrate ức chế CYP2C9 (enzym chuyển hóa chính của S-warfarin và acenocoumarol) đồng thời đẩy thuốc kháng đông ra khỏi protein huyết tương và tăng nhạy cảm thụ thể đông máu, làm kéo dài vọt PT/INR và gây xuất huyết nội tạng / xuất huyết nội sọ đe dọa tính mạng nếu không **giảm liều Warfarin/Acenocoumarol chủ động (~25–33%)** ngay khi bắt đầu phối hợp và kiểm tra lại INR sau 3–5 ngày. Tương tự, Rosuvastatin cũng làm tăng có ý nghĩa thống kê INR trên bệnh nhân đang dùng Warfarin (nhãn FDA Crestor yêu cầu đo INR trước khi khởi trị và theo dõi sát sau khi bắt đầu/chỉnh liều).
  Mặc dù chính tệp `kb/drugs/fenofibrate.json` (dòng 125) có ghi chuỗi văn bản tĩnh về tương tác với Warfarin, toàn bộ hệ thống luật tương tác (`kb/interactions/*.json`, `interactions.ts`) và quy tắc kê đơn Fenofibrate (`lipid.tg.severe_fibrate` ngoại trú & nội viện) **hoàn toàn vắng bóng tương tác này**!
- **Bằng chứng kiểm chứng:**
  - **Kết quả chạy `evaluate()` thực tế:**
    - `Case D1` (Bệnh nhân rung nhĩ/van cơ học đang uống `warfarin 5 mg` với `INR = 2.6` và `atorvastatin 20 mg`, vào khám vì tăng TG nặng `tg = 7.5 mmol/L`):
      - `recommendations`: Engine phát **`[START] (rec_lipid_start_fenofibrate) drug=fenofibrate | dose="145–200 mg 1 lần/ngày"`** với `warnings: undefined`, `rationale` không hề có một chữ nào nhắc giảm liều Warfarin hay kiểm tra INR!
      - `alerts`: **`ALERTS (0)`**!
    - `Case D2` (Bệnh nhân đang dùng đồng thời `warfarin 5 mg` + `fenofibrate 145 mg`, `INR = 2.8`): **`ALERTS (0)`**!
    - `Case J11` (Bệnh nhân đang dùng đồng thời `warfarin 5 mg` + `rosuvastatin 20 mg`): **`ALERTS (0)`**!
  - **Trích dẫn nguyên văn Nhãn thuốc FDA & Dữ liệu KB:**
    - **KB nội tại `kb/drugs/fenofibrate.json`** (dòng 125):
      > *"Thuốc chống đông kháng vitamin K (Warfarin): Fenofibrate làm tăng mạnh tác dụng chống đông và INR -> cần giảm liều warfarin khoảng 1/3 khi bắt đầu phối hợp và theo dõi INR sát"*
    - **FDA CRESTOR (rosuvastatin) Label** (`09_Nhan_Thuoc/FDA/FDA_label_rosuvastatin.pdf`, Section 7.3 Table 7: CRESTOR Effects on Other Drugs, p. 14):
      > *"Warfarin — Prevention or Management: In patients taking warfarin, obtain an INR before starting CRESTOR and frequently enough after initiation, dosage titration or discontinuation to ensure that no significant alteration in INR occurs. Once the INR is stable, monitor INR at regularly recommended intervals. Mechanism and Clinical Effect(s): Rosuvastatin significantly increased the INR in patients receiving warfarin [see Clinical Pharmacology (12.3)]."*
    - **FDA TRICOR (fenofibrate) Prescribing Information** (Section 7.1 Coumarin Anticoagulants):
      > *"Potentiation of coumarin-type anticoagulant effects has been observed with prolongation of the PT/INR. Caution should be exercised when coumarin anticoagulants are given in conjunction with TRICOR. The dosage of the anticoagulants should be reduced to maintain the PT/INR at the desired level to prevent bleeding complications. Frequent PT/INR determinations are advisable until it has been definitely determined that the PT/INR has stabilized."*
- **Đề xuất khắc phục (`suggestedFix`):**
  1. Bổ sung ngay quy tắc `ix.fibrate_vka_bleeding` (mức `major`/`critical`: cặp `fenofibrate`, `gemfibrozil` với `warfarin`, `acenocoumarol` — hướng dẫn giảm liều kháng vitamin K ~25–33% và kiểm tra INR sau 3–5 ngày) và `ix.rosuvastatin_vka_inr` (mức `moderate`/`warning`: cặp `rosuvastatin` với `warfarin`, `acenocoumarol` — đo INR trước và sớm sau khởi trị/tăng liều) vào `kb/interactions/anticoagulant.json`.
  2. Trong `lipid.tg.severe_fibrate` (`rules.outpatient.ts` & `rules.inpatient.ts`), khi phát hiện `hasMed(ctx, 'warfarin') || hasMed(ctx, 'acenocoumarol')`, bổ sung cảnh báo trực tiếp vào mảng `warnings` của khuyến cáo `[START] Fenofibrate`.

---

#### [CRITICAL] `LIPID-R2-R2-05` — Không tạm ngừng Fenofibrate khi men cơ CK tăng 4–10x ULN, và không tạm ngừng / tránh dùng Ezetimibe (cùng Bempedoic acid) khi ALT ≥ 3x ULN hoặc bệnh gan tiến triển Child-Pugh B/C
- **Phân loại (`itemType` / `itemId`):** `rule` / `lipid.safety.ck_elevation` (`src/modules/lipid/rules.outpatient.ts` dòng 250–292, 432–495 & `kb/drugs/ezetimibe.json`)
- **Mô tả dược lâm sàng:**
  1. **Độc tính cơ mức `4x < CK < 10x ULN` trên Fenofibrate (`Case E2`):** Khi `CK >= 10x ULN`, hệ thống đã có 2 luật dừng cả Statin lẫn Fenofibrate (`Case E1`, `E3`). Thế nhưng khi bệnh nhân đang uống **Fenofibrate 145 mg đơn trị** và xét nghiệm có hủy cơ cấp mức trung bình–nặng (**`CK = 6.5x ULN`**), quy tắc `lipid.safety.ck_elevation` (`rules.outpatient.ts` dòng 447–494) chỉ kiểm tra `getActiveStatin(ctx)`! Vì `activeStatin === null`, engine coi như đây là bệnh nhân chưa điều trị gì có "CK nền cao" và phát khuyến cáo lệch lạc: **`[DEFER] Tạm hoãn khởi trị Statin do CK nền > 4 lần ULN`**, trong khi **không hề tạm ngừng (`[HOLD]`) viên Fenofibrate 145 mg** đang trực tiếp gây độc cơ (nguy cơ bệnh cơ của fibrate đơn trị cao gấp 5.5 lần statin theo ESC/EAS 2019)!
  2. **Độc tính gan cấp `ALT >= 3x ULN` hoặc bệnh gan hoạt động / xơ gan Child-Pugh B–C trên Ezetimibe & Bempedoic acid (`Case E5`, `J1`, `J2`):**
     - Ở suy gan vừa–nặng (Child-Pugh B hoặc C), diện tích dưới đường cong (AUC) của Ezetimibe toàn phần tăng **3 đến 6 lần**; cả nhãn FDA ZETIA và ACC/AHA 2026 Table 25 đều khuyến cáo **không sử dụng Ezetimibe** ở suy gan vừa–nặng và cân nhắc ngừng thuốc khi `ALT/AST >= 3x ULN` kéo dài. ESC/EAS 2019 Table 13 cũng chỉ định dừng liệu pháp hạ lipid máu khi `ALT >= 3x ULN`.
     - Thế nhưng ở `Case E5` (`ALT = 5.0x ULN` đang dùng `Atorvastatin 40 mg + Ezetimibe 10 mg + Fenofibrate 145 mg`), `Case J1` (`ALT = 5.0x ULN` đang dùng `Ezetimibe 10 mg + Bempedoic acid 180 mg`), và `Case J2` (`conditions.liverDisease = true` đang dùng `Ezetimibe 10 mg + Bempedoic acid 180 mg`), engine hoàn toàn **bỏ qua không `[HOLD]` hay cảnh báo đối với Ezetimibe 10 mg và Bempedoic acid 180 mg**!
     - Đồng thời, tệp `kb/drugs/ezetimibe.json` (dòng 1–93) **thiếu hoàn toàn trường `"hepatic"`**!
- **Bằng chứng kiểm chứng:**
  - **Kết quả chạy `evaluate()` thực tế:**
    - `Case E2` (`ckUlnTimes: 6.5, tg: 6.5`, `currentMeds: [fenofibrate 145 mg]`):
      - Output: `[DEFER] (rec_lipid_ck_defer) drug=atorvastatin | title="Tạm hoãn khởi trị Statin do CK nền > 4 lần ULN (6.5x ULN)"` — **0 khuyến cáo `[HOLD]` cho `fenofibrate`!**
    - `Case J1` (`altUlnTimes: 5.0, ascvd: true`, `currentMeds: [ezetimibe 10 mg, bempedoic_acid 180 mg]`):
      - Output: `[AVOID] (rec_lipid_alt_avoid) drug=atorvastatin` — **0 khuyến cáo `[HOLD]` cho `ezetimibe` hoặc `bempedoic_acid`!**
    - `Case J2` (`conditions: { ascvd: true, liverDisease: true }`, `currentMeds: [ezetimibe 10 mg, bempedoic_acid 180 mg]`):
      - Output: `[AVOID] (rec_lipid_alt_avoid) drug=atorvastatin` — **0 khuyến cáo dừng/tránh dùng `ezetimibe`!**
  - **Trích dẫn nguyên văn Nhãn thuốc FDA & Guideline:**
    - **ESC/EAS 2019 Dyslipidaemias Guideline** (`ESC_2019_dyslipidaemias_base.pdf`, Section 8.7.4, p. 33 & Table 13, p. 53):
      > *"The risk of myopathy has been reported to be 5.5-fold greater with fibrate monotherapy (mainly with gemfibrozil) compared with a statin..."* (p. 33)
      > *"If ALT rises to ≥3× ULN: Stop lipid-lowering therapy or reduce dose and recheck liver enzymes within 4–6 weeks."* (p. 53)
    - **ACC/AHA 2026 Dyslipidemia Guideline** (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Table 25: Safety Considerations for LDL-C–Lowering Medications, p. 95 / JACC p. 2718):
      > *"Cholesterol absorption inhibitor (ezetimibe): Not recommended in patients with moderate or severe hepatic impairment. Persistent elevations in hepatic transaminase (>3 times ULN) can occur when added to a statin; monitor hepatic transaminase levels before and after initiating statin with ezetimibe combination therapy."*
    - **FDA ZETIA (ezetimibe) Label** (`09_Nhan_Thuoc/FDA/FDA_label_ezetimibe.pdf`, Section 5.2, p. 4 & Section 8.7, p. 9):
      > *"consider withdrawal of ZETIA if increases in ALT or AST ≥3 × ULN persist."* (p. 4)
      > *"ZETIA is not recommended for use in patients with moderate to severe hepatic impairment (Child-Pugh B or C) due to the unknown effects of the increased exposure to ezetimibe."* (p. 9)
- **Đề xuất khắc phục (`suggestedFix`):**
  1. Bổ sung nhánh xử trí `hasMed(ctx, 'fenofibrate')` vào `lipid.safety.ck_elevation`: khi `4x < CK < 10x ULN` trên bệnh nhân đang dùng Fenofibrate, phát `[HOLD] fenofibrate` và không gọi đó là "CK nền" nếu bệnh nhân đang dùng thuốc độc cơ.
  2. Bổ sung quy tắc `[HOLD] ezetimibe` (và `bempedoic_acid`) khi `ALT >= 3x ULN` cấp tính hoặc có `liverDisease` tiến triển / suy gan Child-Pugh B/C.
  3. Bổ sung trường `"hepatic"` vào `kb/drugs/ezetimibe.json` ghi rõ không khuyến cáo dùng ở suy gan vừa–nặng (Child-Pugh B/C) do tăng AUC 3–6 lần.

---

### 2.2. Nhóm Phát Hiện Mức Độ Lớn (`MAJOR` — 3 phát hiện)

---

#### [MAJOR] `LIPID-R2-R2-06` — Không thực thi trần liều thận bắt buộc của FDA đối với Pitavastatin (`eGFR < 60` tối đa 2 mg/ngày) và Pravastatin (`eGFR < 30` tối đa 40 mg/ngày)
- **Phân loại (`itemType` / `itemId`):** `rule` / `pitavastatin` (`src/modules/lipid/rules.outpatient.ts` & `src/engine/safety/reviewMeds.ts`)
- **Mô tả dược lâm sàng:**
  Ở Vòng 1 (`LIPID-R2-08`), tệp `kb/drugs/pitavastatin.json` đã được cập nhật đúng trần thận của FDA Livalo (`eGFR 30–59` và `< 30`: khởi đầu 1 mg, **tối đa 2 mg/ngày**) kèm cổng `gate_pita_ckd_max`. Tuy nhiên, qua kiểm tra thực thi runtime bằng `evaluate()`, cả `src/engine/safety/gates.ts` lẫn `reviewMeds.ts` đều **không đọc mảng `gates` trong `kb/drugs/*.json`**, còn `rules.outpatient.ts` mới chỉ viết quy tắc kiểm tra trần liều thận cho duy nhất `rosuvastatin` (`lipid.safety.rosuvastatin_ckd_cap`). Hệ quả là bệnh nhân suy thận vừa–nặng đang uống **Pitavastatin 4 mg/ngày** hoặc suy thận nặng đang uống **Pravastatin 80 mg/ngày** vẫn được hệ thống phát lệnh **`[CONTINUE] Tiếp tục duy trì`** nguyên liều quá trần với **0 cảnh báo**!
- **Bằng chứng kiểm chứng:**
  - **Kết quả chạy `evaluate()` thực tế:**
    - `Case F3` (`age: 66, sex: 'male', scr: 160` [CKD G3b, `eGFR ~35 mL/phút/1.73m²`], `ascvd: true, ldl: 1.2`, `currentMeds: [{ drugId: 'pitavastatin', dose: '4 mg' }]`):
      - Output: `[CONTINUE] (rec_lipid_goal_achieved_continue) drug=pitavastatin | title="Tiếp tục duy trì pitavastatin — Đã đạt mục tiêu LDL-C (< 1.4 mmol/L)"`, `ALERTS (0)`.
    - `Case F4` (`age: 68, sex: 'female', scr: 250` [CKD G4, `eGFR ~17 mL/phút/1.73m²`], `ascvd: true, ldl: 1.2`, `currentMeds: [{ drugId: 'pravastatin', dose: '80 mg' }]`):
      - Output: `[CONTINUE] (rec_lipid_goal_achieved_continue) drug=pravastatin`, `ALERTS (0)`.
  - **Trích dẫn Nhãn thuốc FDA & KB nội tại:**
    - `kb/drugs/pitavastatin.json` (dòng 35–65): Dải `eGFR 30–60` và `0–30` đều quy định `"Khởi đầu 1 mg/ngày, tối đa 2 mg/ngày"` (FDA Livalo Prescribing Information Section 2.3 & 8.6: *"Patients with moderate and severe renal impairment (eGFR 30–59 and 15–29 mL/min/1.73 m², not receiving hemodialysis): Starting dose 1 mg once daily; maximum dose 2 mg once daily"*).
    - FDA Pravachol Prescribing Information (Section 2.4): Ở suy thận nặng, khởi đầu 10 mg/ngày và liều tối đa không quá 40 mg/ngày.
- **Đề xuất khắc phục (`suggestedFix`):**
  Bổ sung quy tắc thực thi trần thận trong `rules.outpatient.ts` (hoặc `reviewMeds.ts`):
  - Nếu đang dùng `pitavastatin > 2 mg/ngày` khi `eGFR < 60` (hoặc đang lọc máu): phát `[REDUCE] pitavastatin` tối đa `2 mg 1 lần/ngày` (hoặc `[SWITCH]` sang Atorvastatin ở bệnh nhân cần statin cường độ cao) và chặn `[CONTINUE]` liều 4 mg.
  - Nếu đang dùng `pravastatin > 40 mg/ngày` khi `eGFR < 30`: phát `[REDUCE] pravastatin` tối đa `40 mg 1 lần/ngày` (hoặc `[SWITCH]` sang Atorvastatin).

---

#### [MAJOR] `LIPID-R2-R2-07` — Thiếu tương tác thuốc tim mạch – chuyển hóa trọng yếu: `Rosuvastatin 40 mg + Ticagrelor / Febuxostat`, nhóm kháng virus `Paxlovid / Ritonavir / Cobicistat`, `Fenofibrate + Colchicine`, `Ezetimibe + Cyclosporine`, và `Pitavastatin / Pravastatin + Cyclosporine`
- **Phân loại (`itemType` / `itemId`):** `missing` / `kb/interactions/statin.json` (`kb/interactions/statin.json` & `src/modules/lipid/rules.outpatient.ts`)
- **Mô tả dược lâm sàng:**
  Trong một hệ thống đa bệnh lý tích hợp Vành – Suy tim – Thận – Gút như `GDMT-VN`, bệnh nhân sau hội chứng vành cấp (ACS) kèm Gút rất thường xuyên dùng đồng thời **Rosuvastatin + Ticagrelor + Febuxostat** hoặc **Fenofibrate + Colchicine**. Rà soát đối chiếu với nhãn FDA Crestor, Zetia, Lipitor và ACC/AHA 2026 phát hiện các khoảng trống tương tác lớn sau:
  1. **Rosuvastatin + Ticagrelor (tăng AUC 2.3 lần) & Rosuvastatin + Febuxostat (tăng AUC > 1.9 lần) — Trần FDA ≤ 20 mg/ngày:** Nhãn FDA CRESTOR (cập nhật 2026, Section 7.1 Table 5, p. 13) quy định cứng **không dùng quá Rosuvastatin 20 mg/ngày** khi dùng kèm Ticagrelor hoặc Febuxostat. Hiện tại hệ thống không có luật tương tác nào: ở `Case D3`, bệnh nhân uống `Rosuvastatin 40 mg + Ticagrelor 90 mg + Febuxostat 80 mg` nhận lệnh `[CONTINUE] rosuvastatin` (40 mg/ngày) với `0 cảnh báo`; nghiêm trọng hơn, ở `Case K1` (`Rosuvastatin 10 mg + Ticagrelor 90 mg + Febuxostat 80 mg`, `LDL = 2.1`), hệ thống chủ động phát lệnh **`[UPTITRATE] Tăng liều Rosuvastatin lên cường độ cao (20–40 mg 1 lần/ngày)`** đẩy bệnh nhân vượt trần 20 mg/ngày!
  2. **Các thuốc kháng virus ức chế CYP3A4 mạnh (`nirmatrelvir_ritonavir` [Paxlovid], `ritonavir`, `cobicistat`) và `erythromycin`, `voriconazole`, `posaconazole` vắng mặt khỏi `kb/interactions/statin.json`:** Ở `Case C1` (`Simvastatin 20 mg + Paxlovid`) và `Case C2` (`Atorvastatin 40 mg + Paxlovid`), mảng `ALERTS` bằng **0**! Hơn nữa, ở `Case C2` hoặc khi dùng `cobicistat`, rule `rec_lipid_ddi_cyp3a4_reduce_atorva` cho phép giữ Atorvastatin 20 mg/ngày kèm lời giải thích nhắc tới clarithromycin/itraconazole, trong khi ACC/AHA 2026 Table 22 (p. 81) ghi rõ `"Atazanavir/cobicistat — Atorvastatin: Do not coadminister"` và với đợt Paxlovid 5 ngày thực hành dược lâm sàng yêu cầu tạm ngưng Atorvastatin.
  3. **Thiếu cảnh báo `Fenofibrate + Colchicine` (đặc biệt trên nền CKD — `Case J7`), `Ezetimibe + Cyclosporine` (`Case J4`), và bỏ quên `pitavastatin`, `pravastatin` trong `ix.statin_cyclosporine` (`Case D5`, `J5`):** Mặc dù `colchicine.json` cảnh báo nguy cơ bệnh cơ/tiêu cơ vân hiệp đồng nặng khi phối hợp Fibrate + Colchicine ở CKD, `evaluate()` trên `Case J7` (`Fenofibrate 145 mg + Colchicine 0.5 mg`, CKD G3b `eGFR ~38`) cho **`ALERTS (0)`**. Cặp `Ezetimibe 10 mg + Cyclosporine 100 mg` (`Case J4`, AUC ezetimibe tăng 3.4–12 lần theo nhãn FDA Zetia) và cặp `Pitavastatin / Pravastatin + Cyclosporine` (`Case D5`, `J5`) cũng đều cho **`ALERTS (0)`** (riêng `Case J5` còn viết thiếu tên Pravastatin ngay trong `rationale` của thẻ `[STOP] pravastatin`: *"Tránh phối hợp Cyclosporine với Simvastatin, Pitavastatin hoặc Atorvastatin"*).
- **Bằng chứng kiểm chứng:**
  - **Kết quả chạy `evaluate()` thực tế:**
    - `Case D3` (`rosuvastatin 40 mg + ticagrelor 90 mg + febuxostat 80 mg`): `[CONTINUE] rosuvastatin`, `ALERTS (0)`.
    - `Case K1` (`rosuvastatin 10 mg + ticagrelor 90 mg + febuxostat 80 mg`, `ldl: 2.1`): `[UPTITRATE] rosuvastatin dose="20–40 mg 1 lần/ngày"`, `ALERTS (0)`.
    - `Case C1 & C2` (`simvastatin 20 mg` / `atorvastatin 40 mg` + `nirmatrelvir_ritonavir`): `ALERTS (0)`.
    - `Case J4` (`ezetimibe 10 mg + cyclosporine 100 mg`), `Case D5` (`pitavastatin 4 mg + cyclosporine 100 mg`), `Case J5` (`pravastatin 80 mg + cyclosporine 100 mg`), `Case J7` (`fenofibrate 145 mg + colchicine 0.5 mg` ở CKD G3b): tất cả đều `ALERTS (0)`.
  - **Trích dẫn nguyên văn Nhãn thuốc FDA & Guideline:**
    - **FDA CRESTOR Label** (`09_Nhan_Thuoc/FDA/FDA_label_rosuvastatin.pdf`, Section 7.1 Table 5: Drug Interactions that Increase the Risk of Myopathy and Rhabdomyolysis with CRESTOR, p. 13):
      > *"Ticagrelor — Prevention or Management: In patients taking ticagrelor, do not exceed a dosage of CRESTOR 20 mg once daily. In patients at increased risk for rhabdomyolysis [see Warnings and Precautions (5.1)], consider dosages less than 20 mg per day. Mechanism and Clinical Effect(s): Ticagrelor increased rosuvastatin exposure by 2.3-fold. The risk of myopathy and rhabdomyolysis is increased with concomitant use."*
      > *"Febuxostat — Prevention or Management: In patients taking febuxostat, do not exceed a dosage of CRESTOR 20 mg once daily. Mechanism and Clinical Effect(s): Febuxostat increased rosuvastatin exposure more than 1.9-fold. The risk of myopathy and rhabdomyolysis is increased with concomitant use."*
    - **ACC/AHA 2026 Dyslipidemia Guideline** (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Table 22, p. 81 / JACC p. 2704):
      > *"Atorvastatin — Atazanavir/cobicistat: Do not coadminister... Tipranavir/ritonavir: Do not co-administer."*
- **Đề xuất khắc phục (`suggestedFix`):**
  1. Bổ sung `ix.rosuvastatin_ticagrelor` (`maxDose: 20` mg) và `ix.rosuvastatin_febuxostat` (`maxDose: 20` mg) vào `kb/interactions/statin.json`, đồng thời cập nhật `rules.outpatient.ts` & `reviewMeds.ts` để giới hạn `rosuvastatin ≤ 20 mg/ngày` (bổ sung Ezetimibe 10 mg ở ngưỡng 20 mg thay vì đẩy lên 40 mg) khi đang dùng Ticagrelor hoặc Febuxostat.
  2. Bổ sung `nirmatrelvir_ritonavir`, `ritonavir`, `cobicistat`, `erythromycin`, `voriconazole`, `posaconazole` vào `kb/interactions/statin.json`; với `nirmatrelvir_ritonavir` và `cobicistat`, khuyến cáo tạm ngừng `[HOLD]` Atorvastatin thay vì duy trì 20 mg/ngày.
  3. Bổ sung `pitavastatin`, `pravastatin` vào `ix.statin_cyclosporine` (sửa luôn chuỗi `rationale` của `rec_lipid_ddi_cyclosporine_stop_statin`), và thêm `ix.ezetimibe_cyclosporine` + `ix.fibrate_colchicine` vào `kb/interactions/`.

---

#### [MAJOR] `LIPID-R2-R2-08` — Chỉ định cứng nhắc `[START] Atorvastatin 40–80 mg/ngày + [CONSIDER] Ezetimibe 10 mg` mới từ đầu (de novo) ở bệnh nhân chạy thận nhân tạo chu kỳ (`onDialysis: true`) có tiền sử ASCVD ổn định
- **Phân loại (`itemType` / `itemId`):** `rule` / `lipid.step1.statin_high_or_very_high` (`src/modules/lipid/helpers.ts` dòng 215 & `src/modules/lipid/rules.outpatient.ts` dòng 500–556, 1046–1148)
- **Mô tả dược lâm sàng:**
  Ở bệnh nhân suy thận mạn giai đoạn cuối đang lọc máu chu kỳ (`onDialysis: true`), hai thử nghiệm ngẫu nhiên bản lề **4D** (Atorvastatin 20 mg, có tuyển bệnh nhân bệnh mạch vành/nhồi máu cơ tim cũ) và **AURORA** (Rosuvastatin 10 mg, ~40% bệnh nhân có bệnh tim mạch sẵn có) cùng phân nhóm lọc máu của **SHARP** đều không chứng minh được lợi ích giảm biến cố tim mạch chính khi khởi trị mới statin. Do đó, **ACC/AHA 2026 Dyslipidemia Guideline** (Section 4.2.8.8, tr. 79–80) nhấn mạnh ngay cả việc *tiếp tục* statin trên lọc máu cũng chỉ ở mức **COR 2b, LOE C-LD**, còn việc *khởi trị mới* trên bệnh nhân lọc máu chỉ dừng ở mức **"may be considered based on clinical judgment while considering a patient’s projected longevity and other comorbidities"**. Tương tự, **KDIGO 2024** (Recommendation 3.15.1.1, tr. 47) loại trừ nhóm lọc máu mạn khỏi khuyến cáo khởi trị statin thường quy Class 1A, và lưu ý liều cao nhất từng được kiểm chứng an toàn trên bệnh nhân chạy thận là Atorvastatin 20 mg/ngày (4D) hoặc Simvastatin 20 mg + Ezetimibe 10 mg (SHARP).
  Thế nhưng hiện tại, vì `dialysisBlocksNewStatin` chỉ chặn khi `!hasAscvdEquivalent(ctx)`, một bệnh nhân đang chạy thận nhân tạo chu kỳ (`scr = 600 µmol/L`, `onDialysis: true`) có tiền sử bệnh mạch vành mạn hoặc đái tháo đường lâu năm chưa dùng statin lại rơi thẳng vào `lipid.step1.statin_high_or_very_high` và nhận lệnh cứng **`[START] Khởi trị Statin cường độ cao: Atorvastatin 40–80 mg 1 lần/ngày`** + **`[CONSIDER] Ezetimibe 10 mg`** giống hệt người không lọc máu, không có lấy một dòng cảnh báo về lọc máu!
- **Bằng chứng kiểm chứng:**
  - **Kết quả chạy `evaluate()` thực tế:**
    - `Case I1` (`age: 65, scr: 600, onDialysis: true, conditions: { ascvd: true }, ldl: 3.2, currentMeds: []`):
      - Output: `[START] (rec_lipid_start_high_statin) drug=atorvastatin | dose="40–80 mg 1 lần/ngày"` (chỉ có warning của `eGFR < 30` về Rosuvastatin 10 mg, hoàn toàn không nhắc tới chạy thận nhân tạo!) + `[CONSIDER] (rec_lipid_upfront_ezetimibe) Ezetimibe 10 mg`.
  - **Trích dẫn nguyên văn Guideline Quốc tế:**
    - **ACC/AHA 2026 Dyslipidemia Guideline** (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Section 4.2.8.8 Adults With CKD—Stage 3 or Higher, pp. 79–80 / JACC pp. 2702–2703):
      > *"In adults with CKD who require dialysis treatment, initiation of a statin has not been shown to be beneficial in 2 large randomized clinical trials [4D, AURORA] and in a subgroup analysis of a trial that included a group of patients on dialysis [SHARP]. The use of LLT in such cases may be considered based on clinical judgment while considering a patient’s projected longevity and other comorbidities."*
      > *"COR 2b, LOE C-LD: 3. In adults with CKD who require maintenance hemodialysis, it may be reasonable to continue statin therapy to reduce the risk of ASCVD events. Treatment decisions should be individualized with consideration of expected survival, other comorbidities, and severity of ASCVD."*
    - **KDIGO 2024 CKD Guideline** (`KDIGO_2024_CKD_Guideline.pdf`, Recommendation 3.15.1.1, p. 47):
      > *"In adults aged ≥50 years with eGFR <60 ml/min per 1.73 m² but not treated with chronic dialysis or kidney transplantation (GFR categories G3a–G5), we recommend treatment with a statin or statin/ezetimibe combination (1A)."*
- **Đề xuất khắc phục (`suggestedFix`):**
  Tách nhánh xử lý riêng cho bệnh nhân `onDialysis === true` có ASCVD chưa dùng statin (ngoài bệnh cảnh ACS cấp nội viện): chuyển hành động từ `[START] Atorvastatin 40–80 mg` sang `[CONSIDER]` cá thể hóa theo kỳ vọng sống, mức độ nặng của ASCVD và gánh nặng bệnh đồng mắc (theo ACC/AHA 2026 Section 4.2.8.8), đồng thời khuyến cáo khởi đầu thận trọng từ liều vừa (ví dụ Atorvastatin 10–20 mg/ngày ± Ezetimibe 10 mg) thay vì khởi trị ngay liều 80 mg/ngày trên bệnh nhân chạy thận nhân tạo.

---

### 2.3. Nhóm Phát Hiện Mức Độ Nhỏ & Gợi Ý Cải Tiến (`MINOR` & `SUGGESTION` — 4 phát hiện)

---

#### [MINOR] `LIPID-R2-R2-09` — Lỗi phân liều cấu trúc `target` của `icosapent_ethyl.json` (`4 g 1 lần/ngày` thay vì `2 g × 2 lần/ngày` cùng bữa ăn)
- **Phân loại (`itemType` / `itemId`):** `drug` / `icosapent_ethyl` (`kb/drugs/icosapent_ethyl.json` dòng 21–27)
- **Mô tả & Bằng chứng:**
  Trong `kb/drugs/icosapent_ethyl.json` (dòng 21–27), trường `target` đang khai báo:
  ```json
  "target": {
    "amount": 4,
    "unit": "g",
    "frequency": "1 lần/ngày",
    "route": "uống",
    "description": "4 g/ngày (chia 2 g x 2 lần/ngày) cùng bữa ăn"
  }
  ```
  Việc đặt `"amount": 4, "frequency": "1 lần/ngày"` mâu thuẫn trực tiếp với trường `start` (dòng 14–20: `"amount": 2, "frequency": "2 lần/ngày"`) và nhãn thuốc FDA Vascepa / **ACC/AHA 2026 Table 5** (p. 30):
  > *"Icosapent ethyl — Typical Dose Range: 4 g — Dosing Frequency: Twice daily with food — Give with a fat-containing meal to ensure absorption (pancreatic lipase stimulation breaks ethyl bonds to facilitate absorption)."*
  Uống dồn 4 g (8 viên 0.5 g) 1 lần/ngày làm quá tải khả năng thủy phân liên kết ethyl ester của lipase tụy trong một bữa ăn, giảm sinh khả dụng EPA và tăng rối loạn tiêu hóa.
- **Đề xuất khắc phục (`suggestedFix`):**
  Đổi `target.amount` thành `2` và `target.frequency` thành `"2 lần/ngày"` trong `kb/drugs/icosapent_ethyl.json`.

---

#### [MINOR] `LIPID-R2-R2-10` — Tái diễn lỗi mượn ngưỡng sai bản chất dược học trong `lipidMatrixEgfr`: dùng liều chuẩn Ezetimibe (`lipid.dose.ezetimibe_standard`) làm liều khởi đầu thận của Pravastatin
- **Phân loại (`itemType` / `itemId`):** `matrix` / `lipidMatrixEgfr` (`src/modules/lipid/matrix.ts` dòng 219, 372, 378)
- **Mô tả & Bằng chứng:**
  Trong `src/modules/lipid/matrix.ts` (dòng 362–380), tại hàng `drugId: 'pravastatin'`, cột `g4` (dòng 372) và `g5` (dòng 378) sử dụng biến `ezeDose` (`thFor('dose_mg', 'lipid.dose.ezetimibe_standard')`) để kết xuất chuỗi `` `Khởi đầu ${ezeDose} mg/ngày và theo dõi đáp ứng` ``. Đây chính là anti-pattern ghép sai ngữ nghĩa biến số y khoa từng gặp ở `LIPID-R2-06` Vòng 1.
- **Đề xuất khắc phục (`suggestedFix`):**
  Tạo ngưỡng riêng `lipid.dose.pravastatin_renal_start` (`value: 10, unit: 'mg'`) trong `kb/thresholds/lipid.json` và dùng đúng hằng số của Pravastatin trong `matrix.ts`.

---

#### [MINOR] `LIPID-R2-R2-11` — Quy tắc nâng liều Rosuvastatin (`lipid.step1b.intensify_moderate_statin`) trên hồ sơ Việt Nam (`profile: 'VN'`) thiếu cảnh báo dược động học chủng tộc châu Á (AUC tăng gấp ~2 lần ở liều 40 mg) và gắn nhầm trích dẫn của Atorvastatin
- **Phân loại (`itemType` / `itemId`):** `rule` / `lipid.step1b.intensify_moderate_statin` (`src/modules/lipid/rules.outpatient.ts` dòng 1340–1364)
- **Mô tả & Bằng chứng:**
  - Khi chạy `evaluate()` trên bệnh nhân Việt Nam (`profile: 'VN'`) đang dùng `Rosuvastatin 10 mg` chưa đạt đích (`Case K1`), rule `lipid.step1b.intensify_moderate_statin` phát `[UPTITRATE] Tăng liều Rosuvastatin lên cường độ cao (20–40 mg 1 lần/ngày)` mà không có bất kỳ lưu ý nào về việc phơi nhiễm huyết tương của Rosuvastatin ở người châu Á tăng **gấp ~2 lần** so với người da trắng (FDA CRESTOR Section 2.4, p. 4 & Section 8.8, p. 17: *"Pharmacokinetic studies have demonstrated an approximate 2-fold increase in median exposure to rosuvastatin in Asian subjects... Consider the risks and benefits of CRESTOR when treating Asian patients not adequately controlled at dosages up to 20 mg orally once daily"*; ACC/AHA 2026 Table 21, p. 78).
  - Đồng thời, tại dòng 1357–1361 của `rules.outpatient.ts`, mảng `citationIds` của khuyến cáo nâng liều **Rosuvastatin** lại gắn nhầm **`"fda.atorvastatin.dose"`** thay vì `"fda.rosuvastatin.asian_dose"`!
- **Đề xuất khắc phục (`suggestedFix`):**
  Trong nhánh `activeStatin.drugId === 'rosuvastatin'` của `lipid.step1b.intensify_moderate_statin`: thay `fda.atorvastatin.dose` bằng `fda.rosuvastatin.asian_dose`, và khi `ctx.settings.profile === 'VN'`, bổ sung lưu ý rõ trong `rationale` / `warnings` ưu tiên mốc `20 mg/ngày` (hoặc phối hợp sớm Ezetimibe 10 mg) trước khi cân nhắc thận trọng liều `40 mg/ngày` ở người Việt Nam.

---

#### [SUGGESTION] `LIPID-R2-R2-12` — Phân biệt câu chữ giữa Mang thai và Cho con bú trong `lipid.safety.pregnancy` và bổ sung lưu ý thải trừ 5 ngày sau Fenofibrate theo ACC/AHA 2026 Table 20
- **Phân loại (`itemType` / `itemId`):** `ui` / `lipid.safety.pregnancy` (`src/modules/lipid/rules.outpatient.ts` dòng 163–211 & `src/engine/types.ts` dòng 190)
- **Mô tả & Bằng chứng:**
  Điều kiện đầu vào `conditions.pregnant` trên UI gộp chung `"Mang thai / Cho con bú"`, nhưng tiêu đề các khuyến cáo `rec_lipid_pregnancy_stop_*` đều viết cứng `"Ngừng ngay <thuốc> do đang mang thai"`. Bên cạnh đó, **ACC/AHA 2026 Table 20** (p. 76) phân biệt rõ:
  - **Trong thai kỳ:** FDA (2021) đã gỡ bỏ chống chỉ định tuyệt đối của statin để cho phép hội chẩn chuyên khoa cá thể hóa ở phụ nữ nguy cơ cực cao (HoFH hoặc ASCVD nặng), và cho phép cân nhắc Omega-3 hoặc Fibrate (sau tam cá nguyệt thứ nhất) nếu tăng Triglycerid cực nặng đe dọa viêm tụy cấp.
  - **Trong thời kỳ cho con bú (Lactation):** Chống chỉ định / tránh dùng toàn bộ statin, ezetimibe, bempedoic acid, PCSK9i, fibrate; riêng với fibrate: *"If taken during pregnancy, lactation can be resumed 5 days after last dose of fibric acid derivatives"* (ACC/AHA 2026 Table 20, p. 76).
- **Đề xuất khắc phục (`suggestedFix`):**
  Sửa tiêu đề thành `"Ngừng ngay <thuốc> do đang mang thai hoặc cho con bú"` và bổ sung ghi chú hội chẩn chuyên khoa cho HoFH/viêm tụy cấp thai kỳ cùng mốc nghỉ cho bú 5 ngày sau liều Fenofibrate cuối cùng.

---

## Phần 3. Các Điểm Sáng Dược Lâm Sàng Đã Đạt Chuẩn Cao

Bên cạnh các lỗi cần khắc phục ở trên, hội đồng dược lâm sàng ghi nhận phân hệ `lipid` đã xây dựng rất vững chắc nhiều trụ cột dược trị liệu hiện đại:
1. **Chuẩn hóa 13 hồ sơ thuốc (`kb/drugs/`) & làm sạch biệt dược Việt Nam (`vnBrands`):** Liều khởi đầu, dải liều chuẩn, cơ chế tác dụng và danh mục biệt dược lưu hành thực tế tại Việt Nam (`Lipitor`, `Crestor`, `Livalo`, `Zocor`, `Pravachol`, `Ezetrol`, `Repatha`, `Praluent`, `Leqvio`, `Lipanthyl`, `Omacor`) chính xác; chú thích minh bạch tình trạng chưa có số đăng ký phổ biến tại VN đối với `Bempedoic acid` và `Icosapent ethyl`.
2. **Phác đồ bậc thang hạ LDL-C & Không dung nạp Statin đồng bộ ESC 2025 / ACC 2026:** Hỗ trợ đầy đủ đích kép (`< 1.4` / `< 1.8` / `< 1.0 mmol/L` kèm mức giảm `≥ 50%` so với nền), phối hợp sớm Ezetimibe trong ACS nội viện (ESC 2025 Class I-C / IIa-B), phân nhánh Bempedoic acid (tránh tự động khi có Gút / Acid uric `> 420 µmol/L` và chuyển sang PCSK9i — `Case J12`), và phân biệt rạch ròi EPA tinh khiết `Icosapent ethyl 2 g × 2 lần/ngày` (REDUCE-IT) với dầu cá hỗn hợp EPA+DHA (chỉ dùng cho tăng TG rất cao phòng viêm tụy cấp).
3. **Kiểm soát chặt Rosuvastatin và Fenofibrate theo eGFR ở cả ngoại trú lẫn nội viện:** Các ca `Case F1`, `F2`, `I4` (Rosuvastatin 20–40 mg ở `eGFR < 30`) và `Case J9`, `J10` (Fenofibrate ở `eGFR 30–59` và `< 30`) đều phát lệnh `[REDUCE]` / `[STOP]` chính xác.

---

## Kết Luận Kiểm Định Vòng 2 (R2 – Dược Lâm Sàng)

Do còn tồn tại **5 phát hiện mức `critical`** (quá liều gấp đôi trần Simvastatin + Diltiazem/Verapamil, "hố đen điều trị" làm mất hoàn toàn khuyến cáo thuốc trên bệnh nhân ASCVD dùng kèm chất ức chế CYP3A4, duy trì liều độc cơ Simvastatin/Pravastatin + Bempedoic acid, bỏ sót tương tác xuất huyết nặng Fenofibrate + Warfarin, và không tạm ngừng Fenofibrate/Ezetimibe khi đang tăng CK 4–10x ULN hoặc tăng ALT ≥ 3x ULN / suy gan Child-Pugh B–C) cùng **3 phát hiện mức `major`**, phân hệ `lipid` chưa đủ điều kiện an toàn dược lâm sàng để thông qua Vòng 2.

**Kết luận cuối cùng: FAIL (5 critical, 3 major, 3 minor, 1 suggestion)**
