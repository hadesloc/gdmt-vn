# GDMT-VN – Đặc Tả Module Rối Loạn Lipid Máu (`LIPID.md` — Cập nhật Vòng 3)

**Mã định danh module:** `lipid`  
**Tên module:** Rối loạn lipid máu & Dự phòng Tim mạch Xơ vữa (Dyslipidemia & Cardiovascular Prevention)  
**Kỹ sư chuyên trách:** Agent I / Agent I2 / Agent I3 / Agent I5 (Round 3 Remediation)  
**Nguồn tài liệu nền tảng:**
- **INTL (Chính yếu):**
  - *2019 ESC/EAS Guidelines for the management of dyslipidaemias: lipid modification to reduce cardiovascular risk* (`Eur Heart J` 2020;41:111–188, DOI: `10.1093/eurheartj/ehz455`) – Nền tảng 4–5 tầng nguy cơ, đích kép LDL-C, mục tiêu thứ phát Non-HDL-C/ApoB, xử trí ALT/CK, lọc máu (4D/AURORA/SHARP), ghép thận (ALERT), suy tim (CORONA/GISSI-HF) và viêm tụy cấp do tăng TG.
  - *2025 ESC/EAS Focused Update on Dyslipidaemias* (`Eur Heart J` 2025;46:4359–4378, DOI: `10.1093/eurheartj/ehae884`) – Phân tầng SCORE2 / SCORE2-OP, HIV ≥ 40 tuổi (REPRIEVE – Pitavastatin Class I-B), Bempedoic acid (CLEAR Outcomes Class I-B), tăng cường sớm nội viện ACS (Class I-C / IIa-B), Icosapent ethyl liều cao và Lp(a) `> 50 mg/dL` (`> 105 nmol/L`).
  - *2024 ESC Guidelines for the management of chronic coronary syndromes* & *KDIGO 2024 Clinical Practice Guideline for CKD* – Statin cường độ cao tới liều tối đa dung nạp, an toàn thai kỳ/cho con bú và cá thể hóa theo eGFR/ghép thận.
- **Hoa Kỳ (`US` Profile):**
  - *2026 ACC/AHA/AACVPR/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Dyslipidemia* (`J Am Coll Cardiol` 2026;87:2624–2757, DOI: `10.1016/j.jacc.2025.11.016`) – Khung nguy cơ 10 năm **PREVENT-ASCVD** (`< 3%`, `3–<5%`, `5–<10%`, `≥ 10%`), phân tách **Very-High-Risk ASCVD** (`< 55 mg/dL`) và **Not-Very-High-Risk ASCVD** (`< 70 mg/dL` COR 1 + tùy chọn `< 55 mg/dL` COR 2a), ngưỡng **CAC** (`100–299`, `≥ 300`, `≥ 1000` Agatston), ngưỡng **Lp(a) `≥ 125 nmol/L`** (`≥ 50 mg/dL`), tiêu chuẩn Icosapent ethyl Hoa Kỳ (`tuổi ≥ 50`, `TG ≥ 150 mg/dL`, `LDL-C < 100 mg/dL`) và suy tim thiếu máu cục bộ HFrEF (COR 2b).
- **Việt Nam (`VN` Profile):**
  - *Hướng dẫn chẩn đoán và điều trị Rối loạn lipid máu Bộ Y tế Việt Nam* (QĐ `5481/QĐ-BYT` 2020), *Hướng dẫn Bệnh thận mạn Bộ Y tế* (`2024`) và Danh mục thuốc lưu hành Cục Quản lý Dược (DAV) – tích hợp thực trạng sẵn có thuốc tại tuyến cơ sở/tuyến tỉnh và nhánh chuyển sớm PCSK9i khi không dung nạp Statin do Bempedoic acid chưa lưu hành phổ biến.
