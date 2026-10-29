# GDMT-VN – Đặc Tả Module Suy Tim (`HF.md`)

**Mã định danh:** `hf`  
**Tên module:** Suy tim (Heart Failure)  
**Kỹ sư chuyên trách:** Agent G5 (Round 2 Clinical & KB Remediation)  
**Nguồn tài liệu nền tảng:**  
- **INTL:** *2026 ESC Guidelines for the management of heart failure* (Eur Heart J 2026) + *Supplementary Data Tables S1–S26* + *2025 ESC Guidelines on Cardiovascular Disease and Pregnancy*.
- **VN:** *Bộ Y tế QĐ 1857/QĐ-BYT 2022 Hướng dẫn chẩn đoán và điều trị suy tim cấp và mạn*.
- **US:** *2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure* + *2026 ACC Expert Consensus Decision Pathway for HFpEF*.
- **Nhãn thuốc & thận:** Nhãn FDA DailyMed (Entresto, Aldactone, Inspra, Corlanor, Verquvo 2026, Lanoxin, Vyndaqel/Vyndamax, Injectafer, Lokelma, Veltassa), SmPC EMA (Cardicor) & KDIGO CKD 2024.

---

## 1. Phân Tầng Kiểu Hình LVEF (Chuẩn ESC 2026 vs US/BYT) & Kiến Trúc 3 Tầng

Module Suy tim vận hành theo cơ chế **Fail-Closed** (bắt buộc có `lvef`, `sbp`, `hr`, `k`, `egfr`, và `congestion` ở nội viện trước khi chỉ định thuốc tương ứng):
- **HFrEF:**
  - **`INTL` (ESC 2026):** Mở rộng cho toàn bộ **`LVEF < 50%`** (xóa bỏ phân nhóm HFmrEF riêng biệt; loại trừ HFimpEF đã hồi phục) -> Khởi động nhanh song song **4 trụ cột FMT Class I-A** (SGLT2i, ARNI/ACEi/ARB, Chẹn beta bằng chứng, MRA).
  - **`US` / `VN` (AHA 2022 / BYT 2022):** Giữ mốc **`LVEF ≤ 40%`** cho HFrEF Class I-A.
- **HFmrEF (`LVEF 41–49%` dưới hồ sơ `US` / `VN`):** **SGLT2i (`START` Class I/2a)** + **MRA (`CONSIDER` Finerenone ở `US` / Spironolactone ở `VN`)** + **`CONSIDER` ARNI/ACEi/ARB & Chẹn beta** kèm `profileDiff` đối chiếu với ESC 2026.
- **HFpEF (`LVEF ≥ 50%`):** **SGLT2i (Class I-A)** và **MRA (`INTL`: Finerenone `START` Class I-A; `US`: Finerenone `CONSIDER` Class 2a; `VN`: Spironolactone `CONSIDER` Class IIb)**; kiểu hình béo phì (`BMI ≥ 30 kg/m²`) cân nhắc **`CONSIDER` Semaglutide hoặc Tirzepatide** (Class IIa-B1 / SUMMIT). Tuyệt đối không ép `START` ARNI/Chẹn beta ở HFpEF đơn thuần.
- **HFimpEF (`LVEF > 40%` hồi phục `≥ 10%` từ `priorLvef ≤ 40%`):** Duy trì **`CONTINUE` GDMT tối đa dung nạp** (TRED-HF Class I-C), có xử trí chuyển đổi an toàn khi mang thai, cho con bú hoặc biến cố huyết động/thận cấp.

---

## 2. Kiến Trúc Mã Nguồn Mô-đun Hóa (`src/modules/hf/` — 24 tệp `< 20 KB`)

