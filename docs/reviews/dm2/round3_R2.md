# Báo Cáo Thẩm Định Độc Lập Vòng 3 – Dược Lâm Sàng & An Toàn Thuốc (Reviewer R2)

- **Module thẩm định:** Đái tháo đường típ 2 (`dm2`) — Hệ thống Hỗ trợ Quyết định Lâm sàng `GDMT-VN`
- **Vòng thẩm định:** Vòng 3 (Round 3 — Hậu kiểm toàn diện Vòng 2 & Kiểm toán An toàn Thuốc Thực chứng)
- **Vai trò chuyên gia:** **R2 — Dược sĩ Lâm sàng & Kiểm toán An toàn Thuốc Độc lập (Clinical Pharmacist & Medication Safety Auditor)**
- **Phán quyết Vòng 3:** **`FAIL`** *(Quy tắc bất khả xâm phạm: chỉ `PASS` khi `0 Critical` và `0 Major`)*
- **Tổng hợp mức độ phát hiện:** **18 phát hiện** (**`5 Critical`**, **`8 Major`**, **`4 Minor`**, **`1 Suggestion`**)
- **Tệp dữ liệu cấu trúc đồng bộ 100%:** `docs/reviews/dm2/round3_R2.json`

---

## 1. Tóm Tắt Điều Hành & Phương Pháp Thẩm Định Độc Lập

### 1.1. Phạm vi & Phương pháp kiểm toán
Cuộc thẩm định Vòng 3 được thực hiện hoàn toàn độc lập (tuân thủ nghiêm ngặt quy tắc cô lập — không đọc bất kỳ báo cáo Vòng 3 nào của `R1`/`R3` và không chỉnh sửa bất kỳ tệp mã nguồn/KB nào) dựa trên 4 trụ cột kiểm chứng thực nghiệm:

1. **Đọc rà soát tĩnh 100% mã nguồn & Cơ sở tri thức (`kb/`)**:
   - Toàn bộ **23/23 tệp** trong `src/modules/dm2/**` (sau tái cấu trúc `< 20 KB/tệp`).
   - Toàn bộ tầng an toàn & hợp nhất dùng chung trong `src/engine/**`: `evaluate.ts`, `types.ts`, `derive.ts`, `units.ts`, `merge.ts`, `mergeHelpers.ts`, `calculators/insulin.ts`, `safety/gates.ts`, `safety/vitalAndRenalGates.ts`, `safety/organAndCrisisGates.ts`, `safety/reviewMeds*.ts`, `safety/duplicates.ts`, `safety/duplicateRules.ts`, `safety/drugClassify.ts`, `safety/clinicalStates.ts`, `safety/interactions.ts`.
   - Toàn bộ **25 tệp thuốc ĐTĐ** trong `kb/drugs/*.json` (22 thuốc thuộc quyền sở hữu `dm2` + 3 thuốc SGLT2i dùng chung `dapagliflozin`, `empagliflozin`, `canagliflozin`), **93 ngưỡng** trong `kb/thresholds/dm2.json`, **145 trích dẫn** trong `kb/citations/dm2.json`, và tệp tương tác `kb/interactions/diabetes_respiratory.json`.
2. **Thực thi động 60 kịch bản dược lâm sàng thực tế qua `evaluate()`**:
   - Thiết kế và chạy trực tiếp **60 kịch bản kiểm thử chuyên sâu** (`S01`–`S44` và `P01`–`P15`) bao phủ: viên/bút phối hợp liều cố định (FDC), suy thận G3a/G3b/G4/G5/lọc máu, xơ gan Child-Pugh A/B/C & tăng men gan, dị ứng chéo nhiều thuốc, thai kỳ & cho con bú, viêm tụy cấp, MTC/MEN2, liệt dạ dày & bệnh võng mạc ĐTĐ, tương tác CYP3A4 & thuốc tránh thai uống, phác đồ insulin nội viện (khoa thường, ICU, nuôi ăn qua sonde, corticoid) và chu phẫu ngoại trú.
3. **Kiểm toán tự động 100% trích dẫn nguyên văn trên PDF gốc (`Medical_Library_2026`)**:
   - Dùng `PyMuPDF` đối chiếu tự động toàn bộ **145/145 mục trích dẫn** trong `kb/citations/dm2.json` với đúng trang `pdfPage` của tệp PDF gốc trong kho tài liệu chuẩn (ADA 2026 SOC, Đồng thuận DKA/HHS 2024, KDIGO 2022/2025, ESC 2023, QĐ 5481/QĐ-BYT, QĐ 1353/QĐ-BYT, nhãn FDA DailyMed và EMA SmPC), đồng thời quét ngược mọi chuỗi `citationIds` phát sinh lúc chạy (`runtime`).
4. **Hậu kiểm độc lập 47/47 phát hiện Vòng 2**:
   - Đối chiếu từng dòng mã nguồn và đầu ra `evaluate()` đối với toàn bộ 47 phát hiện từ `round2_R1.json` (18), `round2_R2.json` (9), `round2_R3.json` (20) và `round2_RESPONSE.md`.

### 1.2. Ghi nhận những cải tiến chất lượng lớn sau Vòng 2
Nhóm phát triển đã thực hiện khối lượng công việc rất đáng ghi nhận:
- **Kiến trúc & Tích hợp tri thức:** Phân tách sạch sẽ 2 tệp lớn thành 23 tệp mô-đun hóa `< 20 KB`; chuẩn hóa 93 ngưỡng `thFor()` đạt QA-10; xác thực **145/145 trích dẫn trong `kb/citations/dm2.json` đều khớp nguyên văn trên đúng trang PDF gốc đã khai báo** (không có bất kỳ câu trích dẫn bịa đặt nào trong `kb/citations/dm2.json`).
- **Cấp cứu Nội tiết & Hồi sức:** Phân biệt chính xác HHS thuần túy (`0.05 U/kg/h`) với DKA–HHS hỗn hợp (`0.1 U/kg/h`); bắt buộc truyền song song Dextrose 5%–10% ngay từ đầu trong EuDKA kèm lệnh `[STOP]` vĩnh viễn SGLT2i; chặn truyền mù quáng insulin tĩnh mạch khi chỉ tăng ceton đơn độc không toan; cổng `fail-closed` kiểm tra $K^+ < 3.5\text{ mmol/L}$ hoặc khuyết $K^+$ trước truyền insulin tĩnh mạch ở cả DKA/HHS lẫn ICU; phát lệnh `[REFER]` cấp cứu và khóa toàn bộ thuốc ngoại trú mạn tính khi phát hiện cơn cấp cứu tại phòng khám.
- **Bảo vệ Tim–Thận & Cá thể hóa:** Bổ sung tạm ngừng Metformin 48 giờ quanh thủ thuật cản quang iod (kể cả suy tim/bệnh gan/thiếu eGFR); bậc thang `glycemic_step_up` với `linagliptin` cho thể gầy, CKD G4–G5 và suy gan; quy đổi đúng đơn vị BeAM `mg/dL` ↔ `mmol/L`; xuống thang an toàn ở người cao tuổi suy yếu (`STOP` Sulfonylurea, giảm 20% insulin, `DEFER` GLP-1 RA); loại trừ Aspirin khi đang dùng kháng đông OAC hoặc có tiền sử xuất huyết; bổ sung `CONSIDER` Finerenone và chỉ định Tirzepatide/Semaglutide cho HFpEF kèm béo phì.

### 1.3. Lý do Phán quyết `FAIL` — 5 Nhóm Nguy Cơ An Toàn Thuốc Nghiêm Trọng (`Critical`)
Mặc dù luồng đơn chất cơ bản đã vững, kiểm thử động ở các tình huống thực hành kê đơn phổ biến tại Việt Nam (viên phối hợp FDC, nhập đơn theo "viên" / "Sáng - tối", bệnh nhân nhập viện đang tiêm Mixtard/Insulatard tại nhà, bệnh nhân dị ứng nhiều thuốc) đã bộc lộ **5 lỗi mức `Critical`** và **8 lỗi mức `Major`** có thể gây hại trực tiếp cho người bệnh:

1. **`DM2-R3-R2-01` (`Critical`) — Xung đột y lệnh chết người trên Viên/Bút phối hợp cố định (FDC):** Ở `eGFR = 22 mL/phút/1.73m²` đang uống `Synjardy 12.5/1000 mg x 2`, hệ thống vừa phát `[STOP] Metformin` vừa phát **`[CONTINUE] TIẾP TỤC DUY TRÌ Synjardy 12.5/1000mg`** (tức lệnh uống tiếp `2.000 mg/ngày` Metformin chống chỉ định gây toan lactic MALA!); tương tự ở HFrEF uống `Actoplus Met` (vừa `STOP` Pioglitazone vừa `CONTINUE` Actoplus Met); bỏ sót hoàn toàn bút tiêm `Soliqua` / `Xultophy` ở phụ nữ mang thai (`0 STOP` + kê chồng `Glargine`); bỏ sót FDC ĐTĐ đường uống ở module `ckd`/`hf`; và bỏ lọt trùng lặp `4.000 mg/ngày` Metformin (`Metformin` rời + `Synjardy`).
2. **`DM2-R3-R2-02` (`Critical`) — Chồng liều Insulin nguy kịch nội viện & bỏ sót chu phẫu:** Bệnh nhân nhập viện đang tiêm `Mixtard 30` (`20U x 2 = 40U/ngày`) tại nhà dù đường huyết bình thường (`glucose = 6.8 mmol/L`) vẫn bị phát lệnh `[START] Insulin Glargine 16U` + `[START] Insulin Aspart 15U` với **0 lệnh `HOLD`/`STOP` Mixtard 30** (cộng dồn `71 U/ngày`!); lỗi tương tự với `Insulatard` nội viện, `NovoRapid` khi nuôi ăn sonde `tube_feeding`, và bỏ sót hoàn toàn `Premix` + `Bolus` trước phẫu thuật ngoại trú.
3. **`DM2-R3-R2-03` (`Critical`) — Lỗi `parseMedDailyDoseMg` tính sai theo hướng Fail-Open (vi phạm QA-1):** Nhập `Glucophage` với `dose: 1, unit: 'viên', freq: '2 lần/ngày'` bị tính thành **`2 mg/ngày`**; nhập `Metformin 1000 mg` với `freq: 'Sáng - tối'` bị tính thành **`1000 mg/ngày`**, khiến hệ thống khuyên bệnh nhân suy thận CKD G3b (`eGFR = 36`) tiếp tục duy trì `2.000 mg/ngày` Metformin!
4. **`DM2-R3-R2-04` (`Critical`) — Đảo ngược Fallback Dị ứng Thuốc (Allergy Fallback Inversion):** Biểu thức ternary chọn thuốc trong `rules.cardiorenal.glp1.ts` và `rules.cardiorenal.sglt2.ts` khiến khi bệnh nhân khai báo dị ứng với **cả** `semaglutide` và `tirzepatide` (hoặc cả `dapagliflozin` và `empagliflozin`), hệ thống **rơi ngược về kê đơn `[START] Semaglutide` / `[START] Dapagliflozin` cho chính bệnh nhân dị ứng thuốc đó!**
5. **`DM2-R3-R2-05` (`Critical`) — 5 Mã trích dẫn Thai kỳ "ma" (`PREGNANCY_CITATIONS`):** 5 ID `fda.semaglutide.pregnancy`, `fda.semaglutide_rybelsus.pregnancy`, `fda.dulaglutide.pregnancy`, `fda.liraglutide.pregnancy`, `fda.tirzepatide.pregnancy` được phát trực tiếp vào `Recommendation.citationIds` lúc chạy nhưng **không tồn tại** trong bất kỳ tệp `kb/citations/*.json` nào.

