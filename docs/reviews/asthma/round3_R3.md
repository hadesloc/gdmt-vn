# BÁO CÁO KIỂM THỬ ĐỐI KHÁNG AN TOÀN LÂM SÀNG ĐỘC LẬP — VÒNG 3 (ROUND 3)
## Phân hệ: Hen phế quản người lớn & thanh thiếu niên ≥ 12 tuổi (`asthma`)

- **Vai trò kiểm định**: Reviewer **R3** — Independent Adversarial Clinical Safety Tester
- **Vòng duyệt**: Vòng 3 (`round: 3`) — Kiểm định độc lập (không tham khảo `round3_R1` / `round3_R2`, chế độ chỉ đọc tuyệt đối trên `src/**`, `kb/**`, `tests/**`, `tools/**`)
- **Số lượt chạy thực tế `evaluate()`**: **92 lượt chạy trực tiếp** (`90` kịch bản đối kháng `S01`–`S90` + đối chiếu đa hồ sơ `INTL` / `VN` / `US` và đơn vị đo `µmol/L` vs `mg/dL`)
- **Tài liệu chuẩn đối chiếu**:
  - **GINA 2026**: *Global Strategy for Asthma Management and Prevention* (Track 1 AIR/MART, Track 2, Box 4-6, Box 4-8, Box 4-13, Section 6 ACO, Section 7 AERD & Thai kỳ, Section 9 Box 9-2 / 9-3 / 9-5 / 9-6 / 9-7)
  - **Bộ Y tế Việt Nam**: Quyết định **1851/QĐ-BYT** (2020 — Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi) & Quyết định **5850/QĐ-BYT** (2021 — Xử trí cơn hen phế quản cấp và Bản kế hoạch hành động hen 3 vùng màu)
  - **Liên phân hệ**: GOLD 2026 / QĐ 2131/QĐ-BYT (`copd`), ESC HF 2021/2026 (`hf`), ACR/EULAR (`gout`), ESC 2024 / VSH 2022 (`htn`, `af`), FDA/EMA/BYT SmPC
- **Phán quyết Vòng 3 (`verdict`)**: ❌ **`FAIL` (CHƯA ĐẠT AN TOÀN LÂM SÀNG ĐỂ PHÁT HÀNH)**

---

## 1. Tóm tắt Điều hành & Thống kê Lỗi

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã phát hiện (`id`) | Tác động lâm sàng cốt lõi |
| :--- | :---: | :--- | :--- |
| 🔴 **CRITICAL** | **4** | `ASTHMA-R3-R3-01` .. `04` | Mù cơn hen cấp nặng tại Ngoại trú & hỏng Preset cấp cứu số 5, kê hạ bậc ngừng ICS + khởi trị `bisoprolol` giữa cơn ngừng thở; kê `Naproxen` cắt cơn gút trên bệnh nhân hen nhạy cảm NSAID (`AERD`); xếp nhầm mạch chậm `HR=44` / thở ngáp `RR=8` / toan máu `pH=7.22` / `abgPaco2=62` vào hen nhẹ–trung bình; mâu thuẫn y lệnh Oxy trực diện (`93–95%` vs `88–92%`) ở `[asthma + copd]`. |
| 🟠 **MAJOR** | **8** | `ASTHMA-R3-R3-05` .. `12` | Viết ngược ID `glycopyrronium_indacaterol` (Ultibro) + tắt `STOP` LABA-không-ICS ở nội viện + bỏ lọt LAMA đơn độc; cho phép trẻ `12–17 tuổi` tiếp tục dùng bộ ba cố định (`≥ 18 tuổi`); kê bình bột khô DPI chứa lactose/protein sữa cho bệnh nhân dị ứng nặng đạm sữa bò; tước LAMA Bậc 5 & xuất viện sớm khi `PEF=55%`; sót `.find()` & bộ ba ở trùng lặp ICS/LABA; lệch pha Đơn thuốc vs Bản Kế hoạch Hành động ở Track 2 + vi phạm fail-closed; tự mâu thuẫn CYP3A4 (`ritonavir` + `budesonide_formoterol`); thiếu cảnh báo ống ngậm miệng bảo vệ mắt khi khí dung `ipratropium` trên nền glôcôm góc đóng. |
| 🟡 **MINOR** | **3** | `ASTHMA-R3-R3-13` .. `15` | Báo động giả quá liều MART ở nhát thứ 14 của bình nửa hàm lượng `Rapihaler 80/2.25 mcg` (trần đúng là 24 nhát/ngày); bệnh nhân hen ổn định nằm viện vì bệnh khác nhận 0 khuyến cáo duy trì ICS nền + tiêu đề Bậc 5 vẫn ghi *"Phối hợp thêm LAMA"* khi đã có LAMA; xuất song song 2 kháng thể đơn dòng (`dupilumab` + `mepolizumab`) trong `[asthma + copd]`. |
| 🔵 **SUGGESTION** | **1** | `ASTHMA-R3-R3-16` | Bổ sung trường chọn hàm lượng/dụng cụ ICS-formoterol (`160/4.5` vs `80/2.25` vs `100/6`) và công tắc sàng lọc nhanh `severeMilkProteinAllergy` / `narrowAngleGlaucoma` vào `asthmaInputs`. |
| **TỔNG CỘNG** | **16** | | **4 Critical · 8 Major · 3 Minor · 1 Suggestion** |

---

## 2. Kiểm chứng Hồi quy Vòng 2 (Round 2 Regression Audit)

Toàn bộ các điểm gãy an toàn từng ghi nhận ở Vòng 2 đã được chạy lại thực tế qua `evaluate()` để xác minh sửa thật hay chỉ vá bề mặt:

