# Báo Cáo Thẩm Định Chuyên Môn Vòng 1 – Reviewer R2 (Dược Sĩ Lâm Sàng)
## Module: Bệnh Thận Mạn (CKD) – GDMT-VN

- **Reviewer**: R2 – Dược sĩ lâm sàng (Clinical Pharmacist)
- **Vòng duyệt**: Round 1
- **Ngày thực hiện**: 27/10/2026
- **Phạm vi thẩm định**:
  1. 18 tệp dữ liệu thuốc `gdmt-vn/kb/drugs/*.json` thuộc CKD:
     - Nhóm SGLT2i: `dapagliflozin`, `empagliflozin`, `canagliflozin`
     - Nhóm ACEi: `enalapril`, `perindopril`, `lisinopril`, `ramipril`, `captopril`
     - Nhóm ARB: `losartan`, `valsartan`, `telmisartan`, `irbesartan`, `candesartan`
     - Nhóm nsMRA: `finerenone`
     - Nhóm gắn Kali: `patiromer`, `sodium_zirconium_cyclosilicate`, `calcium_polystyrene_sulfonate`
     - Nhóm kiềm hóa: `sodium_bicarbonate`
  2. Ma trận an toàn thuốc `src/modules/ckd/matrix.ts`
  3. Liều dùng trong các luật khuyến cáo: `src/modules/ckd/rules.outpatient.ts`, `src/modules/ckd/rules.inpatient.ts`
  4. Ca lâm sàng mẫu: Chạy đánh giá động (`evaluate()`) với 4 presets trong `presets.ts` và 26 ca chuẩn trong `tests/golden/ckd/*.json`
  5. Đối chiếu nhãn FDA / EMA chính thức trong `Medical_Library_2026/09_Nhan_Thuoc/` và hướng dẫn quốc tế (KDIGO 2024, KDIGO 2012 AKI, UKKA 2022, BYT 2024).

---

## 1. TỔNG QUAN KẾT QUẢ THẨM ĐỊNH

| Mức độ nghiêm trọng (Severity) | Số lượng | Ghi chú |
|---|:---:|---|
| **CRITICAL** (Nguy cơ gây hại trực tiếp) | **1** | Nhầm lẫn ngưỡng toan chuyển hóa ngoại trú (`HCO3- < 18 mmol/L`) làm tiêu chuẩn chỉ định đặt catheter và lọc máu cấp cứu khẩn cấp |
| **MAJOR** (Sai sót liều/guideline/nhãn thuốc) | **10** | Nhầm biệt dược Resonium A (chứa Na) sang CPS; sai thứ nguyên liều SZC (5 mg vs 5 g); ma trận AKI continue caution; ma trận G4 eGFR 22; SGLT2i mất khuyến cáo continue khi eGFR ≥ 20; canagliflozin/patiromer vnBrands; mâu thuẫn liều NaHCO3; thiếu washout 36h ARNI ở 4 ACEi; thiếu gate thai kỳ ở 10 RASi; CI-AKI nhân đôi referral threshold |
| **MINOR** (Lỗi hiển thị UI, thiếu cảnh báo phụ) | **4** | Lặp text liều Finerenone; biệt dược Mỹ không lưu hành tại VN; thiếu cảnh báo perioperative hold Canagliflozin; thiếu cảnh báo hạ Mg máu Patiromer |
| **SUGGESTION** (Kiến nghị cải tiến) | **1** | Bổ sung đầy đủ 8 thuốc RASi còn lại vào ma trận |
| **TỔNG CỘNG** | **16** | |

### KẾT LUẬN CUỐI VÒNG 1: **FAIL**
*(Theo quy chuẩn `docs/REVIEW_PROTOCOL.md`: Module chỉ đạt PASS khi có 0 lỗi Critical và 0 lỗi Major).*

---

## 2. BẢNG CHI TIẾT TỪNG HOẠT CHẤT (DRUGENTRY AUDIT - 18 THUỐC)

