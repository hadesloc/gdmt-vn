# Báo cáo Thẩm định Độc lập Dược lâm sàng – Phân hệ Hen phế quản (`asthma`) – Vòng 4 (Reviewer R2)

- **Vai trò:** Reviewer R2 – Dược sĩ Lâm sàng Độc lập (Independent Clinical Pharmacist)
- **Phân hệ kiểm định:** `asthma` (`src/modules/asthma/**`, `kb/drugs/*.json`, `kb/interactions/*.json`, `kb/thresholds/asthma.json`, `kb/citations/asthma.json`, cùng cơ chế an toàn thuốc dùng chung `src/engine/**` và bàn giao liên chuyên khoa `htn`, `gout`, `hf`, `copd`)
- **Ngày kiểm định:** 28/10/2026
- **Tài liệu gốc đối chiếu trực tiếp (Primary Sources):**
  1. **GINA 2026 Strategy Report** (`01_Noi_Khoa/Ho_Hap/GINA_2026_Strategy_Report.pdf`) & **GINA 2026 Summary Guide** (`GINA_2026_Summary_Guide.pdf`)
  2. **Bộ Y tế Việt Nam – QĐ 1851/QĐ-BYT (2020)**: *Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi* (`06_Viet_Nam/BYT_1851_2020_Hen_phe_quan_NL_va_TE_ge12.pdf`)
  3. **Bộ Y tế Việt Nam – QĐ 5850/QĐ-BYT (2021)**: *Quy trình lâm sàng chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi* (`06_Viet_Nam/BYT_5850_2021_Quy_trinh_hen_phe_quan.pdf`)
  4. **Nhãn thuốc gốc FDA / EMA SmPC**: `FDA_label_budesonide_glycopyrronium_formoterol.pdf` (Breztri Aerosphere), `FDA_label_budesonide_formoterol.pdf`, `FDA_label_beclometasone.pdf`, `Foster_Fostair_SmPC.pdf`, `Trimbow_SmPC.pdf`, `FDA_label_dupilumab.pdf`, `FDA_label_benralizumab.pdf`, `KDIGO_2012_AKI_Guideline.pdf`
- **Phương pháp kiểm định:** Đọc tĩnh toàn bộ 27 tệp mã nguồn `src/modules/asthma/`, 35+ tệp `kb/drugs/*.json`, toàn bộ `src/engine/safety/**`, đối chiếu trích dẫn nguyên văn qua `quoteSearch.ts` và chạy kiểm thử thực nghiệm đường ống `evaluate()` trên 22 kịch bản lâm sàng phức hợp.

---

## I. Tổng quan Kết quả Kiểm định Vòng 4

| Mức độ nghiêm trọng (Severity) | Số lượng phát hiện | Mã định danh |
| :--- | :---: | :--- |
| **Critical (Nguy kịch – Có thể gây hại trực tiếp cho người bệnh)** | **5** | `ASTHMA-R4-R2-01` → `ASTHMA-R4-R2-05` |
| **Major (Trọng yếu – Sai lệch liều/nhãn thuốc/phác đồ/hiển thị lâm sàng)** | **4** | `ASTHMA-R4-R2-06` → `ASTHMA-R4-R2-09` |
| **Minor (Nhẹ – Lệch trích dẫn chéo / siêu dữ liệu / văn bản trợ giúp UI)** | **2** | `ASTHMA-R4-R2-10` → `ASTHMA-R4-R2-11` |
| **Suggestion (Đề xuất cải tiến)** | **0** | — |
| **Tổng cộng** | **11** | **Kết luận: `FAIL (5 critical, 4 major)`** |

---

## II. Kiểm chứng Kết quả Khắc phục Vòng 3 (`round3_R2.json` & `round3_RESPONSE.md`)

### 1. Ma trận kiểm chứng 18 phát hiện Dược lâm sàng Vòng 3