---

## 2. Bảng Hậu Kiểm Toàn Diện 47/47 Phát Hiện Vòng 2

Tổng kết hậu kiểm 47 phát hiện Vòng 2:
- **30 / 47 phát hiện (`63.8%`)**: **ĐẠT TRIỆT ĐỂ (`PASS`)** trên mọi nhánh kiểm thử.
- **6 / 47 phát hiện (`12.8%`)**: **ĐẠT TRÊN LUỒNG CHÍNH `dm2` (`PASS` cốt lõi)** nhưng còn góc khuất liên chuyên khoa hoặc trường hợp biên nhỏ (tổng cộng **36/47** hoàn thành mục tiêu cốt lõi ban đầu).
- **11 / 47 phát hiện (`23.4%`)**: **ĐẠT MỘT PHẦN / HỒI QUY (`PARTIAL / FAIL`)** do phát sinh lỗi FDC, khóa nhầm `setting: 'outpatient'`, lỗi parser liều hoặc thiếu trường dữ liệu.

### 2.1. Hậu kiểm 18 phát hiện từ `round2_R1.json` (`DM2-R1-201` → `DM2-R1-218`)

| Mã Vòng 2 | Nội dung cốt lõi Vòng 2 | Kết quả hậu kiểm Vòng 3 | Tham chiếu Vòng 3 |
|---|---|---|---|
| `DM2-R1-201` | Tách biệt Pure HHS (`0.05 U/kg/h`) vs Mixed DKA–HHS (`0.1 U/kg/h`) | **ĐẠT (`PASS`)** — Phân nhánh chính xác trong `helpers.ts` & `rules.dka.ts`. | — |
| `DM2-R1-202` | EuDKA bắt buộc truyền song song Dextrose 5%–10% ngay từ đầu | **ĐẠT (`PASS`)** — Kiểm chứng thực nghiệm tại `S27`. | — |
| `DM2-R1-203` | Tăng ceton đơn độc không toan (`pH ≥ 7.30`, `HCO3 ≥ 18`): workup thay vì truyền mù quáng IV insulin | **ĐẠT (`PASS`)** — `isolated_ketonemia_workup` hoạt động chuẩn xác. | — |
| `DM2-R1-204` | Cấp cứu DKA/euDKA/HHS tại ngoại trú: phát `[REFER]` + khóa khởi trị mạn tính | **ĐẠT (`PASS`)** — Kiểm chứng tại `S27`, `S28`. | — |
| `DM2-R1-205` | Đọc `serumBicarb ?? hco3` và tự tính `effOsm = 2*Na + glucose` | **ĐẠT (`PASS`)** — Tương thích đầy đủ đầu vào sinh hóa. | — |
| `DM2-R1-206` | NPH cho tăng ĐH do corticoid: cổng tăng ĐH thực sự + fail-closed cân nặng + song hành Glargine | **ĐẠT (`PASS`)** — Kiểm chứng tại `S40`. | — |
| `DM2-R1-207` | Nuôi ăn qua ống thông (`tube_feeding`): insulin mỗi 6h + cảnh báo truyền Dextrose 10% nếu tắc sonde | **MỘT PHẦN** — Chia liều q6h & cảnh báo D10% tốt, nhưng chưa `HOLD`/`STOP` `aspart`/`lispro` cũ đang tiêm tại nhà (`P08`). | `DM2-R3-R2-02` |
| `DM2-R1-208` | Chuẩn hóa `hasCondition` nhận diện đầy đủ đột quỵ/TIA/PAD/CAD cho ASCVD | **ĐẠT (`PASS`)** — Kiểm chứng tại `S19`. | — |
| `DM2-R1-209` | Chống trì trệ điều trị (`glycemic_step_up`) cho thể gầy / CKD / suy gan | **ĐẠT (`PASS` cốt lõi)** — Kiểm chứng tại `S18a/b` (cần bổ sung kiểm tra `allergies`). | `DM2-R3-R2-04` |
| `DM2-R1-210` | Quy đổi đơn vị BeAM `mg/dL` → `mmol/L` & tách tiêu đề Overbasalization | **ĐẠT (`PASS`)** — Kiểm chứng tại `S42`. | — |
| `DM2-R1-211` | Phân tầng Statin theo tuổi (`<40`, `40–75`, ASCVD) theo ADA 2026 Ch. 10 | **ĐẠT (`PASS`)** — Kiểm chứng tại `S43`. | — |
| `DM2-R1-212` | Viêm tụy cấp / tiền sử viêm tụy: `[STOP]` toàn bộ GLP-1 RA & DPP-4i | **ĐẠT TRONG `dm2` / THIẾU LIÊN MODULE** — Bật `dm2` (`S24a`) STOP đầy đủ; chỉ bật `htn` (`S24b`) bỏ sót DPP-4i. | `DM2-R3-R2-13` |
| `DM2-R1-213` | Sửa 5 trích dẫn lệch ngữ cảnh trong `kb/citations/dm2.json` | **ĐẠT (`PASS`)** — 145/145 trích dẫn trong `dm2.json` khớp nguyên văn đúng trang PDF. | — |
| `DM2-R1-214` | Gắn trích dẫn nhãn gốc chính chủ cho `contraindications` | **HỒI QUY MỚI** — `kb/drugs/*.json` đã sạch, nhưng `rules.safety.contra.ts` phát 5 ID thai kỳ không tồn tại (`S30a`) và `reviewMedsSpecialized.ts` trích nhầm Finerenone cho Metformin (`S31c`). | `DM2-R3-R2-05`, `DM2-R3-R2-13` |
| `DM2-R1-215` | Bổ sung `CONSIDER` Finerenone (nsMRA) & Incretin cho HFpEF béo phì | **ĐẠT (`PASS`)** — Kiểm chứng tại `S19b`, `S29`. | — |
| `DM2-R1-216` | Xử trí thuốc viên & giảm 20–25% insulin nền chu phẫu + giữ liều nền tại nhà nội viện | **MỘT PHẦN / LỖI NGHIÊM TRỌNG** — Bỏ sót `Premix` & `Bolus` trước mổ ngoại trú (`P09`) và chồng mới Glargine + Aspart lên `Mixtard 30` / `Insulatard` nội viện (`P06`, `P07`, `S38`). | `DM2-R3-R2-02` |
| `DM2-R1-217` | Bổ sung công tắc `dkaSuspected` vào `inputs.ts` | **ĐẠT (`PASS`)** — Đã khai báo và nối logic đầy đủ. | — |
| `DM2-R1-218` | Trích dẫn ESC 2023 + KDIGO 2025, đủ 3 khóa `profileDiff`, điền COR/LOE | **ĐẠT (`PASS`)** — Đủ `8/8` khối `profileDiff` có `INTL`/`VN`/`US`. | — |

### 2.2. Hậu kiểm 9 phát hiện từ `round2_R2.json` (`DM2-R2-R2-01` → `DM2-R2-R2-09`)

| Mã Vòng 2 | Nội dung cốt lõi Vòng 2 | Kết quả hậu kiểm Vòng 3 | Tham chiếu Vòng 3 |
|---|---|---|---|
| `DM2-R2-R2-01` | Tạm ngừng Metformin 48h quanh cản quang iod (`eGFR ≤ 60`, thiếu eGFR, `hf`, `liverDisease`) | **ĐẠT (`PASS`)** — Kiểm chứng tại `S32a` và `S32b`. | — |
| `DM2-R2-R2-02` | Giữ đúng liều đang dùng / khoảng liều duy trì khi `CONTINUE` SGLT2i & GLP-1 RA | **ĐẠT TRÊN ĐƠN CHẤT** — Đúng cho đơn chất; lỗi giữ `CONTINUE` trên FDC chống chỉ định và giữ chuỗi `dose` trên thẻ `STOP` nêu tại `01` & `08`. | `DM2-R3-R2-01`, `DM2-R3-R2-08` |
| `DM2-R2-R2-03` | Giảm liều thận cho DPP-4i, Gliclazide & tính tổng liều Metformin/ngày ở CKD G3b | **KHÔNG ĐẠT (`FAIL`)** — `parseMedDailyDoseMg` tính `1 viên x 2` = `2 mg/ngày` và `'Sáng - tối'` = `1 lần/ngày` (`P13`, `S13a`); 3 luật DPP-4i khóa cứng `outpatient` bỏ lọt 100% nội trú khoa thường (`S09`, `S10`, `P05`). | `DM2-R3-R2-03`, `DM2-R3-R2-06` |
| `DM2-R2-R2-04` | Giảm liều `saxagliptin` ≤ 2.5 mg/ngày khi dùng kèm ức chế mạnh CYP3A4/5 | **MỘT PHẦN** — Hoạt động ở ngoại trú; ở nội trú khoa thường (`S11`) chỉ có banner alert mà không có lệnh `[REDUCE]` do khóa `setting: 'outpatient'`. | `DM2-R3-R2-06` |
| `DM2-R2-R2-05` | Bậc thang `glycemic_step_up` cho thể gầy & `linagliptin` cho CKD G4–G5 / suy gan | **ĐẠT (`PASS`)** — Kiểm chứng tại `S18a`, `S18b`. | — |
| `DM2-R2-R2-06` | Khoảng liều duy trì của 5 thuốc Incretin & ô G5 `pioglitazone` trên Ma trận | **ĐẠT (`PASS`)** — Hiển thị rõ ràng trên `dm2MatrixEgfr`. | — |
| `DM2-R2-R2-07` | Chuẩn hóa `classes` & chặn trùng lặp thuốc cùng nhóm | **MỘT PHẦN** — Còn bỏ sót `Glimepiride + Glibenclamide` (`P03`), `Mixtard 30 + Aspart + Lispro` (`S37a`), và báo sai nhãn `dup.dpp4_glp1` cho 2 DPP-4i / 2 GLP-1 RA (`S12`, `P04`). | `DM2-R3-R2-09` |
| `DM2-R2-R2-08` | Chỉ phát `HOLD` insulin bữa ăn khi NPO nếu bệnh nhân thực sự đang dùng | **ĐẠT (`PASS`)** — Kiểm chứng không còn lệnh `HOLD` giả tạo. | — |
| `DM2-R2-R2-09` | Phân biệt Premix người vs analog, ghi chú Glargine U100/U300 & chuẩn hóa nguồn PDF | **ĐẠT TRONG DRUG KB** — `insulin_premix.json` & `insulin_glargine.json` tốt; siêu dữ liệu `kb/sources.json` cho nhãn Metformin/Ozempic ghi nhận tại `DM2-R3-R2-16`. | `DM2-R3-R2-16` |

