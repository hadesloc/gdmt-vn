# BÁO CÁO PHẢN BIỆN AN TOÀN ĐỐI NGHỊCH (ADVERSARIAL REVIEW) – VÒNG 1
## Module: Bệnh Phổi Tắc Nghẽn Mạn Tính (COPD) – GDMT-VN

> **Reviewer**: R3 – Phản biện an toàn lâm sàng (Adversarial Safety Reviewer)  
> **Phiên bản engine**: 0.1.0  
> **Ngày thực hiện**: 27/10/2026  
> **Quy chuẩn đánh giá**: Tuân thủ nghiêm ngặt [REVIEW_PROTOCOL.md](../../REVIEW_PROTOCOL.md)  
> **Dữ liệu kiểm thử**: Bộ 53 ca bệnh nhân đối nghịch chạy thực thi trên hàm `evaluate()` của engine (`docs/reviews/copd/scratch/run_r3_adversarial.ts` và `run_r3_adversarial.test.ts`)  
> **File bằng chứng dữ liệu thô**: [`docs/reviews/copd/scratch/adversarial_raw.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/scratch/adversarial_raw.json) (353 KB)  
> **File danh mục finding chuẩn hóa**: [`docs/reviews/copd/round1_R3.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/round1_R3.json)

---

## 1. Tóm Tắt Kết Quả & Kết Luận Phê Duyệt

| Mức độ nghiêm trọng | Số lượng | Tiêu chí chấp thuận | Trạng thái |
|---|:---:|:---:|:---:|
| **CRITICAL** (Nguy cơ gây hại trực tiếp tính mạng / sức khỏe) | **7** | = 0 | ❌ KHÔNG ĐẠT |
| **MAJOR** (Sai lệch guideline / Thiếu khuyến cáo Class I) | **6** | = 0 | ❌ KHÔNG ĐẠT |
| **MINOR** (Lỗi UI / Thuật ngữ / Tích hợp thiếu) | **2** | - | ⚠️ CẦN SỬA |
| **SUGGESTION** (Khuyến nghị nâng cấp an toàn) | **1** | - | 💡 THAM KHẢO |
| **TỔNG CỘNG** | **16** | - | **KẾT LUẬN: FAIL** |

> [!CAUTION]
> ### KẾT LUẬN VÒNG 1: FAIL (KHÔNG ĐẠT)
> Module **COPD (`copd`)** hiện tại có **7 lỗi CRITICAL** và **6 lỗi MAJOR**. Đáng chú ý và nguy hiểm nhất trên lâm sàng là:
> 1. Kê đơn thuốc giãn phế quản đơn độc (LAMA hoặc LABA+LAMA) **hoàn toàn không có ICS** cho bệnh nhân có tiền sử Hen / Chồng lấp Hen-COPD (ACO), trực tiếp làm tăng nguy cơ bùng phát hen ác tính và tử vong.
> 2. Bệnh nhân COPD ổn định vào viện vì lý do phẫu thuật chương trình (không hề có đợt cấp) bị hệ thống tự động đè ra tiêm/uống liều cao Corticoid toàn thân 40 mg/ngày trong 5 ngày và thở oxy có kiểm soát.
> 3. Hệ thống an toàn (`duplicates.ts`) **hoàn toàn không kiểm tra trùng lặp nhóm LAMA**, cho phép kê đồng thời Tiotropium + Spiolto (gấp đôi liều LAMA) dẫn tới ngộ độc kháng cholinergic cấp (bí tiểu, glôcôm góc đóng).
> 4. Khởi trị Roflumilast ở bệnh nhân suy gan / bệnh gan (Chống chỉ định tuyệt đối theo FDA và GOLD).
> 5. Kê đơn Azithromycin dự phòng trên bệnh nhân đang dùng Amiodarone mà không có cảnh báo tương tác kéo dài QTc và loạn nhịp xoắn đỉnh.
> 6. Bệnh nhân có chức năng hô hấp bình thường (FEV₁/FVC = 0.72) vẫn bị luật theo dõi nâng bậc lên phối hợp đôi LABA+LAMA.
> 7. Phối hợp đồng thời module COPD + Hen gây kê đơn trùng lặp 2 thuốc LABA (Spiolto + Symbicort) không được gộp hay cảnh báo.
>
> Module **BẮT BUỘC PHẢI ĐƯỢC CHỈNH SỬA TOÀN DIỆN VỀ MẶT AN TOÀN** trước khi bước vào Vòng 2.