| Mã Vòng 3 | Nội dung tóm tắt | Trạng thái ở Vòng 4 | Ghi chú kiểm chứng thực nghiệm |
| :--- | :--- | :---: | :--- |
| `ASTHMA-R3-R2-01` | Trần liều Rapihaler `80/2.25 mcg` (`24 nhát/ngày`) vs `160/4.5 mcg` & `100/6 mcg` (`12 nhát/ngày` theo GINA 2026; ghi chú SmPC Foster `8 nhát/ngày`) | **ĐÃ KHẮC PHỤC** (còn 1 lưu ý nhỏ ở `inputs.ts:291` → `R4-R2-11`) | `isUsingRapihaler80`, `getMartMaxDailyPuffs`, `actionPlan.ts` và `beclometasone_formoterol.json` đã chuẩn hóa đúng GINA 2026 p. 89 + ghi chú EMA SmPC p. 2. |
| `ASTHMA-R3-R2-02` | Dị ứng nặng đạm sữa bò (`severeMilkProteinAllergy`) bắt buộc chuyển sang pMDI không chứa lactose, chặn DPI | **LỖI HỒI QUY CRITICAL (`ASTHMA-R4-R2-01`)** | Module `asthma` đã viết quy tắc chuyển sang pMDI, **nhưng** `gates.ts` & `reviewMeds.ts` kế thừa mã `severe_milk_protein_allergy` từ `salmeterol.json` & `glycopyrronium.json` làm lật toàn bộ `Seretide Evohaler pMDI`, `Trimbow pMDI`, `Breztri pMDI` thành `[AVOID]`/`[STOP]`; đồng thời bỏ lọt `Asmanex Twisthaler` & `Spiriva HandiHaler`! |
| `ASTHMA-R3-R2-03` | Chống chỉ định đơn trị LABA/LAMA không kèm ICS và cảnh báo giả khi dùng bình rời ICS + LABA | **LỖI HỒI QUY CRITICAL (`ASTHMA-R4-R2-05`)** | Trong module `asthma` đã bắt đúng, **nhưng** ở tầng dùng chung, việc xóa `salmeterol`, `formoterol`, `indacaterol`, `vilanterol` khỏi `ix.laba_monotherapy_asthma` trong khi `contraCodeMatcher.ts` không xử lý `asthma_without_ics` khiến LABA đơn trị bị bỏ lọt hoàn toàn khi khám ngoài module `asthma`, còn `olodaterol` + `budesonide` vẫn báo giả! |
| `ASTHMA-R3-R2-04` | Tương tác chất ức chế mạnh CYP3A4 với ICS/LABA nhạy cảm (`Fluticasone`, `Budesonide`, `Salmeterol`, `Vilanterol`) | **CHƯA ĐẠT – CRITICAL (`ASTHMA-R4-R2-02`)** | Track 1 đã đổi sang `beclometasone_formoterol`, **nhưng** `resolveTrack2IcsLabaDrugId` bỏ quên `hasStrongCyp3a4Inhibitor`, khiến người lớn dùng `Ritonavir`/`Clarithromycin` vẫn bị kê `[START] fluticasone_salmeterol` hoặc bị xóa mất thuốc kiểm soát không có thuốc thay thế; thiếu `erythromycin` trong hằng số! |
| `ASTHMA-R3-R2-05` | Xử trí thuốc nhỏ mắt chẹn beta không chọn lọc (`Timolol` ophthalmic) vs chẹn beta chọn lọc tim mạch | **ĐÃ KHẮC PHỤC** | `rules.safety.systemic.ts`, `kb/interactions/respiratory.json` (`ix.bb_cardioselective_asthma_copd` hạ xuống `moderate`) và `reviewMeds` nhận diện đúng `Timolol` nhỏ mắt qua ống lệ mũi và phân biệt với `Bisoprolol`/`Metoprolol`/`Nebivolol`. |
| `ASTHMA-R3-R2-06` | Bảo vệ đường tiêm tĩnh mạch Corticosteroid (`Methylprednisolone` / `Hydrocortisone`) trong cơn hen nguy kịch/không uống được | **ĐÃ KHẮC PHỤC** | Đã tạo `kb/drugs/hydrocortisone.json`, giữ đúng y lệnh IV `methylprednisolone` không bị ghi đè bởi `prednisolone` uống khi nôn/lơ mơ/nguy kịch. |
| `ASTHMA-R3-R2-07` | Chống chỉ định và cổng thận/huyết áp cho `Magnesium sulfate` tĩnh mạch | **ĐÃ KHẮC PHỤC TRONG ASTHMA – CÒN LỖI CHÉO HTN (`ASTHMA-R4-R2-03`)** | Trong `asthma` đã có cổng `myastheniaGravis`, `eGFR < 30`, `SBP < 90` và cờ tiền sản giật; nhưng bên `htn` (`rec_htn_preeclampsia_mgso4`) vẫn thiếu `drugId: 'magnesium_sulfate'` nên vượt rào cổng an toàn! |
| `ASTHMA-R3-R2-08` | Cổng chống chỉ định `Dupilumab` khi bạch cầu ái toan máu `≥ 1500 /µL` (nguy cơ EGPA / hội chứng tăng BCAT) | **ĐÃ KHẮC PHỤC** | `kb/drugs/dupilumab.json` (`gate_dupilumab_hypereosinophilia`) và quy tắc Bậc 5 đã chặn chính xác khi `eos ≥ 1500 /µL` (đã kiểm chứng thực nghiệm Case 7A). |
| `ASTHMA-R3-R2-09` | Cổng tuổi thanh thiếu niên 12–17 tuổi cho Foster (`≥ 18`), Relvar (`≥ 12` US / `≥ 18` VN-EU lưu ý), bình 3 thành phần & Tiotropium Respimat | **LỖI MAJOR (`ASTHMA-R4-R2-07`)** | Foster & Tiotropium Respimat đúng, **nhưng** `Breztri Aerosphere` (`budesonide_glycopyrronium_formoterol`) bị xếp nhầm vào `ADULT_18_ONLY_DRUGS` dù GINA 2026 & FDA phê duyệt từ `≥ 12 tuổi`; `fluticasone_furoate_umeclidinium_vilanterol.json` để trống `gates: []`. |
| `ASTHMA-R3-R2-10` | Phân tầng cảnh báo tâm thần kinh của `Montelukast` (FDA Boxed Warning): `AVOID/STOP` khi có tiền sử trầm cảm/tự sát vs `MONITOR` tư vấn bắt buộc | **ĐÃ KHẮC PHỤC** | Triển khai rất chuẩn mực 2 tầng (`rec_asthma_montelukast_neuropsych_stop` vs `rec_asthma_montelukast_boxed_warning_counsel`) khớp `kb/drugs/montelukast.json`. |
| `ASTHMA-R3-R2-11` | Chống chỉ định `Theophylline` / `Aminophylline` duy trì & cấp cứu và tương tác CYP1A2 (Quinolone/Macrolide) | **ĐÃ KHẮC PHỤC** | Đã phát lệnh `[STOP]` đầy đủ kèm giải thích độc tính tim mạch – thần kinh và tương tác CYP1A2. |
| `ASTHMA-R3-R2-12` | Cơ địa hen nhạy cảm Aspirin/NSAID (`AERD`) giao thoa với kê đơn NSAID trong cơn gút cấp | **CHƯA KHẮC PHỤC – CRITICAL (`ASTHMA-R4-R2-04`)** | Bàn giao Part V #5 chưa được thực thi trong `src/modules/gout/helpers.safety.ts` và `drugClassify.ts`. |
| `ASTHMA-R3-R2-13` | Xử trí chẹn beta trên bệnh nhân HFrEF nhập viện vì cơn hen cấp nặng | **KHẮC PHỤC MỘT PHẦN – MAJOR (`ASTHMA-R4-R2-09`)** | `organAndCrisisGates.ts` đã chặn `START/UPTITRATE`, nhưng miễn trừ `CONTINUE`, khiến `hf.inpatient.continue_bb` vẫn phát `[CONTINUE] Bisoprolol` giữa cơn suy hô hấp giảm oxy máu (`SpO₂ 88%`). |
| `ASTHMA-R3-R2-14` | Phối hợp liên khoa Sản – Hồi sức: tránh truyền kép / vượt cổng `Magnesium sulfate` ở tiền sản giật nặng + cơn hen cấp | **KHẮC PHỤC MỘT PHẦN – CRITICAL (`ASTHMA-R4-R2-03`)** | Module `asthma` đã nhường MgSO4 cho sản khoa, nhưng `rec_htn_preeclampsia_mgso4` của module `htn` vẫn thiếu `drugId: 'magnesium_sulfate'`, làm liệt hoàn toàn cổng chống chỉ định nhược cơ và suy thận nặng! |
| `ASTHMA-R3-R2-15` | Quy tắc hạ bậc (Step-down) Track 1 Bậc 4 → Bậc 3 và Bậc 3 → Bậc 1–2 (`SWITCH` về AIR khi cần) & giữ ICS trong thai kỳ | **ĐÃ KHẮC PHỤC** | Đã chuẩn hóa hành động hạ bậc, thời gian kiểm soát ổn định ≥ 3 tháng và chặn hạ bậc trong thai kỳ (`GINA 2026` Box 3-13). |
| `ASTHMA-R3-R2-16` | Đơn thuốc xuất viện sau đợt cấp (GINA Box 9-7): OCS 5–7 ngày không cần giảm liều dần + khởi trị/nâng bậc ICS-formoterol | **ĐÃ KHẮC PHỤC** | Đầy đủ liều Prednisolone 40–50 mg x 5–7 ngày kèm nâng bậc kiểm soát nền và hẹn tái khám 2–7 ngày. |
| `ASTHMA-R3-R2-17` | Tư vấn an toàn thuốc trong thai kỳ & thời kỳ cho con bú (`pregnancy` & `lactation`) | **LỖI HIỂN THỊ MAJOR (`ASTHMA-R4-R2-08`)** | Quy tắc cho con bú nối trực tiếp object `entry.lactation` gây lỗi chuỗi `"[object Object]"` trên giao diện và bỏ sót `mepolizumab`. |
| `ASTHMA-R3-R2-18` | Rà soát trích dẫn (`citationIds`) và bảng quy đổi liều ICS (`icsDoseEquivalenceMatrix`) | **ĐÃ KHẮC PHỤC PHẦN LỚN** (còn vài trích dẫn lệch nhỏ → `R4-R2-10`) | Bảng quy đổi liều ICS người lớn/≥12 tuổi trong `matrices.ts` đã khớp chính xác GINA 2026 Box 3-14. |

