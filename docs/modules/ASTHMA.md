# GDMT-VN – Đặc Tả Module Hen Phế Quản (`ASTHMA.md`)

**Mã định danh:** `asthma`  
**Tên module:** Hen phế quản người lớn & thanh thiếu niên ≥ 12 tuổi (*Asthma in Adults & Adolescents ≥ 12 years*)  
**Kỹ sư chuyên trách:** Agent M / M2 / M3 / M4 (Chuyên gia Hô hấp & Dị ứng – Kỹ sư Lâm sàng GDMT-VN)  
**Trạng thái kiểm định:** Đã khắc phục 100% Vòng 1, Vòng 2 & **Vòng 3 Review** (`round3_R1` [12 mục], `round3_R2` [18 mục], `round3_R3` [16 mục]), tuân thủ **5 Tiêu chuẩn An toàn Toàn cục** & **Kiến trúc `< 20 KB` (`< 20.480` bytes/file)**  
**Biểu tượng:** 🫁  
**Nguồn tài liệu nền tảng (95 trích dẫn nguyên văn đã kiểm chứng PDF offline):**  
- **INTL ★:** *Global Strategy for Asthma Management and Prevention (GINA 2026 Strategy Report & GINA 2026 Summary Guide)*.
- **VN:** *Bộ Y tế QĐ 1851/QĐ-BYT (2020) Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi* & *QĐ 5850/QĐ-BYT (2021) Quy trình lâm sàng chẩn đoán và điều trị hen phế quản ở người lớn và trẻ em ≥ 12 tuổi*.
- **US / EMA SmPC / FDA Labels:** *NAEPP 2020 Focused Updates (EPR-4 / SMART)*, *FDA Boxed Warnings (LABA/LAMA without ICS, Montelukast neuropsychiatric events, Omalizumab anaphylaxis)*, *FDA Labels (Magnesium Sulfate Injection, Singulair, Dupixent, Breo/Trelegy Ellipta, Atrovent)* & *EMA SmPC (Foster/Fostair, Symbicort Rapihaler, Trimbow, Ultibro Breezhaler)*.

---

## 1. Kiến Trúc Mô-đun Hóa `< 20 KB` (`27` tệp `.ts`)

Toàn bộ `src/modules/asthma/` được phân rã sạch sẽ thành **27 tệp `.ts` chuyên biệt**, đảm bảo **100% tệp `< 20.480` bytes** (kiểm chứng tự động trong `tests/modules/asthma/invariants.test.ts`):

- **Lõi cấu trúc & hằng số (`helpers.*`):**
  - `helpers.constants.ts`: Tập hằng số dược lý chuẩn hóa (`LABA_WITHOUT_ICS_DRUGS` gồm cả `glycopyrronium_indacaterol`, `LAMA_WITHOUT_ICS_DRUGS`, `ADULT_18_ONLY_DRUGS`, `DPI_ONLY_LACTOSE_DRUGS`, `DUAL_FORMULATION_INHALER_DRUGS`, `TRIPLE_INHALER_DRUGS` gồm `indacaterol_glycopyrronium_mometasone`, `STRONG_CYP3A4_INHIBITOR_DRUGS`, `CYP3A4_SENSITIVE_ICS_LABA_DRUGS`, `METHYLXANTHINE_DRUGS`).
  - `helpers.dosing.ts`: Bộ phân tích liều × tần suất (`parseFreqMultiplier`, `parseDailyInhalationsFromMed`), kiểm tra dị ứng thuốc (`getPatientAllergies`, `isAllergicToDrug`), dị ứng nặng đạm sữa bò (`hasSevereMilkProteinAllergy`), thai kỳ & cho con bú (`isPatientPregnant`, `isPatientBreastfeeding`), chọn thuốc tránh tương tác CYP3A4 / giới hạn tuổi `< 18` (`resolveTrack1MartDrugId`, `resolveTrack2MonoIcsDrugId`, `resolveTrack2IcsLabaDrugId`).
  - `helpers.clinical.ts`: Đánh giá kiểm soát triệu chứng GINA 4 câu đồng bộ `computeGina` (`evaluateGinaControl`), bộ phân tầng cơn hen cấp thống nhất ngoại trú + nội viện (`evaluateAcuteAsthma`), điều kiện hạ bậc an toàn (`isStepDownEligible`), và tính bậc hiệu dụng đồng bộ cho cả Track 1 (`computeEffectiveTrack1Step`) lẫn Track 2 (`computeEffectiveTrack2Step`).
  - `helpers.ts`: Barrel xuất công khai cho toàn phân hệ.
