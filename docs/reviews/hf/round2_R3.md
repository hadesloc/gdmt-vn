# Báo cáo Phản biện An toàn Lâm sàng & Kiểm thử Đối kháng Độc lập — Module Suy tim (`hf`) — Vòng 2 (R3)

- **Vai trò:** R3 – Phản biện An toàn Lâm sàng & Kiểm thử Biên Đối kháng (*Adversarial Clinical Safety & Edge-Case Tester*)
- **Hội đồng:** Hội đồng Thẩm định Độc lập Y khoa AI — Dự án **GDMT-VN**
- **Module kiểm định:** Suy tim (`src/modules/hf/**`, kiểm định xuyên tầng tới `src/engine/**` và `kb/**`)
- **Vòng thẩm định:** Vòng 2 (Độc lập hoàn toàn — không đọc bất kỳ tệp `round2_R1*` hay `round2_R2*` nào)
- **Phương pháp thực nghiệm:** Thiết kế và thực thi trực tiếp **123 kịch bản bệnh nhân đối kháng (`S01` → `S123`)** qua hàm `evaluate()` thật của Engine (nạp nguyên bản qua Vite SSR module loader, kiểm thử đa hồ sơ `INTL` / `VN` / `US`, đối xứng đơn vị SI `µmol/L` ↔ `mg/dL`, ngoại trú `outpatient` ↔ nội viện `inpatient`, 6 Presets tích hợp sẵn, 2 Ma trận thận `hfMatrixHFrEF` / `hfMatrixHFpEF`, và phối hợp liên chuyên khoa 9 modules: `hf` + `ckd`, `htn`, `af`, `dm2`, `gout`, `asthma`, `copd`, `lipid`).
- **Độ ổn định thực thi (Runtime Stability):** **0 / 123 kịch bản crash hoặc ném ngoại lệ** (kể cả khi truyền đầu vào thiếu hoàn toàn, âm, bằng `0`, `NaN` hoặc cực trị sinh lý).
- **Tệp dữ liệu chuẩn hóa đính kèm:** `docs/reviews/hf/round2_R3.json` (20 đối tượng Finding hợp lệ theo `docs/REVIEW_PROTOCOL.md`).

---

## 1. Tóm tắt Điều hành & Phán quyết An toàn Lâm sàng Vòng 2

| Mức độ nghiêm trọng (`severity`) | Số lượng | Ý nghĩa lâm sàng theo `docs/REVIEW_PROTOCOL.md` |
|---|---:|---|
| **Critical** | **9** | Nguy cơ trực tiếp đe dọa tính mạng hoặc gây tổn thương cơ quan không hồi phục nếu bác sĩ thực hiện theo y lệnh của hệ thống (phù mạch thanh quản do ACEi SPC + ARNI, tụt áp trụy mạch do tăng liều ARNI/MRA giữa sốc tim duy trì vận mạch hoặc ngoại trú, co thắt phế quản tử vong do kê Chẹn beta trong cơn hen cấp nặng, duy trì liều tối đa ARNI/MRA/SGLT2i trong AKI giai đoạn 2–3, vô tâm thu do kê BB/Ivabradine trên Block AV độ II–III / Suy nút xoang chưa đặt máy tạo nhịp, suy gan tối cấp ở Child-Pugh C, phơi nhiễm thuốc độc sữa mẹ ở sản phụ cho con bú, ghi đè liều gấp 4 lần trên thẻ `CONTINUE`, kê Sacubitril/valsartan trên bệnh nhân dị ứng ACEi/ARB và bỏ sót Sotalol ở HFrEF). |
| **Major** | **7** | Sai lệch nghiêm trọng phác đồ ESC 2026 / AHA 2022 / QĐ 1857 BYT hoặc lỗi kiến trúc gộp thuốc/giao diện làm sai lệch quyết định điều trị (Preset nội viện chạy nhầm ở ngoại trú, thẻ `HOLD`/`AVOID`/`DEFER` vẫn in liều kê đơn hoạt động, hạ cấp nhầm Furosemide tĩnh mạch thành `CONTINUE` thiếu tần suất dùng, hỏng chuỗi liều tiếng Việt & chưa cài đặt chặn truyền sắt TM khi `Hb > 15 g/dL` / nhiễm trùng cấp, tự xung đột `Amiodarone + Digoxin` khi gộp `hf + af`, thiếu thuốc gắn kali `SZC`/`Patiromer` để bảo vệ RAASi/MRA, kê tập luyện thể lực trong cơn cấp tính & thiếu đồng nghĩa `angioedemaHistory`). |
| **Minor** | **3** | Khiếm khuyết hiển thị thẻ riêng lẻ ở kiểu hình `HFimpEF`, lỗi đọc liều theo đơn vị `'viên'` kèm hàm lượng trong tên thuốc, và nhãn `'caution'` chưa đồng nhất tại cột `AKI` của `matrices.ts`. |
| **Suggestion** | **1** | Đề xuất nâng cấp schema `hfInputs` bổ sung các trường lâm sàng bảo vệ an toàn khi bác sĩ chỉ bật độc lập module `hf`. |
| **Tổng cộng** | **20** | **Phán quyết Vòng 2: `FAIL`** *(Điều kiện `PASS` bắt buộc: `0 critical` VÀ `0 major`)* |

---

## 2. Kiểm chứng Khắc phục các Phát hiện Vòng 1 (`round1_R3.md` & `round1_RESPONSE.md`)

Đối chiếu trực tiếp kết quả chạy `evaluate()` Vòng 2 với 24 phát hiện của R3 ở Vòng 1 và bản cam kết khắc phục `docs/reviews/hf/round1_RESPONSE.md`:

| Nhóm lỗi Vòng 1 (`round1_R3`) | Nội dung cốt lõi ở Vòng 1 | Kết quả kiểm chứng `evaluate()` Vòng 2 | Trạng thái |
|---|---|---|---|
| `R3-HF-01`, `R3-HF-09`, `R3-HF-23` | Kê mù 4 trụ cột HFrEF khi `lvef=undefined`, mù `sbp`/`k`/`scr`/`hr`; phân tầng sai HFmrEF/HFpEF/HFimpEF | Đã sửa tốt! Kịch bản `S19`–`S27` xác nhận cơ chế **Fail-Closed** hoạt động chuẩn: thiếu `lvef`, `sbp`, `k`, `scr`, `hr` đều không kê bừa thuốc mà sinh `missingInputs` chính xác; HFmrEF (`S07`), HFpEF béo phì (`S13`), HFimpEF (`S16`) đã tách luồng rõ ràng. | **PASS** |
| `R3-HF-02` | Trùng lặp thuốc ACEi + ARNI không washout 36h | Hoạt chất đơn (`enalapril`, `perindopril`, `lisinopril`, `ramipril`) đã chặn `HOLD` washout 36h + `STOP` ACEi chuẩn xác (`S41`, `S42`), kể cả ARB (`valsartan`, `losartan`) cho phép `SWITCH` trực tiếp không cần chờ 36h (`S43`, `S44`). **TUY NHIÊN**, toàn bộ **viên phối hợp liều cố định chứa ACEi** (`perindopril_amlodipine` / Coveram, `perindopril_indapamide` / Preterax, `perindopril_indapamide_amlodipine` / Triplixam) vượt qua hoàn toàn cổng washout (`S45`–`S48`)! | **FAIL (`HF-R2-R3-01`)** |
| `R3-HF-03` | Kê trùng 2 SGLT2i trên bệnh nhân ĐTĐ2 đang dùng Xigduo (`dapagliflozin_metformin`) hoặc Jardiance (`empagliflozin`) | Đã sửa tốt! Kịch bản `S49` (`dapagliflozin_metformin`), `S50` (`empagliflozin`) và `S67` (`hf + dm2 + ckd`) quy chiếu thành phần SGLT2i chính xác, giữ `CONTINUE` duy nhất 1 SGLT2i. | **PASS** |
| `R3-HF-05` | Kê thuốc hạ áp/lợi tiểu giữa cơn sốc tim / tụt huyết áp | Đã chặn khi `SBP < 90 mmHg` nội viện (`S28`). **TUY NHIÊN**, khi sốc tim đang truyền vận mạch/inotropes giữ `SBP >= 90 mmHg` (`S29` SBP=96, `S30` SBP=102) hoặc sốc tim tại ngoại trú (`S31`, `S32`, `S119`), hệ thống vẫn `UPTITRATE`/`START`/`CONTINUE` ARNI, Spironolactone 50 mg, SGLT2i, truyền sắt TM và ở ngoại trú không phát lệnh `REFER`! | **FAIL (`HF-R2-R3-02`)** |
| `R3-HF-06` | Thai kỳ không phát lệnh `STOP` thuốc độc thai nhi | Đã sửa tốt cho **mang thai** (`pregnant: true`, `S54`): phát `STOP` ngay ARNI, Spironolactone, Dapagliflozin kèm `REFER` sản-tim mạch. **TUY NHIÊN**, phụ nữ hậu sản **đang cho con bú** (`S55`) bị bỏ lọt hoàn toàn, và nhãn UI gộp chung `"Mang thai / Cho con bú"` gây xung đột hai chiều. | **FAIL (`HF-R2-R3-07`)** |
| `R3-HF-07`, `R3-HF-10` | Lọc máu chu kỳ với `scr` sau lọc thấp (`140 µmol/L` -> eGFR giả `44`) đánh lừa hệ thống kê MRA/SGLT2i/ARNI | Đã sửa xuất sắc! Kịch bản `S65` (`dialysis='hemodialysis'`, `scr=140`) xác nhận `dialysis` ghi đè hoàn toàn eGFR giả tạo: chặn `AVOID`/`STOP` ARNI, Spironolactone, Finerenone và Dapagliflozin. | **PASS** |
| `R3-HF-08` | Tăng kali máu nặng `K+ >= 6.0` chỉ `HOLD` thay vì `STOP` + `REFER`, vẫn kê BB/SGLT2i | Đã sửa tốt! Kịch bản `S61` (`K+=6.2` ngoại trú) và `S62` (`K+=6.6` nội viện) phát `STOP` ARNI + MRA, `REFER` cấp cứu tăng kali máu và `DEFER` khởi trị thuốc mạn tính (chỉ còn sót chuỗi `dose` trên thẻ `DEFER` -> `HF-R2-R3-11`). | **PASS (hành động)** |
| `R3-HF-11`, `R3-HF-12` | Kê Chẹn beta trong suy tim mất bù sung huyết phổi cấp hoặc cơn hen phế quản cấp | Sung huyết cấp đơn thuần (`congestion='overt'`) đã chặn khởi trị mới BB (`S10`, `S34`). **TUY NHIÊN**, trong **cơn hen cấp nặng** (`S36`, `S84`, `S85`), hệ thống vẫn rò rỉ `[CONSIDER]` và `[SWITCH]` sang Bisoprolol 1.25 mg kèm `[START]` tập thể lực! | **FAIL (`HF-R2-R3-03`)** |
| `R3-HF-13` (`HF-R2-23` trong `round1_RESPONSE.md`) | Bù sắt tĩnh mạch nhân nhầm ngưỡng Ferritin `30*3=90`; cam kết bổ sung phân tầng cân nặng/Hb và chống chỉ định `Hb > 15 g/dL` | Đã sửa ngưỡng `Ferritin < 100` (`S100`, `S101`). **TUY NHIÊN**, cam kết `HF-R2-23` trong `round1_RESPONSE.md` chưa được hiện thực hóa trong code: kịch bản `S102` (`weight=52 kg`, `Hb=15.8 g/dL`, `activeInfection=true`) vẫn phát `[START]` Ferric carboxymaltose 500–1000 mg kèm chuỗi liều lặp hỏng cú pháp! | **FAIL (`HF-R2-R3-13`)** |
| `R3-HF-14`, `R3-HF-15`, `R3-HF-16` | Xung đột thuốc chống loạn nhịp / CCB non-DHP ở HF+AF, CYP3A4 mạnh với Eplerenone/Ivabradine, PDE-5i với Nitrate/Vericiguat | Đã sửa tốt cho Diltiazem/Verapamil/Flecainide/Propafenone/NSAID/Thiazolidinedione (`S86`–`S88`), Clarithromycin/Itraconazole với Eplerenone/Finerenone/Ivabradine (`S96`–`S98`), Sildenafil với Vericiguat/ISDN (`S99`). **TUY NHIÊN**, **Sotalol** (`S122`) và **Alogliptin** (`S89`) vẫn lọt khi chạy `hf` độc lập, và `HF+AF` tự sinh xung đột `Amiodarone + Digoxin` (`S72`, `S74`). | **PARTIAL (`HF-R2-R3-09`, `HF-R2-R3-14`)** |
| `R3-HF-17` | Chỉ định ICD/CRT sai khi chưa tối ưu GDMT >= 3 tháng hoặc NYHA IV không phụ thuộc thuốc vận mạch | Đã sửa chuẩn xác! Kịch bản `S103`–`S107` xác nhận cổng `gdmtOptimized3Months === true`, phân biệt LBBB vs non-LBBB (`QRS >= 150` vs `130–149 ms`), loại trừ NYHA IV đối với ICD dự phòng tiên phát và chặn khi kỳ vọng sống `< 1 năm`. | **PASS** |
| `R3-HF-21` | Rò rỉ mã trích dẫn `TODO:*` | Đã dọn sạch toàn bộ `TODO:*` trên tất cả 123 kịch bản Vòng 2. | **PASS** |
| `R3-HF-24` | Đề xuất bổ sung Hydralazine + ISDN ngoại trú và thuốc gắn kali (Patiromer / SZC) | Đã bổ sung `hf.fmt.rasi_fallback` (Hydralazine + ISDN), nhưng quên chặn ARNI khi `allergyAceiArb=true` (`S123` -> `HF-R2-R3-09`); **thuốc gắn kali (`SZC` / `Patiromer`) vẫn hoàn toàn vắng bóng** trong `hf` (`S56`, `S59`, `S60` -> `HF-R2-R3-15`). | **FAIL (`HF-R2-R3-15`)** |

