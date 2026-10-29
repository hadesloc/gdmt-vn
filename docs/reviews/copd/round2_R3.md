# Báo cáo Phản biện An toàn Lâm sàng Độc lập – Vòng 2 (Reviewer R3)
## Phân hệ: Bệnh Phổi Tắc Nghẽn Mạn Tính (`copd`)

- **Vai trò**: Reviewer **R3** – Phản biện An toàn Lâm sàng Đối kháng (Independent Adversarial Clinical Safety Reviewer)
- **Vòng duyệt**: Vòng 2 (Round 2 Review Board)
- **Đối chiếu chuẩn y khoa & quy chuẩn kỹ thuật**:
  - **GOLD 2026 Report** (*Global Strategy for Prevention, Diagnosis and Management of COPD – 2026 Report*)
  - **Bộ Y tế Việt Nam – Quyết định 2131/QĐ-BYT (2026)**: *Hướng dẫn chẩn đoán và điều trị Bệnh phổi tắc nghẽn mạn tính*
  - **Quy chuẩn an toàn hệ thống**: `docs/REVIEW_PROTOCOL.md` & `docs/QA_FINDINGS.md` (QA-1 Fail-closed, QA-9 Missing-input safety, QA-10 Cross-module reconciliation)
- **Bộ kịch bản kiểm chứng thực tế (`evaluate()` thật qua Vitest/Vite)**:
  - Script đối kháng: `docs/reviews/copd/scratch/round2_r3_adversarial.ts`
  - Kết quả thực chạy đầy đủ: `docs/reviews/copd/scratch/round2_r3_results_dump.ts`
  - Quy mô kiểm thử: **74 kịch bản bệnh nhân thực chạy** (**12 ca kiểm định hồi quy Vòng 1** + **62 ca đối kháng mới Vòng 2**).

---

## 1. Tóm tắt Điều hành & Bảng Phân loại Phát hiện

Bản cập nhật sau Vòng 1 của phân hệ `copd` đã khắc phục tốt phần lớn các lỗi đơn lẻ ở tầng module (như phân nhóm E với ≥ 1 đợt cấp vừa trong `rules.ts`, chặn khởi trị LAMA/LABA thiếu ICS ở bệnh nhân ACO chưa dùng thuốc, bổ sung tiêu chuẩn Anthonisen cho kháng sinh nội viện, chặn Azithromycin khi dùng Amiodarone/Sotalol, chặn Roflumilast khi xơ gan/nhẹ cân/trầm cảm/mang thai, và tách bạch đợt cấp thật sự với nhập viện vì lý do khác).

Tuy nhiên, khi kiểm thử đối kháng chiều sâu qua **62 ca lâm sàng phức hợp mới** (phác đồ mở đa bình hít, đảo thứ tự mảng `currentMeds`, phối hợp liên phân hệ `['copd', 'asthma']` / `['copd', 'hf']` / `['copd', 'af']`, thiếu khuyết dữ liệu đơn lẻ, chống chỉ định máy thở NIV, bệnh nhân đang dùng chống đông DOAC nhập viện vì đợt cấp, lực hít yếu trên bình DPI, và chuyển đổi profile `US`), hệ thống bộc lộ **6 lỗi Nghiêm trọng (`critical`)** và **6 lỗi Lớn (`major`)** có nguy cơ gây hại trực tiếp cho người bệnh nếu y lệnh được thực thi.

| Mức độ (`severity`) | Số lượng | Mã phát hiện (`id`) |
|---|---:|---|
| **Critical** *(Có thể gây hại trực tiếp cho BN)* | **6** | `R3-R2-COPD-01`, `R3-R2-COPD-02`, `R3-R2-COPD-03`, `R3-R2-COPD-04`, `R3-R2-COPD-05`, `R3-R2-COPD-06` |
| **Major** *(Sai phác đồ / vi phạm fail-closed / lỗi liên module)* | **6** | `R3-R2-COPD-07`, `R3-R2-COPD-08`, `R3-R2-COPD-09`, `R3-R2-COPD-10`, `R3-R2-COPD-11`, `R3-R2-COPD-12` |
| **Minor** *(Ưu tiên hiển thị / rà soát giảm bậc phụ / tóm tắt EMR)* | **3** | `R3-R2-COPD-13`, `R3-R2-COPD-14`, `R3-R2-COPD-15` |
| **Suggestion** *(Cải tiến UX nhập liệu & nhãn trường)* | **1** | `R3-R2-COPD-16` |
| **Tổng cộng** | **16** | **Kết luận Vòng 2: FAIL** |

---

## 2. Kiểm định Hồi quy Vòng 1 (Verification of Round 1 Fixes)

