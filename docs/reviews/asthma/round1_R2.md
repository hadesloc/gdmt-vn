# Báo Cáo Thẩm Định Chuyên Môn Vòng 1 – Reviewer R2 (Dược Sĩ Lâm Sàng)
## Module: Hen Phế Quản (Asthma) – GDMT-VN

- **Reviewer**: R2 – Dược sĩ lâm sàng (Clinical Pharmacist – Respiratory Pharmacotherapy Specialist)
- **Vòng duyệt**: Round 1
- **Ngày thực hiện**: 27/10/2026
- **Phạm vi thẩm định**:
  1. **21 tệp dữ liệu thuốc** trong `gdmt-vn/kb/drugs/*.json` thuộc module Hen:
     - Nhóm Corticosteroid hít (ICS) đơn trị: `budesonide`, `fluticasone_propionate`, `fluticasone_furoate`, `beclometasone`, `mometasone`, `ciclesonide`.
     - Nhóm phối hợp ICS-LABA: `budesonide_formoterol`, `beclometasone_formoterol`, `fluticasone_salmeterol`, `fluticasone_vilanterol`, `mometasone_formoterol`.
     - Nhóm giãn phế quản tác dụng ngắn (SABA & SAMA): `salbutamol`, `terbutaline`, `ipratropium`.
     - Nhóm kháng thụ thể Leukotriene (LTRA): `montelukast`.
     - Nhóm thuốc sinh học đích kiểu hình (Biologics): `omalizumab` (anti-IgE), `benralizumab` (anti-IL5Rα), `tezepelumab` (anti-TSLP).
     - Nhóm Corticoid toàn thân & Thuốc hỗ trợ cấp cứu: `prednisolone`, `methylprednisolone`, `magnesium_sulfate`.
  2. **Ma trận điều trị & Ma trận tương đương liều ICS**: `src/modules/asthma/matrices.ts` (`asthmaTrackMatrix`, `icsDoseEquivalenceMatrix`).
  3. **Bộ quy tắc lâm sàng (Rules & Action Plan)**: `src/modules/asthma/rules.ts`, `src/modules/asthma/actionPlan.ts`.
  4. **Thử nghiệm động**: Chạy đánh giá động (`evaluate()`) với 5 ca lâm sàng mẫu trong `presets.ts` và 22 ca chuẩn trong `tests/golden/asthma/*.json`.
  5. **Đối chiếu tài liệu nguồn**: Chiến lược toàn cầu GINA 2026 (Strategy Report & Summary Guide), Hướng dẫn Bộ Y tế (QĐ 1851/QĐ-BYT 2020 và QĐ 5850/QĐ-BYT 2021), kho nhãn thuốc FDA/EMA trong `Medical_Library_2026/09_Nhan_Thuoc/`, Dược thư Quốc gia Việt Nam và danh mục thuốc lưu hành của Cục Quản lý Dược (DAV).

---

## 1. TỔNG QUAN KẾT QUẢ THẨM ĐỊNH

| Mức độ nghiêm trọng (Severity) | Số lượng | Ghi chú tóm tắt |
|---|:---:|---|
| **CRITICAL** (Nguy cơ gây hại trực tiếp) | **2** | (1) Bỏ sót 100% y lệnh thuốc cấp cứu trong Cơn hen nguy kịch (phổi im lặng / rối loạn tri giác), chỉ phát sinh duy nhất lệnh REFER chuyển ICU; (2) Kế hoạch hành động hen chỉ định hít cấp cứu 4–6 nhát qua buồng đệm áp dụng cho cả Track 1 (Symbicort Turbuhaler DPI) gây nguy cơ ngộ độc Formoterol cấp và vón cục hỏng thiết bị DPI. |
| **MAJOR** (Sai sót liều/guideline/nhãn thuốc) | **10** | (3) Cơn hen nhẹ-trung bình nội viện thiếu điều kiện xác nhận đợt cấp, tự động kê đơn Prednisolone 50 mg + Salbutamol 4-10 nhát cho mọi BN hen nằm viện ổn định; (4) Đánh rơi hoàn toàn thuốc kiểm soát nền (`budesonide_formoterol`) khi BN không kiểm soát Bậc 4 tiến triển Bậc 5 Hen nặng; (5) Gom toàn bộ gói cấp cứu hen nặng vào duy nhất `salbutamol`, bỏ sót y lệnh dược của Methylprednisolone, Ipratropium, MgSO₄; (6) Ma trận ICS copy-paste liều Mometasone pMDI (liều thấp = trung bình = 200–400 mcg); (7) Thiếu Gate trần liều Formoterol ở Foster (`beclometasone_formoterol.json`); (8) Thiếu Gate cấm SABA đơn độc ở `terbutaline.json` và trần liều 4 nhát/ngày quá chặt; (9) Montelukast Boxed Warning tự động kích hoạt vô lý cho mọi BN trầm cảm không hề dùng thuốc; (10) Nhầm lẫn liều giữa Seretide Evohaler pMDI và Accuhaler DPI; (11) Biệt dược không lưu hành tại VN (Arnuity, Asmanex, Dulera, Becotide, Tezspire); (12) Cảnh báo SABA đơn độc gán cứng `salbutamol` khi BN thực dùng Terbutaline. |
| **MINOR** (Lỗi trích dẫn, thiếu liều trẻ em, nhiễu UI) | **4** | (13) Trích dẫn sai lệch citationId ở luật chẹn beta; (14) Thiếu công thức liều theo cân nặng ở `prednisolone.json`; (15) Tự động sinh Kế hoạch hành động tại nhà giữa bối cảnh cấp cứu hồi sức nguy kịch; (16) Thiếu nhãn thuốc FDA/EMA trong kho thư viện cho 20/21 thuốc hen. |
| **SUGGESTION** (Kiến nghị hoàn thiện thực hành) | **1** | (17) Bổ sung hướng dẫn súc miệng sau hít vào tất cả các tệp thuốc chứa ICS để ngừa nấm miệng và khản giọng. |
| **TỔNG CỘNG** | **17** | |

### KẾT LUẬN CUỐI VÒNG 1: **FAIL**
*(Theo quy chuẩn `docs/REVIEW_PROTOCOL.md`: Module chỉ đạt PASS khi có 0 lỗi Critical và 0 lỗi Major).*

---

## 2. BẢNG CHI TIẾT TỪNG HOẠT CHẤT (DRUGENTRY AUDIT - 21 THUỐC)

*Ghi chú tra cứu kho nhãn thuốc `Medical_Library_2026/09_Nhan_Thuoc/`: Duy nhất `FDA_label_dupilumab.pdf` có sẵn trong thư mục FDA. Tất cả 20 hoạt chất còn lại đều chưa có tệp nhãn PDF trong thư mục này.*

