# Báo Cáo Thẩm Định Chuyên Khoa Lipid & Guideline Checker (Round 1 – R1)
## Module Rối Loạn Lipid Máu (`lipid`) – GDMT-VN

- **Reviewer:** R1 – Chuyên gia Lipid / Phòng ngừa Tim mạch / Guideline Checker
- **Ngày thẩm định:** 27/10/2026
- **Vòng đánh giá:** Vòng 1 (Round 1)
- **Tài liệu đối chiếu gốc (mở trực tiếp từ kho `Medical_Library_2026`):**
  1. **2019 ESC/EAS Guidelines for the management of dyslipidaemias** (`01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2019_dyslipidaemias_base.pdf`, Eur Heart J 2020;41:111–188)
  2. **2025 ESC Focused Update on Dyslipidaemias** (`01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2025_dyslipidaemias.pdf`, Eur Heart J 2025;46:4359–4378)
  3. **2021 ESC Guidelines on cardiovascular disease prevention in clinical practice** (`01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2021_cvd_prevention.pdf`, Eur Heart J 2021;42:3227–3337)
  4. **2023 ESC Guidelines for the management of cardiovascular disease in patients with diabetes** (`01_Noi_Khoa/Dai_Thao_Duong/ESC_2023_Diabetes_and_CVD_Guideline.pdf`, Eur Heart J 2023;44:4043–4140)
  5. **2024 ESC Guidelines for the management of chronic coronary syndromes** (`01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2024_chronic_coronary_syndromes.pdf`, Eur Heart J 2024;45:3415–3537)
  6. **2026 ACC/AHA/AACVPR/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Dyslipidemia** (`01_Noi_Khoa/Tim_Mach/ACC_AHA_2026_Dyslipidemia_Guideline.pdf`, J Am Coll Cardiol 2026;87:2624–2757)
  7. **Nhãn thuốc FDA DailyMed:** Lipitor (atorvastatin), Crestor (rosuvastatin), Zocor (simvastatin), Zetia (ezetimibe), Repatha (evolocumab), Leqvio (inclisiran), Nexletol (bempedoic acid).

---

## 1. Kết Luận Chung & Bảng Thống Kê

### Kết luận thẩm định: **FAIL** (Không đạt chuẩn thông qua Vòng 1)

> **Căn cứ theo [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md):**  
> Điều kiện để PASS vòng review chuyên khoa là **0 lỗi CRITICAL và 0 lỗi MAJOR**.  
> Module Rối loạn Lipid máu hiện tồn tại **0 lỗi CRITICAL**, **10 lỗi MAJOR** (vi phạm các khuyến cáo Class I/IIa của ESC/ACC, bỏ sót đích hạ sâu < 1.0 mmol/L, vi phạm mục tiêu kép giảm ≥ 50%, thiếu bậc thang leo thang ezetimibe/PCSK9i, sai chỉ định icosapent ethyl và gán sai ngữ nghĩa ngưỡng lâm sàng), **5 lỗi MINOR** và **3 kiến nghị SUGGESTION**.

### Bảng phân bố phát hiện (Findings Breakdown)

| Mức độ nghiêm trọng (Severity) | Số lượng | Tỷ lệ (%) | Ý nghĩa lâm sàng |
|---|:---:|:---:|---|
| 🔴 **CRITICAL** | **0** | 0.0% | Có thể gây hại trực tiếp cho người bệnh |
| 🟠 **MAJOR** | **10** | 55.6% | Vi phạm nội dung guideline, bỏ sót khuyến cáo Class I, thiếu quy tắc leo thang |
| 🟡 **MINOR** | **5** | 27.8% | Lệch ngữ cảnh trích dẫn, thiếu liều suy thận trung bình, cảnh báo tính toán |
| 🔵 **SUGGESTION** | **3** | 16.6% | Đề xuất bổ sung ca bệnh mẫu, thời điểm đo bilan lipid nội viện, hoàn thiện profile US |
| **TỔNG CỘNG** | **18** | **100%** | |

---

## 2. TOP 5 Vấn Đề Lâm Sàng Trọng Tâm Cần Xử Lý Ngay