| Mã Vòng 1 | Nội dung cốt lõi | Kịch bản kiểm chứng | Trạng thái Vòng 2 |
|---|---|---|---|
| `R3-COPD-01` | Cấm kê LAMA / LABA+LAMA không ICS ở BN đồng mắc Hen–COPD (`priorAsthma` / `asthma`) | `R1_REG_01`, `R1_REG_02`, `ADV2_16` | **Đạt một phần** – Đã sửa cho BN chưa dùng thuốc, nhưng khi BN ACO đang dùng `[budesonide, tiotropium]` (`ADV2_16`), engine chỉ ngừng `tiotropium`, bỏ sót `budesonide` gây **trùng 2 ICS** (`R3-R2-COPD-01`). |
| `R3-COPD-02` | Nội viện nhưng không có đợt cấp (`acuteExacerbation = false`) bị kê steroid toàn thân & oxy | `R1_REG_03` | **ĐẠT (Verified Fixed)** – Không còn phát nhầm steroid, oxy, kháng sinh hay LMWH khi nhập viện mổ phiên. |
| `R3-COPD-03` | Hòa giải trùng lặp bình hít LAMA/LABA/ICS trong `currentMeds` & khi nâng/hạ bậc | `R1_REG_04`, `ADV2_17..24`, `ADV2_29` | **CHƯA ĐẠT (Incomplete)** – Chỉ ngừng được **1** bình hít cũ đầu tiên; thất bại nặng ở phác đồ mở `[tiotropium, salmeterol]` hoặc `[budesonide_formoterol, tiotropium]`, kèm lỗi `duplicates.ts` xóa mù cảnh báo khi có `SWITCH` (`R3-R2-COPD-01`). |
| `R3-COPD-04` | Chống chỉ định Roflumilast (xơ gan/suy gan, nhẹ cân, trầm cảm/tự sát, thai kỳ) | `R1_REG_05`, `R1_REG_06`, `ADV2_41` | **Đạt phần gan/cân nặng/tâm thần**, nhưng còn sót tương tác chống chỉ định `roflumilast + theophylline` vẫn phát `[CONSIDER] roflumilast` (`R3-R2-COPD-06`). |
| `R3-COPD-05` | Chống chỉ định Azithromycin dài hạn (QTc dài, Amiodarone/Sotalol, giảm thính lực, NTM) | `ADV2_33`, `ADV2_34`, `ADV2_35` | **ĐẠT (Verified Fixed)** – Cả ứng viên mới (`AVOID`) lẫn BN đang uống sẵn (`STOP` + `CRITICAL` alert) đều bị chặn chính xác. |
| `R3-COPD-06` | Chặn leo thang thuốc COPD khi `FEV1/FVC >= 0.70` | `R1_REG_07`, `ADV2_62` | **Đạt ở `copd/rules.ts`**, nhưng `derive.ts` vẫn gán nhầm `goldGrade`/`goldGroup` khi `FEV1/FVC >= 0.70` (`R3-R2-COPD-12`), và `ltot_oxygen` / `ics_monotherapy_stop` vẫn fail-open khi `fev1FvcRatio === undefined` (`R3-R2-COPD-07`). |
| `R3-COPD-07` | Fail-closed khi thiếu `cat` (lúc `mmrc < 2`) hoặc thiếu `moderateExacerbations` (lúc `hosp = 0`) | `ADV2_05`, `ADV2_06`, `ADV2_07` | **ĐẠT ở khởi trị**, nhưng ở theo dõi `LABA+LAMA` khi thiếu `bloodEos` (`ADV2_10`), Roflumilast & Azithromycin vẫn lọt lưới fail-closed (`R3-R2-COPD-08`). |
| `R3-COPD-08` | LTOT khi `SpO2 = 89%` kèm tâm phế mạn / đa hồng cầu | `R1_REG_11` | **ĐẠT (Verified Fixed)**. |
| `R3-COPD-09` / `R1-04` | Kháng sinh nội viện theo tiêu chuẩn Anthonisen (đờm mủ hoặc cần thông khí cơ học) | `R1_REG_09`, `ADV2_50` | **ĐẠT (Verified Fixed)** – Đờm trong hoặc toan chuyển hóa không đờm mủ đều không bị kê kháng sinh. |
| `R3-COPD-10` | Cảnh báo quá liều oxy (`SpO2 > 92%`) trong đợt cấp nội viện | `ADV2_47`, `ADV2_48` | **Đạt cơ bản** (`rec_copd_inpatient_avoid_hyperoxia`), nhưng mới ở mức `MONITOR` thay vì `REDUCE` + thiếu cảnh báo `SafetyAlert` (`R3-R2-COPD-13`), và ngược lại `spo2 === undefined` lại fail-open phát `START` oxy (`R3-R2-COPD-07`). |
| `R3-COPD-11` | Cấm và ngừng đơn trị liệu ICS (`budesonide`) trong COPD đơn thuần | `ADV2_15`, `ADV2_03` | **Đạt khi đã có hô hấp ký**, nhưng vội vàng phát `STOP budesonide` cả khi `fev1FvcRatio === undefined` chưa loại trừ Hen (`R3-R2-COPD-07`). |
| `R3-COPD-12` & `13` | Yêu cầu khí máu động mạch trong đợt cấp nội viện & hoãn đòi hô hấp ký cấp cứu | `ADV2_13` | **ĐẠT (Verified Fixed)**. |
| `R3-COPD-14` | Việt hóa `FIELD_LABELS` cho biến thiếu dữ liệu COPD | `ADV2_01..13`, `ADV2_26` | **Đạt cho biến COPD**; còn sót biến GINA tiếng Anh khi chạy chung `['copd', 'asthma']` (`R3-R2-COPD-16`). |
| `R3-COPD-15` / `R2-01` | Liều chuẩn Breztri / Trimbow `2 nhát x 2 lần/ngày` | `kb/drugs/*.json` | **ĐẠT (Verified Fixed)**. |
| `R3-COPD-16` | Tóm tắt bệnh án `note.ts` thiếu thông số hô hấp & gán cứng theo dõi `RASi/ARNI/MRA` | Toàn bộ 74 ca | **CHƯA SỬA** (`round1_RESPONSE.md` hoãn sửa `src/engine/note.ts` sang Vòng 2 -> ghi nhận `R3-R2-COPD-15`). |
| `COPD-R1-01/02/05/06/07` | SABA/SAMA nội viện, Nhóm E ≥ 1 đợt cấp vừa, Mepolizumab có/không VPQM, Home NIV `PaCO2 > 53`, GOLD 1–4 | `R1_REG_08..12` | **ĐẠT trong `copd/rules.ts`**, nhưng `gold.ts` / `kb/thresholds/copd.json` chưa cập nhật ngưỡng Nhóm E ≥ 1 đợt cấp vừa (`R3-R2-COPD-12`). |