---

## III. Chi tiết Các Phát hiện Dược lâm sàng Vòng 4

### Nhóm 1: Các phát hiện mức độ CRITICAL (5 phát hiện)

#### 1. `ASTHMA-R4-R2-01` [CRITICAL] — Kế thừa chống chỉ định thành phần FDC chặn nhầm toàn bộ bình xịt pMDI KHÔNG chứa lactose (`Seretide Evohaler`, `Trimbow pMDI`, `Breztri Aerosphere pMDI`) ở bệnh nhân dị ứng nặng đạm sữa bò, làm mất thuốc kiểm soát hen, trong khi lại bỏ lọt bình bột khô DPI chứa lactose (`Asmanex Twisthaler`, `Spiriva HandiHaler`)

- **Vị trí lỗi:**
  - `src/engine/safety/gates.ts:434-468` & `src/engine/safety/reviewMeds.ts:318-373`
  - `kb/drugs/salmeterol.json:87` & `kb/drugs/glycopyrronium.json:85`
  - `src/modules/asthma/helpers.constants.ts:56-90` (`DPI_ONLY_LACTOSE_DRUGS`, `DUAL_FORMULATION_INHALER_DRUGS`)
- **Cơ chế dược lý & Phân tích lỗi:**
  1. Trong `gates.ts` và `reviewMeds.ts`, mọi thuốc phối hợp liều cố định (FDC) đều bị tách qua `expandDrugComponents(resolvedKbId)` và **áp cứng toàn bộ `contraindications[].code` của từng hoạt chất đơn lẻ lên chế phẩm phối hợp**, bất kể dạng bào chế thực tế là bình xịt định liều HFA `pMDI` (100% không chứa lactose) hay bình hít bột khô `DPI`.
  2. Vì `kb/drugs/salmeterol.json:87` và `kb/drugs/glycopyrronium.json:85` gắn cứng `"code": "severe_milk_protein_allergy"`:
     - **Mất hoàn toàn thuốc kiểm soát ở Track 2 Bậc 3–5:** Khi `conditions.severeMilkProteinAllergy = true`, module `asthma` chọn `fluticasone_salmeterol` với chủ đích kê bình xịt `Seretide Evohaler pMDI` không chứa lactose; ngay lập tức `gates.ts` kế thừa mã chống chỉ định từ `salmeterol.json` và lật khuyến cáo thành `[AVOID] CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG Fluticasone / Salmeterol (dose="-")`. Bệnh nhân hen không kiểm soát Bậc 3–5 bị bỏ lại **không có bất kỳ thuốc kiểm soát hen nào**!
     - **Báo ngừng sai lệch bình xịt 3 thành phần không chứa lactose ở Bậc 5:** Bệnh nhân Bậc 5 đang điều trị ổn định bằng `Trimbow pMDI` (`beclometasone_glycopyrronium_formoterol`) hoặc `Breztri Aerosphere pMDI` (`budesonide_glycopyrronium_formoterol`) bị `gates.ts`/`reviewMeds.ts` kế thừa mã của `glycopyrronium.json` và phát lệnh **`[STOP] NGỪNG NGAY`** với lý do sai sự thật rằng chế phẩm là bột khô DPI chứa lactose!
  3. **Bỏ lọt bình bột khô DPI thực sự chứa lactose đang dùng:** `mometasone` (`Asmanex Twisthaler` — chỉ có dạng bột khô DPI chứa lactose khan) thiếu trong `DPI_ONLY_LACTOSE_DRUGS`, và `tiotropium` (`Spiriva HandiHaler 18 mcg` viên nang bột khô chứa lactose monohydrate có vết protein sữa bò vs `Spiriva Respimat` phun sương mù không chứa lactose) cùng `formoterol` (`Oxis Turbuhaler` DPI) thiếu trong quy tắc rà soát thiết bị dị ứng sữa.
- **Bằng chứng thực nghiệm `evaluate()` & Nhãn thuốc gốc:**
  - *Case 1A-1 (Track 2 Bậc 3, `severeMilkProteinAllergy: true`)*: Xuất `[AVOID] id=rec_asthma_track2_step3_4 drugId=fluticasone_salmeterol title="CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG Fluticasone / Salmeterol" dose="-"` — mất trắng thuốc kiểm soát.
  - *Case 1B-1 & 1B-2 (`Trimbow pMDI` & `Breztri Aerosphere pMDI`)*: Xuất `[STOP] id=rec_asthma_step5_controller_continue` báo sai chống chỉ định lactose DPI.
  - *Case B1 (`Asmanex Twisthaler 200 mcg` ở Track 2 Bậc 2)*: Xuất y lệnh tự mâu thuẫn `[CONTINUE] drugId=mometasone` nhưng `dose="Flixotide Evohaler pMDI (không chứa lactose)..."`.
  - *Case B2 (`Foster pMDI` + `Spiriva HandiHaler 18 mcg DPI` ở Bậc 5)*: **0 lệnh `[STOP]`** hoặc chuyển đổi `Spiriva HandiHaler` sang `Spiriva Respimat`.
  - **EMA `Trimbow_SmPC.pdf` p. 20** (Trimbow pressurised inhalation solution, §6.1): *"6.1 List of excipients Ethanol anhydrous Hydrochloric acid Norflurane (propellant)"* — hoàn toàn không có lactose.
  - **FDA `FDA_label_budesonide_glycopyrronium_formoterol.pdf` p. 22** (§11 DESCRIPTION): Bình xịt định liều HFA cosolvent suspension — **0 kết quả `"lactose"`** trên toàn bộ nhãn FDA.
