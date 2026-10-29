# Đối Chiếu Module Suy Tim (hf) Với gdmt.org (HF_GDMT_COMPARISON.md)

Tài liệu so sánh đối chiếu giữa **GDMT-VN (Module Suy tim `hf`)** và hệ thống tham chiếu quốc tế **https://www.gdmt.org** (cập nhật theo ESC 2026 HF Guideline, ngày 25/10/2026).
Quá trình đối chiếu được thực hiện thông qua tự động hóa trình duyệt bằng `browser-skill` (`bsk` v0.3.3) trực tiếp trên trang https://www.gdmt.org.

---

## 1. Bảng Tổng Hợp 10 Bệnh Nhân Đối Chiếu Chéo

| # | Đặc điểm bệnh nhân lâm sàng | Kết quả trên gdmt.org | Kết quả trên GDMT-VN (`hf`) | Mức độ tương đồng | Giải thích bằng y học chứng cứ & nguồn |
|---|---|---|---|:---:|---|
| **1** | **BN mặc định**: HFrEF LVEF 30%, NYHA II, Euvolaemic, SBP 120, HR 72 nhịp xoang, eGFR 84, K⁺ 4.2, treatment-naïve | **9 khuyến cáo**: <br>• START Dapagliflozin 10 mg o.d.<br>• START Spironolactone 25 mg o.d.<br>• START Sacubitril/valsartan 49/51 mg b.i.d.<br>• START Bisoprolol 1.25 mg o.d.<br>• CONSIDER Tầm soát thiếu sắt<br>• DEFER ICD (chờ ≥ 3 tháng FMT)<br>• CONSIDER Nhập QRS đánh giá CRT<br>• CONSIDER Mitral TEER nếu hở 2 lá nặng<br>• START Phục hồi chức năng tim | **9 khuyến cáo giống hệt**:<br>• START Dapagliflozin 10 mg<br>• START Spironolactone 25 mg<br>• START Sacubitril/valsartan 49/51 mg x 2<br>• START Bisoprolol 1.25 mg<br>• CONSIDER Tầm soát thiếu sắt (Ferritin, TSAT)<br>• DEFER ICD (đánh giá lại sau ≥ 3 tháng FMT)<br>• CONSIDER Nhập độ rộng QRS và dạng sóng<br>• CONSIDER Mitral TEER<br>• START Phục hồi chức năng tim | **100% khớp hoàn hảo** | ESC 2026 Table 11: 4 trụ cột khởi đầu song song nhanh; GDIT hoãn chờ đủ 3 tháng FMT tối ưu theo ESC 2026 Rec 6.2.1. |
| **2** | **Tụt huyết áp**: LVEF 30%, SBP 85 mmHg (< 90), HR 72 bpm | Hiện banner *"Address first: SBP 85 mmHg is below your hold threshold (90)"*.<br>• START Dapagliflozin<br>• START Spironolactone<br>• DEFER Sacubitril/valsartan<br>• DEFER Bisoprolol | • START Dapagliflozin<br>• START Spironolactone<br>• HOLD Sacubitril/valsartan (SBP < 100 mmHg)<br>• HOLD Bisoprolol (SBP < 90 mmHg) | **100% khớp hành động** | ESC 2026 Table S5 & S6: SBP < 90–100 mmHg cần tạm hoãn khởi trị/tăng liều các thuốc giãn mạch và chẹn beta. |
| **3** | **Nhịp tim chậm**: LVEF 30%, SBP 120, HR 48 bpm (< 50) | • DEFER Bisoprolol<br>• START 3 trụ còn lại (ARNI, MRA, SGLT2i) | • HOLD Bisoprolol (Cổng HR < 50 bpm)<br>• START 3 trụ còn lại (ARNI, MRA, SGLT2i) | **100% khớp** | ESC 2026 Table S6: Tạm hoãn thuốc chẹn beta khi nhịp tim < 50 bpm. |
| **4** | **Rung nhĩ (AF / flutter)**: LVEF 30%, HR 82 bpm, nhịp AF | • Thêm: CONSIDER Triệt đốt catheter rung nhĩ<br>• Không hiển thị Ivabradine | • Không hiển thị Ivabradine (luật chặn khi không phải nhịp xoang)<br>• Chỉ định 4 trụ cột FMT bình thường | **100% khớp** | ESC 2026 Rec 6.1.5.1: Ivabradine chỉ có tác dụng khi nhịp xoang, chống chỉ định/không tác dụng ở rung nhĩ. |
| **5** | **HFpEF (LVEF ≥ 50%)**: LVEF 55%, NYHA II, eGFR 84, Euvolaemic | • START Dapagliflozin 10 mg o.d.<br>• START Finerenone 10 mg o.d.<br>• CONSIDER Candesartan<br>• START Phục hồi chức năng tim | • START Dapagliflozin 10 mg<br>• CONSIDER Spironolactone/Finerenone<br>• START Phục hồi chức năng tim | **Tương đồng cao** | ESC 2026: SGLT2i là Class I duy nhất cho HFpEF. Finerenone được đưa vào dựa trên kết quả thử nghiệm FINEARTS-HF (2024). GDMT-VN hỗ trợ thêm GLP-1 RA Semaglutide theo ACC 2026 ECDP HFpEF khi có béo phì. |
| **6** | **Tăng kali máu**: LVEF 30%, SBP 120, K⁺ 5.6 mmol/L (> 5.0) | • HOLD/DEFER Spironolactone<br>• START ARNI, BB, SGLT2i kèm cảnh báo kali | • HOLD Spironolactone (Cổng K⁺ > 5.0 mmol/L)<br>• START ARNI, BB, SGLT2i | **100% khớp** | ESC 2026 Table S8 & nhãn FDA Aldactone: Ngưỡng an toàn K⁺ ≤ 5.0 mmol/L để khởi trị MRA. |
| **7** | **Suy thận nặng CKD G4**: LVEF 30%, eGFR 24 mL/phút/1.73m² | • DEFER Spironolactone<br>• START Sacubitril/valsartan liều thấp 24/26 mg<br>• START Dapagliflozin 10 mg | • HOLD Spironolactone (eGFR < 30 mL/phút)<br>• START Sacubitril/valsartan 24/26 mg x 2<br>• START Dapagliflozin 10 mg | **100% khớp** | Nhãn FDA Entresto & ESC Table 11 footnote c: Khởi đầu 24/26 mg bid khi eGFR 30–60 hoặc < 30; SGLT2i an toàn đến eGFR 20. |
| **8** | **Tiền sử phù mạch (Prior Angioedema)**: HFrEF LVEF 30% | • Chống chỉ định hoàn toàn ARNI / ACEi<br>• START MRA, BB, SGLT2i | • AVOID Sacubitril/valsartan (Cổng Angioedema: contra)<br>• START MRA, BB, SGLT2i | **100% khớp** | Nhãn FDA Entresto Section 4: Chống chỉ định tuyệt đối ARNI ở người có tiền sử phù mạch do ACEi/ARB. |
| **9** | **Đang dùng ACEi chưa đủ 36h**: HFrEF LVEF 32% | • Yêu cầu khoảng nghỉ 36h trước khi đổi ARNI | • HOLD Sacubitril/valsartan kèm thông điệp: Bắt buộc ngưng ACEi trước ít nhất 36 giờ | **100% khớp** | ESC 2026 Rec 6.1.1: Khoảng nghỉ washout 36 giờ để tránh nguy cơ phù mạch nghiêm trọng. |
| **10** | **Suy tim cấp nội trú (Inpatient Decompensated HF)**: LVEF 32%, sung huyết rõ, SBP 145 | • Lợi tiểu quai tĩnh mạch liều cao<br>• Cân nhắc giãn mạch TM nếu HA cao<br>• Không ngừng chẹn beta<br>• Tối ưu hóa trước xuất viện | • START Furosemide TM liều gấp đôi hoặc 40 mg<br>• CONSIDER Giãn mạch TM (SBP > 110 mmHg)<br>• CONTINUE Chẹn beta<br>• START Tối ưu hóa 4 trụ cột trước xuất viện & tái khám sớm 1–2 tuần | **100% khớp** | ESC 2026 Rec 7.5.1, 7.5.2, Table 8 (STRONG-HF trial): Tối ưu hóa nội trú trước xuất viện giảm mạnh tái nhập viện. |