---

## 2. Phương Pháp Kiểm Thử Đối Nghịch (Adversarial Methodology)

Reviewer R3 đã xây dựng một bộ kịch bản tự động hóa gồm **53 bệnh nhân đối nghịch** (`adversarialCases` trong [run_r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/copd/scratch/run_r3_adversarial.ts)), bao phủ toàn bộ các góc khuất lâm sàng, các điểm ranh giới và tương tác chéo:

1. **Ranh giới tỷ lệ FEV₁/FVC (0.69, 0.70, 0.71)**:
   - `0.69`: Tắc nghẽn cố định xác nhận COPD.
   - `0.70` & `0.71`: Không đạt tiêu chuẩn vàng tắc nghẽn; kiểm tra khả năng chặn khởi trị thuốc duy trì và cảnh báo chẩn đoán phân biệt.
   - Bệnh nhân có FEV₁/FVC = 0.72 đang dùng nhầm LAMA mono khi đi tái khám.
2. **Ranh giới FEV₁ % dự đoán (29, 30, 49, 50, 79, 80)**:
   - `29%` vs `30%`: Phân định ranh giới GOLD 4 (< 30%) và GOLD 3 (30–49%).
   - `49%` vs `50%`: Ngưỡng quyết định chỉ định Roflumilast ở bệnh nhân viêm phế quản mạn và đợt cấp.
   - `79%` vs `80%`: Ranh giới GOLD 2 (50–79%) và GOLD 1 (≥ 80%).
3. **Mức độ triệu chứng mMRC (1 vs 2) và CAT (9 vs 10)**:
   - mMRC = 1, CAT = 9 (Đồng thuận ít triệu chứng -> Nhóm A).
   - mMRC = 2, CAT = 9 (Bất đồng: mMRC cao, CAT thấp -> Phải xếp Nhóm B).
   - mMRC = 1, CAT = 10 (Bất đồng: mMRC thấp, CAT cao -> Phải xếp Nhóm B).
   - mMRC = 2, CAT = 10 (Đồng thuận nhiều triệu chứng -> Nhóm B).
4. **Tiền sử đợt cấp trong 12 tháng (0, 1, 2 đợt vừa và 1 lần nhập viện)**:
   - 0 đợt cấp vừa -> Nhóm A/B.
   - 1 đợt cấp vừa (không nhập viện) -> Nhóm A hoặc B theo GOLD (chưa đủ tiêu chuẩn Nhóm E).
   - 2 đợt cấp vừa -> Nhóm E (≥ 2 đợt vừa).
   - 1 lần nhập viện -> Nhóm E (≥ 1 lần nhập viện).
5. **Ranh giới bạch cầu ái toan máu BCAT (99, 100, 299, 300 /µL)**:
   - `299` vs `300`: Ngưỡng khởi đầu phác đồ ba thuốc (Triple ICS+LAMA+LABA) cho Nhóm E.
   - `99` vs `100`: Ngưỡng cấm thêm ICS (AVOID) vs Bổ sung ICS lên phác đồ 3 thuốc khi theo dõi đợt cấp trên nền LABA+LAMA.
   - Khuyết thiếu hoàn toàn xét nghiệm BCAT máu ở Nhóm E.
6. **Thực hành kê đơn sai lầm & Trùng lặp thuốc (Safety & Duplication)**:
   - Bệnh nhân COPD đang dùng đơn trị liệu ICS (Budesonide đơn độc).
   - Bệnh nhân dùng đồng thời Tiotropium + Spiolto (Trùng lặp 2 thuốc cùng chứa LAMA).
   - Bệnh nhân dùng LAMA đơn trị bị đợt cấp rơi vào ngõ cụt theo dõi.
   - Kê Roflumilast trên bệnh nhân có bệnh gan / suy gan.
   - Kê Azithromycin dự phòng trên bệnh nhân đang dùng Amiodarone.
7. **Bệnh đồng mắc Hen phế quản (ACO) & Viêm phổi tái diễn**:
   - COPD Nhóm A và Nhóm B có kèm tiền sử hen (`priorAsthma: true`).
   - Rút ICS khi viêm phổi tái diễn (`priorPneumonia: true`) ở bệnh nhân có BCAT máu thấp vs rất cao (600 /µL).