| Hạng mục Vòng 2 | Kịch bản kiểm chứng Vòng 3 | Kết quả thực chạy `evaluate()` | Đánh giá |
| :--- | :---: | :--- | :---: |
| Bảo toàn liều cấp cứu khí dung SABA / Corticoid TM khi thuốc đã có trong `currentMeds` (`resolveAcuteMedAction` -> `UPTITRATE`) | `S07` | Giữ nguyên vẹn `Salbutamol khí dung 5 mg mỗi 20 phút + Oxy 93–95%` và `Methylprednisolone 40 mg TM` | ✅ **ĐÃ SỬA TRIỆT ĐỂ** |
| Dấu hiệu đe dọa tính mạng (`silentChest`, `drowsy_confused`, `unable`) chiếm quyền ưu tiên tuyệt đối dù tích nhầm `good_response` | `S09` | Phát đủ gói ICU + 4 thuốc hồi sức, chặn xuất viện nhầm | ✅ **ĐÃ SỬA TRIỆT ĐỂ** |
| Chặn nâng bậc mù quáng khi sai kỹ thuật hít (`inhalerTechniqueCorrect: false`) hoặc kém tuân thủ (`goodAdherence: false`) | `S79` | Phát `rec_asthma_check_technique_first` (`p=90`) + `CONTINUE` Bậc 3, không nâng lên Bậc 4 | ✅ **ĐÃ SỬA TRIỆT ĐỂ** |
| Tôn trọng bình `beclometasone_formoterol` (Foster 100/6 mcg) ở Track 1 không ép đổi nhầm sang Symbicort | `S11` | `CONTINUE beclometasone_formoterol`, `0` cảnh báo `dup.ics`, trần SmPC 8 nhát vs GINA 12 nhát hiển thị chuẩn (`S33`) | ✅ **ĐÃ SỬA TRIỆT ĐỂ** |
| Chuyển từ `.find()` sang tách rule theo từng thuốc cho Chẹn beta không chọn lọc (kể cả nhỏ mắt Timolol), An thần/Opioid, SABA đơn độc, NSAID trên nền AERD | `S13`, `S38`, `S43`, `S53`, `S54` | Phát đủ `STOP` cho cả `propranolol` + `timolol_ophthalmic` (`S13`), `naproxen` + `aspirin` (`S38`), `morphine` + `diazepam` (`S54`) | ⚠️ **ĐẠT 80% — CÒN SÓT** ở `redundantMonoIcsStopRule` (`S69`) & `duplicate_laba_prohibited` (`S90`) |
| Chuyển đổi `carvedilol` sang `bisoprolol` ở bệnh nhân ngoại trú ổn định `[asthma + hf]` và tránh `labetalol` TM ở sản giật/xuất huyết não `[asthma + htn]` | `S40`, `S44`, `S45` | Ngoại trú ổn định chuyển `SWITCH bisoprolol (switchFrom=carvedilol)`; cấp cứu THA tự động dùng `nicardipine` TM thay `labetalol` TM | ✅ **ĐÃ SỬA TỐT** (nhưng `hf` vẫn khởi trị `bisoprolol` giữa cơn hen nguy kịch ở `S42`/`S74`!) |
| Giảm liều `MgSO4` xuống `1 g` và cảnh báo tích lũy ở suy thận nặng CKD G5 (`eGFR < 15`), kể cả khi nhập Creatinin theo đơn vị Mỹ `mg/dL` | `S15`, `S31` | `scr=450 µmol/L` (`eGFR=9.4`) và `scr=6.2 mg/dL` (`eGFR=7.1`) đều giảm liều chuẩn xác về `1 g` kèm gate thận | ✅ **ĐÃ SỬA TRIỆT ĐỂ** |
| Bảo vệ thai kỳ: Đích `SpO2 95–98%` + theo dõi tim thai trong cơn cấp (`S19`), chặn hạ bậc khi mang thai (`S62`) nhưng vẫn cho phép nâng bậc khi không kiểm soát (`S63`) | `S19`, `S62`, `S63` | Hoạt động chính xác theo GINA 2026 | ✅ **ĐÃ SỬA TRIỆT ĐỂ** |
| Fail-closed nghiêm ngặt khi thiếu `< 4/4` câu hỏi GINA (`S18`), thiếu tuổi (`S61`), hoặc bệnh nhi `< 12 tuổi` kể cả trong cơn cấp nội viện (`S60`) | `S18`, `S60`, `S61` | Chặn kê đơn liều người lớn cho trẻ 7 tuổi (`S60`); yêu cầu đủ 4/4 câu GINA (`S18`) | ⚠️ **CÒN LỖ HỔNG** ở `action_plan_generator` vẫn in liều thuốc khi GINA `0/4` (`S89`)! |

---

## 3. Phân tích Chi tiết 16 Phát hiện An toàn Lâm sàng Vòng 3

### 🔴 NHÓM CRITICAL (4 PHÁT HIỆN CHẶN PHÁT HÀNH)

#### `ASTHMA-R3-R3-01` [CRITICAL] — Mù cơn hen cấp nặng tại Ngoại trú, hỏng Preset Cấp cứu số 5 (`preset_asthma_acute_severe_er`), và phát y lệnh HẠ BẬC ngừng ICS (`REDUCE`) + khởi trị Chẹn beta (`Bisoprolol`) ngay giữa cơn ngừng thở nguy kịch
- **Định vị mã nguồn**:
  - `src/modules/asthma/presets.ts:180-211` (`preset_asthma_acute_severe_er`)
  - `src/ui/AppShell.tsx:86-89` (`setting: preset.setting ?? 'outpatient'`)
  - `src/modules/asthma/helpers.ts:320-338` (`isStepDownEligible`) & `351-354` (`evaluateAcuteAsthma`)
  - `src/modules/hf/rules.hfref.ts` & `src/modules/hf/rules.inpatient.ts`