---

## 3. Ma trận 74 Kịch bản Bệnh nhân Đối kháng Thực chạy (`evaluate()`)

Toàn bộ 74 kịch bản trong `docs/reviews/copd/scratch/round2_r3_adversarial.ts` đã được thực thi trực tiếp qua pipeline `evaluate()` thật:

| Nhóm kiểm thử | Mã kịch bản | Số ca | Kết quả nổi bật từ `evaluate()` |
|---|---|---:|---|
| **1. Hồi quy Vòng 1** | `R1_REG_01` → `R1_REG_12` | 12 | Xác nhận 14/16 fix Vòng 1 hoạt động ở trường hợp chuẩn; phát hiện lệch `derived.goldGroup='A'` ở `R1_REG_08` & `derived.goldGrade='GOLD 2'` ở `R1_REG_07` (`FEV1/FVC = 0.72`). |
| **2. Fail-Closed khi thiếu dữ liệu** | `ADV2_01` → `ADV2_14` | 14 | Bắt được **4 lỗ hổng fail-open**: `ADV2_02` (`fev1FvcRatio` trống + `SpO2 86%` -> tự `START` LTOT mạn tính); `ADV2_03` (`fev1FvcRatio` trống + `budesonide` -> tự `STOP budesonide`); `ADV2_10` (`bloodEos` trống trên LABA+LAMA -> tự gợi ý Roflumilast + Azithromycin); `ADV2_12` (`SpO2` trống nội viện -> tự `START` oxy mà không hỏi `SpO2`). |
| **3. Xung đột bình hít & Liên phân hệ `['copd', 'asthma']`** | `ADV2_15` → `ADV2_32` | 18 | Bắt được lỗi chí mạng ở phác đồ mở `ADV2_21` (sót `salmeterol` -> 2 LABA), `ADV2_22` (sót `tiotropium` -> **2 LAMA không cảnh báo**), `ADV2_23` (sót `budesonide_formoterol` -> **không rút được ICS dù viêm phổi tái diễn**), `ADV2_16` (ACO sót `budesonide` -> **2 ICS không cảnh báo**), `ADV2_24` (3 LAMA chỉ ngừng 1), `ADV2_26` (mất sạch thuốc cắt cơn nhanh ở Hen), `ADV2_29` (sót `Seretide`), **`ADV2_30` (kê trùng 2 Corticoid toàn thân `prednisolone` + `methylprednisolone`)**, `ADV2_31` (`duplicates.ts` mù biệt dược `'breztri'`). |
| **4. Đồng mắc Rung nhĩ (Amiodarone/Sotalol), Suy tim (Propranolol/Carvedilol) & Chống chỉ định thuốc** | `ADV2_33` → `ADV2_46` | 14 | Azithromycin bị chặn tốt với Amiodarone/Sotalol (`ADV2_33..35`). Nhưng bắt được: **`ADV2_42` & `ADV2_43` (`START` LMWH chồng lên `Apixaban` / xuất huyết + lọc máu)**; `ADV2_39` (`UPTITRATE bisoprolol` khi đang uống `carvedilol` gây trùng 2 chẹn beta + báo `CRITICAL contraindication` sai cho `carvedilol`); `ADV2_38` (đợt cấp COPD uống `propranolol` không có lệnh `STOP`/`SWITCH`); **`ADV2_46` (dị ứng nặng đạm sữa bò vẫn `START` `Trelegy Ellipta`)**; `ADV2_41` (`CONSIDER roflumilast` ngay trên nền `theophylline`); `ADV2_44` (nhảy cóc 3 thuốc cùng lúc). |
| **5. Nội viện Oxy, Toan–Kiềm, Dụng cụ hít DPI lực hít yếu, Profile `'US'` & `derived`** | `ADV2_47` → `ADV2_62` | 16 | Toan chuyển hóa vừa `pH 7.28, PaCO2 30` (`ADV2_50`) chặn đúng NIV & kháng sinh! Nhưng bắt được: **`ADV2_54` (lơ mơ + sốc `SBP 76`, `pH 7.18` vẫn phát `START` NIV/BiPAP)**; `ADV2_51` (toan chuyển hóa nặng `pH 7.20, PaCO2 24` bị chẩn đoán nhầm là *"Suy thông khí"*); **`ADV2_55..58` (`weakInspiratoryFlow: true` vẫn `START` bình bột khô `Trelegy Ellipta` và không đổi bình DPI đang dùng)**; **`ADV2_59` (`profile = 'US'` xóa trắng 100% khuyến cáo cấp cứu)**; `ADV2_60..62` (4 lỗi `gold.ts` / `derive.ts`). |

---

## 4. Phân tích Chi tiết Các Phát hiện Vòng 2

### 4.1. Nhóm Nghiêm trọng (`CRITICAL` – 6 phát hiện)

