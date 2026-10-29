# Báo cáo Kiểm định Độc lập Vòng 1 — Module Bệnh Gút (`gout`)
**Vai trò**: **R1 – Chuyên gia Cơ Xương Khớp & Kiểm định Guideline (Guideline & Citation Checker)**  
**Ngày kiểm định**: 27/10/2026  
**Phạm vi đối chiếu độc lập**:
- Mã nguồn & KB: `src/modules/gout/{index,inputs,matrix,pathway,presets,rules}.ts`, `kb/citations/gout.json` (58 mục), `kb/thresholds/gout.json` (62 mục), 11 tệp thuốc Gút trong `kb/drugs/*.json`, `tests/golden/gout/**` (30 ca), `docs/modules/GOUT.md`.
- Tài liệu gốc đã mở đối chiếu nguyên văn từng trang PDF (`Medical_Library_2026`):
  1. **ACR 2020 Guideline for the Management of Gout** (`ACR_2020_Gout_Guideline.pdf`, toàn bộ 34 trang, bao gồm Bảng 1–8 tại `pdfPage 27–34` / *Arthritis Care Res* pp. 744–760).
  2. **2016 Updated EULAR Evidence-Based Recommendations for the Management of Gout** (`EULAR_2016_Gout_Recommendations.pdf`, toàn bộ 14 trang, *Ann Rheum Dis* 2017;76:29–42, Bảng 1–2 tại `pdfPage 3–4` / trang in 31–32).
  3. **Hướng dẫn Chẩn đoán và Điều trị Các bệnh Cơ Xương Khớp — Bộ Y tế QĐ 361/QĐ-BYT (2014)** (`BYT_361_2014_Co_Xuong_Khop.pdf`, toàn bộ chương *Bệnh Gút* `pdfPage 89–94` và chương *Bệnh Loãng xương* `pdfPage 170–174`).
  4. **KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD** (`01_Noi_Khoa/Than/KDIGO_2024_CKD_Guideline.pdf`, Mục `3.14 Hyperuricemia` tại `pdfPage 46 / S161` và `pdfPage 115–117 / S230–S232`).
  5. **Nhãn thuốc FDA**: `FDA_label_allopurinol.pdf` (Zyloprim), `FDA_label_febuxostat.pdf` (Uloric), `FDA_label_colchicine.pdf` (Colcrys, Bảng 1 tương tác trang 6), `FDA_label_probenecid.pdf` (phát hiện nhầm nhãn kháng sinh phối hợp *Orlynvah*).
- Chạy thực nghiệm trực tiếp `evaluate()` và `goutMatrix` qua các kịch bản lâm sàng trong `docs/reviews/gout/scratch/r1_*.ts`.

---

## 1. Tổng hợp Kết quả Kiểm định

| Mức độ (`severity`) | Số lượng | Mã phát hiện (`id`) | Ý nghĩa theo `REVIEW_PROTOCOL.md` |
|---|---:|---|---|
| **`critical`** | **3** | `R1-GOUT-001` → `R1-GOUT-003` | Có thể gây hại trực tiếp cho người bệnh nếu làm theo khuyến cáo engine |
| **`major`** | **15** | `R1-GOUT-004` → `R1-GOUT-018` | Sai guideline/liều/COR-LOE, gian lận trích dẫn QA-7/QA-10, sai ma trận thận, thiếu khuyến cáo Class I |
| **`minor`** | **5** | `R1-GOUT-019` → `R1-GOUT-023` | Sai phân nhóm tương tác phụ, cắt xén đầu câu quote, lệch `printedPage`, thiếu lưu ý thực hành |
| **`suggestion`** | **3** | `R1-GOUT-024` → `R1-GOUT-026` | Đề xuất bổ sung chườm đá/phối hợp cắt cơn, chi tiết lối sống và đồng lợi ích SGLT2i |
| **Tổng cộng** | **26** | `R1-GOUT-001` → `R1-GOUT-026` | **Kết luận vòng 1: FAIL** (`3 critical > 0`, `15 major > 0`) |

### Phân bố theo loại hạng mục (`itemType`)
- `rule`: **12** (`R1-GOUT-001`, `002`, `003`, `009`, `015`, `016`, `018`, `019`, `021`, `022`, `025`, `026`)
- `citation`: **5** (`R1-GOUT-004`, `005`, `007`, `008`, `020`)
- `missing`: **5** (`R1-GOUT-010`, `011`, `012`, `017`, `024`)
- `matrix`: **2** (`R1-GOUT-014`, `023`)
- `threshold`: **1** (`R1-GOUT-006`)
- `ui`: **1** (`R1-GOUT-013`)

---

## 2. Đánh giá Độ phủ Guideline & Các Điểm Đã Thực hiện Đúng

Trước khi đi vào các lỗi cần khắc phục, kiểm định R1 ghi nhận các cấu phần cốt lõi mà module `gout` **đã xây dựng đúng chuẩn guideline gốc** (cần giữ vững khi sửa lỗi):
1. **Chỉ định mạnh khởi trị ULT & Tránh điều trị tăng acid uric không triệu chứng**: Khớp chính xác ACR 2020 Table 1 (tophi dưới da, tổn thương khớp trên X-quang, `≥ 2 đợt cấp/năm`; chống chỉ định khởi trị ULT ở tăng acid uric đơn thuần không triệu chứng).
2. **Duy trì ULT đang dùng trong cơn gút cấp**: Khớp ACR 2020 Table 6 & BYT QĐ 361/2014 trang 93 (tuyệt đối không ngừng đột ngột Allopurinol/Febuxostat khi bùng phát cơn cấp).
3. **Khác biệt thời điểm bắt đầu ULT mới trong cơn cấp (`VN` vs `INTL`/`US`)**: Phân tách rất tốt giữa `VN` (`DEFER` chờ cơn viêm cấp ổn định 1–2 tuần theo BYT 361/2014 trang 93) và `INTL`/`US` (cho phép khởi trị ngay trong cơn cấp nếu có điều trị kháng viêm đi kèm theo ACR 2020 Table 2 PICO 8).
4. **Dược hệ gen `HLA-B*58:01` ở người Việt / gốc Đông Nam Á & Liều khởi đầu thấp Allopurinol**: Chặn chống chỉ định tuyệt đối khi `HLA-B*58:01 (+)` chuyển sang Febuxostat; nhắc xét nghiệm sàng lọc trên người Việt/Đông Nam Á; liều khởi trị Allopurinol `≤ 100 mg/ngày` và giảm xuống `≤ 50 mg/ngày` khi `CKD ≥ G3` (`eGFR < 60`) đúng ACR 2020 Table 2 PICO 7 & EULAR 2016 Rec 8.
5. **An toàn Tim mạch của Febuxostat (thử nghiệm CARES) & Chống chỉ định tương tác Azathioprine / 6-MP**: Cảnh báo chuyển đổi Febuxostat ở bệnh nhân có tiền sử bệnh tim mạch xơ vữa (ACR 2020 Table 3 PICO 19) và chặn tuyệt đối phối hợp XOI với Azathioprine / Mercaptopurine.
6. **Xử trí lợi tiểu Quai trong Suy tim & Aspirin liều thấp dự phòng tim mạch**: Giữ nguyên Furosemide khi có suy tim sung huyết và giữ nguyên Aspirin liều thấp bảo vệ tim mạch đúng ACR 2020 Table 8 & EULAR 2016 Rec 11.

### Bảng ma trận các lỗ hổng Guideline & Trích dẫn cần khắc phục

