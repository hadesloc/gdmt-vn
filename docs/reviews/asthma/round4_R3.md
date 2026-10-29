# Báo Cáo Kiểm Thử Đối Kháng Độc Lập – Module Hen Phế Quản (Asthma) – Vòng 4 (Reviewer R3)

- **Vai trò:** Reviewer R3 – Kiểm thử An toàn Đối kháng Lâm sàng Độc lập (Adversarial Clinical Safety Tester)
- **Module kiểm định:** `asthma` (`src/modules/asthma/*`, `kb/thresholds/asthma.json`, `kb/citations/asthma.json`, `kb/drugs/*`, `kb/interactions/*`) và giao diện an toàn xuyên module (`src/engine/safety/*`, `hf`, `copd`, `dm2`, `htn`, `af`, `ckd`, `gout`)
- **Phương pháp thực thi:** Chạy trực tiếp **100 kịch bản lâm sàng đối kháng (`S01` – `S100`)** qua hàm `evaluate(patient, settings)` thật của engine (thông qua Vite SSR runner để nạp đầy đủ `import.meta.glob` của toàn bộ registry đa chuyên khoa), bao gồm cả kiểm định toàn bộ 5 ca mẫu dựng sẵn (`asthmaPresets`: `S96` – `S100`).
- **Tính độc lập:** Hoàn toàn độc lập, chỉ đọc (`read-only`) mã nguồn và dữ liệu KB, tuyệt đối không tham khảo bất kỳ tài liệu nào của R1 hoặc R2 Vòng 4.

---

## 1. Tóm Tắt Điều Hành & Thống Kê Mức Độ Nghiêm Trọng

Bản cập nhật sau Vòng 3 đã cải thiện đáng kể nhiều chốt chặn an toàn cốt lõi của module Hen phế quản:
- Chặn kê đơn người lớn khi khuyết tuổi (`S69`) hoặc bệnh nhi `< 12 tuổi` (`S47`), đồng thời kích hoạt chính xác từ mốc `12 tuổi` (`S48`).
- Giảm 50% liều `magnesium_sulfate` tĩnh mạch về **1 g** khi `eGFR < 30 mL/phút/1,73m²` hoặc lọc máu chu kỳ (`S03`, `S65`, `S92` quy đổi đơn vị Mỹ `scr = 2.6 mg/dL`) và chặn truyền thêm bolus 2 g khi sản phụ tiền sản giật nặng đang truyền duy trì MgSO₄ sản khoa (`S36`).
- Chặn hoàn toàn đơn trị liệu LABA (`S76`), LAMA không kèm ICS (`S77`), và cả bình giãn phế quản kép LABA-LAMA không kèm ICS (`Ultibro Breezhaler` ở `S43`, `Anoro Ellipta` ở `S44`) với độ ưu tiên `p=100`.
- Khử SABA dư thừa ở bệnh nhân đang dùng phác đồ Track 1 MART (`S15`), tôn trọng trần **24 nhát/ngày** cho bình xịt `Symbicort Rapihaler 80/2.25 mcg` (`S16`, `S88`), hạ liều Montelukast xuống **5 mg viên nhai** cho lứa tuổi 12–14 (`S17`, `S49`) và ngừng ngay Montelukast khi có trầm cảm (`S84`).
- Bảo vệ bệnh nhân AERD lên cơn gút cấp khỏi NSAID/COX-1 (`S09`), ngừng thuốc nhỏ mắt chẹn beta không chọn lọc `Timolol` (`S85`), ngừng `Dupilumab` kèm tầm soát EGPA / giun lươn *Strongyloides* khi `BCAT ≥ 1500 /µL` (`S08`, `S64`), và cá thể hóa mục tiêu `SpO₂ 88–92%` ở bệnh nhân chồng lấp Hen – COPD (`S20`).

Tuy nhiên, kiểm thử đối kháng diện rộng trên 100 ca `evaluate()` trực tiếp đã phát hiện **16 lỗi xác thực** (**5 Critical**, **7 Major**, **3 Minor**, **1 Suggestion**), trong đó có những kịch bản nguy hiểm trực tiếp đến tính mạng người bệnh:

| Mức độ (Severity) | Số lượng | Mã lỗi định danh |
| :--- | :---: | :--- |
| **Critical** | **5** | `ASTHMA-R4-R3-01`, `ASTHMA-R4-R3-02`, `ASTHMA-R4-R3-03`, `ASTHMA-R4-R3-04`, `ASTHMA-R4-R3-05` |
| **Major** | **7** | `ASTHMA-R4-R3-06`, `ASTHMA-R4-R3-07`, `ASTHMA-R4-R3-08`, `ASTHMA-R4-R3-09`, `ASTHMA-R4-R3-10`, `ASTHMA-R4-R3-11`, `ASTHMA-R4-R3-12` |
| **Minor** | **3** | `ASTHMA-R4-R3-13`, `ASTHMA-R4-R3-14`, `ASTHMA-R4-R3-15` |
| **Suggestion** | **1** | `ASTHMA-R4-R3-16` |
| **Tổng cộng** | **16** | |

---

