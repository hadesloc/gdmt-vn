# Báo cáo Kiểm định Độc lập Vòng 1 — Phân hệ Suy tim (`hf`)
**Vai trò kiểm định:** R1 – Chuyên gia chuyên khoa Tim mạch / Guideline Checker  
**Ngày kiểm định:** 2026-10-27  
**Phạm vi kiểm định:**
- Mã nguồn module: `src/modules/hf/{index,inputs,presets,pathways,matrices,rules}.ts` (18 luật lâm sàng, 2 ma trận thận, 2 lưu đồ điều trị)
- Cơ sở tri thức (KB): `kb/thresholds/hf.json` (29 ngưỡng), `kb/citations/hf.json` (34 trích dẫn), 17 thuốc thuộc `hf` + 5 thuốc dùng chung (`dapagliflozin`, `empagliflozin`, `finerenone`, `semaglutide`, `tirzepatide`) trong `kb/drugs/*.json`
- Tài liệu & kiểm thử chuẩn: `docs/modules/HF.md`, `docs/modules/HF_GDMT_COMPARISON.md`, `tests/golden/hf/*.json`
- Kiểm chứng runtime thực tế: 16 kịch bản lâm sàng chạy trực tiếp qua `evaluate()` (`docs/reviews/hf/scratch/r1_eval_check.ts`)
- Nguồn PDF gốc đã mở đối chiếu nguyên văn từng trang (`docs/reviews/hf/scratch/r1_pdf_tool.ts` trên `Medical_Library_2026`):
  1. **ESC 2026 Heart Failure Guideline** (`01_Noi_Khoa/Tim_Mach/ESC_2026_Heart_Failure_Guideline.pdf`, 112 trang)
  2. **ESC 2026 Heart Failure Supplementary Tables S1–S26** (`01_Noi_Khoa/Tim_Mach/ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf`, 49 trang)
  3. **Bộ Y tế Việt Nam – Quyết định 1857/QĐ-BYT (05/07/2022)** (`06_Viet_Nam/BYT_1857_Huong_dan_suy_tim_signed_8e519ed3f9.pdf`, 27 trang)
  4. **AHA/ACC/HFSA 2022 Heart Failure Guideline** (`01_Noi_Khoa/Tim_Mach/AHA_ACC_HFSA_2022_Heart_Failure_Guideline.pdf`, 159 trang)
  5. **ACC 2026 Expert Consensus Decision Pathway on HFpEF** (`01_Noi_Khoa/Tim_Mach/ACC_2026_ECDP_HFpEF.pdf`, 30 trang)
  6. **FDA Prescribing Information – Entresto (`sacubitril/valsartan`)** (`09_Nhan_Thuoc/FDA/FDA_label_sacubitril_valsartan.pdf`, 51 trang) & **Aldactone (`spironolactone`)** (`09_Nhan_Thuoc/FDA/FDA_label_spironolactone.pdf`, 22 trang)

---

## 1. Tổng hợp Kết quả Kiểm định

| Mức độ nghiêm trọng (`severity`) | Số lượng | Ý nghĩa lâm sàng theo `REVIEW_PROTOCOL.md` |
|---|---:|---|
| **`critical`** | **8** | Có nguy cơ gây hại trực tiếp cho bệnh nhân nếu thực hành theo khuyến cáo xuất ra (sốc tim, phù mạch đe dọa tính mạng, quái thai/độc thai, cấy ICD chống chỉ định Class III, kê sai liều ma trận, kê trùng 2 thuốc cùng nhóm). |
| **`major`** | **14** | Sai lệch nội dung/ngưỡng/Class-LOE so với guideline gốc, bỏ sót khuyến cáo Class I mới của ESC 2026 / AHA 2022, thiếu `profileDiff` INTL/VN/US, hoặc trích dẫn sai/bịa đặt (QA-7/QA-8/QA-10). |
| **`minor`** | **2** | Lệch tài liệu mô tả module / ca kiểm thử chuẩn, thiếu cảnh báo thuốc Class III làm nặng suy tim & ĐTĐ típ 1 khi dùng SGLT2i. |
| **`suggestion`** | **1** | Đề xuất bổ sung lưu đồ riêng `hf.pathway.chronic_hfpef` và cập nhật M-TEER vào lưu đồ HFrEF. |
| **Tổng cộng** | **25** | Mã định danh: `HF-R1-001` → `HF-R1-025` (chi tiết đầy đủ trong `round1_R1.json`). |

### Phân bố theo loại hạng mục (`itemType`)
- `rule`: **15** (`HF-R1-001`, `002`, `003`, `004`, `006`, `007`, `008`, `010`, `011`, `012`, `013`, `014`, `015`, `017`, `018`)
- `missing`: **3** (`HF-R1-009`, `016`, `024`)
- `matrix`: **2** (`HF-R1-005`, `022`)
- `citation`: **1** (`HF-R1-019` — tổng hợp 15/34 trích dẫn lỗi trong `kb/citations/hf.json`)
- `threshold`: **1** (`HF-R1-020` — tổng hợp 5 ngưỡng lỗi QA-7 / mâu thuẫn guideline trong `kb/thresholds/hf.json`)
- `drug`: **1** (`HF-R1-021` — tổng hợp 14/17 hồ sơ thuốc lỗi gán chéo trích dẫn trong `kb/drugs/*.json`)
- `ui`: **2** (`HF-R1-023`, `025`)

---

## 2. Bảng Đối chiếu Toàn diện 18 Luật Lâm sàng (`src/modules/hf/rules.ts`)

