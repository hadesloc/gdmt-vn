# BÁO CÁO KIỂM ĐỊNH ĐỘC LẬP VÒNG 1 — PHÂN HỆ TĂNG HUYẾT ÁP (`htn`)

- **Vai trò kiểm định**: **R1 – Chuyên gia Tim mạch & Kiểm định Guideline (Cardiology & Guideline Verification Specialist)**
- **Phân hệ được kiểm định**: `htn` (`src/modules/htn/**`, `kb/citations/htn.json`, `kb/thresholds/htn.json`, 18 hồ sơ thuốc thuộc sở hữu `htn` trong `kb/drugs/*.json`, `tests/golden/htn/**`, `docs/modules/HTN.md`)
- **Phương pháp đối chiếu**: Kiểm tra dòng-theo-dòng toàn bộ 21 quy tắc lâm sàng (14 ngoại trú + 7 nội viện), 2 ma trận tra cứu (`htnComorbidityMatrix`, `htnRenalMatrix`), 57 trích dẫn, 92 ngưỡng lâm sàng và 18 hồ sơ thuốc; đối chiếu nguyên văn trực tiếp từng trang PDF của 6 tài liệu nguồn lõi trong thư viện chuẩn:
  1. **ESC 2024** Guidelines for the management of elevated blood pressure and hypertension (`ESC_2024_elevated_blood_pressure_and_hypertension.pdf`)
  2. **AHA/ACC 2025** Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults (`AHA_ACC_2025_High_Blood_Pressure_Guideline.pdf`)
  3. **VSH/VNHA 2022** Khuyến cáo Chẩn đoán & Điều trị Tăng huyết áp của Phân hội Tăng huyết áp / Hội Tim mạch học Việt Nam (`VSH_VNHA_2022_Tang_Huyet_Ap.pdf`)
  4. **KDIGO 2021** Clinical Practice Guideline for the Management of Blood Pressure in Chronic Kidney Disease (`KDIGO_2021_Blood_Pressure_in_CKD.pdf`)
  5. **ESC 2025** Guidelines for the management of cardiovascular diseases during pregnancy (`ESC_2025_cardiovascular_diseases_during_pregnancy_management_of.pdf`)
  6. **BYT 3192/QĐ-BYT (2010)** Hướng dẫn chẩn đoán và điều trị tăng huyết áp (`BYT_3192_2010_Tang_Huyet_Ap.json`) & Nhãn thuốc tham chiếu EMA/FDA.
- **Tệp dữ liệu có cấu trúc đi kèm**: `docs/reviews/htn/round1_R1.json`

---

## 1. Tổng hợp kết quả kiểm định

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã phát hiện (`id`) | Ý nghĩa theo `docs/REVIEW_PROTOCOL.md` |
| :--- | :---: | :--- | :--- |
| **`critical`** | **6** | `R1-HTN-01` → `R1-HTN-06` | Sai lệch y khoa có nguy cơ gây hại trực tiếp tính mạng bệnh nhân / thai nhi hoặc ghi ngược nghĩa liều suy thận; **chặn phát hành bắt buộc**. |
| **`major`** | **17** | `R1-HTN-07` → `R1-HTN-23` | Sai lệch thuật toán điều trị theo profile (`INTL`/`VN`/`US`), bỏ sót khuyến cáo Class I / COR 1 hoặc Class III (Harm), sai lệch trích dẫn nguyên văn PDF / COR-LOE / QA-7 / QA-10; **chặn nghiệm thu Vòng 1**. |
| **`minor`** | **4** | `R1-HTN-24` → `R1-HTN-27` | Thiếu chi tiết thời gian đạt đích, ngưỡng/trích dẫn bỏ hoang, sai lệch nhẹ ma trận bệnh đồng mắc và độ lệch tài liệu – giao diện. |
| **`suggestion`** | **2** | `R1-HTN-28` → `R1-HTN-29` | Đề xuất nâng cao chất lượng hỗ trợ quyết định lâm sàng (ngưỡng tăng Creatinin ≤ 30% sau khởi trị RASi, bổ sung `profileDiff` đa guideline). |
| **TỔNG CỘNG** | **29** | `R1-HTN-01` → `R1-HTN-29` | **Kết luận Vòng 1: `FAIL`** *(Điều kiện `PASS`: `0 critical` và `0 major`)* |

---

## 2. Điểm mạnh ghi nhận của phân hệ `htn`

Trước khi đi vào danh sách lỗi cần khắc phục, kiểm định R1 ghi nhận các thiết kế an toàn y khoa tốt đã được cài đặt trong mã nguồn hiện tại:
1. **Cơ chế fail-closed sinh hiệu và xét nghiệm ở nhiều nhánh nhạy cảm**: Kiểm tra bắt buộc Kali máu và eGFR trước khi kê ức chế hệ RAS (`step1_dual_combination`), lợi tiểu (`step2_triple_combination`), hoặc Spironolactone (`step3_resistant_spironolactone`); yêu cầu nhập nhịp tim (`hr`) trong quy tắc bóc tách động mạch chủ cấp (`aortic_dissection`).
2. **Bảo vệ an toàn kép đối với hệ Renin-Angiotensin**: Cấm tuyệt đối phối hợp đồng thời ACEi + ARB (`ban_dual_rasi` — Class III, Level A) kèm chặn phù mạch do ACEi và hẹp động mạch thận hai bên.
3. **Chuyển đổi lợi tiểu theo mức lọc cầu thận ở Bước 2**: Tự động chuyển từ lợi tiểu Thiazide/Thiazide-like sang lợi tiểu quai (`furosemide`) khi `eGFR < 30 mL/phút/1.73m²` phù hợp với ESC 2024 và KDIGO 2021.
4. **Cổng an toàn nội viện cơ bản**: Chặn thuốc chẹn beta trong phù phổi cấp do tim (`pulmonary_edema`), chặn Nitroglycerin khi đang dùng thuốc ức chế PDE-5 (`sildenafil`, `tadalafil`, `vardenafil`), và cảnh báo tránh Nifedipine ngậm dưới lưỡi trong tăng huyết áp nặng không kèm tổn thương cơ quan đích cấp.

---

## 3. Chi tiết các phát hiện mức `CRITICAL` (`R1-HTN-01` đến `R1-HTN-06`)

### `R1-HTN-01` [CRITICAL | `rule` | `htn.inpatient.differentiate_crisis`]
**Phát lệnh `START nicardipine` vô điều kiện cho mọi cấp cứu THA, phá vỡ cổng an toàn bóc tách ĐMC cấp, làm nặng hội chứng vành cấp và gây chồng thuốc tĩnh mạch**

- **Vị trí mã nguồn**: `src/modules/htn/rules.inpatient.ts:118-145`
- **Mô tả sai lệch & kịch bản gây hại**:
  Khi bệnh nhân nội viện có `SBP ≥ 180` hoặc `DBP ≥ 120 mmHg` kèm bất kỳ biến chứng cơ quan đích cấp nào (`hasAcuteHmod(ctx) === true`), quy tắc tổng quát `htn.inpatient.differentiate_crisis` luôn phát trực tiếp một lệnh kê thuốc tĩnh mạch độc lập: `action: 'START', drugId: 'nicardipine', priority: 100` (*liều 5 mg/giờ*). Vì engine chạy song song tất cả các quy tắc thỏa điều kiện `when()`, lệnh này gây ra **5 hậu quả lâm sàng nguy hiểm tính mạng**:
  1. **Bóc tách động mạch chủ cấp thiếu nhịp tim (`aorticDissection: true, hr: undefined`)**: Quy tắc chuyên biệt `htn.inpatient.aortic_dissection` đã fail-closed để yêu cầu nhập `hr`, nhưng `differentiate_crisis` **vẫn phát lệnh `START nicardipine` đơn độc không có chẹn beta đi trước**! Truyền dihydropyridine tĩnh mạch khi chưa chẹn beta gây phản xạ nhịp nhanh giao cảm, làm tăng vọt lực xé thành động mạch chủ ($dP/dt$) và thúc đẩy lan rộng bóc tách / vỡ động mạch chủ. Ngay cả khi có `hr ≥ 60`, hệ thống phát đồng thời hai thẻ `START` ngang hàng (`nicardipine` priority 100 và `esmolol` priority 100), vi phạm nguyên tắc bắt buộc chẹn beta đạt đích nhịp tim trước khi truyền thuốc giãn mạch.
  2. **Hội chứng vành cấp (`acuteAcsWithin24h: true`)**: Cờ này được tính vào `hasAcuteHmod` (dòng 67, 84) nhưng không có rule ACS chuyên biệt, khiến hệ thống kê **Nicardipine tĩnh mạch đơn độc** thay vì Nitroglycerin hoặc Esmolol/Labetalol — nguy cơ gây nhịp nhanh phản xạ và hiện tượng cướp máu mạch vành, làm lan rộng vùng nhồi máu cơ tim.
  3. **Phù phổi cấp do tim (`acutePulmonaryEdema: true`, HA ≥ 180/120)**: Phát chồng **2 thuốc giãn mạch tĩnh mạch cùng lúc** (`START nicardipine` + `START nitroglycerin`), nguy cơ tụt huyết áp đột ngột; hơn nữa Nicardipine không nằm trong danh mục thuốc ưu tiên của VSH 2022 hay AHA/ACC 2025 cho phù phổi cấp do tim.
  4. **Tiền sản giật nặng / sản giật có HA ≥ 180/120**: Phát chồng đồng thời `START nicardipine` + `START labetalol`, nguy cơ tụt huyết áp mẹ quá mức và suy tuần hoàn tử cung – nhau thai cấp.
  5. **Xuất huyết não cấp có `SBP ≤ 180` nhưng `DBP ≥ 120` (ví dụ `170/122 mmHg`)**: `differentiate_crisis` phát `START nicardipine` trong khi `intracerebral_hemorrhage` phát `MONITOR nicardipine` (*"Chưa chỉ định hạ áp đường tĩnh mạch ngay"*), hai y lệnh mâu thuẫn trực diện trên cùng một `drugId`.
