# Báo cáo Thẩm định Độc lập Vòng 3 – Phân hệ Hen phế quản Người lớn & Vị thành niên ≥ 12 tuổi (`asthma`)

- **Vai trò thẩm định:** Reviewer R2 – Dược sĩ Lâm sàng & Kiểm định viên An toàn Dùng thuốc Độc lập (*Clinical Pharmacist & Medication Safety Auditor*)
- **Vòng thẩm định:** Vòng 3 (*Round 3 Post-Remediation & Deep Safety Audit*)
- **Phân hệ kiểm định:** `asthma` (`src/modules/asthma/*`, `src/engine/*`, `kb/drugs/*.json`, `kb/thresholds/asthma.json`, `kb/citations/asthma.json`, `kb/interactions/*.json` và giao tiếp đa phân hệ `asthma` × `copd` / `hf` / `htn` / `gout`)
- **Tài liệu chuẩn đối chiếu nguyên văn (PDF gốc trong `Medical_Library_2026`):**
  1. **GINA 2026 Strategy Report** (`GINA_2026_Strategy_Report.pdf` — đối chiếu trực tiếp các trang 36, 47, 62, 65, 89–92, 98–101, 104, 113, 137–139, 160, 165–168, 180, 186–192, 244–247)
  2. **Bộ Y tế QĐ 1851/QĐ-BYT (2020)** – Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi (`BYT_1851_2020_Hen_phe_quan_NL_va_TE_ge12.pdf`)
  3. **Bộ Y tế QĐ 5850/QĐ-BYT (2021)** – Quy trình lâm sàng chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi (`BYT_5850_2021_Quy_trinh_hen_phe_quan.pdf`)
  4. **EMA SmPC & FDA Prescribing Information (cập nhật đến 2026):** `Foster_Fostair_SmPC.pdf`, `Trimbow_SmPC.pdf`, `Ultibro_Breezhaler_SmPC.pdf`, `FDA_label_budesonide_formoterol.pdf`, `FDA_label_budesonide_glycopyrronium_formoterol.pdf` (FDA phê duyệt chỉ định Hen 04/2026), `FDA_label_dupilumab.pdf`, `FDA_label_aclidinium.pdf`, `FDA_label_benralizumab.pdf`, `FDA_label_carvedilol.pdf`
- **Kết luận thẩm định (Verdict):** **`FAIL`**
- **Tổng hợp số lượng phát hiện (18 phát hiện):**
  - **Critical (Nguy cơ gây hại trực tiếp cho người bệnh nếu làm theo):** **7** (`ASTHMA-R3-R2-01` → `ASTHMA-R3-R2-07`)
  - **Major (Sai khuyến cáo/liều lượng chuẩn hoặc thiếu kiểm soát an toàn cốt lõi):** **7** (`ASTHMA-R3-R2-08` → `ASTHMA-R3-R2-14`)
  - **Minor (Thiếu/lệch chi tiết hồ sơ dược thư, ngữ nghĩa trích dẫn ngưỡng, nhiễu cảnh báo):** **3** (`ASTHMA-R3-R2-15` → `ASTHMA-R3-R2-17`)
  - **Suggestion (Đề xuất tối ưu hóa dược lâm sàng chuyên sâu):** **1** (`ASTHMA-R3-R2-18`)

---

## 1. Hậu kiểm Toàn diện 12 Vấn đề Vòng 2 của R2 (`ASTHMA-R2-201` → `ASTHMA-R2-212`)

Đội ngũ phát triển đã thực hiện khối lượng sửa chữa rất đáng ghi nhận sau Vòng 2: toàn bộ **69/69 trích dẫn** trong `kb/citations/asthma.json` đạt tỷ lệ khớp nguyên văn **100% (`exact = 69, drift = 0, fail = 0`)** trên tệp PDF gốc; nhiều cơ chế an toàn đa thuốc (dừng đa thuốc SABA/LABA/an thần opioid cấp tính, gộp steroid đường tiêm sang đường uống khi xuất viện, giảm 50% liều MgSO₄ khi eGFR < 30 mL/phút/1,73m² kể cả tự suy diễn từ SCr, bảo toàn LAMA ở bệnh nhân đồng mắc COPD) đã hoạt động tốt. Tuy nhiên, kiểm thử động xuyên biên đã phát hiện **các lỗi hồi quy và lỗ hổng biên nghiêm trọng còn sót lại**:

| Mã Vòng 2 | Nội dung lỗi Vòng 2 | Trạng thái Vòng 3 | Kết quả kiểm chứng thực nghiệm (`evaluate()`) |
| :--- | :--- | :---: | :--- |
| **`ASTHMA-R2-201`** | Bỏ sót cảnh báo quá liều MART > 12 nhát/ngày với Foster (`beclometasone_formoterol`) | **Đạt một phần – Phát sinh 2 lỗi Major mới (`ASTHMA-R3-R2-09`)** | Đã bắt đúng Foster 100/6 mcg ở 14 nhát/ngày (`SC01`: `[HOLD] beclometasone_formoterol` + `[REFER]`). **NHƯNG:** (1) Với Symbicort Rapihaler `80/2.25 mcg` (trần GINA 2026 = **24 nhát/ngày**), xịt 14 nhát bị báo động giả `[HOLD]` + `[REFER]` cấp cứu (`SC02`); (2) Bệnh nhân Track 2 không dùng ICS-formoterol bị phát lệnh `[HOLD] Budesonide/Formoterol` nhầm thuốc do điều kiện `hasBudForm \|\| !hasFoster` (`SC03`). |
| **`ASTHMA-R2-202`** | Cho xuất viện nhầm bệnh nhân có dấu hiệu đe dọa tính mạng khi chọn nhầm `good_response` | **Đạt với người thường – Lọt lỗi Critical ở Thai kỳ (`ASTHMA-R3-R2-04`)** | Đã chặn xuất viện khi có `silentChest`, `drowsy_confused`, `PaCO2 > 45` (`SC04`). **NHƯNG:** Ở thai phụ bị cơn hen cấp có `SpO2 = 94%` (< ngưỡng đích thai kỳ **95%** phòng thiếu oxy thai nhi), `evaluateAcuteAsthma()` vẫn dùng mốc 93% nên tắt sạch thở Oxy và **cho thai phụ đang thiếu oxy máu xuất viện về nhà** (`SC05`). |
| **`ASTHMA-R2-203`** | Dùng `.find()` chỉ dừng 1 thuốc đầu tiên, bỏ lọt thuốc chống chỉ định thứ 2 trong đơn | **Đạt phần lớn – Còn sót 2 quy tắc dùng `.find()` (`ASTHMA-R3-R2-12`)** | Đã sửa sang tách từng thuốc cho SABA, LABA chuẩn, chẹn beta chuẩn, COX-1 NSAID (`SC06`) và an thần/opioid (`SC28`). **NHƯNG:** Vẫn còn `.find()` ở `customNamedTimololRule` (`rules.safety.ts:407` — bỏ lọt lọ nhỏ mắt Timolol thứ 2) và `redundantMonoIcsStopRule` (`rules.safety.ts:823` — bỏ lọt bình ICS đơn thứ 2 + quên `TRIPLE_INHALER_DRUGS`) (`SC07`). |
| **`ASTHMA-R2-204`** | Chưa phát lệnh `STOP` thuốc an thần benzodiazepine / opioid trong cơn hen cấp | **ĐẠT (`PASS`)** | `SC28` (`alprazolam` + `morphine` trên bệnh nhân cơn hen cấp nặng): Phát chính xác 2 lệnh `[STOP]` độc lập (`prio=99`) cho cả hai thuốc. |
| **`ASTHMA-R2-205`** | Truyền tĩnh mạch Magnesium sulfate 2 g thiếu cổng suy thận eGFR < 30 & tụt huyết áp | **Đạt cổng thận – Lỗi Critical ở Sốc HA, Nhược cơ/Block AV & Tiền sản giật (`ASTHMA-R3-R2-03`)** | Suy thận từ `SCr = 520 µmol/L` (không nhập sẵn `egfr`) đã tự suy diễn `eGFR ~ 9` và giảm 50% liều còn `1 g` (`SC14`). **NHƯNG:** (1) Khi sốc `SBP = 82 mmHg`, `sbp < 90` bật `isLifeThreatening = true` biến nhánh chặn HA thành **code chết**, máy vẫn phát `[START] 2 g IV` (`SC15`); (2) Bỏ qua chống chỉ định tuyệt đối Nhược cơ nặng & Block AV độ II–III (`SC16`); (3) Chồng liều `4 g + 2 g = 6 g IV` với Tiền sản giật nặng (`SC22`). |
| **`ASTHMA-R2-206`** | Đơn xuất viện phát `[START] prednisolone` trùng trên bệnh nhân đang có `methylprednisolone` TM | **ĐẠT (`PASS`)** | `SC17`: Engine tự động sinh `[SWITCH] switch_old_methylprednisolone_for_prednisolone` (`prio=92`) trước khi `[START] prednisolone` uống 40–50 mg/ngày × 5–7 ngày. |
| **`ASTHMA-R2-207`** | Thiếu kiểm soát tương tác chất ức chế mạnh CYP3A4 + ICS/LABA (hội chứng Cushing, QTc) | **Phát sinh tự mâu thuẫn & dương tính giả (`ASTHMA-R3-R2-10`)** | `SC18A` bắt đúng `clarithromycin + fluticasone_salmeterol` và khuyên đổi sang nền Beclometasone (Foster). **NHƯNG:** Khi đổi sang Foster (`SC18B`), `ix.ics_laba_strong_cyp3a4` lại báo động đỏ `critical:interaction` ngay trên Foster! Và ở nội trú không dùng ICS/LABA (`SC18C`), rule vẫn báo `[AVOID]` dương tính giả. |
| **`ASTHMA-R2-208`** | Điều phối chẹn beta chọn lọc beta-1 giữa `asthma` và `hf` (HFrEF) | **Đạt ngoại trú – Đứt gãy ở nội trú (`ASTHMA-R3-R2-13`)** | Ngoại trú chưa dùng BB (`SC20A`: `[CONSIDER] bisoprolol 1.25 mg`) và đang dùng Carvedilol (`SC20B`: `[STOP] carvedilol` + `[SWITCH] bisoprolol`) hoạt động chuẩn. **NHƯNG:** Ở nội trú (`SC20C`), máy phát `[STOP] carvedilol` đứt ngang mà không có lệnh chuyển sang `bisoprolol`/`metoprolol_succinate`. |
| **`ASTHMA-R2-209`** | Bảo toàn thành phần LAMA ở bệnh nhân chồng lấp Hen – COPD (ACO) đang dùng bình bộ ba | **ĐẠT (`PASS`) trên ACO** | `shouldDeferTripleInhalerToCopd()` giữ nguyên bình bộ ba và `SC25` bổ sung mượt `tiotropium` trên nền MART Bậc 4→5; `SC10` chuyển Ultibro sang Breztri khi bật cả `asthma + copd` (tuy nhiên khi chỉ bật `asthma`, LAMA đơn và Ultibro bị lọt hoàn toàn — xem `ASTHMA-R3-R2-01`). |
| **`ASTHMA-R2-210`** | Cảnh báo đóng khung (FDA Boxed Warning) biến cố tâm thần kinh của Montelukast | **Còn thiếu liều 5 mg cho trẻ 12–14 tuổi & mức lệnh (`ASTHMA-R3-R2-08`)** | Đã thêm `rec_asthma_montelukast_psych_warning`, nhưng `montelukast.json` chỉ có liều người lớn `10 mg` (gấp đôi liều `5 mg` của trẻ 12–14 tuổi!) và mới phát `MONITOR` thay vì `STOP` trên bệnh nhân trầm cảm (`SC13`). |
| **`ASTHMA-R2-211`** | Ghi chú nhân đôi số nhát xịt với Symbicort Rapihaler 80/2.25 mcg | **Đạt văn bản – Sai logic trần cắt cơn (`ASTHMA-R3-R2-09`)** | Văn bản Track 1 và Kế hoạch hành động đã ghi rõ tối đa 24 nhát/ngày cho loại 80/2.25 mcg, nhưng hàm `isMartOveruse()` vẫn cắt cứng ở > 12 nhát (`SC02`). |
| **`ASTHMA-R2-212`** | Ngưỡng tuổi & dấu ấn sinh học thuốc sinh học Bậc 5 | **Thiếu giới hạn trần BCAT > 1.500/µL của Dupilumab & tuổi ≥ 18 của Foster/bình bộ ba (`ASTHMA-R3-R2-07`, `11`)** | Đã thêm tuổi tối thiểu các thuốc sinh học trong `thresholds/asthma.json`, nhưng bỏ sót loại trừ Dupilumab khi `bloodEosinophils > 1500/µL` (`SC29`) và bỏ sót trần tuổi ≥ 18 của Foster/Trelegy/Trimbow (`SC11A/B`, `SC12`). |

---

## 2. Kiểm toán Dược thư (`kb/drugs/`), Ma trận An toàn (`matrices.ts`), Ngưỡng & Trích dẫn

### 2.1. Kiểm toán Trích dẫn & Ngưỡng số học
- **69/69 trích dẫn trong `kb/citations/asthma.json`:** Đã chạy trình đối chiếu tự động trên văn bản PDF gốc đã khử ký tự ngắt trang (`\f` → `\n`): **69/69 khớp nguyên văn 100% (`0 drift, 0 fail`)**, đúng trang PDF.
- **74/74 ngưỡng trong `kb/thresholds/asthma.json`:** Tất cả ID trích dẫn đều tồn tại hợp lệ. Phát hiện **1 lỗi lệch ngữ nghĩa trích dẫn** (`ASTHMA-R3-R2-16`): ngưỡng trần SpO₂ thai kỳ `asthma.acute.pregnancy_oxygen_target_max = 98%` đang trỏ vào `byt.asthma.2021.acute_iv_steroid_ipratropium` vốn là ngưỡng của **trẻ em (`"trẻ em 94-98%"`)**, không phải của phụ nữ mang thai.

### 2.2. Kiểm toán Toàn bộ Hồ sơ Thuốc Hô hấp & Thuốc Liên quan (`kb/drugs/*.json` & `matrices.ts`)
Đã rà soát chi tiết 35 hồ sơ thuốc liên quan trực tiếp đến điều trị hen và bệnh đồng mắc:
- **ICS-formoterol (Track 1 AIR/MART):**
  - `budesonide_formoterol.json` (Symbicort Turbuhaler / Rapihaler): Đúng hàm lượng 160/4.5 mcg và 80/4.5 – 80/2.25 mcg, phê duyệt ≥ 12 tuổi cho AIR/MART theo GINA 2026 & QĐ 1851/BYT. Cần bổ sung kiểm tra hàm lượng 80/2.25 mcg trong `isMartOveruse()` (24 nhát/ngày) và sàng lọc dị ứng đạm sữa bò nặng đối với dạng bột khô Turbuhaler.
  - `beclometasone_formoterol.json` (Foster 100/6 pMDI / Nexthaler DPI): Đúng liều MART người lớn (1 nhát BID + PRN, tối đa 12 nhát/ngày theo GINA 2026 = 72 mcg formoterol định liều; SmPC gốc 8 nhát = 48 mcg). **Lỗi Critical (`ASTHMA-R3-R2-07`):** Chưa chặn độ tuổi `< 18 tuổi` (cả GINA 2026 trang 89 lẫn Foster SmPC trang 3 chỉ phê duyệt cho người lớn ≥ 18 tuổi) và đang bị mâu thuẫn cờ CYP3A4 trong `diabetes_respiratory.json` (`ASTHMA-R3-R2-10`).
