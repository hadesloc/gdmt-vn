# Báo Cáo Thẩm Định Chuyên Môn Vòng 1 – Reviewer R2 (Dược Sĩ Lâm Sàng)
## Module: Bệnh Phổi Tắc Nghẽn Mạn Tính (COPD) – GDMT-VN

- **Reviewer**: R2 – Dược sĩ lâm sàng (Clinical Pharmacist – Thuốc Hô hấp)
- **Vòng duyệt**: Round 1
- **Ngày thực hiện**: 27/10/2026
- **Phạm vi thẩm định**:
  1. Toàn bộ các tệp dữ liệu thuốc hô hấp liên quan trong `gdmt-vn/kb/drugs/*.json`:
     - Nhóm LAMA đơn chất: `tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`
     - Nhóm LABA đơn chất: `indacaterol`, `olodaterol`, `salmeterol`, `vilanterol`
     - Nhóm phối hợp đôi LAMA + LABA: `tiotropium_olodaterol` (Spiolto), `glycopyrronium_indacaterol` (Ultibro), `umeclidinium_vilanterol` (Anoro)
     - Nhóm phối hợp ba thuốc trong một bình hít (Single-Inhaler Triple Therapy - SITT):
       - `fluticasone_furoate_umeclidinium_vilanterol` (Trelegy Ellipta)
       - `budesonide_glycopyrronium_formoterol` (Breztri Aerosphere)
       - `beclometasone_glycopyrronium_formoterol` (Trimbow)
     - Nhóm ICS + LABA: `budesonide_formoterol`, `fluticasone_salmeterol`, `fluticasone_vilanterol`, `beclometasone_formoterol`
     - Thuốc đường uống bổ sung: `roflumilast` (ức chế PDE4), `azithromycin` (kháng sinh dự phòng macrolide), `theophylline` (methylxanthine)
     - Thuốc sinh học tiêm dưới da: `dupilumab` (anti-IL-4Rα), `mepolizumab` (anti-IL-5)
     - Thuốc xử trí đợt cấp: `methylprednisolone`, `prednisolone`, kháng sinh, `salbutamol`, `ipratropium`
  2. Hai bảng ma trận trong `src/modules/copd/matrices.ts`:
     - `copdMatrixTherapy`: Ma trận lựa chọn liệu pháp duy trì theo phân nhóm A/B/E & Bạch cầu ái toan (GOLD 2026)
     - `copdMatrixDevices`: Bảng đặc điểm các thiết bị phân phối thuốc hít có tại Việt Nam (pMDI, SMI Respimat, DPI, Máy khí dung)
  3. Liều dùng và logic trong các luật khuyến cáo: `src/modules/copd/rules.ts`
  4. Ca lâm sàng mẫu: Chạy đánh giá động (`evaluate()`) với 5 presets trong `presets.ts` và 26 ca chuẩn trong `tests/golden/copd/*.json`
  5. Đối chiếu tài liệu y văn gốc:
     - Hướng dẫn toàn cầu GOLD 2026 (GOLD 2026 Report & Pocket Guide)
     - Nhãn thuốc chính thức FDA / EMA (`Medical_Library_2026/09_Nhan_Thuoc/FDA/FDA_label_roflumilast.pdf`, `FDA_label_dupilumab.pdf`, Breztri, Trelegy, Trimbow, Spiriva)
     - Hướng dẫn Bộ Y tế Việt Nam: QĐ 2131/QĐ-BYT 2026 và QĐ 2767/QĐ-BYT 2023.

---

## 1. TỔNG QUAN KẾT QUẢ THẨM ĐỊNH

| Mức độ nghiêm trọng (Severity) | Số lượng | Tóm tắt các vấn đề trọng tâm |
|---|:---:|---|
| **CRITICAL** (Nguy cơ gây hại trực tiếp) | **2** | 1) Cấu hình liều Breztri và Trimbow ghi `amount: 160 mcg` và `amount: 87 mcg` dẫn tới hiển thị "160 mcg 2 lần/ngày" và "87 mcg 2 lần/ngày", gây nguy cơ bệnh nhân/điều dưỡng chỉ xịt **1 nhát x 2 lần/ngày** (thiếu hụt 50% liều điều trị chuẩn là **2 nhát x 2 lần/ngày**).<br>2) Khởi trị Roflumilast ở bệnh nhân có xơ gan / suy gan trung bình-nặng (Child-Pugh B hoặc C) do thiếu Gate chống chỉ định tuyệt đối. |
| **MAJOR** (Sai sót guideline/liều/nhãn) | **7** | 1) Kê kháng sinh đợt cấp sai tiêu chuẩn Anthonisen khi đờm trắng trong không mủ chỉ vì có tăng thể tích đờm.<br>2) Bỏ sót hoàn toàn khuyến cáo thuốc giãn phế quản tác dụng ngắn (SABA / SAMA) trong xử trí đợt cấp nội viện.<br>3) Chỉ định Oxy dài hạn tại nhà (LTOT) sai thời điểm do thiếu gate loại trừ đợt cấp.<br>4) Loại trừ sai Mepolizumab khi có viêm phế quản mạn (trái nguyên văn GOLD 2026 tr. 76: "with and without chronic bronchitis").<br>5) Khuyến cáo Corticoid và Kháng sinh nội viện thiếu `drugId` làm tê liệt tương tác thuốc và kiểm tra an toàn.<br>6) Ma trận điều trị duy trì gán `initiate: 'rec'` cho Roflumilast, Azithromycin và Dupilumab ở các cột Nhóm E (vốn là thuốc add-on leo thang).<br>7) Khai báo biệt dược tại VN (`vnBrands`) sai thực tế lưu hành (Aclidinium Eklira Genuair, Umeclidinium Incruse đơn chất, Vilanterol gán tên thiết bị Ellipta, Roflumilast Daliresp/Daxas). |
| **MINOR** (Lỗi mô hình UI, thiếu cảnh báo phụ) | **4** | 1) Ma trận thiết bị hít (`copdMatrixDevices`) gán `drugId` thuốc thật (`tiotropium`) cho hàng đặc tính kỹ thuật cơ học.<br>2) Toàn bộ nhóm thuốc LAMA thiếu Gate cảnh báo Glaucoma góc đóng và Bí tiểu / Phì đại lành tính tuyến tiền liệt có ứ đọng nước tiểu.<br>3) Azithromycin dự phòng loại trừ bệnh nhân chưa từng hút thuốc (`never` smoker do chất đốt sinh khối nông thôn).<br>4) Thiếu Gate kiểm tra khoảng QTc (Azithromycin) và nồng độ độc tính / TDM bắt buộc (Theophylline). |
| **SUGGESTION** (Kiến nghị cải tiến) | **1** | Bổ sung Mepolizumab vào ma trận điều trị và mở rộng sang profile VN kèm ghi chú tình trạng phê duyệt. |
| **TỔNG CỘNG** | **14** | |

### KẾT LUẬN CUỐI VÒNG 1: **FAIL**
*(Theo quy chuẩn `docs/REVIEW_PROTOCOL.md`: Module chỉ đạt PASS khi có 0 lỗi Critical và 0 lỗi Major).*

---

## 2. BẢNG CHI TIẾT TỪNG HOẠT CHẤT (DRUGENTRY AUDIT - 22 THUỐC)