| STT | Hoạt chất | Phân nhóm | Liều khởi đầu (Start) | Liều đích / Tối đa (Target/Max) | Thiết bị & Biệt dược tại VN | Tình trạng nhãn `09_Nhan_Thuoc` | Đánh giá dược lâm sàng R2 |
|:---:|---|:---:|---|---|---|:---:|---|
| 1 | **Budesonide** | ICS | 200 mcg 1–2 lần/ngày (200–400 mcg/ngày) | 800 mcg 2 lần/ngày (>800 mcg/ngày) | Pulmicort Turbuhaler (100, 200 mcg), Pulmicort Respules (0.5mg/2ml, 1mg/2ml), Budecort | *Thiếu nhãn PDF* | **ĐẠT LIỀU CHUẨN**. Đúng GINA 2026 Table 6. Cần thêm hướng dẫn súc miệng sau hít để phòng ngừa nấm hầu họng. |
| 2 | **Fluticasone propionate** | ICS | 100 mcg 1–2 lần/ngày (100–250 mcg/ngày) | 500 mcg 2 lần/ngày (>500 mcg/ngày) | Flixotide Evohaler (50, 125 mcg), Flixotide Nebules (0.5mg/2ml) | *Thiếu nhãn PDF* | **ĐẠT LIỀU CHUẨN**. Đúng GINA 2026 Table 6. Tránh nhầm lẫn liều giữa pMDI và Accuhaler. |
| 3 | **Fluticasone furoate** | ICS | 100 mcg 1 lần/ngày | 200 mcg 1 lần/ngày | *Không lưu hành đơn trị liệu tại VN* (Chỉ có trong Relvar Ellipta) | *Thiếu nhãn PDF* | **CẦN SỬA BIỆT DƯỢC**. Ghi `vnBrands: ["Arnuity Ellipta"]` là biệt dược FDA Mỹ. Tại VN thuốc chỉ có dạng phối hợp Relvar Ellipta. |
| 4 | **Beclometasone** | ICS | 100 mcg 1–2 lần/ngày (hạt siêu mịn 100–200 mcg/ngày) | 400 mcg 2 lần/ngày (>400 mcg/ngày) | *CFC cũ ngừng lưu hành*; tại VN có dạng hạt siêu mịn trong Foster | *Thiếu nhãn PDF* | **CẦN SỬA BIỆT DƯỢC**. Ghi `Becotide`, `Becloforte` là biệt dược CFC đã bị rút số đăng ký từ lâu. Beclometasone siêu mịn tại VN hiện lưu hành ở dạng phối hợp Foster. |
| 5 | **Mometasone** | ICS | 200 mcg 1–2 lần/ngày (200–400 mcg/ngày) | 400 mcg 2 lần/ngày (400 mcg/ngày) | *Không lưu hành dạng hít đơn trị tại VN* (Chỉ có Dulera hoặc xịt mũi Nasonex) | *Thiếu nhãn PDF* | **CẦN SỬA BIỆT DƯỢC**. Ghi `Asmanex Twisthaler` là biệt dược FDA Mỹ. Ma trận ICS bị lỗi copy trùng liều 200–400 mcg ở cả ô thấp và trung bình. |
| 6 | **Ciclesonide** | ICS | 80 mcg 1 lần/ngày (80–160 mcg/ngày) | 320 mcg 2 lần/ngày (>320 mcg/ngày) | Alvesco pMDI (80, 160 mcg) - hiếm gặp tại VN | *Thiếu nhãn PDF* | **ĐẠT LIỀU CHUẨN**. Hạt siêu mịn tiền dược chuyển hóa tại phổi. Đúng GINA Table 6. |
| 7 | **Budesonide / Formoterol** | ICS-LABA | AIR: 1 nhát khi cần; MART B3: 1 nhát x 2 lần/ngày + khi cần | MART B4–5: 2 nhát x 2 lần/ngày + khi cần (Max 12 nhát/ngày) | Symbicort Turbuhaler (160/4.5), Symbicort Rapihaler (160/4.5), Bufoler Easyhaler | *Thiếu nhãn PDF* | **TRỌNG TÂM TRACK 1**. Khớp hoàn toàn GINA 2026 Box 4-8. Có Gate chặn liều tối đa 12 nhát/ngày (54 mcg delivered / 72 mcg metered formoterol). |
| 8 | **Beclometasone / Formoterol** | ICS-LABA | MART B3: 1 nhát x 1–2 lần/ngày + khi cần | MART B4: 2 nhát x 2 lần/ngày + khi cần (Max 12 nhát/ngày) | Foster pMDI (100/6), Foster Nexthaler (100/6) | *Thiếu nhãn PDF* | **THIẾU CỔNG AN TOÀN**. Hạt siêu mịn (extrafine). Bỏ sót hoàn toàn `gate_formoterol_max_daily` (giới hạn 12 nhát/ngày) trong khi budesonide/formoterol lại có. |
| 9 | **Fluticasone / Salmeterol** | ICS-LABA | Track 2 B3: 1 nhát 50/25 hoặc 125/25 x 2 lần/ngày (?) | Track 2 B4: 1 nhát 250/25 hoặc 250/50 x 2 lần/ngày | Seretide Evohaler (50/25, 125/25), Seretide Accuhaler (100/50, 250/50) | *Thiếu nhãn PDF* | **NHẦM LẪN THIẾT BỊ**. Evohaler pMDI bắt buộc dùng **2 nhát x 2 lần/ngày** để đạt 50 mcg salmeterol; Accuhaler DPI dùng 1 nhát x 2 lần/ngày. Ghi 1 nhát chung gây thiếu liều. |
| 10 | **Fluticasone / Vilanterol** | ICS-LABA | 1 nhát 100/25 mcg 1 lần/ngày | 1 nhát 200/25 mcg 1 lần/ngày | Relvar Ellipta (100/25, 200/25 mcg) | *Thiếu nhãn PDF* | **CHUẨN XÁC**. Chỉ dùng 1 lần/ngày (24h). Tuyệt đối không dùng làm thuốc cắt cơn nhanh và không dùng 2 lần/ngày. |
| 11 | **Mometasone / Formoterol** | ICS-LABA | Track 2 B3: 2 nhát 100/5 mcg x 2 lần/ngày | Track 2 B4: 2 nhát 200/5 mcg x 2 lần/ngày | *Chưa lưu hành đại trà tại VN* (Dulera pMDI) | *Thiếu nhãn PDF* | **CẦN SỬA BIỆT DƯỢC**. Ghi `Dulera` là tên FDA Mỹ. GINA 2026 xếp vào Track 2 vì chưa có thử nghiệm lâm sàng ngẫu nhiên cho AIR/MART. |
| 12 | **Salbutamol (Albuterol)** | SABA | Cắt cơn: 4–10 nhát qua buồng đệm hoặc 2.5–5 mg khí dung | Cơn nặng: 6–10 nhát hoặc 5 mg khí dung mỗi 20–30 phút x 3 lần | Ventolin Evohaler (100 mcg), Ventolin Nebules (2.5, 5 mg), Salbutamol Danapha | *Thiếu nhãn PDF* | **ĐẠT LIỀU CHUẨN**. Có Gate cấm dùng SABA đơn độc không kèm ICS. Cần chú ý nguy cơ hạ kali máu và nhịp nhanh khi dùng liều cao cấp cứu. |
| 13 | **Terbutaline** | SABA | 1 nhát (0.5 mg) khi cần | Tối đa 4 nhát/ngày (?) | Bricanyl Turbuhaler (0.5 mg), Bricanyl Respules (5 mg/2 ml) | *Thiếu nhãn PDF* | **THIẾU CỔNG AN TOÀN**. Thiếu Gate cấm SABA đơn độc. Mức trần 4 nhát/ngày quá chặt (nhãn Bricanyl cho phép đến 8 nhát/ngày = 4 mg trong cơn co thắt nặng). |
| 14 | **Ipratropium bromide** | SAMA | Cơn cấp vừa-nặng: 4 nhát hoặc 0.5 mg khí dung + SABA | Tối đa 3 lần trong giờ đầu tại Cấp cứu | Atrovent, Berodual (fenoterol + ipratropium), Combivent | *Thiếu nhãn PDF* | **CHUẨN XÁC CẤP CỨU**. Phối hợp SABA trong 1–2 giờ đầu làm giảm tỷ lệ nhập viện (Evidence A). Không có chỉ định duy trì mạn tính hen đơn thuần. |
| 15 | **Montelukast** | LTRA | 10 mg uống 1 lần/ngày vào buổi tối | 10 mg/ngày (Trẻ 6–14t: 5 mg; Trẻ 2–5t: 4 mg) | Singulair (4, 5, 10 mg), Montiget, Asthmatin, Givet | *Thiếu nhãn PDF* | **CÓ CẢNH BÁO TÂM THẦN KINH**. Có Gate FDA Boxed Warning. Tuy nhiên luật kích hoạt bị lỗi logic `||` khiến BN trầm cảm không dùng thuốc vẫn bị cảnh báo. |
| 16 | **Omalizumab** | Anti-IgE | 75–600 mg SC mỗi 2 hoặc 4 tuần (theo IgE nền và cân nặng) | Chuẩn độ theo bảng định liều FDA/EMA | Xolair (Lọ bột/Bút tiêm 75 mg, 150 mg) | *Thiếu nhãn PDF* | **ĐẠT TIÊU CHUẨN BẬC 5**. Có Gate tuổi ≥ 6. Cần theo dõi phản vệ sau tiêm (0.1–0.2%). Yêu cầu IgE nền 30–1500 IU/mL và dị nguyên hô hấp (+). |
| 17 | **Benralizumab** | Anti-IL5Rα | 30 mg SC mỗi 4 tuần cho 3 liều đầu | Duy trì 30 mg SC mỗi 8 tuần | Fasenra (Bút tiêm 30 mg/ml) | *Thiếu nhãn PDF* | **XUẤT SẮC**. Phác đồ khởi đầu (mỗi 4 tuần x 3 liều, sau đó mỗi 8 tuần) cực kỳ chính xác theo nhãn Fasenra và GINA Box 8-6. Eos ≥ 300 tế bào/µL. |
| 18 | **Tezepelumab** | Anti-TSLP | 210 mg SC mỗi 4 tuần | 210 mg SC mỗi 4 tuần | *Chưa lưu hành tại Việt Nam* (Tezspire) | *Thiếu nhãn PDF* | **CẦN SỬA BIỆT DƯỢC**. Ghi `vnBrands: ["Tezspire"]` sai thực tế vì thuốc chưa được Bộ Y tế cấp visa lưu hành tại VN. Có Gate tuổi ≥ 12 chuẩn FDA. |
| 19 | **Prednisolone** | OCS | Người lớn: 40–50 mg/ngày x 5–7 ngày (hoặc 1 mg/kg, max 50 mg) | Tối đa 50 mg/ngày (Trẻ em: 1–2 mg/kg, max 40 mg x 3–5 ngày) | Prednisolon 5 mg Phapharco, Solupred 5 mg, 20 mg | *Thiếu nhãn PDF* | **THIẾU LIỀU THEO CÂN NẶNG**. Tệp json chỉ nêu số mg cố định của người lớn, thiếu công thức 1 mg/kg của BYT 5850 và liều trẻ em. Uống 1 lần buổi sáng, không cần giảm liều nếu dùng < 2 tuần. |
| 20 | **Methylprednisolone** | Systemic CS | Cơn nặng nội viện: 40 mg tiêm TM (hoặc 1 mg/kg mỗi 6–12h) | Chuyển sang đường uống ngay khi bệnh nhân nuốt được | Medrol (4, 16 mg), Solu-Medrol (40, 125, 500 mg) | *Thiếu nhãn PDF* | **ĐẠT LIỀU NỘI VIỆN**. Đúng BYT QĐ 5850 và GINA 2026. Chuyển uống sớm để rút ngắn ngày tiêm truyền. |
| 21 | **Magnesium sulfate** | Adjuvant | 2 g truyền tĩnh mạch chậm trong 20 phút | Liều đơn duy nhất 2 g trong cấp cứu | Magnesi sulfat 15% Vinphaco (1.5g/10ml), Magnesium Sulfate 50% | *Thiếu nhãn PDF* | **ĐẠT LIỀU CHUẨN**. Chỉ định cho cơn hen nặng không đáp ứng sau 1 giờ hoặc FEV1 < 25–30%. Tuyệt đối không dùng khí dung. Thận trọng khi eGFR < 30 do nguy cơ tăng magie máu. |

