# BÁO CÁO PHẢN BIỆN AN TOÀN ĐỐI NGHỊCH (ADVERSARIAL REVIEW) – VÒNG 1
## Module: Đái tháo đường típ 2 (DM2) – GDMT-VN

> **Reviewer**: R3 – Phản biện an toàn lâm sàng (Adversarial Safety Reviewer)  
> **Phiên bản engine**: 0.1.0  
> **Ngày thực hiện**: 27/10/2026  
> **Quy chuẩn đánh giá**: Tuân thủ nghiêm ngặt [REVIEW_PROTOCOL.md](../../REVIEW_PROTOCOL.md)  
> **Dữ liệu kiểm thử**: Bộ 48 ca lâm sàng đối nghịch chạy thực thi trên hàm `evaluate()` của engine ([run_r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts))  
> **File bằng chứng thô**: [adversarial_raw.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/adversarial_raw.json)  
> **File JSON kết quả**: [round1_R3.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/round1_R3.json)

---

## 1. Tóm Tắt Kết Quả & Kết Luận

| Mức độ nghiêm trọng | Số lượng | Tiêu chí chấp thuận | Trạng thái |
|---|:---:|:---:|:---:|
| **CRITICAL** (Nguy cơ gây hại trực tiếp) | **5** | = 0 | ❌ KHÔNG ĐẠT |
| **MAJOR** (Sai guideline / Liều / Mâu thuẫn chỉ định) | **7** | = 0 | ❌ KHÔNG ĐẠT |
| **MINOR** (Lỗi UI / Ngữ nghĩa hành động / Phù hợp thực hành) | **4** | - | ⚠️ CẦN SỬA |
| **SUGGESTION** (Khuyến nghị nâng cấp) | **1** | - | 💡 THAM KHẢO |
| **TỔNG CỘNG** | **17** | - | **KẾT LUẬN: FAIL** |

> [!CAUTION]
> **KẾT LUẬN VÒNG 1: FAIL (KHÔNG ĐẠT)**  
> Module Đái tháo đường típ 2 (`dm2`) phát hiện **5 lỗi CRITICAL** và **7 lỗi MAJOR**. Các lỗ hổng nghiêm trọng nhất đe dọa an toàn người bệnh gồm có:
> 1. Kê đơn GLP-1 RA (Semaglutide) cho bệnh nhân có tiền sử **Ung thư tuyến giáp thể tủy (MTC) / Hội chứng MEN 2** (vi phạm cảnh báo hộp đen tuyệt đối của FDA).
> 2. Khởi trị Semaglutide cho **phụ nữ mang thai** và bỏ sót không ra lệnh dừng các thuốc độc phôi thai (Semaglutide, Pioglitazone) ở thai phụ.
> 3. Cấp cứu hạ đường huyết nặng (glucose = 2.4 mmol/L) nhưng **hoàn toàn không ra lệnh ngừng hoặc tạm hoãn Sulfonylurea (Glimepiride)**, tạo nguy cơ hạ đường huyết tái diễn đe dọa tính mạng.
> 4. Bệnh nhân đang tiêm liều cao **Insulin Glargine 40 U/ngày** có HbA1c 10.2% lại nhận khuyến cáo **[START] Glargine 10 U/ngày** (gây tụt liều hoặc trùng đơn nghiêm trọng).
> 5. Cấp cứu tăng áp lực thẩm thấu (HHS) bị kích hoạt đồng thời cả phác đồ truyền tĩnh mạch cấp cứu lẫn phác đồ Basal-Bolus tiêm dưới da; tiêu đề cấp cứu DKA hiển thị "Bù Kali" ngay cả khi bệnh nhân đang tăng kali máu nặng 5.6 mmol/L.
>
> Module **bắt buộc phải sửa toàn diện** trước khi có thể được xem xét tại Vòng 2.

---

## 2. Phương Pháp Kiểm Thử Đối Nghịch (Adversarial Methodology)

Reviewer R3 đã thiết kế một bộ kịch bản tự động hóa gồm **48 ca bệnh nhân đối nghịch** ([run_r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts)), bao phủ các ranh giới giá trị, thiếu khuyết dữ liệu và tình huống lâm sàng nguy cơ cao:

1. **Ranh giới HbA1c & Đường huyết**: 6.4%, 6.5%, 7.0%, 9.9%, 10.0%, 16.6 mmol/L, 16.7 mmol/L (ngưỡng 300 mg/dL).
2. **Ranh giới Chức năng thận (eGFR)**: 14, 19, 29, 30, 44, 45 mL/phút/1.73m² (kiểm tra phân tầng an toàn Metformin và SGLT2i).
3. **Thiếu dữ liệu đầu vào (Fail-Closed)**: Thiếu cân nặng nội viện, thiếu Creatinin/eGFR (chưa dùng thuốc vs đang dùng Metformin), thiếu chiều cao/BMI.
4. **Người cao tuổi, Suy yếu & Nguy cơ hạ đường huyết**: BN cao tuổi dùng phối hợp Gliclazide + Insulin, tiền sử hạ đường huyết gần đây, cấp cứu hạ đường huyết nặng tại phòng khám (glucose 2.4 mmol/L).
5. **Đánh giá Quá liều Insulin nền (Overbasalization)**: Tỷ lệ liều nền 0.49 U/kg vs 0.51 U/kg; bệnh nhân đang dùng sẵn liều cao Insulin Glargine có HbA1c cao.
6. **Trùng lặp thuốc trục Incretin**: Phối hợp đồng thời DPP-4i (Sitagliptin) + GLP-1 RA (Semaglutide) tại nhà; BN đang dùng Sitagliptin khi được chỉ định mới Semaglutide.
7. **Suy tim & Chống chỉ định**: BN suy tim (LVEF 30-35%) dùng Pioglitazone, dùng Saxagliptin, và dùng đồng thời cả hai thuốc.
8. **Chống chỉ định đặc biệt**: Tiền sử Ung thư tuyến giáp thể tủy (MTC) / MEN 2; Phụ nữ mang thai mắc ĐTĐ2 kèm béo phì; Phụ nữ mang thai đang dùng sẵn Semaglutide + Pioglitazone.
9. **Cấp cứu DKA / HHS & Biến động Kali máu**: DKA với K⁺ = 3.2 mmol/L (< 3.5), K⁺ = 3.5 mmol/L, K⁺ = 5.3 mmol/L, K⁺ = 5.6 mmol/L; HHS thuần túy (áp lực thẩm thấu 345 mOsm/kg, ceton 0.3 mmol/L); DKA thiếu xét nghiệm K⁺.
10. **Bối cảnh Nội viện & Dinh dưỡng**: Nhịn ăn hoàn toàn (NPO), ăn kém, ICU vs Khoa thường; tạm ngừng Metformin nội viện.
11. **Steroid / Corticoid & Chu phẫu**: Bệnh nhân dùng Prednisone nội viện vs ngoại trú; phẫu thuật chương trình nội viện vs phòng khám ngoại trú tiền phẫu.
12. **Kết hợp Đa module**: Kích hoạt đồng thời `dm2` + `ckd` + `hf` để kiểm tra khả năng hòa giải và gộp chỉ định SGLT2i.
13. **Đổi Profile Guideline**: Chuyển đổi giữa INTL (ADA 2026) và VN (BYT 5481/2020).