- **ICS-LABA cố định (Track 2):** `fluticasone_salmeterol.json`, `fluticasone_vilanterol.json`, `mometasone_formoterol.json` — Đúng liều, đúng cảnh báo cấm dùng cắt cơn nhanh. Lưu ý `fluticasone_vilanterol` (Relvar Ellipta) chỉ có dạng bột khô DPI chứa lactose monohydrate (cần cảnh báo khi dị ứng đạm sữa bò nặng — `ASTHMA-R3-R2-14`).
- **Bình bộ ba cố định ICS+LABA+LAMA (Bậc 5):**
  - `fluticasone_furoate_umeclidinium_vilanterol.json` (Trelegy Ellipta) & `beclometasone_glycopyrronium_formoterol.json` (Trimbow): Đúng liều người lớn và thận trọng suy thận nặng / glôcôm góc đóng / bí tiểu. **Lỗi Critical (`ASTHMA-R3-R2-07`):** Cả hai chỉ được phê duyệt cho người lớn **≥ 18 tuổi**, chưa chặn ở trẻ 12–17 tuổi.
  - `budesonide_glycopyrronium_formoterol.json` (Breztri Aerosphere): Được FDA phê duyệt cho hen ≥ 12 tuổi (04/2026), **nhưng hồ sơ hiện tại mới chỉ ghi hàm lượng COPD `160/7.2/4.8 mcg` glycopyrronium**, thiếu hàm lượng Hen phế quản `160/14.4/4.8 mcg` glycopyrronium (`160/18/4.8 mcg` glycopyrrolate — gấp đôi thành phần kháng muscarinic theo `FDA_label_budesonide_glycopyrronium_formoterol.pdf` trang 5 §2.3) (`ASTHMA-R3-R2-15`).
- **ICS đơn chất (6 thuốc):** `budesonide`, `fluticasone_propionate`, `fluticasone_furoate`, `beclometasone`, `mometasone`, `ciclesonide` — Khớp Bảng liều ICS người lớn & vị thành niên ≥ 12 tuổi của GINA 2026 (Box 4-6) và QĐ 1851/BYT; ưu tiên an toàn thai kỳ của Budesonide được thể hiện chính xác trong `matrices.ts`.
- **Thuốc giãn phế quản cắt cơn & kháng cholinergic (`salbutamol`, `terbutaline`, `ipratropium`, `tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`, `glycopyrronium_indacaterol`, `umeclidinium_vilanterol`, `tiotropium_olodaterol`):**
  - **Lỗi Critical (`ASTHMA-R3-R2-01`):** Toàn bộ 4 thuốc LAMA đơn trị (`tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`) và thuốc LABA+LAMA `glycopyrronium_indacaterol` (do gõ nhầm thành `indacaterol_glycopyrronium`) bị lọt hoàn toàn khỏi lưới chặn "cấm dùng không kèm ICS ở bệnh nhân hen"!
- **LTRA & Xanthine (`montelukast`, `theophylline`):**
  - **Lỗi Major (`ASTHMA-R3-R2-08`):** `montelukast.json` chỉ ghi liều `10 mg` (≥ 15 tuổi), bỏ quên liều viên nhai **`5 mg` cho trẻ vị thành niên 12–14 tuổi**.
  - **Đề xuất (`ASTHMA-R3-R2-18`):** Bổ sung cảnh báo giảm thanh thải gan/tim của `theophylline` ở bệnh nhân xơ gan / suy tim.
- **Thuốc cấp cứu & Corticosteroid toàn thân (`prednisolone`, `methylprednisolone`, `magnesium_sulfate` + thiếu `hydrocortisone`):**
  - **Lỗi Critical (`ASTHMA-R3-R2-03`):** `magnesium_sulfate` bị lỗi code chết khi `SBP < 90 mmHg`, bỏ qua chống chỉ định Nhược cơ nặng & Block AV cao độ, và cộng dồn liều `4 g + 2 g = 6 g` với phân hệ `htn` trong tiền sản giật nặng.
  - **Lỗi Minor (`ASTHMA-R3-R2-15`):** Thiếu tệp `kb/drugs/hydrocortisone.json` dù được khai báo trong `mergeConflictGroups.ts` và QĐ 5850/BYT.
- **Thuốc sinh học Bậc 5 (`omalizumab`, `mepolizumab`, `benralizumab`, `dupilumab`, `tezepelumab`):**
  - Đúng liều dưới da, đúng phân tầng độ tuổi (≥ 6 tuổi cho Omalizumab/Mepolizumab/Dupilumab; ≥ 12 tuổi cho Benralizumab/Tezepelumab). **Lỗi Major (`ASTHMA-R3-R2-11`):** Chưa chặn gợi ý `dupilumab` khi bạch cầu ái toan máu `> 1.500 tế bào/µL` và chưa nhắc tầm soát EGPA / *Strongyloides*.

---

## 3. Tóm tắt Kết quả Thực thi Động 41 Kịch bản (`evaluate()`) & 5 Ca Mẫu

Toàn bộ kịch bản được chạy trực tiếp qua hàm `evaluate()` thật (không mock) trên registry chính thức:

| Mã kịch bản | Mô tả tình huống lâm sàng – dược lý | Kết quả thực tế từ `evaluate()` | Đánh giá |
| :--- | :--- | :--- | :---: |
| **`SC01`** | Foster 100/6 mcg MART dùng 14 nhát/ngày (> 12 nhát) | `[HOLD] beclometasone_formoterol` + `[REFER]` cấp cứu, khóa nâng bậc | **PASS** |
| **`SC02`** | Symbicort Rapihaler **80/2.25 mcg** dùng 14 nhát/ngày (trần đúng = 24 nhát) | Báo động giả `[HOLD]` + `[REFER] CHUYỂN CẤP CỨU NGAY` | **FAIL (`R3-R2-09`)** |
| **`SC03`** | Bệnh nhân **Track 2** (Seretide + Salbutamol, 0 ICS-formoterol), `totalDailyPuffsUsed=14` | Phát nhầm `[HOLD] Budesonide/Formoterol` (thuốc không dùng!) + khóa Track 2 | **FAIL (`R3-R2-09`)** |
| **`SC04`** | Nội trú cơn nguy kịch (`silentChest=true`) nhưng tích nhầm `good_response` | `[REFER] ICU` + bộ 4 thuốc cấp cứu, chặn xuất viện tuyệt đối | **PASS** |
| **`SC05`** | **Thai phụ 28 tuổi** cơn hen cấp, `SpO2 = 94%` (< đích thai kỳ 95%), `good_response` | Tắt thở Oxy, **cho xuất viện về nhà** khi đang giảm oxy máu thai kỳ! | **FAIL (`R3-R2-04`)** |
| **`SC06`** | Đa thuốc chống chỉ định (2 SABA + 2 LABA đơn + 2 BB + 2 COX-1 NSAID trên AERD) | Dừng đủ cả 8 thuốc, nhưng bắn cảnh báo giả `[critical:duplicate] dup.laba` | **FAIL nhẹ (`R3-R2-17`)** |
| **`SC07`** | 2 lọ nhỏ mắt chứa Timolol tự đặt tên + 2 bình ICS đơn dư thừa trên nền Symbicort | Chỉ dừng lọ Timolol thứ 1 và bình ICS đơn thứ 1, **bỏ lọt thuốc thứ 2** (`.find()`) | **FAIL (`R3-R2-12`)** |
| **`SC08A/B/C`** | Bệnh nhân hen dùng **LAMA đơn trị** (`tiotropium`, `umeclidinium`) **không kèm ICS** | **0 lệnh `STOP`, `Alerts (0)`**; ở Step 1 chỉ kê AIR khi cần, để mặc LAMA hàng ngày! | **FAIL (`R3-R2-01`)** |
| **`SC09`** | Bệnh nhân hen dùng **Ultibro (`glycopyrronium_indacaterol`)** không ICS (thiếu GINA) | **0 lệnh `STOP`, `Alerts (0)`** do gõ sai ID `'indacaterol_glycopyrronium'`! | **FAIL (`R3-R2-01`)** |
| **`SC10`** | Đồng mắc `asthma + copd` (ACO) đang dùng Ultibro không ICS | `copd` bắt đúng và chuyển sang bộ ba `budesonide_glycopyrronium_formoterol` | **PASS** |
| **`SC11A/B`** | Vị thành niên **14 tuổi** (< 18 tuổi!) dùng **Trelegy Ellipta** / nâng lên Bậc 5 | Phát `[CONTINUE] Trelegy` trái trần tuổi ≥ 18; Kế hoạch hành động in nhầm Seretide! | **FAIL (`R3-R2-07`, `13`)** |
| **`SC12`** | Vị thành niên **13 tuổi** (< 18 tuổi!) đang dùng **Foster 100/6** chưa kiểm soát | Phát `[UPTITRATE] Foster 2 nhát BID` trái chống chỉ định tuổi < 18 của SmPC & GINA! | **FAIL (`R3-R2-07`)** |
| **`SC13`** | Trẻ **12 tuổi** trầm cảm đang dùng **Montelukast** + Budesonide | `montelukast.json` chỉ có liều 10 mg (quá liều gấp đôi liều 5 mg); lệnh chỉ mức `MONITOR` | **FAIL (`R3-R2-08`)** |
| **`SC14`** | Cơn hen cấp nặng kèm suy thận `SCr = 520 µmol/L` (không nhập sẵn `egfr`) | Tự tính `eGFR ~ 9`, giảm 50% liều `magnesium_sulfate` còn **1 g IV** chuẩn xác | **PASS** |
| **`SC15`** | Cơn hen cấp kèm **sốc tụt huyết áp `SBP = 82 mmHg`** | Vẫn phát lệnh **`[START] magnesium_sulfate 2 g IV`** do nhánh chặn HA bị dead code! | **FAIL (`R3-R2-03`)** |
| **`SC16`** | Cơn hen cấp nặng trên bệnh nhân **Nhược cơ nặng + Block nhĩ thất độ II–III** | Vẫn đề xuất truyền `magnesium_sulfate 2 g IV` với `Alerts (0)`! | **FAIL (`R3-R2-03`)** |
| **`SC17`** | Xuất viện sau cơn cấp đang dùng `methylprednisolone` 40 mg IV + `salbutamol` | `[STOP] salbutamol` + `[SWITCH] methylprednisolone -> prednisolone` + MART Bậc 4 | **PASS** |
| **`SC18A/B/C`** | Clarithromycin + Seretide (`18A`) / + Foster (`18B`) / Nội trú không ICS (`18C`) | `18A` khuyên đổi sang Foster, nhưng `18B` lại báo `critical` trên Foster! `18C` báo giả! | **FAIL (`R3-R2-10`)** |
| **`SC19A/B`** | Dị ứng nặng/phản vệ **đạm sữa bò** dùng Relvar Ellipta / Symbicort Turbuhaler DPI | Không có trường sàng lọc hay cảnh báo tránh bình bột khô DPI chứa lactose | **FAIL (`R3-R2-14`)** |
| **`SC20A/B/C`** | Đồng mắc `asthma + hf` (HFrEF): Chưa BB (`20A`), Ngoại trú Carvedilol (`20B`), Nội trú (`20C`) | `20A/20B` chuẩn xác; **`20C` (nội trú) dừng đứt ngang Carvedilol không thuốc thay thế** | **FAIL (`R3-R2-13`)** |
| **`SC21`** | Đồng mắc `asthma + htn + CAD` đang dùng Propranolol + Amlodipine | `[STOP] propranolol` (nhắc chuyển BB chọn lọc beta-1 cho CAD) + `[START] perindopril` | **PASS** |
| **`SC22`** | Đồng mắc `asthma + htn`: **Tiền sản giật nặng** + Cơn hen cấp nặng | Phát chồng **2 lệnh MgSO₄ tĩnh mạch (`4 g IV + 1 g/h` VÀ `2 g IV` = 6 g bolus)**! | **FAIL (`R3-R2-03`)** |
| **`SC23A/B`** | Đồng mắc `asthma + gout`: **Hen nhạy cảm Aspirin (AERD)** + Cơn gút cấp | Vừa `[AVOID] aspirin` vừa **`[START] naproxen 500 mg BID`** gây nguy cơ tử vong! | **FAIL (`R3-R2-02`)** |
| **`SC24`** | Đồng mắc `asthma + htn`: Thai phụ có AERD + THA mạn | `[START] methyldopa` an toàn; cần ghi chú điều phối `[AVOID] aspirin` vs dự phòng TSG | **Gợi ý (`R3-R2-18`)** |
| **`SC25`** | Đồng mắc `asthma + copd`: ACO Bậc 4 chưa kiểm soát + COPD Nhóm E (`eos=350`) | `[CONTINUE] MART` + `[START] tiotropium` + `[REFER]` sinh học chuẩn xác, không trùng thuốc | **PASS** |
| **`SC26`** | Thai phụ Bậc 4 kiểm soát tốt 8 tháng liên tục | Giữ nguyên `[CONTINUE]` MART Bậc 4, **chặn hạ bậc trong thai kỳ** đúng GINA Box 4-13 | **PASS** |
| **`SC27`** | Xơ gan dùng `theophylline` + `ciprofloxacin` | Bắt đúng `[critical:interaction] ix.theophylline_ciprofloxacin`; gợi ý thêm cổng xơ gan | **Gợi ý (`R3-R2-18`)** |
| **`SC28`** | Cơn hen cấp nặng đang dùng `alprazolam` + `morphine` | Phát 2 lệnh `[STOP]` độc lập cho cả hai thuốc ức chế hô hấp | **PASS** |
| **`SC29`** | Hen nặng Bậc 5 trên nền Trelegy có **tăng BCAT rất cao (`eos = 1800/µL`)** | Vẫn gợi ý Dupilumab (> 1500/µL bị loại trừ!) & Kế hoạch hành động in nhầm Seretide! | **FAIL (`R3-R2-11`, `13`)** |
| **`SC30A/B`** | Nhi khoa **9 tuổi**: Ngoại trú dùng Salbutamol (`30A`) & Nội trú nguy kịch (`30B`) | `30B` chuyển ICU Nhi đúng; **`30A` phát `[STOP] salbutamol` mà khóa sạch thuốc thay thế!** | **FAIL (`R3-R2-06`)** |
| **`Presets 1–4`** | 4 ca mẫu ngoại trú (`new_mild`, `uncontrolled_step2`, `severe_step5`, `step_down`) | Hoạt động đúng bậc, đúng hướng chuẩn độ và Kế hoạch hành động Track 1 | **PASS** |
| **`Preset 5`** | Ca mẫu cấp cứu `preset_asthma_acute_severe_er` (SpO₂ 88%, RR 32, nói từng từ) | Thiếu `setting: 'inpatient'` → UI ép về `'outpatient'` → **0 thuốc cấp cứu, 0 chuyển viện!** | **FAIL (`R3-R2-05`)** |

---

## 4. Phân tích Chi tiết 18 Phát hiện Vòng 3 & Hướng dẫn Khắc phục Kỹ thuật

### Nhóm CRITICAL (7 phát hiện – Bắt buộc khắc phục triệt để trước khi phát hành)

#### `ASTHMA-R3-R2-01` [CRITICAL] – Bỏ sót hoàn toàn LAMA đơn trị (`tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`) và viết sai ID `glycopyrronium_indacaterol` (Ultibro) dùng thiếu ICS ở bệnh nhân hen
- **Vị trí:** `src/modules/asthma/helpers.ts:58-73`, `src/modules/asthma/rules.safety.ts:175-210`, `kb/interactions/diabetes_respiratory.json` (`ix.laba_monotherapy_asthma`).
- **Bằng chứng Y văn & Nhãn thuốc gốc:**
  - `GINA_2026_Strategy_Report.pdf` trang 101: *"Use of long-acting muscarinic antagonists (LAMA) in asthma without concomitant ICS is associated with an increased risk of severe exacerbations."*
  - `GINA_2026_Strategy_Report.pdf` trang 246: *"LABA is safe for asthma when used in combination with ICS, but LABA and/or LAMA should not be used without ICS in asthma (or in patients with asthma+COPD) due to increased risk of serious adverse outcomes."*
  - `EMA/Ultibro_Breezhaler_SmPC.pdf` trang 3 (§4.4 Special warnings): *"Asthma: Ultibro Breezhaler should not be used for the treatment of asthma... Long-acting beta2-adrenergic agonists may increase the risk of asthma-related serious adverse events, including asthma-related deaths."*
