# GDMT-VN – Brief chung cho mọi subagent

> Cập nhật 28/10/2026: đọc [plan khắc phục đang áp dụng](REMEDIATION_PLAN_20261028.md), [trạng thái hiện hành](PROJECT_STATUS.md) và [audit nguồn](SOURCE_AUDIT_20261028.md) trước. Plan đầy đủ bên dưới là đặc tả nền/lịch sử; dùng AGENTS hiện hành cho điều phối/model và các cổng nghiệm thu mới trong plan khắc phục.

Plan đầy đủ (ĐỌC TRƯỚC): `C:\Users\hades\.gemini\antigravity-cli\brain\0f54319f-5bb3-43d1-bb51-c65d64d9fc60\implementation_plan.md`

## Mục tiêu
PWA tiếng Việt kiểu https://www.gdmt.org cho 9 bệnh mạn tính (CKD, ĐTĐ2, THA, COPD, Hen, Gút, Suy tim, Lipid, Rung nhĩ), một engine + một hồ sơ BN dùng chung. Chạy LAN, responsive desktop + điện thoại, offline. Không backend, không gửi dữ liệu BN.

## Quyết định đã chốt
- Thư mục dự án: `C:\Users\hades\OneDrive\Desktop\New folder (4)\gdmt-vn`
- Stack: Vite 7 + React 18 + TypeScript 5.9 (strict) + Vitest + vite-plugin-pwa. Giữ dependency tối thiểu.
- UI tiếng Việt 100%. Trích dẫn giữ NGUYÊN VĂN ngôn ngữ gốc + `quoteVi` dịch tham khảo.
- Đơn vị mặc định VN: Creatinin µmol/L, glucose mmol/L, lipid mmol/L, urat µmol/L, UACR mg/mmol (toggle mg/dL, mg/g).
- Profile mặc định: Quốc tế (INTL); profile VN (BYT/Hội VN), US (ACC/AHA) là tùy chọn.
- SCORE2: vùng "nguy cơ cao" mặc định.
- Trẻ em/thai kỳ: ngoài phạm vi 1.0.
- Thư viện PDF: `C:\Users\hades\OneDrive\Desktop\Medical_Library_2026` (env `GDMT_LIBRARY`).
- Dự án tham chiếu để tái sử dụng (CHỈ ĐỌC, KHÔNG SỬA): `C:\Users\hades\OneDrive\Desktop\New folder (4)\on-call`

## Quy tắc phân quyền thư mục (tránh ghi đè lẫn nhau)
| Agent | Được ghi |
|---|---|
| A – Nguồn tài liệu | `Medical_Library_2026/**` (thêm file mới, cập nhật 00_INDEX), `gdmt-vn/docs/SOURCES_STATUS.md` |
| B – App shell & engine core | `gdmt-vn/` gốc (package.json, configs, index.html), `src/ui/**`, `src/engine/*.ts` (trừ `calculators/`), `src/engine/safety/**`, `src/modules/_demo/**`, `public/**`, `tests/ui/**`, `tests/engine/**` |
| C – Công cụ KB | `gdmt-vn/tools/kb/**`, `gdmt-vn/kb/**` (dữ liệu mẫu), `src/kb-types/**` (kiểu TS Source/Citation/DrugEntry/ReviewState – B import từ đây), `tests/kb/**` |
| D – Máy tính lâm sàng | `src/engine/calculators/**`, `tests/calculators/**` |

Cần sửa file ngoài vùng của mình → ghi đề xuất vào `gdmt-vn/docs/REQUESTS.md` (append) và báo agent điều phối.
KHÔNG chạy `npm install` thêm package ngoài danh sách nếu không phải agent B; agent khác cần package → ghi vào REQUESTS.md.

## Tiêu chuẩn chất lượng
- TypeScript strict, không `any` tùy tiện; hàm engine thuần (không side effect).
- Mọi ngưỡng lâm sàng phải truy được về trích dẫn (Citation) – không bịa số.
- Có test Vitest cho mọi thứ viết ra; `npx tsc --noEmit` và `npx vitest run` phải xanh trước khi báo xong.
- Báo cáo cuối: danh sách file, lệnh kiểm tra đã chạy + kết quả, việc còn dang dở, rủi ro.


---

# GIAI ĐOẠN 1–2 (từ 27/10/2026): Module CKD · ĐTĐ2 · Suy tim