- **Bằng chứng nguyên văn PDF**:
  - **AHA/ACC 2025**, Table 27 (*PDF p. 75*): *"Acute aortic dissection | Esmolol, labetalol | Beta blockade should precede vasodilator (eg, nicardipine or nitroprusside) administration, if needed for BP control or to prevent reflex tachycardia or inotropic effect; SBP ≤120 mm Hg should be achieved within 20 min"* & *"Acute coronary syndromes: Esmolol†, labetalol, nicardipine, nitroglycerin† — †Agent of choice for acute coronary syndromes"* & *"Acute pulmonary edema | Clevidipine, nitroglycerin, nitroprusside | Beta blockers contraindicated"*.
  - **VSH/VNHA 2022**, Bảng 14 (*PDF tr. 41*): *"Bóc tách ĐM chủ cấp | Ngay lập tức, HATT < 120 mmHg VÀ nhịp tim < 60 l/p | Esmolol VÀ Nitroprusside hoặc Nitroglycerine hoặc Nicardipine"* ; *"Hội chứng vành cấp | Ngay lập tức, HATT < 140 mmHg | Nitroglycerine; Labetalol"* ; *"Phù phổi cấp do tim | Ngay lập tức, HATT < 140 mmHg | Nitroprusside hoặc Nitroglycerine (với lợi tiểu quai)"*.
- **Hướng khắc phục**: Chuyển nhánh Cấp cứu THA của `htn.inpatient.differentiate_crisis` sang vai trò phân tầng / chỉ định nhập đơn vị Hồi sức tích cực (`action: 'REFER'` hoặc `'MONITOR'`, **bỏ `drugId: 'nicardipine'` và `dose`**). Chỉ phát lệnh `START` thuốc tĩnh mạch cụ thể tại từng rule HMOD chuyên biệt (hoặc nhánh fallback THA ác tính đơn thuần khi không thuộc các HMOD đặc hiệu có chống chỉ định Nicardipine).

---

### `R1-HTN-02` [CRITICAL | `missing` | `htn.outpatient.triage_hypertensive_crisis`]
**Phân hệ ngoại trú thiếu hoàn toàn quy tắc phân loại / chuyển cấp cứu (`REFER`), bỏ mặc thai phụ tiền sản giật nặng không thuốc – không chuyển tuyến**

- **Vị trí mã nguồn**: `src/modules/htn/rules.outpatient.ts` (đặc biệt dòng `1659`)
- **Mô tả sai lệch & kịch bản gây hại**:
  Toàn bộ 14 quy tắc trong `rules.outpatient.ts` không có bất kỳ quy tắc nào phát lệnh `REFER` (chuyển khoa Cấp cứu / nhập viện khẩn) khi bệnh nhân đến phòng khám ngoại trú với cơn THA cấp cứu hoặc THA nặng thai kỳ. Kiểm thử truy vết phát hiện **3 lỗ hổng đặc biệt nguy hiểm**:
  1. **Thai phụ ngoại trú có HA `185/118 mmHg` kèm tiền sản giật nặng (`pregnant: true, severePreeclampsiaEclampsia: true`)**: Tại `pregnancy_safe_initiation` (dòng 1659), câu lệnh `if (hasCondition(ctx, 'severePreeclampsiaEclampsia')) return false;` chặn kê thuốc uống, trong khi `htn.inpatient.preeclampsia_emergency` chỉ chạy khi `setting === 'inpatient'`. Kết quả là bệnh nhân **không nhận được bất kỳ thuốc hạ áp nào, không có cảnh báo Magnesium sulfate, không có lệnh `REFER` cấp cứu sản khoa**, mà chỉ nhận duy nhất dòng đích huyết áp sai `120–129/70–79 mmHg`!
  2. **Thai phụ ngoại trú có HA `≥ 160/110 mmHg` chưa bật cờ tiền sản giật (ví dụ `168/112 mmHg`)**: Chỉ được kê Methyldopa uống thường quy thay vì chỉ định hạ áp khẩn cấp trong vòng 30–60 phút tại cơ sở y tế theo AHA/ACC 2025 và ESC 2024.
  3. **Bệnh nhân người lớn ngoại trú có HA `215/130 mmHg` kèm bệnh não THA / phù phổi cấp / đau ngực cấp**: Hệ thống chỉ kê viên phối hợp uống Amlodipine 5 mg + Perindopril thường quy mà không yêu cầu chuyển Cấp cứu/ICU truyền thuốc tĩnh mạch ngay.
- **Bằng chứng nguyên văn PDF**:
  - **AHA/ACC 2025**, Section 6.2 Rec 1 (*COR 1, LOE B-NR, PDF p. 73*): *"In adults with hypertensive emergencies (SBP >180 mm Hg or DBP >120 mm Hg) with evidence of acute target organ damage, admission to an intensive care unit is recommended for continuous monitoring of BP and target organ damage and for parenteral administration of an appropriate agent."*
  - **AHA/ACC 2025**, Section 5.5 Rec 3 (*COR 1, LOE B-R, PDF p. 64*): *"Pregnant individuals with SBP ≥160 mm Hg or DBP ≥110 mm Hg confirmed on repeat measurement within 15 minutes should receive antihypertensive medication (Table 23) to lower BP to <160/<110 mm Hg within 30 to 60 minutes to prevent adverse events."*
  - **ESC 2024**, Rec Table 22 (*Class IIa, Level C, PDF p. 60*) & Rec Table 33 (*Class I, Level C, PDF p. 74*): *"Severe hypertension (≥160/110 mmHg) in a pregnant woman requires an urgent treatment in a clinical/hospital setting."*
  - **VSH/VNHA 2022**, Mục 3.6.6 (*PDF tr. 42*): *"THA nặng: HATT ≥ 160 mmHg và/hoặc HATTr ≥ 110 mmHg. HATT ≥ 170 mmHg có hoặc không có HATTr ≥ 110 mmHg là một cấp cứu nội khoa và cần được điều trị khẩn cấp."*
- **Hướng khắc phục**: Bổ sung quy tắc đầu nguồn `htn.outpatient.triage_hypertensive_crisis` (`priority: 100`):
  - Khi có bất kỳ dấu hiệu HMOD cấp hoặc `(pregnant && (SBP ≥ 160 || DBP ≥ 110))` hoặc `severePreeclampsiaEclampsia`: phát lệnh `REFER` nhập Cấp cứu / Sản khoa ngay lập tức (kèm phác đồ cầu nối khẩn cấp đường uống Nifedipine IR hoặc Labetalol cho thai kỳ theo AHA 2025 Table 23 nếu chưa thiết lập được đường truyền tĩnh mạch) và chặn các rule khởi trị ngoại trú thường quy.
  - Khi HA ngoại trú `≥ 180/120 mmHg` không kèm HMOD cấp: phát cảnh báo khám loại trừ HMOD cấp, cấm Nifedipine ngậm dưới lưỡi, khởi trị/tối ưu thuốc uống và hẹn tái khám sát trong 1–7 ngày (AHA/ACC 2025 Section 6.2 Rec 3 `COR 1, LOE B-NR`; ESC 2024 Section 5.3.2).

---

### `R1-HTN-03` [CRITICAL | `rule` | `htn.inpatient.intracerebral_hemorrhage`]
**Xuất huyết não cấp áp cứng ngưỡng VSH 2022 cho cả `INTL`/`US` và bỏ sót 2 khuyến cáo Nhóm III (Harm) khi `SBP < 130 mmHg` hoặc giảm quá `> 70 mmHg/1 giờ`**

- **Vị trí mã nguồn**: `src/modules/htn/rules.inpatient.ts:591-685`
- **Mô tả sai lệch & kịch bản gây hại**:
  1. **Thiếu lệnh NGỪNG/TẠM HOÃN thuốc hạ áp khi `SBP < 130 mmHg` (COR 2a & COR 3: Harm)**: Nếu bệnh nhân xuất huyết não nhập viện có `SBP = 118 mmHg` đang dùng thuốc hạ áp nền, rule hiện chỉ trả về `MONITOR nicardipine` (*"Chưa chỉ định hạ áp đường tĩnh mạch ngay"*) mà không phát lệnh dừng các thuốc hạ áp đang dùng — gây nguy cơ tụt áp lực tưới máu não quanh ổ máu tụ và tổn thương thận cấp.
  2. **Thiếu giới hạn an toàn Nhóm III (Class III, Level B) của ESC 2024 khi `SBP ≥ 220 mmHg`**: Không cảnh báo cấm hạ SBP vượt quá `> 70 mmHg` so với nền trong vòng 1 giờ đầu (liên quan tăng biến cố thận và thần kinh).
  3. **Sai ngưỡng khởi trị và đích SBP trên profile `INTL` và `US`**: Với bệnh nhân xuất huyết não cấp có `SBP = 168 mmHg`, hệ thống trả về *"Chưa chỉ định hạ áp đường tĩnh mạch ngay"* cho cả 3 profile, trái ngược hoàn toàn với **ESC 2024** (hạ ngay trong 6 giờ đầu về đích `140–160 mmHg` để ngăn lan rộng khối máu tụ — Class IIa, Level A) và **AHA/ACC 2025** (khi SBP ban đầu `150–220 mmHg`, hạ ngay về `130 đến < 140 mmHg` — COR 2a, LOE A).