---

## 3. Tổng hợp Ma trận 123 Kịch bản Thực nghiệm Đối kháng (`S01` → `S123`)

Toàn bộ 123 kịch bản được nạp trực tiếp vào `evaluate(patient, settings)` trên mã nguồn hiện hành:

| Danh mục đối kháng | Mã kịch bản | Thiết kế thử thách lâm sàng & kỹ thuật | Kết quả `evaluate()` thực tế | Kết luận |
|---|---|---|---|---|
| **0. Presets × Đa hồ sơ (`INTL`/`VN`/`US`) & Setting** | `S01`–`S09`, `S13`–`S18` | 5 Presets ngoại trú (`HFrEF de novo`, `HFrEF CKD G4 + K+ 5.3 + SBP 92`, `HFmrEF + AF`, `HFpEF béo phì`, `HFimpEF`) × 3 profiles | 0 crash; `S01`–`S03` dính chuỗi `'Viên nén bao phim...'`; `S04`–`S06` thẻ `HOLD` SGLT2i giữ nguyên `dose` & kê `[START]` tập thể lực ở SBP 92; `S16`–`S18` (`HFimpEF`) thiếu thẻ riêng cho ARNI/BB/MRA. | `HF-R2-R3-11`, `13`, `16`, `17` |
| | `S10`–`S12` vs `S113`–`S115` | Preset `BN 4: Suy tim cấp mất bù nội viện` chạy theo cấu hình gốc (`presets.ts` quên `setting: 'inpatient'`) so với ép `setting: 'inpatient'` | Ở `S10`–`S12` (mặc định UI): phớt lờ `uNa+ 2h = 55`, kê 4 thuốc uống ngoại trú giữa phù phổi NYHA IV! Ở `S113`–`S115`: kích hoạt đúng phác đồ kháng lợi tiểu nội viện nhưng `furosemide` bị `merge.ts` hạ thành `CONTINUE [Đang dùng nền: 80 mg]`. | **FAIL (`HF-R2-R3-10`, `12`)** |
| **1. Fail-Closed, Biên 0/Âm/`NaN` & Đơn vị (`SI` ↔ `mg/dL`)** | `S19`–`S27` | Hồ sơ rỗng, thiếu từng biến (`lvef`, `sbp`, `k`, `scr`, `hr`), sinh hiệu âm/bằng `0`/`NaN`, cao tuổi 94 tuổi `34 kg`, lưỡng tính SI (`scr=221 µmol/L`) vs US (`scr=2.5 mg/dL`) | **0 crash**; cơ chế Fail-Closed chặn kê đơn mù hoàn hảo; `S26` vs `S27` cho `eGFR = 25.0 mL/phút/1.73m²` và phác đồ đồng nhất tuyệt đối 100% giữa SI và `mg/dL`! | **PASS** |
| **2. Sốc tim, Vận mạch, ADHF Nội/Ngoại trú & Kháng lợi tiểu** | `S28`–`S33`, `S119`, `S120` | Sốc tim huyết áp tụt (`SBP 78–82`) và sốc tim nâng áp giả tạo nhờ vận mạch (`SBP 95–104`, `cardiogenicShock=true`, `onInotropes=true`) ở cả nội viện & ngoại trú | Nội viện `S29`–`S30`: in sai chuỗi `"(SBP 102 mmHg < 90 mmHg)"`, đồng thời vẫn `CONTINUE`/`UPTITRATE` ARNI 97/103, `UPTITRATE` MRA 50 mg, `CONTINUE` SGLT2i, `START` sắt TM! Ngoại trú `S31`–`S32`, `S119`: **0 `REFER`**, vẫn kê/tăng liều ARNI, MRA, SGLT2i, Furosemide uống! | **CRITICAL (`HF-R2-R3-02`)** |
| | `S34`, `S35`, `S37`, `S39`, `S40` | Phù phổi cấp cao áp (`SBP 195`), kháng lợi tiểu (`uNa+ 42`, `nước tiểu 55 mL/h`), suy hô hấp `SpO2 84%`, ổn định trước ra viện (`STRONG-HF`) | `S35` phát đúng Nitrat TM + Oxy; `S34` gấp đôi lợi tiểu + phối hợp Metolazone/Thiazide nhưng thẻ Furosemide bị hạ thành `CONTINUE` thiếu `freq`; `S37` (`SpO2 84%`) chặn đúng BB; `S40` kích hoạt đúng `STRONG-HF`. | **Major (`HF-R2-R3-12`)** |
| | `S36`, `S84`, `S85` | HFrEF + Cơn hen phế quản cấp nặng (`nói từng từ`, `RR=32`, `PEF=45%`, `SpO2=91%`) nội viện & ngoại trú (chưa dùng BB hoặc đang dùng Carvedilol) | Module `asthma` phát `REFER` cấp cứu + `STOP` Carvedilol, nhưng `hf` rò rỉ **`[CONSIDER] Bisoprolol 1.25 mg`** (`S36`, `S84`), **`[SWITCH] Bisoprolol 1.25 mg`** (`S85`) và **`[START]` tập thể lực** (`S84`, `S85`)! | **CRITICAL (`HF-R2-R3-03`)** |
| **3. Washout 36h ACEi → ARNI & Viên phối hợp SPC** | `S41`–`S44` | Đang dùng `enalapril`, `perindopril` đơn chất vs `valsartan`, `losartan` đơn chất | `S41`–`S42` (ACEi đơn): `HOLD` ARNI chờ đủ 36h washout + `STOP` ACEi chuẩn xác. `S43`–`S44` (ARB đơn): `SWITCH` trực tiếp sang ARNI không bắt chờ 36h chuẩn xác. | **PASS** |
| | `S45`–`S48` | Đang dùng viên SPC chứa ACEi (`perindopril_amlodipine`, `perindopril_indapamide`, `perindopril_indapamide_amlodipine`, biệt dược `Coveram`) | **Vượt qua hoàn toàn cổng washout 36h!** Phát `[START] sacubitril_valsartan` ngay lập tức, `0` lệnh ngừng SPC, `0` cảnh báo tương tác, thuyết minh ghi sai *"ở người chưa dùng ACEi/ARB"*! | **CRITICAL (`HF-R2-R3-01`)** |
| | `S49`–`S53`, `S123` | Trùng SGLT2i (`Xigduo`, `Empagliflozin`), tiền sử phù mạch (`priorAngioedema` vs `angioedemaHistory`), dị ứng RASi (`allergyAceiArb`) | `S49`–`S51` PASS; `S52` (`priorAngioedema`) chặn ARNI đúng, nhưng `S53` (`angioedemaHistory`) lọt `[START]` ARNI; `S123` (`allergyAceiArb=true`) kê đồng thời cả `[START]` ARNI lẫn `[CONSIDER]` Hydralazine+ISDN! | **CRITICAL (`HF-R2-R3-09`)**, **Major (`16`)** |
| **4. Thai kỳ, Cho con bú, Xơ gan, Kali máu, eGFR & Lọc máu** | `S54`, `S55` | Mang thai 16 tuần (`S54`) vs Hậu sản bệnh cơ tim chu sản đang cho con bú (`S55`) | `S54` (mang thai): `STOP` đúng 3 thuốc độc thai + `REFER`. `S55` (cho con bú): **0 cảnh báo**, kê thẳng `sacubitril_valsartan`, `dapagliflozin`, `bisoprolol`, `vericiguat` (`lactation: 'contra'`)! | **CRITICAL (`HF-R2-R3-07`)** |
| | `S58` | Xơ gan mất bù `Child-Pugh C` đang dùng `Carvedilol 25 mg BID` | Kê thẳng `[START] Sacubitril/valsartan`, `[CONTINUE] Carvedilol 25 mg BID`, `[CONSIDER] Vericiguat` với `0` cảnh báo chống chỉ định suy gan nặng! | **CRITICAL (`HF-R2-R3-06`)** |
| | `S56`, `S57`, `S59`–`S66` | Biên `K+` (`5.0`, `5.3`, `5.7`, `6.2`, `6.6`), `eGFR` (`14`, `22`, `28` mL/phút), Lọc máu chu kỳ (`scr=140`), Đái tháo đường típ 1 (`S66`) | Biên `eGFR` & `HD` (`S65`) và `T1DM` (`S66`) chặn rất chuẩn! Tuy nhiên `S59` (`K+=5.3`, đang uống ARNI `24/26 mg`) phát `[CONTINUE]` nhưng ghi đè liều thành **`97/103 mg BID`** (gấp 4 lần!); và thiếu hẳn gợi ý thuốc gắn kali (`SZC`/`Patiromer`). | **CRITICAL (`HF-R2-R3-08`)**, **Major (`15`)** |
| | `S38`, `S68`, `S69`, `S116`–`S118`, `S121` | Tổn thương thận cấp AKI Giai đoạn 2–3 (`scr` tăng `> 2x` so với `baselineScr`, thiểu niệu `0.3 mL/kg/h`) ở `hf` độc lập vs `hf + ckd`, nội viện & ngoại trú | Khi chỉ bật `hf` (`S121`): phát **`[CONTINUE]` nguyên liều tối đa ARNI 97/103 + Spironolactone 50 + Dapagliflozin 10** mà không `HOLD`! Nội viện AKI (`S116`): vẫn phát `[START] rec_hf_inpatient_predischarge` (`STRONG-HF`)! | **CRITICAL (`HF-R2-R3-04`)** |
| **5. Va chạm Đa Module (9 Modules)** | `S67`, `S70`–`S79`, `S90`–`S95` | `hf` gộp với `ckd`, `dm2`, `htn`, `af`, `gout`, `copd`, `lipid` (tối đa 5 modules đồng thời ở `S79`) | Khử trùng lặp SGLT2i, chặn đối kháng Steroid MRA + Finerenone (`S70`, `S92`, `S93`), ưu tiên ARNI trước ACEi/ARB của `htn`/`ckd` (`S90`, `S91`, `S94`), đổi Losartan + giữ Dapagliflozin ở Gout (`S76`), giữ Bisoprolol chọn lọc $\beta_1$ ở COPD (`S77`) hoạt động tốt. Riêng `HF + AF` (`S72`, `S74`) tự gợi ý `Amiodarone + Digoxin` gây nổ `critical:ix.amiodarone_digoxin` mà không giảm nửa liều Digoxin! | **Major (`HF-R2-R3-14`)** |
| **6. Dẫn truyền, Tương tác CYP3A4/PDE5i, Thiết bị, Sắt TM & Cú pháp Liều** | `S80`–`S83` | Block nhĩ thất độ II–III (`HR=56`) & Suy nút xoang chưa đặt máy tạo nhịp (`HR=74`) vs Đã đặt CRT-P (`rhythm='paced'`) vs Rung nhĩ dùng Ivabradine | `S80` kê `[START] Bisoprolol`; `S81` kê `[CONTINUE] Bisoprolol` + `[CONSIDER] Ivabradine` ngay trên Block AV độ cao / Suy nút xoang chưa có máy tạo nhịp! (`S82` có máy tạo nhịp hoạt động đúng; `S83` chặn Ivabradine ở AF đúng nhưng sót `dose`). | **CRITICAL (`HF-R2-R3-05`)** |
| | `S86`–`S89`, `S96`–`S99`, `S122` | Thuốc gây hại ở HFrEF (`Diltiazem`, `Flecainide`, `Ibuprofen`, `Pioglitazone`, `Alogliptin`, `Sotalol`), ức chế CYP3A4 mạnh, `Sildenafil` + `Vericiguat`/`ISDN` | Chặn tốt CCB non-DHP, nhóm IC, NSAID, TZD, CYP3A4 mạnh và PDE-5i; nhưng **bỏ lọt hoàn toàn `Sotalol` (`S122`) và `Alogliptin` (`S89`)** khi chạy `hf` độc lập! | **CRITICAL (`HF-R2-R3-09`)** |
| | `S100`–`S112` | Sắt TM (`Hb=15.8 g/dL` + nhiễm trùng cấp `S102`), ICD/CRT (`S103`–`S107`), `Carvedilol 25 mg x 1 lần/ngày` (`S108`), `ARNI 24/26` khi `SBP=95` (`S109`), đơn vị `'viên'` (`S110`) | `S102` vẫn truyền sắt TM khi `Hb 15.8` + nhiễm trùng; `S108` bỏ qua `freq` làm nhân đôi liều Carvedilol & kích hoạt nhầm Ivabradine; `S109` ghi đè liều ARNI gấp 4 lần trên thẻ `CONTINUE`; `S110` báo `UPTITRATE` nhầm trên viên Entresto 200mg. | **CRITICAL (`HF-R2-R3-08`)**, **Major (`13`)**, **Minor (`18`)** |

