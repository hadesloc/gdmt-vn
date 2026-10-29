# Báo cáo Thẩm định Độc lập Vòng 4 — Phân hệ Hen phế quản Người lớn & Thanh thiếu niên ≥ 12 tuổi (`asthma`)
**Vai trò**: Reviewer R1 – Chuyên gia Chuyên khoa Hô hấp & Kiểm định Guideline (Independent Guideline Specialist)  
**Đối chiếu tài liệu gốc (Primary PDFs)**:
- **GINA 2026 Strategy Report** (`01_Ho_Hap/GINA_2026_Strategy_Report.pdf` — 278 trang PDF)
- **GINA 2026 Summary Guide** (`01_Ho_Hap/GINA_2026_Summary_Guide.pdf` — 52 trang PDF)
- **Bộ Y tế QĐ 1851/QĐ-BYT (2020)** — *Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi* (`01_Ho_Hap/BYT_1851_2020_Hen_phe_quan_NL_va_TE_ge12.pdf`)
- **Bộ Y tế QĐ 5850/QĐ-BYT (2021)** — *Quy trình lâm sàng chẩn đoán và điều trị hen phế quản ở người lớn và trẻ em ≥ 12 tuổi* (`01_Ho_Hap/BYT_5850_2021_Quy_trinh_hen_phe_quan.pdf`)
- **Nhãn thuốc FDA / EMA SmPC gốc**: `FDA_label_budesonide_glycopyrronium_formoterol.pdf` (Breztri 04/2026), `FDA_label_budesonide.pdf` (Pulmicort Flexhaler 07/2025), `Trimbow_SmPC.pdf`, `Foster_Fostair_SmPC.pdf`, `ESC_2025_Pregnancy_Guidelines.pdf`, `BYT_2023_COPD_CapNhat_2767.pdf`, `KDIGO_2012_AKI_Guideline.pdf`.

---

## 1. Tổng quan Phạm vi Kiểm định & Đánh giá Khắc phục Vòng 3

Trong Vòng 4, toàn bộ 27 tệp mã nguồn của `src/modules/asthma/**`, toàn bộ 62 trích dẫn trong `kb/citations/asthma.json`, toàn bộ ngưỡng trong `kb/thresholds/asthma.json`, các hồ sơ thuốc hô hấp trong `kb/drugs/*.json`, cùng các cổng an toàn và tương tác liên phân hệ (`copd`, `hf`, `gout`, `htn`, `af`, `src/engine/safety/*`) đã được đối chiếu độc lập từng trang PDF gốc và kiểm chứng thực nghiệm trực tiếp qua `evaluate()`.

### Bảng Kiểm tra Kết quả Khắc phục Vòng 3 (`round3_R1.json` & `round3_RESPONSE.md`)