| Rule ID | Tên luật | Khuyến cáo chuẩn (ESC 2026 / BYT 1857 / US) | Hiện trạng trong code & runtime | Đánh giá | Finding ID |
|---|---|---|---|---|---|
| `hf.fmt.sglt2i` | Khởi trị/duy trì SGLT2i | ESC 2026: **I A** mọi LVEF (`Rec Table 5`, tr. 37); BYT 1857: **I A** EF ≤ 40%, **IIa/IIb** EF > 40%; AHA 2022: **1 A** HFrEF, **2a B-R** HFmrEF/HFpEF; ACC 2026 ECDP: đầu tay HFpEF | Hoạt động đúng ở eGFR ≥ 20, nhưng kích hoạt cả khi thiếu `lvef`, nội viện đang sốc (`SBP 78`), thiếu chống chỉ định ĐTĐ típ 1 và thiếu `profileDiff` cho LVEF > 40% ở VN/US | Cần sửa | `HF-R1-001`, `004`, `006`, `010`, `024` |
| `hf.fmt.mra` | Khởi trị/tối ưu MRA | ESC 2026: **I A** mọi LVEF (`sMRA` cho HFrEF eGFR ≥ 30; `sMRA`/`finerenone` cho HFpEF eGFR ≥ 25, tr. 37 & `Table S8` tr. 18); BYT 1857 / AHA 2022: **I A** EF ≤ 40%, **IIb** EF > 40%; ACC 2026: `finerenone` là MRA ưu tiên cho HFpEF | Thiếu hẳn `finerenone` cho HFpEF; không kiểm tra SBP (vẫn `START` ở `SBP 78`); chỉ đọc liều `spironolactone` nên kê chồng lên `eplerenone 50 mg`; `HOLD` quá sớm ở `K+ 5.2` khi đang duy trì; thiếu `profileDiff` | **Critical / Major** | `HF-R1-001`, `006`, `008`, `009`, `010`, `014` |
| `hf.fmt.arni` | Khởi trị/chuyển đổi ARNI | ESC 2026: **I A** HFrEF (`Rec Table 5`, tr. 37), **IIb C** HFpEF (tr. 38); washout ≥ 36h sau ACEi (`Table S5`, tr. 12); FDA US: liều 24/26 mg nếu chưa dùng ACEi/ARB | Điều kiện `when` bị đoản mạch (`hasHfDiagnosis` luôn `true`) → kê `START ARNI` cho mọi ca HFpEF! Bỏ qua `enalapril` trong `currentMeds` → mất cảnh báo washout 36h + lỗi chữ `Ngừng undefined` + cảnh báo trùng RASI; sai liều khởi đầu US ở BN chưa dùng RASi | **Critical** | `HF-R1-001`, `003`, `010`, `020` |
| `hf.fmt.bb` | Khởi trị/tối ưu chẹn beta | ESC 2026: **I A** HFrEF ổn định đẳng tích (`Rec Table 5`, tr. 37; `Table S6`, tr. 14–15); **không chỉ định** ở HFpEF đơn thuần; BYT 1857: chống chỉ định khi suy tim đang mất bù (tr. 14); Thai kỳ: **I C** chuyển sang $\beta_1$ chọn lọc (tr. 74) | Đoản mạch `when` → kê `START Bisoprolol` cho mọi ca HFpEF! Kê `START`/`UPTITRATE` ngay trong phù phổi cấp nội viện (`congestion: 'overt'`), đè mất `continue_bb`; kê chồng `bisoprolol` lên `carvedilol`/`metoprolol`; không chuyển `carvedilol` sang $\beta_1$-selective ở thai kỳ | **Critical** | `HF-R1-001`, `002`, `004`, `008`, `010` |
| `hf.amt.loop_diuretic` | Lợi tiểu quai giảm sung huyết | ESC 2026: **I C** khi có dấu/triệu chứng sung huyết (`Rec Table 4`, tr. 32) | Đặt `setting: 'both'`, `priority: 92` → ở nội viện có sung huyết, luật này ghi đè và xóa mất luật Furosemide đường tĩnh mạch `hf.inpatient.iv_diuretic` (`priority: 96`)! | **Critical** | `HF-R1-006` |
| `hf.amt.iron_screening` | Tầm soát thiếu sắt định kỳ | ESC 2026: **I C** định kỳ bằng Ferritin & TSAT (`Rec Table 19`, tr. 67) | Khi có Ferritin = 95 µg/L & TSAT = 24%, cả luật tầm soát lẫn luật bù sắt đều im lặng (do lỗi nhân `30 * 3 = 90` ở `hf.amt.iv_iron`) | **Major** | `HF-R1-011` |
| `hf.amt.iv_iron` | Bù sắt đường tĩnh mạch | ESC 2026 `Rec Table 19` (tr. 67): **I B1** (giảm triệu chứng/cải thiện QoL) & **IIa B1** (FCM/FDI giảm nhập viện HF) ở HFrEF có triệu chứng, Ferritin `< 100` hoặc `100–299` kèm TSAT `< 20%` | Đoản mạch `when` → chạy cả ở HFpEF; lỗi toán học `30 * 3 = 90` bỏ sót Ferritin `90–99`; bỏ sót khuyến cáo **Class I B1** (chỉ ghi `IIa` với LOE sai `A`); thiếu kiểm tra `Hb < 15 g/dL` và `hasCurrentMed` | **Critical / Major** | `HF-R1-001`, `011` |
| `hf.amt.ivabradine` | Ivabradine giảm tần số xoang | ESC 2026 `Rec Table 5` (tr. 38): **IIa B1** ở HFrEF có triệu chứng, LVEF ≤ 35%, nhịp xoang, HR ≥ 70 bpm **dù đã tối ưu liều chẹn beta** (hoặc không dung nạp BB: **IIa C**); **III C** trong thai kỳ (tr. 74) | Không kiểm tra đã dùng BB hay chưa → khuyên `CONSIDER Ivabradine` ngay trên BN mới chẩn đoán chưa uống viên BB nào (`hf_01`)! Không chặn thai kỳ (`CONSIDER` lọt qua bộ lọc thai kỳ toàn cục → gây quái thai!) | **Critical / Major** | `HF-R1-004`, `012` |
| `hf.amt.vericiguat` | Vericiguat sau đợt mất bù | ESC 2026 `Rec Table 5` (tr. 38): **IIb B1** ở LVEF < 50% có đợt suy tim nặng lên gần đây dù đã tối ưu FMT; AHA 2022: **2b B-R** ở LVEF < 45%; FDA Boxed Warning độc thai; chống chỉ định PDE5i | Lọt qua bộ lọc thai kỳ toàn cục → khuyên `CONSIDER Vericiguat` cho phụ nữ mang thai! Không kiểm tra nền FMT, không kiểm tra `hasCurrentMed`, thiếu chống chỉ định PDE5i/nitrat dài hạn & `SBP ≥ 100`, thiếu `profileDiff` US `< 45%` | **Critical / Major** | `HF-R1-004`, `018` |
| `hf.amt.digoxin` | Digoxin kiểm soát triệu chứng / tần số | ESC 2026 `Rec Table 5` (tr. 37): **IIa B1** (digoxin/digitoxin ở HFrEF LVEF ≤ 40% còn triệu chứng dù đã FMT tối ưu) & `Rec Table 15` (tr. 59): **IIa B2** kiểm soát tần số AF; AHA 2022 / BYT 1857: **IIb B-R** | Chép nhầm cột cũ năm 2021 (`IIb B`, chỉ nhịp xoang) thay vì khuyến cáo mới 2026 (`IIa B1`); không kiểm tra nền FMT, `nyha >= 2` và `hasCurrentMed`; ngưỡng `ef_max = 40` gian lận trích dẫn câu ICD `> 40 days` | **Major** | `HF-R1-018`, `020` |
| `hf.gdit.icd` | Cấy ICD phòng ngừa tiên phát | ESC 2026 `Rec Table 6` (tr. 39): NYHA II–III, LVEF ≤ 35% sau ≥ 3 tháng FMT, sống > 1 năm, sau NMCT > 40 ngày: **I B1** (thiếu máu cục bộ), **IIa B1** (không thiếu máu cục bộ); **III C** ở NYHA IV; **III B1** `< 40 ngày` sau NMCT | Không kiểm tra `nyha` → ra lệnh `START ICD` cho **NYHA IV** (vi phạm **Class III**!) và NYHA I; không kiểm tra `< 40 ngày` sau NMCT; gán sai `Class I A` cho cả bệnh cơ tim không thiếu máu cục bộ; thiếu `profileDiff` US | **Critical** | `HF-R1-007` |
| `hf.gdit.crt` | Tái đồng bộ cơ tim (CRT) | ESC 2026 `Rec Table 7` (tr. 41): HFrEF có triệu chứng, **nhịp xoang**, LVEF ≤ 35% sau ≥ 3 tháng FMT: LBBB ≥ 150 (**I A**), LBBB 130–149 / non-LBBB ≥ 150 (**IIa C**), non-LBBB 130–149 (**IIb C**); AF: `Rec Table 15` tr. 59 (**IIa C** NYHA III–IV + đảm bảo tạo nhịp ~100%) | Không kiểm tra `rhythm === 'sinus'` và `nyha >= 2` → ra lệnh `START CRT (Class I)` với câu giải thích `"nhịp xoang"` ngay cả khi BN đang bị **rung nhĩ (`afib`)**! Trích dẫn sai bảng (`Table 5` dòng `IIb C` bị ghi thành `Table 3` `I A`) | **Major** | `HF-R1-013`, `019` |
| `hf.gdit.teer` | Sửa van hai lá qua ống thông (M-TEER) | ESC 2026 `Rec Table 17` (tr. 64) & `Table 19` (tr. 63): **Class I, Level B1** cho hở hai lá thứ phát thất trái nặng dai dẳng (LVEF `20–50%`, NYHA ≥ II dù đã tối ưu FMT ± CRT, ổn định huyết động, sPAP ≤ 70); AHA 2022: **2a B-R** | Trích dẫn nhầm **Primary MR** (`IIa B`, tr. 62) thay vì **Ventricular Secondary MR** (**`I B1`**, tr. 64)! Thiếu chặn dưới `LVEF ≥ 20%`, thiếu `nyha >= 2` và thiếu `profileDiff` US (`2a B-R`) | **Major** | `HF-R1-017`, `019`, `020` |
| `hf.gdit.cardiac_rehab` | Phục hồi chức năng tim mạch | ESC 2026 `Rec Table 24` (tr. 72): **I B1** ở BN **ổn định**; Section 11.4.2 (tr. 71): tập luyện thể lực **chống chỉ định** trong DHF cấp chưa ổn định | Đặt `setting: 'both'` không kiểm tra ổn định huyết động → ra lệnh `START` tập thể lực ngay trên BN nội viện sốc tim `SBP 78 mmHg` NYHA IV! Ghi sai LOE `A` thay vì `B1` | **Critical** | `HF-R1-006`, `019` |
| `hf.hfpef.glp1_obesity` | GLP-1 / GIP-GLP-1 RA ở HFpEF béo phì | ESC 2026 `Rec Table 18` (tr. 65): **IIa B1** (`should be considered`) ở HF có triệu chứng, LVEF ≥ 45%, BMI ≥ 30 để giảm cân, cải thiện gắng sức & QoL (semaglutide hoặc tirzepatide); ACC 2026 ECDP tr. 17: `may be prescribed` | Dùng `START` thay vì `CONSIDER`; không nhận diện `tirzepatide` đang dùng → ra lệnh `SWITCH: Ngừng undefined để thay bằng Semaglutide` ở NYHA I; thiếu chống chỉ định MTC/MEN2; ghi sai LOE `A` và bịa chữ giảm HFH trong bản dịch ESC 2026 | **Major** | `HF-R1-015`, `019` |
| `hf.inpatient.iv_diuretic` | Furosemide tĩnh mạch nội viện | ESC 2026 `Rec Table 9` (tr. 50): **I C** cho DHF nhập viện **có quá tải dịch**; theo dõi Na niệu 2h / nước tiểu 6h (`IIb B1`) | Kích hoạt cho mọi BN nội viện kể cả **đẳng tích đang sốc `SBP 78`**; ngược lại khi BN **có quá tải dịch**, bị `hf.amt.loop_diuretic` ghi đè làm mất khuyến cáo IV! | **Critical** | `HF-R1-006`, `019` |
| `hf.inpatient.continue_bb` | Xử trí chẹn beta đang dùng ở nội viện | ESC 2026 `Rec Table 12` (tr. 54): **IIa C** giảm liều/tạm ngưng BB khi có giảm tưới máu mô; tiếp tục nếu không sốc/không giảm tưới máu | Fail-open khi `sbp === undefined` (`CONTINUE`); bỏ sót giảm tưới máu mô có HA bình thường; khi `congestion: 'overt'` và BB chưa đạt đích, bị `hf.fmt.bb` ghi đè thành `UPTITRATE`!; trích dẫn nhầm `Rec Table 9 IIa B` | **Critical** | `HF-R1-002`, `019` |
| `hf.inpatient.vasodilator` | Giãn mạch trong suy tim cấp HA > 110 | ESC 2026 `Rec Table 9` (tr. 50, **IIb C**) & `Supp Table S14` (tr. 25): giãn mạch **tĩnh mạch** (`Nitroglycerine` 10–200 µg/phút hoặc `Nitroprusside` 0.3–5 µg/kg/phút) giảm sung huyết khi SBP > 110 | Dùng sai viên uống mạn tính `isosorbide_dinitrate` (`20 mg x 3 lần/ngày`, dẫn chiếu `Table 11` ngoại trú!) thay vì truyền tĩnh mạch `Table S14`, và kích hoạt cả khi BN không có sung huyết (`euvolaemic`) | **Major** | `HF-R1-016`, `019` |
| `hf.inpatient.predischarge_fmt` | Khởi trị & tối ưu FMT trước xuất viện | ESC 2026 `Rec Table 11` (tr. 53): **I B2** sau khi đã ổn định huyết động và hết sung huyết cấp | Kích hoạt cả khi BN đang sốc tim `SBP 78 mmHg` chưa ổn định; ghi sai LOE `B` thay vì `B2` | **Critical / Major** | `HF-R1-006`, `019` |