| STT | Hoạt chất | Phân nhóm | Liều khởi đầu | Liều đích / Tối đa | Ngưỡng thận (eGFR/CrCl) | Biệt dược tại VN | Đánh giá lâm sàng R2 |
|:---:|---|:---:|---|---|---|---|---|
| 1 | **Dapagliflozin** | SGLT2i | 10 mg 1 lần/ngày | 10 mg 1 lần/ngày | Khởi trị ≥ 20; Duy trì < 20 đến lọc máu | Forxiga (5, 10 mg) | **ĐẠT LIỀU CHUẨN**. Đúng KDIGO 2024 1A & FDA Farxiga. Thiếu gate chống chỉ định lọc máu. |
| 2 | **Empagliflozin** | SGLT2i | 10 mg 1 lần/ngày | 10 mg 1 lần/ngày (25 mg cho ĐTĐ) | Khởi trị ≥ 20; Duy trì < 20 đến lọc máu | Jardiance (10, 25 mg) | **ĐẠT LIỀU CHUẨN**. Bước chuẩn độ step=15 không phù hợp cho CKD (chỉ giữ 10 mg). |
| 3 | **Canagliflozin** | SGLT2i | 100 mg 1 lần/ngày | 100 mg 1 lần/ngày | Khởi trị ≥ 20 (FDA: ≥ 30); Duy trì đến lọc máu | *Chưa lưu hành đại trà* | **CẦN SỬA**. Ghi `vnBrands: ["Invokana"]` sai thực tế VN. Thiếu cảnh báo ngừng 3 ngày trước mổ. |
| 4 | **Enalapril** | ACEi | 5 mg/ngày (2.5 mg nếu eGFR < 30) | 20 mg/ngày (Max 40) | ≥ 30: 5–20 mg; 15–30: 2.5–10 mg; < 15: 2.5 mg | Renitec, Ednyt (*bỏ Vasotec*) | **CẦN SỬA**. Thiếu cảnh báo washout 36h với ARNI; thiếu Gate Rule thai kỳ; Vasotec là tên Mỹ. |
| 5 | **Perindopril** | ACEi | 2.5–5 mg/ngày | 10 mg/ngày | CrCl ≥ 60: 5–10 mg; 30–60: 2.5 mg; 15–30: 2.5 mg cách ngày | Coversyl (2.5, 5, 10 mg) | **CHUẨN XÁC**. Khớp hoàn toàn EMA Coversyl Arginine SmPC Table 1. Thiếu Gate thai kỳ. |
| 6 | **Lisinopril** | ACEi | 10 mg/ngày (2.5–5 mg nếu eGFR < 30) | 20 mg/ngày (Max 40) | ≥ 30: 10–40 mg; 15–30: 5 mg; < 15: 2.5 mg | Zestril (*bỏ Prinivil*) | **CẦN SỬA**. Thiếu washout 36h ARNI; thiếu Gate thai kỳ; Prinivil là tên Mỹ. |
| 7 | **Ramipril** | ACEi | 2.5 mg/ngày (1.25 mg nếu eGFR < 30) | 10 mg/ngày | ≥ 30: 2.5–10 mg; < 30: 1.25–5 mg | Tritace (*bỏ Altace*) | **CẦN SỬA**. Thiếu washout 36h ARNI; thiếu Gate thai kỳ; Altace là tên Mỹ. |
| 8 | **Captopril** | ACEi | 25 mg x 2–3 lần/ngày | 50 mg x 3 lần/ngày (Max 150) | ≥ 30: 25–50 mg x 3; < 30: 12.5–25 mg x 2–3 | Capoten, Captopril Stada | **CẦN SỬA**. Thiếu washout 36h ARNI; thiếu Gate thai kỳ. |
| 9 | **Losartan** | ARB | 50 mg/ngày (25 mg nếu thiếu dịch) | 100 mg/ngày | ≥ 30: 50–100 mg; 15–30: 25–50 mg; < 15: 25 mg | Cozaar, Zaart (50, 100 mg) | **ĐẠT LIỀU CHUẨN**. Đúng RENAAL & FDA. Thiếu Gate thai kỳ. |
| 10 | **Valsartan** | ARB | 80 mg/ngày (40 mg nếu HA thấp/cao tuổi) | 160–320 mg/ngày | ≥ 30: 80–320 mg; < 30: 40–160 mg | Diovan (80, 160 mg) | **ĐẠT LIỀU CHUẨN**. Thiếu Gate thai kỳ. |
| 11 | **Telmisartan** | ARB | 40 mg/ngày (20 mg nếu suy gan) | 80 mg/ngày | ≥ 15: 40–80 mg (thải mật 98%); < 15: 20–40 mg | Micardis, Telma (40, 80 mg) | **ĐẠT LIỀU CHUẨN**. Ghi chú thải trừ qua mật rất tốt. Thiếu Gate thai kỳ. |
| 12 | **Irbesartan** | ARB | 150 mg/ngày (75 mg nếu lọc máu) | 300 mg/ngày | ≥ 15: 150–300 mg; < 15: 75–150 mg | Aprovel (150, 300 mg) | **ĐẠT LIỀU CHUẨN**. Đúng nghiên cứu IDNT. Thiếu Gate thai kỳ. |
| 13 | **Candesartan** | ARB | 8 mg/ngày (4 mg nếu eGFR < 30) | 16–32 mg/ngày | ≥ 30: 8–32 mg; < 30: 4–16 mg | Atacand (4, 8, 16 mg) | **ĐẠT LIỀU CHUẨN**. Thiếu Gate thai kỳ. |
| 14 | **Finerenone** | nsMRA | 10 mg (eGFR 25–59); 20 mg (eGFR ≥ 60) | 20 mg/ngày | eGFR ≥ 60: 20 mg; 25–59: 10 mg; < 25: Chống chỉ định khởi mới | Kerendia (10, 20 mg) | **XUẤT SẮC**. Khớp hoàn toàn FDA Table 1 & 2 và KDIGO 2024. Cần tinh chỉnh UI hiển thị liều. |
| 15 | **Patiromer** | K binder | 8.4 g 1 lần/ngày | 8.4–16.8 g/ngày (Max 25.2) | An toàn mọi giai đoạn CKD (không hấp thu) | *Chưa lưu hành đại trà* | **CẦN SỬA**. Ghi `vnBrands: ["Veltassa"]` sai thực tế VN. Thiếu cảnh báo hạ Mg máu. |
| 16 | **Sodium Zirconium Cyclosilicate (SZC)** | K binder | 10 g x 3 lần/ngày (48h đầu) | 5–10 g/ngày (Max 15) | An toàn mọi giai đoạn CKD & chạy thận | Lokelma (5, 10 g) | **SAI ĐƠN VỊ**. Ghi nhầm "5 mg cách ngày" thay vì "5 g cách ngày" ở liều duy trì. |
| 17 | **Calcium Polystyrene Sulfonate (CPS)** | K binder | 15 g x 2–3 lần/ngày | 10–15 g x 2–3 lần/ngày (Max 45) | An toàn ở CKD, trao đổi K lấy Ca | Kalimate, K-Pion (*bỏ Resonium A*) | **SAI BIỆT DƯỢC**. Ghi Resonium A (chứa Na) thay vì Kalimate/K-Pion. Nguy cơ quá tải natri. |
| 18 | **Sodium Bicarbonate** | Kiềm hóa | 1000 mg x 2–3 lần/ngày | 2–4 g/ngày (Duy trì HCO3 22–26) | Chỉ định khi HCO3 < 18 mmol/L | Natri Bicarbonat 500 mg | **MÂU THUẪN LIỀU**. `amount: 1000 x 2-3` (= 2-3g) nhưng description ghi `1-2 g/ngày`. |

