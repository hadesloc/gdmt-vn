# Báo Cáo Thẩm Định Chuyên Khoa Hô Hấp & Guideline (Round 1 – R1)
## Module Bệnh Phổi Tắc Nghẽn Mạn Tính (COPD) – GDMT-VN

- **Reviewer:** R1 – Chuyên gia Hô hấp / Guideline Checker
- **Ngày thẩm định:** 27/10/2026
- **Vòng đánh giá:** Vòng 1 (Round 1)
- **Tài liệu đối chiếu gốc (mở trực tiếp từ kho `Medical_Library_2026`):**
  1. **GOLD 2026 Report v1.2** (`01_Noi_Khoa/Ho_Hap/GOLD_2026_Report.pdf`)
  2. **GOLD 2026 Pocket Guide v1.1** (`01_Noi_Khoa/Ho_Hap/GOLD_2026_Pocket_Guide.pdf`)
  3. **GOLD 2026 Key Changes Summary** (`01_Noi_Khoa/Ho_Hap/GOLD_2026_Key_Changes.pdf`)
  4. **Bộ Y tế Quyết định số 2131/QĐ-BYT ngày 14/07/2026** Hướng dẫn chẩn đoán và điều trị bệnh phổi tắc nghẽn mạn tính (`08_Bo_sung_ON_CALL/BYT_2131_COPD_2026.pdf`)
  5. **Bộ Y tế Quyết định số 2767/QĐ-BYT năm 2023** Hướng dẫn chẩn đoán và điều trị bệnh phổi tắc nghẽn mạn tính (`06_Viet_Nam/BYT_2767__QD__HD_chan_doan_va_dieu_tri_COPD_2023final_signed_e5721.pdf`)
  6. **Nhãn thuốc FDA / SmPC:** Daliresp (roflumilast), Dupixent (dupilumab), Spiriva (tiotropium), Spiolto (tiotropium/olodaterol), Trelegy Ellipta (FF/UMEC/VI), Breztri Aerosphere (BGF).

---

## 1. Kết Luận Chung & Bảng Thống Kê

### Kết luận thẩm định: **FAIL** (Không đạt chuẩn thông qua Vòng 1)

> **Căn cứ theo [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md):**  
> Điều kiện để PASS vòng review chuyên khoa là **0 lỗi CRITICAL và 0 lỗi MAJOR**.  
> Module COPD hiện tồn tại **1 lỗi CRITICAL** (bỏ sót thuốc giãn phế quản tác dụng ngắn SABA/SAMA cấp cứu trong đợt cấp) cùng **7 lỗi MAJOR** (tiêu chuẩn phân nhóm E sai lệch, bế tắc điều trị theo dõi khi có đợt cấp, sai tiêu chuẩn Anthonisen cho kháng sinh, cấm sai Mepolizumab ở bệnh nhân viêm phế quản mạn, bỏ sót thở máy không xâm nhập tại nhà Home NIV, bỏ sót phân độ tắc nghẽn GOLD 1–4, và hổng cổng an toàn chẩn đoán ở nhánh theo dõi).

### Bảng phân bố phát hiện (Findings Breakdown)

| Mức độ nghiêm trọng (Severity) | Số lượng | Tỷ lệ (%) | Ý nghĩa lâm sàng |
|---|:---:|:---:|---|
| 🔴 **CRITICAL** | **1** | 7.1% | Nguy cơ trực tiếp gây hại cho người bệnh nếu bác sĩ thực hành theo (bỏ sót thuốc giãn phế quản cấp cứu) |
| 🟠 **MAJOR** | **7** | 50.0% | Vi phạm nội dung guideline, phân nhóm sai, sai tiêu chuẩn Anthonisen, bỏ sót Class I, khóa sai chỉ định sinh học |
| 🟡 **MINOR** | **5** | 35.7% | Bỏ sót bệnh nhân SpO2 89% có tâm phế mạn, thu hẹp sai đối tượng azithromycin, thiếu cổng an toàn roflumilast, thiếu profileDiff |
| 🔵 **SUGGESTION** | **1** | 7.1% | Đề xuất bổ sung hướng dẫn đổi thiết bị hít khi khó thở dai dẳng trên LABA + LAMA |
| **TỔNG CỘNG** | **14** | **100%** | |

---

## 2. TOP 5 Vấn Đề Lâm Sàng Trọng Tâm Cần Xử Lý Ngay