#### [R3-R2-COPD-01] Hòa giải đa bình hít chưa triệt để + Lỗi ẩn cảnh báo trùng lặp khi `SWITCH` trong `duplicates.ts`
- **Mức độ**: `critical` | **Loại**: `rule` | **Vị trí**: `src/modules/copd/rules.ts:346-367, 461-504, 518`, `src/engine/merge.ts:673`, `src/engine/safety/duplicates.ts:46-52, 364-385`
- **Phân tích lâm sàng & kỹ thuật**:
  1. Hàm `findSupersededInhalerToStop(ctx)` (`rules.ts:473-502`) duyệt mảng `currentMeds` và `return` ngay ở **bình hít đầu tiên** trùng thành phần, đồng thời luật `copd.safety.stop_superseded_inhaler` chỉ trả về tối đa **1** khuyến cáo `STOP`.
  2. Trong `merge.ts:673`, cơ chế tự sinh `extraSwitchRecs` chỉ chạy khi `r.action === 'START'`, bỏ qua hoàn toàn `UPTITRATE` và `SWITCH`.
  3. Nguy hiểm nhất, tại `src/engine/safety/duplicates.ts:364-366`:
     ```ts
     if (hasInhalerSwitch && isMaintenanceInhalerClasses(baseInfo.classes)) {
       continue;
     }
     ```
     Chỉ cần có **bất kỳ 1 lệnh `SWITCH`** bình hít duy trì, `checkDuplicates()` lập tức giả định **mọi bình hít cũ trong `currentMeds` đều đã được ngừng**, làm tắt hoàn toàn lưới cảnh báo `dup.lama`, `dup.laba`, `dup.ics` ngay cả khi bình hít thứ 2 vẫn còn nguyên hiệu lực!
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_22`** (Phác đồ ba mở `[budesonide_formoterol, tiotropium]` + `priorPneumonia: true`): Engine phát `[STOP] budesonide_formoterol` + `[SWITCH] tiotropium_olodaterol` (Spiolto), **không ngừng `tiotropium` (Spiriva)** → bệnh nhân hít đồng thời Spiriva + Spiolto (**gấp đôi liều LAMA = 10 mcg Tiotropium/ngày**, nguy cơ bí tiểu cấp, tăng nhãn áp góc đóng, loạn nhịp) và **`ALERTS: (NONE)`**!
  - **`ADV2_23`** (Cùng bệnh nhân trên nhưng đảo thứ tự mảng `[tiotropium, budesonide_formoterol]`): Engine chỉ `[STOP] tiotropium` + `[SWITCH] tiotropium_olodaterol`, **bỏ sót `budesonide_formoterol`** → **thất bại hoàn toàn việc rút ICS ở BN viêm phổi tái diễn** kèm **trùng 2 LABA** (Formoterol + Olodaterol) và **`ALERTS: (NONE)`**!
  - **`ADV2_21`** (Phác đồ đôi mở `[tiotropium, salmeterol]` nâng bậc lên `Trelegy Ellipta`): Chỉ ngừng `tiotropium`, bỏ sót `salmeterol` → trùng 2 LABA.
  - **`ADV2_16`** (ACO `priorAsthma: true` đang dùng `[budesonide, tiotropium]`): `rules.ts:486` bỏ qua ICS đơn chất còn `rules.ts:518` tắt `ics_monotherapy_stop` khi có hen → chỉ ngừng `tiotropium`, giữ nguyên `budesonide` bên cạnh `Trelegy Ellipta` (**trùng 2 ICS, `ALERTS: (NONE)`**).
  - **`ADV2_29`** (`['copd', 'asthma']` đang dùng `fluticasone_salmeterol` Seretide): Phát `[UPTITRATE] budesonide_formoterol` + `[START] tiotropium`, không ngừng `Seretide` → trùng 2 ICS + 2 LABA.
  - **`ADV2_24`** (3 thuốc LAMA `[tiotropium, umeclidinium, umeclidinium_vilanterol]`): Chỉ ngừng 1 thuốc (`umeclidinium`), còn nguyên 2 LAMA.
  - **`ADV2_31`** (`drugId: 'breztri'` + `'tiotropium'`): `duplicates.ts` thiếu khóa `'breztri'` nên `ALERTS: (NONE)`; ngược lại ở `ADV2_28` & `ADV2_36`, `duplicates.ts:381` cộng ngược thuốc cũ trên lệnh `switch_old_*` của `merge.ts` gây cảnh báo giả.
- **Hướng khắc phục**: Quét và sinh lệnh `STOP` tường minh cho **toàn bộ** bình hít cũ bị thay thế trong `merge.ts` (áp dụng cho cả `START`, `UPTITRATE`, `SWITCH`); xóa bỏ đoạn giả định mù ở `duplicates.ts:364-366` (chỉ loại đúng `drugId` đã có lệnh ngừng tường minh); bổ sung `'breztri'` vào `duplicates.ts`.

---

#### [R3-R2-COPD-02] Kê đơn `START` LMWH dự phòng VTE vô điều kiện chồng lên thuốc chống đông liều điều trị (`Apixaban`), xuất huyết hoặc suy thận lọc máu
- **Mức độ**: `critical` | **Loại**: `rule` | **Vị trí**: `src/modules/copd/rules.ts:2318-2341` (`copd.inpatient.vte_prophylaxis`)
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_42`** (Đợt cấp COPD nội viện + Rung nhĩ đang uống `apixaban 5 mg x 2 lần/ngày`, `onAnticoagulant: true`): Vẫn xuất `[START] id=rec_copd_vte_prophylaxis | Dự phòng thuyên tắc huyết khối tĩnh mạch (VTE) bằng Heparin trọng lượng phân tử thấp` với `ALERTS: (NONE)`. Vì khuyến cáo không gắn `drugId`, cả `gates.ts` lẫn `dup.anticoagulant` đều bị vô hiệu hóa → nguy cơ xuất huyết nội sọ / tiêu hóa tử vong khi tiêm thêm Enoxaparin trên nền DOAC!
  - **`ADV2_43`** (`bleedingHistory: true, onDialysis: true, scr: 520 µmol/L` [eGFR ~9 mL/phút]): Vẫn phát `[START]` LMWH thay vì dự phòng cơ học (IPC / tất áp lực) hoặc UFH chỉnh liều.