### 2.3. Hậu kiểm 20 phát hiện từ `round2_R3.json` (`R3-R2-DM2-01` → `R3-R2-DM2-20`)

| Mã Vòng 2 | Nội dung cốt lõi Vòng 2 | Kết quả hậu kiểm Vòng 3 | Tham chiếu Vòng 3 |
|---|---|---|---|
| `R3-R2-DM2-01` | Chặn `START` Basal-Bolus nội viện khi đường huyết bình thường (`< 10 mmol/L`) | **MỘT PHẦN** — Chặn đúng ở BN chưa dùng insulin, nhưng ở BN đang dùng `Mixtard 30` có `glucose = 6.8 mmol/L` (`P06`), vẫn `[START]` Glargine + Aspart chồng lên 40U Mixtard! | `DM2-R3-R2-02` |
| `R3-R2-DM2-02` | Cấp cứu ngoại trú `REFER` + `STOP` vĩnh viễn SGLT2i + khóa khởi trị mạn | **ĐẠT (`PASS`)** — Kiểm chứng tại `S27`, `S28`. | — |
| `R3-R2-DM2-03` | Tự tính `effOsm`, nhận diện Mixed DKA–HHS `0.1 U/kg/h` & nghi ngờ DKA thiếu BHB | **ĐẠT (`PASS`)** — Kiểm chứng đầy đủ. | — |
| `R3-R2-DM2-04` | Phủ kín chuẩn độ insulin nền ngoại trú trên dải `HbA1c < 10%` | **MỘT PHẦN** — Ở `HbA1c = 7.2%` (`S34`), vừa `[START]` Dapagliflozin + Semaglutide vừa đồng thời `[UPTITRATE]` Glargine gây nguy cơ hạ ĐH; tính thiếu liều NPH chia 2 cử (`S36a`). | `DM2-R3-R2-10`, `DM2-R3-R2-17` |
| `R3-R2-DM2-05` | Xuống thang ở người cao tuổi suy yếu (`STOP` SU, giảm 20% insulin, `DEFER` GLP-1 RA) | **ĐẠT (`PASS`)** — Kiểm chứng tại `S41`. | — |
| `R3-R2-DM2-06` | Cổng chặn chu phẫu SGLT2i & hạ đường huyết cấp liên module (`gates.ts`) | **ĐẠT (`PASS`)** — `gates.ts` chặn chéo tốt cho đơn chất SGLT2i và hạ ĐH cấp. | — |
| `R3-R2-DM2-07` | Giải mã biệt dược & phân rã hoạt chất viên phối hợp cố định FDC | **HỒI QUY NGHIÊM TRỌNG (`CRITICAL FAIL`)** — Phát đồng thời `[STOP]` thành phần chống chỉ định VÀ `[CONTINUE]` chính viên FDC (`S01`, `S03`, `S04`, `P14`), bỏ sót `Soliqua`/`Xultophy` ở thai kỳ (`S06`, `P10`), bỏ sót FDC ở `ckd`/`hf` (`S02`, `S05`). | `DM2-R3-R2-01` |
| `R3-R2-DM2-08` | Lệnh `[STOP]` khẩn cấp khi trùng lặp SU, Basal, DPP-4i, GLP-1 RA | **MỘT PHẦN** — Bỏ sót `Glimepiride + Glibenclamide` (`P03`) và `Premix + Bolus` / `2 Bolus` (`S37a`). | `DM2-R3-R2-09` |
| `R3-R2-DM2-09` | Truyền insulin TM tại ICU khi `glucose ≥ 10 mmol/L` kèm cổng fail-closed $K^+$ | **ĐẠT (`PASS`)** — Kiểm chứng tại `S39a`–`S39e`. | — |
| `R3-R2-DM2-10` | Bậc thang `stepup` cho thể gầy & CKD G4–G5 + MTC + chu phẫu (`linagliptin`) | **ĐẠT (`PASS`)** — Kiểm chứng tại `S18a`, `S18b`. | — |
| `R3-R2-DM2-11` | `STOP` vĩnh viễn SGLT2i trong DKA/euDKA thắng `HOLD` chu phẫu | **ĐẠT (`PASS`)** — Kiểm chứng tại `S27`. | — |
| `R3-R2-DM2-12` | Khắc phục 3 lỗi NPH corticoid (cổng tăng ĐH, thiếu cân nặng, song hành Glargine) | **ĐẠT (`PASS`)** — Kiểm chứng tại `S40`. | — |
| `R3-R2-DM2-13` | Bổ sung các luật `REDUCE` theo eGFR cho DPP-4i & Gliclazide | **MỘT PHẦN** — Khóa cứng `outpatient` bỏ sót nội trú khoa thường (`DM2-R3-R2-06`) & `gliclazide` fail-open khi thiếu mg (`DM2-R3-R2-03`). | `DM2-R3-R2-06`, `DM2-R3-R2-03` |
| `R3-R2-DM2-14` | Ngừng thuốc viên chống chỉ định khi suy gan (`hepaticSafetyStopRules`) | **MỘT PHẦN** — Dùng nhầm ngưỡng `3.0× ULN` thay vì `2.5× ULN` cho `Pioglitazone` (`P01`), bỏ sót hoàn toàn `Acarbose` ở xơ gan (`S31b/c`, `P15`), bỏ sót SU/Acarbose khi chạy ngoài `dm2` (`S31c`). | `DM2-R3-R2-07`, `DM2-R3-R2-13` |
| `R3-R2-DM2-15` | Loét bàn chân hoạt động (`activeFootUlcer`): tránh Canagliflozin, thận trọng SGLT2i | **ĐẠT (`PASS`)** — Kiểm chứng tại `S29`. | — |
| `R3-R2-DM2-16` | Loại trừ Aspirin khi có tiền sử xuất huyết hoặc đang dùng kháng đông OAC | **ĐẠT (`PASS`)** — Kiểm chứng tại `S44`. | — |
| `R3-R2-DM2-17` | Chuẩn hóa đơn vị BeAM & tiêu đề Overbasalization | **ĐẠT (`PASS`)** — Kiểm chứng tại `S42`. | — |
| `R3-R2-DM2-18` | Nuôi ăn sonde q6h & tạm ngừng thuốc uống khi NPO nội viện | **MỘT PHẦN** — Nhánh `tube_feeding` chưa `HOLD` insulin nhanh bữa ăn cũ (`P08`). | `DM2-R3-R2-02` |
| `R3-R2-DM2-19` | Làm sạch chuỗi liều hiển thị & tiêu đề trùng lặp nhóm thuốc | **MỘT PHẦN** — Thẻ bị cổng an toàn chuyển thành `STOP`/`AVOID` vẫn giữ nguyên chuỗi `dose: "Duy trì liều đang dùng..."` (`S23`, `S31c`); `dup.dpp4_glp1` vẫn báo sai nhãn. | `DM2-R3-R2-08`, `DM2-R3-R2-09` |
| `R3-R2-DM2-20` | Ma trận SGLT2i eGFR, động hóa `pathway.ts` & tách nhãn `pregnant` / cho con bú | **MỘT PHẦN** — `dm2MatrixEgfr` đạt tốt; `pathway.ts` vẫn tĩnh (`14`), `dm2MatrixComorbidities` dùng 5 `drugId` ngoài KB (`15`), nhãn `pregnant` vẫn gộp `'Mang thai / Cho con bú'` và thiếu luật cho con bú (`11`). | `DM2-R3-R2-11`, `DM2-R3-R2-14`, `DM2-R3-R2-15` |

---

## 3. Tổng Kết Kiểm Toán 100% Trích Dẫn PDF & 60 Kịch Bản Động `evaluate()`

### 3.1. Kết quả kiểm toán nguyên văn PDF (`Medical_Library_2026`)
- **`kb/citations/dm2.json` (`145` mục):**
  - `144 / 145` mục khớp trực tiếp chuỗi chuẩn hóa trên đúng trang `pdfPage` của tệp PDF gốc.
  - `1 / 145` mục (`ada.dm2.2024.dka_sglt2i_stop_permanent`, trang 14 `ADA_2024_Hyperglycaemic_Crises_Consensus.pdf`, Bảng 4) khớp nguyên văn 100% nội dung học thuật nhưng còn dính 2 ký hiệu mã glyph `/C15` do công cụ trích xuất cũ thay cho dấu chấm đầu dòng (`DM2-R3-R2-16`).
- **Quét `citationIds` phát sinh khi chạy `evaluate()` (`Runtime Citation Audit`):**
  - Phát hiện **5 mã trích dẫn "ma"** trong `PREGNANCY_CITATIONS` (`src/modules/dm2/rules.safety.contra.ts` dòng 27–33) không tồn tại trong toàn bộ `kb/citations/*.json` (`DM2-R3-R2-05` — mức **`Critical`**).
  - Phát hiện **1 lỗi gắn nhầm trích dẫn chéo hoạt chất** trong `src/engine/safety/reviewMedsSpecialized.ts`: thẻ `[STOP] Metformin` do suy gan lại gắn mã `fda.finerenone.hepatic_impairment` (`DM2-R3-R2-13`).

### 3.2. Tóm tắt 60 kịch bản thực thi `evaluate()` (`S01`–`S44`, `P01`–`P15`)
- **Các nhóm kịch bản đạt an toàn xuất sắc:** Cấp cứu DKA/euDKA/HHS/Mixed DKA–HHS (`S27`, `S28`), cổng $K^+$ trước truyền insulin tĩnh mạch ICU (`S39a–e`), tăng ĐH do corticoid (`S40`), tạm ngừng Metformin quanh cản quang iod (`S32a/b`), người cao tuổi suy yếu đa bệnh lý (`S41`), loét bàn chân hoạt động với Canagliflozin (`S29`), quy đổi BeAM `30 mg/dL` vs `65 mg/dL` (`S42`), loại trừ Aspirin trên nền Apixaban (`S44`), chuyển tiếp `Sitagliptin` → `Semaglutide` không nổ cảnh báo trùng lặp giả (`S33`).
- **Các kịch bản phát hiện lỗi nghiêm trọng:** `S01`–`S06`, `P02`, `P10`, `P14` (xung đột FDC & thai kỳ Soliqua/Xultophy); `S38`, `P06`–`P09` (chồng liều insulin nội viện & chu phẫu); `S13a`, `P13` (tính sai liều `viên` & `Sáng - tối` ở CKD G3b); `P12` (đảo ngược fallback dị ứng); `S30a/b` (5 citation ma thai kỳ & bỏ trống cho con bú); `S09`–`S11`, `P05` (bỏ sót giảm liều DPP-4i nội trú); `P01`, `S20`, `S31b/c`, `P15` (Pioglitazone ALT `2.8× ULN`, ung thư bàng quang & Acarbose xơ gan); `S23`, `S31c` (giữ `dose` duy trì trên thẻ `STOP`/`AVOID`); `P03`, `P04`, `S12`, `S17`, `S37a` (trùng lặp SU, Premix+Bolus & nhãn `dup.dpp4_glp1`); `S34` (tăng liều Glargine đồng thời khi khởi trị mới SGLT2i + GLP-1 RA ở `HbA1c = 7.2%`); `S25`, `S26` (liệt dạ dày, bệnh võng mạc & tương tác Tirzepatide + thuốc tránh thai uống).

