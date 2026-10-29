# Báo cáo Phản biện An toàn Lâm sàng Độc lập — Module Suy tim (`hf`) — Vòng 1 (R3)

- **Vai trò:** R3 – Phản biện an toàn đối kháng (Adversarial Clinical Safety Tester)
- **Module kiểm định:** Suy tim (`src/modules/hf/**`, phối hợp kiểm định xuyên tầng `src/engine/**` và `kb/**`)
- **Vòng duyệt:** Vòng 1 (Độc lập hoàn toàn — không đọc báo cáo của R1 và R2)
- **Phương pháp thực nghiệm:** Thiết kế và chạy trực tiếp **62 kịch bản bệnh nhân đối nghịch (`ADV_HF_01` → `ADV_HF_62`)**, **5 Presets** và **2 Bảng Ma trận** qua hàm `evaluate()` thật của Engine (sử dụng Vite SSR module loader nạp nguyên bản `import.meta.glob` mà không chỉnh sửa bất kỳ dòng code nào của hệ thống).
- **Tệp thực thi & bằng chứng gốc:**
  - Script kiểm thử: `docs/reviews/hf/scratch/r3_argon_adversarial.ts`
  - Kết quả JSON nguyên bản: `docs/reviews/hf/scratch/r3_argon_results.json`
  - Danh sách phát hiện chuẩn hóa: `docs/reviews/hf/round1_R3.json`

---

## 1. Tóm tắt Kết quả Kiểm định

| Mức độ nghiêm trọng (`severity`) | Số lượng | Ý nghĩa lâm sàng theo `REVIEW_PROTOCOL.md` |
|---|---:|---|
| **Critical** | **13** | Có thể gây nguy hiểm tính mạng / tổn thương nặng cho bệnh nhân nếu bác sĩ thực hiện theo y lệnh của máy |
| **Major** | **7** | Sai lệch phác đồ hướng dẫn (ESC 2026 / AHA 2022 / BYT 1857), sai liều khởi trị, sai chỉ định thiết bị cấy ghép hoặc sai bệnh án điện tử |
| **Minor** | **3** | Rò rỉ mã trích dẫn `TODO:*`, hiển thị câu chữ/liều lặp rườm rà trên UI, thiếu nhắc nhập BMI ở HFpEF |
| **Suggestion** | **1** | Đề xuất bổ sung phác đồ cứu cánh Hydralazine + ISDN ngoại trú và thuốc gắn kali (Patiromer/SZC) |
| **Tổng cộng** | **24** | **Kết luận Vòng 1: `FAIL`** (yêu cầu PASS: `0 critical`, `0 major`) |

---

## 2. Tổng quan Kết quả Chạy Thực tế 62 Kịch bản Đối kháng (`evaluate()`)

