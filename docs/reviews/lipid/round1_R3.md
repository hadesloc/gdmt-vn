# BÁO CÁO PHẢN BIỆN AN TOÀN ĐỐI NGHỊCH (ADVERSARIAL SAFETY REVIEW) – VÒNG 1
## Module: Rối Loạn Lipid Máu (`lipid`) – GDMT-VN

> **Reviewer**: R3 – Phản biện an toàn lâm sàng đối nghịch (Adversarial Safety Reviewer)  
> **Phiên bản engine**: 0.1.0  
> **Ngày thực hiện**: 27/10/2026  
> **Quy chuẩn đánh giá**: Tuân thủ [REVIEW_PROTOCOL.md](../../REVIEW_PROTOCOL.md), QA-1 (Fail-closed), QA-7 & QA-8 (KB central access)  
> **Tập dữ liệu kiểm thử**: Bộ 57 ca bệnh nhân đối nghịch thực thi trên hàm `evaluate()` của engine ([run_r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/lipid/scratch/run_r3_adversarial.ts))  
> **Bằng chứng thực nghiệm**: File dữ liệu thô toàn bộ input và output tại [adversarial_raw.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/lipid/scratch/adversarial_raw.json)

---

## 1. Tóm Tắt Kết Quả & Kết Luận Đánh Giá

| Mức độ nghiêm trọng | Số lượng | Tiêu chuẩn chấp thuận | Trạng thái |
|---|:---:|:---:|:---:|
| **CRITICAL** (Nguy cơ gây hại trực tiếp cho người bệnh) | **6** | = 0 | ❌ KHÔNG ĐẠT |
| **MAJOR** (Sai lệch guideline / Thiếu khuyến cáo Class I) | **9** | = 0 | ❌ KHÔNG ĐẠT |
| **MINOR** (Lỗi UI / Sai ngữ nghĩa biến / Trích dẫn / Rationale) | **3** | - | ⚠️ CẦN KHẮC PHỤC |
| **SUGGESTION** (Khuyến nghị hoàn thiện tính năng) | **0** | - | - |
| **TỔNG CỘNG** | **18** | - | **KẾT LUẬN: FAIL** |

> [!CAUTION]
> **KẾT LUẬN VÒNG 1: FAIL (KHÔNG ĐẠT)**  
> Module `lipid` hiện tại có **6 lỗi CRITICAL** và **9 lỗi MAJOR**. Các nguy cơ lâm sàng đặc biệt nghiêm trọng gồm có:
> 1. **Khởi trị Atorvastatin 80 mg cho bệnh nhân nhồi máu cơ tim cấp nội viện đang có suy gan cấp (ALT > 5x ULN) hoặc tiêu cơ vân rầm rộ (CK > 18x ULN)** do file nội viện thiếu hoàn toàn các cổng an toàn men gan và men cơ.
> 2. **Bỏ sót không ngừng các thuốc hạ lipid gây quái thai (Fenofibrate, Ezetimibe, Bempedoic acid)** ở phụ nữ mang thai đang dùng thuốc do danh mục an toàn thai kỳ của engine chỉ liệt kê statin.
> 3. **Bỏ sót toàn bộ các tương tác thuốc đe dọa tiêu cơ vân tử vong** khi dùng đồng thời Statin liều cao với Clarithromycin, Cyclosporine, Amiodarone hoặc Colchicine.
> 4. **Không phát hiện liều độc Simvastatin 80 mg/ngày** bị FDA chống chỉ định tuyệt đối, ngược lại còn chỉ định chồng thêm Atorvastatin 80 mg.
> 5. **Khởi trị Bempedoic acid ở bệnh nhân đang bị đợt gút cấp và acid uric máu tăng vọt (580 µmol/L)** mà không hề có bất kỳ cảnh báo hay cổng an toàn urat nào.
> 6. **Bỏ sót cấp cứu tiêu cơ vân (CK > 10x ULN)**, chỉ phát lệnh tạm hoãn nhẹ như mức CK > 4x ULN.
> 7. **Bỏ sót hoàn toàn khuyến cáo Class I phối hợp Ezetimibe / PCSK9i** ở bệnh nhân nguy cơ rất cao đang dùng Atorvastatin 80 mg mà LDL vẫn cách xa đích (2.4 mmol/L), ngược lại phát lệnh START lặp lại Atorvastatin 80 mg.
>
> Module **bắt buộc phải được sửa đổi toàn diện** trước khi có thể chuyển sang Vòng 2.