---

## 3. Đối chiếu Đa Hồ sơ (`profileDiff`: `INTL` vs `VN` vs `US`)

Hiện tại trong toàn bộ 18 luật của `src/modules/hf/rules.ts`, chỉ duy nhất 2 luật (`hf.fmt.sglt2i` và `hf.hfpef.glp1_obesity`) có khai báo `profileDiff`, và ngay cả 2 `profileDiff` đó cũng chưa đầy đủ. Các khác biệt cốt lõi sau giữa 3 hệ thống hướng dẫn đang bị bỏ sót:

| Chủ đề lâm sàng | `INTL` (ESC 2026) | `VN` (Bộ Y tế – QĐ 1857/QĐ-BYT 2022) | `US` (AHA/ACC/HFSA 2022 & ACC 2026 ECDP) | Hiện trạng module `hf` |
|---|---|---|---|---|
| **Phân loại theo LVEF** | **HFrEF `< 50%`** (bỏ nhóm HFmrEF, lưu ý chú thích `e` tr. 38); **HFpEF `≥ 50%`** (`Table 4`, tr. 17) | **HFrEF `≤ 40%`**, **HFmrEF `41–49%`**, **HFpEF `≥ 50%`** (`Bảng 1`, tr. 7) | **HFrEF `≤ 40%`**, **HFmrEF `41–49%`**, **HFpEF `≥ 50%`**, **HFimpEF** (AHA 2022 tr. 19) | Chỉ dùng cứng `< 50%` cho mọi profile (`HF-R1-010`) |
| **ARNI / ACEi / ARB & BB ở LVEF 41–49%** | **Class I, LOE A** (`START`, chú thích `e`: phân tích dưới nhóm) | **Có thể cân nhắc (Class IIb)** (`Mục II.3`, tr. 19) → `CONSIDER` | **COR 2b, LOE B-NR** (AHA 2022 tr. 64) → `CONSIDER` | Phát `START` Class I A ở cả VN & US (`HF-R1-010`) |
| **MRA ở HFpEF (LVEF ≥ 50%)** | **Class I, LOE A** cho `sMRA` hoặc `nsMRA (finerenone)` (`Rec Table 5`, tr. 37) | **Có thể cân nhắc (Class IIb)** spironolactone (`Mục II.4`, tr. 20) | AHA 2022: **COR 2b, LOE B-R**; **ACC 2026 ECDP** (tr. 14): `finerenone` được FDA duyệt (07/2025) là **MRA ưu tiên đầu tay** cho HFpEF | Bỏ sót hoàn toàn `finerenone` cho HFpEF; ma trận ghi sai `Class IIb` (`HF-R1-009`) |
| **SGLT2i ở HFmrEF / HFpEF** | **Class I, LOE A** (`Rec Table 5`, tr. 37) | BYT 07/2022 (ban hành trước DELIVER): mới cập nhật empagliflozin giảm biến cố gộp ở EF > 40% (`Mục II.3–II.4`, tr. 19–20) | AHA 2022: **COR 2a, LOE B-R**; **ACC 2026 ECDP**: trụ cột đầu tay HFpEF | `profileDiff` của `hf.fmt.sglt2i` ghi sơ sài "Nhất quán hoàn toàn" |
| **Liều khởi đầu Sacubitril/Valsartan ở BN chưa từng dùng ACEi/ARB** | `49/51 mg b.i.d.`, có thể cân nhắc `24/26 mg b.i.d.` (`Table S5`, tr. 13) | `49/51 mg x 2 lần/ngày` (`Bảng 6`, tr. 16 — không có dòng 24/26 mg) | **Bắt buộc giảm nửa liều `24/26 mg b.i.d.`** trên nhãn FDA Entresto (`Sec 2.6`, tr. 1, 7) & ACC 2026 `Table 5` (tr. 15) | Kê `49/51 mg` cho BN chưa dùng RASi ở cả US; bịa chữ 24/26 vào quote BYT (`HF-R1-003`, `019`) |
| **Danh mục chẹn beta có bằng chứng** | 4 thuốc: `bisoprolol`, `carvedilol`, `metoprolol succinate`, **`nebivolol`** (`Table 9`, tr. 36) | 4 thuốc (gồm cả **`nebivolol`**, `Bảng 6`, tr. 16) | **Chỉ 3 thuốc**: `bisoprolol`, `carvedilol`, `metoprolol succinate` (**không gồm nebivolol**, AHA 2022 tr. 43) | Chưa có `profileDiff` phân biệt `nebivolol` ở US (`HF-R1-008`) |
| **Hydralazine + Isosorbide dinitrate** | Da đen NYHA III–IV: **IIa B2**; không dung nạp RASi: **IIb C** (`Rec Table 5`, tr. 38) | Cân nhắc khi không dung nạp ACEi/ARB/ARNI hoặc BN da đen (`Mục II.2.2`, tr. 15) | Da đen NYHA III–IV: **COR 1, LOE A**; không dung nạp RASi: **COR 2b, LOE C-LD** (AHA 2022 tr. 46) | **Bỏ sót hoàn toàn luật H-ISDN mạn tính** (`HF-R1-016`) |
| **ICD tiên phát ở bệnh cơ tim không thiếu máu cục bộ** | **Class IIa, LOE B1** (`Rec Table 6`, tr. 39) | **Class IIa** (`Mục II.2.3`, tr. 17) | **COR 1, LOE A** (AHA 2022 tr. 56) | Đánh đồng `Class I A` cho mọi căn nguyên (`HF-R1-007`) |
| **CRT ở QRS trung gian** | Ngưỡng dưới **`130–149 ms`** (`Rec Table 7`, tr. 41) | Ngưỡng dưới **`130–149 ms`** (`Mục II.2.3`, tr. 17) | Ngưỡng dưới **`120–149 ms`** kèm LBBB là **COR 2a, LOE B-NR** (AHA 2022 tr. 57) | Chặn cứng `< 130 ms` cho cả US (`HF-R1-013`) |
| **M-TEER trong hở hai lá thứ phát nặng** | **Class I, LOE B1** (`Rec Table 17`, tr. 64) | Cân nhắc hội chẩn tim mạch can thiệp | **COR 2a, LOE B-R** (AHA 2022 tr. 63) | Ghi nhầm Primary MR `IIa B` (`HF-R1-017`) |
| **Digoxin ở HFrEF & Vericiguat** | Digoxin/digitoxin: **IIa B1** (LVEF ≤ 40%, tr. 37); Vericiguat: **IIb B1** (LVEF `< 50%`, tr. 38) | Digoxin: **IIb** (`Mục II.2.2`, tr. 15) | Digoxin: **COR 2b, LOE B-R**; Vericiguat: **COR 2b, LOE B-R** ở **LVEF `< 45%`** (AHA 2022 tr. 55) | Digoxin dùng quote cũ 2021 `IIb B`; Vericiguat dùng `< 50%` cho cả US (`HF-R1-018`) |

---

## 4. Chi tiết 8 Phát hiện Mức `CRITICAL` (`HF-R1-001` → `HF-R1-008`)