---

## 4. Phân Tích Chi Tiết 18 Phát Hiện Vòng 3 (`DM2-R3-R2-01` → `DM2-R3-R2-18`)

---

### NHÓM A — CÁC PHÁT HIỆN MỨC ĐỘ NGHIÊM TRỌNG (`CRITICAL`: 5 PHÁT HIỆN)

---

#### [DM2-R3-R2-01] `CRITICAL` | Xung đột y lệnh chết người trên Viên phối hợp cố định (FDC) đường uống & Bút tiêm phối hợp (`Synjardy`, `Xigduo`, `Janumet`, `Actoplus Met`, `Qtern`, `Soliqua`, `Xultophy`)
- **Phân loại:** `rule`
- **Định danh tệp:** `src/modules/dm2/helpers.drugs.ts` | `src/modules/dm2/rules.cardiorenal.sglt2.ts` | `src/modules/dm2/rules.glycemic.ts` | `src/engine/safety/drugClassify.ts` | `src/engine/merge.ts`
- **Cơ chế lỗi & Nguy cơ lâm sàng:**
  1. **Vừa ra lệnh `[STOP]` hoạt chất chống chỉ định, vừa ra lệnh `[CONTINUE]` chính viên thuốc FDC nguyên khối đó:** Khi bệnh nhân dùng viên FDC mà 1 thành phần bị chống chỉ định tuyệt đối còn thành phần kia vẫn được chỉ định, nhánh an toàn phát `[STOP]` lên hoạt chất chống chỉ định, nhưng nhánh tim–thận/đường huyết lại tìm thấy thành phần thứ hai qua `findActiveMedByCanonical()`, phát `[CONTINUE]` và bị `merge.ts` giữ nguyên tên biệt dược FDC! Bác sĩ/bệnh nhân nhận y lệnh **"TIẾP TỤC DUY TRÌ Synjardy 12.5/1000mg"** ở `eGFR = 22 mL/phút/1.73m²` — đồng nghĩa tiếp tục nạp **2.000 mg/ngày Metformin** gây nhiễm toan lactic tử vong (MALA), hoặc **"TIẾP TỤC DUY TRÌ Actoplus Met"** ở bệnh nhân suy tim HFrEF!
  2. **Bỏ sót hoàn toàn bút tiêm phối hợp `Soliqua` (`insulin_glargine` + `lixisenatide`) và `Xultophy` (`insulin_degludec` + `liraglutide`) ở phụ nữ mang thai:** `FDC_COMPONENTS_MAP` không khai báo `soliqua` / `xultophy` và `NON_INSULIN_DM2_IDS` không có `lixisenatide`. Phụ nữ mang thai đang tiêm `Soliqua` hoặc `Xultophy` nhận **0 lệnh `[STOP]`** (tiếp tục phơi nhiễm đồng vận thụ thể GLP-1 chống chỉ định trong thai kỳ) và còn bị kê chồng thêm `[START] Insulin Glargine` mới!
  3. **Mù FDC liên chuyên khoa (`ckd` / `hf`):** `getExpandedDrugIds()` trong `src/engine/safety/drugClassify.ts` không phân rã các viên FDC ĐTĐ đường uống (`empagliflozin_metformin`, `sitagliptin_metformin`, `actoplus_met`, `qtern`...). Khi bác sĩ chạy module `['ckd']` ở `eGFR = 22` trên bệnh nhân uống `Synjardy` + `Janumet` (`4.000 mg/ngày` Metformin) hoặc chạy `['hf']` trên bệnh nhân uống `Actoplus Met` + `Qtern`, hệ thống phát **0 lệnh `[STOP]`**.
  4. **Bỏ lọt quá liều gấp đôi trần Metformin (`4.000 mg/ngày`):** Bệnh nhân uống đồng thời `Metformin 1000 mg x 2` rời + `Synjardy 12.5/1000 mg x 2` ở chức năng thận bình thường nhận đồng thời 2 lệnh `[CONTINUE]` mà không có bất kỳ cảnh báo trùng lặp Biguanide nào.
- **Bằng chứng thực thi `evaluate()` & Tài liệu gốc:**
  - **Kịch bản `S01`** (`eGFR = 22`, `currentMeds = [synjardy 12.5/1000 mg x 2]`, `modules = ['dm2']`): xuất đồng thời `[STOP] rec_dm2_metformin` (*"Ngừng Metformin do suy thận nặng"*) **VÀ** `[CONTINUE] rec_dm2_sglt2i_cardiorenal` (`drug = synjardy`, `title = "TIẾP TỤC DUY TRÌ Synjardy 12.5/1000mg [Liều hiện tại: 12.5/1000 mg]"`).
  - **Kịch bản `S02`** (`eGFR = 22`, `empagliflozin_metformin` + `sitagliptin_metformin`, `modules = ['ckd']`): `0` lệnh `STOP` Metformin, phát `[CONTINUE] Synjardy 12.5/1000mg`.
  - **Kịch bản `S04` & `S05`** (HFrEF, `actoplus_met 15/850 x 2`): ở `dm2` phát `[STOP] Actoplus Met` kèm `[CONTINUE] Metformin` ghi `dose = "Tiếp tục liều hiện tại (Actoplus Met 15/850mg: 15/850 x 2 lần/ngày)"`; ở `hf` phát `0` lệnh `STOP`.
  - **Kịch bản `S06` & `P10`** (`pregnant = true`, `soliqua` / `xultophy`): `0` lệnh `STOP`, phát chồng `[START] insulin_glargine`.
  - **Kịch bản `P02`** (`metformin 1000x2` + `synjardy 12.5/1000x2`): phát 2 lệnh `CONTINUE` = `4.000 mg/ngày` Metformin.
  - **Bằng chứng gốc:** `FDA_label_metformin.pdf` (trang 2, Mục 2.2 & 4: *"contraindicated in patients with an estimated glomerular filtration rate (eGFR) below 30 mL/min/1.73 m²"*); `FDA_label_pioglitazone.pdf` (trang 1, Boxed Warning suy tim); ADA 2026 SOC 15 (`ada.dm2.2026.pregnancy_glp1`).
- **Đề xuất khắc phục:**
  1. Mở rộng `FDC_COMPONENTS_MAP` trong `src/modules/dm2/helpers.drugs.ts` **và** `getExpandedDrugIds()` trong `src/engine/safety/drugClassify.ts` bao phủ đầy đủ FDC uống & tiêm (`synjardy`, `xigduo`, `invokamet`, `segluromet`, `janumet`, `jentadueto`, `galvus_met`, `kombiglyze`, `actoplus_met`, `amaryl_m`, `glyxambi`, `qtern`, `soliqua`/`insulin_glargine_lixisenatide`, `xultophy`/`insulin_degludec_liraglutide`) và thêm `'lixisenatide'`, `'exenatide'`, `'ertugliflozin'` vào danh sách rà soát thai kỳ/MTC/chu phẫu.
  2. Xây dựng hàm kiểm tra `hasContraindicatedCompanionInFdc(ctx, med, targetCanonicalId)`: nếu viên/bút FDC có bất kỳ hoạt chất đồng hành nào đang bị chống chỉ định/`STOP`/`HOLD`, **tuyệt đối không phát `[CONTINUE]` tên biệt dược FDC** và chặn `merge.ts` gán `drug = med.drugId`; thay vào đó phát `action: 'SWITCH'` hướng dẫn **ngừng viên/bút FDC và chuyển sang chế phẩm đơn chất** của hoạt chất an toàn (ví dụ: Ngừng `Synjardy 12.5/1000 mg` → Chuyển sang `Empagliflozin` đơn chất `10 mg x 1 lần/ngày`; Ngừng `Soliqua`/`Xultophy` ở thai kỳ → Chuyển sang `Insulin` đơn chất).
  3. Bổ sung quy tắc chặn trùng lặp ≥ 2 chế phẩm chứa Metformin (FDC + Metformin rời hoặc 2 FDC chứa Metformin) và cảnh báo khi tổng liều Metformin từ mọi nguồn `> 2.000–2.550 mg/ngày`.

---

#### [DM2-R3-R2-02] `CRITICAL` | Chồng liều Insulin nguy kịch nội viện & chu phẫu gây hạ đường huyết đe dọa tính mạng (`Mixtard 30`, `Insulatard`, `NovoRapid`)
- **Phân loại:** `rule`
- **Định danh tệp:** `src/modules/dm2/rules.inpatient.ts` | `src/modules/dm2/rules.periop.ts`
- **Cơ chế lỗi & Nguy cơ lâm sàng:**
  1. **Nội viện (`setting = 'inpatient'`):** Khi bệnh nhân đang tiêm tại nhà Insulin trộn sẵn (`insulin_premix`: `Mixtard 30`, `NovoMix 30`) hoặc Insulin NPH (`Insulatard`), cờ `hasAnyHomeInsulin = true` kích hoạt `basal_bolus_regimen` và `prandial_bolus_regimen` **ngay cả khi đường huyết bình thường (`glucose = 6.8 mmol/L`)**. Tuy nhiên, `existingLongBasalId` chỉ tìm trong `LONG_ACTING_BASAL_IDS` (`glargine`, `degludec`, `detemir`) và `existingRapidId` chỉ tìm `aspart`/`lispro`. Kết quả: hệ thống phát lệnh **`[START]` mới toàn bộ `Insulin Glargine` + `Insulin Aspart` theo cân nặng mà KHÔNG HỀ phát lệnh `[HOLD]`/`[STOP]`/`[SWITCH]` đối với `Mixtard 30` hay `Insulatard` đang dùng!** Tổng liều insulin bị cộng dồn gấp gần 2 lần ngay trên bệnh nhân có đường huyết `6.8 mmol/L`.
  2. **Nuôi ăn qua ống thông (`inpatientEating = 'tube_feeding'`):** Khi bệnh nhân đang tiêm sẵn `Insulin Aspart`/`Lispro` theo bữa ăn, nhánh `tube_feeding` phát `[START] Insulin Regular` mỗi 6 giờ nhưng không phát `[HOLD]`/`[STOP]` `Aspart`/`Lispro` cũ.
  3. **Chu phẫu ngoại trú (`setting = 'outpatient'`, `plannedSurgery = true`):** `rules.periop.ts` chỉ giảm liều `BASAL_INSULIN_IDS`, bỏ sót hoàn toàn `insulin_premix` và `BOLUS_INSULIN_IDS` (`aspart`, `lispro`, `regular`) — không hướng dẫn nhịn tiêm cử sáng insulin nhanh khi NPO trước mổ và không hướng dẫn giảm/chuyển đổi Premix chu phẫu.