Mọi tệp `.ts` trong `src/modules/hf/` đều tuân thủ nghiêm ngặt giới hạn `< 20,480` bytes và chuẩn **QA-10 (`thFor(expectedQuantity, id)`)**:
- [`helpers.ts`](../../src/modules/hf/helpers.ts) & [`helpers.sglt2i.ts`](../../src/modules/hf/helpers.sglt2i.ts): Mở rộng viên phối hợp cố định (`fdcMap.ts`), phân loại kiểu hình theo hồ sơ (`INTL` vs `US`/`VN`), phát hiện sốc tim/vận mạch, AKI, co thắt phế quản cấp (`ASTHMA-R4-R2-09`) và đánh giá SGLT2i dùng chung.
- [`rules.hfref.rasi_safety.ts`](../../src/modules/hf/rules.hfref.rasi_safety.ts) & [`rules.hfref.arni.ts`](../../src/modules/hf/rules.hfref.arni.ts): Chặn trùng lặp ARNI + ACEi/ARB/SPC (`[STOP]`), washout ACEi `≥ 36h`, chuyển trực tiếp từ ARB, phân tầng `K+` khởi trị (`≤ 5.2`) vs duy trì (`≤ 5.5`), phác đồ thay thế ARB / H-ISDN và phác đồ hậu sản cho con bú (`Enalapril`).
- [`rules.hfref.bb.ts`](../../src/modules/hf/rules.hfref.bb.ts) & [`rules.hfref.mra.ts`](../../src/modules/hf/rules.hfref.mra.ts): Chẹn beta bằng chứng (chặn AV block II–III/SSS, chuyển đổi ở Child-Pugh B/C, `ASTHMA-R2-208` & `ASTHMA-R4-R2-09` `[HOLD]` khi cơn hen cấp) và MRA steroid (chặn trùng lặp MRA, chuyển Eplerenone khi vú to, trần `25 mg` Eplerenone với CYP3A4 vừa).
- [`rules.hfref_amt.ivabradine.ts`](../../src/modules/hf/rules.hfref_amt.ivabradine.ts), [`rules.hfref_amt.vericiguat_kbinder.ts`](../../src/modules/hf/rules.hfref_amt.vericiguat_kbinder.ts), [`rules.hfref_amt.safety_amyloid.ts`](../../src/modules/hf/rules.hfref_amt.safety_amyloid.ts), [`rules.hfref_amt.digoxin.ts`](../../src/modules/hf/rules.hfref_amt.digoxin.ts): Vòng đời đầy đủ của Ivabradine, Vericiguat (`VELOCITY` 2026), thuốc gắn kali thế hệ mới (`SZC`/`Patiromer`), ngưng từng thuốc gây hại Class III, bệnh cơ tim nhiễm bột ATTR (`Tafamidis` + kháng đông rung nhĩ bắt buộc), Digoxin (`DIGIT-HF` Class IIa-B1 + giảm liều P-gp/Amiodarone), H-ISDN (A-HeFT) và sàng lọc Stage D (`I-NEED-HELP`).
- [`rules.hfpef.pillars.ts`](../../src/modules/hf/rules.hfpef.pillars.ts) & [`rules.hfpef.special.ts`](../../src/modules/hf/rules.hfpef.special.ts): SGLT2i, Finerenone (`10/20/40 mg` theo eGFR, `HOLD` ở liều `10 mg` khi `K+ > 5.5`), HFmrEF, HFimpEF, lợi tiểu quai ngoại trú, Semaglutide/Tirzepatide và thẩm định `NT-proBNP`.
- [`rules.iron_rehab.ts`](../../src/modules/hf/rules.iron_rehab.ts) & [`rules.devices.ts`](../../src/modules/hf/rules.devices.ts): Sắt tĩnh mạch (FCM theo cân nặng & Hb), ICD (phân tầng thiếu máu cục bộ vs không thiếu máu cục bộ & MADIT-II `US`), CRT (hình dạng QRS, rung nhĩ Class IIa & mốc `120 ms` `US`), M-TEER và phục hồi chức năng tim mạch.
- [`rules.inpatient.acute.ts`](../../src/modules/hf/rules.inpatient.acute.ts) & [`rules.inpatient.transition.ts`](../../src/modules/hf/rules.inpatient.transition.ts): Sốc tim/vận mạch, fail-closed `missing_input_congestion`, Furosemide TM qui đổi liều uống + theo dõi `uNa+ 2h`/`UO 6h`, phối hợp `Acetazolamide` TM (`ADVOR`), `Nitroglycerin` TM, xử trí chẹn beta nội viện (`ASTHMA-R4-R2-09`) và tối ưu trước xuất viện `STRONG-HF`.
- [`matrices.hfref.ts`](../../src/modules/hf/matrices.hfref.ts), [`matrices.hfpef.ts`](../../src/modules/hf/matrices.hfpef.ts), [`pathways.ts`](../../src/modules/hf/pathways.ts), [`inputs.ts`](../../src/modules/hf/inputs.ts), [`presets.ts`](../../src/modules/hf/presets.ts).

---

## 3. Tri Thức Y Khoa & Kiểm Định Tự Động

- **KB (`npm run verify:kb` — 0 lỗi, 0 cảnh báo):** `183` trích dẫn nguyên văn (`kb/citations/hf.json`), `117` ngưỡng định lượng (`kb/thresholds/hf.json`), `17` hồ sơ thuốc sở hữu (`kb/drugs/*.json`, bổ sung `tafamidis` & `acetazolamide`) và `12` quy tắc tương tác (`kb/interactions/heart_failure.json`), đồng bộ 100% mã băm `kb/review/*.json` (`auto_checked`).
- **Kiểm thử tự động:** `44` ca chuẩn Golden (`tests/golden/hf/hf_01..hf_44`) + bộ kiểm thử hồi quy Vòng 2 (`tests/modules/hf/r2_regressions.test.ts`) pass 100%.