## Phân quyền mới
| Agent | Được ghi |
|---|---|
| B – App shell | như cũ + `src/modules/registry.ts` (tự nạp mọi `src/modules/*/index.ts` bằng `import.meta.glob`, bỏ `_demo` khỏi mặc định) |
| E – Module CKD | `src/modules/ckd/**`, `kb/citations/ckd/**`, `kb/thresholds/ckd/**`, `kb/drugs/` các thuốc: SGLT2i (dapagliflozin, empagliflozin, canagliflozin), ACEi (enalapril, perindopril, lisinopril, ramipril, captopril), ARB (losartan, valsartan, telmisartan, irbesartan, candesartan), finerenone, chất gắn K (patiromer, SZC, calcium polystyrene sulfonate), natri bicarbonat; `tests/golden/ckd/**`, `tests/modules/ckd/**` |
| F – Module ĐTĐ2 | `src/modules/dm2/**`, `kb/citations/dm2/**`, `kb/thresholds/dm2/**`, `kb/drugs/`: metformin, GLP-1 RA (semaglutide sc/uống, dulaglutide, liraglutide), tirzepatide, DPP-4i (sitagliptin, linagliptin, vildagliptin, saxagliptin), SU (gliclazide MR, glimepiride), pioglitazone, acarbose, insulin (glargine, degludec, detemir, NPH, aspart, lispro, premix); `tests/golden/dm2/**`, `tests/modules/dm2/**` |
| G – Module Suy tim | `src/modules/hf/**`, `kb/citations/hf/**`, `kb/thresholds/hf/**`, `kb/drugs/`: sacubitril-valsartan, bisoprolol, carvedilol, metoprolol succinate, nebivolol, spironolactone, eplerenone, ivabradine, vericiguat, digoxin, furosemide, torsemide, bumetanide, hydralazine, isosorbide dinitrate, ferric carboxymaltose, ferric derisomaltose; `tests/golden/hf/**`, `tests/modules/hf/**` |

- File thuốc: `kb/drugs/<drugId>.json` (một thuốc một file). Cần thêm trích dẫn/renal band cho thuốc agent khác sở hữu (vd. ĐTĐ cần SGLT2i) → **không sửa file**, ghi vào `docs/REQUESTS.md`; module của mình chỉ tham chiếu `drugId`.
- Nguồn: `kb/sources.json` là file dùng chung → chỉ **append** source mới với id duy nhất `<org>-<year>-<topic>` (vd. `kdigo-2024-ckd`), không sửa/xóa source của người khác. Danh sách tài liệu + đường dẫn local: `docs/SOURCES_STATUS.md`. Text đã trích: `Medical_Library_2026/00_INDEX/_text_cache` và `on-call/tools/m12/.cache`.
- Mỗi module export `ModuleDefinition` từ `src/modules/<id>/index.ts` (xem `src/engine/types.ts`, mẫu `src/modules/_demo`). Luật tham chiếu ID Threshold/Citation/Drug – **không hardcode số lâm sàng trong luật**.
- Trạng thái review khởi tạo `draft`/`auto_checked`; TUYỆT ĐỐI không tự gán `ai_cross_checked`/`ai_multi_reviewed` (do agent review độc lập gán sau).
- Text tiếng Việt trong PDF BYT trích bằng pypdf có thể vỡ dấu → nếu quote VN không khớp được, ghi nhận trong báo cáo, ưu tiên quote nguồn quốc tế; không "sửa" quote cho khớp.


---

# GIAI ĐOẠN 3–5 (từ 27/10/2026 06:55): THA · Lipid · Rung nhĩ · Gút · COPD · Hen

| Agent | Module | Thuốc sở hữu (`kb/drugs/<id>.json`) |
|---|---|---|
| H | `htn` Tăng huyết áp | amlodipine, nifedipine (LA/GITS), felodipine, lercanidipine, indapamide, hydrochlorothiazide, chlorthalidone, doxazosin, methyldopa, clonidine, moxonidine; IV: nicardipine, labetalol, nitroglycerin, urapidil, esmolol, sodium nitroprusside, clevidipine |
| I | `lipid` Rối loạn lipid | atorvastatin, rosuvastatin, simvastatin, pravastatin, pitavastatin, ezetimibe, evolocumab, alirocumab, inclisiran, bempedoic_acid, fenofibrate, icosapent_ethyl, omega3 |
| J | `af` Rung nhĩ | apixaban, rivaroxaban, dabigatran, edoxaban, warfarin, amiodarone, dronedarone, flecainide, propafenone, sotalol, diltiazem, verapamil (digoxin, BB do G sở hữu) |
| K | `gout` Gút | allopurinol, febuxostat, colchicine, probenecid, benzbromarone, naproxen, ibuprofen, diclofenac, etoricoxib, celecoxib, indomethacin |
| L | `copd` COPD | tiotropium, umeclidinium, glycopyrronium, aclidinium, indacaterol, olodaterol, salmeterol, vilanterol (đơn), các phối hợp LAMA-LABA và ba thuốc (ICS-LAMA-LABA), roflumilast, azithromycin (dự phòng), dupilumab, mepolizumab, theophylline |
| M | `asthma` Hen | budesonide, fluticasone_propionate, fluticasone_furoate, beclometasone, mometasone, ciclesonide, budesonide_formoterol, beclometasone_formoterol, fluticasone_salmeterol, fluticasone_vilanterol, mometasone_formoterol, salbutamol, terbutaline, ipratropium, montelukast, omalizumab, benralizumab, tezepelumab, prednisolone, methylprednisolone, magnesium_sulfate |

Quy tắc như Giai đoạn 1–2 (vùng ghi: `src/modules/<id>/**`, `kb/citations/<id>/**` hoặc `kb/citations/<id>.json`, `kb/thresholds/<id>…`, thuốc mình sở hữu, `tests/golden/<id>/**`, `tests/modules/<id>/**`, `docs/modules/<ID>.md`). BẮT BUỘC đọc `docs/MODULE_CONTRACT.md` (mục 1.1 fail-closed) và `docs/QA_FINDINGS.md`. `verify:kb` có linter `rulesLint` – module mới phải 0 `CLINICAL_DEFAULT_NUMBER` và 0 `LITERAL_CLINICAL_THRESHOLD`.