| Nhóm kiểm thử | Kịch bản (`ADV_HF_*`) | Nội dung thử thách an toàn | Kết quả thực tế từ `evaluate()` | Đánh giá |
|---|---|---|---|---|
| **Nhóm 1: Thiếu dữ liệu & Fail-Closed** | `ADV_HF_01` | `lvef = undefined` | Kê mù quáng `[START]` cả 4 trụ cột HFrEF (ARNI, BB, MRA, SGLT2i); không sinh `missing_input_lvef` | **FAIL (`R3-HF-01`)** |
| | `ADV_HF_02` | `sbp = undefined` | Kê `[START]` Dapagliflozin, Spironolactone, Furosemide khi chưa biết huyết áp | **FAIL (`R3-HF-05`)** |
| | `ADV_HF_03` | `k = undefined` | Chặn được MRA, nhưng **lọt `[START] sacubitril_valsartan 49/51 mg x 2`** không cần K+ | **FAIL (`R3-HF-09`)** |
| | `ADV_HF_04` | `scr = undefined` (74 tuổi) | **Lọt `[START] sacubitril_valsartan 49/51 mg x 2`** và **`[CONSIDER] digoxin 0.125 mg`** khi mù eGFR | **FAIL (`R3-HF-09`)** |
| | `ADV_HF_05` | `hr = undefined` (Rung nhĩ) | Chặn được BB, nhưng **lọt `[CONSIDER] digoxin 0.125 mg`** khi mù nhịp tim | **FAIL (`R3-HF-09`)** |
| | `ADV_HF_06` | `nyha = undefined`, `rhythm = undefined` | Mặc định NYHA II–III & mặc định `(xoang)` -> phát **`[START]` ICD & CRT Class I**; `noteText` bịa `(xoang)` và mất LVEF | **FAIL (`R3-HF-09`, `R3-HF-20`)** |
| | `ADV_HF_07` | Hồ sơ rỗng toàn bộ sinh hiệu & XN | Chặn được thuốc, nhưng vẫn phát **`[START] rec_hf_cardiac_rehab`** (tập thể lực) | **FAIL (`R3-HF-04`)** |
| | `ADV_HF_08` | HFpEF thuần túy (`LVEF = 60%`), thiếu BMI | Kê **`[START]` Bisoprolol, ARNI, Spironolactone** như HFrEF Class I; không nhắc nhập BMI | **FAIL (`R3-HF-01`, `R3-HF-23`)** |
| | `ADV_HF_09` | `Ferritin = 95 µg/L` (< 100!), `TSAT = 24%` | **Bỏ sót hoàn toàn thiếu sắt tuyệt đối** do code nhân nhầm `30 * 3 = 90` | **FAIL (`R3-HF-13`)** |
| **Nhóm 2A: Biên Huyết áp (`SBP`)** | `ADV_HF_10` | `SBP = 75 mmHg` (Sốc tim) | Có `REFER` sốc, nhưng vẫn kê **`[START]` Spironolactone, Furosemide, Tập thể lực** & **`[CONSIDER]` Vericiguat** | **FAIL (`R3-HF-05`)** |
| | `ADV_HF_11` | `SBP = 85 mmHg` (đang dùng 4 thuốc) | Kê **`[UPTITRATE]` Spironolactone 50 mg**, **`[CONTINUE]` Dapagliflozin & Vericiguat** | **FAIL (`R3-HF-05`)** |
| | `ADV_HF_12..14` | `SBP = 89, 90, 95 mmHg` | Biên BB (90) và SGLT2i (95) hoạt động đúng, nhưng **MRA vẫn `START` ở SBP 89** và **Vericiguat vẫn `CONSIDER` ở SBP 89–95** (< 100) | **FAIL (`R3-HF-05`)** |
| | `ADV_HF_15` | `SBP = 100 mmHg` | Cho phép `START` ARNI đúng liều thấp `24/26 mg x 2 lần/ngày` | **PASS** |
| **Nhóm 2B: Biên Kali máu (`K+`)** | `ADV_HF_16, 17` | `K+ = 5.0` vs `5.1 mmol/L` | MRA mở ở `5.0` và `HOLD` chính xác ở `5.1 mmol/L` (nhưng ARNI ở BN RASi-naïve kê cao `49/51 mg`) | **Major (`R3-HF-19`)** |
| | `ADV_HF_18, 19` | `K+ = 5.5 mmol/L` (naïve & đang dùng) | **`[START]` và `[UPTITRATE]` ARNI lên 97/103 mg ngay khi K+ = 5.5** kèm 2 cổng K+ tự mâu thuẫn | **FAIL (`R3-HF-08`)** |
| | `ADV_HF_20` | `K+ = 5.6 mmol/L` (Enalapril + MRA) | `HOLD` đúng cả MRA, ARNI, Enalapril; rò rỉ `TODO:kdigo2024_potassium_gates` | **Minor (`R3-HF-21`)** |
| | `ADV_HF_21` | `K+ = 6.2 mmol/L` (ngoại trú) | **`STOP = 0`, `REFER = 0`** (`gates.ts` hạ `STOP` xuống `HOLD`); vẫn kê `[START]` tập thể lực! | **FAIL (`R3-HF-08`)** |
| | `ADV_HF_22` | `K+ = 6.8 mmol/L` (tăng K+ ác tính) | Có `REFER`, nhưng **`STOP = 0`** (ARNI & MRA bị hạ thành `HOLD`); vẫn kê `[START]` BB, SGLT2i, tập thể lực! | **FAIL (`R3-HF-08`)** |
| **Nhóm 2C: Biên Nhịp tim (`HR`)** | `ADV_HF_23` | `HR = 38 bpm` (nhịp chậm nguy kịch) | `HOLD` BB & `REFER`, nhưng **gợi ý thêm `[CONSIDER] digoxin 0.125 mg`** và `[START]` tập thể lực! | **FAIL (`R3-HF-09`)** |
| | `ADV_HF_24` | `HR = 48 bpm` (đang dùng BB + Iva + Dig) | `HOLD` chính xác cả 3 thuốc làm chậm nhịp (`bisoprolol`, `ivabradine`, `digoxin`) | **PASS** (trừ `TODO` cit) |
| | `ADV_HF_25` | `HR = 50 bpm` | Sinh 2 cổng HR mâu thuẫn trên cùng thẻ BB (`50 ≥ 50: passed` vs `50 < 55: hold`) | **Major (`R3-HF-18`)** |
| | `ADV_HF_26` | `HR = 69 bpm` (đang dùng BB 10 mg) | Không gợi ý Ivabradine (`69 < 70 bpm`) | **PASS** |
| | `ADV_HF_27` | `HR = 70 bpm`, **chưa từng dùng BB** | Kê đồng thời `[START]` Bisoprolol VÀ **`[CONSIDER]` Ivabradine** trước khi chuẩn độ BB | **Major (`R3-HF-17`)** |
| | `ADV_HF_28` | `HR = 155 bpm` + phù phổi cấp ngoại trú | Có `REFER`, nhưng vẫn kê **`[START]` Bisoprolol uống & `[START]` tập thể lực** | **FAIL (`R3-HF-04`)** |
| **Nhóm 2D: Biên Thận (`eGFR`)** | `ADV_HF_29` | `eGFR = 12` + `onDialysis = true` | **`[CONTINUE]` Dapagliflozin**, **`[START]` ARNI**, **`[CONSIDER]` Digoxin 0.125 mg** ở BN lọc máu! | **FAIL (`R3-HF-11`)** |
| | `ADV_HF_30..34` | `eGFR = 19, 20, 29, 30, 44` | Biên SGLT2i (`19` HOLD / `20` START) và MRA (`29` HOLD / `30` START 12.5 mg) đúng; nhưng **`eGFR = 19` vẫn gợi ý Digoxin 0.125 mg** | **FAIL (`R3-HF-11`)** |
| **Nhóm 3: Xung đột `currentMeds` & Đa bệnh** | `ADV_HF_35..37` | `enalapril` / `losartan` -> ARNI | Không bật `takingAcei`: Gate báo không dùng ACEi + bắn `dup.rasi_arni`; bật `takingAcei`: mất lệnh ngừng Enalapril; ARB bị ép washout 36h sai | **Major (`R3-HF-14`)** |
| | `ADV_HF_38` | HF + CKD + ĐTĐ2 đang dùng `spironolactone` | Phát lệnh **`[SWITCH]` Ngừng Spironolactone để thay bằng Finerenone** ở HFrEF LVEF 28%! | **FAIL (`R3-HF-06`)** |
| | `ADV_HF_39` | HF + CKD + THA đang dùng `sacubitril_valsartan` | Phát lệnh **`[SWITCH]` Ngừng Sacubitril/Valsartan để thay bằng Perindopril** (mất ARNI + nguy cơ phù mạch)! | **FAIL (`R3-HF-06`)** |
| | `ADV_HF_40` | HFrEF đang dùng `diltiazem` + `verapamil` | **`STOP = 0`**, lại còn kê **`[START]` Bisoprolol** đè lên Diltiazem + Verapamil! | **FAIL (`R3-HF-07`)** |
| | `ADV_HF_41..44` | `pioglitazone`, `saxagliptin`, `ibuprofen`, `flecainide`, `dronedarone` | **`STOP = 0`** ở tất cả các ca; `saxagliptin`, `flecainide`, `dronedarone` còn **`alerts = []` im lặng hoàn toàn**! | **FAIL (`R3-HF-07`)** |
| | `ADV_HF_45, 46` | `sildenafil`/`tadalafil` + Nitrat TM / `vericiguat` | Kê **`[CONSIDER]` Nitroglycerin/ISDN TM** và **`[CONSIDER]` Vericiguat** với `alerts = []`, `STOP = 0`! | **FAIL (`R3-HF-03`)** |
| | `ADV_HF_47, 48` | Rung nhĩ HR 82 + HFrEF (naïve vs đang dùng Ivabradine) | Chặn đúng Ivabradine mới (`47`), nhưng **không `STOP` Ivabradine đang uống (`48`)**; CRT ở AFib ghi khống `"nhịp xoang"` (`47`) | **FAIL (`R3-HF-07`, `R3-HF-16`)** |
| | `ADV_HF_49, 50` | Hen phế quản + HFrEF (naïve vs đang dùng `carvedilol`) | Gợi ý tên **`Carvedilol`** cho BN hen (`49`); **không `STOP` Carvedilol** mà kê chồng `[UPTITRATE]` Bisoprolol (`50`) | **FAIL (`R3-HF-10`)** |
| **Nhóm 4: Thai kỳ** | `ADV_HF_51..53` | Thai phụ HFrEF (naïve & đang dùng 7 thuốc) & HFpEF (`semaglutide`) | Kê `[START]` Bisoprolol, **`[CONSIDER]`/`[CONTINUE]` Ivabradine & Vericiguat**, **`[CONTINUE]` Semaglutide**; hạ `STOP` của ARNI/ACEi/ARB/MRA/SGLT2i thành `AVOID` (`STOP = 0`) | **FAIL (`R3-HF-02`)** |
| **Nhóm 5: Sốc tim & Phù phổi cấp** | `ADV_HF_54..56` | Phù phổi cấp NYHA IV & Sốc tim `SBP 78` đẳng thể tích | **`[START]` và `[UPTITRATE]` Bisoprolol giữa phù phổi cấp**; **`[START]` Furosemide TM liều cao trong sốc tim đẳng thể tích**! | **FAIL (`R3-HF-04`)** |
| **Nhóm 6: Đang dùng liều đích & CCĐ ICD** | `ADV_HF_57, 58` | Đã đạt liều đích (`"10 mg"`, `200`, `"50 mg"`, Carvedilol 25 bid, Eplerenone 50, Iva 7.5, Veri 10) | Kê **`[UPTITRATE]` quá liều tối đa**, kê chồng BB/MRA thứ 2, và **tự cắt giảm 75% liều Vericiguat (10 -> 2.5 mg)**! | **FAIL (`R3-HF-12`)** |
| | `ADV_HF_59` | NYHA IV kháng trị + Mới NMCT cấp (`recentAcs`) | Vẫn phát **`[START]` cấy ICD dự phòng tiên phát** trái chống chỉ định Class III | **Major (`R3-HF-16`)** |
| **Nhóm 7: Chuyển Profile LVEF 45%** | `ADV_HF_60..62` | `INTL` vs `US` vs `VN` tại `LVEF = 45%`, `BMI = 32` | `US` & `VN` vẫn kê `START` Class I cho ARNI/BB/MRA ở HFmrEF (thay vì `CONSIDER` Class IIb); vừa gán nhãn HFrEF vừa gán nhãn HFpEF béo phì | **Major (`R3-HF-15`)** |

