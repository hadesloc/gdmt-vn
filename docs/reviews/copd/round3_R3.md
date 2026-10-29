# Báo cáo Phản biện An toàn Lâm sàng Đối nghịch – Phân hệ COPD (Vòng 3 – Reviewer R3 Độc lập)

- **Phân hệ đánh giá**: `copd` – Bệnh phổi tắc nghẽn mạn tính (*Chronic Obstructive Pulmonary Disease*)
- **Người phản biện**: **R3 – Chuyên gia Kiểm thử An toàn Lâm sàng Đối nghịch (*Adversarial Clinical Safety Tester*)**
- **Vòng đánh giá**: **Round 3 (Độc lập hoàn toàn)** — tuân thủ nghiêm ngặt [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md): **không đọc** bất kỳ báo cáo `round3_R1*` hay `round3_R2*` nào; **chỉ đọc (read-only)** đối với `src/`, `kb/`, `tests/`, `tools/`.
- **Tài liệu lâm sàng đối chiếu chuẩn**:
  1. **GOLD 2026 Report** (*Global Strategy for Prevention, Diagnosis and Management of COPD – 2026 Report*).
  2. **Bộ Y tế Việt Nam – Quyết định 2131/QĐ-BYT (2026)**: *Hướng dẫn chẩn đoán và điều trị Bệnh phổi tắc nghẽn mạn tính*.
  3. **GINA 2026** & **QĐ 5850/QĐ-BYT** (đối chiếu ca đồng mắc Hen – COPD / ACO).
  4. **ESC Heart Failure Guidelines** & **Nhãn thuốc FDA** (*Trelegy Ellipta, Symbicort, Seretide Accuhaler, Spiriva HandiHaler/Respimat, Daliresp [roflumilast], Zithromax [azithromycin]*).
- **Bộ kịch bản thực chạy `evaluate()` thật**: **138 kịch bản đối nghịch** (chạy trực tiếp hàm `evaluate()` qua Vite SSR runner, mã thoát `0`):
  - [r3_adversarial_suite.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/scratch/r3_adversarial_suite.ts) (**113 kịch bản** trải rộng Nhóm A, B, C, D, và Ma trận Presets × Profiles `VN/INTL/US` × Hệ đơn vị `SI/Conventional`, kết quả lưu tại [r3_results_summary.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/scratch/r3_results_summary.md)).
  - [r3_targeted_probes.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/scratch/r3_targeted_probes.ts) (**25 kịch bản mũi nhọn** kiểm chứng chính xác từng khóa `inputs.ts`, dị ứng đạm sữa bò, ngừng thở nội viện, lọc máu chu kỳ, phụ nữ cho con bú, `Child-Pugh A` và toàn văn `noteText` / `Asthma Action Plan`, kết quả lưu tại [r3_probes_summary.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/scratch/r3_probes_summary.md)).

---

## 1. Kết luận Tổng thể & Bảng Tổng hợp Mức độ Nghiêm trọng

> ### ❌ KẾT LUẬN CHUNG VÒNG 3 (R3): **FAIL (KHÔNG ĐẠT)**
> Theo tiêu chuẩn nghiệm thu tại [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md) (*PASS yêu cầu `0 critical` và `0 major`*), phân hệ `copd` và các điểm giao cắt liên phân hệ hiện còn tồn tại **4 lỗi `critical`** đe dọa trực tiếp tính mạng người bệnh và **7 lỗi `major`** sai lệch phác đồ hoặc bỏ sót hàng rào an toàn cơ quan đích. Mặc dù bản cập nhật sau Vòng 2 đã cải thiện rất tốt kiến trúc tách mô-đun (`helpers.ts`, `rules.safety.ts`, `rules.initial.ts`, `rules.followup.ts`, `rules.escalation.ts`, `rules.inpatient.ts`), sửa dứt điểm lỗi dự phòng VTE nội viện (`R3-R2-COPD-02`), phân biệt toan chuyển hóa với toan hô hấp (`R3-R2-COPD-10`), và bổ sung profile `'US'`, song một số bản vá Vòng 2 đã tạo ra **hồi quy lâm sàng nguy hiểm mới** (điển hình là lệnh `STOP carvedilol` đơn độc làm bệnh nhân suy tim `LVEF 30%` mất sạch thuốc chẹn beta) hoặc **chưa được cài đặt thực tế như tuyên bố trong `round2_RESPONSE.md`**.

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã phát hiện (`id`) |
| :--- | :---: | :--- |
| 🔴 **Critical** (Nguy kịch – đe dọa tính mạng / tai biến nặng) | **4** | `COPD-R3-R3-01`, `COPD-R3-R3-02`, `COPD-R3-R3-03`, `COPD-R3-R3-04` |
| 🟠 **Major** (Nghiêm trọng – sai phác đồ chuẩn / mất thuốc nền / kẽ hở cơ quan đích) | **7** | `COPD-R3-R3-05`, `COPD-R3-R3-06`, `COPD-R3-R3-07`, `COPD-R3-R3-08`, `COPD-R3-R3-09`, `COPD-R3-R3-10`, `COPD-R3-R3-11` |
| 🟡 **Minor** (Trung bình – hiển thị mâu thuẫn / nhiễu y lệnh cấp cứu / tóm tắt bệnh án) | **4** | `COPD-R3-R3-12`, `COPD-R3-R3-13`, `COPD-R3-R3-14`, `COPD-R3-R3-15` |
| 🔵 **Suggestion** (Gợi ý hoàn thiện dữ liệu trích dẫn & gán nhãn phân hệ) | **2** | `COPD-R3-R3-16`, `COPD-R3-R3-17` |
| **TỔNG CỘNG** | **17** | **Kết luận: `FAIL`** |

---

## 2. Kiểm chứng Hồi quy Vòng 2 (`R3-R2-COPD-01` → `R3-R2-COPD-16`)