1. **🔴 [CRITICAL - COPD-R1-01] Bỏ sót hoàn toàn Thuốc giãn phế quản tác dụng ngắn (SABA / SAMA) trong xử trí Đợt cấp nội viện / Cấp cứu:**  
   Trong phác đồ đợt cấp nội viện (`setting === 'inpatient'` hoặc `acuteExacerbation === true`), engine hướng dẫn bác sĩ cho thở oxy có kiểm soát, tiêm/uống corticoid 5 ngày, kháng sinh, thở máy NIV, chuyển ICU... **nhưng hoàn toàn không có bất kỳ quy tắc nào chỉ định thuốc giãn phế quản tác dụng ngắn (SABA / SAMA)**! Cả GOLD 2026 (Ch. 4, Chứng cứ A) và BYT QĐ 2131/2026 (Mục 3.4.4) đều quy định SABA khí dung (hoặc phối hợp SABA + SAMA) là điều trị đầu tay sống còn để giải tỏa co thắt phế quản cấp. Nếu làm theo khuyến cáo hiện tại của hệ thống, bệnh nhân suy hô hấp cấp sẽ không được cắt cơn co thắt phế quản!

2. **🟠 [MAJOR - COPD-R1-02] Tiêu chuẩn Phân nhóm E sai lệch do tái sử dụng sai ngưỡng mMRC (`copd.mmrc_high` = 2) cho đợt cấp vừa:**  
   GOLD 2026 (trang 54) và BYT QĐ 2131/2026 (trang 18) đã chính thức sửa đổi định nghĩa Nhóm E: **có từ 1 đợt cấp mức độ trung bình hoặc nặng trong năm trước** ("Consequently, Group E has been modified to include individuals with one moderate exacerbation in the previous year"). Tuy nhiên tại dòng 11 `rules.ts`, code viết: `if (modExac !== undefined && modExac >= th('copd.mmrc_high')) return true;` so sánh với `copd.mmrc_high` (giá trị = 2!). Bệnh nhân có 1 đợt cấp vừa ngoại trú (`modExac = 1`, `hosp = 0`) bị hệ thống đẩy sang Nhóm A hoặc B, tước bỏ chỉ định bộ ba thuốc nếu có BCAT ≥ 300 /µL. Đồng thời `inputs.ts` và `COPD.md` vẫn ghi nhầm "≥ 2 đợt cấp vừa".

3. **🟠 [MAJOR - COPD-R1-03] Bế tắc điều trị theo dõi (Follow-up Dead End): Bỏ sót toàn bộ bệnh nhân đang dùng đơn trị liệu LAMA hoặc LABA xuất hiện đợt cấp:**  
   Lưu đồ theo dõi của GOLD 2026 (Hình 3.11) quy định rõ: Bệnh nhân đang dùng đơn trị liệu (LAMA hoặc LABA) nếu xuất hiện đợt cấp phải được nâng bậc lên LABA + LAMA (nếu BCAT < 300 /µL) hoặc phác đồ ba thuốc (nếu BCAT ≥ 300 /µL). Trong `rules.ts`, quy tắc khó thở chặn đợt cấp; quy tắc đợt cấp chỉ chấp nhận `currentInhaler === 'laba_lama'`; các rule khởi trị chặn `currentInhaler !== 'none'`. Hệ quả: Bệnh nhân đang dùng Tiotropium đơn trị mà bị đợt cấp rơi vào khoảng trống logic, **engine hoàn toàn im lặng, không sinh ra bất kỳ khuyến cáo thuốc duy trì nào**!

4. **🟠 [MAJOR - COPD-R1-04] Tiêu chuẩn chỉ định kháng sinh đợt cấp (Anthonisen) bị mã hóa sai logic (`isPurulent || isIncreasedVol`):**  
   Theo tiêu chuẩn Anthonisen kinh điển (GOLD 2026 tr. 103 và BYT 2131/2026 tr. 37), chỉ định kháng sinh bắt buộc phải có đờm chuyển mủ (trong nhóm 2 hoặc 3 triệu chứng) hoặc bệnh nhân phải thở máy. Nhưng tại dòng 753 `rules.ts`, code viết: `return isPurulent || isIncreasedVol;`. Một bệnh nhân chỉ đơn thuần tăng lượng đờm nhầy trong suốt (`increasedSputumVolume === true`, `purulentSputum === false`) vẫn bị hệ thống chỉ định `START` kháng sinh, vi phạm nghiêm trọng nguyên tắc quản trị kháng sinh (antimicrobial stewardship).

5. **🟠 [MAJOR - COPD-R1-05] Khóa sai chỉ định Mepolizumab ở bệnh nhân có viêm phế quản mạn (`!isChronicBronchitis`):**  
   GOLD 2026 Report (trang 77) khẳng định: ở bệnh nhân BCAT ≥ 300 /µL có đợt cấp tái phát trên phác đồ ba thuốc, cân nhắc bổ sung *"dupilumab (if chronic bronchitis) or mepolizumab (with and without chronic bronchitis)"*. Trích dẫn trong chính KB `gold.copd.2026.biologics_dupilumab_mepolizumab` cũng ghi nhận nguyên văn câu này. Nhưng tại dòng 529 `rules.ts`, code lại đặt điều kiện cấm cứng: `return !isChronicBronchitis;`! Khi bệnh nhân có viêm phế quản mạn không dung nạp hoặc không có sẵn Dupilumab, hệ thống cấm đoán sai Mepolizumab.

---