---

## 3. Phân tích Chi tiết Các Phát hiện Nghiêm trọng (`Critical` & `Major`)

### 3.1. Nhóm Lỗi Chí mạng (`Critical` — 13 phát hiện)

#### `[R3-HF-01]` Lỗi hằng đúng (Boolean Tautology) trong `when()` của 4 trụ cột FMT: Fail-Open khi thiếu `LVEF` và kê nhầm phác đồ HFrEF cho mọi bệnh nhân HFpEF
- **Vị trí mã nguồn:** `src/modules/hf/rules.ts` dòng `39–43` (`hf.fmt.sglt2i`), `113–117` (`hf.fmt.mra`), `233–237` (`hf.fmt.arni`), `373–377` (`hf.fmt.bb`).
- **Căn nguyên:** Cả 4 luật viết điều kiện kích hoạt dạng:
  ```ts
  return Boolean(ctx.patient.conditions?.hf || ctx.patient.selectedModules.includes('hf')) || ef < hfrefMax;
  ```
  Vì `selectedModules.includes('hf')` **luôn bằng `true`** khi người dùng mở module Suy tim, vế sau `|| ef < hfrefMax` hoàn toàn vô tác dụng!
- **Bằng chứng thực nghiệm:**
  - `ADV_HF_01` (`lvef: undefined`): Engine không hề sinh `missing_input_lvef` mà lập tức ra y lệnh `[START]` cho cả Dapagliflozin 10 mg, Spironolactone 25 mg, Sacubitril/Valsartan 49/51 mg x 2 và Bisoprolol 1.25 mg (cực kỳ nguy hiểm nếu suy tim chưa siêu âm thực chất là hẹp khít van động mạch chủ, bệnh cơ tim phì đại tắc nghẽn hoặc ép tim cấp).
  - `ADV_HF_08` (`lvef: 60%` — HFpEF thuần túy) và `Preset 3` (`hf_preset_hfpef_obese_dm`, `lvef: 55%`): Engine vẫn phát `[START] bisoprolol 1.25 mg` (có thể làm trầm trọng suy nút xoang/bất dung nạp tần số tim ở HFpEF), `[START] sacubitril_valsartan` và `[START] spironolactone 25 mg` kèm lý giải sai sự thật: *"Khuyến cáo Class I, Mức A (ESC 2026 / BYT 1857) cho mọi bệnh nhân HFrEF"*.