---

## 4. Chi tiết 20 Phát hiện Phản biện Vòng 2 (`HF-R2-R3-01` → `HF-R2-R3-20`)

### 4.1. Nhóm Mức độ Nghiêm trọng Nhất — `CRITICAL` (9 phát hiện)

---

#### [HF-R2-R3-01] `CRITICAL` | `rule` | `hf.fmt.arni`
**Viên phối hợp liều cố định chứa ức chế men chuyển (ACEi SPC: Coveram, Preterax, Triplixam) vượt qua hoàn toàn hàng rào washout 36 giờ khi khởi trị Sacubitril/valsartan**

- **Kịch bản & Bằng chứng `evaluate()` thực tế (`S45`–`S48`):**
  - Hồ sơ: Bệnh nhân HFrEF (`LVEF = 30%`, `NYHA II`, `SBP = 138/86 mmHg`, `HR = 76 bpm`, `eGFR = 68`, `K+ = 4.3 mmol/L`), `selectedModules = ['hf', 'htn']`, đang uống một trong các viên phối hợp phổ biến nhất tại Việt Nam: `perindopril_amlodipine` (`S45`), `perindopril_indapamide` (`S46`), `perindopril_indapamide_amlodipine` (`S47`), hoặc biệt dược `coveram` (`S48`).
  - Kết quả thực tế: Engine phát trực tiếp `rec_hf_arni [START] sacubitril_valsartan` liều `Viên nén bao phim 24/26 mg (50 mg) x 2 lần/ngày (uống)`, **0 lệnh `HOLD` washout 36 giờ**, **0 lệnh `STOP`/`SWITCH` đối với viên SPC chứa Perindopril**, **0 `SafetyAlert`** (`plan.alerts = []`), và `rationale` khẳng định sai sự thật lâm sàng: *"khởi đầu liều thấp ở người chưa dùng ACEi/ARB"*.
- **Cơ chế gây hại lâm sàng:** Phối hợp đồng thời Perindopril (ức chế ACE) và Sacubitril (ức chế Neprilysin) gây ứ đọng Bradykinin cấp tính, dẫn đến **phù mạch thanh quản – hạ họng tắc nghẽn đường thở tử vong** (Chống chỉ định tuyệt đối Class III-Harm theo ESC 2026, AHA/ACC/HFSA 2022 và QĐ 1857/QĐ-BYT). Tại Việt Nam, bệnh nhân tăng huyết áp – suy tim ngoại trú dùng Coveram / Preterax / Triplixam chiếm tỷ lệ rất lớn.
- **Nguyên nhân gốc rễ (`file:line`):**
  - `src/modules/hf/helpers.ts:24-27` và `51-54`: Hằng số `ACEI_IDS` chỉ liệt kê các hoạt chất đơn (`enalapril`, `perindopril`, `lisinopril`...), và `findCurrentMed()` chỉ so khớp chuỗi `m.drugId` trực tiếp mà không gọi `getExpandedDrugIds()` để phân rã mảng `components` của viên SPC trong `kb/drugs/perindopril_*.json` hay ánh xạ biệt dược `vnBrands` (`Coveram`, `Preterax`, `Triplixam`).
  - `src/modules/hf/rules.hfref.ts:66-67`, `src/engine/safety/gates.ts:138-163`, `src/engine/safety/interactions.ts` và `src/engine/mergeClassResolver.ts`: Đều chưa phân rã thành phần hoạt chất con của viên SPC khi kiểm tra chống chỉ định phối hợp ACEi + ARNI.
- **Đề xuất khắc phục:**
  1. Cập nhật `findCurrentMed()` / `findAllCurrentMeds()` trong `src/modules/hf/helpers.ts` sử dụng `getExpandedDrugIds()` từ `src/engine/safety/drugClassify.ts` để nhận diện mọi viên phối hợp cố định chứa thành phần `ACEi` hoặc `ARB` (bao gồm tra cứu ngược `vnBrands` / `KB_DRUG_ALIASES`).
  2. Khi phát hiện viên SPC chứa ACEi, buộc `rec_hf_arni` chuyển sang `action: 'HOLD'` (chờ đủ **36 giờ washout** sau liều cuối của viên SPC), đồng thời phát lệnh `STOP` viên SPC chứa ACEi (kèm hướng dẫn tách riêng Amlodipine đơn chất nếu vẫn cần kiểm soát huyết áp trong thời gian washout).
  3. Mở rộng phân rã `components` trong `interactions.ts` và `mergeClassResolver.ts` để cảnh báo `ix.acei_arni` luôn kích hoạt với mọi viên SPC chứa ACEi.

---

#### [HF-R2-R3-02] `CRITICAL` | `rule` | `hf.fmt.arni / hf.fmt.sglt2i / hf.fmt.mra / hf.inpatient.shock_triage`
**Sốc tim đang duy trì vận mạch/inotropes có huyết áp nâng giả tạo (`SBP >= 90 mmHg`) và mọi bệnh cảnh sốc tim tại ngoại trú vẫn bị kê/tăng liều ARNI, MRA, SGLT2i, truyền sắt TM và bỏ sót lệnh chuyển cấp cứu ngoại trú**

- **Kịch bản & Bằng chứng `evaluate()` thực tế (`S29`–`S32`, `S119`):**
  - **Nội viện đang truyền Noradrenaline/Dobutamine giữ `SBP >= 90 mmHg` (`S29`: `SBP=96`, `cardiogenicShock=true`, `onInotropes=true`; `S30`: `SBP=102`, `cardiogenicShock=true`, `onInotropes=true`):** Mặc dù `rec_hf_inpatient_shock [REFER]` phát cảnh báo yêu cầu *"tạm ngưng các thuốc giãn mạch/chẹn beta"* (nhưng lại in câu lỗi toán học ngô nghê `"(SBP 102 mmHg < 90 mmHg)"` tại `rules.inpatient.ts:29`), engine đồng thời phát `rec_hf_arni [CONTINUE] 97/103 mg BID` (`S29`) và **`[UPTITRATE] tới 97/103 mg BID`** (`S30`), **`rec_hf_mra [UPTITRATE] Spironolactone 50 mg/ngày`**, `rec_hf_sglt2i [CONTINUE] Dapagliflozin 10 mg`, và **`rec_hf_iv_iron_start [START] Ferric carboxymaltose truyền TM`** ngay giữa cơn sốc tim!
  - **Ngoại trú có dấu hiệu sốc tim / giảm tưới máu mô (`S31`: `SBP=82`; `S32`: `SBP=95, cardiogenicShock=true`; `S119`: `SBP=104, cardiogenicShock=true, onInotropes=true`):** Engine phát **0 khuyến cáo `REFER`** chuyển Khoa Cấp cứu / CCU; đặc biệt ở `S32` và `S119`, bệnh nhân sốc tim bị kê `[START]` / `[UPTITRATE]` Sacubitril/valsartan, Spironolactone 50 mg, Dapagliflozin, Furosemide uống và `[CONSIDER]` Digoxin!