## 2. Kiểm Định Hồi Quy 16 Phát Hiện Của Vòng 3 (`round3_R3.json`)

| Mã Vòng 3 | Nội dung cốt lõi | Kịch bản R4 | Kết quả kiểm chứng trực tiếp qua `evaluate()` |
| :--- | :--- | :---: | :--- |
| `ASTHMA-R3-R3-01` | Cơn hen nguy kịch đa bệnh (`hf`, `htn`, `dm2`): Chặn chẹn beta & chặn lũ đơn thuốc mạn tính | `S01`, `S02`, `S20`, `S33`, `S34` | **CHƯA ĐẠT (`ASTHMA-R4-R3-04`, `06`)**: Ở ngoại trú (`S02`), `isOutpatientAcuteCrisis` bỏ sót suy hô hấp cấp nên vẫn kê `START metformin` (trên nền `SpO₂ 81%`!), `START sacubitril_valsartan`, `START dapagliflozin`, `START rec_hf_cardiac_rehab`. Ở nội trú (`S01`), HF vẫn phát `START rec_hf_inpatient_predischarge` giữa cơn ngực câm `SpO₂ 86%`. Đồng thời `hf.fmt.bb` và `hf.fmt.sglt2i` đang bị crash `TypeError` runtime! |
| `ASTHMA-R3-R3-02` | An toàn `magnesium_sulfate` TM trong suy thận nặng/lọc máu, tụt HA, nhược cơ, tiền sản giật, nhịp chậm | `S03`, `S04`, `S36`, `S65`, `S66`, `S68` | **ĐẠT MỘT PHẦN – LỖ HỔNG MỚI (`ASTHMA-R4-R3-03`)**: Đã giảm liều về 1 g khi `eGFR < 30`/lọc máu (`S03`, `S65`) và chặn khi `SBP < 90`/nhược cơ/tiền sản giật (`S04`, `S36`). **NHƯNG** bỏ sót nhịp chậm nặng đơn độc (`HR = 49 bpm`, `SBP = 112` ở `S68`), thậm chí dùng `HR < 50` làm cờ `isLifeThreatening` để nâng từ `CONSIDER` lên **`START magnesium_sulfate` 2 g IV**! |
| `ASTHMA-R3-R3-03` | Tương tác chất ức chế mạnh CYP3A4 (`ritonavir`, `itraconazole`, `clarithromycin`) với ICS/LABA | `S05`, `S24`–`S28`, `S51`, `S52` | **CHƯA ĐẠT (`ASTHMA-R4-R3-02`, `15`)**: Track 1 người lớn (`S05`, `S52`) và Track 2 Bậc 2 (`S27`) đã chuyển sang Foster/Beclometasone. **NHƯNG** Track 2 Bậc 3–5 (`S24`, `S28`) kê thẳng `START/SWITCH fluticasone_salmeterol` chung với `ritonavir`; ca đang dùng Seretide + `itraconazole` (`S25`) hoặc trẻ 14 tuổi dùng Symbicort + `clarithromycin` (`S26`) bị xóa trắng về **0 thuốc ICS**; trẻ 17 tuổi + `ritonavir` (`S51`) bị kê `START budesonide_formoterol`! |
| `ASTHMA-R3-R3-04` | Dị ứng nặng đạm sữa bò (`severeMilkProteinAllergy`): Chặn DPI chứa lactose & kê pMDI thay thế | `S06`, `S30`, `S31` | **CHƯA ĐẠT Ở TRACK 2 (`ASTHMA-R4-R3-05`)**: Ra viện (`S06`) và Track 1 (`S30`) xử lý tốt. **NHƯNG** ở Track 2 Bậc 3–5 (`S31`), do `kb/drugs/salmeterol.json` gắn cứng mã `severe_milk_protein_allergy`, cổng toàn cục `gates.ts` lật luôn `Seretide Evohaler pMDI` thành `AVOID fluticasone_salmeterol`, để bệnh nhân **0 controller**! |
| `ASTHMA-R3-R3-05` | Chặn Foster và bình bộ ba cố định ở thanh thiếu niên `12–17 tuổi` | `S07` | **ĐẠT LÂM SÀNG** (còn lỗi rò rỉ chuỗi `beclometasone_formoterol` trong tiêu đề `ASTHMA-R4-R3-15`). |
| `ASTHMA-R3-R3-06` | Chống chỉ định `Dupilumab` khi `BCAT ≥ 1500 /µL` & tầm soát EGPA / *Strongyloides* | `S08`, `S32`, `S64` | **ĐẠT CHO ĐƠN TRỊ** (`S08`, `S64`), nhưng khi bệnh nhân đang dùng kép `[dupilumab, mepolizumab]` kèm `BCAT = 1800` (`S32`) thì ngừng nhầm **cả hai** thuốc sinh học (`ASTHMA-R4-R3-11`). |
| `ASTHMA-R3-R3-07` | Đồng mắc `[asthma, gout]` có `AERD`: Chặn NSAID/COX-2 tự dùng tại nhà | `S09` | **ĐẠT HOÀN TOÀN**. |
| `ASTHMA-R3-R3-08` | Thai phụ lên cơn hen cấp giảm oxy máu (`SpO₂ = 93% < 95%`): Thở oxy chủ động | `S10` | **CHƯA KHẮC PHỤC (`ASTHMA-R4-R3-10`)**: `S10` vẫn chỉ nhận văn bản điều kiện thụ động `"bổ sung oxy nếu cần đạt SpO₂ ≥ 95% (thai kỳ)"`. |
| `ASTHMA-R3-R3-09` | Hạ bậc từ Bậc 3 xuống Bậc 2 không được ngừng đơn thuần thành phần LABA | `S11`, `S99` | **ĐẠT HOÀN TOÀN**. |
| `ASTHMA-R3-R3-10` | Cổng xuất viện khách quan & fail-closed khi khuyết câu hỏi GINA | `S12`, `S13`, `S70` | **ĐẠT CỔNG XUẤT VIỆN (`S12`)**, **NHƯNG CHƯA ĐẠT ACTION PLAN (`S13`, `ASTHMA-R4-R3-07`)**: Khi trả lời `0/4` câu GINA, controller dừng kê đơn nhưng `rec_asthma_action_plan_doc` vẫn tự sinh kế hoạch dùng thuốc 3 vùng đầy đủ liều nhát hít! |
| `ASTHMA-R3-R3-11` | Phối hợp sớm `Ipratropium` cho cơn hen cấp mức độ trung bình ngoại trú & nội trú | `S14`, `S54` | **ĐẠT** (nhưng phát sinh bất đối xứng khi thiếu `SpO₂` ở nội trú `S71` — `ASTHMA-R4-R3-08`). |
| `ASTHMA-R3-R3-12` | Ngừng SABA cắt cơn dư thừa ở người bệnh Track 1 MART | `S15` | **ĐẠT HOÀN TOÀN**. |
| `ASTHMA-R3-R3-13` | Trần 24 nhát/ngày đối với `Symbicort Rapihaler 80/2.25 mcg` | `S16`, `S88`, `S89` | **ĐẠT HOÀN TOÀN**. |
| `ASTHMA-R3-R3-14` | Giảm liều `Montelukast` về 5 mg viên nhai cho trẻ 12–14 tuổi | `S17`, `S49`, `S50` | **ĐẠT HOÀN TOÀN**. |
| `ASTHMA-R3-R3-15` | Không chỉ định miễn dịch trị liệu dưới lưỡi HDM-SLIT khi `FEV₁ ≤ 70%` | `S18`, `S60` | **ĐẠT HOÀN TOÀN**. |
| `ASTHMA-R3-R3-16` | Chồng lấp Hen – COPD (ACO) Bậc 5: Đồng bộ bình bộ ba & cảnh báo không dùng kép sinh học | `S19` | **ĐẠT HOÀN TOÀN**. |