8. **Oxy dài hạn tại nhà (LTOT) và Ranh giới SpO₂ (87, 88, 89%)**:
   - SpO₂ = 88% khi nghỉ (Chỉ định chuẩn LTOT).
   - SpO₂ = 89% không có biến chứng tim mạch.
   - SpO₂ = 89% KÈM tâm phế mạn hoặc phù do suy tim phải (Chỉ định mở rộng LTOT).
9. **Nội viện: Đợt cấp cấp cứu, Khí máu động mạch (pH 7.24, 7.25, 7.35, 7.36) và Kháng sinh**:
   - pH = 7.35, PaCO₂ = 45 mmHg (Toan hô hấp đủ tiêu chuẩn thở máy NIV).
   - pH = 7.36, PaCO₂ = 44 mmHg (Chưa toan máu).
   - pH = 7.24, PaCO₂ = 65 mmHg (Toan máu nguy kịch chuyển ICU).
   - Thiếu xét nghiệm khí máu động mạch khi có suy hô hấp cấp.
   - Kháng sinh đợt cấp khi đờm trong không mủ (`purulentSputum: false`).
   - Bệnh nhân nội viện KHÔNG đợt cấp (`acuteExacerbation: false`).
10. **Phối hợp đa module & Profile INTL vs VN**:
    - COPD + Hen (`copd` + `asthma`).
    - COPD + Suy tim (`copd` + `hf` với carvedilol vs bisoprolol).
    - COPD + Rung nhĩ (`copd` + `af`).

---

## 3. Top 5 Phát Hiện Nguy Hiểm Nhất (Top 5 Critical Findings)

### 🔴 Top 1: Kê đơn giãn phế quản đơn độc KHÔNG CÓ ICS cho bệnh nhân có tiền sử Hen / ACO ([R3-COPD-01](#r3-copd-01))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân COPD có tiền sử Hen hoặc chẩn đoán Hen đồng mắc (`conditions.priorAsthma: true`, `conditions.asthma: true`), nếu rơi vào Nhóm A (ít triệu chứng) hoặc Nhóm B (nhiều triệu chứng), hệ thống kê đơn:
  - Nhóm A: `[START] Khởi trị Tiotropium (LAMA đơn chất)`!
  - Nhóm B: `[START] Khởi trị Spiolto Respimat (LABA + LAMA)`!
  **Hoàn toàn không có mặt thuốc ICS trong phác đồ!**
- **Cơ chế**: Trong `copd.outpatient.initial_group_a` và `copd.outpatient.initial_group_b`, tác giả hoàn toàn không kiểm tra cờ hen phế quản (`priorAsthma` hoặc `asthma`). Cờ hen chỉ được kiểm tra ở nhánh `initial_group_e_triple`. Nếu bệnh nhân chưa có đợt cấp (Nhóm A, B), luật vẫn vô tư kê LAMA hoặc LABA+LAMA đơn thuần.
- **Nguy cơ lâm sàng**: Theo GINA 2026 và GOLD 2026 (Chương Asthma-COPD Overlap), việc điều trị bằng LABA hoặc LAMA đơn độc mà không có ICS ở người bệnh có yếu tố hen là **chống chỉ định tuyệt đối (Class III Harm)**. Thuốc giãn phế quản làm giảm triệu chứng tạm thời nhưng để mặc phản ứng viêm tăng bạch cầu ái toan tiến triển âm thầm, dẫn đến bùng phát cơn hen ác tính đột ngột, tắc nghẽn đường thở không hồi phục và tử vong do hen.
- **Khắc phục**: Chặn ngay ở đầu các luật `initial_group_a` và `initial_group_b` nếu có cờ `priorAsthma` hoặc `asthma`. Tạo quy tắc chuyên biệt cho ACO: Bắt buộc phác đồ khởi đầu phải có ICS (ví dụ ICS + LABA hoặc ICS + LAMA + LABA).

---