### [HF-R1-001] `critical` | `rule` | `hf.fmt.arni, hf.fmt.bb, hf.fmt.mra, hf.amt.iv_iron`
- **Vấn đề:** Điều kiện kích hoạt (`when`) của các luật chỉ định riêng cho HFrEF bị **đoản mạch hoàn toàn (dead-code)** do viết `hasHfDiagnosis(ctx) || (ef !== undefined && ef < th('hf.ef.hfref_max_esc2026'))` (`src/modules/hf/rules.ts` dòng 17–20, 113–117, 233–237, 373–377, 540–544), trong đó `hasHfDiagnosis(ctx)` trả về `true` bất cứ khi nào `ctx.patient.selectedModules.includes('hf')`!
  - **Hệ quả 1 (HFpEF bị kê sai thuốc HFrEF):** Mọi bệnh nhân **HFpEF (`LVEF ≥ 50%`)** không có rung nhĩ/bệnh mạch vành đều bị engine chỉ định **`START Sacubitril/valsartan`** và **`START Bisoprolol 1.25 mg`** với lý giải sai là *"khuyến cáo nền tảng (Class I, Mức A) ở HFrEF"*. Ở HFpEF, chẹn beta không có bằng chứng lợi ích và dễ gây không dung nạp gắng sức do suy nút xoang/mất đáp ứng tần số tim (chronotropic incompetence); ARNI chỉ ở mức Class IIb, Level C; sắt tĩnh mạch chỉ khuyến cáo cho HFrEF.
  - **Hệ quả 2 (Vi phạm fail-closed QA-1/QA-9 khi thiếu `lvef`):** Khi chưa nhập `lvef` (`lvef: undefined`), engine không phát bất kỳ `missing_input` nào cho `lvef` mà tự động kê cả 4 trụ cột HFrEF.
- **Bằng chứng kiểm chứng:**
  - *Runtime Scenario 1 (`lvef: 58`, nữ 72 tuổi, NYHA II, `sbp: 132`, `hr: 72`, `rhythm: 'sinus'`, `egfr: 58`, `k: 4.3`):* Engine xuất `[rec_hf_arni] START sacubitril_valsartan` + `[rec_hf_bb] START bisoprolol`.
  - *Runtime Scenario 2 (`lvef: undefined`):* Xuất đồng loạt `START` dapagliflozin, spironolactone, sacubitril_valsartan, bisoprolol; không có `missing_input` cho `lvef`.
  - *PDF gốc:*
    - **ESC 2026 HF Guideline, Section 6.2 (tr. 35):** *"Data for beta-blockers in patients with HFpEF are scarce."*
    - **ESC 2026 Recommendation Table 5 (tr. 38):** *"An ACE-I/ARNI/ARB may be considered in patients with symptomatic HFpEF to reduce the risk of HFH. Class IIb, Level C."*
    - **ESC 2026 Recommendation Table 19 (tr. 67):** *"Intravenous iron supplementation is recommended in symptomatic patients with HFrEF and iron deficiency..."* & *"Data in patients with HFpEF are scarce."*
    - **ACC 2026 ECDP HFpEF, Section 5.1.6 (tr. 17):** *"Importantly, no established benefit of beta-blockers in individuals with HFpEF has been observed. Moreover, beta-blockers may be poorly tolerated, causing exertional intolerance due to chronotropic incompetence."*
- **Hướng khắc phục:** Bắt buộc kiểm tra `lvef === undefined` để phát `missingInputRec` và chặn fail-closed các luật phụ thuộc phân nhóm EF; đổi `||` thành `&&` (`hasHfDiagnosis(ctx) && ef !== undefined && ef < th('hf.ef.hfref_max_esc2026')`) cho `hf.fmt.arni`, `hf.fmt.bb`, `hf.amt.iv_iron`; tách luật riêng mức `CONSIDER` (Class IIb C) cho RASi/ARNI ở HFpEF.

---

### [HF-R1-002] `critical` | `rule` | `hf.fmt.bb, hf.inpatient.continue_bb`
- **Vấn đề:** Nguy cơ gây phù phổi nặng thêm và thúc đẩy sốc tim ở bệnh nhân suy tim mất bù cấp nội viện:
  1. `hf.fmt.bb` (`setting: 'both'`, `priority: 91`) không kiểm tra tình trạng sung huyết cấp (`congestion === 'overt'`) hay NYHA IV cấp → ra lệnh **`START Bisoprolol 1.25 mg`** ngay lúc bệnh nhân đang phù phổi cấp chưa dùng BB, và ra lệnh **`UPTITRATE Bisoprolol`** (ghi đè `hf.inpatient.continue_bb` có `priority: 97` thấp hơn!) ngay lúc bệnh nhân đang mất bù cấp trên nền Bisoprolol 2.5 mg.
  2. `hf.inpatient.continue_bb` vi phạm fail-closed khi `sbp === undefined`: biến `isShockOrHypoperfusion` bằng `false`, xuất `CONTINUE` với cổng *"Tưới máu mô ổn định"* dù chưa có huyết áp, đồng thời bỏ qua giảm tưới máu mô có huyết áp bình thường (normotensive hypoperfusion).
- **Bằng chứng kiểm chứng:**
  - *Runtime Scenario 3 (`setting: 'inpatient'`, `congestion: 'overt'`, `nyha: 4`, `sbp: 96`, `hr: 118`, `currentMeds: []`):* Xuất `[rec_hf_bb] START bisoprolol 1.25 mg`.
  - *Runtime Scenario 16 (`setting: 'inpatient'`, `congestion: 'overt'`, `nyha: 4`, `sbp: 115`, `currentMeds: [{drugId: 'bisoprolol', dose: '2.5'}]`):* Xuất `[rec_hf_bb] UPTITRATE bisoprolol` (xóa mất `rec_hf_inpatient_continue_bb`).
  - *Runtime Scenario 4 (`setting: 'inpatient'`, `sbp: undefined`, `currentMeds: [{drugId: 'bisoprolol', dose: '2.5'}]`):* Xuất `CONTINUE` với gate `"Tưới máu mô ổn định"`.
  - *PDF gốc:*
    - **ESC 2026 Section 6.1.2 (tr. 34–35) & Supp Table S6 (tr. 14–15):** *"In patients admitted with DHF, beta-blockers should be cautiously initiated in hospital, once the patient is haemodynamically stabilized... Euvolaemia is crucial prior to initiating beta-blockers."*
    - **ESC 2026 Section 7.2 (tr. 42, 44):** *"Hypoperfusion is not a synonym for hypotension; CS may also present as hypoperfusion with normotension."*
    - **QĐ 1857/QĐ-BYT 2022, Mục II.2.1 (tr. 14):** *"Chống chỉ định [chẹn beta]: suy tim đang ở giai đoạn mất bù, nhịp chậm, hen phế quản."*
- **Hướng khắc phục:** Chỉ cho phép `START`/`UPTITRATE` chẹn beta khi `congestion === 'euvolaemic'` và huyết động ổn định; ở nội viện đang dùng BB, nhường hoàn toàn quyền quyết định cho `hf.inpatient.continue_bb`; bắt buộc fail-closed khi `sbp === undefined` và bổ sung cờ lâm sàng `hypoperfusion` / `onInotropes`.

---

### [HF-R1-003] `critical` | `rule` | `hf.fmt.arni`
- **Vấn đề:** Nguy cơ phù mạch thanh quản đe dọa tính mạng và sai liều khởi trị ARNI:
  1. `hf.fmt.arni` (`rules.ts` dòng 258) chỉ kiểm tra `customInputs.takingAcei` mà **bỏ qua hoàn toàn `currentMeds`** (`enalapril`, `perindopril`, `ramipril`, `lisinopril`, `captopril`, `valsartan`, `losartan`, `candesartan`, `telmisartan`...). Khi bệnh nhân đang uống `enalapril 10 mg` trong `currentMeds`, cổng washout báo sai `passed: true` (*"Không đang dùng ACEi hoặc đã đủ 36 giờ washout"*), phát lệnh `START sacubitril_valsartan 49/51 mg` kèm tiêu đề lỗi **`"CHUYỂN ĐỔI: Ngừng undefined để thay bằng Sacubitril / Valsartan"`** mà **không có cảnh báo ngừng ACEi ≥ 36 giờ**, đồng thời phát cảnh báo trùng RASI mức `critical`.
  2. Không phân biệt chuyển từ ARB sang ARNI (thay thế trực tiếp ở liều kế tiếp, không cần chờ 36 giờ).
  3. Kê cứng `49/51 mg x 2 lần/ngày` cho cả bệnh nhân chưa từng dùng ACEi/ARB ở profile `US` (trái nhãn FDA yêu cầu giảm nửa liều còn `24/26 mg x 2 lần/ngày`).
- **Bằng chứng kiểm chứng:**
  - *Runtime Scenario 5 (`currentMeds: [{drugId: 'enalapril', dose: '10'}]`, `sbp: 124`, `egfr: 68`, `k: 4.4`, `lvef: 34`):* Xuất `[rec_hf_arni] START sacubitril_valsartan 49/51 mg` + `[switch_old_enalapril_for_sacubitril_valsartan] "CHUYỂN ĐỔI: Ngừng undefined..."` + `dup_dup.rasi_arni (critical)`.
  - *PDF gốc:* **ESC 2026 Section 6.1.1.2 (tr. 33) & Supp Table S5 (tr. 12):** *"A washout period of at least 36 h after ACE-I therapy is required in order to minimize the risk of angio-oedema"*; **AHA/ACC 2022 (tr. 41):** *"COR 3: Harm, LOE B-R"*; **FDA Label Entresto, Sec 2.1, Sec 2.6 & Sec 4 (tr. 1, 4, 7, 8):** *"Do not administer within 36 hours of switching from or to an ACE inhibitor"* & *"Reduce starting dose to half the usually recommended starting dosage [24/26 mg twice daily] for: patients not currently taking an ACE inhibitor or ARB or previously taking a low dose of these agents."*