| Mã lỗi R2 | Nội dung cốt lõi ở Vòng 2 | Trạng thái thực tế trên mã nguồn & `evaluate()` Vòng 3 | Tham chiếu R3 |
| :--- | :--- | :--- | :--- |
| `R3-R2-COPD-01` | Hòa giải đa bình hít phác đồ mở (open dual / open triple) & `duplicates.ts` | ⚠️ **SỬA MỘT PHẦN**: Đã dừng đúng 2 bình cũ khi rút ICS do viêm phổi (`P02`), nhưng bỏ sót bí danh `'fluticasone_umeclidinium_vilanterol'` gây 3 cảnh báo trùng lặp giả với chính mình (`P01`) và đánh rơi `budesonide_formoterol` khi duy trì bộ ba mở (`P04d`, `C05`). | `COPD-R3-R3-03`, `COPD-R3-R3-07` |
| `R3-R2-COPD-02` | `vte_prophylaxis` kê chồng LMWH lên DOAC / xuất huyết / lọc máu | ✅ **ĐÃ SỬA TRIỆT ĐỂ**: Đã chặn khi có thuốc chống đông (`D07`), đổi sang dự phòng cơ học IPC khi có nguy cơ chảy máu, và đổi sang UFH dưới da khi `eGFR < 30` / `onDialysis` (`B22b`). | Đạt |
| `R3-R2-COPD-03` | `niv_bipap` chỉ định BiPAP khi lơ mơ / sốc | ⚠️ **SỬA MỘT PHẦN – LỖ HỔNG NGUY KỊCH**: Đã phát `AVOID NIV` khi có ABG + rối loạn ý thức (`P12b`), nhưng `icu_transfer` lại **KHÔNG phát `REFER` ICU** khi `alteredMentalStatus` có `PaCO₂ ≤ 60` (`P12b`) hoặc khi **ngừng thở (`respiratoryArrest: true`)** đang chờ ABG (`P12a`)! | `COPD-R3-R3-01` |
| `R3-R2-COPD-04` | Lực hít yếu (`weakInspiratoryFlow`) vẫn kê DPI / không đổi DPI | ⚠️ **SỬA MỘT PHẦN**: Đã đổi Ellipta/Breezhaler sang Breztri/Respimat, nhưng bỏ sót `Symbicort Turbuhaler` (`budesonide_formoterol`), `Seretide Accuhaler` (`fluticasone_salmeterol`) và `Spiriva HandiHaler` (`P05b`). | `COPD-R3-R3-03` |
| `R3-R2-COPD-05` | `['copd', 'asthma']` nội viện kê trùng 2 corticoid toàn thân | ⚠️ **SỬA MỘT PHẦN**: Hết trùng khi `currentMeds = []`, nhưng tuyên bố thêm `willAsthmaInpatientPrescribeSystemicSteroid` trong `round2_RESPONSE.md:201` là **không có thật trên code**; khi BN đang uống `prednisolone` nền (`B14`), xuất 2 thẻ chồng chéo giữ nguyên `Dose: Prednisolone 40 mg` cạnh `Methylprednisolone 40 mg IV`. | `COPD-R3-R3-09` |
| `R3-R2-COPD-06` | Dị ứng nặng đạm sữa bò (`severeMilkProteinAllergy`), glôcôm góc đóng, `theophylline + roflumilast` | ❌ **CÒN LỖ HỔNG CRITICAL**: Đã chặn Trelegy Ellipta & Theophylline+Roflumilast, nhưng vẫn **kê mới `Seretide Accuhaler (DPI)` + `HandiHaler 18 mcg`** cho BN phản vệ đạm sữa bò (`C11`, `P05a`) và kê sai liều `AIR 1 nhát khi cần` của `budesonide_formoterol` cho COPD Nhóm E có glôcôm (`P05d`)! | `COPD-R3-R3-03`, `COPD-R3-R3-04` |
| `R3-R2-COPD-07` | Fail-closed oxy nội viện khi thiếu `SpO₂` & LTOT khi thiếu `FEV₁/FVC` | ✅ **ĐÃ SỬA** cho ca thiếu `SpO₂` / thiếu `FEV₁/FVC` (`A01`, `D03b`), nhưng phát sinh lỗ hổng phân loại cấp cứu ngoại trú `D01` / `D02a`. | `COPD-R3-R3-01` |
| `R3-R2-COPD-08` | Nhảy cóc bậc `roflumilast` / `azithromycin` trên `LABA+LAMA` khi chưa xét `bloodEos` | ✅ **ĐÃ SỬA** điều kiện nền `bloodEos < 100` (`isEligibleForNonIcsEscalationInhalerBase`), song còn kẽ hở lọc máu `onDialysis` (`P06`), cho con bú (`P08`) và `Child-Pugh A` (`P09a/b`). | `COPD-R3-R3-10` |
| `R3-R2-COPD-09` | Xử lý chẹn beta không chọn lọc (`carvedilol`, `propranolol`) ở `['copd', 'hf']` | ❌ **HỒI QUY NGUY HIỂM HƠN (`CRITICAL`)**: Thay vì chuyển sang chẹn beta-1 chọn lọc, `copd` phát `STOP carvedilol` đè mất `UPTITRATE carvedilol` của `hf`, làm BN suy tim HFrEF (`LVEF 30%`) **mất sạch thuốc chẹn beta** (`B03`)! | `COPD-R3-R3-02` |
| `R3-R2-COPD-10` | Phân biệt toan chuyển hóa nặng với toan hô hấp nặng trong `icu_transfer` | ✅ **ĐÃ SỬA TỐT**: Đã tách bạch rõ `severeNonRespAcidosis` và thêm `metabolic_acidosis_warning` (`D04a`, `D04b`). | Đạt |
| `R3-R2-COPD-11` | Thiếu profile `'US'` & đồng bộ `['copd', 'asthma']` | ⚠️ **SỬA MỘT PHẦN**: Profile `'US'` đã hoạt động đầy đủ (`COPD_PROFILES`), nhưng `['copd', 'asthma']` vẫn xuất `Asthma Action Plan` mâu thuẫn trực diện với `Trelegy`/`Breztri` (`P14`, `P05c`). | `COPD-R3-R3-09` |
| `R3-R2-COPD-12` | Sai lệch `computeGold()` & `derivePatientData()` | ⚠️ **SỬA TRONG `gold.ts`, CÒN 4 LỖI TRONG `derive.ts`**: `derive.ts` vẫn gán `GOLD 3 / E` khi thiếu `fev1FvcRatio` (`A01`), giữ ngưỡng cũ `modExac >= 2` ở dòng 160 (`A11b`), gán Nhóm A khi thiếu `CAT` (`A07`), và lệch `patient.fev1/fvc` với `copd` (`P13`). | `COPD-R3-R3-11` |
| `R3-R2-COPD-13` | Cảnh báo tăng oxy máu (`hyperoxia`) & tiêm chủng nội viện nguy kịch | ⚠️ **SỬA MỘT PHẦN**: Đã đổi sang `REDUCE` oxy khi `onSupplementalOxygen` (`P11`), nhưng vẫn hiện tiêm vắc xin Zona/RSV trên ca đợt cấp nội viện toan hô hấp `pH 7.30` đang thở BiPAP cấp cứu (`E_copd_preset_inpatient_exac`). | `COPD-R3-R3-13` |
| `R3-R2-COPD-14` | Rút ICS khởi trị sai chỉ định ban đầu (0 đợt cấp, không hen, `BCAT < 100`) | ⚠️ **SỬA MỘT PHẦN**: Chỉ áp dụng cho `ics_laba`, bỏ quên `triple` (`A15b` vẫn khuyên `CONTINUE Trelegy` ở BN Nhóm A `BCAT = 60 /µL`!). | `COPD-R3-R3-08` |
| `R3-R2-COPD-15` | `src/engine/note.ts` thiếu toàn bộ thông số COPD & gán cứng câu `RASi/ARNI/MRA` | ❌ **HOÀN TOÀN CHƯA SỬA**: Vẫn thiếu sạch thông số COPD, nhảy cóc số mục `2. -> 4.`, và in câu theo dõi `RASi/ARNI/MRA` cho 100% ca COPD đơn thuần (`P15`). | `COPD-R3-R3-14` |
| `R3-R2-COPD-16` | Thêm `onSupplementalOxygen` & dịch nhãn tiếng Việt 4 biến GINA trong `require.ts` | ⚠️ **SỬA 1/2**: Đã thêm `onSupplementalOxygen`, nhưng `require.ts` vẫn rò rỉ nguyên văn `Cần nhập daytimeSymptomsMoreThanTwiceWeek để đánh giá` (`B07`). | `COPD-R3-R3-15` |