## 3. Đối Chiếu Chi Tiết Từng Luật & Hạng Mục Lâm Sàng

### 3.1. Chẩn đoán & Phân loại Spirometry (GOLD 1–4)
- **Cơ sở guideline:** GOLD 2026 Chapter 1 (trang 15, 18, 39); BYT QĐ 2131/2026 Mục 1.3 & 1.4 (trang 15–16).
- **Đánh giá logic:**
  - Quy tắc `copd.diagnosis.spirometry_required` hoạt động chuẩn xác theo nguyên tắc fail-closed: nếu thiếu `fev1FvcRatio` hoặc `fev1PredPct`, engine phát sinh cảnh báo thiếu dữ liệu và chặn các khuyến cáo khởi trị.
  - Quy tắc `copd.diagnosis.normal_spirometry_warning` cảnh báo đúng khi FEV₁/FVC ≥ 0.70 không đủ tiêu chuẩn tắc nghẽn cố định.
  - **Lỗi bỏ sót Class I (Finding COPD-R1-07):** Dù đã thu thập `fev1PredPct` và có sẵn 4 threshold trong KB (`copd.gold1_fev1_min` đến `copd.gold4_fev1_max`), engine **hoàn toàn không có quy tắc phân độ mức độ tắc nghẽn GOLD 1–4**. Bệnh nhân có FEV₁ = 24% dự đoán (tắc nghẽn rất nặng GOLD 4) không được hệ thống đưa ra kết luận chẩn đoán phân độ nào.
  - **Lỗi cổng chẩn đoán (Finding COPD-R1-08):** Toàn bộ 8 quy tắc nhánh theo dõi (follow-up) không kiểm tra FEV₁/FVC. Bệnh nhân có FEV₁/FVC = 0.78 (không mắc COPD) nhưng nếu đang dùng thuốc hít vẫn bị hệ thống tiếp tục nâng bậc điều trị và chỉ định Roflumilast/Sinh học!

### 3.2. Phân nhóm A / B / E & Khởi trị ban đầu
- **Cơ sở guideline:** GOLD 2026 Chapter 2 (trang 54) & Chapter 3 (trang 75); BYT QĐ 2131/2026 Mục 1.4.4 (trang 18) & Mục 2.2.2 (trang 23).
- **Đánh giá logic:**
  - Khởi trị nhóm A (`copd.outpatient.initial_group_a`): Chỉ định 1 thuốc giãn phế quản tác dụng kéo dài (`tiotropium` 5 mcg/ngày). Hoàn toàn phù hợp.
  - Khởi trị nhóm B (`copd.outpatient.initial_group_b`): Khởi đầu phối hợp đôi LABA + LAMA (`tiotropium_olodaterol` 2.5/2.5 mcg Respimat). Khớp chuẩn với khuyến cáo mới của GOLD 2026 và BYT 2131. Đã có `profileDiff` lưu ý tuyến y tế cơ sở tại VN.
  - Khởi trị nhóm E (`copd.outpatient.initial_group_e_triple` và `initial_group_e_laba_lama`):
    - Khi BCAT máu ≥ 300 /µL hoặc có tiền sử hen: Khởi đầu sớm với phác đồ ba thuốc (`fluticasone_furoate_umeclidinium_vilanterol` Trelegy Ellipta). Khớp chứng cứ giảm tử vong từ thử nghiệm IMPACT và ETHOS.
    - Khi BCAT máu < 300 /µL: Khởi đầu bằng LABA + LAMA. Khớp GOLD 2026.
  - **Lỗi nghiêm trọng (Finding COPD-R1-02):** Tiêu chuẩn phân nhóm E trong hàm `checkHighExacerbationRisk` so sánh `modExac >= th('copd.mmrc_high')` (= 2!). Theo GOLD 2026 và BYT 2131, chỉ cần **1 đợt cấp mức độ vừa** trong năm là đã xếp vào Nhóm E. Bệnh nhân có 1 đợt cấp vừa bị phân nhóm sai sang A hoặc B.

### 3.3. Nhánh theo dõi (Follow-up): Khó thở vs Đợt cấp
- **Cơ sở guideline:** GOLD 2026 Figure 3.11 (trang 76–77); BYT QĐ 2131/2026 Mục 2.2.3 (trang 25).
- **Đánh giá logic:**
  - Nhánh khó thở (`copd.followup.dyspnea_step_up`): Đang dùng LAMA đơn chất hoặc LABA đơn chất -> nâng lên LABA + LAMA. Phù hợp.
  - Nhánh đợt cấp (`copd.followup.exac_add_ics`): Đang dùng LABA + LAMA nếu có đợt cấp và BCAT ≥ 100 /µL -> nâng lên phác đồ ba thuốc. Khớp tiêu chuẩn ngưỡng BCAT.
  - Cảnh báo tránh ICS (`copd.followup.avoid_ics_low_eos`): Khi BCAT < 100 /µL, cảnh báo `AVOID` thêm ICS do nguy cơ viêm phổi mà không có lợi ích. Rất xuất sắc.
  - **Lỗi bế tắc điều trị (Finding COPD-R1-03):** Nếu bệnh nhân đang dùng đơn trị liệu LAMA/LABA mà bị đợt cấp, engine bị nghẽn hoàn toàn, không sinh bất kỳ khuyến cáo nâng bậc nào do các cổng điều kiện bị khóa chéo.