---

## 3. PHÂN TÍCH CHI TIẾT CÁC PHÁT HIỆN TRỌNG TÂM (DEEP CLINICAL AUDIT)

### 3.1. Finding ASTHMA-R2-01 (CRITICAL): Cơn hen nguy kịch đe dọa tính mạng (phổi im lặng / lơ mơ) bị bỏ sót 100% y lệnh thuốc cấp cứu
- **Vị trí**: `src/modules/asthma/rules.ts` (dòng 337–359, rule `asthma.inpatient.severe_exacerbation`).
- **Phân tích cơ chế và bằng chứng mã nguồn**:
  Tại quy tắc xử trí cấp cứu nội viện, đoạn mã kiểm tra dấu hiệu đe dọa tử vong:
  ```typescript
  // Nếu có dấu hiệu đe dọa tính mạng (phổi im lặng hoặc lơ mơ) -> Báo động ICU ngay
  if (silentChest || drowsy) {
    return {
      id: 'rec_asthma_acute_life_threatening_icu',
      module: 'asthma',
      tier: 'Cấp cứu nguy kịch (Đe dọa tính mạng)',
      tierOrder: 0,
      action: 'REFER',
      title: 'BÁO ĐỘNG ICU KHẨN CẤP: Cơn hen nguy kịch có lồng ngực im lặng / rối loạn tri giác',
      rationale: `Bệnh nhân có dấu hiệu kiệt cơ hô hấp, lồng ngực im lặng (silent chest)... Cần gọi hỗ trợ Hồi sức tích cực (ICU)...`,
      gates: [ ... ],
      priority: 100
    };
  }
  ```
  Lệnh `return` này kết thúc việc sinh khuyến cáo của rule 6. Đồng thời, rule 7 (cơn nhẹ-trung bình) bị tắt do `isSevere = true`. Rule 8 (kế hoạch xuất viện) không chạy. Rule 17 sinh thêm bản Kế hoạch hành động tại nhà.