| STT | Hoạt chất | Phân nhóm | Liều khởi đầu & Cách dùng | Thiết bị / Dạng bào chế | Biệt dược có tại VN | Đánh giá dược lâm sàng R2 |
|:---:|---|:---:|---|---|---|---|
| 1 | **Tiotropium** | LAMA | 5 mcg x 1 lần/ngày (2 nhát Respimat) hoặc 18 mcg (1 viên HandiHaler) | SMI (Respimat) / DPI (HandiHaler) | Spiriva Respimat, Spiriva HandiHaler | **ĐẠT LIỀU CHUẨN**. Đúng nhãn và BYT 2131. Thiếu Gate Glaucoma góc đóng và bí tiểu. MaxDose chưa bao quát HandiHaler 18 mcg. |
| 2 | **Tiotropium / Olodaterol** | LAMA + LABA | 5/5 mcg x 1 lần/ngày (2 nhát vào buổi sáng) | SMI (Respimat) | Spiolto Respimat (2.5/2.5 mcg/nhát) | **XUẤT SẮC**. Khớp hoàn toàn nhãn và BYT 2131. Là lựa chọn ưu tiên hàng đầu nhóm B & E (BCAT thấp). |
| 3 | **Umeclidinium** | LAMA | 55 mcg (62.5 mcg metered) x 1 lần/ngày | DPI (Ellipta) | *Chưa lưu hành đơn chất tại VN* | **CẦN SỬA BIỆT DƯỢC**. Ghi `vnBrands: ['Incruse Ellipta']` sai thực tế vì GSK không phân phối đơn chất Incruse tại VN. |
| 4 | **Umeclidinium / Vilanterol** | LAMA + LABA | 62.5/25 mcg (55/22 mcg giao tới phổi) x 1 lần/ngày | DPI (Ellipta) | Anoro Ellipta | **CHUẨN XÁC**. Khớp hoàn toàn FDA, GOLD 2026 và danh mục thuốc BYT. Thuốc hít 1 lần/ngày rất thuận tiện. |
| 5 | **Glycopyrronium** | LAMA | 50 mcg (44 mcg giao phổi) x 1 lần/ngày vào buổi sáng | DPI (Breezhaler) | Seebri Breezhaler | **ĐẠT LIỀU CHUẨN**. Đúng nhãn EMA và BYT 2131. Cần lưu ý viên nang dùng để hít qua Breezhaler, tuyệt đối không được nuốt. |
| 6 | **Indacaterol / Glycopyrronium** | LAMA + LABA | 110/50 mcg (85/43 mcg giao phổi) x 1 lần/ngày sáng | DPI (Breezhaler) | Ultibro Breezhaler | **XUẤT SẮC**. Đúng nghiên cứu FLAME và BYT 2131. Lực cản thiết bị thấp, hít nhanh mạnh trong 2–3 giây. |
| 7 | **Aclidinium** | LAMA | 322 mcg (400 mcg metered) x 2 lần/ngày (cách 12h) | DPI (Genuair) | *Chưa lưu hành tại VN* | **SAI BIỆT DƯỢC**. Ghi `vnBrands: ['Eklira Genuair']` sai thực tế VN (chưa từng được Bộ Y tế cấp phép). |
| 8 | **Indacaterol** | LABA | 150 mcg x 1 lần/ngày (có thể tăng 300 mcg nếu khó thở nặng) | DPI (Breezhaler) | Onbrez Breezhaler (150, 300 mcg) | **CHUẨN XÁC**. Khớp BYT 2131. Lưu ý không dùng đơn trị nếu có hen kèm theo. |
| 9 | **Olodaterol** | LABA | 5 mcg x 1 lần/ngày (2 nhát xịt 2.5 mcg) | SMI (Respimat) | Striverdi Respimat (*thực tế chỉ có dạng phối hợp Spiolto*) | **CẦN CHÚ THÍCH**. Monotherapy Striverdi hầu như không có trên thị trường VN; chủ yếu dùng dạng phối hợp Spiolto Respimat. |
| 10 | **Salmeterol** | LABA | 50 mcg x 2 lần/ngày | DPI (Accuhaler) / pMDI | Serevent (*chủ yếu dùng dạng Seretide*) | **ĐẠT LIỀU CHUẨN**. Tại VN thực tế ít dùng đơn chất Salmeterol mà dùng dạng kết hợp Fluticasone/Salmeterol. |
| 11 | **Vilanterol** | LABA | 25 mcg (22 mcg giao phổi) x 1 lần/ngày | DPI (Ellipta - chỉ có dạng phối hợp) | *Không có đơn chất* | **SAI TÊN BIỆT DƯỢC**. Ghi `vnBrands: ['Ellipta']` là nhầm tên thiết bị hít. Vilanterol không bao giờ tồn tại đơn chất độc lập. |
| 12 | **Fluticasone furoate / Umeclidinium / Vilanterol** | ICS + LAMA + LABA | 100/62.5/25 mcg hít 1 liều x 1 lần/ngày vào cùng thời điểm | DPI (Ellipta) | Trelegy Ellipta (100/62.5/25 mcg) | **CHUẨN XÁC**. SITT 1 lần/ngày đã chính thức lưu hành tại VN. Đúng nghiên cứu IMPACT & ETHOS. Nhắc súc miệng sau hít. |
| 13 | **Budesonide / Glycopyrronium / Formoterol** | ICS + LAMA + LABA | 160/7.2/4.8 mcg/nhát: **Hít 2 nhát x 2 lần/ngày** (sáng và tối) | pMDI (Aerosphere) | Breztri Aerosphere | **CRITICAL: NGUY CƠ THIẾU 50% LIỀU**. Ghi `amount: 160 mcg, 2 lần/ngày` gây hiểu lầm xịt 1 nhát x 2 lần/ngày thay vì 2 nhát x 2 lần/ngày. |
| 14 | **Beclometasone / Glycopyrronium / Formoterol** | ICS + LAMA + LABA | 87/9/5 mcg/nhát: **Hít 2 nhát x 2 lần/ngày** (sáng và tối) | pMDI (Extra-fine hạt siêu mịn) | Trimbow | **CRITICAL: NGUY CƠ THIẾU 50% LIỀU**. Ghi `amount: 87 mcg, 2 lần/ngày` gây hiểu lầm xịt 1 nhát x 2 lần/ngày thay vì 2 nhát x 2 lần/ngày. |
| 15 | **Budesonide / Formoterol** | ICS + LABA | 160/4.5 mcg x 2 nhát x 2 lần/ngày | DPI (Turbuhaler) / pMDI (Rapihaler) | Symbicort Turbuhaler, Symbicort Rapihaler | **ĐẠT LIỀU**. Cần lưu ý trong COPD thường dùng liều cố định 2 nhát x 2 lần/ngày; MART không phải là chỉ định chuẩn trong COPD. |
| 16 | **Fluticasone / Salmeterol** | ICS + LABA | 250/50 mcg (hoặc 500/50 mcg) x 1 hít x 2 lần/ngày | DPI (Accuhaler) / pMDI (Evohaler) | Seretide Accuhaler, Seretide Evohaler | **ĐẠT LIỀU**. Khớp BYT 2131 và GOLD. Khuyên dùng kèm buồng đệm nếu dùng dạng Evohaler pMDI. |
| 17 | **Roflumilast** | Ức chế PDE4 | Khởi đầu 250 mcg/ngày x 4 tuần, sau đó tăng lên duy trì 500 mcg/ngày | Viên nén uống | Daliresp, Daxas (*chưa phân phối rộng rãi tại VN*) | **CRITICAL: THIẾU GATE CHỐNG CHỈ ĐỊNH SUY GAN**. Chống chỉ định tuyệt đối khi suy gan Child-Pugh B/C. Thiếu cảnh báo sụt cân, trầm cảm. |
| 18 | **Azithromycin** | Macrolide dự phòng | 250 mg/ngày hoặc 500 mg x 3 lần/tuần trong 1 năm | Viên nén uống | Zithromax, Azithromycin 250/500mg | **ĐẠT LIỀU CHUẨN**. Khớp GOLD 2026. Cần mở rộng cho cả người chưa từng hút thuốc (never smoker); bổ sung gate theo dõi QTc và thính lực. |
| 19 | **Theophylline** | Methylxanthine | Khởi đầu 100–200 mg x 2 lần/ngày; duy trì 200–300 mg x 2 lần/ngày | Viên phóng thích kéo dài (SR) | Theostat 100/300mg, Asmacon | **ĐẠT NỒNG ĐỘ ĐÍCH**. Nồng độ đích 8–12 µg/mL là chuẩn. Cần bổ sung cảnh báo độc tính > 15 µg/mL và tương tác với Ciprofloxacin, Erythromycin. |
| 20 | **Dupilumab** | Anti-IL-4Rα | 300 mg tiêm dưới da mỗi 2 tuần (Q2W), không cần liều nạp | Bút tiêm nạp sẵn 300 mg/2 mL | Dupixent | **XUẤT SẮC**. Khớp hoàn toàn FDA Section 2.8 và GOLD 2026. Chỉ định khi BCAT ≥ 300 /µL + viêm phế quản mạn + thất bại với bộ ba. |
| 21 | **Mepolizumab** | Anti-IL-5 | 100 mg tiêm dưới da mỗi 4 tuần (Q4W) | Bút tiêm nạp sẵn / Bơm tiêm 100 mg | Nucala | **MAJOR: BỊ CHẶN SAI KHI CÓ VIÊM PHẾ QUẢN MẠN**. Cần bỏ điều kiện `!isChronicBronchitis` để đúng nguyên văn GOLD 2026 tr. 76. |
| 22 | **Methylprednisolone / Prednisolone** | Corticoid toàn thân | Prednisolone 40 mg uống/ngày (hoặc Methylprednisolone 40 mg TM) x 5 ngày | Viên nén 5mg, 16mg; Lọ tiêm TM 40mg | Solupred, Medrol, Solu-Medrol | **MAJOR: THIẾU DRUGID**. Liều 40 mg x 5 ngày là chuẩn theo GOLD 2026. Cần gắn `drugId` để engine chạy kiểm tra an toàn. |