---

## 3. Phân tích Chi tiết Các Phát hiện Vòng 3

### 🔴 NHÓM CRITICAL (4 PHÁT HIỆN)

#### [COPD-R3-R3-01] Mù nhận diện & bỏ sót chuyển tuyến Cấp cứu / ICU trong suy hô hấp cấp nguy kịch và ngừng thở ở cả ngoại trú lẫn nội viện
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: [`copd.inpatient.icu_transfer`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.ts#L420-L499), [`isAcuteExacerbation`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.ts#L606-L609), [`checkEmergencyRedFlags`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMedsSpecialized.ts#L35-L140)
- **Phân tích cơ chế lỗi & Hậu quả lâm sàng**:
  1. **Tại phòng khám ngoại trú (`setting: 'outpatient'`, kịch bản `D01`)**: Trường công tắc `customInputs.acuteExacerbation` nằm ẩn trong nhóm cuối cùng *"Đợt cấp nội viện & Đánh giá suy hô hấp cấp"* ([inputs.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/inputs.ts#L252-L261)). Khi bác sĩ ngoại trú nhập sinh hiệu và khí máu của một bệnh nhân đang lơ mơ, co kéo cơ hô hấp phụ, suy hô hấp toan CO₂ nguy kịch (`restingSpo2: 82%, abgPh: 7.26, abgPaco2: 64 mmHg, respiratoryRate: 34, alteredMentalStatus: true, accessoryMuscleUse: true`) mà quên tích ô nội viện đó:
     - `isAcuteExacerbation()` chỉ kiểm tra `explicit === true`, bỏ qua hoàn toàn các dấu hiệu sinh tồn nguy kịch.
     - `checkEmergencyRedFlags()` chỉ có 4 cổng tim mạch–thận (`K+ >= 6.0`, `SBP < 80`, `HA >= 180/120`, `HR < 40 | > 150`), **không có bất kỳ cổng hô hấp/tri giác nào**.
     - **Kết quả thực chạy `D01`**: Engine coi bệnh nhân đang lơ mơ toan máu `pH 7.26` là **COPD ổn định ngoại trú**, kê đơn `Spiolto Respimat`, **Oxy dài hạn tại nhà (`LTOT ≥ 15 giờ/ngày`)**, **BiPAP mạn tính tại nhà (`Home NIV`)**, và tư vấn **tiêm vắc xin Zona/RSV**, với **`0` khuyến cáo `REFER` chuyển cấp cứu**! Cho bệnh nhân toan hô hấp cấp lơ mơ về nhà tự thở oxy mà không hồi sức thông khí sẽ dẫn tới hôn mê CO₂ và ngừng tuần hoàn.
  2. **Đợt cấp ngoại trú có toan hô hấp cấp (`D02a`)**: Ngay cả khi bác sĩ ĐÃ tích `acuteExacerbation: true` ở `setting: 'outpatient'` (`restingSpo2: 85%, abgPh: 7.31, abgPaco2: 54 mmHg, RR: 30, accessoryMuscleUse: true`), engine phát y lệnh `[START] Chỉ định thở máy không xâm nhập (NIV / BiPAP) cấp cứu` ngay tại phòng khám ngoại trú mà có **`0` lệnh `REFER` chuyển nhập viện cấp cứu** (thiếu hoàn toàn luật chỉ định nhập viện theo GOLD 2026 Table 4.3 & BYT QĐ 2131/2026 Mục 3.3).
  3. **Nội viện ngừng thở (`P12a`) hoặc lơ mơ toan hô hấp cần đặt nội khí quản (`P12b`, `D04d`)**: Trong [`copd.inpatient.icu_transfer`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.ts#L437-L443):
     ```ts
     return isSevereAcidosis || (isSevereHypercapnia && alteredMental) || isHypotensiveShock;
     ```
     - Khi bệnh nhân **ngừng thở (`respiratoryArrest: true, SpO₂ = 72%`, đang chờ kết quả khí máu – `P12a`)**: Cả `niv_bipap` lẫn `icu_transfer` đều trả về `false`! Engine chỉ kê khí dung Salbutamol + uống Prednisolone 40 mg + *"Cần làm Khí máu động mạch"*, **`0` lệnh đặt nội khí quản (`IMV`) và `0` lệnh `REFER` ICU**!
     - Khi bệnh nhân **lơ mơ mất tri giác kèm toan hô hấp cấp (`alteredMentalStatus: true, abgPh: 7.29, abgPaco2: 55 mmHg, SBP: 112` – `P12b`)**: `copd.inpatient.niv_bipap` phát thẻ `AVOID NIV – Chuẩn bị đặt nội khí quản thở máy xâm nhập (IMV) khẩn cấp tại ICU`, nhưng `copd.inpatient.icu_transfer` lại **KHÔNG kích hoạt (`0` lệnh `REFER` ICU)** chỉ vì `PaCO₂ = 55 ≤ 60 mmHg`!
- **Hướng khắc phục đề xuất**:
  1. Bổ sung Red Flags suy hô hấp/tri giác cấp trong `checkEmergencyRedFlags()` (`restingSpo2 < 85%`, `abgPh <= 7.35 && abgPaco2 >= 45`, `alteredMentalStatus === true`, `respiratoryArrest === true`) và chặn `copd.nonpharm.ltot_oxygen` / `copd.outpatient.home_niv` khi đang có toan máu cấp (`abgPh <= 7.35`).
  2. Bổ sung luật `copd.outpatient.hospital_admission_refer` theo tiêu chuẩn nhập viện của GOLD 2026 Table 4.3 & BYT QĐ 2131/2026 Mục 3.3.
  3. Trong `copd.inpatient.icu_transfer`: kích hoạt ngay khi có `Boolean(ci.respiratoryArrest) || Boolean(ci.alteredMentalStatus) || hasNivContraindication(ctx)` mà không khóa sau `paco2 > 60`, và phát lệnh đặt nội khí quản `IMV` tức thì khi `respiratoryArrest === true` dù chưa có khí máu.

---

#### [COPD-R3-R3-02] Ngừng đột ngột `carvedilol` làm bệnh nhân đồng mắc COPD + HFrEF (`LVEF 30%`) mất sạch thuốc chẹn beta giao cảm
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: [`copd.safety.non_selective_bb_stop`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.ts#L153-L188), [`NON_SELECTIVE_BB_IDS`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.ts#L168-L176), [`hf.fmt.bb`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/hf/rules.hfref.ts#L210-L245)
- **Bằng chứng thực chạy `evaluate()` (`B03`)**:
  - Đầu vào: `selectedModules: ['copd', 'hf']`, `lvef: 30, nyha: 2`, COPD Nhóm B ổn định trên `tiotropium_olodaterol`, suy tim HFrEF đang dùng tứ trụ `sacubitril_valsartan`, `carvedilol 12.5 mg BID`, `dapagliflozin`, `spironolactone`.
  - Đầu ra thực tế của `evaluate()`:
    - `[copd] STOP carvedilol (rec_copd_stop_non_selective_bb)`: **NGỪNG / CHUYỂN ĐỔI chẹn beta không chọn lọc (Carvedilol)**
    - `[hf] UPTITRATE sacubitril_valsartan`, `[hf] CONTINUE dapagliflozin`, `[hf] CONTINUE spironolactone`
    - **KHÔNG HỀ CÓ `bisoprolol`, `metoprolol_succinate` hay `nebivolol` trong đơn thuốc!** (Trực tiếp bác bỏ khẳng định tại `docs/reviews/copd/round2_RESPONSE.md` dòng 226 rằng *"phân hệ HF tự động tiếp nhận và khởi trị Bisoprolol thay thế"* — thực tế `hf.fmt.bb` thấy `carvedilol` trong `currentMeds` nên phát `UPTITRATE carvedilol`, sau đó bị `STOP carvedilol` của COPD xóa sổ hoàn toàn trong [`merge.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/merge.ts#L36-L40)!).
- **Nguy cơ lâm sàng**: Ngừng đột ngột Carvedilol ở bệnh nhân HFrEF nặng (`LVEF 30%`) mà không gối đầu ngay sang thuốc chẹn beta-1 chọn lọc tương đương gây hội chứng dội ngược giao cảm cấp (*beta-blocker withdrawal rebound*), cơn nhịp nhanh thất/rung thất, nhồi máu cơ tim và phù phổi cấp mất bù (vi phạm ESC HF 2021/2026 & GOLD 2026 Ch. 5, PDF p. 127).
- **Hướng khắc phục đề xuất**: Khi bệnh nhân có HFrEF / bệnh mạch vành / rung nhĩ cần chẹn beta bắt buộc, tuyệt đối không phát `STOP carvedilol` đơn độc. Cần phát khuyến cáo `SWITCH` tường minh sang `bisoprolol` (`switchFrom: 'carvedilol'`, liều quy đổi tương đương) hoặc ở bệnh nhân COPD ổn định không co thắt phế quản cấp đang dung nạp tốt Carvedilol trong HFrEF thì chỉ phát mức `CONSIDER` chuyển sang Bisoprolol/Metoprolol succinate/Nebivolol.

---

#### [COPD-R3-R3-03] Nguy cơ sốc phản vệ đạm sữa bò, thất bại thiết bị hít lực hít yếu & đứt gãy bí danh `fluticasone_umeclidinium_vilanterol`
- **Mức độ**: `critical` | **Loại**: `drug` | **Đối tượng**: [`DPI_INHALER_IDS` & `INHALER_PROFILES`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.ts#L71-L131), [`fluticasone_salmeterol.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/fluticasone_salmeterol.json), [`tiotropium.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/tiotropium.json)
- **Bằng chứng thực chạy `evaluate()`**:
  1. **`C11` & `P05a` (Phản vệ đạm sữa bò `severeMilkProteinAllergy: true`)**:
     - Ở `C11` (`['copd', 'asthma']` Track 2): Engine **chủ động kê mới** `[asthma] START fluticasone_salmeterol | Dose: Accuhaler (DPI) 250/50 mcg` + `[copd] START tiotropium | Dose: Spiriva Respimat ... (hoặc HandiHaler 18 mcg 1 viên hít/ngày)` với `alerts = []`!
     - Ở `P05a` (Bệnh nhân dị ứng phản vệ đạm sữa bò đang dùng `Seretide Accuhaler 50/250` + `Spiriva HandiHaler 18 mcg`): Engine phát `CONTINUE tiotropium`, **không hề ngừng hay chuyển đổi `Seretide Accuhaler` / `Spiriva HandiHaler`**! Cả hai bình bột khô này đều chứa lactose monohydrate có vết protein sữa bò chống chỉ định tuyệt đối ở người tiền sử phản vệ đạm sữa bò.
  2. **`P05b` (`weakInspiratoryFlow: true` trên `Symbicort Turbuhaler` + `Spiriva HandiHaler`)**: `copd.safety.dpi_inhaler_switch` **không chạy**, dù ngay bên dưới thẻ `rec_copd_device_smi_spacer` tự mâu thuẫn khuyên *"Tránh dùng bình hít bột khô (DPI như Breezhaler, Ellipta, Turbuhaler)"*.
  3. **`P01` (Bí danh `fluticasone_umeclidinium_vilanterol`)**: Trong khi [`asthma/helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/helpers.ts#L33), [`copd/helpers.ts:331`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.ts#L331) và [`gates.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts) đều chấp nhận `fluticasone_umeclidinium_vilanterol`, `INHALER_PROFILES` của COPD lại bỏ quên khóa này! Hậu quả khi chạy `P01`: COPD tưởng bệnh nhân chưa dùng thuốc (`eff === 'none'`), sinh **3 cảnh báo trùng lặp giả mức `CRITICAL`/`WARNING`** (`dup.laba`, `dup.lama`, `dup.ics`: *Trelegy trùng với chính Trelegy!*) và làm **tê liệt toàn bộ nhánh leo thang `azithromycin` / `dupilumab` / `mepolizumab`**!
- **Hướng khắc phục đề xuất**: Bổ sung `'fluticasone_umeclidinium_vilanterol'` vào `INHALER_PROFILES` & `DPI_INHALER_IDS`; bổ sung `"severe_milk_protein_allergy"` vào `kb/drugs/fluticasone_salmeterol.json` & `fluticasone_vilanterol.json`; kiểm soát chặt các bình DPI chứa lactose (`Accuhaler/Diskus`, `Turbuhaler`, `HandiHaler`, `Ellipta`, `Breezhaler`) để khi có `severeMilkProteinAllergy` hoặc `weakInspiratoryFlow` bắt buộc chuyển sang pMDI không chứa lactose (`Evohaler`, `Rapihaler`, `Breztri Aerosphere` + buồng đệm) hoặc SMI (`Spiriva Respimat`, ẩn hoàn toàn câu gợi ý `HandiHaler 18 mcg`).

---

#### [COPD-R3-R3-04] Kê sai liều cắt cơn khi cần của Hen nhẹ (`AIR 1 nhát khi cần`) làm thuốc duy trì duy nhất cho COPD Nhóm E nặng khi chống chỉ định LAMA
- **Mức độ**: `critical` | **Loại**: `rule` | **Đối tượng**: [`copd.safety.lama_contra_alternative`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.ts#L250-L289)
- **Bằng chứng thực chạy `evaluate()` (`P05d`)**:
  - Đầu vào: Bệnh nhân COPD đơn thuần (không hen) Nhóm E nặng (`FEV₁ 44%`, 2 đợt cấp vừa + 1 lần nhập viện, `BCAT = 380 /µL`) kèm glôcôm góc đóng (`narrowAngleGlaucoma: true`) và `severeMilkProteinAllergy: true`.
  - Đầu ra `evaluate()`:
    - `[copd] START budesonide_formoterol (rec_copd_lama_contra_alternative)` với liều: **`1 nhát x khi cần (hít) - Với hàm lượng 160/4.5 mcg: AIR (Bậc 1–2) 1 nhát khi cần; MART Bậc 3: 1 nhát x 2 lần/ngày + 1 nhát khi cần...`**!
- **Nguy cơ lâm sàng**: Chế độ kháng viêm cắt cơn chỉ dùng khi cần (`AIR 1 nhát khi cần`) là phác đồ riêng của **Hen phế quản nhẹ Bậc 1–2 theo GINA**, **tuyệt đối không có hiệu lực và không được cấp phép làm điều trị duy trì trong COPD**! Theo GOLD 2026 và Bộ Y tế QĐ 2131/QĐ-BYT 2026 (Bảng 2.2), liều duy trì chuẩn của Budesonide/Formoterol trong COPD phải là liều cố định hàng ngày **`160/4.5 mcg x 2 nhát x 2 lần/ngày`** (`320/9 mcg BID`; hoặc `80/2.25 mcg Rapihaler pMDI x 4 nhát x 2 lần/ngày` kèm buồng đệm nếu dị ứng đạm sữa bò / lực hít yếu). Kê `1 nhát khi cần` cho bệnh nhân COPD Nhóm E vừa xuất viện vì đợt cấp gây điều trị dưới liều nghiêm trọng và tái nhập viện cấp cứu.
- **Hướng khắc phục đề xuất**: Tách riêng chuỗi liều duy trì cố định chuẩn COPD cho `budesonide_formoterol` (`160/4.5 mcg: 2 nhát x 2 lần/ngày`) khi `!hasConcurrentAsthma(ctx)` trong `copd.safety.lama_contra_alternative`, và chỉ định đích danh dạng `Rapihaler pMDI + buồng đệm` khi có `severeMilkProteinAllergy` hoặc `weakInspiratoryFlow`.

---

### 🟠 NHÓM MAJOR (7 PHÁT HIỆN)

#### [COPD-R3-R3-05] Vi phạm tiêu chuẩn Anthonisen: Kê kháng sinh đợt cấp chỉ với 1/3 triệu chứng đơn độc (`purulentSputum`) và bỏ hoang trường `increasedSputumVolume`
- **Mức độ**: `major` | **Loại**: `rule` | **Đối tượng**: [`copd.inpatient.antibiotics`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.ts#L247-L288), [`inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/inputs.ts#L291-L303)
- **Bằng chứng (`D05b`)**: Khi `acuteExacerbation: true`, `increasedDyspnea: false, increasedSputumVolume: false, purulentSputum: true` (Anthonisen Type III – chỉ có 1/3 triệu chứng, không suy hô hấp cần thở máy), `evaluate()` vẫn phát `[START] Kháng sinh điều trị đợt cấp trong 5 ngày` do dòng 265 viết `return isPurulent || needsMechanicalVentilation;`. Trường `customInputs.increasedSputumVolume` trên giao diện hoàn toàn không được đọc ở bất kỳ đâu!
- **Đối chiếu**: GOLD 2026 (Ch. 4, PDF p. 114–115) & BYT QĐ 2131/2026 (Mục 3.4.4c) chỉ định kháng sinh khi có **3/3 triệu chứng Anthonisen**, HOẶC **2/3 triệu chứng trong đó bắt buộc có đờm mủ**, HOẶC **cần thông khí cơ học**.
- **Khắc phục**: Bổ sung `customInputs.increasedDyspnea` vào `inputs.ts` và sửa điều kiện `when` thành `(isPurulent && (increasedDyspnea || increasedSputumVolume)) || needsMechanicalVentilation`.

#### [COPD-R3-R3-06] Chỉ định `Home NIV` (BiPAP dài hạn tại nhà) khi bệnh nhân chưa từng nhập viện / không có đợt cấp tăng CO₂ trước đó
- **Mức độ**: `major` | **Loại**: `rule` | **Đối tượng**: [`copd.outpatient.home_niv`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.ts#L413-L449)
- **Bằng chứng (`D08b`)**: Bệnh nhân có `moderateExacerbations: 0, hospitalizations: 0, abgPaco2: 56 mmHg` vẫn nhận khuyến cáo `[CONSIDER] Cân nhắc Thông khí nhân tạo không xâm nhập tại nhà (Home NIV, PaCO₂ 56 mmHg)`, trái trực tiếp với chính trích dẫn `byt.copd.2026.home_niv_53` (*"PaCO₂ ≥ 53 mmHg **và tiền sử nhập viện gần đây**"*) và `gold.copd.2026.home_niv` (*"2–4 weeks after hospital discharge following an acute exacerbation"*).
- **Khắc phục**: Yêu cầu `hospitalizations >= 1` (hoặc cờ vừa xuất viện sau đợt cấp suy hô hấp tăng CO₂ 2–4 tuần) và loại trừ toan hô hấp cấp chưa bù (`abgPh <= 7.35`).

#### [COPD-R3-R3-07] Đánh rơi hoàn toàn khuyến cáo `CONTINUE` thuốc giãn phế quản duy trì ở bệnh nhân tái khám ổn định (`LAMA`, `LABA+LAMA`, `Open Triple`) và trong đợt cấp
- **Mức độ**: `major` | **Loại**: `missing` | **Đối tượng**: [`rules.followup.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.ts#L203-L257), [`rules.inpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.ts)
- **Bằng chứng (`P04a–d`, `E_copd_preset_followup_roflumilast`, `D02b`, `D06`)**:
  1. `rules.followup.ts` chỉ có `continue_triple` mà **không hề có luật `CONTINUE`** cho bệnh nhân đang ổn định trên `tiotropium` (`P04a`), `tiotropium_olodaterol` (`P04b`, `P04c`, và cả preset chính thức `copd_preset_followup_roflumilast`!), khiến đơn thuốc GDMT và `noteText` trắng trơn không có thuốc hít duy trì!
  2. Trên phác đồ bộ ba mở `[budesonide_formoterol, tiotropium]` (`P04d`, `C05`), `continue_triple` chỉ phát `CONTINUE tiotropium` (với tiêu đề sai *"phác đồ ba thành phần – Tiotropium"*) và **làm mất tích `budesonide_formoterol`**!
  3. Trong đợt cấp (`D02b`, `D06`), toàn bộ thuốc giãn phế quản tác dụng dài đang dùng bị loại khỏi kế hoạch thay vì duy trì tiếp tục theo GOLD 2026 PDF p. 114.
- **Khắc phục**: Bổ sung luật `CONTINUE` cho `lama_mono`, `laba_mono`, `laba_lama`, sửa `continue_triple` giữ đủ cả 2 bình của bộ ba mở, và bổ sung khuyến cáo duy trì/khởi trị sớm giãn phế quản dài hạn trong đợt cấp.

#### [COPD-R3-R3-08] Luật rút ICS khởi trị sai chỉ định (`inappropriate_ics_de_escalation`) bỏ sót hoàn toàn bệnh nhân đang dùng phác đồ bộ ba (`eff === 'triple'`)
- **Mức độ**: `major` | **Loại**: `rule` | **Đối tượng**: [`isInappropriateIcsDeEscalationCandidate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.ts#L869-L880)
- **Bằng chứng (`A15b`)**: Bệnh nhân COPD Nhóm A không hen, `0` đợt cấp, `mMRC 1, CAT 8`, `BCAT = 60 /µL (< 100)` đang dùng `Trelegy Ellipta` nhận lệnh `CONTINUE Trelegy` thay vì rút ICS sang `LABA+LAMA` (do dòng 874 khóa cứng `if (eff !== 'ics_laba') return false;`), làm tăng nguy cơ viêm phổi không cần thiết trái GOLD 2026 PDF p. 77.
- **Khắc phục**: Cho phép cả `eff === 'ics_laba' || eff === 'triple'` trong `isInappropriateIcsDeEscalationCandidate(ctx)`.

#### [COPD-R3-R3-09] Bốn xung đột y lệnh liên phân hệ nghiêm trọng trong `['copd', 'asthma']` và leo thang kháng thể đơn dòng
- **Mức độ**: `major` | **Loại**: `rule` | **Đối tượng**: [`rules.inpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.ts#L209-L244), [`asthma/rules.track1.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/asthma/rules.track1.ts), [`rules.escalation.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.ts#L310-L407)
- **Bằng chứng thực chạy**:
  1. **`B14` (Corticoid toàn thân nội viện khi có `prednisolone` nền)**: Xuất đồng thời `[asthma] SWITCH prednisolone | Dose: Prednisolone 40 mg uống/ngày` VÀ `[asthma] START methylprednisolone 40 mg IV` (hàm `willAsthmaInpatientPrescribeSystemicSteroid` nêu trong `round2_RESPONSE.md:201` thực tế chưa từng được viết vào code!).
  2. **`P14` & `P05c` (Văn bản Kế hoạch Hành động Hen mâu thuẫn trực diện với Trelegy/Breztri)**: Bệnh nhân ACO đang được COPD kê duy trì hàng ngày `Trelegy 1 liều/ngày` (`P14`) hoặc `Breztri 2 nhát x 2 lần/ngày` (`P05c`), nhưng `asthma.outpatient.action_plan_generator` lại in văn bản dặn bệnh nhân *"Không dùng hàng ngày; chỉ hít 1 nhát khi có triệu chứng (Budesonide / Formoterol)"* (`P14`) hoặc *"Thuốc duy trì: Dùng Budesonide / Formoterol 1 nhát x 2 lần/ngày (MART Bậc 3)"* chồng lên `Breztri` (`P05c`)!
  3. **`P11` / `B15` (Đích Oxy nội viện `SpO₂ = 94%`)**: COPD phát `GIẢM NGAY lưu lượng oxy bổ sung (SpO₂ 94% > 92%)` trong khi Hen nhắm đích `93–95%`.
  4. **`E_copd_preset_group_e_triple_*` & `C21` (Sinh học kép)**: Xuất song song cả 2 y lệnh `CONSIDER dupilumab` VÀ `CONSIDER mepolizumab` thành 2 dòng riêng biệt trong đơn thuốc và `noteText`.
- **Khắc phục**: Đồng bộ corticoid toàn thân nội viện (xóa `dose` cũ trên thẻ `SWITCH` ngừng thuốc trong `merge.ts`); cập nhật `action_plan_generator` của Hen nhận biết khi bệnh nhân đang dùng bình bộ ba đơn của COPD; ưu tiên đích `SpO₂ 88–92%` ở ACO nội viện; và thêm cảnh báo trùng lặp `dup.respiratory_biologic` / gộp lựa chọn 1 kháng thể đơn dòng.

#### [COPD-R3-R3-10] Kẽ hở an toàn dược lý trên nhóm đặc biệt: Lọc máu chu kỳ (`Azithromycin`), Cho con bú (`Roflumilast`), `Child-Pugh A`, và Khí dung `Ipratropium` trên Glôcôm góc đóng
- **Mức độ**: `major` | **Loại**: `rule` | **Đối tượng**: [`getAzithromycinContraReasons` & `getRoflumilastContraReasons`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.ts#L686-L780), [`rules.inpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.ts#L55-L91)
- **Bằng chứng thực chạy**:
  1. **`P06` (Thận nhân tạo chu kỳ `onDialysis: true`, `SCr = 110 µmol/L` sau lọc -> `eGFR = 63.9`)**: Vẫn phát `CONSIDER azithromycin 250 mg/ngày` dài hạn do `getAzithromycinContraReasons` quên kiểm tra `onDialysis` (vi phạm chống chỉ định `GFR < 10 mL/phút` của BYT QĐ 2131/2026).
  2. **`P08` (Phụ nữ đang cho con bú `breastfeeding: true`)**: Vẫn phát `CONSIDER roflumilast` dù `kb/drugs/roflumilast.json:88` (`fda.copd.roflumilast_lactation`) quy định `"status": "avoid"` (*"should not be used by women who are nursing"*).
  3. **`P09a` vs `P09b` (`Child-Pugh A`)**: Có `conditions.liverDisease: true` + `childPugh: 'A'` (`P09b`) thì chặn nhầm thành chống chỉ định `Child-Pugh B/C`; ngược lại chỉ chọn `childPugh: 'A'` (`P09a`) thì kê `CONSIDER roflumilast` mà không có bất kỳ dòng cảnh báo thận trọng suy gan nhẹ nào!
  4. **`C19`, `B17`, `B22b` (Nội viện)**: Khí dung `Salbutamol ± Ipratropium` trên bệnh nhân `narrowAngleGlaucoma` / `urinaryRetention` không cảnh báo tránh `Ipratropium` dính mắt gây mù/bí tiểu cấp (`C19`); kháng sinh gợi ý `Ciprofloxacin` không kèm cảnh báo chỉnh liều thận (`B22b`) hoặc kéo dài QTc khi dùng kèm `amiodarone` (`B17`).
- **Khắc phục**: Bổ sung `onDialysis` vào `getAzithromycinContraReasons`, `breastfeeding`/`lactation` vào `getRoflumilastContraReasons`, xử lý `childPugh === 'A'` bằng `warnings` thận trọng đúng nhãn FDA, và gắn cảnh báo kháng cholinergic / thận / QTc cho thuốc nội viện.

#### [COPD-R3-R3-11] Bốn lỗi vi phạm Fail-Closed và lệch chuẩn GOLD 2026 trong `src/engine/derive.ts`
- **Mức độ**: `major` | **Loại**: `threshold` | **Đối tượng**: [`derivePatientData`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/derive.ts#L127-L178), [`hasConfirmedCopdSpirometry`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.ts#L621-L626)
- **Bằng chứng thực chạy**:
  1. **`A01`**: Khi thiếu hoàn toàn `fev1FvcRatio` (`undefined`), dòng 139 (`postBdrRatio === undefined || postBdrRatio < 0.7`) vẫn gán `derived.goldGrade = 'GOLD 3', derived.goldGroup = 'E'` trong khi `copd` đang khóa fail-closed!
  2. **`A11b`**: Dòng 160 vẫn giữ ngưỡng cũ GOLD 2023 `modExac >= 2` (thay vì `>= 1` của GOLD 2026), làm `derived.goldGroup = undefined` khi `moderateExacerbations = 1, hospitalizations = undefined` trong khi `copd` đã khởi trị Nhóm E!
  3. **`A07` & `A08`**: Dòng 164 gán `derived.goldGroup = 'A'` khi mới biết `mmrc = 1` mà `cat = undefined` (vi phạm Fail-Closed và mâu thuẫn với `copd`).
  4. **`P13` (`A05a`)**: Khi truyền `patient.fev1 = 1.10, patient.fvc = 2.00` (`ratio = 0.55`), `derive.ts` tính ra `GOLD 3 / Nhóm E` nhưng `copd/helpers.ts` không đọc `fev1 / fvc` nên khóa toàn bộ phác đồ đòi nhập `FEV₁/FVC`!
- **Khắc phục**: Sửa `derive.ts:139` thành `postBdrRatio !== undefined && postBdrRatio < 0.7`, sửa dòng 160 thành `modExac >= 1`, đòi đủ cả `mmrc` và `cat` trước khi kết luận Nhóm A, và đồng bộ fallback `fev1 / fvc` sang `copd/helpers.ts`.

---

### 🟡 NHÓM MINOR (4 PHÁT HIỆN) & 🔵 SUGGESTION (2 PHÁT HIỆN)

- **[COPD-R3-R3-12] (`minor` – [`copd.nonpharm.ltot_oxygen`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.ts#L532))**: Kịch bản `P10b` (`restingSpo2: 91%, pao2: 58 mmHg, corPulmonaleOrPolycythemia: true`) xuất tiêu đề tự mâu thuẫn: *"Chỉ định Oxy trị liệu dài hạn tại nhà (LTOT) khi nghỉ (SpO₂ 91%) ... tiêu chuẩn mở rộng PaO₂ ≤ 59 mmHg hoặc SpO₂ < 90%"* do ưu tiên in `spo2` kể cả khi `pao2` mới là chỉ số đạt ngưỡng.
- **[COPD-R3-R3-13] (`minor` – [`copd.nonpharm.vaccinations`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.ts#L561-L586))**: Trong đợt cấp nội viện suy hô hấp toan CO₂ `pH 7.30` đang thở máy `NIV / BiPAP` cấp cứu (`E_copd_preset_inpatient_exac_0245`, `B05`, `D03a`), hệ thống vẫn hiện thẻ ngoại trú `Tiêm chủng Zona (Shingles), RSV, Tdap` và `Checklist xuất viện` gây nhiễu y lệnh hồi sức.
- **[COPD-R3-R3-14] (`minor` – [`src/engine/note.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/note.ts))**: Lỗi tồn đọng nguyên vẹn từ Vòng 2 (`R3-R2-COPD-15`, kịch bản `P15`): Tóm tắt bệnh án bỏ sót 100% chỉ số hô hấp (`FEV₁/FVC`, `FEV₁%`, `GOLD`, `mMRC`, `CAT`, `SpO₂`, `BCAT`, `ABG`), nhảy cóc số mục từ `2.` thẳng sang `4.` khi chưa có thuốc nền, và in cứng câu theo dõi Creatinin/Kali cho `RASi/ARNI/MRA` trên mọi bệnh nhân COPD đơn thuần.
- **[COPD-R3-R3-15] (`minor` – [`src/engine/require.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/require.ts) & [`inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/inputs.ts))**: Tồn đọng `R3-R2-COPD-16` (`B07` vẫn in tiếng Anh thô `Cần nhập daytimeSymptomsMoreThanTwiceWeek để đánh giá`), trường `increasedSputumVolume` trên UI bị bỏ hoang không nối luật, trong khi `respiratoryArrest`, `increasedDyspnea` và `breastfeeding` lại vắng mặt trên UI.
- **[COPD-R3-R3-16] (`suggestion` – [`rules.followup.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.ts#L210-L211))**: Mã trích dẫn `'byt.copd.2026.triple_therapy_indication'` bị lặp đúp 2 lần liên tiếp trong `citationIds` của 4 luật theo dõi.
- **[COPD-R3-R3-17] (`suggestion` – [`reviewMeds.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMeds.ts#L116))**: Thẻ `STOP` thuốc hít do dị ứng đạm sữa bò hoặc thai kỳ bị gán cứng `module: 'ckd'` ngay cả trên bệnh nhân chỉ mắc `['copd']` (`C04`).

---

## 4. Tổng hợp Độ phủ 138 Kịch bản Kiểm thử Đối nghịch (`evaluate()` thật)

| Nhóm kiểm thử | Số kịch bản | Phạm vi tấn công đối nghịch | Phát hiện tiêu biểu |
| :--- | :---: | :--- | :--- |
| **Nhóm A – Thiếu dữ liệu, Fail-Closed & Biên ngưỡng GOLD 2026** (`A01`–`A18`, `P13`) | **27** | Thiếu từng biến đơn lẻ (`FEV₁/FVC`, `FEV₁%`, `mMRC`, `CAT`, đợt cấp, `BCAT`, `SpO₂`, `ABG`); biên cứng `FEV₁/FVC = 0.699/0.700`, `FEV₁ = 29/30/49/50/79/80%`, `mMRC = 1/2`, `CAT = 9/10`, `BCAT = 99/100/299/300`, `BMI = 18.4/18.5`; rút ICS sai chỉ định | `COPD-R3-R3-08` (`A15b`), `COPD-R3-R3-11` (`A01`, `A07`, `A11b`, `P13`) |
| **Nhóm B – Đa bệnh lý & Xung đột Liên phân hệ** (`B01`–`B25`, `P06`–`P09`, `P11`, `P14`) | **36** | `COPD + HFrEF` (`carvedilol`, `propranolol`), `COPD + AF` (`amiodarone`, `sotalol`, `apixaban`), `COPD + Asthma` (Track 1/2, nội viện cấp, Action Plan, `SpO₂ 94%`), `COPD + CKD/Dialysis`, `COPD + Suy gan Child-Pugh A/B/C`, `COPD + ĐTĐ/Loãng xương/Trầm cảm`, Thai kỳ & Cho con bú | `COPD-R3-R3-02` (`B03`), `COPD-R3-R3-09` (`B14`, `P14`, `P11`), `COPD-R3-R3-10` (`P06`, `P08`, `P09a/b`), `COPD-R3-R3-15` (`B07`) |
| **Nhóm C – Đa dược học, Dụng cụ hít DPI/SMI/pMDI & Dị ứng** (`C01`–`C21`, `P01`–`P05`) | **30** | Trùng lặp 2–4 bình hít mở/đóng, đảo thứ tự mảng `currentMeds`, bí danh `fluticasone_umeclidinium_vilanterol`, phản vệ đạm sữa bò (`severeMilkProteinAllergy`), lực hít yếu (`weakInspiratoryFlow`), glôcôm góc đóng / bí tiểu cấp, cảm ứng mạnh CYP3A4 (`rifampicin`, `carbamazepine`), `theophylline`, NTM, giảm thính lực | `COPD-R3-R3-03` (`P01`, `P05a–c`, `C11`), `COPD-R3-R3-04` (`P05d`), `COPD-R3-R3-07` (`P04a–d`, `C05`), `COPD-R3-R3-17` (`C04`) |
| **Nhóm D – Đợt cấp Ngoại trú/Nội viện, Khí máu, NIV & LTOT** (`D01`–`D12`, `P10`, `P12`) | **25** | Suy hô hấp cấp ngoại trú quên tích `acuteExacerbation`, chuyển viện ngoại trú, ngừng thở nội viện (`respiratoryArrest`), lơ mơ toan CO₂ (`alteredMentalStatus`), toan chuyển hóa Kussmaul, tiêu chuẩn Anthonisen 1–3 triệu chứng, biên LTOT (`SpO₂ 88/89/91%`, `PaO₂ 55/58/60`) & `Home NIV` (`PaCO₂ 52/53/54`) | `COPD-R3-R3-01` (`D01`, `D02a`, `P12a/b`), `COPD-R3-R3-05` (`D05b`), `COPD-R3-R3-06` (`D08b`), `COPD-R3-R3-12` (`P10b`) |
| **Nhóm E – Ma trận Presets × Profiles (`VN/INTL/US`) × Đơn vị (`SI/Conv`) & EMR Note** (`E_*`, `P15`) | **20** | Toàn bộ 6 preset COPD chuẩn nhân chéo 3 profile (`VN`, `INTL`, `US`) và 2 hệ đơn vị (`SI` µmol/L vs `Conventional` mg/dL, kiểm tra bất biến `round-trip` không trượt đơn vị) + kiểm định toàn văn `plan.noteText` | `COPD-R3-R3-07` (`E_copd_preset_followup_roflumilast`), `COPD-R3-R3-13` (`E_copd_preset_inpatient_exac`), `COPD-R3-R3-14` (`P15`) |
| **TỔNG CỘNG** | **138** | **100% thực chạy `evaluate()` thật, 0 giả định cảm tính** | **17 phát hiện (`4 Critical, 7 Major, 4 Minor, 2 Suggestion`)** |