- **Hệ quả trên ca bệnh thực tế**:
  Khi chạy `evaluate()` trên ca chuẩn `asthma_18_inpatient_acute_life_threatening` (Bệnh nhân nam 44 tuổi, SpO₂ 82%, RR 36, thở không thành tiếng, lồng ngực im lặng, lơ mơ lẫn lộn), GDMT-VN xuất ra:
  1. `[REFER] BÁO ĐỘNG ICU KHẨN CẤP...`
  2. `[MONITOR] Bản Kế hoạch hành động hen phế quản tiếng Việt (Vùng Xanh - Vàng - Đỏ)...`
  **HỆ THỐNG KHÔNG PHÁT SINH BẤT KỲ MỘT Y LỆNH THUỐC CẤP CỨU NÀO (0 mg thuốc)!**
- **Đối chiếu Hướng dẫn Chuyên môn**:
  - Hướng dẫn Bộ Y tế (QĐ 5850/QĐ-BYT 2021, trang 17–18): Khi có cơn hen nguy kịch (ngủ gà, lú lẫn, lồng ngực im lặng), quy trình bắt buộc ghi rõ: *"Chuyển đến bệnh viện gần nhất / Chuyển khoa Hồi sức tích cực. TRONG LÚC CHỜ CHUYỂN: SABA phun khí dung; Thở oxy đảm bảo SpO2 93-95%; Ipratropium 0.5 mg phun khí dung; Corticoid: Methylprednisolon 40 mg tiêm TM hoặc Hydrocortisone 100 mg tiêm TM; Chuẩn bị dụng cụ đặt nội khí quản"*.
  - GINA 2026 (trang 184–186): Life-threatening asthma presentation đòi hỏi khởi động ngay lập tức đồng thời hồi sức tích cực và điều trị dược lý liều tối đa. Việc chỉ phát lệnh REFER mà bỏ quên toàn bộ thuốc cấp cứu khiến bệnh nhân rơi vào ngừng tuần hoàn do thiếu oxy và co thắt phế quản bít tắc hoàn toàn trong thời gian chờ đội ICU có mặt.
- **Hành động khắc phục**:
  Không được `return` đơn độc tại nhánh `silentChest || drowsy`. Bắt buộc phải phát sinh đồng thời gói y lệnh cấp cứu khẩn cấp: Khí dung Salbutamol 5 mg phối hợp Ipratropium 0.5 mg liên tục, Methylprednisolone 40 mg tiêm TM, thở oxy lưu lượng kiểm soát và chuẩn bị đặt nội khí quản.

---

### 3.2. Finding ASTHMA-R2-02 (CRITICAL): Kế hoạch Hành động Hen chỉ định hít cấp cứu 4–6 nhát thuốc cắt cơn qua buồng đệm áp dụng cho cả Track 1 (Symbicort Turbuhaler DPI)
- **Vị trí**: `src/modules/asthma/actionPlan.ts` (dòng 86–87).
- **Phân tích dược học và thiết bị**:
  Trong hàm `generateAsthmaActionPlanVi`, phần xử trí Vùng Đỏ (nguy hiểm) ghi chung:
  ```text
  85: HÀNH ĐỘNG CẤP CỨU NGAY LẬP TỨC:
  86: 1. HÍT THUỐC CẮT CƠN KHẨN CẤP:
  87:    • Xịt ngay 4–6 nhát ${params.relieverDrug} qua buồng đệm (hoặc khí dung nếu có máy).
  88: 2. UỐNG THUỐC CORTICOID TOÀN THÂN (nếu đã được bác sĩ kê sẵn):
  89:    • Uống ngay Prednisolone 40–50 mg (hoặc Methylprednisolone 32–40 mg).
  ```
  Khi bệnh nhân điều trị theo Track 1 (chiến lược ưu tiên hàng đầu của GINA), `params.relieverDrug` được truyền vào là: `"Budesonide/formoterol 160/4.5 mcg"` (Turbuhaler hoặc Spiromax).
- **Hậu quả lâm sàng cực kỳ nghiêm trọng**:
  1. **Hỏng cơ chế khí động học của bình bột khô DPI**: Turbuhaler là bình hít bột khô kích hoạt bằng lực hít của bệnh nhân (DPI). Bột thuốc siêu mịn đòi hỏi luồng khí hít vào mạnh và sâu trực tiếp từ miệng ngậm. Buồng đệm (spacer) CHỈ DÙNG CHO BÌNH XỊT ĐỊNH LIỀU KHÍ DUNG pMDI (như Ventolin Evohaler). Nếu hướng dẫn bệnh nhân gắn bình Turbuhaler vào buồng đệm để "xịt", bệnh nhân không thể tạo lực khí nén; tĩnh điện và độ ẩm trong buồng đệm sẽ làm vón cục toàn bộ bột thuốc, bệnh nhân hít buồng đệm sẽ nhận 0 mcg hoạt chất!
  2. **Quá liều Formoterol cấp tính**: Nếu bệnh nhân hiểu là hít trực tiếp 4–6 nhát Budesonide/formoterol 160/4.5 mcg dồn dập một lúc, bệnh nhân sẽ nhận ngay **18–27 mcg formoterol delivered (tương đương 24–36 mcg metered dose)** chỉ trong 1–2 phút. Formoterol là chất đồng vận beta-2 toàn phần tác dụng nhanh và kéo dài. Liều bolus cực lớn này sẽ gây tăng nhịp tim kịch phát, ngoại tâm thu thất, hạ kali máu nặng và run cơ dữ dội, đặc biệt nguy hiểm ở bệnh nhân hen có bệnh tim mạch tiềm ẩn.
  3. **Đúng chuẩn GINA 2026**: Với Track 1 (AIR/MART), khi triệu chứng xấu đi sang vùng Đỏ: Hít 1 nhát ICS-formoterol, nếu cần hít thêm 1 nhát nữa sau vài phút (tối đa không quá 12 nhát/ngày), uống ngay Prednisolone 40–50 mg và gọi cấp cứu 115 hoặc đến bệnh viện ngay. Hướng dẫn hít 4–6 nhát qua buồng đệm CHỈ ÁP DỤNG CHO TRACK 2 khi dùng bình xịt định liều Salbutamol pMDI (Ventolin 100 mcg).
- **Hành động khắc phục**:
  Tách riêng logic hướng dẫn vùng Đỏ theo `params.track`:
  - Track 1: Hít ngay 1–2 nhát Budesonide/formoterol (trực tiếp từ bình hít, không dùng buồng đệm), uống ngay OCS và đến cơ sở y tế khẩn cấp.
  - Track 2: Xịt 4–6 nhát Salbutamol pMDI qua buồng đệm, uống OCS và đến cơ sở y tế.