- **Hướng khắc phục:** Bắt buộc `requireInput(ctx.patient.lvef, 'lvef', ...)` để fail-closed khi `lvef === undefined`; tách biệt rõ điều kiện kích hoạt và mức độ khuyến cáo cho HFrEF, HFmrEF và HFpEF (trong đó tuyệt đối không `START` chẹn beta thường quy cho HFpEF nếu không có bệnh đồng mắc chỉ định riêng).

#### `[R3-HF-02]` Rò rỉ thuốc gây quái thai (`Ivabradine`, `Vericiguat`, `Semaglutide`) ở phụ nữ mang thai và lỗi ghi đè làm mất toàn bộ lệnh `STOP`
- **Vị trí mã nguồn:** `src/engine/safety/gates.ts` dòng `20–40`, `269–285`; `src/engine/safety/reviewMeds.ts` dòng `96–125`; `src/modules/hf/rules.ts` (`hf.fmt.bb`, `hf.amt.ivabradine`, `hf.amt.vericiguat`, `hf.hfpef.glp1_obesity`).
- **Bằng chứng thực nghiệm:**
  - `ADV_HF_51` (Thai phụ HFrEF chưa dùng thuốc): Engine xuất `[START] bisoprolol 1.25 mg`, **`[CONSIDER] ivabradine 5 mg x 2`** (chống chỉ định Class III ESC 2026 — gây quái thai tim mạch) và **`[CONSIDER] vericiguat 2.5 mg`** (FDA Black Box Warning độc tính phôi thai).
  - `ADV_HF_52` (Thai phụ đang dùng 7 thuốc suy tim): Engine khuyên **`[CONTINUE] ivabradine`** và **`[CONTINUE] vericiguat`**; đồng thời với 5 thuốc độc thai còn lại (`sacubitril_valsartan`, `enalapril`, `losartan`, `spironolactone`, `dapagliflozin`), hàm `applySafetyGates()` dòng 279 gán cứng `updatedAction = 'AVOID'`, **ghi đè làm biến mất sạch mọi lệnh `STOP` khẩn cấp** của `reviewMeds.ts` (`summary.byAction.STOP === 0`)!
  - `ADV_HF_53` (Thai phụ HFpEF béo phì đang dùng `semaglutide`): Engine xuất **`[CONTINUE] semaglutide`** bất chấp `kb/drugs/semaglutide.json` ghi rõ `pregnancy.status: "contra"`.
- **Hướng khắc phục:** Đọc trực tiếp `getDrug(drugId)?.pregnancy?.status === 'contra'` kết hợp bổ sung `ivabradine`, `vericiguat`, nhóm GLP-1/GIP RA vào danh sách chặn thai kỳ ở cả `gates.ts` và `reviewMeds.ts`; bảo toàn `action: 'STOP'` khi thuốc đang có mặt trong `currentMeds`; bổ sung khuyến cáo `REFER` Hội chẩn Tim mạch – Sản khoa nguy cơ cao.

#### `[R3-HF-03]` Bỏ sót tương tác gây trụy mạch tử vong: Ức chế PDE-5 (`Sildenafil` / `Tadalafil`) + Nitrat tĩnh mạch/uống hoặc `Vericiguat`
- **Vị trí mã nguồn:** `src/modules/hf/rules.ts` dòng `655–702`, `1111–1150`; `src/kb-types/interactions.ts`; `src/engine/safety/reviewMeds.ts`.
- **Bằng chứng thực nghiệm:**
  - `ADV_HF_45` (Nội viện suy tim cấp, `sbp: 138`, đang dùng `sildenafil 50 mg` + `tadalafil 10 mg`): Engine khuyến cáo **`[CONSIDER] isosorbide_dinitrate` (truyền TM Nitroglycerin / ISDN 1–10 mg/h)** với `alerts = []`, `STOP = 0`, `AVOID = 0`!
  - `ADV_HF_46` (Ngoại trú HFrEF mới mất bù đang dùng `tadalafil 20 mg` + `isosorbide_dinitrate 20 mg`): Engine khuyến cáo **`[CONSIDER] vericiguat 2.5 mg`** chồng lên cả PDE-5i lẫn Nitrat với `alerts = []` và `STOP = 0`!
- **Hướng khắc phục:** Bổ sung quy tắc chống chỉ định tuyệt đối mức `critical` cho cặp `PDE-5i × Nitrates` (chờ ≥ 24h với Sildenafil, ≥ 48h với Tadalafil) và `Vericiguat × (PDE-5i | Nitrates | Riociguat)` vào `interactions.ts`, `reviewMeds.ts` và điều kiện lọc của 2 luật trên.

