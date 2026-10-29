# Báo cáo Kiểm toán Dược lâm sàng Độc lập — Module Gút (`gout`) — Vòng 1 (Vai R2)

- **Hội đồng Duyệt Độc lập**: GDMT-VN Review Board
- **Vai trò**: **R2 – Chuyên gia Dược lâm sàng (Clinical Pharmacology Reviewer)**
- **Phạm vi kiểm toán**:
  - Mã nguồn module: `src/modules/gout/{index,inputs,matrix,pathway,presets,rules}.ts`
  - 11 `DrugEntry` thuộc phạm vi sở hữu của module Gút: `allopurinol`, `febuxostat`, `colchicine`, `probenecid`, `benzbromarone`, `naproxen`, `ibuprofen`, `diclofenac`, `etoricoxib`, `celecoxib`, `indomethacin` (`kb/drugs/*.json`)
  - 3 `DrugEntry` dùng chéo từ module khác: `prednisolone`, `methylprednisolone`, `losartan` (`kb/drugs/*.json`)
  - 62 ngưỡng định lượng `gout.*` và các quy tắc tương tác toàn cục liên quan qua bộ truy xuất KB & thực thi thực nghiệm `evaluate()` (`docs/reviews/gout/scratch/r2_audit.ts`)
- **Tài liệu gốc đối chiếu nguyên văn (Primary Sources)**:
  1. **ACR 2020**: FitzGerald JD et al. *2020 American College of Rheumatology Guideline for the Management of Gout* (`ACR_2020_Gout_Guideline.pdf`, trang 1–34).
  2. **EULAR 2016**: Richette P et al. *2016 Updated EULAR Evidence-Based Recommendations for the Management of Gout* (`EULAR_2016_Gout_Recommendations.pdf`, trang 1–14).
  3. **BYT 361/2014**: Bộ Y tế Việt Nam – Quyết định 361/QĐ-BYT (25/01/2014) *Hướng dẫn chẩn đoán và điều trị các bệnh cơ xương khớp* (`BYT_361_2014_Co_Xuong_Khop.pdf`, bài Bệnh Gút trang 89–94 & Phụ lục Thuốc chống viêm không steroid trang 198–201).
  4. **KDIGO 2024**: *KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease* (`KDIGO_2024_CKD_Executive_Summary.pdf`, Mục 3.14 Hyperuricemia trang 12 & Chương 4 trang 14–15).
  5. **Nhãn thuốc gốc FDA & EMA/HPRA/ANSM**:
     - `FDA_label_allopurinol.pdf` (ZYLOPRIM®, NDA 016084, trang 1–13)
     - `FDA_label_febuxostat.pdf` (ULORIC®, Rev 04/2023, trang 1–16)
     - `FDA_label_colchicine.pdf` (COLCRYS®, Rev 10/2022, trang 1–16)
     - `FDA_label_celecoxib.pdf` (CELEBREX®, Rev 11/2024, trang 1–32)
     - `FDA_label_probenecid.pdf` (Lưu ý: tệp trong kho nguồn là viên phối hợp ORLYNVAH™ sulopenem etzadroxil/probenecid NDA 213972 Rev 12/2025, trang 1–18)
     - `FDA_label_diclofenac.pdf` (Lưu ý: tệp trong kho nguồn là gel bôi ngoài da Voltaren® Arthritis Pain 1% OTC NDA 022122, trang 1–13)
     - `Desuric_benzbromarone_SmPC.pdf` (DESURIC® 100 mg, EMA/ANSM Pháp, trang 1–3)
     - `Arcoxia_SmPC.pdf` (ARCOXIA® 30/60/90/120 mg, EMA/HPRA, trang 1–17)

---

## 1. Tóm tắt Điều hành & Thống kê Phát hiện

Module Gút (`gout`) có kiến trúc nền tảng tốt về mặt phân tầng chỉ định ULT theo ACR 2020, tuân thủ nguyên tắc fail-closed `need(ctx, ...)` khi thiếu eGFR/urat, sàng lọc dược lý di truyền `HLA-B*58:01`, bảo toàn thuốc ULT đang dùng trong đợt cấp và tránh tự ý ngừng lợi tiểu quai ở bệnh nhân suy tim.

Tuy nhiên, dưới góc độ kiểm toán sâu về **Dược lâm sàng & An toàn Kê đơn Đa bệnh lý**, module hiện còn **9 lỗi mức `critical`** (có thể gây tổn thương thận cấp, xuất huyết tiêu hóa, suy gan/hội chứng gan-thận, ngộ độc thần kinh-cơ hoặc quá liều trực tiếp cho bệnh nhân nếu bác sĩ làm theo) và **10 lỗi mức `major`** (sai lệch nhãn gốc FDA/EMA, mâu thuẫn trực tiếp giữa ma trận thận `goutMatrix` và `rules.ts`, bỏ sót dự phòng khi tăng liều uricosuric, vi phạm hệ thống quy tắc trích dẫn QA-7).

| Mức độ (`severity`) | Số lượng | Mã phát hiện (`id`) |
|---|---:|---|
| **Critical** | **9** | `GOUT-R2-001`, `GOUT-R2-002`, `GOUT-R2-003`, `GOUT-R2-004`, `GOUT-R2-005`, `GOUT-R2-006`, `GOUT-R2-007`, `GOUT-R2-008`, `GOUT-R2-009` |
| **Major** | **10** | `GOUT-R2-010`, `GOUT-R2-011`, `GOUT-R2-012`, `GOUT-R2-013`, `GOUT-R2-014`, `GOUT-R2-015`, `GOUT-R2-016`, `GOUT-R2-017`, `GOUT-R2-018`, `GOUT-R2-019` |
| **Minor** | **4** | `GOUT-R2-020`, `GOUT-R2-021`, `GOUT-R2-022`, `GOUT-R2-023` |
| **Suggestion** | **1** | `GOUT-R2-024` |
| **Tổng cộng** | **24** | **Kết luận Vòng 1: `FAIL`** |

---

## 2. Bảng Đối chiếu Dược lâm sàng Toàn diện 14 Thuốc (`kb/drugs/*.json`)

### 2.1. Nhóm Thuốc Hạ Acid Uric Máu & Colchicine (5 thuốc cốt lõi)