| Chủ đề lâm sàng | Guideline gốc (ACR 2020 / EULAR 2016 / BYT 2014 / KDIGO 2024 / FDA) | Hiện trạng trong Module `gout` | Mã lỗi |
|---|---|---|---|
| **Chuẩn độ trần liều XOI & giới hạn thận** | Allopurinol tối đa FDA 800 mg/ngày; EULAR Rec 9 & FDA Zyloprim giới hạn theo CrCl (200 mg ở CrCl 10–20; 100 mg ở CrCl < 10); thất bại trần liều → đổi XOI / phối hợp / Pegloticase | Không đọc `currentMeds[].dose` và `eGFR`: khuyên tăng +100 mg ngay cả ở 800 mg/ngày hoặc CKD G4–G5; Febuxostat 80 mg vẫn khuyên tăng lên 80 mg | `R1-GOUT-001`, `R1-GOUT-017` |
| **Dự phòng Colchicine ở CKD G4 (`eGFR 15–29`)** | EULAR Rec 2 & p. 33 chống chỉ định Colchicine khi `GFR < 30 mL/min`; tại VN chỉ có viên 1 mg (bẻ đôi 0.5 mg) | Kê `Colchicine 0.3 mg/ngày × 3–6 tháng` trên cả `INTL` và `VN` (không thể bẻ 3/10 viên 1 mg → nguy cơ quá liều gấp 3 lần) | `R1-GOUT-002` |
| **Đổi Thiazide sang Losartan khi tăng K⁺ máu** | Chống chỉ định khởi trị ARB khi tăng kali máu (`K⁺ > 5.0–5.5 mmol/L`) → phải đổi Thiazide sang CCB (`Amlodipine`) | Không đọc `ctx.k`, gán `drugId: 'losartan'` làm hậu kiểm biến thành `TẠM HOÃN Losartan` (thuốc BN không uống!) và mất nhánh CCB | `R1-GOUT-003` |
| **Gian lận trích dẫn QA-7 / QA-10** | Trích dẫn phải đúng chương bệnh, đúng thuốc, không cắt cụt câu lách số | Trích chương **Loãng xương (Alendronat trang 172)** của BYT 2014 cho thai kỳ Gút; dùng nhãn kháng sinh UTI **Orlynvah** cho Probenecid; mượn câu `< 30` của Benzbromarone cho 8 thuốc khác | `R1-GOUT-004`, `R1-GOUT-005`, `R1-GOUT-007` |
| **Liều Colchicine cắt cơn + ức chế CYP3A4 vừa** | FDA Colcrys Table 1 p. 6: `1.2 mg × 1 liều`, lặp lại không sớm hơn `3 ngày` | Đặt sai `0.6 mg × 1 liều` (của nhóm P-gp), lặp lại sau `14 ngày`, cắt cụt quote cột Prophylaxis để lấy số `0.6` | `R1-GOUT-006` |
| **Độ chính xác COR / LOE / Locator** | Bảng 1–8 ACR 2020 & Bảng 1–2 EULAR 2016 | **11 mục** sai LOE (`moderate` thay vì `very_low` hoặc `high`, `A` thay vì `C`/`B`) và lệch số thứ tự Recommendation của EULAR | `R1-GOUT-008`, `R1-GOUT-020` |
| **Đích urat theo hồ sơ & Ngưỡng dưới an toàn** | ACR (`US`): `< 6 mg/dL` (`360 µmol/L`) cho mọi BN; EULAR Rec 6: `< 300 µmol/L` khi có tophi nhưng **không duy trì `< 180 µmol/L` (`3 mg/dL`) kéo dài** | `US` bị ép đích `< 300 µmol/L` khi có tophi (tự mâu thuẫn `profileDiff.US`); thiếu hoàn toàn cảnh báo `< 180 µmol/L` | `R1-GOUT-009`, `R1-GOUT-010` |
| **Cơn gút cấp kháng trị / NPO nội viện** | ACR Table 6 PICO 32 (Class I: Corticoid IM/IV/nội khớp khi NPO) & PICO 33 / EULAR Rec 3 (ức chế IL-1 khi CCĐ cả 3 nhóm) | Luôn kê viên uống kể cả nội viện NPO; thiếu hoàn toàn nhánh Corticoid tiêm và thuốc ức chế IL-1 | `R1-GOUT-011` |
| **Khởi trị Uricosuric trên UI & Ma trận thận** | Khi chống chỉ định cả 2 XOI (dùng Azathioprine) phải chuyển sang nhóm tăng thải urat; Probenecid tránh khởi trị khi `eGFR < 60` | Thiếu input UI → BN dùng Azathioprine bị bỏ rơi **0 thuốc ULT**; `goutMatrix` hiện Probenecid `rec` (xanh) ở CKD G3a (`45–59`); `US` kê Benzbromarone (chưa được FDA duyệt); `VN` bỏ sót CCĐ tophi/người già của BYT trang 94 | `R1-GOUT-013`, `R1-GOUT-014`, `R1-GOUT-015` |
| **Chỉ định ULT sớm (EULAR/KDIGO) & Đồng mắc** | EULAR Rec 5 (Grade A: `< 40 tuổi`, SUA `> 480 µmol/L`, bệnh tim-thận); KDIGO Rec 3.14.1 (`1C`) & 3.14.2 (`2D`); ACR Table 8 (tránh đổi sang Fenofibrate; ưu tiên Losartan trong THA) | Áp cứng tiêu chuẩn cơn đầu của ACR cho cả `INTL`; thiếu Rec 3.14.1/3.14.2; thiếu hẳn Fenofibrate; nhốt Losartan trong nhánh đang uống Thiazide | `R1-GOUT-012`, `R1-GOUT-016` |

---

## 3. Chi tiết Phát hiện Kiểm định (`Findings`)

### 3.1. Nhóm Mức độ Nghiêm trọng Cao nhất — `CRITICAL` (3 phát hiện)

#### [R1-GOUT-001] `critical` | `rule` | `gout.allopurinol.uptitrate` (& `gout.febuxostat.manage`)
- **Phát hiện**: Quy tắc chuẩn độ tăng liều Allopurinol (`src/modules/gout/rules.ts` L1555–1661) và Febuxostat (L1907–1931) hoàn toàn **KHÔNG kiểm tra liều hiện tại của bệnh nhân (`currentMeds[].dose`)**, và `gout.allopurinol.uptitrate` cũng **KHÔNG kiểm tra chức năng thận (`eGFR` / `CrCl`)**. Hệ quả nguy hiểm trên lâm sàng:
  1. **Tăng liều vượt kịch trần FDA / dẫm chân tại chỗ**: Bệnh nhân đang uống liều tối đa `Allopurinol 800 mg/ngày` hoặc `Febuxostat 80 mg/ngày` mà acid uric chưa đạt đích vẫn nhận lệnh `UPTITRATE` (*"Tăng thêm 100 mg mỗi 2–5 tuần"* vượt trần lên 900 mg/ngày, hoặc *"Tăng liều Febuxostat lên 80 mg/ngày"* khi đã ở 80 mg/ngày!), bỏ sót hoàn toàn phác đồ chuyển đổi XOI / phối hợp uricosuric / xét Pegloticase (ACR 2020 Table 5 PICO 24 & 27; EULAR 2016 Rec 8 & 10).
  2. **Không giới hạn liều thận ở CKD nặng (G4–G5)**: Bệnh nhân suy thận nặng (`CrCl 10–20` hoặc `< 10 mL/phút`, `eGFR < 30` hoặc `< 15`) đang uống `Allopurinol 200 mg/ngày` vẫn bị phát lệnh tăng thêm `100 mg` lên tối đa `800 mg/ngày` trên cả `INTL` và `VN` mà không có bất kỳ cảnh báo hay trần liều thận nào — vi phạm trực tiếp **EULAR 2016 Rec 9** (giới hạn liều tối đa allopurinol theo CrCl; nếu không đạt đích phải chuyển sang febuxostat), vi phạm nhãn **FDA Zyloprim** (`CrCl 10–20 mL/min`: 200 mg/ngày; `CrCl < 10 mL/min`: tối đa 100 mg/ngày — đáng chú ý là 4 threshold `gout.allopurinol.crcl_10`, `crcl_20`, `dose_crcl_10_20`, `dose_crcl_under_10` đã được khai báo trong `kb/thresholds/gout.json` L168–206 nhưng bị bỏ quên không gọi trong `rules.ts`!), và tự mâu thuẫn với chính `kb/drugs/allopurinol.json` (`renal` G4 tối đa 200 mg/ngày, G5 tối đa 100 mg/ngày). Ngay cả trên `US` (ACR 2020 cho phép chỉnh vượt > 300 mg/ngày ở CKD), việc tăng bước nhảy 100 mg không cảnh báo ở CKD nặng làm tăng nguy cơ tích lũy oxypurinol và hội chứng quá mẫn AHS/SCAR tử vong cao.
- **Bằng chứng kiểm chứng**:
  - Chạy `evaluate()` thực tế:
    - BN nam 55t (`profile='US'`), `uricAcid: 450`, `currentMeds: [{drugId:'allopurinol', dose:'800', unit:'mg'}]` → Output: `[UPTITRATE] rec_gout_allopurinol_uptitrate | dose=Tăng thêm 100 mg mỗi 2–5 tuần (tối đa 800 mg/ngày)`.
    - BN nam 70t CKD G4 (`scr: 300 µmol/L`, `eGFR ~18`), `Allopurinol 200 mg/ngày`, `uricAcid: 450` (`profile='INTL'`) → Output: `[UPTITRATE] rec_gout_allopurinol_uptitrate | dose=Tăng thêm 100 mg mỗi 2–5 tuần (tối đa 800 mg/ngày)`.
    - BN nam 52t `Febuxostat 80 mg/ngày`, `uricAcid: 430` → Output: `[UPTITRATE] rec_gout_febuxostat_uptitrate | dose=80 mg x 1 lần/ngày`.
  - Nguyên văn **EULAR 2016 Rec 9** (`pdfPage 3 / p. 31`): *"In patients with renal impairment, the allopurinol maximum dosage should be adjusted to creatinine clearance. If the SUA target cannot be achieved at this dose, the patient should be switched to febuxostat or given benzbromarone with or without allopurinol, except in patients with estimated glomerular filtration rate <30 mL/min."*
  - Nguyên văn **FDA Zyloprim Label** (`pdfPage 9`): *"With a creatinine clearance of 10 to 20 mL/min, a daily dosage of 200 mg of ZYLOPRIM is suitable. When the creatinine clearance is less than 10 mL/min, the daily dosage should not exceed 100 mg."*
  - Nguyên văn **ACR 2020 Table 5 PICO 24** (`pdfPage 31`): *"For patients with gout taking their first XOI monotherapy at maximum-tolerated or FDA-indicated dose who are not at SU target... we conditionally recommend switching the first XOI to an alternate XOI agent over adding a uricosuric agent."*