#### `[R3-HF-04]` Khởi trị mới / Tăng liều Chẹn Beta ngay giữa cơn Phù phổi cấp và tiêm Furosemide liều cao trong Sốc tim đẳng thể tích
- **Vị trí mã nguồn:** `src/modules/hf/rules.ts` dòng `371–476` (`hf.fmt.bb`), `1041–1109` (`hf.inpatient.diuretic_escalation`, `hf.inpatient.continue_bb`), `953–982` (`hf.lifestyle.cardiac_rehab`).
- **Bằng chứng thực nghiệm:**
  - `ADV_HF_54` (Nội viện phù phổi cấp NYHA IV, `congestion: 'overt'`, chưa dùng BB): Kê **`[START] bisoprolol 1.25 mg`** + **`[START] rec_hf_cardiac_rehab`**!
  - `ADV_HF_55` & `Preset 4` (`hf_preset_acute_decompensated_inpatient`, phù phổi cấp NYHA IV đang dùng `bisoprolol 2.5 mg`): `hf.fmt.bb` (`UPTITRATE`, ưu tiên 50) đè bẹp `hf.inpatient.continue_bb` (`CONTINUE`, ưu tiên 40) trong `merge.ts`, ra lệnh **`[UPTITRATE] bisoprolol`** ngay giữa cơn phù phổi cấp kháng lợi tiểu!
  - `ADV_HF_56` (Nội viện sốc tim `sbp: 78/52`, `congestion: 'euvolaemic'`, nước tiểu `15 mL/h`, đang dùng `carvedilol 6.25 mg`): Kê **`[START] rec_hf_inpatient_iv_furo` ("Tăng gấp đôi liều Furosemide TM hoặc phối hợp lợi tiểu thứ hai")** trong sốc tim không sung huyết, kê `[START] spironolactone`, `[START] rec_hf_cardiac_rehab`, và phát `[HOLD]` nhầm vào `bisoprolol` thay vì `carvedilol`!
- **Hướng khắc phục:** Chặn `START`/`UPTITRATE` chẹn beta khi `congestion === 'overt'`, NYHA IV cấp tính hoặc sốc tim; yêu cầu có quá tải thể tích thực sự trước khi leo thang lợi tiểu nội viện; chặn tập thể lực phục hồi chức năng tim và gói xuất viện khi bệnh nhân đang cấp cứu nội viện/ngoại trú chưa ổn định.

#### `[R3-HF-05]` Sụp đổ cổng an toàn huyết áp thấp (`SBP = 75–95 mmHg`) ở MRA, Vericiguat và SGLT2i
- **Vị trí mã nguồn:** `src/modules/hf/rules.ts` dòng `111–227` (`hf.fmt.mra`), `672–695` (`hf.amt.vericiguat`); `src/engine/safety/gates.ts` dòng `216–229`.
- **Bằng chứng thực nghiệm:**
  - `ADV_HF_10` (`sbp: 75`): Kê `[START] spironolactone 25 mg`, `[START] furosemide`, và **`[CONSIDER] vericiguat 2.5 mg`** (vì `hf.amt.vericiguat` tính `sbpPassed = false` nhưng quên đổi `action` sang `'HOLD'`).
  - `ADV_HF_11` (`sbp: 85`): Kê **`[UPTITRATE] spironolactone lên 50 mg`**, **`[CONTINUE] dapagliflozin`**, và **`[CONTINUE] vericiguat`**.
  - `ADV_HF_12..14` (`sbp: 89, 90, 95`): Đều gợi ý `[CONSIDER] vericiguat 2.5 mg` dưới ngưỡng an toàn `SBP ≥ 100 mmHg`.
- **Hướng khắc phục:** Chuyển `action` của Vericiguat sang `'HOLD'`/`'DEFER'` khi `!sbpPassed` hoặc `sbp === undefined`; bổ sung cổng huyết áp tối thiểu (`SBP ≥ 90 mmHg`) cho MRA và chặn `CONTINUE` SGLT2i/MRA/Vericiguat khi tụt huyết áp `SBP < 85–90 mmHg`.

#### `[R3-HF-06]` Lỗi thứ tự gộp đa module (`merge.ts`): Ra lệnh NGỪNG `Sacubitril/Valsartan` để đổi sang `Perindopril` và NGỪNG `Spironolactone` để đổi sang `Finerenone` ở bệnh nhân HFrEF LVEF 28%
- **Vị trí mã nguồn:** `src/engine/merge.ts` dòng `316–344` (Bước 1b) chạy trước dòng `462` (`resolveClassConflicts` — Bước 3).
- **Bằng chứng thực nghiệm:**
  - `ADV_HF_39` (HFrEF `lvef: 28%` + CKD A3 + THA đang dùng liều đích `sacubitril_valsartan 97/103 mg bid`): Bước 1b thấy `perindopril` (`START` từ CKD) xung đột nhóm RAA với `sacubitril_valsartan` trong `currentMeds`, liền ghi đè khuyến cáo `CONTINUE` (`priority 40`) của `sacubitril_valsartan` thành **`[SWITCH] CHUYỂN ĐỔI: Ngừng Sacubitril/Valsartan để thay bằng Perindopril`** (`priority 65`). Đến Bước 3, vì `sacubitril_valsartan` không còn mang `START`/`CONTINUE`, `perindopril` nghiễm nhiên thắng cuộc! Kết quả bác sĩ nhận lệnh ngừng ARNI để uống ngay Perindopril không qua 36 giờ washout (nguy cơ phù mạch tử vong + mất trụ cột HFrEF)!
  - `ADV_HF_38` (HFrEF `lvef: 28%` + CKD + ĐTĐ2 đang dùng `spironolactone 25 mg`): Cùng cơ chế trên, engine phát lệnh **`[SWITCH] CHUYỂN ĐỔI: Ngừng Spironolactone để thay bằng Finerenone`** + `[START] finerenone 10 mg`, trái ngược chống chỉ định lâm sàng (Finerenone không thay thế MRA steroid ở HFrEF).
- **Hướng khắc phục:** Đảo `resolveClassConflicts()` (mở rộng trên cả `START`, `UPTITRATE`, `CONTINUE`) lên chạy **TRƯỚC** bước sinh lệnh `SWITCH` với `currentMeds`; đồng thời cập nhật `ckd/rules.outpatient.ts` nhận diện `sacubitril_valsartan` là một thuốc ức chế hệ RAA hợp lệ.