- **Bằng chứng thực chạy `evaluate()`**:
  1. **Hỏng Preset Cấp cứu chính thức trên UI (`S05`)**: Preset số 5 (*"Cơn hen phế quản cấp nặng tại Cấp cứu — Hoàng Thị E, 29 tuổi, SpO₂ 88%, PEF 45%, RR 32, HR 128, nói từng từ"*) không khai báo trường `setting: 'inpatient'`. Khi chọn trên giao diện, `AppShell` gán `setting = 'outpatient'`. Kết quả `evaluate()` trả về **0 Salbutamol, 0 Ipratropium, 0 Corticoid, 0 Oxy, 0 `REFER` cấp cứu**, chỉ xuất 3 thẻ `MONITOR` ngoại trú thường quy và đòi nhập câu hỏi GINA 4 tuần!
  2. **Bỏ sót cơn hen cấp nặng tại Phòng khám Ngoại trú và kê HẠ BẬC ngừng ICS (`S73`)**: Nữ 38 tuổi đến khám ngoại trú vì cơn khó thở cấp nặng (`isAcuteExacerbation: true, spo2: 88%, pefPct: 42%, respiratoryRate: 32, hr: 128, speechAbility: 'words'`, 4 tháng trước ổn định). Do `evaluateAcuteAsthma` trả cứng `hasAcuteAttack: false` khi `setting !== 'inpatient'` và `checkEmergencyRedFlags` chỉ bắt `spo2 < 85%`, hệ thống xuất:
     - `[asthma|REDUCE|p=86] Hạ bậc từ MART Bậc 3 xuống Bậc 2 (AIR): Ngừng liều cố định hàng ngày, chỉ hít 1 nhát khi có triệu chứng`
     - `hasRefer = false`, `Alerts = []`!
  3. **Hạ bậc ICS và khởi trị `Bisoprolol` ngay giữa lúc `silentChest` chờ đặt nội khí quản (`S21`, `S42`, `S74`)**:
     - Ở `S21` & `S74` (`setting: 'outpatient'`, `silentChest: true, spo2: 81%, paco2: 58, mentalStatus: 'drowsy_confused'`), bên cạnh thẻ cấp cứu chung, module `asthma` vẫn phát `[asthma|REDUCE] Hạ bậc từ MART Bậc 3 xuống Bậc 2`, và module `hf` (`S74`) khởi trị cả 4 trụ cột uống gồm `[hf|CONSIDER] bisoprolol 1.25 mg`!
     - Ở `S42` (`setting: 'inpatient'`, `[asthma, hf]`, `isAcuteExacerbation: true, silentChest: true, spo2: 86%, pefPct: 35%`), ngay bên dưới lệnh `CẤP CỨU ĐE DỌA TÍNH MẠNG: Chuyển ngay ICU & đặt nội khí quản`, module `hf` vẫn phát **`[hf|CONSIDER|p=91] bisoprolol 1.25 mg`** và **`[hf|START|p=85] rec_hf_inpatient_predischarge` (`gates=[Ổn định trước xuất viện: PASS]`)**!
- **Đối chiếu Y văn**: GINA 2026 Section 9, Box 9-2 & Box 9-3 (tr. 183–187: Tại phòng khám ngoại trú/tuyến cơ sở, cơn hen cấp nặng với nói từng từ, `RR > 30`, `HR > 120`, `SpO₂ < 90%`, `PEF ≤ 50%` bắt buộc xử trí ngay SABA 4–10 nhát qua buồng đệm mỗi 20 phút + Prednisolone 40–50 mg + Oxy mục tiêu `93–95%` và chuyển Khoa Cấp cứu ngay lập tức); ESC HF 2021/2026 (chống chỉ định khởi trị chẹn beta trong cơn co thắt phế quản cấp).
- **Hướng khắc phục**:
  1. Thêm `setting: 'inpatient'` vào `preset_asthma_acute_severe_er` (`presets.ts:180`).
  2. Xây dựng quy tắc nhận diện & xử trí cấp cứu ban đầu cơn hen cấp tại Ngoại trú (GINA Box 9-2) kích hoạt ngay khi `isAcuteExacerbation === true` hoặc có sinh hiệu/triệu chứng cơn hen cấp (`spo2 < 93%`, `pefPct <= 50%`, `rr > 30` hoặc `< 10`, `hr > 120` hoặc `< 55`, `speechAbility === 'words' | 'unable'`, `silentChest`, `mentalStatus !== 'alert'`, `paco2 >= 40`, `abgPh < 7.35`), đồng thời khóa cứng toàn bộ quy tắc hạ bậc/điều chỉnh mạn tính.
  3. Chặn khởi trị chẹn beta (`bisoprolol`, `metoprolol_succinate`) và chặn cổng `Ổn định trước xuất viện` của `hf` khi bệnh nhân đang có đợt cấp hô hấp (`isAcuteExacerbation === true`, `silentChest`, `spo2 < 90%`, `rr > 30`).

---

#### `ASTHMA-R3-R3-02` [CRITICAL] — Xung đột tử vong liên phân hệ `[asthma + gout]`: Kê đơn `START Naproxen 500 mg x 2 lần/ngày` ngay trên bệnh nhân có tiền sử Hen nhạy cảm Aspirin/NSAID (`AERD`)
- **Định vị mã nguồn**:
  - `src/modules/gout/helpers.safety.ts:304-366` (`isNsaidHardContraindicated`, `isNsaidAvoidedInGout`)
  - `src/modules/asthma/rules.safety.ts:472-509` (`aerdPreventiveAvoidRule`)
  - `src/engine/safety/gates.ts` & `src/engine/safety/reviewMeds.ts`