---

## 3. Ma Trận Bao Phủ 100 Kịch Bản Đối Kháng Đã Thực Thi (`S01` – `S100`)

| Nhóm kịch bản | Dải mã số | Số lượng | Nội dung kiểm thử trọng tâm |
| :--- | :---: | :---: | :--- |
| **A. Hồi quy Vòng 3 (R3 Regression)** | `S01` – `S20` | 20 | Tái kiểm chứng toàn bộ 16 lỗi an toàn của Vòng 3 trên cả nội trú & ngoại trú. |
| **B. Thăm dò Lỗ hổng An toàn Sâu (Deep Safety Probes)** | `S21` – `S46` | 26 | Dương tính giả cơn hen cấp nội trú (ADHF, DM2, AF); ma trận tương tác CYP3A4 (Track 1/Track 2/Step 5/Vị thành niên); lệch pha Action Plan; dị ứng sữa bò & dị ứng Formoterol/Salbutamol/Atropine; glôcôm góc đóng; DKA + steroid; đơn trị LABA-LAMA; tăng PaCO₂ trên hen thuần túy; trùng lặp bình hít & sinh học. |
| **C. Kiểm thử Giá trị Biên (Boundary Stress)** | `S47` – `S68` | 22 | Tuổi (`11, 12, 14, 15, 17, 18`), `SpO₂` (`89%, 90%`), `FEV₁` (`29%, 30%, 59%, 71%`), `PEF` (`49%, 50%`), `BCAT` (`149, 150, 300, 1500`), `eGFR` (`29, 30`), `RR = 9`, `HR = 49`. |
| **D. Khuyết Dữ liệu & Fail-Closed** | `S69` – `S75` | 7 | Khuyết tuổi (`undefined`), khuyết một phần/toàn bộ GINA (`0/4`, `2/4`), khuyết `SpO₂` cấp cứu nội trú/ngoại trú, sai kỹ thuật hít, quy đổi PEF cá nhân tốt nhất (`500 L/phút`). |
| **E. Thuốc Nguy cơ Cao, Đa bệnh & Đổi Đơn vị/Hồ sơ** | `S76` – `S95` | 20 | Salmeterol/Tiotropium/SABA đơn trị, trùng ICS/ICS-LABA, Theophylline + Ciprofloxacin, Aminophylline TM, Diazepam + Morphine trong cơn cấp, Montelukast + trầm cảm, Timolol nhỏ mắt, Bisoprolol vs Carvedilol trong HFrEF, thai kỳ & cho con bú, đơn vị Mỹ (`mg/dL`), `onlyReviewed: true`, WPW + rung nhĩ, Prednisolone uống duy trì mạn. |
| **F. Kiểm toán Ca mẫu Dựng sẵn (`asthmaPresets`)** | `S96` – `S100` | 5 | Chạy trực tiếp 5 preset chính thức của module (`new_mild`, `uncontrolled_step2`, `severe_step5_eosinophilic`, `step_down_candidate`, `acute_severe_er`) — cả 5 preset đều chạy sạch không lỗi. |