#### `[R3-HF-07]` Bỏ lọt 100% lệnh `STOP` đối với các thuốc chống chỉ định Class III ở HFrEF trong `currentMeds`
- **Vị trí mã nguồn:** `src/engine/safety/reviewMeds.ts`, `src/engine/safety/interactions.ts`, `src/modules/hf/rules.ts`.
- **Bằng chứng thực nghiệm:**
  - `ADV_HF_40` (`diltiazem` + `verapamil` ở LVEF 28%): `STOP = 0`, lại còn kê chồng **`[START] bisoprolol 1.25 mg`** đè lên 2 thuốc chẹn kênh calci non-DHP!
  - `ADV_HF_41` (`pioglitazone` + `saxagliptin` ở LVEF 28%): `STOP = 0`; `saxagliptin` không có cả `alert`.
  - `ADV_HF_42` (`ibuprofen` ở LVEF 28%, `eGFR = 68.4`): `STOP = 0` (vì `reviewMeds.ts` chỉ dừng NSAID khi `eGFR < 30`).
  - `ADV_HF_43` (`flecainide` ở LVEF 28%), `ADV_HF_44` (`dronedarone` ở LVEF 28% NYHA III), `ADV_HF_48` (`ivabradine` khi đang rung nhĩ): Tất cả đều **`STOP = 0` VÀ `alerts = []`** hoàn toàn im lặng!
- **Hướng khắc phục:** Bổ sung bộ quy tắc `reviewMeds` cho Suy tim phát lệnh `[STOP]` bắt buộc đối với non-DHP CCB (`diltiazem`, `verapamil` — kèm `HOLD` khởi trị BB cho tới khi đã ngưng CCB), chống loạn nhịp nhóm IC (`flecainide`, `propafenone`), `dronedarone` (NYHA III–IV / HFrEF mất bù), TZD (`pioglitazone`, `rosiglitazone`), `saxagliptin`, mọi NSAID ở mọi mức eGFR, và `ivabradine` khi không còn nhịp xoang.

#### `[R3-HF-08]` Kê `START` / `UPTITRATE` ARNI ở `K+ = 5.5 mmol/L` và hạ cấp lệnh `STOP` thành `HOLD` ở `K+ = 6.2–6.8 mmol/L`
- **Vị trí mã nguồn:** `src/modules/hf/rules.ts` dòng `254–285`; `src/engine/safety/gates.ts` dòng `141–179`, `308`.
- **Bằng chứng thực nghiệm:**
  - `ADV_HF_18` & `ADV_HF_19` (`K+ = 5.5 mmol/L`): `hf.fmt.arni` đặt `kPassed = false` (`> 5.2`) nhưng quên đổi `action` sang `'HOLD'`, dẫn đến kê **`[UPTITRATE] sacubitril_valsartan lên 97/103 mg x 2`** ngay lúc `K+ = 5.5` kèm 2 cổng K+ đối nghịch nhau trong cùng 1 khuyến cáo.
  - `ADV_HF_21` (`K+ = 6.2`) & `ADV_HF_22` (`K+ = 6.8`): `gates.ts` ghi đè `STOP` của `reviewMeds.ts` thành `HOLD` (`STOP = 0`); tại `K+ = 6.2` ngoại trú còn không có `REFER` cấp cứu và vẫn kê `[START]` tập thể lực!
- **Hướng khắc phục:** Thêm `if (!kPassed) action = 'HOLD'` trong `hf.fmt.arni`; bảo toàn `action = 'STOP'` trong `gates.ts` khi `k >= 6.0`; hạ ngưỡng cờ cấp cứu ngoại trú từ `6.5` xuống `6.0 mmol/L`.

#### `[R3-HF-09]` Vi phạm Fail-Closed khi thiếu `K+`, `SCr/eGFR`, `HR`, `NYHA`, `rhythm` và gợi ý `Digoxin` ngay khi `HR = 38 bpm`
- **Vị trí mã nguồn:** `src/modules/hf/rules.ts` dòng `254`, `719`, `817`, `988–1034`.
- **Bằng chứng thực nghiệm:**
  - `ADV_HF_03` (`k = undefined`) & `ADV_HF_04` (`scr = undefined`): Vẫn `[START] sacubitril_valsartan 49/51 mg x 2`.
  - `ADV_HF_04`, `ADV_HF_05` (`hr = undefined`), `ADV_HF_23` (`hr = 38 bpm`): Đều gợi ý **`[CONSIDER] digoxin 0.125 mg/ngày`**!
  - `ADV_HF_06` (`nyha = undefined`, `rhythm = undefined`): Tự mặc định NYHA II–III và nhịp xoang để phát `[START]` ICD và CRT Class I.
- **Hướng khắc phục:** Bắt buộc kiểm tra đủ các biến đầu vào thiết yếu trước khi phát khuyến cáo dùng thuốc hoặc cấy máy; chặn tuyệt đối Digoxin khi `hr === undefined || hr < 60` hoặc `egfr === undefined || egfr < 30`.

#### `[R3-HF-10]` Nguy cơ co thắt phế quản cấp ở bệnh nhân Hen phế quản (`Carvedilol` trong tên thuốc khởi trị & không `STOP` khi đang dùng)
- **Vị trí mã nguồn:** `src/modules/hf/rules.ts` dòng `455`; `src/engine/safety/reviewMeds.ts`.
- **Bằng chứng thực nghiệm:** `ADV_HF_49` gợi ý trực tiếp `"Bisoprolol (hoặc Carvedilol, Metoprolol succinate)"` cho bệnh nhân hen; `ADV_HF_50` không `STOP` Carvedilol đang dùng mà kê chồng `[UPTITRATE] bisoprolol`.
- **Hướng khắc phục:** Phát lệnh `[STOP]`/`[SWITCH]` cho mọi chẹn beta không chọn lọc ở bệnh nhân hen; đổi khởi trị BB ở hen sang `CONSIDER` thận trọng và chỉ hiển thị các hoạt chất chọn lọc $\beta_1$ cao (`Bisoprolol`, `Metoprolol succinate`, `Nebivolol`).