- **Hướng khắc phục**: Chặn `START` LMWH khi bệnh nhân đã dùng thuốc chống đông (`apixaban`, `rivaroxaban`, `dabigatran`, `edoxaban`, `warfarin`, `enoxaparin`, `heparin` hoặc `conditions.onAnticoagulant`); chuyển sang dự phòng cơ học (`AVOID` LMWH) khi có xuất huyết hoạt động/`bleedingHistory`; cảnh báo chuyển sang UFH hoặc chỉnh liều thận khi `eGFR < 30 mL/phút` / lọc máu.

---

#### [R3-R2-COPD-03] Chỉ định `START` thở máy không xâm nhập (`NIV / BiPAP`) ngay khi có chống chỉ định tuyệt đối (rối loạn ý thức + sốc tụt huyết áp)
- **Mức độ**: `critical` | **Loại**: `rule` | **Vị trí**: `src/modules/copd/rules.ts:2210-2246` (`copd.inpatient.niv_bipap`)
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_54`** (`abgPh: 7.18, abgPaco2: 75, restingSpo2: 80, alteredMentalStatus: true, sbp: 76`): Engine vẫn phát `[START] id=rec_copd_inpatient_niv | Chỉ định thở máy không xâm nhập (NIV / BiPAP) cấp cứu (pH 7.18 ≤ 7.35)`.
  - Theo **GOLD 2026 (Table 4.7)** và **BYT QĐ 2131/QĐ-BYT 2026 (tr. 42–43)**, rối loạn ý thức nặng / mất khả năng bảo vệ đường thở và sốc huyết động là **tiêu chuẩn loại trừ / chống chỉ định của NIV**, bắt buộc đặt nội khí quản thở máy xâm nhập (IMV) ngay lập tức. Kê `START NIV` trong bối cảnh này gây chậm trễ đặt ống nội khí quản, sặc dịch dạ dày vào phổi và ngừng tim.
- **Hướng khắc phục**: Trong `copd.inpatient.niv_bipap`, loại trừ các ca có `alteredMentalStatus === true`, `sbp < 90` (sốc huyết động), hoặc ngừng thở; thay bằng khuyến cáo `AVOID` NIV và chỉ định đặt nội khí quản thở máy xâm nhập khẩn cấp tại ICU.

---

#### [R3-R2-COPD-04] Mâu thuẫn dụng cụ hít ở bệnh nhân có lưu lượng đỉnh hít vào yếu (`weakInspiratoryFlow: true` / `inspiratoryFlowWeak: true`): Tự kê bình bột khô DPI `Trelegy Ellipta` và bỏ mặc BN đang thất bại trên DPI
- **Mức độ**: `critical` | **Loại**: `rule` | **Vị trí**: `src/modules/copd/rules.ts:888, 1012, 1146, 1296, 1335, 1461, 1889-1913`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_57`** (`weakInspiratoryFlow: true`, Nhóm E, `bloodEos: 380`): Engine phát **`[START] fluticasone_furoate_umeclidinium_vilanterol` (`Hít 1 liều Trelegy Ellipta` – bình bột khô DPI!)** ngay cùng lúc với `[MONITOR] rec_copd_device_smi_spacer` ghi rõ *"Tránh dùng bình hít bột khô (DPI như Breezhaler, Ellipta, Turbuhaler)"*! Khi PIF < 60 L/phút, bệnh nhân không đủ lực hít tách hạt thuốc khỏi lactose trong bình Ellipta, dẫn tới thất bại điều trị hoàn toàn — trong khi KB đã có sẵn bình xịt pMDI `budesonide_glycopyrronium_formoterol` (`Breztri Aerosphere`) dùng kèm buồng đệm!
  - **`ADV2_55`** & **`ADV2_56`** (`weakInspiratoryFlow: true` đang khó thở mMRC 3 trên DPI `Anoro Ellipta` hoặc còn đợt cấp trên DPI `Trelegy Ellipta`): **0 khuyến cáo `SWITCH`** sang SMI (`Spiolto Respimat`) hoặc pMDI + buồng đệm (`Breztri Aerosphere`).
  - **`ADV2_58`** (`inspiratoryFlowWeak: true` trên `Ultibro Breezhaler`): Bị bỏ qua hoàn toàn (không sinh cả dòng `MONITOR`).
- **Hướng khắc phục**: Hỗ trợ cả hai khóa `weakInspiratoryFlow` / `inspiratoryFlowWeak`; khi lực hít yếu, tự động chọn `budesonide_glycopyrronium_formoterol` (pMDI + buồng đệm) cho mọi luật Triple therapy và chủ động sinh lệnh `SWITCH` + `STOP` khi BN lực hít yếu đang dùng bất kỳ bình DPI nào (`umeclidinium_vilanterol`, `glycopyrronium_indacaterol`, `fluticasone_furoate_umeclidinium_vilanterol`, `fluticasone_vilanterol`).

