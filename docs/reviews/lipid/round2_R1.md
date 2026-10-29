# Báo Cáo Thẩm Định Độc Lập Vòng 2 — Vai Trò R1 (Chuyên Gia Tim Mạch / Rối Loạn Lipid Máu & Đối Chiếu Guideline)

- **Module thẩm định:** `lipid` (Rối loạn Lipid máu — GDMT-VN)
- **Vòng thẩm định:** Vòng 2 (`round2_R1`) — Kiểm định độc lập sau khắc phục Vòng 1
- **Vai trò:** **R1 — Chuyên gia Tim mạch / Rối loạn Lipid máu & Đối chiếu Guideline gốc (Guideline Specialist)**
- **Ngày thực hiện:** 27/10/2026
- **Cam kết độc lập:** Độc lập tuyệt đối theo `docs/REVIEW_PROTOCOL.md` (không đọc bất kỳ báo cáo hay tệp nháp nào của R2/R3 Vòng 2; không chỉnh sửa bất kỳ tệp nào trong `src/`, `kb/`, `tests/`).

---

## 1. Phạm Vi Đối Chiếu Tài Liệu Gốc & Tổng Quan Mức Độ Nghiêm Trọng

### 1.1. Tài liệu Guideline & Nhãn thuốc PDF gốc đã mở đối chiếu nguyên văn
1. **ESC/EAS 2025 Focused Update on Dyslipidaemias** (`esc_2025_lipid` — `ESC_2025_dyslipidaemias.pdf`, đọc toàn văn trang PDF 1–19 / trang in 4359–4377: Table 3, Table 4, Box 1, Figure 1, Figure 2, Recommendation Tables 1–8).
2. **ESC/EAS 2019 Guidelines for the Management of Dyslipidaemias** (`esc_2019_lipid` — `ESC_2019_dyslipidaemias_base.pdf`, đối chiếu toàn bộ các bảng mục tiêu, phân tầng nguy cơ, bậc thang thuốc, tăng TG, ĐTĐ, ACS, CKD/lọc máu, theo dõi men gan/CK).
3. **2026 ACC/AHA/AACVPR/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline for the Management of Dyslipidemia** (`acc_2026_lipid` — `ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, đối chiếu nguyên văn Top 10 Take-Home Messages, PREVENT-ASCVD, CAC, ĐTĐ, ASCVD nguy cơ rất cao vs chưa rất cao, CKD/lọc máu, HIV, tăng TG, không dung nạp statin, Lp(a) và các bảng liều thuốc/DDI).
4. **ESC 2026 Guidelines on Cardiovascular Disease and Chronic Kidney Disease** (`esc_2026_cvd_ckd` — `ESC_2026_cvd_chronic_kidney_disease.pdf`, đối chiếu Recommendation Tables 10 & 20 về quản lý lipid ở CKD và lọc máu).
5. **KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD** (`kdigo_2024_ckd` — `KDIGO_2024_CKD_Guideline.pdf`, Section 3.15 trang 46–47 & 119–120).
6. **Quyết định 5481/QĐ-BYT năm 2020** — Hướng dẫn chẩn đoán và điều trị Đái tháo đường típ 2 (`byt_5481_2020_dm2` — `BYT_5481_2020_Dai_Thao_Duong_Tip_2.pdf`, Mục lục trang 6, Phần 4 Mục 6.2 trang 35–36, Phần 8 Mục 1.1 trang 50) & **Quyết định 361/QĐ-BYT (2014)** (`byt_361_2014_gout`).
7. **Nhãn thuốc FDA chính thức** (`FDA_label_atorvastatin.pdf`, `FDA_label_rosuvastatin.pdf`, `FDA_label_ezetimibe.pdf`, `FDA_label_evolocumab.pdf`, `FDA_label_inclisiran.pdf`, `FDA_label_bempedoic_acid.pdf`).

### 1.2. Tệp mã nguồn, cơ sở tri thức & kiểm chứng thực nghiệm
- Toàn bộ mã nguồn module `src/modules/lipid/{index,helpers,inputs,pathway,presets,matrix,rules.inpatient,rules.outpatient}.ts`, các bộ tính toán `src/engine/calculators/{ldlTarget,score2}.ts`, `src/engine/evaluate.ts`.
- Toàn bộ `kb/thresholds/lipid.json` (79 ngưỡng), `kb/citations/lipid.json` (81 trích dẫn) và 13 hồ sơ thuốc sở hữu trong `kb/drugs/*.json`.
- Đã chạy thực nghiệm trực tiếp hàm `evaluate()` trên 28 kịch bản lâm sàng chuyên sâu (`docs/reviews/lipid/scratch/r2_r1_test_engine.ts` → `r2_r1_engine_output.txt` và `r2_r1_test_engine_batch2.ts` → `r2_r1_engine_output_batch2.txt`).

### 1.3. Bảng tổng hợp số lượng phát hiện Vòng 2 (`round2_R1`)

| Mức độ nghiêm trọng (`severity`) | Số lượng | Ý nghĩa lâm sàng theo `REVIEW_PROTOCOL.md` |
|---|:---:|---|
| **`critical`** | **2** | Có nguy cơ gây hại trực tiếp cho bệnh nhân nếu làm theo (kê trùng 2 statin ở bệnh nhân lọc máu chu kỳ; làm rơi/biến mất thuốc phối hợp đang dùng khỏi phác đồ duy trì ở cả nhóm đã đạt đích lẫn chưa đạt đích). |
| **`major`** | **9** | Sai lệch nghiêm trọng so với guideline gốc (phân tầng sai ĐTĐ làm mất chỉ định Statin Class I-A; bỏ sót chỉ định Statin Class I ở HIV ≥ 40 tuổi và ở tăng TG > 2.3 mmol/L nguy cơ cao; chạy SCORE2 trên lipid đang điều trị và trên bệnh nhân CKD; bỏ chết Non-HDL-C & ApoB; đánh đồng dự phòng tiên phát với thứ phát; sai tiêu chuẩn Extreme Risk `< 1.0 mmol/L`; 2 trích dẫn sai bản chất tài liệu gốc kiểu "chứa số" / đánh tráo bệnh lý võng mạc mắt). |
| **`minor`** | **4** | Dùng chéo biến ngưỡng sai ngữ nghĩa hoạt chất/đại lượng; gán nhầm trích dẫn phụ giữa các bối cảnh; sai lệch siêu dữ liệu `COR`/`LOE`; thiếu đơn vị `nmol/L` cho `Lp(a)` và khóa cứng chuỗi `mmol/L` khi chọn `mg/dL`. |
| **`suggestion`** | **1** | Đề xuất nâng cấp phân nhánh hành vi thực sự cho `profile: 'US'` theo các điểm mới của ACC/AHA 2026 (PREVENT-ASCVD, CAC score, Icosapent ethyl COR 2b). |
| **Tổng cộng** | **16** | **Kết luận Vòng 2: `FAIL`** (yêu cầu PASS: `0 critical, 0 major`). |

---

## 2. Kiểm Chứng Độc Lập 18 Phát Hiện Vòng 1 Của R1 (`LIPID-R1-01` → `LIPID-R1-18`)

| Mã Vòng 1 | Mức độ V1 | Nội dung tóm tắt Vòng 1 | Kết quả kiểm chứng thực tế tại Vòng 2 | Tham chiếu Vòng 2 (nếu còn lỗi/hồi quy) |
|---|:---:|---|:---:|---|
| **LIPID-R1-01** | Major | Bỏ sót đích `< 1.0 mmol/L` cho ASCVD tái phát trong 2 năm | **ĐẠT MỘT PHẦN** (Đã thêm biến `isExtremeRecurrent`, nhưng bỏ sót bệnh đa giường mạch `polyvascular` của ESC 2025 Figure 1 và áp cả cho BN chưa dùng statin với lệnh `START` thay vì Class IIb `CONSIDER`) | `LIPID-R2-R1-09` |
| **LIPID-R1-02** | Major | Thiếu leo thang Bước 2 phối hợp Ezetimibe trên nền statin | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`lipid.step2.continue_statin` + `lipid.step2.add_ezetimibe_on_statin` hoạt động tốt ở nhóm nguy cơ cao/rất cao) | — |
| **LIPID-R1-03** | Major | Thuốc ức chế PCSK9 mồ côi khỏi Rule Engine | **ĐẠT MỘT PHẦN** (Đã thêm Bước 3 Evolocumab, nhưng phát cứng `START` Class I-A cho cả dự phòng tiên phát không FH vốn chỉ là Class IIb-C, chạy cả trên lọc máu không ASCVD, và làm rơi Evolocumab khi BN đã đạt đích!) | `LIPID-R2-R1-01`, `LIPID-R2-R1-02`, `LIPID-R2-R1-08` |
| **LIPID-R1-04** | Major | Khuyến cáo Icosapent ethyl cho BN chưa từng dùng statin | **ĐẠT MỘT PHẦN** (Đã chặn IPE khi chưa có statin, nhưng bỏ quên vế 2 của kiến nghị: không thêm luật khởi trị Statin đầu tay Class I-B khi `TG > 2.3 mmol/L`, khiến `lipid.tg.elevated_cv_risk` bị mồ côi) | `LIPID-R2-R1-06` |
| **LIPID-R1-05** | Major | Vi phạm nguyên tắc Đích Kép (`≥ 50%` giảm từ nền) | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`computeLdlTarget` và các luật ngoại trú kiểm tra đồng thời ngưỡng tuyệt đối và mức giảm `≥ 50%` khi có `baselineLdl`) | — |
| **LIPID-R1-06** | Major | Bỏ sót quản lý nhóm nguy cơ Trung bình (`< 2.6`) và Thấp (`< 3.0`) | **ĐẠT MỘT PHẦN** (Đã thêm `lipid.step1.primary_moderate_low` khi chưa dùng statin, nhưng nếu BN nhóm trung bình/thấp ĐANG dùng statin mà chưa đạt đích thì rơi vào lỗ đen 0 khuyến cáo thuốc) | `LIPID-R2-R1-02` |
| **LIPID-R1-07** | Major | Dùng sai biến `lipid.reduction.pcsk9_alone` (60%) làm mốc `eGFR < 60` | **ĐẠT MỘT PHẦN** (Đã sửa bằng `lipid.safety.egfr_ckd_cutoff`, nhưng lại phát sinh lỗi mới cùng bản chất: lấy `ezeDose` của Ezetimibe gán cho liều Pravastatin trong `matrix.ts` và lấy `%` giảm của Statin+Eze gán cho Eze+Evolocumab) | `LIPID-R2-R1-12` |
| **LIPID-R1-08** | Major | Phân tầng nguy cơ bỏ sót bệnh nhân FH | **ĐÃ KHẮC PHỤC CỐT LÕI** (`evaluateLipidRiskAndTarget` nhận diện cả cờ `familialHypercholesterolemia` lẫn `dlcnScore >= 6`; lưu ý nhỏ về mức COR giữa FH tiên phát vs thứ phát xem R2-R1-08) | `LIPID-R2-R1-08` |
| **LIPID-R1-09** | Major | Bỏ sót khuyến cáo Class I-C nội viện ACS cho BN đã dùng LLT trước nhập viện | **ĐẠT MỘT PHẦN** (Đã thêm `acs_prior_llt_statin` + `addon` khi có statin trước nhập viện, nhưng nếu trước nhập viện dùng Ezetimibe đơn trị hoặc bộ ba Statin+Eze+PCSK9i thì làm rơi mất Ezetimibe/PCSK9i) | `LIPID-R2-R1-02` |
| **LIPID-R1-10** | Major | Không có hành động khi nhập `Lp(a) > 50 mg/dL` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`lipid.lpa.elevated_reclassify` kích hoạt ở cả nội/ngoại trú và lồng vào rationale tiên phát; thiếu đơn vị `nmol/L` ghi nhận ở mức Minor) | `LIPID-R2-R1-15` |
| **LIPID-R1-11** | Minor | Gán trích dẫn ACC dịch tễ cho xử trí men gan ALT | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`lipid.safety.alt_elevation` và `alt_hold_fenofibrate` dùng đúng `esc.lipid.2019.monitoring_alt_elevation`) | — |
| **LIPID-R1-12** | Minor | Quy tắc ngoại trú xa đích trích dẫn nguồn nội viện ACS | **CHƯA TRIỆT ĐỂ** (Đã xóa khỏi `rule.citationIds`, nhưng tại dòng 1196 của `rules.outpatient.ts` trong `produce()` và trong `kb/thresholds/lipid.json` dòng 591 vẫn còn nguyên `esc.lipid.2025.acs_naive_combination` + thêm lỗi gán `esc.lipid.2019.target_low` chứa số `3.0`) | `LIPID-R2-R1-12` |
| **LIPID-R1-13** | Minor | Không giảm liều Fenofibrate ở suy thận vừa (`eGFR 30–59`) | **HỒI QUY NGHIÊM TRỌNG VỀ TRÍCH DẪN** (Logic code đã giảm xuống 67 mg, nhưng lại tạo mới trích dẫn ngụy tạo ngữ nghĩa `fda.rosuvastatin.fenofibrate_67mg` từ bảng tương tác 67 mg TID = 201 mg/ngày của nhãn Rosuvastatin!) | `LIPID-R2-R1-10` |
| **LIPID-R1-14** | Minor | Cảnh báo xấp xỉ từ `score2.ts` chưa được hiển thị lên Recommendation | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`warnings` của Recommendation hiển thị đầy đủ `score2Result.warning`) | — |
| **LIPID-R1-15** | Minor | Không dung nạp statin chỉ xuất 1 thuốc, thiếu Ezetimibe | **ĐẠT MỘT PHẦN** (Khi mới khởi trị đã xuất đủ Bempedoic acid + Ezetimibe, nhưng khi BN đã dùng bộ đôi này mà chưa đạt đích và không bị gút thì rơi vào lỗ đen 0 khuyến cáo!) | `LIPID-R2-R1-02` |
| **LIPID-R1-16** | Suggestion | Bổ sung ca bệnh mẫu có tăng `Lp(a)` trong `presets.ts` | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (`lipid_preset_5_primary_prevention_moderate` có `lpa: 68 mg/dL`) | — |
| **LIPID-R1-17** | Suggestion | Bổ sung khuyến cáo lấy bilan lipid sớm trong 24h đầu ACS | **ĐẠT MỘT PHẦN** (Đã thêm `lipid.inpatient.acs_early_lipid_panel`, nhưng bên trong `produce()` dòng 48 & 58 lại đọc nhầm ngưỡng và trích dẫn men gan `esc.lipid.2019.monitoring_alt_elevation`) | `LIPID-R2-R1-13` |
| **LIPID-R1-18** | Suggestion | Bổ sung `profileDiff.US` theo ACC/AHA 2026 | **ĐÃ KHẮC PHỤC CƠ BẢN** (Đã bổ sung chuỗi so sánh `profileDiff.US` ở các luật chính; đề xuất nâng cấp sang phân nhánh tính toán thực sự ở R2-R1-16) | `LIPID-R2-R1-16` |

---

## 3. Chi Tiết 16 Phát Hiện Thẩm Định Vòng 2 (`LIPID-R2-R1-01` → `LIPID-R2-R1-16`)

---

### [LIPID-R2-R1-01] `CRITICAL` — Kê trùng lặp 2 thuốc nhóm Statin cùng lúc (`CONTINUE simvastatin` + `SWITCH atorvastatin 40–80 mg`) và leo thang sai phác đồ ở bệnh nhân suy thận mạn lọc máu chu kỳ (`onDialysis`)
- **Phân loại (`itemType`):** `rule`
- **Đối tượng (`itemId`):** `lipid.step1b.intensify_moderate_statin` | `lipid.safety.dialysis` | `lipid.step3.add_pcsk9i_on_dual_therapy` | `lipid.step1.statin_high_or_very_high`
- **Bằng chứng Guideline gốc:**
  1. **ESC/EAS 2019** (`ESC_2019_dyslipidaemias_base.pdf`, Section 9.9 Recommendations, PDF p. 49 / trang in p. 159):
     > *"In patients already on statins, ezetimibe, or a statin/ezetimibe combination at the time of dialysis initiation, continuation of these drugs should be considered, particularly in patients with ASCVD."* (**Class IIa, Level C**)
     > *"In patients with dialysis-dependent CKD who are free of ASCVD, commencement of statin therapy is not recommended."* (**Class III, Level A**)
  2. **ESC 2026 CVD & CKD Guidelines** (`ESC_2026_cvd_chronic_kidney_disease.pdf`, Recommendation Table 10, PDF p. 27 & Recommendation Table 20, PDF p. 50):
     > *"Initiating a statin-based regimen may be considered in patients on dialysis with a history of ASCVD."* (**Class IIb, Level C**; phần thuyết minh p. 26 nêu rõ ưu tiên phác đồ đã kiểm chứng trên CKD như atorvastatin 20 mg hoặc simvastatin 20 mg + ezetimibe 10 mg từ thử nghiệm SHARP).
  3. **KDIGO 2024 CKD Guideline** (`KDIGO_2024_CKD_Guideline.pdf`, Rec 3.15.1.2 & 3.15.1.3, PDF p. 47) & **ACC/AHA 2026** (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Section 4.2.8.8, PDF p. 79 / trang in p. 2702).
- **Đối chiếu mã nguồn:**
  - Tại `src/modules/lipid/helpers.ts` dòng 205–206: `dialysisBlocksNewStatin` chỉ bằng `true` khi `activeStatin === null` và `!hasAscvdEquivalent(ctx)`.
  - Tại `src/modules/lipid/rules.outpatient.ts` dòng 500–530, luật `lipid.safety.dialysis` phát lệnh `CONTINUE` cho `drugToKeep = activeStatin.drugId` (ví dụ `'simvastatin'`). Thế nhưng các luật leo thang `lipid.step1b.intensify_moderate_statin` (dòng 1294–1395), `isStep2Eligible` (dòng 24–51) và `isStep3Eligible` (dòng 56–85) **hoàn toàn không kiểm tra `safety.onDialysis`**! Vì `egfr < 30` xếp bệnh nhân lọc máu vào tầng `very_high` (đích `< 1.4 mmol/L`), `step1b` lập tức sinh thêm khuyến cáo `SWITCH` với `drugId: 'atorvastatin'` (`40–80 mg/ngày`). Do `'simvastatin' !== 'atorvastatin'`, bộ gộp `mergeRecommendations` trong `src/engine/evaluate.ts` giữ nguyên **cả hai lệnh thuốc**, tạo ra y lệnh dùng đồng thời hai statin trên bệnh nhân suy thận giai đoạn cuối lọc máu chu kỳ — nguy cơ tiêu cơ vân cấp tính rất cao!
- **Bằng chứng thực nghiệm `evaluate()`:**
  - **Ca B5** (`age: 64, sex: 'female', egfr: 8, ldl: 1.9, conditions: { ckd: true, onDialysis: true }, currentMeds: [{ drugId: 'simvastatin', dose: '20 mg' }, { drugId: 'ezetimibe', dose: '10 mg' }]` — phác đồ chuẩn SHARP đang duy trì khi bước vào lọc máu):
    - Output thực tế (`r2_r1_engine_output_batch2.txt` dòng 25–31):
      - `[SWITCH] id=rec_lipid_switch_to_high_atorva drug=atorvastatin dose="40–80 mg 1 lần/ngày"`
      - `[CONTINUE] id=rec_lipid_dialysis_continue drug=simvastatin`
      - Làm rơi mất `ezetimibe`, đồng thời kích hoạt cảnh báo độc tính: `ALERTS: [{"type":"duplicate","severity":"warning","title":"Trùng lặp 2 thuốc nhóm Statin"}]`!
  - **Ca B6** (`onDialysis: true, ascvd: false, egfr: 8, ldl: 1.9, currentMeds: [atorvastatin 40 mg, ezetimibe 10 mg]`): Engine phát `[START] evolocumab 140 mg mỗi 2 tuần` gắn trích dẫn `esc.lipid.2019.pcsk9_add_on_secondary` dù bệnh nhân **không có ASCVD** và chính `src/modules/lipid/matrix.ts` (dòng 487–533) đánh dấu nhóm PCSK9i ở lọc máu là `no_data`/`caution`.
  - **Ca 4a** (`onDialysis: true, ascvd: true, currentMeds: [], ldl: 3.2`): `lipid.step1.statin_high_or_very_high` (dòng 1046) phát `[START] atorvastatin 40–80 mg/ngày` (Class I) kèm phối hợp sớm Ezetimibe, trái với ESC 2026 CVD-CKD (**Class IIb, Level C** — `CONSIDER`) và mâu thuẫn trực tiếp với ô `atorvastatin.dialysis.initiate = 'not_rec'` tại `src/modules/lipid/matrix.ts` dòng 298.
- **Đề xuất khắc phục:**
  1. Chặn `lipid.step1b.intensify_moderate_statin`, `isStep2Eligible` và `isStep3Eligible` khi `safety.onDialysis && !hasAscvdEquivalent(ctx)` (chỉ duy trì nguyên vẹn phác đồ đã dùng ổn định trước lọc máu, bao gồm phát `CONTINUE` cho cả `statin` lẫn `ezetimibe` nếu đang phối hợp theo SHARP; nếu có ASCVD trên lọc máu cần nâng liều thì `lipid.safety.dialysis` không được phát `CONTINUE` cho statin cũ đang bị `SWITCH`).
  2. Tách nhánh riêng cho bệnh nhân `onDialysis` có kèm ASCVD chưa dùng statin với `action: 'CONSIDER'` (theo ESC 2026 CVD-CKD Class IIb, Level C), và đồng bộ ghi chú ô `dialysis` trong `matrix.ts`.

---

### [LIPID-R2-R1-02] `CRITICAL` — Làm rơi/biến mất thuốc hạ lipid đang dùng (`Ezetimibe`, `PCSK9i`, `Bempedoic acid`, `Statin`) khỏi kế hoạch điều trị ở cả bệnh nhân ĐÃ ĐẠT ĐÍCH lẫn CHƯA ĐẠT ĐÍCH (6 "lỗ đen" phác đồ)
- **Phân loại (`itemType`):** `rule`
- **Đối tượng (`itemId`):** `lipid.goal.achieved_maintain` | `lipid.intolerance.*` | `lipid.step1b/2/3` | `lipid.inpatient.acs_prior_llt_*`
- **Bằng chứng Guideline gốc:**
  - **ESC 2025 Focused Update** (`ESC_2025_dyslipidaemias.pdf`, Section 5 p. 12 / trang in p. 4370): *"After ACS, lifelong treatment to lower LDL-C levels to recommended targets is strongly recommended."*
  - **ESC 2025 Recommendation Table 2** (PDF p. 11 / trang in p. 4369):
    > *"Non-statin therapies with proven cardiovascular benefit, taken alone or in combination, are recommended for patients who are unable to take statin therapy to lower LDL-C levels and reduce the risk of CV events."* (**Class I, Level A**)
    > *"Addition of bempedoic acid to the maximally tolerated dose of statin with or without ezetimibe should be considered in patients at high or very high risk in order to achieve the LDL-C goal."* (**Class IIa, Level C**)
  - **ACC/AHA 2026** (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Section 4.2.11 Rec 3, PDF p. 92 / trang in p. 2715): Ở bệnh nhân ASCVD không dung nạp statin chưa đạt đích với ezetimibe/bempedoic acid, khuyến cáo bổ sung PCSK9 mAb hoặc inclisiran (**COR 1, LOE B-R**).
- **Đối chiếu mã nguồn & Bằng chứng thực nghiệm `evaluate()` (6 lỗ đen làm mất thuốc):**
  1. **Lỗ đen #1 — Bệnh nhân ĐÃ ĐẠT ĐÍCH nhờ phác đồ phối hợp bị rơi sạch toàn bộ thuốc Non-statin (`rules.outpatient.ts` dòng 1574–1615):**
     - `lipid.goal.achieved_maintain` chỉ phát duy nhất 1 lệnh `CONTINUE` cho `activeStatin.drugId`, bỏ quên hoàn toàn `ezetimibe`, `evolocumab`/`alirocumab`/`inclisiran`, `bempedoic_acid`.
     - Thực nghiệm **Ca B7** (`ascvd: true, ldl: 1.1, baselineLdl: 3.5, currentMeds: [atorvastatin 80 mg, ezetimibe 10 mg, evolocumab 140 mg]`) và **Ca 7a** (`atorvastatin 80 + ezetimibe 10, ldl: 1.25`): Engine chỉ xuất `[CONTINUE] atorvastatin` — **làm biến mất hoàn toàn `ezetimibe` và `evolocumab` khỏi đơn duy trì**! Ngừng Ezetimibe/PCSK9i ở bệnh nhân ASCVD nguy cơ rất cao gây tăng vọt LDL-C dội ngược (rebound) và tái phát nhồi máu cơ tim.
  2. **Lỗ đen #2 — Bệnh nhân không dung nạp Statin ĐÃ ĐẠT ĐÍCH bị rơi TOÀN BỘ thuốc (`rules.outpatient.ts` dòng 1588–1589 & 2190):**
     - `achieved_maintain` và `retest_schedule` đều đòi hỏi `getActiveStatin(ctx) !== null`.
     - Thực nghiệm **Ca 3d-2** (`statinIntolerance: true, ascvd: true, ldl: 1.1, currentMeds: [bempedoic_acid 180 mg, ezetimibe 10 mg]`): Engine xuất **0 khuyến cáo thuốc** (rơi cả 2 thuốc) và hẹn xét nghiệm lại ALT/lipid sau 8 tuần thay vì định kỳ hàng năm!
  3. **Lỗ đen #3 — Bệnh nhân không dung nạp Statin KHÔNG bị gút đang dùng `Bempedoic acid + Ezetimibe` nhưng LDL-C vẫn trên đích (`rules.outpatient.ts` dòng 1680, 1729, 1800):**
     - `bempedoic_acid` trả `null` khi đã có thuốc (dòng 1680), `ezetimibe` chặn khi đã có thuốc (dòng 1729), còn `pcsk9_when_gout` (dòng 1800) lại khóa cứng điều kiện `if (!isGoutOrHighUrate) return false;`!
     - Thực nghiệm **Ca 3d-1** (`statinIntolerance: true, gout: false, ascvd: true, ldl: 2.1 > 1.4, currentMeds: [bempedoic_acid 180 mg, ezetimibe 10 mg]`): Engine xuất **0 khuyến cáo thuốc** — làm mất cả 2 thuốc nền VÀ bỏ sót hoàn toàn nâng bậc PCSK9i (Class I-A ESC 2025 / COR 1 ACC 2026)!
  4. **Lỗ đen #4 — Bệnh nhân nguy cơ Trung bình/Thấp đang dùng Statin nhưng chưa đạt đích (`rules.outpatient.ts` dòng 1227 & 1316):**
     - `primary_moderate_low` chặn khi `activeStatin !== null`, còn `step1b`/`step2` chỉ nhận `high`/`very_high`/`extreme`.
     - Thực nghiệm **Ca B3** (`age: 52, SCORE2 = 4.6% moderate, currentMeds: [atorvastatin 10 mg], ldl: 3.0 > 2.6`): Engine xuất **0 khuyến cáo thuốc** (rơi mất statin đang dùng, không hướng dẫn chỉnh liều).
  5. **Lỗ đen #5 — Bệnh nhân Nguy cơ Cao không FH (`LDL < 4.9`) đang dùng `Statin cường độ cao + Ezetimibe` chưa đạt đích `< 1.8 mmol/L` (`rules.outpatient.ts` dòng 76–84):**
     - Thực nghiệm **Ca 3b** (`ckd: true, egfr: 42, currentMeds: [atorvastatin 40 mg, ezetimibe 10 mg], ldl: 2.2 > 1.8`): Engine xuất **0 khuyến cáo thuốc** (rơi cả 2 thuốc nền và bỏ sót Bempedoic acid Class IIa-C của ESC 2025 Rec Table 2).
  6. **Lỗ đen #6 — Bệnh nhân ngoại trú đang dùng bộ ba chưa đạt đích hoặc nội viện ACS dùng Ezetimibe đơn trị / bộ ba trước nhập viện (`rules.inpatient.ts` dòng 31):**
     - Thực nghiệm **Ca 3c** (`ascvd: true, currentMeds: [atorva 80, eze 10, evolocumab 140], ldl: 1.7`): Engine xuất **0 khuyến cáo thuốc** (rơi cả 3 thuốc, bỏ sót Bempedoic acid Class IIa-C). Ở nội viện ACS, `isPriorLltAcsEligible` đòi `activeStatin !== null`, nên **Ca 3e** (`acuteAcsWithin24h: true, currentMeds: [ezetimibe 10 mg], ldl: 2.4`) làm rơi `ezetimibe`, và **Ca 3f** (ACS đang dùng bộ ba, `ldl: 1.8`) làm rơi `ezetimibe` và `evolocumab`.
- **Đề xuất khắc phục:**
  1. Thiết kế bộ quy tắc duy trì nguyên tử (`CONTINUE`) cho mọi hoạt chất hạ lipid hợp lệ đang có trong `currentMeds` khi đạt đích (kể cả không dung nạp statin) và cập nhật `isStableAtGoal` trong `retest_schedule` dùng `getActiveLipidMeds(ctx).length > 0`.
  2. Gỡ khóa `isGoutOrHighUrate` cho quy tắc nâng bậc PCSK9i ở bệnh nhân không dung nạp statin chưa đạt đích trên nền `ezetimibe` (± `bempedoic_acid`), kèm `CONTINUE` các thuốc non-statin nền.
  3. Bổ sung nhánh xử trí `CONTINUE` + tối ưu hóa cho nhóm `moderate`/`low` đã dùng statin, nhóm `high` không FH hoặc `very_high` trên bộ ba chưa đạt đích (`CONSIDER bempedoic_acid` theo ESC 2025 Class IIa-C), và duy trì đầy đủ `ezetimibe`/`PCSK9i` hợp lệ trong ACS nội viện.

---

### [LIPID-R2-R1-03] `MAJOR` — Phân tầng sai nghiêm trọng nguy cơ Đái tháo đường (`dmDurationYears < 10` hạ nhầm bệnh nhân ĐTĐ ≥ 50 tuổi hoặc có kèm yếu tố nguy cơ xuống tầng Trung bình `< 2.6 mmol/L`, làm mất hoàn toàn chỉ định Statin Class I-A)
- **Phân loại (`itemType`):** `rule`
- **Đối tượng (`itemId`):** `determineEscRiskTier` (`src/engine/calculators/ldlTarget.ts`) | `evaluateLipidRiskAndTarget` (`src/modules/lipid/helpers.ts`)
- **Bằng chứng Guideline gốc:**
  - **ESC 2025 Focused Update** (`ESC_2025_dyslipidaemias.pdf`, Table 3 p. 6 / trang in p. 4364 & Figure 1 p. 8 / trang in p. 4366):
    - **High risk:** *"Patients with DM without target organ damage, with DM duration ≥10 years or another additional risk factor"*.
    - **Moderate risk:** Chỉ áp dụng khi thỏa mãn đồng thời người trẻ, thời gian mắc `< 10 năm` và không có bất kỳ yếu tố nguy cơ nào khác: *"Young patients (T1DM <35 years; T2DM <50 years) with DM duration <10 years, without other risk factors"*.
  - **ESC/EAS 2019** (`ESC_2019_dyslipidaemias_base.pdf`, p. 45 / trang in p. 155): *"In patients with T2DM at high risk, an LDL-C reduction of ≥50% from baseline and an LDL-C goal of <1.8 mmol/L (<70 mg/dL) are recommended."* (**Class I, Level A**).
  - **Quyết định 5481/QĐ-BYT 2020** (Phần 4, Mục 6.2, p. 35–36) & **ACC/AHA 2026** (Section 4.2.5, p. 54, **COR 1, LOE A**): Khuyến cáo khởi trị statin cho mọi bệnh nhân ĐTĐ tuổi 40–75 bất kể LDL-C nền.
- **Đối chiếu mã nguồn:**
  - `src/engine/calculators/ldlTarget.ts` dòng 136 chỉ kiểm tra `(input.hasDiabetes && (input.dmDurationYears === undefined || input.dmDurationYears >= 10))` cho tầng `high` — **bỏ quên hoàn toàn vế `or another additional risk factor` và giới hạn tuổi `< 50` (T2DM) / `< 35` (T1DM)**!
  - Nghiêm trọng hơn, ở dòng 147 `(input.hasDiabetes && input.dmDurationYears && input.dmDurationYears < 10)`, khi bác sĩ nhập `dmDurationYears = 0` (ĐTĐ mới phát hiện), toán tử `&&` của JavaScript đánh giá `0` là `falsy` và rơi thẳng xuống dòng 159 `return 'moderate'` (do `helpers.ts` dòng 279 đã tắt tính SCORE2 khi `hasDm === true`).
- **Bằng chứng thực nghiệm `evaluate()`:**
  - **Ca B1** (`age: 64, sex: 'male', conditions: { dm: true, htn: true }, dmDurationYears: 5, ldl: 2.3 mmol/L` — bệnh nhân 64 tuổi kèm THA, tức có tới 2 yếu tố nguy cơ chính!): Engine xếp `tier = moderate, target = 2.6 mmol/L, isTargetAchieved = true` → **xuất 0 khuyến cáo thuốc statin** (`r2_r1_engine_output_batch2.txt` dòng 2–5)!
  - **Ca 1b** (`age: 64, sex: 'male', conditions: { dm: true, htn: true }, dmDurationYears: 0, ldl: 2.5 mmol/L`): **xuất 0 khuyến cáo thuốc statin** (`r2_r1_engine_output.txt` dòng 12–18)!
  - **Ca B2** (như B1 nhưng `ldl: 3.0 mmol/L`): Chỉ xuất `[CONSIDER] atorvastatin 10–20 mg` (`< 2.6`) thay vì `[START] atorvastatin 40–80 mg` (`< 1.8` & giảm ≥ 50%, Class I-A).
- **Đề xuất khắc phục:** Truyền `age` vào `LdlTargetInput` và sửa `determineEscRiskTier`: chỉ xếp ĐTĐ vào `moderate` khi bệnh nhân trẻ (`age < 50` với T2DM, `< 35` với T1DM), `dmDurationYears !== undefined && dmDurationYears < 10`, VÀ không có yếu tố nguy cơ chính nào khác ngoài ĐTĐ (`majorRiskFactorsCount === 0 && !smoker && !hasHypertension`); mọi trường hợp ĐTĐ còn lại chưa thuộc `very_high` đều phải xếp vào `high` (`< 1.8 mmol/L`).

---

### [LIPID-R2-R1-04] `MAJOR` — Bỏ sót hoàn toàn khuyến cáo Class I (ESC 2025) / COR 1 (ACC/AHA 2026) khởi trị Statin dự phòng tiên phát cho người nhiễm HIV ≥ 40 tuổi bất kể điểm nguy cơ tim mạch và mức LDL-C (thử nghiệm REPRIEVE)
- **Phân loại (`itemType`):** `missing`
- **Đối tượng (`itemId`):** `lipid.hiv.primary_prevention`
- **Bằng chứng Guideline gốc:**
  - **ESC 2025 Focused Update** (`ESC_2025_dyslipidaemias.pdf`, Recommendation Table 6, PDF p. 15 / trang in p. 4373):
    > *"Statin therapy is recommended for people in primary prevention aged ≥40 years with HIV, irrespective of estimated cardiovascular risk and LDL-C levels, to reduce the risk of cardiovascular events; the choice of statin should be based on potential drug interactions."* (**Class I, Level B**)
  - **ACC/AHA 2026 Dyslipidemia Guideline** (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Section 4.2.8.9, PDF p. 80 / trang in p. 2703):
    > *"In people living with HIV aged 40 to 75 years on stable combination antiretroviral therapy, statin therapy is recommended to reduce risk of a first ASCVD event and reduce the rate of coronary atherosclerosis progression."* (**COR 1, LOE B-R** — Pitavastatin 4 mg/ngày như thử nghiệm REPRIEVE, hoặc Atorvastatin/Rosuvastatin chỉnh theo tương tác thuốc ARV).
- **Đối chiếu mã nguồn & Thực nghiệm `evaluate()`:**
  - Không có cờ `hiv` trong `src/modules/lipid/inputs.ts`, `helpers.ts` hay `rules.outpatient.ts`.
  - **Ca 2** (`r2_r1_engine_output.txt` dòng 32–38: `age: 48, sex: 'male', conditions: { hiv: true }, sbp: 120, tc: 4.5, hdl: 1.3, ldl: 2.4 mmol/L`): Engine tính `SCORE2 = 2.2% (moderate)`, báo đạt mục tiêu `< 2.6 mmol/L` và xuất **0 khuyến cáo khởi trị statin**.
- **Đề xuất khắc phục:** Bổ sung cờ `hiv` vào `inputs.ts` / `helpers.ts`, thêm trích dẫn nguyên văn từ ESC 2025 Rec Table 6 (p. 15) & ACC/AHA 2026 Section 4.2.8.9 (p. 80), và tạo quy tắc `lipid.hiv.primary_prevention` phát `START` Pitavastatin 4 mg/ngày (hoặc Rosuvastatin/Atorvastatin kiểm soát tương tác Ritonavir/Cobicistat) cho bệnh nhân HIV `age >= 40` chưa có chỉ định statin bậc cao hơn.

---

### [LIPID-R2-R1-05] `MAJOR` — Áp dụng sai phạm vi thuật toán SCORE2/SCORE2-OP (chạy cả trên lipid ĐANG ĐIỀU TRỊ và trên bệnh nhân CKD) đồng thời bỏ sót tiêu chí Nguy cơ Cao `HA ≥ 180/110 mmHg` của ESC 2025 Table 3
- **Phân loại (`itemType`):** `rule`
- **Đối tượng (`itemId`):** `evaluateLipidRiskAndTarget` (`src/modules/lipid/helpers.ts`) | `determineEscRiskTier` (`src/engine/calculators/ldlTarget.ts`)
- **Bằng chứng Guideline gốc:**
  - **ESC 2025 Focused Update** (`ESC_2025_dyslipidaemias.pdf`, Section 3, PDF pp. 8–9 / trang in pp. 4366–4367):
    > *"these algorithms should not be used to estimate risk among persons with existing ASCVD or among persons currently on lipid-lowering therapy, and they should not be used to 're-assess' risk using lipid measurements obtained after initiating Guideline-recommended lipid-lowering therapy."*
  - **ESC 2025 Recommendation Table 1** (PDF p. 9 / trang in p. 4367): *"SCORE2 is recommended in apparently healthy people aged <70 years without established ASCVD, DM, CKD, genetic/rare lipid or BP disorders..."* (**Class I, Level B**).
  - **ESC 2025 Table 3** (PDF p. 6 / trang in p. 4364): Xếp vào **High risk**: *"Markedly elevated single risk factors, in particular TC >8 mmol/L (>310 mg/dL), LDL-C >4.9 mmol/L (>190 mg/dL), or BP ≥180/110 mmHg"*.
- **Đối chiếu mã nguồn & Thực nghiệm `evaluate()`:**
  - Tại `src/modules/lipid/helpers.ts` dòng 275–306, `computeScore2()` được gọi tự động mà không loại trừ người đang dùng thuốc hạ lipid (`getActiveLipidMeds(ctx).length > 0`), không loại trừ CKD (`ckd` / `egfr < 60`), và cả `helpers.ts` lẫn `ldlTarget.ts` dòng 132–140 đều bỏ sót `sbp >= 180 || dbp >= 110`.
  - **Ca B4** (`56 tuổi, nam, hút thuốc, đang dùng atorvastatin 20 mg, TC sau điều trị = 4.0, HDL = 1.3, LDL = 2.2`): `SCORE2` tính trên TC đã điều trị ra `8.4% (moderate)` (thay vì `≥ 11% high` trước điều trị), báo sai `Đã đạt mục tiêu LDL-C (< 2.6 mmol/L)`!
  - **Ca 5c** (`75 tuổi, nam, CKD trung bình eGFR = 45 [ESC High risk < 1.8], LDL = 1.6`): `SCORE2-OP` tự chạy ra `25%`, đẩy nhầm CKD trung bình lên `very_high` (`< 1.4`) và ra lệnh `[START] atorvastatin 40–80 mg`!
  - **Ca 5b** (`45 tuổi, nữ, HA 185/112 mmHg [ESC High risk < 1.8], LDL = 2.4`): Bỏ sót tiêu chí `BP ≥ 180/110 mmHg`, xếp nhầm `moderate` (`SCORE2 = 3.3%`) và xuất **0 khuyến cáo hạ lipid**.
- **Đề xuất khắc phục:** Chặn tính tự động `computeScore2` khi `getActiveLipidMeds(ctx).length > 0`, khi có `ckd` hoặc `egfr < 60`, hoặc khi có yếu tố nguy cơ đơn độc tăng rất cao (`tc > 8.0`, `ldl >= 4.9`, `sbp >= 180`, `dbp >= 110`); đồng thời thêm `sbp >= 180 || dbp >= 110` vào nhánh `high` của `ldlTarget.ts`.

---

### [LIPID-R2-R1-06] `MAJOR` — Bỏ sót khuyến cáo Class I-B khởi trị Statin đầu tay cho bệnh nhân nguy cơ cao có Tăng Triglycerid máu `TG > 2.3 mmol/L` (`> 200 mg/dL`) khi LDL-C đạt ngưỡng đơn lẻ; biến ngưỡng `lipid.tg.elevated_cv_risk` bị mồ côi
- **Phân loại (`itemType`):** `missing`
- **Đối tượng (`itemId`):** `lipid.tg.statin_first_high_risk` (`kb/thresholds/lipid.json`: `lipid.tg.elevated_cv_risk`)
- **Bằng chứng Guideline gốc:**
  - **ESC/EAS 2019** (`ESC_2019_dyslipidaemias_base.pdf`, Section 9.1.2 Recommendations, PDF p. 38 / trang in p. 148), được giữ nguyên tại **ESC 2025 Focused Update** (Section 7, PDF p. 13 / trang in p. 4371):
    > *"Statin treatment is recommended as the first drug of choice to reduce CVD risk in high-risk individuals with hypertriglyceridaemia [TG levels >2.3 mmol/L (>200 mg/dL)]."* (**Class I, Level B**)
- **Đối chiếu mã nguồn & Thực nghiệm `evaluate()`:**
  - `kb/thresholds/lipid.json` dòng 483–491 định nghĩa `lipid.tg.elevated_cv_risk = 2.3 mmol/L` gắn trích dẫn `esc.lipid.2019.htg_statin_first`, nhưng không một quy tắc nào trong `src/modules/lipid/` sử dụng biến này!
  - Ở bệnh nhân tăng TG (2.4–5.5 mmol/L), hạt LDL nhỏ đậm đặc nghèo cholesterol khiến LDL-C đo/tính thường thấp giả tạo (`<= 1.8 mmol/L`) dù gánh nặng hạt VLDL/remnant sinh xơ vữa rất lớn. Thực nghiệm **Ca 8** (`r2_r1_engine_output.txt` dòng 184–190: `age: 62, ckd: true, egfr: 45` [High risk `< 1.8`], `ldl: 1.7 mmol/L, tg: 3.8 mmol/L, currentMeds: []`): Engine xuất **0 khuyến cáo thuốc**, bỏ lọt hoàn toàn chỉ định Statin đầu tay Class I-B!
- **Đề xuất khắc phục:** Bổ sung quy tắc `lipid.tg.statin_first_high_risk` sử dụng `thFor('tg', 'lipid.tg.elevated_cv_risk')` (`2.3 mmol/L`) và `esc.lipid.2019.htg_statin_first` để khuyến cáo `START` Statin đầu tay cho bệnh nhân nguy cơ cao/rất cao chưa dùng statin có `TG > 2.3 mmol/L` ngay cả khi LDL-C đơn lẻ `<= target`.

---

### [LIPID-R2-R1-07] `MAJOR` — Trường nhập liệu lâm sàng "chết" (`nonHdl`, `apob`): UI thu thập Non-HDL-C và ApoB, KB định nghĩa đủ 6 ngưỡng đích phụ, nhưng Rule Engine hoàn toàn bỏ qua
- **Phân loại (`itemType`):** `rule`
- **Đối tượng (`itemId`):** `customInputs.nonHdl` & `customInputs.apob` (`src/modules/lipid/inputs.ts`, `helpers.ts`, `rules.outpatient.ts`)
- **Bằng chứng Guideline gốc:**
  - **ESC/EAS 2019** (`ESC_2019_dyslipidaemias_base.pdf`, Section 5.4 Recommendations p. 21 / trang in p. 131 & Table 7 p. 23 / trang in p. 133): Đánh giá Non-HDL-C (**Class I, Level C**) và ApoB (**Class I, Level C**) ở người tăng TG, ĐTĐ, béo phì hoặc LDL-C rất thấp, với đích phụ Table 7: Non-HDL-C `< 2.2 / 2.6 / 3.4 mmol/L`; ApoB `< 65 / 80 / 100 mg/dL`.
  - **ACC/AHA 2026** (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, Section 4.2.6 p. 62 / trang in p. 2685 & Section 4.2.9 Rec 2 p. 83 / trang in p. 2706): Đưa Non-HDL-C thành **mục tiêu đồng chính (co-primary goal) COR 1, LOE A** (`LDL-C < 55 mg/dL AND non-HDL-C < 85 mg/dL [2.2 mmol/L]` ở ASCVD nguy cơ rất cao) và khuyến cáo **COR 1, LOE B-R** tăng cường thuốc hạ lipid khi `non-HDL-C ≥ 85 mg/dL` ở bệnh nhân có `TG 150–999 mg/dL`.
- **Đối chiếu mã nguồn & Thực nghiệm `evaluate()`:**
  - `inputs.ts` dòng 59–66 & 77–84 cho phép nhập `nonHdl` và `apob`; `kb/thresholds/lipid.json` dòng 64–122 định nghĩa đủ 6 ngưỡng `lipid.target.non_hdl_*` và `lipid.target.apob_*`. Nhưng toàn bộ `helpers.ts` và `rules.outpatient.ts` không hề gọi `need(ctx, 'nonHdl')` hay `need(ctx, 'apob')` (và cũng không tự tính `nonHdl = tc - hdl`).
  - Thực nghiệm **Ca 6** (`r2_r1_engine_output.txt` dòng 151–162: `ascvd: true, dm: true, currentMeds: [atorvastatin 40 mg], tc: 4.0, hdl: 0.9, ldl: 1.3, tg: 3.2, customInputs: { nonHdl: 2.9, apob: 98 }`): Dù `nonHdl = 2.9 >= 2.2 mmol/L` và `apob = 98 >= 65 mg/dL`, Engine vẫn tuyên bố `Đã đạt mục tiêu LDL-C (< 1.4 mmol/L)` và hẹn theo dõi hàng năm!
- **Đề xuất khắc phục:** Kết nối `nonHdl` (nhập tay hoặc tự tính `tc - hdl`) và `apob` với 6 ngưỡng mục tiêu phụ trong `helpers.ts` và `rules.outpatient.ts` để cảnh báo chưa đạt mục tiêu hạt sinh xơ vữa (Non-HDL-C / ApoB) và gợi ý tối ưu hóa liều statin / phối hợp Ezetimibe.

---

### [LIPID-R2-R1-08] `MAJOR` — Đánh đồng Dự phòng Tiên phát với Dự phòng Thứ phát, phát lệnh `START` (Class I-A) quá mức so với mức khuyến cáo thực tế (Class IIa / Class IIb) của ESC 2025 và ESC/EAS 2019
- **Phân loại (`itemType`):** `rule`
- **Đối tượng (`itemId`):** `lipid.step1.statin_high_or_very_high` | `lipid.step3.add_pcsk9i_on_dual_therapy`
- **Bằng chứng Guideline gốc:**
  1. **Khởi trị thuốc trong dự phòng tiên phát — ESC 2025 Table 4** (PDF p. 7 / trang in p. 4365) & **Rec Table 1** (p. 9 / trang in p. 4367): Ở dự phòng tiên phát nguy cơ rất cao (SCORE2 ≥ 20%), chỉ là **Class I-A** khi `LDL-C ≥ 1.8 mmol/L`, còn vùng `1.4 ≤ LDL-C < 1.8 mmol/L` là **Class IIa-A** (*"Lifestyle modification, consider adding drug if uncontrolled"*). Ở dự phòng tiên phát nguy cơ cao (SCORE2 10–<20%), chỉ là **Class I-A** khi `LDL-C ≥ 2.6 mmol/L`, còn vùng `1.8 ≤ LDL-C < 2.6 mmol/L` là **Class IIa-A**. Ở FH dự phòng tiên phát nguy cơ rất cao, mục tiêu `< 1.4 mmol/L` là **Class IIa, Level C** (ESC 2019 p. 22).
  2. **Phối hợp ức chế PCSK9 — ESC/EAS 2019 Section 8.1.2** (PDF p. 35 / trang in p. 145): PCSK9i chỉ đạt **Class I-A** ở *dự phòng thứ phát nguy cơ rất cao* và **Class I-C** ở *FH nguy cơ rất cao*. Ngược lại, ở *dự phòng tiên phát nguy cơ rất cao không có FH* (ví dụ ĐTĐ + tổn thương cơ quan đích, CKD G4, SCORE2 ≥ 20%), ESC 2019 chỉ xếp **Class IIb, Level C**:
     > *"For primary prevention, in patients at very-high risk, but without FH, if the LDL-C goal is not achieved on a maximum tolerated dose of a statin and ezetimibe, a combination with a PCSK9 inhibitor may be considered."* (**Class IIb, Level C**)
- **Đối chiếu mã nguồn:**
  - `lipid.step1.statin_high_or_very_high` (`rules.outpatient.ts` dòng 1046–1140) phát cứng `action: 'START'` và trích dẫn `esc.lipid.2019.target_very_high` (*"In secondary prevention..."*) cho cả bệnh nhân dự phòng tiên phát sát đích.
  - `isStep3Eligible` & `lipid.step3.add_pcsk9i_on_dual_therapy` (dòng 56–85 & 1525–1570) phát cứng `action: 'START'` Evolocumab kèm trích dẫn thứ phát `esc.lipid.2019.pcsk9_add_on_secondary` cho cả dự phòng tiên phát không FH (vốn chỉ là Class IIb-C!) và nhóm `high` có `LDL ≥ 4.9` không FH.
- **Đề xuất khắc phục:** Tách hành động `START` (Class I) vs `CONSIDER` (Class IIa / IIb) và gán đúng trích dẫn dự phòng tiên phát vs thứ phát ở cả Bước 1 lẫn Bước 3 theo đúng ESC 2025 Table 4 và ESC 2019 p. 35.

---

### [LIPID-R2-R1-09] `MAJOR` — Triển khai sai tiêu chuẩn Tầng Nguy cơ Cực cao (`Extreme Risk`, đích `< 1.0 mmol/L` / `< 40 mg/dL`, Class IIb) của ESC 2025 Figure 1
- **Phân loại (`itemType`):** `rule`
- **Đối tượng (`itemId`):** `evaluateLipidRiskAndTarget` (`src/modules/lipid/helpers.ts`) | `computeLdlTarget` (`src/engine/calculators/ldlTarget.ts`)
- **Bằng chứng Guideline gốc:**
  - **ESC 2025 Focused Update** (`ESC_2025_dyslipidaemias.pdf`, Figure 1 p. 8 / trang in p. 4366): Định nghĩa nhóm **Extreme** (`< 1.0 mmol/L` / `< 40 mg/dL`, **Class IIb**):
    > *"• Patients with ASCVD who experience recurrent vascular events while taking maximally tolerated statin-based therapy*
    > *• Patients with polyvascular (e.g. coronary and peripheral) arterial disease"*
  - **ESC/EAS 2019** (p. 22 / trang in p. 132): **Class IIb, Level B** (*"may be considered"*).
- **Đối chiếu mã nguồn & Thực nghiệm `evaluate()`:**
  - Trong `ldlTarget.ts` dòng 42–47, `COEFFICIENTS.targets.extreme` là **dead code** (`determineEscRiskTier` không bao giờ trả về `'extreme'`). Trong `helpers.ts` dòng 372, `isExtremeRecurrent` chỉ kiểm tra `hasAscvd && hasRecurrentAcs`.
  - **Ca 7a** (`conditions: { cad: true, pad: true }, currentMeds: [atorvastatin 80, ezetimibe 10], ldl: 1.25 mmol/L`): Có bệnh động mạch đa giường mạch (`cad` + `pad`) nhưng bị bỏ sót hoàn toàn tiêu chí Extreme Risk `< 1.0 mmol/L`.
  - **Ca 7b** (`conditions: { ascvd: true, recurrentAcsWithin2Years: true }, currentMeds: [], ldl: 1.2 mmol/L`): Bệnh nhân **chưa từng dùng statin** nhưng vẫn bị ép đích `< 1.0 mmol/L` và nhận lệnh `START` bắt buộc trái với điều kiện *"while taking maximally tolerated statin-based therapy"* và mức khuyến cáo **Class IIb-B**.
- **Đề xuất khắc phục:** Nhận diện bệnh đa giường mạch (`≥ 2` giường mạch trong nhóm mạch vành, mạch não, mạch ngoại biên), kiểm tra điều kiện đang dùng phác đồ nền có statin cho `recurrentAcsWithin2Years`, và phát hành động `CONSIDER` (Class IIb) khi LDL-C đã `< 1.4` nhưng còn trong khoảng `1.0–<1.4 mmol/L`.

---

### [LIPID-R2-R1-10] `MAJOR` — Trích dẫn sai ngữ nghĩa nghiêm trọng kiểu "chứa số `67 mg`" (`fda.rosuvastatin.fenofibrate_67mg`): Lấy bảng tương tác dược động học uống Fenofibrate `67 mg x 3 lần/ngày` (`201 mg/ngày`) trong nhãn Rosuvastatin làm bằng chứng "liều giảm 67 mg/ngày cho suy thận trung bình"
- **Phân loại (`itemType`):** `citation`
- **Đối tượng (`itemId`):** `fda.rosuvastatin.fenofibrate_67mg` (`kb/citations/lipid.json` dòng 773–782)
- **Đối chiếu nguyên văn PDF gốc vs KB:**
  - Trong `kb/citations/lipid.json` dòng 773–782:
    - `"sourceId": "fda_rosuvastatin"`, `"pdfPage": 22`, `"quote": "Fenofibrate 67 mg"`, `"quoteVi": "Chế phẩm Fenofibrate hàm lượng giảm liều 67 mg dùng ở bệnh nhân suy giảm chức năng thận mức độ trung bình."`
  - Mở nguyên văn `FDA_label_rosuvastatin.pdf` trang 22 (Section 7 Drug Interactions, Table 3 — *Effect of Co-Administered Drugs on Rosuvastatin Systemic Exposure*):
    > `"Fenofibrate 67 mg TID for 7 days | 10 mg | ↔ | 1.2 (1.1 to 1.3)"`
  - Đây là nghiên cứu dược động học dùng **Fenofibrate 67 mg × 3 lần/ngày (tổng liều 201 mg/ngày — tức liều TỐI ĐA, không phải liều giảm!)** trong 7 ngày trên người khỏe mạnh dùng kèm Rosuvastatin 10 mg, hoàn toàn không có một chữ nào nói về suy thận! Câu dịch `quoteVi` đã bị bịa đặt ngữ cảnh suy thận để lách kiểm tra khớp chuỗi số `67` của linter và đang phát tán vào 7 tệp (`kb/thresholds/lipid.json`, `kb/drugs/fenofibrate.json`, `rules.outpatient.ts`, `rules.inpatient.ts`, `matrix.ts`, `pathway.ts`).
- **Đề xuất khắc phục:** Xóa ngay `fda.rosuvastatin.fenofibrate_67mg`; nạp nguồn nhãn chính thức của Fenofibrate (`FDA_label_fenofibrate.pdf` / Dược thư Quốc gia VN) hoặc dùng trực tiếp khuyến cáo chỉnh liều theo eGFR của `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` Table 23 (PDF p. 85 / trang in p. 2708).

---

### [LIPID-R2-R1-11] `MAJOR` — Sai mục locator và đánh tráo ngữ cảnh bệnh lý trong QĐ 5481/QĐ-BYT (`byt.lipid.2020.fenofibrate_145_200`): Lấy khuyến cáo *Biến chứng võng mạc mắt ĐTĐ không cần tăng TG* (Phần 8, trang 50) gán nhãn giả `"Mục V.3: Điều trị rối loạn lipid máu"` để dẫn chứng cho *dự phòng viêm tụy cấp do tăng TG nặng*
- **Phân loại (`itemType`):** `citation`
- **Đối tượng (`itemId`):** `byt.lipid.2020.fenofibrate_145_200` (`kb/citations/lipid.json` dòng 861–870)
- **Đối chiếu nguyên văn PDF gốc vs KB:**
  - Trong `kb/citations/lipid.json` dòng 861–870: `"locator": "Mục V.3: Điều trị rối loạn lipid máu / p. 50"`, `"quote": "fenofibrate 145 -200 mg/ngày"`.
  - Mở nguyên văn `BYT_5481_2020_Dai_Thao_Duong_Tip_2.pdf`:
    - Mục lục (PDF p. 6): Không hề có `"Mục V.3"`. Chương Rối loạn lipid máu nằm ở **Phần 4, Mục 6.2 (trang 35–36)** và không chứa cụm `"145 -200 mg/ngày"`.
    - Trang 50 thực chất là **Phần 8: Phát hiện và điều trị một số biến chứng mạn tính — Mục 1.1: Biến chứng mắt ĐTĐ — Khuyến cáo mục 4**:
      > *"Nếu có bằng chứng biến chứng võng mạc không tăng sinh mức độ nhẹ, fenofibrate 145 -200 mg/ngày được chỉ định mà không cần có tăng triglycerides."*
  - Đem khuyến cáo điều trị bệnh võng mạc ĐTĐ không tăng TG gắn nhãn giả thành mục rối loạn lipid máu để làm trích dẫn đầu tiên cho phác đồ cấp cứu dự phòng viêm tụy cấp (`TG ≥ 5.6 mmol/L`) ở cả bệnh nhân không ĐTĐ là sai lệch nghiêm trọng về bằng chứng y khoa.
- **Đề xuất khắc phục:** Sửa đúng `locator` & `quoteVi` của trang 50 (Phần 8, Mục 1.1 — Biến chứng mắt ĐTĐ), đồng thời bổ sung trích dẫn đúng từ **Phần 4, Mục 6.2 (trang 35–36)** của QĐ 5481/QĐ-BYT kết hợp `ACC_AHA_2026_Dyslipidemia_Guideline.pdf` Table 5 (trang 30: Fenofibrate 40–200 mg/ngày) cho chỉ định tăng TG rất cao.

---

### [LIPID-R2-R1-12] `MINOR` — Tái diễn lỗi dùng chéo biến ngưỡng sai ngữ nghĩa hoạt chất/đại lượng (Semantic Threshold Misuse) và gán trích dẫn "chứa số `3.0`"
- **Phân loại (`itemType`):** `matrix`
- **Đối tượng (`itemId`):** `src/modules/lipid/matrix.ts` (dòng 372, 378) | `src/modules/lipid/rules.outpatient.ts` (dòng 845, 907, 949, 957, 1196, 1813) | `kb/thresholds/lipid.json` (dòng 584–593)
- **Bằng chứng chi tiết:**
  1. `matrix.ts` dòng 372 & 378 (`pravastatin.cells.g4` & `g5`): Lấy biến `ezeDose` (`lipid.dose.ezetimibe_standard` = 10 mg của **Ezetimibe**) ghép vào ghi chú liều khởi đầu của **Pravastatin** (`Khởi đầu ${ezeDose} mg/ngày`).
  2. `rules.outpatient.ts` dòng 1813 & 1824 (`lipid.intolerance.pcsk9_when_gout`): Lấy biến `lipid.reduction.statin_high_ezetimibe` (65% của **Statin cường độ cao + Ezetimibe**) để mô tả phác đồ **không có statin** (`Ezetimibe + Evolocumab`).
  3. `rules.outpatient.ts` dòng 845, 907, 949, 957: Lấy `lipid.dose.rosuva_severe_ckd_max` (trần 10 mg của suy thận nặng eGFR < 30) làm cận trên liều Rosuvastatin trung bình (`5–10 mg/ngày`) trong luật tương tác CYP3A4 ngay cả ở người chức năng thận bình thường, kéo theo trích dẫn suy thận `fda.rosuvastatin.renal_impairment`.
  4. `kb/thresholds/lipid.json` dòng 584–593 (`lipid.combo.upfront_ldl_threshold = 3.0`): Gán trích dẫn `esc.lipid.2019.target_low` (đích `< 3.0 mmol/L` cho nhóm **nguy cơ thấp**!) chỉ vì chứa số `3.0`, cộng với trích dẫn nội viện `esc.lipid.2025.acs_naive_combination` (vẫn còn sót ở cả dòng 1196 của `rules.outpatient.ts`).
- **Đề xuất khắc phục:** Định nghĩa đúng các biến ngưỡng độc lập (`lipid.dose.pravastatin_ckd_start`, `lipid.dose.rosuva_moderate_max`, `lipid.reduction.pcsk9_ezetimibe`), sửa trích dẫn của `lipid.combo.upfront_ldl_threshold` và gỡ `esc.lipid.2025.acs_naive_combination` khỏi dòng 1196 của `rules.outpatient.ts`.

---

### [LIPID-R2-R1-13] `MINOR` — Gán nhầm trích dẫn giữa các bối cảnh lâm sàng trong `acs_early_lipid_panel`, `acc.lipid.2026.ezetimibe_outpatient_addon` và `pravastatin.json`
- **Phân loại (`itemType`):** `citation`
- **Đối tượng (`itemId`):** `lipid.inpatient.acs_early_lipid_panel` | `acc.lipid.2026.ezetimibe_outpatient_addon` | `kb/drugs/pravastatin.json`
- **Bằng chứng chi tiết:**
  1. `src/modules/lipid/rules.inpatient.ts` dòng 48 & 58: Đọc `lipid.monitoring.alt_recheck_max_weeks` và gắn trích dẫn ngừng thuốc do tăng men gan `esc.lipid.2019.monitoring_alt_elevation` (ESC 2019 p. 53) cho câu kiểm tra lại **LDL-C sau 4–6 tuần ACS**, trong khi ESC 2019 p. 47 (trang in p. 157) có khuyến cáo chuyên biệt **Class IIa-C**: *"Lipid levels should be re-evaluated 4–6 weeks after ACS..."* (và KB dòng 872 đã có sẵn `esc.lipid.2019.recheck_4_to_6_weeks`).
  2. `kb/citations/lipid.json` dòng 850–859 (`acc.lipid.2026.ezetimibe_outpatient_addon`): Trích câu văn ở trang 6 của ACC/AHA 2026 dành cho **dự phòng tiên phát** (`COR 2a`, đích `< 70 mg/dL`) nhưng lại đem gắn cho **ASCVD dự phòng thứ phát nguy cơ rất cao** (nơi ACC/AHA 2026 Section 4.2.6 p. 62 xếp **COR 1, LOE A** cho đích `< 55 mg/dL`).
  3. `kb/drugs/pravastatin.json` dòng 555: Mục tương tác Pravastatin + Bempedoic acid lại gắn citation `fda.bempedoic.simvastatin_avoid_gt_20mg` (chỉ có chữ `"simvastatin greater than 20 mg"`, thiếu vế `"or pravastatin greater than 40 mg"` ở trang 1 `FDA_label_bempedoic_acid.pdf`).
- **Đề xuất khắc phục:** Thay bằng trích dẫn đúng ngữ cảnh ở cả 3 vị trí trên.

---

### [LIPID-R2-R1-14] `MINOR` — Sai lệch mức khuyến cáo/bằng chứng (`COR`/`LOE`) trong văn bản tầm soát Lp(a) và trong siêu dữ liệu `kb/citations/lipid.json`
- **Phân loại (`itemType`):** `citation`
- **Đối tượng (`itemId`):** `lipid.lpa.lifetime_screening` (`rules.outpatient.ts` dòng 2130) | `kb/citations/lipid.json`
- **Bằng chứng chi tiết:**
  1. `rules.outpatient.ts` dòng 2130 ghi *"ESC 2025 (Class IIa-B) khuyến cáo xét nghiệm Lp(a) ít nhất một lần ở mọi người trưởng thành"*, trộn lẫn mức **Class IIa, Level C** của khuyến cáo đo 1 lần trong đời (ESC 2019 p. 21 & ESC 2025 p. 12) với mức **Class IIa, Level B** của ngưỡng tăng nguy cơ `> 50 mg/dL` (ESC 2025 Rec Table 4 p. 12); đồng thời chưa nêu `profileDiff.US` rằng **ACC/AHA 2026 Section 3.4 (p. 4 / p. 25)** đã nâng đo Lp(a) lên **COR 1**.
  2. Trong `kb/citations/lipid.json`, một số câu văn bàn luận không phân hạng bị tự gán COR/LOE (`esc.lipid.2019.htg_fenofibrate_pancreatitis` p. 42 gán `"I"/"C"`; `acc.lipid.2026.asian_start_dose` p. 27 gán `"IIa"/"B"`), 2 trích dẫn ACC 2026 dùng mã `"cor": "2"` không chuẩn (thay vì `"2a"`/`"2b"`), và 26 trích dẫn nhãn thuốc FDA gán cứng `"cor": "1", "loe": "A"`.
- **Đề xuất khắc phục:** Hiệu chỉnh câu `rationale` + bổ sung `profileDiff.US` ở `lipid.lpa.lifetime_screening`, và chuẩn hóa trường `cor`/`loe` trong `kb/citations/lipid.json` phản ánh trung thực tài liệu gốc.

---

### [LIPID-R2-R1-15] `MINOR` — Thiếu hỗ trợ đơn vị mol (`nmol/L`) cho `Lp(a)` và hiển thị cứng chuỗi `mmol/L` (kèm số thập phân lẻ dài) ngay cả khi người dùng chọn hệ đơn vị `mg/dL`
- **Phân loại (`itemType`):** `ui`
- **Đối tượng (`itemId`):** `src/modules/lipid/inputs.ts` (`customInputs.lpa`) | `src/modules/lipid/rules.outpatient.ts` & `rules.inpatient.ts`
- **Bằng chứng Guideline & Thực nghiệm `evaluate()`:**
  - **ESC 2025** (Section 6 & Rec Table 4, PDF p. 12): *"Although measurement in molar units (nmol/L) is preferred, mass units (mg/dL) can be used for clinical purpose"*, ngưỡng `> 105 nmol/L` (`> 50 mg/dL`). **ACC/AHA 2026** (Section 4.2.10, p. 90, COR 1): `≥ 125 nmol/L` (`≥ 50 mg/dL`). Hiện `inputs.ts` dòng 68–75 chỉ cho nhập `mg/dL`, dễ gây báo động giả nếu phòng xét nghiệm trả `nmol/L` (ví dụ `90 nmol/L` bình thường bị hiểu nhầm thành `90 mg/dL > 50`).
  - Thực nghiệm **Ca B8** (`settings.units.lipid = 'mg_dL', labs: { ldl: 110 }` — tức `110 mg/dL`): Engine đổi sang `2.8445823635893456 mmol/L` rồi xuất cứng `title = "Khởi trị Statin cường độ cao hướng tới đích LDL-C < 1.4 mmol/L"` và in số thập phân dài ngoằng theo `mmol/L` trong `rationale` thay vì `< 55 mg/dL` và `110 mg/dL`!
- **Đề xuất khắc phục:** Hỗ trợ chọn đơn vị `nmol/L` / `mg/dL` cho `Lp(a)` và viết helper định dạng nồng độ lipid theo `ctx.settings.units.lipid` (làm tròn gọn 1–2 chữ số thập phân ở `mmol/L` hoặc số nguyên ở `mg/dL`).

---

### [LIPID-R2-R1-16] `SUGGESTION` — Nâng cấp phân nhánh hành vi thực sự cho `profile: 'US'` theo những thay đổi bước ngoặt của ACC/AHA 2026
- **Phân loại (`itemType`):** `rule`
- **Đối tượng (`itemId`):** `profile: 'US'` (`ACC/AHA 2026` PREVENT-ASCVD, CAC score, Icosapent ethyl COR 2b)
- **Cơ sở Guideline gốc (`ACC_AHA_2026_Dyslipidemia_Guideline.pdf`):**
  1. **Khôi phục đích số học phân tầng trong ASCVD** (Section 4.2.6, p. 62): ASCVD nguy cơ rất cao hướng đích kép `LDL-C < 55 mg/dL` + `non-HDL-C < 85 mg/dL` (**COR 1, LOE A**), còn ASCVD chưa rất cao hướng đích `LDL-C < 70 mg/dL` + `non-HDL-C < 100 mg/dL` (**COR 1, LOE A**).
  2. **Xơ vữa động mạch dưới lâm sàng theo điểm CAC** (Section 4.2.7, p. 67): `CAC 100–999 AU` khuyến cáo **COR 1, LOE B-R** đích `< 70 mg/dL`; `CAC ≥ 1000 AU` khuyến cáo **COR 1, LOE B-NR** đích `< 55 mg/dL`.
  3. **Mô hình PREVENT-ASCVD 10 năm** (`< 3%`, `3–<5%`, `5–<10%`, `≥ 10%`, p. 5–6).
  4. **Hạ bậc Icosapent ethyl xuống COR 2b, LOE B-R** (Section 4.2.9 Rec 4, p. 83 & p. 90): chỉ cân nhắc ở ASCVD **tuổi ≥ 50**, đã đạt **`LDL-C < 100 mg/dL`** trên statin tối đa và có `TG 150–499 mg/dL` (cần bổ sung ngay `profileDiff.US` vào `lipid.tg.residual_icosapent_ethyl`).

---

## 4. Kết Luận Thẩm Định Vòng 2 (Vai Trò R1)

Module `lipid` đã có bước tiến lớn sau Vòng 1 (xây dựng kiến trúc bậc thang 4 bước, đích kép giảm ≥ 50%, nhận diện FH, xử trí gút/tăng men gan/tiêu cơ vân/thai kỳ). Tuy nhiên, kiểm định độc lập đối chiếu nguyên văn PDF và thực thi trực tiếp `evaluate()` phát hiện **2 lỗi CRITICAL** có nguy cơ gây hại trực tiếp cho người bệnh (kê trùng lặp 2 statin ở bệnh nhân lọc máu chu kỳ; làm biến mất các thuốc phối hợp Ezetimibe/PCSK9i/Bempedoic acid khỏi kế hoạch duy trì và bỏ trống nhiều nhánh leo thang) cùng **9 lỗi MAJOR** sai lệch với khuyến cáo Class I / COR 1 của ESC 2025, ESC/EAS 2019, ESC 2026 CVD-CKD, ACC/AHA 2026 và QĐ 5481/QĐ-BYT.

Kết luận cuối file theo `docs/REVIEW_PROTOCOL.md`: **FAIL** (2 critical, 9 major, 4 minor, 1 suggestion).

FAIL