- **Bằng chứng thực thi `evaluate()` & Tài liệu gốc:**
  - **Kịch bản `P06`** (`inpatient`, `eating = 'normal'`, `glucose = 6.8 mmol/L`, `currentMeds = [Mixtard 30 20U BID = 40U/ngày]`): phát `[START] rec_dm2_inpatient_basal_bolus` (`insulin_glargine 16U`) + `[START] rec_dm2_inpatient_prandial_bolus` (`insulin_aspart 5U x 3 = 15U`), `0` lệnh `HOLD`/`STOP`/`SWITCH` `Mixtard 30` → cộng dồn **71 U/ngày** ở đường huyết `6.8 mmol/L`!
  - **Kịch bản `S38` & `P07`** (`Mixtard 30` ở `glucose = 14.5`; `Insulatard 18U BID` ở `glucose = 13.8`): phát `[START]` Glargine + `[START]` Aspart không ngưng thuốc cũ.
  - **Kịch bản `P08`** (`tube_feeding` trên nền `Lantus` + `NovoRapid 8U x 3`): phát `[START] insulin_regular` mỗi 6h không `HOLD` `NovoRapid`.
  - **Kịch bản `P09`** (`outpatient`, `plannedSurgery = true`, `Mixtard 30` + `NovoRapid`): `0` khuyến cáo chu phẫu cho cả `Mixtard 30` và `NovoRapid`.
  - **Bằng chứng gốc:** `ADA_2026_SOC_16.pdf` (trang 6–8 & trang 14 ref Bellido et al.: phác đồ Premix nội viện gây hạ đường huyết cao gấp ~3 lần Basal-Bolus, bắt buộc ngưng Premix khi chuyển sang Basal-Bolus nội viện; sáng ngày mổ NPO bắt buộc hoãn insulin tác dụng nhanh/ngắn và giảm 20–50% thành phần nền).
- **Đề xuất khắc phục:**
  1. Trong `src/modules/dm2/rules.inpatient.ts`: khi bệnh nhân nội viện đang dùng `insulin_premix` tại nhà và chuyển sang Basal-Bolus, bắt buộc phát kèm lệnh `[STOP]`/`[SWITCH]` (hoặc `[HOLD]` nội viện) đối với `insulin_premix`; với `insulin_nph` tại nhà, cho phép `[CONTINUE]`/`[REDUCE]` trực tiếp hoặc phát `[SWITCH]` rõ ràng khi đổi sang `insulin_glargine`; ở nhánh `tube_feeding`, phát `[HOLD]` mọi insulin nhanh/premix cũ khi khởi trị `insulin_regular` mỗi 6 giờ.
  2. Trong `src/modules/dm2/rules.periop.ts`: bổ sung luật chu phẫu ngoại trú phát `[HOLD]` cử sáng ngày mổ khi NPO đối với toàn bộ `BOLUS_INSULIN_IDS` (`aspart`, `lispro`, `regular`), và phát `[REDUCE]`/`[SWITCH]` đối với `insulin_premix`.

---

#### [DM2-R3-R2-03] `CRITICAL` | Hàm `parseMedDailyDoseMg` tính sai tổng liều mg/ngày theo hướng Fail-Open (vi phạm QA-1), khuyên duy trì gấp đôi trần Metformin ở CKD G3b
- **Phân loại:** `rule`
- **Định danh tệp:** `src/modules/dm2/helpers.drugs.ts` | `src/modules/dm2/rules.glycemic.ts` | `src/modules/dm2/rules.safety.renal.ts`
- **Cơ chế lỗi & Nguy cơ lâm sàng:**
  1. **Coi `1 viên` hoặc `1 g` bằng `1 mg`:** `parseMedDailyDoseMg()` (`helpers.drugs.ts` dòng 265–292) đọc trực tiếp số `med.dose` mà **không kiểm tra `med.unit`**. Khi bác sĩ nhập `Glucophage` với `dose: 1, unit: 'viên', freq: '2 lần/ngày'` (thực tế `1.000–2.000 mg/ngày`) hoặc `dose: 1, unit: 'g', freq: '2 lần/ngày'` (`2.000 mg/ngày`), hàm trả về `dailyMg = 2`! Ở bệnh nhân suy thận CKD G3b (`eGFR = 36`), `rules.glycemic.ts` so sánh `2 <= 1000` (đúng!) và phát khuyến cáo **`[CONTINUE]` "Tiếp tục duy trì Metformin liều thận trọng (2 mg/ngày) phù hợp CKD G3b | Duy trì liều đang dùng: 1 viên x 2 lần/ngày"**!
  2. **Bỏ sót cách ghi tần suất tiếng Việt phổ biến `'Sáng - tối'`:** Regex tần suất chỉ khớp `'x2'`, `'2 lần'`, `'bid'`, không nhận diện `'Sáng - tối'`, `'Sáng, tối'`, `'Sáng - chiều'`, `'Sáng - trưa - tối'`. Do đó `Metformin 1000 mg`, `freq: 'Sáng - tối'` (thực tế **2.000 mg/ngày**) bị tính thành `1.000 mg/ngày` (`multiplier = 1`) và được khuyên tiếp tục duy trì nguyên liều ở `eGFR = 36`!
  3. **Fail-open ở `gliclazide_renal_reduce` (`rules.safety.renal.ts` dòng 358):** Điều kiện `dailyMg !== undefined && dailyMg > maxAllowed` khiến khi không rõ mg (`dailyMg === undefined`) thì âm thầm bỏ qua giảm liều ở CKD G3.
- **Bằng chứng thực thi `evaluate()` & Tài liệu gốc:**
  - **Kịch bản `P13`** (`eGFR = 36`, `currentMeds = [{ drugId: 'metformin', name: 'Glucophage', dose: 1, unit: 'viên', freq: '2 lần/ngày' }]`): xuất `[CONTINUE] title = "Tiếp tục duy trì Metformin liều thận trọng (2 mg/ngày) phù hợp CKD G3b" | dose = "Duy trì liều đang dùng: 1 viên x 2 lần/ngày"`.
  - **Kịch bản `S13a`** (`eGFR = 36`, `currentMeds = [{ drugId: 'metformin', dose: 1000, unit: 'mg', freq: 'Sáng - tối' }]`): xuất `[CONTINUE] title = "Tiếp tục duy trì Metformin liều thận trọng (1000 mg/ngày) phù hợp CKD G3b" | dose = "Duy trì liều đang dùng: 1000 mg x Sáng - tối"` (duy trì 2.000 mg/ngày ở eGFR 36!).
  - **Bằng chứng gốc:** KDIGO 2022 (`kdigo.dm2.2022.metformin_halve_30_44`: trần tối đa `1.000 mg/ngày` ở eGFR 30–44) & `FDA_label_metformin.pdf` (trang 2).
- **Đề xuất khắc phục:**
  1. Kiểm tra chặt `med.unit` trong `parseMedDailyDoseMg`: nếu `'g'`/`'gam'`/`'gram'` thì nhân `1000`; nếu `'mcg'`/`'µg'` thì chia `1000`; nếu `'viên'`/`'v'`/`'tablet'`/`'ống'`/`'bút'` (hoặc trống) mà không trích xuất được hàm lượng `mg` tường minh từ `med.name` thì **bắt buộc trả về `undefined`** (Fail-Closed theo QA-1).
  2. Bổ sung bộ đếm buổi dùng thuốc tiếng Việt (`'sáng'`, `'trưa'`, `'chiều'`, `'tối'`, `'khuya'`) khi có ≥ 2 buổi (ví dụ `'Sáng - tối'` → `2`; `'Sáng - trưa - tối'` → `3`) và `'q12h'` → `2`, `'q8h'` → `3`.
  3. Khi `dailyMg === undefined` ở CKD G3b (Metformin) hoặc CKD G3 (Gliclazide), phát khuyến cáo `REDUCE`/`MONITOR` nêu rõ mức trần tối đa cho phép (`≤ 1000 mg/ngày` cho Metformin; `≤ 60 mg/ngày` cho Gliclazide MR).

---

#### [DM2-R3-R2-04] `CRITICAL` | Đảo ngược Fallback Dị ứng Thuốc (Allergy Fallback Inversion) kê đơn trực tiếp hoạt chất bệnh nhân đã khai báo dị ứng
- **Phân loại:** `rule`
- **Định danh tệp:** `src/modules/dm2/rules.cardiorenal.glp1.ts` | `src/modules/dm2/rules.cardiorenal.sglt2.ts` | `src/modules/dm2/rules.stepup.ts` | `src/engine/safety/gates.ts`
- **Cơ chế lỗi & Nguy cơ lâm sàng:**
  1. Trong `src/modules/dm2/rules.cardiorenal.glp1.ts` (dòng 262–265):
     ```ts
     const targetDrugId =
       hasDrugAllergy(ctx, 'semaglutide') && !hasDrugAllergy(ctx, 'tirzepatide')
         ? 'tirzepatide'
         : 'semaglutide';
     ```
     Khi bệnh nhân bị dị ứng với **CẢ `semaglutide` lẫn `tirzepatide`** (hoặc tiền sử phản vệ/phù mạch với nhóm GLP-1 RA), vế `!hasDrugAllergy(ctx, 'tirzepatide')` bằng `false`, nên biểu thức ternary **rơi thẳng vào nhánh `: 'semaglutide'` và kê đơn `[START] Semaglutide` cho chính bệnh nhân dị ứng `semaglutide`!**
  2. Lỗi y hệt trong `src/modules/dm2/rules.cardiorenal.sglt2.ts` (dòng 301–304): khi dị ứng với cả `dapagliflozin` và `empagliflozin`, biểu thức rơi ngược về kê **`[START] Dapagliflozin`**!
  3. Nhánh đang dùng thuốc (`activeGlp1Id` / `activeSglt2Id`), `rules.stepup.ts`, `src/engine/safety/gates.ts` và `reviewCurrentMedications()` đều chưa kiểm tra mảng `ctx.patient.allergies`.
- **Bằng chứng thực thi `evaluate()` & Tài liệu gốc:**
  - **Kịch bản `P12`** (`eGFR = 22`, `allergies = ['semaglutide', 'dulaglutide', 'liraglutide', 'tirzepatide']`, `currentMeds = [sitagliptin]`): hệ thống phát trực tiếp **`[START] id=rec_dm2_glp1_cardiorenal | drug=semaglutide | title="Khởi trị Semaglutide (SC) bảo vệ tim mạch – thận"`** và còn phát `[SWITCH]` ngừng Januvia để chuyển sang `semaglutide`!
  - **Bằng chứng gốc:** `FDA_label_semaglutide_ozempic.pdf` (trang 2, Mục 4 & 5.7: chống chỉ định tuyệt đối khi có tiền sử quá mẫn nghiêm trọng như phản vệ/phù mạch với semaglutide) & `kb/drugs/dapagliflozin.json` (`contraindications: ['hypersensitivity']`).