---

## 3. PHÂN TÍCH CHI TIẾT CÁC FINDING TRỌNG TÂM

### Finding COPD-R2-01 (CRITICAL): Nguy Cơ Dùng Thiếu 50% Liều Điều Trị (Underdosing 50%) ở Breztri và Trimbow pMDI
- **Vị trí**:
  - `kb/drugs/budesonide_glycopyrronium_formoterol.json` (dòng 12–27)
  - `kb/drugs/beclometasone_glycopyrronium_formoterol.json` (dòng 12–27)
- **Phân tích cơ chế & tác động dược lâm sàng**:
  - Trong hai tệp trên, trường `amount` được cấu hình lần lượt là `160` (mcg) và `87` (mcg), với `unit: "mcg"` và `frequency: "2 lần/ngày"`.
  - Hàm `fmtDose()` định dạng tự động thành chuỗi hiển thị:
    - Breztri: `"160 mcg 2 lần/ngày"`
    - Trimbow: `"87 mcg 2 lần/ngày"`
  - Trong tờ Hướng dẫn sử dụng chính thức của FDA cho Breztri Aerosphere và EMA cho Trimbow pMDI:
    - Mỗi nhát xịt (actuation) của Breztri chứa 160 mcg Budesonide / 7.2 mcg Glycopyrronium / 4.8 mcg Formoterol fumarate. Liều điều trị khuyến cáo bắt buộc là **2 nhát xịt x 2 lần/ngày** (mỗi buổi sáng xịt 2 nhát, mỗi buổi tối xịt 2 nhát; tổng cộng 4 nhát/ngày = 640 mcg Budesonide).
    - Mỗi nhát xịt của Trimbow chứa 87 mcg Beclometasone dipropionate / 9 mcg Glycopyrronium / 5 mcg Formoterol fumarate. Liều điều trị khuyến cáo bắt buộc là **2 nhát xịt x 2 lần/ngày** (tổng cộng 4 nhát/ngày = 348 mcg Beclometasone).
  - Khi đơn thuốc hoặc giao diện GDMT hiển thị liều `"160 mcg 2 lần/ngày"` hoặc `"87 mcg 2 lần/ngày"`, bác sĩ điều trị hoặc bệnh nhân/điều dưỡng hiểu rằng mỗi lần dùng là 160 mcg (hoặc 87 mcg) – tương ứng với việc **chỉ xịt 1 nhát x 2 lần/ngày**.
  - **Hậu quả lâm sàng**: Bệnh nhân COPD nặng (Nhóm E) đang có nguy cơ đợt cấp cao và triệu chứng nặng nề sẽ chỉ nhận được đúng **50% liều điều trị cần thiết**. Việc dưới liều 50% của cả ba thành phần (đặc biệt là thành phần kháng cholinergic LAMA và cường beta LABA) sẽ không đủ nồng độ duy trì giãn phế quản 24 giờ, dẫn đến khó thở sớm vào ban đêm/sáng sớm, giảm dung tích sống, suy giảm chức năng thông khí cấp tính và làm bùng phát đợt cấp COPD đe dọa tính mạng.
- **Hành động khắc phục**:
  Chuyển đổi đơn vị của liều trong hai tệp trên sang đơn vị xịt phân liều:
  ```json
  "start": {
    "amount": 2,
    "unit": "nhát",
    "frequency": "2 lần/ngày",
    "route": "hít",
    "description": "Hít 2 nhát x 2 lần/ngày (sáng 2 nhát, tối 2 nhát cách nhau 12 giờ). Súc miệng bằng nước sạch sau khi hít"
  }
  ```
  Khi đó `fmtDose` sẽ hiển thị rõ ràng: `"2 nhát x 2 lần/ngày (hít)"`, hoàn toàn triệt tiêu nguy cơ dùng thiếu liều.

---

### Finding COPD-R2-02 (CRITICAL): Khởi Trị Roflumilast ở Bệnh Nhân Xơ Gan / Suy Gan Trung Bình–Nặng Do Thiếu Gate Chặn
- **Vị trí**:
  - `kb/drugs/roflumilast.json` (dòng 42, `gates: []`)
  - `src/modules/copd/rules.ts` (dòng 402–432, rule `copd.followup.roflumilast_indication`)