| Mã Vòng 3 | Mức độ R3 | Trạng thái ở Vòng 4 | Nhận xét kiểm chứng thực nghiệm |
|---|---|---|---|
| `ASTHMA-R3-R1-01` | Critical | **ĐÃ KHẮC PHỤC (còn lỗi kích hoạt giả đa phân hệ)** | Preset #5 đã gắn `setting: 'inpatient'`; cơn nguy kịch tại ngoại trú (`silentChest`, `drowsy_confused`, `diazepam`) đã phát đúng `[STOP] diazepam` + `[REFER] ICU/115` + `Salbutamol` + `Ipratropium` + `Methylprednisolone TM`. Tuy nhiên, hàm `evaluateAcuteAsthma()` lại tự suy diễn cơn hen cấp cho **mọi ca nội viện** và mọi ca ngoại trú có `SpO2 < 90%` khi `isAcuteExacerbation === undefined` (xem **`ASTHMA-R4-R1-01`**). |
| `ASTHMA-R3-R1-02` | Critical | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | `glycopyrronium_indacaterol` và cả 4 LAMA đơn trị (`tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`) không kèm ICS đều phát lệnh `[STOP]` chính xác và khởi trị ICS-formoterol. |
| `ASTHMA-R3-R1-03` | Critical | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | Đã bổ sung `fev1Pct <= 50%` vào tiêu chuẩn cơn nặng, nhận diện thở chậm (`< 10`), mạch chậm (`< 50`), tụt huyết áp (`SBP < 90`) vào `isLifeThreatening`, và sửa `hasMinVitals = spo2 !== undefined && rr !== undefined`. |
| `ASTHMA-R3-R1-04` | Major | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | Hạ bậc Bậc 3 → 2 Track 2 giữ nguyên thành phần LABA (giảm 25–50% ICS hoặc dùng 1 lần/ngày theo GINA Box 4-13 Evidence A); `mometasone_formoterol` nâng bậc 4 (`200/5 mcg`) và duy trì Bậc 5 chính xác. |
| `ASTHMA-R3-R1-05` | Major | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | Đã bổ sung quy tắc chống chỉ định `aminophylline`/`theophylline` tiêm tĩnh mạch trong đợt cấp và phát `[STOP] theophylline` duy trì ngoại trú kèm cảnh báo tương tác xoắn đỉnh/độc tính. |
| `ASTHMA-R3-R1-06` | Major | **ĐÃ KHẮC PHỤC (còn chi tiết nhỏ về ngưỡng)** | Đã tách mức độ trung bình (`isModerate`) và phối hợp `ipratropium` trong giờ đầu. Còn chi tiết nhỏ mượn ngưỡng SLIT `asthma.slit.min_fev1_pct` (xem **`ASTHMA-R4-R1-09`**). |
| `ASTHMA-R3-R1-07` | Major | **CHƯA ĐẠT / HỒI QUY NGHIÊM TRỌNG** | `round3_RESPONSE.md` báo cáo đã thêm `fda.mgso4.*` nhưng thực tế không có trong KB; thay vào đó gắn trích dẫn của **Varenicline** (`byt.copd.2023.severe_renal_crcl30`) và **Aminoglycoside** (`kdigo.aki.2012.myasthenia_neuromuscular`) cho **Magnesium sulfate**, khớp số ngẫu nhiên `'after 1 hour'` cho liều `1 g`, và gắn trích dẫn bảo vệ mắt buồng đệm cho quy tắc dị ứng đạm sữa bò (xem **`ASTHMA-R4-R1-06`**). |
| `ASTHMA-R3-R1-08` | Major | **HỒI QUY ĐẢO NGƯỢC TRÊN BREZTRI** | Khi chặn bình bộ ba `< 18 tuổi`, code xếp nhầm `budesonide_glycopyrronium_formoterol` (**Breztri**, được GINA 2026 & FDA duyệt từ **`≥ 12 tuổi`**) vào `ADULT_18_ONLY_DRUGS` và cắt cụt câu cuối trích dẫn GINA p. 246, đồng thời bỏ quên `beclometasone_glycopyrronium_formoterol` (Trimbow) khỏi `ADULT_18_ONLY_DRUGS` (xem **`ASTHMA-R4-R1-03`**). |
| `ASTHMA-R3-R1-09` | Major | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | Đã kết nối `customInputs.smokingStatus === 'current'` và đồng bộ 100% logic giữa `computeGina` và `evaluateGinaControl`. |
| `ASTHMA-R3-R1-10` | Minor | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | Đã khóa `discharge_ocs` và `action_plan_generator` khi `isMartOveruse(ctx)` dương tính. |
| `ASTHMA-R3-R1-11` | Minor | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | Khi chuyển sang Track 1 AIR/MART, hệ thống đã phát `[STOP] rec_asthma_mart_stop_separate_saba_salbutamol` ngừng bình SABA rời. |
| `ASTHMA-R3-R1-12` | Suggestion | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | Đã tích hợp tư vấn cá thể hóa cho `allergicRhinitis` (bao gồm HDM SLIT khi `FEV1 > 70%`), `gerd`, `obesity`, và khử trùng lặp `citationIds`. |
| `B5 Shared Engine` | Cross-module | **PHÁT SINH 2 HỒI QUY NẶNG** | (1) Gắn `severe_milk_protein_allergy` trên thành phần `salmeterol.json` làm hỏng hoàn toàn `fluticasone_salmeterol` (kể cả dạng pMDI không lactose) ở Track 2 Bậc 3–5 (**`ASTHMA-R4-R1-02`**); (2) Chặn `naproxen` toàn cục ở AERD nhưng quên cập nhật `gout/helpers.safety.ts`, khiến cơn gút cấp trên bệnh nhân AERD mất luôn `prednisolone` dự phòng thay thế (**`ASTHMA-R4-R1-05`**). |