- **Bằng chứng nguyên văn PDF**:
  - **AHA/ACC 2025**, Section 5.3.9.1 (*PDF p. 55*):
    - Rec 1 (*COR 2a, LOE A*): *"For adult patients with acute spontaneous intracerebral hemorrhage (ICH) who present with SBP between 150 and 220 mm Hg, it can be beneficial to immediately lower SBP to 130 to <140 mm Hg for at least 7 days after ICH to improve functional outcomes but stop antihypertensive medications if SBP <130 mm Hg."*
    - Rec 3 (*COR 3: Harm, LOE B-NR*): *"For adult patients with acute spontaneous ICH who present with SBP >220 mm Hg, SBP should not be lowered below 130 mm Hg to reduce adverse events."*
  - **ESC 2024**, Recommendation Table 32 (*PDF p. 74*):
    - *"In patients with acute ICH, immediate BP lowering (within 6 h of symptom onset) to a systolic target 140–160 mmHg should be considered to prevent haematoma expansion and improve functional outcome."* (*Class IIa, Level A*)
    - *"In patients with ICH presenting with systolic BP ≥220 mmHg, acute reduction in systolic BP >70 mmHg from baseline within 1 h of commencing treatment is not recommended."* (*Class III, Level B*)
- **Hướng khắc phục**: Phân nhánh rõ ràng theo profile (`INTL`: khởi trị khi `SBP > 160` về `140–160 mmHg` + chặn giảm `> 70 mmHg/1h` nếu `SBP ≥ 220`; `US`: khởi trị khi `SBP 150–220` về `130–<140 mmHg`, thận trọng khi `> 220`; `VN`: `SBP > 180` về `130–180 mmHg` theo VSH 2022), bổ sung nhánh bắt buộc `STOP`/`HOLD` thuốc hạ áp khi `SBP < 130 mmHg`, và khai báo `profileDiff`.

---

### `R1-HTN-04` [CRITICAL | `rule` | `htn.inpatient.preeclampsia_emergency`]
**Tiền sản giật nặng kèm phù phổi cấp kê sai `START nicardipine` thay vì thuốc bắt buộc Class I là `Nitroglycerin` tĩnh mạch, và thiếu cổng chặn `Sodium nitroprusside`**

- **Vị trí mã nguồn**: `src/modules/htn/rules.inpatient.ts:726, 756-780`
- **Mô tả sai lệch & kịch bản gây hại**:
  Khi thai phụ bị tiền sản giật nặng / sản giật kèm biến chứng phù phổi cấp (`severePreeclampsiaEclampsia: true` và `acutePulmonaryEdema: true`), biến `contraLabetalol` được gán `true` (dòng 726), sau đó rule chuyển thẳng sang phát lệnh `START nicardipine` (`priority: 100`) — chồng lên lệnh `START nitroglycerin` của `pulmonary_edema` (`priority: 99`) và lệnh `START nicardipine` thứ hai của `differentiate_crisis`. Cả **ESC 2024** (*Class I, Level C*) và **VSH/VNHA 2022** (*Loại I, Mức C*) đều chỉ định đích danh **truyền tĩnh mạch Nitroglycerin** là thuốc lựa chọn bắt buộc trong tiền sản giật/sản giật biến chứng phù phổi cấp (vì vừa giảm tiền tải tĩnh mạch phổi vừa hạ hậu tải). Đồng thời, chưa có cổng `STOP`/`AVOID` nếu thai phụ đang truyền `sodium_nitroprusside` (nguy cơ ngộ độc xyanua thai nhi — COR 3: Harm).
- **Bằng chứng nguyên văn PDF**:
  - **ESC 2024**, Recommendation Table 33 (*PDF p. 74, Class I, Level C*): *"In pre-eclampsia or eclampsia associated with pulmonary oedema, nitroglycerin given as an i.v. infusion is recommended."*
  - **VSH/VNHA 2022**, Bảng 16 (*PDF tr. 44, Loại I, Mức C*): *"Trong phù phổi: Truyền TM Nitroglycerin. Nên tránh dùng Natri nitroprusside do nguy cơ nhiễm độc xyanua thai nhi khi điều trị kéo dài."*
  - **AHA/ACC 2025**, Section 5.5 Rec 5 (*PDF p. 64, COR 3: Harm, LOE C-LD*): *"Individuals with hypertension who are planning a pregnancy or who become pregnant should not be treated with atenolol, ACEi, ARB, direct renin inhibitors, nitroprusside, or MRA to avoid fetal harm."*
- **Hướng khắc phục**: Xử lý riêng nhánh `hasCondition(ctx, 'acutePulmonaryEdema')` ngay đầu `preeclampsia_emergency` để phát duy nhất phác đồ `START nitroglycerin` tĩnh mạch kèm Magnesium sulfate và hạn chế dịch truyền (hợp nhất/nhường với `pulmonary_edema` để không phát trùng 2–3 thuốc giãn mạch tĩnh mạch); chỉ chọn Nicardipine khi chống chỉ định Labetalol do hen phế quản hoặc nhịp chậm đơn thuần không kèm phù phổi cấp. Bổ sung cảnh báo `STOP`/`AVOID sodium_nitroprusside` ở thai kỳ.

---

### `R1-HTN-05` [CRITICAL | `rule` | `htn.outpatient.eval_bp_target`]
**Áp đích huyết áp của người không mang thai (`120–129/70–79` hoặc `< 120 mmHg`) cho phụ nữ mang thai, vi phạm giới hạn an toàn tưới máu nhau thai (`DBP ≥ 80 mmHg`)**

- **Vị trí mã nguồn**: `src/modules/htn/rules.outpatient.ts:123-278`
- **Mô tả sai lệch & kịch bản gây hại**:
  Quy tắc `htn.outpatient.eval_bp_target` hoàn toàn không kiểm tra `hasCondition(ctx, 'pregnant')`. Khi nhập thai phụ ngoại trú (ví dụ `pregnant: true`, HA `146/92 mmHg`), hệ thống xuất mục tiêu điều trị của người trưởng thành không mang thai:
  - Profile `INTL`: *"Tâm thu 120–129 mmHg và Tâm trương 70–79 mmHg"* (hoặc *"< 120 mmHg đo chuẩn hóa (KDIGO 2021)"* nếu thai phụ có bệnh thận mạn);
  - Profile `US`: *"< 130/80 mmHg"*;
  - Profile `VN` có ĐTĐ/CKD: *"< 130/80 mmHg"*.
  Hạ huyết áp tích cực xuống `120–129/70–79` hoặc `< 120 mmHg` trong thai kỳ trực tiếp vi phạm khuyến cáo **Class I** của ESC 2024 (hạ xuống `< 140/90 mmHg` nhưng **tuyệt đối không hạ HA tâm trương xuống dưới 80 mmHg**), AHA/ACC 2025 (`< 140/90 mmHg`) và VSH/VNHA 2022 (`110–140 / 85 mmHg`), làm giảm tưới máu tử cung – nhau thai và tăng nguy cơ thai chậm tăng trưởng trong tử cung.
- **Bằng chứng nguyên văn PDF**:
  - **ESC 2024**, Recommendation Table 22 (*PDF p. 60, Class I, Level C*): *"In women with chronic and gestational hypertension, it is recommended to lower BP below 140/90 mmHg but not below 80 mmHg for diastolic BP."*
  - **ESC 2024**, Section 9.2.6 (*PDF p. 59*): *"Evidence to support a BP target as low as 120–129/70–79 mmHg is lacking in pregnancy, though such evidence exists for non-pregnant patients receiving BP-lowering medication."*
  - **AHA/ACC 2025**, Section 5.5 Rec 4 (*PDF p. 64, COR 1, LOE B-R*): *"Pregnant individuals with chronic hypertension ... should receive antihypertensive therapy to achieve BP <140/90 mm Hg"*.
  - **VSH/VNHA 2022**, Bảng 16 (*PDF tr. 43, Loại I, Mức C*): *"nhằm đạt được HATTr mục tiêu là 85 mmHg tại phòng khám (và HATT từ 110 - 140 mmHg)."*
- **Hướng khắc phục**: Thêm nhánh kiểm tra ưu tiên `hasCondition(ctx, 'pregnant')` ở đầu `eval_bp_target` để phân loại THA thai kỳ (`≥ 140/90 mmHg`; mức nặng `≥ 160/110 mmHg`) và hiển thị đúng đích an toàn thai kỳ theo từng profile (`INTL`: `< 140/90 mmHg`, giữ `DBP ≥ 80 mmHg`; `VN`: `HATT 110–140 mmHg, HATTr ~85 mmHg`; `US`: `< 140/90 mmHg`).

---

### `R1-HTN-06` [CRITICAL | `matrix` | `htnRenalMatrix.methyldopa.g4`]
**Ma trận chỉnh liều thận của Methyldopa ở CKD G4 ghi ngược nghĩa dược lâm sàng: *"Giảm khoảng cách liều"* thay vì *"Kéo dài khoảng cách liều"***

- **Vị trí mã nguồn**: `src/modules/htn/matrix.ts:226`
- **Mô tả sai lệch & kịch bản gây hại**:
  Tại `htnRenalMatrix` cho hoạt chất `methyldopa` ở mức lọc cầu thận `g4` (`eGFR 15–29 mL/phút/1.73m²`), ô hướng dẫn ghi: `"Giảm khoảng cách liều"`. Trong thuật ngữ dược lâm sàng tiếng Việt, *"giảm khoảng cách giữa các liều"* đồng nghĩa với rút ngắn thời gian giữa các lần dùng thuốc (tức là **uống dày hơn**, ví dụ từ mỗi 12 giờ rút xuống mỗi 6 giờ), gây tích lũy Methyldopa và chất chuyển hóa đào thải qua thận, dẫn đến tụt huyết áp nặng, an thần sâu và ức chế thần kinh trung ương — trái ngược 180 độ với chính hồ sơ `kb/drugs/methyldopa.json`!