1. **🟠 [MAJOR - Finding LIPID-R1-02] Thiếu hoàn toàn Khuyến cáo Class I Bậc thang Leo thang: Phối hợp Ezetimibe khi chưa đạt đích:**  
   Quy tắc ngoại trú `rules.outpatient.ts` hoàn toàn không kiểm tra danh mục thuốc bệnh nhân đang dùng (`ctx.patient.currentMeds`). Nếu một bệnh nhân ASCVD đang uống Atorvastatin 80 mg tối đa mà xét nghiệm lại LDL-C vẫn là 1.9 mmol/L (chưa đạt đích < 1.4 mmol/L), hệ thống lại tiếp tục ra lệnh `START Atorvastatin 80 mg` (kê lại thuốc đang dùng) thay vì khuyến cáo bổ sung Ezetimibe 10 mg theo Khuyến cáo Class I, Level B của ESC/EAS 2019 và ESC 2025.
2. **🟠 [MAJOR - Finding LIPID-R1-03] Thuốc ức chế PCSK9 (Evolocumab, Alirocumab, Inclisiran) hoàn toàn mồ côi khỏi Rule Engine:**  
   Mặc dù module đã tạo đầy đủ 3 file thuốc trong `kb/drugs/`, các ô trong `matrix.ts`, và trích dẫn Class I A (`esc.lipid.2019.pcsk9_add_on_secondary`), nhưng trong toàn bộ code logic của `rules.outpatient.ts` và `rules.inpatient.ts` KHÔNG CÓ BẤT KỲ QUY TẮC NÀO sinh lệnh chỉ định 3 thuốc này. Khi bệnh nhân nguy cơ rất cao dùng statin tối đa + ezetimibe vẫn không đạt đích, hệ thống không đưa ra được bước leo thang tiếp theo.
3. **🟠 [MAJOR - Finding LIPID-R1-01] Bỏ sót Đích hạ sâu LDL-C < 1.0 mmol/L cho Biến cố Mạch máu Tái phát trong vòng 2 năm:**  
   Mặc dù giao diện và tài liệu [LIPID.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/modules/LIPID.md) có nhắc đến đích < 1.0 mmol/L, và trường `conditions.recurrentAcsWithin2Years` đã có trong [inputs.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/inputs.ts), quy tắc ngoại trú `rules.outpatient.ts` hoàn toàn không kiểm tra trường này. Nếu bệnh nhân ASCVD tái phát biến cố trong 2 năm có LDL-C là 1.2 mmol/L (chưa đạt đích < 1.0 mmol/L), hệ thống không sinh bất kỳ can thiệp nào vì luật hiện tại chỉ kiểm tra mốc `ldl > 1.4 mmol/L`.
4. **🟠 [MAJOR - Finding LIPID-R1-05] Vi phạm Nguyên tắc Đích Kép (Dual Goals: Tuyệt đối & Giảm ≥ 50% so với nền):**  
   Cả quy tắc lâm sàng ngoại trú lẫn máy tính [ldlTarget.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/ldlTarget.ts) chỉ kiểm tra nồng độ LDL-C tuyệt đối (`currentLdl <= target`), bỏ qua hoàn toàn tiêu chí bắt buộc giảm ≥ 50% so với mức nền (`baselineLdl`) ở nhóm nguy cơ cao và rất cao. Một bệnh nhân nguy cơ rất cao có LDL nền 2.4 mmol/L và LDL hiện tại 1.35 mmol/L (mới giảm 43.8% < 50%) bị hệ thống kết luận sai là "đã đạt mục tiêu điều trị", vi phạm khuyến cáo Class I A của ESC.
5. **🟠 [MAJOR - Finding LIPID-R1-04] Sai chỉ định Icosapent ethyl trên bệnh nhân chưa từng dùng Statin:**  
   Quy tắc `lipid.tg.residual_icosapent` tự động kích hoạt chỉ định Icosapent ethyl 4 g/ngày trên bệnh nhân có TG 1.5–5.6 mmol/L mà không kiểm tra xem bệnh nhân đã dùng statin hay chưa. Cả ESC 2019 và ACC 2026 đều quy định statin là lựa chọn đầu tay (Class I B) để kiểm soát nguy cơ tim mạch ở bệnh nhân tăng TG, và Icosapent ethyl CHỈ ĐƯỢC CHỈ ĐỊNH CHO TĂNG TG TỒN DƯ DÙ ĐÃ ĐIỀU TRỊ STATIN.

---

## 3. Đối Chiếu Chi Tiết Với Từng Hướng Dẫn Lâm Sàng Gốc