---

## 2. Chi tiết Các Phát hiện tại Vòng 4 (`round4_R1.json`)

### 2.1. Nhóm Mức độ Nghiêm trọng Tối khẩn (`CRITICAL` — 2 phát hiện)

#### [ASTHMA-R4-R1-01] `CRITICAL` — Kích hoạt giả phác đồ Cơn hen cấp (SABA liều cao lặp lại + Prednisolone 40–50 mg/ngày) cho MỌI bệnh nhân nội viện nằm viện vì bệnh khác (như suy tim cấp ADHF) và bệnh nhân ngoại trú đồng mắc COPD có giảm oxy mạn tính nền
- **Vị trí**: `src/modules/asthma/inputs.ts:301-305`, `src/modules/asthma/helpers.clinical.ts:206-214`.
- **Phân tích lỗi**:
  1. Trường `customInputs.isAcuteExacerbation` không khai báo `defaultValue: false` nên mặc định là `undefined`.
  2. Trong `evaluateAcuteAsthma()`, biểu thức `(!isExplicitNotAcute && (hasSpecificAcutePresentation || (ctx.settings.setting === 'inpatient' && resp1h !== 'good_response')))` tự động bật `hasAcuteAttack = true` cho **mọi ca nội viện** có chọn kèm module `'asthma'`, và bật `hasSpecificAcutePresentation = true` cho **mọi ca ngoại trú** có `spo2 < 90%` (như giảm oxy mạn tính ở COPD nặng).
- **Bằng chứng thực nghiệm `evaluate()`**:
  - **Ca suy tim cấp sung huyết nội viện đồng mắc hen ổn định** (`setting: 'inpatient'`, `selectedModules: ['hf', 'asthma']`, `lvef: 32%`, `congestion: true`, `spo2: 94%`, `rr: 20`, `hr: 88`, hen Bậc 3 ổn định 0/4 câu GINA trên `budesonide_formoterol`): Engine vừa phát `[START] Furosemide 40 mg TM` chống phù phổi cấp của Suy tim, **vừa phát đồng thời** `[START] Salbutamol xịt 4–10 nhát mỗi 20 phút` (nguy cơ nhịp nhanh thất/rung nhĩ, thiếu máu cơ tim và hạ K+ máu nặng cộng hưởng lợi tiểu quai) + `[START] Prednisolone 40–50 mg/ngày x 5–7 ngày` (giữ muối nước cấp làm trầm trọng suy tim sung huyết — GINA 2026 PDF p. 180–181, 191), đồng thời triệt tiêu thẻ duy trì `budesonide_formoterol` nền!
  - **Ca ngoại trú COPD GOLD 3 ổn định đồng mắc hen** (`setting: 'outpatient'`, `selectedModules: ['copd', 'asthma']`, `spo2: 89%` mạn tính nền, `rr: 20`, 0/4 câu GINA): Phân hệ Hen phát lệnh `CHUYỂN KHOA CẤP CỨU KHẨN CẤP` + `Prednisolone 40–50 mg` mâu thuẫn trực diện với các thẻ `[CONTINUE]` ổn định của COPD.
- **Khuyến nghị sửa**: Đặt `defaultValue: false` cho `customInputs.isAcuteExacerbation` tại `inputs.ts:301` và xóa điều kiện suy diễn mù `ctx.settings.setting === 'inpatient' && resp1h !== 'good_response'` (cũng như không tự kết luận cơn hen cấp ngoại trú chỉ dựa vào `spo2 < 90%` đơn độc khi đồng mắc `copd`/`hf` mà không có `isAcuteExacerbation === true` hay dấu hiệu co thắt phế quản cấp đặc hiệu).