- **Hướng khắc phục:** Quét đầy đủ các hoạt chất ACEi và ARB trong `currentMeds`; bổ sung tên hiển thị cho nhóm ACEi/ARB để không xuất `undefined`; tách rõ hành động `SWITCH` từ ACEi (**bắt buộc ngừng ≥ 36 giờ**) vs `SWITCH` từ ARB (không cần chờ 36 giờ) vs `START` mới ở BN chưa dùng RASi (`24/26 mg b.i.d.` ở US / cân nhắc ở INTL).

---

### [HF-R1-004] `critical` | `rule` | `hf.amt.ivabradine, hf.amt.vericiguat, hf.fmt.bb`
- **Vấn đề:** Toàn bộ `src/modules/hf/rules.ts` không có kiểm tra thai kỳ (`pregnant` / `conditions.pregnancy`). Qua thực nghiệm `evaluate()`, bộ lọc thai kỳ toàn cục của engine chỉ chặn các y lệnh `START` mà **bỏ lọt hoàn toàn các y lệnh `CONSIDER`**, dẫn đến hệ thống trực tiếp khuyên dùng hai thuốc gây độc thai / quái thai (**`CONSIDER Ivabradine`** và **`CONSIDER Vericiguat`**) cho phụ nữ đang mang thai! Đồng thời bệnh nhân mang thai đang dùng `carvedilol` không được chuyển sang chẹn beta chọn lọc $\beta_1$ (`bisoprolol`/`metoprolol` — **Class I, Level C** của ESC 2026) mà lại bị kê chồng thêm `UPTITRATE bisoprolol`.
- **Bằng chứng kiểm chứng:**
  - *Runtime Scenario 6 (`pregnant: true`, `conditions: {hf: true, pregnancy: true}`, `lvef: 35`, `hr: 84`, `currentMeds: [{drugId: 'carvedilol', dose: '6.25'}]`):* Xuất `[rec_hf_ivabradine] CONSIDER ivabradine 5 mg x 2 lần/ngày` + `[rec_hf_bb] UPTITRATE bisoprolol`.
  - *Runtime Scenario 15 (`pregnant: true`, `lvef: 44`, `recentWorseningHf: true`):* Xuất `[rec_hf_vericiguat] CONSIDER vericiguat 2.5 mg x 1 lần/ngày`.
  - *PDF gốc:* **ESC 2026 Recommendation Table 27 (tr. 74):**
    - *"ACE-Is, ARBs, ARNIs, MRAs, ivabradine, and SGLT2-Is are not recommended during pregnancy due to the risk of foetotoxicity or teratogenicity. **Class III, Level C**."*
    - *"In pregnant women with HFrEF, it is recommended that non-selective beta-blockers are switched to beta1-selective blockers (metoprolol, bisoprolol) with close mother and foetus monitoring to reduce the risk of adverse foetal events and a lower birth weight. **Class I, Level C**."*
    - **FDA Label Verquvo (vericiguat):** *Boxed Warning – Embryo-Fetal Toxicity: Do not administer to a pregnant female.*
- **Hướng khắc phục:** Kiểm tra thai kỳ tường minh trong từng luật thuốc của `hf` (và nâng cấp bộ lọc toàn cục chặn cả `CONSIDER` đối với thuốc chống chỉ định thai kỳ) để phát `STOP`/`AVOID` (Class III C) cho ARNI/ACEi/ARB, MRA, SGLT2i, Ivabradine, Vericiguat, GLP-1 RA; bổ sung luật thai kỳ HFrEF chuyển `carvedilol` sang `bisoprolol`/`metoprolol_succinate` (Class I C) và cân nhắc `hydralazine`.

---

### [HF-R1-005] `critical` | `matrix` | `hf.matrix.renal (mra_renal.g3b), hf.matrix.hfpef_renal (mra.g3b)`
- **Vấn đề:** Lỗi QA-10 nghiêm trọng trong `src/modules/hf/matrices.ts` (dòng 53 và dòng 185): lấy nhầm hằng số mức lọc cầu thận `th('hf.mra.egfr_min_initiate')` (`= 30` mL/min/1.73m²) gắn vào chuỗi hàm lượng mg của Spironolactone, hiển thị trên UI thành **`"Khởi đầu 30 mg uống cách ngày"`** ở CKD G3b (eGFR 30–44). Viên Spironolactone không có hàm lượng 30 mg và nhãn thuốc quy định **25 mg cách ngày** (hoặc 12.5 mg/ngày).
- **Bằng chứng kiểm chứng:**
  - *Code (`matrices.ts` dòng 53 & 185):* ``dose: `Khởi đầu ${th('hf.mra.egfr_min_initiate')} mg uống cách ngày` `` → xuất `"Khởi đầu 30 mg uống cách ngày"`.
  - *PDF gốc:* **FDA Label Aldactone, Section 2.2 (PDF tr. 5):** *"In patients with an eGFR between 30 and 50 mL/min/1.73 m2, consider initiating therapy at 25 mg every other day because of the risk of hyperkalemia"*; **AHA/ACC 2022 (tr. 44):** *"12.5 mg daily or 25 mg every other day"*.
- **Hướng khắc phục:** Khai báo threshold liều đúng bản chất (12.5 mg/ngày hoặc 25 mg cách ngày) dẫn chiếu `fda.hf.spironolactone_egfr_30_50` (PDF tr. 5) và sửa cả 2 ô ma trận `g3b`.

---

### [HF-R1-006] `critical` | `rule` | `hf.inpatient.iv_diuretic, hf.amt.loop_diuretic, hf.fmt.mra, hf.gdit.cardiac_rehab, hf.inpatient.predischarge_fmt`
- **Vấn đề:** Tổ hợp lỗi nguy hiểm ở bệnh nhân nội viện suy tim cấp / sốc tim:
  1. **Đảo ngược lợi tiểu tĩnh mạch:** `hf.inpatient.iv_diuretic` (`priority: 96`, `drugId: 'furosemide'`) không kiểm tra sung huyết hay huyết áp. Khi bệnh nhân nội viện **có quá tải dịch (`mild`/`overt`)**, luật ngoại trú `hf.amt.loop_diuretic` (`priority: 92`, cùng `drugId: 'furosemide'`) thắng deduplication và **xóa mất hướng dẫn tiêm Furosemide tĩnh mạch + theo dõi Natri niệu 2h**! Ngược lại, khi bệnh nhân **đẳng tích (`euvolaemic`) đang sốc tim (`SBP = 78 mmHg`)**, `hf.inpatient.iv_diuretic` lại sống sót và ra lệnh **`START Furosemide tĩnh mạch`** gây tụt tiền tải trầm trọng!
  2. Trên cùng bệnh nhân sốc tim `SBP = 78 mmHg`, `hf.fmt.mra` (thiếu cổng SBP) vẫn ra lệnh **`START Spironolactone`**, `hf.fmt.sglt2i` vẫn ra lệnh **`START Dapagliflozin`**, `hf.inpatient.predischarge_fmt` ra lệnh khởi trị FMT trước xuất viện, và `hf.gdit.cardiac_rehab` ra lệnh **`START` tập thể lực phục hồi chức năng tim** (dù ESC 2026 nêu rõ tập luyện thể lực **chống chỉ định** trong DHF cấp).
- **Bằng chứng kiểm chứng:**
  - *Runtime Scenario 11 (`setting: 'inpatient'`, `sbp: 78`, `lvef: 25`, `nyha: 4`, `congestion: 'euvolaemic'`):* Xuất đồng thời `[emergency_shock_hypotension] REFER` VÀ `[rec_hf_inpatient_iv_furo] START furosemide tĩnh mạch`, `[rec_hf_mra] START spironolactone`, `[rec_hf_sglt2i] START dapagliflozin`, `[rec_hf_cardiac_rehab] START`, `[rec_hf_inpatient_predischarge] START`. Ngược lại ở Scenario 3 (`setting: 'inpatient'`, `congestion: 'overt'`), `[rec_hf_inpatient_iv_furo]` biến mất!
  - *PDF gốc:* **ESC 2026 Rec Table 9 (tr. 50):** *"Intravenous loop diuretics are recommended for all patients with DHF admitted with fluid overload to improve symptoms. Class I, Level C"*; **Section 11.4.2 (tr. 71):** *"Exercise training is contraindicated in patients with refractory/unstable angina and other high-risk CV conditions (e.g. high-grade arrhythmias, DHF, active thromboembolic disease)."*
- **Hướng khắc phục:** Đặt `hf.amt.loop_diuretic` chỉ cho `outpatient`; đặt `hf.inpatient.iv_diuretic` yêu cầu `congestion === 'mild' || congestion === 'overt'` và không sốc tụt HA nặng; thêm cổng `sbp >= 90` (ổn định huyết động) cho `hf.fmt.mra`, `hf.fmt.sglt2i`, `hf.inpatient.predischarge_fmt`, và chặn `START` tập luyện `hf.gdit.cardiac_rehab` khi đang DHF/sốc nội viện.

---

