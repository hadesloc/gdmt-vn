# GDMT-VN – Đặc Tả Kỹ Thuật & Lâm Sàng Module Rung Nhĩ (`af`)

**Chuyên khoa:** Nhịp học & Tim mạch  
**Phụ trách kỹ thuật:** Agent J4 – Module Rung nhĩ (`af`) (Hiệu chỉnh Vòng 2 & Tái cấu trúc `< 20 KB`)  
**Tiêu chuẩn hướng dẫn & dược thư:**
- **INTL / VN:** ESC 2024 Guidelines for the management of atrial fibrillation (khung **AF-CARE**, thang điểm **CHA₂DS₂-VA**), ESC 2025 Guidelines for cardiovascular disease during pregnancy, ESC 2026 Heart Failure (Amyloidosis tim), và Khuyến cáo VNHA/VNHRS / Bộ Y tế Việt Nam.
- **US:** 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation (thang điểm **CHA₂DS₂-VASc**).
- **Nhãn thuốc gốc:** FDA Prescribing Information & EMA SmPC cho **13** hoạt chất sở hữu trực tiếp bởi module `af`.

---

## 1. Kiến Trúc Mô-đun Hóa `< 20 KB` & Tích Hợp Nhân Dùng Chung

### 1.1 Cấu trúc 21 tệp mã nguồn (`src/modules/af/` — 100% `< 20.480` bytes)
- `index.ts` (620 B): Khai báo `ModuleDefinition` của module `af`.
- `inputs.ts` (9.929 B) & `presets.ts` (5.557 B): Biểu mẫu nhập liệu lâm sàng chuyên sâu (`afType`, `ehraScore`, `afOnset`, `alreadyAnticoagulated3WeeksOrTee`, `hemodynamicStability`, `plannedProcedureRisk`, `vkaTtr`, `childPugh`, `wpw`, `antiphospholipidSyndrome`, `activeBleeding`, `breastfeeding`, `hyperthyroidism`, `qtc`) và **5** ca mẫu lâm sàng (`af_preset_inpatient_rvr_emergency` khai báo tường minh `setting: 'inpatient'`).
- `matrices.ts` (13.715 B) & `pathways.ts` (2.209 B): Bảng ma trận tra cứu nhanh DOAC theo 5 dải CrCl (tách chuẩn biên `> 50 đến 95` và `> 95 mL/phút`) & ma trận kiểm soát tần số theo LVEF; sơ đồ lộ trình AF-CARE.
- `rules.ts` (7.238 B): Điểm ghép nối trung tâm 4 trụ cột AF-CARE (`[C]`, `[A]`, `[R]`, `[E]`).
- `rulesHelpers.ts` (12.538 B) & `rulesDoacLogic.ts` (13.989 B): Tiện ích nhận diện trạng thái lâm sàng (`hasWpw`, `hasAps`, `hasHcm`, `hasCardiacAmyloidosis`, `hasActiveMajorBleed`, `hasTrueCad`, `getChildPugh`, `isAcuteDecompensatedHf`), định dạng liều tĩnh mạch cấp cứu (`getAcuteIvDose`), bộ phân giải liều DOAC hợp nhất (`resolveAfDoacDose` bọc trực tiếp `computeDoacDose` từ `src/engine/calculators/doacDose.ts`) và bộ đối chiếu liều đang dùng (`resolveDoacCurrentAction` nối trực tiếp `parseSingleDoseMg` / `parseDailyDoseMg` / `parseFrequencyPerDay` từ `src/engine/doseParser.ts`).
- **Trụ cột `[A]` Dự phòng đột quỵ (5 tệp):**
  - `rulesOacContra.ts` (17.214 B): Xuất huyết nặng / ICH cấp / tiểu cầu `< 50 G/L` (kèm hóa giải đặc hiệu Idarucizumab, Andexanet alfa / 4F-PCC, Vitamin K + 4F-PCC), van cơ học / hẹp hai lá hậu thấp / APS (dừng riêng từng DOAC, tương đương Warfarin & Acenocoumarol), thai kỳ (tách riêng nhánh Van cơ học + Thai kỳ hội chẩn khẩn *Pregnancy Heart Team*), cho con bú (dừng DOAC, chuyển sang Warfarin an toàn sữa mẹ), và HCM / Amyloidosis tim Class I bất kể điểm CHA₂DS₂-VA.
  - `rulesOacRenalHepaticDdi.ts` (17.304 B): Lọc máu chu kỳ (kiểm tra trước CrCl), `CrCl < 15 mL/phút`, Dabigatran `CrCl < 30`, Edoxaban `CrCl > 95` (US STOP vs INTL/VN cảnh báo hộp đen), phân tầng xơ gan Child-Pugh A / B / C, tương tác cảm ứng & ức chế mạnh CYP3A4 / P-gp, và chuyển đổi sang thuốc thay thế an toàn.
  - `rulesOacTransitions.ts` (12.684 B): Quản lý VKA đang dùng ở rung nhĩ không van tim (`TTR < 70%` chuyển sang DOAC, `TTR ≥ 70%` duy trì INR `2.0–3.0`) và hướng dẫn chuyển tiếp không chồng liều từ Enoxaparin / Heparin / Fondaparinux sang DOAC.
  - `rulesOacRisk.ts` (13.989 B): Phân tầng nguy cơ đột quỵ CHA₂DS₂-VA (`INTL`/`VN`) vs CHA₂DS₂-VASc (`US`), Class 2b Apixaban lọc máu tại Hoa Kỳ, không mâu thuẫn `AVOID`/`CONTINUE` ở nguy cơ thấp, và cảnh báo CrCl vs CrCl_ABW ở béo phì nặng.
  - `rulesOacDosingAndAp.ts` (13.385 B): Hiệu chỉnh liều DOAC đang dùng, cảnh báo đơn vị mơ hồ (`viên`) / sai tần suất (`QD` cho thuốc `BID`), ngừng toàn bộ kháng tiểu cầu thừa (`aspirin`, `clopidogrel`, `ticagrelor`, `prasugrel`) khi không có ACS/PCI gần đây, và phác đồ kép `DOAC + Clopidogrel` (ngừng sớm Aspirin, hạ bậc Ticagrelor/Prasugrel) sau ACS/PCI.