- **Đề xuất sửa chữa**: Đọc liều hiện tại của Allopurinol và Febuxostat từ `findMed(ctx, ...)`: (1) Khi Allopurinol đã đạt trần (`≥ 800 mg/ngày` trên `US`, hoặc chạm trần CrCl `200 mg/ngày` ở CrCl 10–20 / `100 mg/ngày` ở CrCl < 10 trên `INTL`/`VN` kèm `profileDiff` nêu rõ ACR 2020 cho phép chỉnh thận trọng từng bước nhỏ `≤ 50 mg`), chuyển sang khuyến cáo `SWITCH` sang `febuxostat` (nếu không vướng CVD/azathioprine) hoặc phối hợp uricosuric (khi `eGFR ≥ 30`) / xét `pegloticase`; (2) Khi `eGFR < 60` trên nhánh tăng liều Allopurinol, giảm bước chuẩn độ xuống `≤ 50 mg` mỗi 2–5 tuần kèm cảnh báo theo dõi sát ban da SCAR và chức năng thận; (3) Khi Febuxostat đã ở `≥ 80 mg/ngày` (hoặc `120 mg/ngày` theo nhãn EU/EULAR trên `INTL`/`VN`), không phát `UPTITRATE` lên 80 mg mà chuyển sang đánh giá tuân thủ / đổi hoặc phối hợp thuốc.

---

#### [R1-GOUT-002] `critical` | `rule` | `gout.prophylaxis.flare`
- **Phát hiện**: Ở bệnh nhân suy thận nặng giai đoạn G4 (`eGFR 15–29 mL/phút/1.73m²`), quy tắc `gout.prophylaxis.flare` (`src/modules/gout/rules.ts` L2364–2405) kê đơn `START colchicine` liều **`0.3 mg x 1 lần/ngày`** kéo dài 3–6 tháng trên **cả 3 hồ sơ `INTL`, `VN` và `US`**. Điều này gây nguy cơ mất an toàn nghiêm trọng trên `INTL` và `VN`:
  1. **Vi phạm chống chỉ định EULAR 2016 trên `INTL`**: **EULAR 2016 Recommendation 2 & phần bàn luận (`pdfPage 3 & 5` / trang in 31 & 33)** khẳng định **chống chỉ định / tránh dùng Colchicine ở bệnh nhân suy thận nặng (`GFR < 30 mL/min`)** do nguy cơ tích lũy gây độc cơ - thần kinh ngoại biên (tiêu cơ vân) và suy tủy xương khi uống kéo dài nhiều tháng.
  2. **Không thể chia liều trên thực tế Việt Nam (`profile: 'VN'`)**: Tại Việt Nam, Colchicine lưu hành phổ biến ở hàm lượng **viên nén 1 mg có vạch bẻ đôi (`0.5 mg`)** (không có viên `0.6 mg` của Mỹ để bẻ đôi thành `0.3 mg`). Việc xuất y lệnh **`0.3 mg x 1 lần/ngày`** (tương đương 3/10 viên 1 mg!) không thể thực hiện chính xác trên lâm sàng Việt Nam và rất dễ khiến người bệnh cao tuổi uống nguyên viên `1 mg/ngày` trên nền `eGFR 15–29`, dẫn đến ngộ độc Colchicine nguy kịch.
- **Bằng chứng kiểm chứng**:
  - Chạy `evaluate()` thực tế: BN nam 70t (`profile='VN'`), `scr: 260 µmol/L` (`eGFR ~21`), `uricAcid: 540`, `goutFlaresYear: 3`, `hlab5801: 'negative'` → Output: `[START] rec_gout_colchicine_prophylaxis | drug=colchicine | dose=0.3 mg x 1 lần/ngày (giảm liều do suy thận nặng)`.
  - Nguyên văn **EULAR 2016 Rec 2** (`pdfPage 3 / p. 31`): *"Colchicine and NSAIDs should be avoided in patients with severe renal impairment."* & `pdfPage 5 / p. 33`: *"colchicine is contraindicated in patients with severe renal impairment (GFR <30 mL/min)"*.
  - Nguyên văn **BYT QĐ 361/2014** (`pdfPage 93`): *"Dự phòng tái phát: 0,5- 1,2 mg uống 1-2 lần/ngày, trung bình 1mg/ngày kéo dài ít nhất 6 tháng. Cần chú ý giảm liều ở bệnh nhân có bệnh thận mạn tính, lớn tuổi (trên 70 tuổi)…"*.
- **Đề xuất sửa chữa**: Phân tách theo hồ sơ và dạng bào chế: (1) Trên `INTL` (theo EULAR 2016) và `VN` (viên 1 mg, tránh chia 0.3 mg bất khả thi), khi `eGFR < 30 mL/phút/1.73m²`, ưu tiên chuyển dự phòng sang **Prednisolone liều thấp** (hoặc trên `VN` nếu chống chỉ định corticoid ở `eGFR 20–29` không dùng statin/CYP3A4i thì chỉ dùng `0.5 mg cách ngày` kèm cảnh báo độc tính cơ - tủy xương, tuyệt đối không xuất con số `0.3 mg` trên `VN`); (2) Chỉ giữ lựa chọn `0.3 mg/ngày` (nửa viên 0.6 mg theo nhãn FDA Colcrys trang 15) cho `profile: 'US'` kèm `profileDiff` đối chiếu với EULAR 2016.

---

#### [R1-GOUT-003] `critical` | `rule` | `gout.concurrent.switch_thiazide`
- **Phát hiện**: Quy tắc `gout.concurrent.switch_thiazide` (`src/modules/gout/rules.ts` L2497–2555) mắc đồng thời **2 lỗi an toàn và kỹ thuật nghiêm trọng**:
  1. Chỉ kiểm tra cờ boolean `conditions?.hyperkalemia` mà **KHÔNG kiểm tra nồng độ kali máu thực tế `need(ctx, 'k')`**.
  2. Ở nhánh đổi sang Losartan (L2539), rule gán `drugId: 'losartan'` cho hành động `SWITCH` (trong khi nhánh CCB ở L2515 gán `drugId: medId` tức `'hydrochlorothiazide'`).
  - **Hậu quả thực nghiệm trên `evaluate()`**: Khi bệnh nhân đang uống `Hydrochlorothiazide 25 mg` có xét nghiệm tăng kali máu thực tế (`k = 5.9 mmol/L` nhưng không bật tay cờ boolean `hyperkalemia`), rule vẫn nhảy vào nhánh Losartan rồi bị bộ hậu kiểm an toàn toàn cục chặn `losartan` do `K⁺ > 5.5` và biến kết quả thành **`[HOLD] TẠM HOÃN Losartan (K⁺ = 5.9 > 5.5 mmol/L)` dù bệnh nhân hoàn toàn KHÔNG đang uống Losartan**, đồng thời làm biến mất luôn khuyến cáo đúng là đổi Hydrochlorothiazide sang Chẹn kênh Canxi (`Amlodipine`)! Ngoài ra, ở vùng `K⁺ = 5.0–5.5 mmol/L` trên nền CKD đang uống lợi tiểu thải kali (Thiazide), việc đổi sang thuốc giữ kali (Losartan) không kiểm tra kali máu sẽ gây tăng kali máu cấp nguy hiểm.
- **Bằng chứng kiểm chứng**:
  - Chạy `evaluate()` thực tế (Case 10): Input `profile='INTL'`, `age: 60, scr: 130, k: 5.9, uricAcid: 490`, `conditions: {gout: true, htn: true}`, `currentMeds: [{drugId: 'hydrochlorothiazide', dose: '25', unit: 'mg'}]` → Output: `[HOLD] rec_gout_switch_thiazide_losartan | drug=losartan | title=TẠM HOÃN Losartan (Chẹn thụ thể Angiotensin II) (K⁺ = 5.9 > 5.5 mmol/L)` (mất hoàn toàn khuyến cáo đổi HCTZ sang CCB!).
- **Đề xuất sửa chữa**: (1) Trong `gout.concurrent.switch_thiazide`, đọc `const k = need(ctx, 'k');` và đưa `k !== undefined && k >= 5.0` vào điều kiện tránh khởi trị RAA (`hasAngioedemaOrRasContra`) để tự động chuyển sang nhánh an toàn `rec_gout_switch_thiazide_ccb` (đổi Thiazide sang Amlodipine/CCB); nếu thiếu xét nghiệm `k` ở bệnh nhân CKD thì gắn cảnh báo kiểm tra K⁺ và Creatinin trước & sau 1–2 tuần chuyển đổi. (2) Thống nhất ngữ nghĩa `drugId` của hành động `SWITCH` để hậu kiểm không phát lệnh `HOLD` lên một thuốc người bệnh chưa từng dùng.

---

### 3.2. Nhóm Sai lệch Guideline, Liều lượng & Gian lận Trích dẫn — `MAJOR` (15 phát hiện)