### [HF-R1-007] `critical` | `rule` | `hf.gdit.icd`
- **Vấn đề:** Luật `hf.gdit.icd` (`rules.ts` dòng 763–831) chỉ kiểm tra `ef <= 35` và `fmtMonths >= 3`, bỏ sót hoàn toàn phân độ NYHA, thời gian sau nhồi máu cơ tim, kỳ vọng sống > 1 năm và căn nguyên thiếu máu cục bộ:
  - Ra lệnh **`START ICD`** cho bệnh nhân **NYHA độ IV** — vi phạm trực tiếp khuyến cáo **Class III, Level C (Không khuyến cáo / Gây hại)** của ESC 2026!
  - Ra lệnh `START ICD` cho cả NYHA I không triệu chứng và bệnh nhân mới NMCT `< 40 ngày` (**Class III, Level B1**).
  - Gán cứng `Class I, Mức A` cho mọi bệnh nhân, trong khi ở ESC 2026 căn nguyên thiếu máu cục bộ là **`Class I, Level B1`** còn không thiếu máu cục bộ chỉ là **`Class IIa, Level B1`** (`CONSIDER`).
- **Bằng chứng kiểm chứng:**
  - *Runtime Scenario 8 (`nyha: 4`, `lvef: 28`, `fmtDurationMonths: 4`):* Xuất `[rec_hf_icd_start] START "Chỉ định cấy máy phá rung tự động (ICD) phòng ngừa tiên phát đột tử"`.
  - *PDF gốc:* **ESC 2026 Recommendation Table 6 (tr. 39):**
    - Ischaemic NYHA II/III, LVEF ≤ 35%, ≥ 3 months FMT, > 40 days post-MI, > 1 yr survival: **`Class I, Level B1`**.
    - Non-ischaemic NYHA II/III: **`Class IIa, Level B1`**.
    - Within 40 days of MI: **`Class III, Level B1`**.
    - *"ICD therapy is not recommended in patients in NYHA class IV with severe symptoms refractory to pharmacological therapy unless they are candidates for CRT, an LVAD, or cardiac transplantation. **Class III, Level C**."*
- **Hướng khắc phục:** Kiểm tra bắt buộc `nyha` (`nyha === 4` → `AVOID` Class III C; chỉ xét ở `nyha === 2 || nyha === 3`), kiểm tra `> 40 ngày` sau NMCT và kỳ vọng sống `> 1 năm`, tách căn nguyên thiếu máu cục bộ (`START` I B1) vs không thiếu máu cục bộ (`CONSIDER` IIa B1 ở INTL/VN; `START` 1 A ở US qua `profileDiff`).

---

### [HF-R1-008] `critical` | `rule` | `hf.fmt.mra, hf.fmt.bb`
- **Vấn đề:** Kê trùng lặp 2 thuốc cùng nhóm (**chống chỉ định tuyệt đối Spironolactone + Eplerenone** và trùng 2 thuốc chẹn beta) do hàm đọc liều chỉ kiểm tra 1 hoạt chất đại diện:
  - Trong `hf.fmt.mra` (`rules.ts` dòng 151): `onMra` nhận biết cả `spironolactone` và `eplerenone`, nhưng `currentDose` chỉ gọi `getCurrentMedDose(ctx, 'spironolactone')` (`= undefined` khi BN đang uống `eplerenone 50 mg`), khiến hệ thống ra lệnh **`UPTITRATE spironolactone`** chồng lên `eplerenone` đang dùng!
  - Trong `hf.fmt.bb` (`rules.ts` dòng 410): chỉ gọi `getCurrentMedDose(ctx, 'bisoprolol')`, khiến mọi bệnh nhân đang dùng `carvedilol 25 mg x 2`, `metoprolol_succinate 200 mg` hoặc `nebivolol 10 mg` đều bị ra lệnh **`UPTITRATE bisoprolol`** chồng lên thuốc BB hiện tại! Đồng thời thiếu kiểm tra hen phế quản (`conditions.asthma`) và bloc nhĩ thất độ II–III chưa đặt máy tạo nhịp.
- **Bằng chứng kiểm chứng:**
  - *Runtime Scenario 8 (`currentMeds: [{drugId: 'carvedilol', dose: '25'}, {drugId: 'eplerenone', dose: '50'}]`):* Xuất `[rec_hf_mra] UPTITRATE spironolactone` + `[rec_hf_bb] UPTITRATE bisoprolol` + `alerts: [dup_dup.mra (critical), dup_dup.bb (warning)]`.
  - *PDF gốc:* **FDA Label Aldactone, Section 4 Contraindications (PDF tr. 1, 5):** *"ALDACTONE is contraindicated in patients with: ... Concomitant use of eplerenone"*; **ESC 2026 Supp Table S6 (tr. 14):** Contraindications gồm AV block độ II–III và hen phế quản.
- **Hướng khắc phục:** Viết helper nhận diện đúng `drugId` đang dùng trong từng nhóm thuốc (`spironolactone` vs `eplerenone` vs `finerenone`; `bisoprolol` vs `carvedilol` vs `metoprolol_succinate` vs `nebivolol`), so sánh với liều đích riêng của chính hoạt chất đó và giữ nguyên `drugId` khi `CONTINUE`/`UPTITRATE`; thêm kiểm tra chống chỉ định hen phế quản / bloc AV.

---

## 5. Chi tiết 14 Phát hiện Mức `MAJOR` (`HF-R1-009` → `HF-R1-022`)

### 5.1. Bỏ sót Khuyến cáo Class I & Sai lệch Phân tầng Guideline (`HF-R1-009`, `010`, `016`, `017`, `018`)

1. **[HF-R1-009] (`missing`: `hf.fmt.mra, finerenone, hf.matrix.hfpef_renal`) — Bỏ sót trụ cột Class I A mới của ESC 2026 & ACC 2026 cho HFpEF (`Finerenone`):**
   - **ESC 2026 Rec Table 5 (tr. 37–38) & Table 6 (tr. 13):** Nâng MRA (`sMRA` cho HFrEF và `sMRA`/`nsMRA [finerenone]` cho HFpEF) lên **Class I, Level A** bất kể LVEF; liều `finerenone` theo `Table 11` chú thích `g` (tr. 37) & `Supp Table S8` (tr. 18): eGFR `25–≤60` khởi đầu `10 mg` → đích `20 mg` 1 lần/ngày; eGFR `> 60` khởi đầu `20 mg` → đích `40 mg` 1 lần/ngày (chống chỉ định khi eGFR `< 25`).
   - **ACC 2026 ECDP HFpEF, Section 5.1.2 & Table 4 (tr. 14):** Xếp `finerenone` (FDA phê duyệt 07/2025 cho HF LVEF ≥ 40%) là **MRA ưu tiên đầu tay (*MRA of choice*)** cho HFpEF và nêu rõ `eplerenone` chưa được nghiên cứu ở HFpEF.
   - Hiện tại `finerenone.json` chỉ có liều CKD tối đa 20 mg, `hf.fmt.mra` không hỗ trợ `finerenone`, gợi ý cả `eplerenone` cho HFpEF, còn `matrices.ts` dòng 180 ghi sai MRA ở HFpEF là `"Class IIb"`.

2. **[HF-R1-010] (`rule`: `hf.fmt.arni, bb, mra, sglt2i`) — Thiếu phân tầng HFmrEF (`LVEF 41–49%`) cho profile `VN` và `US`:**
   - **QĐ 1857/QĐ-BYT 2022 (`Bảng 1` tr. 7, `Mục II.3` tr. 19)** và **AHA/ACC 2022 (`Section 7.6.1` tr. 64)** định nghĩa HFrEF là `EF ≤ 40%` và HFmrEF là `EF 41–49%`, trong đó ARNI/ACEi/ARB, BB và sMRA chỉ ở mức **Class IIb (`CONSIDER`)**. Module hiện áp cứng ngưỡng `< 50%` của ESC 2026 cho cả `VN` và `US` mà không có `profileDiff`.

3. **[HF-R1-016] (`missing`: `hydralazine, isosorbide_dinitrate, hf.inpatient.vasodilator`) — Bỏ sót phác đồ Hydralazine + ISDN mạn tính (Class 1 A ở US) & dùng sai viên uống ISDN cho giãn mạch cấp nội viện:**
   - Bỏ sót hoàn toàn luật phối hợp `hydralazine + isosorbide_dinitrate` cho bệnh nhân da đen NYHA III–IV (**AHA/ACC 2022 COR 1, LOE A** tr. 46; **ESC 2026 Class IIa, Level B2** tr. 38) và cho bệnh nhân HFrEF không dung nạp cả ACEi/ARB/ARNI (**ESC 2026 Class IIb, Level C**; **BYT 1857** tr. 15), cũng như thiếu gợi ý thay thế khi `priorAngioedema === true`.
   - Ở nội viện, `hf.inpatient.vasodilator` (`rules.ts` dòng 1132) dùng sai thuốc uống mạn tính `isosorbide_dinitrate` (`20 mg x 3 lần/ngày`, dẫn chiếu `Table 11`) thay vì thuốc truyền tĩnh mạch `Nitroglycerine` (10–200 µg/phút) hoặc `Sodium nitroprusside` (0.3–5 µg/kg/phút) theo **ESC 2026 Supp Table S14 (tr. 25)**, và kích hoạt cả khi không có sung huyết (`euvolaemic`).