- **Trụ cột `[R]` Tần số, Nhịp, Nội viện & Chu phẫu (8 tệp):**
  - `rulesRateSafety.ts` (19.702 B): Cổng chặn tối thượng hội chứng **WPW / Rung nhĩ tiền kích thích** (`STOP` toàn bộ thuốc ức chế nút AV, chỉ định sốc điện hoặc Ibutilide/Procainamide IV + `REFER` triệt đốt đường phụ), `STOP` Non-DHP CCB ở HFrEF, `STOP` Digoxin & Non-DHP CCB ở **Cardiac Amyloidosis**, `STOP` chẹn beta không chọn lọc ở hen/COPD cấp, `HOLD` Digoxin khi `K+ < 3.5 mmol/L`, `HOLD` khi nhịp chậm `< 50 bpm` hoặc tụt huyết áp, và xử trí suy nút xoang / block nhĩ thất độ II–III chưa có máy tạo nhịp.
  - `rulesRateControl.ts` (12.901 B) & `rulesRateHfref.ts` (8.698 B): Kiểm soát tần số theo `LVEF > 40%` vs `LVEF ≤ 40%`, tự động chuyển từ đích lỏng (`< 110 bpm`) sang đích chặt (`< 80 bpm`) khi `EHRA ≥ 3`, giữ nguyên liều thực tế khi `CONTINUE`, chuẩn độ bậc liều đích khi `UPTITRATE`, và `DEFER` chẹn beta đường uống trong suy tim mất bù cấp (`acuteDecompensatedHf` / sung huyết phổi cấp).
  - `rulesRhythmSafety.ts` (15.735 B): `STOP` từng thuốc nhóm IC (`flecainide`, `propafenone`) khi có **CAD thật sự** (tách biệt khỏi PAD / Đột quỵ đơn thuần), HFrEF, HCM, `CrCl < 35 mL/phút`, suy gan/hen (Propafenone) hoặc rung nhĩ vĩnh viễn; `STOP` Dronedarone ở rung nhĩ vĩnh viễn (PALLAS), suy tim, suy gan hoặc tương tác CYP3A4 mạnh; `STOP` nhóm III khi `QTc > 500 ms`; `STOP` Amiodarone khi cường giáp / mang thai / cho con bú; chỉnh Sotalol QD vs BID ở `CrCl 40–60 mL/phút`.
  - `rulesRhythmStrategy.ts` (16.963 B) & `rulesRhythmAblation.ts` (8.131 B): Chiến lược AAD tách biệt **HCM** (ưu tiên Amiodarone / triệt đốt, không gợi ý Dronedarone) với **CAD** (Dronedarone / Amiodarone) và không bệnh tim cấu trúc (Flecainide / Propafenone kèm bắt buộc thuốc chẹn nút AV; fail-closed đòi SCr ở thai kỳ), kiểm soát bình giáp trước chuyển nhịp ở cường giáp, kiểm soát nhịp sớm **EAST-AFNET 4**, và triệt đốt qua ống thông (Paroxysmal có triệu chứng, Persistent kháng AAD Class I-A, HFrEF CASTLE-AF Class I-B).
  - `rulesInpatientAcute.ts` (15.694 B): Sốc điện chuyển nhịp đồng bộ khẩn cấp khi rối loạn huyết động và kiểm soát đáp ứng thất nhanh cấp (**RVR**) bằng **liều tiêm / truyền tĩnh mạch chuẩn ESC 2024 Table 12** (`Diltiazem IV 0.25 mg/kg + 5–15 mg/giờ`, `Esmolol IV`, `Amiodarone IV 300 mg pha D5W + 900–1200 mg/24h`, `Digoxin IV 0.5 mg`).
  - `rulesPeriprocedural.ts` (15.983 B): Chống đông quanh chuyển nhịp ở cả nội viện và ngoại trú (`setting: 'both'`, loại trừ `permanent AF`, tôn trọng `alreadyAnticoagulated3WeeksOrTee`, bắt buộc TEE ở Cardiac Amyloidosis, tùy chọn 4 tuần OAC khi `< 24h` & `CHA₂DS₂-VA = 0`), ngưng chu phẫu Warfarin (`5 ngày`) vs Acenocoumarol (`3 ngày`, chỉ bắc cầu khi nguy cơ huyết khối rất cao theo BRIDGE), và ngưng chu phẫu DOAC (kéo dài `3 ngày [72h]` cho ức chế Xa khi `CrCl < 30 mL/phút` ở phẫu thuật nguy cơ chảy máu cao).