#### [R1-GOUT-004] `major` | `citation` | `byt.gout.2014.pregnancy_contra`
- **Phát hiện (Gian lận trích dẫn QA-7 / QA-10 nghiêm trọng — Lấy chương Loãng xương gắn cho bệnh Gút)**: Trích dẫn `byt.gout.2014.pregnancy_contra` (`kb/citations/gout.json` L696–703) trỏ tới `BYT_361_2014_Co_Xuong_Khop.pdf` **trang 172** và cố tình cắt cụt câu ngay cụm từ *"suy thận với mức lọc cầu thận"* để che giấu phần đuôi *"(GFR)<35 ml/phút. Alendronat 70mg..."*. Mở PDF gốc xác nhận trang 172 thuộc chương **BỆNH LOÃNG XƯƠNG**, mục `4.2. Các thuốc điều trị loãng xương -> + Nhóm Bisphosphonat` — hoàn toàn KHÔNG thuộc chương **BỆNH GÚT** (`pdfPage 89–94`, nơi có **0 lần** xuất hiện từ *"có thai"*, *"mang thai"*, *"cho con bú"*). Nghiêm trọng hơn, trích dẫn sai chương này đang được dùng làm bằng chứng cho 3 rule thai kỳ (`gout.safety.pregnancy_nsaid`, `gout.safety.pregnancy_ult`, `gout.safety.pregnancy_colchicine` — L582 còn viết hẳn *"chống chỉ định/tránh dùng cho bệnh gút trong thai kỳ (BYT 361/2014)"*, còn L453 nêu cơ chế FDA đóng sớm ống động mạch tuần 20–30 nhưng không hề có bất kỳ citation nhãn FDA NSAID nào!) và 7 tệp thuốc (`benzbromarone.json` + toàn bộ 6 tệp NSAID).
- **Bằng chứng kiểm chứng**: Nguyên văn `BYT_361_2014_Co_Xuong_Khop.pdf` `pdfPage 172`: *"4.2. Các thuốc điều trị loãng xương ... + Nhóm Bisphosphonat: Hiện là nhóm thuốc được lựa chọn đầu tiên trong điều trị các bệnh lý loãng xương... Chống chỉ định: phụ nữ có thai và cho con bú, dưới 18 tuổi (cần xem xét từng trường hợp cụ thể), suy thận với mức lọc cầu thận (GFR)<35 ml/phút. Alendronat 70mg..."*.
- **Đề xuất sửa chữa**: Xóa bỏ hoàn toàn `byt.gout.2014.pregnancy_contra`. Bổ sung nhãn FDA chính thức của NSAID (cảnh báo thiểu ối từ tuần 20 và đóng sớm ống động mạch từ tuần 30 thai kỳ) và SmPC/tài liệu dược thư chính thức cho Benzbromarone/Etoricoxib; gỡ bỏ khẳng định gán khống cho BYT 361/2014 trong các rule thai kỳ.

---

#### [R1-GOUT-005] `major` | `citation` | `fda.probenecid.stones_contra` (& `pregnancy`, `lactation`)
- **Phát hiện (Nhầm nhãn nguồn FDA — Lấy thuốc kháng sinh tiết niệu `ORLYNVAH` làm Probenecid trị Gút)**: Toàn bộ 3 trích dẫn `fda.probenecid.*` (`kb/citations/gout.json` L607–632) trích từ `FDA_label_probenecid.pdf`. Kiểm tra nguyên văn PDF xác nhận đây là nhãn thuốc **ORLYNVAH (`sulopenem etzadroxil 500 mg and probenecid 500 mg`)** (FDA duyệt năm 2024) chỉ định uống 5 ngày cho **nhiễm khuẩn đường tiết niệu không biến chứng (uUTI) ở phụ nữ**, trong đó Mục 5.4 (trang 1) thậm chí cảnh báo thuốc gây **"Exacerbation of Gout" (làm khởi phát/nặng thêm bệnh gút)** và Mục 2.2 (trang 3) cho phép dùng tới `CrCL ≥ 15 mL/min` (ngược hẳn dược lý thải urat trong gút)!
- **Bằng chứng kiểm chứng**: Nguyên văn `FDA_label_probenecid.pdf` `pdfPage 1`: *"ORLYNVAH (sulopenem etzadroxil and probenecid) tablets, for oral use ... indicated for the treatment of uncomplicated urinary tract infections (uUTI)... Exacerbation of Gout: When prescribing ORLYNVAH to patients with a known history of gout, ensure appropriate therapy of gout is instituted. (5.4)"*.
- **Đề xuất sửa chữa**: Thay thế tệp PDF nguồn bằng nhãn FDA chính thức của viên nén **Probenecid USP 500 mg đơn chất** (chỉ định tăng acid uric máu mạn tính do gút) hoặc sử dụng trích dẫn trực tiếp từ BYT 361/2014 trang 94 + ACR 2020 / EULAR 2016.

---

#### [R1-GOUT-006] `major` | `threshold` | `gout.colchicine.moderate_cyp3a4_flare_dose`
- **Phát hiện (Sai liều cắt cơn Colchicine theo nhãn FDA khi dùng kèm thuốc ức chế vừa CYP3A4 + cắt xén Bảng 1)**: Ngưỡng `gout.colchicine.moderate_cyp3a4_flare_dose` (`kb/thresholds/gout.json` L586–594), quy tắc `gout.acute_flare.treatment` (`rules.ts` L1026–1053) và golden test `gout_10` kê liều cắt cơn cho người dùng Verapamil/Diltiazem (thận - gan bình thường) là **`0.6 mg uống liều duy nhất... không lặp lại trong vòng 14 ngày`**. Đối chiếu nguyên văn **Bảng 1 trang 6 `FDA_label_colchicine.pdf`**: đối với **Moderate CYP3A4 Inhibitors** (`Diltiazem`, `Verapamil`, `Erythromycin`, `Fluconazole`...), liều hiệu chỉnh cho **Treatment of Gout Flares** là **`1.2 mg (2 tablets) × 1 dose. Dose to be repeated no earlier than 3 days.`** (còn `0.6 mg × 1 dose` là của **P-gp Inhibitors** như `Cyclosporine`/`Ranolazine`, và `14 ngày` là khoảng cách ở suy thận/gan nặng hoặc lọc máu trang 15!). Để hợp thức hóa con số `0.6`, trích dẫn `fda.colchicine.moderate_cyp3a4` (`kb/citations/gout.json` L603) đã cắt cụt ở cột **Prophylaxis** ngay trước cột **Treatment of Gout Flares**! Hơn nữa trên hồ sơ `VN` (viên 1 mg), liều `0.6 mg` không thể bẻ viên thực hiện.
- **Bằng chứng kiểm chứng**: Nguyên văn `FDA_label_colchicine.pdf` `pdfPage 6`, Table 1 — hàng `Moderate CYP3A4 Inhibitors`, cột `Treatment of Gout Flares`: Adjusted Dose = **`1.2 mg (2 tablets) x 1 dose. Dose to be repeated no earlier than 3 days.`**; so với `kb/citations/gout.json` L603 dừng ở `"0.3 mg once a day"`.
- **Đề xuất sửa chữa**: Mở rộng `fda.colchicine.moderate_cyp3a4` lấy đủ cả cột Treatment of Gout Flares; sửa `gout.colchicine.moderate_cyp3a4_flare_dose` thành `1.2 mg` trên `US`/`INTL` (hoặc `1.0 mg × 1 liều` trên `VN` theo viên 1 mg) và thời gian không lặp lại sớm hơn `3 ngày`; cập nhật lại golden test `gout_10`.

---

#### [R1-GOUT-007] `major` | `citation` | `eular.gout.2016.benzbromarone_egfr30` (& mượn số chéo QA-7/QA-10)
- **Phát hiện**: Vi phạm diện rộng quy tắc QA-7/QA-10 (mượn câu có chứa con số `30`, `60`, `15` của thuốc khác hoặc bảng phân độ chung để gắn cho thuốc không liên quan):
  1. `eular.gout.2016.benzbromarone_egfr30` (câu trong EULAR Rec 9 chỉ nói riêng về **benzbromarone** chống chỉ định khi `eGFR < 30 mL/min`) bị đem gắn cho **9 mục của thuốc khác**: `gout.febuxostat.severe_renal_crcl` (`30`), `gout.febuxostat.severe_renal_egfr` (`30` — nghịch lý vì chính câu đó khuyên chuyển *sang* febuxostat ở suy thận, còn ngưỡng 30 của febuxostat thực chất nằm ở nhãn FDA Uloric trang 10!), `gout.probenecid.crcl_contra_min`, `gout.probenecid.egfr_contra_min`, `gout.nsaid.egfr_contra_min`, `probenecid.json` (còn gắn nhầm cả `byt.gout.2014.nsaid_agents` cho probenecid!) và toàn bộ **6 tệp thuốc NSAID**.
  2. Bảng phân độ GFR chung `kdigo.ckd.2024.table_2_gfr_categories` (không nhắc tới bất kỳ thuốc gút nào) bị dùng làm citation **duy nhất** cho 4 ngưỡng dùng thuốc: `gout.colchicine.egfr_dialysis_min` (`15`), `gout.allopurinol.egfr_ckd_threshold` (`60`), `gout.nsaid.egfr_caution_min` (`60`), và `gout.probenecid.egfr_prefer_xoi_min` (`60`).
  3. Trong `benzbromarone.json` (L104–116) và `rules.ts` (L2179), chống chỉ định sỏi thận lại dẫn `acr.gout.2020.indication_conditional_first_flare` (chỉ vì có từ `urolithiasis`), còn chống chỉ định bệnh gan tiến triển lại dẫn `eular.gout.2016.benzbromarone_probenecid_dosing` (câu trích không có một chữ nào về gan!).