- **Bằng chứng thực chạy `evaluate()`**:
  - Kịch bản **`S37`** (`['asthma', 'gout']`, hồ sơ `VN`, `conditions: { asthma: true, gout: true, aerd: true }`, cơn gút cấp giờ thứ 48) và **`S75`** (hồ sơ `INTL`, cơn gút cấp giờ thứ 12 đang dùng `clarithromycin` nên Colchicine bị chặn):
    - Hạng #1 (`p=97`): `[asthma|AVOID] drug=aspirin: "TRÁNH TUYỆT ĐỐI Aspirin và tất cả NSAID ức chế COX-1 (ibuprofen, diclofenac, naproxen, ketorolac, meloxicam, piroxicam) trên bệnh nhân AERD — có thể kích phát cơn hen ác tính trong vài chục phút"`
    - Ngay bên dưới (`p=86`): **`[gout|START] drug=naproxen: "Cắt cơn gút cấp bằng NSAID ngắn ngày (Naproxen) — 500 mg x 2 lần/ngày sau ăn trong 5 ngày"`**!
    - `Alerts`: **0 cảnh báo chống chỉ định `naproxen` trên nền `aerd`**!
- **Đối chiếu Y văn**: GINA 2026 Section 7 (AERD/NERD, tr. 158) & Bộ Y tế QĐ 1851/QĐ-BYT: Phản ứng chéo qua ức chế enzym COX-1 xảy ra gần như 100% với Naproxen, Ibuprofen, Diclofenac, Ketorolac, Indomethacin — chỉ 1 viên Naproxen 500 mg có thể gây co thắt phế quản tối cấp kháng trị, ngừng thở và tử vong. Cắt cơn gút cấp trên nền AERD bắt buộc chuyển sang Corticosteroid đường uống/tiêm nội khớp (Prednisolone 30–35 mg/ngày × 5 ngày).
- **Hướng khắc phục**:
  1. Bổ sung `Boolean(ctx.patient.conditions.aerd) || Boolean(ctx.patient.customInputs?.aerd)` vào `isNsaidHardContraindicated(ctx)` trong `src/modules/gout/helpers.safety.ts`.
  2. Bổ sung cổng an toàn toàn cục trong `src/engine/safety/gates.ts` và `reviewMeds.ts` chặn cứng mọi y lệnh `START`/`UPTITRATE`/`CONSIDER` thuộc `AERD_COX1_NSAID_DRUGS` khi bệnh nhân có `aerd`.

---

#### `ASTHMA-R3-R3-03` [CRITICAL] — Phân tầng sai lầm dấu hiệu Sắp ngừng tuần hoàn – hô hấp (`HR = 44`, `RR = 8`, `abgPh = 7.22`, `abgPaco2 = 62`, `PaCO₂ = 43` bình thường giả tạo) thành "Cơn hen cấp nhẹ – trung bình"
- **Định vị mã nguồn**: `src/modules/asthma/helpers.ts:356-422` (`evaluateAcuteAsthma`)
- **Bằng chứng thực chạy `evaluate()`**:
  1. **Mạch chậm thiếu oxy + thở ngáp kiệt sức + toan máu nặng (`S28`)**: Nam 37 tuổi, nội viện, `isAcuteExacerbation: true, hr: 44, respiratoryRate: 8, abgPh: 7.22, paco2: 44, spo2: 92%` (đang thở oxy). Vì `evaluateAcuteAsthma` chỉ kiểm tra một chiều `hr > 120`, `rr > 30`, `paco2 > 45`, module `asthma` xếp bệnh nhân vào **`mild_moderate`** và phát lệnh:
     - `[asthma|START|p=85] rec_asthma_acute_mild_moderate_saba`: *"Ở cơn hen cấp mức độ nhẹ – trung bình, xịt Salbutamol 4–10 nhát pMDI..."*
     - `[asthma|START|p=84] rec_asthma_acute_mild_moderate_ocs`: *"Prednisolone 40–50 mg uống... khi người bệnh tỉnh táo và nuốt tốt"*
     - **Bỏ sót hoàn toàn**: SABA khí dung liên tục, Ipratropium khí dung, Methylprednisolone tĩnh mạch, MgSO₄ 2 g truyền tĩnh mạch, và lệnh chuyển ICU đặt nội khí quản RSI Ketamine!
  2. **Mù trường khí máu chuẩn dùng chung `abgPaco2` (`S29`)**: Khi nhập `abgPaco2: 62, abgPh: 7.24` (tên trường chuẩn của schema lõi/COPD), `need(ctx, 'paco2')` trả về `undefined`, khiến suy hô hấp tăng CO₂ `62 mmHg` bị xếp nhầm thành **cơn hen nhẹ – trung bình**!
  3. **Bỏ sót `PaCO₂ = 40–45 mmHg` bình thường giả tạo (`S77`)**: `paco2: 43, respiratoryRate: 28` được xếp loại nhẹ – trung bình mà không có bất kỳ cảnh báo mệt cơ hô hấp nào.
- **Đối chiếu Y văn**: GINA 2026 Section 9, Box 9-3 & Box 9-6 (tr. 184, 188) & Bộ Y tế QĐ 5850/QĐ-BYT (2021): Nhịp tim chậm (`bradycardia`), nhịp thở chậm/cơn ngừng thở (`exhaustion / feeble respiratory effort`), toan máu (`pH < 7.35`), `PaCO₂ > 45 mmHg` là dấu hiệu **Cơn hen nguy kịch đe dọa tính mạng**; `PaCO₂` trở về bình thường `40–45 mmHg` ở bệnh nhân đang thở nhanh là dấu hiệu **Cơn hen nặng / kiệt cơ hô hấp**.
- **Hướng khắc phục**: Đọc gộp `need(ctx, 'paco2') ?? need(ctx, 'abgPaco2')` và `need(ctx, 'abgPh')`; đưa `hr < 55`, `rr < 10` (khi đang đợt cấp), `abgPh < 7.30` vào `isLifeThreatening`, và đưa `paco2 >= 40` hoặc `abgPh < 7.35` vào tối thiểu `isSevere`.