| Thuốc (`id`) | Liều khởi đầu / Chuẩn độ / Trần tối đa | Hiệu chỉnh Thận & Lọc máu | Hiệu chỉnh Suy gan | Chống chỉ định & Tương tác trọng yếu | Thai kỳ & Cho con bú | Biệt dược & Hàm lượng tại VN (`forms` / `vnBrands`) | Đánh giá R2 |
|---|---|---|---|---|---|---|---|
| **`allopurinol`** | Khởi đầu `100 mg/ngày` (`≤ 50 mg/ngày` ở CKD G3+); bậc tăng `100 mg` mỗi `2–5 tuần` (thiếu bậc `≤ 50 mg` ở CKD G4/G5!). `maxDose` chỉ ghi `800 mg/ngày` (FDA), thiếu mốc `900 mg/ngày` (EULAR/EMA). | `allopurinol.json` giới hạn G4 tối đa `200 mg/ngày`, G5 tối đa `100 mg/ngày`, nhưng `rules.ts` lại cho `UPTITRATE +100 mg` tới `800 mg/ngày` ở cả G5! Ô `dialysis` chép mù G5, thiếu lưu ý thuốc bị lọc qua HD (uống sau lọc máu). | Chưa có trường giảm liều/theo dõi men gan định kỳ giai đoạn đầu (FDA Zyloprim Precautions trang 5). | Đã có `HLA-B*58:01`, `azathioprine/6-MP`, `amoxicillin/ampicillin`. **Thiếu**: `Thiazide + suy thận` tăng nguy cơ hội chứng quá mẫn SCAR (`FDA p.4`), `warfarin/dicumarol` (`FDA p.5`), `cyclosporine` (`FDA p.5`), và chặn trùng lặp `allopurinol + febuxostat`. | `pregnancy: caution` (khớp FDA Cat C p.6); `lactation: caution` (khớp FDA p.6: tiết qua sữa mẹ cả allopurinol & oxipurinol). | `vnBrands` ghi `"Milurit", "Zyloprim"` — **bỏ sót `"Zyloric"`** (biệt dược gốc kinh điển tại VN) và generic phổ biến (`Allopurinol Stada`). | **Cần sửa (`GOUT-R2-008`, `009`, `012`, `019`)** |
| **`febuxostat`** | Khởi đầu `40 mg/ngày`, tăng lên `80 mg/ngày` sau 2 tuần. `forms` có viên `120 mg` nhưng `maxDose` chỉ ghi `80 mg/ngày` (mâu thuẫn nội bộ FDA vs EMA/EULAR `120 mg/ngày`). | Giới hạn `≤ 40 mg/ngày` khi `eGFR < 30` (khớp FDA Uloric p.3). Tuy nhiên `rules.ts` không `REDUCE` nếu BN `eGFR < 30` đang uống sẵn `80 mg` đã đạt đích! Ô `dialysis` ghi `40 mg/ngày`, bỏ sót nhãn FDA p.14 *"chưa được nghiên cứu trên BN lọc máu"*. | Nhãn FDA p.10: Child-Pugh A/B không cần chỉnh liều; Child-Pugh C chưa được nghiên cứu (cần thận trọng). | Đã có `azathioprine/6-MP` (`contra`), `theophylline`, cảnh báo hộp đen CARES (`CVD`). **Thiếu**: chặn trùng lặp `allopurinol + febuxostat`. Trích dẫn ngưỡng `eGFR 30` gắn nhầm sang `benzbromarone_egfr30`! | Ghi **`avoid` cho cả thai kỳ & cho con bú và mạo nhận `(FDA Label)`** — **SAI** so với nhãn gốc FDA Uloric p.9–10 (không gây quái thai ở động vật, chỉ mức `caution`). | `vnBrands`: `"Feburic", "Adenuric", "Uloric"` (`Feburic` và `Adenuric` đúng thực tế VN; `Uloric` là tên Mỹ). | **Cần sửa (`GOUT-R2-008`, `009`, `012`, `014`, `015`, `019`)** |
| **`colchicine`** | Cơn cấp: `1 mg + 0.5 mg sau 1h` (VN/EU) hoặc `1.2 mg + 0.6 mg sau 1h` (US). Dự phòng: `0.5–1 mg/ngày`. **Lỗi nặng**: `colchicine.json` khai báo `titration: step 0.5 mg mỗi 7 ngày, maxDose 1.2 mg/ngày` (vô nghĩa dược lý và tự mâu thuẫn với liều cắt cơn 1.5–1.8 mg!). | **3 lỗi lớn**: (1) `rules.ts` kê dự phòng `0.5–1 mg/ngày` ở CKD G3 (`eGFR 30–59`), vượt trần `0.5 mg/ngày` của `colchicine.json`; (2) `rules.ts` kê `0.3 mg/ngày` ở CKD G4 trên profile `VN` (viên 1 mg tại VN không thể chia 0.3 mg!); (3) G4 ma trận cho phép cắt cơn nhưng `rules.ts` chặn hoàn toàn ở `eGFR < 30`. | Chặn cắt cơn/dự phòng khi `liverDisease = true` trong `rules.ts` (an toàn), nhưng `colchicine.json` chưa mô tả giảm độ thanh thải gan & chống chỉ định tuyệt đối khi suy gan kèm ức chế CYP3A4/P-gp. | **Lỗi CRITICAL**: (1) Thiếu `ranolazine` (P-gp mạnh), `fluconazole` (CYP3A4 vừa), `posaconazole`, `voriconazole`, các thuốc ức chế protease HIV; xếp nhầm `erythromycin` vào nhóm mạnh; gom nhầm `cyclosporine` vào nhóm "vừa" trong `colchicine.json`; (2) Thiếu tương tác nhóm **Fibrate (`fenofibrate`, `gemfibrozil`)** và vẫn kê mới Colchicine trên nền Statin + CKD! | Ghi `pregnancy: avoid` dẫn nhãn FDA, trong khi FDA Colcrys p.14 là Category C tương tự Allopurinol (`caution`). | `vnBrands` ghi `"Colchicine Roussel", "Colcrys"` (`Colcrys` 0.6 mg không bán tại VN; thiếu `Colchimax`, `Colchicin Traphaco`, `Goutcolcin`). | **Cần sửa khẩn (`GOUT-R2-005`, `006`, `007`, `012`, `015`, `019`)** |
| **`probenecid`** | Khởi đầu `250 mg x 2` hoặc `500 mg x 1–2 lần/ngày`, tăng dần tới tối đa `2000 mg/ngày` (`2 g/ngày`). `rules.ts` không kiểm tra liều hiện tại `≥ 2000 mg` và **bỏ quên dự phòng cơn cấp khi `UPTITRATE` Probenecid**! | **Mâu thuẫn trực tiếp Matrix vs Rules ở G3a (`eGFR 45–59`)**: `probenecid.json` đặt ngưỡng `50` + `matrix.ts` lấy `getCell(50)` -> ô G3a hiện `rec` (`500–2000 mg/ngày`), trong khi `rules.ts` phát `AVOID` khi `eGFR < 60`! Gắn nhầm trích dẫn `byt.gout.2014.nsaid_agents` ở dải `< 30`! | Thiếu cảnh báo hoại tử gan hiếm gặp (`hepatic necrosis`, FDA p.6). | Đã có sỏi thận (`urolithiasis`) và `methotrexate`. **Thiếu**: Chống chỉ định tuyệt đối **`ketorolac`** (`FDA Section 4 p.3`), tương tác tăng gấp đôi nồng độ **`indomethacin`, `naproxen`, `ketoprofen`** (`FDA p.6–7`), đối kháng mất tác dụng bởi **salicylate liều cao**, thiếu men **G6PD / loạn tạo máu**, và tăng urat niệu `> 600–700 mg/24h`. | `probenecid.json` ghi `caution` (khớp FDA p.7), nhưng `rules.ts` lại phát `STOP` với cổng `contra` dẫn `fda.probenecid.pregnancy`! | `forms`: Viên nén `500 mg`; `vnBrands`: `"Benemid", "Probalan"` (thuốc rất hiếm tại VN, chủ yếu nhập khẩu chuyến). | **Cần sửa (`GOUT-R2-008`, `011`, `013`, `014`, `015`, `016`)** |
| **`benzbromarone`** | Khởi đầu `50 mg/ngày`, đích/tối đa `50–200 mg/ngày` (EULAR 2016 p.7; lưu ý Desuric SmPC p.1 ghi `100–300 mg/ngày`). **Bỏ quên dự phòng khi `UPTITRATE`** và **cho phép khởi trị trên profile `US` & ngay trong cơn gút cấp**! | Chống chỉ định khi `eGFR < 30 mL/phút` (khớp EULAR 2016 Rec 9 p.3; Desuric SmPC p.1 ghi `CrCl < 20`, dùng mốc `< 30` của EULAR là chặt chẽ và an toàn hơn). | **Thiếu Cảnh báo hộp đen SmPC**: Viêm gan hủy tế bào tối cấp tử vong/ghép gan; bắt buộc LFT bình thường trước điều trị, theo dõi men gan sát 6 tháng đầu, ngừng vĩnh viễn nếu AST/ALT > ULN! | Đã có sỏi thận & `liverDisease` và tương tác `warfarin` (CYP2C9). **Thiếu**: Chống chỉ định phối hợp **thuốc độc gan (đặc biệt kháng lao `pyrazinamide`)**, **porphyria gan**, **acid uric niệu ≥ 700 mg/24h** (`BYT > 600 mg/24h`), và **cấm khởi trị trong cơn gút cấp** (`Desuric SmPC p.1–2`). Hoàn toàn chưa trích dẫn `Desuric_benzbromarone_SmPC.pdf`! | Ghi sai `"nguy cơ độc tính phát triển phôi thai"` dẫn trích dẫn sai; SmPC p.2 ghi chưa thấy quái thai nhưng `avoid` trong thai kỳ & cho con bú. | `forms`: Viên nén `50 mg, 100 mg`; `vnBrands`: `"Desuric", "Narcaricin"` (phù hợp; thuốc KHÔNG có phép FDA tại Mỹ!). | **Cần sửa (`GOUT-R2-008`, `010`, `013`, `014`)** |

---

### 2.2. Nhóm 6 Thuốc NSAID / COX-2i Sở hữu & 3 Thuốc Dùng Chéo