### 3.1. Phân tầng Nguy cơ Tim mạch Toàn diện (ESC/EAS 2019 & ESC 2025 Focused Update)
- **Văn bản đối chiếu:**
  - ESC 2025 Focused Update Table 3 (*Cardiovascular risk categories*), trang 6–7 (Eur Heart J 2025;46:4364–4365).
  - ESC/EAS 2019 Table 4 & Table 5, trang 15–16 (Eur Heart J 2020;41:125–126).
- **Phân tích đối chiếu:**
  1. **Nhóm Rất Cao (Very High Risk):**
     - Guideline quy định: ASCVD rõ rệt; ĐTĐ có tổn thương cơ quan đích (microalbumin niệu, võng mạc, thần kinh) HOẶC ≥ 3 yếu tố nguy cơ chính HOẶC T1DM khởi phát sớm kéo dài > 20 năm; Suy thận nặng (eGFR < 30 mL/phút/1.73m²); SCORE2 / SCORE2-OP ≥ 20%; Tăng cholesterol máu gia đình (FH) kèm ASCVD hoặc kèm 1 YTNC chính.
     - **Sai sót phát hiện:** Trong [ldlTarget.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/ldlTarget.ts), hàm `determineEscRiskTier` bỏ sót hoàn toàn tiêu chuẩn FH (`hasFamilialHypercholesterolemia`). Trong [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/rules.outpatient.ts) (dòng 294–300), luật `lipid.statin.very_high_risk_initiate` chỉ kiểm tra 3 điều kiện: `hasAscvd`, `dmTargetOrganDamage`, `isSevereCkd`, bỏ qua hoàn toàn SCORE2 ≥ 20% và FH kèm biến cố/YTNC.
  2. **Nhóm Cao (High Risk):**
     - Guideline quy định: Yếu tố nguy cơ đơn độc tăng rất cao (TC > 8 mmol/L, LDL-C > 4.9 mmol/L, HA ≥ 180/110 mmHg); Bệnh nhân FH không có YTNC chính khác; ĐTĐ không tổn thương cơ quan đích nhưng kéo dài ≥ 10 năm hoặc có thêm 1 YTNC; Suy thận trung bình (eGFR 30–59 mL/phút/1.73m²); SCORE2 / SCORE2-OP 10% đến < 20%.
     - **Sai sót phát hiện:** Trong `rules.outpatient.ts` (dòng 404–416), luật `lipid.statin.high_risk_initiate` không kiểm tra TC > 8 mmol/L hay LDL-C > 4.9 mmol/L, không kiểm tra SCORE2. Một người khỏe mạnh có tăng cholesterol tiên phát nặng (ví dụ TC 8.5 mmol/L, LDL 5.2 mmol/L) bị rơi qua kẽ hở và không được nhận khuyến cáo statin nguy cơ cao!
     - **Lỗi ngữ nghĩa nghiêm trọng:** Dòng 413 `rules.outpatient.ts` sử dụng `egfr < th('lipid.reduction.pcsk9_alone')` (ngưỡng 60% giảm LDL của PCSK9i) để làm mốc lọc thận eGFR < 60 mL/phút (Finding LIPID-R1-07).
  3. **Nhóm Trung Bình & Nhóm Thấp:**
     - Guideline quy định: Nhóm trung bình (ĐTĐ người trẻ < 10 năm; SCORE2 2–<10%); Nhóm thấp (SCORE2 < 2%).
     - **Sai sót phát hiện:** [rules.outpatient.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/lipid/rules.outpatient.ts) **hoàn toàn không có bất kỳ quy tắc nào** cho nhóm nguy cơ trung bình và thấp. Bệnh nhân nguy cơ trung bình có LDL 3.2 mmol/L (vượt đích < 2.6 mmol/L) không nhận được bất kỳ chỉ dẫn nào về thay đổi lối sống hay cân nhắc statin (Finding LIPID-R1-06).

---

### 3.2. Mục Tiêu Điều Trị LDL-C & Nguyên Tắc Đích Kép (Dual Target)
- **Văn bản đối chiếu:**
  - ESC/EAS 2019 Table 7 & Recommendations p. 22 (Eur Heart J 2020;41:132).
  - ESC 2025 Focused Update Table 4 (*Intervention strategies*), trang 7 (Eur Heart J 2025;46:4365).