### 🔴 Top 2: Bệnh nhân nội viện KHÔNG CÓ đợt cấp vẫn bị tự động kê Corticoid toàn thân 40mg và Thở oxy ([R3-COPD-02](#r3-copd-02))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Một bệnh nhân COPD ổn định vào viện vì phẫu thuật gãy xương hay mổ chương trình (`setting: 'inpatient'`, `acuteExacerbation: false`, SpO₂ 97%). Hệ thống lập tức sinh 2 khuyến cáo cấp cứu:
  1. `[START] Corticoid toàn thân trong 5 ngày (Prednisolone 40 mg uống/ngày)`!
  2. `[START] Thở oxy có kiểm soát: Đích SpO₂ 88–92%`!
- **Cơ chế**: Tại dòng 694 và dòng 719 file `src/modules/copd/rules.ts`, điều kiện kích hoạt luật viết:
  ```ts
  when: (ctx) => {
    const isAcute = Boolean(ctx.patient.customInputs?.acuteExacerbation);
    return isAcute || ctx.settings.setting === 'inpatient'; // BUG!
  }
  ```
- **Nguy cơ lâm sàng**: Bệnh nhân không hề suy hô hấp, không có đợt cấp lại bị cho dùng liều cao corticoid đường toàn thân gây bùng phát tăng đường huyết cấp, ức chế miễn dịch, loãng xương, tăng nguy cơ nhiễm trùng vết mổ và nhiễm trùng bệnh viện. Đồng thời cho thở oxy ở người SpO₂ 97% là can thiệp y khoa sai lệch.
- **Khắc phục**: Xóa bỏ hoàn toàn vế `|| ctx.settings.setting === 'inpatient'`. Luật bắt buộc phải có `acuteExacerbation === true`. Thở oxy bắt buộc phải kiểm tra SpO₂ < 88% (hoặc < 90%).

---

### 🔴 Top 3: Bỏ sót không phát hiện trùng lặp nhóm thuốc LAMA (Tiotropium + Spiolto) ([R3-COPD-03](#r3-copd-03))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân đang sử dụng đồng thời Tiotropium (Spiriva Respimat 5 mcg) và Spiolto Respimat (Tiotropium 2.5 mcg + Olodaterol 2.5 mcg, 2 nhát = 5 mcg Tiotropium). Tổng liều Tiotropium là 10 mcg/ngày (gấp đôi liều tối đa cho phép). Hệ thống hoàn toàn **im lặng, không sinh bất kỳ cảnh báo an toàn nào (`plan.alerts = []`)!**
- **Cơ chế**: Trong `src/engine/safety/duplicates.ts`, mảng `DUPLICATE_CLASS_RULES` chỉ có RASi/ARNI, MRA, Anticoagulant, DPP4/GLP1, Beta-blocker, SGLT2i, Statin. Hoàn toàn **chưa có nhóm LAMA, LABA, hay ICS!**
- **Nguy cơ lâm sàng**: Quá liều kháng cholinergic nặng dẫn tới bí tiểu cấp (đặc biệt ở nam giới cao tuổi có u xơ tiền liệt tuyến, phải đặt sonde bàng quang cấp cứu), khởi phát cơn glôcôm góc đóng cấp tính (nguy cơ mù lòa vĩnh viễn), khô miệng nứt nẻ, lú lẫn sảng ở người già và nhịp tim nhanh kịch phát.
- **Khắc phục**: Thêm định nghĩa trùng lặp nhóm LAMA (`dup.lama`), LABA (`dup.laba`) và ICS (`dup.ics`) vào `DUPLICATE_CLASS_RULES`.

---

### 🔴 Top 4: Kê đơn Roflumilast ở bệnh nhân suy gan / bệnh gan ([R3-COPD-04](#r3-copd-04))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân có FEV₁ = 40%, viêm phế quản mạn và 2 đợt cấp/năm, nhưng có bệnh gan mạn tính (`conditions.liverDisease: true`). Hệ thống đưa ra khuyến cáo: `[START] Bổ sung Roflumilast uống (FEV₁ < 50%, viêm phế quản mạn) 250 mcg -> 500 mcg/ngày`!
- **Cơ chế**: Luật `copd.followup.roflumilast_indication` không kiểm tra điều kiện bệnh gan. Mặc dù trong phần text `rationale` có ghi "Chống chỉ định khi suy gan trung bình-nặng", nhưng rule engine vẫn phát sinh hành động `START`. Cổng an toàn `gates.ts` cũng hoàn toàn không có kiểm tra chức năng gan.
- **Nguy cơ lâm sàng**: Roflumilast được chuyển hóa mạnh qua gan bởi CYP3A4 và CYP1A2. Suy gan làm tăng vọt nồng độ thuốc trong huyết tương, gây tiêu chảy mất nước trụy mạch nặng, sụt cân suy kiệt nghiêm trọng, rối loạn tâm thần, trầm cảm nặng và ý tưởng tự sát (Black Box Warning của FDA). Chống chỉ định tuyệt đối ở suy gan Child-Pugh B hoặc C.
- **Khắc phục**: Thêm `if (ctx.patient.conditions?.liverDisease) return false;` vào luật Roflumilast và thêm cổng kiểm tra gan trong `gates.ts`.