---

## 3. PHÂN TÍCH CHI TIẾT CÁC FINDING TRỌNG TÂM

### Finding CKD-R2-01 (CRITICAL): Chỉ định Lọc máu Cấp cứu Nhầm Ngưỡng Toan Máu Ngoại Trú (HCO3- < 18 mmol/L)
- **Vị trí**: `src/modules/ckd/rules.inpatient.ts` (dòng 265, rule `ckd.inpatient.emergency_dialysis_indication`).
- **Phân tích cơ chế**:
  Quy tắc kích hoạt lọc máu cấp cứu nội viện kiểm tra điều kiện:
  ```typescript
  const refractoryK = k !== undefined && k >= th('ckd.hyperkalemia.severe_min');
  const severeAcidosis = hco3 !== undefined && hco3 < th('ckd.acidosis.hco3_min');
  const prolongedAnuria = urineRate === 'anuria_12h';
  return refractoryK || severeAcidosis || prolongedAnuria;
  ```
  Biến `severeAcidosis` đang gọi `th('ckd.acidosis.hco3_min')` có giá trị là **18 mmol/L**.
  Trong y khoa:
  - Ngưỡng **HCO3- < 18 mmol/L** theo KDIGO 2024 (Practice Point 3.10.1) và Bộ Y tế 2024 là ngưỡng để bắt đầu **uống Natri Bicarbonat ngoại trú** nhằm duy trì kiềm máu mạn tính 22–26 mmol/L, bảo vệ xương và giảm hủy cơ.
  - Tiêu chuẩn lọc máu cấp cứu cho Toan chuyển hóa (chữ **A** trong bảng chỉ định kinh điển **AEIOU**) bắt buộc phải là: Toan máu nặng mất bù đe dọa tính mạng kháng trị với bù kiềm nội khoa (**pH < 7.15** hoặc **HCO3- < 10–12 mmol/L**).