---

#### [R3-R2-COPD-05] Kê trùng lặp 2 thuốc Corticoid toàn thân (`Prednisolone 40 mg` + `Methylprednisolone 40 mg IV`) khi chạy đồng thời `['copd', 'asthma']` nội viện
- **Mức độ**: `critical` | **Loại**: `rule` | **Vị trí**: `src/modules/copd/rules.ts:2125-2155`, `src/engine/merge.ts`, `src/engine/safety/duplicates.ts`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_30`** (`selectedModules: ['copd', 'asthma']`, đợt cấp nội viện `SpO2 87%, pH 7.33, PaCO2 50`): Kế hoạch điều trị phát đồng thời cả `[START] prednisolone (40 mg uống/ngày)` lẫn `[START] methylprednisolone (40 mg tiêm tĩnh mạch)` (~90 mg prednisone tương đương/ngày) với `ALERTS: (NONE)`.
- **Hướng khắc phục**: Thêm nhóm loại trừ `systemic_corticosteroid` (`prednisolone`, `prednisone`, `methylprednisolone`, `hydrocortisone`, `dexamethasone`) vào `CLASS_CONFLICT_GROUPS` của `merge.ts` và `DUPLICATE_CLASS_RULES` của `duplicates.ts`.

---

#### [R3-R2-COPD-06] Bỏ lọt chống chỉ định tuyệt đối trong KB: Dị ứng nặng đạm sữa bò vẫn kê `Trelegy Ellipta`, tăng nhãn áp góc đóng không cảnh báo khi kê `Tiotropium`, và vẫn gợi ý `Roflumilast` trên nền `Theophylline`
- **Mức độ**: `critical` | **Loại**: `drug` | **Vị trí**: `src/engine/safety/gates.ts`, `src/modules/copd/rules.ts:287-317`, `kb/drugs/fluticasone_furoate_umeclidinium_vilanterol.json`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_46`** (`severe_milk_protein_allergy: true`): Vẫn phát `[START] fluticasone_furoate_umeclidinium_vilanterol (Trelegy Ellipta)` với `ALERTS: (NONE)` dù `kb/drugs/fluticasone_furoate_umeclidinium_vilanterol.json` đã khai báo `"contraindications": ["severe_milk_protein_allergy"]` (nguy cơ sốc phản vệ do vết protein sữa trong tá dược lactose của DPI!).
  - **`ADV2_45`** (`narrowAngleGlaucoma: true, urinaryRetention: true`): Phát `[START] tiotropium` với `ALERTS: (NONE)`.
  - **`ADV2_41`** (Đang uống `theophylline`): Vẫn phát `[CONSIDER] roflumilast` ngay bên cạnh cảnh báo `! [CRITICAL:interaction] ix.roflumilast_theophylline`.
- **Hướng khắc phục**: Bổ sung cổng chặn đối chiếu tự động `drug.contraindications` trong `gates.ts` (chặn DPI chứa lactose khi dị ứng đạm sữa bò và chuyển sang pMDI `budesonide_glycopyrronium_formoterol`; gắn cảnh báo thận trọng/chống chỉ định cho LAMA khi tăng nhãn áp góc đóng / bí tiểu); bổ sung kiểm tra `theophylline` vào `getRoflumilastContraReasons()` để phát `AVOID` thay vì `CONSIDER`.

---

### 4.2. Nhóm Lỗi Lớn (`MAJOR` – 6 phát hiện)

#### [R3-R2-COPD-07] Ba vi phạm Fail-Closed (`QA-1` / `QA-9`) khi thiếu `SpO₂` hoặc thiếu `fev1FvcRatio`
- **Vị trí**: `src/modules/copd/rules.ts:520, 1953, 1995, 2077`
- **Bằng chứng thực chạy `evaluate()`**:
  1. **`ADV2_12` & `ADV2_49`**: `copd.inpatient.controlled_oxygen` (`return spo2 === undefined || spo2 <= 92`) phát `[START] Thở oxy có kiểm soát` ngay cả khi **chưa nhập `SpO₂` (`undefined`)** (và không có luật yêu cầu nhập `SpO₂`), cũng như khi **`restingSpo2 = 91%` trên khí trời** (đã đạt đích `88–92%`, thở thêm oxy dễ gây quá liều oxy ứ CO₂).
  2. **`ADV2_02`**: Khi `fev1FvcRatio === undefined` và `restingSpo2 = 86%`, `copd.nonpharm.ltot_oxygen` (`if (fev1Fvc !== undefined && fev1Fvc >= 0.70) return false`) fail-open phát thẳng `[START] Chỉ định Oxy trị liệu dài hạn tại nhà (LTOT ≥ 15 giờ/ngày, đích 88–92%)` dù chưa có hô hấp ký chẩn đoán COPD! (Lỗi tương tự tại `home_niv` dòng 1995).
  3. **`ADV2_03`**: Khi `fev1FvcRatio === undefined` trên bệnh nhân đang dùng `budesonide`, `copd.safety.ics_monotherapy_stop` phát ngay `[STOP] NGỪNG đơn trị liệu ICS (Pulmicort)` trước khi đo hô hấp ký phân biệt COPD hay Hen phế quản (nếu thực chất là Hen phế quản, ngừng ICS đơn độc gây cơn hen nguy kịch!).