- **Đề xuất khắc phục:**
  1. Duyệt tuần tự mảng ứng viên (`['semaglutide', 'dulaglutide', 'liraglutide', 'tirzepatide']` và `['dapagliflozin', 'empagliflozin', ...(footRisk ? [] : ['canagliflozin'])]`) để chọn hoạt chất đầu tiên `!hasDrugAllergy(ctx, id)`; nếu tất cả đều bị dị ứng (hoặc dị ứng mức nhóm `'glp1ra'`/`'sglt2i'`), phát `action: 'AVOID'` nêu rõ tiền sử dị ứng thuốc.
  2. Bổ sung cổng an toàn chung kiểm tra `ctx.patient.allergies` trong `src/engine/safety/gates.ts` và `reviewCurrentMedications()` để chặn mọi lệnh `START`/`UPTITRATE`/`CONTINUE` trùng với thuốc dị ứng trên toàn bộ 9 module.

---

#### [DM2-R3-R2-05] `CRITICAL` | 5 Mã trích dẫn Thai kỳ trong `PREGNANCY_CITATIONS` hoàn toàn không tồn tại trong Cơ sở Tri thức (`kb/citations/*.json`)
- **Phân loại:** `citation`
- **Định danh tệp:** `src/modules/dm2/rules.safety.contra.ts` (dòng 27–33)
- **Cơ chế lỗi & Nguy cơ lâm sàng:**
  Hằng số `PREGNANCY_CITATIONS` khai báo 5 chuỗi ID:
  - `'fda.semaglutide.pregnancy'`
  - `'fda.semaglutide_rybelsus.pregnancy'`
  - `'fda.dulaglutide.pregnancy'`
  - `'fda.liraglutide.pregnancy'`
  - `'fda.tirzepatide.pregnancy'`
  Cả 5 ID này được đưa trực tiếp vào `Recommendation.citationIds` khi phát lệnh `[STOP]` khẩn cấp ở phụ nữ mang thai, nhưng **không tồn tại** trong `kb/citations/dm2.json` hay bất kỳ tệp nào trong `kb/citations/*.json`! Lỗi này lọt qua `verifyKb.ts` vì các chuỗi nằm trong `Record<string, string>` gián tiếp, vi phạm nguyên tắc bất khả xâm phạm **QA-2 (100% Citation Integrity)** ngay tại cảnh báo ngừng thuốc độc phôi thai.
- **Bằng chứng thực thi `evaluate()` & Tài liệu gốc:**
  - **Kịch bản `S30a`** (`pregnant = true`, `currentMeds = [semaglutide]`): xuất `[STOP] rec_dm2_pregnancy_stop_semaglutide` chứa `citationIds = ['fda.semaglutide.pregnancy', 'ada.dm2.2026.pregnancy_insulin', 'ada.dm2.2026.pregnancy_glp1']`, trong đó `'fda.semaglutide.pregnancy'` trả về `undefined` khi tra cứu toàn bộ KB.
  - **Bằng chứng gốc có sẵn trong kho PDF:** `FDA_label_semaglutide_rybelsus.pdf` trang 16 (*"Discontinue RYBELSUS or OZEMPIC tablets in women at least 2 months before a planned pregnancy due to the long washout period for semaglutide"*); `FDA_label_tirzepatide.pdf` trang 15 (*"Based on animal reproduction studies, there may be risks to the fetus from exposure to tirzepatide during pregnancy"*).
- **Đề xuất khắc phục:**
  1. Bổ sung đầy đủ 5 mục trích dẫn nguyên văn từ Mục 8.1 / 8.3 của 5 nhãn FDA tương ứng vào `kb/citations/dm2.json` (hoặc trỏ về trích dẫn đã xác thực `'ada.dm2.2026.pregnancy_glp1'`).
  2. Nâng cấp `tools/kb/verifyKb.ts` quét regex mọi chuỗi có tiền tố nguồn (`ada.`, `fda.`, `ema.`, `kdigo.`, `esc.`, `byt.`...) trên toàn bộ `src/modules/**` để triệt tiêu điểm mù biến gián tiếp.

---

### NHÓM B — CÁC PHÁT HIỆN MỨC ĐỘ LỚN (`MAJOR`: 8 PHÁT HIỆN)

---

#### [DM2-R3-R2-06] `MAJOR` | Bỏ sót hoàn toàn giảm liều thận & tương tác CYP3A4 của nhóm DPP-4i (`Sitagliptin`, `Vildagliptin`, `Saxagliptin`) ở bệnh nhân Nội trú khoa thường
- **Phân loại:** `rule`
- **Định danh tệp:** `src/modules/dm2/rules.safety.renal.ts` | `src/engine/safety/reviewMedsVitalsAndRenal.ts`
- **Chi tiết & Bằng chứng:**
  - Cả 3 luật `sitagliptin_renal_reduce` (dòng 224), `saxagliptin_renal_cyp3a4_reduce` (dòng 267) và `vildagliptin_renal_reduce` (dòng 311) đều bị khóa cứng ở `setting: 'outpatient'`. Trong khi đó, ở bệnh nhân nội trú khoa thường ăn uống bình thường (`setting: 'inpatient'`, `inpatientEating: 'normal'`), `inpatientCriticalDpp4HoldRules` chủ đích cho phép tiếp tục DPP-4i (theo ADA 2026 Ch. 16), còn `reviewMedsVitalsAndRenal.ts` chỉ bắt `continue === 'contra'`.
  - **Thực thi `evaluate()` xác nhận:** Bệnh nhân nội trú khoa thường ăn uống bình thường uống `Sitagliptin 100 mg/ngày` ở `eGFR = 22` (**quá liều gấp 4 lần** mức trần `25 mg/ngày`, kịch bản `S09`), `Vildagliptin 50 mg x 2` ở `eGFR = 26` (**gấp đôi** mức `50 mg OD`, kịch bản `S10`), `Saxagliptin 5 mg` ở `eGFR = 32` (`P05`) hoặc dùng kèm `Clarithromycin` nội trú (`S11`) đều nhận **`0` khuyến cáo `[REDUCE]`** trong phác đồ!
  - **Bằng chứng gốc:** FDA Januvia (`fda.sitagliptin.renal_bands`), FDA Onglyza (`fda.saxagliptin.renal_dose`, `fda.saxagliptin.cyp3a4_2_5mg`), EMA Galvus (`ema.vildagliptin.renal_50mg_od`).
- **Đề xuất khắc phục:** Đổi `setting` của 3 luật trên trong `rules.safety.renal.ts` sang `'both'` và chỉ loại trừ khi ca nội viện đã thuộc diện `HOLD` DPP-4i cấp tính (`ICU`, `DKA/HHS`, `NPO`, `plannedSurgery`).

---

#### [DM2-R3-R2-07] `MAJOR` | Ba lỗ hổng an toàn cơ quan của `Pioglitazone` (nhầm ngưỡng ALT `3.0×` thay vì `2.5× ULN`, bỏ sót Ung thư bàng quang / gãy xương) và `Acarbose` (bỏ sót chống chỉ định Xơ gan)
- **Phân loại:** `rule`
- **Định danh tệp:** `src/modules/dm2/helpers.ts` | `src/modules/dm2/rules.safety.dup_hepatic.ts` | `kb/drugs/acarbose.json` | `kb/thresholds/dm2.json`
- **Chi tiết & Bằng chứng:**
  1. **Sai ngưỡng men gan Pioglitazone (`2.5×` vs `3.0× ULN`):** `hasPioglitazoneHepaticContra` (`helpers.ts` dòng 129) và `pioglitazone_hepatic_stop` (`rules.safety.dup_hepatic.ts` dòng 225) gọi nhầm ngưỡng của Vildagliptin `thFor('alt_uln', 'dm2.vildagliptin.alt_uln_max')` (`= 3.0`), bỏ lọt toàn bộ bệnh nhân có `ALT = 2.6–3.0× ULN` (**Kịch bản `P01`**: `altUlnTimes = 2.8`, đang dùng `Pioglitazone 30 mg` → **`0` lệnh `[STOP]`**) và in sai sự thật trong `rationale` (*"Nhãn FDA Actos: Không dùng Pioglitazone... khi ALT vượt 3 lần"*), trái với chính `FDA_label_pioglitazone.pdf` trang 23 (*"ALT >2.5 times the upper limit of the reference"*).
  2. **Bỏ sót Ung thư bàng quang hoạt động & nguy cơ gãy xương nữ giới của Pioglitazone:** **Kịch bản `S20`** (nữ lớn tuổi có ung thư bàng quang hoạt động + loãng xương gãy xương đang dùng `Pioglitazone 30 mg`) xuất **`0` lệnh `[STOP]` và `0` cảnh báo**, trái với `FDA_label_pioglitazone.pdf` trang 2 & 7 (*"ACTOS should not be used in patients with active bladder cancer"*, *"Fractures: Increased incidence in female patients"*).
  3. **Bỏ sót chống chỉ định tuyệt đối `Acarbose` trong Xơ gan (Cirrhosis):** **Kịch bản `S31b`, `S31c`, `P15`** (Xơ gan Child-Pugh B & C đang uống `Acarbose 50 mg x 3`) xuất **`0` lệnh `[STOP]` Acarbose** ở cả module `dm2` và `ckd`! Nguyên văn `FDA_label_acarbose.pdf` trang 6 (Mục 4 Contraindications): *"Precose is contraindicated in patients with diabetic ketoacidosis or cirrhosis."*
- **Đề xuất khắc phục:** Thêm ngưỡng `'dm2.pioglitazone.alt_uln_max': 2.5` vào `kb/thresholds/dm2.json`; bổ sung kiểm tra ung thư bàng quang hoạt động (`STOP`/`AVOID`) & cảnh báo gãy xương nữ cho Pioglitazone; cập nhật `kb/drugs/acarbose.json` (`contraindications` thêm `'cirrhosis'`, trích dẫn `FDA_label_acarbose.pdf` p. 6) và thêm `acarbose_hepatic_stop` vào `hepaticSafetyStopRules`.

---