4. **[HF-R1-017] (`rule`: `hf.gdit.teer, esc.hf.2026.teer_indication`) — Trích dẫn nhầm Hở hai lá nguyên phát (Primary MR `IIa B`) thay vì Hở hai lá thứ phát cơ năng thất trái (Ventricular Secondary MR `Class I, Level B1`):**
   - `esc.hf.2026.teer_indication` chép câu Primary MR ở trang 62 (`Class IIa, Level B`), bỏ sót thay đổi trọng tâm của **ESC 2026 Recommendation Table 17 (tr. 64)** nâng M-TEER trong hở van hai lá thứ phát cơ năng thất trái lên **Class I, Level B1**, đồng thời thiếu tiêu chuẩn chọn bệnh bắt buộc của **Table 19 (tr. 63)**: `LVEF 20%–50%` (chặn dưới ≥ 20%), `NYHA ≥ II`, ổn định huyết động, `sPAP ≤ 70 mmHg`.

5. **[HF-R1-018] (`rule`: `hf.amt.digoxin, hf.amt.vericiguat, esc.hf.2026.digoxin_rec`) — Chép nhầm cột khuyến cáo cũ năm 2021 cho Digoxin & thiếu cổng an toàn của Vericiguat:**
   - `esc.hf.2026.digoxin_rec` chép cột bên trái (*"Recommendations in 2021"*: `IIb B`, chỉ nhịp xoang) của Table 6 trang 14 thay vì cột bên phải (*"Recommendations in 2026"*) và **Recommendation Table 5 (tr. 37)**: **`Class IIa, Level B1`** cho glycosid tim (`digoxin` hoặc `digitoxin`) ở HFrEF có triệu chứng, `LVEF ≤ 40%` dù đã tối ưu FMT.
   - Cả `digoxin` và `vericiguat` đều không kiểm tra nền FMT, `nyha >= 2` và `hasCurrentMed`; `vericiguat` thiếu chống chỉ định ức chế PDE5 (`sildenafil`, `tadalafil`), cảnh báo nitrat dài hạn, `SBP ≥ 100 mmHg`, và `profileDiff` US (`LVEF < 45%`).

---

### 5.2. Lỗi Logic Lâm sàng & Toán học trong Luật (`HF-R1-011`, `012`, `013`, `014`, `015`)

6. **[HF-R1-011] (`rule`: `hf.amt.iv_iron`) — Lỗi toán học `30 * 3 = 90` bỏ sót thiếu sắt ở Ferritin 90–99 µg/L & bỏ sót khuyến cáo Class I B1:**
   - Dòng 567 của `rules.ts` viết `ferritin < th('hf.mra.egfr_min_initiate') * 3` (`30 * 3 = 90`) và `tsat < th('hf.sglt2i.egfr_initiate_min')` (`20`) — vi phạm nghiêm trọng QA-8/QA-10. Kiểm chứng runtime Scenario 7 (`ferritin: 95`, `tsat: 24`, `lvef: 35`, `nyha: 2`): âm tính giả hoàn toàn! Ngoài ra bỏ sót khuyến cáo **Class I, Level B1** cải thiện triệu chứng/QoL của **ESC 2026 Rec Table 19 (tr. 67)** và thiếu kiểm tra `Hb < 15 g/dL`.

7. **[HF-R1-012] (`rule`: `hf.amt.ivabradine`) — Khuyên dùng Ivabradine ngay trên bệnh nhân mới chẩn đoán chưa dùng chẹn beta:**
   - Không kiểm tra bệnh nhân đã dùng chẹn beta liều đích/tối đa dung nạp hay chưa. Trên chính preset mặc định `hf_01_gdmt_default` (`currentMeds: []`, `hr: 72`), engine vừa phát `START Bisoprolol 1.25 mg` vừa phát `CONSIDER Ivabradine 5 mg x 2` với lý giải sai sự thật *"dù đã điều trị tối ưu chẹn beta"*!

8. **[HF-R1-013] (`rule`: `hf.gdit.crt`) — Chỉ định sai `START CRT (Class I)` với lý giải `"nhịp xoang"` ở bệnh nhân đang Rung nhĩ (`afib`):**
   - Không kiểm tra `rhythm === 'sinus'` và `nyha >= 2`. Ở Scenario 8 (`rhythm: 'afib'`, `qrsDuration: 160`, `qrsMorphology: 'lbbb'`), engine phát `START CRT (Class I)` trái với **ESC 2026 Rec Table 7 (tr. 41)** (chỉ áp dụng cho nhịp xoang; rung nhĩ ở `Rec Table 15` tr. 59 chỉ là `Class IIa, Level C` khi NYHA III–IV kèm đảm bảo tạo nhịp hai thất gần 100% / cắt đốt nút AV).

9. **[HF-R1-014] (`rule`: `hf.fmt.mra`) — Đánh đồng ngưỡng Kali khởi trị (`≤ 5.0`) với ngưỡng duy trì (`> 5.5` giảm liều, `> 6.0` ngưng):**
   - Bệnh nhân đang uống `spironolactone 25 mg` có `K+ = 5.2 mmol/L` (Scenario 14) bị phát lệnh `HOLD` ngưng thuốc sớm, trái với **ESC 2026 Supp Table S8 (tr. 18)**: chỉ giảm nửa liều khi `K+ > 5.5 mmol/L` và tạm ngưng ngay khi `K+ > 6.0 mmol/L` (hoặc `eGFR < 20`).

10. **[HF-R1-015] (`rule`: `hf.hfpef.glp1_obesity, semaglutide`) — Sai mức hành động (`START` cho Class IIa B1), bỏ sót `tirzepatide` đang dùng & lệch liều đích:**
    - Phát `START` thay vì `CONSIDER` cho khuyến cáo `Class IIa, Level B1` (**ESC 2026 Rec Table 18 tr. 65**); không nhận diện `tirzepatide` trong `currentMeds` nên ở Scenario 10 (`tirzepatide 10 mg`, NYHA I) phát lệnh lỗi `"CHUYỂN ĐỔI: Ngừng undefined để thay bằng Semaglutide"`; thiếu chống chỉ định MTC/MEN2 (**ACC 2026 Table 5 tr. 15**); lệch `target` trong `semaglutide.json` (`1 mg/tuần` vs `2.4 mg/tuần`).

---

### 5.3. Kiểm toán Trích dẫn, Ngưỡng số, Hồ sơ thuốc & Ma trận thận (`HF-R1-019` → `HF-R1-022`)

#### [HF-R1-019] Bảng kiểm toán 15/34 trích dẫn sai lệch trong `kb/citations/hf.json`