---

## 4. Phân Tích Chi Tiết Các Phát Hiện Mới & Tồn Đọng

### 4.1. Nhóm Mức Độ CRITICAL (5 phát hiện)

#### [ASTHMA-R4-R3-01] Dương tính giả cơn hen phế quản cấp ở MỌI bệnh nhân nội trú có nền hen ổn định khi không truyền `isAcuteExacerbation: false` (`S21`, `S22`, `S23`)
- **Vị trí mã nguồn:** `src/modules/asthma/helpers.clinical.ts:208-214`, `src/modules/asthma/inputs.ts:301-305`, `src/modules/asthma/rules.acute.discharge.ts:67, 125, 324`.
- **Cơ chế lỗi:** Trường `isAcuteExacerbation` không có `defaultValue` (`undefined` nếu người dùng không chủ động gạt tắt), trong khi `evaluateAcuteAsthma()` đánh giá:
  ```ts
  const inAcuteContext =
    isExplicitAcute ||
    hasHardRespiratoryCollapse ||
    (!isExplicitNotAcute &&
      (hasSpecificAcutePresentation ||
        (ctx.settings.setting === 'inpatient' && resp1h !== 'good_response')));
  ```
  Do đó, bất kỳ bệnh nhân nội trú nào có chọn module `'asthma'` kèm bệnh chính khác (nhập viện vì suy tim mất bù cấp ADHF, tăng đường huyết ĐTĐ típ 2, rung nhĩ, hoặc mổ chương trình) với khám hô hấp hoàn toàn bình thường (`SpO₂ 97–98%`, `nhịp thở 15–16 lần/phút`, không khò khè khó thở) đều bị gán `hasAcuteAttack = true`!
- **Hậu quả lâm sàng xác thực qua `evaluate()`:**
  - **`S21` (Nhập viện vì ADHF, `LVEF 32%`, `SpO₂ 97%`, `RR 16`, đang dùng `Symbicort` nền):** Engine làm mất y lệnh duy trì `CONTINUE budesonide_formoterol`, đồng thời kê **`START salbutamol` 4–10 nhát mỗi 20 phút** (gây nhịp nhanh kịch phát làm nặng suy tim) và **`START prednisolone` 40–50 mg/ngày x 5–7 ngày** (gây giữ muối – nước cấp làm bùng phát phù phổi cấp!).
  - **`S22` (Nhập viện vì ĐTĐ típ 2 tăng đường huyết `glucose 15.4 mmol/L`, `HbA1c 9.8%`, `SpO₂ 98%`, `RR 15`):** Engine vừa kê phác đồ Basal-Bolus Insulin vừa tự động kê **`START prednisolone` 40–50 mg/ngày** đẩy bệnh nhân vào nguy cơ nhiễm toan ceton (DKA) / tăng áp lực thẩm thấu (HHS)!
  - **`S23` (Nhập viện vì Rung nhĩ / THA, `SpO₂ 98%`, chưa nhập `respiratoryRate`):** Âm thầm đánh rơi bình `Symbicort` duy trì hàng ngày của người bệnh và đòi nhập nhịp thở phân tầng cấp cứu hen.