---

#### `ASTHMA-R3-R3-04` [CRITICAL] — Mâu thuẫn trực diện y lệnh Oxy tại giường cấp cứu ở bệnh nhân chồng lấp Hen – COPD (`[asthma + copd]`: `SpO₂ 93–95%` vs `GIẢM NGAY lưu lượng oxy, đích 88–92%`)
- **Định vị mã nguồn**: `src/modules/asthma/rules.acute.ts` (`acute_severe_saba_oxygen`, `acute_mild_moderate_saba`, `acute_life_threatening_icu`) vs `src/modules/copd/rules.inpatient.ts`
- **Bằng chứng thực chạy `evaluate()`**:
  - Kịch bản **`S48`** (`['asthma', 'copd']`, `setting: 'inpatient'`, `spo2: 94%` đang thở oxy):
    - Hạng #1 (`p=105`): `[asthma|START] Giãn phế quản cấp cứu Salbutamol + Thở Oxy mục tiêu SpO₂ 93–95%`
    - Hạng #2 (`p=102`): `[copd|REDUCE] GIẢM NGAY lưu lượng oxy bổ sung (SpO₂ 94% > 92%): Nguy cơ ứ CO₂ / toan hô hấp cấp, chỉnh về đích 88–92%`!
  - Kịch bản **`S49`** (`spo2: 86%`): Phát song song 2 y lệnh `START` xung đột đích `93–95%` vs `88–92%`.
- **Đối chiếu Y văn**: GINA 2026 Section 6 & Box 9-6 (tr. 190) + GOLD 2026: Khi bệnh nhân hen có kèm COPD hoặc nguy cơ ứ CO₂ mạn tính, đích bão hòa oxy bắt buộc khống chế ở mức **`88–92%`**.
- **Hướng khắc phục**: Trong `asthma/rules.acute.ts`, nếu bệnh nhân có `copd` (`hasCondition(ctx, 'copd') || ctx.patient.selectedModules.includes('copd')`) hoặc `paco2 > 45` (không mang thai), đồng bộ mục tiêu Oxy về **`88–92%`**.

---

### 🟠 NHÓM MAJOR (8 PHÁT HIỆN NGHIÊM TRỌNG)

#### `ASTHMA-R3-R3-05` [MAJOR] — Bỏ lọt `glycopyrronium_indacaterol` (Ultibro Breezhaler) do viết ngược Drug ID, tắt `STOP` LABA-không-ICS ở nội viện, và bỏ lọt LAMA đơn trị không kèm ICS
- **Định vị mã nguồn**: `src/modules/asthma/helpers.ts:39, 64` & `src/modules/asthma/rules.safety.ts:167-210`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`S82` & `S83`**: Bệnh nhân hen thuần túy đang dùng `glycopyrronium_indacaterol` (Ultibro Breezhaler — LABA+LAMA không có ICS): cả ở nội viện cơn hen cấp (`S82`) lẫn ngoại trú chưa đủ câu GINA (`S83`), hệ thống xuất **0 lệnh `STOP`, 0 `AVOID`, 0 `Alerts`**! Lý do: `kb/drugs/glycopyrronium_indacaterol.json` mang ID `'glycopyrronium_indacaterol'`, nhưng `helpers.ts:64` ghi ngược thành `'indacaterol_glycopyrronium'`.
  - Tại `rules.safety.ts:175`, điều kiện `if (ctx.settings.setting === 'inpatient' && evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;` vô hiệu hóa hoàn toàn lệnh `STOP` mọi LABA-không-ICS khi bệnh nhân nhập viện vì cơn hen cấp.
  - **`S55` & `S56`**: Bệnh nhân hen thuần túy Bậc 1–2 đang hít `tiotropium` hoặc `umeclidinium` + `glycopyrronium` không kèm ICS: hệ thống chỉ thêm `START budesonide_formoterol` khi cần mà **không phát lệnh `STOP` các bình LAMA đơn trị hàng ngày**.
- **Hướng khắc phục**: Thêm `'glycopyrronium_indacaterol'` vào `LABA_WITHOUT_ICS_DRUGS` và `'indacaterol_glycopyrronium_mometasone'` vào `TRIPLE_INHALER_DRUGS`; bỏ chặn nội viện ở `labaMonoStopRules`; bổ sung quy tắc `STOP` LAMA đơn độc không kèm ICS-LABA duy trì ở bệnh nhân hen không mắc COPD.

---

#### `ASTHMA-R3-R3-06` [MAJOR] — Cho phép trẻ vị thành niên `12–17 tuổi` tiếp tục dùng (`CONTINUE`) và gợi ý bình bộ ba cố định một bình chỉ duyệt cho người lớn `≥ 18 tuổi`
- **Định vị mã nguồn**: `src/modules/asthma/rules.track1.ts` & `src/modules/asthma/rules.track2.ts` (Step 5 rules)
- **Bằng chứng thực chạy `evaluate()`**:
  - **`S57`** (`age: 14` đang dùng `Trelegy Ellipta`) & **`S58`** (`age: 13` đang dùng `Trimbow`): Xuất `[asthma|CONTINUE|p=88] Tiếp tục duy trì nền bộ ba Bậc 5`, `0` cảnh báo tuổi.
  - **`S59`** (`age: 15`, Bậc 5 chưa kiểm soát): `rec_asthma_track1_step5_lama_biologic` gợi ý dùng *"bình bộ ba ICS-LABA-LAMA"* cho trẻ 15 tuổi.