- **Phân tích đối chiếu:**
  - **Mục tiêu kép (Class I, Level A):**
    - Nhóm rất cao: Giảm ≥ 50% so với mức nền VÀ nồng độ LDL-C < 1.4 mmol/L (< 55 mg/dL).
    - Nhóm cao: Giảm ≥ 50% so với mức nền VÀ nồng độ LDL-C < 1.8 mmol/L (< 70 mg/dL).
  - **Thực tế trong code:**
    - File `ldlTarget.ts` (dòng 173): `isTargetAchieved = currentLdlMmol <= targetLdlMmol;` chỉ kiểm tra nồng độ tuyệt đối.
    - File `rules.outpatient.ts` (dòng 301, 418): chỉ kiểm tra `ldl > target`.
    - Hậu quả: Nếu bệnh nhân có LDL nền 2.4 mmol/L, sau điều trị đạt 1.35 mmol/L (mới giảm 43.8% < 50%), hệ thống báo đã đạt đích, tước bỏ cơ hội điều chỉnh tối ưu hóa liều statin liều cao theo đúng khuyến cáo Class I A (Finding LIPID-R1-05).
  - **Mục tiêu hạ sâu < 1.0 mmol/L (< 40 mg/dL) cho biến cố tái phát trong 2 năm (Class IIb, Level B):**
    - Quy tắc ngoại trú `rules.outpatient.ts` bỏ quên hoàn toàn trường `conditions.recurrentAcsWithin2Years`. Bệnh nhân tái phát biến cố trong 2 năm có LDL 1.2 mmol/L bị bỏ sót không được can thiệp (Finding LIPID-R1-01).

---

### 3.3. Bậc Thang Leo Thang Phác Đồ Dược Lý (Statin → Ezetimibe → PCSK9i / Bempedoic)
- **Văn bản đối chiếu:**
  - ESC/EAS 2019 Section 8.1.2 & Figure 4 (Eur Heart J 2020;41:145–147).
  - ESC 2025 Focused Update Recommendation Table 2 (Eur Heart J 2025;46:4369).
  - 2024 ESC CCS Guidelines Section 4.1.3 (Eur Heart J 2024;45:3498).
- **Phân tích đối chiếu:**
  - **Bước 1 (Statin cường độ cao tối đa dung nạp - Class I A):** Quy tắc `lipid.statin.very_high_risk_initiate` khởi trị Atorvastatin 40–80 mg hoặc Rosuvastatin 20–40 mg là đúng. Khởi đầu Rosuvastatin 5 mg ở người châu Á tuân thủ nhãn FDA Crestor p. 4 (`fda.rosuvastatin.asian_dose`).
  - **Bước 2 (Thêm Ezetimibe 10 mg khi chưa đạt đích - Class I B):** Quy tắc ngoại trú **chưa được viết**. Hệ thống không kiểm tra `currentMeds`, không thể leo thang từ statin đơn trị sang phối hợp ezetimibe (Finding LIPID-R1-02).
  - **Bước 3 (Thêm ức chế PCSK9 - Class I A/C):** Hoàn toàn bị bỏ sót trong toàn bộ rule engine (Finding LIPID-R1-03).
  - **Bước phối hợp Bempedoic acid khi không dung nạp statin (Class I B - ESC 2025):** Quy tắc `lipid.statin_intolerance.bempedoic` hoạt động tốt với Bempedoic acid 180 mg, nhưng thiếu bổ sung lệnh kê Ezetimibe 10 mg đi kèm (Finding LIPID-R1-15).

---

### 3.4. Quản Lý Hội Chứng Vành Cấp (ACS) Nội Viện & Phối Hợp Sớm (ESC 2025)
- **Văn bản đối chiếu:**
  - ESC 2025 Focused Update Recommendation Table 3 (*Recommendations for the management of patients presenting with ACS*), trang 12 (Eur Heart J 2025;46:4370).
  - 2024 ESC CCS Guidelines Section 4.1.3, trang 88 (Eur Heart J 2024;45:3502).