#### [ASTHMA-R4-R3-02] Lỗ hổng ma trận tương tác chất ức chế mạnh CYP3A4 (`ritonavir`, `itraconazole`, `clarithromycin`) gây kê đơn độc tính nặng HOẶC xóa trắng toàn bộ thuốc kiểm soát ICS (`S24`, `S25`, `S26`, `S28`, `S51`)
- **Vị trí mã nguồn:** `src/modules/asthma/helpers.dosing.ts:387, 422-444`, `src/modules/asthma/rules.track2.outpatient.ts:136-184`, `src/modules/asthma/rules.track2.step5.ts:177-216`, `src/modules/asthma/rules.safety.systemic.ts:206-243`, `src/engine/safety/gates.ts:313-336`.
- **Cơ chế lỗi & Bằng chứng `evaluate()`:**
  1. **Kê trực tiếp `Fluticasone/Salmeterol` chung với `Ritonavir` ở Track 2 Bậc 3–5 (`S24`, `S28`):** Hàm `resolveTrack2IcsLabaDrugId()` không hề kiểm tra `hasStrongCyp3a4Inhibitor(ctx)`.
     - Ở **`S24`** (Người lớn 42 tuổi đang dùng `ritonavir`, khởi trị Track 2 Bậc 3): Do `currentMeds` chưa có ICS-LABA nên rule `ics_laba_strong_cyp3a4_inhibitor` không chạy, và `asthma.track2.management` kê thẳng **`START fluticasone_salmeterol` (`100/50 – 250/50 mcg Accuhaler 1 nhát x 2 lần/ngày`)** trên nền `ritonavir`! Phối hợp Ritonavir + Fluticasone propionate/Salmeterol làm tăng hàng trăm lần AUC Fluticasone (suy thượng thận cấp / Cushing ngoại sinh) và tăng vọt nồng độ Salmeterol gây kéo dài QTc, loạn nhịp thất xoắn đỉnh tử vong.
     - Ở **`S28`** (Người lớn 52 tuổi Bậc 5 Track 2 đang dùng `Trelegy Ellipta` + `ritonavir`): Hệ thống phát `AVOID fluticasone_umeclidinium_vilanterol` (`p=96`), rồi ngay dòng dưới `rec_asthma_step5_controller_continue` (`p=94`) lại ra lệnh **`SWITCH fluticasone_salmeterol` liều cao `500/50 mcg x 2 lần/ngày`** — tránh vỏ dưa gặp vỏ dừa độc tính cao hơn!
  2. **Xóa trắng ICS đẩy bệnh nhân hen không kiểm soát về SABA đơn thuần (`S25`):** Bệnh nhân Track 2 Bậc 4 đang dùng `Seretide` + `Ventolin` + mới uống `itraconazole` bị `AVOID fluticasone_salmeterol` (`p=96`) đè mất y lệnh duy trì Bậc 5 (`p=94`) trong `merge.ts`, để lại **0 thuốc kiểm soát ICS**!
  3. **Bế tắc ở thanh thiếu niên 12–17 tuổi (`S26`, `S51`):** Vì `< 18 tuổi` không được dùng Foster, `resolveTrack1MartDrugId()` luôn trả về `budesonide_formoterol`. Ở trẻ 14 tuổi đang dùng `Symbicort` + `clarithromycin` (`S26`), `AVOID budesonide_formoterol` (`p=96`) xóa sạch cả controller lẫn reliever (**0 thuốc điều trị hen**). Ở trẻ 17 tuổi mới chẩn đoán đang uống `ritonavir` (`S51`), hệ thống phát cảnh báo `AVOID` không gắn `drugId` nhưng vẫn kê **`START budesonide_formoterol`** (`p=91`) thay vì chuyển tạm sang `beclometasone` pMDI đơn chất ít phụ thuộc CYP3A4 + SABA!

#### [ASTHMA-R4-R3-03] Kê `START magnesium_sulfate` 2 g truyền tĩnh mạch cho bệnh nhân cơn hen nguy kịch đang nhịp tim chậm nặng tiền ngừng tim (`HR = 49 < 50 bpm`) (`S68`)
- **Vị trí mã nguồn:** `src/modules/asthma/helpers.clinical.ts:243` và `src/modules/asthma/rules.acute.inpatient.ts:309-315, 356-364`.
- **Cơ chế lỗi:** `evaluateAcuteAsthma()` xếp `hr < 50 bpm` vào `isLifeThreatening = true`. Tuy nhiên `asthma.acute.severe_magnesium_sulfate` chỉ chặn `sbp < 90`, `myastheniaGravis`, `avBlock2Or3` và tiền sản giật mà quên kiểm tra `hr < 50 bpm` (cũng như `sickSinusSyndrome`), rồi dùng chính `acute.isLifeThreatening === true` để đẩy y lệnh lên **`START magnesium_sulfate` 2 g truyền tĩnh mạch**! Trên bệnh nhân nhịp chậm do thiếu oxy máu nặng sắp ngừng tuần hoàn (`HR = 49 bpm`), truyền 2 g MgSO₄ ức chế nút xoang và nút nhĩ thất làm tăng nguy cơ vô tâm thu tức thì.

#### [ASTHMA-R4-R3-04] Sụp đổ cơ chế khóa đơn thuốc mạn tính xuyên module trong cơn hen nguy kịch suy hô hấp cấp (`SpO₂ 81–86%`, ngực câm, lơ mơ) ở cả ngoại trú (`S02`) và nội viện (`S01`)
- **Vị trí mã nguồn:** `src/engine/safety/clinicalStates.ts:138-193` (`isOutpatientAcuteCrisis`), `src/engine/safety/organAndCrisisGates.ts`, `src/modules/hf/rules.inpatient.ts:223-251`, `src/modules/hf/rules.hfref.ts:30, 230`.
- **Bằng chứng trực tiếp:**
  - **`S02` (Ngoại trú cơn hen nguy kịch: `silentChest: true`, `drowsy_confused`, `speechAbility: 'unable'`, `SpO₂ = 81%`, `PEF = 30%`, đồng mắc `['asthma', 'hf', 'htn', 'dm2']`):** Do `isOutpatientAcuteCrisis()` không nhận diện suy hô hấp cấp / giảm oxy máu nặng, bên cạnh y lệnh gọi 115 chuyển ICU của Asthma, engine phát đồng loạt:
    - **`[dm2] START metformin 500 mg`** — chống chỉ định tuyệt đối khi giảm oxy máu cấp nặng (`SpO₂ 81%`) do nguy cơ nhiễm toan lactic tử vong!
    - **`[hf] START sacubitril_valsartan 24/26 mg BID`** — nguy cơ tụt huyết áp sập nguồn khi khởi mê đặt nội khí quản!
    - **`[dm2] START dapagliflozin 10 mg`**, **`[hf] START spironolactone 25 mg`**, và **`[hf] START rec_hf_cardiac_rehab`** (*"Tham gia chương trình phục hồi chức năng tim mạch và tập luyện thể lực có giám sát"* ngay lúc bệnh nhân lơ mơ `SpO₂ 81%`!).
  - **`S01` (Nội viện cơn hen nguy kịch: `silentChest: true`, `SpO₂ = 86%`, `RR = 34`, đồng mắc `['asthma', 'hf']`):** Module HF vẫn phát **`START rec_hf_inpatient_predischarge`** (*"Khởi trị sớm phác đồ nền tảng GDMT trước xuất viện"*), `START sacubitril_valsartan` và `START spironolactone` ngay khi bệnh nhân đang được chuyển khẩn vào ICU đặt nội khí quản.