- **Hệ quả trên ca bệnh thực tế**:
  Khi chạy `evaluate()` trên BN 3 (`ckd_preset_3_inpatient_aki_stage2`, bệnh nhân nam 71 tuổi viêm phổi kèm AKI giai đoạn 2, HCO3- là 17 mmol/L), hệ thống phát sinh ngay:
  `[REFER] rec_ckd_emergency_rrt: CHỈ ĐỊNH LỌC MÁU CẤP CỨU (Thận nhân tạo ngắt quãng HD / CRRT)`
  với lý do: `"Toan chuyển hóa nặng mất bù (HCO3- 17 mmol/L). Cần đặt catheter lọc máu có cuff/không cuff cấp cứu và tiến hành lọc máu giải phóng kali và cân bằng nội môi"`.
  Đây là một chỉ định can thiệp xâm lấn sai lầm và cực kỳ nguy hiểm, có thể dẫn đến việc đặt catheter tĩnh mạch trung tâm không cần thiết, phơi nhiễm bệnh nhân với nguy cơ thủng mạch máu, tràn máu màng phổi, nhiễm trùng huyết và biến cố huyết động do lọc máu.
- **Hành động khắc phục**:
  Tạo ngay một Threshold mới trong KB: `ckd.inpatient.emergency_acidosis_hco3_max` với giá trị **10 hoặc 12 mmol/L** (hoặc tích hợp thêm tiêu chuẩn khí máu động mạch pH < 7.15), tách rời hoàn toàn khỏi ngưỡng 18 mmol/L của NaHCO3 đường uống.

---

### Finding CKD-R2-02 (MAJOR): Nhầm Lẫn Giữa "Resonium A" (Muối Natri) và "Calcium Polystyrene Sulfonate" (Muối Calci)
- **Vị trí**: `kb/drugs/calcium_polystyrene_sulfonate.json` & `rules.outpatient.ts` (dòng 721).
- **Phân tích dược lý**:
  - `Resonium A` là biệt dược gốc của hãng Sanofi chứa **Sodium Polystyrene Sulfonate (SPS)**. Thuốc này giải phóng ion Na+ vào đại tràng để đổi lấy ion K+. Mỗi liều 15 g Resonium A đưa vào cơ thể khoảng **43 mmol (tương đương 1.000 mg) Natri nguyên tố** (tương đương ~2.5 g muối ăn NaCl). Đối với bệnh nhân CKD giai đoạn 4–5 hoặc bệnh nhân có kèm tăng huyết áp kháng trị, suy tim sung huyết, việc nạp một lượng lớn natri từ Resonium A sẽ gây bùng phát đợt cấp suy tim, phù phổi cấp và tăng huyết áp ác tính.
  - `Kalimate` hoặc `K-Pion` chứa **Calcium Polystyrene Sulfonate (CPS)**. Thuốc trao đổi ion K+ lấy Ca2+, không làm tăng tải lượng natri nên là lựa chọn ưu tiên tại Việt Nam cho bệnh nhân suy thận mạn có quá tải tuần hoàn.
  - Việc `calcium_polystyrene_sulfonate.json` ghi `vnBrands: ["Resonium A"]` và `rules.outpatient.ts` viết tiêu đề `"Sử dụng chất gắn Kali (Resonium) để duy trì RASi"` sẽ khiến bác sĩ trẻ hoặc điều dưỡng kê nhầm Resonium A cho bệnh nhân suy tim ứ huyết với niềm tin rằng đó là thuốc gốc canxi.