- **Phân tích đối chiếu:**
  - **Khởi trị statin liều cao sớm trong 24h đầu bất kể LDL nền (Class I A):** Quy tắc `lipid.inpatient.acs_early_statin` thực thi rất chuẩn xác.
  - **Bệnh nhân đã dùng LLT trước khi nhập viện (Class I C):** Khuyến cáo tăng cường ngay phác đồ trong thời gian nằm viện (`esc.lipid.2025.acs_prior_llt`) bị bỏ sót; hệ thống chỉ áp dụng chung quy tắc Class IIa B cho mọi bệnh nhân ACS (Finding LIPID-R1-09).
  - **Lấy máu xét nghiệm lipid sớm trong 24h (Class I C):** Quy tắc nội trú chưa có mục nhắc nhở xét nghiệm lipid profile trong 24h đầu nhập viện (Finding LIPID-R1-17).

---

### 3.5. Kiểm Soát Triglycerid & Ngưỡng An Toàn Chức Năng Thận
- **Văn bản đối chiếu:**
  - ESC/EAS 2019 Section 9.1 & 9.2 (Eur Heart J 2020;41:148–152).
  - ACC/AHA 2026 Dyslipidemia Guideline Section 4.1 & Table 5, trang 27–30.
- **Phân tích đối chiếu:**
  - **TG ≥ 5.6 mmol/L (≥ 500 mg/dL):** Khởi trị Fenofibrate 145–200 mg phòng viêm tụy cấp là hoàn toàn chuẩn xác (Class I C - ESC 2019; Class 1 B - ACC 2026).
  - **Cổng an toàn thận cho Fenofibrate:** Chống chỉ định tuyệt đối khi eGFR < 30 mL/phút/1.73m² được thực thi chính xác ở cả ngoại trú và nội trú (`rec_feno_ckd_contra` / `rec_inpatient_feno_ckd_contra`). Tuy nhiên, quy tắc chưa hạ liều xuống 67–100 mg/ngày khi eGFR 30–59 mL/phút (Finding LIPID-R1-13).
  - **Triglycerid tồn dư 1.5–5.6 mmol/L:** Bị lỗi kích hoạt Icosapent ethyl trên bệnh nhân chưa dùng statin (Finding LIPID-R1-04).

---

### 3.6. Lipoprotein(a) – Sàng Lọc & Hành Động Can Thiệp
- **Văn bản đối chiếu:**
  - ESC 2025 Focused Update Section 6 & Recommendation Table 4, trang 12 (Eur Heart J 2025;46:4370).
  - ACC/AHA 2026 Section 3.2.
- **Phân tích đối chiếu:**
  - **Đo Lp(a) ít nhất một lần trong đời (Class IIa C):** Quy tắc `lipid.lpa.screening_lifetime` thực hiện đúng khi `lpa === undefined`.
  - **Xử trí khi Lp(a) > 50 mg/dL (> 105 nmol/L - Class IIa B):** Bị bỏ sót hoàn toàn. Người dùng nhập Lp(a) tăng cao nhưng hệ thống không có bất kỳ phản hồi lâm sàng nào (Finding LIPID-R1-10).

---

### 3.7. Các Thuật Toán Tính Điểm Nguy Cơ (SCORE2, SCORE2-OP, SCORE2-Diabetes, PREVENT)
- **Văn bản đối chiếu:**
  - Eur Heart J 2021;42:2439–2454 (SCORE2) & 2455–2467 (SCORE2-OP).
  - Eur Heart J 2023;44:2544–2556 (SCORE2-Diabetes).
  - Circulation 2024;149:430–449 (AHA PREVENT).
- **Phân tích đối chiếu:**
  - Máy tính [prevent.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/prevent.ts) được xây dựng rất công phu, chuẩn xác và đã được kiểm định qua R package `preventr`.
  - Máy tính [score2.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/score2.ts): SCORE2 cơ bản cho người 40–69 tuổi hoạt động tốt; tuy nhiên SCORE2-OP và SCORE2-Diabetes sử dụng các hệ số nhân xấp xỉ tự quy ước chưa chuẩn hóa, biến `needsSourceVerification` vẫn là `true` nhưng không kích hoạt cảnh báo `result.warning` cho người dùng (Finding LIPID-R1-14).
  - Điểm quan trọng nhất: Rule engine `lipid` hiện tại **hoàn toàn tách rời khỏi các máy tính nguy cơ**. Kết quả tính toán từ SCORE2 hay PREVENT không được đưa vào `ctx.derived` để phân tầng trong các quy tắc ngoại trú.

---