#### [ASTHMA-R4-R3-05] Dị ứng nặng đạm sữa bò ở Track 2 (`S31`) và Dị ứng Formoterol ở Track 1 (`S37`) làm xóa trắng toàn bộ thuốc kiểm soát nền (0 Controller)
- **Vị trí mã nguồn:** `kb/drugs/salmeterol.json:85-93`, `src/engine/safety/gates.ts:436-465`, `src/modules/asthma/rules.track1.ts`, `src/modules/asthma/rules.track2.outpatient.ts:40, 155-175`.
- **Cơ chế lỗi:**
  1. Ở **`S31`** (`severeMilkProteinAllergy: true`, Track 2 Bậc 3 đang dùng `Relvar Ellipta`): Module Asthma đã ngừng đúng `Relvar Ellipta` (`STOP fluticasone_vilanterol`, `p=100`) và chọn đúng `Seretide Evohaler pMDI` không chứa lactose (`fluticasone_salmeterol`). Thế nhưng `kb/drugs/salmeterol.json` lại khai báo cứng `{ "code": "severe_milk_protein_allergy" }`. Khi `evaluateSafetyGates()` bung các thành phần con của `fluticasone_salmeterol`, nó thấy mã chống chỉ định trên `salmeterol` mà không phân biệt pMDI với DPI, liền lật khuyến cáo thành **`AVOID fluticasone_salmeterol`** và xóa sạch liều pMDI, khiến bệnh nhân rơi vào tình trạng **0 thuốc kiểm soát nền**!
  2. Ở **`S37`** (`allergies: ['formoterol']`, Track 1 Bậc 3): Track 1 không có nhánh nhường sang Track 2 khi dị ứng `formoterol`; y lệnh `START budesonide_formoterol` bị cổng dị ứng toàn cục lật thành `AVOID budesonide_formoterol`, để lại bệnh nhân **0 thuốc kiểm soát nền**.

---

### 4.2. Nhóm Mức Độ MAJOR (7 phát hiện)

#### [ASTHMA-R4-R3-06] Crash Runtime `TypeError` trong `hf.fmt.bb` / `hf.inpatient.continue_bb` / `hf.fmt.sglt2i` VÀ lỗ hổng lọt lưới `hasAcuteBronchospasmOrRespFailure()` (`S01`, `S21`, `S33`, `S34`, `S86`, `S87`)
- **Bằng chứng 1 (Crash Runtime trực tiếp):** Trong mọi kịch bản có module `'hf'`, console của `evaluate()` ghi nhận lỗi thực thi làm câm lặng toàn bộ rule chẹn beta và SGLT2i của HF:
  - `Lỗi thực thi luật hf.fmt.sglt2i: TypeError: evaluateHfSglt2i is not a function` (`src/modules/hf/rules.hfref.ts:24`, `rules.hfpef.ts`)
  - `Lỗi thực thi luật hf.fmt.bb: TypeError: hasAsthmaOrBronchospasm is not a function` (`src/modules/hf/rules.hfref.ts:175`, `rules.inpatient.ts:179`, `rules.hfref_amt.ts:6`)
  - Nguyên nhân: `src/modules/hf/helpers.ts` đã xóa hai hàm export này mà chưa cập nhật 4 tệp rule của HF. Nếu bệnh nhân hen nội trú đang uống `Carvedilol` nhập viện vì suy tim, rule `hf.inpatient.continue_bb` (`rules.inpatient.ts:179`) bị crash trước khi kịp phát lệnh `STOP carvedilol`!
- **Bằng chứng 2 (Lọt lưới cổng chống chỉ định co thắt phế quản cấp):** Hàm `hasAcuteBronchospasmOrRespFailure()` (`src/engine/safety/drugClassify.ts:574-628` và `src/modules/hf/helpers.ts:360-373`) trả về `false` ngay lập tức khi `acuteResponseAfter1h === 'good_response'` bất chấp `FEV₁ = 40%` và `RR = 28` (`S33`), đồng thời bỏ sót hoàn toàn `speechAbility === 'unable'` (chỉ kiểm tra `'words'` và `'phrases'`), `mentalStatus === 'drowsy_confused'`, `paco2 > 45 mmHg`, `RR < 10` và `FEV₁ ≤ 50%` (`S34`).