- **Bằng chứng Thực nghiệm (`evaluate()`):**
  - `SC08A/B/C`: Bệnh nhân hen đang dùng `tiotropium` hoặc `umeclidinium` đơn độc không có ICS nhận **0 lệnh `STOP` và `Alerts (0)`**. Nguy hiểm hơn, ở `SC08B/SC08C` (Track 1 Bậc 1 kiểm soát tốt), máy kê `budesonide_formoterol` chế độ **chỉ hít khi cần (AIR-only)** nhưng không dừng `tiotropium`/`umeclidinium`, khiến bệnh nhân tiếp tục hít LAMA đều đặn mỗi ngày mà không có ICS nền!
  - `SC09`: Do `helpers.ts:64` viết `'indacaterol_glycopyrronium'` trong khi ID chuẩn của KB là `'glycopyrronium_indacaterol'`, bệnh nhân hen đang dùng Ultibro chưa điền đủ 4 câu hỏi GINA cũng nhận **0 lệnh `STOP` và `Alerts (0)`**!
- **Khuyến nghị sửa chữa:**
  1. Khai báo `LAMA_WITHOUT_ICS_DRUGS = new Set(['tiotropium', 'umeclidinium', 'glycopyrronium', 'aclidinium'])` và thêm `'glycopyrronium_indacaterol'` vào `LABA_WITHOUT_ICS_DRUGS` trong `helpers.ts`.
  2. Trong `rules.safety.ts`, phát lệnh `[STOP]` (`priority: 100`) cho mọi LAMA đơn trị và LABA+LAMA khi trong `currentMeds` (và đơn mới) không có thuốc chứa ICS duy trì hàng ngày (lưu ý chỉ cho phép giữ `tiotropium` khi bệnh nhân đang ở Bậc 4–5 có nền ICS-LABA duy trì hàng ngày).
  3. Cập nhật `kb/interactions/diabetes_respiratory.json` bao phủ đầy đủ các thuốc LABA+LAMA và LAMA đơn trị.

#### `ASTHMA-R3-R2-02` [CRITICAL] – Kê đơn trực tiếp `[START] Naproxen 500 mg x 2 lần/ngày` cắt cơn gút cấp trên bệnh nhân Hen nhạy cảm Aspirin/NSAID (`AERD`)
- **Vị trí:** `src/modules/gout/helpers.safety.ts:304-366`, `src/modules/asthma/rules.safety.ts:444-490`, `src/engine/safety/gates.ts`, `kb/drugs/naproxen.json`.
- **Bằng chứng Y văn:** `GINA_2026_Strategy_Report.pdf` trang 139 (`gina.asthma.2026.aerd_avoid_nsaid`): *"Patients with AERD should avoid aspirin or NSAID-containing products and other medications that inhibit cyclooxygenase-1 (COX-1)"*. Ở bệnh nhân AERD (Tam chứng Samter), một liều đơn Naproxen 500 mg ức chế mạnh COX-1 làm bùng phát bão cysteinyl-leukotriene gây co thắt thanh – phế quản ác tính và tử vong nhanh.
- **Bằng chứng Thực nghiệm (`SC23A` & `SC23B`):** Bệnh nhân có `conditions: { asthma: true, gout: true, aerd: true }` trong cơn gút cấp muộn (> 36h) hoặc đang dùng Clarithromycin (chặn Colchicine) nhận đồng thời hai y lệnh đối kháng trực diện trong cùng một đơn thuốc:
  - `[AVOID] (asthma:rec_asthma_aerd_nsaid_contra, drugId=aspirin): TRÁNH TUYỆT ĐỐI Aspirin và tất cả NSAID ức chế COX-1 trên bệnh nhân AERD`
  - **`[START] (gout:rec_gout_nsaid_acute_flare, drugId=naproxen): Cắt cơn gút cấp bằng NSAID ngắn ngày (Naproxen) – 500 mg x 2 lần/ngày sau ăn trong 5 ngày`**, kèm `Alerts (0)`!
- **Khuyến nghị sửa chữa:**
  1. Trong `src/modules/gout/helpers.safety.ts` (`isNsaidHardContraindicated`), kiểm tra `Boolean(ctx.patient.conditions.aerd || ctx.patient.customInputs?.aerd)`. Khi dương tính, chặn tuyệt đối NSAID cắt cơn gút và tự động điều hướng sang phác đồ **Corticosteroid đường uống ngắn ngày (Prednisolone 30–40 mg/ngày)** — vừa điều trị đặc hiệu cơn gút cấp vừa bảo vệ đường thở AERD.
  2. Bổ sung mã chống chỉ định `'aerd'` vào `naproxen.json` (và các COX-1 NSAID khác) cùng ánh xạ trong `src/engine/safety/gates.ts` để khóa cứng ở tầng lõi.

#### `ASTHMA-R3-R2-03` [CRITICAL] – Ba lỗi an toàn nghiêm trọng của Magnesium sulfate tĩnh mạch: Code chết khi sốc tụt huyết áp (`SBP < 90`), bỏ qua Nhược cơ nặng / Block AV độ cao, và chồng liều `4 g + 2 g = 6 g` trong Tiền sản giật nặng
- **Vị trí:** `src/modules/asthma/helpers.ts:372`, `src/modules/asthma/rules.acute.ts:244-273`, `src/modules/htn/rules.inpatient.neuro_preg.ts`, `src/engine/safety/gates.ts`.
- **Phân tích nguyên nhân gốc & Bằng chứng Thực nghiệm:**
  1. **Code chết trong sốc tụt huyết áp (`SC15`):** Tại `helpers.ts:372`, khi `sbp < 90 mmHg`, biến `acute.isLifeThreatening` được gán `true`. Sang `rules.acute.ts:269`, biểu thức `hasHypotension && !acute.isLifeThreatening` trở thành **`true && false === false` (dead code 100%)**, khiến máy phát thẳng **`[START] Truyền ngay Magnesium sulfate 2 g tĩnh mạch chậm`** trên bệnh nhân đang sốc `SBP = 82 mmHg`!
  2. **Bỏ qua chống chỉ định tuyệt đối trong KB (`SC16`):** `kb/drugs/magnesium_sulfate.json:79-95` đã khai báo rõ `myasthenia_gravis` (Nhược cơ nặng — nguy cơ liệt cơ hô hấp cấp tính) và `heart_block` (Block nhĩ thất độ cao), nhưng cả `rules.acute.ts` lẫn `gates.ts` đều không kiểm tra, vẫn đề xuất truyền 2 g IV với `Alerts (0)`.
  3. **Trùng liều tĩnh mạch `asthma + htn` (`SC22`):** Trên thai phụ tiền sản giật nặng kèm cơn hen cấp nặng, `htn:rec_htn_preeclampsia_mgso4` chỉ định liều nạp `4 g IV + duy trì 1 g/giờ` nhưng đặt `drugId = undefined`, nên `merge.ts` không gộp được với `asthma:rec_asthma_acute_severe_mgso4` (`drugId = 'magnesium_sulfate'`, `2 g IV`), tạo y lệnh kép tổng cộng **6 g bolus tĩnh mạch + 1 g/giờ**!
- **Khuyến nghị sửa chữa:**
  1. Xóa `!acute.isLifeThreatening` tại `rules.acute.ts:269`; khi `sbp < 90 mmHg`, chuyển `action` sang `'HOLD'` (hoặc `'DEFER'` yêu cầu bù dịch/vận mạch nâng `SBP ≥ 90 mmHg` và loại trừ tràn khí màng phổi áp lực trước khi truyền).
  2. Chặn tuyệt đối (`AVOID`) MgSO₄ khi bệnh nhân có Nhược cơ nặng hoặc Block nhĩ thất độ II–III chưa đặt máy tạo nhịp.
  3. Gắn `drugId: 'magnesium_sulfate'` cho `htn:rec_htn_preeclampsia_mgso4` và thêm điều kiện không phát chồng liều 2 g của `asthma` khi bệnh nhân đã có chỉ định phác đồ Zuspan `severePreeclampsiaEclampsia`.