- **Hành động khắc phục**:
  Xóa hoàn toàn "Resonium A" khỏi tệp `calcium_polystyrene_sulfonate.json`. Sửa thành `vnBrands: ["Kalimate", "K-Pion", "Calcium Resonium"]`. Điều chỉnh text hiển thị trong module thành `Kalimate (Calcium Polystyrene Sulfonate)`.

---

### Finding CKD-R2-03 (MAJOR): Sai Thứ Nguyên Liều Duy Trì Của Lokelma (SZC)
- **Vị trí**: `kb/drugs/sodium_zirconium_cyclosilicate.json` (dòng 25).
- **Phân tích**:
  Trường `target.description` ghi:
  `"Liều duy trì 10 g 1 lần/ngày (hoặc 5 mg cách ngày - 15 g/ngày)"`
  Thuốc Lokelma được đóng gói dạng gói bột pha hỗn dịch **5 g** và **10 g** (gram). Liều giảm duy trì tối thiểu được FDA/EMA phê duyệt là **5 g dùng cách ngày** (5 grams every other day). Việc ghi `"5 mg cách ngày"` là lỗi nhầm lẫn thứ nguyên nghiêm trọng (nhỏ hơn 1.000 lần liều thực tế).
- **Hành động khắc phục**:
  Sửa chuỗi thành: `"Liều duy trì 10 g 1 lần/ngày (hoặc 5 g cách ngày đến 15 g/ngày tùy nồng độ K+ máu)"`.

---

### Finding CKD-R2-04 (MAJOR): Ô AKI Trên Ma Trận Hiển Thị `continue: 'caution'` Mâu Thuẫn Với Quy Tắc Ngừng Thuốc Khẩn Cấp
- **Vị trí**: `src/modules/ckd/matrix.ts` (dòng 59-66, hàm `getAkiCell`).
- **Phân tích lâm sàng**:
  Tại hàm `getAkiCell`, đối với SGLT2i (dapagliflozin, empagliflozin, canagliflozin), nsMRA (finerenone) và RASi (perindopril, losartan), mã nguồn trả về:
  `{ initiate: 'contra', continue: 'caution' }`
  Trong đợt tổn thương thận cấp (AKI):
  1. Với SGLT2i: Nguy cơ toan ceton đái tháo đường euglycemic tăng vọt do giảm thải acid hữu cơ và giảm thể tích; KDIGO 2024 Practice Point 3.7.2 yêu cầu bắt buộc phải ngừng tạm thời (withhold/hold).
  2. Với ACEi/ARB và nsMRA: Các thuốc này làm dãn tiểu động mạch đi, làm giảm áp lực siêu lọc nội cầu thận. Khi thận đang thiếu máu cục bộ trong AKI, việc tiếp tục dùng RASi sẽ triệt tiêu cơ chế bù trừ huyết động của thận, gây suy sụp GFR cấp tính và tăng kali máu tử vong.
  Chính rule nội viện `ckd.inpatient.hold_sick_day_meds` đã ra lệnh: `action: 'HOLD' - TẠM NGỪNG khẩn cấp các thuốc`. Do đó, ma trận thể hiện `continue: 'caution'` là không đồng nhất và có thể bị hiểu nhầm là "cho phép tiếp tục dùng thận trọng".
- **Hành động khắc phục**:
  Đổi giá trị `continue` trong `getAkiCell` thành `'hold'` (hoặc `'contra'`).

---

### Finding CKD-R2-06 (MAJOR): Bỏ Sót Hoàn Toàn Khuyến Cáo Duy Trì SGLT2i Khi eGFR ≥ 20 mL/min/1.73m²
- **Vị trí**: `src/modules/ckd/rules.outpatient.ts`.
- **Hiện tượng**:
  - Luật `sglt2i_initiate` có điều kiện `if (hasSglt2i) return false;` -> Không chạy khi BN đã dùng SGLT2i.
  - Luật `sglt2i_continue_below_20` có điều kiện `egfr < 20` -> Chỉ chạy khi eGFR < 20.
  - Khi bệnh nhân đang dùng Forxiga 10 mg và có eGFR = 22 mL/min/1.73m² (như Preset 2) hoặc eGFR = 45 mL/min/1.73m²: Cả 2 luật đều không thỏa mãn!
  Hậu quả là hệ thống không đưa ra bất kỳ khuyến cáo nào về SGLT2i, thuốc bị "bốc hơi" khỏi kế hoạch điều trị. Bác sĩ sử dụng GDMT-VN sẽ không biết bệnh nhân có nên tiếp tục dùng SGLT2i hay không, có cần chỉnh liều không.