- **Hướng khắc phục đề xuất:**
  1. Trong `gates.ts` và `reviewMeds.ts`: Không kế thừa mã chống chỉ định phụ thuộc dạng bào chế/tá dược (`'severe_milk_protein_allergy'`) từ thành phần đơn chất sang FDC; chỉ kích hoạt khi chính `DrugEntry` của thuốc đó là chế phẩm chỉ có DPI hoặc khi chuỗi tên/liều thuốc ghi nhận thiết bị DPI (`Accuhaler`, `Diskus`, `Ellipta`, `Turbuhaler`, `Nexthaler`, `Breezhaler`, `HandiHaler`, `Twisthaler`).
  2. Gỡ `"severe_milk_protein_allergy"` dạng chặn cứng toàn hoạt chất khỏi `salmeterol.json`.
  3. Bổ sung `'mometasone'`, `'asmanex'` vào `DPI_ONLY_LACTOSE_DRUGS` và bổ sung rà soát `'tiotropium'` (chặn `HandiHaler`, chỉ cho phép `Spiriva Respimat`), `'formoterol'` trong `rules.safety.age_allergy.ts`.

---

#### 2. `ASTHMA-R4-R2-02` [CRITICAL] — Tương tác chất ức chế mạnh CYP3A4 (`Ritonavir`, `Clarithromycin`, `Itraconazole`, `Cobicistat`, `Erythromycin`) vẫn kê trực tiếp `Fluticasone/Salmeterol` khi khởi trị Track 2, xóa mất thuốc kiểm soát không có thuốc thay thế khi đang dùng `Seretide`, và bỏ sót `Erythromycin` / ức chế protease trên Track 1

- **Vị trí lỗi:**
  - `src/modules/asthma/helpers.dosing.ts:422-444` (`resolveTrack2IcsLabaDrugId`)
  - `src/modules/asthma/rules.safety.systemic.ts:206-215` (`asthma.safety.ics_laba_strong_cyp3a4_inhibitor`)
  - `src/modules/asthma/helpers.constants.ts:230-242` & `src/engine/safety/drugClassify.ts:385-395` (`STRONG_CYP3A4_INHIBITOR_DRUGS`)
- **Cơ chế dược lý & Phân tích lỗi:**
  1. Trong khi `resolveTrack1MartDrugId(ctx)` và `resolveTrack2MonoIcsDrugId(ctx)` đều kiểm tra `hasStrongCyp3a4Inhibitor(ctx)` để đổi sang `beclometasone_formoterol` / `beclometasone` (chuyển hóa nhanh qua esterase huyết tương/phổi, không phụ thuộc CYP3A4), hàm **`resolveTrack2IcsLabaDrugId(ctx)` hoàn toàn bỏ quên kiểm tra `hasStrongCyp3a4Inhibitor(ctx)`**.
  2. Cùng lúc đó, quy tắc `asthma.safety.ics_laba_strong_cyp3a4_inhibitor` có điều kiện `if (!hasSensitiveInhaler) return !isAdult18OrOlder(ctx);`. Do đó:
     - **Khi người lớn (`≥ 18 tuổi`) đang dùng `Ritonavir` (hoặc `Paxlovid`, `Itraconazole`, `Clarithromycin`) khởi trị hoặc nâng bậc lên Track 2 Bậc 3–5:** Hệ thống **kê đơn trực tiếp `[START] fluticasone_salmeterol` (`100/50 – 250/50 mcg Accuhaler 1 nhát x 2 lần/ngày`)** — đây là tổ hợp nhạy cảm CYP3A4 nguy hiểm bậc nhất (vừa gây suy thượng thận/hội chứng Cushing thứ phát do tăng phơi nhiễm Fluticasone hàng chục lần, vừa gây kéo dài khoảng QTc và loạn nhịp thất nguy kịch do ức chế thanh thải Salmeterol), rồi tự phát cảnh báo `critical` `ix.ics_laba_strong_cyp3a4` mâu thuẫn trực tiếp với chính đơn thuốc vừa kê!
     - **Khi người bệnh Track 2 Bậc 3–5 đang dùng sẵn `Seretide` + `Clarithromycin`/`Ritonavir`:** `rec_asthma_ics_laba_cyp3a4_ddi` phát `[AVOID] fluticasone_salmeterol` (`priority: 95`) ghi đè mất y lệnh duy trì trong `merge.ts` mà **không sinh y lệnh `[SWITCH]` sang `beclometasone_formoterol`**, bỏ trống hoàn toàn thuốc kiểm soát hen của người bệnh!
  3. **Lệch danh mục hoạt chất ức chế CYP3A4:** `STRONG_CYP3A4_INHIBITOR_DRUGS` bỏ sót `'erythromycin'` (được GINA 2026 nêu đích danh) cùng `'atazanavir'`, `'darunavir'`, `'indinavir'`, `'nelfinavir'`, `'saquinavir'` vốn có mặt trong `kb/interactions/respiratory.json:187-202`, khiến Track 1 kê `[START] budesonide_formoterol` trên nền `Erythromycin` rồi tự kích hoạt cảnh báo `critical`.