---

### 3.3. Finding ASTHMA-R2-03 (MAJOR): Quy tắc Cơn hen nhẹ-trung bình nội viện thiếu điều kiện xác nhận đợt cấp, tự động kê đơn Prednisolone + Salbutamol cho mọi BN hen nằm viện ổn định
- **Vị trí**: `src/modules/asthma/rules.ts` (dòng 405–429, rule `asthma.inpatient.mild_moderate_exacerbation`).
- **Phân tích logic**:
  Rule này có điều kiện:
  ```typescript
  when: (ctx) => {
    // ... lấy các chỉ số hô hấp ...
    // Loại trừ cơn nặng
    const isSevere = speech === 'words' || ... || silentChest || drowsy;
    return !isSevere;
  }
  ```
  Nhìn vào hàm `when`, khi biến môi trường là `setting: 'inpatient'`, nếu bệnh nhân KHÔNG có các dấu hiệu nặng của cơn hen, hàm trả về `true`!
  Nếu một bệnh nhân hen phế quản nhập viện vì một bệnh lý ngoại khoa (mổ sỏi túi mật phiên, phẫu thuật chỉnh hình) hoặc bệnh nhân hen nằm viện điều trị ổn định chuẩn bị ra viện: Họ không có `silentChest`, không co kéo cơ hô hấp, mạch 75, thở 18 -> `isSevere = false` -> `return true`!
  Hệ thống lập tức kích hoạt khuyến cáo:
  `[START] rec_asthma_acute_mild_moderate: Khởi trị Cơn hen cấp nhẹ - trung bình (SABA cắt cơn + Corticoid uống ngắn ngày)`
  với liều: `"Salbutamol 4–10 nhát xịt qua buồng đệm; Prednisolone 40–50 mg/ngày x 5–7 ngày"`.
- **Hệ quả**: Bệnh nhân hen nằm viện hoàn toàn khỏe mạnh về hô hấp lại bị chỉ định vô tội vạ một đợt Corticoid toàn thân liều cao 50 mg/ngày và hít Salbutamol dồn dập. Đây là chỉ định lạm dụng thuốc sai lệch, làm tăng nguy cơ tăng đường huyết, loét dạ dày và ức chế thượng thận.
- **Hành động khắc phục**:
  Bổ sung cờ bắt buộc: `ci.isAcuteExacerbation === true` hoặc kiểm tra có triệu chứng khó thở cấp tính khởi phát trước khi kích hoạt phác đồ xử trí cơn cấp.

---

### 3.4. Finding ASTHMA-R2-04 (MAJOR): Đánh rơi hoàn toàn thuốc kiểm soát nền (`budesonide_formoterol`) khi bệnh nhân không kiểm soát Bậc 4 tiến triển Bậc 5 Hen nặng
- **Vị trí**: `src/modules/asthma/rules.ts` (dòng 774 và dòng 843).
- **Phân tích hiện tượng**:
  - Tại Bậc 4 MART, điều kiện luật là:
    `return needStep4 && !(currentStep === 4 && score.level === 'uncontrolled' && techniqueOk && adherenceOk);`
    Khi bệnh nhân đang ở Bậc 4 mà không kiểm soát (triệu chứng hàng ngày, thức giấc đêm, dù kỹ thuật hít đúng), vế phủ định kích hoạt khiến luật Bậc 4 tắt đi.
  - Luật Bậc 5 (`asthma.outpatient.track1_step5_severe`) bật lên, nhưng chỉ phát sinh một khuyến cáo:
    `[REFER] rec_asthma_track1_step5_lama_biologic: Bậc 5 Hen phế quản nặng: Phối hợp LAMA, đánh giá thuốc sinh học và chuyển chuyên khoa`.
    Khuyến cáo này không có `drugId`, không có `dose`.
- **Hệ quả trên ca thực tế (Preset 3 `preset_asthma_severe_step5_eosinophilic`)**:
  Bệnh nhân Lê Văn C (48 tuổi) đang dùng Symbicort Turbuhaler 160/4.5 mcg 2 nhát x 2 lần/ngày. Khi chạy qua engine, hệ thống không hề sinh khuyến cáo `[CONTINUE]` cho Symbicort! Thuốc duy trì nền tảng biến mất khỏi danh sách y lệnh. Bệnh nhân hen nặng không thể bị cắt thuốc kiểm soát trong thời gian chờ đợi khám chuyên khoa hô hấp.
- **Hành động khắc phục**:
  Bổ sung khuyến cáo xác nhận `[CONTINUE]` Budesonide/formoterol 160/4.5 mcg 2 nhát x 2 lần/ngày duy trì + 1 nhát khi cần, song song với khuyến cáo `[REFER]` chuyển chuyên gia đánh giá thêm LAMA và thuốc sinh học.

---

### 3.5. Finding ASTHMA-R2-05 (MAJOR): Gom toàn bộ gói cấp cứu hen nặng vào 1 mã `salbutamol`, bỏ sót y lệnh dược của Corticoid tiêm, Ipratropium và Magnesi sulfat
- **Vị trí**: `src/modules/asthma/rules.ts` (dòng 368–377, `rec_asthma_acute_severe_bundle`).
- **Phân tích dược lâm sàng**:
  Quy tắc cấp cứu cơn hen cấp nặng nội viện gán:
  `drugId: 'salbutamol'`, `drugNameVi: 'Salbutamol + Ipratropium + Corticoid toàn thân'`,
  `dose: 'Salbutamol 4–10 nhát (hoặc 5 mg khí dung) + Ipratropium 4 nhát mỗi 20 phút trong giờ đầu'`,
  và trong phần giải trình `rationale` liệt kê thêm: Thở oxy, Methylprednisolone 40 mg tiêm TM, Magnesium sulfate 2 g truyền TM.
- **Hệ quả tích hợp phần mềm y tế**:
  Trong kiến trúc GDMT-VN, mỗi `drugId` đại diện cho một hoạt chất để hệ thống kiểm tra tương tác thuốc, cổng an toàn, và kết nối với danh mục Dược bệnh viện. Việc nhồi nhét 4 loại thuốc cấp cứu sống còn vào mã `salbutamol` khiến:
  1. Không có y lệnh xuất kho cho Methylprednisolone 40 mg tiêm TM.
  2. Không có y lệnh xuất kho cho Ipratropium 0.5 mg.
  3. Không có y lệnh theo dõi tốc độ truyền Magnesium sulfate 2 g trong 20 phút.
  4. Liều "Ipratropium 4 nhát" rất mơ hồ tại khoa cấp cứu Việt Nam, nơi hầu hết cấp cứu cơn hen nặng đều dùng dung dịch khí dung (Ipratropium 0.5 mg hoặc dạng phối hợp Berodual / Combivent) chứ không dùng pMDI 20 mcg.
- **Hành động khắc phục**:
  Tách bạch các recommendation thành phần: (1) Khí dung phối hợp SABA + SAMA; (2) Tiêm tĩnh mạch Methylprednisolone 40 mg; (3) Cân nhắc truyền TM Magnesi sulfat 2 g trong 20 phút.