---

### 🔴 Top 5: Kê đơn Azithromycin trên bệnh nhân đang dùng Amiodarone mà không có cảnh báo tương tác QTc / Xoắn đỉnh ([R3-COPD-05](#r3-copd-05))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân COPD kèm Rung nhĩ đang điều trị duy trì bằng Amiodarone 200 mg/ngày. Khi có đợt cấp tái phát, hệ thống khuyến cáo: `[CONSIDER] Cân nhắc Azithromycin dự phòng đợt cấp ở người đã cai thuốc lá (250 mg/ngày)` mà không hề có dòng cảnh báo tương tác nào trong `plan.alerts`.
- **Cơ chế**: Luật `azithromycin_prophylaxis` chỉ kiểm tra tình trạng cai thuốc lá. Trong `src/engine/safety/interactions.ts`, hoàn toàn chưa có quy tắc tương tác giữa thuốc nhóm Macrolid và Amiodarone.
- **Nguy cơ lâm sàng**: Cả Amiodarone và Azithromycin đều ức chế mạnh kênh kali IKr làm kéo dài khoảng QT tim. Hiệp đồng hai thuốc làm QTc tăng vọt trên 500 ms, bùng phát loạn nhịp thất đa hình dạng xoắn đỉnh (Torsades de Pointes), thoái triển thành rung thất và ngừng tim đột tử.
- **Khắc phục**: Thêm quy tắc tương tác mức `critical` giữa Macrolid và các thuốc chống loạn nhịp kéo dài QT (Amiodarone, Sotalol, Flecainide) vào `INTERACTION_RULES`.

---

## 4. Bảng Chi Tiết Toàn Bộ 16 Findings