- **Bằng chứng kiểm chứng**: `kb/thresholds/gout.json` L137–145, L249–287, L383–391, L484–503, L606–634; `kb/drugs/probenecid.json` L62–79, L121–123; `kb/drugs/benzbromarone.json` L104–116; `FDA_label_febuxostat.pdf` `pdfPage 10` Section 8.6 (*"Clcr 30 to 89 mL/min... Clcr 15 to 29 mL/min"*).
- **Đề xuất sửa chữa**: Thay thế toàn bộ bằng trích dẫn đúng thuốc: nhãn FDA Uloric Section 8.6 trang 10 cho Febuxostat; KDIGO 2024 Section 4 cho tránh NSAID ở `eGFR < 30` / thận trọng `< 60`; ghép cặp ACR 2020 (`allopurinol_start_dose_ckd_50`, `xoi_over_probenecid`) cùng định nghĩa CKD G3 KDIGO cho mốc `60`; trích EULAR trang 5 (`p. 33`) & KDIGO trang 117 (`S232`) cho Colchicine; trích BYT 2014 trang 94 và đoạn bàn luận độc gan của Benzbromarone trong EULAR 2016.

---

#### [R1-GOUT-008] `major` | `citation` | `kb/citations/gout.json` (11 mục sai COR / LOE / Locator)
- **Phát hiện**: Đối chiếu từng dòng với Bảng 1–8 của `ACR_2020_Gout_Guideline.pdf` (`pdfPage 27–34`) và Bảng 1–2 của `EULAR_2016_Gout_Recommendations.pdf` (`pdfPage 3–4`, trang in 31–32) phát hiện **11 trích dẫn ghi sai mức bằng chứng (`loe`), cấp khuyến cáo (`cor`) hoặc lệch số thứ tự Recommendation**:
  1. `acr.gout.2020.indication_conditional_first_flare` (L33): ghi `loe: "moderate"` → ACR Table 1 PICO 5 (`pdfPage 27`) là **`very_low`**.
  2. `acr.gout.2020.indication_against_asymptomatic` (L55): ghi `loe: "moderate"` → ACR Table 1 PICO 57 (`pdfPage 27`) là **`high`**.
  3. `acr.gout.2020.target_urate_under_6` (L77): ghi `loe: "moderate"` → ACR Table 3 PICO 14 (`pdfPage 29`) là **`high`**.
  4. `acr.gout.2020.titration_weeks` (L683–684): gắn `cor: "strong", loe: "moderate"`, nhưng câu trích trang 17 thực chất là câu văn nhắc lại hướng dẫn **ACR 2012** (*"The 2012 ACR Guidelines... recommended titration every 2–5 weeks"*), không phải tuyên bố khuyến cáo của ACR 2020.
  5. `acr.gout.2020.allopurinol_start_dose_ckd_50` (L120–121): gắn `cor: "strong", loe: "moderate"` cho câu gợi ý chuyên gia trong phần bàn luận trang 8 (*"e.g., ≤50 mg/day should be considered"*).
  6. `eular.gout.2016.target_urate_tophi` (L84–88): ghi `Recommendation 7`, `loe: "A"` → Thực tế là **Recommendation 6** (trang in 31), EULAR Table 2 xếp Category `3`, Grade **`C`** (không phải A!).
  7. `eular.gout.2016.flare_prophylaxis` (L326–330): ghi `Recommendation 5`, `loe: "A"` → Thực tế là **Recommendation 4** (trang in 31), Table 2 xếp Category `2b`, Grade **`B`**.
  8. `eular.gout.2016.colchicine_nsaid_contra` (L638–642): ghi `Recommendation 3`, `loe: "B"` → Thực tế là **Recommendation 2** (trang in 31), Table 2 xếp Category `1b, 3`, Grade **`A, C`**.
  9. `eular.gout.2016.benzbromarone_egfr30` (L351–352): ghi `loe: "B"` → EULAR Table 2 Item 9 xếp Category `3`, Grade **`C`**.
  10–11. `eular.gout.2016.naproxen_flare` (L661–662) và `eular.gout.2016.naproxen_prophylaxis` (L672–673): gắn `cor: "strong", loe: "A"` cho câu văn mô tả 1 thử nghiệm đơn lẻ ở trang 5–6.
- **Bằng chứng kiểm chứng**: `ACR_2020_Gout_Guideline.pdf` `pdfPage 27, 29`; `EULAR_2016_Gout_Recommendations.pdf` `pdfPage 3–4` (trang in 31–32, Table 1 & Table 2).
- **Đề xuất sửa chữa**: Chuẩn hóa lại toàn bộ `cor`, `loe`, `locator` trong `kb/citations/gout.json` khớp 100% với Bảng tổng hợp của ACR 2020 và EULAR 2016; lược bỏ `cor`/`loe` ở các câu trích từ phần bàn luận văn xuôi.

---

#### [R1-GOUT-009] `major` | `rule` | `gout.target.urate`
- **Phát hiện (Mâu thuẫn nội tại và sai guideline trên hồ sơ `US` khi có hạt tophi)**: ACR 2020 (`pdfPage 9 & 29`, Table 3 PICO 14) chỉ khuyến cáo một mục tiêu duy nhất **`< 6 mg/dL` (`< 360 µmol/L`)** cho mọi bệnh nhân dùng ULT. Chính `profileDiff.US` của `gout.target.urate` (`rules.ts` L1417) cũng ghi rõ: *"ACR 2020: Đích < 6 mg/dL (< 360 µmol/L) cho mọi bệnh nhân dùng ULT."* Thế nhưng hàm `getTargetUrateUmol(ctx)` (`rules.ts` L249–258) chỉ tách riêng `VN` (`320 µmol/L`) còn gộp chung `US` vào nhánh EULAR (`300 µmol/L`)! Hệ quả: trên `profile: 'US'`, bệnh nhân có tophi đang uống Allopurinol 300 mg có `uricAcid = 330 µmol/L` (`5.5 mg/dL` — đã đạt đích ACR!) bị báo `CHƯA ĐẠT ĐÍCH (< 300 µmol/L)`, đồng thời phát lệnh `UPTITRATE Allopurinol` và `START Colchicine` dự phòng 3–6 tháng, tự mâu thuẫn trực tiếp với dòng `profileDiff.US` ngay bên dưới.
- **Bằng chứng kiểm chứng**: Chạy `evaluate()` Case 1 (`profile='US'`, `uricAcid: 330, tophi: true, allopurinol 300mg`) → phát đồng thời `rec_gout_allopurinol_uptitrate`, `rec_gout_colchicine_prophylaxis` và `rec_gout_urate_target (< 300 µmol/L)` kèm `profileDiff.US: "< 360 µmol/L"`.
- **Đề xuất sửa chữa**: Trong `getTargetUrateUmol(ctx)`, khi `ctx.settings.profile === 'US'` trả về `360 µmol/L` (có thể ghi chú trong `rationale` rằng bác sĩ lâm sàng có thể cân nhắc hạ thấp hơn trên ca tophi rất nặng theo ý kiến chuyên gia trang 751 ACR 2020, nhưng không ép `UPTITRATE` tự động khi urat đã `< 360 µmol/L`), giữ `< 300 µmol/L` cho `INTL` và `< 320 µmol/L` cho `VN`.

---

#### [R1-GOUT-010] `major` | `missing` | `eular.2016.rec6.avoid_sua_under_3mgdl`
- **Phát hiện**: Bỏ sót hoàn toàn cảnh báo an toàn dài hạn của **EULAR 2016 Recommendation 6** (`pdfPage 3 & 7` / trang in 31 & 35): **KHÔNG khuyến cáo duy trì acid uric máu `< 3 mg/dL` (`< 180 µmol/L`) kéo dài nhiều năm** (*"SUA level <3 mg/dL is not recommended in the long term"*, do lo ngại mất tác dụng chống oxy hóa bảo vệ thần kinh liên quan bệnh thoái hóa thần kinh, đồng thời khuyến cáo sau khi tan hết tophi có thể giảm liều ULT để duy trì `< 6 mg/dL`). Hiện tại bệnh nhân đang dùng Allopurinol 600 mg/ngày có `uricAcid = 150 µmol/L` (`2.5 mg/dL`) trên `INTL`/`VN` vẫn nhận lệnh `CONTINUE` giữ nguyên liều cao mà không có bất kỳ cảnh báo nào.
- **Bằng chứng kiểm chứng**: Nguyên văn `EULAR_2016_Gout_Recommendations.pdf` `pdfPage 3 / p. 31` (Table 1 Rec 6) & `pdfPage 7 / p. 35`; chạy `evaluate()` Case 2 (`profile='INTL'`, `uricAcid: 150`, `allopurinol 600mg`) → chỉ xuất `[CONTINUE]` không cảnh báo.
- **Đề xuất sửa chữa**: Bổ sung citation `eular.gout.2016.avoid_sua_under_3` và ngưỡng `180 µmol/L` (`3 mg/dL`); khi bệnh nhân đang dùng ULT có `uricAcid < 180 µmol/L`, hiển thị khuyến cáo `CONSIDER` / cảnh báo cân nhắc giảm nhẹ liều duy trì (nếu hạt tophi đã tan ổn định) để tránh giữ urat `< 180 µmol/L` kéo dài.

---