- **Đối chiếu Y văn**: GINA 2026 Box 4-6 & Step 5 (tr. 79, 98, 103): Bình bộ ba cố định một bình chỉ được phê duyệt cho người lớn **`≥ 18 tuổi`**; ở lứa tuổi **12–17 tuổi**, LAMA bổ trợ duy nhất được phép dùng là **Tiotropium Respimat rời** (`≥ 6 tuổi`).
- **Hướng khắc phục**: Phân nhánh `age < 18` trong toàn bộ quy tắc Bậc 5 và phát cảnh báo chuyển đổi sang ICS-LABA + Tiotropium Respimat rời nếu bệnh nhân `12–17 tuổi` đang dùng bình bộ ba cố định.

---

#### `ASTHMA-R3-R3-07` [MAJOR] — Bỏ sót chống chỉ định Dị ứng nặng đạm sữa bò (`severeMilkProteinAllergy`) khi kê bình bột khô DPI chứa lactose (`Accuhaler` / `Turbuhaler`)
- **Định vị mã nguồn**: `kb/drugs/fluticasone_salmeterol.json`, `kb/drugs/budesonide_formoterol.json`, `src/modules/asthma/rules.track1.ts`, `src/modules/asthma/rules.track2.ts`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`S67`** (Track 2 Bậc 3, `severeMilkProteinAllergy: true`) & **`S78`** (Track 1 Bậc 3, `severeMilkProteinAllergy: true`): Kê trực tiếp `Accuhaler (DPI) 250/50 mcg` và `Turbuhaler DPI` với `0` cảnh báo, `0` cổng chặn, `Alerts = []`.
- **Hướng khắc phục**: Khi `hasSevereMilkProteinAllergy(ctx) === true`, chặn mọi gợi ý dạng bột khô DPI chứa lactose (`Accuhaler`, `Turbuhaler`, `Nexthaler`, `Ellipta`), chỉ định đích danh dạng bình xịt định liều không chứa lactose (**`Rapihaler pMDI`**, **`Foster pMDI`**, **`Seretide Evohaler pMDI`**) kèm cảnh báo chống chỉ định rõ ràng, và phát `SWITCH`/`STOP` nếu đang dùng bình DPI.

---

#### `ASTHMA-R3-R3-08` [MAJOR] — Quy trình xuất viện nội trú tước bỏ LAMA của bệnh nhân Hen Bậc 5 (`Trelegy` -> MART Bậc 4) và cho xuất viện sớm nguy hiểm khi `PEF = 55%`
- **Định vị mã nguồn**: `src/modules/asthma/rules.acute.ts:457-512` & `src/modules/asthma/helpers.ts:424-430`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`S80`** (Bệnh nhân Bậc 5 đang dùng `Trelegy Ellipta`, đáp ứng sau 1 giờ cấp cứu): `rec_asthma_discharge_plan` phát lệnh **`SWITCH` từ `Trelegy Ellipta` sang `Budesonide/Formoterol` MART Bậc 4**, cắt bỏ LAMA (`umeclidinium`) và hạ bậc ngay sau đợt cấp!
  - **`S81`** (`pefPct: 55%, respiratoryRate: 26, speechAbility: 'phrases'`, tích chọn `acuteResponseAfter1h: 'good_response'`): Engine tắt sạch thuốc cắt cơn nội viện và cho xuất viện về nhà dù `PEF = 55%` thuộc mức đáp ứng một phần (`50–70%`) theo GINA Box 9-5 và chính nhãn UI đòi hỏi `PEF > 70%`!
- **Hướng khắc phục**: Ràng buộc điều kiện khách quan trước khi mở nhánh xuất viện (`pefPct === undefined || pefPct > 60`, `speech !== 'phrases'`, `rr === undefined || rr <= 25`, `spo2 >= 94%`); bảo toàn phác đồ Bậc 5 / LAMA khi bệnh nhân trước đợt cấp đã ở Bậc 5.

---

#### `ASTHMA-R3-R3-09` [MAJOR] — Sót `.find()` và thiếu `TRIPLE_INHALER_DRUGS` ở quy tắc chặn trùng lặp ICS đơn chất (`S69`) & trùng lặp ≥ 3 LABA (`S90`)
- **Định vị mã nguồn**: `src/modules/asthma/rules.safety.ts:559-595` & `800-845`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`S69`** (`budesonide` + `fluticasone_propionate` + `Trelegy Ellipta`): Xuất `CONTINUE Trelegy` và **0 lệnh `STOP`** trên cả 2 bình ICS đơn chất (bệnh nhân hít đồng thời 3 corticoid!).
  - **`S90`** (`budesonide_formoterol` + `umeclidinium_vilanterol` + `salmeterol`): Chỉ phát `AVOID` trên `umeclidinium_vilanterol`, bỏ sót `salmeterol` không bị `STOP`.
- **Hướng khắc phục**: Tách cả hai quy tắc sang `.map()` theo từng hoạt chất vi phạm, bổ sung `TRIPLE_INHALER_DRUGS` vào `hasComboIcs`, và phát lệnh `STOP` thay vì `AVOID` đơn lẻ cho mọi bình ICS/LABA dư thừa.

---