#### [ASTHMA-R4-R1-02] `CRITICAL` — Cổng chống chỉ định thành phần `salmeterol.json` chặn nhầm luôn cả dạng bình xịt không chứa lactose (`Seretide Evohaler pMDI`), bỏ mặc bệnh nhân Hen GINA Track 2 Bậc 3–5 dị ứng đạm sữa bò không có bất kỳ thuốc kiểm soát ICS hay thuốc cắt cơn nào
- **Vị trí**: `kb/drugs/salmeterol.json:58-64`, `kb/drugs/fluticasone_salmeterol.json:89`, `src/modules/asthma/rules.track2.steps.ts`, `src/modules/asthma/rules.step5.ts`.
- **Phân tích lỗi**:
  - `kb/drugs/salmeterol.json` gắn cứng `"code": "severe_milk_protein_allergy"` lên hoạt chất đơn `salmeterol` (dù chính nội dung `messageVi` viết *"cân nhắc dạng xịt pMDI không chứa lactose"*).
  - Vì `fluticasone_salmeterol.json` khai báo `"components": ["fluticasone_propionate", "salmeterol"]`, cổng an toàn toàn cục (`lactationAndAllergyGates.ts` / `contraCodeMatcher.ts`) tự động biến mọi lệnh `[START]` / `[SWITCH]` / `[CONTINUE]` `fluticasone_salmeterol` thành **`[AVOID] CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG Fluticasone / Salmeterol`**!
- **Bằng chứng thực nghiệm `evaluate()`**:
  - Bệnh nhân Track 2 Bậc 3, Bậc 4 hoặc Bậc 5 có `conditions.severeMilkProteinAllergy = true` đang dùng `fluticasone_vilanterol` (Relvar Ellipta DPI): Engine phát `[STOP] fluticasone_vilanterol` VÀ phát `[AVOID] Fluticasone / Salmeterol` — để lại bệnh nhân hen mức độ trung bình – nặng với **0 thuốc kiểm soát chứa ICS và 0 thuốc cắt cơn**!
- **Khuyến nghị sửa**: Gỡ `code: "severe_milk_protein_allergy"` khỏi hoạt chất đơn `kb/drugs/salmeterol.json` (đồng bộ với `budesonide.json`, `fluticasone_propionate.json` và `budesonide_formoterol.json` — chỉ gắn mã chống chỉ định cứng cho các thuốc **chỉ lưu hành duy nhất dạng bột khô DPI** như Ellipta/Breezhaler), và ghi rõ trong `dose` của `fluticasone_salmeterol` khi `hasSevereMilkProteinAllergy(ctx)` chỉ định bắt buộc dạng bình xịt `Seretide Evohaler pMDI qua buồng đệm (không chứa lactose)`.

---

### 2.2. Nhóm Mức độ Lớn (`MAJOR` — 4 phát hiện)