| Thuốc (`id`) | Liều Gút & Trần `maxDose` | Thận (`eGFR`) & Suy gan (`liverDisease`) | Chống chỉ định & Tương tác bị thiếu | Trích dẫn & Biệt dược VN | Đánh giá R2 |
|---|---|---|---|---|---|
| **`naproxen`** | Cắt cơn `500 mg x 2 lần/ngày` × 5 ngày; dự phòng `250 mg x 2 lần/ngày` + PPI. Thiếu `maxDose` (`1000–1250 mg/ngày`). | Chặn `< 30`, thận trọng `30–59`. **Lỗi CRITICAL trong `rules.ts`**: Kê mới `Naproxen` cho bệnh nhân **xơ gan (`liverDisease`)**, **Triple Whammy**, **đột quỵ/`hasCvd`**, và **kê chồng lên NSAID khác**! | Thiếu tương tác cạnh tranh COX-1 với **Aspirin liều thấp** (`ix.nsaid_aspirin_antiplatelet_blunting`), tương tác tăng nồng độ với **Probenecid**, và **Lithium / Methotrexate / SSRI**. | Gắn sai `eular.gout.2016.benzbromarone_egfr30` và `byt.gout.2014.pregnancy_contra` (cho mốc tuần 20 thiểu ối!). `vnBrands` thiếu `Naproxen Stada`, `Proxan`. | **Cần sửa (`GOUT-R2-001`–`004`, `014`, `020`)** |
| **`ibuprofen`** | Ghi `400–600 mg x 3–4 lần/ngày` (`start: 600 mg`, thiếu `maxDose: 2400–3200 mg/ngày`; lưu ý BYT 2014 p.201 ghi `400–1200 mg/24h` là liều giảm đau thấp). | Không được `STOP` trong `rules.ts` khi đang dùng trên nền `liverDisease`, `ascvd`/`strokeOrTia` hoặc `Triple Whammy`. | **Thiếu tương tác kinh điển với Aspirin liều thấp** (cạnh tranh gắn Ser-529 trên COX-1 tiểu cầu làm mất bảo vệ tim mạch — BYT 2014 p.199 nhấn mạnh đặc biệt với ibuprofen!). | Gắn sai `benzbromarone_egfr30` & `byt.gout.2014.pregnancy_contra`. `vnBrands` chỉ ghi `"Advil", "Motrin"` (thiếu `Brufen`, `Alaxan`, `Gofen`). | **Cần sửa (`GOUT-R2-001`–`003`, `014`, `020`)** |
| **`diclofenac`** | `50 mg x 2–3 lần/ngày` × 3–5 ngày (khớp BYT 2014 p.13, 201). Thiếu `maxDose: 150 mg/ngày`. | Không được `STOP` trong `rules.ts` khi đang dùng trên nền **`ascvd`/`strokeOrTia`** (chống chỉ định tim mạch huyết khối ngang COX-2i theo EMA/FDA!), `liverDisease` hoặc `Triple Whammy`. | `contraindications` đã có `hf`, `pepticUlcer`, nhưng `rules.ts` không chặn `ascvd` khi đang dùng! Lưu ý `FDA_label_diclofenac.pdf` trong kho là gel bôi 1% OTC, không phải viên uống! | Gắn sai `benzbromarone_egfr30` & `byt.gout.2014.pregnancy_contra`. `vnBrands`: `"Voltaren", "Cataflam"` (đúng thực tế VN). | **Cần sửa (`GOUT-R2-001`–`003`, `014`, `020`)** |
| **`etoricoxib`** | `120 mg x 1 lần/ngày` chỉ trong giai đoạn triệu chứng cấp, **tối đa 8 ngày** (`Arcoxia SmPC p.2`). Thiếu trường `maxDose`. Không được FDA phê duyệt tại Mỹ (`US`). | **Lỗi CRITICAL**: Bỏ sót hoàn toàn giới hạn liều suy gan của `Arcoxia SmPC p.3` (**Child-Pugh 5–6 tối đa `60 mg/ngày`; Child-Pugh 7–9 tối đa `30 mg/ngày`; Child-Pugh ≥ 10 chống chỉ định tuyệt đối**)! | **Thiếu hàng loạt chống chỉ định `Arcoxia SmPC Section 4.3` (trang 3)**: Bệnh tim thiếu máu cục bộ (`ascvd`), bệnh động mạch ngoại biên, bệnh mạch máu não (`strokeOrTia`), **THA chưa kiểm soát `> 140/90 mmHg`**, bệnh viêm ruột (`IBD`), hen do aspirin, trẻ `< 16 tuổi`; thiếu tương tác tăng **50–60% Ethinylestradiol** (`p.6`). | **Không có bất kỳ trích dẫn nào tới `Arcoxia_SmPC.pdf`** dù tệp có sẵn trong `09_Nhan_Thuoc/EMA/`! Lại gắn nhầm `benzbromarone_egfr30`! | **Cần sửa khẩn (`GOUT-R2-002`, `003`, `014`, `017`, `020`)** |
| **`celecoxib`** | Ghi `200 mg x 2 lần/ngày` × 3–5 ngày (cần lưu ý off-label FDA cho gút cấp; BYT 2014 p.201 ghi `200 mg x 1–2 viên/ngày`; thiếu `maxDose: 400 mg/ngày`). | **Thiếu giảm 50% liều ở suy gan vừa (Child-Pugh B) và tránh dùng ở suy gan nặng (Child-Pugh C)** theo `FDA_label_celecoxib.pdf` trang 6 & 26! | **Thiếu chống chỉ định `FDA Celebrex Section 4` (trang 7)**: Dị ứng **Sulfonamide**, phẫu thuật **CABG**, hen/mày đay do aspirin/NSAID; thiếu giảm **50% liều** ở người mang kiểu gen **`CYP2C9*3/*3` (poor metabolizer)** và khi dùng kèm **`Fluconazole`** (`p.7, 20, 26`). | **Không trích dẫn `FDA_label_celecoxib.pdf`** dù có sẵn trong `09_Nhan_Thuoc/FDA/`! Gắn nhầm `benzbromarone_egfr30` & `byt.gout.2014.pregnancy_contra`. | **Cần sửa (`GOUT-R2-002`, `003`, `014`, `017`, `020`)** |
| **`indomethacin`** | `50 mg x 3 lần/ngày` × 3–5 ngày sau ăn. Thiếu `maxDose: 150–200 mg/ngày`. | Đã ghi chú nguy cơ độc thận và thần kinh trung ương cao ở người cao tuổi; nhưng `rules.ts` vẫn không `STOP` khi có `liverDisease`, `ascvd` hay `Triple Whammy`. | Thiếu tương tác với **Probenecid** (tăng mạnh nồng độ indomethacin huyết tương — phải giảm liều indomethacin), **Triamterene** (suy thận cấp vô niệu), **Lithium**. | Gắn sai `benzbromarone_egfr30` & `byt.gout.2014.pregnancy_contra`. `vnBrands` ghi `"Indocin"` (tên Mỹ; tại VN dùng `Indocid`, `Indometacin`). | **Cần sửa (`GOUT-R2-001`–`003`, `014`, `016`, `020`)** |
| **`prednisolone`** *(dùng chéo)* | Cắt cơn trong `rules.ts`: `30–35 mg/ngày × 3–5 ngày` (khớp EULAR 2016 p.3). **Dự phòng trong `rules.ts` thiếu hoàn toàn con số mg** (chỉ ghi `"Liều thấp"`!). | An toàn cho mọi mức suy thận / lọc máu (khớp KDIGO 2024 PP 3.14.3 p.12). | **Lỗi CRITICAL khi phối hợp (`Case S3a`)**: Ở CKD G3 (`eGFR 45`) đang uống Naproxen, `rules.ts` kê `START Prednisolone 30–35 mg` mà không `STOP Naproxen`, gây cảnh báo đỏ `ix.nsaid_corticosteroid_gi_bleed`! | `prednisolone.json` hiện chỉ mô tả liều cho `"Đợt cấp hen"`, chưa có mô tả liều cắt cơn/dự phòng gút. | **Cần sửa (`GOUT-R2-004`, `013`, `021`)** |
| **`methylprednisolone`** *(dùng chéo)* | `rules.ts` dòng 1001 nhắc dùng tương đương Prednisolone (`24–28 mg/ngày` uống). | An toàn ở suy thận. | **Sai lệch dạng muối trong `methylprednisolone.json`**: `inn` ghi `"Methylprednisolone sodium succinate"` (chỉ tiêm IV/IM) nhưng `forms` lại ghi `"Viên nén 4 mg, 16 mg"` (dạng base tự do!). | Mô tả trong JSON chỉ có hen cấp tĩnh mạch `40–125 mg IV`. | **Cần sửa (`GOUT-R2-021`)** |
| **`losartan`** *(dùng chéo)* | Đổi từ Thiazide sang Losartan (25–50 mg -> 50–100 mg/ngày) tận dụng ức chế URAT1 ống thận. | An toàn thận nhưng cần theo dõi Creatinin & Kali sau 2–4 tuần (KDIGO 2024 PP 3.6.2). | **Lỗi logic trong `gout.concurrent.switch_thiazide` (`Case S10`)**: Không đọc `need(ctx, 'k') > 5.0`, nên khi `K⁺ = 5.6 mmol/L` bị cổng toàn cục biến thành `HOLD Losartan`, làm mất nhánh đổi sang `Amlodipine`! | `losartan.json` đầy đủ cổng `pregnancy` (`contra`) và `K > 5.0` (`hold`). | **Cần sửa (`GOUT-R2-018`)** |

---

## 3. Kiểm toán Ma trận Bằng chứng Thận `goutMatrix` (`src/modules/gout/matrix.ts`)

Đối chiếu trực tiếp kết xuất thực tế của `goutMatrix` (7 cột: `G1 ≥90`, `G2 60–89`, `G3a 45–59`, `G3b 30–44`, `G4 15–29`, `G5 <15`, `Lọc máu HD/PD`) với `DrugEntry.renal` và `src/modules/gout/rules.ts` phát hiện **5 điểm lệch chuẩn nghiêm trọng**:

1. **Mâu thuẫn trực tiếp tại ô `Probenecid × G3a (45–59)` (`GOUT-R2-011`)**:
   - `goutMatrix` lấy mẫu `G3a` tại `getCell(50)` (`matrix.ts` dòng 85) kết hợp với `probenecid.json` đặt dải `eGFRFrom: 50` -> Ô `G3a (45–59)` hiển thị màu xanh **`initiate: "rec", continue: "rec", dose: "500–2000 mg/ngày"`**.
   - Ngược lại, `rules.ts` (`gout.uricosuric.probenecid` dòng 2036) chặn ở `eGFR < 60` -> Với cùng bệnh nhân `eGFR = 50`, engine phát lệnh **`AVOID` ("Không ưu tiên khởi trị Probenecid ở CKD giai đoạn ≥ 3")** theo đúng ACR 2020 (Table 2 trang 28) & KDIGO 2024 (PP 3.14.2 trang 12)! Đồng thời ở đoạn `eGFR 45–49` (nằm trong G3a), ngay cả mức `caution` của `probenecid.json` cũng bị `getCell(50)` nuốt mất.
2. **Mâu thuẫn trần liều `Allopurinol × G4 / G5` giữa `goutMatrix` và `rules.ts` (`GOUT-R2-008`)**:
   - `goutMatrix` hiển thị G4 (`15–29`): `"tối đa 200 mg/ngày"` và G5 (`< 15`): `"tối đa 100 mg/ngày"`.
   - `rules.ts` (`gout.allopurinol.uptitrate` dòng 1631) lại chỉ định cho chính bệnh nhân G4/G5 đó: **`"Tăng thêm 100 mg mỗi 2–5 tuần (tối đa 800 mg/ngày)"`**.
3. **Mâu thuẫn `Colchicine × G3a/G3b` và `G4` giữa `goutMatrix` và `rules.ts` (`GOUT-R2-007`, `GOUT-R2-012`)**:
   - Ở `G3a/G3b (30–59)`: `goutMatrix` giới hạn `"Dự phòng: 0.5 mg/ngày"` (và bỏ sót hướng dẫn liều cơn cấp), nhưng `rules.ts` lại kê dự phòng **`"0.5–1 mg/ngày"`**!
   - Ở `G4 (15–29)`: `goutMatrix` ghi `"Cơn cấp: không lặp lại trong vòng 14 ngày"` (`caution`), nhưng `rules.ts` (dòng 955–960) cấm hoàn toàn Colchicine cắt cơn khi `eGFR < 30`!
4. **Cột `Lọc máu (HD/PD)` của `Allopurinol` và `Febuxostat` sao chép mù dải `G5` không lọc máu (`GOUT-R2-012`)**:
   - `matrix.ts` (dòng 69–76) lấy `d.renal[d.renal.length - 1]` cho `allopurinol` và `febuxostat`, làm mất hướng dẫn dùng **Allopurinol sau buổi chạy thận nhân tạo** (do thuốc và oxipurinol bị thẩm tách qua màng lọc) và bỏ qua cảnh báo nhãn FDA rằng **Febuxostat chưa từng được nghiên cứu ở bệnh nhân lọc máu** (`FDA_label_febuxostat.pdf` trang 14).
5. **Lỗi hiển thị chuỗi và mất `note` ở cột `Lọc máu (HD/PD)` cho 9 thuốc chống chỉ định (`GOUT-R2-012`)**:
   - `getDialysisCell()` (`matrix.ts` dòng 60–67) chép nguyên chuỗi `"Chống chỉ định khi eGFR < 30 mL/phút"` của dải G4/G5 làm nội dung `dose` của cột `Lọc máu (HD/PD)` và bỏ quên trường `note: lastBand?.note`.

---

## 4. Chi tiết 24 Phát hiện Kiểm toán (Kèm Bằng chứng Nguyên văn & Kết quả Chạy `evaluate()`)

### Nhóm A — Các Phát hiện Mức `CRITICAL` (9 phát hiện)

#### [GOUT-R2-001] `critical` | `rule` | `gout.safety.nsaid_contra / gout.acute_flare.treatment / gout.prophylaxis.flare`
- **Vấn đề**: Bỏ sót cổng chặn **Bộ ba nguy hại (Triple Whammy: RASi/ARNI + Lợi tiểu quai/thiazide + NSAID/COX-2i)**. Dù `src/modules/gout/rules.ts` đã khai báo đầy đủ `RASI_ARNI_DRUG_IDS`, `THIAZIDE_DRUG_IDS`, `LOOP_DIURETIC_DRUG_IDS` (dòng 60–79), cả `isNsaidHardContraindicated` (dòng 303–313) lẫn `isNsaidAvoidedInGout` (dòng 315–323) đều không kiểm tra tổ hợp này. Hệ quả là hệ thống trực tiếp kê mới `START Naproxen` tạo thành bộ ba suy thận cấp ngay trên bệnh nhân đang dùng `Losartan/Irbesartan + Furosemide/Bumetanide`, tự mâu thuẫn với cảnh báo đỏ `ix.triple_whammy` của chính hệ thống; đồng thời không phát lệnh `STOP` nếu bệnh nhân đang uống sẵn NSAID trên nền RASi + lợi tiểu.
- **Bằng chứng**:
  - **Thực nghiệm `evaluate()` (`r2_audit.ts` – Case S1a & S13)**: Đầu vào `age: 68, egfr: 65, currentMeds: [losartan 50 mg, furosemide 40 mg, clarithromycin 500 mg], customInputs: { acuteFlare: true }` -> Kết xuất đồng thời `REC [START] (gout/rec_gout_nsaid_acute_flare) drug=naproxen dose="500 mg x 2 lần/ngày trong 5 ngày"` **VÀ** `ALERTS: [{"id": "ix.triple_whammy", "severity": "critical", "messageVi": "...Tuyệt đối tránh sử dụng đồng thời NSAID ở bệnh nhân đang dùng RASi kết hợp Lợi tiểu... (Phát hiện: losartan, furosemide, naproxen)"}]`. Case S1b (`enalapril + hydrochlorothiazide + diclofenac, egfr: 55`) -> `STOP: 0`.
  - **Nhãn gốc**: `Arcoxia_SmPC.pdf` (Section 4.5, trang 5): *"Co-administration of ACE inhibitors or Angiotensin II antagonists and agents that inhibit cyclooxygenase in some patients with compromised renal function (e.g. dehydrated patients or elderly patients with compromised renal function) may result in a further deterioration of renal function, including possible acute renal failure"*; `FDA_label_celecoxib.pdf` (Section 5.6 trang 11 & Section 7 trang 20).
- **Hướng sửa**: Bổ sung kiểm tra phối hợp `RASi/ARNI + Lợi tiểu (quai/thiazide/MRA)` vào cả `isNsaidHardContraindicated()` và `isNsaidAvoidedInGout()` để phát lệnh `STOP` NSAID đang dùng và chuyển thuốc cắt cơn / dự phòng sang Corticoid.

---

#### [GOUT-R2-002] `critical` | `rule` | `gout.safety.nsaid_contra / isNsaidHardContraindicated / isNsaidAvoidedInGout / etoricoxib`
- **Vấn đề**:
  1. `isNsaidHardContraindicated` (`rules.ts` dòng 303–313) không kiểm tra `ascvd`, `strokeOrTia`, `customInputs.hasCvd` và huyết áp chưa kiểm soát (`> 140/90 mmHg`), dẫn đến bệnh nhân có bệnh mạch vành / đột quỵ và HA `168/102 mmHg` đang uống `Etoricoxib 120 mg` không nhận được lệnh `STOP` hay bất kỳ cảnh báo nào.
  2. `isNsaidAvoidedInGout` (dòng 315–323) chỉ kiểm tra `conditions.ascvd` mà bỏ sót `conditions.strokeOrTia` và `customInputs.hasCvd` (chính là ô checkbox *"Bệnh tim mạch xơ vữa / Đột quỵ / Suy tim"* trên giao diện Gút tại `inputs.ts` dòng 103!), khiến hệ thống vẫn kê mới `START Naproxen 1000 mg/ngày` cho bệnh nhân đột quỵ/CVD có HA `168/102 mmHg`.
  3. `kb/drugs/etoricoxib.json` thiếu hoàn toàn chống chỉ định `ascvd`, `strokeOrTia`/PAD và THA `> 140/90 mmHg`.
- **Bằng chứng**:
  - **Thực nghiệm `evaluate()` (`r2_audit.ts` – Case S2a & S2b)**:
    - S2a (`ascvd: true, strokeOrTia: true, sbp: 168, dbp: 102, currentMeds: [etoricoxib 120 mg]`) -> `STOP: 0, ALERTS: []`.
    - S2b (`strokeOrTia: true, customInputs.hasCvd: true, sbp: 168, dbp: 102, currentMeds: [clarithromycin], acuteFlare: true`) -> `REC [START] drug=naproxen "500 mg x 2 lần/ngày × 5 ngày"`.
  - **Nhãn gốc**: `Arcoxia_SmPC.pdf` (Section 4.3 Contraindications, trang 3): *"Patients with hypertension whose blood pressure is persistently elevated above 140/90 mmHg and has not been adequately controlled. Established ischaemic heart disease, peripheral arterial disease, and/or cerebrovascular disease."* `BYT_361_2014_Co_Xuong_Khop.pdf` (trang 201): *"Celecoxib... Không nên dùng cho bệnh nhân có tiền sử bệnh tim mạch... Etoricoxib... Nên tránh chỉ định cho bệnh nhân có tiền sử bệnh tim mạch."*
