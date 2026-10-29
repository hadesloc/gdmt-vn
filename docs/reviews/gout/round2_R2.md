# Báo cáo Kiểm toán Dược Lâm sàng & An toàn Thuốc Độc lập — Vòng 2 (Module `gout` – Bệnh Gút Cấp & Mạn)

- **Chuyên gia đánh giá**: **Reviewer R2 — Dược sĩ Lâm sàng & Kiểm toán An toàn Thuốc Độc lập (Clinical Pharmacist & Medication Safety Auditor)**
- **Phạm vi kiểm toán**: Toàn bộ mã nguồn `src/modules/gout/**` (16 files), bộ máy an toàn – gộp thuốc – chuẩn hóa đơn vị toàn cục (`src/engine/**`), cơ sở dữ liệu tri thức dược học (`kb/drugs/*.json`, `kb/thresholds/gout.json`, `kb/citations/gout.json`, `kb/interactions/*.json`, `kb/sources.json`), giao diện nhập liệu (`src/ui/PatientForm.tsx`), đối chiếu nguyên văn với kho tài liệu gốc `Medical_Library_2026` (Nhãn FDA Colcrys, Zyloprim, Uloric, Celebrex, Crestor, Coumadin, Orlynvah/Probenecid; EMA/ANSM Arcoxia SmPC, Desuric SmPC; ACR 2020, EULAR 2016, KDIGO 2024, Bộ Y tế QĐ 361/QĐ-BYT 2014 & QĐ 2388/QĐ-BYT 2024) và kiểm chứng động trực tiếp hàm `evaluate()`.
- **Tính độc lập**: Kiểm toán hoàn toàn độc lập, tuân thủ nghiêm ngặt quy chế cách ly chéo (không đọc bất kỳ báo cáo Vòng 2 nào của R1 hoặc R3) và không chỉnh sửa bất kỳ tập tin nào trong `src/`, `kb/`, `tests/`, `tools/`.

---

## Tóm tắt Điều hành & Phán quyết Kiểm toán (Executive Verdict)

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã định danh phát hiện |
| :--- | :---: | :--- |
| **`critical`** (Nguy kịch – Đe dọa an toàn người bệnh / Sai phác đồ cốt lõi) | **7** | `GOUT-R2-R2-01` → `GOUT-R2-R2-07` |
| **`major`** (Lớn – Bỏ sót DDI trọng yếu, vượt rào chỉ định, dị ứng, trích dẫn treo/sai) | **10** | `GOUT-R2-R2-08` → `GOUT-R2-R2-17` |
| **`minor`** (Nhỏ – Siêu dữ liệu KB chưa đồng bộ, thiếu bảng suy gan / hồ sơ thuốc phụ) | **3** | `GOUT-R2-R2-18` → `GOUT-R2-R2-20` |
| **`suggestion`** (Đề xuất hoàn thiện thực hành dược lâm sàng) | **2** | `GOUT-R2-R2-21` → `GOUT-R2-R2-22` |
| **Tổng cộng** | **22** | — |

> ### Phán quyết Vòng 2 (`verdict`): **`FAIL`**
> *(Theo Quy chế Hội đồng Y khoa `docs/REVIEW_PROTOCOL.md`: `PASS` chỉ được cấp khi `0 critical` VÀ `0 major`. Module `gout` hiện còn **7 lỗi `critical`** và **10 lỗi `major`**, trong đó có các lỗi hồi quy trực tiếp từ bản vá Vòng 1 và một số mục tại `round1_RESPONSE.md` báo cáo đã sửa nhưng chưa được áp dụng vào codebase).*

---

## Phần 1. Đối chiếu Kiểm định Đóng vòng 24 Phát hiện Vòng 1 của R2 (`GOUT-R2-001` .. `GOUT-R2-024`)

Bảng dưới đây đối chiếu toàn bộ 24 phát hiện Vòng 1 (`docs/reviews/gout/round1_R2.json`) với tuyên bố phản hồi tại `docs/reviews/gout/round1_RESPONSE.md` và trạng thái thực tế của mã nguồn + KB hiện hành:

| Mã R1 | Nội dung cốt lõi Vòng 1 | Tuyên bố tại `round1_RESPONSE.md` | Trạng thái xác minh thực tế Vòng 2 | Tham chiếu Vòng 2 |
| :--- | :--- | :--- | :--- | :--- |
| `GOUT-R2-001` | Colchicine + ức chế mạnh CYP3A4/P-gp chưa tách rõ bình thường vs suy thận/gan; danh mục thuốc thiếu | Đã tách rõ & mở rộng danh mục CYP3A4/P-gp | **Sửa một phần / Còn lỗ hổng `critical`**: Đã mở rộng một số thuốc trong `gout/helpers.ts`, nhưng bỏ sót **Paxlovid (`nirmatrelvir_ritonavir`)**, **Cobicistat**, và `gout_metabolic.json` vẫn chỉ có 5 thuốc (thiếu `posaconazole`, `voriconazole`, `ranolazine`, HIV PIs, `fluconazole`, `erythromycin`, `amiodarone`, `dronedarone`, `aprepitant`); ngoài module `gout` không có cổng chặn Colchicine. | `GOUT-R2-R2-03` |
| `GOUT-R2-002` | Allopurinol/Febuxostat + Azathioprine / 6-MP cần chặn cứng hai chiều | Đã bổ sung cổng chặn hai chiều XOI ↔ Azathioprine/6-MP | **Đã sửa trong logic Gout, nhưng lỗi citation KB**: Cổng chặn trong `rules.safety.ult.ts` & `helpers.safety.ts` hoạt động đúng; tuy nhiên `ix.allopurinol_azathioprine` và `ix.febuxostat_azathioprine` trong `gout_metabolic.json` trỏ tới `citationId` không tồn tại. | `GOUT-R2-R2-08` |
| `GOUT-R2-003` | Nguồn `fda_probenecid` dùng nhầm nhãn kháng sinh phối hợp **ORLYNVAH** (`sulopenem + probenecid`) | *"Đã gỡ bỏ hoàn toàn trích dẫn Orlynvah (`fda.probenecid.*`)"* (dòng 39) | **CHƯA SỬA / BÁO CÁO SAI (`major`)**: `kb/sources.json` (dòng 759–768) vẫn trỏ tới PDF Orlynvah; `fda.probenecid.pregnancy` và `fda.probenecid.lactation` (chứa chữ *sulopenem*) vẫn còn nguyên trong `kb/citations/gout.json` (dòng 957–973) và đang được trích dẫn trực tiếp tại `probenecid.json` & `rules.prophylaxis.ts`! | `GOUT-R2-R2-16` |
| `GOUT-R2-004` | Ngưỡng huyết áp Etoricoxib mượn sai ESC HTN 2024 và thiếu trích dẫn `Arcoxia_SmPC.pdf` | *"Đã trích xuất trực tiếp từ `Arcoxia_SmPC.pdf` (`ema.etoricoxib.*`)"* (dòng 41) | **CHƯA SỬA / BÁO CÁO SAI (`major`)**: Không hề có `Arcoxia_SmPC.pdf` trong `kb/sources.json` và 0 mã `ema.etoricoxib.*` trong `kb/citations/gout.json`! `gout.etoricoxib.sbp_contra_max` vẫn gắn `esc.htn.2024.definition_classes`, code chặn sai `>= 140/90` thay vì `> 140/90`, và bỏ sót trần liều suy gan Child-Pugh A (60 mg) / B (30 mg). | `GOUT-R2-R2-17` |
| `GOUT-R2-005` | Chưa rà soát `STOP`/`REDUCE` cho NSAID, Colchicine, Benzbromarone đang dùng sẵn trong `currentMeds` | Đã bổ sung `rules.safety.antiinflam.ts` và `rules.safety.ult.ts` | **Phát sinh lỗi hồi quy `critical`**: Luật mới `gout.safety.colchicine_reduce_active` xung đột với `merge.ts` làm xóa sạch phác đồ cắt cơn gút cấp ở CKD G3 / CYP3A4i vừa; đồng thời kê chồng NSAID khi đang dùng `tenoxicam`/`dexketoprofen` và cho phép `CONTINUE ketorolac`. | `GOUT-R2-R2-02`, `GOUT-R2-R2-06` |
| `GOUT-R2-006` | Colchicine trên bệnh nhân lọc máu (dialysis) cần liều cắt cơn 0.6 mg đơn liều, khóa 14 ngày | Đã cập nhật phác đồ lọc máu & CKD G4–G5 | **Đã sửa triệt để**: Đã tách phác đồ lọc máu (ưu tiên Corticosteroid; lưu ý trần FDA 0.6 mg đơn liều không lặp lại trong 14 ngày). | Đạt |
| `GOUT-R2-007` | Suy gan nặng / xơ gan cần tránh/giảm liều Colchicine dự phòng và khóa lặp lại cắt cơn | Đã bổ sung kiểm tra suy gan trong `checkColchicineSafety` | **LỖI HỒI QUY `critical`**: `checkColchicineSafety` chỉ kiểm tra `hasLiver` khi đi kèm `modInhib`, `eGFR < 30` hoặc `statin/fibrate`! Xơ gan mất bù độc lập (`liverDisease: true, decompensatedCirrhosis: true`) vẫn bị kê đủ liều Colchicine cắt cơn + 3–6 tháng dự phòng hàng ngày; nhập `childPugh: 'C'` qua `customInputs` bị kê thẳng `Naproxen 500 mg BID`! | `GOUT-R2-R2-04` |
| `GOUT-R2-008` | Phân biệt hàm lượng viên Colchicine 0.6 mg (US) vs 1 mg chia vạch (VN/INTL) | Đã tách biểu diễn liều theo `profile` (`US` 1.2 + 0.6 mg vs `VN`/`INTL` 1 + 0.5 mg) | **Đã sửa triệt để** trong văn bản liều khuyến cáo. | Đạt |
| `GOUT-R2-009` | Chặn Benzbromarone và Etoricoxib trên `profile: 'US'` do chưa được FDA phê duyệt | Đã khóa `profiles: ['INTL', 'VN']` cho Benzbromarone và chặn Etoricoxib ở US | **Sửa một phần (`major`)**: Đã khóa khởi trị mới Benzbromarone trên US, NHƯNG `rules.flare.ts` (dòng 253) vẫn phát `[CONTINUE] etoricoxib` trên `profile: 'US'`! | `GOUT-R2-R2-11` |
| `GOUT-R2-010` | Liều khởi đầu Allopurinol ở CKD G3 (`≤ 50 mg/ngày`) vs G4–G5 và tăng liều chậm `≤ 50 mg` | Đã tách khởi trị `≤ 50 mg/ngày` cho CKD G3 và chuẩn độ chậm | **Đã sửa đúng logic lâm sàng** (lưu ý parser liều `parseMedDailyDoseMg` còn lỗi đơn vị `'viên'` và tần suất `'2 lần/ngày'`). | `GOUT-R2-R2-07` |
| `GOUT-R2-011` | Sàng lọc `HLA-B*58:01` trước Allopurinol cho người Việt Nam / Đông Nam Á / Mỹ gốc Phi | Đã bổ sung luật `gout.ult.hlab5801_screening` và chặn khi dương tính | **Đã sửa triệt để**. | Đạt |
| `GOUT-R2-012` | Febuxostat trên bệnh nhân có bệnh tim mạch (CARES trial / FDA Boxed Warning) | Đã ưu tiên Allopurinol và phát cân nhắc chuyển thuốc / chia sẻ quyết định theo ACR 2020 | **Đã sửa đúng định hướng lâm sàng** (còn thiếu trần giảm liều `Rosuvastatin ≤ 20 mg` khi dùng kèm Febuxostat ở ngoài module `lipid`). | `GOUT-R2-R2-10` |
| `GOUT-R2-013` | Trần liều Febuxostat ở suy thận nặng CrCl/eGFR `< 30 mL/phút` (`≤ 40 mg/ngày`) | Đã thêm giới hạn `40 mg/ngày` ở `eGFR/CrCl < 30` | **Sửa một phần (`critical` + `major`)**: Đã thêm nhánh `isSevereRenal`, nhưng (1) mù đơn vị `'viên'` (`Feburic 80mg` 1 viên không giảm liều!) và (2) `return` sớm làm mất hoàn toàn chuyển tuyến Pegloticase khi gút tophi kháng trị ở CKD G4! | `GOUT-R2-R2-07`, `GOUT-R2-R2-12` |
| `GOUT-R2-014` | `allopurinol.json` gắn nhầm citation `eular.gout.2016.benzbromarone_egfr30` cho dải `eGFR 15–30` | Đã ghi nhận rà soát lại citation KB | **CHƯA SỬA (`major`)**: `kb/drugs/allopurinol.json` dòng 74 vẫn gắn `eular.gout.2016.benzbromarone_egfr30`! | `GOUT-R2-R2-17` |
| `GOUT-R2-015` | `benzbromarone.json` gắn nhầm `eular.gout.2016.benzbromarone_hepatic_spc` cho `pregnancy` & `lactation` | Đã ghi nhận cập nhật theo SmPC | **CHƯA SỬA (`major`)**: `kb/drugs/benzbromarone.json` dòng 102–121 vẫn giữ nguyên citation gan cho thai kỳ & cho con bú dù `Desuric_benzbromarone_SmPC.pdf` đã có trong kho! | `GOUT-R2-R2-17` |
| `GOUT-R2-016` | `colchicine.json` để `pregnancy.status: "avoid"` mâu thuẫn với FDA `"caution"` và `rules.prophylaxis.ts` | *"Đã cập nhật `pregnancy.status` sang `caution`"* (dòng 52) | **CHƯA SỬA / BÁO CÁO SAI (`minor`)**: `kb/drugs/colchicine.json` dòng 132 vẫn là `"status": "avoid"`! | `GOUT-R2-R2-18` |
| `GOUT-R2-017` | Bảo vệ thai kỳ & cho con bú toàn diện đối với ULT, NSAID và Corticosteroid | Đã bổ sung luật thai kỳ & cho con bú trong `rules.prophylaxis.ts` | **Phát sinh lỗ hổng UI & Engine (`major`)**: `PatientForm.tsx` gộp chung `'Mang thai / Cho con bú'` vào `pregnant = true` làm phụ nữ cho con bú bị xử lý nhầm như mang thai, ẩn trường `breastfeeding` khỏi UI, và `drugClassify.ts` bỏ sót `meloxicam`/`ketorolac` ở thai phụ ngoài module `gout`. | `GOUT-R2-R2-15` |
| `GOUT-R2-018` | `colchicine.json` có `titration` 7 ngày nhân tạo và biệt dược Mỹ `"Colcrys"` trong `vnBrands` | *"Đã gỡ bỏ `titration` nhân tạo và thay biệt dược VN"* (dòng 86) | **CHƯA SỬA / BÁO CÁO SAI (`minor`)**: `colchicine.json` vẫn nguyên `intervalDays: 7` (dòng 37–41) và `"Colcrys"` trong `vnBrands` (dòng 15)! | `GOUT-R2-R2-18` |
| `GOUT-R2-019` | Khoảng cách uống Aspirin liều thấp trước Ibuprofen/Naproxen và giữ Aspirin dự phòng thứ phát | Đã bổ sung hướng dẫn uống cách ≥ 2 giờ (BYT 361/2014) và giữ Aspirin tim mạch | **Đã sửa triệt để**. | Đạt |
| `GOUT-R2-020` | Tương tác Colchicine + Statin/Fibrate cần cảnh báo bệnh cơ / tiêu cơ vân rõ ràng | Đã bổ sung cảnh báo theo dõi đau cơ / yếu cơ và DDI | **Đã sửa triệt để**. | Đạt |
| `GOUT-R2-021` | Kiểm soát đường huyết khi dùng Prednisolone/Methylprednisolone ở bệnh nhân ĐTĐ / nghi DKA | Đã thêm chặn DKA và cảnh báo theo dõi đường huyết mao mạch | **Đã sửa triệt để**. | Đạt |
| `GOUT-R2-022` | Không kiềm hóa nước tiểu thường quy theo ACR 2020 (phân biệt với lưu ý khoáng kiềm BYT 361/2014) | Đã cập nhật `profileDiff` phân biệt ACR 2020 vs BYT 361/2014 | **Đã sửa triệt để**. | Đạt |
| `GOUT-R2-023` | Trôi làm tròn đơn vị Acid uric khi người dùng chọn `mg/dL` (`6.0 mg/dL * 59.48 = 356.88 < 360`) | Đã thêm nhánh đọc trực tiếp `ctx.patient.uricAcid` khi `urat === 'mg_dL'` | **GÂY LỖI HỒI QUY THẢM KHỐC (`critical`)**: Do `ctx.patient` thực chất là `normalized` (đã nhân `59.48`), nhánh mới lấy giá trị `µmol/L` đem so với ngưỡng `mg/dL`, làm hỏng 100% logic đánh giá đạt đích, sàn `< 3 mg/dL` và chỉ định ULT khi chọn đơn vị `mg/dL`! | `GOUT-R2-R2-01` |
| `GOUT-R2-024` | Tương tác Allopurinol + Amoxicillin/Ampicillin và Probenecid + Methotrexate | Đã thêm vào `kb/interactions/gout_metabolic.json` | **Sửa một phần (`major`)**: Đã thêm luật vào `gout_metabolic.json`, nhưng cả 2 luật đều gắn `citationId` không tồn tại, và vẫn bỏ sót hàng loạt DDI nguy kịch khác (`Benzbromarone + Warfarin`, `Acenocoumarol + NSAID`, `Probenecid + Ketorolac`, `Celecoxib + Fluconazole`). | `GOUT-R2-R2-08`, `GOUT-R2-R2-09` |