- **Cơ chế gây hại lâm sàng:** Bệnh nhân sốc tim SCAI B/C/D có huyết áp tâm thu `95–105 mmHg` nhờ co mạch ngoại vi bù trừ hoặc nhờ thuốc vận mạch vẫn đang giảm tưới máu tạng nghiêm trọng. Khởi trị hoặc tăng liều Sacubitril/valsartan, MRA, SGLT2i lúc này gây trụy mạch không hồi phục, suy thận cấp vô niệu và tử vong; bỏ sót lệnh chuyển viện khẩn cấp ở ngoại trú làm mất thời gian vàng hồi sức tim mạch.
- **Nguyên nhân gốc rễ (`file:line`):**
  - `src/modules/hf/rules.inpatient.ts:15` và `29`: `hf.inpatient.shock_triage` giới hạn cứng `setting: 'inpatient'`, và dòng 29 nối cứng chuỗi `< ${sbpShock} mmHg` bất kể lý do kích hoạt là `cardiogenicShock` hay `onInotropes`.
  - `src/modules/hf/rules.hfref.ts:23, 30, 230`: `when()` chỉ chặn `isAcutelyDecompensated(ctx)` khi `setting === 'inpatient'` **VÀ** `!findCurrentMed(...)`. Bên trong `produce()` (`rules.hfref.ts:82, 258` và `helpers.ts:270`), nhánh `HOLD` chỉ kiểm tra `sbp < 90` (hoặc `sbp < 95`) mà quên kiểm tra `isShockOrInotrope(ctx)`.
  - `src/modules/hf/rules.devices_iron.ts:13-54`: `hf.amt.iv_iron` không kiểm tra sốc tim hay suy tim mất bù cấp huyết động không ổn định.
- **Đề xuất khắc phục:**
  1. Đổi `hf.inpatient.shock_triage` sang `setting: 'both'` để mọi ca `isShockOrInotrope(ctx)` ở ngoại trú đều phát lệnh `REFER` khẩn cấp vào Khoa Cấp cứu/CCU, và sửa câu hiển thị SBP khi `sbp >= 90` nhưng có `cardiogenicShock` / `onInotropes`.
  2. Bổ sung kiểm tra `isShockOrInotrope(ctx)` vào nhánh `HOLD`/chặn khởi trị của toàn bộ trụ cột hạ áp/lợi tiểu uống (`evaluateHfSglt2i`, `hf.fmt.arni`, `hf.fmt.mra`, `hf.hfpef.finerenone_mra`, `hf.amt.loop_diuretic`, `hf.amt.vericiguat`, `hf.amt.digoxin`) và `reviewMedsVitalsAndRenal.ts`.
  3. Chặn `hf.amt.iv_iron` khi `isShockOrInotrope(ctx)` hoặc đang mất bù cấp chưa ổn định huyết động.

---

#### [HF-R2-R3-03] `CRITICAL` | `rule` | `hf.fmt.bb / drugClassify.ts / organAndCrisisGates.ts`
**Rò rỉ chỉ định thuốc chẹn beta đường uống (`[CONSIDER]` và `[SWITCH]` sang Bisoprolol) cùng lệnh tập luyện thể lực (`[START]`) ngay giữa cơn hen phế quản cấp mức độ nặng / đe dọa tính mạng**

- **Kịch bản & Bằng chứng `evaluate()` thực tế (`S36`, `S84`, `S85`):**
  - Hồ sơ: Bệnh nhân HFrEF (`LVEF = 32%`) đồng mắc Hen phế quản đang lên **cơn hen cấp nặng** (`speechAbility = 'words'`, `respiratoryRate = 32 lần/phút`, `pefPct = 45%`, `accessoryMuscleUse = true`, `spo2 = 91%`).
  - Kết quả thực tế: Trong khi module `asthma` phát lệnh khẩn cấp `rec_asthma_outpatient_acute_refer` (*"CHUYỂN KHOA CẤP CỨU KHẨN CẤP: Cơn hen cấp nặng"*), thở oxy + khí dung Salbutamol & Ipratropium liên tục và phát lệnh `STOP` Carvedilol (ở `S85`), thì module `hf` lại đồng thời phát **`rec_hf_bb [CONSIDER] Bisoprolol 1.25 mg`** (ở `S36`, `S84`) và **`rec_hf_bb [SWITCH] Bisoprolol 1.25 mg`** (ở `S85`), kèm **`rec_hf_cardiac_rehab [START]` tập luyện thể lực** (ở `S84`, `S85`)!
- **Cơ chế gây hại lâm sàng:** Ngay cả chẹn beta chọn lọc $\beta_1$ liều thấp (`Bisoprolol 1.25 mg`) vẫn đối kháng thụ thể $\beta_2$ phế quản đủ để triệt tiêu tác dụng cứu mạng của SABA khí dung trong cơn hen cấp nặng, gây co thắt phế quản hoàn toàn (*silent chest*), ngừng hô hấp và tử vong.
- **Nguyên nhân gốc rễ (`file:line`):**
  - `src/engine/safety/drugClassify.ts:462-490`: Hàm `hasAcuteBronchospasmOrRespFailure()` chỉ đọc các cờ `isAcuteExacerbation` / `silentChest` hoặc `spo2 < 90` / `abgPh <= 7.35`, bỏ sót toàn bộ các biến chuẩn GINA của cơn hen cấp từ `asthmaInputs` (`speechAbility === 'words' | 'phrases' | 'unable'`, `respiratoryRate >= 25–30`, `pefPct <= 50`, `accessoryMuscleUse === true`, `spo2 90–92%`).
  - `src/engine/safety/organAndCrisisGates.ts:223`: Cổng `ASTHMA-R3-R3-01` chỉ chặn `if (rec.action === 'START' || rec.action === 'CONSIDER')`, bỏ lọt hoàn toàn `rec.action === 'SWITCH'` và `'UPTITRATE'`!
- **Đề xuất khắc phục:**
  1. Bổ sung đầy đủ tiêu chuẩn cơn hen/COPD cấp GINA/GOLD vào `hasAcuteBronchospasmOrRespFailure()` tại `src/engine/safety/drugClassify.ts:462-490`.
  2. Tại `src/engine/safety/organAndCrisisGates.ts:223`, mở rộng tập hành động bị chặn thành `['START', 'CONSIDER', 'SWITCH', 'UPTITRATE']` -> chuyển sang `'DEFER'` và gán `dose: undefined`.
  3. Chặn `hf.gdit.cardiac_rehab` (`src/modules/hf/rules.devices_iron.ts:214`) khi đang co thắt phế quản cấp hoặc suy hô hấp.

---

#### [HF-R2-R3-04] `CRITICAL` | `rule` | `hf.fmt.arni / hf.fmt.sglt2i / hf.fmt.mra / hf.inpatient.predischarge_optimization`
**Trong đợt Tổn thương thận cấp (AKI Giai đoạn 2–3, thiểu niệu), khi chạy module `hf` độc lập, hệ thống vẫn phát lệnh `[CONTINUE]` nguyên liều tối đa ARNI, Spironolactone, SGLT2i mà không tạm ngưng (`HOLD`), đồng thời ở nội viện vẫn phát lệnh `[START]` khởi trị sớm GDMT uống (`STRONG-HF`) giữa đợt AKI**

- **Kịch bản & Bằng chứng `evaluate()` thực tế (`S116`, `S121`):**
  - **`S121` (`selectedModules = ['hf']`, ngoại trú):** `scr = 195 µmol/L` (`eGFR = 32.2`), `customInputs = { baselineScr: 90, akiStage: 2, urineOutputMlKgHr: 0.3 }`, `conditions = { hf: true, aki: true }`, đang dùng `sacubitril_valsartan 97/103 mg BID` + `spironolactone 50 mg` + `dapagliflozin 10 mg` + `bisoprolol 10 mg`. Engine xuất **`rec_hf_arni [CONTINUE] 97/103 mg BID`**, **`rec_hf_mra [CONTINUE] Spironolactone`**, **`rec_hf_sglt2i [CONTINUE] Dapagliflozin 10 mg`** và **`rec_hf_cardiac_rehab [START]`** với **0 lệnh `HOLD` thuốc ngày ốm**!
  - **`S116` (nội viện, `scr = 240`, `baselineScr = 110`, `akiStage = 2`, `conditions.aki = true`):** Rule `hf.inpatient.predischarge_optimization` vẫn phát **`rec_hf_inpatient_predischarge [START]`** (*"Khởi trị sớm phác đồ nền tảng GDMT trước xuất viện (STRONG-HF)"*) ngay khi thận đang tổn thương cấp giai đoạn 2!
- **Cơ chế gây hại lâm sàng:** Duy trì liều tối đa ARNI (giãn tiểu động mạch đi cầu thận) + Spironolactone 50 mg + SGLT2i (co tiểu động mạch đến) trên bệnh nhân AKI giai đoạn 2 thiểu niệu làm sụp đổ áp lực lọc cầu thận, đẩy nhanh vào hoại tử ống thận cấp vô niệu, tăng kali máu ác tính ngừng tim và nhiễm toan ceton đẳng đường huyết (KDIGO 2024 Sick-Day Rules). Trong thử nghiệm STRONG-HF, chức năng thận đang xấu đi cấp tính là tiêu chuẩn loại trừ bắt buộc trước khi khởi trị/tăng liều nhanh GDMT.
- **Nguyên nhân gốc rễ (`file:line`):**
  - `src/engine/safety/organAndCrisisGates.ts:289-324`: Cổng AKI toàn cục chỉ chặn `rec.action === 'START' || rec.action === 'UPTITRATE'`, không can thiệp `rec.action === 'CONTINUE'`.
  - `src/engine/safety/reviewMedsVitalsAndRenal.ts`: Chưa kiểm tra `detectAcuteAki(patient).isAki` để phát lệnh `HOLD` cho nhóm thuốc ngày ốm đang dùng (logic này trước đó chỉ nằm cục bộ trong module `ckd`).
  - `src/modules/hf/rules.inpatient.ts:223`: Biến `unstable` của `hf.inpatient.predischarge_optimization` quên kiểm tra `detectAcuteAki(ctx.normalized).isAki`.