- **Bằng chứng nguyên văn GINA 2026 & Thực nghiệm `evaluate()`:**
  - **GINA 2026 Strategy Report, p. 47:** *"cytochrome P450 inhibitors such as ketoconazole, ritonavir, itraconazole, erythromycin and clarithromycin may increase the risk of ICS adverse effects such as adrenal suppression, and with short-term use, may increase the risk of cardiovascular adverse effects of the LABAs salmeterol and vilanterol (alone or in combination with ICS)."*
  - **GINA 2026 Strategy Report, p. 140:** *"These interactions may lead to increased risk of ICS adverse effects such as adrenal suppression and Cushing’s syndrome, and may increase the risk of cardiovascular adverse effects of some LABAs (salmeterol and vilanterol).184 Concomitant use is not recommended"*
  - *Thực nghiệm Case 2A-1 (`Ritonavir` + khởi trị Track 2 Bậc 3)*: Xuất `[START] id=rec_asthma_track2_step3_4 drugId=fluticasone_salmeterol` + `ALERT [critical] ix.ics_laba_strong_cyp3a4`.
  - *Thực nghiệm Case C (`Clarithromycin` + đang dùng `Seretide` Bậc 4)*: Chỉ còn `[AVOID] fluticasone_salmeterol`, mất sạch thuốc kiểm soát hen thay thế.
  - *Thực nghiệm Case 2B (`Erythromycin` + Track 1)*: Xuất `[START] budesonide_formoterol` + `ALERT [critical] ix.ics_laba_strong_cyp3a4`.
- **Hướng khắc phục đề xuất:**
  1. Bổ sung kiểm tra `hasStrongCyp3a4Inhibitor(ctx)` trong `resolveTrack2IcsLabaDrugId(ctx)` và nhánh Track 2 ở Bậc 3–5 để tự động chuyển (`START`/`SWITCH`) sang `beclometasone_formoterol` ở người lớn `≥ 18 tuổi` (duy trì cố định 2 lần/ngày kèm SABA khi cần hoặc chuyển sang Track 1 MART); ở thanh thiếu niên 12–17 tuổi bắt buộc cảnh báo đổi kháng sinh (vd `Azithromycin`) hoặc hội chẩn chuyên khoa dùng ICS đơn chất liều thấp nhất không kèm `salmeterol`/`vilanterol`.
  2. Đồng bộ đầy đủ `'erythromycin'`, `'atazanavir'`, `'darunavir'`, `'indinavir'`, `'nelfinavir'`, `'saquinavir'` vào `STRONG_CYP3A4_INHIBITOR_DRUGS` ở cả `helpers.constants.ts` và `drugClassify.ts`.

---

#### 3. `ASTHMA-R4-R2-03` [CRITICAL] — Y lệnh `Magnesium sulfate` sản khoa (`rec_htn_preeclampsia_mgso4`) thiếu `drugId: 'magnesium_sulfate'`, vượt rào hoàn toàn cổng chống chỉ định Nhược cơ (`Myasthenia gravis`), Block nhĩ thất độ cao và Suy thận nặng (`eGFR < 30`)