- **Hướng sửa**: Gọi `hasEstablishedCvd(ctx)` và kiểm tra ngưỡng huyết áp chưa kiểm soát trong cả `isNsaidHardContraindicated()` và `isNsaidAvoidedInGout()`; bổ sung chống chỉ định tim mạch và THA `> 140/90` vào `etoricoxib.json`.

---

#### [GOUT-R2-003] `critical` | `drug` | `etoricoxib / celecoxib / gout.safety.nsaid_contra / gout.acute_flare.treatment`
- **Vấn đề**: Bỏ sót hoàn toàn chống chỉ định và giới hạn liều suy gan (`conditions.liverDisease` / Child-Pugh) đối với NSAID/COX-2i. Do `liverDisease` chặn Colchicine (dòng 960) nhưng không chặn NSAID (dòng 303–323), mọi bệnh nhân xơ gan / suy gan (`liverDisease = true`, `eGFR ≥ 60`) bị gút cấp đều bị hệ thống bẻ lái sang kê mới **`START Naproxen 500 mg x 2 lần/ngày`**! Nếu bệnh nhân đang uống sẵn `Etoricoxib 120 mg` (gấp đôi trần Child-Pugh A `60 mg`, gấp 4 lần trần Child-Pugh B `30 mg`, và chống chỉ định tuyệt đối ở Child-Pugh C), hệ thống không `STOP`/`REDUCE` Etoricoxib mà còn kê chồng thêm Naproxen!
- **Bằng chứng**:
  - **Thực nghiệm `evaluate()` (`r2_audit.ts` – Case S9a & S9b)**: BN `liverDisease: true, egfr: 72, acuteFlare: true`, đang dùng `etoricoxib 120 mg` -> `STOP: 0, REDUCE: 0, ALERTS: []`, và xuất `REC [START] drug=naproxen "500 mg x 2 lần/ngày trong 5 ngày"`!
  - **Tài liệu gốc**:
    - `BYT_361_2014_Co_Xuong_Khop.pdf` (Mục 3.2, trang 198): *"Chống chỉ định tuyệt đối [của NSAID]: ... Suy tế bào gan mức độ vừa đến nặng."*
    - `Arcoxia_SmPC.pdf` (Section 4.2 & 4.3, trang 3): Child-Pugh 5–6 tối đa `60 mg/ngày`; Child-Pugh 7–9 tối đa `30 mg/ngày`; Child-Pugh ≥ 10 hoặc albumin `< 25 g/L` chống chỉ định tuyệt đối.
    - `FDA_label_celecoxib.pdf` (Section 2.7 trang 6 & Section 8.6 trang 26): Giảm 50% liều ở Child-Pugh B; không khuyến cáo ở suy gan nặng.
- **Hướng sửa**: Đưa `Boolean(ctx.normalized.conditions?.liverDisease)` vào `isNsaidHardContraindicated()` và `isNsaidAvoidedInGout()` để chuyển bệnh nhân bệnh gan sang Corticoid; bổ sung chống chỉ định & giới hạn liều Child-Pugh vào `etoricoxib.json` và `celecoxib.json`.

---

#### [GOUT-R2-004] `critical` | `rule` | `gout.acute_flare.treatment / gout.prophylaxis.flare / gout.safety.nsaid_contra`
- **Vấn đề**:
  1. **Trùng lặp 2 NSAID toàn thân**: Khi bệnh nhân đang uống `celecoxib 200 mg` (hoặc `etoricoxib`, `ibuprofen`, `diclofenac`, `meloxicam`) có `eGFR ≥ 60` và chống chỉ định Colchicine, `gout.acute_flare.treatment` (dòng 1111) kê thêm `START Naproxen 500 mg x 2 lần/ngày` chồng lên NSAID cũ mà không `STOP` và không có cảnh báo trùng nhóm.
  2. **Phối hợp Corticoid liều cao + NSAID đang dùng ở CKD G3**: Khi bệnh nhân có `eGFR = 45` đang uống `naproxen 500 mg` bị cơn cấp kèm chống chỉ định Colchicine, `gout.safety.nsaid_contra` không `STOP` Naproxen (do chỉ chặn ở `< 30`), trong khi `gout.acute_flare.treatment` kê `START Prednisolone 30–35 mg/ngày` gây cảnh báo đỏ `ix.nsaid_corticosteroid_gi_bleed` (tăng 4–10 lần nguy cơ thủng/xuất huyết dạ dày).
- **Bằng chứng**:
  - **Thực nghiệm `evaluate()` (`r2_audit.ts` – Case S3b & S3a)**:
    - S3b (`celecoxib 200 mg + clarithromycin, egfr: 75, acuteFlare: true`) -> `STOP: 0, ALERTS: []`, `REC [START] drug=naproxen "500 mg x 2 lần/ngày"`.
    - S3a (`naproxen 500 mg + clarithromycin, egfr: 45, acuteFlare: true`) -> `STOP: 0`, `REC [START] drug=prednisolone "30–35 mg/ngày"` kèm `CRITICAL ALERT ix.nsaid_corticosteroid_gi_bleed`.
  - **Tài liệu gốc**: `BYT_361_2014_Co_Xuong_Khop.pdf` (trang 199: *"kết hợp hai loại thuốc chống viêm không steroid (một cách sai lầm)"*); `Arcoxia_SmPC.pdf` (Section 4.4 trang 4: *"The use of etoricoxib with concomitant NSAIDs other than acetylsalicylic acid should be avoided"*).
- **Hướng sửa**: Phát lệnh `STOP` NSAID đang dùng ở CKD G3 (`eGFR < 60`) hoặc bất cứ khi nào chuyển sang kê `Prednisolone`; chặn kê chồng `Naproxen` khi bệnh nhân đã có sẵn một NSAID khác trong `currentMeds` và bổ sung quy tắc tương tác toàn cục chống trùng lặp 2 NSAID.

---

#### [GOUT-R2-005] `critical` | `rule` | `gout.safety.colchicine_contra / checkColchicineSafety / colchicine`
- **Vấn đề**: Danh sách chất ức chế CYP3A4 / P-gp trong `rules.ts` (dòng 41–49) và `kb/drugs/colchicine.json` thiếu nhiều thuốc nguy kịch và phân loại sai mức độ so với Bảng 1 của nhãn gốc FDA Colcrys:
  1. Bỏ sót hoàn toàn **`ranolazine`** (ức chế P-gp mạnh ngang hàng `cyclosporine`), **`posaconazole`**, **`voriconazole`**, các thuốc kháng HIV protease/booster (**`atazanavir`, `darunavir`, `lopinavir`, `indinavir`, `nelfinavir`, `saquinavir`, `tipranavir`, `cobicistat`**), `telithromycin`, và các chất ức chế CYP3A4 vừa phổ biến là **`fluconazole`, `aprepitant`, `fosamprenavir`, `amprenavir`**.
  2. Xếp nhầm **`erythromycin`** vào `STRONG_CYP3A4_PGP_INHIBITORS` (nhãn FDA xếp `erythromycin` là chất ức chế CYP3A4 **vừa**).
  3. Trong `kb/drugs/colchicine.json` (dòng 130), gom **`cyclosporine`** vào mục *"Chất ức chế P-glycoprotein / CYP3A4 vừa (cyclosporine, verapamil, diltiazem)"*, làm sai lệch bản chất ức chế P-gp mạnh gây tử vong của cyclosporine.
- **Bằng chứng**:
  - **Thực nghiệm `evaluate()` (`r2_audit.ts` – Case S4b)**: BN CKD G3b (`egfr: 35`) đang dùng `fluconazole 200 mg + ranolazine 500 mg`, `acuteFlare: true` -> Hệ thống xuất `REC [START] drug=colchicine "1 mg ngay khi khởi phát cơn, sau đó 0.5 mg sau 1 giờ"`, `ALERTS: []` (bỏ lọt chống chỉ định tuyệt đối gây ngộ độc suy tủy/tử vong!).
  - **Nhãn gốc**: `FDA_label_colchicine.pdf` (Section 2.6 Table 1 trang 6 & Section 4 trang 10); `EULAR_2016_Gout_Recommendations.pdf` (trang 3 & 5).
- **Hướng sửa**: Cập nhật đầy đủ hai mảng `STRONG_CYP3A4_PGP_INHIBITORS` và `MODERATE_CYP3A4_INHIBITORS` (chuyển `erythromycin` sang nhóm vừa; thêm `ranolazine`, azoles, PIs vào nhóm mạnh; thêm `fluconazole`, `aprepitant`, `fosamprenavir` vào nhóm vừa) và tách riêng `cyclosporine`/`ranolazine` trong `colchicine.json`.

---