- **Hành động khắc phục**:
  Bổ sung rule `ckd.outpatient.sglt2i_continue_on_treatment` xác nhận duy trì thuốc ở liều 10 mg/ngày, theo dõi biến cố mất nước và chức năng thận.

---

### Finding CKD-R2-08 (MAJOR): Mâu Thuẫn Thông Số Liều Natri Bicarbonat
- **Vị trí**: `kb/drugs/sodium_bicarbonate.json` (dòng 16-21).
- **Phân tích**:
  - `start.amount: 1000`
  - `start.frequency: "2–3 lần/ngày"`
  => Tổng liều ngày: 2.000 – 3.000 mg/ngày (2–3 g/ngày).
  - Nhưng `start.description` lại ghi: `"1–2 g/ngày chia 2–3 lần"`.
  Khi chạy qua hàm `fmtDose`, chuỗi hiển thị thành: `"1000 mg x 2–3 lần/ngày (uống) - 1–2 g/ngày chia 2–3 lần"`. Một dược sĩ hoặc bác sĩ nhìn vào chuỗi này sẽ thấy hai con số hoàn toàn chọi nhau (1000 mg x 2 đã là 2 g; 1000 mg x 3 là 3 g; không thể là 1-2 g được).
- **Hành động khắc phục**:
  Chỉnh lại `amount: 500`, `unit: "mg"`, `frequency: "2–3 lần/ngày"`, `description: "500–1000 mg x 2–3 lần/ngày (tổng liều 1–2 g/ngày, chỉnh liều theo HCO3- huyết thanh)"`.

---

### Finding CKD-R2-09 & CKD-R2-10 (MAJOR): Thiếu Cảnh Báo Washout ARNI 36 Giờ và Thiếu Gate Thai Kỳ Cho Nhóm RASi
- **Vị trí**: Các file `enalapril.json`, `lisinopril.json`, `ramipril.json`, `captopril.json`, `losartan.json`, `valsartan.json`, `telmisartan.json`, `irbesartan.json`, `candesartan.json`.
- **Phân tích**:
  1. **Thời gian chờ ARNI 36h**: Sacubitril ức chế neprilysin làm chậm thoái giáng bradykinin; ức chế men chuyển (ACEi) cũng ngăn thoái giáng bradykinin. Dùng đồng thời hoặc dùng quá gần nhau dẫn đến tích lũy bradykinin ồ ạt, gây phù mạch thanh quản cấp tử vong. FDA và SmPC bắt buộc khoảng trống đào thải (washout period) tối thiểu 36 giờ. Cần ghi rõ trong cả 4 file ACEi còn lại như đã làm ở Perindopril.
  2. **Gate Rule Thai kỳ**: Nhóm thuốc tác động lên hệ RAS (ACEi và ARB) mang Cảnh báo Hộp Đen (Boxed Warning) của FDA về độc tính thai nhi (vô niệu thai nhi, thiểu ối, giảm sản xương sọ, tử vong chu sinh). Việc cả 10 file thuốc RASi đều không có Gate Rule thai kỳ trong mảng `gates` của DrugEntry là một lỗ hổng an toàn của Knowledge Base.
- **Hành động khắc phục**:
  Thêm Gate Rule thai kỳ vào `gates` của cả 10 thuốc RASi và bổ sung cảnh báo washout 36h vào trường `interactions` của 4 file ACEi.

---

## 4. ĐÁNH GIÁ MA TRẬN BẰNG CHỨNG (`matrix.ts`)

1. **Phạm vi thuốc**:
   Ma trận hiện có 10 thuốc: 3 SGLT2i, 1 nsMRA, 2 RASi, 3 chất gắn Kali, 1 kiềm hóa. Ma trận chạy mượt mà, cấu trúc cell gọn gàng, nhưng thiếu 8 thuốc RASi đã có trong KB.