#### [R3-R2-COPD-08] Nhảy cóc bậc điều trị (Escalation Stacking) và lách kiểm tra thiếu `bloodEos` trên nền `LABA + LAMA`
- **Vị trí**: `src/modules/copd/rules.ts:1502-1503, 1617-1618`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_10`** (Đang dùng `tiotropium_olodaterol`, **`bloodEos` trống**): Trong khi hệ thống yêu cầu nhập `bloodEos` để xét thêm ICS, nó lại fail-open gợi ý luôn `[CONSIDER] roflumilast` + `[CONSIDER] azithromycin`!
  - **`ADV2_44`** (Đang dùng `tiotropium_olodaterol`, `bloodEos = 350 /µL`, 1 đợt cấp vừa): Hệ thống phát đồng thời cả 3 thuốc nâng bậc: `[UPTITRATE] Trelegy Ellipta` + `[CONSIDER] Roflumilast` + `[CONSIDER] Azithromycin` (trái GOLD 2026 Fig. 3.11 & BYT 2131 tr. 25: khi BCAT ≥ 100 /µL trên LABA+LAMA, phải nâng lên Triple trước, chỉ xét Roflumilast/Azithromycin nếu vẫn tái phát đợt cấp trên Triple hoặc khi BCAT < 100 /µL không dùng được ICS).

#### [R3-R2-COPD-09] Xử lý thuốc Chẹn Beta (`Propranolol`, `Sotalol`, `Carvedilol`) mâu thuẫn giữa COPD và Suy tim / Rung nhĩ
- **Vị trí**: `src/engine/safety/interactions.ts:180-188`, `src/engine/safety/reviewMeds.ts:477`, `src/engine/merge.ts:673`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_39`** (`['copd', 'hf']`, HFrEF `LVEF 32%` đang uống `carvedilol 12.5 mg`): Engine phát `[UPTITRATE] bisoprolol` (thuốc BN không dùng!) mà **không ngừng `carvedilol`** → để lại **2 thuốc chẹn beta song song** (`dup.bb: [carvedilol, bisoprolol]`), đồng thời phát cảnh báo `CRITICAL contraindication` cho `carvedilol` (trái ESC HF 2021/2026 & GOLD 2026: chẹn beta không chống chỉ định ở COPD; nhóm chọn lọc beta-1 được ưu tiên hơn carvedilol nhưng carvedilol không phải chống chỉ định tuyệt đối ở COPD không kèm hen).
  - **`ADV2_34`, `ADV2_37`, `ADV2_38`**: Ở BN COPD (kể cả đợt cấp co thắt phế quản nặng đang khí dung `salbutamol` trong `ADV2_38`) đang uống chẹn beta không chọn lọc `propranolol` hoặc `sotalol`, `plan.recommendations` có **0 khuyến cáo `STOP`/`SWITCH`** (do `reviewMeds.ts:477` chỉ kiểm tra `asthma` mà bỏ quên `copd`). Ngoài ra ở `ADV2_36`, tiêu đề `switch_old_propranolol_for_bisoprolol` lại khuyên BN COPD đổi sang *"Bisoprolol (hoặc Carvedilol, Metoprolol succinate)"*.