- **Phân tích cơ chế & tác động lâm sàng**:
  - Roflumilast là thuốc ức chế chọn lọc PDE4 dùng đường uống. Thuốc được chuyển hóa chủ yếu tại gan qua hệ enzym Cytochrome P450 (chủ yếu là CYP3A4 và CYP1A2) tạo thành chất chuyển hóa có hoạt tính chính là roflumilast N-oxide (chịu trách nhiệm cho trên 90% tác dụng dược lý toàn thân).
  - Theo Nhãn FDA Daliresp (Mục 4 - Contraindications) và Dược thư Quốc gia: Bệnh nhân suy giảm chức năng gan trung bình hoặc nặng (**Child-Pugh B hoặc C**, bao gồm xơ gan còn bù/mất bù) có sự sụt giảm thanh thải thuốc nghiêm trọng. Diện tích dưới đường cong nồng độ-thời gian (AUC) của Roflumilast tăng từ **1.5 đến 3 lần**, dẫn tới quá liều tích lũy kéo dài.
  - Tác dụng phụ của Roflumilast phụ thuộc liều rất rõ: buồn nôn, tiêu chảy nặng gây mất nước, sụt cân suy mòn, mất ngủ, rối loạn tâm thần và trầm cảm lo âu có ý tưởng tự sát. Ở bệnh nhân xơ gan, tiêu chảy mất nước và rối loạn điện giải do tích lũy Roflumilast có thể trực tiếp thúc đẩy bùng phát **Hội chứng não gan (Hepatic Encephalopathy)** và **Hội chứng gan thận (Hepatorenal Syndrome)** dẫn tới tử vong.
  - Hiện tại, `roflumilast.json` chỉ ghi cảnh báo suy gan dưới dạng chuỗi văn bản trong mảng `interactions` mà không có Gate chặn có thể kiểm tra tự động (`gates: []`). Trong `rules.ts`, rule `copd.followup.roflumilast_indication` chỉ kiểm tra FEV1 < 50%, ho khạc đờm mạn và đợt cấp.
  - Khi thực nghiệm lâm sàng trên ca bệnh có xơ gan (`conditions: { copd: true, cirrhosis: true }`), engine GDMT vẫn tạo ra khuyến cáo `[START] roflumilast: Bổ sung Roflumilast uống (FEV₁ < 50%, viêm phế quản mạn)` mà không có bất kỳ rào cản ngăn chặn nào.
- **Hành động khắc phục**:
  1. Thêm Gate vào `roflumilast.json`:
     ```json
     "gates": [
       {
         "id": "gate_roflumilast_cirrhosis",
         "parameter": "cirrhosis",
         "operator": "==",
         "threshold": false,
         "action": "hold",
         "messageVi": "Chống chỉ định tuyệt đối Roflumilast ở bệnh nhân xơ gan hoặc suy gan trung bình-nặng (Child-Pugh B hoặc C) do nguy cơ tích lũy độc tính",
         "citationIds": ["fda.copd.roflumilast_contra_liver"]
       }
     ]
     ```
  2. Trong `src/modules/copd/rules.ts` (rule `copd.followup.roflumilast_indication`), thêm điều kiện chặn:
     ```typescript
     if (Boolean(ctx.patient.conditions?.cirrhosis)) return false;
     ```

---

### Finding COPD-R2-03 (MAJOR): Chỉ Định Kháng Sinh Đợt Cấp COPD Sai Tiêu Chuẩn Anthonisen Khi Đờm Không Mủ
- **Vị trí**: `src/modules/copd/rules.ts` (dòng 751–754, rule `copd.inpatient.antibiotics`).
- **Phân tích cơ chế & tác động lâm sàng**:
  - Tiêu chuẩn kinh điển Anthonisen (được GOLD 2026 Chương 4 và BYT 2131/2026 phê duyệt) phân loại đợt cấp COPD thành:
    - Loại 1 (Nặng): Đầy đủ 3 triệu chứng kinh điển: tăng khó thở, tăng thể tích đờm, và đờm chuyển màu mủ (xanh/vàng/đục).
    - Loại 2 (Vừa): Có 2 trong 3 triệu chứng, trong đó **một trong hai triệu chứng bắt buộc phải là đờm mủ**.
    - Loại 3 (Nhẹ): Có 1 triệu chứng hoặc 2 triệu chứng không có đờm mủ.
  - Nguyên tắc vàng trong sử dụng kháng sinh COPD: **Chỉ chỉ định kháng sinh khi có đờm mủ (purulent sputum)**, hoặc khi bệnh nhân suy hô hấp nặng phải can thiệp thông khí nhân tạo (thở máy xâm nhập hoặc NIV). Đờm mủ phản ánh sự hiện diện của bạch cầu đa nhân trung tính thoái hóa và vi khuẩn gây bệnh trong đường thở với độ nhạy > 90%.
  - Mã nguồn hiện tại trong `rules.ts` viết:
    ```typescript
    const isPurulent = Boolean(ctx.patient.customInputs?.purulentSputum);
    const isIncreasedVol = Boolean(ctx.patient.customInputs?.increasedSputumVolume);
    return isPurulent || isIncreasedVol;
    ```
    Điều kiện `isPurulent || isIncreasedVol` có nghĩa là: Một bệnh nhân đợt cấp COPD khạc đờm trắng trong, hoàn toàn không mủ (`purulentSputum: false`), nhưng có tăng lượng đờm (`increasedSputumVolume: true`) – vốn rất phổ biến trong các đợt bùng phát do nhiễm virus hoặc thời tiết thay đổi – **vẫn bị hệ thống chỉ định dùng kháng sinh toàn thân trong 5 ngày**, kèm theo tiêu đề hiển thị mâu thuẫn: `"Kháng sinh điều trị đợt cấp trong 5 ngày khi có đờm mủ"`.
  - Việc lạm dụng kháng sinh khi không có bằng chứng nhiễm khuẩn làm gia tăng tỷ lệ dị ứng thuốc, rối loạn khuẩn chí đường ruột (viêm đại tràng giả mạc do *C. difficile*), và đặc biệt thúc đẩy tình trạng đa kháng thuốc của *Streptococcus pneumoniae*, *Haemophilus influenzae*, và *Pseudomonas aeruginosa* tại Việt Nam.
- **Hành động khắc phục**:
  Sửa lại điều kiện kích hoạt kháng sinh:
  ```typescript
  const isPurulent = Boolean(ctx.patient.customInputs?.purulentSputum);
  const isVentilated = (ph !== undefined && ph <= th('copd.niv_ph_cutoff')); // hoặc có chỉ định NIV/thở máy
  return isPurulent || isVentilated;
  ```

---