- **Đề xuất khắc phục:**
  1. Trong `organAndCrisisGates.ts` và `reviewMedsVitalsAndRenal.ts`, khi `detectAcuteAki(patient).isAki === true`, chuyển `CONTINUE` của nhóm RAASi/ARNI, MRA (steroid & non-steroid) và SGLT2i sang `'HOLD'` (xóa `dose`) kèm hướng dẫn đánh giá lại thể tích tuần hoàn và Creatinin sau 48–72 giờ.
  2. Bổ sung `detectAcuteAki(ctx.normalized).isAki` vào điều kiện `unstable` tại `src/modules/hf/rules.inpatient.ts:223`.
  3. Thêm `baselineScr` (`unitKey: 'cr'`) và cờ `aki` vào `src/modules/hf/inputs.ts`.

---

#### [HF-R2-R3-05] `CRITICAL` | `missing` | `hf.fmt.bb / hf.amt.ivabradine / hf.amt.digoxin`
**Bỏ sót hoàn toàn chống chỉ định tuyệt đối Block nhĩ thất độ II–III và Hội chứng suy nút xoang (*Sick Sinus Syndrome*) khi chưa đặt máy tạo nhịp (`rhythm !== 'paced'`) đối với Chẹn beta, Ivabradine và Digoxin**

- **Kịch bản & Bằng chứng `evaluate()` thực tế (`S80`, `S81`):**
  - **`S80`:** Bệnh nhân HFrEF (`LVEF = 30%`, `HR = 56 bpm`), có Block nhĩ thất độ II Mobitz II / độ III chưa đặt máy tạo nhịp. Engine phát **`rec_hf_bb [START] Bisoprolol 1.25 mg`** chỉ vì `HR = 56 >= 50 bpm`!
  - **`S81`:** Bệnh nhân HFrEF (`LVEF = 30%`, `HR = 74 bpm` lúc khám xen kẽ cơn ngừng xoang trong Hội chứng suy nút xoang chưa đặt máy tạo nhịp, đang dùng `Bisoprolol 10 mg`). Engine phát **`rec_hf_bb [CONTINUE] Bisoprolol 10 mg`** và **`rec_hf_ivabradine [CONSIDER] Ivabradine 5 mg BID`** với `0` cảnh báo!
- **Cơ chế gây hại lâm sàng:** Trên bệnh nhân Block nhĩ thất độ II–III hoặc Suy nút xoang chưa có máy tạo nhịp bảo vệ, tần số tim một thời điểm tại phòng khám có thể vẫn đạt `55–75 bpm` (nhịp thoát bộ nối hoặc khoảng nhịp xoang xen kẽ trong hội chứng nhịp nhanh – nhịp chậm). Kê Bisoprolol, Ivabradine hoặc Digoxin ức chế nút xoang/nút nhĩ thất sẽ gây **vô tâm thu (*asystole*), ngất Adams-Stokes và đột tử**.
- **Nguyên nhân gốc rễ (`file:line`):**
  - Dữ liệu KB trong `kb/drugs/{bisoprolol,carvedilol,metoprolol_succinate,nebivolol,ivabradine,digoxin}.json` đã khai báo đầy đủ mã `'av_block_2_3'` và `'sick_sinus_syndrome'` trong `contraindications`, nhưng vòng lặp đọc `contraindications` tại `src/engine/safety/gates.ts:293-353` không xử lý hai mã này, `reviewMedsSpecialized.ts` không quét chúng, và `src/modules/hf/inputs.ts` chưa có trường nhập rối loạn dẫn truyền nhĩ thất / suy nút xoang.
- **Đề xuất khắc phục:**
  1. Bổ sung trường chọn rối loạn dẫn truyền (`avBlock2Or3`, `sickSinusSyndrome`) vào `src/modules/hf/inputs.ts` và từ điển đồng nghĩa chuẩn.
  2. Ánh xạ `contra.code === 'av_block_2_3'` và `'sick_sinus_syndrome'` (khi `patient.rhythm !== 'paced'` và chưa có máy tạo nhịp vĩnh viễn) trong `src/engine/safety/gates.ts:294-352` và `reviewMedsSpecialized.ts` để phát lệnh `AVOID` (khởi trị mới) và `STOP` + `REFER` cấy máy tạo nhịp (nếu đang dùng).

---

#### [HF-R2-R3-06] `CRITICAL` | `drug` | `sacubitril_valsartan / carvedilol / nebivolol / vericiguat / ivabradine`
**Bỏ lọt chống chỉ định suy gan nặng / xơ gan mất bù (`Child-Pugh C`) đối với các thuốc suy tim chuyển hóa mạnh qua gan; ngược lại Ivabradine lại chặn thô bạo cả bệnh gan nhẹ (`Child-Pugh A`)**

- **Kịch bản & Bằng chứng `evaluate()` thực tế (`S58`):**
  - Hồ sơ: Bệnh nhân HFrEF (`LVEF = 28%`) kèm xơ gan mất bù `Child-Pugh C` (`conditions = { hf: true, cirrhosis: true, liverDisease: true, decompensatedCirrhosis: true }`, `customInputs = { childPugh: 'C', recentWorseningHf: true }`), đang uống `Carvedilol 25 mg BID`.
  - Kết quả thực tế: Engine phát **`rec_hf_arni [START] Sacubitril/valsartan`**, **`rec_hf_bb [CONTINUE] Carvedilol 25 mg BID`** và **`rec_hf_vericiguat [CONSIDER] Vericiguat 2.5 mg`** với **0 cảnh báo chống chỉ định suy gan**! Ngược lại, tại `src/modules/hf/rules.hfref_amt.ts:25`, `Ivabradine` bị chặn ở mọi `hasCondition(ctx, 'liverDisease')` kể cả gan nhiễm mỡ nhẹ hay `Child-Pugh A`.
- **Cơ chế gây hại lâm sàng:** Carvedilol chuyển hóa bước đầu qua gan > 98% — ở xơ gan mất bù sinh khả dụng tăng gấp **4–7 lần**, gây tụt huyết áp sâu, suy thận gan (*hepatorenal syndrome*) và tử vong (chống chỉ định tuyệt đối trên nhãn thuốc và ESC 2026). Sacubitril/valsartan và Vericiguat không khuyến cáo/tránh dùng ở `Child-Pugh C` (và ở `Child-Pugh B`, Sacubitril/valsartan bắt buộc khởi đầu liều `24/26 mg BID`).
- **Nguyên nhân gốc rễ (`file:line`):**
  - Các tệp `kb/drugs/{sacubitril_valsartan,carvedilol,nebivolol,vericiguat,ivabradine,eplerenone}.json` chưa khai báo khối `"hepatic"`, và `evaluateHepaticSafety()` trong `src/engine/safety/clinicalStates.ts:37-211` chưa bao phủ nhóm thuốc suy tim.
- **Đề xuất khắc phục:**
  1. Bổ sung metadata `"hepatic"` chuẩn xác theo phân độ Child-Pugh A/B/C vào các tệp JSON thuốc suy tim trong `kb/drugs/`.
  2. Cập nhật `evaluateHepaticSafety()` (`clinicalStates.ts`): chặn (`AVOID`/`STOP`) Carvedilol & Nebivolol ở suy gan biểu hiện lâm sàng / `Child-Pugh B–C` (hướng dẫn dùng Bisoprolol liều thấp tối đa 10 mg nếu cần); chặn Sacubitril/valsartan, Ivabradine, Vericiguat và Eplerenone ở `Child-Pugh C`.
  3. Tinh chỉnh `rules.hfref_amt.ts:25` theo mức độ suy gan nặng thay vì chặn nhầm `Child-Pugh A`, và thêm ô chọn `Child-Pugh` vào `hfInputs` khi `liverDisease = true`.

---

#### [HF-R2-R3-07] `CRITICAL` | `missing` | `hf.fmt.arni / hf.fmt.sglt2i / hf.amt.vericiguat / types.ts:pregnant`
**Hệ thống mù hoàn toàn với sản phụ đang cho con bú (*lactation*): kê trực tiếp Sacubitril/valsartan, Dapagliflozin, Bisoprolol và Vericiguat; đồng thời gộp nhãn UI `"Mang thai / Cho con bú"` trên cùng cờ `pregnant` gây sai lệch hai chiều**

- **Kịch bản & Bằng chứng `evaluate()` thực tế (`S55`):**
  - Hồ sơ: Nữ 29 tuổi hậu sản bệnh cơ tim chu sản (`LVEF = 30%`, `pregnant = false`, `breastfeeding = true`, `lactating = true`, `recentWorseningHf = true`).
  - Kết quả thực tế: Engine kê thẳng **`rec_hf_arni [START] Sacubitril/valsartan`**, **`rec_hf_sglt2i [START] Dapagliflozin`**, **`rec_hf_bb [START] Bisoprolol`** và **`rec_hf_vericiguat [CONSIDER] Vericiguat`** với **0 cảnh báo cho con bú**!
- **Cơ chế gây hại lâm sàng:** SGLT2i gây độc quá trình trưởng thành ống thận trẻ sơ sinh bú mẹ; Sacubitril/valsartan và Vericiguat bài tiết qua sữa gây tụt áp/độc tính cho trẻ (`vericiguat.json` ghi rõ `lactation.status: "contra"`; `sacubitril_valsartan.json`, `dapagliflozin.json`, `bisoprolol.json` ghi `"avoid"`). Ngược lại, vì `src/engine/types.ts:190-194` gộp nhãn `"Mang thai / Cho con bú"` vào chung biến `pregnant`, nếu bác sĩ tick ô này cho sản phụ đang cho con bú, hệ thống sẽ `STOP`/`AVOID` oan cả **Enalapril** và **Spironolactone** — vốn là hai trụ cột an toàn hàng đầu được ESC khuyến cáo cho bệnh cơ tim chu sản đang cho con bú!
- **Nguyên nhân gốc rễ (`file:line`):**
  - Toàn bộ `src/engine/safety/` và `src/modules/hf/` chưa có hàm nào đọc trường `kbDrug.lactation`, còn `src/engine/types.ts:190-194` nhập nhằng hai trạng thái sinh lý trái ngược nhau về danh mục thuốc an toàn (`pregnant` vs `lactating`).
- **Đề xuất khắc phục:**
  1. Tách riêng điều kiện chuẩn `lactating` (*Đang cho con bú*) khỏi `pregnant` (*Đang mang thai*) trong `src/engine/types.ts` và UI.
  2. Xây dựng cổng an toàn cho con bú trong `vitalAndRenalGates.ts` & `reviewMeds.ts` đọc `kbDrug.lactation.status` (`'contra'` / `'avoid'`), đồng thời trong `hf` tự động chuyển hướng sang phác đồ hậu sản tương thích cho con bú (`Enalapril`/`Captopril` + `Metoprolol succinate` + `Spironolactone`).

---

#### [HF-R2-R3-08] `CRITICAL` | `rule` | `hf.fmt.arni / hf.fmt.bb`
**Thẻ `[CONTINUE]` ghi đè chuỗi liều đích tối đa (nhân gấp 4 lần liều Sacubitril/valsartan hiện tại!) hoặc hạ ngược liều Chẹn beta về mức khởi đầu khi bệnh nhân bị chặn tăng liều; đồng thời bỏ qua tần suất dùng (`freq`) làm nhân đôi liều Carvedilol**