---

### 3.6. Finding ASTHMA-R2-06 (MAJOR): Lỗi ma trận liều Mometasone furoate pMDI (Liều thấp = Trung bình = 200–400 mcg)
- **Vị trí**: `src/modules/asthma/matrices.ts` (dòng 244, 250, 256, bảng `icsDoseEquivalenceMatrix`).
- **Chi tiết lỗi**:
  ```typescript
  // Cột Low:
  dose: `${th('asthma.ics.mometasone_low_min')}–${th('asthma.ics.mometasone_high')} mcg/ngày` // -> "200–400 mcg/ngày"
  // Cột Medium:
  dose: `${th('asthma.ics.mometasone_low_min')}–${th('asthma.ics.mometasone_high')} mcg/ngày` // -> "200–400 mcg/ngày"
  // Cột High:
  dose: `${th('asthma.ics.mometasone_high')} mcg/ngày` // -> "400 mcg/ngày"
  ```
- **Đối chiếu GINA 2026 Table 6 (trang 44) & Box 4-2 (trang 77–78)**:
  Bảng chuẩn liều Mometasone furoate (pMDI, standard particle, HFA) cho người lớn và vị thành niên:
  - Low dose: **200–400 mcg/ngày** (hoặc 200 mcg/ngày khi chia 100 mcg x 2 lần).
  - Medium dose: GINA ghi chú phụ thuộc thiết bị hoặc không có mức liều trung bình riêng biệt (tương tự Fluticasone furoate chỉ có low và high).
  - High dose: **> 400 mcg/ngày** (thường là 400 mcg x 2 lần/ngày = 800 mcg/ngày).
  Việc mã nguồn copy-paste cùng chuỗi 200–400 cho cả Low và Medium, đồng thời ghi High là 400 (thay vì >400) là lỗi hiển thị ma trận cẩu thả, gây mất phương hướng cho bác sĩ khi tra cứu bậc liều tương đương.
- **Hành động khắc phục**:
  Sửa lại giá trị các ô trong ma trận: Low: `200–400 mcg/ngày`; Medium: `Không có mức liều trung bình riêng biệt`; High: `>400 mcg/ngày`.

---

### 3.7. Finding ASTHMA-R2-07 & ASTHMA-R2-08 (MAJOR): Thiếu Cổng An Toàn Kiểm Soát Trần Liều Formoterol ở Foster và Cấm SABA Đơn Độc ở Terbutaline
- **Vị trí**: `gdmt-vn/kb/drugs/beclometasone_formoterol.json` & `gdmt-vn/kb/drugs/terbutaline.json`.
- **Phân tích đối xứng an toàn**:
  - `budesonide_formoterol.json` có Gate chặn `gate_formoterol_max_daily` (threshold: 12 nhát/ngày). Tuy nhiên `beclometasone_formoterol.json` (Foster) lại để `gates: []` rỗng! Cả hai thuốc đều sử dụng Formoterol và đều có trần an toàn của GINA 2026 là không quá 72 mcg formoterol định liều/ngày (tương đương 12 nhát Foster 100/6 mcg). Việc bỏ sót gate ở Foster là lỗ hổng an toàn bất đối xứng.
  - `salbutamol.json` có Gate `gate_salbutamol_not_alone` chặn khi `hasIcsMaintenance == 0`. Nhưng `terbutaline.json` (Bricanyl) lại để `gates: []` rỗng! Terbutaline cũng là SABA, việc người bệnh dùng Bricanyl Turbuhaler đơn độc cắt cơn mà không có ICS cũng gây nguy cơ tử vong do hen tương đương Salbutamol.
- **Hành động khắc phục**:
  Bổ sung ngay hai Gate an toàn này vào `beclometasone_formoterol.json` và `terbutaline.json`.

---

### 3.8. Finding ASTHMA-R2-09 (MAJOR): Cảnh báo Boxed Warning của Montelukast tự động kích hoạt vô lý cho mọi bệnh nhân có tiền sử trầm cảm dù không dùng thuốc
- **Vị trí**: `src/modules/asthma/rules.ts` (dòng 256–261, rule `asthma.safety.montelukast_mental`).
- **Phân tích mã nguồn**:
  ```typescript
  when: (ctx) => {
    const isTakingMontelukast = ctx.patient.currentMeds.some((m) => m.drugId === 'montelukast');
    const ci = ctx.normalized.customInputs || {};
    const hasPsychRisk = Boolean(ci.priorNeuropsychiatric || ctx.patient.conditions?.depression);
    return isTakingMontelukast || hasPsychRisk;
  }
  ```
  Toán tử `||` làm cho điều kiện thỏa mãn ngay khi bệnh nhân có tiền sử trầm cảm (`depression: true`), bất kể bệnh nhân có đang dùng Montelukast hay không!
  Hậu quả: Một bệnh nhân hen phế quản kiểm soát tốt bằng Symbicort hoặc Flixotide, chưa từng chạm vào một viên Singulair nào trong đời, nhưng trong bệnh án có mã chẩn đoán trầm cảm hoặc rối loạn lo âu, GDMT-VN sẽ lập tức cảnh báo:
  `[MONITOR] drugId: 'montelukast' - Theo dõi tác dụng phụ tâm thần kinh của Montelukast (FDA Boxed Warning)`!
  Bác sĩ điều trị sẽ bối rối tự hỏi tại sao phần mềm lại cảnh báo về một thuốc mà mình không hề kê đơn.
- **Hành động khắc phục**:
  Đổi thành điều kiện kết hợp: Chỉ cảnh báo khi bệnh nhân ĐANG DÙNG Montelukast VÀ có tiền sử nguy cơ tâm thần kinh (`isTakingMontelukast && hasPsychRisk`).

---

### 3.9. Finding ASTHMA-R2-10 & ASTHMA-R2-11 (MAJOR): Nhầm lẫn liều thiết bị Seretide Evohaler vs Accuhaler và Biệt dược không có thật tại Việt Nam
- **Phân tích Seretide**:
  - Tệp `fluticasone_salmeterol.json` và rule Track 2 Bậc 3 ghi: `1 nhát 50/25 hoặc 125/25 x 2 lần/ngày`.
  - Bình xịt định liều Seretide Evohaler pMDI (50/25 và 125/25) chứa 25 mcg salmeterol mỗi nhát xịt. Để đạt liều chuẩn LABA là 50 mcg salmeterol mỗi lần dùng, bệnh nhân BẮT BUỘC PHẢI XỊT **2 nhát x 2 lần/ngày**. Chỉ có bình hít bột khô Seretide Accuhaler DPI mới dùng **1 liều hít (chứa sẵn 50 mcg salmeterol) x 2 lần/ngày**. Hướng dẫn hít 1 nhát pMDI sẽ làm giảm 50% liều giãn phế quản, khiến phác đồ thất bại.