#### [ASTHMA-R4-R1-03] `MAJOR` — Hồi quy Vòng 3: Chặn sai `budesonide_glycopyrronium_formoterol` (`Breztri Aerosphere`) ở thanh thiếu niên 12–17 tuổi trái ngược trực tiếp với GINA 2026 & nhãn FDA, cắt cụt câu trích dẫn GINA p. 246, và bỏ sót `beclometasone_glycopyrronium_formoterol` (`Trimbow`) khỏi `ADULT_18_ONLY_DRUGS`
- **Vị trí**: `src/modules/asthma/helpers.constants.ts:43-47`, `src/modules/asthma/rules.safety.age_allergy.ts:94-119`, `src/modules/asthma/rules.step5.ts:126`, `kb/citations/asthma.json:711-718`.
- **Đối chiếu tài liệu gốc**:
  - **GINA 2026 Strategy Report, PDF p. 246**: *"Combination ICS-LABA-LAMA inhalers: For patients aged ≥18 years, beclometasone-formoterol-glycopyrronium; fluticasone furoate-vilanterol-umeclidinium and mometasone-indacaterol-glycopyrronium. **For patients aged ≥12 years, budesonide-formoterol-glycopyrronium.**"*
  - **GINA 2026 Summary Guide, PDF p. 26**: *"including budesonide-formoterol-glycopyrronium (patients ≥12 years)"*.
  - **FDA Label Breztri Aerosphere (`fda_breztri`, Section 1.2, PDF p. 4)**: *"BREZTRI AEROSPHERE is indicated for the maintenance treatment of asthma in adult and pediatric patients 12 years of age and older."*
  - Trong khi `kb/drugs/budesonide_glycopyrronium_formoterol.json:68` và `kb/citations/interactions.json:965` (`gina.asthma.2026.triple_age_18_12`) đã ghi đúng `≥ 12 tuổi`, thì `kb/citations/asthma.json:716` (`gina.asthma.2026.triple_tiotropium_age_limits`) lại cắt cụt đúng câu cuối cùng ở trang 246 và `helpers.constants.ts:45` đưa `budesonide_glycopyrronium_formoterol` vào `ADULT_18_ONLY_DRUGS`, phát lệnh `[STOP]` sai ở bệnh nhân 14 tuổi! Ngược lại, `beclometasone_glycopyrronium_formoterol` (`Trimbow`, chỉ duyệt `≥ 18 tuổi`) lại bị bỏ sót khỏi `ADULT_18_ONLY_DRUGS`.

#### [ASTHMA-R4-R1-04] `MAJOR` — Hạ bậc sai phác đồ khởi trị ban đầu (`currentStep === 0`) ở bệnh nhân chưa từng dùng thuốc kiểm soát có thức giấc ban đêm, suy giảm chức năng phổi (`FEV1 < 60%`) hoặc tiền sử đợt cấp nặng
- **Vị trí**: `src/modules/asthma/helpers.clinical.ts:356, 370, 379-385, 410, 416-421`.
- **Đối chiếu tài liệu gốc**:
  - **GINA 2026 Strategy Report Box 4-4 (PDF p. 82) & Summary Guide Table 3 (PDF p. 22)**:
    - Triệu chứng hàng ngày **hoặc thức giấc ban đêm ≥ 1 lần/tuần KÈM chức năng phổi thấp hoặc mới có đợt cấp** $\rightarrow$ Khởi trị **Bậc 4** (MART liều trung bình ở Track 1; ICS-LABA liều trung bình ở Track 2).
    - Triệu chứng hầu hết các ngày ($\ge 4$ ngày/tuần), **hoặc thức giấc ban đêm ≥ 1 lần/tuần, hoặc chức năng phổi thấp** $\rightarrow$ Khởi trị **Bậc 3** (MART liều thấp ở Track 1; ICS-LABA liều thấp ở Track 2).
  - **Bộ Y tế QĐ 1851/QĐ-BYT (2020), Bảng 5 (PDF p. 19)**: Quy định hoàn toàn tương đồng cho khởi trị Bậc 3 và Bậc 4.
- **Bằng chứng thực nghiệm `evaluate()`**: Vì `computeEffectiveTrack1Step` và `computeEffectiveTrack2Step` chỉ nâng lên Bậc 3/4 khi `score.level === 'uncontrolled'` ($\ge 3/4$ tiêu chí), bệnh nhân mới chẩn đoán (`currentStep: 0`) có **thức giấc ban đêm do hen + triệu chứng ban ngày > 2 lần/tuần (2/4 tiêu chí = `'partly_controlled'`) kèm `FEV1 = 54%` và `2 đợt cấp/năm`** chỉ được kê **Bậc 1–2 AIR khi cần (không có liều duy trì hàng ngày!)** ở Track 1 và **ICS đơn chất liều thấp** ở Track 2 thay vì **Bậc 4**! Ngoài ra, code bỏ quên không đọc fallback `ctx.patient.asthmaExacerbations` (`src/engine/types.ts:121`).