| STT | Mã Finding | Mức độ | Loại mục | Mã mục (Item ID) | Tóm tắt lỗi & Bằng chứng kiểm thử | Hướng khắc phục đề xuất |
|:---:|---|:---:|:---:|---|---|---|
| 1 | **R3-COPD-01** | `critical` | `rule` | `copd.outpatient.initial_group_a`<br>`copd.outpatient.initial_group_b` | **Kê đơn LAMA hoặc LABA+LAMA đơn độc không có ICS cho BN có tiền sử Hen / ACO.**<br>*Bằng chứng*: Ca ADV_COPD_35 sinh `[START] tiotropium`; Ca ADV_COPD_36 sinh `[START] tiotropium_olodaterol`. | Thêm kiểm tra `priorAsthma`/`asthma`, chặn kê LAMA/LABA đơn thuần, chuyển sang phác đồ có ICS (ICS+LABA hoặc Triple). |
| 2 | **R3-COPD-02** | `critical` | `rule` | `copd.inpatient.systemic_steroid`<br>`copd.inpatient.controlled_oxygen` | **BN nội viện KHÔNG đợt cấp (mổ chương trình) vẫn bị kê Corticoid toàn thân 40mg và Thở oxy.**<br>*Bằng chứng*: Ca ADV_COPD_42 (`acuteExacerbation: false`, SpO₂ 97%) bị kê Prednisolone 40mg x 5 ngày và Thở oxy. | Xóa bỏ vế `|| ctx.settings.setting === 'inpatient'`. Bắt buộc `acuteExacerbation === true` và SpO₂ < 88% mới được START oxy. |
| 3 | **R3-COPD-03** | `critical` | `missing` | `dup.lama` trong `duplicates.ts` | **Không phát hiện trùng lặp 2 thuốc cùng chứa LAMA (Tiotropium + Spiolto) gây ngộ độc kháng cholinergic.**<br>*Bằng chứng*: Ca ADV_COPD_30 đang dùng Spiriva + Spiolto nhưng `plan.alerts` trống rỗng. | Bổ sung nhóm LAMA (`dup.lama`), LABA (`dup.laba`), ICS (`dup.ics`) vào `DUPLICATE_CLASS_RULES`. |
| 4 | **R3-COPD-04** | `critical` | `rule` | `copd.followup.roflumilast_indication` | **START Roflumilast ở bệnh nhân có bệnh gan / suy gan (Chống chỉ định tuyệt đối FDA/GOLD).**<br>*Bằng chứng*: Ca ADV_COPD_33 (`liverDisease: true`) vẫn sinh `[START] roflumilast 250 -> 500 mcg`. | Thêm `if (ctx.patient.conditions?.liverDisease) return false;` vào luật và thêm kiểm tra gan trong `gates.ts`. |
| 5 | **R3-COPD-05** | `critical` | `missing` | `ix.amiodarone_macrolide` | **Kê Azithromycin trên BN đang dùng Amiodarone mà không cảnh báo kéo dài QTc / Xoắn đỉnh.**<br>*Bằng chứng*: Ca ADV_COPD_34 & 52 dùng Amiodarone được kê Azithromycin, `alerts` không có cảnh báo. | Bổ sung tương tác Macrolid + Amiodarone mức `critical` vào `src/engine/safety/interactions.ts`. |
| 6 | **R3-COPD-06** | `critical` | `rule` | `copd.followup.dyspnea_step_up` | **BN có chức năng hô hấp bình thường (FEV₁/FVC = 0.72) vẫn bị luật theo dõi nâng bậc lên LABA+LAMA.**<br>*Bằng chứng*: Ca ADV_COPD_04 (FEV₁/FVC 0.72, dùng LAMA, mMRC 2) sinh `[SWITCH] tiotropium_olodaterol`. | Bổ sung kiểm tra `fev1FvcRatio < 0.70` vào mọi luật theo dõi (follow-up rules). |
| 7 | **R3-COPD-07** | `critical` | `rule` | `copd.outpatient.initial_group_b`<br>`mergeRecommendations` | **Kích hoạt đồng thời COPD + Hen gây kê đơn trùng lặp 2 LABA (Spiolto + Symbicort).**<br>*Bằng chứng*: Ca ADV_COPD_50 sinh cả Spiolto (Olodaterol) và Symbicort (Formoterol) không bị chặn. | Bổ sung hòa giải đa module (reconciliation): ưu tiên phác đồ 3 trong 1 đơn dụng cụ hít, cấm kê 2 LABA. |
| 8 | **R3-COPD-08** | `major` | `threshold` | `copd.nonpharm.ltot_oxygen` | **Lỗi logic ngưỡng khiến BN SpO₂ 89% kèm tâm phế mạn bị bỏ sót chỉ định oxy dài hạn (LTOT).**<br>*Bằng chứng*: Ca ADV_COPD_41 (SpO₂ 89%, `corPulmonaleOrPolycythemia: true`) không có khuyến cáo LTOT. | Tạo ngưỡng `copd.ltot_cor_pulmonale_spo2_cutoff` = 89 và sửa dòng 635 thành `spo2 <= 89`. |
| 9 | **R3-COPD-09** | `major` | `rule` | `copd.inpatient.antibiotics` | **Kê kháng sinh đợt cấp vi phạm tiêu chuẩn Anthonisen khi đờm trong không mủ (`purulentSputum: false`).**<br>*Bằng chứng*: Ca ADV_COPD_49 (`increasedSputumVolume: true`, `purulentSputum: false`) vẫn sinh `[START] Kháng sinh`. | Sửa toán tử `||` thành `&&`: chỉ kê kháng sinh khi có đờm mủ (`isPurulent === true`) hoặc thở máy. |
| 10 | **R3-COPD-10** | `major` | `missing` | `copd.followup.dyspnea_step_up` | **Bệnh nhân LAMA đơn trị bị đợt cấp rơi vào ngõ cụt (Dead-end), không nhận được khuyến cáo nâng bậc.**<br>*Bằng chứng*: Ca ADV_COPD_31 (LAMA mono, 2 đợt cấp vừa) không sinh bất kỳ khuyến cáo điều chỉnh thuốc nào. | Bổ sung luật `copd.followup.exac_step_up_from_mono`: nâng từ đơn trị lên LABA+LAMA hoặc Triple khi có đợt cấp. |
| 11 | **R3-COPD-11** | `major` | `missing` | `copd.safety.ics_monotherapy` | **Bỏ sót không phát hiện và không khuyến cáo ngừng khi BN COPD đang dùng đơn trị liệu ICS.**<br>*Bằng chứng*: Ca ADV_COPD_29 (đang dùng Budesonide 400mcg đơn độc) hệ thống hoàn toàn im lặng. | Thêm luật quét `currentMeds`: nếu có ICS đơn độc mà không kèm LABA và không có hen, sinh cảnh báo và lệnh SWITCH. |
| 12 | **R3-COPD-12** | `major` | `missing` | `copd.inpatient.abg_required` | **Thiếu khuyến cáo bắt buộc làm Khí máu động mạch (ABG) ở BN đợt cấp có suy hô hấp cấp.**<br>*Bằng chứng*: Ca ADV_COPD_48 (SpO₂ 83%, co kéo cơ phụ, thiếu ABG) hệ thống không yêu cầu làm khí máu. | Thêm luật yêu cầu làm ngay Khí máu động mạch khẩn cấp khi BN đợt cấp nội viện thiếu `abgPh`/`abgPaco2`. |
| 13 | **R3-COPD-13** | `major` | `rule` | `copd.diagnosis.spirometry_required` | **Đòi hỏi đo phế dung kế khi BN đang suy hô hấp / đợt cấp cấp cứu nội viện (Chống chỉ định theo GOLD).**<br>*Bằng chứng*: Ca ADV_COPD_06 (đợt cấp nội viện, SpO₂ 86%) hệ thống đòi đo chức năng hô hấp. | Đổi setting luật thành `setting: 'outpatient'`. Hoãn đo CNHH trong đợt cấp đến khi xuất viện ổn định 2–3 tháng. |
| 14 | **R3-COPD-14** | `minor` | `ui` | `src/engine/require.ts` | **Lỗi UI: Tên trường kỹ thuật tiếng Anh (`fev1FvcRatio`, `fev1PredPct`) hiển thị trần trụi cho bác sĩ.**<br>*Bằng chứng*: Ca ADV_COPD_05, 06 tiêu đề ghi: *"Cần nhập fev1FvcRatio để đánh giá tiếp"*. | Bổ sung nhãn tiếng Việt cho các trường hô hấp vào từ điển `FIELD_LABELS`. |
| 15 | **R3-COPD-15** | `minor` | `rule` | `src/engine/derive.ts` | **Máy tính phân độ GOLD (`computeGold`) bị bỏ quên, không được tích hợp vào `derivePatientData`.**<br>*Bằng chứng*: `derive.ts` không gọi `computeGold`, khiến `derived.goldGrade` và `goldGroup` luôn `undefined`. | Gọi `computeGold` trong `derivePatientData` khi bệnh nhân có dữ liệu phế dung kế. |
| 16 | **R3-COPD-16** | `suggestion` | `missing` | `ix.bb_non_selective_copd` | **Chưa có cảnh báo về thuốc chẹn beta không chọn lọc (Propranolol, Carvedilol liều cao) ở bệnh nhân COPD.**<br>*Bằng chứng*: `interactions.ts` có `ix.bb_non_selective_asthma` chỉ kiểm tra hen, bỏ sót COPD. | Mở rộng kiểm tra cả COPD, khuyến nghị ưu tiên chẹn beta chọn lọc beta-1 (Bisoprolol) khi có suy tim/mạch vành. |