#### [GOUT-R2-006] `critical` | `rule` | `gout.prophylaxis.flare / gout.acute_flare.treatment / colchicine`
- **Vấn đề**: Không kiểm tra tương tác bệnh cơ / tiêu cơ vân cấp giữa `Colchicine` với **Statin** và **Fibrate (`fenofibrate`, `gemfibrozil`)**, đặc biệt trên bệnh nhân suy thận (`eGFR < 60`). Khi bệnh nhân CKD G3b (`eGFR = 35`) đang uống `simvastatin 40 mg + fenofibrate 145 mg`, `gout.prophylaxis.flare` vẫn kê mới `START Colchicine 0.5–1 mg/ngày` trong 3–6 tháng (`warnings: []`), tự mâu thuẫn với cảnh báo đỏ `ix.statin_colchicine` (*"Tránh phối hợp ở bệnh nhân có suy thận hoặc suy gan"*); còn tương tác với nhóm Fibrate bị bỏ sót hoàn toàn ở cả module Gút lẫn KB toàn cục.
- **Bằng chứng**:
  - **Thực nghiệm `evaluate()` (`r2_audit.ts` – Case S4)**: `egfr: 35, currentMeds: [simvastatin 40 mg, fenofibrate 145 mg]` -> `REC [START] drug=colchicine "0.5–1 mg/ngày"` kèm `CRITICAL ALERT ix.statin_colchicine` (và không phát hiện `fenofibrate`).
  - **Nhãn gốc & Guideline**: `FDA_label_colchicine.pdf` (Section 5.4 trang 11 & Table 4 trang 13: *"HMG-CoA reductase inhibitors... and fibrates (fenofibrate, gemfibrozil) may potentiate the development of myopathy... Cases of myopathy, including rhabdomyolysis (including a fatality) have been reported"*); `EULAR_2016_Gout_Recommendations.pdf` (Rec 4, trang 3 & 6).
- **Hướng sửa**: Bổ sung kiểm tra `STATIN_DRUG_IDS` và `FIBRATE_DRUG_IDS` trong `rules.ts` (tránh kê Colchicine dự phòng kéo dài khi phối hợp Statin/Fibrate trên nền CKD `eGFR < 60` hoặc bệnh gan; nếu dùng ở thận bình thường bắt buộc gắn cảnh báo theo dõi CK/đau cơ) và thêm tương tác Fibrate vào `colchicine.json`.

---

#### [GOUT-R2-007] `critical` | `rule` | `gout.prophylaxis.flare / colchicine`
- **Vấn đề**: Hai lỗi liều dự phòng Colchicine ở bệnh nhân CKD (`rules.ts` dòng 2365–2373):
  1. Ở **CKD giai đoạn 3 (`eGFR 30–59`)**: Hệ thống vẫn kê liều đầy đủ **`0.5–1 mg/ngày`**, vượt quá trần **`0.5 mg/ngày`** trong chính `colchicine.json` (dòng 57) và `goutMatrix` (`G3a/G3b`), trái với BYT 361/2014 & EULAR 2016.
  2. Ở **CKD giai đoạn 4 (`eGFR 15–29`)** (hoặc khi dùng cùng Verapamil/Diltiazem) trên **profile `VN`**: Hệ thống kê **`0.3 mg x 1 lần/ngày`**. Tại Việt Nam chỉ lưu hành viên nén `1 mg` (bẻ đôi được `0.5 mg`), hoàn toàn không có viên `0.6 mg` (Colcrys Mỹ) nên **không thể chia liều `0.3 mg`**, đồng thời EULAR 2016 khuyến cáo tránh dùng Colchicine khi `eGFR < 30 mL/phút`.
- **Bằng chứng**:
  - **Thực nghiệm `evaluate()` (`r2_audit.ts`)**: Case S4/S10/S12 (`egfr: 35, 52, 50`) -> `dose="0.5–1 mg/ngày"`; Case S5a (`egfr: 22, profile: 'VN'`) -> `dose="0.3 mg x 1 lần/ngày"`.
  - **Guideline**: `EULAR_2016_Gout_Recommendations.pdf` (Rec 2 & 4, trang 3 & 6); `BYT_361_2014_Co_Xuong_Khop.pdf` (trang 93).
- **Hướng sửa**: Giới hạn dự phòng ở CKD G3 (`30 ≤ eGFR < 60`) hoặc tuổi `> 70` tối đa `0.5 mg/ngày`; ở CKD G4 (`15 ≤ eGFR < 30`) tránh dùng Colchicine theo EULAR 2016 (hoặc trên profile `VN` khi cần giảm liều tương tác CYP3A4 vừa thì dùng `0.5 mg cách ngày` thay vì `0.3 mg/ngày`).

---

#### [GOUT-R2-008] `critical` | `rule` | `gout.allopurinol.uptitrate / gout.febuxostat.manage / gout.uricosuric.probenecid / gout.uricosuric.benzbromarone`
- **Vấn đề**: Cả 4 quy tắc quản lý ULT đều bỏ qua liều hiện tại (`currentMeds[].dose`), gây 3 hệ lụy:
  1. Bệnh nhân **đã uống kịch trần liều tối đa** (`Allopurinol 800 mg`, `Febuxostat 80 mg`, `Probenecid 2000 mg`, `Benzbromarone 200 mg`) nhưng chưa đạt đích urat vẫn bị phát lệnh **`UPTITRATE` vượt quá liều tối đa** thay vì chuyển đổi thuốc (`SWITCH` XOI / phối hợp uricosuric / pegloticase theo ACR 2020 Table 5).
  2. Bệnh nhân suy thận nặng (`eGFR = 20`) đang uống **`Febuxostat 80 mg/ngày`** (vượt gấp đôi trần FDA `40 mg/ngày`!) có `uricAcid = 310 µmol/L` vẫn bị phát lệnh **`CONTINUE` ("Duy trì liều hiện tại")** thay vì `REDUCE` xuống `≤ 40 mg/ngày`.
  3. Bệnh nhân CKD G5 (`eGFR = 12`) đang uống `Allopurinol 100 mg/ngày` bị chỉ định **`"Tăng thêm 100 mg mỗi 2–5 tuần (tối đa 800 mg/ngày)"`**, nhảy bậc quá lớn (`100 mg` thay vì `≤ 50 mg` ở CKD) và mâu thuẫn trực tiếp với trần G4 (`200 mg`) / G5 (`100 mg`) trên `allopurinol.json` & `goutMatrix`!
- **Bằng chứng**:
  - **Thực nghiệm `evaluate()` (`r2_audit.ts` – Cases S6a, S6b, S5b)**: Xem kết xuất nguyên văn tại `r2_audit.ts`.
  - **Nhãn gốc & Guideline**: `FDA_label_febuxostat.pdf` (Section 2.2 trang 3); `FDA_label_allopurinol.pdf` (trang 10–11); `ACR_2020_Gout_Guideline.pdf` (trang 8 & Table 5 trang 31).
- **Hướng sửa**: Kiểm tra `activeMed.dose` so với `maxDose` (và trần thận `severeRenalMax` của Febuxostat) để phát lệnh `SWITCH`/`CONSIDER` khi đã kịch trần và `REDUCE` khi vượt trần thận; giảm bậc chuẩn độ Allopurinol xuống `≤ 50 mg` khi `eGFR < 60` và đồng bộ chú giải trần liều thận giữa `rules.ts` và `allopurinol.json`.

---

#### [GOUT-R2-009] `critical` | `missing` | `gout.safety.duplicate_xoi (allopurinol + febuxostat)`
- **Vấn đề**: Không phát hiện kê trùng lặp 2 thuốc ức chế Xanthine Oxidase (`Allopurinol` + `Febuxostat`). Khi `currentMeds` có cả hai thuốc, hệ thống kích hoạt đồng thời cả `gout.allopurinol.uptitrate` lẫn `gout.febuxostat.manage`, khuyên bác sĩ **tăng liều cả Allopurinol và Febuxostat cùng lúc** (`STOP: 0`, `ALERTS: []`).
- **Bằng chứng**:
  - **Thực nghiệm `evaluate()` (`r2_audit.ts` – Case S7)**: `currentMeds: [allopurinol 300 mg, febuxostat 40 mg], uricAcid: 420` -> Xuất đồng thời `REC [UPTITRATE] Allopurinol` và `REC [UPTITRATE] Febuxostat lên 80 mg/ngày`.
  - **Guideline**: `EULAR_2016_Gout_Recommendations.pdf` (Rec 9 trang 3 & 7–8); `ACR_2020_Gout_Guideline.pdf` (Table 5 trang 31).
- **Hướng sửa**: Bổ sung cổng an toàn `gout.safety.duplicate_xoi` (và quy tắc tương tác toàn cục `ix.duplicate_xoi`) phát lệnh `STOP` một trong hai XOI và chặn `uptitrate` cho tới khi giải quyết trùng lặp.

---

### Nhóm B — Các Phát hiện Mức `MAJOR` (10 phát hiện)