- **Biệt dược Mỹ không lưu hành tại VN**:
  - `Arnuity Ellipta`: Biệt dược FDA Mỹ của Fluticasone furoate đơn độc, không phân phối tại VN (GSK tại VN chỉ lưu hành dạng phối hợp Relvar Ellipta).
  - `Asmanex Twisthaler`: Biệt dược FDA Mỹ của Mometasone furoate bột khô, không lưu hành tại VN.
  - `Dulera`: Biệt dược FDA Mỹ của Mometasone/Formoterol, chưa có visa lưu hành tại VN.
  - `Becotide` & `Becloforte`: Bình xịt CFC cổ điển đã bị ngừng sản xuất và rút số đăng ký từ lâu.
  - `Tezspire`: Thuốc sinh học Tezepelumab mới của AstraZeneca/Amgen, chưa được Bộ Y tế VN cấp phép lưu hành.
  Cần ghi nhận trung thực các biệt dược thực tế tại Việt Nam để tránh kê đơn ảo.

---

### 3.10. Finding ASTHMA-R2-12 (MAJOR): Cảnh báo cấm SABA đơn độc gán cứng `salbutamol` khi bệnh nhân đang dùng Terbutaline
- **Vị trí**: `src/modules/asthma/rules.ts` (dòng 114–118 và 130).
- **Phân tích**:
  Tại rule `asthma.safety.saba_only_prohibited`:
  Biến `takingSaba` kiểm tra: `m.drugId === 'salbutamol' || m.drugId === 'terbutaline'`.
  Nhưng hàm `produce()` lại hardcode:
  `drugId: 'salbutamol'`, `drugNameVi: 'Salbutamol (SABA đơn độc)'`, `title: 'NGƯNG ngay việc chỉ dùng SABA đơn độc...'`.
  Nếu bệnh nhân đang dùng Bricanyl Turbuhaler (Terbutaline) đơn độc không kèm ICS, engine sẽ phát y lệnh yêu cầu bác sĩ: `STOP salbutamol`! Đây là lỗi gán nhầm định danh thuốc trong khuyến cáo an toàn.

---

## 4. ĐÁNH GIÁ MA TRẬN & BẢNG TƯƠNG ĐƯƠNG LIỀU ICS (`src/modules/asthma/matrices.ts`)

### 4.1. Ma trận Phân bậc × Phân nhánh (`asthmaTrackMatrix`)
- **Cấu trúc**: 5 cột (Bậc 1 đến Bậc 5) × 2 hàng (Track 1 AIR/MART vs Track 2 SABA).
- **Đánh giá Track 1 (Budesonide/formoterol)**:
  - Bậc 1–2: AIR liều thấp khi cần (1 nhát khi cần), không cần duy trì. Rất chuẩn GINA 2026.
  - Bậc 3: MART liều thấp (1 nhát x 2 lần/ngày + khi cần). Chuẩn xác.
  - Bậc 4: MART liều trung bình (2 nhát x 2 lần/ngày + khi cần, tối đa 12 nhát/ngày). Chuẩn xác.
  - Bậc 5: Thêm LAMA + Đánh giá thuốc sinh học kiểu hình Type 2. Chuẩn xác.
- **Đánh giá Track 2 (Fluticasone/salmeterol)**:
  - Bậc 1: Hít ICS liều thấp mỗi khi dùng SABA. Đúng nguyên tắc không bao giờ dùng SABA đơn độc.
  - Bậc 2: ICS liều thấp hàng ngày + SABA khi cần.
  - Bậc 3–4: ICS-LABA liều thấp / trung bình + SABA khi cần.
  - Bậc 5: ICS-LABA liều cao + LAMA + Thuốc sinh học.

### 4.2. Ma trận Tương đương liều ICS (`icsDoseEquivalenceMatrix`)
Đối chiếu chi tiết với **GINA 2026 Table 6 (trang 44)** và **Box 4-2 (trang 77–78)** cho Người lớn và Vị thành niên (≥ 12 tuổi):

| Hoạt chất trong Ma trận | Liều Thấp (mcg/ngày) | Liều Trung bình (mcg/ngày) | Liều Cao (mcg/ngày) | Nhận xét đối chiếu GINA 2026 |
|---|:---:|:---:|:---:|---|
| **Budesonide** (DPI/pMDI) | 200–400 | >400–800 | >800 | **Khớp 100%** Table 6. Rất chuẩn. |
| **Beclometasone** (hạt siêu mịn extrafine) | 100–200 | >200–400 | >400 | **Khớp 100%** Table 6. Rất chuẩn cho Foster. *(Thiếu dòng chuẩn hạt tiêu chuẩn 200-500 / 500-1000 / >1000)*. |
| **Fluticasone propionate** (DPI/pMDI) | 100–250 | >250–500 | >500 | **Khớp 100%** Table 6. Rất chuẩn cho Flixotide/Seretide. |
| **Fluticasone furoate** (DPI Ellipta) | 100 | *Không có mức TB* | 200 | **Khớp 100%** Table 6. Khai báo `no_data` ở liều trung bình là hoàn toàn chính xác. |
| **Ciclesonide** (extrafine pMDI) | 80–160 | >160–320 | >320 | **Khớp 100%** Table 6. Rất chuẩn cho Alvesco. |
| **Mometasone furoate** (pMDI) | 200–400 | 200–400 (?) | 400 (?) | **LỖI LÂM SÀNG (Finding ASTHMA-R2-06)**. Ô trung bình bị copy đè trùng ô thấp (200-400), ô cao ghi 400 thay vì >400. |

---

## 5. THẨM ĐỊNH KẾ HOẠCH HÀNH ĐỘNG HEN & KẾT QUẢ EVALUATE() ĐỘNG

### 5.1. Thử nghiệm trên 5 Ca Bệnh nhân Mẫu (`presets.ts`)