- **Kịch bản & Bằng chứng `evaluate()` thực tế (`S10`, `S59`, `S108`, `S109`):**
  1. **Nhân gấp 4 lần liều ARNI trên bệnh nhân huyết áp biên / kali cận cao (`S59`: `K+ = 5.3 mmol/L`; `S109`: `SBP = 95 mmHg`):** Bệnh nhân đang uống `sacubitril_valsartan 24/26 mg x 2 lần/ngày`. Rule `hf.fmt.arni` (`rules.hfref.ts:101-106`) nhận diện đúng không được phép tăng liều nên chọn `action: 'CONTINUE'` (*"Tiếp tục duy trì Sacubitril/valsartan"*), **nhưng dòng 105 lại gán `dose: formatHfDose(dose('sacubitril_valsartan', 'target'))` -> in ra y lệnh `'97/103 mg x 2 lần/ngày (uống)'`** (tăng vọt gấp 4 lần ngay trên bệnh nhân `SBP 95 mmHg` / `K+ 5.3 mmol/L`)!
  2. **Hạ nhầm nửa liều Bisoprolol trên thẻ `CONTINUE` (`S10`, `S109`):** Bệnh nhân đang uống `Bisoprolol 2.5 mg/ngày` kèm sung huyết cấp (`congestion = 'overt'`). Rule `hf.fmt.bb` (`rules.hfref.ts:219`) xuất `action: 'CONTINUE'` nhưng gán `dose: '1.25 mg x 1 lần/ngày (uống); đích 10 mg...'` (tự ý giảm từ `2.5 mg` về liều khởi trị `1.25 mg`).
  3. **Bỏ qua `freq` làm nhân đôi liều Carvedilol và kích hoạt nhầm Ivabradine (`S108`):** Bệnh nhân đang uống `Carvedilol` với `dose: 25, unit: 'mg', freq: '1 lần/ngày'` (tổng liều mới `25 mg/ngày`, bằng một nửa liều đích `25 mg x 2 lần/ngày`). Hàm `isAtOrAboveTargetDose()` (`helpers.ts:110-116`) chỉ so sánh con số `25 >= 25` mà bỏ qua `freq`, kết luận nhầm đã đạt đích nên xuất `[CONTINUE]` với `dose: '25 mg x 2 lần/ngày'` (tự ý gấp đôi liều!) và mở khóa sớm sai chỉ định `[CONSIDER] Ivabradine`!
- **Cơ chế gây hại lâm sàng:** Bác sĩ hoặc điều dưỡng sao chép y lệnh từ thẻ `[CONTINUE]` sẽ kê nhầm `Entresto 97/103 mg x 2 lần/ngày` cho bệnh nhân đang huyết áp `95 mmHg` hoặc `K+ 5.3 mmol/L`, gây tụt huyết áp sốc, suy thận cấp và tăng kali máu nguy kịch.
- **Nguyên nhân gốc rễ (`file:line`):**
  - `src/modules/hf/rules.hfref.ts:105` (gán nhầm `dose(..., 'target')` cho nhánh `CONTINUE` chưa đạt đích), `rules.hfref.ts:219` (gán nhầm `dose(..., 'start')` cho nhánh `CONTINUE` khi sung huyết), và `src/modules/hf/helpers.ts:110-116` (`isAtOrAboveTargetDose` không kiểm tra tần suất dùng trong ngày).
- **Đề xuất khắc phục:**
  1. Viết helper `formatCurrentMedDose(med)` trong `src/modules/hf/helpers.ts` để giữ nguyên chính xác liều + đơn vị + tần suất hiện tại của bệnh nhân cho mọi thẻ `action === 'CONTINUE'` chưa đạt đích.
  2. Cập nhật `isAtOrAboveTargetDose()` kiểm tra cả số lần dùng/ngày (`BID` / `TID`) hoặc tổng liều 24 giờ đối với `sacubitril_valsartan`, `carvedilol`, `ivabradine`, `hydralazine`, `isosorbide_dinitrate`.

---

#### [HF-R2-R3-09] `CRITICAL` | `rule` | `hf.fmt.arni / hf.safety.harmful_meds`
**Bỏ lọt chống chỉ định dị ứng/không dung nạp ACEi/ARB (`conditions.allergyAceiArb`) khi kê Sacubitril/valsartan (gây kê đồng thời ARNI + Hydralazine/ISDN) và bỏ sót thuốc chống loạn nhịp `Sotalol` (cùng `Alogliptin`) khỏi danh sách thuốc gây hại ở HFrEF**

- **Kịch bản & Bằng chứng `evaluate()` thực tế (`S89`, `S122`, `S123`):**
  - **`S123` (`conditions = { hf: true, allergyAceiArb: true }`):** Rule `hf.fmt.rasi_fallback` (`rules.hfref.ts:135`) nhận diện đúng `rasiBlocked = true` và phát `rec_hf_hisdn [CONSIDER]` Hydralazine + Isosorbide dinitrate; **tuy nhiên** `hf.fmt.arni` (`rules.hfref.ts:34`) và `gates.ts` hoàn toàn không kiểm tra `allergyAceiArb`, dẫn đến phát đồng thời **`rec_hf_arni [START] Sacubitril/valsartan`** (chứa Valsartan!) chồng lên Hydralazine + ISDN ngay trên bệnh nhân dị ứng hệ RAS!
  - **`S122` (`selectedModules = ['hf']`, HFrEF `LVEF = 26%`, `congestion = 'overt'`, đang uống `sotalol` / `Sotalex 80 mg BID`):** Engine phát **0 lệnh `STOP`** và **0 cảnh báo** đối với Sotalol! (Tương tự ở `S89`, `alogliptin` — thuốc DPP-4i bị FDA/ESC cảnh báo làm nặng suy tim như Saxagliptin — cũng lọt hoàn toàn).
- **Cơ chế gây hại lâm sàng:** Kê Sacubitril/valsartan cho bệnh nhân có tiền sử dị ứng/phản vệ/phù mạch với ACEi/ARB kèm phối hợp thêm Hydralazine + ISDN gây phản vệ/phù mạch và tụt áp nặng. Sotalol (chẹn beta kèm kéo dài điện thế hoạt động nhóm III) làm tăng tỷ lệ xoắn đỉnh (*Torsades de Pointes*) và tử vong đột ngột ở bệnh nhân HFrEF (Chống chỉ định Class III-Harm theo ESC).
- **Nguyên nhân gốc rễ (`file:line`):**
  - `src/modules/hf/rules.hfref.ts:34` chỉ kiểm tra `priorAngioedema` mà thiếu `allergyAceiArb` (dù `rules.hfref.ts:135` ngay bên dưới có kiểm tra!).
  - `src/modules/hf/helpers.ts:37-41`: `HARMFUL_HF_DRUG_IDS` thiếu `'sotalol'` và `'alogliptin'`; `reviewMedsSpecialized.ts` không chặn `sotalol` ở HFrEF.
- **Đề xuất khắc phục:**
  1. Bổ sung `hasCondition(ctx, 'allergyAceiArb')` vào điều kiện chặn của `hf.fmt.arni` (`rules.hfref.ts:34`) và `gates.ts:138-163`.
  2. Thêm `'sotalol'` và `'alogliptin'` vào `HARMFUL_HF_DRUG_IDS` (`helpers.ts:37-41`) và bổ sung cổng chặn `sotalol` ở HFrEF (`LVEF <= 40%`) trong `gates.ts` & `reviewMedsSpecialized.ts`.

---

### 4.2. Nhóm Mức độ Nghiêm trọng Cao — `MAJOR` (7 phát hiện)

---

#### [HF-R2-R3-10] `MAJOR` | `ui` | `hf_preset_acute_decompensated_inpatient`
**Ca bệnh mẫu nội viện `"BN 4: Suy tim cấp mất bù nội viện"` bỏ quên thuộc tính `setting: 'inpatient'`, khiến giao diện mặc định chạy ở chế độ ngoại trú và kê 4 thuốc uống ngay trong cơn phù phổi cấp kháng lợi tiểu**

- **Bằng chứng thực nghiệm (`S10`–`S12` vs `S113`–`S115`):** Đối chiếu `src/modules/hf/presets.ts:77-101` với `src/modules/ckd/presets.ts:90,132`: preset `hf_preset_acute_decompensated_inpatient` không khai báo `setting: 'inpatient'`. Khi người dùng bấm nạp BN 4 trên UI mặc định (`outpatient`, `S10`–`S12`), toàn bộ dữ liệu nội viện `urinarySodium2h = 55 mmol/L` (`< 70`) và `urineOutputRate6h = 80 mL/h` (`< 100`) bị bỏ qua; thay vì gấp đôi Furosemide tĩnh mạch + xem xét Nitrat TM + hoãn khởi trị thuốc uống như `S113`–`S115`, hệ thống lại kê `[START]` Sacubitril/valsartan uống, `[START]` Dapagliflozin uống, `[START]` Spironolactone uống và `[CONSIDER]` Digoxin uống ngay giữa đợt mất bù cấp NYHA IV!
- **Đề xuất khắc phục:** Thêm `setting: 'inpatient'` vào `hf_preset_acute_decompensated_inpatient` tại `src/modules/hf/presets.ts:79`; đồng thời ở chế độ ngoại trú, nếu bệnh nhân đến khám với `NYHA IV` kèm `congestion === 'overt'`, cần phát khuyến cáo `REFER` nhập viện cấp cứu điều trị lợi tiểu tĩnh mạch thay vì khởi trị đồng loạt thuốc giãn mạch đường uống ngoại trú.

---

#### [HF-R2-R3-11] `MAJOR` | `rule` | `gates.ts / organAndCrisisGates.ts / mergeClassResolver.ts`
**Các thẻ khuyến cáo bị chặn sang hành động âm tính (`HOLD`, `AVOID`, `DEFER`) vẫn giữ nguyên chuỗi liều kê đơn hoạt động (`dose`)**

- **Bằng chứng thực nghiệm (`S04`–`S06`, `S61`, `S83`, `S90`, `S117`):**
  - `S04`–`S06` (`SBP = 92 mmHg`): `rec_hf_sglt2i` bị hạ xuống `[HOLD]` (*"TẠM HOÃN Dapagliflozin — Tụt huyết áp SBP < 95 mmHg"*) nhưng vẫn mang `dose: "10 mg x 1 lần/ngày (uống)"`.
  - `S61` (`K+ = 6.2 mmol/L`): `rec_hf_sglt2i [DEFER]` và `rec_hf_bb [DEFER]` vẫn in nguyên `dose: "10 mg..."` và `"1.25 mg..."`.
  - `S83` (Rung nhĩ): `rec_hf_ivabradine [AVOID]` (*"CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG Ivabradine"*) vẫn in `dose: "5 mg x 2 lần/ngày (uống)"`.
  - `S90`, `S91`, `S94`: `rec_ckd_rasi_start [AVOID]` vẫn giữ `dose: "50 mg 1 lần/ngày"`.