- **Vị trí lỗi:** `src/modules/htn/rules.inpatient.neuro_preg.ts:577-586` (Tồn đọng từ bàn giao Vòng 3 `ASTHMA-R3-R2-14` / Part V Handoff #6a)
- **Phân tích lỗi & Bằng chứng thực nghiệm:**
  - Mặc dù module `asthma` đã bổ sung kiểm tra nhường `MgSO4` khi có tiền sản giật nặng, quy tắc `htn.inpatient.preeclampsia_mgso4` bên module `htn` vẫn để `drugId: undefined`.
  - Do không có `drugId: 'magnesium_sulfate'`, y lệnh `[START] Truyền Magnesium sulfate tĩnh mạch dự phòng/cắt cơn sản giật (liều nạp 4 g IV, duy trì 1 g/giờ)` **đi vòng qua toàn bộ `evaluateSafetyGates` (`kb/drugs/magnesium_sulfate.json`)** và không được `mergeRecommendations` nhận diện!
  - *Thực nghiệm Case 3A-2 (`selectedModules: ['htn', 'asthma']`, `INPATIENT`, thai phụ 33 tuần tiền sản giật nặng + cơn hen cấp nặng + `myastheniaGravis: true` + `egfr: 22`)*: Hệ thống xuất **cùng lúc hai y lệnh đối chọi trực tiếp trên cùng một màn hình**:
    1. `[AVOID] id=rec_asthma_acute_severe_mgso4 drugId=magnesium_sulfate` — cảnh báo chống chỉ định tuyệt đối do bệnh nhược cơ gây liệt cơ hô hấp!
    2. `[START] id=rec_htn_preeclampsia_mgso4 drugId=-` — ra lệnh truyền `Magnesium sulfate 4 g IV nạp + 1 g/giờ duy trì` (liều gây liệt hô hấp tức thì trên bệnh nhân nhược cơ và gây ngộ độc Mg²⁺ ngừng tim trên nền suy thận `eGFR 22 mL/phút`)!
- **Hướng khắc phục đề xuất:** Gắn `drugId: 'magnesium_sulfate'` và `dose` chuẩn vào `rec_htn_preeclampsia_mgso4` để kích hoạt đầy đủ cổng chống chỉ định `myasthenia_gravis`, `av_block_2_3`, cảnh báo giảm liều/ngừng truyền duy trì khi `eGFR < 30` / thiểu niệu, và hợp nhất y lệnh an toàn giữa `htn` và `asthma`.

---

#### 4. `ASTHMA-R4-R2-04` [CRITICAL] — Module Gút cấp (`gout.acute_flare.treatment`) không kiểm tra cơ địa hen nhạy cảm Aspirin/NSAID (`AERD`), khiến người bệnh Gút cấp + AERD bị bỏ rơi không có thuốc cắt cơn (khi `aerd = true`) hoặc bị kê trực tiếp `Naproxen` gây co thắt phế quản ác tính (khi dùng khóa đồng nghĩa `aspirinAndNsaidExacerbated = true`)

- **Vị trí lỗi:**
  - `src/modules/gout/helpers.safety.ts:304-366` (`isNsaidHardContraindicated`)
  - `src/engine/safety/drugClassify.ts:539-550` (`hasAerdCondition`)
  - (Tồn đọng từ bàn giao Vòng 3 `ASTHMA-R3-R2-12` / Part V Handoff #5)
- **Phân tích lỗi & Bằng chứng thực nghiệm:**
  1. Hàm `isNsaidHardContraindicated` của module `gout` vẫn không kiểm tra `aerd`. Khi bệnh nhân Gút cấp có cơ địa `conditions.aerd = true` đến khám muộn sau 36 giờ khởi phát cơn (hoặc chống chỉ định Colchicine do dùng Clarithromycin / suy thận), `gout.acute_flare.treatment` chọn kê `[START] naproxen` thay vì rẽ nhánh sang `prednisolone` đường uống (`src/modules/gout/rules.flare.ts:288`). Sau đó `gates.ts` chặn `naproxen` thành `[AVOID]`, khiến bệnh nhân đau gút cấp dữ dội bị bỏ rơi **không có bất kỳ thuốc kháng viêm cắt cơn nào**!
  2. Nguy hiểm hơn, `hasAerdCondition` trong `drugClassify.ts:539-550` không nhận diện khóa đồng nghĩa `aspirinAndNsaidExacerbated` / `nasalPolypsNsaidSensitivity` (vốn được module `asthma` hỗ trợ tại `helpers.dosing.ts:183`). Trong *Case 3B-2 (`aspirinAndNsaidExacerbated: true`)*, `evaluate()` xuất thẳng y lệnh **`[START] Cắt cơn gút cấp bằng NSAID ngắn ngày (Naproxen) 500 mg x 2 lần/ngày`** không một lời cảnh báo — nguy cơ khởi phát co thắt phế quản cấp đe dọa tính mạng theo **GINA 2026 Strategy Report, p. 165**!
- **Hướng khắc phục đề xuất:** Bổ sung `hasAerdCondition(ctx)` vào đầu `isNsaidHardContraindicated` trong `src/modules/gout/helpers.safety.ts` để tự động chuyển sang `Prednisolone` uống ngắn ngày / tiêm nội khớp, và đồng bộ `aspirinAndNsaidExacerbated`, `nasalPolypsNsaidSensitivity` vào `hasAerdCondition` (`src/engine/safety/drugClassify.ts`).

---

#### 5. `ASTHMA-R4-R2-05` [CRITICAL] — Lỗi hồi quy rà soát thuốc dùng chung: Đơn trị LABA không kèm ICS (FDA Boxed Warning nguy cơ tử vong do hen) hoàn toàn không phát lệnh `[STOP]` hay cảnh báo khi khám ngoài module `asthma`, đồng thời `Olodaterol` + `Budesonide` bình rời vẫn báo động giả

- **Vị trí lỗi:**
  - `src/engine/safety/contraCodeMatcher.ts:270-290` (`matchesContraindicationCode`)
  - `kb/interactions/diabetes_respiratory.json:426-454` (`ix.laba_monotherapy_asthma`)
- **Phân tích lỗi & Bằng chứng thực nghiệm:**
  - Ở Vòng 3 (Part V Handoff #4), `salmeterol`, `formoterol`, `indacaterol` và `vilanterol` đã được gỡ khỏi `ix.laba_monotherapy_asthma` với giả định rằng `reviewMeds` sẽ bắt qua `DrugEntry.contraindications`. Tuy nhiên, `matchesContraindicationCode` trong `contraCodeMatcher.ts` **hoàn toàn không có nhánh xử lý cho `code: "asthma_without_ics"` hoặc `"asthma_monotherapy"`** (đang khai báo trong 8 tệp KB LABA / LABA-LAMA)!
  - *Thực nghiệm Case 3C-1 (`selectedModules: ['htn']`, `conditions: { htn: true, asthma: true }`, `currentMeds: [{ drugId: 'salmeterol' }, { drugId: 'amlodipine' }]`)*: Hệ thống xuất **0 lệnh `[STOP]` và 0 `SafetyAlert`** trước phác đồ đơn trị `Salmeterol` không có ICS trên bệnh nhân hen phế quản!
  - *Thực nghiệm Case 3C-2 (`currentMeds: [{ drugId: 'olodaterol' }, { drugId: 'budesonide' }]`)*: Vì riêng `'olodaterol'` bị bỏ sót lại trong `ix.laba_monotherapy_asthma` không xét ICS đi kèm, hệ thống phát cảnh báo giả `[critical/interaction] ix.laba_monotherapy_asthma` dù bệnh nhân đang dùng đầy đủ `Budesonide`!
- **Hướng khắc phục đề xuất:** Bổ sung xử lý ngữ cảnh cho `"asthma_without_ics"` và `"asthma_monotherapy"` trong `contraCodeMatcher.ts` / `reviewMedsDiseaseAndDdi.ts` (kích hoạt khi `hasCondition(patient, 'asthma')` và không có thuốc chứa lớp `'ics'` trong `currentMeds` / y lệnh đang kê), đồng thời xóa nốt `'olodaterol'` khỏi `ix.laba_monotherapy_asthma`.

---

### Nhóm 2: Các phát hiện mức độ MAJOR (4 phát hiện)

#### 6. `ASTHMA-R4-R2-06` [MAJOR] — Bỏ lọt các bình xịt cắt cơn phối hợp SAMA-SABA và SAMA phổ biến tại Việt Nam (`Berodual` `ipratropium_fenoterol`, `Combivent` `ipratropium_salbutamol`, `Atrovent` `ipratropium`) khỏi quy tắc cấm điều trị cắt cơn đơn độc không ICS và quy tắc dừng bình cắt cơn riêng trên Track 1 MART

- **Vị trí lỗi:** `src/modules/asthma/helpers.constants.ts:108-115` (`SABA_DRUGS`) & `src/modules/asthma/rules.safety.inhalers.ts:26-66, 132-167`
- **Bằng chứng thực nghiệm:**
  - Tại Việt Nam, người bệnh hen rất thường tự mua `Berodual` (`ipratropium_fenoterol`) hoặc `Combivent` (`ipratropium_salbutamol`) xịt cắt cơn thay cho `Ventolin`. Do `SABA_DRUGS` chỉ liệt kê `salbutamol`, `terbutaline`, `fenoterol` đơn chất:
    - *Case 4A (Ngoại trú chỉ dùng `Berodual` không có ICS)*: **0 lệnh `[STOP]`** cảnh báo nguy cơ tử vong do điều trị hen chỉ bằng thuốc cắt cơn không kèm ICS (**GINA 2026**, pp. 40, 87).
    - *Case 4B (Đang theo Track 1 MART `Symbicort` + giữ `Combivent` xịt khi cần)*: **0 lệnh `[STOP]`** bình `Combivent` rời (**GINA 2026**, p. 89).
- **Hướng khắc phục đề xuất:** Bổ sung `'ipratropium_fenoterol'`, `'ipratropium_salbutamol'`, `'berodual'`, `'combivent'` (và `'ipratropium'`, `'atrovent'` khi dùng cắt cơn ngoại trú không ICS) vào tập thuốc cắt cơn tác dụng ngắn để kích hoạt đầy đủ `sabaMonoStopRules` và `track1SeparateSabaStopRules`.

---

#### 7. `ASTHMA-R4-R2-07` [MAJOR] — Chặn sai `Breztri Aerosphere` (`budesonide_glycopyrronium_formoterol`) là "chỉ phê duyệt cho người lớn ≥ 18 tuổi" ở thanh thiếu niên 12–17 tuổi (trái ngược GINA 2026, nhãn FDA và KB), đồng thời thiếu cổng tuổi `< 18` trong tệp chuẩn hóa `fluticasone_furoate_umeclidinium_vilanterol.json`

- **Vị trí lỗi:** `src/modules/asthma/helpers.constants.ts:47`, `src/modules/asthma/rules.safety.age_allergy.ts:113`, `src/modules/asthma/rules.track2.step5.ts:313`, `kb/drugs/fluticasone_furoate_umeclidinium_vilanterol.json:54`
- **Bằng chứng nguyên văn & Thực nghiệm:**
  - **GINA 2026 Strategy Report, p. 100:** *"budesonide-formoterol-glycopyrronium (≥12 years)"* & **p. 246:** *"For patients aged ≥12 years, budesonide-formoterol-glycopyrronium"*.
  - **FDA `FDA_label_budesonide_glycopyrronium_formoterol.pdf`, p. 1:** *"BREZTRI AEROSPHERE is indicated for... maintenance treatment of asthma in adult and pediatric patients 12 years of age and older."*
  - Chính tệp `kb/drugs/budesonide_glycopyrronium_formoterol.json:68-78` cũng đặt cổng `gate_breztri_age_lt_12` là `< 12 tuổi`. Thế nhưng `ADULT_18_ONLY_DRUGS` lại đưa `'budesonide_glycopyrronium_formoterol'` và `'breztri'` vào danh sách `< 18 tuổi`, khiến *Case 5A (bệnh nhân 14 tuổi)* bị phát lệnh sai **`[STOP] NGỪNG Breztri Aerosphere ở bệnh nhân 14 tuổi: Chỉ được phê duyệt cho người lớn ≥ 18 tuổi`**.
  - Ngược lại, `kb/drugs/fluticasone_furoate_umeclidinium_vilanterol.json:54` (ID chuẩn của `trelegy` trong `fdcMap.ts:144`) lại để trống `"gates": []` (trong khi tệp trùng lặp `fluticasone_umeclidinium_vilanterol.json` có cổng `age < 18`), làm mất cổng chặn tuổi ở tầng `evaluateSafetyGates` ngoài module `asthma`.
- **Hướng khắc phục đề xuất:** Gỡ `'budesonide_glycopyrronium_formoterol'` và `'breztri'` khỏi `ADULT_18_ONLY_DRUGS`, cập nhật văn bản giải thích Bậc 5, bổ sung cổng `age < 18` vào `fluticasone_furoate_umeclidinium_vilanterol.json` và hợp nhất tệp KB trùng lặp.

---

#### 8. `ASTHMA-R4-R2-08` [MAJOR] — Lỗi chuỗi `"[object Object]"` làm hỏng hoàn toàn hướng dẫn an toàn thuốc khi cho con bú (`asthma.safety.breastfeeding_caution`), bỏ sót `Mepolizumab` khi cho con bú và hồ sơ `mepolizumab.json` chỉ mới ghi chỉ định COPD

- **Vị trí lỗi:** `src/modules/asthma/rules.safety.age_allergy.ts:244-245`, `src/modules/asthma/helpers.constants.ts:253-263`, `kb/drugs/mepolizumab.json:18,55,89`
- **Bằng chứng thực nghiệm:**
  - Tại `rules.safety.age_allergy.ts:244-245`: `if (entry.lactation) cautionNotes.push(\`${entry.nameVi}: ${entry.lactation}\`);` nối trực tiếp object `{ status, notesVi, citationIds }`.
  - *Thực nghiệm Case 6 (`breastfeeding: true` đang dùng `Prednisolone`, `Montelukast`, `Theophylline`, `Mepolizumab`)*: Đầu ra `rationale` hiển thị nguyên văn lỗi:
    `"Thuốc đang dùng cần lưu ý khi cho con bú: Prednisolone: [object Object] · Montelukast: [object Object] · Theophylline: [object Object]."` — làm mất sạch hướng dẫn lâm sàng cụ thể của từng thuốc!
  - Đồng thời, `'mepolizumab'` bị thiếu trong `LACTATION_CAUTION_ASTHMA_DRUGS` (trong khi cả 4 kháng thể đơn dòng hen còn lại đều có), và `kb/drugs/mepolizumab.json` hiện chỉ mô tả COPD (`gates: []`), thiếu liều hen nặng tăng BCAT (`100 mg TDD mỗi 4 tuần`) và cổng tuổi `< 6 tuổi`.
- **Hướng khắc phục đề xuất:** Đổi sang `entry.lactation.notesVi`, thêm `'mepolizumab'`/`'nucala'` vào `LACTATION_CAUTION_ASTHMA_DRUGS`, và bổ sung chỉ định/liều hen nặng + cổng tuổi `< 6` trong `kb/drugs/mepolizumab.json`.

---

#### 9. `ASTHMA-R4-R2-09` [MAJOR] — Nhập viện cấp cứu vì cơn hen phế quản nặng suy hô hấp (`SpO₂ 88%`, chỉ nói từng từ) kèm suy tim HFrEF vẫn phát lệnh `[CONTINUE] Bisoprolol` không kèm cảnh báo tạm hoãn/giảm liều do co thắt phế quản cấp

- **Vị trí lỗi:** `src/modules/hf/rules.inpatient.ts:163-209` (`hf.inpatient.continue_bb`) & `src/engine/safety/organAndCrisisGates.ts:261-268`
- **Bằng chứng thực nghiệm:**
  - Trong *Case 3D-1 (`selectedModules: ['hf']`)* và *Case 3D-2 (`selectedModules: ['hf', 'asthma']`, `INPATIENT`, `isAcuteExacerbation: true`, `spo2: 88`, `speechAbility: 'words'`)*, bệnh nhân đang co thắt phế quản cấp giảm oxy máu phải phun khí dung `Salbutamol 5 mg` mỗi 20 phút liên tục, nhưng `hf.inpatient.continue_bb` vẫn phát lệnh **`[CONTINUE] Tiếp tục duy trì Bisoprolol trong đợt nhập viện suy tim cấp (không sốc tim)`** mà không có bất kỳ cảnh báo hội chẩn tạm hoãn/giảm liều chẹn beta nào (do `organAndCrisisGates.ts:264` miễn trừ action `CONTINUE`).
- **Hướng khắc phục đề xuất:** Khi `isAcuteSevereBronchospasm(ctx) === true`, chuyển `CONTINUE` chẹn beta chọn lọc tim mạch sang `HOLD` (hoặc gắn cảnh báo bắt buộc đánh giá tạm ngưng/giảm liều ngắn hạn cho đến khi thoát cơn co thắt phế quản cấp nặng để không đối kháng thụ thể beta-2 của SABA cứu mạng).

---

### Nhóm 3: Các phát hiện mức độ MINOR (2 phát hiện)

#### 10. `ASTHMA-R4-R2-10` [MINOR] — Một số trích dẫn (`citationIds`) mượn chéo chuyên khoa lệch hoạt chất/cơ chế trong `magnesium_sulfate.json`, `kb/thresholds/asthma.json` và `rules.safety.age_allergy.ts`
- `kb/drugs/magnesium_sulfate.json:62,87` & `rules.acute.inpatient.ts:287,346` gắn `'kdigo.aki.2012.myasthenia_neuromuscular'` (KDIGO 2012 AKI p. 65 §3.8.3 nói về độc tính ức chế thần kinh-cơ của **kháng sinh nhóm aminoglycoside**, không phải `Magnesium sulfate`).
- `kb/thresholds/asthma.json:653,674` mượn trích dẫn suy thận COPD (`byt.copd.2023.severe_renal_crcl30`) và sốc tim suy tim cấp (`esc.hf.2026.shock_sbp_90_hypoperfusion`, `byt.hf.2022.intubation_vitals_brady_hypotension`) cho ngưỡng thận/huyết áp của `Magnesium sulfate` trong cơn hen cấp.
- `src/modules/asthma/rules.safety.age_allergy.ts:59,77` gắn `'gina.asthma.2026.never_saba_alone'` cho dị ứng thuốc tổng quát, và dòng `128,146,204,227` gắn `'gina.asthma.2026.spacer_no_facemask_eye_protection'` cho chống chỉ định tá dược lactose bình bột khô DPI.

#### 11. `ASTHMA-R4-R2-11` [MINOR] — Chuẩn hóa trường `frequency` của `kb/drugs/methylprednisolone.json` và chú thích nhãn gốc Foster `8 nhát/ngày` trong `src/modules/asthma/inputs.ts`
- `kb/drugs/methylprednisolone.json:17,24` ghi `frequency: "tiêm tĩnh mạch"` / `"tiêm TM"` (trùng với `route: "IV"`) thay vì tần suất thực tế (`"1 lần/ngày (hoặc chia mỗi 6–12 giờ)"`, liều 40–80 mg/ngày theo BYT QĐ 5850/2021 p. 17–18).
- `src/modules/asthma/inputs.ts:291` (`totalDailyPuffsUsed.helpVi`) nên bổ sung chú thích ngắn về sự khác biệt giữa trần nhãn gốc EMA/VN của Foster `100/6 mcg` (`8 nhát/ngày = 48 mcg` theo `Foster_Fostair_SmPC.pdf` p. 2) và trần đồng bộ tạm thời của GINA 2026 (`12 nhát/ngày = 72 mcg` theo `GINA_2026_Strategy_Report.pdf` p. 89), thống nhất với nội dung đã giải thích rất rõ trong `kb/drugs/beclometasone_formoterol.json:26,72`.

---

## IV. Tổng kết Kiểm tra Danh mục Dược lâm sàng Đạt chuẩn (Verified Clean Areas)

Ngoài 11 điểm nêu trên cần khắc phục trước khi đóng vòng, các cấu phần dược trị liệu cốt lõi sau của phân hệ `asthma` đã đạt độ chính xác cao khi đối chiếu với **GINA 2026** và **Bộ Y tế QĐ 1851/2020 & QĐ 5850/2021**:
1. **Phân nhánh GINA Track 1 (AIR / MART):** Khởi trị Bậc 1–2 bằng `Budesonide/formoterol 160/4.5 mcg` khi cần, nâng bậc MART Bậc 3 (`1 nhát x 1–2 lần/ngày + PRN`) và Bậc 4 (`2 nhát x 2 lần/ngày + PRN`), nhân đôi chính xác số nhát cho `Symbicort Rapihaler pMDI 80/2.25 mcg` (trần `24 nhát/ngày` = `54 mcg` formoterol phóng thích / `72 mcg` định liều) và đồng bộ trần `12 nhát/ngày` theo GINA 2026 kèm ghi chú nhãn SmPC cho `Foster 100/6 mcg`.
2. **Xử trí Cơn hen cấp Nội viện / Cấp cứu:** Phân tầng chính xác Nhẹ-Trung bình, Nặng và Nguy kịch đe dọa tính mạng; mục tiêu SpO₂ `93–95%` ở người lớn và `≥ 95%` ở phụ nữ mang thai; liều khí dung `Salbutamol` + `Ipratropium 0.5 mg` mỗi 20 phút trong giờ đầu; bảo vệ mắt bằng ống ngậm miệng (`mouthpiece`) khi có glôcôm góc đóng (`narrowAngleGlaucoma`); Corticosteroid toàn thân trong giờ đầu (`Prednisolone 40–50 mg` uống hoặc `Methylprednisolone` / `Hydrocortisone` tĩnh mạch khi không uống được/nguy kịch) và đơn xuất viện GINA Box 9-7.
3. **Thuốc sinh học Bậc 5 & Cảnh báo hộp đen:** Chỉ định theo kiểu hình viêm Type 2 (`Omalizumab`, `Mepolizumab`, `Benralizumab`, `Dupilumab`, `Tezepelumab`), chặn trùng lặp 2 thuốc sinh học, cổng chặn `Dupilumab` khi `Eosinophils ≥ 1500 /µL`, cảnh báo 2 tầng FDA Boxed Warning tâm thần kinh cho `Montelukast`, dừng `Theophylline` duy trì/cấp cứu, bảo vệ duy trì ICS trong thai kỳ và bảng quy đổi liều ICS (`matrices.ts`) chuẩn xác.

---

## V. Kết luận Thẩm định Vòng 4 (Final Verdict)

**`FAIL (5 critical, 4 major)`**