### Finding COPD-R2-04 (MAJOR): Bỏ Sót Hoàn Toàn Thuốc Giãn Phế Quản Tác Dụng Ngắn (SABA/SAMA) Trong Đợt Cấp Nội Viện
- **Vị trí**: Toàn bộ tệp `src/modules/copd/rules.ts` (mục xử trí nội viện từ dòng 683 trở đi).
- **Phân tích dược lâm sàng**:
  - Theo GOLD 2026 (Chương 4 - Management of Exacerbations) và BYT 2131/2026 (Phụ lục 1 tr. 55 & Phụ lục sơ đồ tr. 84):
    *"Thuốc giãn phế quản tác dụng ngắn dạng hít (SABA đơn độc hoặc phối hợp SABA + SAMA) là liệu pháp giãn phế quản ban đầu bắt buộc cho mọi bệnh nhân đợt cấp COPD."*
  - Cơ chế: Salbutamol kích thích thụ thể beta-2 làm giãn cơ trơn phế quản nhanh chóng trong 3–5 phút; Ipratropium ức chế thụ thể muscarinic M3 làm giảm co thắt và giảm tiết nhầy. Phối hợp hai thuốc (Combivent / Berodual) tạo ra tác dụng hiệp đồng giãn phế quản vượt trội so với từng thuốc đơn độc mà không làm tăng nhịp tim quá mức.
  - Trong bộ quy tắc nội viện của module COPD hiện tại, hệ thống chỉ sinh ra:
    - Thở oxy có kiểm soát
    - Thở máy NIV (nếu có toan hô hấp)
    - Corticoid toàn thân (Prednisolone)
    - Kháng sinh (nếu có đờm mủ)
    - Checklist xuất viện
    **Hoàn toàn không có bất kỳ dòng nào hướng dẫn dùng thuốc giãn phế quản cắt cơn cấp cứu!**
  - Một bệnh nhân vào viện vì suy hô hấp cấp do đợt cấp COPD mà không được khí dung Salbutamol/Ipratropium ngay trong 15 phút đầu tiên là một sai sót quy trình cấp cứu nghiêm trọng.
- **Hành động khắc phục**:
  Bổ sung rule `copd.inpatient.short_acting_bronchodilators` trong `rules.ts`:
  - Action: `START`
  - Thuốc: `salbutamol` hoặc phối hợp `salbutamol_ipratropium`
  - Liều dùng: Khí dung Salbutamol 2.5–5 mg hoặc Ipratropium 0.5 mg/Salbutamol 2.5 mg mỗi 4–6 giờ (hoặc xịt qua buồng đệm 2–4 nhát lặp lại mỗi 20–30 phút trong giờ đầu nếu co thắt nặng).

---

### Finding COPD-R2-05 (MAJOR): Chỉ Định Oxy Trị Liệu Dài Hạn Tại Nhà (LTOT) Sai Thời Điểm Lâm Sàng
- **Vị trí**: `src/modules/copd/rules.ts` (dòng 621–658, rule `copd.nonpharm.ltot_oxygen`).
- **Phân tích lâm sàng**:
  - Hướng dẫn của GOLD 2026 (Mục LTOT Criteria tr. 77) và BYT 2131/2026 (tr. 56) quy định rõ:
    Chỉ định thở oxy dài hạn tại nhà (LTOT ≥ 15 giờ/ngày) **chỉ được thiết lập khi bệnh nhân ở giai đoạn hoàn toàn ổn định (stable state)**, được đo khí máu động mạch hoặc SpO2 lúc nghỉ ở khí phòng sau khi đã hồi phục đợt cấp **ít nhất 60–90 ngày (2–3 tháng)**.
  - Lý do: Trong đợt cấp, tình trạng tắc nghẽn thông khí cấp tính, phù nề niêm mạc và ứ đọng đờm làm SpO2 tụt tạm thời. Sau khi đợt cấp được điều trị ổn định với thuốc giãn phế quản và corticoid, trao đổi khí thường hồi phục đáng kể và đa số bệnh nhân không còn thỏa mãn tiêu chuẩn thiếu oxy máu mạn tính.
  - Trong `copd.nonpharm.ltot_oxygen`, rule chỉ kiểm tra `restingSpo2 <= 88%` hoặc `pao2 <= 55 mmHg` mà không kiểm tra cờ `acuteExacerbation`.
  - Kết quả chạy thử nghiệm: Bệnh nhân Preset 4 (ca đợt cấp nội viện 02:45 với SpO2 84%) nếu được đánh giá ngoài phòng khám hoặc khi chưa chuyển sang giao diện nội viện sẽ bị hệ thống kết luận: `"Chỉ định Oxy trị liệu dài hạn tại nhà (LTOT) khi nghỉ (SpO₂ 84%)"`. Việc kê đơn máy tạo oxy dài hạn cho bệnh nhân đang trong đợt cấp là chỉ định sai thời điểm lâm sàng.
- **Hành động khắc phục**:
  Thêm điều kiện `!ctx.patient.customInputs?.acuteExacerbation` vào hàm `when` của rule `copd.nonpharm.ltot_oxygen`. Khi đang đợt cấp, chỉ kích hoạt thở oxy có kiểm soát cấp cứu (SpO2 đích 88–92%) và đưa mục đánh giá lại nhu cầu LTOT vào checklist trước khi ra viện.

---

### Finding COPD-R2-06 (MAJOR): Loại Trừ Sai Đối Tượng Chỉ Định Mepolizumab Khi Có Viêm Phế Quản Mạn
- **Vị trí**: `src/modules/copd/rules.ts` (dòng 528–529, rule `copd.followup.mepolizumab_indication`).
- **Phân tích guideline đối chiếu**:
  - Mã nguồn hiện tại:
    ```typescript
    const isChronicBronchitis = Boolean(ctx.patient.customInputs?.chronicBronchitis);
    return !isChronicBronchitis;
    ```
  - Đối chiếu nguyên văn GOLD 2026 (trang 76, mục Follow-up Treatment Algorithm):
    > *"Among patients with blood eosinophils ≥ 300 cells/µL, consider adding dupilumab (if chronic bronchitis) or mepolizumab (with and without chronic bronchitis) (Figure 3.11)."*
  - GOLD 2026 nêu rõ:
    - **Dupilumab**: Ưu tiên chỉ định khi bệnh nhân có kiểu hình viêm phế quản mạn (chronic bronchitis phenotype, dựa trên thử nghiệm lâm sàng BOREAS và NOTUS tuyển chọn quần thể viêm phế quản mạn).
    - **Mepolizumab**: Được chỉ định cho cả bệnh nhân **CÓ HOẶC KHÔNG CÓ viêm phế quản mạn** (`with and without chronic bronchitis`, dựa trên thử nghiệm METREX và MATINEE).
  - Việc tác giả module viết `return !isChronicBronchitis` nhằm mục đích "phân chia độc quyền" giữa Dupilumab và Mepolizumab. Tuy nhiên, điều này biến thành một quy tắc sai lệch: Nếu một bệnh nhân có BCAT 450 tế bào/µL, có viêm phế quản mạn, nhưng không dung nạp hoặc không tiếp cận được Dupilumab, hệ thống sẽ **chặn hoàn toàn Mepolizumab** mặc dù guideline quốc tế khuyến cáo đây là một lựa chọn hợp lệ.
- **Hành động khắc phục**:
  Xóa điều kiện `return !isChronicBronchitis;` khỏi rule `copd.followup.mepolizumab_indication`. Cả hai thuốc sinh học đều có thể hiển thị dưới dạng CONSIDER khi BCAT ≥ 300 /µL, với ghi chú nêu rõ ưu thế của từng thuốc.

---

### Finding COPD-R2-07 (MAJOR): Khuyến Cáo Corticoid và Kháng Sinh Nội Viện Thiếu `drugId`
- **Vị trí**:
  - `src/modules/copd/rules.ts` dòng 721 (rule `copd.inpatient.systemic_steroid`)
  - `src/modules/copd/rules.ts` dòng 756 (rule `copd.inpatient.antibiotics`)