---

## 2. Phương Pháp Kiểm Thử Đối Nghịch (Adversarial Methodology)

Reviewer R3 đã thiết kế và thực thi tự động bộ **57 ca bệnh nhân đối nghịch** ([run_r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/lipid/scratch/run_r3_adversarial.ts)), bao phủ 13 trục lâm sàng đa chiều theo đúng yêu cầu điều phối:

1. **Ranh giới đích LDL-C quanh mọi ngưỡng (<1.0, <1.4, <1.8, <2.6, <3.0 mmol/L)**: Kiểm tra các mức 0.9, 1.0, 1.1, 1.39, 1.41, 1.79, 1.81, 2.59, 2.61, 3.01 mmol/L.
2. **Tiêu chuẩn kép (Dual Goal) & Giảm 49% vs 50% so với mức nền**: So sánh giảm 49% vs 50%, và ca đạt nồng độ tuyệt đối < 1.4 mmol/L nhưng chỉ giảm 38.6% so với nền.
3. **Ranh giới tuổi (39, 40, 69, 70, 89, 90 tuổi)**: Khảo sát chuyển đổi thang điểm SCORE2 / SCORE2-OP, tính liều an toàn cho người cao tuổi và người rất cao tuổi.
4. **Đái tháo đường (ĐTĐ)**: Có/không tổn thương cơ quan đích (TOD), thời gian mắc bệnh 3 năm, 12 năm và 25 năm (≥ 20 năm).
5. **Ranh giới chức năng thận CKD (eGFR 29, 30, 59, 60 mL/phút/1.73m²) & Tiểu đạm A3**: Đánh giá bước nhảy phân tầng nguy cơ và an toàn liều Rosuvastatin / Fenofibrate.
6. **Tăng cholesterol máu gia đình (FH) & LDL cực cao (≥ 4.9 mmol/L / ≥ 190 mg/dL)**: Bệnh nhân có DLCN score = 8 và bệnh nhân có LDL 5.5 mmol/L nhưng bác sĩ quên tick cờ FH.
7. **Bệnh cảnh nội viện (Inpatient ACS vs Inpatient Non-ACS)**: ACS trong 24h đầu kèm biến chứng viêm gan cấp / tiêu cơ vân; và bệnh nhân nội viện không phải ACS (suy tim / viêm phổi) có bệnh mạch vành mạn.
8. **Triglycerid máu (1.4, 1.6, 5.5, 5.6, 10.0 mmol/L)**: Ngưỡng phòng viêm tụy cấp, an toàn thận khi dùng Fenofibrate, và điều kiện kê đơn Icosapent ethyl.
9. **Bệnh nhân đang dùng Statin liều tối đa (Atorvastatin 80 mg) mà vẫn xa đích**: Khảo sát khả năng phát hiện thất bại đơn trị liệu và leo thang điều trị bậc 2/3 (Ezetimibe, PCSK9i).
10. **Không dung nạp statin, Bempedoic acid và tương tác Gút / Urat**: Bệnh nhân không dung nạp statin có LDL đã đạt đích, và bệnh nhân gút cấp có nồng độ acid uric máu 580 µmol/L.
11. **Thai kỳ & Thuốc độc phôi thai**: Phụ nữ mang thai đang dùng sẵn Fenofibrate, Ezetimibe, Bempedoic acid hoặc Atorvastatin.
12. **An toàn gan (ALT) & An toàn cơ (CK)**: Các mức ALT 2.9x vs 3.1x ULN; CK 4.2x vs 12x / 18x ULN.
13. **Tương tác thuốc nguy hiểm**: Khởi trị Statin khi đang dùng Clarithromycin, Cyclosporine, Amiodarone, Colchicine.
14. **Đổi profile hướng dẫn (INTL vs US vs VN)**: So sánh sự khác biệt trong hành vi và khuyến cáo.