- **Bằng chứng đối chiếu**:
  - `src/modules/htn/matrix.ts:226`: `g4: { status: 'adjust', note: 'Giảm khoảng cách liều' }`
  - `kb/drugs/methyldopa.json`: `"noteVi": "Kéo dài khoảng cách giữa các liều ở bệnh nhân suy thận: eGFR 15–50 mL/phút dùng mỗi 8–12 giờ; eGFR < 15 mL/phút dùng mỗi 12–24 giờ."`
- **Hướng khắc phục**: Sửa ngay dòng 226 của `src/modules/htn/matrix.ts` thành `'Kéo dài khoảng cách liều (mỗi 12–24h)'`.

---

## 4. Chi tiết các phát hiện mức `MAJOR` (`R1-HTN-07` đến `R1-HTN-23`)

### Nhóm 4.1 — Sai lệch thuật toán điều trị & thiếu khuyến cáo Class I / Class III nội – ngoại trú (`R1-HTN-07` → `R1-HTN-18`)

#### `R1-HTN-07` [MAJOR | `missing` | `htn.inpatient.acute_coronary_syndrome`]
- **Vấn đề**: Thiếu hoàn toàn quy tắc nội viện xử trí **Cấp cứu THA kèm Hội chứng vành cấp (ACS)** và giao diện `src/modules/htn/inputs.ts` (nhóm `htn_inpatient_emergency_hmod`) cũng thiếu ô chọn ACS, mặc dù biến `acuteAcsWithin24h` có xuất hiện trong `hasAcuteHmod` tại `rules.inpatient.ts:67`.
- **Bằng chứng PDF**: **VSH/VNHA 2022** Bảng 14 (*tr. 41*): *"Hội chứng vành cấp | Ngay lập tức, HATT < 140 mmHg | Điều trị ưu tiên: Nitroglycerine; Labetalol | Điều trị thay thế: Urapidil"*; **ESC 2024** Table 16 (*p. 73*): *"Acute coronary event | Immediately, SBP <140 mmHg | Nitroglycerin, labetalol"*; **AHA/ACC 2025** Table 27 (*p. 75*): *"Acute coronary syndromes: Esmolol†, labetalol, nicardipine, nitroglycerin† — †Agent of choice for acute coronary syndromes."*
- **Khắc phục**: Bổ sung ô chọn `acuteAcsWithin24h` trên UI nội viện và cài đặt `htn.inpatient.acute_coronary_syndrome` ưu tiên truyền tĩnh mạch Nitroglycerin (kiểm tra cổng PDE-5i và nhồi máu thất phải / SBP < 90) hoặc Esmolol/Labetalol tĩnh mạch để đạt đích `SBP < 140 mmHg` ngay lập tức.

#### `R1-HTN-08` [MAJOR | `rule` | `htn.outpatient.step2_triple_combination`]
- **Vấn đề**: Cả quy tắc nâng bậc Bước 2 (`step2_triple_combination`, dòng 856–880) và Bước 3 THA kháng trị (`step3_resistant_spironolactone`, dòng 1163–1184; `step3_resistant_alternative`, dòng 1336–1340) đều dùng cứng ngưỡng chẩn đoán `≥ 140/90 mmHg` (`sbp_hypertension` / `dbp_hypertension`) thay vì ngưỡng đích điều trị của bệnh nhân (`≥ 130/80 mmHg`). Hệ quả là mọi bệnh nhân đang dùng 2 thuốc hoặc 3 thuốc chuẩn mà huyết áp còn ở khoảng **`130–139 / 80–89 mmHg`** (ví dụ `136/86 mmHg` ở người có ĐTĐ, CKD, ASCVD) bị hệ thống bỏ qua hoàn toàn (`produce()` trả về `null`), gây trì trệ điều trị (*therapeutic inertia*).
- **Bằng chứng PDF**: **ESC 2024** Rec Table 16 (*Class I, Level B, p. 51*) & Section 8.5.2 (*p. 54*): *"an on-treatment systolic BP of 135 mmHg is not optimal, even though pre-treatment BP was reduced from 150 mmHg"*; **AHA/ACC 2025** Section 5.6 (*p. 68*): định nghĩa THA kháng trị dựa trên đích `< 130/80 mmHg`; **VSH/VNHA 2022** Hình 2 & Bảng 7 (*tr. 21, 23*): đích `< 130/80 mmHg` khi có bệnh đồng mắc/nguy cơ cao và `HATTr < 80 mmHg` cho mọi bệnh nhân.
- **Khắc phục**: Xây dựng helper chung `getUncontrolledThreshold(ctx)` trả về đúng ngưỡng chưa đạt đích theo profile, tuổi, suy yếu và bệnh đồng mắc (`130/80`, `140/80`, hoặc `140/90 mmHg`), dùng thống nhất cho Bước 1 (đang dùng 1 thuốc), Bước 2 và Bước 3.

#### `R1-HTN-09` [MAJOR | `rule` | `htn.outpatient.step1_dual_combination`]
- **Vấn đề**: Chiến lược khởi trị Đơn trị liệu vs Viên phối hợp đôi cố định liều (Dual SPC) ở Bước 1 (`rules.outpatient.ts:376-612, 697-732`) sai lệch trên **cả 3 profile**:
  1. **Profile `US` (AHA/ACC 2025)**: Hệ thống kê **Dual SPC** cho THA Giai đoạn 1 nguy cơ cao (`130–139/80–89 mmHg`) và **bỏ trống không điều trị** cho THA Giai đoạn 1 nguy cơ thấp (`PREVENT < 7.5%`). Trong khi đó, AHA/ACC 2025 Section 5.2.4 chỉ khuyến cáo Dual SPC (`COR 1, LOE B-R`) cho **Stage 2 (`≥ 140/90 mmHg`)**, còn **Stage 1 (`130–139/80–89 mmHg`) khởi trị bằng ĐƠN TRỊ 1 thuốc** (`COR 2a, LOE C-EO`); đồng thời nhóm Stage 1 nguy cơ thấp (`PREVENT < 7.5%`) có chỉ định dùng thuốc **COR 1, LOE B-R** nếu HA vẫn `≥ 130/80 mmHg` sau 3–6 tháng thay đổi lối sống.
  2. **Profile `INTL` (ESC 2024)**: Hệ thống kê ngay **Dual SPC** cho nhóm Huyết áp tăng nguy cơ cao (`130–139/80–89 mmHg`), bỏ qua giai đoạn 3 tháng thay đổi lối sống bắt buộc (Rec Table 17) và vi phạm ngoại lệ đơn trị của ESC 2024 Rec Table 16 footnote / Section 8.5.1 (nhóm *Elevated BP* có chỉ định dùng thuốc thuộc ngoại lệ khởi đầu bằng **đơn trị liệu** vì chỉ cần giảm nhẹ HA để đạt đích `120–129`).
  3. **Profile `VN` (VSH/VNHA 2022)**: Bị **đảo ngược hoàn toàn** — xếp toàn bộ THA Độ 1 nguy cơ thấp (`140–159/90–99 mmHg`) vào đơn trị liệu (dòng 575–611, viện dẫn sai `vsh.htn.2022.monotherapy_elderly`), trong khi theo VSH 2022 Bảng 9 (*Loại I, Mức A*) mọi bệnh nhân THA Độ 1 (`≥ 140/90`) dưới 80 tuổi không suy yếu đều ưu tiên khởi trị phối hợp 2 thuốc SPC; ngược lại ở nhóm *HA bình thường - cao* (`130–139/85–89 mmHg`), hàm `isVnVeryHighRiskHighNormal` (dòng 390–394) lại bỏ sót ĐTĐ, CKD, suy tim, phân tầng nguy cơ cao (VSH 2022 Bảng 6, 18, 20, 21) và dùng sai ngưỡng DBP `80` thay vì `85 mmHg` (`htn.bp.dbp_high_normal_vn`).
- **Bằng chứng PDF**: **AHA/ACC 2025** Section 5.2.4 Rec 1 & Rec 2 (*p. 42*) & Take-Home Message 7 (*p. 6*); **ESC 2024** Rec Table 16 & 17, Section 8.5.1 (*p. 51–53*); **VSH/VNHA 2022** Bảng 6 (*tr. 22–23*) & Bảng 9 (*tr. 29*).
- **Khắc phục**: Tách bạch rõ điều kiện Đơn trị vs Dual SPC cho từng profile đúng như phân tích chi tiết ở trên và dùng đúng ngưỡng `htn.bp.dbp_high_normal_vn = 85` cho VSH 2022.

#### `R1-HTN-10` [MAJOR | `rule` | `htn.outpatient.step1_dual_combination`]
- **Vấn đề**: Vi phạm ngưỡng tuổi khởi trị thuốc của VSH/VNHA 2022 ở người cao tuổi Việt Nam và ngưỡng trì hoãn dùng thuốc của ESC 2024 ở bệnh nhân CKD nặng (`eGFR < 30`):
  1. Ở profile `VN`: VSH/VNHA 2022 Bảng 6 (*tr. 23*) và Bảng 17 (*tr. 45, Loại I Mức B*) quy định ngưỡng HA cần khởi trị thuốc ở nhóm **70–79 tuổi là `≥ 140/90 mmHg`** và ở người rất già **`≥ 80 tuổi` là `≥ 160/90 mmHg`**. Hiện tại cụ ông 82 tuổi khỏe mạnh có HA `148/84 mmHg` vẫn bị phát lệnh `START amlodipine 2.5 mg`; bệnh nhân 74 tuổi có BMV và HA `134/82 mmHg` vẫn bị phát `START` Dual SPC.
  2. Ở profile `INTL`: ESC 2024 Section 8.4 (*p. 52*) quy định trì hoãn cân nhắc khởi trị thuốc cho đến khi HA `> 140/90 mmHg` ở nhóm nguy cơ cạnh tranh cao bao gồm **`eGFR < 30 mL/phút/1.73m²`**, nhưng hiện tại bệnh nhân `eGFR = 22` có HA `134/82 mmHg` vẫn bị `isIntlHighRiskElevated` kê Dual SPC.