#### [ASTHMA-R4-R1-05] `MAJOR` — Lỗi liên phân hệ `['asthma', 'gout']` trên bệnh nhân Hen mẫn cảm Aspirin/NSAID (`AERD`): Bỏ rơi cơn gút cấp không có thuốc kháng viêm cắt cơn và không có dự phòng bùng phát cơn cấp khi khởi trị Allopurinol
- **Vị trí**: `src/modules/gout/helpers.safety.ts:304-334`, `src/modules/gout/rules.flare.ts:251-288`, `src/engine/safety/organAndCrisisGates.ts:214`.
- **Phân tích & Thực nghiệm `evaluate()`**: Hàm `isNsaidHardContraindicated(ctx)` của module Gút chưa kiểm tra `hasCondition(ctx, 'aerd')`. Khi bệnh nhân `['asthma', 'gout']` có `conditions.aerd = true`, `egfr = 78`, đang lên cơn gút cấp (`acuteFlare: true`) và không dùng được Colchicine (`cyp3a4PgpInhibitor: true` hoặc đến muộn $> 36$ giờ), module Gút vẫn chọn kê `naproxen` (bỏ qua nhánh fallback `prednisolone` ở dòng 288); sau đó cổng an toàn toàn cục lật `naproxen` thành `[AVOID] naproxen`, khiến bệnh nhân đang lên cơn gút cấp bị khởi trị `allopurinol` mà **không có bất kỳ thuốc cắt cơn hay dự phòng cơn cấp nào** (`prednisolone` hoàn toàn vắng mặt).

#### [ASTHMA-R4-R1-06] `MAJOR` — Tồn đọng & tái phạm lỗi trích dẫn giả tạo ngữ nghĩa (`Varenicline` và `Aminoglycoside` gán cho `Magnesium sulfate`; trích dẫn bảo vệ mắt buồng đệm gán cho dị ứng đạm sữa bò DPI) và báo cáo sai trong `round3_RESPONSE.md`
- **Vị trí**: `kb/thresholds/asthma.json:644-666`, `kb/drugs/magnesium_sulfate.json:45,87`, `kb/citations/asthma.json:923`, `src/modules/asthma/rules.acute.inpatient.ts:284-285,344,402`, `src/modules/asthma/rules.safety.age_allergy.ts:128,146,204,227`, `kb/drugs/fluticasone_furoate.json:71-73`, `kb/drugs/fluticasone_vilanterol.json:74-76`, `kb/drugs/fluticasone_umeclidinium_vilanterol.json:79`.
- **Đối chiếu từng trang PDF gốc**:
  1. `round3_RESPONSE.md:66` ghi đã bổ sung `fda.mgso4.renal_impairment_hypermagnesemia` và `fda.mgso4.hypotension_myasthenia_heartblock`, nhưng cả 2 mã không hề tồn tại trong KB.
  2. `byt.copd.2023.severe_renal_crcl30` (`BYT 2767/2023` PDF p. 18) nguyên văn là chống chỉ định tương đối của thuốc cai thuốc lá **Varenicline**, nhưng lại được gắn cho giảm liều **Magnesium sulfate** tiêm tĩnh mạch!
  3. `kdigo.aki.2012.myasthenia_neuromuscular` (`KDIGO 2012 AKI` PDF p. 65, Mục 3.8.2) nguyên văn nói về truyền kháng sinh **Aminoglycoside** 1 lần/ngày ở bệnh nhân nhược cơ, nhưng lại gắn cho **Magnesium sulfate**!
  4. Ngưỡng `asthma.acute.magnesium_renal_dose_g = 1` lách qua `verifyKb` nhờ cụm từ `"after 1 hour of care"` trong `gina.asthma.2026.acute_magnesium_fev1_30` (không có tài liệu nào nêu liều `1 g`).
  5. Toàn bộ quy tắc `STOP`/`MONITOR` dị ứng đạm sữa bò bình bột khô DPI trong `rules.safety.age_allergy.ts` chỉ trích dẫn `gina.asthma.2026.spacer_no_facemask_eye_protection` (tránh dùng mặt nạ buồng đệm để bảo vệ da và mắt!), trong khi thư viện `Medical_Library_2026` đã có sẵn nhãn gốc `09_Nhan_Thuoc/FDA/FDA_label_budesonide.pdf` (PDF pp. 4–5: *"Severe hypersensitivity to milk proteins... PULMICORT FLEXHALER contains small amounts of lactose, which contains trace levels of milk proteins"*) và `09_Nhan_Thuoc/EMA/Trimbow_SmPC.pdf` (PDF p. 46: *"Lactose contains small amounts of milk proteins, which may cause allergic reactions"*).

