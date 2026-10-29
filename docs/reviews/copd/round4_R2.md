# BÁO CÁO THẨM ĐỊNH DƯỢC LÂM SÀNG & AN TOÀN THUỐC ĐỘC LẬP – VÒNG 4 (ROUND 4 – ROLE R2)

- **Phân hệ thẩm định**: Bệnh phổi tắc nghẽn mạn tính (`copd`) — [src/modules/copd/](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/), [src/engine/](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/), [kb/drugs/](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/), [kb/interactions/](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/), [kb/citations/copd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json), [kb/thresholds/copd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/copd.json)
- **Vai trò phản biện**: **R2 – Dược sĩ Lâm sàng & Kiểm toán An toàn Thuốc Độc lập** (*Clinical Pharmacist & Medication Safety Auditor*)
- **Vòng thẩm định**: Round 4 (Độc lập tuyệt đối; không tham khảo bất kỳ tài liệu `round4_R1*` hoặc `round4_R3*` nào)
- **Tài liệu chuẩn đối chiếu nguyên văn (Offline PDF 2026 & Nhãn FDA)**:
  1. **GOLD 2026 Report** (`GOLD_2026_Report.pdf` — *Global Strategy for Prevention, Diagnosis and Management of COPD, 2026 Report*)
  2. **Bộ Y tế Việt Nam – Quyết định 2131/QĐ-BYT ngày 14/07/2026** (`BYT_2131_COPD_2026.pdf` — *Hướng dẫn chẩn đoán và điều trị Bệnh phổi tắc nghẽn mạn tính*, đặc biệt Phụ lục 1 tr. 68–70, Phụ lục 10 tr. 102–104 và Phụ lục 11 tr. 107–120)
  3. **GINA 2026 Strategy** (`GINA_2026_Strategy.pdf` — *Global Strategy for Asthma Management and Prevention 2026*)
  4. **Nhãn thuốc gốc FDA (Prescribing Information)**: `FDA_label_roflumilast.pdf` (Daliresp), `FDA_label_azithromycin.pdf` (Zithromax), `FDA_label_dupilumab.pdf` (Dupixent), `FDA_label_carvedilol.pdf` (Coreg)
- **Phương pháp kiểm định**:
  - Đọc kiểm toán tĩnh 100% mã nguồn phân hệ `copd` (35/35 tệp `.ts`), bộ máy an toàn `src/engine/safety/**` (11/11 tệp), bộ gộp đa bệnh lý `src/engine/{evaluate.ts, merge.ts, mergeConflictGroups.ts, mergeClassResolver.ts, note.ts}`, giao diện `src/ui/{AppShell.tsx, PatientForm.tsx, PlanRow.tsx}` và toàn bộ dược thư `kb/drugs/*.json`, `kb/interactions/*.json`, `kb/citations/copd.json`.
  - Thực thi kiểm thử đối kháng runtime trực tiếp qua hàm `evaluate()` bằng Vitest trên **45+ kịch bản lâm sàng phức tạp** (đa bệnh lý `['copd', 'hf']`, `['copd', 'asthma']`, suy thận giai đoạn 3b–5/lọc máu, xơ gan Child-Pugh A/B/C, thai kỳ/cho con bú, glôcôm góc đóng, bí tiểu cấp, phản vệ đạm sữa bò, đa thuốc ức chế CYP3A4/CYP1A2 & kéo dài QTc, toan hô hấp tăng CO₂ máu).

---

## 1. Kết luận Thẩm định Tổng thể (Verdict & Summary Counts)

- **PHÁN QUYẾT VÒNG 4 (VERDICT)**: **`FAIL`** *(Chưa đạt chuẩn an toàn dược lâm sàng để đóng gói phát hành do còn **5 lỗi Critical** và **8 lỗi Major** có bằng chứng runtime trực tiếp gây nguy cơ tai biến thuốc nghiêm trọng).*

| Mức độ nghiêm trọng (Severity) | Số lượng | Ngưỡng chặn theo `REVIEW_PROTOCOL.md` | Đánh giá |
|---|---:|---|---|
| **Critical** (`critical`) | **5** | `> 0` bắt buộc `FAIL` | Chặn phát hành (nguy cơ glôcôm góc đóng cấp, xoắn đỉnh/loạn nhịp thất do DDI chống chỉ định, mất bù suy tim cấp do cắt đột ngột chẹn beta trong đợt cấp) |
| **Major** (`major`) | **8** | Cần khắc phục triệt để trước nghiệm thu | Lỗi an toàn đa thuốc ức chế TKTƯ, kháng sinh đợt cấp trên CKD G3b/người cao tuổi, đứt gãy tham chiếu `formoterol.json`, gán sai trích dẫn trên 17 tệp KB, lỗi preset nội viện |
| **Minor** (`minor`) | **5** | Khuyến nghị sửa hoàn thiện | Chuỗi liều steroid, cảnh báo eGFR < 30 của LAMA bị ẩn bởi `gates.ts`, chống chỉ định vàng da ứ mật của Azithromycin, hiển thị `[Liều:...]` trên thẻ `HOLD`, ma trận thiết bị |
| **Suggestion** (`suggestion`) | **3** | Tối ưu hóa mở rộng | `Ensifentrine` trong `profileDiff`, gắn `drugId` cho VTE prophylaxis, cá thể hóa cảnh báo thuốc cai thuốc lá & vắc xin Zona |
| **TỔNG CỘNG** | **21** | Đồng bộ 1-1 với [round4_R2.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/round4_R2.json) | |

---

## 2. Kiểm tra Hồi quy Vòng 3 (Round 3 R2 Regression Verification)

Đối chiếu từng mục trong [round3_R2.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/round3_R2.json) và [round3_RESPONSE.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/round3_RESPONSE.md) bằng cả kiểm tra mã nguồn và chạy thực nghiệm `evaluate()`: **10/10 phát hiện R2 Vòng 3 đã được khắc phục đúng hướng** (tuy nhiên quá trình mở rộng kiến trúc đã bộc lộ một số góc khuất biên mới ở pha cấp cứu và biệt danh FDC được ghi nhận riêng tại Mục 3).