### 3.4. Leo thang điều trị: Roflumilast, Azithromycin & Thuốc sinh học
- **Cơ sở guideline:** GOLD 2026 Chapter 3 (trang 77, 162–163); Nhãn FDA Daliresp và Dupixent.
- **Đánh giá logic:**
  - **Roflumilast (Finding COPD-R1-11):**
    - Kiểm tra FEV₁ < 50% (`fev1PredPct < 50`) và viêm phế quản mạn (`chronicBronchitis`). Liều 250 mcg x 4 tuần rồi duy trì 500 mcg khớp FDA.
    - Tuy nhiên, gán `action: 'START'` thay vì `CONSIDER` (GOLD ghi "consider adding roflumilast" vì nhiều tác dụng phụ sụt cân, tiêu chảy, thần kinh). Thiếu cổng an toàn cho suy gan trung bình–nặng (Child-Pugh B/C) và người gầy yếu/BMI thấp.
  - **Azithromycin (Finding COPD-R1-10):**
    - Liều dùng 250 mg/ngày hoặc 500 mg x 3 lần/tuần trong 1 năm khớp nghiên cứu COLUMBUS. Rationale cảnh báo QTc và thính lực rất tốt.
    - Tuy nhiên, điều kiện `smoking !== 'former'` đã loại trừ sai nhóm bệnh nhân chưa từng hút thuốc (`never` smoker) bị COPD do ô nhiễm không khí. Cần sửa thành `smoking !== 'current'`.
  - **Dupilumab & Mepolizumab:**
    - Dupilumab (`copd.followup.dupilumab_indication`): Liều 300 mg tiêm dưới da mỗi 2 tuần cho COPD đợt cấp tái phát trên triple therapy, BCAT ≥ 300 /µL và có viêm phế quản mạn (thử nghiệm BOREAS và NOTUS). Khớp chuẩn mực GOLD 2026.
    - **Lỗi nghiêm trọng Mepolizumab (Finding COPD-R1-05):** Quy tắc `copd.followup.mepolizumab_indication` gán cấm cứng `!isChronicBronchitis`, tước đoạt chỉ định Mepolizumab ở người có viêm phế quản mạn.
    - **Thiếu profileDiff (Finding COPD-R1-13):** Chưa gắn chú thích BHYT và tính sẵn có thuốc sinh học tại Việt Nam như đã cam kết trong `COPD.md`.

### 3.5. Rút ICS (De-escalation)
- **Cơ sở guideline:** GOLD 2026 Chapter 3 (trang 77, 162).
- **Đánh giá logic:**
  - Quy tắc `copd.followup.ics_de_escalation` kích hoạt khi bệnh nhân đang dùng ICS (triple hoặc ics_laba) và có tiền sử viêm phổi tái diễn (`priorPneumonia = true`).
  - Chuyển đổi an toàn về LABA + LAMA (`tiotropium_olodaterol`).
  - Có cảnh báo thận trọng nếu BCAT ≥ 300 /µL vì nguy cơ đợt cấp bùng phát lại sau khi rút ICS. Logic rất sắc sảo và chuẩn y khoa.

### 3.6. Can thiệp không dùng thuốc: Cai thuốc lá, LTOT & Tiêm chủng
- **Cơ sở guideline:** GOLD 2026 Chapter 3 (trang 60–63, 87–89); BYT QĐ 2131/2026 Mục 2.5 (trang 26).
- **Đánh giá logic:**
  - Cai thuốc lá (`copd.nonpharm.smoking_cessation`): Chiến lược 5A/5R ở người đang hút thuốc.
  - Tiêm chủng (`copd.nonpharm.vaccinations`): Đã cập nhật đầy đủ toàn bộ các vắc xin mới nhất của GOLD 2026: Cúm hàng năm, Phế cầu (PCV20 hoặc PCV15+PPSV23), RSV (người ≥ 60 tuổi), Tdap (bạch hầu, uốn ván, ho gà), Zona/Shingles (người ≥ 50 tuổi), và Covid-19.
  - Oxy dài hạn tại nhà (`copd.nonpharm.ltot_oxygen`):
    - Đích SpO₂ 88–92%, thời gian thở ≥ 15 giờ/ngày.
    - **Lỗi thiếu sót (Finding COPD-R1-09):** Dòng 635 tái sử dụng sai ngưỡng `copd.oxygen_target_spo2_min` (88%), dẫn đến bỏ sót tiêu chuẩn mở rộng cho bệnh nhân có Tâm phế mạn / Đa hồng cầu có SpO₂ = 89%.
  - **Lỗi bỏ sót Class I (Finding COPD-R1-06):** Hoàn toàn thiếu quy tắc chỉ định Thở máy không xâm nhập tại nhà (Home Non-invasive Ventilation / Long-term NIV) ở bệnh nhân tăng CO2 máu mạn tính (PaCO2 ban ngày ≥ 53 mmHg) kéo dài sau đợt cấp có toan hô hấp.