- **Nguyên nhân gốc rễ (`file:line`):** `src/engine/safety/gates.ts:368-376` và `src/engine/mergeClassResolver.ts` ghi đè `action` nhưng không xóa `dose: undefined`.
- **Đề xuất khắc phục:** Bắt buộc gán `dose: undefined` bất cứ khi nào một thẻ chuyển sang `action` thuộc `['AVOID', 'STOP', 'HOLD', 'DEFER']`.

---

#### [HF-R2-R3-12] `MAJOR` | `rule` | `hf.inpatient.iv_diuretic / merge.ts`
**Bệnh nhân suy tim mất bù cấp nội viện đang uống Furosemide tại nhà (`80 mg x 2 lần/ngày = 160 mg/ngày`) bị `merge.ts` hạ cấp lệnh tiêm tĩnh mạch từ `[START]` xuống `[CONTINUE]` thiếu tần suất (`[Đang dùng nền: 80 mg]`) và không tính ra mức liều tiêm tĩnh mạch cụ thể (`160–320 mg TM`)**

- **Bằng chứng thực nghiệm (`S34`, `S113`–`S115`):** Tại `S34` (`currentMeds = [{ drugId: 'furosemide', dose: 80, unit: 'mg', freq: '2 lần/ngày' }]`), rule `hf.inpatient.iv_diuretic` (`rules.inpatient.ts:87-111`) phát `action: 'START'`, nhưng `merge.ts` thấy trùng `drugId: 'furosemide'` nên đổi thành `CONTINUE` kèm tiêu đề `"... [Đang dùng nền: 80 mg]"` (mất `freq: '2 lần/ngày'`), còn `rules.inpatient.ts:90` chỉ in câu chung chung *"bằng 1–2 lần tổng liều uống hàng ngày"*. Bác sĩ trực nhìn nhãn `[Đang dùng nền: 80 mg]` rất dễ tiêm nhầm `80 mg TM` (thấp hơn cả tổng liều uống `160 mg/ngày`), gây thất bại giải áp sung huyết cấp.
- **Đề xuất khắc phục:** Tính tổng liều lợi tiểu quai uống 24h (nhân `dose` với số lần/ngày từ `freq`, quy đổi Torsemide/Bumetanide nếu có) ngay trong `rules.inpatient.ts:74-92` để in rõ con số mg Furosemide TM cần tiêm (`160–320 mg TM/ngày`); đồng thời sửa `merge.ts` hiển thị đầy đủ `unit + freq` trong nhãn `[Đang dùng nền: ...]` và không hạ cấp `START` xuống `CONTINUE` khi chuyển từ đường uống sang đường tiêm tĩnh mạch cấp cứu.

---

#### [HF-R2-R3-13] `MAJOR` | `drug` | `sacubitril_valsartan / ferric_carboxymaltose`
**Lỗi ghép chuỗi liều tiếng Việt hỏng cú pháp trên Sacubitril/valsartan và Ferric carboxymaltose; đồng thời cam kết Vòng 1 (`HF-R2-23`) về chặn truyền sắt tĩnh mạch khi `Hb > 15 g/dL`, nhiễm trùng cấp và phân tầng liều theo cân nặng chưa được cài đặt**

- **Bằng chứng thực nghiệm (`S01`–`S03`, `S29`, `S102`):**
  1. `rec_hf_arni` (`rules.hfref.ts:112` + `sacubitril_valsartan.json:6`) xuất chuỗi liều: `"Viên nén bao phim 24/26 mg (50 mg) x 2 lần/ngày (uống); đích 97/103 mg x 2 lần/ngày (uống)"`.
  2. `rec_hf_iv_iron_start` (`rules.devices_iron.ts:47` + `ferric_carboxymaltose.json:19-30`) xuất chuỗi lặp: `"500–1000 mg x truyền TM liều nạp (tĩnh mạch) (tối đa 500–1000 mg x đánh giá lại Ferritin & TSAT sau 3–6 tháng (tĩnh mạch))"`.
  3. Tại kịch bản `S102` (`weight = 52 kg`, `Hb = 15.8 g/dL > 15`, `activeInfection = true`, `ferritin = 60`, `tsat = 14%`): mặc dù `docs/reviews/hf/round1_RESPONSE.md` (`HF-R2-23`) ghi nhận phải kiểm tra cân nặng và Hb, mã nguồn `src/modules/hf/rules.devices_iron.ts:10-55` hoàn toàn không đọc `hb`, `weight` hay cờ nhiễm trùng cấp, vẫn phát `[START] Ferric carboxymaltose 500–1000 mg` ngay khi `Hb = 15.8 g/dL` (nguy cơ quá tải sắt/huyết khối, tiêu chuẩn loại trừ trong AFFIRM-AHF & IRONMAN) và đang nhiễm trùng toàn thân!
- **Đề xuất khắc phục:** Sửa hằng số liều sạch `'24/26 mg'` trong `rules.hfref.ts:112` & `matrices.ts:23`; viết lại `rules.devices_iron.ts:15-54` để chặn truyền sắt khi `hb > 15 g/dL`, `DEFER` khi đang nhiễm trùng toàn thân cấp, tính đúng liều nạp FCM theo khung cân nặng (`< 70 kg` vs `>= 70 kg`) & `Hb`, và chuẩn hóa chuỗi liều tiếng Việt.

---

#### [HF-R2-R3-14] `MAJOR` | `rule` | `hf.amt.digoxin + af / hf.hfpef.finerenone_mra + ckd`
**Xung đột phác đồ liên chuyên khoa: `HF + AF` tự đề xuất đồng thời `Amiodarone` + `Digoxin 125 mcg` gây nổ cảnh báo nguy kịch `critical:ix.amiodarone_digoxin` mà không tự giảm nửa liều Digoxin; `HFpEF + CKD` lệch gấp đôi liều đích Finerenone (`40 mg` vs `20 mg`)**

- **Bằng chứng thực nghiệm (`S72`, `S74`):** Trên bệnh nhân HFrEF + Rung nhĩ đáp ứng thất nhanh (`HR = 118 bpm`, `selectedModules = ['hf', 'af']`), hệ thống đồng thời sinh `rec_af_rhythm_amiodarone [CONSIDER] Amiodarone` và `rec_hf_digoxin [CONSIDER] Digoxin 125 mcg/ngày`, ngay lập tức tự kích hoạt `SafetyAlert` mức `critical:ix.amiodarone_digoxin` chống lại chính hai gợi ý của máy mà không hạ liều Digoxin xuống `<= 62.5 mcg/ngày`! Ngoài ra ở `HFpEF + CKD` khi `eGFR > 60`, `rules.hfpef.ts:85-87` đặt đích Finerenone `40 mg/ngày` (FINEARTS-HF) trong khi `ckd` đặt đích `20 mg/ngày` (FIDELIO-DKD) nhưng khi gộp thẻ chưa giải thích rõ sự khác biệt theo chỉ định.
- **Đề xuất khắc phục:** Trong `hf.amt.digoxin` (`rules.hfref_amt.ts:155-165`) và `merge.ts`, khi bệnh nhân đang dùng hoặc đồng thời được đề xuất `amiodarone`, bắt buộc giảm một nửa liều `digoxin` (`<= 62.5 mcg/ngày` hoặc cách ngày) và đính kèm yêu cầu theo dõi nồng độ Digoxin huyết thanh `< 0.8–1.0 ng/mL`; đồng thời bổ sung ghi chú hợp nhất liều đích Finerenone khi đồng mắc `HFpEF + CKD`.

---

#### [HF-R2-R3-15] `MAJOR` | `missing` | `hf.fmt.arni / hf.fmt.mra / hf.hfpef.finerenone_mra`
**Thiếu khuyến cáo chủ động `[CONSIDER]` thuốc gắn kali đường uống thế hệ mới (`Patiromer` / `Sodium zirconium cyclosilicate`) trong module `hf` khi `K+ = 5.1–5.9 mmol/L` cản trở tối ưu hóa RAASi/ARNI và MRA**

- **Bằng chứng thực nghiệm (`S04`–`S06`, `S56`, `S59`, `S60`):** Khi `K+ = 5.3–5.7 mmol/L` trên module `hf` độc lập, Spironolactone và ARNI bị `HOLD` hoặc `REDUCE`, làm mất lá chắn giảm tử vong ở HFrEF, nhưng hệ thống phát **0 thẻ gợi ý thuốc gắn kali** (dù `kb/drugs/patiromer.json` và `kb/drugs/sodium_zirconium_cyclosilicate.json` đã có sẵn trong KB).
- **Đề xuất khắc phục:** Bổ sung rule `hf.amt.potassium_binder_raasi_enabler` ở ngoại trú khi `5.0 < K+ < 6.0 mmol/L` đang làm gián đoạn khởi trị/chuẩn độ ARNI/ACEi/ARB hoặc MRA để đề xuất `[CONSIDER]` Sodium zirconium cyclosilicate (Lokelma) hoặc Patiromer (Veltassa) theo ESC 2026 & thử nghiệm DIAMOND.

---

#### [HF-R2-R3-16] `MAJOR` | `rule` | `hf.gdit.cardiac_rehab / types.ts:CONDITION_SYNONYM_GROUPS`
**Rule tập luyện thể lực (`hf.gdit.cardiac_rehab`) phát lệnh `[START]` trên bệnh nhân đang cơn hen cấp nặng, AKI giai đoạn 2, huyết áp biên `92 mmHg` hoặc thai kỳ mất ổn định; đồng thời từ điển đồng nghĩa bỏ sót `'angioedemaHistory'`**

- **Bằng chứng thực nghiệm (`S04`–`S06`, `S53`, `S54`, `S84`, `S85`, `S117`, `S121`):**
  1. `rec_hf_cardiac_rehab [START]` vẫn phát ra ở bệnh nhân cơn hen cấp nặng `SpO2 91%` chờ chuyển Cấp cứu (`S84`, `S85`), AKI giai đoạn 2 thiểu niệu (`S117`, `S121`), `SBP = 92 mmHg` kèm NYHA III + K+ 5.3 (`S04`–`S06`) và thai phụ đang phải ngưng khẩn cấp 3 thuốc độc thai (`S54`).
  2. Tại `S53`, khi truyền `conditions.angioedemaHistory = true`, `hasCondition(ctx, 'priorAngioedema')` trả về `false` vì `CONDITION_SYNONYM_GROUPS` (`src/engine/types.ts:414-445`) thiếu nhóm đồng nghĩa phù mạch, dẫn đến lọt `[START]` Sacubitril/valsartan!
- **Đề xuất khắc phục:** Chặn `hf.gdit.cardiac_rehab` (`rules.devices_iron.ts:214-223`) khi có AKI cấp, co thắt phế quản cấp, khủng hoảng cấp cứu ngoại trú, `SBP < 95 mmHg` hoặc thai kỳ chưa ổn định; bổ sung nhóm đồng nghĩa `priorAngioedema: ['priorAngioedema', 'angioedemaHistory', 'aceiAngioedema', 'historyAngioedema']` vào `types.ts` và `units.ts`.

---

### 4.3. Nhóm Khiếm khuyết Nhỏ & Đề xuất Cải tiến — `MINOR` (3) & `SUGGESTION` (1)

---