#### [ASTHMA-R4-R3-07] Bản Kế hoạch Hành động Hen 3 Vùng (`rec_asthma_action_plan_doc`) dặn bệnh nhân tiếp tục hít thuốc vừa bị `AVOID` (`Trelegy Ellipta` + `ritonavir`) (`S28`, `S29`) VÀ tự bịa phác đồ khi chưa nhập 0/4 câu hỏi GINA (`S13`)
- **Vị trí mã nguồn:** `src/modules/asthma/rules.track2.support.ts:181-209`.
- **Chi tiết:** Biến `safeTriple` trong `action_plan_generator` (dòng 203–209) thiếu hẳn hai điều kiện lọc `hasStrongCyp3a4Inhibitor(ctx)` và `isAllergicToDrug(ctx, id)`. Ở `S29` (xuất viện sau cơn hen cấp trên bệnh nhân dùng `Trelegy Ellipta` + `ritonavir`), đơn ra viện phát `AVOID Trelegy Ellipta` (`p=96`) và `SWITCH Foster 100/6 mcg MART` (`p=95`), nhưng tờ Kế hoạch Hành động giao cho người bệnh lại hướng dẫn ở Vùng Xanh: **"Thuốc kiểm soát hàng ngày: Trelegy Ellipta"**! Ngoài ra ở `S13` (`0/4` câu GINA), `when()` không kiểm tra `evaluateGinaControl(ctx).level === 'missing'`, vẫn in phác đồ 3 vùng đầy đủ số nhát hít dù chưa có bất kỳ đánh giá hay đơn thuốc kiểm soát nào.

#### [ASTHMA-R4-R3-08] Trì hoãn hoàn toàn SABA và Corticosteroid cấp cứu nội viện khi cơn hen cấp trung bình thiếu số đo `SpO₂` — chỉ kê đơn độc `Ipratropium` (`S71`)
- **Vị trí mã nguồn:** `src/modules/asthma/rules.acute.discharge.ts:67, 125` đối chiếu `src/modules/asthma/rules.acute.inpatient.ts:153`.
- **Chi tiết:** Ở `S71` (`setting: 'inpatient'`, `isAcuteExacerbation: true`, khó thở nói từng cụm từ `speechAbility: 'phrases'`, `RR = 24`, `HR = 105`, chưa có `spo2`), `mild_moderate_saba` và `mild_moderate_ocs` bị khóa bởi `acute.hasMinVitals`, trong khi `severe_exacerbation_ipratropium` vẫn chạy. Bệnh nhân nhận duy nhất y lệnh `START ipratropium` (*"pha chung với SABA"*) mà bị giấu mất cả `Salbutamol` lẫn `Prednisolone`!

#### [ASTHMA-R4-R3-09] Bệnh nhân hen thuần túy (KHÔNG có COPD) bị kiệt sức tăng `PaCO₂ > 45 mmHg` bị ép hạ đích `SpO₂` xuống `88–92%` và dán nhãn sai `"đồng mắc COPD"` (`S45`, `S34`)
- **Vị trí mã nguồn:** `src/modules/asthma/helpers.dosing.ts:245-255` (`hasConcurrentCopdOrHypercapnia`).
- **Chi tiết:** Bệnh nhân nữ 26 tuổi chỉ mắc hen thuần túy lên cơn nguy kịch mệt cơ hô hấp (`SpO₂ = 88%`, `PaCO₂ = 50 mmHg`, `S45`) bị gộp chung với COPD ưu thán mạn: y lệnh cấm chạy khí dung bằng oxy và giới hạn `SpO₂` ở `88–92% (đồng mắc COPD / tăng PaCO₂)`, thay vì duy trì đích `SpO₂ 93–95%` của GINA 2026 và đặt nội khí quản khẩn.

#### [ASTHMA-R4-R3-10] Tồn đọng Vòng 3 (`ASTHMA-R3-R3-08`): Thai phụ lên cơn hen cấp giảm oxy máu (`SpO₂ = 93% < 95%`) vẫn chỉ nhận câu điều kiện thụ động `"bổ sung oxy nếu cần"` (`S10`)
- **Vị trí mã nguồn:** `src/modules/asthma/rules.acute.discharge.ts:103-107`.
- **Chi tiết:** Khi thai phụ có `SpO₂ = 93%` (dưới ngưỡng thiếu oxy thai nhi `< 95%` nhưng trên ngưỡng cơn nặng `< 90%`), `rec_asthma_acute_mild_moderate_saba` vẫn in câu thụ động `"bổ sung oxy nếu cần đạt SpO₂ ≥ 95% (thai kỳ)"` y hệt trường hợp `SpO₂ = 99%`, thiếu mệnh lệnh thở oxy cấp cứu chủ động ngay lập tức.