#### [DM2-R3-R2-08] `MAJOR` | Mâu thuẫn nội tại trên cùng một thẻ khuyến cáo: tiêu đề `[STOP] NGỪNG NGAY Tirzepatide` nhưng trường `dose` vẫn in `"Duy trì liều đang dùng: 5 mg x 1 lần/tuần"`
- **Phân loại:** `rule`
- **Định danh tệp:** `src/modules/dm2/helpers.ts` | `src/engine/safety/organAndCrisisGates.ts` | `src/engine/safety/vitalAndRenalGates.ts`
- **Chi tiết & Bằng chứng:**
  - `CRITICAL_SAFETY_CUSTOM_INPUT_FLAGS` trong `src/engine/types.ts` (dòng 399) định nghĩa khóa chuẩn `'medullary_thyroid_carcinoma'`, nhưng `hasMtcOrMen2()` trong `src/modules/dm2/helpers.ts` (dòng 99–108) lại bỏ sót khóa này. Khi nhận cờ `medullary_thyroid_carcinoma: true` (**Kịch bản `S23`**), `rules.cardiorenal.glp1.ts` vẫn phát `[CONTINUE] Tirzepatide` với `dose = "Duy trì liều đang dùng: 5 mg x 1 lần/tuần"`. Sau đó `organAndCrisisGates.ts` ghi đè `action = 'STOP'` và `title = "NGỪNG NGAY Tirzepatide (Tiền sử MTC / MEN 2)"` **nhưng bỏ quên không xóa `rec.dose`**!
  - Lỗi tương tự xảy ra trên thẻ `[AVOID] Atorvastatin` ở **Kịch bản `S31c`** (`title = "CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG Atorvastatin"`, nhưng `dose = "20 mg 1 lần/ngày"`).
- **Đề xuất khắc phục:** Đồng bộ đầy đủ các khóa cờ bệnh lý giữa `src/modules/dm2/helpers.ts` và `src/engine/safety/clinicalStates.ts`; đồng thời trong `organAndCrisisGates.ts` và `vitalAndRenalGates.ts`, mọi thao tác chuyển đổi `rec.action` sang `'STOP'` / `'AVOID'` / `'HOLD'` bắt buộc gán `rec.dose = undefined`.

---

#### [DM2-R3-R2-09] `MAJOR` | Bốn lỗ hổng chặn trùng lặp thuốc hạ đường huyết (`Glimepiride + Glibenclamide`, `Premix + Bolus`, `2 Bolus`) & cảnh báo sai bản chất dược lý `dup.dpp4_glp1`
- **Phân loại:** `rule`
- **Định danh tệp:** `src/modules/dm2/rules.safety.dup_hepatic.ts` | `src/engine/safety/duplicateRules.ts` | `src/engine/safety/duplicates.ts`
- **Chi tiết & Bằng chứng:**
  1. **Trùng lặp 2 Sulfonylurea (`Glimepiride [Amaryl] + Glibenclamide [Daonil]`):** Do `SINGLE_DRUG_ALIASES` gộp `glibenclamide`/`glyburide`/`glipizide` → `'glimepiride'` và `duplicate_su_stop` chỉ kiểm tra `isTakingCanonical('gliclazide') && isTakingCanonical('glimepiride')`, **Kịch bản `P03`** xuất **`0` lệnh `[STOP]`** trong `recommendations`!
  2. **Trùng lặp ≥ 2 Insulin nhanh bữa ăn & chồng chéo `Premix + Bolus`:** **Kịch bản `S37a`** (`Mixtard 30` + `NovoRapid [aspart]` + `Humalog [lispro]`) xuất **`0` lệnh `[STOP]`, `0` Alert** và thậm chí còn phát `[UPTITRATE] Mixtard 30`!
  3. **Báo sai tên nhóm dược lý ở `dup.dpp4_glp1`:** Quy tắc `dup.dpp4_glp1` trong `duplicateRules.ts` gom chung `['dpp4i', 'glp1ra']`. Khi bệnh nhân uống 2 DPP-4i (`Sitagliptin + Vildagliptin`, **Kịch bản `S12`, `S17`**) hoặc tiêm 2 GLP-1 RA (`Semaglutide + Liraglutide`, **Kịch bản `P04`**), hệ thống phát banner sai sự thật: *"Phối hợp DPP-4i và GLP-1 RA"*!
  4. **Nổ cảnh báo dư thừa sau khi đã `STOP`:** **Kịch bản `S24a`** (Viêm tụy cấp đã `STOP` cả `Semaglutide` và `Sitagliptin`) vẫn nổ `dup.dpp4_glp1`.
- **Đề xuất khắc phục:** Đếm số mục thuốc gốc thuộc nhóm SU / Bolus / Premix+Bolus trong `rules.safety.dup_hepatic.ts` để phát `[STOP]`; tách `dup.dpp4_glp1` trong `duplicateRules.ts` thành 3 quy tắc riêng biệt (`dup.dpp4i`, `dup.glp1ra` [critical], và `dup.dpp4_glp1` chỉ nổ khi có ≥ 1 DPP-4i **và** ≥ 1 GLP-1/GIP-GLP-1 RA chưa bị `STOP`).

---

#### [DM2-R3-R2-10] `MAJOR` | Xung đột chuẩn độ: vừa khởi trị mới `[START] Dapagliflozin` + `[START] Semaglutide` vừa đồng thời `[UPTITRATE]` tăng liều Insulin Glargine ở `HbA1c = 7.2%`
- **Phân loại:** `rule`
- **Định danh tệp:** `src/modules/dm2/rules.insulin.titrate.ts` | `src/modules/dm2/rules.safety.deintensify.ts`
- **Chi tiết & Bằng chứng:**
  - **Kịch bản `S34`** (ASCVD + HF, `HbA1c = 7.2%`, mục tiêu `< 7.0%`, đang dùng `Glimepiride 4 mg` + `Insulin Glargine 26 U`): hệ thống phát đồng thời `[START] Dapagliflozin 10 mg`, `[START] Semaglutide 0.25 mg`, `[REDUCE] Glimepiride` **VÀ `[UPTITRATE] Chuẩn độ tăng liều Insulin Glargine (+2–4 đơn vị mỗi 3 ngày)`**!
  - **Bằng chứng gốc:** `ADA_2026_SOC_9.pdf` trang 16, Hình 9.4 (*"If A1C <8% (<64 mmol/mol), consider lowering the basal insulin dose by 10–20%"* khi khởi trị GLP-1 RA); `FDA_label_semaglutide.pdf` trang 2 Mục 5.4; `kdigo.dm2.2022.sglt2_hypo_su_adjust`.
- **Đề xuất khắc phục:** Khi trong cùng lượt đánh giá có lệnh `[START]` mới SGLT2i và/hoặc GLP-1/GIP-GLP-1 RA và `HbA1c < 8.0%` (hoặc vượt mục tiêu `≤ 0.5–1.0%`), chặn `[UPTITRATE]` insulin nền đồng thời; chuyển sang `[REDUCE]` giảm 10–20% liều nền (nếu `HbA1c ≤ mục tiêu` hoặc `< 7.5%` khi thêm GLP-1 RA) hoặc `[CONTINUE]` giữ nguyên liều nền chờ đánh giá lại.

---

#### [DM2-R3-R2-11] `MAJOR` | Khoảng trống an toàn thuốc Thời kỳ cho con bú (`Lactation / Breastfeeding`) và gộp nhầm nhãn `'Mang thai / Cho con bú'`
- **Phân loại:** `missing`
- **Định danh tệp:** `src/engine/types.ts` | `src/modules/dm2/inputs.ts` | `src/modules/dm2/rules.safety.contra.ts` | `src/engine/safety/reviewMeds.ts`
- **Chi tiết & Bằng chứng:**
  - Toàn bộ 25/25 tệp `kb/drugs/*.json` đã có dữ liệu chuẩn xác tại trường `lactation` (`gliclazide`: `'contra'` chống chỉ định tuyệt đối do hạ ĐH sơ sinh; `dapagliflozin`/`empagliflozin`/`canagliflozin`/`semaglutide_oral`/`tirzepatide`: `'avoid'`), nhưng không có bất kỳ quy tắc nào đọc `DrugEntry.lactation`!
  - Hệ quả kép (**Kịch bản `S30b`**): Nếu phụ nữ sau sinh đang cho con bú không tick `pregnant`, hệ thống phát **`0` lệnh `STOP`/`AVOID`** cho `Gliclazide`, `Dapagliflozin`, `Semaglutide`; ngược lại nếu bác sĩ tick ô `'Mang thai / Cho con bú'` (`STANDARD_CONDITIONS.pregnant` trong `types.ts` dòng 190), sản phụ sau sinh lại bị áp nhầm đích thai kỳ `HbA1c < 6.5%`, bị kê Aspirin dự phòng tiền sản giật tuần 12–36 và bị bắt ngừng cả Metformin!
  - **Bằng chứng gốc:** `gliclazide_MR_Diamicron_SmPC.pdf` trang 5 Mục 4.6 (*"contra-indicated in breast-feeding mother"*); `FDA_label_semaglutide_rybelsus.pdf` trang 2 & 16 Mục 8.2 (*"breastfeeding is not recommended"*).
- **Đề xuất khắc phục:** Tách riêng cờ `'breastfeeding'` (*"Đang cho con bú"*) khỏi `'pregnant'` (*"Đang mang thai"*) và bổ sung quy tắc đọc `DrugEntry.lactation` để phát `STOP`/`AVOID` đối với SU, SGLT2i, GLP-1/GIP-GLP-1 RA, TZD, Acarbose khi cho con bú.

---

#### [DM2-R3-R2-12] `MAJOR` | Bỏ sót 3 cảnh báo & tương tác trọng yếu trên nhãn FDA của nhóm GLP-1 / GIP-GLP-1 RA: Liệt dạ dày nặng, Biến chứng Võng mạc ĐTĐ (SUSTAIN-6) & Tương tác `Tirzepatide` + Thuốc tránh thai uống
- **Phân loại:** `missing`
- **Định danh tệp:** `src/modules/dm2/rules.cardiorenal.glp1.ts` | `src/modules/dm2/inputs.ts` | `kb/interactions/diabetes_respiratory.json`
- **Chi tiết & Bằng chứng:**
  1. **Liệt dạ dày nặng (`Severe Gastroparesis`):** `FDA_label_semaglutide_ozempic.pdf` trang 2 Mục 5.6, Trulicity Mục 5.6 và `FDA_label_tirzepatide.pdf` Mục 5.6 đều nêu rõ *"not recommended in patients with severe gastroparesis"*, nhưng **Kịch bản `S25`** vẫn phát thẳng `[START] Semaglutide` không kèm cảnh báo hay `AVOID`.
  2. **Biến chứng Võng mạc ĐTĐ (`Diabetic Retinopathy` — FDA Ozempic Mục 5.3 SUSTAIN-6 & ADA 2026 Ch. 12):** Ở bệnh nhân có bệnh võng mạc ĐTĐ kèm `HbA1c = 10.5%` khởi trị Semaglutide hạ đường huyết nhanh (`S25`), chưa có cảnh báo khám đáy mắt sát.
  3. **Tương tác `Tirzepatide` + Thuốc tránh thai nội tiết đường uống (`FDA_label_tirzepatide.pdf` trang 14 & 16, Mục 7.2 & 8.3):** Tirzepatide làm giảm tới ~66% $C_{\max}$ và ~20% $\text{AUC}$ của thuốc tránh thai uống sau khởi trị và mỗi lần tăng liều (nguy cơ mang thai ngoài ý muốn ngay khi đang phơi nhiễm thuốc độc phôi thai!). **Kịch bản `S26`** (nữ 30 tuổi dùng `ethinylestradiol_levonorgestrel` + `Tirzepatide 2.5 mg/tuần`) xuất **`0` cảnh báo tương tác** và `0` hướng dẫn đổi sang tránh thai không qua đường uống / dùng thêm màng chắn trong **4 tuần sau khởi trị và 4 tuần sau mỗi bậc tăng liều**.