### 3.7. Xử trí đợt cấp nội viện (Acute Exacerbation)
- **Cơ sở guideline:** GOLD 2026 Chapter 4 (trang 103–120); BYT QĐ 2131/2026 Mục 3.4 (trang 34–42).
- **Đánh giá logic:**
  - **🔴 LỖI NGUY HIỂM TÍNH MẠNG (Finding COPD-R1-01):** Bỏ sót hoàn toàn Thuốc giãn phế quản tác dụng ngắn (SABA / SAMA) dạng khí dung hoặc hít buồng đệm trong đợt cấp cấp cứu!
  - Oxy có kiểm soát (`copd.inpatient.controlled_oxygen`): Đích SpO₂ 88–92% (PaO₂ 60–70 mmHg), thử lại khí máu sau 30–60 phút, cảnh báo toan hô hấp tăng CO₂ nếu thở oxy quá mức. Hoàn toàn chuẩn xác.
  - Corticoid toàn thân (`copd.inpatient.systemic_steroid`): Prednisolone 40 mg/ngày trong đúng 5 ngày. Có `profileDiff` phản ánh khung 5–7 ngày và Methylprednisolone TM của BYT 2131. Rất tốt.
  - Kháng sinh đợt cấp (`copd.inpatient.antibiotics`): Liệu trình 5 ngày. **Lỗi logic (Finding COPD-R1-04):** Điều kiện `isPurulent || isIncreasedVol` kích hoạt dùng kháng sinh sai khi không có đờm mủ. Thiếu phân tầng nguy cơ *Pseudomonas aeruginosa* tại VN (Finding COPD-R1-13).
  - Thở máy không xâm nhập (`copd.inpatient.niv_bipap`): Chỉ định khi toan hô hấp cấp (pH ≤ 7.35 và PaCO₂ ≥ 45 mmHg). Chuẩn xác tuyệt đối.
  - Tiêu chuẩn ICU (`copd.inpatient.icu_transfer`): Toan hô hấp nặng pH ≤ 7.25 hoặc PaCO₂ > 60 mmHg kèm rối loạn tri giác/kiệt sức. Chuẩn xác.
  - Checklist xuất viện (`copd.inpatient.discharge_criteria`): 5 bước đánh giá trước ra viện rất đầy đủ.
  - **Bỏ sót dự phòng VTE (Finding COPD-R1-12):** Thiếu khuyến cáo LMWH cho bệnh nhân đợt cấp nằm bất động tại giường.

---

## 4. Bảng Thẩm Định Trích Dẫn & Locator Đối Chiếu File Gốc

Toàn bộ 40 trích dẫn trong `kb/citations/copd.json` đã được mở và đối chiếu trực tiếp với các tệp văn bản PDF gốc:

| ID Trích dẫn | Nguồn gốc | PDF Trang | Vị trí (Locator) | Trích dẫn nguyên văn & Đánh giá đối chiếu |
|---|---|:---:|---|---|
| `gold.copd.2026.diag_fev1_fvc` | GOLD 2026 Report | p. 15 | Chapter 1 / Definition / p. 15 | *"non-fully reversible airflow obstruction (i.e., FEV1/FVC < 0.7 post -bronchodilation)... confirms the diagnosis"* – **Khớp 100% trang 15** |
| `gold.copd.2026.fev1_fvc_0_7` | GOLD 2026 Report | p. 18 | Chapter 1 / Diagnosis / p. 18 | *"presence of non -fully reversible airflow obstruction (FEV1/FVC < 0.7 post-bronchodilation)"* – **Khớp 100% trang 18** |
| `byt.copd.2026.diag_criteria` | BYT 2131/2026 | p. 15 | Mục 1.3.2 / Chẩn đoán xác định / tr. 15 | *"Đo chức năng hô hấp để chẩn đoán xác định FEV1/FVC < 70% sau test phục hồi phế quản"* – **Khớp 100% trang 15** |
| `byt.copd.2026.gold_classification` | BYT 2131/2026 | p. 16 | Bảng 1.1 / Mức độ tắc nghẽn / tr. 16 | *"GOLD 1: FEV1 ≥ 80%; GOLD 2: 50% ≤ FEV1 < 80%; GOLD 3: 30% ≤ FEV1 < 50%; GOLD 4: FEV1 < 30%"* – **Khớp 100% trang 16** |
| `byt.copd.2026.mmrc_cat_cutoff` | BYT 2131/2026 | p. 17 | Mục 1.4.2 & 1.4.3 / tr. 17 | *"mMRC < 2 được định nghĩa là ít triệu chứng, mMRC ≥ 2 được định nghĩa là nhiều triệu chứng"* – **Khớp 100% trang 17** |
| `byt.copd.2026.cat_score_cutoff` | BYT 2131/2026 | p. 17 | Mục 1.4.3 / CAT / tr. 17 | *"CAT < 10 được định nghĩa ít triệu chứng, CAT ≥ 10 được định nghĩa nhiều triệu chứng"* – **Khớp 100% trang 17** |
| `byt.copd.2026.abe_groups` | BYT 2131/2026 | p. 18 | Mục 1.4.4 / Nhóm ABE / tr. 18 | *"Nhóm E - Nguy cơ cao: có từ 1 đợt cấp mức độ trung bình hoặc nặng trong năm trước"* – **Khớp 100% trang 18** (chứng minh code `rules.ts` viết `>= 2` là sai) |
| `gold.copd.2026.group_e_definition` | GOLD 2026 Report | p. 54 | Chapter 2 / ABE Assessment / p. 54 | *"Consequently, Group E has been modified to include individuals with one moderate exacerbation in the previous year"* – **Khớp 100% trang 54** |
| `gold.copd.2026.initial_group_a` | GOLD 2026 Report | p. 75 | Chapter 3 / Initial Treatment / p. 75 | *"All patients in group A should be offered bronchodilator treatment based on its effect on breathlessness"* – **Khớp 100% trang 75** |
| `gold.copd.2026.initial_group_b` | GOLD 2026 Report | p. 75 | Chapter 3 / Initial Treatment / p. 75 | *"Initial therapy for patients in group B consists of a combination of a LABA and a LAMA"* – **Khớp 100% trang 75** |
| `gold.copd.2026.initial_group_e` | GOLD 2026 Report | p. 75 | Chapter 3 / Initial Treatment / p. 75 | *"LABA+LAMA is the preferred choice for initial therapy of patients in group E"* – **Khớp 100% trang 75** |
| `gold.copd.2026.initial_group_e_triple_eos300` | GOLD 2026 Report | p. 75 | Chapter 3 / Initial Treatment / p. 75 | *"Consider LABA+LAMA+ICS as initial therapy in group E if eosinophil counts are ≥ 300 cells/µL"* – **Khớp 100% trang 75** |
| `gold.copd.2026.followup_dyspnea_laba_lama` | GOLD 2026 Report | p. 76 | Chapter 3 / Follow-up / p. 76 | Figure 3.11: Nâng từ đơn trị lên LABA+LAMA khi khó thở dai dẳng – **Khớp 100% trang 76** |
| `gold.copd.2026.followup_exac_eos_100_300` | GOLD 2026 Report | p. 161 | Chapter 3 / Inhaled Corticosteroids / p. 161 | *"blood eosinophil count ≥ 100 cells/µL identifies patients with greater likelihood of benefit from ICS"* – **Khớp 100% trang 161** |
| `gold.copd.2026.followup_eos_less_100_pneumonia` | GOLD 2026 Report | p. 161 | Chapter 3 / Inhaled Corticosteroids / p. 161 | *"blood eosinophil count < 100 cells/µL identifies patients with little or no likelihood of benefit from ICS... increased risk of pneumonia"* – **Khớp 100% trang 161** |
| `gold.copd.2026.followup_roflumilast` | GOLD 2026 Report | p. 77 | Chapter 3 / Follow-up / p. 77 | *"If FEV1 < 50% predicted, chronic bronchitis and at least one exacerbation resulting in hospitalization, consider adding roflumilast"* – **Khớp 100% trang 77** |
| `gold.copd.2026.followup_azithromycin` | GOLD 2026 Report | p. 77 | Chapter 3 / Follow-up / p. 77 | *"Among those who are not currently smoking, consider adding azithromycin"* – **Khớp 100% trang 77** |
| `gold.copd.2026.biologics_dupilumab_mepolizumab` | GOLD 2026 Report | p. 77 | Chapter 3 / Follow-up / p. 77 | *"Among patients with blood eosinophils ≥ 300 cells/µL, consider adding dupilumab (if chronic bronchitis) or mepolizumab (with and without chronic bronchitis)"* – **Khớp 100% trang 77** (chứng minh code `!isChronicBronchitis` là sai) |
| `fda.copd.roflumilast_dose` | FDA Daliresp label | p. 1 | Dosage & Administration / p. 1 | *"Starting dose: 250 mcg once daily for 4 weeks; Maintenance: 500 mcg once daily"* – **Khớp 100% trang 1** |
| `fda.copd.dupilumab_dose` | FDA Dupixent label | p. 9 | Section 2.8 / Dosage for COPD / p. 9 | *"300 mg administered subcutaneously every 2 weeks (Q2W)"* – **Khớp 100% trang 9** |
| `gold.copd.2026.ics_withdrawal` | GOLD 2026 Report | p. 77 | Chapter 3 / Follow-up / p. 77 | *"Patients treated with LABA+LAMA+ICS should not have the ICS component withdrawn unless the ICS was inappropriately prescribed or adverse effects (e.g. pneumonia)"* – **Khớp 100% trang 77** |
| `gold.copd.2026.vaccination_recommendations` | GOLD 2026 Report | p. 61 | Chapter 3 / Non-pharm / p. 61 | *"Influenza, pneumococcal, RSV (≥60y), COVID-19"* – **Khớp 100% trang 61** |
| `gold.copd.2026.vaccination_tdap_shingles` | GOLD 2026 Report | p. 61 | Chapter 3 / Non-pharm / p. 61 | *"Tdap vaccination... and routine use of shingles vaccine"* – **Khớp 100% trang 61** |
| `gold.copd.2026.ltot_criteria` | GOLD 2026 Report | p. 87 | Chapter 3 / Oxygen / p. 87 | *"PaO2 ≤ 55 mmHg or SaO2 ≤ 88%; or PaO2 55–60 mmHg / SaO2 88–89% if cor pulmonale"* – **Khớp 100% trang 87** |
| `gold.copd.2026.exac_systemic_steroid_40mg_5d` | GOLD 2026 Report | p. 114 | Chapter 4 / Exacerbations / p. 114 | *"Prednisone 40 mg per day for 5 days is recommended (Evidence A)"* – **Khớp 100% trang 114** |
| `gold.copd.2026.exac_antibiotics_5d` | GOLD 2026 Report | p. 103 | Chapter 4 / Key Points / p. 103 | *"The recommended length of antibiotic therapy is 5 days (Evidence A)"* – **Khớp 100% trang 103** |
| `byt.copd.2026.oxygen_target_88_92` | BYT 2131/2026 | p. 41 | Mục 3.4.4(f) / Oxy / tr. 41 | *"Mục tiêu duy trì SpO2 từ 88–92% hoặc PaO2 từ 60–70 mmHg"* – **Khớp 100% trang 41** |
| `byt.copd.2026.niv_indications` | BYT 2131/2026 | p. 42 | Mục 3.4.4(f) / NIV / tr. 42 | *"Toan hô hấp cấp: pH ≤ 7.35 và PaCO2 ≥ 45 mmHg"* – **Khớp 100% trang 42** |
| `gold.copd.2026.exac_ventilatory_failure_rome` | GOLD 2026 Report | p. 105 | Chapter 4 / Rome / p. 105 | *"hypercapnia PaCO2 > 60 mmHg and presence of acidosis pH ≤ 7.25"* – **Khớp 100% trang 105** |
| `byt.copd.2026.discharge_checklist` | BYT 2131/2026 | p. 42 | Mục 3.4.4(g) / Ra viện / tr. 42 | *"Kỹ thuật hít, phác đồ duy trì, tái khám 1–4 tuần"* – **Khớp 100% trang 42** |