#### [R1-GOUT-011] `major` | `missing` | `acr.2020.flare.il1_inhibitor_and_npo_parenteral_steroid`
- **Phát hiện**: Bỏ sót 2 khuyến cáo quan trọng xử trí cơn gút cấp trong **ACR 2020 Table 6 (`pdfPage 32`) & EULAR 2016 Rec 3 (`pdfPage 3`)**:
  1. **Glucocorticoid đường tiêm (IM / IV / tiêm nội khớp) cho bệnh nhân nhịn ăn uống (`NPO`) nội viện — ACR 2020 PICO 32 (Strong recommendation — Class I, High LOE)**: Hiện tại `gout.acute_flare.treatment` luôn kê viên uống (`Colchicine uống`, `Naproxen uống`, `Prednisolone uống`) ngay cả khi `setting === 'inpatient'` bệnh nhân hậu phẫu/hồi sức không uống được.
  2. **Thuốc ức chế IL-1 (`Anakinra` / `Canakinumab`) khi chống chỉ định, không dung nạp hoặc thất bại với cả 3 nhóm kháng viêm đầu tay — ACR 2020 PICO 33 (Conditional, Moderate LOE) & EULAR 2016 Rec 3 (Grade A/C, chống chỉ định khi đang nhiễm trùng tiến triển)**: Hiện tại module không có biến đầu vào chống chỉ định/thất bại corticoid (như ĐTĐ mất bù cấp, nhiễm trùng toàn thân) và không có nhánh IL-1i.
- **Bằng chứng kiểm chứng**: Nguyên văn `ACR_2020_Gout_Guideline.pdf` `pdfPage 32` (Table 6 PICO 32 & PICO 33) và `EULAR_2016_Gout_Recommendations.pdf` `pdfPage 3 / p. 31` (Rec 3).
- **Đề xuất sửa chữa**: Bổ sung tùy chọn `unableToTakeOral` (`NPO`) và `steroidContraindicatedOrRefractory` (kèm kiểm tra `activeInfection`) vào `inputs.ts`, nhánh Corticoid đường tiêm (IM/IV/nội khớp) cho bệnh nhân NPO và nhánh `CONSIDER` ức chế IL-1 (kèm `profileDiff.VN` lưu ý khả năng sẵn có thuốc sinh học tại Việt Nam) vào `rules.ts` và `pathway.ts` Step 2.

---

#### [R1-GOUT-012] `major` | `missing` | `acr.2020.concurrent.fenofibrate_and_losartan_htn`
- **Phát hiện**:
  1. **Thiếu hoàn toàn khuyến cáo về Fenofibrate**: **ACR 2020 Table 8 PICO 47 (`pdfPage 16 & 34`)** khuyến cáo có điều kiện **KHÔNG thêm hoặc đổi thuốc hạ lipid máu sang Fenofibrate** chỉ để hạ urat (*"We conditionally recommend against adding or switching to fenofibrate"*), trong khi **EULAR 2016 Rec 11 (`pdfPage 3 / p. 31`)** lại gợi ý cân nhắc statin hoặc fenofibrate khi có rối loạn lipid máu. Module hiện có 0 citation, 0 rule và 0 `profileDiff` về Fenofibrate.
  2. **Thu hẹp sai phạm vi ưu tiên Losartan trong Tăng huyết áp**: `acr.gout.2020.prefer_losartan` bị nhốt bên trong `gout.concurrent.switch_thiazide` (`when: explicitThiazideMed || explicitThiazideFlag`), khiến bệnh nhân gút + THA chưa dùng thuốc hoặc đang dùng ức chế men chuyển (`perindopril`, `enalapril` — ACR trang 16 nêu rõ có thể cân nhắc đổi từ ACEi sang Losartan) hoàn toàn không nhận được gợi ý ưu tiên Losartan.
- **Bằng chứng kiểm chứng**: Nguyên văn `ACR_2020_Gout_Guideline.pdf` `pdfPage 16 & 34` (Table 8 PICO 47); `EULAR_2016_Gout_Recommendations.pdf` `pdfPage 3` (Rec 11); chạy `evaluate()` Case 11 (`gout + htn`, đang uống `perindopril 5mg` + `fenofibrate 145mg`) → 0 khuyến cáo về Losartan hay Fenofibrate.
- **Đề xuất sửa chữa**: Bổ sung citation và rule quản lý rối loạn lipid máu đồng mắc (tránh đổi sang Fenofibrate đơn thuần vì gút trên `US` vs `profileDiff` EULAR Rec 11 khi tăng triglycerid máu), đồng thời tách rule độc lập `gout.concurrent.prefer_losartan_htn` cho bệnh nhân gút kèm THA không dùng Thiazide (khi không suy tim HFrEF / không tăng kali máu / không chống chỉ định ARB).

---

#### [R1-GOUT-013] `major` | `ui` | `src/modules/gout/inputs.ts` (& `selectUltInitDrug`)
- **Phát hiện (Đường cụt điều trị trên giao diện UI)**: Trong `rules.ts`, việc khởi trị mới `probenecid` hoặc `benzbromarone` yêu cầu `customInputs.preferProbenecid` hoặc `customInputs.preferBenzbromarone`, nhưng **`src/modules/gout/inputs.ts` hoàn toàn KHÔNG khai báo hai trường này** (cũng không có cờ không dung nạp Febuxostat). Tệ hơn, khi bệnh nhân đang dùng `Azathioprine / 6-MP` (chống chỉ định cả Allopurinol và Febuxostat), `selectUltInitDrug(ctx)` (`rules.ts` L355–373) trả về `null` thay vì chuyển sang nhóm tăng thải acid uric! Hệ quả: bệnh nhân ghép tạng/bệnh tự miễn đang uống Azathioprine bị gút tophi nặng, chức năng thận bình thường (`eGFR ~95`, không sỏi thận) bị bỏ rơi với **0 thuốc ULT được đề xuất** trên UI!
- **Bằng chứng kiểm chứng**: Chạy `evaluate()` Case 5 (`profile='INTL'`, `scr: 80, uricAcid: 580, tophi: true, takingAzathioprine: true`) → chỉ xuất `AVOID Allopurinol`, `AVOID Febuxostat`, `MONITOR Chỉ định mạnh ULT` nhưng **0 phác đồ ULT khởi trị**.
- **Đề xuất sửa chữa**: Bổ sung trường không dung nạp Febuxostat / tùy chọn uricosuric vào `inputs.ts` và sửa `selectUltInitDrug(ctx)` tự động chuyển sang `probenecid` (`eGFR ≥ 60`, không sỏi thận) hoặc `benzbromarone` (trên `INTL`/`VN` khi `eGFR ≥ 30`, không sỏi thận, không bệnh gan) khi cả hai XOI đều bị chống chỉ định/không dung nạp.

---

#### [R1-GOUT-014] `major` | `matrix` | `probenecid` (`kb/drugs/probenecid.json` & `src/modules/gout/matrix.ts`)
- **Phát hiện**: Trong `kb/drugs/probenecid.json` (L39–45), dải thận đầu tiên đặt `"eGFRFrom": 50, "initiate": "rec", "continue": "rec"`. Do `matrix.ts` (L85) lấy `getCell(50)` làm đại diện cho cột **CKD G3a (`45–59`)**, bảng ma trận thận hiển thị `Probenecid` ở **G3a là `rec / rec` (Khuyến cáo khởi trị - màu xanh)**! Điều này vi phạm trực tiếp **ACR 2020 Table 2 PICO 10 (Khuyến cáo MẠNH — Class I: ưu tiên tuyệt đối XOI hơn Probenecid ở CKD giai đoạn ≥ 3 [`eGFR < 60`])**, vi phạm KDIGO 2024 Practice Point 3.14.2, và tự mâu thuẫn với chính `rules.ts` L2036–2060 (phát lệnh `AVOID probenecid` ngay khi `eGFR < 60`!). Hơn nữa ở `G1–G2`, Probenecid chỉ là thuốc hàng hai (`ok`, không phải `rec` ngang hàng Allopurinol).
- **Bằng chứng kiểm chứng**: Kết xuất thực tế `goutMatrix`: `probenecid: g1:rec/rec | g2:rec/rec | g3a:rec/rec | g3b:caution/caution | g4:contra/contra`. Nguyên văn `ACR_2020_Gout_Guideline.pdf` `pdfPage 28` (Table 2 PICO 10).
- **Đề xuất sửa chữa**: Sửa `kb/drugs/probenecid.json` dải 1 thành `"eGFRFrom": 60, "initiate": "ok", "continue": "ok"` và dải 2 `"eGFRFrom": 30, "eGFRTo": 60, "initiate": "avoid", "continue": "caution"` để cột `G3a` đồng bộ hoàn toàn với `rules.ts` và ACR 2020.

---

#### [R1-GOUT-015] `major` | `rule` | `gout.uricosuric.benzbromarone` (& `probenecid`, `etoricoxib`)
- **Phát hiện**: Bỏ sót khác biệt pháp lý và hướng dẫn quốc gia (`US` vs `VN`) đối với nhóm tăng thải acid uric và `etoricoxib`:
  1. **Hồ sơ `US`**: **Benzbromarone và Etoricoxib KHÔNG được FDA phê duyệt lưu hành tại Hoa Kỳ** (ACR 2020 trang 7 / trang in 748 nêu rõ benzbromarone không có tại Mỹ), nhưng `gout.uricosuric.benzbromarone` (`rules.ts` L2145) vẫn bật `profiles: ['INTL', 'VN', 'US']` và kê đơn `[START] Khởi trị Benzbromarone 50 mg/ngày` trên `US`!
  2. **Hồ sơ `VN` (BYT QĐ 361/2014 trang 94)**: Bộ Y tế Việt Nam quy định rõ đối với nhóm tăng thải acid uric (`Probenecid`, `Benzbromaron`): *"Chỉ định nhóm này cần xét nghiệm acid uric niệu. Chống chỉ định khi acid uric niệu trên 600 mg/24 giờ, suy thận, sỏi thận, người cao tuổi, gút mạn có hạt tophi."* (Trái ngược trực tiếp với **ACR 2020 Table 4 PICO 28** khuyến cáo *không* xét nghiệm acid uric niệu và *không* kiềm hóa nước tiểu!). Trên `profile: 'VN'`, bệnh nhân 72 tuổi có hạt tophi vẫn được kê `[START] Probenecid 500 mg` mà không có bất kỳ cảnh báo hay `profileDiff` nào theo BYT 361/2014.