- **Nhãn thuốc chính thức (FDA DailyMed):**
  - Lipitor (`atorvastatin`), Crestor (`rosuvastatin` – dược động học châu Á gấp ~2 lần, trần `10 mg` khi `eGFR < 30` hoặc lọc máu, trần `5 mg` với Cyclosporine/Darolutamide, trần `10 mg` với Paxlovid/Atazanavir-r/Regorafenib, trần `20 mg` với Ticagrelor/Febuxostat), Zocor (`simvastatin`), Mevacor (`lovastatin`), Lescol (`fluvastatin`), Pravachol (`pravastatin`), Livalo (`pitavastatin`), Zetia/Ezetrol (`ezetimibe`), Repatha (`evolocumab`), Praluent (`alirocumab`), Leqvio (`inclisiran`), Nexletol (`bempedoic_acid`), Tricor/Lipanthyl (`fenofibrate`), Vascepa (`icosapent_ethyl`), Lovaza/Omacor (`omega3`), Welchol/Questran (`colesevelam`/`cholestyramine`).

---

## 1. Kiến Trúc Tổng Thể 40 Tệp Mô-đun Hóa (`< 20 KB` / tệp)

Trong Vòng 3, toàn bộ mã nguồn [`src/modules/lipid/`](../../src/modules/lipid/index.ts) được chuẩn hóa thành **40 tệp TypeScript nguyên tử** (mỗi tệp `< 20.480` byte), tích hợp chặt chẽ với [`ldlTarget.ts`](../../src/engine/calculators/ldlTarget.ts), [`score2.ts`](../../src/engine/calculators/score2.ts) và [`prevent.ts`](../../src/engine/calculators/prevent.ts):

- **Nhân phân giải thuốc, FDC & An toàn (`helpers*.ts` – 5 tệp):**
  - [`helpers.meds.ts`](../../src/modules/lipid/helpers.meds.ts): Tự động phân rã viên phối hợp liều cố định (**FDC**: `rosuvastatin_ezetimibe`, `atorvastatin_ezetimibe`, `simvastatin_ezetimibe`, `amlodipine_atorvastatin`, `bempedoic_acid_ezetimibe`, `fenofibrate_statin`), bóc tách đúng hàm lượng từng thành phần theo thứ tự biệt dược (ví dụ Inegy/Vytorin `10/40 mg` → Simvastatin `40 mg` + Ezetimibe `10 mg`), nhân tần suất dùng trong ngày (`BID`, `2 lần/ngày`, `q12h`), nhận diện hàm lượng biệt dược Fenofibrate (`Lipanthyl 200M`, `145`, `160`, `67 mg`), gợi ý **tách viên FDC giữ lại thành phần an toàn** khi ngừng FDC, và đối chiếu dị ứng hoạt chất/nhóm.
  - [`helpers.safety.ts`](../../src/modules/lipid/helpers.safety.ts), [`helpers.statin.ts`](../../src/modules/lipid/helpers.statin.ts), [`helpers.targets.ts`](../../src/modules/lipid/helpers.targets.ts), [`helpers.ts`](../../src/modules/lipid/helpers.ts): Tổng hợp cổng thai kỳ / cho con bú / dự định mang thai / WOCBP, xơ gan còn bù `Child-Pugh A` so với mất bù `Child-Pugh B/C`, bệnh túi mật/sỏi mật, suy giáp chưa kiểm soát (`TSH ≥ 10 mIU/L`), nhược cơ, lọc máu/ghép thận, suy tim không ASCVD, điểm vôi hóa mạch vành `CAC`, `PREVENT 10 năm`, và mục tiêu thứ phát `Non-HDL-C` / `ApoB`.