- **Khắc phục**: Ràng buộc ngưỡng khởi trị theo nhóm tuổi `70–79` (`≥ 140/90`) và `≥ 80` (`≥ 160/90`) cho profile `VN`, và không kích hoạt `isIntlHighRiskElevated` ở dải `130–139/80–89` khi `egfr < 30` ở profile `INTL`.

#### `R1-HTN-11` [MAJOR | `rule` | `htn.outpatient.step3_resistant_spironolactone`]
- **Vấn đề**: Quy tắc Bước 3 (`rules.outpatient.ts:1199, 1225, 1280`) áp cứng cổng `eGFR ≥ 45 mL/phút/1.73m²` của AHA/ACC 2025 cho cả `INTL` và `VN` (bỏ hoang ngưỡng `htn.spiro.egfr_contra_esc = 30`), khiến bệnh nhân ở profile `INTL`/`VN` có `eGFR 30–44 mL/phút/1.73m²` và `K+ ≤ 4.5 mmol/L` bị phát lệnh `AVOID spironolactone`, trái với **ESC 2024** Section 9.13.3 (*p. 69*: cho phép dùng khi `eGFR ≥ 30` và `K+ ≤ 4.5`, chỉ chống chỉ định khi `eGFR < 30`) và **VSH/VNHA 2022** Bảng 11 (*tr. 33*: `< 30 mL/phút`). Ngoài ra, rationale dòng 1280 ghi sai đồng loạt mức khuyến cáo là *"mức IIa"*, trong khi **AHA/ACC 2025** (Section 5.6 Rec 2, *p. 68*) xếp **`COR 1, LOE B-R`** và **VSH/VNHA 2022** (Bảng 9, *tr. 29*) xếp **`Loại I, Mức A`**.
- **Khắc phục**: Dùng ngưỡng `eGFR ≥ 45` cho `US` và `eGFR ≥ 30` (`htn.spiro.egfr_contra_esc`) cho `INTL`/`VN` (kèm lưu ý thận trọng theo dõi sát K+/eGFR khi `eGFR 30–44`), sửa đúng hạng khuyến cáo và bổ sung `profileDiff`.

#### `R1-HTN-12` [MAJOR | `rule` | `htn.outpatient.eval_bp_target`]
- **Vấn đề**: Ba sai lệch lớn trong phân loại và xác định đích huyết áp (`rules.outpatient.ts:145-277`):
  1. **Profile `VN`**: Đặt đích chung là `< 140/90 mmHg` và hiển thị nhãn *"Tăng huyết áp Độ 3 (VSH / BYT)"*, trong khi **VSH/VNHA 2022** Hình 2 (*tr. 21*) & Bảng 7 (*tr. 23*) quy định đích không bệnh đồng mắc là **`< 140/80 mmHg`** (*"Đích HATTr: < 80 mmHg cho tất cả bệnh nhân"*) và Bảng 1 (*tr. 9*) đã bỏ phân độ Độ 3 (gộp vào Độ 2 `≥ 160/100` và Cơn THA `≥ 180/120`).
  2. **Profile `INTL`**: Vẫn in chuỗi *"mức Độ 1 / Độ 2 / Độ 3"* dù **ESC 2024** Table 5 (*p. 22*) đã bãi bỏ phân độ 1–3; đồng thời xuất đích `120–129 mmHg (ESC 2024) hoặc < 120 mmHg đo chuẩn hóa (KDIGO 2021)` cho mọi bệnh nhân CKD kể cả khi **`eGFR ≤ 30 mL/phút/1.73m²`**, vi phạm ESC 2024 Rec Table 26 (*p. 65*: chỉ áp cho `eGFR > 30`, cá thể hóa khi `eGFR ≤ 30` hoặc ghép thận) và thiếu cảnh báo an toàn **KDIGO 2021 Practice Point 3.1.1** (*p. 29*: áp đích `< 120 mmHg` khi đo HA không chuẩn hóa có thể gây hại).
  3. **Bỏ qua phân loại THA áo choàng trắng & THA ẩn giấu**: Các trường `homeSbp`/`homeDbp` và `abpm24hSbp`/`abpm24hDbp` chỉ được nối văn bản thụ động mà không đối chiếu với HA phòng khám để phát hiện *White-coat HTN* / *Masked HTN*.
- **Khắc phục**: Cập nhật đích VN chuẩn `< 140/80 mmHg` theo VSH 2022, bỏ nhãn Độ 1–3 ở ESC 2024, kiểm tra `eGFR > 30` + thêm cảnh báo KDIGO Practice Point 3.1.1, và bổ sung nhận diện THA áo choàng trắng / ẩn giấu từ HBPM/ABPM.

#### `R1-HTN-13` [MAJOR | `rule` | `htn.outpatient.compelling_beta_blockers`]
- **Vấn đề**: Quy tắc `compelling_beta_blockers` (`rules.outpatient.ts:1440-1558`) phát lệnh `START bisoprolol` cho **mọi** bệnh nhân có `hf: true` (kể cả **HFpEF**) và **mọi** bệnh nhân có `ascvd: true` (kể cả đột quỵ/TIA, bệnh động mạch ngoại biên PAD, hoặc hội chứng vành mạn sau tái thông có LVEF bình thường).
- **Bằng chứng PDF**: **AHA/ACC 2025** Section 5.3.4.2 (*p. 53*): *"BB are not recommended for hypertension management with HFpEF given negative chronotropic effects and should be restricted to specific comorbid conditions (eg, arrhythmia, ACS)."* **ESC 2024** Rec Table 16 (*p. 51*): chỉ nêu *"angina, post-myocardial infarction, heart failure with reduced ejection fraction, or for heart rate control"*. **VSH/VNHA 2022** Bảng 19 (*tr. 49*): *"Hội chứng vành mạn sau tái thông có chức năng thất trái bình thường không có chỉ định CB thường quy | III C"*.
- **Khắc phục**: Kiểm tra `lvef` trong suy tim (chỉ bắt buộc ở HFrEF `LVEF ≤ 40%`, cân nhắc ở HFmrEF; không tự phát `START bisoprolol` ở HFpEF nếu không có rung nhĩ/đau thắt ngực/sau NMCT) và tách riêng tiền sử NMCT / đau thắt ngực khỏi cờ `ascvd` chung (không áp cho đột quỵ/TIA/PAD đơn thuần).

#### `R1-HTN-14` [MAJOR | `missing` | `htn.outpatient.ckd_albuminuria_rasi`]
- **Vấn đề**: Trường `uacr` (Albumin niệu ACR) được khai báo trong `src/modules/htn/inputs.ts:91` nhưng **không được đọc ở bất kỳ dòng code nào** trong toàn bộ module! Do đó hệ thống bỏ sót hoàn toàn khuyến cáo **Class I / 1B / COR 1** bắt buộc khởi trị hoặc chuyển sang nền tảng ức chế hệ RAS (ACEi hoặc ARB) khi bệnh nhân THA kèm CKD và/hoặc ĐTĐ có tăng albumin niệu (`ACR ≥ 30 mg/g` tức `≥ 3 mg/mmol`), đặc biệt ở người đang dùng phác đồ không có RASi (ví dụ CCB + Lợi tiểu). Module cũng chưa nhắc chỉ định Nhóm I thuốc ức chế SGLT2 ở bệnh nhân THA kèm CKD (`eGFR > 20`, ESC 2024 Rec Table 26) hoặc HFpEF (Rec Table 27).
- **Bằng chứng PDF**: **KDIGO 2021** Rec 3.2.1 (`1B`) & Rec 3.2.3 (`1B`) (*p. 29*); **AHA/ACC 2025** Section 5.3.1 Rec 4 (`COR 1, LOE A`, *p. 50*) & Section 5.3.8 Rec 2 (`COR 1, LOE B-R`, *p. 54*); **VSH/VNHA 2022** Bảng 22 (*Loại I, Mức B, tr. 52*); **ESC 2024** Rec Table 26 (*Class I, Level A, p. 65*).
- **Khắc phục**: Bổ sung quy tắc `htn.outpatient.ckd_albuminuria_rasi` đọc trực tiếp `uacr` để bắt buộc tối ưu ACEi/ARB khi `ACR ≥ 3 mg/mmol` (`≥ 30 mg/g`), kèm nhắc phối hợp SGLT2i bảo vệ tim-thận ở CKD / suy tim.

#### `R1-HTN-15` [MAJOR | `missing` | `htn.outpatient.pregnancy_management_gaps`]
- **Vấn đề**: Quản lý THA thai kỳ ngoại trú (`rules.outpatient.ts:1614-1729`) thiếu **4 khuyến cáo Class I / Class III**:
  1. Bỏ sót khuyến cáo **Class I** dự phòng tiền sản giật bằng **Aspirin liều thấp (75–162 mg/ngày từ tuần 12–36)** ở thai phụ có THA mạn tính hoặc nguy cơ cao tiền sản giật (**AHA/ACC 2025** Section 5.5 Rec 2 `COR 1, LOE B-R` *p. 64*; **VSH 2022** Bảng 16 `Loại I, Mức C` *tr. 43*; **ESC 2024** Section 9.2.5 *p. 59*).
  2. Kê cứng `START methyldopa` cho cả profile `US`, trong khi **AHA/ACC 2025** Section 5.5 Rec 1 (`COR 1, LOE A`, *p. 64*) khuyến cáo ưu tiên **Labetalol** và **Nifedipine phóng thích kéo dài** làm lựa chọn hàng đầu hơn Methyldopa.
  3. Quy tắc `pregnancy_contraindication_rasi` chỉ kiểm tra `RASI_IDS` và `MRA_IDS` (và bỏ trống `drugId` trong object trả về), bỏ sót **Atenolol** và **Aliskiren** (đều thuộc danh sách **COR 3: Harm** của AHA/ACC 2025 Section 5.5 Rec 5 *p. 64* và ESC 2024 *p. 59* do gây thai chậm tăng trưởng / độc tính thai nhi).
  4. Bỏ sót cảnh báo tránh dùng **Methyldopa giai đoạn hậu sản** do nguy cơ **trầm cảm sau sinh** (**VSH 2022** Bảng 16 `Loại I, Mức C` *tr. 44*; **ESC 2024** Section 9.2.7 *p. 59*).