Toàn bộ kết quả thực thi thô được lưu trữ tại: [`docs/reviews/dm2/scratch/adversarial_raw.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/adversarial_raw.json).

---

## 3. Top 5 Phát Hiện Nguy Hiểm Nhất (Top 5 Critical Findings)

### 🔴 Top 1: Kê đơn Semaglutide (GLP-1 RA) cho bệnh nhân có tiền sử Ung thư tuyến giáp thể tủy (MTC) / MEN 2 ([R3-DM2-01](#r3-dm2-01))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân nam 52 tuổi có tiền sử Ung thư tuyến giáp thể tủy (`conditions.mtc: true`, `customInputs.historyMtcOrMen2: true`), kèm ASCVD và béo phì (BMI 31.2). Hệ thống đưa ra khuyến cáo:  
  `[START] Khởi trị Semaglutide (SC) (0.25 mg x 1 lần/tuần...)`!  
  Hoàn toàn không có bất kỳ cảnh báo an toàn nào (Alerts: 0).
- **Cơ chế**: Luật `dm2.outpatient.cardiorenal_glp1` trong [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L170-L223) chỉ kiểm tra `hasAscvd || hasCkd || hasObesity`. Hệ thống hoàn toàn không kiểm tra cờ tiền sử MTC hay hội chứng MEN 2. File [gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts) cũng hoàn toàn không có cổng an toàn MTC cho nhóm GLP-1 RA.
- **Nguy cơ lâm sàng**: Chống chỉ định tuyệt đối (Black Box Warning của FDA, ADA 2026 Ch. 9): Các thuốc đồng vận thụ thể GLP-1 gây tăng sinh tế bào C tuyến giáp và u tuyến giáp thể tủy trong các nghiên cứu tiền lâm sàng; chống chỉ định ở người có tiền sử bản thân hoặc gia đình mắc MTC hoặc MEN 2.
- **Khắc phục**: Thêm điều kiện loại trừ `if (ctx.patient.conditions?.mtc || ctx.patient.conditions?.men2 || ctx.patient.customInputs?.historyMtcOrMen2) return false;` vào luật GLP-1 RA; bổ sung cổng an toàn trong `gates.ts` chuyển hành động sang `AVOID`.

---

### 🔴 Top 2: Khởi trị Semaglutide (GLP-1 RA) cho phụ nữ mang thai ([R3-DM2-02](#r3-dm2-02))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân nữ 31 tuổi đang mang thai (`conditions.pregnant: true`) mắc ĐTĐ típ 2 kèm béo phì (BMI 32). Hệ thống đưa ra khuyến cáo:  
  `[START] Khởi trị Semaglutide (SC) (0.25 mg x 1 lần/tuần...)`!
- **Cơ chế**: Luật `dm2.outpatient.cardiorenal_glp1` không kiểm tra điều kiện thai kỳ. Trong [gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts#L20-L36), danh sách `PREGNANCY_CONTRAINDICATED_DRUGS` có ACEi, ARB, ARNI, MRA, SGLT2i, Statin nhưng **hoàn toàn bỏ quên nhóm GLP-1 RA** (`semaglutide`, `tirzepatide`, `dulaglutide`, `liraglutide`). Cổng an toàn thai kỳ vì thế bị vượt qua dễ dàng.
- **Nguy cơ lâm sàng**: Thuốc đồng vận GLP-1 qua được nhau thai, gây độc phôi thai, sảy thai và dị tật xương thai nhi trong các thử nghiệm độc tính sinh sản (FDA Phân loại rủi ro thai kỳ; ADA 2026 Ch. 15 chỉ định Insulin là lựa chọn hàng đầu).
- **Khắc phục**: Bổ sung `if (ctx.patient.conditions?.pregnant) return false;` vào luật GLP-1 RA, và thêm toàn bộ nhóm GLP-1 RA vào mảng `PREGNANCY_CONTRAINDICATED_DRUGS` trong `gates.ts`.

---

### 🔴 Top 3: Bỏ sót không ngừng thuốc độc phôi thai (Semaglutide + Pioglitazone) ở phụ nữ mang thai ([R3-DM2-03](#r3-dm2-03))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Thai phụ 29 tuổi (`pregnant: true`) đang dùng sẵn Semaglutide 0.5 mg và Pioglitazone 15 mg tại nhà. Hệ thống **không hề sinh bất kỳ khuyến cáo nào để NGỪNG (STOP/AVOID)** hai thuốc này! Bệnh nhân vẫn được tiếp tục duy trì chăm sóc thông thường.
- **Cơ chế**: Hàm `reviewCurrentMedications` trong [reviewMeds.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMeds.ts#L33) chỉ quét các thuốc có trong tập hợp `PREGNANCY_CONTRAINDICATED_DRUGS`. Vì `semaglutide` và `pioglitazone` không nằm trong danh mục này, hệ thống hoàn toàn "mù" trước hai thuốc nguy hại cho thai kỳ.
- **Nguy cơ lâm sàng**: Thai phụ tiếp tục dùng Semaglutide và Pioglitazone suốt thai kỳ dẫn đến nguy cơ dị tật thai nhi, chậm phát triển trong tử cung và biến cố sản khoa nghiêm trọng.
- **Khắc phục**: Bổ sung đầy đủ nhóm GLP-1 RA và nhóm Thiazolidinedione (TZD: `pioglitazone`, `rosiglitazone`) vào `PREGNANCY_CONTRAINDICATED_DRUGS` để kích hoạt lệnh `STOP` khẩn cấp khi mang thai.

---

### 🔴 Top 4: Cấp cứu hạ đường huyết nặng (2.4 mmol/L) nhưng KHÔNG DỪNG Sulfonylurea (Glimepiride) ([R3-DM2-04](#r3-dm2-04))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân nữ 70 tuổi nhập viện vì hạ đường huyết nặng (glucose = 2.4 mmol/L) khi đang uống Glimepiride 4 mg + Metformin 1000 mg. Hệ thống đề xuất tiêm Glucose tĩnh mạch cấp cứu, nhưng **hoàn toàn KHÔNG có khuyến cáo ngừng hay tạm hoãn Glimepiride**! Thậm chí hệ thống còn tiếp tục duy trì Metformin và đề xuất START thêm Dapagliflozin + Semaglutide!
- **Cơ chế**: Luật `dm2.inpatient.hypoglycemia_protocol` trong [rules.inpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L214-L245) chỉ phát sinh giao thức xử trí cấp cứu glucose (`rec_dm2_hypo_rule15`). Luật hoàn toàn không kiểm tra `patient.currentMeds` để phát lệnh `HOLD`/`STOP` đối với các thuốc kích thích tiết insulin (Sulfonylurea/Meglitinide) hay Insulin nền.
- **Nguy cơ lâm sàng**: Glimepiride có thời gian bán thải kéo dài và chất chuyển hóa có hoạt tính. Việc cấp cứu truyền đường mà không lập tức đình chỉ Sulfonylurea sẽ khiến bệnh nhân nhanh chóng rơi lại vào tình trạng hạ đường huyết tái diễn sâu, hôn mê và tổn thương não không hồi phục.
- **Khắc phục**: Khi glucose < 3.9 mmol/L, bắt buộc quét `patient.currentMeds` và phát sinh khuyến cáo `HOLD` khẩn cấp đối với mọi thuốc Sulfonylurea / Insulin, đồng thời tạm hoãn khởi trị mới các thuốc hạ đường huyết khác.

---

### 🔴 Top 5: Bệnh nhân đang tiêm Insulin Glargine 40 U/ngày có HbA1c 10.2%: Engine khuyến cáo [START] Glargine 10 U/ngày ([R3-DM2-05](#r3-dm2-05))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân nam 55 tuổi đang tiêm Insulin Glargine 40 U/ngày tại nhà, xét nghiệm thấy HbA1c = 10.2%. Hệ thống đưa ra khuyến cáo:  
  `[START] Khởi trị Insulin Glargine (10 đơn vị/ngày HOẶC 8–15 đơn vị/ngày)`!
- **Cơ chế**: Luật `dm2.outpatient.early_insulin` trong [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L324-L365) chỉ kiểm tra `glucose >= 16.7` hoặc `hba1c >= 10.0`. Luật **hoàn toàn không kiểm tra xem bệnh nhân đã dùng insulin hay chưa**!
- **Nguy cơ lâm sàng**: Tạo ra sự hỗn loạn y lệnh cực kỳ nguy hiểm:
  1. Bác sĩ hoặc bệnh nhân hiểu nhầm giảm liều từ 40 U xuống 10 U/ngày, làm mất kiểm soát đường huyết nghiêm trọng và bùng phát toan ceton.
  2. Kê đơn thêm một bút tiêm Glargine mới (40 U + 10 U = 50 U), dẫn tới quá liều insulin nền và hạ đường huyết ban đêm.
- **Khắc phục**: Thêm điều kiện: `if (ctx.patient.currentMeds.some(m => m.drugId.toLowerCase().includes('insulin'))) return false;`. Bệnh nhân đang dùng insulin mà HbA1c vẫn cao cần được cảnh báo xem xét phác đồ tiêm đa mũi (Basal-Bolus) hoặc phối hợp GLP-1 RA, không bao giờ được "khởi trị lại" liều 10 đơn vị.

---

## 4. Bảng Chi Tiết Toàn Bộ 17 Findings

| Mã Finding | Mức độ | Loại mục | Định danh mục (itemId) | Tóm tắt phát hiện |
|---|:---:|:---:|---|---|
| **[R3-DM2-01](#r3-dm2-01)** | `CRITICAL` | `rule` | `dm2.outpatient.cardiorenal_glp1` | Khởi trị Semaglutide cho BN có tiền sử Ung thư giáp thể tủy (MTC) / MEN 2. |
| **[R3-DM2-02](#r3-dm2-02)** | `CRITICAL` | `rule` | `dm2.outpatient.cardiorenal_glp1` | Khởi trị Semaglutide cho phụ nữ mang thai mắc ĐTĐ2 kèm béo phì. |
| **[R3-DM2-03](#r3-dm2-03)** | `CRITICAL` | `rule` | `src/engine/safety/reviewMeds.ts` | Bỏ sót không ngừng Semaglutide + Pioglitazone ở phụ nữ mang thai. |
| **[R3-DM2-04](#r3-dm2-04)** | `CRITICAL` | `rule` | `dm2.inpatient.hypoglycemia_protocol` | Cấp cứu hạ đường huyết nặng (2.4 mmol/L) không ra lệnh ngừng Glimepiride. |
| **[R3-DM2-05](#r3-dm2-05)** | `CRITICAL` | `rule` | `dm2.outpatient.early_insulin` | Đang dùng Glargine 40 U/ngày có HbA1c 10.2% bị khuyến cáo [START] Glargine 10 U. |
| **[R3-DM2-06](#r3-dm2-06)** | `MAJOR` | `rule` | `dm2.outpatient.pioglitazone_saxagliptin_hf` | BN suy tim dùng cả Pioglitazone và Saxagliptin bị bỏ sót không dừng Saxagliptin. |
| **[R3-DM2-07](#r3-dm2-07)** | `MAJOR` | `rule` | `dm2.outpatient.no_dpp4_plus_glp1` | BN đang dùng Sitagliptin khi START Semaglutide không có khuyến cáo STOP Sitagliptin. |
| **[R3-DM2-08](#r3-dm2-08)** | `MAJOR` | `rule` | `dm2.inpatient.basal_bolus_regimen` | BN cấp cứu HHS thuần túy bị kích hoạt cùng lúc cả truyền TM lẫn Basal-Bolus dưới da. |
| **[R3-DM2-09](#r3-dm2-09)** | `MAJOR` | `rule` | `dm2.inpatient.dka_hhs_emergency` | Cấp cứu DKA gán nhầm drugId là `insulin_glargine` thay vì Regular insulin TM. |
| **[R3-DM2-10](#r3-dm2-10)** | `MAJOR` | `ui` | `dm2.inpatient.dka_hhs_emergency` | Tiêu đề cấp cứu DKA hiển thị "· Bù Kali ·" ngay cả khi BN đang tăng kali máu nặng 5.6 mmol/L. |
| **[R3-DM2-11](#r3-dm2-11)** | `MAJOR` | `rule` | `dm2.inpatient.hold_sglt2i_surgery` | Tạm ngừng SGLT2i trước mổ không chạy ở bối cảnh phòng khám NGOẠI TRÚ tiền phẫu. |
| **[R3-DM2-12](#r3-dm2-12)** | `MAJOR` | `rule` | `dm2.inpatient.steroid_induced_hyperglycemia` | Phác đồ tăng đường huyết do Corticoid không hoạt động ở bối cảnh NGOẠI TRÚ. |
| **[R3-DM2-13](#r3-dm2-13)** | `MINOR` | `rule` | `src/engine/safety/gates.ts` | BN suy thận eGFR < 30 chưa từng dùng Metformin nhận khuyến cáo [STOP] thay vì [AVOID]. |
| **[R3-DM2-14](#r3-dm2-14)** | `MINOR` | `rule` | `dm2.outpatient.deintensification` | Khuyến cáo xuống thang ở người già suy yếu thiếu `drugId` cụ thể. |
| **[R3-DM2-15](#r3-dm2-15)** | `MINOR` | `missing` | `dm2.outpatient.deintensification` | Người cao tuổi dùng SU có HbA1c < 6.5% (over-treatment) không có cảnh báo nới lỏng đích. |
| **[R3-DM2-16](#r3-dm2-16)** | `MINOR` | `ui` | `dm2.outpatient.rules` | Tiêu đề khuyến cáo thuốc lặp từ rườm rà do nội suy liều kép. |
| **[R3-DM2-17](#r3-dm2-17)** | `SUGGESTION` | `rule` | `dm2.outpatient.rules` | Đổi Profile INTL sang VN chưa thay đổi động logic theo QĐ 5481/QĐ-BYT. |

---

## 5. Phân Tích Chi Tiết Từng Phát Hiện & Bằng Chứng

### <a id="r3-dm2-01"></a>[R3-DM2-01] Khởi trị Semaglutide cho bệnh nhân có tiền sử MTC / MEN 2
- **Mức độ**: `CRITICAL`
- **Loại mục**: `rule` (`dm2.outpatient.cardiorenal_glp1`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_31](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L440-L460): Nam 52 tuổi, tiền sử Ung thư giáp thể tủy (`conditions.mtc: true`, `customInputs.historyMtcOrMen2: true`), ASCVD, BMI 31.2.
  - *Output*: `[START] semaglutide (rec_dm2_glp1_cardiorenal)` liều khởi đầu 0.25 mg/tuần; `gates = []`, `alerts = []`.
- **Cơ chế lỗi**: Luật chỉ kiểm tra tiêu chí tim mạch và béo phì, không có bất kỳ dòng lệnh nào chặn tiền sử ung thư tuyến giáp thể tủy.
- **Đề xuất khắc phục**: Thêm điều kiện loại trừ và bổ sung cổng an toàn MTC trong `gates.ts`.

---

### <a id="r3-dm2-02"></a>[R3-DM2-02] Khởi trị Semaglutide cho phụ nữ mang thai
- **Mức độ**: `CRITICAL`
- **Loại mục**: `rule` (`dm2.outpatient.cardiorenal_glp1`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_32](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L461-L476): Nữ 31 tuổi mang thai (`conditions.pregnant: true`), béo phì BMI 32.
  - *Output*: `[START] semaglutide (rec_dm2_glp1_cardiorenal)`; không có cổng kiểm tra thai kỳ; `alerts = []`.
- **Cơ chế lỗi**: `PREGNANCY_CONTRAINDICATED_DRUGS` trong `gates.ts` bỏ quên nhóm GLP-1 RA.
- **Đề xuất khắc phục**: Bổ sung kiểm tra `pregnant` vào luật và thêm GLP-1 RA vào danh mục chống chỉ định thai kỳ cốt lõi.

---

### <a id="r3-dm2-03"></a>[R3-DM2-03] Bỏ sót không ngừng Semaglutide + Pioglitazone ở phụ nữ mang thai
- **Mức độ**: `CRITICAL`
- **Loại mục**: `rule` (`src/engine/safety/reviewMeds.ts`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_33](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L477-L494): Thai phụ 29 tuổi (`pregnant: true`) đang uống Semaglutide 0.5 mg và Pioglitazone 15 mg.
  - *Output*: Hoàn toàn không có khuyến cáo STOP/HOLD nào cho Semaglutide hay Pioglitazone.
- **Cơ chế lỗi**: `reviewCurrentMedications` chỉ dựa vào danh mục thuốc cũ trong `gates.ts`, thiếu GLP-1 RA và TZD.
- **Đề xuất khắc phục**: Cập nhật danh mục thuốc độc phôi thai toàn diện để phát sinh khuyến cáo `STOP` khẩn cấp.

---

### <a id="r3-dm2-04"></a>[R3-DM2-04] Cấp cứu hạ đường huyết nặng không ngừng/hoãn Sulfonylurea (Glimepiride)
- **Mức độ**: `CRITICAL`
- **Loại mục**: `rule` (`dm2.inpatient.hypoglycemia_protocol`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_22](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L318-L335): Glucose = 2.4 mmol/L, đang dùng Glimepiride 4 mg + Metformin 1000 mg.
  - *Output*: `[START] rec_dm2_hypo_rule15`: Tiêm Glucose TM. Không có khuyến cáo STOP/HOLD Glimepiride; thậm chí engine còn [START] Dapagliflozin và Semaglutide.
- **Cơ chế lỗi**: Luật cấp cứu chỉ đưa giải pháp bù đường triệu chứng, không xử lý căn nguyên thuốc đang dùng.
- **Đề xuất khắc phục**: Bổ sung logic tự động `HOLD` mọi Sulfonylurea/Insulin khi glucose < 3.9 mmol/L.

---

### <a id="r3-dm2-05"></a>[R3-DM2-05] Đang dùng Insulin Glargine 40 U/ngày có HbA1c 10.2%: Engine khuyến cáo [START] Glargine 10 U/ngày
- **Mức độ**: `CRITICAL`
- **Loại mục**: `rule` (`dm2.outpatient.early_insulin`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_25](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L363-L382): Đang dùng Glargine 40 U/ngày, HbA1c = 10.2%.
  - *Output*: `[START] insulin_glargine (rec_dm2_early_insulin)` liều 10 U/ngày.
- **Cơ chế lỗi**: Thiếu kiểm tra tiền sử dùng insulin trước khi phát lệnh khởi trị.
- **Đề xuất khắc phục**: Chặn khởi trị mới nếu bệnh nhân đang dùng insulin, chuyển hướng sang tối ưu hóa phác đồ tiêm đa mũi hoặc phối hợp GLP-1 RA.

---

### <a id="r3-dm2-06"></a>[R3-DM2-06] Suy tim dùng cả Pioglitazone và Saxagliptin: Bỏ sót không dừng Saxagliptin
- **Mức độ**: `MAJOR`
- **Loại mục**: `rule` (`dm2.outpatient.pioglitazone_saxagliptin_hf`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_30](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L422-L439): Suy tim LVEF 32%, dùng đồng thời Pioglitazone 30 mg và Saxagliptin 5 mg.
  - *Output*: Chỉ sinh khuyến cáo `[STOP] pioglitazone`. Saxagliptin bị bỏ lọt hoàn toàn.
- **Cơ chế lỗi**: Dùng toán tử ternary gán `drugId = hasPio ? 'pioglitazone' : 'saxagliptin'` tại dòng 506 file `rules.outpatient.ts`.
- **Đề xuất khắc phục**: Tách thành 2 khuyến cáo độc lập hoặc lặp qua từng thuốc để dừng cả hai.

---

### <a id="r3-dm2-07"></a>[R3-DM2-07] BN đang dùng Sitagliptin khi START Semaglutide: Không có khuyến cáo [STOP] Sitagliptin
- **Mức độ**: `MAJOR`
- **Loại mục**: `rule` (`dm2.outpatient.no_dpp4_plus_glp1`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_27](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L399-L417): Đang dùng Sitagliptin 100 mg, có chỉ định START Semaglutide.
  - *Output*: Semaglutide được [START], nhưng không có dòng khuyến cáo nào có `action: 'STOP', drugId: 'sitagliptin'`.
- **Cơ chế lỗi**: Luật `no_dpp4_plus_glp1` chỉ chạy khi cả 2 thuốc đã có trong `currentMeds`.
- **Đề xuất khắc phục**: Khi GLP-1 RA được START mà bệnh nhân đang dùng DPP-4i, tự động sinh khuyến cáo `STOP` thuốc DPP-4i tương ứng.

---

### <a id="r3-dm2-08"></a>[R3-DM2-08] BN cấp cứu HHS thuần túy bị kích hoạt cùng lúc cả truyền TM lẫn Basal-Bolus dưới da
- **Mức độ**: `MAJOR`
- **Loại mục**: `rule` (`dm2.inpatient.basal_bolus_regimen`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_38](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L552-L572): Glucose 38 mmol/L, áp lực thẩm thấu hiệu dụng 345 mOsm/kg, ceton 0.3 mmol/L.
  - *Output*: Xuất hiện cùng lúc `[START] rec_dm2_inpatient_basal_bolus` (Glargine 16 U + Aspart 5 U x 3 bữa) VÀ `[START] rec_dm2_dka_active_management` (Insulin TM 3.4 U/h).
- **Cơ chế lỗi**: `basal_bolus_regimen` chỉ loại trừ DKA (`!isDka`), không loại trừ HHS.
- **Đề xuất khắc phục**: Bổ sung điều kiện loại trừ HHS trong `basal_bolus_regimen`.

---

### <a id="r3-dm2-09"></a>[R3-DM2-09] Cấp cứu DKA gán nhầm drugId là `insulin_glargine` thay vì Regular insulin TM
- **Mức độ**: `MAJOR`
- **Loại mục**: `rule` (`dm2.inpatient.dka_hhs_emergency`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_34](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L495-L516) và [ADV_DM2_39](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L573-L593).
  - *Output*: `[HOLD] drugId='insulin_glargine'` trong khuyến cáo hoãn insulin cấp cứu DKA.
- **Cơ chế lỗi**: Gán nhầm mã thuốc Glargine thay vì Regular insulin tĩnh mạch.
- **Đề xuất khắc phục**: Sửa `drugId` thành `'insulin_regular'` hoặc `'insulin_infusion'`.

---

### <a id="r3-dm2-10"></a>[R3-DM2-10] Tiêu đề cấp cứu DKA hiển thị "· Bù Kali ·" khi bệnh nhân tăng kali máu nặng 5.6 mmol/L
- **Mức độ**: `MAJOR`
- **Loại mục**: `ui` (`dm2.inpatient.dka_hhs_emergency`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_37](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L535-L551): DKA với K⁺ = 5.6 mmol/L.
  - *Output*: Tiêu đề hiển thị: `'Phác đồ Cấp cứu DKA: Bù dịch · Insulin TM (7.0 U/h) · Bù Kali · Dextrose gối'`.
- **Cơ chế lỗi**: Tiêu đề chuỗi tĩnh được nối cứng tại dòng 350 file `rules.inpatient.ts`.
- **Đề xuất khắc phục**: Đổi tiêu đề thành `'· Chưa bù Kali (K⁺ > 5.0) ·'` khi K⁺ > 5.0 mmol/L.

---

### <a id="r3-dm2-11"></a>[R3-DM2-11] Tạm ngừng SGLT2i trước mổ không chạy ở bối cảnh phòng khám NGOẠI TRÚ tiền phẫu
- **Mức độ**: `MAJOR`
- **Loại mục**: `rule` (`dm2.inpatient.hold_sglt2i_surgery`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_46](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L650-L667): BN ngoại trú có lịch mổ trong 3 ngày tới (`plannedSurgery: true, setting: 'outpatient'`) đang dùng Empagliflozin.
  - *Output*: Không phát sinh khuyến cáo tạm hoãn Empagliflozin.
- **Cơ chế lỗi**: Giới hạn nhầm `setting: 'inpatient'`.
- **Đề xuất khắc phục**: Đổi setting thành `'both'` để áp dụng cả cho phòng khám ngoại trú tiền phẫu.

---

### <a id="r3-dm2-12"></a>[R3-DM2-12] Phác đồ tăng đường huyết do Corticoid không hoạt động ở bối cảnh NGOẠI TRÚ
- **Mức độ**: `MAJOR`
- **Loại mục**: `rule` (`dm2.inpatient.steroid_induced_hyperglycemia`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_44](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L620-L639): BN ngoại trú dùng Methylprednisolone, đường huyết 14.8 mmol/L.
  - *Output*: Luật không kích hoạt, không có hướng dẫn dùng Insulin NPH buổi sáng.
- **Cơ chế lỗi**: Giới hạn nhầm `setting: 'inpatient'`.
- **Đề xuất khắc phục**: Mở rộng setting thành `'both'`.

---

### <a id="r3-dm2-13"></a>[R3-DM2-13] BN suy thận eGFR < 30 chưa từng dùng Metformin nhận khuyến cáo [STOP] thay vì [AVOID]
- **Mức độ**: `MINOR`
- **Loại mục**: `rule` (`src/engine/safety/gates.ts`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_09](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L162-L177): eGFR 29, chưa từng dùng Metformin (`currentMeds: []`).
  - *Output*: `[STOP] metformin`: 'CHỐNG CHỈ ĐỊNH / NGỪNG Metformin (eGFR < 30)', liều: 'Ngừng hoàn toàn'.
- **Cơ chế lỗi**: `gates.ts` ghi đè `updatedAction = 'STOP'` mà không kiểm tra trạng thái đang dùng thuốc.
- **Đề xuất khắc phục**: Kiểm tra nếu chưa dùng thì gán `AVOID`.

---

### <a id="r3-dm2-14"></a>[R3-DM2-14] Khuyến cáo xuống thang ở người già suy yếu thiếu `drugId` cụ thể
- **Mức độ**: `MINOR`
- **Loại mục**: `rule` (`dm2.outpatient.deintensification`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_20](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L292-L311): Nữ 82 tuổi dùng Gliclazide + Glargine.
  - *Output*: `[REDUCE] drugId=undefined`.
- **Cơ chế lỗi**: Khuyến cáo mang tính chung chung không liên kết với thẻ thuốc nào trên giao diện.
- **Đề xuất khắc phục**: Gán `drugId` cụ thể cho thuốc cần giảm/dừng.

---

### <a id="r3-dm2-15"></a>[R3-DM2-15] Người cao tuổi dùng SU có HbA1c < 6.5% (over-treatment) không có cảnh báo nới lỏng đích
- **Mức độ**: `MINOR`
- **Loại mục**: `missing` (`dm2.outpatient.deintensification`)
- **Bằng chứng thực nghiệm**:
  - *Input*: Ca [ADV_DM2_01](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L47-L67): Nữ 72 tuổi dùng Gliclazide MR 60mg, HbA1c = 6.4%.
  - *Output*: Không có cảnh báo over-treatment.
- **Cơ chế lỗi**: Luật deintensification chỉ dựa vào `recentHypo` hoặc `complex`, bỏ qua tiêu chí HbA1c thấp hơn đích cá thể hóa.
- **Đề xuất khắc phục**: Bổ sung điều kiện cảnh báo khi HbA1c < 6.5% ở người già dùng SU/Insulin.

---

### <a id="r3-dm2-16"></a>[R3-DM2-16] Tiêu đề khuyến cáo thuốc lặp từ rườm rà do nội suy liều kép
- **Mức độ**: `MINOR`
- **Loại mục**: `ui` (`dm2.outpatient.rules`)
- **Bằng chứng thực nghiệm**:
  - Tiêu đề xuất hiện: `'Khởi trị Dapagliflozin (10 mg x 1 lần/ngày (uống) - 10 mg uống buổi sáng)'`.
- **Cơ chế lỗi**: Chuỗi format liều từ KB đã có sẵn tần suất, khi đưa vào tiêu đề lại bị lặp.
- **Đề xuất khắc phục**: Tinh gọn tiêu đề hiển thị: `'Khởi trị Dapagliflozin 10 mg/ngày'`.

---

### <a id="r3-dm2-17"></a>[R3-DM2-17] Đổi Profile INTL sang VN chưa thay đổi động logic theo QĐ 5481/QĐ-BYT
- **Mức độ**: `SUGGESTION`
- **Loại mục**: `rule` (`dm2.outpatient.rules`)
- **Bằng chứng thực nghiệm**:
  - Ca [ADV_DM2_48](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/run_r3_adversarial.ts#L687-L704): Chuyển profile sang 'VN' nhưng thứ tự ưu tiên và bậc thang thuốc vẫn chạy hoàn toàn theo cấu trúc ADA 2026.
- **Cơ chế lỗi**: Các luật chỉ khai báo `profiles: ['INTL', 'VN', 'US']` mà không rẽ nhánh logic bên trong.
- **Đề xuất khắc phục**: Bổ sung nhánh rẽ thích ứng theo hướng dẫn điều trị của Bộ Y tế Việt Nam.

---

## 6. Đánh Giá Chất Lượng Tiếng Việt & Khả Năng Sử Dụng Lâm Sàng (UI/UX)

1. **Ngữ nghĩa hành động (Action Semantics)**: Lỗi nghiêm trọng nhất là việc sử dụng hành động `[STOP]` cho thuốc mà bệnh nhân *chưa từng sử dụng* (như Metformin ở BN suy thận eGFR < 30 chưa từng kê đơn). Điều này gây bối rối cho bác sĩ lâm sàng khi thấy y lệnh "Ngừng thuốc" trong khi không có thuốc đó trong bệnh án ngoại trú. Hành động đúng phải là `[AVOID]` (Tránh dùng / Chống chỉ định).
2. **Cụm từ tiêu đề cấp cứu**: Trong bối cảnh cấp cứu DKA, tiêu đề dán nhãn cố định `· Bù Kali ·` là cực kỳ nguy hiểm trong môi trường trực đêm áp lực cao, nơi điều dưỡng có thể nhìn vào tiêu đề mà chuẩn bị sẵn bơm tiêm kali truyền cho bệnh nhân đang có nồng độ kali máu 5.6 mmol/L. Tiêu đề cấp cứu bắt buộc phải phản ánh chính xác hành động tức thời: "Chưa bù Kali" hoặc "Bù Kali duy trì".
3. **Độ ngắn gọn và khả năng quét nhanh**: Các tiêu đề thuốc hiện tại quá dài do nhồi nhét toàn bộ câu văn chuẩn độ từ KB vào trong ngoặc đơn tiêu đề. Tiêu đề cần ngắn gọn để hiển thị rõ trên màn hình di động hoặc tablet của bác sĩ đi buồng.

---

## 7. Kiến Nghị Lộ Trình Sửa Đổi Trước Vòng 2

Reviewer R3 khuyến nghị Agent F (Module Owner) và Agent B (Engine Lead) thực hiện các bước khắc phục sau theo thứ tự ưu tiên:

1. **Giai đoạn 1 (Sửa lỗi Critical an toàn sinh mạng)**:
   - Cập nhật [gates.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/gates.ts) và [reviewMeds.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMeds.ts): Bổ sung nhóm GLP-1 RA và TZD vào danh mục chống chỉ định thai kỳ `PREGNANCY_CONTRAINDICATED_DRUGS`.
   - Cập nhật [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts): Thêm điều kiện loại trừ tiền sử ung thư tuyến giáp thể tủy (MTC) và hội chứng MEN 2 cho GLP-1 RA; loại trừ thai kỳ cho GLP-1 RA.
   - Thêm kiểm tra `isTakingInsulin` trong luật `early_insulin`.
   - Trong `hypoglycemia_protocol`: Quét và phát lệnh `HOLD` ngay lập tức mọi thuốc Sulfonylurea / Insulin khi glucose < 3.9 mmol/L.

2. **Giai đoạn 2 (Sửa lỗi Major về mâu thuẫn & bối cảnh)**:
   - Sửa lỗi rẽ nhánh loại trừ lẫn nhau giữa Pioglitazone và Saxagliptin trong suy tim.
   - Loại trừ hội chứng tăng áp lực thẩm thấu (HHS) ra khỏi luật `basal_bolus_regimen`.
   - Mở rộng phạm vi setting của luật ngừng SGLT2i trước mổ và luật tăng đường huyết do steroid sang bối cảnh `'both'` (ngoại trú + nội viện).
   - Chuẩn hóa lại mã thuốc `drugId: 'insulin_regular'` trong cấp cứu DKA.
   - Sinh khuyến cáo `STOP` chủ động cho DPP-4i khi GLP-1 RA được chỉ định mới.

3. **Giai đoạn 3 (Sửa lỗi Minor & UI/UX)**:
   - Điều chỉnh logic ghi đè action trong `gates.ts` để giữ nguyên `AVOID` khi bệnh nhân chưa dùng thuốc.
   - Gán `drugId` cụ thể cho khuyến cáo xuống thang ở người già.
   - Tinh gọn chuỗi tiêu đề hiển thị liều thuốc.