- **Phân tích kỹ thuật & dược lâm sàng**:
  - Trong kiến trúc GDMT-VN, đối tượng `Recommendation` sinh ra từ các rule dùng thuốc cần có trường `drugId` tương ứng với khóa trong `kb/drugs/*.json` (ví dụ: `drugId: 'prednisolone'`).
  - Khi không có `drugId`:
    1. Giao diện người dùng không thể liên kết tới bảng thông tin thuốc chi tiết (Drug Card, Brand names, Renal dose adjustments).
    2. Bộ máy kiểm tra tương tác thuốc (`engine/interactions.ts`) không nhận diện được bệnh nhân đang được kê Prednisolone, bỏ lọt tương tác giữa Corticoid toàn thân với NSAID (loét dạ dày tá tràng xuất huyết) hoặc thuốc chống đái tháo đường (nguy cơ bùng phát tăng áp lực thẩm thấu / tăng đường huyết nặng).
    3. Bộ máy kiểm tra dị ứng không thể đối chiếu hoạt chất với tiền sử dị ứng của người bệnh.
- **Hành động khắc phục**:
  Gán `drugId: 'prednisolone'` (hoặc `'methylprednisolone'`) cho `rec_copd_inpatient_steroid`. Với kháng sinh, có thể liên kết tới hoạt chất chính như `amoxicillin_clavulanate` hoặc thiết lập cơ chế liên kết nhóm thuốc thích hợp.

---

### Finding COPD-R2-08 (MAJOR): Ma Trận copdMatrixTherapy Gán Trạng Thái `initiate: 'rec'` Cho Thuốc Add-on Leo Thang
- **Vị trí**: `src/modules/copd/matrices.ts` (dòng 146, 153, 183, 232).
- **Phân tích dược lâm sàng**:
  - Trong `copdMatrixTherapy`, các cột thể hiện phân nhóm bệnh nhân COPD lúc đánh giá (`group_a`, `group_b`, `group_e_low_eos`, `group_e_mod_eos`, `group_e_high_eos`).
  - Hàng Roflumilast và Azithromycin ở cột `group_e_low_eos` và `group_e_mod_eos` được cấu hình:
    `initiate: 'rec'`, `continue: 'rec'`.
  - Hàng Dupilumab ở cột `group_e_high_eos` được cấu hình:
    `initiate: 'rec'`, `continue: 'rec'`.
  - Theo GOLD 2026 (Figure 3.8 - Initial Pharmacological Treatment) và BYT 2131/2026:
    - Khởi trị ban đầu cho Nhóm E (bệnh nhân mới chẩn đoán chưa dùng thuốc duy trì) chỉ có:
      - LABA + LAMA (nếu BCAT < 300 /µL)
      - LABA + LAMA + ICS (nếu BCAT ≥ 300 /µL hoặc có tiền sử hen).
    - Tuyệt đối **KHÔNG BAO GIỜ khởi đầu** điều trị COPD bằng Roflumilast uống, Azithromycin uống hay Dupilumab tiêm dưới da khi bệnh nhân chưa từng được điều trị tối ưu bằng thuốc giãn phế quản hít!
    - Roflumilast, Azithromycin và Dupilumab/Mepolizumab là **thuốc theo dõi & leo thang (Follow-up Escalation / Add-on therapy)** dành cho bệnh nhân đã thất bại với phác đồ hít kép hoặc hít ba.
  - Việc ma trận ghi `initiate: 'rec'` sẽ gây hiểu lầm tai hại cho bác sĩ thực hành rằng một bệnh nhân COPD Nhóm E mới được phát hiện có thể được kê đơn ngay lập tức với Roflumilast hoặc Azithromycin đơn độc để điều trị duy trì ban đầu.
- **Hành động khắc phục**:
  Sửa các ô của Roflumilast, Azithromycin và Dupilumab trong ma trận thành `initiate: 'not_rec'`, `continue: 'rec'` (với ghi chú: "Chỉ định bổ sung khi đợt cấp tái phát trên phác đồ duy trì nền tảng").

---

### Finding COPD-R2-09 (MAJOR): Khai Báo Biệt Dược Tại Việt Nam (`vnBrands`) Không Khớp Thực Tế Lưu Hành
- **Vị trí**: Các tệp `kb/drugs/aclidinium.json`, `umeclidinium.json`, `vilanterol.json`, `roflumilast.json`.
- **Chi tiết đối chiếu danh mục Cục Quản lý Dược – Bộ Y tế**:
  1. `aclidinium.json`: Khai báo `vnBrands: ["Eklira Genuair"]`. Hoạt chất Aclidinium bromide và thiết bị Genuair chưa từng được cấp số đăng ký lưu hành thương mại tại Việt Nam. Bác sĩ kê đơn theo tên này sẽ không thể tìm thấy thuốc tại bất kỳ nhà thuốc bệnh viện nào ở VN.
  2. `umeclidinium.json`: Khai báo `vnBrands: ["Incruse Ellipta"]`. Tại Việt Nam, GSK chỉ phân phối dạng phối hợp đôi **Anoro Ellipta** (Umeclidinium/Vilanterol) và dạng ba **Trelegy Ellipta** (Fluticasone furoate/Umeclidinium/Vilanterol); không lưu hành đơn chất Incruse Ellipta.
  3. `vilanterol.json`: Khai báo `vnBrands: ["Ellipta"]`. "Ellipta" là tên nhãn hiệu của thiết bị phân phối thuốc hít bột khô (dry powder inhaler device), không phải tên biệt dược của hoạt chất. Hơn nữa, Vilanterol trên toàn cầu không bao giờ được bào chế đơn chất mà chỉ đi kèm trong các phối hợp cố định (Relvar, Anoro, Trelegy).
  4. `roflumilast.json`: Khai báo `vnBrands: ["Daliresp", "Daxas"]`. Daliresp là biệt dược lưu hành tại Mỹ (FDA), Daxas lưu hành tại Châu Âu (EMA). Cả hai biệt dược này đều chưa được phân phối chính thức đại trà tại hệ thống điều trị ngoại trú bảo hiểm y tế Việt Nam (chỉ có thể tiếp cận qua nguồn viện trợ/nhập khẩu chuyến đặc biệt của một số bệnh viện chuyên khoa sâu).
- **Hành động khắc phục**:
  Chỉnh sửa lại trường `vnBrands` của các tệp trên: ghi rõ trạng thái lưu hành tại Việt Nam để tránh gây nhầm lẫn trong thực hành kê đơn.

---

### Finding COPD-R2-10 (MINOR): Ma Trận Thiết Bị Hít (`copdMatrixDevices`) Gán drugId Giả Cho Đặc Tính Kỹ Thuật
- **Vị trí**: `src/modules/copd/matrices.ts` dòng 253 và dòng 283.
- **Phân tích**:
  Trong `copdMatrixDevices`, hai hàng so sánh đặc tính kỹ thuật cơ học của các loại bình hít được cấu hình:
  - Hàng 1: `drugId: 'tiotropium'`, `nameVi: 'Yêu cầu lưu lượng hít thở'`
  - Hàng 2: `drugId: 'tiotropium_olodaterol'`, `nameVi: 'Khả năng phối hợp thao tác'`
  Việc mượn `drugId` của thuốc thực tế gán cho thuộc tính kỹ thuật thiết bị làm sai lệch cấu trúc dữ liệu của GDMT-VN, khiến hệ thống render có thể hiển thị tên/icon của Tiotropium cạnh dòng chữ "Yêu cầu lưu lượng hít thở".