- **Khắc phục**: Bổ sung rule dự phòng Aspirin liều thấp, phân nhánh ưu tiên Labetalol / Nifedipine ER ở profile `US`, mở rộng danh sách `STOP` thai kỳ bao gồm `atenolol`, `aliskiren`, `sodium_nitroprusside` kèm `drugId`, và cập nhật cảnh báo hậu sản của Methyldopa.

#### `R1-HTN-16` [MAJOR | `rule` | `htn.inpatient.stroke_no_thrombolysis`]
- **Vấn đề**: Hai thiếu sót trong xử trí đột quỵ thiếu máu não cấp nội viện (`rules.inpatient.ts:426-585`):
  1. Ở nhóm không tiêu sợi huyết (`stroke_no_thrombolysis`), hệ thống áp cứng ngưỡng `> 220/120 mmHg` (hạ 15% trong 1 giờ đầu) cho cả 3 profile, bỏ qua ngưỡng tâm trương thấp hơn của **ESC 2024** Rec Table 32 (*p. 74, Class IIa Level C*) là **`≥ 220/110 mmHg`** (hạ ~15% trong **24 giờ đầu**) và khung thời gian 24 giờ của **AHA/ACC 2025** Section 5.3.9.2 Rec 4 (*p. 56, COR 2b LOE C-LD*).
  2. Ở nhóm tái tưới máu (`stroke_thrombolysis`), thiếu cảnh báo **COR 3: Harm, LOE A** của **AHA/ACC 2025** Section 5.3.9.2 Rec 6 (*p. 56*): sau can thiệp lấy huyết khối cơ học tái thông thành công tắc mạch lớn, hạ tích cực `SBP < 140 mmHg` trong 24–72 giờ đầu làm xấu kết cục chức năng thần kinh dài hạn (dữ liệu từ ENCHANTED-2/MT, OPTIMAL-BP).
- **Khắc phục**: Phân biệt ngưỡng DBP theo profile (`INTL`: `≥ 220/110 mmHg` trong 24h; `US`: `≥ 220/120 mmHg` trong 24h; `VN`: `> 220/120 mmHg`) và bổ sung cảnh báo tránh hạ quá mức `< 140 mmHg` sau lấy huyết khối cơ học tái thông thành công.

#### `R1-HTN-17` [MAJOR | `rule` | `htn.outpatient.screen_primary_aldosteronism`]
- **Vấn đề**: Tự mâu thuẫn giữa mô tả và điều kiện kích hoạt (`rules.outpatient.ts:1735-1769`): `nameVi` ghi *"Tầm soát cường aldosteron nguyên phát (ARR) khi hạ kali máu hoặc THA kháng trị / khởi phát sớm"*, nhưng hàm `when()` chỉ kiểm tra `unprovokedHypokalemia`, `k < 3.5` hoặc cờ thủ công `suspectedSecondaryHtn` — **hoàn toàn không tự kích hoạt khi bệnh nhân có THA kháng trị hoặc khởi phát THA ở người trẻ `< 40 tuổi`**.
- **Bằng chứng PDF**: **VSH/VNHA 2022** Bảng 13 (*tr. 39, Loại I, Mức C*): sàng lọc cường aldosteron nguyên phát khi có THA kháng trị, hạ kali máu, u thượng thận, tiền sử gia đình THA sớm hoặc đột quỵ `< 40 tuổi`; **ESC 2024** Rec Table 21 (*p. 58, Class I, Level B*): tầm soát THA thứ phát cho người lớn chẩn đoán THA `< 40 tuổi` (trừ người trẻ béo phì ưu tiên đánh giá OSA trước) & Rec Table 13 (*p. 43, Class IIa, Level B*); **AHA/ACC 2025** Section 5.6 Rec 1 (*p. 68, COR 1, LOE B-NR*).
- **Khắc phục**: Tự động kích hoạt rule khi đạt tiêu chuẩn THA kháng trị hoặc THA xác định có `age < 40`, và sửa trích dẫn sang VSH 2022 Bảng 13 (*tr. 39*).

#### `R1-HTN-18` [MAJOR | `missing` | `htn.outpatient.orthostatic_hypotension_management`]
- **Vấn đề**: Thiếu khuyến cáo **Class I, Level A** của **ESC 2024** Recommendation Table 24 (*p. 64*) đối với bệnh nhân có Hạ huyết áp tư thế (`orthostaticHypotension: true`): khi bệnh nhân đang dùng các thuốc làm nặng hạ HA tư thế (chẹn alpha-1 `doxazosin`, thuốc liệt giao cảm trung ương `clonidine`/`methyldopa`, lợi tiểu hoặc chẹn beta không có chỉ định bắt buộc), hệ thống hiện chưa phát khuyến cáo áp dụng biện pháp không dùng thuốc kèm **chuyển đổi (`SWITCH`)** các thuốc gây hạ HA tư thế sang nhóm thay thế an toàn hơn (DHP-CCB tác dụng dài hoặc RASi) thay vì tự ý ngưng/giảm liều đơn thuần; cũng chưa nhắc đo HA sau đứng 1 và 3 phút trước khi khởi trị/tăng liều (*Class I, Level B*).
- **Khắc phục**: Bổ sung quy tắc `htn.outpatient.orthostatic_hypotension_management` phát khuyến cáo `SWITCH` / tối ưu phác đồ và hướng dẫn đo HA tư thế đứng 1 & 3 phút theo ESC 2024 Rec Table 24.

---

### Nhóm 4.2 — Kiểm định Trích dẫn PDF, Hạng khuyến cáo (`COR`/`LOE`) & Quy tắc QA-7 (`R1-HTN-19` → `R1-HTN-21`)

#### `R1-HTN-19` [MAJOR | `citation` | `aha.acc.2025.acei_angioedema_contra`]
- **Vấn đề**: Ba trích dẫn trọng yếu của AHA/ACC 2025 trong `kb/citations/htn.json` mắc lỗi nghiêm trọng khi đối chiếu nguyên văn PDF:
  1. **`aha.acc.2025.acei_angioedema_contra`** (*PDF p. 40*): Trích nhầm câu của dòng thuốc **ARB** (*"Do not use if patient has history of angioedema with ARBs. Patients with a history of angioedema with an ACEi can receive an ARB beginning 6 wk after ACEi is discontinued."*) thay vì dòng **ACEi** (*"Do not use if patient has history of angioedema with ACEi."* ở cùng trang 40), nhưng `quoteVi` lại dịch thành *"Chống chỉ định ACEi nếu có tiền sử phù mạch do ACEi"*, đồng thời gán khống `cor: "1", loe: "A"` cho bảng tra cứu thuốc không phân hạng.
  2. **`aha.acc.2025.stage1_prevent_75`** (*PDF p. 6*): Trích câu của nhóm nguy cơ **THẤP** (`< 7.5%`) và **cắt cụt mất vế điều kiện 3–6 tháng thay đổi lối sống** (*"by PREVENT of <7.5%, initiation of medication therapy to lower blood pressure is recommended"* — bỏ mất *"if average blood pressure remains ≥130/80 mm Hg after an initial 3- to 6-month trial of lifestyle modification."*), rồi lại lấy câu `< 7.5%` này làm bằng chứng cho ngưỡng nguy cơ **CAO** `htn.risk.prevent_high_us = ≥ 7.5%` (vốn nằm ở Section 5.2.2 Rec 5 & Rec 6 trang 36, trong đó Rec 6 cho DBP có `LOE: C-LD`).
  3. **`aha.acc.2025.severe_asymptomatic_inpatient`** (*PDF p. 75*): Trích văn xuôi diễn giải và gán `cor: "1", loe: "B"`, làm đảo ngược hoàn toàn hạng khuyến cáo chính thức tại **Section 6.2 Rec 4** (*PDF p. 73*) vốn là **`COR 3: Harm, LOE B-NR`** (*"In hospitalized adults with severe hypertension (>180/120 mm Hg) without evidence of new or worsening target organ damage, routine treatment with IV or oral antihypertensive medications is not recommended."*).
- **Khắc phục**: Sửa lại nguyên văn `quote`, `locator`, `page`, và `cor`/`loe` của cả 3 mục theo đúng trang 40, trang 36 và trang 73 của `AHA_ACC_2025_High_Blood_Pressure_Guideline.pdf`.

#### `R1-HTN-20` [MAJOR | `citation` | `kb/citations/htn.json`]
- **Vấn đề**: Kiểm định toàn diện 57 mục trong `kb/citations/htn.json` phát hiện **36/57 mục** có sai sót siêu dữ liệu học thuật (gán khống `cor`/`loe`, sai `cor`/`loe` so với bảng khuyến cáo gốc, sai `locator`, hoặc cắt thiếu câu):