- **Đề xuất khắc phục:** Bổ sung cờ `severeGastroparesis` (`AVOID`/`DEFER` GLP-1 RA), cảnh báo theo dõi đáy mắt khi khởi trị Semaglutide/Tirzepatide trên nền bệnh võng mạc / `HbA1c ≥ 9–10%`, và quy tắc tương tác `ix.tirzepatide_oral_contraceptives` trong `kb/interactions/diabetes_respiratory.json` + lưu ý cho phụ nữ tuổi sinh đẻ.

---

#### [DM2-R3-R2-13] `MAJOR` | Bất đối xứng cổng an toàn `reviewCurrentMedications` khi chạy ngoài module `dm2` & gắn nhầm trích dẫn Finerenone cho `[STOP] Metformin`
- **Phân loại:** `rule`
- **Định danh tệp:** `src/engine/safety/reviewMedsSpecialized.ts` | `src/engine/safety/clinicalStates.ts`
- **Chi tiết & Bằng chứng:**
  1. Khi người dùng chỉ bật `['htn']` (**Kịch bản `S24b`**: viêm tụy cấp đang uống `Sitagliptin 100 mg`), hệ thống phát **`0` lệnh `[STOP]`** (trong khi bật `['dm2']` ở `S24a` thì `STOP` khẩn cấp).
  2. Khi người dùng chỉ bật `['ckd']` (**Kịch bản `S31c`**: Xơ gan mất bù Child-Pugh C đang uống `Metformin`, `Glimepiride`, `Gliclazide`, `Acarbose`), hệ thống bỏ sót không `STOP` `Glimepiride`, `Gliclazide` và `Acarbose`.
  3. Cũng tại `S31c`, thẻ `[STOP] med_review_hepatic_stop_metformin` (*"NGỪNG NGAY Metformin (Chống chỉ định trên gan)"*) lại gắn nhầm `citationIds = ['fda.finerenone.hepatic_impairment']` thay vì `'fda.metformin.hepatic_contra'`!
- **Đề xuất khắc phục:** Sửa ngay mã trích dẫn của Metformin trong `reviewMedsSpecialized.ts` thành `'fda.metformin.hepatic_contra'`, bổ sung `STOP` DPP-4i / GLP-1 RA khi có viêm tụy cấp và `STOP` Sulfonylurea / Acarbose khi suy gan mất bù.

---

### NHÓM C — CÁC PHÁT HIỆN MỨC ĐỘ NHỎ & ĐỀ XUẤT (`MINOR`: 4 | `SUGGESTION`: 1)

---

#### [DM2-R3-R2-14] `MINOR` | `src/modules/dm2/pathway.ts` thực tế vẫn là đối tượng tĩnh, chưa tính động `status` theo `RuleContext` như ghi trong `round2_RESPONSE.md`
- **Phân loại:** `ui` | **Định danh:** `src/modules/dm2/pathway.ts` | `docs/reviews/dm2/round2_RESPONSE.md`
- **Chi tiết & Đề xuất:** Mục `R3-R2-DM2-20` trong `round2_RESPONSE.md` ghi đã tính động `status` theo `RuleContext`, nhưng `dm2Pathway` trong `pathway.ts` (dòng 12–98) vẫn gán cứng `status: 'active'`/`'pending'`/`'info'`. Đề xuất mở rộng `ModuleDefinition.pathway` nhận `(ctx: RuleContext) => PathwayDefinition` hoặc đồng bộ lại tài liệu giải trình.

---

#### [DM2-R3-R2-15] `MINOR` | `dm2MatrixComorbidities` dùng 5 mã đại diện nhóm thuốc không có trong KB (`sglt2i`, `glp1_ra`, `dpp4i`, `sulfonylurea`, `insulin_basal`), thiếu hàng riêng cho `Tirzepatide` và gộp chung cảnh báo suy tim SAVOR-TIMI 53 cho cả nhóm DPP-4i
- **Phân loại:** `matrix` | **Định danh:** `src/modules/dm2/matrix.ts`
- **Chi tiết & Đề xuất:** 5 hàng trong `dm2MatrixComorbidities` có `hasDrug(row.drugId) === false`. Đề xuất bảo vệ UI bằng `hasDrug(row.drugId)` (hoặc thêm cờ `isClassRow`), tách hàng riêng cho `Tirzepatide` (thể hiện lợi ích trên HFpEF béo phì Rec 9.9a & giảm cân rất mạnh), và ghi rõ tại ô `DPP-4i × Suy tim`: *"TRÁNH Saxagliptin (SAVOR-TIMI 53); Linagliptin/Sitagliptin trung tính"*.

---

#### [DM2-R3-R2-16] `MINOR` | Ký tự rác `/C15` trong trích dẫn `ada.dm2.2024.dka_sglt2i_stop_permanent` & làm rõ tên chế phẩm PDF của `fda_label_metformin` và `fda_label_semaglutide_ozempic` trong `kb/sources.json`
- **Phân loại:** `citation` | **Định danh:** `kb/citations/dm2.json` | `kb/sources.json`
- **Chi tiết & Đề xuất:**
  1. Dọn 2 chuỗi glyph `/C15` trong `ada.dm2.2024.dka_sglt2i_stop_permanent` (trang 14 `ADA_2024_Hyperglycaemic_Crises_Consensus.pdf`).
  2. Tệp `FDA_label_metformin.pdf` thực chất là nhãn FDA của viên phối hợp *"Pioglitazone and Metformin Hydrochloride Tablets"* và `FDA_label_semaglutide_ozempic.pdf` là nhãn 10/2025 của viên uống *"RYBELSUS and OZEMPIC tablets"*; đề xuất cập nhật đúng `title` trong `kb/sources.json` hoặc bổ sung PDF nhãn Glucophage / Ozempic SC riêng biệt.

---

#### [DM2-R3-R2-17] `MINOR` | `extractBasalInsulinInfo` chỉ đọc dòng đầu tiên khi bệnh nhân tiêm Insulin NPH 2 cử/ngày nhập thành 2 dòng riêng (`16 U` sáng + `12 U` tối) hoặc ghi `freq = '2 lần/ngày'`
- **Phân loại:** `rule` | **Định danh:** `src/modules/dm2/helpers.drugs.ts` (`extractBasalInsulinInfo`)
- **Chi tiết & Đề xuất:** Ở **Kịch bản `S36a`**, bệnh nhân tiêm `Insulatard sáng 16 U` + `Insulatard tối 12 U` (tổng `28 U/ngày`), nhưng `extractBasalInsulinInfo` chỉ lấy `16 U`, làm đánh giá thấp tỷ lệ `U/kg/ngày` khi xét cảnh báo Overbasalization (`> 0.5 U/kg/ngày`). Đề xuất dùng `findAllActiveMedsByCanonical` cộng tổng các dòng cùng hoạt chất nền và nhân hệ số tần suất BID nếu nhập trên 1 dòng.

---

#### [DM2-R3-R2-18] `SUGGESTION` | Phân biệt mốc ngưng chu phẫu `4 ngày` đối với `Ertugliflozin` (`Steglatro` / `Segluromet`) so với `3 ngày` đối với `Dapagliflozin` / `Empagliflozin` / `Canagliflozin`
- **Phân loại:** `drug` | **Định danh:** `src/modules/dm2/rules.safety.renal.ts` | `src/modules/dm2/helpers.drugs.ts`
- **Chi tiết & Đề xuất:** Theo đúng nguyên văn `ada.dm2.2026.sglt2i_withhold_surgery` (*"SGLT2 inhibitors be stopped 3 days before scheduled surgeries (4 days for ertugliflozin)"*), khi mở rộng nhận diện `ertugliflozin` / `segluromet` đồng bộ với `duplicateRules.ts` & `organAndCrisisGates.ts`, đề xuất áp dụng ngưỡng ngưng trước mổ **4 ngày** cho `ertugliflozin` (giữ nguyên 3 ngày cho 3 SGLT2i còn lại).

---

## 5. Kết Luận & Điều Kiện Để Đạt `PASS` Ở Vòng Tiếp Theo

Module `dm2` đã đạt độ chín rất cao về mặt kiến trúc mô-đun hóa, độ phủ phác đồ điều trị chuẩn ADA 2026 / KDIGO 2022–2025 / Bộ Y tế và tính xác thực nguyên văn của 145 trích dẫn trong `kb/citations/dm2.json`. Để chuyển phán quyết từ **`FAIL`** sang **`PASS`** (đạt **0 Critical, 0 Major**), nhóm phát triển cần ưu tiên xử lý dứt điểm **13 hạng mục `Critical` & `Major` (`DM2-R3-R2-01` → `DM2-R3-R2-13`)**, trọng tâm là:

1. **Chặn triệt để xung đột `STOP` + `CONTINUE` trên viên/bút phối hợp cố định FDC** (chuyển sang `SWITCH` đơn chất an toàn; bổ sung `Soliqua`/`Xultophy` vào rà soát thai kỳ; mở rộng phân rã FDC sang `drugClassify.ts` và chặn trùng lặp `4.000 mg/ngày` Metformin).
2. **Ngưng/chuyển đổi rõ ràng Insulin tại nhà (`Premix`, `NPH`, `Bolus`) trước khi khởi trị phác đồ Insulin nội viện** và bổ sung hướng dẫn chu phẫu ngoại trú cho `Premix` & `Bolus`.
3. **Sửa `parseMedDailyDoseMg` theo nguyên tắc Fail-Closed (QA-1)** cho đơn vị `'viên'`/`'g'` và tần suất tiếng Việt `'Sáng - tối'`.
4. **Sửa lỗi đảo ngược fallback dị ứng thuốc** trong `rules.cardiorenal.glp1.ts` & `rules.cardiorenal.sglt2.ts` và bổ sung cổng chặn `Patient.allergies` toàn cục.
5. **Khắc phục 5 mã trích dẫn thai kỳ `PREGNANCY_CITATIONS`** và sửa trích dẫn nhầm Finerenone trên thẻ `[STOP] Metformin` suy gan.
6. **Mở khóa giảm liều thận/CYP3A4 cho DPP-4i ở nội trú khoa thường**, sửa ngưỡng ALT `2.5× ULN` + ung thư bàng quang cho `Pioglitazone`, bổ sung chống chỉ định xơ gan cho `Acarbose`, xóa `rec.dose` trên mọi thẻ `STOP`/`AVOID`, hoàn thiện chặn trùng lặp `SU`/`Bolus`/`Premix`, điều hòa chuẩn độ nền khi mới thêm SGLT2i/GLP-1 RA ở HbA1c sát đích, tách cờ **Cho con bú (`breastfeeding`)** và bổ sung cảnh báo liệt dạ dày / võng mạc / tương tác thuốc tránh thai uống của `Tirzepatide`.