- **Hành động khắc phục**:
  Chuyển ma trận thiết bị thành bảng thông tin giáo dục thuần túy không ràng buộc `drugId` thuốc, hoặc xây dựng các hàng theo cặp thuốc - thiết bị chuẩn tại VN (ví dụ: Hàng 1: Spiriva Respimat SMI; Hàng 2: Ultibro Breezhaler DPI; Hàng 3: Anoro/Trelegy Ellipta DPI; Hàng 4: Breztri Aerosphere pMDI).

---

### Finding COPD-R2-11 (MINOR): Thiếu Gate Cảnh Báo Glaucoma Góc Đóng và Bí Tiểu ở Nhóm Thuốc LAMA
- **Vị trí**: Toàn bộ các tệp thuốc LAMA (`tiotropium.json`, `umeclidinium.json`, `glycopyrronium.json`, `aclidinium.json`, `tiotropium_olodaterol.json`, `umeclidinium_vilanterol.json`, `glycopyrronium_indacaterol.json`, `beclometasone_glycopyrronium_formoterol.json`, `budesonide_glycopyrronium_formoterol.json`, `fluticasone_furoate_umeclidinium_vilanterol.json`).
- **Phân tích dược lâm sàng**:
  - Các thuốc kháng cholinergic tác dụng kéo dài (LAMA) cạnh tranh với thụ thể muscarinic M3. Dù dùng đường hít, thuốc vẫn có tỷ lệ hấp thu toàn thân nhất định hoặc tác dụng tại chỗ trực tiếp nếu khí dung/hạt sương bay vào mắt do dùng mặt nạ không khít.
  - Tác dụng phụ kháng cholinergic có thể gây giãn đồng tử làm đóng góc tiền phòng, kích phát cơn **Glocom góc đóng cấp tính** (acute angle-closure glaucoma) dẫn đến đau nhức mắt dữ dội và mù lòa nếu không xử trí kịp thời.
  - Ở nam giới cao tuổi có phì đại lành tính tuyến tiền liệt, LAMA làm giãn cơ bàng quang và co thắt cơ vòng cổ bàng quang, dẫn tới **bí tiểu cấp** (acute urinary retention).
  - Cả FDA và Bộ Y tế đều xếp Glaucoma góc hẹp chưa phẫu thuật và tắc nghẽn cổ bàng quang/bí tiểu nặng vào mục Cảnh báo & Thận trọng đặc biệt của LAMA.
- **Hành động khắc phục**:
  Bổ sung Gate hoặc cảnh báo an toàn trong các tệp thuốc LAMA về kiểm tra tiền sử Glaucoma góc đóng và phì đại tiền liệt tuyến kèm bí tiểu.

---

### Finding COPD-R2-12 (MINOR): Azithromycin Dự Phòng Loại Trừ Người Chưa Từng Hút Thuốc (`never` Smoker)
- **Vị trí**: `src/modules/copd/rules.ts` (dòng 444, rule `copd.followup.azithromycin_prophylaxis`).
- **Phân tích**:
  - Mã nguồn: `if (smoking !== 'former') return false;`
  - Theo nghiên cứu lâm sàng của Albert et al. (NEJM 2011) và phân tích post-hoc trích dẫn trong GOLD 2026 tr. 162: Hiệu quả giảm đợt cấp của Azithromycin kém hơn ở người **đang hút thuốc chủ động (active smokers)** do khói thuốc làm bất hoạt một số đáp ứng miễn dịch và tăng phản ứng viêm bạch cầu trung tính.
  - Tuy nhiên, bằng chứng hoàn toàn **không chống chỉ định ở người chưa từng hút thuốc (never smoker)**.
  - Tại Việt Nam, có một tỷ lệ rất lớn bệnh nhân COPD là phụ nữ nông thôn hoặc người cao tuổi chưa từng hút thuốc lá, nhưng bị tổn thương phế quản mạn tính do phơi nhiễm khói bếp than tổ ong, khói củi rơm rạ hoặc bụi nghề nghiệp kéo dài hàng chục năm. Khi các bệnh nhân này bị đợt cấp tái diễn dù đã dùng phác đồ bộ ba, việc rule chặn `smoking !== 'former'` sẽ tước bỏ cơ hội tiếp cận Azithromycin dự phòng của họ.
- **Hành động khắc phục**:
  Sửa điều kiện kiểm tra thành: `if (smoking === 'current') return false;` (chỉ loại trừ người đang hút thuốc, cho phép cả 'former' và 'never').

---

### Finding COPD-R2-13 (MINOR): Thiếu Gate Khoảng QTc Cho Azithromycin và Thiếu Khuyến Cáo TDM Bắt Buộc Cho Theophylline
- **Vị trí**: `kb/drugs/azithromycin.json` và `kb/drugs/theophylline.json`.
- **Phân tích**:
  - **Azithromycin**: Dùng kéo dài 1 năm làm tăng nguy cơ kéo dài khoảng QTc và loạn nhịp thất (Xoắn đỉnh - Torsades de Pointes), đặc biệt khi COPD thường đi kèm bệnh tim thiếu máu cục bộ hoặc dùng chung thuốc kéo dài QT (fluoroquinolone, thuốc chống loạn thần, thuốc chống loạn nhịp). Cần có gate cảnh báo nếu QTc > 480–500 ms.
  - **Theophylline**: Khoảng điều trị tối ưu trong COPD rất hẹp (**8–12 µg/mL**). Khi nồng độ huyết thanh vượt quá **15–20 µg/mL**, nguy cơ loạn nhịp tim ác tính (rung nhĩ, nhịp nhanh thất) và co giật kiểu động kinh tăng vọt. Cần bổ sung cảnh báo độc tính và khuyến cáo giám sát nồng độ thuốc trong máu (TDM) định kỳ vào `theophylline.json`.
- **Hành động khắc phục**:
  Bổ sung Gate QTc cho Azithromycin và thêm ghi chú nồng độ độc tính cùng khuyến cáo TDM cho Theophylline.

---

### Finding COPD-R2-14 (SUGGESTION): Mở Rộng Profile Mepolizumab Sang 'VN' Kèm Ghi Chú Phê Duyệt
- **Vị trí**: `src/modules/copd/rules.ts` (dòng 517, rule `copd.followup.mepolizumab_indication`).
- **Phân tích**:
  Mepolizumab (Nucala 100 mg) đã được cấp phép lưu hành chính thức tại Việt Nam (GSK) cho chỉ định hen phế quản tăng bạch cầu ái toan nặng. Đối với COPD, các dữ liệu thử nghiệm giai đoạn III gần đây (METREX, MATINEE) đã chứng minh hiệu quả giảm đợt cấp rõ rệt ở bệnh nhân có BCAT ≥ 300 /µL và được GOLD 2026 đưa vào lưu đồ điều trị chuẩn.
- **Hành động kiến nghị**:
  Đổi thành `profiles: ['INTL', 'VN']` kèm `profileDiff` giải thích rõ: Tại Việt Nam, thuốc Nucala đã có mặt nhưng chỉ định COPD đang trong quá trình cập nhật nhãn chính thức từ Bộ Y tế; bác sĩ chuyên khoa hô hấp có thể cân nhắc hội chẩn điều trị cho các ca đợt cấp nặng tái diễn có tăng bạch cầu ái toan.

---

## 4. ĐÁNH GIÁ MA TRẬN THIẾT BỊ HÍT TẠI VIỆT NAM (INHALER DEVICE MATRIX)