#### `ASTHMA-R3-R2-04` [CRITICAL] – Cho xuất viện nhầm và cắt mất y lệnh thở Oxy ở thai phụ cơn hen cấp đang giảm oxy máu thai kỳ (`SpO2 = 94% < 95%`)
- **Vị trí:** `src/modules/asthma/helpers.ts:394, 421-432`, `src/modules/asthma/rules.acute.ts:471-565`.
- **Bằng chứng:** Thai phụ cần duy trì `SpO2 ≥ 95%` (mục tiêu `95–98%`, `kb/thresholds/asthma.json:678-686`) để phòng thiếu oxy thai nhi cấp tính (`GINA_2026_Strategy_Report.pdf` trang 137 & trang 190). Tuy nhiên `evaluateAcuteAsthma()` (`helpers.ts:394`) lấy cứng `oxygenTargetMin = 93%` cho mọi đối tượng. Trong `SC05` (thai phụ 28 tuổi có `spo2 = 94%`, `pefPct = 76%`, `acuteResponseAfter1h = 'good_response'`), điều kiện `spo2 >= 93` khiến `canConsiderDischarge = true` → tắt toàn bộ y lệnh thở Oxy và phát đơn cho thai phụ đang thiếu oxy máu xuất viện về nhà!
- **Khuyến nghị sửa chữa:** Tại `helpers.ts:394`, tính `const oxygenTargetMin = isPatientPregnant(ctx) ? thFor('spo2', 'asthma.acute.pregnancy_oxygen_target_min') : thFor('spo2', 'asthma.acute.oxygen_target_min');` (95% cho thai kỳ vs 93% cho người thường).

#### `ASTHMA-R3-R2-05` [CRITICAL] – Ca mẫu cấp cứu `preset_asthma_acute_severe_er` thiếu `setting: 'inpatient'` làm tắt sạch phác đồ cấp cứu trên UI, đồng thời điểm mù hoàn toàn với cơn hen cấp tại phòng khám ngoại trú
- **Vị trí:** `src/modules/asthma/presets.ts:180-211`, `src/ui/AppShell.tsx:86-89`, `src/modules/asthma/helpers.ts:352`.
- **Bằng chứng:**
  1. Trong `presets.ts:180-211`, ca mẫu *"Cơn hen phế quản cấp nặng tại Cấp cứu"* (`SpO2 = 88%`, `RR = 32`, `HR = 128`, `PEF = 45%`, nói từng từ) quên khai báo `setting: 'inpatient'`. Khi chọn trên UI, `applyPresetSelection()` (`AppShell.tsx:88`: `setting: preset.setting ?? 'outpatient'`) tự động ép chế độ về `'outpatient'` (kể cả khi bác sĩ đang ở tab Nội viện!).
  2. Do `evaluateAcuteAsthma()` (`helpers.ts:352`) chặn cứng `if (ctx.settings.setting !== 'inpatient') return false`, cả ca mẫu trên lẫn bất kỳ bệnh nhân thực tế nào đến phòng khám ngoại trú trong cơn hen cấp (`isAcuteExacerbation = true`, `spo2 = 88%`) đều nhận **0 thuốc cấp cứu, 0 Oxy, 0 lệnh chuyển viện** (vi phạm trực tiếp **GINA 2026 Box 9-4, trang 180**: *Management of asthma exacerbations in primary care*).
- **Khuyến nghị sửa chữa:** (1) Thêm `setting: 'inpatient'` vào `preset_asthma_acute_severe_er`; (2) Bổ sung quy tắc xử trí cấp cứu ban đầu & chuyển tuyến khẩn cấp (`[REFER]` + Oxy + SABA + OCS sớm) ngay ở `setting: 'outpatient'` khi `isAcuteExacerbation === true` hoặc có dấu hiệu sinh tồn nguy kịch/nặng, đồng thời khóa các rule duy trì mạn tính trong lúc đang cấp cứu.

#### `ASTHMA-R3-R2-06` [CRITICAL] – Lỗi rào chắn Nhi khoa (`< 12 tuổi`): Phát lệnh `[STOP]` bình xịt cắt cơn Salbutamol duy nhất của trẻ nhưng khóa sạch thuốc thay thế
- **Vị trí:** `src/modules/asthma/rules.safety.ts:90-104` (`sabaMonoStopRules`) và dòng `138` (`sabaFlagFallbackRule`).
- **Bằng chứng (`SC30A`):** Bệnh nhi 9 tuổi ngoại trú đang có `salbutamol` bị `rec_asthma_age_under_12` chặn toàn bộ các rule kê thuốc người lớn, nhưng `sabaMonoStopRules` lại quên kiểm tra `isAdultOrAdolescent(ctx)` nên vẫn phát **`[STOP] salbutamol`** (kèm lời khuyên sai lứa tuổi *"Phải chuyển sang ICS-formoterol khi cần (Track 1)"* — không áp dụng cho Bậc 1 trẻ ≤ 5 tuổi và trẻ 6–11 tuổi theo GINA 2026 Box 4-12!), bỏ mặc trẻ không còn thuốc cắt cơn!
- **Khuyến nghị sửa chữa:** Thêm `if (!isAdultOrAdolescent(ctx)) return false;` vào `when()` của `sabaMonoStopRules` và `sabaFlagFallbackRule`.

#### `ASTHMA-R3-R2-07` [CRITICAL] – Vi phạm trần tuổi phê duyệt (`≥ 18 tuổi`) đối với Foster (`beclometasone_formoterol`), Trelegy Ellipta và Trimbow ở vị thành niên 12–17 tuổi
- **Vị trí:** `src/modules/asthma/helpers.ts:201-209`, `src/modules/asthma/rules.track1.ts`, `src/modules/asthma/rules.track2.ts:49-125`, `kb/drugs/beclometasone_formoterol.json`, `kb/drugs/fluticasone_furoate_umeclidinium_vilanterol.json`, `kb/drugs/beclometasone_glycopyrronium_formoterol.json`.
- **Bằng chứng Y văn & Nhãn thuốc gốc:**
  - `GINA_2026_Strategy_Report.pdf` trang 89: *"low-dose budesonide-formoterol (≥12 years) or low-dose beclometasone-formoterol (≥18 years)"*.
  - `GINA_2026_Strategy_Report.pdf` trang 100 & trang 246: Ở Bậc 4–5, nhóm 12–17 tuổi chỉ được dùng `tiotropium` Respimat (≥ 6 tuổi) hoặc `budesonide-formoterol-glycopyrronium` (Breztri, ≥ 12 tuổi); ba bình bộ ba `beclometasone-formoterol-glycopyrronium` (Trimbow), `fluticasone furoate-vilanterol-umeclidinium` (Trelegy) và `mometasone-indacaterol-glycopyrronium` (Enerzair) **chỉ được phê duyệt cho người lớn `≥ 18 years`**.
  - `EMA/Foster_Fostair_SmPC.pdf` trang 3 (§4.2): *"under 18 years of age have not been established... no recommendation on a posology can be made"*. `EMA/Trimbow_SmPC.pdf` trang 3 (§4.1): *"in adult patients"*.
- **Bằng chứng Thực nghiệm:** Trẻ 13 tuổi đang dùng Foster (`SC12`) được máy phát lệnh **`[UPTITRATE] Foster 2 nhát x 2 lần/ngày`**; trẻ 14 tuổi đang dùng Trelegy (`SC11A`) được phát lệnh **`[CONTINUE] Trelegy`**.
- **Khuyến nghị sửa chữa:** Thêm ngưỡng `asthma.age.min_adult_18 = 18`; khi `12 <= age < 18`, tự động chuyển đổi (`SWITCH`) Foster sang `budesonide_formoterol`, cảnh báo chuyển đổi Trelegy/Trimbow sang nền ICS-LABA ≥ 12 tuổi + Tiotropium Respimat (hoặc Breztri), và bổ sung gate tuổi `< 18` vào 3 tệp DrugEntry JSON.