#### [GOUT-R2-010] `major` | `drug` | `benzbromarone / gout.uricosuric.benzbromarone`
- **Vấn đề**: (1) Cho phép khởi trị `START Benzbromarone` trên profile `US` dù thuốc không được FDA phê duyệt tại Mỹ; (2) Cho phép khởi trị ngay trong cơn gút cấp trên profile `INTL`/`US`, vi phạm chống chỉ định/thận trọng bắt buộc của tờ HDSD gốc Desuric SmPC; (3) `benzbromarone.json` thiếu Cảnh báo hộp đen viêm gan hủy tế bào tối cấp gây tử vong (yêu cầu LFT nền bình thường, giám sát men gan chặt 6 tháng đầu, ngừng vĩnh viễn khi transaminase > ULN), thiếu chống chỉ định phối hợp thuốc độc gan (đặc biệt kháng lao pyrazinamide), porphyria gan, tăng urat niệu `≥ 600–700 mg/24h`, và không trích dẫn `Desuric_benzbromarone_SmPC.pdf`; (4) Ghi sai độc tính quái thai trong `pregnancy`.
- **Bằng chứng**: Thực nghiệm Case S8 (`profile: 'US', acuteFlare: true` -> `REC [START] Benzbromarone 50 mg/ngày`); `Desuric_benzbromarone_SmPC.pdf` (trang 1–2); `BYT_361_2014_Co_Xuong_Khop.pdf` (trang 94).
- **Hướng sửa**: Chặn `START` Benzbromarone trên profile `US` và trong `acuteFlare`; cập nhật đầy đủ cảnh báo hộp đen gan, chống chỉ định, thai kỳ (`avoid`) và trích dẫn `Desuric_benzbromarone_SmPC.pdf`.

#### [GOUT-R2-011] `major` | `matrix` | `goutMatrix / probenecid`
- **Vấn đề**: Mâu thuẫn trực tiếp tại cột `G3a (45–59)` của Probenecid: `goutMatrix` hiển thị `initiate: "rec", dose: "500–2000 mg/ngày"` (do `probenecid.json` đặt mốc `50` và `matrix.ts` lấy mẫu tại `getCell(50)`), trong khi `rules.ts` phát lệnh `AVOID` cho mọi bệnh nhân có `eGFR < 60`!
- **Bằng chứng**: Thực nghiệm Case S12 (`egfr: 50` -> `REC [AVOID] rec_gout_probenecid_avoid_ckd3` vs `goutMatrix.g3a` `init=rec`); `ACR_2020_Gout_Guideline.pdf` (Table 2 trang 28); `KDIGO_2024_CKD_Executive_Summary.pdf` (PP 3.14.2 trang 12).
- **Hướng sửa**: Đổi mốc dải thận trong `probenecid.json` từ `50` thành `60` (`eGFRFrom: 60 -> rec`; `30–60 -> caution/avoid`, ưu tiên XOI).

#### [GOUT-R2-012] `major` | `matrix` | `goutMatrix / allopurinol / febuxostat / colchicine`
- **Vấn đề**: (1) Ô `Lọc máu (HD/PD)` của Allopurinol và Febuxostat sao chép nguyên dải G5 không lọc máu (thiếu hướng dẫn liều Allopurinol sau thẩm tách máu và thiếu lưu ý FDA chưa nghiên cứu Febuxostat trên bệnh nhân lọc máu); (2) 9 thuốc trong `DIALYSIS_CONTRA_DRUGS` hiển thị chuỗi `"Chống chỉ định khi eGFR < 30 mL/phút"` trong cột Lọc máu và mất trường `note`; đồng thời dải `< 15`/lọc máu của Colchicine chỉ dẫn `fda.colchicine.renal_and_cyp3a4` (vốn chỉ chống chỉ định khi kèm chất ức chế CYP3A4/P-gp); (3) Ô `G4` của Colchicine cho phép cắt cơn nhưng `rules.ts` chặn hoàn toàn ở `eGFR < 30`, còn ô `G3a/G3b` lại thiếu hướng dẫn liều cắt cơn và quy tắc không lặp lại trong 14 ngày.
- **Bằng chứng**: Kết xuất `goutMatrix` (`r2_audit.ts`); `FDA_label_febuxostat.pdf` (trang 10, 14); `FDA_label_colchicine.pdf` (trang 9–10); `EULAR_2016_Gout_Recommendations.pdf` (trang 3).
- **Hướng sửa**: Thiết kế dữ liệu lọc máu chuyên biệt trong `matrix.ts` / `DrugEntry.renal`, bảo toàn `note`, và đồng bộ dải G3/G4/G5 của `colchicine.json` với `rules.ts` kèm trích dẫn EULAR 2016.

#### [GOUT-R2-013] `major` | `rule` | `gout.prophylaxis.flare / isUltNewlyStartedOrUptitrated`
- **Vấn đề**: (1) `isUltNewlyStartedOrUptitrated()` (`rules.ts` dòng 405–422) bỏ quên `probenecid` và `benzbromarone`, khiến bệnh nhân tăng liều (`UPTITRATE`) hai thuốc này không được kê dự phòng chống viêm 3–6 tháng; (2) Khi dự phòng bằng `Prednisolone` (`rec_gout_steroid_prophylaxis` dòng 2448), trường `dose` chỉ ghi `"Liều thấp uống buổi sáng sau ăn trong 3–6 tháng"` mà không có con số mg cụ thể (ví dụ `≤ 5–7.5 mg/ngày` hoặc `≤ 10 mg/ngày`).
- **Bằng chứng**: Thực nghiệm Case S11 (`probenecid 500 mg, uricAcid: 460` -> `UPTITRATE` nhưng `START: 0`) & Case S5b (`dose="Liều thấp..."`); `ACR_2020_Gout_Guideline.pdf` (Table 2 trang 28); `Desuric_benzbromarone_SmPC.pdf` (trang 1).
- **Hướng sửa**: Bổ sung `probenecid` & `benzbromarone` vào `isUltNewlyStartedOrUptitrated()` và thêm ngưỡng mg cụ thể cho Prednisolone dự phòng liều thấp.

#### [GOUT-R2-014] `major` | `citation` | `eular.gout.2016.benzbromarone_egfr30 / byt.gout.2014.pregnancy_contra / byt.gout.2014.nsaid_agents`
- **Vấn đề**: Vi phạm có hệ thống quy tắc trích dẫn QA-7:
  1. Gắn nhầm trích dẫn `eular.gout.2016.benzbromarone_egfr30` (chỉ nói về Benzbromarone!) cho dải `eGFR < 30` của **cả 6 thuốc NSAID**, `probenecid`, và các ngưỡng `gout.febuxostat.severe_renal_*`, `gout.nsaid.egfr_contra_min`.
  2. Gắn nhầm `byt.gout.2014.nsaid_agents` vào dải suy thận của `probenecid.json` (dòng 64).
  3. Gắn `byt.gout.2014.pregnancy_contra` cho khẳng định *"thiểu ối từ tuần 20 và đóng ống động mạch từ tuần 30"* trên cả 6 NSAID (trong khi BYT 361/2014 trang 198 chỉ viết *"ba tháng đầu hoặc ba tháng cuối"*, còn cảnh báo tuần 20 thiểu ối nằm ở `FDA_label_celecoxib.pdf` trang 2, 12, 22 nhưng không được trích dẫn!), đồng thời gắn sai `byt.gout.2014.pregnancy_contra` cho Colchicine và các thuốc ULT (BYT 2014 bài Gút trang 89–94 không có câu nào về thai kỳ).
  4. Lưu ý thư viện nguồn: `FDA_label_probenecid.pdf` là viên phối hợp ORLYNVAH (sulopenem + probenecid trị uUTI) và `FDA_label_diclofenac.pdf` là gel bôi 1% OTC.
- **Bằng chứng**: Đối chiếu nguyên văn `EULAR_2016_Gout_Recommendations.pdf` (trang 3), `BYT_361_2014_Co_Xuong_Khop.pdf` (trang 89–94, 198), `FDA_label_celecoxib.pdf` (trang 2, 12, 22) và `Arcoxia_SmPC.pdf` (trang 3, 8).
- **Hướng sửa**: Gắn đúng `eular.gout.2016.colchicine_nsaid_contra`, `FDA_label_celecoxib.pdf` và `Arcoxia_SmPC.pdf` cho các khẳng định tương ứng; gỡ bỏ mọi trích dẫn chéo sai thuốc/sai niên đại.

#### [GOUT-R2-015] `major` | `drug` | `febuxostat / probenecid / colchicine / gout.safety.pregnancy_ult`
- **Vấn đề**: Ghi sai phân tầng thai kỳ/cho con bú của nhãn FDA: `febuxostat.json` ghi `avoid` cho cả `pregnancy` và `lactation` kèm chữ `(FDA Label)` dù nhãn FDA ULORIC (trang 9–10) không hề khuyến cáo tránh dùng tuyệt đối (`caution`); `rules.ts` phát `STOP` Probenecid với cổng `contra` dẫn `fda.probenecid.pregnancy` dù nhãn FDA ghi nhận hàng thập kỷ sử dụng an toàn (`caution`); `colchicine.json` xếp `avoid` trong khi cùng văn bản FDA Category C ở `allopurinol.json` lại xếp `caution`.
- **Bằng chứng**: `FDA_label_febuxostat.pdf` (Section 8.1 & 8.2 trang 9–10); `FDA_label_probenecid.pdf` (Section 8.1 trang 7); `FDA_label_colchicine.pdf` (Section 8.1 trang 14).
- **Hướng sửa**: Chuẩn hóa `status: "caution"` khớp trung thực với nhãn FDA và đổi cổng `contra` trong `gout.safety.pregnancy_ult` thành trì hoãn chọn lọc (`avoid`/`caution`) vì gút mạn không phải chỉ định cấp cứu trong thai kỳ.