| Nhóm lỗi trích dẫn | Các `citationId` bị ảnh hưởng | Chi tiết đối chiếu nguyên văn PDF |
| :--- | :--- | :--- |
| **Sai `COR`/`LOE` so với Bảng khuyến cáo gốc** | `esc.htn.2024.arr_screening`, `vsh.htn.2022.monotherapy_elderly` | `arr_screening` trích văn xuôi p. 39 (ghi nhầm `Section 7.2` thay vì `Section 7.6.2`) và gán `I, B`, nhưng **ESC 2024 Rec Table 13 (p. 43)** xếp **`Class IIa, Level B`**. `monotherapy_elderly` trích văn xuôi tr. 34 gán `1, B`, nhưng **VSH 2022 Bảng 9 (tr. 29)** xếp **`Loại I, Mức A`**. |
| **Sai `locator` hoặc trích phạm vi quá hẹp** | `esc.htn.2024.elevated_high_risk`, `esc.htn.2024.gout_thiazide_caution`, `esc.htn.2025.urapidil_iv`, `aha.acc.2025.nifedipine_no_sublingual` | `elevated_high_risk` trích câu hẹp cho riêng *"pre-diabetes or obesity"* (p. 11) thay vì **Rec Table 17 (p. 52)**; `gout_thiazide_caution` ghi `Section 9.5` thay vì **`Section 9.3.3`** (p. 62); `urapidil_iv` ghi `Section 4.1` thay vì **`Section 12`** (ESC 2025 Pregnancy p. 10); `nifedipine_no_sublingual` ghi `Table 23` thay vì **`Table 22`** (AHA 2025 p. 65). |
| **Cắt thiếu câu làm mất bằng chứng trong `quote`** | `ema.indapamide.dosing`, 6 mục `aha.acc.2025.iv_*` (`nicardipine`, `clevidipine`, `labetalol`, `esmolol`, `nitroglycerin`, `nitroprusside`) | `ema.indapamide.dosing` dừng ở mục *3 PHARMACEUTICAL FORM*, bỏ sót hoàn toàn Mục 4.2 (*"One tablet per 24 hours, preferably in the morning"*); 6 mục `aha.acc.2025.iv_*` (Table 26 p. 74) chỉ trích cột liều nhưng `quoteVi` lại dịch cả cột *Comments* (chống chỉ định, lưu ý lâm sàng). |
| **Gán khống `cor`/`loe` cho bảng tra cứu / nhãn thuốc / QĐ 3192** | 3 mục `byt.3192.2010.*`, 12 mục bảng tra cứu `vsh.htn.2022.*` (Bảng 1, 10, 11, 14), 11 mục Table 13 & 26 `aha.acc.2025.*`, 3 mục `fda.*`/`ema.*`, 6 mục văn xuôi/Table 5, 14 `esc.htn.2024.*` | Các văn bản QĐ 3192/2010, SmPC/FDA, và các bảng phân loại / bảng liều thuốc (Table 5, 13, 26; Bảng 1, 10, 11, 14) **không hề có cột phân hạng COR/LOE**. Riêng `esc.htn.2024.ban_dual_rasi` nên đổi sang trích trực tiếp **Rec Table 16 (p. 51)** để giữ hợp lệ `Class III, Level A`. |

- **Khắc phục**: Xóa trường `cor`/`loe` khỏi mọi trích dẫn từ nhãn thuốc, QĐ 3192, văn xuôi và bảng không phân hạng; chuyển sang trích trực tiếp *Recommendation Table* cho các khuyến cáo có phân hạng chính thức; sửa toàn bộ `locator` và nối đủ phần văn bản bị cắt thiếu.

#### `R1-HTN-21` [MAJOR | `citation` | `htn.outpatient.safety_monitoring_cr_k`]
- **Vấn đề**: Vi phạm nghiêm trọng quy tắc **QA-7** (*nội dung `quote` không chứa khẳng định lâm sàng mà rule/drug tuyên bố*):
  1. Quy tắc `htn.outpatient.safety_monitoring_cr_k` (`rules.outpatient.ts:1797`) khuyến cáo kiểm tra lại **Creatinin và Kali máu sau 1–4 tuần** khởi trị/tăng liều RASi, lợi tiểu hoặc MRA, nhưng lại gán `citationIds: ['esc.htn.2024.bp_target_general', 'kdigo.bp.2021.target_sbp_120']` — hai câu này chỉ nói về đích SBP `120–129` và `< 120 mmHg`, **không có một từ nào về xét nghiệm Creatinin hay Kali máu**.
  2. Quy tắc `htn.outpatient.screen_primary_aldosteronism` (`rules.outpatient.ts:1763`) trích `vsh.htn.2022.drugs_table_other` (bảng liều thuốc hạ áp khác) cho chỉ định xét nghiệm ARR thay vì Bảng 13 (*tr. 39*).
  3. Tại `kb/drugs/`, **14/18 hồ sơ thuốc** thuộc quyền sở hữu của `htn` (`moxonidine`, `sodium_nitroprusside`, `clevidipine`, `nicardipine`, `labetalol`, `nitroglycerin`, `urapidil`, `esmolol`, `methyldopa`, `clonidine`, `lercanidipine`, `felodipine`, `nifedipine`, `hydrochlorothiazide`) dùng trích dẫn chỉ chứa con số liều (`vsh.htn.2022.drugs_table_*`, `aha.acc.2025.iv_*` thiếu cột *Comments*) hoặc trích dẫn chỉ nói về HFrEF (`esc.hf.2026.moxonidine_contra`) để chứng minh cho chống chỉ định suy thận (`eGFR < 30`), suy gan, dị ứng đậu nành/trứng, tương tác PDE-5i, thai kỳ và cho con bú.
- **Khắc phục**: Bổ sung trích dẫn **KDIGO 2021 Practice Point 3.2.3** (*PDF p. 29*: kiểm tra BP, serum creatinine, potassium trong 2–4 tuần) và **AHA/ACC 2025 Section 5.2.8 / 5.2.9** (*PDF p. 49*: basic metabolic panel sau 2–4 tuần) cho `safety_monitoring_cr_k`; bổ sung VSH 2022 Bảng 13 cho `screen_primary_aldosteronism`; và bổ sung đầy đủ trích dẫn cột *Comments* của Table 13/26, Bảng 11/16 hoặc tờ SmPC/FDA tương ứng cho 14 file thuốc.

---

### Nhóm 4.3 — Hồ sơ Thuốc (`kb/drugs`) & Ngưỡng lâm sàng QA-10 (`R1-HTN-22` → `R1-HTN-23`)

#### `R1-HTN-22` [MAJOR | `drug` | `kb/drugs/chlorthalidone.json`]
- **Vấn đề**: Phát hiện **5 bất cập dược lâm sàng và bất đồng bộ liều tối đa** giữa `kb/drugs/*.json`, `kb/thresholds/htn.json` và guideline gốc:
  1. **`chlorthalidone.json` & `htnRenalMatrix.chlorthalidone.g4`** (`matrix.ts:199`): Khẳng định *"Mất hiệu quả lợi tiểu khi eGFR < 30 mL/phút/1.73m², chuyển sang lợi tiểu quai"* (`status: 'avoid'`), trái với bằng chứng thử nghiệm ngẫu nhiên **CLICK** được cả **ESC 2024** (*Section 9.7.3, PDF p. 65*) và **KDIGO 2021** (*Section 3.2, PDF p. 51*) ghi nhận: **Chlorthalidone vẫn hạ huyết áp và giảm albumin niệu hiệu quả ở bệnh thận mạn giai đoạn 4 (`eGFR 15–30 mL/phút/1.73m²`)**, đặc biệt khi phối hợp với lợi tiểu quai trong THA kháng trị.
  2. **`methyldopa.json`**: Ghi `maxDose: "1000 mg 2 lần/ngày"` (2.000 mg/ngày) nhưng 2 trích dẫn đính kèm chỉ ghi tối đa `1.000 mg/ngày` (`aha.acc.2025.table13_methyldopa`: *"250-1,000 mg/d"*; `vsh.htn.2022.drugs_table_other`: *"250 - 500 x 2 lần/ngày"*), trong khi bảng liều thai kỳ **AHA/ACC 2025 Table 22** (*PDF p. 65*) ghi `500–3,000 mg/d in 2–4 divided doses`.
  3. **`nifedipine.json`**: Ghi `maxDose: "60 mg 1 lần/ngày"` nhưng cả trích dẫn `vsh.htn.2022.drugs_table_ccb`, AHA/ACC 2025 Table 13 và ngưỡng `htn.nifedipine.dose_max` đều ghi **`90 mg/ngày`** (trong thai kỳ Table 22 tới `120 mg/ngày`).
  4. **`doxazosin.json` vs `htn.doxazosin.dose_max`**: `doxazosin.json` ghi `maxDose: "16 mg"` (theo AHA Table 13) nhưng `kb/thresholds/htn.json` lại ghi `htn.doxazosin.dose_max = 2 mg` (lấy cột liều thông thường của VSH 2022 Bảng 10).
  5. **`esmolol.json`**: Thiếu chống chỉ định khi bệnh nhân **đang dùng đồng thời một thuốc chẹn beta khác** (*"Contraindicated in patients with concurrent beta-blocker therapy, bradycardia, or decompensated HF"* — AHA/ACC 2025 Table 26, *PDF p. 74*).
- **Khắc phục**: Cập nhật `chlorthalidone.json` và `htnRenalMatrix.chlorthalidone.g4` sang `caution`/`adjust` theo dữ liệu thử nghiệm CLICK (ESC 2024 p. 65); đồng bộ liều tối đa và nguồn trích dẫn của `methyldopa`, `nifedipine`, `doxazosin`; bổ sung chống chỉ định đang dùng chẹn beta đồng thời vào `esmolol.json`.