- **Cổng An toàn Đa Tầng (`rules.safety.*.ts` – 6 tệp):**
  - [`rules.safety.pregnancy.ts`](../../src/modules/lipid/rules.safety.pregnancy.ts): Ngừng đa thuốc/FDC trong thai kỳ, cho con bú (kèm washout `5 ngày` sau liều Fenofibrate cuối) và dự định mang thai (`1–2 tháng` trước thụ thai); `REFER` chuyên khoa lọc LDL-apheresis cho HoFH/ASCVD nặng hoặc viêm tụy cấp thai kỳ.
  - [`rules.safety.organ.ts`](../../src/modules/lipid/rules.safety.organ.ts): Tổn thương gan (`ALT ≥ 3x ULN` / xơ gan mất bù `Child-Pugh B/C`), bệnh túi mật/sỏi mật (`STOP`/`AVOID` Fibrate), đứt gân & gút cấp/tăng acid uric toàn cục trên mọi nhánh của Bempedoic acid.
  - [`rules.safety.muscle.ts`](../../src/modules/lipid/rules.safety.muscle.ts): Tiêu cơ vân `CK ≥ 10x ULN` (`STOP` + `REFER` bù dịch) và `4x < CK < 10x ULN` (`HOLD`/`DEFER`).
  - [`rules.safety.renal.ts`](../../src/modules/lipid/rules.safety.renal.ts) & [`rules.safety.renal.nonstatin.ts`](../../src/modules/lipid/rules.safety.renal.nonstatin.ts): Trần thận Rosuvastatin (`≤ 10 mg` khi `eGFR < 30` hoặc `onDialysis`), Pitavastatin (`≤ 2 mg` khi `eGFR < 60`), Pravastatin (`≤ 40 mg` khi `eGFR < 30`), Simvastatin CKD nặng, Fenofibrate (`STOP` khi `eGFR < 30`/lọc máu; giảm `48–67 mg` khi `eGFR 30–59`), và `STOP`/`AVOID` Bempedoic acid ở bệnh nhân lọc máu chu kỳ.
  - [`rules.safety.reconcile.ts`](../../src/modules/lipid/rules.safety.reconcile.ts): Cảnh báo `STOP` thuốc đang dị ứng, `STOP` statin còn sót khi đã xác nhận không dung nạp hoàn toàn, khử trùng lặp nhiều Statin (giữ lại 1 statin tối ưu thay vì xóa trắng cả hai), trùng lặp PCSK9 (`evolocumab + inclisiran`) / Fibrate, và an toàn nhựa gắn acid mật (**BAS**: `STOP` khi `TG ≥ 5.6 mmol/L`, giãn cách uống `-1h / +4h` với Levothyroxine/Warfarin/Digoxin/Ezetimibe/Lợi tiểu).
- **Ma trận Tương tác Thuốc (`rules.ddi.*.ts` – 4 tệp):**
  - [`rules.ddi.oatp.ts`](../../src/modules/lipid/rules.ddi.oatp.ts), [`rules.ddi.cyp.ts`](../../src/modules/lipid/rules.ddi.cyp.ts), [`rules.ddi.cv.ts`](../../src/modules/lipid/rules.ddi.cv.ts), [`rules.ddi.other.ts`](../../src/modules/lipid/rules.ddi.other.ts): Bao phủ Gemfibrozil, Cyclosporine, ức chế CYP3A4 mạnh (Clarithromycin, Itraconazole, Ketoconazole, Posaconazole, Voriconazole, Ritonavir, Cobicistat, **Paxlovid `nirmatrelvir_ritonavir`**), Erythromycin (`Atorvastatin ≤ 20 mg`), Ticagrelor/Febuxostat (`Rosuvastatin ≤ 20 mg`, `Simvastatin ≤ 40 mg`), **Darolutamide** (`Rosuvastatin ≤ 5 mg`), **Regorafenib** & **Atazanavir/ritonavir** (`Rosuvastatin ≤ 10 mg`), **Sofosbuvir/velpatasvir/voxilaprevir** (`HOLD Rosuvastatin`), Lovastatin, Fluvastatin, Diltiazem/Verapamil/Amiodarone/Amlodipine/Dronedarone/Ranolazine, Colchicine và Warfarin/Acenocoumarol.