- **Bằng chứng kiểm chứng**: Chạy `evaluate()` Case 12a (`US` → `START Benzbromarone 50 mg`) & Case 12b (`VN`, 72 tuổi, `tophi: true` → `START Probenecid 500 mg`). Nguyên văn `BYT_361_2014_Co_Xuong_Khop.pdf` `pdfPage 94` và `ACR_2020_Gout_Guideline.pdf` `pdfPage 30` (Table 4).
- **Đề xuất sửa chữa**: Gỡ `'US'` khỏi nhánh khởi trị mới `benzbromarone` và ghi chú tình trạng chưa được FDA phê duyệt cho `benzbromarone` & `etoricoxib`; bổ sung citation BYT trang 94 & ACR Table 4 trang 30, chặn/cảnh báo dùng đơn độc uricosuric ở người cao tuổi / có hạt tophi trên `VN` và hiển thị `profileDiff` rõ ràng về xét nghiệm acid uric niệu 24h.

---

#### [R1-GOUT-016] `major` | `rule` | `gout.indication.ult`
- **Phát hiện**:
  1. **Áp cứng tiêu chuẩn cơn đầu của ACR 2020 cho cả `INTL`, bỏ sót EULAR 2016 Rec 5 (Grade A)**: **EULAR 2016 Rec 5 (`pdfPage 3 / p. 31`, Category 1b, Grade A)** khuyến cáo khởi trị ULT ngay từ lần chẩn đoán đầu tiên ở người bệnh **trẻ tuổi (`< 40 tuổi`)**, HOẶC **`SUA > 8.0 mg/dL` (`> 480 µmol/L`)**, và/hoặc có bệnh đồng mắc (**THA, bệnh tim thiếu máu cục bộ, suy tim, suy thận**). Do `assessUltIndication(ctx)` (`rules.ts` L180–247) chỉ dùng tiêu chuẩn ACR (`CKD ≥ G3`, `SUA > 535 µmol/L`, `sỏi thận`), một bệnh nhân 32 tuổi trên `INTL` bị cơn gút đầu tiên kèm THA + bệnh mạch vành và `uricAcid = 510 µmol/L` (`8.6 mg/dL`) bị engine phán `[DEFER] Chưa có chỉ định khởi trị ULT` mà không hề nhắc tới EULAR Rec 5!
  2. **Thiếu 2 khuyến cáo phân độ chính thức của KDIGO 2024 CKD (`pdfPage 46 / S161`)**: `kb/citations/gout.json` mới chỉ trích các Practice Points mà bỏ sót **Recommendation 3.14.1 (`1C` — khuyến cáo mạnh Class I: điều trị hạ urat cho người CKD có tăng acid uric có triệu chứng)** và **Recommendation 3.14.2 (`2D`: không dùng thuốc hạ urat cho người CKD tăng acid uric không triệu chứng để làm chậm tiến triển CKD)**.
- **Bằng chứng kiểm chứng**: Nguyên văn `EULAR_2016_Gout_Recommendations.pdf` `pdfPage 3` (Rec 5) & `pdfPage 4` (Table 2: `1b / Grade A`); `KDIGO_2024_CKD_Guideline.pdf` `pdfPage 46` (`S161`).
- **Đề xuất sửa chữa**: Bổ sung 3 citation chuẩn (`eular.gout.2016.indication_early_ult`, `kdigo.gout.2024.rec_3_14_1_symptomatic`, `kdigo.gout.2024.rec_3_14_2_asymptomatic`) và các ngưỡng `40 tuổi`, `480 µmol/L`; trên `INTL` cho phép khuyến cáo `CONSIDER` khởi trị ULT sớm theo EULAR Rec 5 kèm `profileDiff` đối chiếu với `US` (ACR 2020).

---

#### [R1-GOUT-017] `major` | `missing` | `acr.2020.refractory_ult_switch_and_pegloticase`
- **Phát hiện**: Bỏ sót khuyến cáo **MẠNH (Class I)** của **ACR 2020 Table 5 PICO 27 (`pdfPage 31`, Strong, Moderate LOE)** và **EULAR 2016 Rec 10 (`pdfPage 3`, Grade A)** về xử trí gút mạn tính nặng kháng trị: khi người bệnh đã thất bại không đạt đích acid uric với XOI, thuốc tăng thải urat và phối hợp thuốc ở liều tối đa dung nạp kèm đợt cấp thường xuyên (`≥ 2 đợt/năm`) hoặc hạt tophi dưới da không tan, khuyến cáo mạnh chuyển sang **Pegloticase** (và ngược lại, khuyến cáo **MẠNH KHÔNG dùng Pegloticase** ở người cơn thưa `< 2 cơn/năm` không có tophi). Toàn bộ bước leo thang điều trị này hiện vắng mặt trong cả `rules.ts` lẫn `pathway.ts`.
- **Bằng chứng kiểm chứng**: Nguyên văn `ACR_2020_Gout_Guideline.pdf` `pdfPage 31` (Table 5 PICO 27) và `EULAR_2016_Gout_Recommendations.pdf` `pdfPage 3` (Rec 10).
- **Đề xuất sửa chữa**: Bổ sung trích dẫn ACR Table 5 & EULAR Rec 8, 10; cập nhật `pathway.ts` và thêm nhánh leo thang điều trị khi bệnh nhân đã ở liều tối đa ULT mà chưa đạt đích (đổi XOI / phối hợp XOI + uricosuric; nếu vẫn kháng trị kèm `≥ 2 cơn/năm` hoặc `tophi` thì hội chẩn xét Pegloticase trên `US`/`INTL`, kèm `profileDiff.VN` lưu ý thuốc chưa phổ biến tại Việt Nam).

---

#### [R1-GOUT-018] `major` | `rule` | `gout.safety.pregnancy_ult` (& `pregnancy_colchicine`, `febuxostat.json`)
- **Phát hiện**:
  1. Trong `gout.safety.pregnancy_ult` (`rules.ts` L514–528) và `gout.safety.pregnancy_colchicine` (L582–592), cổng an toàn gắn `action: 'contra'` và lời văn khẳng định thuốc bị *"chống chỉ định"* dựa trên trích dẫn sai chương Loãng xương (`byt.gout.2014.pregnancy_contra`), trong khi các nhãn FDA được dẫn kèm thực tế chỉ ghi mức thận trọng cân nhắc lợi ích - nguy cơ (`Pregnancy Category C` / PLLR: Allopurinol *"only if clearly needed"*, Febuxostat *"insufficient data"*, Colchicine trang 14 thậm chí ghi dữ liệu trên thai phụ mắc FMF không thấy tăng sảy thai hay dị tật bẩm sinh, *"only if the potential benefit justifies the potential risk"*).
  2. Trong `kb/drugs/febuxostat.json` (L94–98), `lactation.status` đặt là `"avoid"` với lời văn *"khuyến cáo tránh dùng khi cho con bú"*, sai lệch so với `FDA_label_febuxostat.pdf` mục `8.2 Lactation` (trang 10) vốn là câu chuẩn PLLR cân nhắc lợi ích bú mẹ và nhu cầu điều trị của mẹ (`"caution"`).
- **Bằng chứng kiểm chứng**: Nguyên văn `FDA_label_colchicine.pdf` `pdfPage 14` (`8.1 Pregnancy`) và `FDA_label_febuxostat.pdf` `pdfPage 9–10` (`8.1 Pregnancy`, `8.2 Lactation`).
- **Đề xuất sửa chữa**: Giữ khuyến cáo lâm sàng trì hoãn/tạm hoãn ULT thường quy trong thai kỳ và ưu tiên Prednisolone hơn Colchicine cho cơn gút cấp thai kỳ, nhưng chuyển `gates[].action` từ `'contra'` sang `'avoid'` và viết lại `rationale` trung thực với nhãn FDA; sửa `febuxostat.json` `lactation.status` thành `"caution"`.

---

### 3.3. Nhóm Sai sót Nhỏ — `MINOR` (5 phát hiện)

#### [R1-GOUT-019] `minor` | `rule` | `gout.safety.colchicine_contra`
- **Phát hiện**: (1) Trong `rules.ts` L41–49, `erythromycin` bị xếp vào `STRONG_CYP3A4_PGP_INHIBITORS` (gây chặn tuyệt đối Colchicine ở người thận - gan bình thường), trong khi **Bảng 1 trang 6 `FDA_label_colchicine.pdf`** xếp **`Erythromycin`** và **`Fluconazole`** vào **Moderate CYP3A4 Inhibitors**, còn **`Ranolazine`** thuộc **P-gp Inhibitors** (cả `fluconazole` và `ranolazine` hiện chưa được đưa vào mảng kiểm tra). (2) Thiếu cảnh báo độc tính cơ / tiêu cơ vân khi dùng Colchicine đồng thời với **Statin** theo **EULAR 2016 Rec 4 (`pdfPage 3`)**.
- **Đề xuất sửa chữa**: Chuyển `'erythromycin'` sang `MODERATE_CYP3A4_INHIBITORS`, bổ sung `'fluconazole'` và `'ranolazine'`, và thêm cảnh báo theo dõi đau/yếu cơ khi `currentMeds` có Statin.