## 4. Kiểm Tra Toàn Bộ Trích Dẫn (Citation Audit) & Nhãn Thuốc

- **Kết quả kiểm toán trích dẫn nguyên văn qua công cụ `verifyLipidCitations.ts`:**
  - Tổng số trích dẫn trong `kb/citations/lipid.json`: **52 citations**.
  - Tỷ lệ khớp nguyên văn chính xác 100% trong PDF: **52/52 PASSED (100%)**.
  - Không có trích dẫn nào bị lỗi sai trang (Wrong Page) hay vượt quá biên sai số (Page Tolerance).
- **Các điểm bất cập về ngữ cảnh trích dẫn phát hiện:**
  - `acc.lipid.2026.transaminase_3x_uln`: Trích dẫn câu dịch tễ học thay vì hướng dẫn xử trí lâm sàng tăng men gan (Finding LIPID-R1-11).
  - `esc.lipid.2025.acs_naive_combination`: Trích dẫn khuyến cáo nội viện ACS cho quy tắc ngoại trú (Finding LIPID-R1-12).
  - `esc.lipid.2025.acs_prior_llt`: Trích dẫn Class I C có sẵn nhưng bị bỏ quên không liên kết vào rule nào (Finding LIPID-R1-09).
- **13 Nhãn thuốc hạ lipid trong `kb/drugs/`:**
  - Tất cả 13 thuốc đều đã được khai báo trường an toàn thai kỳ `pregnancy` đầy đủ (hợp lệ theo chuẩn R3-CKD-01/02).
  - Bảng dải chức năng thận (`renal`) của Atorvastatin, Rosuvastatin, Simvastatin, Ezetimibe, Bempedoic acid, Fenofibrate, Icosapent ethyl khớp hoàn toàn nhãn FDA và hướng dẫn ACC/AHA 2026.

---

## 5. Danh Mục Đầy Đủ Các Phát Hiện Thẩm Định (Findings Catalog)

*(Chi tiết định dạng JSON lưu trữ tại [round1_R1.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/lipid/round1_R1.json))*

| Mã Finding | Mức độ | Phân loại | Mục liên quan | Tóm tắt phát hiện |
|---|:---:|:---:|---|---|
| **LIPID-R1-01** | 🟠 Major | `rule` | `lipid.statin.very_high_risk_initiate` | Bỏ sót đích hạ sâu LDL-C < 1.0 mmol/L cho ASCVD tái phát trong 2 năm |
| **LIPID-R1-02** | 🟠 Major | `missing` | `lipid.escalation.statin_to_ezetimibe` | Thiếu khuyến cáo Class I leo thang phối hợp Ezetimibe khi chưa đạt đích |
| **LIPID-R1-03** | 🟠 Major | `missing` | `lipid.escalation.pcsk9_inhibitors` | Thiếu khuyến cáo Class I cho ức chế PCSK9 (Evolocumab/Alirocumab/Inclisiran) |
| **LIPID-R1-04** | 🟠 Major | `rule` | `lipid.tg.residual_icosapent` | Sai chỉ định Icosapent ethyl trên bệnh nhân chưa từng dùng statin |
| **LIPID-R1-05** | 🟠 Major | `rule` | `lipid.target.dual_50_percent_reduction` | Vi phạm nguyên tắc Đích Kép (chỉ xét nồng độ tuyệt đối, bỏ qua giảm ≥ 50%) |
| **LIPID-R1-06** | 🟠 Major | `missing` | `lipid.primary_prevention.moderate_and_low` | Bỏ sót quy tắc quản lý cho nhóm nguy cơ trung bình (< 2.6) và thấp (< 3.0) |
| **LIPID-R1-07** | 🟠 Major | `rule` | `lipid.statin.high_risk_initiate` | Lỗi gán sai ngữ nghĩa ngưỡng: dùng ngưỡng PCSK9 60% làm mốc eGFR < 60 |
| **LIPID-R1-08** | 🟠 Major | `rule` | `determineEscRiskTier` trong `ldlTarget.ts` | Phân tầng nguy cơ tim mạch bỏ sót hoàn toàn bệnh nhân FH |
| **LIPID-R1-09** | 🟠 Major | `missing` | `lipid.inpatient.acs_prior_llt` | Bỏ sót khuyến cáo Class I C tăng cường phác đồ nội viện ACS cho BN đã dùng LLT |
| **LIPID-R1-10** | 🟠 Major | `rule` | `lipid.lpa.elevated_action` | Không có bất kỳ hành động lâm sàng nào khi nhập nồng độ Lp(a) tăng cao (> 50 mg/dL) |
| **LIPID-R1-11** | 🟡 Minor | `citation` | `lipid.safety.alt_elevation` | Gán trích dẫn ACC dịch tễ thay vì trích dẫn hướng dẫn xử trí men gan của ESC |
| **LIPID-R1-12** | 🟡 Minor | `citation` | `lipid.combo.upfront_very_high_far_from_target` | Trích dẫn nguồn nội viện ACS cho quy tắc ngoại trú xa đích |
| **LIPID-R1-13** | 🟡 Minor | `rule` | `lipid.tg.severe_pancreatitis_prevention` | Không điều chỉnh giảm liều Fenofibrate khi suy thận trung bình (eGFR 30–59) |
| **LIPID-R1-14** | 🟡 Minor | `calculator` | `src/engine/calculators/score2.ts` | SCORE2-OP và SCORE2-Diabetes dùng xấp xỉ chưa kiểm chứng nhưng thiếu cờ cảnh báo |
| **LIPID-R1-15** | 🟡 Minor | `rule` | `lipid.statin_intolerance.bempedoic` | Tiêu đề ghi Bempedoic + Ezetimibe nhưng cấu trúc khuyến cáo chỉ trả về 1 thuốc |
| **LIPID-R1-16** | 🔵 Suggestion | `ui` | `src/modules/lipid/presets.ts` | Bổ sung ca bệnh mẫu có tăng Lipoprotein(a) để minh họa đào tạo |
| **LIPID-R1-17** | 🔵 Suggestion | `rule` | `lipid.inpatient.acs_early_lipid_panel` | Bổ sung khuyến cáo Class I C đo lipid máu sớm trong 24h đầu nhập viện ACS |
| **LIPID-R1-18** | 🔵 Suggestion | `rule` | `profileDiff.US` | Bổ sung phân tích so sánh chi tiết với hướng dẫn ACC/AHA 2026 cho profile US |