#### [R3-R2-COPD-10] Chẩn đoán nhầm Toan chuyển hóa nặng (`pH = 7.20, PaCO2 = 24 mmHg`) thành "Suy thông khí đe dọa tính mạng / toan hô hấp nặng"
- **Vị trí**: `src/modules/copd/rules.ts:2293-2312` (`copd.inpatient.icu_transfer`)
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_51`** (`abgPh: 7.20, abgPaco2: 24, hco3: 9` – toan chuyển hóa nặng có nhịp thở Kussmaul giảm CO₂ bù trừ): `icu_transfer` chỉ kiểm tra `ph <= 7.25` mà không kiểm tra `PaCO2`, nên phát tiêu đề *"Chuyển Khoa Hồi sức tích cực (ICU) – Suy thông khí đe dọa tính mạng (pH 7.2)"* và rationale *"Đợt cấp COPD rất nặng có toan hô hấp nặng (pH ≤ 7.25)"*.
  - **`ADV2_14`** (`abgPh: 7.22, abgPaco2: undefined`): Khẳng định *"Suy thông khí đe dọa tính mạng"* cùng lúc yêu cầu *"Cần làm Khí máu động mạch"*.
  - **`ADV2_50`** (`abgPh: 7.28, abgPaco2: 30`): Tuy đã chặn đúng NIV và kháng sinh, nhưng không phát cảnh báo tầm soát nguyên nhân toan chuyển hóa cấp (nhiễm khuẩn huyết/lactate, DKA, suy thận cấp).

#### [R3-R2-COPD-11] Tê liệt 100% khuyến cáo COPD khi chọn `profile = 'US'` + Lỗi mất thuốc cắt cơn nhanh khi chạy chung `['copd', 'asthma']` lúc chưa nhập câu hỏi GINA
- **Vị trí**: `src/modules/copd/rules.ts` (toàn bộ 37 luật khai báo `profiles: ['INTL', 'VN']` và hàm `willAsthmaModulePrescribeIcsLaba` dòng 138–161)
- **Bằng chứng thực chạy `evaluate()`**:
  - **`ADV2_59`** (`settings.profile = 'US'`, suy hô hấp cấp `SpO2 82%, pH 7.24, PaCO2 64`): Trả về **`RECS: (NONE)`, `ALERTS: (NONE)`** – xóa trắng 100% y lệnh cấp cứu!
  - **`ADV2_26`** (`['copd', 'asthma']`, `currentMeds: [salbutamol]`, `sabaOnly: true`, chưa trả lời 4 câu hỏi GINA): `asthma` phát `[STOP] salbutamol` trong khi `copd` tự ý `[START] Trelegy Ellipta` (vilanterol không cắt cơn được), khiến BN Hen mất sạch thuốc cắt cơn nhanh.

#### [R3-R2-COPD-12] Bốn lỗi tính toán phân tầng GOLD trong `gold.ts`, `kb/thresholds/copd.json` và `derive.ts`
- **Vị trí**: `kb/thresholds/copd.json:81`, `src/engine/calculators/gold.ts:64-82`, `src/engine/derive.ts:109-135`, `src/modules/copd/rules.ts:87`
- **Bằng chứng thực chạy `evaluate()`**:
  1. **`R1_REG_08` & `ADV2_60`** (1 đợt cấp vừa, 0 nhập viện): `kb/thresholds/copd.json` vẫn giữ ngưỡng cũ `moderateExacerbationsThreshold: 2` → `derived.goldGroup = 'A'` mâu thuẫn trực tiếp với khuyến cáo *"Khởi trị Nhóm E"* của `rules.ts`!
  2. **`ADV2_61`** (`mMRC = 3 >= 2`, `CAT = 8 < 10`): Lỗi `if (cat !== undefined) ... else if (mmrc !== undefined)` trong `gold.ts:71-75` bỏ qua `mMRC` khi có `CAT` → trả về `derived.goldGroup = 'A'` trong khi `rules.ts` xếp Nhóm B!
  3. **`ADV2_62`** (`fev1FvcRatio = 0.78` – không bị COPD, thiếu sạch `mmrc`/`cat`/`exacerbations`): `derive.ts` tự gán `?? 0` cho đợt cấp và không kiểm tra `fev1FvcRatio < 0.70`, vẫn xuất `goldGrade = 'GOLD 2', goldGroup = 'A'`!
  4. **`ADV2_08`**: `derive.ts` đọc `patient.copdExacerbations` nhưng `copd/rules.ts` bỏ qua trường này.

---

### 4.3. Nhóm Nhỏ & Đề xuất Cải tiến (`MINOR` & `SUGGESTION` – 4 phát hiện)

- **[R3-R2-COPD-13] (`minor` – `copd.inpatient.hyperoxia_warning` / ưu tiên nội viện)**: Trong `ADV2_47`/`ADV2_48` (`SpO2 = 96%` kèm toan hô hấp `pH 7.32, PaCO2 58`), hệ thống chỉ phát `[MONITOR]` thay vì hành động `REDUCE` kèm `SafetyAlert` cảnh báo nguy cơ ứ CO₂ do thở oxy quá liều; đồng thời ở ca sốc nguy kịch `ADV2_54`, tiêm chủng Zona/RSV ngoại trú và checklist xuất viện vẫn hiển thị lẫn vào y lệnh hồi sức.
- **[R3-R2-COPD-14] (`minor` – `copd.followup.ics_de_escalation`)**: Trong `ADV2_32`, bệnh nhân COPD đơn thuần (không hen, 0 đợt cấp, `mMRC 1, CAT 7, BCAT = 50 /µL`, chưa viêm phổi) đang dùng `fluticasone_salmeterol` sai chỉ định ban đầu chưa được gợi ý rút ICS theo GOLD 2026.
- **[R3-R2-COPD-15] (`minor` – `src/engine/note.ts`, tồn đọng từ `R3-COPD-16`)**: Mục 1–2 của phiếu tóm tắt bệnh án vẫn thiếu toàn bộ thông số hô hấp (`SpO₂`, `FEV₁/FVC`, `FEV₁%`, `GOLD`, `mMRC`, `CAT`, `BCAT`, `pH`, `PaCO₂`) và Mục 5 vẫn in cứng câu theo dõi thận/kali cho thuốc `RASi/ARNI/MRA` trên cả 74/74 ca COPD đơn thuần.
- **[R3-R2-COPD-16] (`suggestion` – `src/modules/copd/inputs.ts` & `src/engine/require.ts`)**: Đề xuất bổ sung nút gạt `onSupplementalOxygen` (*"Đang thở oxy bổ sung"*) để tách bạch `SpO2 = 91–96%` tự nhiên trên khí trời với `SpO2 = 96%` do quá liều oxy, và Việt hóa các khóa GINA (`daytimeSymptomsMoreThanTwiceWeek`...) trong `FIELD_LABELS`.

---

## 5. Kết luận Duyệt Vòng 2 (Final Verdict)

Với **6 phát hiện mức `critical`** (trùng lặp LAMA/LABA/ICS không ngừng hết và bị tắt cảnh báo khi `SWITCH`; kê LMWH chồng lên thuốc chống đông DOAC / xuất huyết / lọc máu; kê NIV khi có chống chỉ định lơ mơ + sốc; tự kê bình bột khô DPI `Trelegy Ellipta` cho bệnh nhân lực hít yếu; kê trùng 2 Corticoid toàn thân khi đồng mắc Hen–COPD nội viện; bỏ lọt chống chỉ định phản vệ đạm sữa bò của `Trelegy Ellipta` và tương tác `Roflumilast + Theophylline`) cùng **6 phát hiện mức `major`**, phân hệ `copd` chưa đủ điều kiện an toàn lâm sàng để thông qua Vòng 2.

**KẾT LUẬN CUỐI CÙNG: FAIL** *(6 critical, 6 major, 3 minor, 1 suggestion)*