---

## Phần 2. Chi tiết 22 Phát hiện Kiểm toán Dược Lâm sàng & An toàn Thuốc Vòng 2

### Nhóm A — Các Phát hiện Mức độ Nguy kịch (`CRITICAL`: 7 phát hiện)

#### 1. `GOUT-R2-R2-01` [`critical` | `rule`] — Lỗi nhân đôi chuẩn hóa đơn vị Acid uric (`Double-Normalization Bug`) làm sụp đổ toàn bộ phác đồ khi chọn đơn vị `mg/dL`
- **Vị trí**: [`src/modules/gout/helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L378-L496) (`isUrateBelowTarget`, `isUrateBelowLongTermFloor`, `assessUltIndication`) & [`src/engine/evaluate.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/evaluate.ts#L50-L61).
- **Phân tích dược lâm sàng & cơ chế lỗi**:
  Tại [`evaluate.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/evaluate.ts#L50-L58), `normalizePatientUnits(rawPatient, settings.units, allInputFields)` đã nhân `rawPatient.uricAcid` với `59.48` (đổi từ `mg/dL` sang `µmol/L`) rồi gán `ctx.patient = normalized`. Thế nhưng trong [`gout/helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L381-L484), cả 4 phép so sánh khi `ctx.settings.units?.urat === 'mg_dL'` đều lấy `ctx.patient.uricAcid` (lúc này đã là `µmol/L`!) đem so trực tiếp với các ngưỡng `mg/dL` (`6`, `5`, `3`, `9`, `8`):
  1. `isUrateBelowTarget`: bệnh nhân có `sUA = 4.2 mg/dL` (`normalized = 249.82`) bị tính `249.82 < 6` → **`false`** → bị coi là chưa đạt đích, bị tăng liều `UPTITRATE` liên tục và bị chuyển tuyến `REFER` truyền tĩnh mạch Pegloticase oan!
  2. `isUrateBelowLongTermFloor`: bệnh nhân bị hạ urat nặng `sUA = 1.8 mg/dL` (`normalized = 107.06`) bị tính `107.06 < 3` → **`false`** → mất hoàn toàn cảnh báo `< 3 mg/dL` của EULAR 2016 và vẫn bị `UPTITRATE Allopurinol +100 mg`!
  3. `assessUltIndication`: bệnh nhân cơn gút đầu tiên không biến chứng có `sUA = 6.8 mg/dL` (`normalized = 404.46`) bị tính `404.46 > 9` → **`true`** → bị kết luận sai là *"Acid uric máu rất cao (> 535 µmol/L [9 mg/dL])"* và khởi trị oan Allopurinol suốt đời + Colchicine 3–6 tháng!
- **Bằng chứng kiểm chứng động `evaluate()` & Tài liệu gốc**:
  - **Ca thực nghiệm E1** (`urat: 'mg_dL'`, `uricAcid: 1.8`, `allopurinol 300 mg`, `profile: 'INTL'`): trả về `[UPTITRATE] rec_gout_allopurinol_uptitrate ("Chuẩn độ tăng liều Allopurinol thêm 100 mg/ngày")` + `[START] rec_gout_colchicine_prophylaxis`, không có cảnh báo sàn `< 3 mg/dL`.
  - **Ca thực nghiệm E2** (`urat: 'mg_dL'`, `uricAcid: 4.2`, `febuxostat 80 mg`, `allopurinolIntolerant: true`, `profile: 'US'`): trả về `[REFER] rec_gout_febuxostat_max_refractory ("Đã chạm liều tối đa Febuxostat (80 mg/ngày) nhưng chưa đạt đích Acid uric")`.
  - **Ca thực nghiệm First-Flare** (`urat: 'mg_dL'`, `uricAcid: 6.8`, `goutFlaresYear: 1, priorFlaresLifetime: 1, egfr: 85`, `profile: 'US'`): trả về `[START] rec_gout_allopurinol_start` kèm lý giải sai `"Cơ sở lâm sàng: Acid uric máu rất cao (> 535 µmol/L [9 mg/dL])"`.
  - **ACR 2020** (`ACR_2020_Gout_Guideline.pdf`, tr. 6 & 9): *"Initiating ULT is conditionally recommended against in patients with gout experiencing their first gout flare"*; *"Achieving and maintaining an SU target of <6 mg/dl... is strongly recommended"*. **EULAR 2016** (`EULAR_2016_Gout_Recommendations.pdf`, tr. 3): *"SUA <3 mg/dL is not recommended in the long term."*
- **Hướng khắc phục**:
  Quy đổi từ giá trị chuẩn hóa `urateUmol` (`need(ctx, 'urate')`) về `mg/dL` bằng `const urateMgDl = Math.round((urateUmol / 59.48) * 100) / 100` khi `ctx.settings.units?.urat === 'mg_dL'` (hoặc truyền `rawPatient` riêng biệt trên `RuleContext`), và bổ sung bộ kiểm thử tự động song song cho cả `'umol_L'` và `'mg_dL'`.

---

#### 2. `GOUT-R2-R2-02` [`critical` | `rule`] — Xung đột `REDUCE` vs `START` tại `merge.ts` xóa trắng thuốc cắt cơn gút cấp VÀ vi phạm nhãn FDA Colcrys khi đang uống Colchicine dự phòng nền
- **Vị trí**: [`src/modules/gout/rules.safety.antiinflam.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.safety.antiinflam.ts#L219-L289), [`src/modules/gout/rules.flare.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.flare.ts#L173-L249), [`src/engine/merge.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/merge.ts#L88-L242).
- **Phân tích dược lâm sàng & cơ chế lỗi**:
  1. **Mất trắng thuốc kháng viêm cắt cơn cấp**: Khi bệnh nhân có CKD giai đoạn 3 (`eGFR 30–59`), tuổi `> 70`, hoặc đang dùng chất ức chế vừa CYP3A4 (`verapamil`, `diltiazem`, `fluconazole`, `erythromycin`) đang uống sẵn `colchicine 1 mg/ngày` và nhập viện/khám vì **cơn gút cấp (`acuteFlare: true`)**:
     - `gout.acute_flare.treatment` chọn Colchicine cắt cơn (`START`, bị `merge.ts:88` đổi thành `CONTINUE` điểm ưu tiên `40`) rồi `return` sớm, KHÔNG kê Prednisolone.
     - Cùng lúc, `gout.safety.colchicine_reduce_active` phát `REDUCE colchicine` xuống liều dự phòng `0.5 mg/ngày` hoặc cách ngày (điểm ưu tiên `70 > 40`), ghi đè hoàn toàn tiêu đề, liều dùng và lý giải của thẻ cắt cơn cấp! Kết quả: bệnh nhân đang đau gút cấp dữ dội không có Prednisolone, không có NSAID, và thẻ Colchicine duy nhất chỉ bảo uống `0.5 mg/ngày`!
  2. **Vi phạm trực tiếp 3 mục cảnh báo của nhãn FDA Colcrys (Section 2.4, 2.5, 2.6)**: Khi bệnh nhân đang uống Colchicine dự phòng `0.5 mg/ngày` kèm thuốc ức chế CYP3A4 (`verapamil`), suy thận (`eGFR 45`) hoặc suy gan vào cơn gút cấp, hệ thống vẫn kê liều nạp Colchicine cắt cơn chồng lên nền dự phòng thay vì đổi sang Corticosteroid!
- **Bằng chứng kiểm chứng động `evaluate()` & Tài liệu gốc**:
  - **Ca 1A** (`egfr: 45`, `currentMeds: [allopurinol 100 mg, colchicine 1 mg]`, `acuteFlare: true`): chỉ sinh `[AVOID] naproxen` và `[REDUCE] rec_gout_colchicine_reduce_active ("0.5 mg x 1 lần/ngày")` — **0 thuốc cắt cơn cấp**!
  - **Ca 1B & 1C** (`colchicine 0.5 mg` + `verapamil 240 mg` hoặc `egfr: 45`, `acuteFlare: true`): sinh `[CONTINUE] rec_gout_colchicine_acute_flare_reduced` / `rec_gout_colchicine_acute_flare` (nạp chồng Colchicine cắt cơn trên nền đang uống Colchicine dự phòng!).
  - **Nhãn FDA COLCRYS** (`09_Nhan_Thuoc/FDA/FDA_label_colchicine.pdf`):
    - Section 2.4 (tr. 9): *"Treatment of gout flares with COLCRYS is not recommended in patients receiving prophylactic dose of COLCRYS and CYP3A4 inhibitors."*
    - Section 2.5 (tr. 9): *"Treatment of gout flares with COLCRYS is not recommended in patients with renal impairment who are receiving COLCRYS for prophylaxis."*
    - Section 2.6 (tr. 10): *"Treatment of gout flares with COLCRYS is not recommended in patients with hepatic impairment who are receiving COLCRYS for prophylaxis."*
- **Hướng khắc phục**:
  Trong `checkColchicineSafety` (`helpers.safety.ts`), khi bệnh nhân đã có `colchicine` trong `currentMeds` VÀ kèm suy thận (`eGFR < 60` / `CrCl < 80`), suy gan, hoặc bất kỳ thuốc ức chế CYP3A4/P-gp nào, đặt `avoidFlare = true` để `gout.acute_flare.treatment` tự động chuyển sang Prednisolone (hoặc tiêm nội khớp) cắt cơn an toàn, đồng thời giữ `REDUCE` cho liều dự phòng nền mà không làm mất thuốc cắt cơn.

---

#### 3. `GOUT-R2-R2-03` [`critical` | `drug`] — Bỏ sót tương tác gây tử vong của Colchicine với Paxlovid (`nirmatrelvir_ritonavir`), Cobicistat và nhiều chất ức chế CYP3A4/P-gp trong Gout & Engine toàn cục
- **Vị trí**: [`src/modules/gout/helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L132-L151), [`kb/interactions/gout_metabolic.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/gout_metabolic.json#L60-L125), [`src/engine/safety/gates.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts#L192-L199), [`src/engine/safety/reviewMeds.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMeds.ts#L200-L206).
- **Phân tích dược lâm sàng & cơ chế lỗi**:
  - `nirmatrelvir_ritonavir` (Paxlovid — mã thuốc chuẩn đã khai báo tại `kb/interactions/statin.json` dòng 292) chứa Ritonavir ức chế cực mạnh CYP3A4/P-gp, gây ngộ độc Colchicine giảm ba dòng tế bào máu / suy đa tạng tử vong (đặc biệt chống chỉ định tuyệt đối ở suy thận/gan). Tuy nhiên `nirmatrelvir_ritonavir` không có file trong `kb/drugs/` (không tách thành phần `ritonavir`), thiếu trong `STRONG_CYP3A4_PGP_INHIBITORS` của `gout/helpers.ts`, thiếu trong `ix.colchicine_strong_cyp3a4`, và `colchicine` cũng bị bỏ sót khỏi cổng CYP3A4 toàn cục (`gates.ts` & `reviewMeds.ts`).
  - Trong `kb/interactions/gout_metabolic.json`, `ix.colchicine_strong_cyp3a4` chỉ có 5 thuốc (bỏ sót `nirmatrelvir_ritonavir`, `cobicistat`, `posaconazole`, `voriconazole`, `ranolazine`, `atazanavir`, `darunavir`, `lopinavir`, `saquinavir`, `indinavir`, `nelfinavir`, `tipranavir`, `telithromycin`, `nefazodone`), còn `ix.colchicine_p_gp_inhibitors` chỉ có `diltiazem` và `verapamil` (bỏ sót `fluconazole`, `erythromycin`, `amiodarone`, `dronedarone`, `aprepitant`, `fosamprenavir`).
- **Bằng chứng kiểm chứng động `evaluate()` & Tài liệu gốc**:
  - **Ca 2A** (`egfr: 45`, `nirmatrelvir_ritonavir` + `colchicine 0.6 mg`, `acuteFlare: true`): KHÔNG phát `STOP`/`AVOID` Colchicine, chỉ phát `REDUCE 0.5 mg/ngày`, `alerts = []`!
  - **Ca 2B** (`egfr: 45`, `posaconazole` + `darunavir` + `colchicine`): `alerts = []`!
  - **Ca 2C** (`selectedModules: ['htn']`, `egfr: 42`, `colchicine 1 mg` + `nirmatrelvir_ritonavir` + `fluconazole` + `amiodarone`): **0 khuyến cáo `STOP`/`REDUCE` Colchicine** và `alerts = []`!
  - **Nhãn FDA COLCRYS** (`FDA_label_colchicine.pdf`, Section 2.4 Table 1 & Table 2, Section 4, tr. 5–10): *"Patients with renal or hepatic impairment should not be given COLCRYS in conjunction with P-gp or strong CYP3A4 inhibitors (this includes all protease inhibitors except fosamprenavir). In these patients, life-threatening and fatal colchicine toxicity has been reported with colchicine taken in therapeutic doses."*
- **Hướng khắc phục**:
  Đồng bộ toàn bộ danh mục chất ức chế mạnh và vừa CYP3A4 / P-gp (bao gồm `nirmatrelvir_ritonavir`, `cobicistat`, các thuốc kháng nấm azole, kháng virus HIV PI, `ranolazine`, `amiodarone`, `dronedarone`, `fluconazole`, `erythromycin`, `aprepitant`) vào cả `gout/helpers.ts`, `kb/interactions/gout_metabolic.json` và cổng toàn cục `gates.ts` / `reviewMeds.ts`.

---

#### 4. `GOUT-R2-R2-04` [`critical` | `rule`] — Lỗi hồi quy Xơ gan mất bù / Child-Pugh C: kê Colchicine đủ liều + dự phòng 3–6 tháng và kê thẳng Naproxen 500 mg BID khi nhập `childPugh: 'C'`
- **Vị trí**: [`src/modules/gout/helpers.safety.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L193-L338) & [`src/engine/units.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/units.ts#L181-L190).
- **Phân tích dược lâm sàng & cơ chế lỗi**:
  1. Trong `checkColchicineSafety` (`helpers.safety.ts:193-302`), biến `hasLiver` chỉ được xét khi kết hợp với `modInhib`, `egfr < 30` hoặc `statin/fibrate`. Khi bệnh nhân bị **xơ gan mất bù đơn độc** (`conditions: { gout: true, liverDisease: true, decompensatedCirrhosis: true }`, `egfr: 75`), hàm trả về `avoidFlare = false, avoidProphylaxis = false, needsReducedDose = false` — kê Colchicine cắt cơn đủ liều (`1.2 + 0.6 mg`) VÀ dự phòng hàng ngày suốt 3–6 tháng không giảm liều, không khóa lặp lại 14 ngày!
  2. Khi bác sĩ nhập `customInputs: { childPugh: 'C', altUln: 4 }` mà chưa tích riêng `conditions.liverDisease`, `normalizePatientUnits` (`units.ts`) không tự động gán `liverDisease = true` và `isNsaidHardContraindicated` không đọc `childPugh` — khiến hệ thống **kê thẳng `START naproxen 500 mg x 2 lần/ngày` cho bệnh nhân xơ gan Child-Pugh C** (nguy cơ hội chứng gan-thận cấp và xuất huyết giãn tĩnh mạch thực quản tử vong)!
- **Bằng chứng kiểm chứng động `evaluate()` & Tài liệu gốc**:
  - **Ca 3A** (`liverDisease: true, decompensatedCirrhosis: true, egfr: 75`): phát `[START] rec_gout_colchicine_acute_flare ("1.2 mg ngay khi khởi phát cơn, sau đó 0.6 mg sau 1 giờ")` + dự phòng 3–6 tháng không giảm liều.
  - **Ca 3B** (`customInputs: { childPugh: 'C', altUln: 4 }`, đang dùng `clarithromycin`, `acuteFlare: true`): phát `[START] rec_gout_nsaid_acute_flare` (`naproxen 500 mg x 2 lần/ngày`)!
  - **Nhãn FDA COLCRYS** (`FDA_label_colchicine.pdf`, Section 2.6 tr. 10 & Section 8.7 tr. 15): *"The clearance of colchicine may be significantly reduced and plasma half-life prolonged in patients with chronic hepatic impairment... Dose reduction should be considered for the prophylaxis of gout flares in patients with severe hepatic impairment... a treatment course should be repeated no more than once every two weeks."*
- **Hướng khắc phục**:
  Liên thông tự động `childPugh` (`'B'`, `'C'`), `decompensatedCirrhosis` và `altUln >= 3` vào trạng thái bệnh gan trong `units.ts` và `helpers.safety.ts`; ở suy gan nặng / Child-Pugh C chặn tuyệt đối mọi NSAID/COX-2i (kể cả trong `clinicalStates.ts`), tránh dự phòng Colchicine hàng ngày không giảm liều và ưu tiên Prednisolone cho cơn gút cấp.

---

#### 5. `GOUT-R2-R2-05` [`critical` | `rule`] — Phân loại sai nhóm dược lý tại `drugClassify.ts` biến Probenecid & Benzbromarone thành thuốc XOI, phát báo động giả `dup.xoi` chống chỉ định khi phối hợp `Allopurinol + Probenecid/Benzbromarone`
- **Vị trí**: [`src/engine/safety/drugClassify.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/drugClassify.ts#L175-L177) & [`src/engine/safety/duplicateRules.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/duplicateRules.ts#L249-L257).
- **Phân tích dược lâm sàng & cơ chế lỗi**:
  Dòng 175–177 của `drugClassify.ts` viết: `else if (rawClass === 'xoi' || classes.has('urate_lowering')) { classes.add('xoi'); classes.add('urate_lowering'); }`. Vì `probenecid.json` và `benzbromarone.json` đều có `classes: ["urate_lowering", "uricosuric"]`, cả hai thuốc tăng thải acid uric đều bị đóng dấu nhầm là `'xoi'`! Do đó, mọi phác đồ phối hợp chuẩn mực `Allopurinol/Febuxostat + Probenecid/Benzbromarone` đều kích hoạt cảnh báo đỏ sai lệch `dup.xoi`!
- **Bằng chứng kiểm chứng động `evaluate()` & Tài liệu gốc**:
  - **Ca 9A, 9B & E6** (`currentMeds: [allopurinol 300 mg, probenecid 500 mg BID]` hoặc `[allopurinol 300 mg, benzbromarone 100 mg]`): phát `SafetyAlert` mức `critical`: `{"id": "dup.xoi", "title": "Chống chỉ định phối hợp 2 thuốc ức chế Xanthine Oxidase (Allopurinol + Febuxostat)", "drugIds": ["allopurinol", "probenecid"]}`!
  - **EULAR 2016** (`EULAR_2016_Gout_Recommendations.pdf`, Rec 8, tr. 3): *"benzbromarone with or without allopurinol"*; **ACR 2020** (tr. 11): *"add-on therapy to partially responsive xanthine oxidase inhibitor (XOI) treatment can result in improved SU control"*; **BYT QĐ 361/2014** (tr. 94): *"Đôi khi có thể dùng phối hợp allopurinol với một loại thuốc tăng đào thải acid uric."*
- **Hướng khắc phục**:
  Tại `drugClassify.ts:175`, chỉ gán `'xoi'` khi `rawClass === 'xoi' || classes.has('xoi')`; tách riêng `'uricosuric'` và thêm luật `dup.uricosuric` trong `duplicateRules.ts` để chỉ chặn khi dùng đồng thời 2 thuốc nhóm uricosuric (`probenecid + benzbromarone`).

---

#### 6. `GOUT-R2-R2-06` [`critical` | `rule`] — Kê chồng 2 thuốc NSAID toàn thân (`Dual NSAID Stacking`) không cảnh báo VÀ cho phép `CONTINUE ketorolac` cắt cơn gút
- **Vị trí**: [`src/modules/gout/helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L120-L131), [`src/modules/gout/rules.flare.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.flare.ts#L251-L286), [`src/engine/safety/duplicateRules.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/duplicateRules.ts), [`src/engine/mergeConflictGroups.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/mergeConflictGroups.ts).
- **Phân tích dược lâm sàng & cơ chế lỗi**:
  1. Hệ thống chưa có luật `dup.nsaid` trong `duplicateRules.ts` và chưa có nhóm `'nsaid'` trong `mergeConflictGroups.ts`. Đồng thời `NSAID_DRUG_IDS` trong `gout/helpers.ts` chỉ có 10 thuốc, bỏ sót `tenoxicam`, `dexketoprofen`, `loxoprofen`, `parecoxib`, `flurbiprofen`, `mefenamic_acid`, `sulindac`, `nabumetone` và `aspirin` liều giảm đau `>= 325 mg` (dù `drugClassify.ts` dòng 408–428 đã nhận diện các thuốc này là NSAID!). Khi bệnh nhân đang uống `tenoxicam 20 mg` vào cơn gút cấp, hệ thống kê chồng thêm `START naproxen 500 mg BID` mà không dừng `tenoxicam` và `alerts = []`!
  2. `ketorolac` được xếp chung trong `NSAID_DRUG_IDS` khiến `rules.flare.ts` phát `CONTINUE ketorolac` cho gút cấp, vi phạm Boxed Warning của FDA Toradol (giới hạn tổng thời gian dùng tối đa ≤ 5 ngày do nguy cơ thủng/xuất huyết tiêu hóa và suy thận cấp tử vong).
- **Bằng chứng kiểm chứng động `evaluate()`**:
  - **Ca 4A** (`tenoxicam 20 mg` + `clarithromycin`, `acuteFlare: true`): phát `[START] naproxen 500 mg x 2 lần/ngày` chồng lên `tenoxicam`, `alerts = []`.
  - **Ca 4B** (`ketorolac 10 mg QID` + `celecoxib 200 mg BID`, `acuteFlare: true`): phát `[CONTINUE] ketorolac` và `alerts = []`.
- **Hướng khắc phục**:
  Thêm `dup.nsaid` vào `duplicateRules.ts` + nhóm `'nsaid'` vào `mergeConflictGroups.ts`; đồng bộ danh mục NSAID của `gout/helpers.ts` với `drugClassify.ts`; loại `ketorolac` (và `parecoxib`) khỏi danh sách `CONTINUE` điều trị gút ngoại trú (chuyển sang `STOP`/`SWITCH`).

---

#### 7. `GOUT-R2-R2-07` [`critical` | `rule`] — Lỗi phân tích liều `parseMedDailyDoseMg` mù đơn vị `'viên'` và sai regex tần suất tiếng Việt (`'2 lần/ngày'`, `'cách ngày'`) gây quá liều độc ở suy thận & vượt trần FDA
- **Vị trí**: [`src/modules/gout/helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.ts#L219-L249).
- **Phân tích dược lâm sàng & cơ chế lỗi**:
  1. **Mù đơn vị `'viên'`**: Khi bác sĩ/bệnh nhân nhập `{ drugId: 'febuxostat', name: 'Feburic 80mg', dose: 1, unit: 'viên' }`, hàm trả về `1` (coi như `1 mg <= 40 mg`!), bỏ qua hàm lượng `80mg` trong tên thuốc. Ở bệnh nhân suy thận nặng `eGFR = 20`, hệ thống phát `CONTINUE` liều độc 80 mg thay vì `REDUCE` xuống 40 mg/ngày! Tương tự, `3 viên Zyloric 300mg` (`900 mg/ngày > 800 mg` trần FDA) bị đọc thành `3 mg` và phát `UPTITRATE`!
  2. **Sai regex tần suất tiếng Việt**: Biểu thức `/(?:x|×)\s*(\d+)\s*lần/` đòi hỏi bắt buộc chữ `x`/`×`, nên chuỗi chuẩn `"2 lần/ngày"` không khớp (`multMatch = null`, hệ số nhân = `1`)! Hệ quả: `allopurinol 400 mg "2 lần/ngày"` (`= 800 mg/ngày` kịch trần FDA) bị đọc là `400 mg` và phát `UPTITRATE` vượt trần 800 mg; `colchicine 0.5 mg "2 lần/ngày"` (`= 1.0 mg/ngày`) ở CKD G3 (`eGFR = 40`) bị đọc là `0.5 mg` nên bỏ sót hoàn toàn `REDUCE`! Ngược lại, `colchicine 1 mg "cách ngày"` (`= 0.5 mg/ngày`) không được nhân `0.5`, gây phát `REDUCE` giả tạo!
- **Bằng chứng kiểm chứng động `evaluate()` & Tài liệu gốc**:
  - **Ca 5A** (`egfr: 20`, `Feburic 80mg` `1 viên`): phát `[CONTINUE] rec_gout_febuxostat_renal_cap` thay vì `[REDUCE]`.
  - **Ca 5B** (`egfr: 40`, `allopurinol 400 mg "2 lần/ngày"` + `colchicine 0.5 mg "2 lần/ngày"`): phát `[UPTITRATE] allopurinol` vượt trần 800 mg/ngày VÀ bỏ sót `[REDUCE] colchicine`!
  - **Ca 5C** (`egfr: 40`, `colchicine 1 mg "cách ngày"`): phát sai `[REDUCE] colchicine`.
  - **Nhãn FDA Zyloprim** (`FDA_label_allopurinol.pdf`, tr. 4): *"without exceeding the maximum recommended dose (800 mg per day)"*; **FDA Uloric** (`FDA_label_febuxostat.pdf`, tr. 4): *"limited to 40 mg once daily in patients with severe renal impairment"*.
- **Hướng khắc phục**:
  Trích xuất hàm lượng `mg` từ `med.name` khi `unit` là `'viên'`/`'tab'`/`'cap'` (nếu không rõ hàm lượng thì trả về `undefined` fail-closed); sửa regex tần suất cho phép vắng ký tự `x`/`×` (`/(?:(?:x|×)\s*)?(\d+)\s*lần/i`, `/ngày\s*(\d+)\s*lần/i`) và hỗ trợ hệ số `0.5` cho `'cách ngày'` / `'mỗi 48 giờ'` / `'q48h'`.

---

### Nhóm B — Các Phát hiện Mức độ Lớn (`MAJOR`: 10 phát hiện)

#### 8. `GOUT-R2-R2-08` [`major` | `citation`] — Toàn bộ 6/6 luật tương tác thuốc trong `kb/interactions/gout_metabolic.json` trỏ tới `citationId` không tồn tại (Dangling Citations)
- **Vị trí**: [`kb/interactions/gout_metabolic.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/gout_metabolic.json#L1-L180).
- **Chi tiết & Bằng chứng**: Đối chiếu 6 mã trích dẫn trong `gout_metabolic.json` (`fda.allopurinol.azathioprine_dose_reduction`, `fda.febuxostat.contraindication_azathioprine`, `fda.colchicine.contraindication_renal_hepatic`, `fda.colchicine.diltiazem_verapamil_dose`, `fda.allopurinol.ampicillin_amoxicillin_rash`, `fda.probenecid.methotrexate_toxicity`) với toàn bộ `kb/citations/*.json` xác nhận **cả 6/6 mã đều không tồn tại**!
- **Hướng khắc phục**: Nối lại sang đúng các mã đã xác thực trong `kb/citations/gout.json` (`fda.allopurinol.azathioprine_6mp`, `fda.febuxostat.azathioprine_contra`, `fda.colchicine.contra_cyp3a4_pgp`, `fda.colchicine.table1_moderate_cyp3a4`, `fda.allopurinol.ampicillin_rash`), tạo citation nguyên văn cho `ix.probenecid_methotrexate`, và bổ sung kiểm tra `InteractionRule.citations` vào `tools/kb/verifyKb.ts`.

---

#### 9. `GOUT-R2-R2-09` [`major` | `missing`] — Bỏ sót nhiều tương tác thuốc nguy hiểm (`Benzbromarone + Warfarin/Acenocoumarol`, `Acenocoumarol + NSAID`, `Allopurinol + VKA/Thiazide`, `Celecoxib + Fluconazole`, `Probenecid + Ketorolac`, `NSAID + Corticoid/Clopidogrel`)
- **Vị trí**: [`kb/interactions/gout_metabolic.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/gout_metabolic.json), [`kb/interactions/anticoagulant.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/anticoagulant.json#L204-L210), [`src/modules/gout/helpers.safety.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L340-L366).
- **Bằng chứng `evaluate()` & Nhãn gốc**:
  - `benzbromarone 100 mg + warfarin 5 mg` (Ca 7A): `alerts = []` dù **Desuric SmPC** (tr. 2) cảnh báo ức chế CYP2C9 làm tăng mạnh tác dụng chống đông và nguy cơ xuất huyết (*"Augmentation de l'effet anticoagulant oral et du risque hémorragique"*).
  - `acenocoumarol 4 mg + celecoxib 200 mg BID + fluconazole 200 mg + probenecid 500 mg BID + ketorolac 10 mg` (Ca 7B): `alerts = []` (do `ix.warfarin_nsaid` thiếu `acenocoumarol`, thiếu DDI `celecoxib + fluconazole` tăng gấp đôi nồng độ Celecoxib theo **FDA Celebrex** tr. 22 & 31, và thiếu chống chỉ định tuyệt đối `probenecid + ketorolac` theo **FDA Probenecid/Orlynvah** Table 2 tr. 6).
  - `prednisolone 10 mg + clopidogrel 75 mg + clarithromycin` vào cơn gút cấp (Ca 7C): `isNsaidAvoidedInGout` không kiểm tra Corticoid nền hay kháng tiểu cầu P2Y12 nên kê `START naproxen 500 mg BID` và tự kích hoạt cảnh báo đỏ `ix.nsaid_corticosteroid_gi_bleed`!
- **Hướng khắc phục**: Bổ sung đầy đủ các luật DDI trên vào `gout_metabolic.json`, thêm `'acenocoumarol'` vào `ix.warfarin_nsaid` (`anticoagulant.json`), và cập nhật `isNsaidAvoidedInGout` tránh kê mới NSAID trên nền Corticosteroid toàn thân hoặc kháng tiểu cầu P2Y12 / DAPT.

---

#### 10. `GOUT-R2-R2-10` [`major` | `rule`] — Thiếu lệnh hành động `REDUCE Rosuvastatin ≤ 20 mg/ngày` khi phối hợp `Febuxostat` ở ngoài module `lipid`
- **Vị trí**: [`src/engine/safety/reviewMedsSpecialized.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMedsSpecialized.ts#L385-L551) & [`kb/drugs/febuxostat.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/febuxostat.json).
- **Bằng chứng `evaluate()` & Nhãn gốc**: Khi chỉ chọn `selectedModules: ['gout']` (Ca E5: bệnh nhân đang uống `rosuvastatin 40 mg` + `febuxostat 40 mg`), hệ thống tăng liều `febuxostat 80 mg` + khởi trị `colchicine` mà KHÔNG sinh khuyến cáo `REDUCE rosuvastatin ≤ 20 mg/ngày` (do `reviewStatinDoseCaps` chỉ kiểm tra `simvastatin` và `pravastatin`), vi phạm **Nhãn FDA CRESTOR** (`FDA_label_rosuvastatin.pdf`, Section 7.1, tr. 13): *"In patients taking febuxostat, do not exceed a dosage of CRESTOR 20 mg once daily. Febuxostat increased rosuvastatin exposure more than 1.9-fold."*
- **Hướng khắc phục**: Bổ sung trần liều `rosuvastatin ≤ 20 mg/ngày` khi dùng kèm `febuxostat`/`ticagrelor` (và `≤ 5 mg/ngày` khi dùng kèm `cyclosporine`) vào `reviewStatinDoseCaps` (`reviewMedsSpecialized.ts`) và thêm tương tác `rosuvastatin` vào `febuxostat.json`.

---

#### 11. `GOUT-R2-R2-11` [`major` | `rule`] — Cờ `preferProbenecid`/`preferBenzbromarone` vượt rào `assessUltIndication` (kê ULT ngay cơn gút đầu tiên chưa có chỉ định!), khởi trị Probenecid giữa cơn cấp trên `US`/`INTL`, và cho phép `CONTINUE etoricoxib` trên `profile: 'US'`
- **Vị trí**: [`src/modules/gout/rules.uricosuric.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.uricosuric.ts#L55-L315) & [`src/modules/gout/rules.flare.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.flare.ts#L253).
- **Bằng chứng `evaluate()`**:
  - **Ca E4** (cơn gút cấp đầu tiên không biến chứng `ultIndication = 'not_indicated'`, `preferProbenecid: true`, `profile: 'US'`): phát cùng lúc 2 khuyến cáo tự mâu thuẫn `[DEFER] Chưa có chỉ định khởi trị thuốc hạ acid uric máu (ULT)` VÀ `[START] Khởi trị Probenecid liều thấp 500 mg x 1–2 lần/ngày` ngay trong cơn cấp!
  - **Ca 8B** (`etoricoxib 120 mg`, `profile: 'US'`): vẫn phát `[CONTINUE] etoricoxib` dù Etoricoxib không được FDA phê duyệt tại Mỹ.
- **Hướng khắc phục**: Bắt buộc kiểm tra `canInitiateUltNow(ctx)` trước mọi lệnh `START` trong `rules.uricosuric.ts`, đồng bộ quy tắc không khởi trị mới uricosuric khi chưa kiểm soát cơn cấp, và chặn `CONTINUE etoricoxib` trên `profile === 'US'` (phát `SWITCH` sang NSAID được FDA phê duyệt hoặc Prednisolone).

---

#### 12. `GOUT-R2-R2-12` [`major` | `rule`] — Lỗ hổng Gút kháng trị & Pegloticase: `return` sớm ở CKD G4 làm mất chuyển tuyến, chưa loại trừ gút nhẹ, và bỏ sót 2 Boxed Warnings sống còn (tầm soát G6PD & bắt buộc ngừng ULT uống để phòng sốc phản vệ)
- **Vị trí**: [`src/modules/gout/rules.ult.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ult.ts#L206-L427) & [`src/modules/gout/rules.uricosuric.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.uricosuric.ts#L190-L362).
- **Bằng chứng `evaluate()` & Tài liệu gốc**:
  - **Ca E3** (CKD G4 `egfr: 24`, `tophi: true`, `allopurinolIntolerant: true`, `febuxostat 40 mg` kịch trần thận, `uricAcid: 520 µmol/L`): do `isSevereRenal` return sớm ở dòng 375, hệ thống chỉ phát `CONTINUE febuxostat 40 mg` mà bỏ sót hoàn toàn `REFER` gút tophi kháng trị!
  - Ngược lại, ở bệnh nhân chạm trần ULT uống nhưng `< 2 đợt/năm` và không có tophi, **ACR 2020** (tr. 12) khuyến cáo **MẠNH KHÔNG dùng Pegloticase** (*"Switching to pegloticase over continuing current ULT is strongly recommended against... infrequent gout flares (<2 flares/year) AND no tophi"*).
  - Đặc biệt, cả 4 khuyến cáo `REFER` Pegloticase đều thiếu 2 quy tắc an toàn bắt buộc của Pegloticase: **(1) Tầm soát thiếu men G6PD** trước truyền (chống chỉ định tuyệt đối do tan máu cấp và methemoglobin máu) và **(2) Ngừng toàn bộ thuốc ULT đường uống trước khi truyền Pegloticase** (tránh che lấp nồng độ sUA tăng > 6 mg/dL báo hiệu kháng thể kháng thuốc gây sốc phản vệ nặng).
- **Hướng khắc phục**: Kiểm tra đáp ứng sUA sau khi áp trần thận Febuxostat 40 mg để không bỏ sót chuyển tuyến gút tophi kháng trị ở CKD G4–G5; phân nhánh rõ `tophi || flares >= 2` vs gút nhẹ theo ACR 2020; và bổ sung đầy đủ 2 cảnh báo bắt buộc (sàng lọc G6PD + ngừng mọi ULT uống & theo dõi sUA trước mỗi lần truyền) vào tất cả các khuyến cáo Pegloticase.

---

#### 13. `GOUT-R2-R2-13` [`major` | `rule`] — Xử lý sai phác đồ phối hợp `XOI + Uricosuric`: làm rơi thuốc thứ hai trong cơn cấp/nội trú nhưng lại `UPTITRATE` đồng thời cả 2 thuốc khi tái khám mạn tính
- **Vị trí**: [`src/modules/gout/rules.flare.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.flare.ts#L345), [`src/modules/gout/rules.inpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.inpatient.ts#L36), [`src/modules/gout/rules.ult.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.ult.ts#L128), [`src/modules/gout/rules.uricosuric.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.uricosuric.ts#L55).
- **Bằng chứng `evaluate()`**: Ở bệnh nhân đang dùng `allopurinol 300 mg + probenecid 500 mg BID`, khi vào cơn cấp (Ca 9A) `.find()` chỉ phát `CONTINUE allopurinol` và đánh rơi `probenecid`; khi tái khám mạn tính chưa đạt đích (Ca 9B), hệ thống phát đồng thời cả `[UPTITRATE] allopurinol` lẫn `[UPTITRATE] probenecid` trong cùng một lần khám!
- **Hướng khắc phục**: Duyệt `.filter()` để giữ đầy đủ các thuốc ULT hợp lệ trong cơn cấp / nội trú; ở ngoại trú mạn tính chỉ chuẩn độ từng thuốc một (ưu tiên tối ưu liều XOI tới liều dung nạp tối đa trước khi tăng liều Uricosuric).

---

#### 14. `GOUT-R2-R2-14` [`major` | `rule`] — Mù tiền sử dị ứng thuốc (`allergies`) đối với Colchicine, NSAID/Aspirin (AERD) và dị ứng chéo Sulfonamide trên Celecoxib
- **Vị trí**: [`src/modules/gout/helpers.safety.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L37-L52), [`src/engine/types.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/types.ts#L504-L546), [`src/modules/gout/inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/inputs.ts).
- **Bằng chứng `evaluate()` & Nhãn gốc**: Ca 11 (`allergies: ['colchicine', 'nsaid', 'sulfonamide']`) vẫn phát `[START] colchicine`; Ca E7 (`allergies: ['sulfonamide', 'celecoxib']`) vẫn phát `[CONTINUE] celecoxib` — vi phạm mục Chống chỉ định tuyệt đối Section 4 của **Nhãn FDA Celebrex** (`FDA_label_celecoxib.pdf`, tr. 2: chống chỉ định ở người dị ứng Sulfonamide hoặc tiền sử hen/mày đay do Aspirin/NSAID).
- **Hướng khắc phục**: Khai báo `allergies?: string[]` trên `Patient` (`types.ts`), bổ sung trường dị ứng NSAID/Aspirin, Sulfonamide và Colchicine trong `gout/inputs.ts`, và chặn cứng các thuốc tương ứng tại `helpers.safety.ts` & `gates.ts`/`reviewMeds.ts`.

---

#### 15. `GOUT-R2-R2-15` [`major` | `ui`] — UI `PatientForm.tsx` đánh đồng `'Mang thai / Cho con bú'` thành `pregnant = true`, ẩn trường `breastfeeding`, và bỏ sót `meloxicam`/`ketorolac` ở thai phụ ngoài module `gout`
- **Vị trí**: [`src/ui/PatientForm.tsx`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/PatientForm.tsx#L509-L515), [`src/modules/gout/inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/inputs.ts), [`src/engine/safety/drugClassify.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/drugClassify.ts#L10-L19).
- **Bằng chứng**:
  - `PatientForm.tsx:509-515` gán checkbox `'Mang thai / Cho con bú'` thẳng vào `conditions.pregnant = true`, khiến phụ nữ đang cho con bú (không mang thai) bị dừng oan Allopurinol và chặn Colchicine (trái với **FDA Colcrys** Section 8.3 tr. 14).
  - Ca E8 (`pregnant: true`, `selectedModules: ['htn']`, đang dùng `meloxicam 15 mg` + `ketorolac 10 mg`): **0 khuyến cáo `STOP`** do `NON_KB_PREGNANCY_CONTRA_FALLBACK` (`drugClassify.ts`) bỏ sót các NSAID ngoài KB!
- **Hướng khắc phục**: Tách riêng 2 checkbox `'Đang mang thai'` (`conditions.pregnant`) và `'Đang cho con bú'` (`conditions.breastfeeding`) trên `PatientForm.tsx`, và bổ sung đầy đủ các NSAID ngoài KB vào `NON_KB_PREGNANCY_CONTRA_FALLBACK`.

---

#### 16. `GOUT-R2-R2-16` [`major` | `citation`] — Chưa khắc phục `GOUT-R2-003`: Nguồn `fda_probenecid` và trích dẫn đang dùng vẫn là thuốc kháng sinh tiết niệu **ORLYNVAH** (`sulopenem + probenecid`)
- **Vị trí**: [`kb/sources.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/sources.json#L759-L768), [`kb/citations/gout.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/gout.json#L957-L973), [`kb/drugs/probenecid.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/probenecid.json#L104-L111), [`src/modules/gout/rules.prophylaxis.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/rules.prophylaxis.ts#L35-L53).
- **Bằng chứng**: Trái với tuyên bố tại `round1_RESPONSE.md` dòng 39, file `FDA_label_probenecid.pdf` là nhãn **ORLYNVAH (`sulopenem etzadroxil and probenecid`)** cho uUTI ở phụ nữ (Mục 5.4 còn cảnh báo *"Exacerbation of Gout"*), và hai trích dẫn `fda.probenecid.pregnancy` / `fda.probenecid.lactation` (chứa dữ liệu của kháng sinh *sulopenem*) vẫn đang được gọi trực tiếp trong `probenecid.json` và `rules.prophylaxis.ts`!
- **Hướng khắc phục**: Thay bằng nhãn FDA đơn chất **Probenecid Tablets USP 500 mg** (chỉ định Gout) và làm sạch hoàn toàn các trích dẫn liên quan tới *sulopenem*.

---

#### 17. `GOUT-R2-R2-17` [`major` | `citation`] — Chưa khắc phục `GOUT-R2-004`, `GOUT-R2-014`, `GOUT-R2-015`: Chưa đăng ký `Arcoxia_SmPC.pdf` & `Desuric_benzbromarone_SmPC.pdf`, lệch dấu huyết áp Etoricoxib (`>= 140/90` vs `> 140/90`), thiếu trần suy gan Etoricoxib, và gắn nhầm citation chéo trên `benzbromarone.json` & `allopurinol.json`
- **Vị trí**: [`kb/drugs/etoricoxib.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/etoricoxib.json), [`kb/drugs/benzbromarone.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/benzbromarone.json#L102-L121), [`kb/drugs/allopurinol.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/allopurinol.json#L74), [`kb/thresholds/gout.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/gout.json#L760-L778), [`src/modules/gout/helpers.safety.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/gout/helpers.safety.ts#L378).
- **Bằng chứng từ SmPC gốc trong `Medical_Library_2026`**:
  - `Arcoxia_SmPC.pdf` (tr. 3): *"persistently elevated **above** 140/90 mmHg"* (`> 140 || > 90`, trong khi code viết `>= 140 || >= 90`); suy gan nhẹ Child-Pugh 5–6 tối đa **60 mg OD**, suy gan vừa Child-Pugh 7–9 tối đa **30 mg OD** (không được dùng liều gút cấp 120 mg!).
  - `Desuric_benzbromarone_SmPC.pdf` (tr. 2): *Grossesse et allaitement* quy định tránh dùng (`"avoid"`), trong khi `benzbromarone.json` ghi `"contra"` và gắn nhầm citation độc tính gan của EULAR!
  - `allopurinol.json` dòng 74 vẫn gắn nhầm `eular.gout.2016.benzbromarone_egfr30`.
- **Hướng khắc phục**: Đăng ký chính thức 2 nguồn SmPC vào `kb/sources.json`, trích xuất citation nguyên văn chuẩn xác, chỉnh ngưỡng BP Etoricoxib thành `> 140 || > 90` kèm trần suy gan, và sửa lại citation đúng cho `benzbromarone.json` & `allopurinol.json`.

---

### Nhóm C — Các Phát hiện Mức độ Nhỏ (`MINOR`: 3 phát hiện) & Đề xuất (`SUGGESTION`: 2 phát hiện)

- **`GOUT-R2-R2-18` [`minor` | `drug`]** (`kb/drugs/colchicine.json`): Chưa áp dụng sửa đổi như đã ghi trong `round1_RESPONSE.md` — `pregnancy.status` vẫn là `"avoid"` (thay vì `"caution"` theo FDA Colcrys Section 8.1), vẫn còn `titration` nhân tạo `intervalDays: 7`, và vẫn giữ biệt dược Mỹ `"Colcrys"` (0.6 mg) trong `vnBrands`.
- **`GOUT-R2-R2-19` [`minor` | `drug`]** (`kb/drugs/*.json`): Cả 11/11 thuốc gút & kháng viêm trong `kb/drugs/` đều bỏ trống mảng `hepatic` (`undefined`), chưa mã hóa cấu trúc chỉnh liều theo Child-Pugh A/B/C từ nhãn FDA/EMA.
- **`GOUT-R2-R2-20` [`minor` | `drug`]** (`kb/drugs/{meloxicam,piroxicam,ketoprofen,ketorolac,acenocoumarol}.json`): Thiếu hồ sơ KB cho 3 NSAID được Bộ Y tế QĐ 361/2014 (tr. 93) liệt kê đích danh điều trị gút cấp (`meloxicam`, `piroxicam`, `ketoprofen`), `ketorolac`, và kháng đông VKA chủ lực tại Việt Nam `acenocoumarol` (`Sintrom`).
- **`GOUT-R2-R2-21` [`suggestion` | `rule`]** (`rules.flare.ts` & `rules.prophylaxis.ts`): Phát khuyến cáo hành động `[CONSIDER]` phối hợp PPI bảo vệ dạ dày khi kê NSAID ở người ≥ 65 tuổi hoặc dùng kèm Aspirin liều thấp chưa có PPI nền (EULAR 2016 Fig. 1), và bổ sung hướng dẫn giảm liều Prednisolone 7–10 ngày cho cơn đa khớp nặng dễ tái bùng phát dội ngược.
- **`GOUT-R2-R2-22` [`suggestion` | `rule`]** (`gout/helpers.ts` & `gout/inputs.ts`): Bổ sung cảnh báo/cờ loại trừ tăng acid uric máu thứ phát do bệnh máu ác tính / hội chứng tiêu khối u (TLS) để chặn tuyệt đối nhóm Uricosuric (`probenecid`, `benzbromarone` — chống chỉ định tại Desuric SmPC tr. 1 do gây suy thận cấp tinh thể urat) và không dùng Febuxostat ngoài chỉ định.

---

## Phần 3. Điều kiện Bắt buộc để Nghiệm thu (`PASS`) ở Vòng Tiếp theo

Để module `gout` đạt chuẩn an toàn dược lâm sàng cấp bệnh viện (`0 critical`, `0 major`), nhóm phát triển bắt buộc hoàn tất và chạy kiểm chứng tự động (`evaluate()` + `verifyKb.ts`) cho toàn bộ **17 mục `GOUT-R2-R2-01` .. `GOUT-R2-R2-17`**, đặc biệt lưu ý:
1. Khắc phục dứt điểm lỗi nhân đôi đơn vị `mg/dL` (`GOUT-R2-R2-01`) và lỗi parser liều `'viên'` / `'2 lần/ngày'` / `'cách ngày'` (`GOUT-R2-R2-07`).
2. Giải quyết triệt để xung đột `REDUCE` đè mất thuốc cắt cơn gút cấp + tuân thủ FDA Colcrys Section 2.4–2.6 khi đang uống Colchicine dự phòng nền (`GOUT-R2-R2-02`).
3. Bổ sung đầy đủ Paxlovid (`nirmatrelvir_ritonavir`) & danh mục CYP3A4/P-gp cho Colchicine trên toàn hệ thống (`GOUT-R2-R2-03`), khóa xơ gan mất bù / Child-Pugh C trên Colchicine & NSAID (`GOUT-R2-R2-04`), sửa phân lớp sai `'xoi'` cho Probenecid/Benzbromarone (`GOUT-R2-R2-05`), chặn kê chồng 2 NSAID & dừng `ketorolac` (`GOUT-R2-R2-06`).
4. Khắc phục 100% citation treo trong `gout_metabolic.json` (`GOUT-R2-R2-08`), bổ sung các DDI trọng yếu & trần liều `Rosuvastatin ≤ 20 mg` với `Febuxostat` (`GOUT-R2-R2-09`, `GOUT-R2-R2-10`), sửa rào chỉ định Uricosuric / Pegloticase / Dị ứng / Thai kỳ – Cho con bú (`GOUT-R2-R2-11` .. `GOUT-R2-R2-15`) và làm sạch dứt điểm nguồn nhãn Orlynvah, Arcoxia SmPC, Desuric SmPC (`GOUT-R2-R2-16`, `GOUT-R2-R2-17`).