---

## 5. Đánh Giá Toàn Diện Các Khía Cạnh Của Module COPD

### 5.1. Về Hướng dẫn điều trị & Khởi trị ban đầu (Initial Therapy)
- **Điểm mạnh**:
  - Phân nhóm A/B/E được thiết kế bám sát GOLD 2026 và Quyết định 2131/QĐ-BYT năm 2026.
  - Phân nhánh Nhóm E theo ngưỡng bạch cầu ái toan máu BCAT 300 /µL (LABA+LAMA vs Triple) rất chuẩn xác theo thử nghiệm IMPACT và ETHOS.
  - Ma trận lựa chọn liệu pháp duy trì (`matrices.ts`) được xây dựng trực quan, chi tiết từng ô theo từng phân nhóm.
- **Lỗ hổng nghiêm trọng**:
  - Bỏ quên hoàn toàn tiền sử Hen phế quản ở Nhóm A và Nhóm B, dẫn đến kê đơn đơn độc LAMA hoặc LABA+LAMA (vi phạm nghiêm trọng nguyên tắc an toàn ACO).

### 5.2. Về Theo dõi & Leo thang điều trị (Follow-up & Escalation)
- **Điểm mạnh**:
  - Tách bạch rõ ràng 2 nhánh lâm sàng: nhánh khó thở dai dẳng (Dyspnea pathway) và nhánh đợt cấp tái phát (Exacerbation pathway).
  - Tích hợp rất kịp thời các liệu pháp mới nhất của GOLD 2026: thuốc sinh học Dupilumab (FDA 2024 / GOLD 2026) cho kiểu hình viêm phế quản mạn + BCAT ≥ 300, Mepolizumab, và Roflumilast.