### 1.2 Các bất biến an toàn bắt buộc
- **Bất biến toàn cục Round 2 (`dose === undefined`):** 100% khuyến cáo mang hành động `STOP`, `AVOID`, `HOLD`, hoặc `DEFER` đều có `dose: undefined`, không bao giờ rò rỉ chuỗi liều dùng lên thẻ dừng/tránh/tạm hoãn thuốc.
- **Fail-Closed 100% (QA-1 & QA-9):** Tuyệt đối không dùng `?? <hằng số>` cho dữ liệu sinh học thiếu; luôn trả về `missingInputRec(...)` khi thiếu `age`, `sex`, `scr`, `weight` (trừ nhánh `onDialysis` đã rẽ nhánh riêng trước CrCl), `lvef`, `hr` hoặc `sbp`.
- **Type-Safe Thresholds 100% (QA-10):** Toàn bộ **48** ngưỡng trong `kb/thresholds/af.json` được truy xuất qua `thFor(quantity, id)` với **0 lỗi / 0 cảnh báo** trên `npm run verify:kb`.

---

## 2. Tài Sản Knowledge Base & Kiểm Thử Tự Động (Sau Vòng 2)

- **13 Thuốc sở hữu (`kb/drugs/*.json` + `kb/review/<id>.json`):** `apixaban`, `rivaroxaban`, `dabigatran`, `edoxaban`, `warfarin`, `acenocoumarol`, `amiodarone`, `dronedarone`, `flecainide`, `propafenone`, `sotalol`, `diltiazem`, `verapamil`.
- **48 Ngưỡng lâm sàng (`kb/thresholds/af.json` + `kb/review/af.*.json`):** Bao phủ đầy đủ CHA₂DS₂-VA / CHA₂DS₂-VASc, liều chuẩn/giảm DOAC (kể cả Dabigatran US `75 mg`), ngưỡng thận/QTc/K+/huyết động, mốc chuyển nhịp `24 giờ` / `48 giờ` và ngày ngưng chu phẫu (`acenocoumarol` 3 ngày, ức chế Xa suy thận 3 ngày).
- **124 Trích dẫn nguyên văn (`kb/citations/af.json`):** 100% đối chiếu khớp nguyên văn tệp PDF gốc ESC 2024 AF, ACC/AHA 2023 AF, ESC 2025 Pregnancy, ESC 2026 HF và nhãn thuốc FDA/EMA; gỡ bỏ hoàn toàn `cor`/`loe` trên các mục bảng biểu và văn xuôi.
- **Hệ thống kiểm thử tự động (3 tệp `< 17 KB` + 52 Golden Cases):**
  - `tests/modules/af/invariants.test.ts`: Kiểm chứng toàn bộ **5 Presets**, **52 Golden Cases** (`tests/golden/af/af_01...af_52`), **1.000** ca ngẫu nhiên tất định đa bối cảnh (`INTL`/`VN`/`US` × `outpatient`/`inpatient` đồng bộ chuẩn `crclActual`) và **500** ca Fail-Closed khi khuyết dữ liệu.
  - `tests/modules/af/round2OacAndDdi.test.ts`: Kiểm thử hồi quy chuyên sâu OAC, xuất huyết/hóa giải, thai kỳ van cơ học vs cho con bú, lọc máu chu kỳ, Child-Pugh A/B/C, hồ sơ US vs INTL/VN (kể cả quy đổi `SCr = 1.5 mg/dL`), DDI CYP3A4/P-gp, dị ứng, chuyển tiếp Enoxaparin, đơn vị `viên` và ACS/PCI kép.
  - `tests/modules/af/round2RateRhythmInpatient.test.ts`: Kiểm thử hồi quy WPW, Cardiac Amyloidosis, đích tần số lỏng/chặt, suy tim cấp mất bù, hạ K+, tách CAD khỏi PAD/Stroke, tách HCM khỏi CAD, Sotalol QD/BID, triệt đốt PVI, EAST-AFNET 4, cường giáp, RVR tĩnh mạch cấp cứu và chu phẫu.