#### [R1-GOUT-020] `minor` | `citation` | `fda.colchicine.prophylaxis_dosage` (& `colchicine_low_dose`, `eular_2016_gout` `printedPage`)
- **Phát hiện**: (1) `fda.colchicine.prophylaxis_dosage` (`kb/citations/gout.json` L522) bị cắt cụt đầu câu từ chữ `"dolescents older than 16 years..."`, làm mất hẳn mệnh đề chính `"Prophylaxis of Gout Flares: 0.6 mg once or twice daily in adults and a"`; (2) `acr.gout.2020.colchicine_low_dose` trích trang 13 nơi chữ `"high-\ndose"` bị gạch nối xuống dòng (trong khi Table 6 trang 32 có câu nguyên vẹn); (3) Cả 8 trích dẫn `eular_2016_gout` đều ghi `"printedPage": "3"`..`"7"` thay vì số trang tạp chí thực tế **`"31"`..`"35"`** (*Ann Rheum Dis* 2017;76:29–42).
- **Đề xuất sửa chữa**: Lấy trọn câu `Prophylaxis of Gout Flares` ở trang 1 nhãn FDA Colcrys; đồng bộ `colchicine_low_dose` với trang 32; cập nhật `printedPage` EULAR sang `"31"`–`"35"`.

#### [R1-GOUT-021] `minor` | `rule` | `gout.acute_flare.treatment`
- **Phát hiện**: (1) Thuật toán luôn chọn Colchicine trước NSAID/Corticoid cho mọi bệnh nhân `eGFR ≥ 30` không dùng CYP3A4i mà không nhắc điều kiện Colchicine liều thấp đạt hiệu quả tốt nhất trong **12 giờ đầu** (tối đa 36 giờ) từ khi khởi phát cơn (**EULAR 2016 Rec 2**, `pdfPage 3`); (2) Liều Prednisolone uống chỉ hiển thị phác đồ EULAR (`30–35 mg/ngày × 3–5 ngày`) trên cả `US`, thiếu `profileDiff` nêu phác đồ **ACR 2020 trang 13** (`≥ 0.5 mg/kg/ngày × 5–10 ngày` hoặc 2–5 ngày liều đầy đủ rồi giảm dần 7–10 ngày).
- **Đề xuất sửa chữa**: Bổ sung lưu ý cửa sổ 12–36 giờ đầu khởi phát cơn vào `warnings`/`rationale` của Colchicine cắt cơn và thêm `profileDiff` liều Corticoid đường uống giữa ACR 2020 và EULAR 2016.

#### [R1-GOUT-022] `minor` | `rule` | `isUltNewlyStartedOrUptitrated` (& `gout.prophylaxis.flare`)
- **Phát hiện**: (1) Hàm `isUltNewlyStartedOrUptitrated(ctx)` (`rules.ts` L405–422) chỉ kích hoạt dự phòng khi chuẩn độ tăng liều `allopurinol` và `febuxostat`, bỏ quên `probenecid` và `benzbromarone` khi hai thuốc này phát lệnh `UPTITRATE`; (2) Chưa nêu hướng dẫn của **ACR 2020 Table 2 PICO 9 (Strong, `pdfPage 28`)** về việc **tiếp tục kéo dài dự phòng quá 3–6 tháng** nếu bệnh nhân vẫn còn tái phát cơn cấp hoặc hạt tophi đang tan.
- **Đề xuất sửa chữa**: Bổ sung `probenecid` và `benzbromarone` vào nhánh kiểm tra chưa đạt đích của `isUltNewlyStartedOrUptitrated(ctx)` và bổ sung hướng dẫn đánh giá tiếp tục dự phòng `> 6 tháng` vào `rationale` của `gout.prophylaxis.flare`.

#### [R1-GOUT-023] `minor` | `matrix` | `src/modules/gout/matrix.ts` (`colchicine` & `febuxostat` ở `G5`/`dialysis`)
- **Phát hiện**: (1) Ô `G5` và `dialysis` của `colchicine` đánh dấu `contra` nhưng lại dẫn `fda.colchicine.renal_and_cyp3a4` (chỉ chống chỉ định khi kèm CYP3A4/P-gp inhibitor; thực tế nhãn FDA trang 15 và KDIGO 2024 trang 117 có liều giảm cho G5/lọc máu, còn chống chỉ định đơn thuần từ `eGFR < 30` là theo EULAR 2016); (2) Ô `G5` và `dialysis` của `febuxostat` hiển thị `40 mg/ngày` dựa trên `fda.febuxostat.severe_renal`, nhưng nhãn FDA Uloric trang 10 chỉ định nghĩa suy thận nặng cho `Clcr 15–29 mL/min` và ghi nhận thiếu dữ liệu đầy đủ ở `< 15` / lọc máu.
- **Đề xuất sửa chữa**: Ghi rõ `note` và cập nhật đúng trích dẫn EULAR 2016 / KDIGO 2024 / FDA Section 8.6 cho các ô `G5` và `dialysis` của `colchicine.json` và `febuxostat.json`.

---

### 3.4. Nhóm Đề xuất Hoàn thiện — `SUGGESTION` (3 phát hiện)

#### [R1-GOUT-024] `suggestion` | `missing` | `acr.2020.flare.topical_ice_and_combo_therapy`
- **Đề xuất**: Bổ sung vào `gout.acute_flare.treatment` và `pathway.ts` Step 2 hai hướng dẫn thực hành hữu ích: (1) **Chườm đá lạnh tại chỗ (`topical ice`)** giảm đau sưng khớp (ACR 2020 Table 6 PICO 31); (2) Cân nhắc **phối hợp kháng viêm đầu tay** (`Colchicine + NSAID` hoặc `Colchicine + Corticoid`, lưu ý **tránh phối hợp NSAID + Corticoid toàn thân** do độc tính tiêu hóa) cho cơn gút cấp đa khớp rất nặng theo EULAR 2016 Rec 2 & Hình 1 (`pdfPage 4 / p. 32`).

#### [R1-GOUT-025] `suggestion` | `rule` | `gout.lifestyle.advice`
- **Đề xuất**: Mở rộng `gout.lifestyle.advice` với: (1) Không khuyến cáo bổ sung Vitamin C thường quy (ACR 2020 Table 7 PICO 48); (2) Khuyến khích **sữa và chế phẩm sữa ít béo (`low-fat dairy`)** & vận động thể lực đều đặn (EULAR 2016 Principle B & KDIGO 2024 Practice Point 3.14.4); (3) `profileDiff` giữa BYT 361/2014 trang 92 (uống 2–4 L/ngày nước khoáng kiềm nếu không suy tim/phù) và ACR 2020 Table 4 PICO 29 (không kiềm hóa nước tiểu thường quy).

#### [R1-GOUT-026] `suggestion` | `rule` | `gout.indication.ult`
- **Đề xuất**: Bổ sung ghi chú liên chuyên khoa Tim - Thận - Chuyển hóa từ **KDIGO 2024 CKD (`pdfPage 116 / S231`)** về đồng lợi ích hạ acid uric máu và giảm nguy cơ cơn gút cấp của nhóm **ức chế SGLT2 (`dapagliflozin`, `empagliflozin`)** khi người bệnh gút có kèm Đái tháo đường típ 2, CKD hoặc Suy tim.

---

## 4. Kết luận Kiểm định Vòng 1 (Vai R1)

Module `gout` có kiến trúc khung quy tắc rõ ràng và bao phủ tốt các chỉ định nền tảng của điều trị hạ acid uric máu, sàng lọc `HLA-B*58:01` ở người Việt và xử trí trong cơn cấp. Tuy nhiên, kiểm định độc lập đối chiếu nguyên văn PDF và chạy thực nghiệm `evaluate()` đã phát hiện **3 lỗi `critical` đe dọa trực tiếp an toàn người bệnh** (tăng liều Allopurinol vượt kịch trần 800 mg hoặc không giới hạn theo suy thận nặng G4–G5; kê Colchicine 0.3 mg/ngày kéo dài 3–6 tháng ở CKD G4 trên cả hồ sơ `INTL`/`VN`; lỗi logic kali máu làm xuất hiện lệnh `TẠM HOÃN Losartan` ảo và mất nhánh đổi Thiazide sang CCB) cùng **15 lỗi `major`** (đặc biệt là gian lận trích dẫn chương Loãng xương trang 172 BYT 2014, nhầm nhãn kháng sinh tiết niệu Orlynvah cho Probenecid, sai liều Colchicine cắt cơn khi dùng kèm ức chế vừa CYP3A4, 11 mục sai COR/LOE/locator, sai mục tiêu urat trên `US` khi có tophi, sai ô G3a của Probenecid trên ma trận thận, và thiếu một số khuyến cáo Class I cho cơn cấp NPO / gút kháng trị).

**KẾT LUẬN: FAIL**