2. **Cột G4 (15–29 mL/min/1.73m²)**:
   Do đánh giá tại điểm cố định eGFR = 22, ma trận bị lệch pha với 2 ngưỡng cắt quan trọng của guideline:
   - SGLT2i: Ngưỡng khởi trị là 20. Điểm 22 cho ra `initiate: 'rec'`, nhưng từ 15 đến 19 thì không được khởi trị.
   - Finerenone: Ngưỡng khởi trị là 25. Điểm 22 cho ra `initiate: 'not_rec'`, nhưng từ 25 đến 29 thì lại được phép khởi trị liều 10 mg.
   Cần bổ sung chú thích rõ ràng trong `note` của ô G4 để tránh hiểu lầm trên giao diện lâm sàng.
3. **Cột AKI**:
   Phải đổi `continue` từ `'caution'` thành `'hold'` cho các thuốc SGLT2i, RASi, nsMRA để nhất quán với y học chứng cứ và luật nội viện.

---

## 5. ĐÁNH GIÁ CÁC CA LÂM SÀNG CHUẨN (GOLDEN CASES & PRESETS)

1. **26 Golden Cases (`tests/golden/ckd/*.json`)**:
   - Tất cả 26 ca kiểm thử đều chạy vượt qua (`26 passed`).
   - Các ca bao phủ tốt các tình huống: khởi trị SGLT2i trên ĐTĐ, duy trì SGLT2i dưới 20, khởi trị RASi cho A3 không ĐTĐ, chuẩn độ RASi, finerenone khởi đầu 10 mg vs 20 mg, hoãn finerenone khi K+ cao, tránh dual RASi, ngừng NSAID, bù kiềm NaHCO3, dùng chất gắn kali, statin cho CKD ≥ 50 tuổi, chuyển chuyên khoa thận theo KFRE/eGFR/UACR, hướng dẫn ngày ốm, chống chỉ định thai kỳ/phù mạch, và các ca AKI nội viện.
2. **4 Bệnh nhân Mẫu (`presets.ts`)**:
   - **Preset 1 (ĐTĐ2 + CKD G3bA3)**: Đạt rất tốt, khởi trị đủ 4 trụ cột (Dapagliflozin, Finerenone, tăng liều Losartan, Statin). Nhược điểm: Text liều finerenone bị lặp chuỗi giải thích dài.
   - **Preset 2 (CKD G4 + Toan máu + Tăng K+ mạn)**: Bù kiềm và gắn kali hoạt động đúng; tuy nhiên Dapagliflozin bị biến mất do thiếu rule duy trì khi eGFR ≥ 20.
   - **Preset 3 (Nội trú AKI Stage 2)**: Tạm ngừng thuốc ngày ốm (Jardiance, Renitec, Metformin) hoạt động rất tốt; tuy nhiên phát sinh **LỖI NGUY HIỂM CRITICAL** chỉ định lọc máu cấp cứu do nhầm ngưỡng HCO3- = 17 mmol/L < 18.
   - **Preset 4 (Cấp cứu tăng Kali nặng K+ 6.8 + ECG)**: Kích hoạt gói hồi sức 5 bước UKKA 2022 (Canxi gluconate 30 mL + Insulin/Glucose + Salbutamol + SZC + Lọc máu) rất chuẩn xác và đúng liều lượng.

---

## 6. KẾT LUẬN & ĐỀ XUẤT CHO ĐIỀU PHỐI (COORDINATOR)

- **Kết luận**: **FAIL (Vòng 1)**.
- **Lý do**: Tồn tại **1 lỗi Critical** (chỉ định lọc máu cấp cứu xâm lấn sai ngưỡng toan máu) và **10 lỗi Major** (sai biệt dược gắn kali, sai thứ nguyên liều SZC, mâu thuẫn ô AKI ma trận, mất khuyến cáo duy trì SGLT2i, thiếu cảnh báo an toàn then chốt về ARNI và thai kỳ).
- **Hành động tiếp theo**:
  1. Chuyển danh sách findings cho Module Owner (Agent B / Ckd Dev) xử lý triệt để toàn bộ 1 lỗi Critical và 10 lỗi Major.
  2. Cập nhật các tệp `kb/drugs/*.json` về biệt dược lưu hành tại VN, thứ nguyên liều và bổ sung các cổng an toàn thai kỳ/washout ARNI.
  3. Sau khi hoàn tất sửa đổi, tiến hành thẩm định Vòng 2 độc lập theo đúng quy trình `REVIEW_PROTOCOL.md`.