#### `R1-HTN-23` [MAJOR | `threshold` | `kb/thresholds/htn.json`]
- **Vấn đề**: Vi phạm quy tắc **QA-10** (tái sử dụng ngưỡng sai ngữ nghĩa bệnh học và trộn lẫn đại lượng `quantity`) tại 4 vị trí:
  1. `rules.inpatient.ts:448-449` (`stroke_thrombolysis`): Dùng `htn.emergency.sbp_crisis` (`180`) ghép với **`htn.emergency.preeclampsia_dbp` (`105` — ngưỡng tâm trương của tiền sản giật sản khoa!)** để in đích duy trì sau tiêu sợi huyết đột quỵ `< 180/105 mmHg`.
  2. `rules.inpatient.ts:614` (`intracerebral_hemorrhage`): Dùng `htn.bp.sbp_hypertension` (`140` — ngưỡng chẩn đoán THA ngoại trú) để biểu diễn đích tối ưu xuất huyết não nội viện.
  3. `rules.inpatient.ts:847-848` (`hypertensive_encephalopathy`): Dùng `htn.bp.sbp_grade2` / `dbp_grade2` (`160/100` — phân độ THA ngoại trú) làm mốc theo dõi bệnh não THA nội viện.
  4. `rules.outpatient.ts:978, 994-996` (`step2_triple_combination`): Trong đối tượng `Gate`, truyền `value: egfr` (`quantity: 'egfr'`, đơn vị `mL/min/1.73m²`) nhưng lại gán `threshold: contraLimit` lấy từ `thFor('crcl', 'htn.indapamide.crcl_contra')` (`quantity: 'crcl'`, đơn vị `mL/min`).
- **Khắc phục**: Khai báo các ngưỡng chuyên biệt đúng ngữ nghĩa (`htn.emergency.stroke_post_thrombolysis_sbp = 180` & `_dbp = 105` trích AHA/ACC 2025 Section 5.3.9.2 Rec 2 *p. 56*; các ngưỡng đích xuất huyết não riêng cho ESC/AHA/VSH) và tách rạch ròi `Gate` kiểm tra `crcl` vs `egfr` tại Bước 2.

---

## 5. Chi tiết các phát hiện mức `MINOR` (`R1-HTN-24` → `R1-HTN-27`) & `SUGGESTION` (`R1-HTN-28` → `R1-HTN-29`)

### `R1-HTN-24` [MINOR | `rule` | `htn.inpatient.aortic_dissection`]
- **Mô tả**: Quy tắc bóc tách động mạch chủ cấp (`rules.inpatient.ts:256-279`) nêu đích `SBP < 120 mmHg` và `HR < 60 chu kỳ/phút` nhưng bỏ sót mốc thời gian bắt buộc **"trong vòng 20 phút"** của **AHA/ACC 2025 Table 27** (*PDF p. 75*: *"SBP ≤120 mm Hg should be achieved within 20 min"* — dù chính mô tả golden test `htn_22` có nhắc mốc 20 phút), và chưa cảnh báo nguy cơ co thắt phế quản khi truyền Esmolol liều cao ở bệnh nhân có tiền sử hen phế quản/COPD (AHA/ACC 2025 Table 26 *p. 74*).
- **Khắc phục**: Bổ sung mốc *"trong vòng 20 phút"* vào `rationale` và thêm lưu ý theo dõi hô hấp ở bệnh nhân có bệnh đường thở phản ứng (vẫn ưu tiên Esmolol có $t_{1/2}$ siêu ngắn dễ ngưng ngay hơn Labetalol không chọn lọc).

### `R1-HTN-25` [MINOR | `threshold` | `kb/thresholds/htn.json`]
- **Mô tả**: Có **39/92 ngưỡng (42%)** trong `kb/thresholds/htn.json` và **4/57 trích dẫn** trong `kb/citations/htn.json` (`esc.htn.2024.bp_target_alara`, `esc.htn.2024.bp_target_frailty`, `byt.3192.2010.step_treatment`, `esc.cvd.2021.score2`) hoàn toàn không được tham chiếu trong mã nguồn `src/modules/htn/**`. Đặc biệt, `eval_bp_target` gộp cả nhóm suy yếu vừa-nặng / kỳ vọng sống `< 3 năm` vào `esc.htn.2024.bp_target_lenient` (Class IIa) thay vì dùng `esc.htn.2024.bp_target_frailty` (Class IIb, ESC 2024 Rec Table 18 *p. 55*).
- **Khắc phục**: Gắn đúng `esc.htn.2024.bp_target_frailty` và `esc.htn.2024.bp_target_alara` vào `eval_bp_target`, kết nối `htn.spiro.egfr_contra_esc` vào Bước 3, và dọn dẹp các ngưỡng liều trùng lặp không sử dụng.

### `R1-HTN-26` [MINOR | `matrix` | `htnComorbidityMatrix`]
- **Mô tả**: Trong `htnComorbidityMatrix` (`src/modules/htn/matrix.ts:154-205`), cột `hf` gán `nifedipine` là `neutral: 'An toàn ở HFrEF nếu cần hạ áp'`, trái với **VSH/VNHA 2022 Bảng 11** (*tr. 33*: xếp chẹn kênh canxi DHP vào chống chỉ định tương đối trong HFrEF độ III–IV; thực hành chỉ dùng Amlodipine hoặc Felodipine khi thật sự cần hạ áp thêm, tránh Nifedipine do ức chế co bóp cơ tim mạnh hơn). Ngoài ra ma trận thiếu cột Tiền sử Đột quỵ / TIA (ưu tiên RASi + Thiazide-like hoặc DHP-CCB theo ESC 2024 Rec Table 28 & AHA 2025 Section 5.3.9.3).
- **Khắc phục**: Chuyển `nifedipine` ở cột `hf` sang `status: 'caution'`, làm rõ ghi chú lợi tiểu trong suy tim và bổ sung cột `stroke_tia`.

### `R1-HTN-27` [MINOR | `ui` | `docs/modules/HTN.md`]
- **Mô tả**: Độ lệch giữa tài liệu đặc tả `docs/modules/HTN.md` (dòng 81 khẳng định hệ thống kê đơn trị 1 thuốc cho THA Giai đoạn 1 nguy cơ thấp ở profile `US`, nhưng code chưa hề có nhánh này) và giao diện `src/modules/htn/inputs.ts` (hiển thị ô nhập `uacr` và `uricAcid` nhưng không có rule nào sử dụng).
- **Khắc phục**: Đồng bộ tài liệu sau khi cập nhật `step1_dual_combination`, kết nối `uacr` vào quy tắc bảo vệ thận RASi (`R1-HTN-14`) và kết nối `uricAcid` vào lưu ý thận trọng lợi tiểu Thiazide.

### `R1-HTN-28` [SUGGESTION | `missing` | `htn.outpatient.safety_monitoring_cr_k`]
- **Mô tả**: Nội dung theo dõi sinh hóa tại `safety_monitoring_cr_k` (`rules.outpatient.ts:1794-1796`) chỉ ghi chung chung *"Nếu Creatinin tăng vọt..."*, chưa nêu rõ ngưỡng sinh lý cho phép **Creatinin huyết thanh tăng `≤ 30%` (hoặc eGFR giảm `≤ 30%`) trong 4 tuần đầu** sau khi khởi trị/tăng liều ACEi, ARB hoặc MRA (**KDIGO 2021 Practice Point 3.2.5**, *PDF p. 29*; **AHA/ACC 2025 Section 5.2.9**, *PDF p. 49*).
- **Đề xuất**: Khai báo ngưỡng `30%` trong `kb/thresholds/htn.json` và hiển thị rõ để bác sĩ không ngừng sớm thuốc bảo vệ tim-thận một cách đáng tiếc khi mức tăng Creatinin nằm trong giới hạn huyết động cầu thận dự kiến `≤ 30%`.

### `R1-HTN-29` [SUGGESTION | `ui` | `src/modules/htn/pathway.ts`]
- **Mô tả**: Hiện có tới **20/21 quy tắc** bỏ trống trường `profileDiff` (chỉ duy nhất `eval_bp_target` có `profileDiff`).
- **Đề xuất**: Bổ sung `profileDiff` ngắn gọn cho các điểm phân kỳ học thuật quan trọng giữa `INTL` (ESC 2024), `VN` (VSH/VNHA 2022) và `US` (AHA/ACC 2025): ngưỡng khởi trị & đơn trị vs SPC ở Bước 1, ngưỡng nâng bậc ở Bước 2, cổng eGFR của Spironolactone (`≥ 30` vs `≥ 45`) & Class khuyến cáo ở Bước 3, thuốc uống ưu tiên trong thai kỳ, đích SBP trong xuất huyết não cấp (`140–160` vs `130–180` vs `130–<140`), và ngưỡng DBP trong đột quỵ thiếu máu não cấp không tái tưới máu (`110` vs `120 mmHg`).

---

## 6. Kết luận kiểm định Vòng 1 (Reviewer R1)

Căn cứ tiêu chuẩn nghiệm thu tại `docs/REVIEW_PROTOCOL.md` (yêu cầu `0 critical` và `0 major` để đạt `PASS`), phân hệ Tăng huyết áp (`htn`) hiện còn **6 lỗi `critical`** và **17 lỗi `major`** liên quan trực tiếp đến an toàn kê đơn cấp cứu nội viện, phân tầng cấp cứu ngoại trú/thai kỳ, chiến lược khởi trị – nâng bậc theo 3 hệ thống guideline (`ESC 2024`, `VSH/VNHA 2022`, `AHA/ACC 2025`), ma trận chỉnh liều thận và tính toàn vẹn bằng chứng trích dẫn PDF.

**KẾT LUẬN KIỂM ĐỊNH VÒNG 1 (R1): `FAIL`** *(6 critical, 17 major, 4 minor, 2 suggestion — Tổng cộng: 29 phát hiện)*