#### `[R3-HF-11]` Rò rỉ `CONTINUE` Dapagliflozin, `START` ARNI và `CONSIDER` Digoxin 0.125 mg ở bệnh nhân Lọc máu chu kỳ (`eGFR = 12`, `onDialysis = true`)
- **Vị trí mã nguồn:** `src/engine/safety/gates.ts` dòng `83–134`; `src/modules/hf/rules.ts` (`hf.fmt.arni`, `hf.amt.digoxin`).
- **Bằng chứng thực nghiệm:** Kịch bản `ADV_HF_29` (`eGFR = 12`, `onDialysis = true`) và `ADV_HF_30` (`eGFR = 19`).
- **Hướng khắc phục:** Chặn `CONTINUE`/`START` SGLT2i khi `onDialysis === true`; chặn `START` tự động ARNI khi `egfr < 15 || onDialysis`; chặn `CONSIDER` Digoxin khi `egfr < 30 || onDialysis`.

#### `[R3-HF-12]` Tăng liều vượt trần tối đa (`UPTITRATE` trên Bisoprolol `"10 mg"`, Entresto `200` mg, Spironolactone `"50 mg"`), kê chồng thuốc cùng nhóm, và tự hạ 75% liều `Vericiguat` trên y lệnh `CONTINUE`
- **Vị trí mã nguồn:** `src/modules/hf/rules.ts` dòng `145–158`, `259–276`, `404–418`, `617–634`, `673–690`.
- **Bằng chứng thực nghiệm:** Kịch bản `ADV_HF_57` và `ADV_HF_58` chứng minh `Number("10 mg") -> NaN` và `String(200).includes("97") -> false` khiến bệnh nhân đã dùng tối đa liều đích vẫn bị thúc `UPTITRATE`; bệnh nhân dùng `carvedilol 25 mg bid` + `eplerenone 50 mg` bị kê chồng thêm `bisoprolol` + `spironolactone`; bệnh nhân đang duy trì `vericiguat 10 mg` và `ivabradine 7.5 mg bid` bị ghi liều `CONTINUE` tụt về `2.5 mg` và `5 mg bid`!
- **Hướng khắc phục:** Dùng `parseFloat` tách số từ chuỗi liều, nhận diện `200` mg cho Entresto, bảo tồn đúng `drugId` và liều hiện tại của bệnh nhân cho mọi hoạt chất hợp lệ trong nhóm.

#### `[R3-HF-13]` Lỗi QA-10 lấy nhầm ngưỡng eGFR (`30` mL/phút) làm liều `"Spironolactone 30 mg"` trên Ma trận và nhân `30 * 3 = 90` làm bỏ sót Thiếu sắt tuyệt đối (`Ferritin 90–99 µg/L`)
- **Vị trí mã nguồn:** `src/modules/hf/matrices.ts` dòng `53`, `185`; `src/modules/hf/rules.ts` dòng `152`, `411`, `567`.
- **Bằng chứng thực nghiệm:** Cả 2 ma trận xuất `"Khởi đầu 30 mg uống cách ngày"`; kịch bản `ADV_HF_09` (`Ferritin = 95 µg/L < 100`, `TSAT = 24%`) bị bỏ sót hoàn toàn không được bù sắt tĩnh mạch.
- **Hướng khắc phục:** Sửa ma trận về `"12.5 mg/ngày hoặc 25 mg uống cách ngày"`, khai báo chính thức `hf.iron.ferritin_abs_cutoff = 100` và `hf.iron.tsat_cutoff = 20` vào `kb/thresholds/hf.json`, và xóa toàn bộ phép nhân/chia chéo ngưỡng sinh lý.

---

### 3.2. Nhóm Lỗi Lớn (`Major` — 7 phát hiện)

1. **`[R3-HF-14]` Bất đồng bộ quy trình Washout 36 giờ ACEi → ARNI và ép sai Washout 36 giờ cho ARB (`ADV_HF_35`, `ADV_HF_36`, `ADV_HF_37`):** Tự động nhận diện ACEi từ `currentMeds` thay vì dựa vào cờ nhập tay `takingAcei`; luôn phát lệnh ngừng ACEi kèm hẹn giờ 36h; bỏ câu washout 36h khi thuốc cũ là ARB (`losartan`); lọc bỏ thuốc đã `SWITCH`/`STOP` trước khi chạy `checkDuplicates()`.
2. **`[R3-HF-15]` Sai mức khuyến cáo khi đổi Profile `INTL` / `US` / `VN` tại `LVEF = 45%` (`ADV_HF_60..62`):** Ở `US` (AHA 2022) và `VN` (BYT QĐ 1857/2022), LVEF 45% là HFmrEF nên ARNI, BB, MRA phải là `CONSIDER` (Class IIb) chứ không phải `START` (Class I Level A HFrEF); sửa tiêu đề `hf.hfpef.glp1_obesity` tránh gọi LVEF 45% là `HFpEF` thuần túy.
3. **`[R3-HF-16]` Chỉ định sai ICD ở NYHA IV / Mới NMCT cấp (`ADV_HF_59`) và chỉ định CRT Class I ghi khống `"nhịp xoang"` ở bệnh nhân Rung nhĩ (`ADV_HF_47`):** Bổ sung chặn `nyha === 4` và `recentAcs === true` trong `hf.gdit.icd`; tách nhánh rung nhĩ trong `hf.gdit.crt` sang `CONSIDER` (Class IIa) kèm điều kiện đảm bảo tạo nhịp 2 thất gần 100%.
4. **`[R3-HF-17]` Gợi ý `Ivabradine` ngay ở bệnh nhân chưa từng dùng Chẹn Beta (`ADV_HF_27`, `Preset 1`) và chưa hạ liều khởi đầu trên tiêu đề cho tuổi ≥ 75 (`ADV_HF_34`):** Chỉ xét Ivabradine sau khi đã chuẩn độ tối đa BB dung nạp hoặc khi không dung nạp/chống chỉ định BB; hiển thị đúng `2.5 mg x 2 lần/ngày` khi `age >= 75`.
5. **`[R3-HF-18]` Xung đột ngưỡng HR của Chẹn Beta giữa `rules.ts` (`50 bpm`) và `gates.ts` (`55 bpm`) (`ADV_HF_25`):** Thống nhất một nguồn ngưỡng duy nhất từ `kb/thresholds/hf.json` để không sinh 2 cổng HR ngược kết luận nhau trên cùng thẻ thuốc.
6. **`[R3-HF-19]` Kê quá cao liều khởi đầu ARNI (`49/51 mg x 2` thay vì `24/26 mg x 2`) ở bệnh nhân RASi-naïve (`ADV_HF_16`, `ADV_HF_27`, `Preset 1`):** Bắt buộc khởi đầu `24/26 mg x 2 lần/ngày` khi bệnh nhân chưa từng dùng ACEi/ARB trước đó.
7. **`[R3-HF-20]` Bệnh án điện tử `noteText` bỏ sót `LVEF`, `NYHA` và bịa đặt `(xoang)` khi `rhythm = undefined` (`ADV_HF_06`):** Sửa `src/engine/note.ts` để hiển thị đầy đủ LVEF, NYHA, NT-proBNP và không mặc định nhịp xoang khi chưa nhập ECG.