#### [ASTHMA-R4-R3-11] Lỗi khử trùng lặp thuốc Bậc 5: Ngừng nhầm CẢ HAI thuốc sinh học khi `[dupilumab, mepolizumab]` + `BCAT = 1800 /µL` (`S32`) VÀ bỏ sót lệnh `STOP` cho LAMA rời trùng với bình bộ ba (`Trelegy + Spiriva`) (`S46`)
- **Vị trí mã nguồn:** `src/modules/asthma/rules.track2.step5.ts:45-50, 95-119` và `src/modules/asthma/rules.safety.duplicates.ts`.
- **Chi tiết:** Ở `S32`, `dupilumab` đã bị `STOP` do `BCAT = 1800 ≥ 1500 /µL`, nhưng `getDuplicateBiologicExtra()` vẫn lấy `bios[1]` để phát thêm `STOP mepolizumab`, xóa sạch thuốc kháng IL-5 hợp lệ. Ở `S46`, dùng chồng `Trelegy Ellipta` + `Tiotropium` chỉ phát cảnh báo thụ động `dup.lama` mà không có recommendation `STOP tiotropium` để ngắt nguy cơ ngộ độc kháng cholinergic kép.

#### [ASTHMA-R4-R3-12] Khởi trị dưới bậc cho bệnh nhân hen mới chẩn đoán có `FEV₁ < 60%` (`59%`) kèm triệu chứng kiểm soát một phần (`1–2/4` GINA) (`S59`)
- **Vị trí mã nguồn:** `src/modules/asthma/helpers.clinical.ts:379-385, 416-422`.
- **Chi tiết:** Ở bệnh nhân chưa điều trị (`currentStep <= 0`) có `FEV₁ = 59%` (`< 60%` — yếu tố nguy cơ độc lập mạnh của đợt cấp nặng) và triệu chứng ban ngày `> 2 lần/tuần`, `computeEffectiveTrack1Step()` chỉ kiểm tra `fev1 < 60%` khi `uncontrolled` (`≥ 3/4` câu), dẫn đến trả về Bậc 1–2 AIR (chỉ xịt khi cần, không có liều duy trì hàng ngày Bậc 3 MART).

---

### 4.3. Nhóm Mức Độ MINOR & SUGGESTION (4 phát hiện)

- **[ASTHMA-R4-R3-13] (Minor – Threshold/Rule):** `asthma.step5.severe_management` (`rules.track2.step5.ts:274, 288-305`) chỉ dùng ngưỡng `BCAT ≥ 300 /µL`, bỏ sót tư vấn chỉ định **Dupilumab** và **Mepolizumab** ở dải `BCAT = 150–299 tế bào/µL` (`S62`) hoặc hen phụ thuộc OCS (theo GINA 2026 Box 8-2 & nhãn FDA).
- **[ASTHMA-R4-R3-14] (Minor – Missing Rule):** Bệnh nhân hen ngoại trú Bậc 5 đang uống `prednisolone 10 mg/ngày` kéo dài (`S95`) chưa có rule cảnh báo cấm ngừng đột ngột OCS (phòng suy thượng thận cấp) và nhắc dự phòng loãng xương / theo dõi biến chứng chuyển hóa – nhãn khoa.
- **[ASTHMA-R4-R3-15] (Minor – UI/Text):** Rò rỉ mã nội bộ `snake_case` (`budesonide_formoterol`, `beclometasone_formoterol`, `mepolizumab`) vào tiêu đề Tiếng Việt khi `currentMeds` không truyền kèm `name` (`S05`, `S07`, `S32`).
- **[ASTHMA-R4-R3-16] (Suggestion – Rule):** `rec_asthma_age_under_12` (`rules.safety.age_allergy.ts:187`, `S47`) nên dùng `action: 'REFER'` hoặc `'DEFER'` thay vì `'CONSIDER'` để phản ánh đúng việc từ chối phác đồ người lớn và chuyển chuyên khoa Nhi Hô hấp.

---

## 5. Kết Luận Thẩm Định An Toàn Vòng 4 (Reviewer R3)

Dù kiến trúc GINA 2026 & Bộ Y tế QĐ 1851/2020 của module Hen phế quản đã đạt độ sâu lâm sàng cao trên nhiều nhánh chuẩn, sự tồn tại của **5 lỗi Critical** (dương tính giả cơn hen cấp gây kê Prednisolone 40–50 mg/ngày ở bệnh nhân suy tim/ĐTĐ nội viện ổn định; kê trực tiếp Fluticasone/Salmeterol chung với Ritonavir hoặc xóa trắng ICS về 0 thuốc; truyền bolus 2 g MgSO₄ tĩnh mạch khi nhịp chậm 49 lần/phút; kê Metformin/ARNI/tập phục hồi chức năng giữa cơn hen ngừng thở `SpO₂ 81%`; và xóa trắng pMDI Evohaler ở bệnh nhân dị ứng đạm sữa bò Track 2) cùng **7 lỗi Major** (bao gồm crash `TypeError` trực tiếp ở rule chẹn beta của HF và mâu thuẫn thuốc trên tờ Kế hoạch Hành động giao cho người bệnh) bắt buộc phải được khắc phục triệt để trước khi phát hành lâm sàng.

**FAIL (5 critical, 7 major)**
