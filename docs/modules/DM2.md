# GDMT-VN – Đặc Tả Module Đái Tháo Đường Típ 2 (`DM2.md`)

**Mã định danh:** `dm2`  
**Tên module:** Đái tháo đường típ 2 (Type 2 Diabetes Mellitus)  
**Chuyên gia chuyên trách:** Agent F / Agent F2 / Agent F3 / Agent F4 (Chuyên gia Nội tiết – Đái tháo đường & Kỹ sư Hệ thống GDMT-VN)  
**Phiên bản kiến trúc:** Vòng 3 Toàn diện (37 tệp mã nguồn mô-đun hóa `< 20.480 bytes/tệp`, 6 tệp kiểm thử hồi quy & bất biến `< 20.480 bytes/tệp`, 126 bài kiểm thử Golden Cases, 20.500 ca bất biến ngẫu nhiên + 16 kịch bản hồi quy đối kháng Vòng 3)

---

## 1. Nguồn Tài Liệu Lâm Sàng Nền Tảng

- **Quốc tế (`INTL` – Mặc định & `US`):**
  - *ADA Standards of Care in Diabetes—2026* (Ch. 4 MASLD/Xơ gan; Ch. 6 Mục tiêu đường huyết & Hạ đường huyết; Ch. 9 Tiếp cận dược lý kiểm soát đường huyết; Ch. 10 Bệnh tim mạch & Quản lý nguy cơ; Ch. 11 Bệnh thận mạn & Quản lý nguy cơ; Ch. 12 Bệnh võng mạc, Thần kinh & Chăm sóc bàn chân; Ch. 13 Người cao tuổi; Ch. 15 Thai kỳ & Cho con bú; Ch. 16 Chăm sóc ĐTĐ nội viện & Chu phẫu).
  - *Hyperglycemic Crises in Adults With Diabetes: Consensus Report by ADA, EASD, JBDS, AACE, and DTS* (*Diabetes Care* 2024;47(8):1257–1275).
  - *KDIGO 2022 Clinical Practice Guideline for Diabetes Management in Chronic Kidney Disease* & *KDIGO 2025 Commentary on GLP-1 RAs / Incretins in CKD* (FLOW, Rec 11.11b).
  - *2023 ESC Guidelines for the management of cardiovascular disease in patients with diabetes*.
- **Bộ Y tế Việt Nam (`VN`):**
  - *Quyết định 5481/QĐ-BYT (30/12/2020)*: Hướng dẫn chẩn đoán và điều trị đái tháo đường típ 2.
  - *Quyết định 1353/QĐ-BYT (25/02/2021)*: Hướng dẫn chẩn đoán và điều trị đái tháo đường típ 2 (bổ sung quản lý đường huyết nội trú).
- **Nhãn thuốc chính thức (`LABEL` – FDA DailyMed & EMA SmPC):**
  - FDA Prescribing Information: Metformin, Semaglutide SC (Ozempic), Semaglutide uống (Rybelsus), Tirzepatide (Mounjaro), Dulaglutide (Trulicity), Liraglutide (Victoza), Sitagliptin (Januvia), Linagliptin (Tradjenta), Saxagliptin (Onglyza), Glimepiride (Amaryl), Pioglitazone (Actos), Acarbose (Precose), Canagliflozin (Invokana), Dapagliflozin (Farxiga), Empagliflozin (Jardiance), cùng danh mục Insulin (Glargine, Degludec, Detemir, NPH, Aspart, Lispro, Premix, Regular).
  - EMA SmPC: Gliclazide MR (Diamicron MR), Vildagliptin (Galvus).

---

## 2. Kiến Trúc Phân Tầng 37 Tệp Mã Nguồn (`< 20.480 bytes` / tệp)

Toàn bộ mã nguồn trong `src/modules/dm2/` gồm **37 tệp TypeScript độc lập, mỗi tệp nghiêm ngặt `< 20.480 bytes`**, tuân thủ tuyệt đối chuẩn **QA-1 (Fail-Closed)**, **QA-2 (100% Citation Integrity)** và **QA-10 (`thFor(quantity, id)`)**:

| Tệp mã nguồn | Kích thước | Chức năng chuyên trách |
|---|---:|---|
| `index.ts` | 0.8 KB | Điểm xuất `dm2Module` đăng ký vào `registry.ts` |
| `inputs.ts` | 14.7 KB | Trường nhập liệu UI (`dkaSuspected`, `childPugh`, `breastfeeding`, `activeFootUlcer`, `activeBladderCancer`, `severeGastroparesis`, `diabeticRetinopathy`, `oralContraceptive`, `plannedSurgery`, `contrastPlanned`, `bedtimeToMorningDiff`...) |
| `presets.ts` | 5.4 KB | 4 ca lâm sàng mẫu chuẩn hóa ngữ cảnh ngoại trú & cấp cứu nội viện (`setting: 'inpatient'` cho cả Preset 3 & Preset 4 DKA hạ K⁺) |
| `pathway.ts` | 6.9 KB | Sơ đồ lộ trình tham chiếu 5 bước tĩnh (`step_1: 'active'`, `step_2..5: 'upcoming'`) nội suy toàn bộ ngưỡng qua `thFor` (không gán giả trạng thái hoàn thành cá nhân hóa) |
| `matrix.ts` | 16.0 KB | Ma trận eGFR (22 thuốc ĐTĐ2 + nhóm SGLT2i) và Ma trận bệnh đồng mắc (sử dụng `drugId` đại diện hợp lệ trong KB, tách riêng hàng Tirzepatide cho HFpEF béo phì và phân biệt Saxagliptin với Linagliptin/Sitagliptin ở suy tim) |
| `helpers.ts` | 20.2 KB | Giải mã phân tầng khủng hoảng tăng ĐH (`isConfirmedCrisis` vs `isSuspectedUnconfirmed`, `isResolvingDka`, `isEuDka < 11.1 mmol/L`, `isMixedDkaHhs`, `isPureHhs`), phân tầng suy gan `Child-Pugh A` vs `B/C`, người cao tuổi suy yếu & quá trị liệu |
| `helpers.drugs.ts` | 17.1 KB | Giải mã biệt dược/FDC (`fdcMap.ts`), tính liều Fail-Closed (`doseParser.ts`), chuẩn hóa buổi dùng tiếng Việt (`sáng - tối`, `sáng tối`, tổng hợp liều bất đối xứng nhiều buổi cho thuốc uống & insulin), fallback dị ứng thuốc |
| `helpers.fdc.ts` | 7.3 KB | Phát hiện thành phần đồng hành bị chặn trên viên/bút phối hợp cố định FDC (`Synjardy`, `Xigduo`, `Janumet`, `Actoplus Met`, `Qtern`, `Soliqua`, `Xultophy`) để bóc tách giữ hoạt chất an toàn đơn chất |
| `rules.ts` | 2.6 KB | Bộ điều phối hợp nhất 26 tập luật lâm sàng đa tầng |
| `rules.crisis.ts` | 12.9 KB | Chuyển cấp cứu ngoại trú (`REFER` DKA/euDKA/HHS xác định, yêu cầu xét nghiệm STAT khi nghi ngờ chưa đủ tiêu chuẩn, chỉ gắn hậu tố vượt ngưỡng cho chỉ số bất thường thực tế) |
| `rules.crisis.hypo_icu.ts` | 14.1 KB | Hạ đường huyết cấp ngoại trú & nội viện (`REFER` cấp cứu khi ĐH < 3.0 mmol/L hoặc rối loạn tri giác, tiêm Glucose ưu trương TM hoặc Glucagon 1 mg TB/TDD / 3 mg xịt mũi, Quy tắc 15–15 đường đơn khi dùng Acarbose) và truyền Regular insulin TM tại ICU |
| `rules.dka.ts` | 18.4 KB | Cấp cứu nội viện DKA (`0.1 U/kg/h`), DKA đang thoái lui (`isResolvingDka`: hạ xuống `0.05 U/kg/h` + Dextrose 5–10% tới khi BHB `< 0.6` & hết toan), Euglycemic DKA (`< 11.1 mmol/L`), Pure HHS (`0.05 U/kg/h`), Mixed DKA–HHS (`0.1 U/kg/h`), cổng K⁺ `< 3.5` + `profileDiff` đối chiếu QĐ 5481/QĐ-BYT |
| `rules.safety.contra.ts` | 12.5 KB | Chống chỉ định tuyệt đối: Thai kỳ (`STOP` toàn bộ thuốc ngoài insulin kể cả bút phối hợp `Soliqua`/`Xultophy`, 100% trích dẫn hợp lệ), MTC/MEN 2, Viêm tụy cấp (`STOP` GLP-1 RA & DPP-4i), Hạ ĐH cấp (`HOLD`), cấm phối hợp DPP-4i + GLP-1 RA |
| `rules.safety.lactation_foot.ts` | 15.7 KB | An toàn Thời kỳ cho con bú (`STOP`/`AVOID` SU, SGLT2i, GLP-1/GIP-GLP-1 RA, TZD, Acarbose, DPP-4i; cho phép Insulin/Metformin), Loét bàn chân hoạt động (`STOP` Canagliflozin ở cả ngoại trú & nội trú bất kể HF/CKD), Ung thư bàng quang hoạt động (`STOP` Pioglitazone), Dị ứng thuốc (`STOP`) |
| `rules.safety.dup_hepatic.ts` | 15.4 KB | Chặn trùng lặp 2 SU (kể cả `Amaryl + Daonil`), ≥ 2 chế phẩm chứa Metformin (viên rời + FDC), 2 Insulin nền, 2 Insulin nhanh bữa ăn (bảo tồn `insulin_regular` trong DKA/ICU/nuôi sonde), Premix + Bolus rời, 2 DPP-4i, 2 GLP-1 RA |
| `rules.safety.hepatic_hf.ts` | 10.4 KB | Phân tầng suy gan chuẩn xác: `STOP` Acarbose & Vildagliptin ở mọi xơ gan (`Child-Pugh A/B/C`); `STOP` Pioglitazone khi `ALT > 2.5× ULN` hoặc `Child-Pugh B/C`; `STOP` Metformin & SU ở `Child-Pugh B/C` (cho phép ở `Child-Pugh A`); `STOP` Pioglitazone & Saxagliptin ở suy tim |
| `rules.safety.renal.ts` | 14.7 KB | Ngừng vĩnh viễn (`STOP`) SGLT2i sau DKA/euDKA xác định, `STOP` SGLT2i/Metformin/SU/Acarbose khi lọc máu chu kỳ (hoặc `eGFR < 30` kể cả bóc tách viên FDC), tạm ngừng SGLT2i nội trú cấp (kèm lưu ý xuất viện suy tim ADA Rec 16.11) |
| `rules.safety.renal_dpp4.ts` | 10.9 KB | Giảm liều thận (`setting: 'both'` cho cả ngoại trú và khoa thường nội viện) với Sitagliptin, Saxagliptin (kèm ức chế mạnh CYP3A4/5 ≤ 2.5 mg), Vildagliptin và Gliclazide (Fail-Closed khi không rõ hàm lượng mg) |
| `rules.safety.deintensify.ts` | 11.6 KB | Xuống thang điều trị chỉ khi có hạ đường huyết hoặc quá trị liệu thực sự dưới đích cá thể hóa (tuyệt đối không cắt giảm 20% insulin hay gọi nhầm HbA1c cao là thấp ở người cao tuổi đang tăng ĐH nặng; giữ nguyên `glibenclamide` ID gốc) |
| `rules.safety.su_co_rx.ts` | 12.3 KB | Chủ động `REDUCE`/`STOP` Sulfonylurea khi khởi trị sớm Insulin nền (`HbA1c ≥ 10%`) hoặc khi bổ sung mới trụ cột SGLT2i / GLP-1 RA ở bệnh nhân có HbA1c chưa quá cao (như Preset 2) |
| `rules.inpatient.oral_glp1_hold.ts` | 10.8 KB | Tạm ngừng thuốc uống hạ ĐH & GLP-1/GIP-GLP-1 RA trong bệnh cảnh nội viện cấp tính / NPO |
| `rules.periop.ts` | 11.0 KB | Chu phẫu ngoại trú & nội viện: Ngưng SGLT2i trước mổ **3 ngày** (riêng **Ertugliflozin 4 ngày**), ngưng thuốc viên sáng mổ, `HOLD` insulin nhanh sáng NPO, giảm 20–25% insulin nền analog / 50% NPH, cảnh báo nguy cơ tồn lưu dạ dày & hít sặc phổi gây mê khi đang dùng GLP-1/GIP-GLP-1 RA |
| `rules.steroid.ts` | 6.7 KB | Phối hợp Insulin NPH buổi sáng (hoặc tăng liều nền) khi tăng đường huyết nội viện/ngoại trú do Glucocorticoid |
| `rules.inpatient.home_insulin.ts` | 14.1 KB | Chuyển đổi an toàn insulin tại nhà khi nhập viện: `STOP` rõ ràng `insulin_premix` và `insulin_nph` ngoại trú trước khi chuyển sang Glargine; `HOLD` Aspart/Lispro khi nuôi sonde/ICU; cảnh báo dịch chuyển hạ K⁺ cộng gộp khi dùng `Insulin + Corticoid + SABA` |
| `rules.inpatient.ts` | 16.6 KB | Đích glucose nội viện, quy đổi thận trọng 75–80% tổng liều insulin tại nhà sang Basal-Bolus / Basal-Plus, giảm 20–25% liều Glargine nhà khi NPO / chờ mổ / ăn kém ĐH thấp |
| `rules.inpatient.prandial.ts` | 12.8 KB | Tách riêng y lệnh insulin bữa ăn nội viện, áp dụng **Basal–Plus** (`MONITOR`, không tiêm bolus cố định trước ăn) khi ăn kém kèm glucose `< 7.8 mmol/L`, và Regular insulin q6h + cảnh báo Dextrose khi nuôi ăn qua sonde |
| `rules.cardiorenal.sglt2.ts` & `sglt2_gates.ts` | 23.9 KB | Trụ cột SGLT2i bảo vệ tim – thận độc lập HbA1c, bóc tách FDC sang đơn chất khi thành phần kèm bị chống chỉ định, fallback tuần tự không dị ứng (`dapagliflozin` -> `empagliflozin` -> `canagliflozin`), cổng suy gan/cho con bú/loét bàn chân |
| `rules.cardiorenal.glp1.ts` & `glp1_gates.ts` | 24.1 KB | Trụ cột GLP-1 / GIP-GLP-1 RA: `DEFER` trước phẫu thuật chương trình, `AVOID`/`STOP` khi liệt dạ dày nặng (`severeGastroparesis`), cảnh báo theo dõi bệnh võng mạc ĐTĐ (SUSTAIN-6) và cảnh báo tránh thai màng chắn 4 tuần với Tirzepatide + thuốc tránh thai uống, `DEFER` ở người cao tuổi suy kiệt `very_complex` |
| `rules.hba1c_target.ts` | 6.7 KB | Cá thể hóa mục tiêu HbA1c theo tuổi, kỳ vọng sống và phân tầng sức khỏe người cao tuổi (`healthy` / `complex` / `very_complex`) |
| `rules.glycemic.ts` | 20.0 KB | Metformin nền tảng: cổng cản quang iod 48h, bóc tách FDC sang Metformin đơn chất (hoặc `DEFER` trước mổ), giữ `CONTINUE` liều thấp ≤ 1000 mg/ngày ở CKD G3b (đồng bộ với `vitalAndRenalGates.ts`), hạ xuống `CONSIDER` ở ĐTĐ mới chưa dùng thuốc có HbA1c `< 6.5%` |
| `rules.stepup.ts` | 14.8 KB | Tăng bậc kiểm soát đường huyết cá thể hóa, tự động chuyển đổi người cao tuổi suy yếu đang tăng ĐH sau khi ngừng SU sang **Linagliptin 5 mg** an toàn thận/không gây hạ ĐH, cảnh báo gãy xương khi cân nhắc TZD |
| `rules.insulin.init.ts` | 18.7 KB | Khởi trị sớm Insulin nền khi dị hóa cấp hoặc HbA1c ≥ 10% / Glucose ≥ 16.7 mmol/L (chỉ gắn nhãn dị hóa cấp khi `catabolicSymptoms === true`, làm rõ ưu tiên/phối hợp GLP-1 RA theo ADA Rec 9.18–9.19) |
| `rules.insulin.titrate.ts` | 17.7 KB | Chuẩn độ Insulin nền theo đích FPG ngoại trú `≤ 7.2 mmol/L` (giữ `CONTINUE` không tăng liều nền khi FPG đã đạt đích mà HbA1c cao hoặc khi vừa khởi mới SGLT2i/GLP-1 RA ở HbA1c `< 8.0%`; loại trừ lọ nền trùng lặp đã `STOP` khỏi phép tính Overbasalization) |
| `rules.cvrisk.ts` & `rules.cvrisk.statin_aspirin.ts` | 21.4 KB | Đích huyết áp, phân tầng Statin dự phòng tiên phát tuổi `> 75` (`CONTINUE` nếu đang dùng, `DEFER` nếu `very_complex`, `CONSIDER` mức trung bình Rec 10.23 nếu khỏe mạnh), kiểm tra kháng đông OAC **trước** kháng tiểu cầu (`STOP`/`CONSIDER` ngừng Aspirin trên nền OAC ổn định), nhãn phân biệt rõ khởi mới vs duy trì |