#### [HF-R2-R3-17] `MINOR` | `rule` | `hf.hfimpef.continue_gdmt`
- **Mô tả & Bằng chứng (`S16`–`S18`, `S95`):** Ở kiểu hình `HFimpEF` (`LVEF = 48%`, `priorLvef = 28%`, đang dùng đủ 4 trụ cột), hệ thống chỉ phát thẻ thuốc có `drugId` cho SGLT2i kèm một thẻ chữ chung `rec_hf_hfimpef_continue` (không có `drugId`), bỏ qua việc xuất các thẻ `[CONTINUE]` riêng lẻ cho ARNI/ACEi/ARB, Chẹn beta và MRA do `rules.hfref.ts:30, 166, 230` khóa cứng `getHfPhenotype(ctx) === 'hfref'`.
- **Đề xuất khắc phục:** Cho phép `hf.fmt.arni`, `hf.fmt.bb` và `hf.fmt.mra` đánh giá duy trì/cổng an toàn cá thể hóa trên cả các thuốc đang dùng của bệnh nhân `hfimpef` theo TRED-HF / ESC 2026.

---

#### [HF-R2-R3-18] `MINOR` | `rule` | `helpers.ts:parseNumericDoseValue`
- **Mô tả & Bằng chứng (`S110`):** Khi bác sĩ nhập thuốc theo thói quen phổ biến tại Việt Nam: `{ drugId: 'sacubitril_valsartan', name: 'Entresto 97/103mg (200mg)', dose: 1, unit: 'viên', freq: '2 lần/ngày' }`, `parseNumericDoseValue(1)` tại `src/modules/hf/helpers.ts:75-82` đọc `cur = 1 < target = 97`, dẫn đến phát nhầm lệnh `[UPTITRATE]` trên bệnh nhân đã đạt liều tối đa!
- **Đề xuất khắc phục:** Khi `med.unit` là `'viên'` (hoặc chuỗi `dose` chứa `'viên'`), trích xuất hàm lượng `mg` từ `med.name` nhân với số viên trước khi đối chiếu với `getTargetDosePrimaryNumber()`.

---

#### [HF-R2-R3-19] `MINOR` | `matrix` | `hfMatrixHFrEF / hfMatrixHFpEF`
- **Mô tả & Bằng chứng (`src/modules/hf/matrices.ts:23, 59, 100, 128, 142, 177`):** Các cột `aki` của `dapagliflozin`, `sacubitril_valsartan`, `ivabradine`, `vericiguat` đang đặt `initiate: 'caution'` thay vì `'not_rec'` (mâu thuẫn với cổng chặn khởi trị mới trong AKI của Engine và KDIGO 2024), đồng thời biến `arniLowForm` tại dòng 23 lấy `forms[0]` làm rò rỉ chuỗi `"Khởi đầu Viên nén bao phim 24/26 mg (50 mg)..."` lên bảng UI.
- **Đề xuất khắc phục:** Đổi `aki.initiate` sang `'not_rec'` kèm ghi chú không khởi trị mới & tạm ngưng trong đợt AKI cấp, và sửa `arniLowForm` thành `'24/26 mg'`.

---

#### [HF-R2-R3-20] `SUGGESTION` | `ui` | `hfInputs`
- **Mô tả & Bằng chứng (`src/modules/hf/inputs.ts:1-218`):** Khi bác sĩ Tim mạch chỉ chọn riêng module `hf`, giao diện hiện chưa có ô nhập cho `baselineScr` / cờ `aki`, `hb` (để kiểm soát trần `Hb <= 15 g/dL` và tính liều sắt tĩnh mạch theo cân nặng), `conductionBlock` (`av_block_2_3` / `sss_no_pacemaker`), `childPugh` (`A`/`B`/`C` khi có bệnh gan), và cờ `lactating` độc lập với `pregnant`.
- **Đề xuất khắc phục:** Bổ sung gọn nhẹ các trường trên vào `hfInputs` (sử dụng `visibleIf` thông minh để giao diện luôn tinh gọn).

---

## 5. Các Hàng rào An toàn Đã Vượt qua Kiểm thử Đối kháng (Positive Safety Verifications)

Bên cạnh 20 phát hiện nêu trên, thực nghiệm 123 kịch bản Vòng 2 ghi nhận nhiều cơ chế bảo vệ an toàn xuất sắc đã được đội ngũ phát triển xây dựng vững chắc:

1. **Cơ chế Fail-Closed & Chống Crash hoàn hảo (`S19`–`S25`):** `0/123` lỗi runtime; khi thiếu `lvef`, `sbp`, `k`, `scr` hoặc `hr`, hệ thống từ chối kê đơn mù và trả về `missingInputs` đầy đủ.
2. **Đối xứng tuyệt đối giữa đơn vị SI (`µmol/L`) và hệ Quy ước (`mg/dL`) (`S26` vs `S27`, `S68` vs `S69`):** Chuyển đổi `scr = 221 µmol/L` ↔ `2.5 mg/dL` cho ra cùng giá trị `eGFR = 25.0 mL/phút/1.73m²` và phác đồ y hệt nhau tới từng chữ.
3. **Washout 36 giờ ACEi đơn chất vs Chuyển trực tiếp ARB (`S41`–`S44`):** Phân biệt chuẩn xác `enalapril`/`perindopril` đơn chất (`HOLD` ARNI chờ 36h + `STOP` ACEi) với `valsartan`/`losartan` đơn chất (`SWITCH` trực tiếp sang ARNI không bắt chờ 36h).
4. **Khử trùng lặp SGLT2i xuyên viên phối hợp ĐTĐ2 (`S49`, `S50`, `S67`):** Nhận diện chính xác thành phần Dapagliflozin trong viên `Xigduo` (`dapagliflozin_metformin`) và đồng nhóm `Empagliflozin`, không bao giờ kê chồng 2 SGLT2i.
5. **Chốt chặn Lọc máu chu kỳ chống bẫy Creatinin sau lọc (`S65`):** Dù `scr = 140 µmol/L` sau chạy thận nhân tạo tạo ra eGFR giả `44 mL/phút`, cờ `dialysis = 'hemodialysis'` vẫn ghi đè chính xác để chặn ARNI, MRA, Finerenone và SGLT2i.
6. **Chống chỉ định Đái tháo đường típ 1 (`S66`) & Mang thai (`S54`) & Tăng kali máu cấp cứu `K+ >= 6.0` (`S61`, `S62`):** Chặn tuyệt đối SGLT2i ở ĐTĐ típ 1; phát lệnh `STOP` khẩn cấp thuốc độc thai ở thai phụ và `STOP` RAASi/MRA kèm `REFER` cấp cứu khi `K+ >= 6.0 mmol/L`.
7. **Tương tác Dược động học / Huyết động nguy kịch (`S70`, `S92`, `S93`, `S96`–`S99`):** Chặn tuyệt đối phối hợp kép MRA steroid (`spironolactone`/`eplerenone`) + MRA non-steroid (`finerenone`); chặn `eplerenone`, `finerenone`, `ivabradine` khi dùng chung thuốc ức chế CYP3A4 mạnh (`clarithromycin`, `itraconazole`); chặn `vericiguat` và `isosorbide_dinitrate` khi dùng chung PDE-5i (`sildenafil`).
8. **Chỉ định Thiết bị cấy ghép ICD & CRT (`S103`–`S107`):** Tuân thủ chặt chẽ điều kiện tối ưu hóa GDMT `>= 3 tháng`, kỳ vọng sống `> 1 năm`, phân tầng hình thái `LBBB` vs `non-LBBB` theo độ rộng `QRS`, và loại trừ `NYHA IV` khỏi ICD dự phòng tiên phát.

---

## 6. Kết luận & Điều kiện Mở khóa (`PASS`) cho Vòng Tiếp theo

Với **9 lỗi `CRITICAL`** và **7 lỗi `MAJOR`** được chứng minh trực tiếp qua kết quả chạy thật `evaluate()` trên 123 kịch bản đối kháng, Reviewer **R3** đưa ra phán quyết:

> ### **PHÁN QUYẾT VÒNG 2 (MODULE `hf`): `FAIL`**

**Danh sách điều kiện bắt buộc để đạt `PASS` ở vòng tái thẩm định:**
1. Phân rã thành phần hoạt chất của toàn bộ viên phối hợp cố định chứa ACEi/ARB (`Coveram`, `Preterax`, `Triplixam`...) trong cổng washout 36 giờ của ARNI và bộ kiểm tra tương tác (`HF-R2-R3-01`).
2. Chặn toàn bộ thuốc giãn mạch/lợi tiểu/MRA/SGLT2i đường uống và truyền sắt TM khi có `isShockOrInotrope(ctx)` (kể cả khi `SBP >= 90 mmHg` nhờ vận mạch) và mở rộng lệnh `REFER` sốc tim sang cả ngoại trú (`HF-R2-R3-02`).
3. Bổ sung tiêu chuẩn cơn hen/COPD cấp GINA vào `hasAcuteBronchospasmOrRespFailure()` và chặn cả hành động `SWITCH`/`UPTITRATE` đối với Chẹn beta trong đợt co thắt phế quản cấp (`HF-R2-R3-03`).
4. Chuyển `CONTINUE` của nhóm thuốc ngày ốm (ARNI/ACEi/ARB, MRA, SGLT2i) sang `HOLD` trong đợt AKI cấp khi chạy `hf` độc lập, đồng thời chặn `STRONG-HF predischarge` khi đang AKI (`HF-R2-R3-04`).
5. Cài đặt cổng chống chỉ định `av_block_2_3` & `sick_sinus_syndrome` chưa có máy tạo nhịp (`HF-R2-R3-05`), phân tầng suy gan `Child-Pugh` cho các thuốc suy tim (`HF-R2-R3-06`), và tách riêng cổng an toàn `lactating` (cho con bú) khỏi `pregnant` (`HF-R2-R3-07`).
6. Bảo toàn đúng liều đang dùng của bệnh nhân trên mọi thẻ `CONTINUE` và kiểm tra tần suất `freq` khi xét đạt liều đích (`HF-R2-R3-08`).
7. Kiểm tra `allergyAceiArb` trước khi kê ARNI và bổ sung `sotalol` / `alogliptin` vào danh sách thuốc cần ngừng ở HFrEF (`HF-R2-R3-09`).
8. Khắc phục trọn vẹn 7 lỗi `MAJOR` (`HF-R2-R3-10` → `HF-R2-R3-16`): thêm `setting: 'inpatient'` cho Preset BN 4, xóa `dose` trên mọi thẻ `HOLD`/`AVOID`/`DEFER`, tính liều Furosemide tĩnh mạch cụ thể không bị hạ thành `CONTINUE`, sửa chuỗi liều & chặn truyền sắt TM khi `Hb > 15 g/dL` / nhiễm trùng cấp, tự giảm nửa liều Digoxin khi đi kèm Amiodarone, bổ sung gợi ý thuốc gắn kali (`SZC`/`Patiromer`), và siết cổng an toàn tập phục hồi chức năng + đồng nghĩa `angioedemaHistory`.