#### [GOUT-R2-016] `major` | `drug` | `probenecid`
- **Vấn đề**: `probenecid.json` thiếu chống chỉ định tuyệt đối phối hợp **`ketorolac`** (tăng gấp 3 AUC ketorolac), thiếu tương tác tăng gấp đôi phơi nhiễm **`indomethacin`, `naproxen`, `ketoprofen`** và mất tác dụng do **salicylate liều cao**, thiếu cảnh báo thiếu máu tán huyết ở người **thiếu men G6PD / loạn tạo máu**, hoại tử gan và tăng acid uric niệu `> 600 mg/24h`.
- **Bằng chứng**: `FDA_label_probenecid.pdf` (Section 4 trang 3, Section 6.2 trang 6, Section 7.1 trang 6–7); `BYT_361_2014_Co_Xuong_Khop.pdf` (trang 94).
- **Hướng sửa**: Bổ sung đầy đủ các chống chỉ định và tương tác qua OAT1/OAT3 vào `probenecid.json`.

#### [GOUT-R2-017] `major` | `drug` | `celecoxib / etoricoxib`
- **Vấn đề**: `celecoxib.json` thiếu chống chỉ định dị ứng **Sulfonamide**, phẫu thuật **CABG**, hen nhạy cảm Aspirin, thiếu giảm **50% liều** ở người mang kiểu gen **`CYP2C9*3/*3`** và khi phối hợp **`Fluconazole`**, chưa ghi chú off-label FDA cho gút cấp; `etoricoxib.json` thiếu chống chỉ định **IBD**, hen do Aspirin, trẻ `< 16 tuổi`, tương tác tăng **50–60% Ethinylestradiol** và lưu ý không được FDA cấp phép tại Mỹ.
- **Bằng chứng**: `FDA_label_celecoxib.pdf` (trang 1, 2, 7, 20, 26); `Arcoxia_SmPC.pdf` (trang 3, 6).
- **Hướng sửa**: Cập nhật đầy đủ `contraindications`, `interactions` và ghi chú pháp quy vào `celecoxib.json` và `etoricoxib.json`.

#### [GOUT-R2-018] `major` | `rule` | `gout.concurrent.switch_thiazide`
- **Vấn đề**: Quy tắc đổi Thiazide sang Losartan (`rules.ts` dòng 2499–2503) chỉ kiểm tra cờ `conditions.hyperkalemia` mà quên kiểm tra giá trị xét nghiệm `need(ctx, 'k') > 5.0`. Khi bệnh nhân có `k = 5.6 mmol/L`, rule vẫn chọn nhánh Losartan rồi bị cổng toàn cục chặn thành `HOLD Losartan (K⁺ = 5.6 > 5.5 mmol/L)`, làm bệnh nhân mất luôn khuyến cáo đổi HCTZ sang `Amlodipine (CCB)`!
- **Bằng chứng**: Thực nghiệm Case S10 (`k: 5.6, currentMeds: [hydrochlorothiazide 25 mg]` -> `REC [HOLD] TẠM HOÃN Losartan`, mất nhánh `rec_gout_switch_thiazide_ccb`).
- **Hướng sửa**: Kiểm tra `const kVal = need(ctx, 'k');` (`kVal !== undefined && kVal > 5.0`) trong `hasAngioedemaOrRasContra` để tự động bẻ sang nhánh đổi sang Chẹn kênh Canxi (`Amlodipine`).

#### [GOUT-R2-019] `major` | `drug` | `colchicine / allopurinol / febuxostat`
- **Vấn đề**: (1) `colchicine.json` có `titration` giả tạo (`step: 0.5 mg` mỗi `7 ngày`, `maxDose: 1.2 mg/ngày` tự mâu thuẫn với liều ngày đầu 1.5–1.8 mg) và `vnBrands` ghi `"Colcrys"` (0.6 mg Mỹ, không lưu hành tại VN); (2) `allopurinol.json` thiếu biệt dược gốc **`"Zyloric"`**, thiếu trần `900 mg/ngày` (EMA/EULAR), thiếu tương tác `Thiazide + suy thận` (tăng nguy cơ SCAR), `Warfarin`, `Cyclosporine`; (3) `febuxostat.json` liệt kê viên `120 mg` nhưng `maxDose` chỉ ghi `80 mg/ngày`.
- **Bằng chứng**: `kb/drugs/{colchicine,allopurinol,febuxostat}.json`; `FDA_label_allopurinol.pdf` (trang 4–5); `EULAR_2016_Gout_Recommendations.pdf` (trang 7).
- **Hướng sửa**: Chuẩn hóa `titration`/`maxDose`, bổ sung `"Zyloric"` & các biệt dược thực tế tại Việt Nam, và bổ sung tương tác còn thiếu của Allopurinol.

---

### Nhóm C — Các Phát hiện Mức `MINOR` & `SUGGESTION` (5 phát hiện)

- **[GOUT-R2-020] (`minor` | `drug` | 6 thuốc NSAID/COX-2i)**: Thiếu trường trần liều tối đa trong ngày / số ngày dùng tối đa (`Etoricoxib ≤ 120 mg/ngày × ≤ 8 ngày`, `Diclofenac ≤ 150 mg/ngày`, `Naproxen ≤ 1000–1250 mg/ngày`, `Ibuprofen ≤ 2400–3200 mg/ngày`, `Celecoxib ≤ 400 mg/ngày`, `Indomethacin ≤ 150–200 mg/ngày`), thiếu tương tác cạnh tranh COX-1 với Aspirin liều thấp trong `ibuprofen.json`/`naproxen.json`, và dùng tên biệt dược OTC Mỹ (`Advil`, `Motrin`, `Aleve`, `Indocin`) thay vì biệt dược phổ biến tại Việt Nam (`Brufen`, `Alaxan`, `Gofen`, `Naproxen Stada`, `Indocid`).
- **[GOUT-R2-021] (`minor` | `drug` | `prednisolone / methylprednisolone`)**: `methylprednisolone.json` ghi `inn: "Methylprednisolone sodium succinate"` (chỉ dùng tiêm IV/IM) dù `forms` có viên uống `4 mg, 16 mg` (dạng base tự do), và cả hai tệp mới chỉ mô tả liều cho đợt cấp hen phế quản, chưa có ghi chú liều đường uống cắt cơn gút cấp.
- **[GOUT-R2-022] (`minor` | `rule` | `gout.target.urate`)**: Phát khuyến cáo mục tiêu urat `< 360 µmol/L` suốt đời kèm cổng báo đỏ `CHƯA ĐẠT ĐÍCH` ngay cả trên bệnh nhân cơn gút đầu tiên không biến chứng chưa có chỉ định dùng ULT (`Preset 5: gout_preset_first_flare_mild`), trái với ACR 2020 Table 3 (chỉ áp dụng đích `< 6 mg/dL` cho bệnh nhân có chỉ định / đang dùng ULT).
- **[GOUT-R2-023] (`minor` | `ui` | `presets.ts` dòng 42)**: Chuỗi mô tả `gout_preset_chronic_tophaceous_severe` nội suy cứng `< 300 µmol/L` (EULAR), lệch với kết quả `< 320 µmol/L` (BYT 361/2014 trang 92) khi chạy trên profile mặc định `VN`.
- **[GOUT-R2-024] (`suggestion` | `missing` | `gout.concurrent.*`)**: Đề xuất bổ sung khuyến cáo Bảng 8 ACR 2020 (trang 16 & 34) về việc không thêm/đổi sang Fenofibrate chỉ vì mục đích hạ acid uric máu và cân nhắc ưu tiên Losartan thay ACEi ở bệnh nhân tăng huyết áp đơn thuần kèm gút khi khả thi.

---

## 5. Kết luận Duyệt Vòng 1 (Vai R2 – Dược lâm sàng)

Do tồn tại **9 phát hiện mức `critical`** và **10 phát hiện mức `major`** liên quan trực tiếp đến an toàn kê đơn chống viêm / hạ urat máu trên bệnh nhân đa bệnh lý (Bộ ba nguy hại Triple Whammy, chống chỉ định tim mạch/THA/suy gan của COX-2i & NSAID, trùng lặp 2 NSAID và 2 XOI, thiếu chất ức chế CYP3A4/P-gp & Fibrate với Colchicine, sai lệch liều dự phòng Colchicine ở CKD G3/G4 trên viên 1 mg tại Việt Nam, không kiểm tra trần liều hiện dùng của ULT, mâu thuẫn ma trận thận Probenecid/Allopurinol/Colchicine và gắn chéo sai trích dẫn QA-7), hồ sơ dược lâm sàng Vòng 1 của module Gút chưa đạt tiêu chuẩn an toàn lâm sàng để thông qua.

**KẾT LUẬN CUỐI CÙNG: FAIL**