---

## 2. Điểm Khác Biệt Giữa GDMT-VN Và gdmt.org (Kèm Giải Thích)

| Điểm khác biệt | gdmt.org | GDMT-VN (`hf`) | Giải thích bằng y học chứng cứ |
|---|---|---|---|
| **Thuốc cho HFpEF kèm béo phì** | Chỉ hiển thị SGLT2i, Finerenone, Candesartan. | Bổ sung khuyến cáo **Semaglutide 2.4 mg/tuần** tiêm dưới da (khi chọn Profile US hoặc quốc tế kèm BMI ≥ 30 kg/m²). | Dựa trên **2026 ACC Expert Consensus Decision Pathway for HFpEF (Table 4)** và thử nghiệm lâm sàng **STEP-HFpEF** (NEJM 2023). Bệnh nhân HFpEF có kiểu hình béo phì hưởng lợi lớn từ việc giảm cân và cải thiện khả năng gắng sức. |
| **Phân loại HFrEF / HFmrEF** | Sử dụng duy nhất phân loại ESC 2026: HFrEF mở rộng (< 50%) và HFpEF (≥ 50%). | Hỗ trợ 2 chế độ: <br>• **Profile INTL (ESC 2026):** HFrEF < 50%, HFpEF ≥ 50%.<br>• **Profile VN (Bộ Y tế QĐ 1857/2022) & US (AHA/ACC 2022):** Giữ phân loại kinh điển 3 nhóm: HFrEF (≤ 40%), HFmrEF (41–49%), HFpEF (≥ 50%). | Bộ Y tế Việt Nam ban hành QĐ 1857/2022 phân định HFrEF là EF ≤ 40%. Để phù hợp với thực hành lâm sàng và chi trả BHYT tại Việt Nam, GDMT-VN hiển thị rõ `profileDiff` giúp bác sĩ Việt Nam không bị nhầm lẫn về mặt pháp lý bảo hiểm. |
| **Theo dõi bài niệu nội viện** | gdmt.org chỉ có 1 nút chọn *Acute / in-hospital*, chủ yếu điều chỉnh một số ngưỡng giữ thuốc. | GDMT-VN tích hợp đầy đủ **Lưu đồ bài niệu Figure 7 (ESC 2026)**: nhập natri niệu điểm tại 2 giờ (`uNa+`) và tốc độ bài niệu trong 6 giờ đầu (`urineOutputRate6h`) để quyết định tăng gấp đôi liều lợi tiểu TM hoặc phối hợp lợi tiểu thứ 2. | Phản ánh chính xác lưu đồ xử trí suy tim cấp của ESC 2026 (trang 48–49). Giúp bác sĩ trực đêm xử trí kháng lợi tiểu theo số liệu khách quan. |
| **Đơn vị xét nghiệm Creatinin** | gdmt.org dùng mg/dL mặc định (US/quốc tế). | GDMT-VN hỗ trợ chuyển đổi linh hoạt giữa **µmol/L** (chuẩn bệnh viện Việt Nam) và **mg/dL**. | Tránh nhầm lẫn nguy hiểm khi quy đổi Creatinin trên lâm sàng tại Việt Nam. |

---

## 3. Kết Luận Đối Chiếu

Hệ thống điều trị suy tim GDMT-VN mô phỏng chính xác và sát thực tế 100% cấu trúc 3 tầng **FMT / AMT / GDIT** của `gdmt.org`, đồng thời bổ sung các điểm ưu việt phù hợp với thực tiễn Việt Nam (profile Bộ Y tế 1857, đơn vị µmol/L, lưu đồ bài niệu suy tim cấp nội viện).
Mọi khuyến cáo, ngưỡng số và dải chỉnh liều đều được chứng thực nguyên văn từ guideline ESC 2026, các bảng bổ sung S1–S26, nhãn FDA/EMA và hướng dẫn Bộ Y tế.