Việc lựa chọn đúng thiết bị phân phối thuốc hít có vai trò quyết định tương đương việc chọn đúng hoạt chất trong điều trị COPD. Bảng dưới đây đối chiếu đặc tính 4 nhóm thiết bị chính tại Việt Nam theo Bộ Y tế QĐ 2131/2026:

| Loại thiết bị | Biệt dược tiêu biểu tại VN | Yêu cầu lưu lượng hít thở (PIFR) | Phối hợp tay - miệng (Bấm - Hít) | Nguy cơ thao tác sai & Biện pháp khắc phục |
|---|---|---|---|---|
| **Bình xịt định liều (pMDI)** | Seretide Evohaler, Foster, Breztri Aerosphere, Ventolin | Thấp (chỉ cần lực hít chậm, sâu) | **Rất cao**: Cần bấm và hít đồng thời | Khoảng 50% người bệnh bấm hít không đồng thì làm thuốc dính vào họng. **Bắt buộc kê kèm buồng đệm (Spacer)** cho người cao tuổi hoặc lưu lượng hít yếu. |
| **Bình phun sương hạt mịn (SMI)** | Spiriva Respimat, Spiolto Respimat | Rất thấp (hạt sương mịn phun chậm kéo dài 1.5 giây) | Trung bình (bấm nút giải phóng sương và hít chậm sâu) | Tốc độ phun sương chậm 0.8 m/s giúp thuốc lắng đọng phổi sâu > 50%. Rất thích hợp cho người cao tuổi có lực hít yếu. Cần hướng dẫn kỹ thuật nạp ống thuốc và vặn nửa vòng. |
| **Bình hít bột khô (DPI)** | Anoro/Trelegy (Ellipta), Ultibro/Onbrez (Breezhaler), Symbicort (Turbuhaler) | **Cao**: Đòi hỏi lưu lượng hít đủ mạnh (> 30–60 L/phút) | **Thấp**: Kích hoạt bằng chính nhịp thở của người bệnh | Không cần phối hợp bấm - hít. Tuy nhiên, người bệnh trong đợt cấp hoặc kiệt sức cơ hô hấp sẽ không hít đủ lực để phân tán hạt bột khô. **Chống chỉ định thổi vào bình hít** vì hơi ẩm làm vón cục bột thuốc. |
| **Máy khí dung (Nebulizer)** | Ventolin nang, Pulmicort Respules, Combivent nang | Không đòi hỏi (thở bình thường qua mặt nạ/ống ngậm) | Không đòi hỏi phối hợp | Lựa chọn số 1 trong đợt cấp nặng tại phòng cấp cứu hoặc hồi sức. Cần vệ sinh máy tránh nhiễm khuẩn bệnh viện; chú ý mặt nạ phải ôm khít mặt để tránh thuốc LAMA bay vào mắt gây glocôm. |

---

## 5. THỰC NGHIỆM ĐÁNH GIÁ ĐỘNG (EVALUATE PRESETS & ADVERSARIAL CASES)

Đã thực hiện script kiểm thử độc lập (`docs/reviews/copd/scratch/eval_copd.test.ts` & `test_preset4.ts`) đánh giá động bộ máy GDMT engine:

### 1. Đánh giá 5 Preset Ca bệnh Chuẩn:
- **Preset 1 (`copd_preset_group_a`)**: Đạt chuẩn. Kê `[START] tiotropium` (5 mcg 1 lần/ngày).
- **Preset 2 (`copd_preset_group_b`)**: Đạt chuẩn. Kê `[START] tiotropium_olodaterol` (Spiolto Respimat 2 nhát/ngày) + Tư vấn cai thuốc lá 5A/5R.
- **Preset 3 (`copd_preset_group_e_triple`)**: Đạt chuẩn. Kê `[START] fluticasone_furoate_umeclidinium_vilanterol` (Trelegy Ellipta 1 liều/ngày) do BCAT 380 ≥ 300 /µL.
- **Preset 4 (`copd_preset_inpatient_exac_0245`)**: 
  - Khi chạy setting `inpatient`: Sinh đầy đủ Oxy có kiểm soát, NIV, Prednisolone và Kháng sinh. **Tuy nhiên hoàn toàn thiếu thuốc giãn phế quản tác dụng ngắn SABA/SAMA**, và các thuốc nội viện thiếu `drugId`.
  - Khi chạy setting `outpatient`: Bị gán nhầm chỉ định LTOT thở oxy dài hạn tại nhà ≥ 15h/ngày do tụt SpO2 cấp tính.
- **Preset 5 (`copd_preset_followup_roflumilast`)**: Đạt chuẩn về mặt chỉ định: Tránh ICS (`rec_copd_avoid_ics_low_eos`), bổ sung Roflumilast (`[START] roflumilast`) và cân nhắc Azithromycin.

### 2. Thử nghiệm Ca Đối nghịch Dược lý (Adversarial Edge Cases):
- **Case 1 (COPD FEV1 < 50% + Xơ gan)**: Engine kích hoạt `[START] roflumilast` bất chấp tình trạng xơ gan (phát hiện lỗi Critical COPD-R2-02).
- **Case 2 (Đợt cấp đờm trắng trong không mủ + tăng thể tích đờm)**: Engine kích hoạt `[START] rec_copd_inpatient_antibiotics` (phát hiện lỗi Major COPD-R2-03).
- **Case 3 (COPD BCAT 450 /µL + Viêm phế quản mạn)**: Engine chỉ sinh Dupilumab và chặn hoàn toàn Mepolizumab vì `isChronicBronchitis === true` (phát hiện lỗi Major COPD-R2-06).
- **Case 4 (COPD BCAT thấp + Never smoker do chất đốt sinh khối)**: Engine loại trừ Azithromycin dự phòng vì `smokingStatus === 'never'` (phát hiện lỗi Minor COPD-R2-12).

---

## 6. KẾT LUẬN & KIẾN NGHỊ HÀNH ĐỘNG DÀNH CHO MODULE OWNER

### Kết luận thẩm định: **FAIL** (2 Critical, 7 Major, 4 Minor, 1 Suggestion)

### Danh sách 5 việc cần làm ngay (Top 5 Priorities):
1. **Sửa liều Breztri và Trimbow**: Đổi cấu hình `amount: 2`, `unit: 'nhát'`, `frequency: '2 lần/ngày'` để chấm dứt ngay nguy cơ thiếu hụt 50% liều điều trị.
2. **Thêm Gate chống chỉ định suy gan cho Roflumilast**: Chặn tuyệt đối `cirrhosis` và `moderateSevereHepaticImpairment`.
3. **Chuẩn hóa tiêu chuẩn Anthonisen cho Kháng sinh đợt cấp**: Chỉ kích hoạt kháng sinh khi `purulentSputum === true` hoặc bệnh nhân có chỉ định thở máy (NIV/xâm nhập).
4. **Bổ sung phác đồ thuốc giãn phế quản ngắn (SABA / SAMA) trong đợt cấp**: Thêm rule cấp cứu khí dung Salbutamol ± Ipratropium trong nội viện.
5. **Mở rộng Mepolizumab cho cả bệnh nhân có và không có viêm phế quản mạn**: Xóa điều kiện `!isChronicBronchitis` theo đúng nguyên văn GOLD 2026 tr. 76.