> **Nhận xét chuyên môn về trích dẫn:**  
> Hệ thống trích dẫn của module COPD được lập danh mục rất chuẩn mực và trung thực, 100% trích dẫn đều có thật trong văn bản PDF với locator và số trang chính xác. Tuy nhiên, sai sót nằm ở khâu **chuyển thể từ trích dẫn sang mã nguồn TypeScript (`rules.ts`)**: Developer đã trích dẫn đúng nguyên văn (ví dụ: nhóm E có 1 đợt cấp, Mepolizumab dùng cho cả có/không có viêm phế quản mạn) nhưng khi viết code lại tự động gõ sai logic (`modExac >= 2`, `!isChronicBronchitis`)!

---

## 5. Thẩm Định Danh Mục Thuốc (`kb/drugs/`)

Đã thẩm định toàn diện 19 thuốc/phối hợp thuốc chuyên khoa hô hấp:

1. **LAMA đơn chất (`tiotropium.json`, `umeclidinium.json`, `glycopyrronium.json`, `aclidinium.json`):**
   - Tiotropium: Liều 5 mcg (2 nhát Respimat 2.5 mcg) hoặc 1 viên HandiHaler 18 mcg/ngày. Thận trọng suy thận nặng eGFR < 15. Chuẩn xác.
   - Umeclidinium: 55 mcg (62.5 mcg bột hít) 1 lần/ngày vào buổi sáng.
   - Aclidinium: 322 mcg (400 mcg) x 2 lần/ngày (sáng và tối).
2. **LABA đơn chất (`indacaterol.json`, `olodaterol.json`, `salmeterol.json`, `vilanterol.json`):**
   - Indacaterol: 150 mcg x 1 lần/ngày (tối đa 300 mcg/ngày).
   - Olodaterol: 5 mcg (2 nhát Respimat 2.5 mcg) x 1 lần/ngày.
   - Salmeterol: 50 mcg x 2 lần/ngày. Lưu ý chống chỉ định đơn trị nếu có hen đồng mắc.