#### `ASTHMA-R3-R3-10` [MAJOR] — Lệch pha tên thuốc/liều lượng giữa Đơn thuốc và Bản Kế hoạch Hành động ở Track 2 (`S87`, `S88`), câu liều hạ bậc Track 2 tự mâu thuẫn, và vi phạm Fail-closed khi GINA `0/4` (`S89`)
- **Định vị mã nguồn**: `src/modules/asthma/rules.track2.ts:240-335` & `480-568`
- **Bằng chứng thực chạy `evaluate()`**:
  - **`S87`** (Track 2 Bậc 2 `budesonide` không kiểm soát): Đơn thuốc `SWITCH` sang `Fluticasone / Salmeterol` (Bậc 3), nhưng Action Plan in ngay bên dưới lại dặn bệnh nhân dùng **`Budesonide (200 mcg) liều Liều thấp 200–400 mcg/ngày`** (do dòng 515 đọc `ci.currentStep` cũ)!
  - **`S88`** (Track 2 Bậc 3 `fluticasone_salmeterol` ổn định 6 tháng): Đơn thuốc phát `REDUCE` trên `drugId: 'fluticasone_salmeterol'` với câu liều bất khả thi *"ngừng thành phần LABA"*, còn Action Plan vẫn in tiếp tục dùng `Seretide Accuhaler 100/50 mcg x 2 lần/ngày`!
  - **`S89`** (Trả lời `0/4` câu GINA): Quy tắc kê thuốc dừng an toàn, nhưng Action Plan vẫn in y lệnh cụ thể `Budesonide / Formoterol 160/4.5 mcg liều 1 nhát x 2 lần/ngày`!
- **Hướng khắc phục**: Tính bậc hiệu lực thống nhất `computeEffectiveTrack2Step(ctx)` cho cả đơn thuốc và Action Plan; sửa bước hạ bậc Bậc 3 -> Bậc 2 thành `SWITCH` tường minh hoặc giảm liều ICS-LABA hợp lệ theo GINA Box 4-13; khóa `action_plan_generator` khi `evaluateGinaControl(ctx).level === 'missing'` hoặc đang đợt cấp.

---

#### `ASTHMA-R3-R3-11` [MAJOR] — Tự mâu thuẫn dược động học CYP3A4: Khuyên tránh `Budesonide` và cân nhắc `Beclometasone` khi dùng `Ritonavir`/`Clarithromycin`, nhưng ngay dòng dưới lại kê `START Budesonide/Formoterol`
- **Định vị mã nguồn**: `src/modules/asthma/helpers.ts:201-209` (`resolveTrack1MartDrugId`) & `src/modules/asthma/rules.safety.ts:675-726`
- **Bằng chứng thực chạy `evaluate()`**: Kịch bản **`S86`** (`currentMeds: [{ drugId: 'ritonavir' }]`) xuất đồng thời `[asthma|AVOID] TRÁNH PHỐI HỢP ritonavir với Fluticasone, Budesonide... cân nhắc nền Beclometasone` VÀ `[asthma|START] Budesonide / Formoterol`, tự gây ra cảnh báo đỏ `[critical|interaction] ix.ics_laba_strong_cyp3a4`!
- **Hướng khắc phục**: Cho `resolveTrack1MartDrugId(ctx)` tự động ưu tiên trả về `'beclometasone_formoterol'` (Foster — chuyển hóa qua esterase ít phụ thuộc CYP3A4) khi phát hiện `STRONG_CYP3A4_INHIBITOR_DRUGS` trong `currentMeds`.

---

#### `ASTHMA-R3-R3-12` [MAJOR] — Thiếu cảnh báo bắt buộc dùng ống ngậm miệng (`mouthpiece`) bảo vệ mắt khi khí dung lặp lại `Ipratropium` trên bệnh nhân Glôcôm góc đóng / BPH (`S30`)
- **Định vị mã nguồn**: `src/modules/asthma/rules.acute.ts` (`acute_severe_ipratropium`) & `kb/drugs/ipratropium.json`
- **Bằng chứng thực chạy `evaluate()`**: Kịch bản **`S30`** (`narrowAngleGlaucoma: true, bph: true, urinaryRetention: true`) kê `Khí dung Ipratropium 0.5 mg mỗi 20 phút × 3 lần` với `gates = []`, `warnings = []`, `Alerts = []`.
- **Hướng khắc phục**: Gắn cổng thận trọng và hướng dẫn bắt buộc dùng ống ngậm miệng (`mouthpiece`) hoặc xịt qua buồng đệm kèm che mắt tuyệt đối không dùng mặt nạ hở khi có `narrowAngleGlaucoma`, và theo dõi cầu bàng quang/bí tiểu khi có `bph` / `urinaryRetention`.

---

### 🟡 NHÓM MINOR & 🔵 SUGGESTION (4 PHÁT HIỆN)

- **`ASTHMA-R3-R3-13` [MINOR] (`isMartOveruse`)**: Báo động giả quá liều cấp cứu (`HOLD` + `REFER` cấp cứu) ở nhát thứ `14` của bình nửa hàm lượng **`Symbicort Rapihaler 80/2.25 mcg`** (`S85`: `14 × 2.25 = 31.5 mcg` phân liều, trong khi trần GINA `54 mcg` phân liều / `72 mcg` định liều tương ứng **24 nhát/ngày** loại `80/2.25 mcg`).
- **`ASTHMA-R3-R3-14` [MINOR] (Nội viện ổn định & câu chữ Bậc 5)**: (1) Bệnh nhân hen ổn định nhập viện vì bệnh khác (`setting: 'inpatient', isAcuteExacerbation: false`, `S36`) nhận `0` khuyến cáo duy trì tiếp bình ICS-LABA nền; (2) Khi bệnh nhân Bậc 5 đã có sẵn `tiotropium` hoặc `Trelegy` (`S12`, `S84`), tiêu đề `rec_asthma_track1_step5_lama_biologic` vẫn in *"Phối hợp thêm LAMA..."*.
- **`ASTHMA-R3-R3-15` [MINOR] (`[asthma + copd]` đa kháng thể đơn dòng)**: Kịch bản `S84` xuất song song cả `[copd|CONSIDER] Dupilumab 300 mg Q2W` và `[copd|CONSIDER] Mepolizumab 100 mg Q4W` vào mục y lệnh dự kiến của `noteText` cùng thẻ `REFER` sinh học của `asthma` và 2 thẻ tiêm chủng trùng lặp.
- **`ASTHMA-R3-R3-16` [SUGGESTION] (`asthmaInputs`)**: Bổ sung tùy chọn hàm lượng bình ICS-formoterol (`160/4.5` vs `80/2.25` vs `100/6`) và công tắc `conditions.severeMilkProteinAllergy` / `conditions.narrowAngleGlaucoma` ngay trong giao diện `asthmaInputs`.