- **Khởi trị, Leo thang 4 Bước & Nhóm Đặc biệt (`rules.statin.*.ts`, `rules.escalation.ts`, `rules.step3.ts`, `rules.step4.ts`, `rules.intolerance.ts`, `rules.maintain.ts` – 10 tệp):**
  - Nhận diện đầy đủ **9 biến cố mạch máu xơ vữa** (`pci`, `cabg`, `ccs`, `acs`, `stemi`, `nstemi`, `carotid`, `claudication`, `aorticAneurysm`), ĐTĐ kèm `UACR ≥ 30 mg/mmol` (`≥ 300 mg/g`), ĐTĐ típ 1 `≥ 35 tuổi`, suy tim đơn độc không ASCVD (`AVOID` khởi trị statin mới Class III-A; nhánh `US` HFrEF thiếu máu cục bộ COR 2b), suy giáp chưa điều trị (`TSH ≥ 10 mIU/L` → `DEFER` ngoại trú), ghép thận (`CONSIDER` statin liều thấp–trung bình), HIV + ASCVD + Ritonavir (không kê trùng 2 statin), và override công thức Friedewald khi `TG > 4.5 mmol/L`.
- **Triglyceride, Viêm Tụy Cấp, Theo Dõi & Nội Viện (`rules.tg.ts`, `rules.htg.crisis.ts`, `rules.monitoring.ts`, `rules.inpatient.*.ts` – 7 tệp):**
  - Cấp cứu viêm tụy cấp do tăng TG: ngoại trú chuyển cấp cứu ngay (`REFER`); nội viện kích hoạt phác đồ Hồi sức **NPO + dịch truyền + Insulin tĩnh mạch ± Lọc huyết tương (Plasmapheresis)** bất kể đang có thuốc uống ở nhà hay không.
  - ACS nội viện có DDI nặng: tự động giải cứu chuyển sang Statin cường độ cao không vướng tương tác (`Simvastatin + Gemfibrozil` → `STOP Gemfibrozil` + `SWITCH Atorvastatin 40–80 mg`; `STEMI + Clarithromycin` → `START`/`SWITCH Rosuvastatin 20–40 mg`).
  - Nội viện không-ACS (đột quỵ thiếu máu não / TIA / PAD): tối ưu hóa từ statin thấp–trung bình lên cường độ cao và phối hợp Ezetimibe/PCSK9i trước xuất viện.

---

## 2. Cơ Sở Tri Thức & Kết Quả Kiểm Định Vòng 3

- **Tất cả tệp `.ts` `< 20.480` byte:** 40 tệp trong [`src/modules/lipid/`](../../src/modules/lipid/) (lớn nhất `20.299` B) và 6 tệp trong [`tests/modules/lipid/`](../../tests/modules/lipid/) (5 tệp `.test.ts` + `_fixtures.ts`, lớn nhất `17.490` B) đều nhỏ hơn giới hạn `20 KB`.
- **Kiểm tra kiểu tĩnh (`npx tsc --noEmit`):** **0 lỗi**.
- **Kiểm định Cơ sở tri thức (`npm run verify:kb`):**
  - **146 trích dẫn nguyên văn** trong [`kb/citations/lipid.json`](../../kb/citations/lipid.json) đối chiếu trực tiếp PDF gốc ESC 2019/2025, ACC/AHA 2026, KDIGO 2024, Bộ Y tế VN 2020/2024 và FDA DailyMed.
  - **128 ngưỡng lâm sàng** trong [`kb/thresholds/lipid.json`](../../kb/thresholds/lipid.json) đạt chuẩn QA-10, `err: 0 | litWarn: 0` trên toàn bộ 40 tệp mã nguồn.
- **Kiểm thử tự động (`vitest`):**
  - **56/56 ca chuẩn Golden Cases** trong [`tests/golden/lipid/`](../../tests/golden/lipid/) PASS 100%.
  - **≥ 15.000 ca bất biến ngẫu nhiên + 5 bộ kiểm thử hồi quy tất định Vòng 2 & Vòng 3** trong [`tests/modules/lipid/`](../../tests/modules/lipid/) PASS 100%.