| Citation ID | Khai báo hiện tại trong `hf.json` | Đối chiếu nguyên văn PDF gốc | Lỗi phát hiện |
|---|---|---|---|
| `fda.hf.sacubitril_valsartan_k_5_4` | `page: 5, Section 5.5`, quote: *"Do not initiate if serum potassium is >5.4 mmol/L (per PARADIGM-HF protocol)"* | Toàn văn 51 trang `FDA_label_sacubitril_valsartan.pdf` **không hề có số `5.4`**; Section 5.5 nằm ở PDF tr. 9 chỉ ghi *"Monitor serum potassium periodically..."* | **Bịa câu trích dẫn** + sai trang PDF |
| `acc.hfpef.2026.glp1_obesity` | `page: 14, Section 4.3`, quote: *"Incretin-based therapies (semaglutide, tirzepatide) are recommended..."* | `ACC_2026_ECDP_HFpEF.pdf` không có câu này (mục đúng là `5.1.3` tr. 14–16 & `5.1.7` tr. 17: *"may be prescribed... to potentially reduce worsening HF events"*) | **Tự diễn giải thành quote giả** + sai mục/trang |
| `byt.2022.hf_doses` | `page: 16, Bảng 6`: chèn cụm *"(hoặc 24/26 mg ngày 2 lần ở một số bệnh nhân)"* | `BYT_1857` Bảng 6 tr. 16 chỉ in *"49/51 mg ngày 2 lần"* — `97/103 mg ngày 2 lần"* | **Tự chèn chữ không có trong văn bản Bộ Y tế** |
| `esc.hf.2026.mra_k_5_0_egfr_30` | `page: 18, Table S8`: quote ghi *"(creatinine >221 umol/L [>2.5 mg/dL] or eGFR <30)"* | Văn bản đó là của ESC 2021; **ESC 2026 Supp Table S8 tr. 18** đã đổi thành *"Steroidal MRA: eGFR <30... Non-steroidal MRA: eGFR <25"* | **Chép văn bản cũ năm 2021** |
| `esc.hf.2026.digoxin_rec` | `page: 14, Table 6`, `cor: IIb, loe: B` | Chép nhầm cột trái (*2021*) của Table 6; cột phải (*2026*) và **Rec Table 5 tr. 37** là **`Class IIa, LOE B1`** | **Chép cột cũ 2021 đã bãi bỏ** |
| `esc.hf.2026.teer_indication` | `page: 62, Section 9.3.3.1`, `cor: IIa, loe: B` (Primary MR) | Hở 2 lá thứ phát cơ năng thất trái nằm ở **Rec Table 17 tr. 64**: **`Class I, LOE B1`** | **Nhầm bệnh lý (Primary vs Secondary MR)** |
| `esc.hf.2026.crt_reassessment` & `crt_lbbb_qrs_150` | `page: 11, Table 3`, `cor: I, loe: A`, quote chứa chữ *"IIb C"* ở cuối | Bảng ở tr. 11 là **Table 5** (không phải Table 3) và dòng được chép là khuyến cáo lập kế hoạch mức **`IIb C`**; bảng CRT chính là **Rec Table 7 tr. 41** | **Sai bảng + râu ông nọ cắm cằm bà kia (`IIb C` gắn mác `I A`)** |
| `esc.hf.2026.glp1_obesity` | `page: 65, Rec Table 18`, `cor: IIa, loe: A`; `quoteVi` thêm *"giảm nguy cơ nhập viện suy tim"* | **Rec Table 18 tr. 65** ghi **`LOE B1`** và chỉ nêu giảm cân, cải thiện gắng sức & QoL (không có giảm HFH trong khuyến cáo) | **Sai LOE (`A` → `B1`) + dịch thêm lợi ích không có trong bảng** |
| `esc.hf.2026.iron_rec` | `page: 67, Rec Table 19`, `cor: IIa, loe: A` | **Rec Table 19 tr. 67** có **`Class I, LOE B1`** (triệu chứng/QoL) và **`Class IIa, LOE B1`** (giảm HFH) | **Bỏ sót Class I + sai LOE (`A` → `B1`)** |
| `esc.hf.2026.icd_primary_prevention` | `page: 39, Rec Table 6`, `cor: I, loe: A` | **Rec Table 6 tr. 39** là **`Class I, LOE B1`** (ischaemic) và **`Class IIa, LOE B1`** (non-ischaemic) | **Sai LOE (`A` → `B1`)** |
| `esc.hf.2026.rehab_indication` | `page: 12, Section 11`, `cor: I, loe: A` | Trang 12 là **Table 5** (Rec chính là **Rec Table 24 tr. 72**), mức bằng chứng là **`LOE B1`** | **Sai locator + sai LOE (`A` → `B1`)** |
| `esc.hf.2026.acute_diuretic_protocol` | `page: 50, Rec Table 9`, `cor: IIa, loe: B` | Dòng định lượng Natri niệu trong **Rec Table 9 tr. 50** là **`Class IIb, LOE B1`** | **Nâng khống COR/LOE (`IIb B1` → `IIa B`)** |
| `esc.hf.2026.acute_predischarge_fmt` & `acute_vasodilators` | `I B` (tr. 53) & `IIb B` (tr. 50) | **Rec Table 11 tr. 53** là **`I B2`**; **Rec Table 9 tr. 50** là **`IIb C`** | **Sai LOE (`B2`/`C` → `B`)** |
| `esc.hf.2026.acute_bb_hypoperfusion` | `page: 54, Rec Table 9`, `cor: IIa, loe: B` | Ở trang 54 là **Recommendation Table 12** (sốc tim), mức bằng chứng là **`LOE C`** | **Sai tên bảng + sai LOE (`C` → `B`)** |
| `fda.hf.sacubitril_valsartan_renal` & `spironolactone_egfr_30_50` | `page: 3` (Entresto Sec 2.4) & `page: 2` (Aldactone Sec 2.2) | Trong file PDF gốc, Entresto Sec 2.4 nằm ở **PDF tr. 7** (2.6 ở tr. 7–8); Aldactone Sec 2.2 nằm ở **PDF tr. 5**; ngoài ra `esc.hf.2026.pregnancy_contra` tr. 13 thuộc **Table 5** (Rec Table 27 ở tr. 74), không phải `Section 13` | **Sai trang PDF / sai locator** |

#### [HF-R1-020] `threshold` — Gian lận / gán sai trích dẫn ngưỡng số trong `kb/thresholds/hf.json` (vi phạm QA-7)
- `hf.digoxin.ef_max` (`value: 40`, `%`) dẫn chiếu `esc.hf.2026.icd_primary_prevention` — nơi con số `40` là **`>40 days after the MI` (40 ngày sau NMCT)** chứ hoàn toàn không phải LVEF 40%!
- `hf.arni.sbp_low_dose` (`value: 110`, `mmHg`) dẫn chiếu `esc.hf.2026.acute_vasodilators` (truyền giãn mạch cấp nội viện) thay vì `ESC 2026 Supp Table S5` (tr. 13: SBP 100–110 mmHg).
- `hf.arni.sbp_min` (`value: 100`, `mmHg`) dẫn chiếu quote không chứa số `100`, và mâu thuẫn với `ESC 2026 Supp Table S5` (tr. 12) quy định chống chỉ định ARNI ở **`SBP < 90 mmHg`**.
- `hf.digoxin.hr_min` (`50 bpm`) dẫn chiếu bảng chẹn beta `bb_guidance_table_s6`; `hf.teer.ef_max` (`50%`) dẫn chiếu định nghĩa HFrEF chung thay vì `Table 19` (tr. 63: `LVEF 20%–50%`).

#### [HF-R1-021] `drug` — Gán chéo trích dẫn sai ngữ cảnh trên 14/17 hồ sơ thuốc trong `kb/drugs/*.json`
- Nghiêm trọng nhất: `kb/drugs/hydralazine.json` gắn `esc.hf.2026.loop_diuretics_chronic` (khuyến cáo lợi tiểu quai!) cho toàn bộ chỉnh liều thận, chống chỉ định, thai kỳ và cho con bú; cả 4 thuốc chẹn beta gắn `bb_guidance_table_s6` cho thai kỳ/cho con bú (dù `Table S6` không có chữ nào về thai kỳ và đánh đồng `carvedilol` với `bisoprolol` trái ngược `Rec Table 27` tr. 74); tương tự ở `ferric_carboxymaltose`, `ferric_derisomaltose`, `digoxin`, `vericiguat`, `ivabradine`, `isosorbide_dinitrate`, `furosemide`, `torsemide`, `bumetanide`.

#### [HF-R1-022] `matrix` — Lạm dụng ngưỡng SGLT2i cho cột G5 của ARNI, lách linter `${'...'}` & lặp đôi chuỗi liều
- `matrices.ts` dòng 87 (`arni_renal.g5`) viết `eGFR dưới ${th('hf.sglt2i.egfr_initiate_min')}` (`= 20`) nhưng lại gắn trích dẫn `eGFR < 30`; các dòng 78, 84, 138–143, 196–201 dùng biểu thức `${'24/26 mg uống 2 lần/ngày'}` để lách kiểm tra hardcode số; hàm `drugDose()` ghép lặp đôi hàm lượng/đường dùng trên giao diện.

---

## 6. Các Phát hiện Mức `MINOR` & `SUGGESTION` (`HF-R1-023` → `HF-R1-025`)

- **[HF-R1-023] (`minor` | `ui` | `docs/modules/HF.md`, `tests/golden/hf/hf_30_hfpef_general_sglt2i.json`):** `HF.md` ghi sai số lượng *"68 ngưỡng số và 86 trích dẫn"* (thực tế: 29 ngưỡng, 34 trích dẫn) và vẫn mô tả MRA ở HFpEF là `Class IIb` (trái ESC 2026 `Class I A`); golden test `hf_30` thiếu kiểm tra `mustNotInclude` đối với `sacubitril_valsartan` và `bisoprolol`, khiến lỗi kê nhầm thuốc HFrEF cho HFpEF (`HF-R1-001`) lọt qua bộ test!
- **[HF-R1-024] (`minor` | `missing` | `hf.safety.contra_meds_hfref`, `hf.fmt.sglt2i`):** Thiếu chặn SGLT2i ở bệnh nhân **Đái tháo đường típ 1** (`ESC 2026 Supp Table S9` tr. 19; `ACC 2026 Table 5` tr. 15) và thiếu luật phát cảnh báo `STOP`/`AVOID` (Class III – Harm) khi bệnh nhân HFrEF đang dùng `diltiazem`, `verapamil`, `pioglitazone`, NSAIDs, thuốc chống loạn nhịp nhóm IC (`flecainide`, `propafenone`) hoặc `dronedarone` (`ESC 2026 Rec Table 10` tr. 42; `AHA 2022 Section 7.3.7` tr. 49).
- **[HF-R1-025] (`suggestion` | `ui` | `src/modules/hf/pathways.ts`):** Đề xuất bổ sung lưu đồ `hf.pathway.chronic_hfpef` (chẩn đoán siêu âm Table 10 → 2 trụ cột FMT Class I [SGLT2i + Finerenone/Spironolactone] → GLP-1/GIP-GLP-1 RA khi BMI ≥ 30 → loại trừ bệnh cơ tim amyloid theo cờ đỏ Table 20) và cập nhật M-TEER (`Class I B1`) vào bước GDIT của `hf.pathway.chronic_hfref`.

---

## 7. Kết luận Kiểm định Vòng 1 (Vai R1)

Theo quy định tại `docs/REVIEW_PROTOCOL.md` (*"PASS = 0 critical, 0 major"*), với **8 phát hiện `critical`** và **14 phát hiện `major`** đã được chứng minh bằng cả kiểm chứng runtime `evaluate()` lẫn đối chiếu nguyên văn trang PDF nguồn:

**KẾT LUẬN CUỐI CÙNG: FAIL**