---

### 2.3. Nhóm Mức độ Nhỏ (`MINOR` — 3 phát hiện)

#### [ASTHMA-R4-R1-07] `MINOR` — Hiển thị chuỗi lỗi `[object Object]` trong khuyến cáo cho phụ nữ đang cho con bú và lộ mã `snake_case` của thuốc trên tiêu đề khuyến cáo
- **Vị trí**: `src/modules/asthma/rules.safety.age_allergy.ts:108, 141, 244-245`, `rules.safety.inhalers.ts:96, 154`, `rules.safety.systemic.ts:95, 193`, `rules.acute.inpatient.ts:494`.
- **Bằng chứng runtime**: `rec_asthma_breastfeeding_safety` xuất trực tiếp `'Thuốc đang dùng cần lưu ý khi cho con bú: Prednisolone: [object Object] · Montelukast: [object Object].'` do nối chuỗi object `entry.lactation` thay vì `entry.lactation.notesVi`.

#### [ASTHMA-R4-R1-08] `MINOR` — Lệch phân hạng mức chứng cứ (`loe`) trong `kb/citations/asthma.json` so với GINA 2026 PDF gốc & còn 2 trích dẫn phụ không khớp ngữ cảnh
- `gina.asthma.2026.beta_blocker_bronchospasm` (PDF p. 65 Box 3-6) và `gina.asthma.2026.step_down_months` (PDF p. 113) đều được GINA 2026 xếp hạng **`Evidence D`**, nhưng `kb/citations/asthma.json` ghi `"loe": "A"`.
- `gina.asthma.2026.acute_sedatives_avoid` ghi `"loe": "A"` trong JSON mâu thuẫn với `'GINA 2026 (Chứng cứ D)'` trong `rules.safety.systemic.ts:98`.
- `patientAllergyStopRules` (`rules.safety.age_allergy.ts:59,77`) vẫn gắn `gina.asthma.2026.never_saba_alone` và `smoking_and_vaccines` (`rules.track2.support.ts:81,111`) gắn `byt.asthma.2021.action_plan_zones`.

#### [ASTHMA-R4-R1-09] `MINOR` — Tinh chỉnh điều phối cơn hen cấp nhẹ tại phòng khám ngoại trú, tách ngưỡng `isModerate` khỏi ngưỡng SLIT và ghi chú cập nhật đích SpO₂ GINA 2026 (`92–95%` vs `93–95%`)
- Ở cơn hen cấp nhẹ tại tuyến ban đầu (`PEF = 85%`, `SpO2 = 96%`, `RR = 18`, nói trọn câu), `rules.acute.outpatient.ts` vẫn gắn `action: 'REFER'` và tiêu đề `'trong lúc chuyển viện / trước chuyển Cấp cứu'` thay vì điều trị tại chỗ và đánh giá lại sau 1 giờ (`MONITOR`) theo GINA Box 9-4 & QĐ 1851 Bảng 9.
- `helpers.clinical.ts:306-308` đang mượn ngưỡng miễn dịch dưới lưỡi `asthma.slit.min_fev1_pct` (`70%`) cho `modMaxFev1` và dùng `// qa-allow: unit-conversion` cho hằng số lâm sàng `79` và `22`. Bổ sung thêm `profileDiff` làm rõ GINA 2026 cập nhật ngưỡng thở oxy chung `< 92%` (đích `92–95%`, cơn nặng người lớn `93–95%`) so với BYT QĐ 1851/5850 (`93–95%`).

---

## 3. Kết luận Kiểm định Độc lập Vòng 4 (Reviewer R1)

**FAIL (2 critical, 4 major)**