---

## 3. Kết Quả Kiểm Thử & Thẩm Định Sau Khắc Phục Vòng 3

| Hạng mục kiểm thử | Công cụ / Lệnh | Kết quả đạt được |
|---|---|---|
| **Giới hạn kích thước tệp (`< 20.480 B`)** | `Get-ChildItem src/modules/dm2/*.ts, tests/modules/dm2/*.ts` | **37/37 tệp mã nguồn & 6/6 tệp kiểm thử `< 20.480 bytes`** (`0` tệp vượt ngưỡng; lớn nhất `20.173 bytes`) |
| **Kiểm tra kiểu TypeScript** | `npx tsc --noEmit` | **0 lỗi TypeScript strict trên toàn dự án** |
| **Thẩm định KB & Rules Lint (QA-1 / QA-2 / QA-10)** | `npm run verify:kb` | **100% PASS (`0` lỗi; `0` cảnh báo trên toàn bộ 37 tệp `dm2`)** |
| **Kiểm thử Hồi quy Đối kháng Vòng 3** | `npx vitest run tests/modules/dm2/round3*.test.ts` | **16/16 bộ kịch bản hồi quy Vòng 3 PASS 100%** (bao phủ toàn bộ 48 phát hiện R1, R2, R3) |
| **Bất biến An toàn & QA-1 Fail-Closed** | `npx vitest run tests/modules/dm2/invariants*.test.ts` | **20.500 ca ngẫu nhiên PASS 100%** (bao gồm bất biến Vòng 3 cấm `dose !== undefined` trên mọi thẻ `STOP`/`AVOID`/`HOLD`/`DEFER`) |
| **Ca chuẩn Hồi quy (Golden Cases)** | `npx vitest run tests/golden/_runner.test.ts -t "dm2_"` | **126/126 bài kiểm thử Golden ĐTĐ2 PASS 100%** |