- **Lỗ hổng nghiêm trọng**:
  - Không kiểm tra lại tỷ lệ FEV₁/FVC trong các luật theo dõi, dẫn tới nâng bậc thuốc cho người không bị COPD.
  - Thiếu nhánh nâng bậc cho bệnh nhân dùng đơn trị liệu có đợt cấp (bệnh nhân bị kẹt trong ngõ cụt).
  - Bỏ sót chống chỉ định suy gan của Roflumilast và tương tác QTc của Azithromycin.

### 5.3. Về Xử trí đợt cấp nội viện (Inpatient Acute Exacerbation)
- **Điểm mạnh**:
  - Đích SpO₂ có kiểm soát 88–92% được trích dẫn chính xác từ QĐ 2131/QĐ-BYT và GOLD.
  - Ngưỡng chỉ định thở máy không xâm nhập NIV/BiPAP (pH ≤ 7.35, PaCO₂ ≥ 45 mmHg) chuẩn xác theo guideline quốc tế.
  - Tiêu chuẩn chuyển ICU tại pH ≤ 7.25 phản ánh đúng tinh thần phân loại Rome về suy hô hấp đe dọa tính mạng.
- **Lỗ hổng nghiêm trọng**:
  - Luật nội viện bị lỗi điều kiện kích hoạt `setting === 'inpatient'`, kê corticoid và oxy tràn lan cho cả bệnh nhân không có đợt cấp.
  - Đòi đo chức năng hô hấp trong đợt cấp nội viện.
  - Kê kháng sinh vi phạm tiêu chuẩn Anthonisen khi đờm trong không mủ.

---

## 6. Khuyến Nghị Kỹ Thuật Cho Module Owner & Ban Điều Phối

1. **Sửa đổi bộ lọc an toàn đa module (`crossModuleReconciliation`)**:
   Khi một bệnh nhân được chọn đồng thời cả bệnh phổi (COPD/Hen) và tim mạch (Suy tim/Rung nhĩ), bộ hòa giải cần ưu tiên:
   - Nếu có Hen + COPD: Bắt buộc chọn phác đồ có ICS (Triple hoặc ICS+LABA), loại bỏ chỉ định LABA+LAMA đơn thuần.
   - Nếu có Rung nhĩ dùng Amiodarone: Chặn chỉ định Azithromycin dự phòng dài hạn.
   - Nếu có Suy tim HFrEF: Khuyến nghị dùng chẹn beta chọn lọc beta-1 (Bisoprolol, Metoprolol succinate), tránh Carvedilol liều cao chưa dung nạp hoặc Propranolol.
2. **Bổ sung các nhóm thuốc hô hấp vào `DUPLICATE_CLASS_RULES`**:
   Đây là lỗ hổng cốt lõi của engine an toàn. Cần cập nhật `src/engine/safety/duplicates.ts` ngay trong Sprint này.
3. **Cập nhật từ điển `FIELD_LABELS`**:
   Bổ sung nhãn tiếng Việt cho tất cả các thông số khí máu và phế dung kế để bảo đảm tính chuyên nghiệp của giao diện lâm sàng.

---

> **Báo cáo được lập bởi**: Reviewer R3 (Phản biện an toàn lâm sàng)  
> **Chữ ký số Review Board**: `R3_COPD_ROUND1_FAIL_20261027`