---

### Nhóm MAJOR (7 phát hiện – Sai lệch liều lượng lứa tuổi, tự mâu thuẫn tương tác hoặc sót kiểm soát quan trọng)

#### `ASTHMA-R3-R2-08` [MAJOR] – Liều Montelukast trong `kb/drugs/montelukast.json` thiếu hoàn toàn mức 5 mg/ngày cho vị thành niên 12–14 tuổi (nguy cơ quá liều gấp đôi trên thuốc có FDA Boxed Warning) & mức lệnh tâm thần kinh
- **Vị trí:** `kb/drugs/montelukast.json:17-30`, `src/modules/asthma/rules.safety.ts` (`rec_asthma_montelukast_psych_warning`).
- **Phân tích:** Dược thư quy định viên nén bao phim **10 mg chỉ dùng cho ≥ 15 tuổi**, còn lứa tuổi **6–14 tuổi (bao gồm trẻ 12–14 tuổi trong phân hệ này!) bắt buộc dùng viên nén nhai 5 mg × 1 lần/ngày buổi tối**. Hiện `montelukast.json` chỉ khai báo mức `10 mg` (`"Người lớn và trẻ ≥ 15 tuổi: 10 mg"`). Đồng thời ở `SC13` (trẻ 12 tuổi có `depression: true`), tiêu đề rule khuyên *"NGỪNG thuốc"* nhưng `action` lại để `'MONITOR'` thay vì `'STOP'`.
- **Khuyến nghị sửa chữa:** Bổ sung rõ liều 5 mg cho nhóm 12–14 tuổi (kèm gate `age < 15`) trong `montelukast.json` và nâng `action` lên `'STOP'` khi có rối loạn trầm cảm/tâm thần kinh.

#### `ASTHMA-R3-R2-09` [MAJOR] – Hai lỗi logic trong kiểm soát quá liều MART: Báo động giả ở bình xịt Symbicort Rapihaler 80/2.25 mcg (trần 24 nhát) & phát lệnh `[HOLD]` nhầm thuốc trên bệnh nhân Track 2
- **Vị trí:** `src/modules/asthma/helpers.ts:181-185` (`isMartOveruse`), `src/modules/asthma/rules.safety.ts:227`.
- **Phân tích & Thực nghiệm:**
  1. `SC02`: Với Rapihaler `80/2.25 mcg`, GINA 2026 trang 92 (Box 4-8B) quy định trần tối đa là **24 nhát/ngày** (= 72 mcg định liều formoterol). Do `isMartOveruse()` cắt cứng ở `> 12`, bệnh nhân dùng 14 nhát/ngày (mới tương đương 7 nhát chuẩn) bị phát lệnh giả `[HOLD]` + `[REFER]` cấp cứu.
  2. `SC03`: Tại `rules.safety.ts:227`, biểu thức `return hasBudForm || !hasFoster;` luôn đúng khi bệnh nhân không dùng Foster — kể cả bệnh nhân **Track 2** chỉ dùng Seretide + Salbutamol, gây phát lệnh vô lý `[HOLD] Budesonide/Formoterol`!
- **Khuyến nghị sửa chữa:** Trong `isMartOveruse()`, chỉ xét khi bệnh nhân đang thuộc Track 1 hoặc có ICS-formoterol trong `currentMeds`, và nhân đôi trần lên `24 nhát/ngày` khi phát hiện hàm lượng `80/2.25` hoặc `2.25` mcg.

#### `ASTHMA-R3-R2-10` [MAJOR] – Tự mâu thuẫn cảnh báo CYP3A4 đối với Foster (`beclometasone_formoterol`) và dương tính giả ở nội trú không dùng ICS/LABA
- **Vị trí:** `kb/interactions/diabetes_respiratory.json` (`ix.ics_laba_strong_cyp3a4`), `src/modules/asthma/rules.safety.ts` (`asthma.safety.ics_laba_cyp3a4_ddi`).
- **Phân tích & Thực nghiệm:**
  - `SC18A` vs `SC18B`: Rule `rec_asthma_ics_laba_cyp3a4_ddi` khuyên bác sĩ đổi sang **"nền Beclometasone ít phụ thuộc CYP3A4 hơn"**, nhưng khi đổi sang `beclometasone_formoterol` (`SC18B`), `ix.ics_laba_strong_cyp3a4` lại bắn cảnh báo đỏ `[critical:interaction]` Hội chứng Cushing & Kéo dài QT!
  - `SC18C`: Bệnh nhân nội trú cơn hen cấp uống Clarithromycin, chỉ dùng Salbutamol + Prednisolone (0 ICS/LABA) vẫn bị `rec_asthma_ics_laba_cyp3a4_ddi` bắn `[AVOID]` dương tính giả!
- **Khuyến nghị sửa chữa:** Gỡ nhóm Beclometasone khỏi danh sách `critical` trong `ix.ics_laba_strong_cyp3a4` và siết điều kiện `when()` nội trú của `rec_asthma_ics_laba_cyp3a4_ddi` chỉ chạy khi thực sự có thuốc nhạy cảm CYP3A4 trong `currentMeds` hoặc trong đơn xuất viện.

#### `ASTHMA-R3-R2-11` [MAJOR] – Bỏ sót giới hạn loại trừ Dupilumab khi bạch cầu ái toan máu `> 1.500 tế bào/µL` và thiếu cảnh báo tầm soát EGPA / *Strongyloides* ở Bậc 5
- **Vị trí:** `src/modules/asthma/rules.track1.ts:390-415`, `src/modules/asthma/rules.track2.ts:165-210`, `kb/drugs/dupilumab.json`.
- **Bằng chứng:** `GINA_2026_Strategy_Report.pdf` trang 166 (*"Eligibility criteria: blood eosinophils ≥150/µL and ≤1500/µL... Anti-IL4Rα is not suggested for patients with baseline or historic blood eosinophils >1,500 cells/µL"*) & trang 160 (*"blood eosinophils ≥1500/µL, consider causes such as EGPA"*); `FDA_label_dupilumab.pdf` trang 12 & 43. Trong `SC29` (`eos = 1800/µL`), máy vẫn xếp Dupilumab vào nhóm ưu tiên chỉ định mà không cảnh báo loại trừ EGPA.
- **Khuyến nghị sửa chữa:** Thêm ngưỡng `asthma.biologic.dupilumab_eos_max = 1500`; khi `eos > 1500`, không gợi ý Dupilumab (chỉ gợi ý anti-IL5/5Rα hoặc anti-TSLP sau khi tầm soát loại trừ EGPA và nhiễm *Strongyloides*).

#### `ASTHMA-R3-R2-12` [MAJOR] – Còn sót 2 quy tắc dùng `.find()` (`customNamedTimololRule` & `redundantMonoIcsStopRule`) làm lọt lọ Timolol thứ 2 / bình ICS đơn thứ 2 và quên nhóm bình bộ ba
- **Vị trí:** `src/modules/asthma/rules.safety.ts:407` và `808-827`.
- **Bằng chứng (`SC07`):** Bệnh nhân dùng 2 chế phẩm nhỏ mắt chứa Timolol tự nhập tên (`eye_drop_right`, `eye_drop_left`) và 2 bình ICS đơn dư thừa (`budesonide`, `fluticasone_propionate`) trên nền Symbicort chỉ được phát `[STOP]` cho thuốc đầu tiên của mỗi nhóm, để lọt thuốc thứ hai! Ngoài ra `hasComboIcs` tại dòng 808–814 quên kiểm tra `TRIPLE_INHALER_DRUGS`.
- **Khuyến nghị sửa chữa:** Chuyển `redundantMonoIcsStopRule` sang sinh động theo từng thuốc `Array.from(MONO_ICS_DRUGS).map(...)` có bao gồm `TRIPLE_INHALER_DRUGS`; bổ sung các thuốc nhỏ mắt phối hợp Timolol vào `NON_SELECTIVE_BB_DRUGS` và gom đầy đủ mọi thuốc chứa `'timolol'` tự nhập tên.