- **Tầng An toàn & Cảnh báo Đỏ (`rules.safety.*`):**
  - `rules.safety.age_allergy.ts`: Fail-closed thiếu tuổi, rào chắn Nhi khoa `< 12` tuổi, `STOP` mọi thuốc phạm dị ứng bệnh nhân (`dose: undefined`), `STOP` thuốc người lớn `≥ 18` tuổi (Foster, Trelegy, Trimbow, Breztri, Enerzair) ở vị thành niên `12–17` tuổi, `STOP` bình bột khô DPI chứa lactose ở bệnh nhân dị ứng nặng đạm sữa bò, tư vấn an toàn tiết sữa mẹ (`breastfeeding`).
  - `rules.safety.inhalers.ts`: `STOP` SABA đơn độc (chỉ ở người `≥ 12` tuổi ngoài cơn cấp), `STOP` mọi LABA / LABA-LAMA không kèm ICS (kể cả nội viện cấp cứu), `STOP` mọi LAMA đơn trị không kèm ICS duy trì Bậc 4–5 (trừ chồng lấp COPD), `STOP` bình SABA rời dư thừa khi đã theo Track 1 AIR/MART.
  - `rules.safety.duplicates.ts`: `STOP` từng bình ICS đơn chất dư thừa khi đã có ICS-LABA hoặc bình bộ ba (`TRIPLE_INHALER_DRUGS`), `AVOID`/`STOP` mọi bình LABA trùng lặp thứ 2 và thứ 3, kiểm soát trần quá liều MART (`12` nhát cho `160/4.5` & `100/6` mcg; **`24` nhát** cho `Rapihaler 80/2.25` mcg; miễn nhiễm `totalDailyPuffsUsed` mồ côi trên Track 2).
  - `rules.safety.cardio_nsaid.ts`: `STOP` từng thuốc chẹn beta không chọn lọc + tất cả chế phẩm nhỏ mắt chứa Timolol, `STOP` từng NSAID COX-1 trong AERD, chặn cứng liên phân hệ `[asthma + gout]` (`AVOID naproxen`, `priority: 99`), `MONITOR` COX-2 chọn lọc `≥ 2` giờ tại cơ sở y tế, lưu ý hội chẩn Sản – Dị ứng khi thai phụ AERD có nguy cơ tiền sản giật.
  - `rules.safety.systemic.ts`: Montelukast 3 tầng (`STOP` khi có nguy cơ tâm thần kinh/trầm cảm; `REDUCE` về viên nhai `5 mg` ở tuổi `12–14`; `MONITOR` tư vấn FDA Boxed Warning ở người `≥ 15` tuổi không nguy cơ), `STOP` Theophylline/Aminophylline (kèm cảnh báo giảm thanh thải ở xơ gan/suy tim/người cao tuổi), `AVOID` tương tác CYP3A4 mạnh (không báo giả ở nội trú không dùng ICS/LABA), `STOP` thuốc an thần/opioid trong cơn cấp ở cả ngoại trú lẫn nội viện (`setting: 'both'`), bảo vệ ICS thai kỳ.
- **Tầng Cấp cứu Cơn hen Cấp & Xuất viện (`rules.acute.*`):**
  - `rules.acute.outpatient.ts`: Xử trí tiền viện & chuyển tuyến khẩn cấp (`REFER`) cho cơn hen cấp tại phòng khám ngoại trú theo GINA 2026 Box 9-4 & QĐ 1851 Bảng 9 (Oxy mục tiêu + SABA lặp lại + Ipratropium cho cơn trung bình–nặng + Prednisolone/Methylprednisolone).
  - `rules.acute.inpatient.ts`: Cấp cứu nội viện cơn nguy kịch (`REFER` ICU mọi lứa tuổi; nhận diện đầy đủ thở chậm `< 10`, mạch chậm `< 50`, tụt HA `< 90`, toan máu `abgPh`, ưu thán `paco2`/`abgPaco2`, bình thán giả tạo `40–45 mmHg`), cơn nặng (`FEV₁ ≤ 50%` hoặc `PEF ≤ 50%`), phối hợp sớm `ipratropium` cho cả cơn trung bình tại Cấp cứu (bắt buộc ống ngậm miệng `mouthpiece` khi có `narrowAngleGlaucoma`), và cổng an toàn 4 lớp cho `magnesium_sulfate` (`AVOID` khi tụt HA `SBP < 90`, nhược cơ nặng, block AV độ II–III chưa tạo nhịp, hoặc đang truyền phác đồ Zuspan tiền sản giật; giảm còn `1 g` khi `eGFR < 30`).
  - `rules.acute.discharge.ts`: Cơn nhẹ–trung bình nội viện, cổng an toàn xuất viện khách quan (`PEF > 60%`, `SpO₂ ≥ 94%` hoặc `≥ 95%` ở thai phụ, hết nói ngắt quãng, không quá liều MART), bảo toàn phác đồ Bậc 5/LAMA khi xuất viện, và duy trì bình kiểm soát nền cho bệnh nhân nội trú ổn định ngoài đợt cấp (`isAcuteExacerbation === false`).