| Mã Vòng 3 | Nội dung lỗi ở Vòng 3 | Trạng thái Vòng 4 | Bằng chứng xác nhận trên mã nguồn & Runtime Vòng 4 |
|---|---|---|---|
| `COPD-R3-R2-01` | Cắt bỏ đơn độc `carvedilol` ở bệnh nhân HFrEF + COPD ổn định làm mất trụ cột chẹn beta giảm tử vong | **ĐÃ KHẮC PHỤC (ở pha ổn định)** | [rules.safety.systemic.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.systemic.ts#L105-L148) đã bổ sung `copd.safety.non_selective_bb_switch_selective` chuyển trực tiếp sang `bisoprolol` ở bệnh nhân COPD ổn định có HFrEF/CAD/AF *(Lưu ý: Pha đợt cấp cấp tính vẫn còn lỗi cắt đột ngột không thuốc thay thế -> xem `COPD-R4-R2-03`)*. |
| `COPD-R3-R2-02` | Thiếu input `narrowAngleGlaucoma`/`urinaryRetention`; lấy nhầm liều cắt cơn AIR của Hen cho `budesonide_formoterol`; khí dung SAMA qua mặt nạ | **ĐÃ KHẮC PHỤC** | Đã có trường nhập liệu trong [inputs.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/inputs.ts), hàm [`formatCopdBudesonideFormoterolDose()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts) kê cố định `160/4.5 mcg: hít 2 nhát x 2 lần/ngày`, và [rules.inpatient.bronch_o2.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.bronch_o2.ts#L45-L59) chặn pha Ipratropium khi có glôcôm góc đóng / bí tiểu. |
| `COPD-R3-R2-03` | `ix.ics_laba_strong_cyp3a4` bỏ lọt `salmeterol` đơn chất và `umeclidinium_vilanterol` (Anoro) | **ĐÃ KHẮC PHỤC (mức Alert)** | [respiratory.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/respiratory.json) đã đưa `salmeterol`, `vilanterol`, `umeclidinium_vilanterol` vào `drugsA` *(Tuy nhiên các rule kê đơn vẫn chủ động `START`/`UPTITRATE`/`CONTINUE` đè lên cảnh báo và thiếu `roxithromycin` -> xem `COPD-R4-R2-02`)*. |
| `COPD-R3-R2-04` | `copd.inpatient.systemic_steroid` không nhận diện `methylprednisolone` gây lệnh `SWITCH` nghịch lý & cảnh báo giả `dup.systemic_steroid` | **ĐÃ KHẮC PHỤC** | [rules.inpatient.meds.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.meds.ts#L121-L206) đã nhận diện `methylprednisolone`, `prednisolone`, `hydrocortisone`, `dexamethasone` và khử hoàn toàn cảnh báo trùng lặp giả *(Còn lỗi nhỏ parse chuỗi `'40 mg'` & quy đổi `32 mg` -> xem `COPD-R4-R2-14`)*. |
| `COPD-R3-R2-05` | Lỗ hổng bảo vệ phản vệ đạm sữa bò (`severeMilkProteinAllergy`) trên `fluticasone_vilanterol`, `fluticasone_salmeterol`, `tiotropium` | **ĐÃ KHẮC PHỤC (phần lớn)** | Đã thêm `severe_milk_protein_allergy` vào dược thư, thêm `copd.safety.dpi_milk_allergy_stop_without_spiro` và `copd.safety.dual_form_device_warning` *(Còn sót xung đột thẻ `CONTINUE` giữ nguyên chữ `'HandiHaler'`/`'Turbuhaler'` -> xem `COPD-R4-R2-07`)*. |
| `COPD-R3-R2-06` | Thiếu hoàn toàn lệnh `CONTINUE` cho `lama_mono`, `laba_mono`, `laba_lama`, `ics_laba`, `azithromycin`, `dupilumab`, `mepolizumab` tái khám | **ĐÃ KHẮC PHỤC** | Đã bổ sung đầy đủ trong [rules.followup.continue.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.continue.ts) (`continue_controlled_inhaler`, `continue_open_triple_ics_laba`) và [rules.escalation.oral.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.oral.ts) / [rules.escalation.biologics.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.biologics.ts). |
| `COPD-R3-R2-07` | Xử lý sai `Child-Pugh A` trên Roflumilast và bỏ lọt phụ nữ đang cho con bú (`breastfeeding`) | **ĐÃ KHẮC PHỤC** | [helpers.oral_safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.oral_safety.ts) đã phân biệt chính xác `Child-Pugh A` (cảnh báo tăng AUC +51%, khởi đầu `250 mcg x 4 tuần`), chặn `Child-Pugh B/C` và chặn `breastfeeding: true`. |
| `COPD-R3-R2-08` | Thiếu rà soát dùng đồng thời `ipratropium` định kỳ trên nền LAMA và thiếu cảnh báo độc tính `theophylline` | **ĐÃ KHẮC PHỤC (với đơn chất)** | Đã có `copd.safety.sama_on_lama_stop`, `copd.safety.methylxanthine_acute_stop` và `copd.safety.theophylline_chronic_review` *(Còn sót FDC SAMA+SABA `Combivent`/`Berodual` -> xem `COPD-R4-R2-04`)*. |
| `COPD-R3-R2-09` | Thiếu trường `lactation` trên 16 tệp thuốc COPD, thiếu lưu ý suy gan trên `Trelegy`/`Breztri` và lặp `citationIds` | **ĐÃ KHẮC PHỤC** | Tất cả 19 tệp thuốc COPD đã có đầy đủ trường `lactation`; đã bổ sung `getHepaticTripleWarnings()` cho Child-Pugh B/C trên Trelegy & Breztri và khử lặp `citationIds`. |
| `COPD-R3-R2-10` | Thiếu cảnh báo hội chẩn Sản – Hô hấp khi gợi ý `azithromycin`, `dupilumab`, `mepolizumab` ở thai phụ (`pregnant: true`) | **ĐÃ KHẮC PHỤC (khi khởi trị)** | Các rule khởi trị mới đã gắn cảnh báo thai kỳ/cho con bú *(Riêng thẻ duy trì `biologic_continue` còn quên gắn lại cảnh báo này -> ghi nhận tại `COPD-R4-R2-13`)*. |

---

## 3. Chi tiết 21 Phát hiện Kiểm toán Vòng 4 (Detailed Findings)

### 3.1. Nhóm Mức độ Nghiêm trọng Cực cao (`CRITICAL` — 5 phát hiện)

---

#### [COPD-R4-R2-01] `CRITICAL` | Rule & Engine Class Resolver — Mù biệt danh FDC kết hợp `mergeClassResolver.ts` viết đè thẻ thay thế thành lệnh `[CONTINUE] TIẾP TỤC DUY TRÌ` bình hít chứa LAMA (`Ultibro Breezhaler`, `Trimbow`) ngay trên bệnh nhân Glôcôm góc đóng cấp / Bí tiểu cấp

- **Thành phần liên quan**:
  - [`INHALER_PROFILES`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.constants.ts#L28-L163) & [`getInhalerProfile()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts)
  - [`copd.safety.lama_contra_stop`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_stop.ts#L105-L139) & [`copd.safety.lama_contra_alternative`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_device.ts#L24-L77)
  - [`resolveSameClassStartConflicts()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/mergeClassResolver.ts)
- **Mô tả cơ chế lỗi nguy hiểm**:
  1. Bảng cứng `INHALER_PROFILES` trong [helpers.constants.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.constants.ts#L28-L163) chỉ khai báo `'glycopyrronium_indacaterol'` và `'beclometasone_glycopyrronium_formoterol'`, bỏ sót hoàn toàn các mã đảo thứ tự hoạt chất đang tồn tại **ngay trong chính thư mục `kb/drugs/` của hệ thống** như [indacaterol_glycopyrronium.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/indacaterol_glycopyrronium.json) (*Ultibro Breezhaler*), hoặc các biến thể chuẩn quốc tế `'beclometasone_formoterol_glycopyrronium'` (*Trimbow*), `'budesonide_formoterol_glycopyrronium'` (*Breztri*), `'aclidinium_formoterol'`, `'glycopyrronium_formoterol'`, `'mometasone_indacaterol_glycopyrronium'`.
  2. Khi người bệnh đang dùng `indacaterol_glycopyrronium` (hoặc `beclometasone_formoterol_glycopyrronium`) xuất hiện **glôcôm góc đóng cấp** (`narrowAngleGlaucoma: true`) hoặc **bí tiểu cấp** (`urinaryRetention: true`):
     - `getInhalerProfile('indacaterol_glycopyrronium')` trả về `undefined` -> `copd.safety.lama_contra_stop` **bỏ lọt hoàn toàn**, không phát lệnh `STOP`!
     - Trong [indacaterol_glycopyrronium.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/indacaterol_glycopyrronium.json), chống chỉ định `narrow_angle_glaucoma` chỉ gắn `severity: "caution"` nên `reviewMeds.ts` cũng không phát lệnh `STOP`.
     - Tiếp theo, vì `resolveEffectiveInhaler(ctx)` tưởng bệnh nhân chưa có bình hít (`'none'`), `copd.safety.lama_contra_alternative` phát lệnh `START olodaterol` (LABA không chứa LAMA).
     - Cuối cùng, [mergeClassResolver.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/mergeClassResolver.ts) quét thấy thuốc đang dùng `indacaterol_glycopyrronium` có chứa thành phần lớp `'laba'` trùng với lớp `'laba'` của `olodaterol`, nên **tự động biến đổi khuyến cáo `START olodaterol` thành lệnh `[CONTINUE] TIẾP TỤC DUY TRÌ Ultibro Breezhaler 110/50 [Đang dùng]`**!
- **Bằng chứng thực thi Runtime `evaluate()`**:
  - **Input tái hiện**:
    ```json
    {
      "patient": {
        "age": 70, "sex": "male",
        "conditions": { "copd": true },
        "currentMeds": [{ "drugId": "indacaterol_glycopyrronium", "name": "Ultibro Breezhaler 110/50" }],
        "customInputs": {
          "postBdFev1Fvc": 0.56, "fev1PredPct": 48, "cat": 16, "mmrc": 2,
          "moderateExacerbations": 0, "hospitalizations": 0,
          "narrowAngleGlaucoma": true
        }
      },
      "settings": { "selectedModules": ["copd"], "setting": "outpatient", "profile": "VN" }
    }
    ```
  - **Output thực tế từ `evaluate()`**:
    - Số lệnh `STOP`: **`0`**
    - Khuyến cáo sinh ra:
      `[CONTINUE] id=rec_copd_lama_contra_alternative | drugId=indacaterol_glycopyrronium | title="TIẾP TỤC DUY TRÌ Ultibro Breezhaler 110/50 [Đang dùng]"`
    - Nội dung `rationale` tự mâu thuẫn cực kỳ nguy hiểm:
      > *"Bệnh nhân đang sử dụng Ultibro Breezhaler 110/50 cùng nhóm dược lý; tiếp tục duy trì phác đồ hiện tại thay vì khởi trị trùng lặp Olodaterol. Do người bệnh có glôcôm góc đóng hoặc bí tiểu nặng (chống chỉ định dùng nhóm kháng muscarinic LAMA), lựa chọn LABA phun hạt mịn không chứa LAMA (Olodaterol Respimat)..."*
    - Kịch bản tương tự với `beclometasone_formoterol_glycopyrronium` (*Trimbow*) cũng xuất `[CONTINUE] TIẾP TỤC DUY TRÌ Trimbow [Đang dùng]`.
- **Đối chiếu Y văn gốc 2026**:
  - **GOLD 2026** (`GOLD_2026_Report.pdf`, Appendix 3, **PDF p. 157**): Cảnh báo nhóm kháng muscarinic khởi phát cơn tăng nhãn áp góc đóng cấp tính và làm nặng bí tiểu cấp trên bệnh nhân tắc nghẽn đường ra bàng quang.
  - **BYT QĐ 2131/QĐ-BYT 2026** (`BYT_2131_COPD_2026.pdf`, Phụ lục 1, **PDF tr. 68**): Thận trọng tối đa / chống chỉ định khi có glôcôm góc hẹp chưa kiểm soát hoặc bí tiểu cấp.
- **Hướng khắc phục đề xuất**:
  1. Trong [`getInhalerProfile()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers.ts) và [`INHALER_PROFILES`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.constants.ts#L28-L163): Bổ sung tất cả các tổ hợp đảo chiều hoạt chất (`indacaterol_glycopyrronium`, `beclometasone_formoterol_glycopyrronium`, `budesonide_formoterol_glycopyrronium`, `aclidinium_formoterol`, `glycopyrronium_formoterol`, `mometasone_indacaterol_glycopyrronium`) **VÀ** thêm cơ chế suy luận tự động từ `drug(id).class` / `drug(id).components` trong KB (nếu chứa `tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`, `revefenacin` hoặc `class` chứa `'lama'` -> `lama: true`).
  2. Trong [mergeClassResolver.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/mergeClassResolver.ts): Tuyệt đối **không** viết đè lệnh `START` một thuốc đơn chất/phối hợp đôi (ví dụ `olodaterol` lớp `laba` hoặc `budesonide_formoterol` lớp `ics_laba`) thành `CONTINUE` một chế phẩm FDC đang dùng nếu FDC đó chứa thêm thành phần hoạt chất ngoài lớp của thuốc mới (ví dụ chứa thêm `lama`) hoặc đang bị cảnh báo chống chỉ định.

---

#### [COPD-R4-R2-02] `CRITICAL` | Drug-Drug Interaction & Prescribing Rules — Chủ động kê mới (`START`), nâng bậc (`UPTITRATE`) và duy trì (`CONTINUE`) `Salmeterol` / `Vilanterol` / `Fluticasone` (`Trelegy`, `Seretide`, `Anoro`) trực tiếp vào chất ức chế mạnh CYP3A4 + Bỏ sót `Roxithromycin`

- **Thành phần liên quan**:
  - [`copd.initial.group_e_triple`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.initial.ts), [`copd.followup.exac_add_ics`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.stepup_ics.ts#L25-L72), [`copd.followup.continue_controlled_inhaler`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.continue.ts#L23-L91), [`selectTripleInhaler()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.inhalers_plan.ts)
  - [`ix.ics_laba_strong_cyp3a4`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/respiratory.json)
- **Đối chiếu Y văn gốc nguyên văn**:
  - **Bộ Y tế QĐ 2131/QĐ-BYT 2026** (`BYT_2131_COPD_2026.pdf`, **PDF tr. 120**, Phụ lục 11 – *Các cặp tương tác thuốc chống chỉ định*, **STT 34**):
    > *"34 | Salmeterol | Các thuốc ức chế mạnh CYP3A4 (clarithromycin, erythromycin, roxithromycin, itraconazol, posaconazol, voriconazol, boceprevir, các thuốc ức chế protetase điều trị HIV\*) | Các thuốc ức chế mạnh CYP3A4 ức chế chuyển hóa của salmeterol qua gan | Tăng nồng độ salmeterol trong huyết thanh, tăng nguy cơ phản ứng có hại (bao gồm cả các phản ứng trên tim mạch như đau thắt ngực, tăng hoặc hạ huyết áp, nhịp tim nhanh) | **Chống chỉ định phối hợp. Cân nhắc thay salmeterol bằng các thuốc chủ vận beta-2 khác không phụ thuộc vào chuyển hóa qua CYP3A4 như formeterol.**"*
  - **GINA 2026 Strategy** (`GINA_2026_Strategy.pdf`, **PDF p. 47, p. 133, p. 140**):
    > *"...concomitant treatment with cytochrome P450 inhibitors such as ketoconazole, ritonavir, itraconazole, erythromycin and clarithromycin may increase the risk of ICS adverse effects such as adrenal suppression, and with short-term use, may increase the risk of cardiovascular adverse effects of the LABAs salmeterol and vilanterol (alone or in combination with ICS). **Concomitant use of these medications is not recommended.**"* (Tại p. 133 & p. 140, GINA 2026 hướng dẫn chuyển sang bình hít nền `formoterol` khi bệnh nhân điều trị `itraconazole` hoặc `ritonavir`).
- **Bằng chứng thực thi Runtime `evaluate()` (4 kịch bản thất bại liên tiếp)**:
  1. **Khởi trị mới Nhóm E (`bloodEos: 350`) đang uống `clarithromycin`, `itraconazole` hoặc `nirmatrelvir_ritonavir` (Paxlovid)**:
     - Hàm `selectTripleInhaler(ctx)` không kiểm tra CYP3A4 nên mặc định chọn `fluticasone_furoate_umeclidinium_vilanterol` (*Trelegy Ellipta*).
     - `evaluate()` phát đồng thời cảnh báo đỏ `[ALERT critical] ix.ics_laba_strong_cyp3a4` khuyên tránh phối hợp **VÀ** ngay bên dưới phát y lệnh **`[START] Bắt đầu điều trị Fluticasone furoate/Umeclidinium/Vilanterol (Trelegy Ellipta)`**!
  2. **Nâng bậc từ `tiotropium_olodaterol` lên bộ ba trên nền `itraconazole` dài ngày (nấm phổi Aspergillus mạn tính ở COPD)**:
     - `copd.followup.exac_add_ics` kê thẳng **`[UPTITRATE] Fluticasone furoate/Umeclidinium/Vilanterol (Trelegy Ellipta)`** thay vì chọn `budesonide_glycopyrronium_formoterol` (*Breztri Aerosphere*) hoặc `beclometasone_glycopyrronium_formoterol` (*Trimbow*).
  3. **Tái khám đang dùng `Seretide` (`fluticasone_salmeterol`) + `clarithromycin`**:
     - `copd.followup.continue_controlled_inhaler` vẫn phát lệnh **`[CONTINUE] Tiếp tục duy trì phác đồ thuốc hít nền tảng hiện tại (Seretide)`** trực tiếp vi phạm Chống chỉ định phối hợp STT 34 của Bộ Y tế.
  4. **Đang dùng `Seretide` (`fluticasone_salmeterol`) + `roxithromycin` (Rulid 150 mg)**:
     - Phát **`[CONTINUE] Seretide`** kèm **`alerts = []` (0 cảnh báo tương tác)** vì `roxithromycin` bị bỏ sót hoàn toàn khỏi `drugsB` của `ix.ics_laba_strong_cyp3a4` trong [respiratory.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/respiratory.json)!
- **Hướng khắc phục đề xuất**:
  1. Bổ sung hàm `hasStrongCyp3a4Inhibitor(ctx)` trong [helpers.clinical.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.clinical.ts) quét đầy đủ: `clarithromycin`, `erythromycin`, `roxithromycin`, `ketoconazole`, `itraconazole`, `posaconazole`, `voriconazole`, `ritonavir`, `nirmatrelvir_ritonavir`, `cobicistat`, `boceprevir`, `telaprevir`, `atazanavir`, `darunavir`, `lopinavir_ritonavir`.
  2. Trong `selectTripleInhaler(ctx)` và các rule khởi trị/nâng bậc/duy trì: Khi `hasStrongCyp3a4Inhibitor(ctx) === true`, tự động tránh `fluticasone_furoate_umeclidinium_vilanterol`, `fluticasone_salmeterol`, `fluticasone_vilanterol`, `umeclidinium_vilanterol`, `salmeterol` — chuyển sang lựa chọn không chứa salmeterol/vilanterol/fluticasone (`tiotropium_olodaterol` cho LABA+LAMA; `beclometasone_glycopyrronium_formoterol` hoặc `budesonide_glycopyrronium_formoterol` kèm lưu ý theo dõi cortisol/thượng thận cho Triple; `budesonide_formoterol` hoặc `beclometasone_formoterol` cho ICS+LABA); nếu bệnh nhân đang dùng sẵn `salmeterol`/`vilanterol` kèm thuốc kháng nấm azole/ritonavir dài ngày thì phát lệnh `SWITCH` sang chế phẩm nền `formoterol`/`olodaterol`.
  3. Bổ sung `'roxithromycin'`, `'boceprevir'`, `'telaprevir'`, `'atazanavir'`, `'darunavir'`, `'lopinavir_ritonavir'` vào `drugsB` của `ix.ics_laba_strong_cyp3a4` trong [respiratory.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/respiratory.json).

---

#### [COPD-R4-R2-03] `CRITICAL` | Cross-Module Cardiopulmonary Safety — Lệnh `[STOP]` cắt đứt đột ngột `Carvedilol` KHÔNG có chẹn beta-1 chọn lọc thay thế ở bệnh nhân HFrEF (`LVEF 30%`) / CAD ngay trong đợt cấp COPD + Xung đột cổng `HR < 50 bpm` + Thiếu cảnh báo chẹn beta ở COPD phụ thuộc oxy dài hạn

- **Thành phần liên quan**:
  - [`copd.safety.non_selective_bb_stop`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.systemic.ts#L39-L98) & [`copd.safety.non_selective_bb_switch_selective`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.systemic.ts#L105-L148)
  - [`applySafetyGates()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts)
- **Phân tích 3 tầng lỗi liên hoàn**:
  1. **Cắt đột ngột Carvedilol không thuốc thay thế trong đợt cấp COPD (cả ngoại trú lẫn nội trú) trên nền HFrEF (`LVEF 30%`)**:
     - Tại [rules.safety.systemic.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.systemic.ts#L29-L95), `copd.safety.non_selective_bb_stop` có `setting: 'both'`, `action: 'STOP'`, `priority: 97`. Trong khi đó `canAutoSwitchToSelectiveBb(ctx)` (dòng 32) trả về `false` khi `isAcuteExacerbation(ctx) === true`.
     - Khi chạy `evaluate()` với `selectedModules: ['copd', 'hf']` trên bệnh nhân HFrEF (`LVEF 30%`, huyết động ổn `SBP 118 mmHg`, `HR 84 bpm`) đang uống `Carvedilol 12.5 mg x 2 lần/ngày` vào đợt cấp COPD trung bình ngoại trú hoặc nặng nội trú: lệnh `STOP` (`priority: 97`) **đè bẹp hoàn toàn** khuyến cáo duy trì chẹn beta của phân hệ `hf`, xuất duy nhất **`* NGỪNG THUỐC: - Carvedilol 12.5mg`** mà **KHÔNG có bất kỳ chẹn beta-1 chọn lọc nào thay thế**, đúng vào thời điểm bệnh nhân cường giao cảm mạnh và phun khí dung SABA lặp lại giờ đầu! Nghịch lý hơn, ngay bên dưới thẻ `STOP`, hệ thống lại in câu tự mâu thuẫn: *"Không ngừng thuốc chẹn beta đột ngột ở bệnh nhân có bệnh mạch vành hoặc suy tim vì nguy cơ đau thắt ngực nặng lên, nhồi máu cơ tim hoặc loạn nhịp thất (FDA Warning)"*.
  2. **Mâu thuẫn y lệnh khi nhịp chậm `HR = 42 bpm` ở pha ổn định**:
     - Khi bệnh nhân COPD ổn định + HFrEF đang dùng `Carvedilol` có `HR = 42 bpm`, `gates.ts` đánh dấu cổng `hr < 50` thất bại trên cả 2 thẻ nhưng **không chặn `action: 'STOP'`** trên `Carvedilol`, trong khi hạ cấp `Bisoprolol` xuống **`[HOLD] TẠM HOÃN Bisoprolol (Nhịp tim < 50 bpm)`** — khiến `noteText` vừa ra lệnh *"thực hiện chuyển đổi trực tiếp sang thuốc chẹn beta-1 chọn lọc tim (Bisoprolol)"* ở mục `NGỪNG THUỐC` vừa ra lệnh `TẠM HOÃN Bisoprolol` ở dòng dưới!
  3. **Thiếu cảnh báo của BYT QĐ 2131/2026 về chẹn beta ở bệnh nhân COPD phụ thuộc oxy dài hạn**:
     - Khi bệnh nhân COPD phụ thuộc oxy dài hạn (`restingSpo2 <= 88%` hoặc `onSupplementalOxygen: true`) đang dùng hoặc được chuyển sang chẹn beta mà không phân biệt rõ chỉ định bắt buộc (như chỉ tăng huyết áp đơn thuần vs HFrEF/sau NMCT), chưa có cảnh báo theo hướng dẫn mới của Bộ Y tế 2026.
- **Đối chiếu Y văn gốc nguyên văn**:
  - **FDA Coreg Label** (`FDA_label_carvedilol.pdf`, **PDF p. 6**, §5.1 *Cessation of Therapy*):
    > *"Severe exacerbation of angina and the occurrence of myocardial infarction and ventricular arrhythmias have been reported in angina patients following the abrupt discontinuation of therapy with β-blockers. ... COREG should be discontinued over 1 to 2 weeks whenever possible. ... it may be prudent not to discontinue therapy with COREG abruptly even in patients treated only for hypertension or heart failure."*
  - **GOLD 2026** (`GOLD_2026_Report.pdf`, Chapter 5, **PDF p. 127**):
    > *"Treatment with β1-blockers improves survival in heart failure and is recommended in patients who also have COPD."*
  - **BYT QĐ 2131/QĐ-BYT 2026** (`BYT_2131_COPD_2026.pdf`, **PDF tr. 44 & tr. 53**): Cảnh báo nguy cơ biến cố tim mạch cấp tăng vọt trong và sau đợt cấp COPD; đồng thời tại Mục 5.2 (**PDF tr. 53**) ghi rõ:
    > *"Không thực hiện: Kê đơn thuốc chẹn beta ở những người bệnh BPTNMT phụ thuộc oxy do nguy cơ tăng tử vong"* (trừ khi cân nhắc hội chẩn chuyên khoa Tim mạch trên chỉ định bắt buộc giảm tử vong như HFrEF/NMCT).
- **Hướng khắc phục đề xuất**:
  1. Khi `isAcuteExacerbation(ctx)` và bệnh nhân có chỉ định tim mạch bắt buộc (`hasCompellingBbIndication(ctx)` — HFrEF `LVEF ≤ 40%`, CAD/sau NMCT, AF) mà **không có sốc tim / tụt huyết áp (`SBP < 90`) / nhịp chậm `< 50 bpm` / hen phế quản**: Không phát `action: 'STOP'` cắt đột ngột `carvedilol`; đổi thành `action: 'REDUCE'` hoặc `'MONITOR'` (*"Không ngừng đột ngột Carvedilol trong đợt cấp trên nền suy tim/mạch vành; cân nhắc giảm nửa liều tạm thời nếu co thắt phế quản nặng và lên kế hoạch chuyển đổi chéo sang Bisoprolol / Metoprolol succinate ngay khi ổn định trước xuất viện"*); chỉ `HOLD` khi sốc huyết động / phù phổi cấp mất bù nặng / `HR < 50 bpm`.
  2. Ở pha ổn định khi `HR < 50 bpm` hoặc `SBP < 90 mmHg` trên nền HFrEF/CAD: Đổi hành động trên `carvedilol` sang `HOLD` / `REDUCE` kèm hội chẩn Tim mạch thay vì phát cặp mâu thuẫn `STOP Carvedilol` + `HOLD Bisoprolol`.
  3. Bổ sung cảnh báo đặc thù khi `restingSpo2 <= 88%` hoặc `onSupplementalOxygen: true` theo BYT QĐ 2131/2026 tr. 53.

---

#### [COPD-R4-R2-04] `CRITICAL` | Anticholinergic Safety — Mù hoàn toàn nhóm phối hợp cố định giãn phế quản ngắn hạn SAMA + SABA (`Combivent` – `ipratropium_salbutamol`, `Berodual` – `ipratropium_fenoterol`)

- **Thành phần liên quan**:
  - [`SAMA_MONO_IDS`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.constants.ts#L175)
  - [`copd.safety.sama_on_lama_stop`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_stop.ts#L193-L228) & [`copd.inpatient.ipratropium_contra_avoid`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.bronch_o2.ts#L95-L120)
  - [kb/drugs/](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/) & [drugClassify.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/drugClassify.ts)
- **Mô tả lỗi & Hậu quả lâm sàng**:
  - Tại Việt Nam, hai chế phẩm chứa SAMA được sử dụng rộng rãi nhất tại hầu hết các khoa Cấp cứu, Nội Hô hấp và đơn ngoại trú là **Berodual** (`ipratropium_fenoterol`) và **Combivent** (`ipratropium_salbutamol`), được liệt kê chính thức trong Phụ lục 1 QĐ 2131/QĐ-BYT 2026 (**PDF tr. 68**): *"Ipratropium/salbutamol: ống khí dung 2,5mg/0,5mg"* và *"Ipratropium/fenoterol: xịt định liều 50/20 µg, dung dịch khí dung 0,50mg/0,25mg/ml"*.
  - Tuy nhiên, `SAMA_MONO_IDS` tại [helpers.constants.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.constants.ts#L175) chỉ chứa `['ipratropium', 'atrovent']`, còn `kb/drugs/`, `INHALER_PROFILES` và `drugClassify.ts` hoàn toàn không có `ipratropium_salbutamol` hay `ipratropium_fenoterol`.
- **Bằng chứng thực thi Runtime `evaluate()`**:
  1. **Đợt cấp nội viện có Glôcôm góc đóng cấp + Bí tiểu cấp đang phun `Berodual khí dung` (`drugId: 'ipratropium_fenoterol'`)**:
     - `copd.inpatient.ipratropium_contra_avoid` chỉ kiểm tra `hasCurrentMed(ctx, 'ipratropium')` (`false`), nên chỉ phát thẻ `[AVOID] Ipratropium bromide (SAMA)` chung chung mà **KHÔNG phát lệnh `[STOP]` ngừng `Berodual khí dung` đang nằm trong `currentMeds`**!
  2. **Ngoại trú ổn định dùng `Spiolto Respimat` (`tiotropium_olodaterol`) + `Combivent` (`ipratropium_salbutamol`) 4 lần/ngày**:
     - `evaluate()` trả về **`0` lệnh `STOP`** và **`0` cảnh báo trùng lặp kháng muscarinic**!
- **Hướng khắc phục đề xuất**:
  1. Tạo mới `kb/drugs/ipratropium_salbutamol.json` và `kb/drugs/ipratropium_fenoterol.json` (khai báo `class: 'sama_saba'`, `components: ['ipratropium', 'salbutamol'/'fenoterol']`, chống chỉ định `narrow_angle_glaucoma` & `urinary_retention`).
  2. Thay `SAMA_MONO_IDS` bằng `SAMA_CONTAINING_IDS` bao gồm `'ipratropium'`, `'atrovent'`, `'ipratropium_salbutamol'`, `'salbutamol_ipratropium'`, `'combivent'`, `'ipratropium_fenoterol'`, `'fenoterol_ipratropium'`, `'berodual'`, `'albuterol_ipratropium'`, `'duoneb'` trên toàn bộ `sama_on_lama_stop`, `lama_contra_stop`, `ipratropium_contra_avoid` và `duplicateRules.ts`.

---

#### [COPD-R4-R2-05] `CRITICAL` | QT Prolongation / Torsades de Pointes — Bỏ sót hoàn toàn `Domperidone` khỏi sàng lọc QT của `Azithromycin` và `kb/interactions/`, vi phạm "Chống chỉ định phối hợp" tại Phụ lục 11 STT 3 QĐ 2131/QĐ-BYT 2026

- **Thành phần liên quan**:
  - [`QT_PROLONGING_DRUG_IDS`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.constants.ts#L268-L288) & [`getAzithromycinContraReasons()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.oral_safety.ts)
  - [`copd.followup.azithromycin_prophylaxis`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.oral.ts) & [kb/interactions/respiratory.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/respiratory.json)
- **Đối chiếu Y văn gốc nguyên văn**:
  - **Bộ Y tế QĐ 2131/QĐ-BYT 2026** (`BYT_2131_COPD_2026.pdf`, **PDF tr. 107**, Phụ lục 11 – *Các cặp tương tác thuốc chống chỉ định*, **STT 2 & STT 3**):
    > *"2 | Kháng sinh nhóm macrolid: Clarithromycin, Erythromycin | Domperidon | Ức chế CYP3A4 + Hiệp đồng tăng tác dụng | Tăng nồng độ của domperidon trong huyết tương, tăng nguy cơ kéo dài khoảng QT, xoắn đỉnh | **Chống chỉ định phối hợp.**"*
    > *"3 | Kháng sinh nhóm macrolid: **Azithromycin**, Roxithromycin, Spiramycin | **Domperidon** | Hiệp đồng tăng tác dụng | Tăng nguy cơ kéo dài khoảng QT, xoắn đỉnh | **Chống chỉ định phối hợp.**"*
- **Bằng chứng thực thi Runtime `evaluate()`**:
  - `domperidone` (*Motilium-M* 10 mg — thuốc chống nôn/trào ngược cực kỳ phổ biến ở bệnh nhân COPD lớn tuổi tại Việt Nam) không có trong `QT_PROLONGING_DRUG_IDS`, không có tệp `kb/drugs/domperidone.json` và không có trong `kb/interactions/`. Ngoài ra danh sách `QT_PROLONGING_DRUG_IDS` còn thiếu nhiều thuốc kéo dài QT thường gặp khác như `fluconazole`, `voriconazole`, `posaconazole`, `itraconazole`, `ketoconazole`, `roxithromycin`, `spiramycin`, `quetiapine`, `risperidone`, `chlorpromazine`, `sulpiride`, `amisulpride`, `cilostazol`, `ivabradine`, `hydroxychloroquine`.
  - Khi chạy `evaluate()` trên bệnh nhân COPD đã cai thuốc lá (`bloodEos: 80 /µL`, 2 đợt cấp/năm) đang dùng `domperidone` (`Motilium 10mg`), hệ thống bỏ lọt hoàn toàn `domperidone`, chủ động khuyến cáo **`[CONSIDER] Azithromycin 250 mg uống 1 lần/ngày (hoặc 500 mg x 3 lần/tuần) kéo dài tới 1 năm`** với **`0` cảnh báo tương tác thuốc**!
- **Hướng khắc phục đề xuất**:
  1. Bổ sung ngay `'domperidone'`, các thuốc kháng nấm azole (`'fluconazole'`, `'itraconazole'`, `'voriconazole'`, `'posaconazole'`, `'ketoconazole'`), macrolide (`'roxithromycin'`, `'spiramycin'`), thuốc loạn thần/chống nôn (`'quetiapine'`, `'risperidone'`, `'olanzapine'`, `'chlorpromazine'`, `'sulpiride'`, `'amisulpride'`) và tim mạch (`'cilostazol'`, `'ivabradine'`, `'ranolazine'`) vào `QT_PROLONGING_DRUG_IDS`.
  2. Tạo `kb/drugs/domperidone.json` và thêm quy tắc tương tác mức `'critical'` (`ix.macrolide_domperidone_qt`) vào [respiratory.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/respiratory.json) trích dẫn trực tiếp Phụ lục 11 STT 2–3 QĐ 2131/QĐ-BYT 2026 (PDF tr. 107).

---

### 3.2. Nhóm Mức độ Nghiêm trọng Cao (`MAJOR` — 8 phát hiện)

---

#### [COPD-R4-R2-06] `MAJOR` | Respiratory Depression Safety — Cắt cụt lệnh `STOP` đa thuốc ức chế thần kinh trung ương trong toan hô hấp cấp (`pH 7.28, PaCO₂ 64 mmHg`)

- **Thành phần**: [`copd.safety.cns_depressant_hypercapnia_stop`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.systemic.ts#L243-L280) & [`CNS_DEPRESSANT_IDS`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.constants.ts#L184-L201)
- **Phát hiện & Bằng chứng Runtime**:
  - Rule gọi `findCurrentMedInSet(ctx, CNS_DEPRESSANT_IDS)` (dùng `.find()`) nên **chỉ trả về duy nhất 1 thuốc đầu tiên** khớp danh sách, đồng thời `CNS_DEPRESSANT_IDS` thiếu nhóm gabapentinoid (`pregabalin`, `gabapentin` — có cảnh báo FDA 2019/2026 gây suy hô hấp nặng trên bệnh nhân COPD và người dùng kèm opioid) cũng như `buprenorphine`, `hydromorphone`, `eszopiclone`.
  - **Runtime `evaluate()`**: Bệnh nhân nội trú toan hô hấp tăng CO₂ nguy kịch (`abgPh: 7.28`, `abgPaco2: 64`, `restingSpo2: 86%`) đang dùng đồng thời `Morphine 10mg` + `Diazepam 5mg` + `Pregabalin 75mg`: Hệ thống chỉ phát `[STOP] Morphine 10mg`, **bỏ mặc `Diazepam 5mg` (benzodiazepine ức chế trung tâm hô hấp mạnh) và `Pregabalin 75mg` không hề có lệnh ngừng**!
  - **Y văn**: GOLD 2026 (**PDF p. 29 & p. 116**) cảnh báo nghiêm ngặt nhóm benzodiazepine, thuốc ngủ an thần và opioid làm suy giảm thông khí phế nang gây hôn mê tăng CO₂ tử vong.
- **Khắc phục**: Chuyển `copd.safety.cns_depressant_hypercapnia_stop` sang cơ chế đa khe (multi-slot 0..3 như `makeDuplicateInhalerStopRule`) để phát lệnh `STOP` cho **mọi** opioid/benzodiazepine/Z-drug đang dùng, và bổ sung cảnh báo/giảm liều/ngừng cho `pregabalin`, `gabapentin`.

---

#### [COPD-R4-R2-07] `MAJOR` | Device & Inpatient Controller Safety — Phát lệnh `[CONTINUE]` giữ nguyên tên bình DPI chứa lactose (`Spiriva HandiHaler`, `Symbicort Turbuhaler` kèm liều MART của Hen) ở người phản vệ đạm sữa bò + Bỏ trống thuốc giãn phế quản dài hạn nội viện khi `STOP` LAMA do glôcôm góc đóng

- **Thành phần**:
  - [`copd.inpatient.continue_maintenance_labd`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.meds.ts#L79-L117)
  - [`copd.followup.continue_controlled_inhaler`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.continue.ts#L23-L91)
  - [`copd.safety.lama_contra_alternative`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.safety.inhalers_device.ts#L24-L77)
- **Phát hiện & Bằng chứng Runtime**:
  1. **Mâu thuẫn trực diện trên bệnh nhân phản vệ đạm sữa bò (`severeMilkProteinAllergy: true`)**:
     - Ca nội trú đang dùng `{ drugId: 'tiotropium', name: 'Spiriva HandiHaler 18 mcg' }`: Vì `'tiotropium'` không nằm trong `DPI_INHALER_IDS` (do có dạng Respimat), `copd.inpatient.continue_maintenance_labd` phát lệnh **`[CONTINUE] Tiếp tục duy trì thuốc giãn phế quản dài hạn nền (Spiriva HandiHaler 18 mcg) trong đợt cấp`**, đối nghịch 180 độ với thẻ `MONITOR` ngay bên dưới (*"tuyệt đối KHÔNG cấp phát HandiHaler DPI"*)!
     - Ca ngoại trú đồng mắc tiền sử Hen (`priorAsthma: true`) có `severeMilkProteinAllergy: true` đang dùng `{ drugId: 'budesonide_formoterol', name: 'Symbicort Turbuhaler 160/4.5' }`: Tại [rules.followup.continue.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.continue.ts#L53), điều kiện `canonical === 'budesonide_formoterol' && !hasConcurrentAsthma(ctx)` bị `false`, làm hệ thống vừa phát **`[CONTINUE] Symbicort Turbuhaler 160/4.5`** (bình bột khô chứa lactose!), vừa lấy chuỗi liều `target` của Hen (*"MART Bậc 4–5 là 2 nhát x 2 lần/ngày + 1 nhát khi cần, tối đa 12 nhát/24 giờ"* — chế độ MART chỉ thực hiện được với bình phù hợp và không được giữ Turbuhaler khi phản vệ đạm sữa!).
  2. **Mất trắng thuốc giãn phế quản dài hạn trong nội viện khi chống chỉ định LAMA**:
     - Ca nội trú `narrowAngleGlaucoma: true` đang dùng `Trelegy Ellipta`: `copd.safety.lama_contra_stop` phát `[STOP] Trelegy Ellipta`, nhưng `getLamaContraAlternativeTargetDrugId(ctx)` bị khóa bởi `hasConfirmedStableCopd(ctx) === false` nên suốt đợt nằm viện bệnh nhân không được kê bất kỳ LABA / ICS+LABA thay thế nào (trái GOLD 2026 **PDF p. 114** khuyến cáo duy trì/khởi động lại thuốc giãn phế quản tác dụng kéo dài ngay trong đợt cấp hoặc càng sớm càng tốt trước xuất viện).
- **Khắc phục**: Kiểm tra từ khóa DPI trong `med.name` (`handihaler`, `turbuhaler`, `accuhaler`, `diskus`, `nexthaler`, `dpi`) khi có `severeMilkProteinAllergy` hoặc `weakInspiratoryFlow` để phát `SWITCH` sang `Spiriva Respimat` / `Symbicort Rapihaler pMDI + buồng đệm` / `Seretide Evohaler pMDI + buồng đệm`; đồng thời mở nhánh đề xuất phác đồ duy trì không chứa LAMA cho bệnh nhân nội trú bị `STOP` LAMA.

---

#### [COPD-R4-R2-08] `MAJOR` | Antibiotic Renal Dosing & Geriatric Fluoroquinolone Safety — Bỏ sót hiệu chỉnh liều kháng sinh ở dải `eGFR / Clcr 30–50 mL/phút`, thiếu cảnh báo đứt gân Achilles khi phối hợp Fluoroquinolone + Corticosteroid toàn thân ở người cao tuổi (`≥ 60 tuổi`) và thiếu cảnh báo tương tác `Warfarin`

- **Thành phần**: [`copd.inpatient.antibiotics`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.meds.ts#L209-L291)
- **Đối chiếu Y văn gốc nguyên văn**:
  - **BYT QĐ 2131/QĐ-BYT 2026, Phụ lục 10** (`BYT_2131_COPD_2026.pdf`, **PDF tr. 102–104** – *Liều một số kháng sinh theo mức lọc cầu thận*):
    - **Levofloxacin** (**PDF tr. 104**): Phải giảm liều ngay từ **`Clcr 20–49 mL/phút`**: *"Liều ban đầu 0,75 g -> 0,75 g cách 48 giờ; hoặc Liều ban đầu 0,5 g -> 0,5 g cách 24 giờ"* (nếu giữ liều chuẩn 750 mg/24h hoặc 500 mg q12h cho nhiễm *Pseudomonas* ở người bệnh `eGFR 35 mL/phút` sẽ gây tích lũy ngộ độc thần kinh/co giật/xoắn đỉnh).
    - **Ciprofloxacin uống** (**PDF tr. 103**): Phải giảm liều ngay từ **`Clcr 30–50 mL/phút`**: *"0,25–0,5 g cách 12 giờ"* (không dùng liều chống *Pseudomonas* 750 mg q12h).
    - **Amoxicilin/acid clavulanic** (**PDF tr. 102**): Ở `Clcr 10–30 mL/phút`: *"0,25–0,5 g cách 12 giờ"* (tránh viên 875/125 mg do tích lũy clavulanate/amoxicillin).
  - **BYT QĐ 2131/QĐ-BYT 2026, Mục 3.4.3d & 3.4.4d** (**PDF tr. 35 & tr. 38**) và **FDA Fluoroquinolone Boxed Warning**:
    > *"Cân nhắc đến một số tác dụng không mong muốn trên gân, cơ, tim mạch, thần kinh, tâm thần và rối loạn đường huyết khi sử dụng quinolon ở bệnh nhân cao tuổi. (Liều dùng của các kháng sinh theo chức năng thận xem chi tiết tại Phụ lục 10)."* Nguy cơ viêm và đứt gân gót Achilles tăng gấp nhiều lần ở người bệnh **≥ 60 tuổi dùng đồng thời Corticosteroid toàn thân** (chính là phác đồ chuẩn Prednisolone/Methylprednisolone 5 ngày của đợt cấp COPD!).
- **Bằng chứng Runtime `evaluate()`**:
  - Bệnh nhân **76 tuổi**, nhập viện vì đợt cấp nặng có nguy cơ *Pseudomonas* (`FEV₁ 26%`, 2 lần nhập viện), **`eGFR = 35 mL/phút/1.73m²`** (CKD G3b), được kê đồng thời `Prednisolone 30–40 mg/ngày` và đang uống `Warfarin 2mg`:
  - Tại dòng 236 & 241 của [rules.inpatient.meds.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.meds.ts#L236-L251), code tái sử dụng nhầm hằng số `copd.egfr_vte_lmwh_caution` (`30`), nên ở `eGFR = 35` trường `warnings` trả về **`undefined` (trống rỗng hoàn toàn)**: 0 cảnh báo chỉnh liều thận Levofloxacin/Ciprofloxacin, 0 cảnh báo đứt gân Achilles do bộ ba `[76 tuổi + Prednisolone + Quinolone]`, và 0 cảnh báo tăng vọt INR xuất huyết với `Warfarin`!
- **Khắc phục**: Nâng ngưỡng cảnh báo hiệu chỉnh liều thận kháng sinh lên `eGFR < 50 mL/phút` (chi tiết hóa mốc `30–49` cho Levofloxacin/Ciprofloxacin và `< 30` cho Beta-lactam theo Phụ lục 10 BYT 2131/2026); gắn cảnh báo đứt gân Achilles / phình ĐMC / sảng / hạ đường huyết khi dùng Quinolone (đặc biệt tuổi ≥ 60 + steroid đợt cấp); và tự động cảnh báo kiểm tra INR sau 48–72 giờ khi bệnh nhân đang dùng `warfarin`/`acenocoumarol`.

---

#### [COPD-R4-R2-09] `MAJOR` | Knowledge Base Referential Integrity — Đứt gãy tham chiếu hoạt chất `"formoterol"` trên 5 chế phẩm FDC hô hấp (`hasDrug('formoterol') === false`) và thiếu tệp KB cho nhiều thuốc COPD cốt lõi

- **Thành phần**: [kb/drugs/](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/) — `budesonide_glycopyrronium_formoterol.json`, `beclometasone_glycopyrronium_formoterol.json`, `budesonide_formoterol.json`, `beclometasone_formoterol.json`, `mometasone_formoterol.json`
- **Bằng chứng kiểm toán KB & Runtime**:
  1. Cả **5 tệp FDC hô hấp** trên đều khai báo `"components": [..., "formoterol"]`, nhưng tệp `kb/drugs/formoterol.json` **KHÔNG TỒN TẠI** (`hasDrug('formoterol') === false`, gọi `drug('formoterol')` ném ngoại lệ `Error: Unknown drug: formoterol`). Trong khi đó Phụ lục 1 QĐ 2131/QĐ-BYT 2026 (**PDF tr. 68**) quy định chính thức Formoterol đơn chất (*"4,5–12 mcg, ngày 2 lần"*), và mọi thuật toán phân rã `components` để kiểm tra dị ứng thành phần / tương tác hoạt chất sẽ bị mù thành phần `formoterol`.
  2. Thiếu tệp KB cho:
     - `ensifentrine` (thuốc ức chế kép PDE3/PDE4 khí dung mới trong GOLD 2026 Figure 3.9 **PDF p. 77** & Appendix 3 **PDF p. 163**);
     - `ipratropium_salbutamol`, `ipratropium_fenoterol` (Phụ lục 1 BYT 2131/2026 **PDF tr. 68**);
     - `propranolol` (chẹn beta không chọn lọc kinh điển dùng trong tăng áp tĩnh mạch cửa/xơ gan hay gặp ở bệnh nhân COPD);
     - `enoxaparin`, `heparin`, `levofloxacin`, `ciprofloxacin`, `clarithromycin`, `roxithromycin`, `domperidone`.
- **Khắc phục**: Tạo đầy đủ `kb/drugs/formoterol.json` cùng các tệp thuốc trên, và bổ sung kiểm tra toàn vẹn tham chiếu (`every component in drug.components must exist in kb/drugs/`) vào `tools/kb/verifyKb.ts`.

---

#### [COPD-R4-R2-10] `MAJOR` | Evidence & Citation Integrity — Gán sai trích dẫn hệ thống trên 17 tệp thuốc `kb/drugs/*.json`, sai số trang PDF trên `gold.copd.2026.initial_group_e` và dính watermark cá nhân / cắt cụt từ ngữ trong `kb/citations/copd.json`

- **Thành phần**: 17 tệp trong [kb/drugs/](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/) & [kb/citations/copd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json)
- **Bằng chứng kiểm toán đối chiếu từng dòng quote với PDF gốc**:
  1. **Gán trích dẫn không liên quan cho mục `renal` và `contraindications` trên 17 tệp thuốc COPD**:
     - Các tệp `fluticasone_furoate_umeclidinium_vilanterol`, `umeclidinium_vilanterol`, `vilanterol`, `umeclidinium`, `indacaterol`, `glycopyrronium`, `glycopyrronium_indacaterol`, `olodaterol`, `tiotropium`, `tiotropium_olodaterol`, `aclidinium`, `salmeterol`, `beclometasone_glycopyrronium_formoterol`, `budesonide_glycopyrronium_formoterol`, `dupilumab`, `mepolizumab`, `azithromycin` gắn `citationIds` của các dải lọc cầu thận (`eGFR ≥ 30 / < 30`, `eGFR ≥ 15 / < 15`) và chống chỉ định (`severe_milk_protein_allergy`, `hypersensitivity_atropine`, `hypersensitivity_dupilumab`, `history_cholestatic_jaundice_hepatic_impairment`) trỏ về `'byt.copd.2026.triple_therapy_indication'`, `'byt.copd.2026.bronchodilator_list'`, `'fda.copd.dupilumab_dose'` hoặc `'gold.copd.2026.azithromycin_safety'` — trong đó nội dung `quote` chỉ liệt kê tên thuốc/liều dùng và **hoàn toàn không chứa bất kỳ từ nào về mức lọc cầu thận, lactose/đạm sữa, atropine hay vàng da ứ mật**!
     - Đáng chú ý, thư viện PDF cục bộ đã có sẵn đúng trang chuẩn: `FDA_label_azithromycin.pdf` (**PDF p. 5**, §4.1–4.2 Contraindications: quá mẫn macrolide/ketolide & tiền sử vàng da ứ mật/rối loạn chức năng gan; **PDF p. 11 & p. 15**, §8.6/§12.3 Renal Impairment) và `FDA_label_dupilumab.pdf` (**PDF p. 11**, §4 Contraindications).
  2. **Lỗi số trang PDF & chất lượng trích dẫn trong [kb/citations/copd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/copd.json)**:
     - Mục `gold.copd.2026.initial_group_e` (dòng 113–122) ghi `"pdfPage": 75` với câu quote bị cắt đầu/cuối `"hrane systematic review and network meta-analysis... highest ranked treatme"`, nhưng trang PDF 75 của `GOLD_2026_Report.pdf` không chứa đoạn văn này.
     - Mục `byt.copd.2026.gold_classification` (dòng 41) dính nguyên chuỗi watermark cá nhân của hệ thống văn bản Bộ Y tế: `"ngoctlv.kcb_Truong Le Van Ngoc_14/07/2026 11:29:27"`.
     - Nhiều mục khác bị cắt cụt giữa từ tiếng Việt/Anh (`"ce of non -fully"`, `"hở càng nhi ều"`, `"g có đợt cấp"`, `"ởi trị"`, `"oặc cả hai... thông khí nhân tạ"`).
- **Khắc phục**: Tạo các mục trích dẫn chuẩn từ đúng §4 / §8.6 của các nhãn FDA và Phụ lục 1/10 QĐ 2131/QĐ-BYT 2026 để gán đúng cho `renal` & `contraindications`; sửa đúng `pdfPage` của `gold.copd.2026.initial_group_e`; xóa sạch watermark cá nhân và biên tập lại các chuỗi quote bị cắt dở từ.

---

#### [COPD-R4-R2-11] `MAJOR` | Clinical Preset Safety — Preset cấp cứu nội viện `copd_preset_inpatient_exac_0245` thiếu trường `setting: 'inpatient'`, làm mất dự phòng VTE (LMWH), sai thời gian kháng sinh và phát nhầm lệnh gọi xe cứu thương chuyển từ phòng khám

- **Thành phần**: [`copd_preset_inpatient_exac_0245`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/presets.ts#L103-L134) & [AppShell.tsx](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L88)
- **Phát hiện & Bằng chứng Runtime**:
  - Khác với [hf/presets.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/hf/presets.ts#L80) khai báo rõ `setting: 'inpatient'`, preset `copd_preset_inpatient_exac_0245` (*"Đợt cấp COPD nội viện – Ca chuẩn on-call 02:45: Nam 68 tuổi, giường 08 khoa Nội hô hấp..."*) tại [copd/presets.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/presets.ts#L103-L134) bỏ quên thuộc tính `setting`.
  - Khi người dùng bấm chọn ca này trên giao diện, [AppShell.tsx](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L88) chạy `preset.setting ?? 'outpatient'` nên đánh giá bệnh nhân đang nằm giường 08 khoa Nội hô hấp như một ca **khám ngoại trú**!
  - **Runtime `evaluate()` đối chiếu trực tiếp**:
    - Rơi mất hoàn toàn `[START] rec_copd_vte_prophylaxis` (Enoxaparin dự phòng huyết khối tĩnh mạch sâu);
    - Rơi mất hoàn toàn `[MONITOR] rec_copd_discharge_checklist`;
    - Đổi thời gian kháng sinh thành **`"5–7 ngày (ngoại trú theo BYT)"`** thay vì **`"7–10 ngày (đợt cấp nặng nội trú theo BYT)"`**;
    - Phát nhầm thẻ `[REFER] rec_copd_outpatient_emergency_refer`: *"Người bệnh đang ở bối cảnh khám ngoại trú có dấu hiệu suy hô hấp cấp... chuyển ngay vào Khoa Cấp cứu / ICU bằng xe cứu thương"*!
- **Khắc phục**: Thêm `setting: 'inpatient'` vào `copd_preset_inpatient_exac_0245` trong [presets.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/presets.ts#L105).

---

#### [COPD-R4-R2-12] `MAJOR` | Pharmacokinetic DDI — Rule kê đơn và duy trì `Roflumilast` bỏ qua hoàn toàn các chất ức chế mạnh CYP1A2 / CYP3A4 (`fluvoxamine` tăng AUC +156%) + Thiếu `ritonavir` / `Paxlovid` / `voriconazole` / thuốc tránh thai uống trong `ix.roflumilast_cyp_inhibitors`

- **Thành phần**:
  - [`copd.followup.roflumilast_indication` & `copd.followup.roflumilast_continue`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.oral.ts)
  - [`getRoflumilastContraInfo()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.oral_safety.ts) & [`ix.roflumilast_cyp_inhibitors`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/respiratory.json)
- **Đối chiếu Y văn gốc**:
  - **FDA Daliresp Label** (`FDA_label_roflumilast.pdf`, **PDF p. 6** §7.2–7.3 & **PDF p. 14** §12.3 *Drug Interactions*): Chất ức chế kép CYP1A2/CYP3A4 `fluvoxamine` làm tăng AUC roflumilast **+156%** và chất chuyển hóa có hoạt tính roflumilast N-oxide **+52%**; `ketoconazole` tăng AUC **+99%**; `cimetidine` **+85%**; `erythromycin` **+70%**; `enoxacin` **+56%**; thuốc tránh thai uống chứa `gestodene / ethinyl estradiol` làm tăng AUC roflumilast **+51%** (§7.3: *"Co-administration of DALIRESP with oral contraceptives containing gestodene and ethinyl estradiol will increase systemic exposure to roflumilast and may result in increased adverse reactions"*).
- **Bằng chứng Runtime `evaluate()`**:
  - Bệnh nhân đang uống `Daliresp 500 mcg` + `Fluvoxamine 50mg`: Mặc dù `ix.roflumilast_cyp_inhibitors` phát cảnh báo `[critical]` khuyên tránh dùng kèm `fluvoxamine`, `copd.followup.roflumilast_continue` vẫn phát **`[CONTINUE] Duy trì liều điều trị Roflumilast 500 mcg/ngày`** với `warnings: undefined` và lời khẳng định sai *"Người bệnh đang sử dụng Roflumilast không có chống chỉ định"*!
  - Nếu dùng kèm `nirmatrelvir_ritonavir` (Paxlovid), `ritonavir`, `voriconazole` hoặc `posaconazole`, cả cảnh báo tương tác cũng im lặng hoàn toàn (`alerts = []`)!
- **Khắc phục**: Đưa `fluvoxamine`, `enoxacin` vào diện chặn `AVOID`/`HOLD` (hoặc cảnh báo nguy cơ cao bắt buộc trong `warnings` của `roflumilast_indication` & `roflumilast_continue` đối với `cimetidine`, `ketoconazole`, `itraconazole`, `voriconazole`, `posaconazole`, `clarithromycin`, `erythromycin`, `ritonavir`, `nirmatrelvir_ritonavir`, `cobicistat`, `ethinyl_estradiol`), đồng thời cập nhật `ix.roflumilast_cyp_inhibitors` trong [respiratory.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/respiratory.json).

---

#### [COPD-R4-R2-13] `MAJOR` | Biologic Therapy Safety — Không phát hiện trùng lặp 2 thuốc sinh học đồng thời (`Dupilumab + Mepolizumab`), thiếu sàng lọc ký sinh trùng *Strongyloides* / viêm túi mật cấp trên `Dupilumab`, và rơi mất cảnh báo thai kỳ/vắc xin sống trên `biologic_continue`

- **Thành phần**: [`rules.escalation.biologics.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.biologics.ts) & [`duplicateRules.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/duplicateRules.ts)
- **Phát hiện & Bằng chứng Runtime / Nhãn FDA**:
  1. **Trùng lặp 2 kháng thể đơn dòng hô hấp (`currentMeds: ['dupilumab', 'mepolizumab']`)**: `evaluate()` trả về **`0` cảnh báo trùng lặp** và **`0` lệnh `STOP`**, chỉ phát `CONTINUE` cho thuốc đầu tiên (`dupilumab`), trái ngược với chính quy tắc an toàn không phối hợp kép hai thuốc sinh học.
  2. **Thiếu cảnh báo ký sinh trùng giun sán (*Strongyloides*) & tác dụng phụ đặc thù COPD theo nhãn FDA Dupixent**:
     - `FDA_label_dupilumab.pdf` (**PDF p. 13**, §5.9 *Parasitic (Helminth) Infections*): *"Patients with known helminth infections were excluded from participation in clinical studies. Treat patients with pre-existing helminth infections before initiating therapy with DUPIXENT."* Tại Việt Nam — vùng dịch tễ lưu hành rất cao giun lươn *Strongyloides stercoralis* (thường gây tăng bạch cầu ái toan máu dễ nhầm với kiểu hình Type 2 của COPD, lại hay dùng corticoid đợt cấp dễ bùng phát hội chứng tăng nhiễm giun lươn tử vong!) — việc tầm soát/tẩy ký sinh trùng trước khi kết luận tăng BCAT máu ≥ 300 /µL để tiêm Dupilumab là yêu cầu dược lâm sàng cực kỳ thiết thực.
     - Nhãn FDA Dupixent (**PDF p. 20**, §6.1 *COPD Clinical Trials*) cũng ghi nhận biến cố **viêm túi mật cấp (acute cholecystitis: 0.6% so với 0.1% giả dược)**, viêm kết mạc/giác mạc và u hạt tăng bạch cầu ái toan mạch máu (EGPA); đồng thời 2 RCT nền tảng BOREAS/NOTUS (**PDF p. 57**, §14.11) tuyển bệnh nhân có `post-BD FEV₁ 30%–70% predicted` (khi `evaluate()` chạy ở bệnh nhân GOLD 1 `FEV₁ = 84%` vẫn gợi ý mà chưa ghi chú giới hạn bằng chứng này).
  3. **Rơi cảnh báo khi duy trì (`copd.followup.biologic_continue`, dòng 154–186)**: Quên hoàn toàn cảnh báo thai kỳ/cho con bú (`isPregOrLact`) và cảnh báo **tránh tiêm vắc xin sống giảm độc lực** vốn có ở thẻ khởi trị.
- **Khắc phục**: Thêm rule phát hiện trùng lặp nhóm `RESPIRATORY_BIOLOGIC_IDS` trong `duplicateRules.ts` + rule `STOP` thuốc sinh học thừa; bổ sung cảnh báo tầm soát giun sán/*Strongyloides*, viêm túi mật cấp, viêm kết mạc/giác mạc, ghi chú dải `FEV₁ 30–70%` của BOREAS/NOTUS, và đồng bộ cảnh báo thai kỳ/vắc xin sống vào `biologic_continue`.

---

### 3.3. Nhóm Mức độ Nhẹ (`MINOR` — 5 phát hiện)

---

#### [COPD-R4-R2-14] `MINOR` | Systemic Steroid Dose Parsing & Potency Equivalence — Báo nhầm `UPTITRATE` khi truyền liều chuỗi `'40 mg'` hoặc `Methylprednisolone 32 mg` uống (`= 40 mg` prednisone tương đương)

- **Thành phần**: [`copd.inpatient.systemic_steroid`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.meds.ts#L121-L206)
- **Bằng chứng**:
  1. Kiểu `CurrentMed.dose` cho phép `string | number`, nhưng dòng 148 viết `typeof sameMed?.dose === 'number' ? sameMed.dose : undefined`. Khi truyền `{ drugId: 'prednisolone', dose: '40 mg', freq: 'QD' }`, `curDoseNum` thành `undefined` -> phát nhầm **`[UPTITRATE] Tăng liều Corticoid toàn thân đợt cấp lên 40 mg/ngày`** kèm lời dặn sai *"phải lùi về liều nền duy trì trước đó"*.
  2. Dòng 153 so sánh mg thô với `predMin` (`30` hoặc `40` tùy cấu hình) mà chưa quy đổi tương đương hoạt lực glucocorticoid (`methylprednisolone 32 mg = prednisone 40 mg`, `dexamethasone 6 mg = prednisone 40 mg`).
- **Khắc phục**: Parse số thực từ chuỗi `'40 mg'` và nhân hệ số quy đổi tương đương Prednisone (`prednisolone × 1`, `methylprednisolone × 1.25`, `hydrocortisone × 0.25`, `dexamethasone × 6.67`).

---

#### [COPD-R4-R2-15] `MINOR` | Safety Gate Warning Visibility — Chìm hoàn toàn cảnh báo thận trọng suy thận nặng (`eGFR < 30 mL/phút`) của nhóm LAMA thải trừ qua thận (`Tiotropium`, `Glycopyrronium`) và `Azithromycin` (`eGFR 10–15 mL/phút`)

- **Thành phần**: [gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts) & các rule khởi trị/nâng bậc LAMA, `azithromycin_prophylaxis`
- **Bằng chứng Runtime**: Ở bệnh nhân `eGFR = 20 mL/phút/1.73m²` được kê `[START] Breztri Aerosphere` (`budesonide_glycopyrronium_formoterol`) hoặc `Spiolto Respimat` (`tiotropium_olodaterol`), hoặc bệnh nhân `eGFR = 12 mL/phút/1.73m²` được gợi ý `[CONSIDER] Azithromycin`, mảng `warnings` hoàn toàn **không có dòng lưu ý suy thận nào**, mặc dù chính tệp KB ghi rõ phơi nhiễm toàn thân của tiotropium/glycopyrronium tăng 1.4–2.2 lần khi `eGFR < 30` (chỉ dùng khi lợi ích vượt nguy cơ, theo dõi sát tác dụng kháng cholinergic toàn thân — BYT 2023 tr. 18 & nhãn thuốc) và AUC azithromycin tăng 35% ở `GFR 10–80` / thận trọng khi `< 15` (FDA Zithromax §8.6 **PDF p. 11**). Nguyên nhân là `gates.ts` bỏ qua các dải `renal` không gắn cờ `action`.
- **Khắc phục**: Đẩy `band.adjustment` của các dải suy thận nặng (`max < 30` không gắn `action: 'ok'`) vào `rec.warnings` hoặc bổ sung trực tiếp trong `getLamaWarnings(ctx)` và `azithromycin_prophylaxis`.

---

#### [COPD-R4-R2-16] `MINOR` | Azithromycin Prophylaxis Screening — Chưa sàng lọc chống chỉ định tiền sử vàng da ứ mật / bệnh gan nặng, cảnh báo bệnh nhược cơ (*Myasthenia Gravis*) và tương tác `Warfarin` / `Digoxin`

- **Thành phần**: [`getAzithromycinContraReasons()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/helpers.oral_safety.ts) & [`rules.escalation.oral.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.escalation.oral.ts)
- **Đối chiếu Nhãn FDA Zithromax** (`FDA_label_azithromycin.pdf`):
  - **§4.2 Contraindications (PDF p. 5)**: *"ZITHROMAX is contraindicated in patients with a history of cholestatic jaundice/hepatic dysfunction associated with prior use of azithromycin."*
  - **§5.7 Exacerbation of Myasthenia Gravis (PDF p. 7)**: Làm nặng triệu chứng nhược cơ hoặc khởi phát hội chứng nhược cơ cấp suy hô hấp (cực kỳ nguy hiểm trên bệnh nhân COPD!).
  - **§7.2 Warfarin & §7.3 Digoxin (PDF p. 10)**: Kéo dài PT/INR gây xuất huyết khi dùng kèm kháng vitamin K và tăng nồng độ digoxin qua ức chế P-glycoprotein ruột.
- **Khắc phục**: Bổ sung kiểm tra bệnh gan nặng / xơ gan mất bù / tiền sử vàng da ứ mật do macrolide vào `getAzithromycinContraReasons()`; thêm cảnh báo nhược cơ và theo dõi INR / nồng độ Digoxin vào `warnings` khi phát hiện `warfarin`/`acenocoumarol`/`digoxin`.

---

#### [COPD-R4-R2-17] `MINOR` | UI & Clinical Note Safety Formatting — Giữ nguyên chuỗi `[Liều: ...]` trên các khuyến cáo đã bị hạ cấp sang `HOLD` / `AVOID` / `DEFER`

- **Thành phần**: [gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts), [note.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/note.ts), [PlanRow.tsx](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/PlanRow.tsx)
- **Bằng chứng Runtime**: Ở ca COPD + HFrEF có nhịp chậm `HR = 42 bpm`, `gates.ts` chuyển `Bisoprolol` thành `HOLD`, nhưng `noteText` vẫn xuất:
  `* TẠM HOÃN / TẠM NGƯNG: - Bisoprolol [Liều: 1.25 mg x 1 lần/ngày (uống) - uống buổi sáng...]` — rất dễ gây sai sót y lệnh khi bác sĩ sao chép dán vào bệnh án điện tử EMR.
- **Khắc phục**: Ẩn chuỗi `[Liều: ...]` trên `note.ts` và `PlanRow.tsx` (hoặc xóa `rec.dose` trong `gates.ts`) khi `action` là `'AVOID'`, `'HOLD'` hoặc `'DEFER'`.

---

#### [COPD-R4-R2-18] `MINOR` | Clinical Reference Matrix — Ma trận thiết bị `copdMatrixDevices` có cột cấp cứu nội viện nhưng thiếu dòng thiết bị Phun khí dung (Nebulizer) và thiếu ghi chú tương tác CYP3A4 trên `Anoro` / `Trelegy`

- **Thành phần**: [matrices.devices.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/matrices.devices.ts)
- **Bằng chứng**: Cột 4 của bảng là *"Đợt cấp nặng / Thở nhanh mệt (Nội viện / Cấp cứu)"* và cả 6 dòng trong bảng đều viết *"ưu tiên khí dung SABA/SAMA trước"*, nhưng bảng lại không có dòng **Máy phun khí dung (Nebulizer)** để tra cứu nhanh 2 quy tắc sống còn: (1) Chạy bằng máy nén khí trời thay vì oxy dòng cao giữ đích SpO₂ 88–92%; (2) Dùng ống ngậm miệng thay vì mặt nạ facemask và tránh Ipratropium khi có glôcôm góc đóng / bí tiểu (GOLD 2026 **PDF p. 114, p. 157**; BYT 2131/2026 **PDF tr. 35–36, tr. 68**). Đồng thời dòng `Anoro Ellipta` và `Trelegy Ellipta` chưa ghi chú tránh phối hợp chất ức chế mạnh CYP3A4.
- **Khắc phục**: Thêm dòng `Máy phun khí dung (Nebulizer – Salbutamol ± Ipratropium)` và dòng `pMDI + Buồng đệm có van (ICS+LABA / SABA)` cùng ghi chú CYP3A4 cho `Anoro`/`Trelegy`.

---

### 3.4. Nhóm Đề xuất Tối ưu hóa (`SUGGESTION` — 3 phát hiện)

---

#### [COPD-R4-R2-19] `SUGGESTION` | International Profile Completeness — Đề cập tùy chọn khí dung `Ensifentrine` (ức chế kép PDE3/PDE4) trong `profileDiff.INTL` / `profileDiff.US` của nhánh khó thở dai dẳng trên nền LABA+LAMA

- **Thành phần**: [`copd.followup.dyspnea_on_laba_lama`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.followup.stepup_bronch.ts#L99-L125)
- **Căn cứ**: GOLD 2026 (Figure 3.9 **PDF p. 77** & Appendix 3 **PDF p. 163**) bổ sung khuyến cáo *"Consider adding ensifentrine (if available)"* cho người bệnh còn khó thở dai dẳng dù đã dùng LABA+LAMA. Do thuốc đã được FDA phê duyệt tại Mỹ nhưng chưa lưu hành tại Việt Nam và chưa có trong QĐ 2131/QĐ-BYT 2026, việc ghi nhận trong `profileDiff.INTL` / `US` (và ghi rõ chưa lưu hành tại `profileDiff.VN`) sẽ giúp phân hệ đạt độ chính xác 100% đa cấu hình.

---

#### [COPD-R4-R2-20] `SUGGESTION` | Automated Anticoagulant Safety Integration — Tạo `kb/drugs/enoxaparin.json` & `heparin.json` và gắn `drugId` cho `copd.inpatient.vte_prophylaxis`

- **Thành phần**: [`copd.inpatient.vte_prophylaxis`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.inpatient.vte_discharge.ts#L40-L130)
- **Căn cứ**: Hiện tại `rec_copd_vte_prophylaxis` để trống `drugId: undefined`. Việc tạo tệp KB cho `enoxaparin` / `heparin` và gắn `drugId` sẽ kích hoạt tự động màng lọc dị ứng thuốc (bao gồm tiền sử giảm tiểu cầu do heparin HIT trong `allergies`), chống chỉ định xuất huyết và kiểm tra trùng lặp kháng đông trên toàn hệ thống.

---

#### [COPD-R4-R2-21] `SUGGESTION` | Pharmacotherapy Counseling in Non-Pharm Rules — Cá thể hóa cảnh báo an toàn cho thuốc cai thuốc lá (`Bupropion`, `Varenicline`, `NRT`) và phân biệt vắc xin Zona bất hoạt (`Shingrix`)

- **Thành phần**: [`copd.nonpharm.smoking_cessation` & `copd.nonpharm.vaccinations`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/copd/rules.nonpharm.ts)
- **Căn cứ**: `Bupropion` làm hạ ngưỡng co giật (cần cảnh báo tránh dùng khi bệnh nhân COPD đang dùng `Theophylline`, corticosteroid toàn thân hoặc có tiền sử co giật); `Varenicline` thải qua thận cần giảm liều tối đa `0.5 mg x 2 lần/ngày` khi `eGFR < 30 mL/phút`; và ở mục tiêm chủng Zona nên ghi rõ *"vắc xin Zona tái tổ hợp bất hoạt (Shingrix)"* để tránh nhầm với vắc xin sống giảm độc lực ở bệnh nhân đang dùng `Dupilumab` hoặc corticoid liều cao.

---

## 4. Ma trận Kiểm toán Toàn diện Dược thư & An toàn Thuốc COPD (Comprehensive Clinical Pharmacy Audit Matrix)

Bảng dưới đây tổng hợp kết quả kiểm toán từng nhóm thuốc điều trị COPD và bệnh đồng mắc đối chiếu trực tiếp giữa mã nguồn + KB hiện tại với **GOLD 2026**, **BYT QĐ 2131/QĐ-BYT 2026**, **GINA 2026** và **Nhãn thuốc FDA**:

| Nhóm dược lý / Hoạt chất | Liều khởi đầu / Duy trì / Tối đa | Hiệu chỉnh Thận (`eGFR` / Lọc máu) | Hiệu chỉnh Gan (`Child-Pugh`) | Thai kỳ & Cho con bú | Dụng cụ hít & Tá dược (Lactose / Mặt nạ / Khí nén) | Tương tác thuốc (DDI) & Kéo dài QTc | Trích dẫn KB (`citationIds`) | Kết luận Kiểm toán R2 |
|---|---|---|---|---|---|---|---|---|
| **SABA** (`salbutamol`, `terbutaline`, `fenoterol`) | Cắt cơn pMDI 100 mcg × 2 nhát PRN; Đợt cấp khí dung 2.5 mg q1h × 2–3 liều giờ đầu, sau q2–6h (BYT tr. 35–36, GOLD p. 114); cảnh báo lạm dụng > 2 lần/tuần hoặc ≥ 3 bình/năm | Không chỉnh liều | Không chỉnh liều | An toàn ưu tiên cắt cơn trong thai kỳ & cho con bú | Đã nhắc chạy khí dung bằng **máy nén khí trời** giữ SpO₂ 88–92%; thiếu dòng Nebulizer trong `copdMatrixDevices` (`R4-R2-18`) | Theo dõi hạ K⁺ máu & nhịp nhanh khi phối hợp corticoid / lợi tiểu / theophylline | Đạt | **Đạt** (trừ `R4-R2-18`) |
| **SAMA đơn chất** (`ipratropium`) | pMDI 20 mcg × 2 nhát q6–8h; Khí dung 0.5 mg q4–8h đợt cấp | Không chỉnh liều | Không chỉnh liều | Thận trọng thông thường | Đã chặn pha kèm & cảnh báo tránh mặt nạ khi glôcôm góc đóng / bí tiểu | Đã chặn dùng định kỳ chồng lên LAMA (`sama_on_lama_stop`) | Đạt | **Đạt** cho đơn chất |
| **SAMA + SABA FDC** (`Combivent`, `Berodual`) | BYT QĐ 2131/2026 Phụ lục 1 (tr. 68): ống khí dung 2.5mg/0.5mg; MDI 50/20 mcg | — | — | — | **THIẾU HOÀN TOÀN** trong KB & `SAMA_MONO_IDS` -> bỏ lọt `STOP` trong glôcôm góc đóng cấp & trùng lặp LAMA | Bỏ lọt quá liều kháng muscarinic khi dùng kèm LAMA | Thiếu tệp KB | **FAIL (`COPD-R4-R2-04`, `R4-R2-09`)** |
| **LABA đơn chất** (`olodaterol`, `indacaterol`, `salmeterol`, `vilanterol`, `formoterol`) | Olodaterol 5 mcg QD; Indacaterol 150–300 mcg QD; Salmeterol 50 mcg BID; Formoterol 4.5–12 mcg BID | Không chỉnh liều | Thận trọng suy gan nặng với salmeterol/indacaterol | Có đủ `pregnancy` & `lactation` (trừ thiếu `formoterol.json`) | Olodaterol SMI không lactose; Indacaterol/Salmeterol DPI có lactose | `salmeterol` + CYP3A4 mạnh là **Chống chỉ định** (BYT tr. 120 STT 34); thiếu `roxithromycin` | **Sai trích dẫn** `renal`/`contra` trên 4 tệp; **thiếu `formoterol.json`** | **FAIL (`R4-R2-02`, `R4-R2-09`, `R4-R2-10`)** |
| **LAMA đơn chất** (`tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`) | Respimat 2.5 mcg × 2 nhát QD; HandiHaler 18 mcg QD; Umeclidinium 62.5 mcg QD; Glycopyrronium 50 mcg QD; Aclidinium 322/400 mcg BID | `tiotropium` & `glycopyrronium` tăng AUC 1.4–2.2× khi `eGFR < 30` -> **bị `gates.ts` làm chìm cảnh báo** (`R4-R2-15`) | Không chỉnh liều | Đã bổ sung đủ `pregnancy` & `lactation` | Nội trú phản vệ đạm sữa vẫn phát `[CONTINUE] Spiriva HandiHaler 18 mcg` (`R4-R2-07`) | Đã chặn trùng lặp 2 LAMA (trừ các alias FDC bị mù) | **Sai trích dẫn** `renal`/`contra` trên cả 4 tệp | **Cần sửa (`R4-R2-07`, `R4-R2-10`, `R4-R2-15`)** |
| **LABA + LAMA FDC** (`Spiolto`, `Anoro`, `Ultibro`) | Spiolto 2.5/2.5 × 2 nhát QD; Anoro 62.5/25 × 1 hít QD; Ultibro 110/50 × 1 viên QD | Spiolto & Ultibro cần hiện cảnh báo khi `eGFR < 30` (`R4-R2-15`) | Anoro thận trọng suy gan nặng | Đã có đủ `pregnancy` & `lactation` | **Alias `indacaterol_glycopyrronium` bị mù -> viết đè thành `[CONTINUE]` ngay khi glôcôm góc đóng cấp!** (`R4-R2-01`) | `Anoro` chứa `vilanterol` chưa được loại trừ khi dùng kèm CYP3A4 inhibitor mạnh (`R4-R2-02`) | **Sai trích dẫn** `renal`/`contra` | **FAIL (`R4-R2-01`, `R4-R2-02`, `R4-R2-10`)** |
| **ICS + LABA FDC** (`Symbicort`, `Seretide`, `Relvar`, `Foster`) | Symbicort COPD cố định `160/4.5 mcg × 2 nhát BID` (BYT tr. 69); Seretide `50/250–50/500 BID` | Không chỉnh liều | Tăng phơi nhiễm fluticasone furoate ở Child-Pugh B/C | Đã có đủ `pregnancy` & `lactation` | Ca COPD+Hen có dị ứng sữa vẫn phát `[CONTINUE] Symbicort Turbuhaler` kèm chữ MART (`R4-R2-07`) | **Vẫn phát `[CONTINUE] Seretide` trên nền `clarithromycin` / `roxithromycin`!** (`R4-R2-02`) | Tham chiếu gãy `"formoterol"` (`R4-R2-09`) | **FAIL (`R4-R2-02`, `R4-R2-07`, `R4-R2-09`)** |
| **Triple ICS + LAMA + LABA** (`Trelegy`, `Breztri`, `Trimbow`) | Trelegy `100/62.5/25 × 1 hít QD`; Breztri `160/7.2/4.8 × 2 nhát BID`; Trimbow `100/10/6 × 2 nhát BID` | Breztri & Trimbow chứa `glycopyrronium` bị chìm cảnh báo khi `eGFR < 30` (`R4-R2-15`) | Đã cảnh báo tốt tăng phơi nhiễm ICS 2.5–3× ở Child-Pugh B/C (`getHepaticTripleWarnings`) | Đã có đủ `pregnancy` & `lactation` | **Alias `beclometasone_formoterol_glycopyrronium` bị viết đè thành `[CONTINUE]` khi glôcôm góc đóng** (`R4-R2-01`); nội trú `STOP` Trelegy không có thuốc thay thế (`R4-R2-07`) | **Chủ động `START` & `UPTITRATE` `Trelegy` ngay trên nền `clarithromycin` / `itraconazole` / `Paxlovid`!** (`R4-R2-02`) | Tham chiếu gãy `"formoterol"` (`R4-R2-09`); **sai trích dẫn** `renal`/`contra` (`R4-R2-10`) | **FAIL (`R4-R2-01`, `R4-R2-02`, `R4-R2-07`, `R4-R2-09`, `R4-R2-10`)** |
| **PDE4i – `Roflumilast`** (*Daliresp*) | Khởi đầu `250 mcg QD × 4 tuần`, sau đó `500 mcg QD` (FDA Daliresp §2, GOLD p. 78) — **Chuẩn xác** | Suy thận nặng (`eGFR < 30`) thận trọng (AUC giảm nhẹ nhưng dung nạp kém hơn) | Đã chặn đúng **Child-Pugh B/C** & cảnh báo **Child-Pugh A** (AUC +51%) | Đã chặn đúng `pregnant` & `breastfeeding` | Viên uống; đã sàng lọc sụt cân / BMI < 18.5 & trầm cảm/ý định tự sát | **Vẫn phát `CONTINUE` *"không có chống chỉ định"* trên nền `fluvoxamine` (AUC +156%)**; thiếu `Paxlovid`/`voriconazole`/thuốc tránh thai (`R4-R2-12`) | Đạt | **Cần sửa (`COPD-R4-R2-12`)** |
| **Macrolide dự phòng – `Azithromycin`** | `250 mg/ngày` hoặc `500 mg × 3 lần/tuần` tới 1 năm (GOLD p. 77, BYT tr. 30) — **Chuẩn xác** | Đã chặn `eGFR < 10` / lọc máu; dải `10–15` bị chìm cảnh báo (`R4-R2-15`) | **Thiếu chống chỉ định tiền sử vàng da ứ mật / bệnh gan nặng** (FDA §4.2, `R4-R2-16`) | Đã có cảnh báo hội chẩn Sản – Hô hấp khi mang thai | Đã sàng lọc giảm thính lực, NTM, QTc > 450/470 ms | **BỎ SÓT `Domperidone` (Chống chỉ định phối hợp STT 3 QĐ 2131/2026 tr. 107!)** (`R4-R2-05`); thiếu cảnh báo nhược cơ & `warfarin`/`digoxin` (`R4-R2-16`) | **Sai trích dẫn** cho chống chỉ định vàng da ứ mật (`R4-R2-10`) | **FAIL (`COPD-R4-R2-05`, `R4-R2-10`, `R4-R2-16`)** |
| **Sinh học – `Dupilumab` / `Mepolizumab`** | Dupilumab `300 mg TDD q2w`; Mepolizumab `100 mg TDD q4w` (chỉ chọn 1 thuốc tối ưu, không kê kép) | Không cần chỉnh liều thận | Không cần chỉnh liều gan | Khởi trị có cảnh báo thai kỳ; **`biologic_continue` bỏ quên cảnh báo thai kỳ & vắc xin sống** (`R4-R2-13`) | Bút tiêm dưới da | **Không phát hiện trùng lặp `dupilumab + mepolizumab` đang dùng**; thiếu sàng lọc giun lươn *Strongyloides* & viêm túi mật cấp (`R4-R2-13`) | **Sai trích dẫn** `renal`/`contra` (`R4-R2-10`) | **Cần sửa (`COPD-R4-R2-10`, `R4-R2-13`)** |
| **Methylxanthine** (`theophylline`, `aminophylline`) | Không khuyến cáo trong đợt cấp (`STOP` đúng); duy trì `< 10 mg/kg/ngày` ưu tiên đổi sang LABA/LAMA | Thận trọng tích lũy chất chuyển hóa ở suy thận nặng | Đã phát `REDUCE` khi bệnh gan / xơ gan / suy tim / tuổi ≥ 65 | Có đủ `pregnancy` & `lactation` | Viên phóng thích chậm / tiêm | Đã cảnh báo tương tác tăng độc tính co giật/loạn nhịp với quinolone/macrolide/cimetidine; nên thêm cảnh báo hạ ngưỡng co giật với `bupropion` (`R4-R2-21`) | Đạt | **Đạt** |
| **Corticosteroid toàn thân đợt cấp** (`prednisolone`, `methylprednisolone`) | `30–40 mg/ngày × 5 ngày` (BYT tr. 35, GOLD p. 115) | Không chỉnh liều ngắn ngày | Không chỉnh liều | Dùng ngắn ngày cấp cứu được khi cần | Uống buổi sáng hoặc TM khi không uống được | Theo dõi K⁺ máu & đường huyết tốt; lỗi nhỏ parse chuỗi `'40 mg'` & quy đổi `32 mg` Medrol (`R4-R2-14`) | Đạt | **Đạt** (trừ `R4-R2-14`) |
| **Kháng sinh đợt cấp** (Anthonisen / *Pseudomonas*) | Ngoại trú `5–7 ngày`, Nội trú `7–10 ngày` (BYT tr. 35, 38) — bị lệch ở preset `0245` do thiếu `setting: 'inpatient'` (`R4-R2-11`) | **Bỏ trống hoàn toàn cảnh báo chỉnh liều ở `eGFR 30–50 mL/phút`** (trái Phụ lục 10 BYT tr. 102–104 cho Levofloxacin/Ciprofloxacin, `R4-R2-08`) | Thận trọng macrolide/beta-lactam liều cao | Tránh Fluoroquinolone / Tetracycline trong thai kỳ | Uống / Truyền TM | **Thiếu cảnh báo đứt gân Achilles do Quinolone + Steroid ở tuổi ≥ 60** & thiếu cảnh báo tăng INR với `Warfarin` (`R4-R2-08`) | Đạt | **Cần sửa (`COPD-R4-R2-08`, `R4-R2-11`)** |
| **Dự phòng VTE nội viện** (`LMWH` / `UFH`) | Enoxaparin TDD 1 lần/ngày; đổi sang UFH TDD khi `eGFR < 30` hoặc lọc máu | Đã phân tầng tốt `eGFR < 30` & `onDialysis` | Thận trọng rối loạn đông máu xơ gan | LMWH an toàn trong thai kỳ | Tiêm dưới da | Đã tránh kê trùng khi đang dùng kháng đông và chuyển sang IPC khi xuất huyết; nên gắn `drugId` (`R4-R2-20`) | Đạt | **Đạt** (đề xuất `R4-R2-20`) |
| **Chẹn Beta & Thuốc ức chế TKTƯ ở bệnh đồng mắc** | Pha ổn định chuyển sang `Bisoprolol` khởi đầu `1.25 mg QD` | Bisoprolol thận trọng khi suy thận nặng | Carvedilol chống chỉ định suy gan nặng | — | — | **Cắt đột ngột `Carvedilol` không thuốc thay thế ở HFrEF trong đợt cấp COPD (`R4-R2-03`)**; **chỉ `STOP` 1 thuốc ức chế TKTƯ đầu tiên trong toan CO₂ (`R4-R2-06`)** | Đạt | **FAIL (`COPD-R4-R2-03`, `R4-R2-06`)** |

---

## 5. Lộ trình Khắc phục Ưu tiên trước Vòng Nghiệm thu Tiếp theo

1. **Ưu tiên P0 (Bắt buộc xử lý ngay 5 lỗi `CRITICAL`)**:
   - **Khắc phục `COPD-R4-R2-01`**: Bổ sung suy luận thành phần LAMA/LABA/ICS trực tiếp từ `drug.components` / `drug.class` trong `getInhalerProfile()` + bổ sung toàn bộ alias đảo chiều FDC, đồng thời vá `mergeClassResolver.ts` không cho phép gộp `START` đơn chất/phối hợp đôi thành `CONTINUE` một FDC chứa thêm hoạt chất lớp khác (như LAMA đang chống chỉ định).
   - **Khắc phục `COPD-R4-R2-02`**: Tích hợp `hasStrongCyp3a4Inhibitor(ctx)` vào toàn bộ hàm chọn thuốc khởi trị, nâng bậc và duy trì COPD để chuyển sang bình hít nền `formoterol` / `olodaterol`, và bổ sung `'roxithromycin'` cùng các chất ức chế protease HIV/HCV vào `ix.ics_laba_strong_cyp3a4`.
   - **Khắc phục `COPD-R4-R2-03`**: Sửa `rules.safety.systemic.ts` không phát `STOP` cắt đứt đột ngột `Carvedilol` không thuốc thay thế ở bệnh nhân HFrEF/CAD huyết động ổn định trong đợt cấp COPD; đồng bộ xử lý cổng `HR < 50 bpm` và bổ sung cảnh báo chẹn beta ở người bệnh COPD phụ thuộc oxy theo BYT QĐ 2131/2026 tr. 53.
   - **Khắc phục `COPD-R4-R2-04`**: Bổ sung `ipratropium_salbutamol` (*Combivent*) và `ipratropium_fenoterol` (*Berodual*) vào `kb/drugs/`, `SAMA_CONTAINING_IDS`, `duplicateRules.ts` và các rule chống chỉ định glôcôm góc đóng / bí tiểu.
   - **Khắc phục `COPD-R4-R2-05`**: Đưa `'domperidone'` và đầy đủ các thuốc kéo dài QT thường gặp vào `QT_PROLONGING_DRUG_IDS` + thêm cặp tương tác chống chỉ định Macrolide + Domperidone vào `kb/interactions/respiratory.json` theo Phụ lục 11 STT 2–3 QĐ 2131/QĐ-BYT 2026.
2. **Ưu tiên P1 (Xử lý triệt để 8 lỗi `MAJOR`)**:
   - Chuyển `cns_depressant_hypercapnia_stop` sang multi-slot + thêm `pregabalin`/`gabapentin` (`R4-R2-06`); chuyển `HandiHaler`/`Turbuhaler` sang `SWITCH` SMI/pMDI + buồng đệm khi dị ứng đạm sữa và bổ sung thuốc thay thế nội viện khi `STOP` LAMA (`R4-R2-07`); nâng cảnh báo thận kháng sinh lên `eGFR < 50` + thêm cảnh báo đứt gân Achilles do Quinolone + Steroid ở người ≥ 60 tuổi & tương tác `Warfarin` (`R4-R2-08`); tạo `kb/drugs/formoterol.json` và kiểm định toàn vẹn `components` (`R4-R2-09`); sửa toàn bộ 17 tệp gán sai trích dẫn + sửa `pdfPage` & xóa watermark trong `kb/citations/copd.json` (`R4-R2-10`); thêm `setting: 'inpatient'` cho `copd_preset_inpatient_exac_0245` (`R4-R2-11`); liên kết DDI CYP1A2/CYP3A4 vào `roflumilast` (`R4-R2-12`); và chặn trùng lặp 2 thuốc sinh học + thêm sàng lọc *Strongyloides*/viêm túi mật cấp (`R4-R2-13`).
3. **Ưu tiên P2 (Hoàn thiện 5 lỗi `MINOR` & 3 `SUGGESTION`)**:
   - Parse chuỗi liều & quy đổi tương đương Prednisone (`R4-R2-14`), hiển thị cảnh báo thận `eGFR < 30` của LAMA (`R4-R2-15`), bổ sung chống chỉ định vàng da ứ mật/nhược cơ của Azithromycin (`R4-R2-16`), ẩn `[Liều:...]` trên thẻ `HOLD`/`AVOID` (`R4-R2-17`), bổ sung dòng Khí dung trong `copdMatrixDevices` (`R4-R2-18`), cùng các đề xuất `R4-R2-19..21`.