---

## 4. Ma trận Tổng hợp 92 Lượt Chạy Thực tế `evaluate()`

| Nhóm kịch bản | Mã kịch bản | Nội dung tấn công trọng tâm | Kết quả kiểm định |
| :--- | :---: | :--- | :--- |
| **Nhóm A: Presets & Hồi quy Vòng 2** | `S01`–`S20`, `S79` (21 lượt) | Toàn bộ 6 Presets chính thức; `UPTITRATE` liều cấp cứu; `isLifeThreatening` đè `good_response`; Foster `100/6`; Bậc 5 kèm Tiotropium; đa BB/an thần; CKD G5 `MgSO4` 1 g; thai kỳ cấp cứu; fail-closed GINA & kỹ thuật hít | **20/21 PASS**, **1 FAIL CRITICAL** (`S05`: hỏng `preset_asthma_acute_severe_er` thiếu `setting: 'inpatient'`) |
| **Nhóm B: Cấp cứu Ngoại trú / Nội viện & Biên sinh hiệu** | `S21`–`S36`, `S73`, `S74`, `S77`, `S80`, `S81` (21 lượt) | Cơn hen cấp nặng/ngừng thở tại ngoại trú; mạch chậm `HR=44` + thở ngáp `RR=8` + `abgPh=7.22`; `abgPaco2=62`; `PaCO2=43`; glôcôm góc đóng + Ipratropium; CKD `mg/dL`; hạ huyết áp + `MgSO4`; xuất viện Bậc 5 `Trelegy` & `PEF=55%`; nội viện không đợt cấp | Phát hiện **`ASTHMA-R3-R3-01`**, **`ASTHMA-R3-R3-03`**, **`ASTHMA-R3-R3-08`**, **`ASTHMA-R3-R3-12`**, **`ASTHMA-R3-R3-14`** |
| **Nhóm C: Xung đột Đa bệnh & Thuốc COPD nhầm trong Hen** | `S37`–`S56`, `S75`, `S76`, `S82`–`S84`, `S86`, `S90` (27 lượt) | `[asthma + gout]` AERD + Naproxen; `[asthma + hf]` Carvedilol & Bisoprolol trong cơn nguy kịch; `[asthma + htn]` sản giật/xuất huyết não; `[asthma + af]` Sotalol/tần số thất; `[asthma + copd]` mâu thuẫn đích Oxy `93–95%` vs `88–92%` & đa sinh học; Ultibro `glycopyrronium_indacaterol` & LAMA đơn độc; CYP3A4 `ritonavir`; trùng 3 LABA | Phát hiện **`ASTHMA-R3-R3-01`**, **`ASTHMA-R3-R3-02`**, **`ASTHMA-R3-R3-04`**, **`ASTHMA-R3-R3-05`**, **`ASTHMA-R3-R3-09`**, **`ASTHMA-R3-R3-11`**, **`ASTHMA-R3-R3-15`** |
| **Nhóm D: Vị thành niên, Thai kỳ, Dị ứng sữa, Hạ bậc, Action Plan & Đa hồ sơ** | `S57`–`S72` (+ `INTL`/`VN`), `S78`, `S85`, `S87`–`S89` (23 lượt) | Trẻ `12–17 tuổi` trên `Trelegy`/`Trimbow`/Bậc 5; bệnh nhi `7 tuổi` cấp cứu; thai kỳ hạ/nâng bậc; dị ứng nặng đạm sữa bò trên DPI; hạ bậc Track 1/Track 2; Action Plan lệch pha & GINA `0/4`; trần `Rapihaler 80/2.25`; đối chiếu `INTL`/`VN`/`US` & `noteText` | Phát hiện **`ASTHMA-R3-R3-06`**, **`ASTHMA-R3-R3-07`**, **`ASTHMA-R3-R3-09`**, **`ASTHMA-R3-R3-10`**, **`ASTHMA-R3-R3-13`**, **`ASTHMA-R3-R3-16`** |

---

## 5. Đánh giá Giao diện, Thuật ngữ Y khoa Tiếng Việt & Tóm tắt Bệnh án (`noteText`)

1. **Điểm mạnh nổi bật**:
   - Văn phong y khoa tiếng Việt chuẩn xác, mạch lạc, phân tách rõ ràng Track 1 (AIR/MART ưu tiên theo GINA 2026) và Track 2 (lựa chọn thay thế phù hợp tuyến y tế cơ sở BHYT Việt Nam theo QĐ 1851/2020).
   - Cơ chế bảo vệ thai kỳ, chỉnh liều `MgSO4` theo mức lọc cầu thận (kể cả tự động đổi `mg/dL`), và chặn liều người lớn cho bệnh nhi `< 12 tuổi` hoạt động rất chắc chắn.
2. **Các điểm bắt buộc phải xử lý dứt điểm trước khi nghiệm thu**:
   - Khắc phục triệt để **4 lỗi `CRITICAL`** (`ASTHMA-R3-R3-01`..`04`) và **8 lỗi `MAJOR`** (`ASTHMA-R3-R3-05`..`12`) nêu trên để đảm bảo không còn bất kỳ kẽ hở kê đơn gây co thắt phế quản phản vệ (`Naproxen`/AERD, DPI/dị ứng đạm sữa bò), bỏ sót cấp cứu ngoại trú/tiền ngừng thở nội viện, hay xung đột y lệnh Oxy tại giường bệnh.