- **Tầng Quản lý Mạn tính Track 1, Track 2 & Bổ trợ (`rules.track1.*`, `rules.track2.*`, `actionPlan.ts`, `inputs.ts`, `matrices.ts`, `pathways.ts`, `presets.ts`):**
  - Đồng bộ 100% giữa Đơn thuốc và Bản Kế hoạch Hành động 3 vùng màu (`actionPlan.ts`), khóa toàn bộ chỉnh bậc mạn tính/hạ bậc khi đang có cơn hen cấp, giữ nguyên LABA khi hạ bậc Track 2 Bậc 3 (GINA Box 4-13), loại trừ `dupilumab` khi `bloodEosinophils ≥ 1500/µL` kèm tầm soát EGPA & *Strongyloides*, và bổ sung `setting: 'inpatient'` cho `preset_asthma_acute_severe_er`.

---

## 2. Cơ Sở Tri Thức & 5 Tiêu Chuẩn An Toàn Toàn Cục

- **Trích dẫn (`kb/citations/asthma.json`):** **95 trích dẫn nguyên văn** đối chiếu trực tiếp PDF gốc. Mọi ngưỡng thận/huyết áp của `magnesium_sulfate` và ngưỡng Oxy thai kỳ (`≥ 95%`) đều gắn đúng nhãn thuốc FDA Magnesium Sulfate Injection & GINA 2026 Box 9-4/p. 190 (triệt tiêu hoàn toàn lỗi ghép số sang tài liệu lợi tiểu suy tim hay SpO₂ nhi khoa).
- **Ngưỡng lâm sàng (`kb/thresholds/asthma.json`):** **84 ngưỡng định lượng** truy xuất hoàn toàn qua `thFor(quantity, id)`.
- **5 Tiêu chuẩn An toàn Toàn cục:**
  1. **Dị ứng thuốc (`patient.allergies` / `customInputs.allergies`):** Phát `STOP` (`priority: 100`, `dose: undefined`) cho mọi thuốc đang dùng phạm dị ứng và tự động chọn hoạt chất thay thế không phản ứng chéo ở mọi nhánh kê đơn (ngoại trú, nội viện, xuất viện).
  2. **Cho con bú (`breastfeeding` / `lactation`):** Phát khuyến cáo tư vấn an toàn tiết sữa mẹ (`rec_asthma_breastfeeding_safety`) trích xuất trực tiếp `DrugEntry.lactation` đối với corticoid toàn thân, LTRA, sinh học và methylxanthine.
  3. **Parser liều × tần suất (`parseFreqMultiplier` & `parseDailyInhalationsFromMed`):** Nhân chính xác số nhát mỗi lần dùng với tần suất hàng ngày (`'Sáng - tối'`, `'2 lần/ngày'`, `'BID'`, `'TID'`, `'QID'`, `'mỗi 6 giờ'`) và fail-closed (`undefined`) khi thiếu đơn vị nhát/xịt/puff hoặc chuỗi tần suất mơ hồ/PRN.
  4. **Không dính `dose` thừa trên thẻ chặn:** 100% khuyến cáo mang `action: 'STOP' | 'AVOID' | 'HOLD'` có `rec.dose === undefined`.
  5. **Toàn vẹn trích dẫn:** 100% `citationIds` trong `src/modules/asthma/**` tồn tại hợp lệ trong `kb/citations/*.json` (`0` lỗi/cảnh báo trên `npm run verify:kb`).

---

## 3. Báo Cáo Kiểm Thử & Kiểm Chứng (Verification Gates)

- **Kiến trúc `< 20 KB` (`Suite 0`):** **27/27 tệp `.ts` `< 20.480` bytes (100% PASS)**.
- **Vitest Golden Suite (`tests/golden/asthma/*.json`, `tests/modules/asthma/golden.test.ts` & `tests/golden/_runner.test.ts`):** **69/69 ca chuẩn PASS 100%** (gồm 53 ca Vòng 1–2 đã cập nhật chuẩn Vòng 3 + 16 ca mới `asthma_54`..`asthma_69` bao phủ toàn bộ kịch bản đối kháng Vòng 3 & liên phân hệ `asthma + gout`).
- **Vitest Property-Based Invariants (`tests/modules/asthma/invariants.test.ts`):** **17.000+ ca bệnh ngẫu nhiên hóa PASS 100% (0 vi phạm)** trên 17 bất biến lâm sàng, fail-closed QA-1/QA-9 và unit test parser tần suất.
- **TypeScript Strict Typecheck (`npx tsc --noEmit`):** **0 lỗi**.
- **KB & Rules Verifier (`npm run verify:kb`):** **EXIT CODE 0 (0 lỗi, 0 cảnh báo)**.