---

### 3.3. Nhóm Lỗi Nhỏ & Đề xuất (`Minor` & `Suggestion` — 4 phát hiện)

- **`[R3-HF-21]` (`Minor`):** Xóa bỏ các mã trích dẫn `TODO:*` (`TODO:esc2026_hf_cardiogenic_shock`, `TODO:ukka2022_hyperkalemia_severe`, `TODO:kdigo2024_pregnancy_contra`...) đang rò rỉ ra output thực tế từ `gates.ts` và `reviewMeds.ts`.
- **`[R3-HF-22]` (`Minor`):** Rút gọn hàm `formatDose()` theo đúng bối cảnh `outpatient` vs `inpatient` để không in hướng dẫn uống ngoại trú vào y lệnh truyền tĩnh mạch nội viện (`ADV_HF_45`, `ADV_HF_54`), và giữ đơn vị `mg` + đường dùng khi merge Furosemide (`ADV_HF_55`).
- **`[R3-HF-23]` (`Minor`):** Gọi `requireInput` nhắc nhập Cân nặng/Chiều cao (BMI) ở bệnh nhân HFpEF (`LVEF ≥ 50%`) chưa có BMI (`ADV_HF_08`).
- **`[R3-HF-24]` (`Suggestion`):** Bổ sung luật gợi ý **Hydralazine + Isosorbide dinitrate** ngoại trú khi HFrEF chống chỉ định cả ACEi/ARB/ARNI, và gợi ý chất gắn kali (**Patiromer / Sodium zirconium cyclosilicate**) khi `K+ = 5.1–5.9 mmol/L` để duy trì GDMT tối ưu.

---

## 4. Điểm sáng Đã Hoạt động Tốt Qua Kiểm thử Đối kháng

- Các biên số học đơn lẻ đã cài đặt đúng gồm: chặn khởi trị SGLT2i ở `eGFR = 19` và mở ở `eGFR = 20 mL/phút` (`ADV_HF_30, 31`); chặn khởi trị MRA ở `eGFR = 29` và mở liều thấp `12.5 mg/ngày hoặc 25 mg cách ngày` ở `eGFR = 30 mL/phút` (`ADV_HF_32, 33`); chặn khởi trị MRA ở `K+ = 5.1` và mở ở `K+ = 5.0 mmol/L` (`ADV_HF_16, 17`); hạ liều khởi trị ARNI xuống `24/26 mg x 2` khi `SBP = 100 mmHg` (`ADV_HF_15`).
- Khi `HR = 48 bpm` trên bệnh nhân đang dùng đồng thời Bisoprolol + Ivabradine + Digoxin (`ADV_HF_24`), hệ thống `HOLD` chính xác cả 3 thuốc làm chậm nhịp.
- Khi `HR = 69 bpm` (`ADV_HF_26`) hoặc rung nhĩ chưa dùng thuốc (`ADV_HF_47`), luật `hf.amt.ivabradine` không kích hoạt sai.

---

## 5. Kết luận Duyệt Vòng 1

Với **13 lỗi Critical** và **7 lỗi Major** được chứng minh thực nghiệm trên 62 kịch bản đối kháng (bao gồm nhiều tình huống có thể gây nguy hiểm trực tiếp cho người bệnh như: kê mù quáng HFrEF khi thiếu LVEF hoặc ở HFpEF, rò rỉ thuốc độc thai `Ivabradine`/`Vericiguat`/`Semaglutide` và mất lệnh `STOP` ở thai kỳ, không chặn tương tác tử vong `Sildenafil`/`Tadalafil` + Nitrat/Vericiguat, tăng liều Chẹn Beta giữa cơn phù phổi cấp, tiêm lợi tiểu liều cao trong sốc tim đẳng thể tích, đảo ngược ngừng ARNI/Spironolactone ở bệnh nhân đa bệnh HFrEF + CKD, và sai liều `"Spironolactone 30 mg"` trên ma trận), module Suy tim (`hf`) cần được khắc phục toàn diện trước khi bước sang Vòng 2.

**KẾT LUẬN: FAIL**