#### `ASTHMA-R3-R2-13` [MAJOR] – Đứt gãy chuyển đổi chẹn beta chọn lọc beta-1 cho HFrEF nội trú đang dùng Carvedilol & Bản Kế hoạch Hành động Track 2 in sai tên thuốc `Seretide` cho bệnh nhân dùng `Trelegy` / `Dulera`
- **Vị trí:** `src/modules/hf/` (nhánh nội trú) & `src/modules/asthma/rules.track2.ts:515-538`.
- **Bằng chứng:**
  1. `SC20C`: Bệnh nhân HFrEF nội trú (LVEF 28%, huyết động ổn định) đồng mắc hen đang dùng Carvedilol bị `asthma` phát `[STOP] carvedilol` nhưng `hf` nội trú không phát `[SWITCH] bisoprolol` như ở ngoại trú (`SC20B`), gây ngừng đột ngột chẹn beta trên bệnh nhân suy tim!
  2. `SC11A` & `SC29`: Bệnh nhân Bậc 5 đang duy trì `Trelegy Ellipta` được phát `[CONTINUE] Trelegy Ellipta`, nhưng Vùng Xanh Bản Kế hoạch Hành động ngay bên dưới (`rules.track2.ts:528-535`) lại dặn bệnh nhân dùng **`Fluticasone / Salmeterol (Seretide) Accuhaler 500/50 mcg x 2 lần/ngày`**!
- **Khuyến nghị sửa chữa:** Đồng bộ lệnh `[SWITCH]` sang `bisoprolol`/`metoprolol_succinate` trước xuất viện cho HFrEF nội trú ổn định khi BB hiện tại bị chống chỉ định do hen; cập nhật `action_plan_generator` nhận diện đầy đủ Trelegy, Trimbow, Breztri, Mometasone/Formoterol và bậc điều trị hiệu dụng sau tăng/hạ bậc.

#### `ASTHMA-R3-R2-14` [MAJOR] – Thiếu sàng lọc và cảnh báo chống chỉ định bình bột khô (DPI) chứa tá dược lactose ở bệnh nhân dị ứng nặng / phản vệ với đạm sữa bò
- **Vị trí:** `src/modules/asthma/inputs.ts`, `src/modules/asthma/rules.safety.ts`, các tệp DPI trong `kb/drugs/`.
- **Bằng chứng:** Nhãn FDA/EMA (`FDA_label_aclidinium.pdf` trang 1 & trang 3 §4 Contraindications: *"Severe hypersensitivity to milk proteins"*; nhãn Ellipta, Diskus/Accuhaler, Turbuhaler, Breezhaler) chống chỉ định dùng bình bột khô chứa lactose monohydrate ở bệnh nhân dị ứng nặng/phản vệ với protein sữa bò (`SC19A`, `SC19B`).
- **Khuyến nghị sửa chữa:** Bổ sung cờ `customInputs.severeMilkProteinAllergy` trong `inputs.ts` và quy tắc `[AVOID]`/`[SWITCH]` trong `rules.safety.ts` hướng dẫn bắt buộc kê bình xịt định liều pMDI HFA / Respimat SMI không chứa lactose (Symbicort Rapihaler pMDI, Foster pMDI, Seretide Evohaler pMDI, Tiotropium Respimat).

---

### Nhóm MINOR (3 phát hiện) & SUGGESTION (1 phát hiện)

- **`ASTHMA-R3-R2-15` [MINOR] (`kb/drugs/budesonide_glycopyrronium_formoterol.json` + thiếu `kb/drugs/hydrocortisone.json`):**
  1. Theo `FDA_label_budesonide_glycopyrronium_formoterol.pdf` trang 1 & trang 5 (§2.3 Asthma), liều Breztri cho Hen phế quản ≥ 12 tuổi là loại **160/18/4.8 mcg glycopyrrolate (= 160/14.4/4.8 mcg glycopyrronium) × 2 nhát BID** (gấp đôi thành phần LAMA so với hàm lượng COPD 160/7.2/4.8 mcg hiện ghi trong file). Cần bổ sung rõ cả hai hàm lượng COPD vs Hen kèm trích dẫn GINA/FDA.
  2. Bổ sung tệp `kb/drugs/hydrocortisone.json` (100 mg TM theo QĐ 5850/BYT trang 18; tổng 200 mg/ngày chia liều theo GINA 2026 trang 188) để đồng bộ với `mergeConflictGroups.ts:257, 416` và `diabetes_respiratory.json`.
- **`ASTHMA-R3-R2-16` [MINOR] (`kb/thresholds/asthma.json:678-698` & `rules.track2.ts:470-472, 561-563`):**
  - Cập nhật lại trích dẫn cho `asthma.acute.pregnancy_oxygen_target_min` (`95%`) và `max` (`98%`) trỏ đúng vào trang quy định đích SpO₂ thai kỳ của GINA 2026 (gỡ bỏ trích dẫn nhi khoa `"trẻ em 94-98%"` `byt.asthma.2021.acute_iv_steroid_ipratropium`), và xóa phần tử trùng lặp `'byt.asthma.2021.action_plan_zones'` trong `rules.track2.ts`.
- **`ASTHMA-R3-R2-17` [MINOR] (`src/engine/safety/duplicates.ts` – `dup.laba`):**
  - Trong `SC06`, sau khi engine đã phát lệnh `[STOP]` cho toàn bộ các thuốc LABA đơn trị cũ (`salmeterol`, `formoterol`) và `[START] budesonide_formoterol`, bộ kiểm tra trùng lặp vẫn phát cảnh báo giả `[critical:duplicate] dup.laba`. Cần loại trừ triệt để các thuốc đã nhận lệnh `STOP` trước khi tính trùng lặp nhóm.
- **`ASTHMA-R3-R2-18` [SUGGESTION] (Dược động học Theophylline trên Xơ gan/Suy tim & Điều phối Aspirin dự phòng tiền sản giật trên thai phụ AERD):**
  1. Bổ sung cảnh báo giảm mạnh thanh thải gan của `theophylline` ở bệnh nhân có `liverDisease`/`cirrhosis` hoặc `hf` (`SC27` khi không dùng Ciprofloxacin), khuyến cáo chuyển sang ICS-formoterol hoặc theo dõi nồng độ đáy huyết thanh (5–15 mcg/mL).
  2. Bổ sung ghi chú hội chẩn liên chuyên khoa Dị ứng – Sản khoa khi thai phụ vừa có `aerd: true` (`[AVOID] aspirin`) vừa có tăng huyết áp mạn tính thuộc diện cân nhắc dự phòng tiền sản giật (`SC24`).

---

## 5. Kết luận của Kiểm định viên Dược Lâm sàng (R2)

Phân hệ `asthma` đã xây dựng được kiến trúc GINA 2026 Track 1 / Track 2, Kế hoạch hành động 3 vùng màu và nền tảng trích dẫn học thuật rất vững chắc (69/69 trích dẫn chuẩn xác 100%). Tuy nhiên, với **7 lỗi Critical và 7 lỗi Major** được chứng minh thực nghiệm trực tiếp qua `evaluate()` — đặc biệt là bỏ lọt LAMA/Ultibro không ICS, kê đơn Naproxen trên bệnh nhân AERD, truyền `[START]` MgSO₄ 2 g IV trong sốc tụt huyết áp / nhược cơ / trùng liều 6 g tiền sản giật, cho xuất viện thai phụ có SpO₂ 94%, lỗi tắt y lệnh cấp cứu ở preset `preset_asthma_acute_severe_er` và kê trái trần tuổi ≥ 18 cho vị thành niên — phân hệ **chưa đủ điều kiện an toàn dược lâm sàng để thông qua ở Vòng 3 (`verdict: "FAIL"`)**. Đề nghị đội phát triển khắc phục triệt để 14 mục Critical + Major (và hoàn thiện các mục Minor) trước khi nghiệm thu vòng cuối.