Toàn bộ kết quả thực thi được xuất chi tiết tại [`docs/reviews/lipid/scratch/adversarial_raw.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/lipid/scratch/adversarial_raw.json).

---

## 3. Top 5 Phát Hiện Nguy Hiểm Nhất (Top 5 Critical Findings)

### 🔴 Top 1: Khởi trị Statin liều cao (Atorvastatin 80 mg) cho bệnh nhân ACS nội viện đang có tổn thương gan cấp (ALT > 5x) hoặc tiêu cơ vân rầm rộ (CK > 18x) ([R3-LIPID-01](#r3-lipid-01))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân nhồi máu cơ tim cấp nội viện nhập viện trong 24 giờ đầu có biến chứng suy gan cấp tính do thiếu máu cục bộ (ALT = 5.2 lần ULN) hoặc kèm tiêu cơ vân do chấn thương dập cơ (CK = 18 lần ULN). Hệ thống đưa ra khuyến cáo: `[START] Atorvastatin 80 mg: Khởi trị Atorvastatin liều cao sớm trong 24h đầu ACS`! Không hề có cảnh báo hay lệnh hoãn nào!
- **Cơ chế**: File `rules.inpatient.ts` chỉ có quy tắc kích hoạt `lipid.inpatient.acs_early_statin` dựa trên cờ `acuteAcsWithin24h`, hoàn toàn không có mệnh đề kiểm tra `altUlnTimes` hay `ckUlnTimes`. Trong khi đó, các luật an toàn men gan (`lipid.safety.alt_elevation`) và men cơ (`lipid.safety.ck_elevation`) được viết trong file `rules.outpatient.ts` với thuộc tính `setting: 'outpatient'`. Do đó, khi `settings.setting === 'inpatient'`, engine loại bỏ hoàn toàn các luật an toàn này!
- **Nguy cơ lâm sàng**: Bệnh nhân đang bị hoại tử tế bào gan cấp hoặc tiêu cơ vân cấp nếu tiếp tục nhận Statin liều tối đa 80 mg sẽ bị bùng phát suy gan tối cấp, đông máu nội mạch rải rác (DIC) hoặc hoại tử ống thận cấp do myoglobin niệu dẫn tới tử vong.
- **Khắc phục**: Chuyển các quy tắc kiểm tra an toàn ALT và CK sang `setting: 'both'`. Đồng thời trong quy tắc ACS nội viện bắt buộc thêm điều kiện an toàn:
  ```ts
  const altUln = need(ctx, 'altUlnTimes');
  const ckUln = need(ctx, 'ckUlnTimes');
  if (altUln !== undefined && altUln >= 3) return false;
  if (ckUln !== undefined && ckUln > 4) return false;
  ```

---

### 🔴 Top 2: Bỏ sót không ngừng các thuốc hạ lipid gây quái thai (Fenofibrate, Ezetimibe, Bempedoic acid) ở phụ nữ mang thai ([R3-LIPID-02](#r3-lipid-02))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Phụ nữ mang thai đang sử dụng sẵn Fenofibrate 200 mg, Ezetimibe 10 mg hoặc Bempedoic acid 180 mg. Hệ thống hoàn toàn không phát hiện và **không hề sinh bất kỳ lệnh NGỪNG (STOP)** nào cho các thuốc này; ngược lại chỉ phát sinh `[AVOID] atorvastatin` (một thuốc bệnh nhân không hề dùng)!
- **Cơ chế**: Trong file `src/engine/safety/gates.ts`, danh sách `PREGNANCY_CONTRAINDICATED_DRUGS` chỉ liệt kê các thuốc nhóm Statin (`atorvastatin`, `rosuvastatin`, `simvastatin`, `pravastatin`...), hoàn toàn **bỏ quên** `fenofibrate`, `ezetimibe`, `bempedoic_acid`, `gemfibrozil`. Do đó, cơ chế rà soát tự động thuốc đang dùng (`reviewCurrentMedications` trong `reviewMeds.ts`) để lọt toàn bộ các thuốc này.
- **Nguy cơ lâm sàng**: Fenofibrate và Bempedoic acid qua được hàng rào nhau thai, gây ức chế tổng hợp cholesterol và dẫn truyền lipid thiết yếu cho sự phát triển hệ thần kinh và nội tạng thai nhi, dẫn tới quái thai, thai chết lưu hoặc chậm phát triển trong tử cung.
- **Khắc phục**: Bổ sung ngay các định danh `fenofibrate`, `ezetimibe`, `bempedoic_acid`, `gemfibrozil`, `icosapent_ethyl` vào `PREGNANCY_CONTRAINDICATED_DRUGS` trong `gates.ts`.

---

### 🔴 Top 3: Bỏ sót toàn bộ các tương tác thuốc nguy hiểm đe dọa tiêu cơ vân tử vong giữa Statin và Clarithromycin, Cyclosporine, Amiodarone, Colchicine ([R3-LIPID-03](#r3-lipid-03))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân đang điều trị bằng các thuốc chuyển hóa hoặc ức chế qua CYP3A4 / OATP1B1 gồm Clarithromycin 500 mg x 2 lần/ngày, Cyclosporine 100 mg/ngày, Amiodarone 200 mg/ngày hoặc Colchicine 1 mg/ngày được hệ thống khuyến cáo `[START] Atorvastatin liều cao 80 mg` mà không có bất kỳ cảnh báo tương tác thuốc nào (`plan.alerts = []`).
- **Cơ chế**: Mảng `INTERACTION_RULES` trong `src/engine/safety/interactions.ts` chỉ có duy nhất một luật tương tác hạ lipid là `ix.statin_fibrate_myopathy` (Statin + Gemfibrozil). Toàn bộ các tương tác dược động học kinh điển và nguy hiểm hàng đầu của Statin với các thuốc ức chế mạnh men gan (Clarithromycin, Ketoconazole) hay thuốc ức chế miễn dịch (Cyclosporine) bị bỏ trống 100%.
- **Nguy cơ lâm sàng**: Clarithromycin ức chế mạnh CYP3A4 làm tăng nồng độ Atorvastatin tự do trong huyết tương lên 4–10 lần. Phối hợp này là nguyên nhân hàng đầu gây tiêu cơ vân kịch phát, suy thận cấp và ngừng tim do tăng kali máu đã được cảnh báo hộp đen (FDA Black Box).
- **Khắc phục**: Bổ sung vào `INTERACTION_RULES` các quy tắc tương tác nghiêm trọng:
  - `ix.statin_cyp3a4_strong`: Atorvastatin / Simvastatin / Lovastatin + Clarithromycin / Erythromycin / Ketoconazole (mức critical: Tạm ngừng statin trong thời gian dùng kháng sinh).
  - `ix.statin_cyclosporine`: Statin + Cyclosporine (mức critical: Giới hạn Rosuvastatin ≤ 5 mg/ngày, tránh dùng Atorvastatin liều cao).
  - `ix.statin_colchicine`: Statin + Colchicine (mức warning: Nguy cơ ngộ độc cơ, theo dõi sát CK).

---

### 🔴 Top 4: Bỏ sót không ngừng liều độc Simvastatin 80 mg/ngày bị FDA chống chỉ định, ngược lại còn chỉ định START thêm Atorvastatin 80 mg ([R3-LIPID-04](#r3-lipid-04))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân đang sử dụng Simvastatin 80 mg/ngày ngoại trú. Hệ thống không hề có lệnh `STOP` Simvastatin 80 mg, không cảnh báo chống chỉ định liều độc; ngược lại khi thấy LDL chưa đạt đích, hệ thống phát sinh lệnh: `[START] Atorvastatin 80 mg/ngày`, khiến bệnh nhân đối mặt nguy cơ uống đồng thời cả 2 statin liều tối đa!
- **Cơ chế**: File `src/engine/safety/reviewMeds.ts` không có quy tắc quét liều trần nguy hiểm của thuốc hạ lipid. Trong khi đó, bộ kiểm tra trùng lặp `checkDuplicates` chỉ phát ra một cảnh báo `warning` thông thường ("Trùng lặp 2 thuốc nhóm Statin"), hoàn toàn không chặn được hành động `START Atorvastatin 80 mg`.
- **Nguy cơ lâm sàng**: Liều Simvastatin 80 mg đã bị FDA cấm khởi trị và cấm tăng liều từ năm 2011 do tỷ lệ tiêu cơ vân tăng gấp nhiều lần so với các statin khác. Việc cho thêm Atorvastatin 80 mg sẽ kích hoạt phản ứng tiêu cơ vân ồ ạt đe dọa trực tiếp tính mạng bệnh nhân.
- **Khắc phục**: Trong `reviewMeds.ts`, bổ sung kiểm tra: Nếu `currentMeds` có Simvastatin liều ≥ 80 mg, phát sinh ngay khuyến cáo `[STOP] Simvastatin 80 mg` hoặc `[SWITCH] sang Atorvastatin 40–80 mg / Rosuvastatin 20–40 mg`.

---

### 🔴 Top 5: Khởi trị Bempedoic acid ở bệnh nhân Gút cấp và Acid Uric máu tăng rất cao (580 µmol/L) không có cổng an toàn urat ([R3-LIPID-05](#r3-lipid-05))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân không dung nạp statin, đang bị viêm khớp gút cấp tính, nồng độ acid uric máu rất cao (580 µmol/L), đang uống Colchicine. Hệ thống phát lệnh: `[START] Bempedoic acid 180 mg/ngày` mà không có bất kỳ cổng an toàn (gate), không có cảnh báo tăng acid uric và không kiểm tra tiền sử gút!
- **Cơ chế**: Luật `lipid.statin_intolerance.bempedoic` trong `rules.outpatient.ts` chỉ kiểm tra điều kiện `statinIntolerance && ldl !== undefined`. Thuộc tính `patient.conditions?.gout` và trường `patient.urat` bị bỏ qua hoàn toàn.
- **Nguy cơ lâm sàng**: Bempedoic acid ức chế chất vận chuyển anion hữu cơ 2 (OAT2) ở ống thận làm giảm bài tiết acid uric, dẫn đến tăng acid uric máu ở 26% bệnh nhân và khởi phát cơn gút cấp dữ dội ở những người có tiền sử gút (theo nhãn FDA và thử nghiệm CLEAR Outcomes). Kê đơn Bempedoic acid trong đợt gút cấp sẽ làm bệnh bùng phát ác tính và tăng nguy cơ sỏi thận urat.
- **Khắc phục**: Thêm cổng an toàn urat vào luật Bempedoic acid: Nếu `patient.conditions?.gout === true` hoặc `patient.urat > 420 µmol/L`, chuyển action sang `DEFER` hoặc `CAUTION` kèm Gate Urate: passed=false và khuyến cáo kiểm soát acid uric trước khi khởi trị Bempedoic acid.

---

## 4. Bảng Chi Tiết Toàn Bộ 18 Phát Hiện (Findings Catalog)

| Mã ID | Mức độ | Phân loại | Mã quy tắc / Vị trí | Tóm tắt lỗi | Bằng chứng (Test Case / Mã nguồn) | Khắc phục đề xuất |
|---|:---:|:---:|---|---|---|---|
| **R3-LIPID-01** | `CRITICAL` | `rule` | `lipid.inpatient.acs_early_statin` | Khởi trị Statin liều cao cho BN ACS nội viện có tổn thương gan cấp (ALT > 5x) hoặc tiêu cơ vân (CK > 18x) | BN ADV_LIPID_32 (ALT 5.2x) và ADV_LIPID_33 (CK 18x) nhận `[START] Atorvastatin 80 mg` | Thêm cổng kiểm tra ALT < 3x và CK < 4x trong luật nội viện |
| **R3-LIPID-02** | `CRITICAL` | `rule` | `src/engine/safety/gates.ts` | Bỏ sót không ngừng Fenofibrate, Ezetimibe, Bempedoic acid ở phụ nữ mang thai đang dùng thuốc | BN ADV_LIPID_47 (Fenofibrate), 48 (Ezetimibe), 49 (Bempedoic) không nhận lệnh STOP | Thêm các thuốc vào `PREGNANCY_CONTRAINDICATED_DRUGS` |
| **R3-LIPID-03** | `CRITICAL` | `rule` | `src/engine/safety/interactions.ts` | Bỏ sót tương tác Statin + Clarithromycin, Cyclosporine, Amiodarone, Colchicine | BN ADV_LIPID_54, 55, 56, 57 nhận START Atorvastatin 80mg mà không có alert nào | Bổ sung các luật tương tác CYP3A4/OATP1B1 vào `INTERACTION_RULES` |
| **R3-LIPID-04** | `CRITICAL` | `rule` | `src/engine/safety/reviewMeds.ts` | Không ngừng liều độc Simvastatin 80 mg/ngày bị FDA chống chỉ định, kê chồng Atorvastatin 80mg | BN ADV_LIPID_42 nhận `[START] Atorvastatin 80 mg`, chỉ có alert trùng statin | Thêm rà soát liều Simvastatin >= 80mg trong `reviewCurrentMedications` |
| **R3-LIPID-05** | `CRITICAL` | `rule` | `lipid.statin_intolerance.bempedoic` | Khởi trị Bempedoic acid ở BN gút cấp và acid uric máu 580 µmol/L không kiểm tra an toàn | BN ADV_LIPID_44 nhận `[START] Bempedoic acid 180 mg` không có gate hay alert gút | Bổ sung cổng an toàn urat và tiền sử gút cho Bempedoic acid |
| **R3-LIPID-06** | `CRITICAL` | `rule` | `lipid.safety.ck_elevation` | Bỏ sót xử trí tiêu cơ vân ở mức CK > 10x ULN: Chỉ phát lệnh HOLD nhẹ như mức CK > 4x | BN ADV_LIPID_53 (CK 12x ULN) chỉ nhận `[HOLD]` và theo dõi định kỳ | Tách quy tắc CK >= 10x: phát lệnh STOP, REFER cấp cứu bù dịch |
| **R3-LIPID-07** | `MAJOR` | `rule` | `lipid.statin.very_high_risk_initiate` | BN đang dùng Atorvastatin 80mg chưa đạt đích nhận lệnh START Atorvastatin 80mg và bỏ sót Ezetimibe/PCSK9i | BN ADV_LIPID_40 (đang dùng Atorva 80, LDL 2.4) nhận `[START] Atorvastatin 80 mg` | Chuyển thành CONTINUE statin và START Ezetimibe 10mg (Class I) |
| **R3-LIPID-08** | `MAJOR` | `rule` | `rules.outpatient.ts` | Bỏ sót biến cố ASCVD tái phát trong 2 năm: Không áp dụng đích LDL < 1.0 mmol/L | BN ADV_LIPID_01 (LDL 1.0) và 02 (LDL 1.1) không nhận khuyến cáo hạ lipid nào | Nhận diện `recurrentAcsWithin2Years`, áp dụng đích 1.0 mmol/L |
| **R3-LIPID-09** | `MAJOR` | `rule` | `rules.outpatient.ts` | Thiếu hoàn toàn quy tắc điều trị cho Nguy cơ Trung bình (đích 2.6) và Nguy cơ Thấp (đích 3.0) | BN ADV_LIPID_09 và Preset 5 của module nhận 0 khuyến cáo điều trị hạ lipid | Bổ sung quy tắc khởi trị statin trung bình / lối sống cho 2 tầng nguy cơ này |
| **R3-LIPID-10** | `MAJOR` | `rule` | `rules.outpatient.ts` | Bỏ sót tiêu chuẩn giảm kép (Dual Goal >= 50% so với nền): Kết luận sai BN đã đạt đích | BN ADV_LIPID_12 (LDL 1.35 < 1.4 nhưng chỉ giảm 38.6% so với nền 2.2) bị bỏ qua | Tính `% reduction`, cảnh báo chưa đạt giảm 50% dù LDL < 1.4 |
| **R3-LIPID-11** | `MAJOR` | `rule` | `lipid.statin.high_risk_initiate` | Bỏ sót tăng cholesterol cực cao (LDL >= 4.9 mmol/L / 190 mg/dL) nếu không tick cờ FH | BN ADV_LIPID_30 (LDL 5.5 mmol/L, không tick cờ FH) nhận 0 khuyến cáo statin | Tự động xếp Nguy cơ Cao khi LDL >= 4.9 mmol/L |
| **R3-LIPID-12** | `MAJOR` | `rule` | `lipid.statin.very_high_risk_initiate` | Phân tầng sai ĐTĐ kéo dài >= 20 năm: Tụt từ Nguy cơ Rất Cao xuống Nguy cơ Cao | BN ADV_LIPID_23 (ĐTĐ 25 năm, LDL 1.6) không được điều trị do xếp nhầm đích 1.8 | Bổ sung `dmDurationYears >= 20` vào nhóm nguy cơ rất cao |
| **R3-LIPID-13** | `MAJOR` | `rule` | `rules.inpatient.ts` | Cúp hoàn toàn điều trị lipid ở BN nội viện không phải ACS (suy tim, viêm phổi có ASCVD) | BN ADV_LIPID_34 (Nội viện suy tim, ASCVD mạn, LDL 3.2) nhận 0 khuyến cáo | Chuyển các luật đánh giá đích lipid căn bản sang `setting: 'both'` |
| **R3-LIPID-14** | `MAJOR` | `rule` | `lipid.tg.residual_icosapent` | Chỉ định Icosapent ethyl cho bệnh nhân tim mạch xơ vữa CHƯA TỪNG DÙNG STATIN | BN ADV_LIPID_35 (ASCVD, chưa dùng statin, TG 1.6) nhận `[CONSIDER] Icosapent ethyl` | Bắt buộc kiểm tra BN đang điều trị statin trước khi xét Icosapent |
| **R3-LIPID-15** | `MAJOR` | `rule` | `lipid.tg.severe_pancreatitis_prevention` | Phát lệnh AVOID thay vì STOP ở bệnh nhân đang uống Fenofibrate bị suy thận nặng eGFR < 30 | BN ADV_LIPID_39 (đang dùng Fenofibrate, eGFR tụt còn 22) nhận `[AVOID]` | Đưa kiểm tra Fenofibrate vào `reviewCurrentMedications` để phát lệnh STOP |
| **R3-LIPID-16** | `MINOR` | `threshold` | `rules.outpatient.ts` dòng 413 | Dùng nhầm biến % giảm LDL của PCSK9i (`lipid.reduction.pcsk9_alone` = 60%) làm ngưỡng eGFR | Dòng 413: `egfr < th('lipid.reduction.pcsk9_alone')` | Sửa thành tham chiếu biến ngưỡng eGFR chuẩn (ví dụ 60 mL/min) |
| **R3-LIPID-17** | `MINOR` | `ui` | `lipid.statin_intolerance.bempedoic` | Rationale khẳng định vô lý 'LDL-C 1.2 mmol/L (chưa đạt đích < 1.4 mmol/L)' | BN ADV_LIPID_43 (LDL 1.2 mmol/L) nhận rationale ghi chưa đạt đích < 1.4 | Thêm điều kiện `ldl > target` vào mệnh đề `when()` |
| **R3-LIPID-18** | `MINOR` | `ui` | `lipid.statin.very_high_risk_initiate` | Hướng dẫn dùng Rosuvastatin 20–40 mg trong rationale ở BN suy thận nặng eGFR < 30 | BN ADV_LIPID_24 (eGFR 29) nhận rationale khuyên dùng Rosuvastatin 20–40 mg | Bổ sung cảnh báo liều Rosuvastatin tối đa 10 mg khi eGFR < 30 |

---

## 5. Khảo Sát Kiến Trúc: Sự Tách Rời Giữa Calculator và Module Rules

Một phát hiện quan trọng về mặt kiến trúc hệ thống:
Trong thư mục `src/engine/calculators/`, tác giả trước đây đã xây dựng hai máy tính lâm sàng rất chuẩn mực và công phu:
1. [`ldlTarget.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/ldlTarget.ts): Hàm `determineEscRiskTier()` và `computeLdlTarget()` đã cài đặt đầy đủ 4 tầng nguy cơ (Rất cao, Cao, Trung bình, Thấp), nhận diện ĐTĐ ≥ 20 năm, LDL ≥ 4.9 mmol/L, biến cố tái phát trong 2 năm (đích 1.0), và tính toán chính xác mức giảm kép ≥ 50%.
2. [`score2.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/score2.ts): Đầy đủ thuật toán tính SCORE2 và SCORE2-OP theo vùng nguy cơ.

**Tuy nhiên, toàn bộ logic trong `src/modules/lipid/rules.outpatient.ts` đã KHÔNG HỀ SỬ DỤNG hai calculator này!**  
Tác giả module lipid đã tự viết lại một bộ luật sơ sài, chắp vá, dẫn đến việc bỏ sót 2 tầng nguy cơ (Trung bình, Thấp), bỏ sót đích 1.0 của tái phát ACS, bỏ sót tiêu chuẩn kép 50%, và tự tìm một biến có số "60" trong KB (`lipid.reduction.pcsk9_alone`) để so sánh eGFR.

> [!TIP]
> **Khuyến nghị kiến trúc cho Agent phụ trách sửa chữa**:  
> Hãy tích hợp trực tiếp `computeLdlTarget` từ `src/engine/calculators/ldlTarget.ts` vào hàm `derivePatientData` (hoặc gọi trực tiếp trong context của module lipid), biến nó thành nguồn sự thật duy nhất (Single Source of Truth) để giải quyết dứt điểm các lỗi phân tầng R3-LIPID-08, R3-LIPID-09, R3-LIPID-10, R3-LIPID-11 và R3-LIPID-12.

---

## 6. Kết Luận & Khuyến Cáo Cho Ban Điều Phối

- **Kết luận vòng 1**: **FAIL (KHÔNG ĐẠT)**
- **Số lượng lỗi**: **6 CRITICAL**, **9 MAJOR**, **3 MINOR**.
- **Hành động tiếp theo**:
  1. Ban điều phối chuyển giao báo cáo cho Module Owner (Agent phụ trách Lipid) và Core Safety Agent (Agent B phụ trách gates/interactions).
  2. Bắt buộc sửa chữa toàn bộ 6 lỗi CRITICAL và 9 lỗi MAJOR.
  3. Cập nhật các golden tests để khóa chặn các ca bệnh đối nghịch nguy hiểm này.
  4. Tiến hành Vòng 2 độc lập sau khi hoàn tất sửa chữa.