| Ca lâm sàng Preset | Đặc điểm bệnh nhân | Kết quả evaluate() thực tế | Đánh giá Dược lâm sàng R2 |
|---|---|---|---|
| **Preset 1**: `preset_asthma_new_mild` | Nam 24t, hen nhẹ mới chẩn đoán, FEV1 86% | `[START] budesonide_formoterol`: 1 nhát khi cần (AIR-only). `[MONITOR]` Action Plan. | **XUẤT SẮC**. Đúng Track 1 GINA 2026, tránh tạo thói quen lạm dụng SABA cho người bệnh mới. |
| **Preset 2**: `preset_asthma_uncontrolled_step2` | Nữ 32t, Bậc 2 không kiểm soát, đang dùng Budesonide 200 x 2 | `[UPTITRATE] budesonide_formoterol`: 1 nhát x 2 lần/ngày + 1 nhát khi cần (MART Bậc 3). `[MONITOR]` Action Plan. | **XUẤT SẮC**. Tăng bậc chuẩn lên MART liều thấp, dặn dò kỹ thuật đúng. |
| **Preset 3**: `preset_asthma_severe_step5_eosinophilic` | Nam 48t, Bậc 4 MART không kiểm soát, BCAT 480, FeNO 45, FEV1 58% | `[REFER] rec_asthma_track1_step5_lama_biologic`: Thêm LAMA, đánh giá sinh học. `[MONITOR]` Action Plan. | **LỖI MAJOR (Finding ASTHMA-R2-04)**. Bỏ rơi hoàn toàn đơn thuốc duy trì Symbicort đang dùng, khiến BN mất thuốc kiểm soát nền. |
| **Preset 4**: `preset_asthma_step_down_candidate` | Nữ 40t, Bậc 3 ổn định liên tục 6 tháng, PEF 92% | `[CONTINUE] budesonide_formoterol` Bậc 3. `[CONSIDER] rec_asthma_step_down_consider`: Giảm liều 25–50%. | **XUẤT SẮC**. Đáp ứng tiêu chí GINA ≥ 3 tháng ổn định. Cảnh báo tuyệt đối không ngưng hẳn ICS. |
| **Preset 5**: `preset_asthma_acute_severe_er` | Nữ 29t, Cơn hen cấp nặng tại Cấp cứu, SpO2 88%, RR 32, PEF 45% | `[START] salbutamol`: Salbutamol 4-10 nhát + Ipratropium 4 nhát trong giờ đầu. `[MONITOR]` Action Plan. | **LỖI MAJOR & MINOR (Finding ASTHMA-R2-05 & R2-15)**. Nhồi nhét cả 4 thuốc cấp cứu vào mã Salbutamol; đồng thời sinh Kế hoạch hành động tại nhà gây nhiễu màn hình cấp cứu. |

---

## 6. DANH MỤC THUỐC SINH HỌC & ĐỐI CHIẾU TIÊU CHÍ (BIOLOGICS AUDIT)

Bộ ba thuốc sinh học trong `gdmt-vn/kb/drugs/`:
1. **Omalizumab** (`omalizumab.json`):
   - Cơ chế: Kháng thể đơn dòng gắn chuyên biệt lên phân đoạn Fc của IgE tự do, ngăn cản IgE gắn vào thụ thể FcεRI trên dưỡng bào và bạch cầu ái kiềm.
   - Tiêu chí kiểu hình: Hen dị ứng nặng (Allergic phenotype), test lẩy da hoặc IgE đặc hiệu (+), nồng độ IgE huyết thanh toàn phần nền 30–1500 IU/mL.
   - Liều dùng: 75–600 mg SC mỗi 2 hoặc 4 tuần (tra theo bảng phối hợp giữa IgE nền và cân nặng).
   - Đánh giá: Có Gate tuổi ≥ 6. Cần bổ sung cảnh báo phản vệ (Black Box Warning) và hướng dẫn trang bị Adrenaline tự tiêm.
2. **Benralizumab** (`benralizumab.json`):
   - Cơ chế: Kháng thể đơn dòng kháng thụ thể alpha của Interleukin-5 (IL-5Rα), kích hoạt tế bào NK tiêu diệt tế bào BCAT qua cơ chế gây độc tế bào phụ thuộc kháng thể (ADCC), làm suy giảm gần như hoàn toàn lượng BCAT máu trong vòng 24 giờ.
   - Tiêu chí kiểu hình: Hen tăng bạch cầu ái toan nặng (Severe Eosinophilic Asthma), BCAT máu ngoại vi ≥ 300 tế bào/µL (hoặc ≥ 150 tế bào/µL nếu đang phụ thuộc OCS).
   - Liều dùng: **30 mg tiêm dưới da mỗi 4 tuần cho 3 liều đầu tiên, sau đó duy trì mỗi 8 tuần một lần**.
   - Đánh giá: Liều và tần suất tiêm được khai báo cực kỳ chính xác theo nhãn Fasenra.
3. **Tezepelumab** (`tezepelumab.json`):
   - Cơ chế: Kháng thể đơn dòng kháng TSLP (Thymic Stromal Lymphopoietin) - một alarmin thượng mô ở ngã ba kích hoạt dòng thác viêm dị ứng và không dị ứng.
   - Đánh giá: Liều 210 mg SC mỗi 4 tuần rất chuẩn FDA. Tuy nhiên thuốc chưa được lưu hành tại Việt Nam; cần ghi chú rõ tình trạng tiếp cận.

---

## 7. KIẾN NGHỊ HÀNH ĐỘNG DÀNH CHO MODULE OWNER (AGENT M)

1. **Khắc phục ngay 2 lỗi CRITICAL**:
   - Trong `asthma.inpatient.severe_exacerbation`: Khi phát hiện `silentChest` hoặc `drowsy`, không được return sớm mà phải xuất đồng thời gói y lệnh hồi sức cấp cứu tối khẩn cấp (Salbutamol + Ipratropium khí dung, Methylprednisolone tiêm TM, thở oxy kiểm soát, sẵn sàng đặt NKQ).
   - Trong `actionPlan.ts`: Tách riêng hướng dẫn Vùng Đỏ cho Track 1 (chỉ hít 1–2 nhát Budesonide/formoterol trực tiếp từ bình hít, không dùng buồng đệm) và Track 2 (xịt SABA 4–6 nhát qua buồng đệm).
2. **Sửa chữa 10 lỗi MAJOR**:
   - Thêm cờ `isAcuteExacerbation` vào luật cơn nhẹ-trung bình nội viện để tránh kê nhầm OCS cho BN ổn định.
   - Bổ sung khuyến cáo `[CONTINUE]` ICS-LABA khi bệnh nhân tiến triển lên Bậc 5 Hen nặng.
   - Tách khuyến cáo cấp cứu hen nặng thành các y lệnh dược độc lập (SABA+SAMA, Methylprednisolone, MgSO₄).
   - Sửa ô Medium dose của Mometasone trong `icsDoseEquivalenceMatrix` thành `'Không có mức liều trung bình riêng biệt'`.
   - Bổ sung `gate_formoterol_max_daily` vào `beclometasone_formoterol.json`.
   - Bổ sung Gate cấm SABA đơn độc vào `terbutaline.json` và mở rộng trần liều lên 8 nhát/ngày.
   - Đổi toán tử logic ở rule `asthma.safety.montelukast_mental` thành `&&` giữa tiền sử tâm thần và việc đang dùng Montelukast.
   - Phân biệt rõ liều Seretide Evohaler (2 nhát x 2 lần) và Accuhaler (1 nhát x 2 lần).
   - Làm sạch danh mục `vnBrands` (ghi chú rõ các biệt dược Mỹ chưa lưu hành tại VN).
   - Động hóa `drugId` trong cảnh báo ngưng SABA đơn độc.
3. **Bổ sung nhãn thuốc**:
   - Đề nghị bộ phận thư viện bổ sung các tệp PDF nhãn thuốc chính thức (FDA / EMA / Tờ HDSD Bộ Y tế) của các chế phẩm hô hấp vào `Medical_Library_2026/09_Nhan_Thuoc/`.

---

**Người thực hiện thẩm định:**  
*R2 – Reviewer Dược sĩ Lâm sàng (Clinical Pharmacist)*  
*GDMT-VN Review Board – Round 1*