3. **Phối hợp đôi LABA + LAMA (`tiotropium_olodaterol.json`, `umeclidinium_vilanterol.json`, `glycopyrronium_indacaterol.json`):**
   - Spiolto Respimat: 2 nhát (Tiotropium 2.5 mcg / Olodaterol 2.5 mcg) x 1 lần/ngày sáng.
   - Anoro Ellipta: 1 liều (UMEC 62.5 mcg / VI 25 mcg) x 1 lần/ngày.
   - Ultibro Breezhaler: 1 viên nang (Indacaterol 110 mcg / Glycopyrronium 50 mcg) x 1 lần/ngày.
4. **Phối hợp ba thuốc Single-inhaler Triple therapy (`fluticasone_furoate_umeclidinium_vilanterol.json`, `budesonide_glycopyrronium_formoterol.json`, `beclometasone_glycopyrronium_formoterol.json`):**
   - Trelegy Ellipta (FF/UMEC/VI 100/62.5/25 mcg): 1 hít x 1 lần/ngày. Súc họng sau hít.
   - Breztri Aerosphere (BGF 160/7.2/4.8 mcg): 2 nhát x 2 lần/ngày.
   - Trimbow (BDP/GLY/FF 87/9/5 mcg): 2 nhát x 2 lần/ngày.
5. **Thuốc uống & Thuốc sinh học (`roflumilast.json`, `azithromycin.json`, `dupilumab.json`, `mepolizumab.json`, `theophylline.json`):**
   - Roflumilast: Khởi đầu 250 mcg/ngày x 4 tuần -> duy trì 500 mcg/ngày. Chống chỉ định suy gan Child-Pugh B/C.
   - Azithromycin: 250 mg/ngày hoặc 500 mg x 3 lần/tuần trong 1 năm. Kiểm tra QTc và thính lực.
   - Dupilumab: 300 mg tiêm dưới da mỗi 2 tuần.
   - Mepolizumab: 100 mg tiêm dưới da mỗi 4 tuần.
   - Theophylline: 100–200 mg x 2 lần/ngày (viên giải phóng kéo dài), chuẩn độ nồng độ huyết thanh 8–12 mcg/mL.

---

## 6. Lộ Trình Sửa Đổi Cho Module Owner (Action Plan)

Để module COPD đạt điều kiện **PASS** ở Vòng 2, Module Owner cần thực hiện các sửa đổi sau:

1. **Khắc phục lỗi CRITICAL COPD-R1-01:** Thêm quy tắc `copd.inpatient.short_acting_bronchodilators` chỉ định Salbutamol khí dung (2.5–5 mg) hoặc phối hợp Salbutamol + Ipratropium lặp lại mỗi 20–30 phút cho mọi ca đợt cấp nội viện.
2. **Khắc phục lỗi MAJOR COPD-R1-02:** Tạo threshold `copd.moderate_exac_group_e = 1` và sửa hàm `checkHighExacerbationRisk` để nhận diện bệnh nhân có 1 đợt cấp vừa là Nhóm E. Sửa text trong `inputs.ts` và `COPD.md`.
3. **Khắc phục lỗi MAJOR COPD-R1-03:** Viết quy tắc theo dõi `copd.followup.mono_exac_step_up` nâng bậc lên LABA+LAMA hoặc Triple cho bệnh nhân đang dùng đơn trị liệu LAMA/LABA bị đợt cấp.
4. **Khắc phục lỗi MAJOR COPD-R1-04:** Sửa logic chỉ định kháng sinh đợt cấp: chỉ kích hoạt khi có đờm mủ (`isPurulent === true`) hoặc bệnh nhân cần thở máy NIV/xâm nhập.
5. **Khắc phục lỗi MAJOR COPD-R1-05:** Xóa điều kiện `!isChronicBronchitis` trong quy tắc Mepolizumab.
6. **Khắc phục lỗi MAJOR COPD-R1-06:** Thêm quy tắc `copd.outpatient.home_niv` cho chỉ định thở máy không xâm nhập tại nhà ở bệnh nhân tăng CO2 máu mạn tính kéo dài sau đợt cấp.
7. **Khắc phục lỗi MAJOR COPD-R1-07:** Bổ sung quy tắc `copd.diagnosis.gold_staging` kết luận mức độ tắc nghẽn thông khí GOLD 1, 2, 3, 4.
8. **Khắc phục lỗi MAJOR COPD-R1-08:** Thêm cổng kiểm tra `fev1FvcRatio < 0.70` cho tất cả các quy tắc nhánh theo dõi (follow-up).
9. **Khắc phục các lỗi MINOR:** Tạo threshold riêng cho LTOT khi có tâm phế mạn (SpO2 89%), mở rộng Azithromycin cho người không hút thuốc (`never` smoker), chuyển Roflumilast sang `CONSIDER`, thêm quy tắc dự phòng VTE nội viện và bổ sung `profileDiff` cho Dupilumab/Kháng sinh VN.