---

## 6. Lộ Trình Sửa Chữa Đề Xuất Cho Module Owner (Agent I)

1. **Khắc phục ngay 4 quy tắc cốt lõi về bậc thang leo thang hạ lipid:**
   - Đọc trường `ctx.patient.currentMeds`: Nếu bệnh nhân đã dùng statin liều cao mà chưa đạt đích (hoặc chưa giảm ≥ 50%), sinh lệnh `START ezetimibe` (10 mg/ngày) theo Class I B.
   - Nếu bệnh nhân đã dùng statin + ezetimibe mà chưa đạt đích ở nhóm nguy cơ rất cao/cao, sinh lệnh `CONSIDER` hoặc `START` nhóm ức chế PCSK9 (`evolocumab`, `alirocumab`, `inclisiran`) hoặc `bempedoic_acid`.
2. **Kích hoạt đích hạ sâu < 1.0 mmol/L:**
   - Kiểm tra `conditions.recurrentAcsWithin2Years`: nếu dương tính, đặt mục tiêu `< 1.0 mmol/L` và kích hoạt phác đồ can thiệp tối ưu.
3. **Thực thi nguyên tắc Đích Kép (Dual Target):**
   - Trong `rules.outpatient.ts` và `ldlTarget.ts`: nếu có `baselineLdl`, chỉ coi là đạt đích khi đồng thời đạt nồng độ tuyệt đối VÀ mức giảm so với nền ≥ 50%.
4. **Sửa các lỗi ngưỡng lâm sàng và chỉ định:**
   - Tạo threshold riêng `lipid.safety.egfr_moderate_ckd_max` = 60 mL/min/1.73m2 thay thế cho threshold `lipid.reduction.pcsk9_alone` tại dòng 413.
   - Thêm điều kiện đang dùng statin cho luật `lipid.tg.residual_icosapent`.
   - Bổ sung quy tắc cho nhóm nguy cơ trung bình (< 2.6 mmol/L) và thấp (< 3.0 mmol/L).
   - Tách riêng khuyến cáo Class I C cho bệnh nhân ACS đã dùng LLT trước nhập viện.
   - Thêm quy tắc cảnh báo tái phân tầng nguy cơ khi Lp(a) > 50 mg/dL.
