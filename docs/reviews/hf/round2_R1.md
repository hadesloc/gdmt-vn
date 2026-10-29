# GDMT-VN – Báo Cáo Phản Biện Độc Lập Vòng 2 Module Suy Tim (`hf`)
## Vai Trò R1: Chuyên Gia Chuyên Khoa Suy Tim & Kiểm Định Khuyến Cáo Gốc (Guideline Specialist)

- **Module kiểm định:** `hf` — Suy tim mạn & cấp (`src/modules/hf/**`, `kb/thresholds/hf.json`, `kb/citations/hf.json`, 17 hồ sơ thuốc HF trong `kb/drugs/*.json`)
- **Người duyệt:** **R1 – Chuyên gia Tim mạch / Suy tim (Independent Guideline Checker)**
- **Vòng duyệt:** **Vòng 2 (Độc lập hoàn toàn – Không tham khảo báo cáo Vòng 2 của R2/R3, không can thiệp mã nguồn sản xuất)**
- **Ngày hoàn thành:** 2026-10-27
- **Phương pháp kiểm định:**
  1. Đối chiếu trực tiếp từng dòng mã nguồn của 12 tệp trong `src/modules/hf/`, tầng an toàn động cơ (`src/engine/`), 75 ngưỡng trong `kb/thresholds/hf.json`, 108 trích dẫn trong `kb/citations/hf.json` (+ `kb/citations/_sample.json`), và toàn bộ các tệp thuốc suy tim trong `kb/drugs/`.
  2. Mở trang văn bản gốc và kiểm tra nguyên văn từng khuyến cáo, bảng liều, phân loại mức khuyến cáo / mức bằng chứng (COR/LOE) trên bộ PDF chuẩn trong thư viện y khoa:
     - **ESC 2026 (`INTL`):** `ESC_2026_Heart_Failure_Guideline.pdf` & `ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf`
     - **AHA/ACC/HFSA 2022 & ACC 2026 (`US`):** `AHA_ACC_HFSA_2022_Heart_Failure_Guideline.pdf` & `ACC_2026_ECDP_HFpEF.pdf`
     - **Bộ Y tế Việt Nam (`VN`):** `BYT_1857_Huong_dan_suy_tim_signed_8e519ed3f9.pdf` (Quyết định 1857/QĐ-BYT ngày 05/07/2022)
     - **Nhãn gốc FDA:** `FDA_label_sacubitril_valsartan.pdf`, `FDA_label_ivabradine.pdf`, `FDA_label_vericiguat.pdf` (Rev. 01/2026), `FDA_label_digoxin.pdf` (Rev. 10/2025), `FDA_label_finerenone.pdf` (Rev. 09/2026), `FDA_label_spironolactone.pdf`, `FDA_label_eplerenone.pdf`.
  3. Chạy thực nghiệm trực tiếp hàm `evaluate()` trên 39 kịch bản lâm sàng đối chứng đa hồ sơ (`INTL` / `US` / `VN`) và toàn bộ 6 ca mẫu (`hfPresets`) để xác minh hành vi đầu ra thực tế.

---

## TỔNG HỢP KẾT QUẢ & KẾT LUẬN CUỐI CÙNG

| Mức độ nghiêm trọng (`severity`) | Số lượng | Mã phát hiện (`id`) |
|---|---:|---|
| **`critical`** *(Có thể gây hại trực tiếp cho bệnh nhân nếu làm theo)* | **5** | `HF-R2-R1-01` → `HF-R2-R1-05` |
| **`major`** *(Sai khuyến cáo/liều/ngưỡng/nguồn trích dẫn hoặc bỏ sót khuyến cáo Class I)* | **10** | `HF-R2-R1-06` → `HF-R2-R1-15` |
| **`minor`** *(Sai lệch mức bằng chứng hiển thị, chi tiết ma trận, quy đổi liều phụ)* | **7** | `HF-R2-R1-16` → `HF-R2-R1-22` |
| **`suggestion`** *(Đề xuất hoàn thiện chiều sâu chuyên khoa giai đoạn D & cận lâm sàng)* | **3** | `HF-R2-R1-23` → `HF-R2-R1-25` |
| **TỔNG CỘNG** | **25** | Khớp 1:1 với `docs/reviews/hf/round2_R1.json` |

> ### **KẾT LUẬN CUỐI CÙNG (FINAL VERDICT): `FAIL`**
> Theo quy định tại `docs/REVIEW_PROTOCOL.md` (chỉ đạt `PASS` khi **`0 critical` và `0 major`**), module `hf` **CHƯA ĐẠT (`FAIL`)** ở Vòng 2 do còn tồn tại **5 lỗi `critical`** đe dọa trực tiếp an toàn người bệnh và **10 lỗi `major`** sai lệch nghiêm trọng so với ESC 2026, AHA/ACC/HFSA 2022, ACC 2026 ECDP HFpEF, BYT QĐ 1857/2022 và nhãn thuốc FDA.

---

## PHẦN 1. KIỂM ĐỊNH HỒI QUY VÒNG 1 (`ROUND 1 REGRESSION AUDIT`)

Ghi nhận nỗ lực tái cấu trúc lớn của đợt khắc phục Vòng 1 (`round1_RESPONSE.md`): tách `rules.ts` thành 6 tệp mô-đun rõ ràng, chuẩn hóa `thFor()` xóa bỏ các phép nhân/chia mượn ngưỡng thô (`30 * 3`, Spironolactone `30 mg` ở cột `g3b`), bổ sung `torsemide` vào `LOOP_DIURETIC_IDS`, tuân thủ nghiêm ngặt chỉ đạo `ASTHMA-R2-208` (không gợi ý Carvedilol khi có hen phế quản, tự động chuyển Propranolol sang Bisoprolol ở ngoại trú hoặc ngưng ở nội viện), bổ sung cổng thai kỳ xuyên suốt và cập nhật hở van hai lá cơ năng thất trái (M-TEER Class I-B1).

Tuy nhiên, kiểm định độc lập trên mã nguồn và kết quả chạy `evaluate()` cho thấy **nhiều tuyên bố "ĐÃ KHẮC PHỤC" trong `round1_RESPONSE.md` thực chất chưa triệt để hoặc đã làm phát sinh lỗi hồi quy mới nguy hiểm**:

| Hạng mục Vòng 1 (`round1_RESPONSE.md`) | Kết quả kiểm chứng Vòng 2 | Nhận định thực chứng trên mã nguồn & `evaluate()` |
|---|---|---|
| `HF-R1-001` (Tách kiểu hình LVEF, chặn `lvef === undefined`, không kê ARNI/BB cho HFpEF) | **Đạt một phần – Lỗi ở `INTL` & `HFimpEF`** | Đã chặn `lvef === undefined` và không kê ARNI/BB cho `LVEF >= 50%`. Tuy nhiên `getHfPhenotype` (`helpers.ts:121-135`) bỏ qua hoàn toàn định nghĩa mới **HFrEF `< 50%`** của ESC 2026 dưới `INTL` (`HF-R2-R1-08`) và làm hỏng cả cổng an toàn lẫn tái lập trụ cột ở `HFimpEF` (`HF-R2-R1-05`). |
| `HF-R1-002` & `ASTHMA-R2-208` (Chẹn beta trong hen, thai kỳ, sung huyết cấp & nội viện) | **Còn kẽ hở `critical`** | Đã loại bỏ hoàn toàn Carvedilol khi có hen. Nhưng tại `rules.hfref.ts:200-212`, nhánh `if (hasAsthma \|\| preg)` đặt **trước** kiểm tra `congestion === 'overt'` (dòng 215), khiến bệnh nhân hen hoặc mang thai đang sung huyết phổi rõ vẫn bị phát lệnh **`[UPTITRATE] Bisoprolol`** (`HF-R2-R1-03`). |
| `HF-R1-003` & `R3-HF-14` (Chuyển ACEi/ARB sang ARNI & washout 36 giờ) | **Chưa đạt – Còn lỗi `critical` & `major`** | 1) Khi bệnh nhân đang dùng đồng thời cả `enalapril` + `sacubitril_valsartan` trong `currentMeds`, biểu thức `const needWashout = !activeArni && ...` (`rules.hfref.ts:80`) tắt hoàn toàn cảnh báo, phát **`[UPTITRATE] Sacubitril/valsartan`** mà không hề ngưng `enalapril` (`HF-R2-R1-01`).<br>2) Bệnh nhân ổn định đang dùng `enalapril` nhận `HOLD (dose: undefined)` thay vì `SWITCH` (`HF-R2-R1-07`).<br>3) Chuyển từ ARB liều thấp (`valsartan 40 mg`) dưới `US` bị kê vọt `49/51 mg BID` trái nhãn FDA §2.6 (`HF-R2-R1-07`). |
| `HF-R1-004` & `HF-R1-005` (Cổng thai kỳ; sửa liều Spironolactone cột `g3b` = `12.5 mg/ngày`) | **Đã khắc phục thực chất** | Xác nhận `matrices.ts` đã hiển thị đúng `12.5 mg/ngày (hoặc 25 mg cách ngày)` và các thuốc độc thai phát `STOP`/`AVOID` khi `pregnant === true`. |
| `HF-R1-006` & `R3-HF-04` (Xử trí nội viện suy tim cấp & sốc tim) | **Còn 2 lỗi `critical`** | 1) Trong **sốc tim huyết áp bình thường nhờ vận mạch** (`cardiogenicShock: true, onInotropes: true, sbp: 95`), hệ thống vẫn phát `CONTINUE`/`UPTITRATE` cho ARNI + Spironolactone, hoặc `START` mới SGLT2i + Finerenone + Sắt TM, kèm câu giải thích lỗi toán học `"SBP 95 mmHg < 90 mmHg"` (`HF-R2-R1-02`).<br>2) Khi nội viện chưa nhập `congestion` (`undefined`), `rules.inpatient.ts:43, 122` bị fail-open: ra lệnh tiêm Furosemide 40 mg TM + truyền Nitrat TM đồng thời với khởi trị 4 trụ cột uống trước xuất viện (`HF-R2-R1-03`). |
| `HF-R1-007` & `HF-R1-013` (Chỉ định và chống chỉ định ICD & CRT) | **Còn lỗi `major` đa hồ sơ** | Đã chặn ICD ở NYHA IV / `< 40` ngày sau NMCT. Nhưng CRT áp cứng ngưỡng ESC `< 130 ms` thành `AVOID (Class III)` cho cả profile `US` ở `QRS 120–129 ms LBBB` (trái ngược `COR 2a` của AHA 2022), hạ ngầm `QRS >= 150 ms` khi thiếu `qrsMorphology`, bỏ sót CRT rung nhĩ, và ghi sai `(Class IIa-B1)` cho ICD không thiếu máu cục bộ ở `US` (`COR 1-A`) (`HF-R2-R1-11`). |
| `HF-R1-009` & `HF-R2-10` (Finerenone ở HFpEF/HFmrEF & phân nhóm MRA) | **Còn lỗi `major`** | `hf.fmt.mra` gộp `finerenone` vào HFrEF `LVEF <= 40%` (chỉ định ngoài nhãn FDA) và gọi nhầm Finerenone là `"MRA steroid"` khi `eGFR = 28`; ở HFpEF lệch điểm biên `eGFR = 60` (`> 60` thay vì `>= 60`), tăng liều ở `K+ = 5.0`, và phát `REDUCE` trên viên thấp nhất `10 mg` (`HF-R2-R1-10`). |
| `HF-R1-011` & `HF-R2-23` (Bù sắt tĩnh mạch: ngưỡng Ferritin `< 100` & tính liều theo cân nặng/Hb) | **Tuyên bố chưa đúng thực tế (`major`)** | Đã sửa `ferritin < 100`, nhưng: (1) dùng `lvef >= 45` làm rơi bệnh nhân `LVEF = 45%` (và `45–49%` theo ESC 2026); (2) ghi sai `loe: "A"` trong `kb/citations/hf.json` (thực tế ESC 2026 là `B1`); (3) **tuyên bố ở `HF-R2-23` rằng đã tính liều theo cân nặng & Hb là không đúng** — `rules.devices_iron.ts:47` ghép chuỗi lỗi ngữ pháp và không hề kiểm tra `weight`, `hb` hay chống chỉ định `Hb > 15 g/dL` (`HF-R2-R1-14`). |
| `HF-R1-012` (Ivabradine: điều kiện chẹn beta & chuẩn độ nhịp tim) | **Phát sinh lỗi `critical`** | Ra lệnh `UPTITRATE` lên `7.5 mg BID` ở `HR = 52 bpm` (trái nhãn FDA §2.1: `50–60 bpm` phải giữ nguyên liều), fail-open phát `UPTITRATE` khi thiếu cả `HR` lẫn `SBP`, gợi ý khởi trị khi đang `congestion: 'overt'`, và loại bỏ bệnh nhân chỉ dung nạp chẹn beta dưới liều đích (`HF-R2-R1-04`). |
| `HF-R1-015` & `HF-R2-11` (GLP-1 RA ở HFpEF béo phì: liều & cổng MTC/MEN2) | **Tuyên bố sai thực tế (`major`)** | `round1_RESPONSE.md` dòng 48 & 76 khẳng định "không hardcode sai liều" và "kiểm tra bệnh sử MTC-MEN2", nhưng thực tế `rules.hfpef.ts:213` vẫn gán cứng liều Semaglutide **`0.25 mg -> 2.4 mg/tuần`** cho bệnh nhân đang dùng **`tirzepatide`** (sai gấp 10 lần!) và không hề có kiểm tra `mtc`/`men2` trong code (`HF-R2-R1-06`). |
| `HF-R1-019` & `HF-R1-020` (100% trích dẫn thật trong KB, 0 mượn trích dẫn chéo thuốc QA-7) | **Vi phạm `major` (`QA-7`)** | Còn **28 vị trí** phụ thuộc vào `kb/citations/_sample.json` (với 1 quote bị cắt cụt giữa câu) và **7 ngưỡng** trong `kb/thresholds/hf.json` mượn trích dẫn của Ivabradine, Lợi tiểu quai, MRA, ARNI, Chẹn beta để hợp thức hóa ngưỡng cho Digoxin và ARNI (`HF-R2-R1-15`). |

---

## PHẦN 2. CHI TIẾT 25 PHÁT HIỆN ĐỘC LẬP VÒNG 2

---

### A. NHÓM LỖI NGHIÊM TRỌNG ĐE DỌA AN TOÀN NGƯỜI BỆNH (`CRITICAL` — 5 PHÁT HIỆN)

#### `[HF-R2-R1-01]` Phối hợp đồng thời ACEi + ARNI (chống chỉ định tuyệt đối Class III: Harm) bị bỏ lọt hoàn toàn và còn được lệnh tăng liều ARNI; ngược lại ở bệnh nhân đang dùng ACEi vào sốc tim / tăng kali máu nặng, luật phát thông điệp sai lệch "chờ đủ 36 giờ washout ACEi"
- **Mức độ:** `critical` | **Loại:** `rule` | **Đối tượng:** `hf.fmt.arni` (`src/modules/hf/rules.hfref.ts:80-95`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - Tại `src/modules/hf/rules.hfref.ts:80`, biểu thức:
    ```ts
    const needWashout = !activeArni && Boolean(activeAcei || need(ctx, 'takingAcei') === true);
    ```
    tắt hoàn toàn kiểm tra washout ngay khi `activeArni` có mặt trong `currentMeds`. Cùng lúc đó, `src/engine/safety/duplicates.ts` chỉ can thiệp khi rule sinh hành động `START` (không kiểm tra khi rule sinh `CONTINUE` hoặc `UPTITRATE`), và cũng không phát hiện trùng lặp chéo giữa nhóm ACEi với nhóm ARNI.
  - **Thực nghiệm 1 (Dùng đồng thời ACEi + ARNI):** Bệnh nhân HFrEF ngoại trú (`lvef: 30, nyha: 2, sbp: 120, hr: 72, k: 4.4, scr: 1.0`) có `currentMeds: [{ drugId: 'enalapril', doseMg: 10 }, { drugId: 'sacubitril_valsartan', doseMg: 100 }]` → `evaluate()` trả về:
    - `[UPTITRATE] id=rec_hf_arni | drugId=sacubitril_valsartan | dose="Tăng dần mỗi 2–4 tuần tới đích 97/103 mg x 2 lần/ngày"`
    - **0 cảnh báo `STOP enalapril`**, **0 `safetyAlerts`** về nguy cơ phù mạch thanh quản tử vong!
  - **Thực nghiệm 2 (Đang dùng ACEi vào sốc tụt áp + tăng kali máu ác tính):** Bệnh nhân HFrEF (`sbp: 82, k: 6.2, currentMeds: [{ drugId: 'enalapril', doseMg: 10 }]`) → Do `if (needWashout)` (dòng 86) đặt **trước** `sbp < 90` và `k > 5.5` (dòng 88–95), hệ thống phát: `[HOLD] "Tạm hoãn Sacubitril/valsartan chờ đủ 36 giờ washout ACEi"` thay vì cảnh báo chống chỉ định do sốc tụt áp và tăng kali máu 6.2 mmol/L.
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **ESC 2026 Supp Table S5** (*PDF tr. 13*): *"Concomitant use with ACE-I — Contraindicated. Do not administer within 36 h of switching from or to an ACE-I."*
  - **AHA/ACC/HFSA 2022 §7.3.1, Rec 6 (COR 3: Harm, LOE B-R)** (*PDF tr. 41*): *"Sacubitril/valsartan should not be administered concomitantly with ACEi or within 36 hours of the last dose of an ACEi."*
  - **FDA Entresto Label §4 Contraindications** (*PDF tr. 4*): *"Entresto is contraindicated... with concomitant use of an ACE inhibitor. Do not administer within 36 hours of switching from or to an ACE inhibitor."*
- **Hướng khắc phục:**
  1. Kiểm tra ngay đầu `hf.fmt.arni` (và bổ sung trong tầng tương tác toàn cục): nếu `activeArni && activeAcei`, phát khuyến cáo khẩn cấp (`priority: 100`, `action: 'STOP'`) yêu cầu ngưng ngay ACEi và tạm ngưng Sacubitril/valsartan ít nhất 36 giờ kể từ liều ACEi cuối cùng, theo dõi sát phù mạch đường thở.
  2. Đưa toàn bộ cổng an toàn cấp tính (`isShockOrInotrope(ctx)`, `sbp < 90`, `egfr < 15`, `k > 5.5`) lên **trước** nhánh `needWashout`.

---

#### `[HF-R2-R1-02]` Trong sốc tim huyết áp bình thường nhờ vận mạch (`normotensive cardiogenic shock`), hệ thống vừa phát lệnh chuyển ICU/ngưng thuốc giãn mạch nhưng đồng thời ra lệnh `CONTINUE`/`UPTITRATE` ARNI + Spironolactone (HFrEF), hoặc `START` mới SGLT2i + Finerenone (HFpEF) và `START` Sắt tĩnh mạch giữa cơn sốc tim
- **Mức độ:** `critical` | **Loại:** `rule` | **Đối tượng:** `hf.inpatient.shock_triage` / `hf.fmt.arni` / `hf.fmt.mra` / `hf.hfpef.sglt2i` / `hf.hfpef.finerenone_mra` / `hf.amt.iv_iron`
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - Tại `src/modules/hf/rules.hfref.ts:30, 82, 101` (ARNI) và `:230, 258, 271` (MRA), khi thuốc đang có trong `currentMeds`, điều kiện tạm ngưng chỉ kiểm tra `sbp < 90` mà **bỏ qua hoàn toàn `isShockOrInotrope(ctx)`** (`cardiogenicShock === true` hoặc `onInotropes === true`).
  - Nghiêm trọng hơn, `hf.hfpef.sglt2i` (`rules.hfpef.ts:15-19`), `hf.hfpef.finerenone_mra` (`rules.hfpef.ts:32-36`), và `hf.amt.iv_iron` (`rules.devices_iron.ts:15-54`) **không hề có bất kỳ cổng kiểm tra `isShockOrInotrope(ctx)` hay `isAcutelyDecompensated(ctx)` nào**.
  - **Thực nghiệm 1 (HFrEF sốc tim đang truyền Dobutamine/Noradrenaline giữ `SBP = 95 mmHg`):** `setting: 'inpatient', lvef: 25, sbp: 95, customInputs: { cardiogenicShock: true, onInotropes: true }` trên nền ARNI 49/51 + Spironolactone 25 + Bisoprolol 5 → `evaluate()` phát đồng thời:
    - `[REFER] id=rec_hf_inpatient_shock` — với câu giải thích sai toán học tại `rules.inpatient.ts:27`: **`"Bệnh nhân có dấu hiệu sốc tim / giảm tưới máu mô nặng (SBP 95 mmHg < 90 mmHg)..."`**!
    - `[CONTINUE] id=rec_hf_arni | "Tiếp tục duy trì Sacubitril/valsartan liều đích"`
    - `[UPTITRATE] id=rec_hf_mra | "Chuẩn độ tăng liều Spironolactone tới liều đích 50 mg/ngày"`!
  - **Thực nghiệm 2 (HFpEF sốc tim `lvef: 55, sbp: 95, cardiogenicShock: true`):** Phát `[START] Dapagliflozin 10 mg` + `[START] Finerenone 10 mg` ngay trong sốc tim, mâu thuẫn trực tiếp với `[DEFER] rec_hf_inpatient_predischarge`.
  - **Thực nghiệm 3 (HFrEF sốc tim tụt áp `sbp: 82, cardiogenicShock: true, ferritin: 45, tsat: 14`):** Vẫn phát `[START] Ferric carboxymaltose 500–1000 mg truyền TM` giữa cơn sốc tim!
  - Ngoài ra `hf.inpatient.vasodilator` (`rules.inpatient.ts:122`) cũng thiếu `!isShockOrInotrope(ctx)`.
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **ESC 2026 §7.3.4 & Table 13** (*PDF tr. 44*): *"CS may also present as hypoperfusion with normotension"* và định nghĩa giảm tưới máu cần can thiệp (*"inotrope, vasopressor, or mechanical support"*).
  - **ESC 2026 §6.1.6** (*PDF tr. 35*): *"Temporary discontinuation of beta-blockers and ARNIs/ACE-Is/ARBs is advised in patients with severe haemodynamic instability (e.g. cardiogenic shock)."*
  - **AHA/ACC/HFSA 2022 §9.3 & §9.5** (*PDF tr. 74–76*): Chỉ tái lập / khởi trị GDMT đường uống sau khi đã ổn định huyết động và ngưng thuốc vận mạch / tăng co bóp tĩnh mạch ít nhất 24 giờ.
- **Hướng khắc phục:**
  1. Bổ sung cổng `isShockOrInotrope(ctx)` vào mọi quy tắc trụ cột HFrEF và HFpEF (`hf.fmt.arni`, `hf.fmt.mra`, `hf.fmt.sglt2i`, `hf.hfpef.sglt2i`, `hf.hfpef.finerenone_mra`): nếu đang dùng thì phát `HOLD`, nếu chưa dùng thì chặn khởi trị mới; đồng thời chặn hoàn toàn `hf.amt.iv_iron` và `hf.inpatient.vasodilator` khi đang sốc tim hoặc truyền vận mạch/inotrope.
  2. Chặn khởi trị mới Finerenone/SGLT2i nội viện khi `isAcutelyDecompensated(ctx)` đồng bộ với HFrEF.
  3. Sửa chuỗi văn bản tại `rules.inpatient.ts:27` để phân biệt rõ trường hợp sốc tim còn duy trì `SBP >= 90 mmHg` nhờ thuốc vận mạch với trường hợp `SBP < 90 mmHg`.

---

#### `[HF-R2-R1-03]` Vi phạm nguyên tắc Fail-Closed khi thiếu `congestion` (`QA-9`): bệnh nhân nội viện chưa nhập tình trạng sung huyết bị ra lệnh đồng thời tiêm Furosemide 40 mg tĩnh mạch + truyền Nitrat cấp cứu VÀ khởi trị sớm 4 trụ cột uống trước xuất viện; đồng thời nhánh hen/thai kỳ của `hf.fmt.bb` ra lệnh tăng liều Bisoprolol ngay khi đang sung huyết phổi rõ (`congestion: 'overt'`)
- **Mức độ:** `critical` | **Loại:** `rule` | **Đối tượng:** `hf.inpatient.iv_diuretic` / `hf.inpatient.vasodilator` / `hf.fmt.bb`
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - Khi `customInputs.congestion === undefined`, `getCongestionStatus(ctx)` trả về `undefined`.
    - Tại `src/modules/hf/rules.inpatient.ts:43`: `getCongestionStatus(ctx) !== 'euvolaemic'` đánh giá `undefined !== 'euvolaemic'` → **`true` (fail-open)**.
    - Tại `src/modules/hf/rules.inpatient.ts:122`: `if (getCongestionStatus(ctx) === 'euvolaemic') return false;` → **`false` (fail-open)**.
    - Trong khi đó tại `src/modules/hf/helpers.ts:145`: `isAcutelyDecompensated` kiểm tra `getCongestionStatus(ctx) === 'overt'` → **`false`**!
  - **Thực nghiệm 1 (Nội viện chưa chọn mức sung huyết):** `setting: 'inpatient', lvef: 30, nyha: 3, sbp: 125, hr: 84, k: 4.2, scr: 1.0, customInputs: {}` → `evaluate()` xuất cùng lúc **8 khuyến cáo tự mâu thuẫn nhau**:
    1. `[START] Furosemide 40 mg tiêm tĩnh mạch — Giải áp sung huyết cấp`
    2. `[CONSIDER] Isosorbide dinitrate — Giãn mạch tĩnh mạch giảm tiền gánh trong suy tim cấp`
    3. `[START] Sacubitril/valsartan 24/26 mg x 2`
    4. `[START] Bisoprolol 1.25 mg x 1` *(khởi trị chẹn beta ngay khi chưa biết bệnh nhân có đang phù phổi cấp hay không!)*
    5. `[START] Spironolactone 25 mg x 1`
    6. `[START] Dapagliflozin 10 mg x 1`
    7. `[START] rec_hf_inpatient_predischarge` — *"Sau khi đã giải quyết sung huyết cấp và ổn định huyết động..."*!
  - **Thực nghiệm 2 (Bệnh nhân hen đang sung huyết rõ `congestion: 'overt'`):** Tại `src/modules/hf/rules.hfref.ts:200-212`, nhánh `if (hasAsthma || preg)` trả về `UPTITRATE` trước khi dòng 215 kịp kiểm tra `getCongestionStatus(ctx) === 'overt'`. Chạy `evaluate()` với `asthma: true, currentMeds: [{ drugId: 'bisoprolol', doseMg: 2.5 }], customInputs: { congestion: 'overt' }` phát **`[UPTITRATE] Bisoprolol`** ngay giữa đợt quá tải dịch cấp!
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **ESC 2026 Rec Table 8** (*PDF tr. 47*): *"Intravenous loop diuretics are recommended for all patients with AHF admitted with signs/symptoms of fluid overload to improve symptoms (Class I, Level C)."*
  - **ESC 2026 Supp Table S6** (*PDF tr. 14–15*) & **BYT QĐ 1857/2022** (*PDF tr. 14*): Chống chỉ định khởi trị hoặc tăng liều chẹn beta khi bệnh nhân đang sung huyết/ứ dịch rõ, chỉ khởi trị/tăng liều khi đã hết ứ dịch (*euvolaemic*).
- **Hướng khắc phục:**
  1. Trong `rules.inpatient.ts`, nếu `setting === 'inpatient'` và `getCongestionStatus(ctx) === undefined`, phát `missingInputRec('hf', 'congestion', ...)` và chặn fail-closed cả lợi tiểu quai TM, thuốc giãn mạch TM lẫn khởi trị mới chẹn beta / tối ưu trước xuất viện; chỉ kích hoạt lợi tiểu/giãn mạch TM khi `congestion === 'mild' || congestion === 'overt'`.
  2. Tại `rules.hfref.ts:200`, đưa cổng kiểm tra `getCongestionStatus(ctx) === 'overt'` lên **trước** nhánh `if (hasAsthma || preg)` để không bao giờ phát `START` hoặc `UPTITRATE` chẹn beta khi đang sung huyết rõ.

---

#### `[HF-R2-R1-04]` Ivabradine mắc 4 lỗi an toàn và chỉ định nghiêm trọng: (1) ra lệnh `UPTITRATE` lên `7.5 mg x 2` khi nhịp tim đã ở vùng mục tiêu `50–60 bpm` (`HR = 52 bpm`); (2) fail-open phát `UPTITRATE` mù khi thiếu cả `HR` và `SBP`; (3) gợi ý khởi trị khi đang sung huyết mất bù cấp (`congestion: 'overt'`); (4) chặn chỉ định ở bệnh nhân đã đạt liều chẹn beta tối đa dung nạp dưới liều đích
- **Mức độ:** `critical` | **Loại:** `rule` | **Đối tượng:** `hf.amt.ivabradine` (`src/modules/hf/rules.hfref_amt.ts:21, 27, 50-62`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - Tại `src/modules/hf/rules.hfref_amt.ts:50-55`, khi bệnh nhân đang dùng Ivabradine, rule chỉ chặn `hr < 50`, sau đó so sánh liều hiện tại với `7.5 mg` qua `isAtOrAboveTargetDose(ctx, activeIva)` mà không kiểm tra ngưỡng duy trì `50–60 bpm`.
  - **Thực nghiệm 1 (`HR = 52 bpm`):** Bệnh nhân HFrEF đang uống `ivabradine 5 mg` với `hr: 52, sbp: 118` → `evaluate()` phát **`[UPTITRATE] id=rec_hf_ivabradine | dose="Tăng lên 7.5 mg x 2 lần/ngày"`**! Đẩy liều Ivabradine từ 5 mg lên 7.5 mg BID ở bệnh nhân có nhịp tim lúc nghỉ 52 chu kỳ/phút gây nguy cơ cao nhịp chậm xoang nặng có triệu chứng và ngừng xoang/block xoang nhĩ.
  - **Thực nghiệm 2 (Thiếu `HR` và `SBP` — vi phạm `QA-1`/`QA-9`):** Khi `ivabradine 5 mg` có trong `currentMeds` nhưng `hr: undefined, sbp: undefined`, hàm `when` (dòng 21: `if (activeIva) return true;`) và `produce` (dòng 55) bỏ qua mọi kiểm tra thiếu sinh hiệu và phát thẳng **`[UPTITRATE] Ivabradine`**!
  - **Thực nghiệm 3 (Sung huyết mất bù cấp `congestion: 'overt'`):** Không kiểm tra `isAcutelyDecompensated(ctx)` hay `congestion === 'overt'`, nên ở bệnh nhân suy tim mất bù sung huyết cấp vẫn phát **`[CONSIDER] Khởi trị bổ sung Ivabradine`**.
  - **Thực nghiệm 4 (Liều chẹn beta tối đa dung nạp dưới đích):** Dòng 27 (`isAtOrAboveTargetDose(ctx, activeBb)`) loại bỏ hoàn toàn bệnh nhân chỉ dung nạp được `bisoprolol 5 mg/ngày` (do tụt áp/mệt khi nâng lên 10 mg) dù nhịp xoang lúc nghỉ còn `78 bpm`.
- **Đối chiếu nguyên văn khuyến cáo gốc & nhãn thuốc:**
  - **FDA Corlanor (ivabradine) Label §2.1, Table 1 — Dose Adjustment** (*PDF tr. 3–4*):
    - *"Heart Rate < 50 bpm or signs and symptoms of bradycardia: Decrease dose by 2.5 mg twice daily; if current dose is 2.5 mg twice daily, discontinue therapy."*
    - *"Heart Rate 50 to 60 bpm: **Maintain dose**."*
    - *"Heart Rate > 60 bpm: Increase dose by 2.5 mg twice daily up to a maximum of 7.5 mg twice daily."*
    *(Chính tệp `kb/drugs/ivabradine.json:35` cũng ghi rõ duy trì ở 50–60 bpm!)*
  - **FDA Corlanor Label §4 Contraindications** (*PDF tr. 4*): *"Corlanor is contraindicated in patients with: **Acute decompensated heart failure**..."*
  - **ESC 2026 §7.1.2.1 & §9.2.1** (*PDF tr. 34, 60*): *"in patients in sinus rhythm with a heart rate >=70 b.p.m. despite beta-blockers at the highest tolerated dose"* (khớp **AHA/ACC/HFSA 2022 §7.3.5 Rec 1** *PDF tr. 46*: *"maximally tolerated doses of beta blocker"* và **BYT QĐ 1857/2022** *PDF tr. 15*).
- **Hướng khắc phục:**
  1. Bắt buộc fail-closed: khi `activeIva` hiện diện mà `hr === undefined || sbp === undefined`, trả về `missingInputRec` và không phát `UPTITRATE`/`CONTINUE`.
  2. Chuẩn hóa bậc chỉnh liều Ivabradine đúng Table 1 của FDA: `hr < 50` → `REDUCE` (hoặc `STOP` nếu đang dùng `2.5 mg BID`); `50 <= hr <= 60` → `CONTINUE` giữ nguyên liều hiện tại; chỉ `UPTITRATE` khi `hr > 60` và liều `< 7.5 mg BID`.
  3. Chặn tuyệt đối khởi trị Ivabradine khi `isAcutelyDecompensated(ctx)` hoặc `getCongestionStatus(ctx) === 'overt'`.
  4. Bổ sung cờ `bbMaxTolerated` (hoặc cho phép gợi ý `CONSIDER` kèm điều kiện xác nhận chẹn beta đã đạt liều tối đa dung nạp).

---

#### `[HF-R2-R1-05]` Kiểu hình `HFimpEF` mắc 3 lỗi nghiêm trọng: (1) phát lệnh `CONTINUE` toàn bộ GDMT vô điều kiện ngay giữa cơn sốc tụt áp (`SBP 80`), nhịp chậm (`HR 42`), suy thận cấp (`eGFR 12`) hoặc tăng kali máu ác tính (`K+ 6.2`) đồng thời làm tê liệt cổng `HOLD`/`STOP` từng trụ cột của module HF; (2) đánh rơi hoàn toàn việc tái khởi trị / chuẩn độ ARNI, Chẹn beta, MRA khi bệnh nhân đã ngưng thuốc hoặc chưa đạt đích; (3) phân loại sai dao động siêu âm `+2%` (`39% -> 41%`) thành `HFimpEF`
- **Mức độ:** `critical` | **Loại:** `rule` | **Đối tượng:** `hf.hfimpef.continue_gdmt` (`src/modules/hf/rules.hfpef.ts:136-159`) & `getHfPhenotype` (`src/modules/hf/helpers.ts:130`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - Tại `src/modules/hf/helpers.ts:130`:
    ```ts
    if (priorEf !== undefined && priorEf <= 40 && lvef > 40) return 'hfimpef';
    ```
    Khi trả về `'hfimpef'`, cả 4 luật trụ cột chuyên biệt (`hf.fmt.arni` tại `rules.hfref.ts:30`, `hf.fmt.bb` tại `:166`, `hf.fmt.mra` tại `:230`, và `hf.hfpef.finerenone_mra` tại `rules.hfpef.ts:35`) đều trả về `false`. Thay vào đó, `hf.hfimpef.continue_gdmt` (`rules.hfpef.ts:136-159`) phát thẳng khuyến cáo `CONTINUE` (`priority: 92`) mà **không kiểm tra bất kỳ thông số huyết áp, nhịp tim, kali máu hay chức năng thận nào**.
  - **Thực nghiệm 1 (HFimpEF vào sốc tụt áp + nhịp chậm + suy thận cấp + tăng K+ nặng):** `priorLvef: 30, lvef: 48, sbp: 80, hr: 42, k: 6.2, scr: 4.5 (eGFR ~12)` đang dùng đủ 4 trụ cột → `evaluate()` vẫn phát ở đầu bảng: **`[CONTINUE] id=rec_hf_hfimpef_continue (prio=92): "HFimpEF (LVEF cải thiện lên 48%): Tiếp tục duy trì đầy đủ GDMT"`**, mâu thuẫn trực diện với các cảnh báo ngưng thuốc cấp cứu! Tệ hơn, ở mức `eGFR = 22, K+ = 5.2` hoặc `HR = 45, SBP = 105`, việc tắt `hf.fmt.mra` và `hf.fmt.bb` làm biến mất luôn lệnh `STOP Spironolactone` (`eGFR < 30`) và `HOLD Bisoprolol` (`HR < 50`) của module `hf`!
  - **Thực nghiệm 2 (HFimpEF tự ngưng thuốc hoặc chưa đủ 4 trụ cột):** Ca `priorLvef: 28, lvef: 46, currentMeds: []` chỉ được kê duy nhất `[START] Dapagliflozin`, **bỏ sót hoàn toàn ARNI, Chẹn beta và Spironolactone**; ngay trên `Preset 6` (`hf_preset_hfimpef_recovered`, chỉ nhập `spironolactone 25 mg`), cả 3 trụ cột ARNI, Chẹn beta, Spironolactone đều biến mất khỏi danh sách khuyến cáo thuốc có `drugId`.
  - **Thực nghiệm 3 (Dao động đo LVEF `39% -> 41%`):** Bệnh nhân có `priorLvef: 39, lvef: 41` (+2%, nằm trong sai số phép đo siêu âm tim) bị xếp vào `'hfimpef'`, làm tắt luôn `hf.hfpef.finerenone_mra` và `hf.hfmref.neurohormonal`.
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **ESC 2026 §3.3.1** (*PDF tr. 16*): *"The current definition of improved LVEF requires **an increase of at least 10% in LVEF (absolute)** and must be at least above 40%."*
  - **ESC 2026 Rec Table 5** (*PDF tr. 37, Class I, Level C*) & **AHA/ACC/HFSA 2022 §7.6.1 Rec 1** (*PDF tr. 65, COR 1, LOE B-R — TRED-HF*): Phải duy trì và tối ưu đầy đủ phác đồ GDMT nền tảng của HFrEF (khi dung nạp an toàn về huyết động, thận và điện giải) để phòng tái suy giảm chức năng thất trái.
- **Hướng khắc phục:**
  1. Cập nhật `getHfPhenotype` (`helpers.ts:130`): yêu cầu `priorEf <= 40 && lvef > 40 && (lvef - priorEf) >= 10` (thêm ngưỡng `hf.ef.hfimpef_min_delta = 10` dẫn nguồn ESC 2026 tr. 16).
  2. Cho phép cả 4 luật trụ cột (`hf.fmt.arni`, `hf.fmt.bb`, `hf.fmt.mra`, `hf.fmt.sglt2i`) chạy cho cả `'hfref'` **và** `'hfimpef'` để giữ trọn vẹn mọi cổng an toàn `HOLD`/`REDUCE`/`STOP` cũng như khả năng tái lập / chuẩn độ liều cho từng hoạt chất cụ thể.
  3. Chuyển `hf.hfimpef.continue_gdmt` thành khuyến cáo tư vấn chống tự ý ngưng thuốc khi bệnh nhân đang ổn định huyết động – thận – điện giải, tuyệt đối không phát `CONTINUE` khi có trụ cột đang bị `HOLD`/`STOP`.

---

### B. NHÓM LỖI SAI KHUYẾN CÁO / LIỀU / NGƯỠNG / TRÍCH DẪN & BỎ SÓT CLASS I (`MAJOR` — 10 PHÁT HIỆN)

#### `[HF-R2-R1-06]` Bệnh nhân HFpEF béo phì đang dùng Tirzepatide bị gán nhầm liều của Semaglutide (`0.25 mg -> 2.4 mg/tuần`, thấp hơn gấp 10 lần liều thực tế `2.5 mg -> 5–15 mg/tuần` của Tirzepatide); đồng thời gán sai nội dung Rec Table 18 của ESC 2026 và thiếu cổng chống chỉ định `MTC`/`MEN2`
- **Mức độ:** `major` | **Loại:** `rule` | **Đối tượng:** `hf.hfpef.glp1_obesity` (`src/modules/hf/rules.hfpef.ts:209-219`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - Tại `src/modules/hf/rules.hfpef.ts:209-213`, khi `activeGlp1.drugId === 'tirzepatide'`, `chosenId` được đổi thành `'tirzepatide'` nhưng trường `dose` vẫn dùng cứng biến `semStart` và `semTarget` của Semaglutide!
  - **Thực nghiệm `evaluate()`:** Bệnh nhân HFpEF béo phì (`lvef: 55, nyha: 2, weight: 95, height: 165` → BMI `34.9 kg/m²`) đang dùng `tirzepatide 5 mg` sinh ra:
    - `[CONTINUE] id=rec_hf_glp1_hfpef | drugId=tirzepatide | title="Tiếp tục duy trì Tirzepatide ở HFpEF béo phì" | dose="0.25 mg tiêm dưới da mỗi tuần; tăng dần tới đích 2.4 mg/tuần"`!
  - Dòng 218 viết *"liệu pháp incretin (ESC 2026 Class IIa-B1) cải thiện triệu chứng KCCQ và giảm biến cố suy tim xấu đi"*, và trái với tuyên bố ở `round1_RESPONSE.md:48`, trong `rules.hfpef.ts:182-222` hoàn toàn **chưa kiểm tra chống chỉ định ung thư biểu mô tuyến giáp thể tủy (`mtc`) hay hội chứng đa u tuyến nội tiết típ 2 (`men2`)**.
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **ACC 2026 ECDP HFpEF, Table 4** (*PDF tr. 14*): *"Tirzepatide — Starting Dose: **2.5 mg weekly**; Target Dose: **15 mg weekly**"* (khớp `kb/drugs/tirzepatide.json:18-32`).
  - **ESC 2026 Rec Table 18** (*PDF tr. 65*): *"GLP-1 receptor agonists (semaglutide, tirzepatide) should be considered in patients with symptomatic HFpEF and obesity (BMI >=30 kg/m2) **to reduce body weight, and improve exercise capacity and QoL** (Class IIa, Level B1)"* (trang 64 lưu ý rõ số lượng biến cố lâm sàng còn ít nên Rec Table 18 chưa khuyến cáo cho mục tiêu giảm biến cố suy tim).
- **Hướng khắc phục:** Phân nhánh `dose` theo đúng `chosenId` (`tirzepatide`: `2.5 mg/tuần`, tăng mỗi 4 tuần tới `5–15 mg/tuần`; nếu khởi trị mới thì nêu rõ liều của từng thuốc); tách bạch câu giải thích giữa mục tiêu ESC 2026 Rec Table 18 (giảm cân, gắng sức, QoL) và kết cục biến cố suy tim của SUMMIT / ACC 2026 ECDP; bổ sung cổng chống chỉ định `mtc` / `men2`.

---

#### `[HF-R2-R1-07]` Chuỗi 4 lỗi chuyển đổi và chọn liều ARNI / ARB thay thế: (1) bệnh nhân ổn định đang dùng ACEi nhận `HOLD` không liều thay vì `SWITCH`; (2) dưới `US`, chuyển từ ARB liều thấp (`Valsartan 40 mg`) bị kê vọt `49/51 mg BID` trái nhãn FDA; (3) dưới `INTL`/`VN`, bệnh nhân RASi-naïve huyết áp & thận bình thường bị ép cứng `24/26 mg BID` và thiếu `profileDiff`; (4) `hf.fmt.rasi_fallback` fail-open khi thiếu `K+`/`eGFR` và kê Valsartan liều tăng huyết áp `80 mg x 1/ngày`
- **Mức độ:** `major` | **Loại:** `rule` | **Đối tượng:** `hf.fmt.arni` & `hf.fmt.rasi_fallback` (`src/modules/hf/rules.hfref.ts:86-124, 140`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  1. **Đang dùng ACEi ổn định nhận `HOLD` thay vì `SWITCH`:** Ca HFrEF ổn định (`sbp: 122, k: 4.3, egfr: 72`) đang uống `enalapril 10 mg` nhận `[HOLD] Sacubitril/valsartan (dose: undefined)` và không có lệnh ngưng/chuyển `enalapril`.
  2. **Chuyển từ ARB liều thấp dưới `US` sai liều FDA:** Tại dòng 113, `useHalf` chỉ xét `!activeArb` mà không kiểm tra liều ARB hiện tại có thấp hay không. Thực nghiệm dưới profile `US` với `valsartan 40 mg` sinh `[SWITCH] Sacubitril/valsartan 49/51 mg x 2 lần/ngày`.
  3. **Ép cứng `24/26 mg BID` cho mọi ca RASi-naïve dưới `INTL`/`VN` và thiếu `profileDiff`:** Ca HFrEF mới chẩn đoán (`SBP 128, eGFR 75`, `Preset 1`) dưới `INTL` và `VN` luôn bị gán `24/26 mg x 2 lần/ngày`, mâu thuẫn với chính tài liệu thiết kế `docs/modules/HF_GDMT_COMPARISON.md` (Case #1 quy định `INTL` xuất `49/51 mg x 2`, `US` xuất `24/26 mg x 2`), đồng thời `hf.fmt.arni` không gắn `profileDiff`.
  4. **`hf.fmt.rasi_fallback` fail-open & sai liều suy tim của Valsartan:** Dòng 140 viết `(egfr === undefined || egfr >= 15) && (k === undefined || k <= 5.5)` — khi `k: undefined, scr: undefined` (`QA-1`/`QA-9`), rule vẫn phát `[CONSIDER] Valsartan 80 mg x 1 lần/ngày (uống)` (liều tăng huyết áp trong `valsartan.json` dùng chung với module `htn`) thay vì liều suy tim `40 mg x 2 lần/ngày -> đích 160 mg x 2 lần/ngày`.
- **Đối chiếu nguyên văn khuyến cáo gốc & nhãn thuốc:**
  - **FDA Entresto Label §2.6** (*PDF tr. 6–7*): *"Initiate ENTRESTO at half the usually recommended starting dose (**24/26 mg twice daily**) in patients not currently taking an ACE inhibitor or an ARB or **previously taking low doses of these agents**."*
  - **ESC 2026 Table 11 & Supp Table S5** (*PDF tr. 36 & Supp tr. 13*): Starting dose `49/51 mg b.i.d.` (`24/26 mg b.i.d.` ở nhóm chọn lọc / chưa đạt liều đích ACEi-ARB); Valsartan trong HFrEF: khởi đầu **`40 mg b.i.d.`**, đích **`160 mg b.i.d.`** (khớp **AHA 2022 Table 15** *PDF tr. 45* và **BYT QĐ 1857/2022 Bảng 6** *PDF tr. 16*).
- **Hướng khắc phục:**
  1. Nếu `activeAcei` nằm trong `currentMeds` ở bệnh nhân ổn định → phát `SWITCH` (`switchFrom: activeAcei.drugId`) kèm hướng dẫn ngưng ACEi, nghỉ đúng `>= 36 giờ` rồi uống liều ARNI đầu tiên; dành `HOLD` cho trường hợp đã ngưng ACEi nhưng cờ `takingAcei === true` báo chưa đủ 36 giờ.
  2. Kiểm tra ngưỡng liều thấp của ACEi/ARB trước khi chuyển (ví dụ `< 50%` liều đích hoặc `<= 160 mg/ngày` Valsartan / `<= 10 mg/ngày` Enalapril → khởi đầu `24/26 mg BID`), phân nhánh RASi-naïve theo `profile` (`US`: `24/26 mg BID`; `INTL`/`VN` không có yếu tố nguy cơ tụt áp: `49/51 mg BID` hoặc `24/26 mg BID` nếu thận trọng) và bổ sung `profileDiff`.
  3. Sửa `hf.fmt.rasi_fallback` fail-closed khi thiếu `k` hoặc `egfr`, chặn khi sốc/mất bù cấp, và hiển thị đúng liều suy tim của Valsartan (`40 mg x 2 lần/ngày`, đích `160 mg x 2 lần/ngày`).

---

#### `[HF-R2-R1-08]` Không triển khai thay đổi nền tảng nhất của ESC 2026 dưới profile `INTL` (xóa bỏ HFmrEF, định nghĩa lại `HFrEF: LVEF < 50%` với khuyến cáo `Class I-A` cho đủ 4 trụ cột gồm `sMRA`), đồng thời dưới profile `VN` lại gán nhầm SGLT2i Class I và Finerenone cho HFmrEF/HFpEF không có trong BYT QĐ 1857/2022
- **Mức độ:** `major` | **Loại:** `rule` | **Đối tượng:** `getHfPhenotype` (`src/modules/hf/helpers.ts:121, 134`), `hf.hfpef.finerenone_mra`, `hf.hfmref.neurohormonal`, `hf.hfpef.sglt2i`
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - Dù `kb/thresholds/hf.json` đã tạo sẵn ngưỡng `hf.ef.hfref_max_esc2026 = 50` và `docs/modules/HF_GDMT_COMPARISON.md:30` ghi rõ `INTL` áp dụng `HFrEF < 50%`, hàm `getHfPhenotype` (`helpers.ts:121, 134`) vẫn đóng cứng `<= 40` là `'hfref'` và `41–49` là `'hfmref'` cho tất cả mọi profile!
  - **Thực nghiệm 1 (`LVEF = 45%, NYHA II` dưới `INTL`):** `evaluate()` chỉ phát `[CONSIDER]` chung chung cho ARNI + chẹn beta (không gắn `drugId`, không có liều) thay vì `START` đủ 4 trụ cột `Class I-A`, và khởi trị `finerenone` (nsMRA) thay vì `spironolactone`/`eplerenone` (`sMRA` được ESC 2026 chỉ định riêng cho HFrEF `< 50%`).
  - **Thực nghiệm 2 (`LVEF = 45%` hoặc `55%` dưới `VN`):** `hf.hfpef.sglt2i` không có `profileDiff` và tuyên bố *"Class I (ESC 2026 / ACC 2026)"*, còn `hf.hfpef.finerenone_mra` đề xuất `Finerenone`, dù Quyết định 1857/QĐ-BYT năm 2022 chưa có Finerenone và chưa nâng SGLT2i lên Class I cho HFmrEF/HFpEF.
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **ESC 2026 §3.3.1 & §13 Key Messages** (*PDF tr. 16, 77*): *"Heart failure has been redefined with two distinct phenotypes: **HFrEF: LVEF <50%** + symptoms and/or signs of HF; **HFpEF: LVEF >=50%**..."*
  - **ESC 2026 Rec Table 5** (*PDF tr. 37*): *"An ACE-I or ARNI / A beta-blocker / **An MRA (sMRA for HFrEF and sMRA/nsMRA for HFpEF)** / An SGLT2 inhibitor is recommended in patients with HFrEF to reduce the risk of HFH and death — **Class I, Level A**."*
  - **BYT QĐ 1857/2022** (*PDF tr. 19–20*): Duy trì phân nhóm `HFmrEF (EF 41–49%)` với mức khuyến cáo `Class IIb, LOE C` cho ACEi/ARB/ARNI, chẹn beta và MRA steroid (Spironolactone).
- **Hướng khắc phục:** Phân nhánh kiểu hình theo `ctx.settings.profile`: dưới `INTL`, áp dụng `LVEF < 50%` cho phác đồ 4 trụ cột `Class I-A` (với `sMRA` cho `< 50%` và `sMRA/nsMRA` cho `>= 50%`), kèm `profileDiff` tường minh đối chiếu với `US` (`HFmrEF 41–49%`: SGLT2i `2a`, ARNI/ACEi/ARB/BB/sMRA `2b` theo AHA 2022; SGLT2i + MRA theo ACC 2026 ECDP) và `VN` (`BYT 1857/2022`: ưu tiên hiển thị `spironolactone` mức `Class IIb` và bổ sung `profileDiff` cho `hf.hfpef.sglt2i`).

---

#### `[HF-R2-R1-09]` Nebivolol được công nhận và khuyến cáo chuẩn độ tăng liều như một chẹn beta giảm tử vong toàn bộ và đột tử (`Class I-A`) ngay cả dưới profile `US`, trái ngược trực tiếp với AHA/ACC/HFSA 2022 và sai thực chứng dược lý lâm sàng (SENIORS)
- **Mức độ:** `major` | **Loại:** `rule` | **Đối tượng:** `hf.fmt.bb` (`src/modules/hf/helpers.ts:17`, `src/modules/hf/rules.hfref.ts:163-225`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - `HF_BB_IDS` gộp chung `'nebivolol'` mà không phân biệt `profile`. Thực nghiệm dưới profile `US` với bệnh nhân HFrEF (`lvef: 30, nyha: 2`) đang dùng `nebivolol 5 mg` sinh ra:
    - `[UPTITRATE] id=rec_hf_bb | drugId=nebivolol | title="Chuẩn độ tăng liều Nebivolol tới liều đích" | rationale="Chẹn beta bằng chứng ở HFrEF (Class I-A) giúp giảm tử vong toàn bộ, đột tử do tim và nhập viện suy tim."`
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **AHA/ACC/HFSA 2022 §7.3.2, Rec 1 (COR 1, LOE A) & Supportive Text** (*PDF tr. 43*): *"In patients with HFrEF, with current or previous symptoms, use of **1 of the 3 beta blockers proven to reduce mortality (e.g., bisoprolol, carvedilol, sustained-release metoprolol succinate)** is recommended to reduce mortality and hospitalizations... **Other beta blockers are not included in this recommendation for use**."*
  - **ESC 2026 §7.1.1** (*PDF tr. 34*): *"Of note, **nebivolol only reduced the combined endpoint of death or CV hospitalizations, not death**."*
- **Hướng khắc phục:** Dưới profile `US`, chỉ công nhận 3 chẹn beta giảm tử vong (`bisoprolol`, `carvedilol`, `metoprolol_succinate`); nếu bệnh nhân đang dùng `nebivolol`, phát khuyến cáo `SWITCH` sang 1 trong 3 chẹn beta chuẩn của Mỹ. Dưới `INTL` và `VN`, nếu bệnh nhân đang dùng `nebivolol` (nhất là người cao tuổi `>= 70` theo SENIORS), chỉnh lại `rationale` đúng sự thật thử nghiệm lâm sàng (giảm tiêu chí gộp tử vong hoặc nhập viện tim mạch, không giảm tử vong toàn bộ đơn độc) và gắn `profileDiff`.

---

#### `[HF-R2-R1-10]` Nhầm lẫn MRA steroid vs không steroid và ngưỡng chuẩn độ Finerenone: (1) ở HFrEF (`LVEF <= 40%`), `hf.fmt.mra` chấp nhận Finerenone làm trụ cột (ngoài nhãn FDA), phát `UPTITRATE` kèm chuỗi liều mâu thuẫn, và gọi nhầm Finerenone là "MRA steroid" khi `eGFR = 28`; (2) ở HFmrEF/HFpEF, lệch điểm biên `eGFR = 60` (`> 60` thay vì `>= 60`), tăng liều ở `K+ = 5.0`, và phát `REDUCE` trên viên thấp nhất `10 mg`
- **Mức độ:** `major` | **Loại:** `rule` | **Đối tượng:** `hf.fmt.mra` (`src/modules/hf/rules.hfref.ts:232-278`) & `hf.hfpef.finerenone_mra` (`src/modules/hf/rules.hfpef.ts:78-96`, `helpers.ts:95`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  1. `hf.fmt.mra` quét `ALL_MRA_IDS` (gồm cả `finerenone`). Thực nghiệm ở HFrEF `LVEF 30%` đang dùng `finerenone 20 mg, eGFR 65` sinh `[UPTITRATE] Finerenone` nhưng trường `dose` lại in `"20 mg x 1 lần/ngày (uống)"` (do `finerenone.json` đặt `target = 20` trong khi `helpers.ts:95` trả `40`). Khi hạ `eGFR = 28`, dòng 251 phát `[STOP] Finerenone` với câu giải thích sai bản chất dược lý: **`"Chống chỉ định MRA steroid khi eGFR dưới 30 mL/phút/1,73m²"`**!
  2. Tại `rules.hfpef.ts:87` và `helpers.ts:95`, điều kiện `egfr > 60` bỏ sót đúng điểm biên `eGFR === 60` so với nhãn FDA Kerendia (`>= 60`, vốn đã được ghi đúng trong `finerenone.json:25, 41`). Đồng thời dòng 82 dùng `k > 5.0` nên ở `K+ === 5.0` vẫn cho `UPTITRATE`, và dòng 80 phát `action: 'REDUCE'` kể cả khi bệnh nhân đang dùng viên hàm lượng thấp nhất `10 mg`!
- **Đối chiếu nguyên văn khuyến cáo gốc & nhãn thuốc:**
  - **FDA Kerendia (finerenone) Label §1, §2.2 Table 1 & §2.3 Table 3** (*Rev. 09/2026, PDF tr. 1, 3–5*): Chỉ định suy tim cho **`LVEF >= 40%`**; liều khởi đầu `20 mg` và liều đích `40 mg` áp dụng cho **`eGFR >= 60 mL/min/1.73m²`**; bảng chỉnh liều theo Kali huyết thanh quy định tại **`>= 5.0 to < 5.5 mmol/L`: *"Maintain current dose"***, và tại **`>= 5.5 to < 6.0 mmol/L`** nếu đang dùng **`10 mg`**: ***"Withhold Kerendia"***.
  - **ESC 2026 Rec Table 5** (*PDF tr. 37*): Chỉ định rõ **`sMRA for HFrEF`** và `sMRA/nsMRA for HFpEF`.
- **Hướng khắc phục:** Trong `hf.fmt.mra` (HFrEF), chỉ công nhận `SMRA_IDS` (`spironolactone`, `eplerenone`) làm MRA trụ cột giảm tử vong (nếu đang dùng `finerenone` không vì chỉ định ĐTĐ-CKD riêng thì khuyên chuyển sang sMRA); sửa câu giải thích không gọi Finerenone là MRA steroid; đồng bộ ngưỡng `eGFR >= 60` theo nhãn FDA Kerendia, giữ liều (`CONTINUE`) khi `5.0 <= k < 5.5`, và phát `HOLD` (thay vì `REDUCE`) khi đang dùng `finerenone 10 mg` mà `k >= 5.5`.

---

#### `[HF-R2-R1-11]` Sai lệch nghiêm trọng khuyến cáo thiết bị `CRT` và `ICD`: (1) dưới `US`, bệnh nhân LBBB có `QRS 120–129 ms` bị gắn nhãn `AVOID` ("Chống chỉ định Class III") trái ngược `COR 2a` của AHA/ACC/HFSA 2022; (2) để trống `qrsMorphology` ở `QRS >= 150 ms` bị hạ ngầm từ `START (Class I-A)` xuống `CONSIDER`; (3) bỏ sót hoàn toàn CRT trong rung nhĩ; (4) `ICD` phát `START` kèm tiêu đề `(Class IIa-B1)` cho bệnh cơ tim không thiếu máu cục bộ ở cả `INTL` lẫn `US` (Mỹ là `COR 1-A`), dùng nhầm `ascvd` thay cho CAD, và bỏ sót NYHA I sau NMCT `>= 40 ngày` có `LVEF <= 30%`
- **Mức độ:** `major` | **Loại:** `rule` | **Đối tượng:** `hf.gdit.crt` & `hf.gdit.icd` (`src/modules/hf/rules.devices_iron.ts:57-185`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  1. **CRT dưới `US` tại `QRS = 125 ms, LBBB`:** `rules.devices_iron.ts:141-151` áp cứng ngưỡng `< 130 ms` của ESC 2026 cho mọi profile. Thực nghiệm dưới `US` (`lvef: 30, nyha: 3, rhythm: 'sinus', qrsDuration: 125, qrsMorphology: 'lbbb', fmtDurationMonths: 4`) sinh **`[AVOID] "Chống chỉ định cấy CRT khi phức bộ QRS hẹp (125 ms < 130 ms) — ESC 2026 khuyến cáo Class III-A"`**!
  2. **Thiếu `qrsMorphology` khi `QRS = 155 ms`:** Dòng 138 (`const morph = String(... ?? '')`) không yêu cầu nhập hình dạng QRS (`QA-9`), ngầm coi không phải LBBB và hạ từ `START (Class I-A)` xuống `CONSIDER (Class IIa/IIb)`.
  3. **Rung nhĩ (`rhythm === 'af'`):** Dòng 127 loại bỏ hoàn toàn chỉ định CRT (kèm cắt đốt nút nhĩ thất đảm bảo tạo nhịp hai thất gần 100%) ở bệnh nhân rung nhĩ có `LVEF <= 35%, QRS >= 130 ms`.
  4. **ICD tiên phát (`rules.devices_iron.ts:89-105`):** Bệnh cơ tim giãn không thiếu máu cục bộ nhận `action: 'START'` nhưng tiêu đề ghi cứng `(Class IIa-B1)` ở cả `INTL` (lẽ ra `CONSIDER` cho Class IIa) lẫn `US` (lẽ ra `COR 1, LOE A`), thiếu `profileDiff`; dùng `hasCondition(ctx, 'ascvd')` (vốn bao gồm cả đột quỵ/PAD không có bệnh mạch vành) để suy đoán bệnh cơ tim thiếu máu cục bộ; và chặn `nyha < 2` (dòng 64) làm mất chỉ định ICD `COR 1, LOE B-R` cho bệnh nhân NYHA I sau nhồi máu cơ tim `>= 40 ngày` có `LVEF <= 30%`.
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **AHA/ACC/HFSA 2022 §7.4.1, Rec 3 & Rec 6** (*PDF tr. 57*): *"In patients who have LVEF <=35%, sinus rhythm, LBBB with a **QRS duration of 120 to 149 ms**, and NYHA class II, III, or ambulatory IV symptoms on GDMT, **CRT can be useful (COR 2a, LOE B-NR)**"* và *"QRS duration **<120 ms**, CRT is not recommended (**COR 3: No Benefit, LOE B-R**)."*
  - **ESC 2026 Rec Table 7 & Rec Table 15** (*PDF tr. 42, 60*) & **AHA 2022 §7.4.1 Rec 5** (*PDF tr. 57*): CRT (kèm cắt đốt nút AV nếu cần) mức `Class IIa` cho bệnh nhân HFrEF NYHA III–IV kèm rung nhĩ và `QRS >= 130 ms`.
  - **AHA/ACC/HFSA 2022 §7.4.1, Rec 1 & Rec 3** (*PDF tr. 56*): ICD dự phòng tiên phát ở bệnh cơ tim không thiếu máu cục bộ `LVEF <= 35%`, NYHA II–III là **`COR 1, LOE A`** (khác ESC 2026 Rec Table 6 *PDF tr. 42* là `Class IIa, Level B1`); ở sau NMCT `>= 40 ngày` có `LVEF <= 30%` và **NYHA I** là **`COR 1, LOE B-R`**.
- **Hướng khắc phục:** Phân nhánh ngưỡng CRT theo profile (`US`: chống chỉ định `< 120 ms`, `120–149 ms` LBBB là `CONSIDER COR 2a`; `INTL`/`VN`: chống chỉ định `< 130 ms`); phát `missingInputRec` khi `qrsDuration >= 130` (hoặc `>= 120` ở `US`) mà thiếu `qrsMorphology`; bổ sung nhánh CRT cho rung nhĩ; tách trường nguyên nhân thiếu máu cơ tim (`ischemicHf`), sửa hành động/nhãn ICD không thiếu máu cục bộ theo profile (`INTL`/`VN`: `CONSIDER Class IIa-B1`; `US`: `START COR 1-A`) kèm `profileDiff`, và bổ sung nhánh NYHA I sau NMCT `>= 40 ngày` (`LVEF <= 30%`) dưới `US`.

---

#### `[HF-R2-R1-12]` Bỏ sót hoàn toàn khuyến cáo `COR 1, LOE A` (Mỹ) / `Class IIa, Level B2` (ESC 2026): Phối hợp `Hydralazine + Isosorbide dinitrate` bổ sung trên nền GDMT tối ưu cho bệnh nhân HFrEF người da đen tự xác định còn triệu chứng NYHA III–IV
- **Mức độ:** `major` | **Loại:** `missing` | **Đối tượng:** `hf.amt.hydralazine_isdn_black` (`src/modules/hf/rules.hfref_amt.ts` & `inputs.ts`)
- **Bằng chứng mã nguồn:**
  - Hydralazine + ISDN hiện chỉ xuất hiện trong `hf.fmt.rasi_fallback` (`rules.hfref.ts:152-159`) khi bệnh nhân không dung nạp cả ACEi, ARB và ARNI. Toàn bộ `src/modules/hf/` không có trường nhập hay quy tắc cho bệnh nhân tự xác định người da đen (*self-identified Black / African American*) còn triệu chứng NYHA III–IV trên nền FMT tối ưu, khiến hai trích dẫn đã nạp sẵn trong `kb/citations/hf.json` (`aha.hf.2022.hisdn_1a` và `esc.hf.2026.hisdn_black_rec`) bị bỏ không.
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **AHA/ACC/HFSA 2022 §7.3.5, Rec 1 (COR 1, LOE A)** (*PDF tr. 46*): *"For patients self-identified as African American with NYHA class III-IV HFrEF who are receiving optimal medical therapy, the combination of hydralazine and isosorbide dinitrate is recommended to improve symptoms and reduce morbidity and mortality."*
  - **ESC 2026 Rec Table 5 (Class IIa, Level B2)** (*PDF tr. 38*): *"Hydralazine and isosorbide dinitrate should be considered in self-identified Black patients with HFrEF who are in NYHA class III–IV despite treatment with an ACE-I (or ARNI), a beta-blocker, an MRA, and an SGLT2 inhibitor to reduce the risk of HFH and death."* (Cũng được ghi nhận tại **BYT QĐ 1857/2022** *PDF tr. 15*).
- **Hướng khắc phục:** Thêm tùy chọn `selfIdentifiedBlack` vào nhóm thông số chuyên biệt HFrEF (`inputs.ts`) và bổ sung rule `hf.amt.hydralazine_isdn_black`: khi HFrEF NYHA III–IV trên nền FMT tối ưu, `SBP >= 90–100 mmHg`, không dùng PDE-5i/riociguat → phát `START` dưới `US` (`COR 1, LOE A`) và `CONSIDER` dưới `INTL`/`VN` (`Class IIa, Level B2`) kèm `profileDiff`.

---

#### `[HF-R2-R1-13]` Bỏ sót hoàn toàn xử trí Bệnh cơ tim nhiễm bột (`cardiacAmyloidosis` — khuyến cáo `Class I-A` ESC 2026 & `COR 1, LOE B-R` AHA 2022): trường `conditions.cardiacAmyloidosis` đã có trong `src/engine/types.ts:84` nhưng bị bỏ qua 100%, thậm chí còn gợi ý kê `Digoxin` cho bệnh nhân amyloidosis tim
- **Mức độ:** `major` | **Loại:** `missing` | **Đối tượng:** `hf.amyloidosis.tafamidis_and_safety` (`src/modules/hf/` & `kb/drugs/`)
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  - Trường `cardiacAmyloidosis` đã được khai báo trong `StandardConditionKey` (`src/engine/types.ts:84`), nhưng tìm kiếm toàn bộ `src/modules/hf/` trả về `0` kết quả.
  - **Thực nghiệm `evaluate()`:** Bệnh nhân `lvef: 52, nyha: 2, sbp: 108, conditions: { hf: true, cardiacAmyloidosis: true }` không nhận được bất kỳ khuyến cáo điều trị đặc hiệu hay cảnh báo an toàn nào; nguy hiểm hơn, nếu bệnh nhân HFrEF NYHA III có `cardiacAmyloidosis: true`, `hf.amt.digoxin` vẫn gợi ý kê **`Digoxin`**!
- **Đối chiếu nguyên văn khuyến cáo gốc & nhãn thuốc:**
  - **ESC 2026 Rec Table 28 (Class I, Level A) & §11.5** (*PDF tr. 77*): *"Treatment with a TTR silencer (vutrisiran) or stabilizer (tafamidis or acoramidis) for patients with variant or wild-type transthyretin cardiac amyloidosis and NYHA classes I–III is recommended to reduce progression of symptoms and the risk of CV hospitalization and all-cause death (Class I, Level A)"* — đồng thời nêu rõ: *"In patients with CA and AF, anticoagulation is indicated regardless of CHA2DS2-VA score... The use of digoxin is generally discouraged due to high risk of toxicity."*
  - **AHA/ACC/HFSA 2022 §7.8.2, Rec 1 (`COR 1, LOE B-R`) & Rec 3 (`COR 2a, LOE C-LD`)** (*PDF tr. 70*): Khuyến cáo `tafamidis` cho ATTR-CM NYHA I–III và kháng đông cho rung nhĩ bất kể điểm `CHA2DS2-VASc` (khớp **ACC 2026 ECDP HFpEF Table 2** *PDF tr. 9* và **BYT QĐ 1857/2022 Bảng 5** *PDF tr. 11*).
  - **FDA Lanoxin (digoxin) Label §5.7** (*PDF tr. 9*): *"Patients with amyloid heart disease may be more susceptible to digoxin toxicity at therapeutic levels because of an increased binding of digoxin to extracellular amyloid fibrils. LANOXIN should generally be avoided in these patients."*
- **Hướng khắc phục:** Bổ sung `tafamidis.json` (61 mg acid tự do hoặc 80 mg tafamidis meglumine x 1 lần/ngày) và quy tắc chuyên biệt khi `hasCondition(ctx, 'cardiacAmyloidosis')`: khuyến cáo khởi trị / hội chẩn chuyên khoa dùng chất ổn định hoặc bất hoạt TTR (`tafamidis` / `acoramidis` / `vutrisiran`, NYHA I–III, sau khi loại trừ AL amyloidosis), chỉ định kháng đông nếu có rung nhĩ bất kể thang điểm `CHA2DS2-VA`/`CHA2DS2-VASc`, chặn tuyệt đối `Digoxin` + CCB non-DHP, và cảnh báo nguy cơ hạ huyết áp tư thế nặng với chẹn beta / ARNI liều cao.

---

#### `[HF-R2-R1-14]` Bù sắt tĩnh mạch (`hf.amt.iv_iron`) mắc 4 lỗi: (1) lỗi dấu `lvef >= 45` đánh rơi bệnh nhân `LVEF = 45%` (và `45–49%` theo ESC 2026); (2) ghi sai mức chứng cứ `loe: "A"` trong `kb/citations/hf.json` & `Class I-A` trong `rationale` (thực tế ESC 2026 là `I-B1` / `IIa-B1`, Mỹ là `2a B-R`); (3) nối hỏng chuỗi `dose` và thiếu cổng chống chỉ định `Hb > 15 g/dL` (trái tuyên bố `HF-R2-23`); (4) không kiểm tra thuốc sắt đã có trong `currentMeds`
- **Mức độ:** `major` | **Loại:** `rule` | **Đối tượng:** `hf.amt.iv_iron` (`src/modules/hf/rules.devices_iron.ts:15-54`) & `kb/citations/hf.json:362, 372`
- **Bằng chứng mã nguồn & thực nghiệm `evaluate()`:**
  1. Tại `rules.devices_iron.ts:40`, câu lệnh `if (lvef >= efMax)` (`efMax = 45`) loại bỏ bệnh nhân có đúng `LVEF = 45%` (và khi đã nhập `ferritin`, `hf.amt.iron_screening` cũng tắt nên bệnh nhân `LVEF = 45%, ferritin = 55, tsat = 15` không nhận được bất kỳ khuyến cáo nào!). Hơn nữa dưới ESC 2026 (`INTL`), HFrEF bao gồm toàn bộ `LVEF < 50%` (AFFIRM-AHF tuyển bệnh `< 50%`).
  2. Dòng 49 ghi *"khuyến cáo Class I-A để cải thiện triệu chứng, chất lượng cuộc sống và giảm nhập viện vì suy tim"*, và `kb/citations/hf.json` tại dòng 362 (`esc.hf.2026.iron_rec`) & dòng 372 (`esc.hf.2026.iron_rec_hfh_2ab1`) đều ghi sai **`"loe": "A"`**! Ngoài ra rule thiếu `profileDiff` cho `US` (`COR 2a, LOE B-R`).
  3. Dòng 47 ghép chuỗi sinh ra văn bản lỗi ngữ pháp trong `evaluate()`: **`"500–1000 mg x truyền TM liều nạp (tĩnh mạch) (tối đa 500–1000 mg x đánh giá lại Ferritin & TSAT sau 3–6 tháng (tĩnh mạch))"`**, hoàn toàn không tính liều theo cân nặng (`< 70 kg` vs `>= 70 kg`) và Hemoglobin, cũng không chặn khi `Hb > 15 g/dL` (dù `ferric_carboxymaltose.json:1272` nêu rõ không truyền sắt khi `Hb > 15 g/dL`).
- **Đối chiếu nguyên văn khuyến cáo gốc:**
  - **ESC 2026 Rec Table 19** (*PDF tr. 67*):
    - *"Intravenous iron supplementation is recommended in patients with symptomatic HFrEF and iron deficiency, to alleviate HF symptoms and improve QoL — **Class I, Level B1**."*
    - *"Intravenous iron supplementation with ferric carboxymaltose or ferric derisomaltose should be considered in patients with symptomatic HFrEF and iron deficiency, to reduce the risk of HFH — **Class IIa, Level B1**."*
  - **AHA/ACC/HFSA 2022 §10.1, Rec 1** (*PDF tr. 89*): **`COR 2a, LOE B-R`**.
- **Hướng khắc phục:** Đổi ngưỡng LVEF sang `< 50%` dưới `INTL` và `<= 45%` dưới `US`/`VN`; sửa `"loe": "B1"` cho cả 2 trích dẫn sắt trong `kb/citations/hf.json`, sửa `rationale` đúng `Class I-B1` (triệu chứng/QoL) & `Class IIa-B1` (giảm HFH) kèm `profileDiff` (`US`: `COR 2a, LOE B-R`); thêm cổng chặn `hb > 15`, tính liều nạp FCM sạch theo `weight` & `hb`, và kiểm tra `findCurrentMed`.

---

#### `[HF-R2-R1-15]` 28 tham chiếu trong module `hf` và `kb/thresholds/hf.json` phụ thuộc vào tệp mẫu `kb/citations/_sample.json` (bị bỏ qua khi kiểm định `real_only`, có quote bị cắt cụt giữa câu), đồng thời 7 ngưỡng trong `kb/thresholds/hf.json` và 2 cổng thuốc phạm lỗi `QA-7` nghiêm trọng (mượn trích dẫn của Ivabradine, Lợi tiểu quai, MRA, ARNI, Chẹn beta để gán cho Digoxin và ARNI)
- **Mức độ:** `major` | **Loại:** `citation` | **Đối tượng:** `esc.hf.2026.dapagliflozin_hf_rec`, `esc.hf.2026.dapagliflozin_dose_10mg` (`kb/citations/_sample.json`), `kb/thresholds/hf.json`, `digoxin.json`, `vericiguat.json`
- **Bằng chứng kiểm định chéo:**
  1. **Phụ thuộc `_sample.json` (28 vị trí):** Hai mã `esc.hf.2026.dapagliflozin_hf_rec` và `esc.hf.2026.dapagliflozin_dose_10mg` không hề có trong `kb/citations/hf.json` mà nằm trong `kb/citations/_sample.json:26-48` (`reviewStatus: "sample"`), trong đó `quote` của `esc.hf.2026.dapagliflozin_hf_rec` bị cắt cụt: *"An SGLT2 inhibitor (dapagliflozin or empagliflozin) is recommended in patients with HFrEF to reduce the risk of HF"* (mất chữ *"hospitalization and death"*).
  2. **7 ngưỡng trong `kb/thresholds/hf.json` mượn trích dẫn sai thuốc (`QA-7`):**
     - `hf.digoxin.hr_start_min (60)` → viện dẫn `fda.hf.ivabradine_target_hr_60_age75` *(nhãn **Ivabradine** cho máy tạo nhịp!)*
     - `hf.digoxin.k_min (3.5)` → viện dẫn `esc.hf.2026.loop_diuretics_doses_table_s7` *(bảng **Lợi tiểu quai**!)*
     - `hf.digoxin.egfr_avoid_max (30)` → viện dẫn `esc.hf.2026.mra_guidance_table_s8` *(bảng **MRA steroid**!)*
     - `hf.digoxin.egfr_low_dose_max (60)` → viện dẫn `esc.hf.2026.sacubitril_valsartan_low_dose` *(bảng **Sacubitril/valsartan**!)*
     - `hf.digoxin.hr_min (50)` (và `kb/drugs/digoxin.json:78`) → viện dẫn `esc.hf.2026.bb_guidance_table_s6` *(bảng **Chẹn beta**!)*
     - `hf.arni.egfr_esrd_min (15)` → viện dẫn `esc.hf.2026.mra_table_s4_egfr15` *(**Finerenone**)* + `fda.hf.vericiguat_renal_hepatic` *(**Vericiguat**)*!
     - `hf.arni.k_max_hold (5.5)` → viện dẫn bảng **MRA** thay vì bảng **RASi** (dù ESC 2026 Supp Table S4 *PDF tr. 12* có câu nguyên văn cho ACE-I/ARB/ARNI khi `K+ > 5.5 mmol/L`).
     - Ngoài ra `kb/drugs/vericiguat.json:66` (`gate_vericiguat_sbp_min = 100`) viện dẫn `esc.hf.2026.vericiguat_rec` (câu quote không hề có số `100`) thay vì `aha.hf.2022.vericiguat_victoria_sbp100`.
- **Hướng khắc phục:** Tạo trích dẫn chuẩn (`reviewStatus: "verified"`) trong `kb/citations/hf.json` cho SGLT2i ở HFrEF/HFpEF và liều Dapagliflozin 10 mg từ `ESC_2026_Heart_Failure_Guideline.pdf` (tr. 36, 37, 52) để xóa toàn bộ phụ thuộc vào `_sample.json`; thay toàn bộ 7 ngưỡng QA-7 và 2 gate thuốc bằng trích dẫn chính danh từ `FDA_label_digoxin.pdf` (tr. 5, 8) và `ESC_2026_Heart_Failure_Supplementary_Tables_S1_S26.pdf` (Table S4 tr. 12 & Table S5 tr. 13).

---

### C. NHÓM LỖI MỨC NHẸ (`MINOR` — 7 PHÁT HIỆN)

#### `[HF-R2-R1-16]` Xung đột ngưỡng `SBP` tối thiểu của SGLT2i giữa module `hf` (`90 mmHg` theo ESC 2026 Table S9) và `organAndCrisisGates` (`95 mmHg`) làm hỏng ca mẫu `Preset 2` (`SBP = 92 mmHg`) và để sót chuỗi liều khởi trị bên trong thẻ `[HOLD]`
- **Mức độ:** `minor` | **Loại:** `rule` | **Đối tượng:** `hf.fmt.sglt2i` / `organAndCrisisGates` / `hf_preset_advanced_hf_hypotension_hyperkalemia` (`src/modules/hf/presets.ts:31`)
- **Bằng chứng:** Mô tả `Preset 2` (`SBP = 92 mmHg`) ghi rõ *"ưu tiên SGLT2i và chẹn beta liều thấp"*. `hf.fmt.sglt2i` phát `START Dapagliflozin` (vì `92 >= 90` theo ESC 2026 Supp Table S9 *PDF tr. 20*), nhưng `organAndCrisisGates.ts` ghi đè thành `[HOLD] TẠM HOÃN Dapagliflozin (Tụt huyết áp SBP < 95 mmHg)` trong khi vẫn giữ nguyên `dose="10 mg x 1 lần/ngày (uống)"` và `rationale` khởi trị bên trong thẻ `HOLD`.
- **Hướng khắc phục:** Đồng bộ ngưỡng SBP tối thiểu của SGLT2i ở bệnh nhân suy tim không giảm thể tích tuần hoàn (và xóa trường `dose` khi `organAndCrisisGates` chuyển một khuyến cáo `START` sang `HOLD`).

---

#### `[HF-R2-R1-17]` Phác đồ suy tim cấp nội viện có 3 sai lệch liều và đường dùng: (1) Furosemide TM khởi đầu ghi "1–2 lần" thay vì `>= 2 lần` theo ESC 2026 và không quy đổi tương đương khi thuốc uống nền là Torsemide / Bumetanide; (2) ở `Preset 4`, lệnh tăng gấp đôi Furosemide TM bị gộp xuống `[CONTINUE]`; (3) `hf.inpatient.vasodilator` gắn `drugId: 'isosorbide_dinitrate'` (viên uống, không liều) thay vì `'nitroglycerin'` truyền TM
- **Mức độ:** `minor` | **Loại:** `rule` | **Đối tượng:** `hf.inpatient.iv_diuretic` & `hf.inpatient.vasodilator` (`src/modules/hf/rules.inpatient.ts:88-107, 152`)
- **Bằng chứng:**
  1. `rules.inpatient.ts:90` ghi `"bằng 1–2 lần tổng liều uống hàng ngày"` trong khi ESC 2026 §7.3.1 / Figure 13 (*PDF tr. 46–48*) và `furosemide.json:25` quy định **gấp đôi (`>= 2 lần`)** tổng liều uống hàng ngày; khi bệnh nhân đang uống `bumetanide 1 mg` hoặc `torsemide 20 mg`, công thức không quy đổi tương đương (`1 mg Bumetanide ≈ 10–20 mg Torsemide ≈ 40 mg Furosemide uống`).
  2. Trên `Preset 4` (`hf_preset_acute_decompensated_inpatient`), `merge.ts` gộp lệnh cấp cứu với viên `furosemide 40 mg` nền thành nhãn `[CONTINUE]`.
  3. `rules.inpatient.ts:152` trỏ `drugId: 'isosorbide_dinitrate'` (chỉ có viên uống 10/20/40 mg trong KB, `dose: undefined`) thay vì `drugId: 'nitroglycerin'` (đã có sẵn dạng truyền tĩnh mạch `5 -> 20–200 mcg/phút` trong `kb/drugs/nitroglycerin.json`).
- **Hướng khắc phục:** Quy đổi lợi tiểu quai uống nền ra tương đương Furosemide, phân tầng hệ số nhân theo profile (`INTL`: `>= 2x`, `US`: `1–2x`), dùng `UPTITRATE` khi đã có lợi tiểu nền, và đổi `drugId` giãn mạch TM sang `'nitroglycerin'` kèm tốc độ truyền cụ thể.

---

#### `[HF-R2-R1-18]` `Digoxin` và `Vericiguat` thiếu điều kiện tiên quyết đã dùng/tối ưu FMT (gợi ý Digoxin ngay ngày đầu ở bệnh nhân mới chẩn đoán chưa uống thuốc nền); `hf.amt.digoxin` loại bỏ NYHA II nhịp xoang (`DIGIT-HF`), thiếu cửa sổ `0.5–0.9 ng/mL` & `profileDiff`; `vericiguat.json` chưa cập nhật nhãn FDA tháng 01/2026 nâng liều khởi đầu lên `5 mg/ngày` (`VELOCITY`)
- **Mức độ:** `minor` | **Loại:** `rule` | **Đối tượng:** `hf.amt.digoxin`, `hf.amt.vericiguat` (`src/modules/hf/rules.hfref_amt.ts`), `kb/drugs/vericiguat.json`
- **Bằng chứng:**
  1. Ca HFrEF mới chẩn đoán `currentMeds: [], lvef: 30, nyha: 3, hr: 75` được gợi ý `[CONSIDER] Digoxin` ngay cùng ngày khởi trị 4 trụ cột.
  2. `rules.hfref_amt.ts:128` chặn `nyha < 3` ở nhịp xoang dù ESC 2026 §7.1.2.1 & Rec Table 5 (*PDF tr. 34, 38 — dựa trên DIGIT-HF*) khuyến cáo `Class IIa, Level B1` cho HFrEF có triệu chứng nhịp xoang (gồm NYHA II `LVEF <= 30%`); thiếu khoảng đích an toàn `0.5–0.9 ng/mL` (AHA 2022 §7.3.6 *PDF tr. 46*) và thiếu `profileDiff` (`INTL` IIa-B1 vs `US` 2b B-R vs `VN` IIb).
  3. `FDA_label_vericiguat.pdf` trong thư viện nguồn (*Revised 01/2026, PDF tr. 1, 3, 4 — RECENT MAJOR CHANGES §2.1*) đã nâng liều khởi đầu chuẩn của Verquvo lên **`5 mg orally once daily with food`** (`2.5 mg` chỉ dành cho người có nguy cơ hạ huyết áp có triệu chứng), trong khi `vericiguat.json` chỉ có `2.5 mg`.
- **Hướng khắc phục:** Yêu cầu đang dùng nền FMT trước khi gợi ý khởi trị bổ trợ `Digoxin` (nhịp xoang) và `Vericiguat`; mở `Digoxin` cho NYHA II `LVEF <= 30%` trên nền FMT tối ưu kèm nồng độ đích `0.5–0.9 ng/mL` và `profileDiff`; cập nhật liều khởi đầu `5 mg/ngày` theo FDA 01/2026 cho `vericiguat.json` (kèm `profileDiff` với ESC 2026 `2.5 mg`).

---

#### `[HF-R2-R1-19]` Ba quy tắc ghi sai Mức độ bằng chứng (`LOE`) của ESC 2026 trong chuỗi `rationale` hiển thị cho bác sĩ lâm sàng
- **Mức độ:** `minor` | **Loại:** `rule` | **Đối tượng:** `hf.gdit.cardiac_rehab`, `hf.inpatient.predischarge_optimization`, `hf.inpatient.vasodilator`
- **Bằng chứng đối chiếu nguyên văn `ESC_2026_Heart_Failure_Guideline.pdf`:**
  1. `rules.devices_iron.ts:228` (và `docs/modules/HF.md:50`) ghi Phục hồi chức năng tim mạch là **`Class I-A`** → ESC 2026 Rec Table 24 (*PDF tr. 72*) là **`Class I, Level B1`** (còn AHA 2022 §7.3.7 là `COR 1, LOE A`).
  2. `rules.inpatient.ts:247` ghi Tối ưu hóa tích cực GDMT trước xuất viện (STRONG-HF) là **`Class I-B1`** → ESC 2026 Rec Table 8 (*PDF tr. 47*) là **`Class I, Level B2`**.
  3. `rules.inpatient.ts:155` ghi Giãn mạch tĩnh mạch trong suy tim cấp là **`Class IIb-B2`** → ESC 2026 Rec Table 9 (*PDF tr. 51*) là **`Class IIb, Level C`**.
- **Hướng khắc phục:** Chỉnh lại nhãn COR/LOE tại cả 3 vị trí và trong `docs/modules/HF.md:50`.

---

#### `[HF-R2-R1-20]` Ma trận an toàn thận (`matrices.ts`) gắn nhãn `'caution'` cho toàn bộ cột `G4 (15–29)` của SGLT2i dù `20–29` là khuyến cáo `Class I-A` không chỉnh liều, gắn nhãn `'ok'` thay vì `'rec'` cho Spironolactone ở HFpEF, và thiếu dòng tra cứu cho `Eplerenone` và `Torsemide`
- **Mức độ:** `minor` | **Loại:** `matrix` | **Đối tượng:** `hfMatrixHFrEF` & `hfMatrixHFpEF` (`src/modules/hf/matrices.ts`)
- **Bằng chứng:** Ô `g4` của `dapagliflozin` (`matrices.ts:41, 174`) gộp chung `15–29` thành `'caution'` dù `eGFR 20–29` được ESC 2026 Table S9 (*PDF tr. 20*) khuyến cáo khởi trị chuẩn `10 mg/ngày`; `spironolactone` ở `hfMatrixHFpEF` (`:199-204`) chỉ đặt `'ok'` dù ESC 2026 Rec Table 5 (*PDF tr. 37*) xếp `sMRA/nsMRA` là `Class I-A` cho HFpEF; chưa có hàng riêng cho `eplerenone` và `torsemide`.
- **Hướng khắc phục:** Tách rõ ghi chú `eGFR 20–29` vs `15–19` tại ô `g4` của SGLT2i, cập nhật nhãn Spironolactone ở HFpEF theo profile, và bổ sung dòng cho `eplerenone` & `torsemide`.

---

#### `[HF-R2-R1-21]` `kb/drugs/eplerenone.json` không bao giờ được gọi tới trong bất kỳ quy tắc nào của module `hf` khi bệnh nhân bị vú to / căng đau tuyến vú do Spironolactone
- **Mức độ:** `minor` | **Loại:** `drug` | **Đối tượng:** `spironolactone` / `eplerenone` (`src/modules/hf/rules.hfref.ts`, `inputs.ts`)
- **Bằng chứng:** ESC 2026 Supp Table S8 (*PDF tr. 19*), AHA/ACC/HFSA 2022 §7.3.3 (*PDF tr. 44*), ACC 2026 ECDP Table 5 (*PDF tr. 15*) và BYT QĐ 1857/2022 (*PDF tr. 15*) đều hướng dẫn chuyển từ Spironolactone sang Eplerenone khi gặp tác dụng phụ kháng androgen (gynecomastia / đau tuyến vú), nhưng module `hf` chưa có tùy chọn/luật chuyển đổi này.
- **Hướng khắc phục:** Thêm tùy chọn tác dụng phụ vú to/đau vú do Spironolactone trong `inputs.ts` để tự động phát `SWITCH` sang `eplerenone` (khi `eGFR >= 30`, `K+ <= 5.0`, không dùng chất ức chế mạnh CYP3A4).

---

#### `[HF-R2-R1-22]` `hf.safety.harmful_meds` chỉ gắn `drugId: first.drugId` khi bệnh nhân dùng đồng thời `>= 2` thuốc chống chỉ định Class III, và danh sách `HARMFUL_HF_DRUG_IDS` còn thiếu `cilostazol` và `itraconazole`
- **Mức độ:** `minor` | **Loại:** `rule` | **Đối tượng:** `hf.safety.harmful_meds` (`src/modules/hf/rules.hfref_amt.ts:189-198`, `helpers.ts:37-41`)
- **Bằng chứng:** Khi `currentMeds` chứa đồng thời `diltiazem` + `ibuprofen`, `hf.safety.harmful_meds` chỉ sinh 1 `Recommendation` mang `drugId: 'diltiazem'`, khiến thuốc thứ hai không nhận nhãn `STOP` theo `drugId` trong `merge.ts`; đồng thời thiếu `cilostazol` (ức chế PDE-3 gây hại Class III theo AHA 2022 §7.3.8) và `itraconazole` (inotrope âm tính, FDA Boxed Warning ở HFrEF).
- **Hướng khắc phục:** Phát thẻ `STOP` riêng cho từng `drugId` vi phạm và bổ sung `'cilostazol'`, `'itraconazole'` vào `HARMFUL_HF_DRUG_IDS`.

---

### D. NHÓM ĐỀ XUẤT HOÀN THIỆN CHUYÊN SÂU (`SUGGESTION` — 3 PHÁT HIỆN)

#### `[HF-R2-R1-23]` Bổ sung `acetazolamide.json` (500 mg IV/ngày theo ADVOR) và `metolazone.json` để cụ thể hóa phác đồ lợi tiểu đa tầng (*sequential nephron blockade*) khi kháng lợi tiểu quai sớm
- **Mức độ:** `suggestion` | **Loại:** `missing` | **Đối tượng:** `acetazolamide` / `metolazone` (`kb/drugs/` & `rules.inpatient.ts`)
- **Cơ sở:** ESC 2026 §7.3.1 / Figure 13 (*PDF tr. 46–48*) và AHA/ACC/HFSA 2022 §9.2 (`COR 2a, LOE B-NR`, *PDF tr. 74*).

#### `[HF-R2-R1-24]` Bổ sung quy tắc nhận diện và chuyển tuyến sớm Suy tim giai đoạn D (*Advanced HF* — tiêu chí `I-NEED-HELP`) ở bệnh nhân ngoại trú kháng trị để đánh giá LVAD / ghép tim / chăm sóc giảm nhẹ
- **Mức độ:** `suggestion` | **Loại:** `ui` | **Đối tượng:** `hf.stage_d.i_need_help`
- **Cơ sở:** AHA/ACC/HFSA 2022 §8.1 Rec 1 (`COR 1, LOE C-LD`, Table 18 `I-NEED-HELP`, *PDF tr. 72*) và ESC 2026 §8 (*PDF tr. 51–53*).

#### `[HF-R2-R1-25]` Bổ sung trường nhập tùy chọn `ntProBnp` (phân tầng theo nhịp xoang vs rung nhĩ và hiệu chỉnh béo phì) hỗ trợ xác nhận chẩn đoán HFpEF và theo dõi phác đồ tối ưu nhanh sau xuất viện (STRONG-HF)
- **Mức độ:** `suggestion` | **Loại:** `ui` | **Đối tượng:** `hf.hfpef.diagnostic_biomarkers` (`inputs.ts`)
- **Cơ sở:** ESC 2026 §5 Table 4 (*PDF tr. 22–26*), ACC 2026 ECDP HFpEF Figure 1–2 (*PDF tr. 6–8*) và BYT QĐ 1857/2022 Hình 2 & Bảng 3–4 (*PDF tr. 8–10*).

---

## PHẦN 3. BẢNG ĐỐI CHIẾU ĐA HỒ SƠ (`INTL` vs `US` vs `VN`) TRÊN TOÀN BỘ PHÂN NHÓM LÂM SÀNG

| Phân nhóm / Can thiệp | `INTL` — ESC 2026 | `US` — AHA/ACC/HFSA 2022 + ACC 2026 ECDP | `VN` — Bộ Y tế QĐ 1857/2022 | Hành vi hiện tại của Module `hf` & Đánh giá |
|---|---|---|---|---|
| **1. Ngưỡng phân loại kiểu hình LVEF** | **2 kiểu hình chính:** `HFrEF < 50%`, `HFpEF >= 50%`; `HFimpEF`: trước đó `<= 40%`, tăng tuyệt đối **`>= 10%`** và `> 40%` (*tr. 16, 37, 77*) | **4 kiểu hình:** `HFrEF <= 40%`, `HFmrEF 41–49%`, `HFpEF >= 50%`, `HFimpEF` (`<= 40%` -> `> 40%`) (*AHA tr. 19*) | `HFrEF <= 40%`, `HFmrEF 41–49%`, `HFpEF >= 50%` (*BYT tr. 6–7*) | **SAI (`HF-R2-R1-05`, `HF-R2-R1-08`):** Đóng cứng `<= 40%` cho cả `INTL`; thiếu điều kiện tăng `>= 10%` ở `HFimpEF`. |
| **2. HFrEF (`<= 40%`): 4 trụ cột FMT** | ARNI/ACEi + BB + **sMRA** + SGLT2i (**Class I, Level A** — *tr. 37*) | ARNI (ưu tiên) + 1 trong **3 BB** + sMRA + SGLT2i (**COR 1, LOE A** — *tr. 41–45*) | ARNI/ACEi/ARB + BB + sMRA + SGLT2i (**Class I, LOE A** — *tr. 13–16*) | **SAI MỘT PHẦN (`HF-R2-R1-09`, `HF-R2-R1-10`):** Cho phép `nebivolol` dưới `US` và cho phép `finerenone` thay sMRA ở `LVEF <= 40%`. |
| **3. Liều khởi đầu ARNI ở BN chưa dùng RASi** | `49/51 mg BID` (`24/26 mg BID` ở nhóm chọn lọc / HA thấp / suy thận / gan vừa — *Table 11 tr. 36*) | **`24/26 mg BID`** cho BN chưa dùng ACEi/ARB hoặc dùng liều thấp (*FDA Entresto §2.6 tr. 6–7*) | `49/51 mg BID` (`24/26 mg BID` ở nhóm chọn lọc — *Bảng 6 tr. 16*) | **SAI (`HF-R2-R1-07`):** Ép cứng `24/26 mg BID` cho cả `INTL`/`VN` không có `profileDiff`; ngược lại chuyển từ ARB liều thấp dưới `US` lại kê `49/51 mg BID`. |
| **4. Khoảng `LVEF 41–49%`** | Thuộc **HFrEF `< 50%`** → **Class I-A** cho đủ 4 trụ cột (gồm **sMRA** — *tr. 16, 37*) | AHA 2022: SGLT2i **COR 2a**, ARNI/ACEi/ARB/BB/MRA **COR 2b** (*tr. 64*); ACC ECDP: SGLT2i + MRA trụ cột | ACEi/ARB/ARNI, BB, Spironolactone mức **Class IIb, LOE C** (*tr. 19*); chưa có Finerenone | **SAI (`HF-R2-R1-08`):** Dưới `INTL` chỉ phát `CONSIDER` không liều cho ARNI/BB và kê `finerenone` thay vì sMRA; dưới `VN` thiếu `profileDiff` ở SGLT2i và gợi ý Finerenone. |
| **5. `HFpEF (LVEF >= 50%)` — SGLT2i & MRA** | SGLT2i **Class I-A**; sMRA/nsMRA (Finerenone) **Class I-A** (*Rec Table 5 tr. 37, Rec Table 10 tr. 52*) | AHA 2022: SGLT2i **2a B-R**, MRA/ARNI **2b B-R** (*tr. 67*); ACC 2026 ECDP: SGLT2i + MRA nền tảng (*tr. 13–15*); FDA Kerendia `eGFR >= 60` -> 20/40 mg | Điều trị lợi tiểu khi ứ dịch + kiểm soát nguyên nhân/bệnh đồng mắc (*tr. 20*) | **SAI ĐIỂM BIÊN (`HF-R2-R1-08`, `HF-R2-R1-10`):** Lệch ngưỡng `eGFR = 60` của Finerenone, tăng liều ở `K+ = 5.0`, thiếu `profileDiff` SGLT2i dưới `VN`. |
| **6. `HFpEF` kèm béo phì (`BMI >= 30`) — Incretin** | Semaglutide / Tirzepatide **Class IIa, Level B1** giảm cân, cải thiện gắng sức & QoL (*Rec Table 18 tr. 65*) | ACC 2026 ECDP: khuyến cáo Semaglutide (`0.25 -> 2.4 mg/tuần`) hoặc Tirzepatide (`2.5 -> 15 mg/tuần`) (*Table 4 tr. 14*) | Chưa có trong QĐ 1857/2022 | **SAI LIỀU (`HF-R2-R1-06`):** Gán liều Semaglutide `0.25 -> 2.4 mg/tuần` lên `drugId: 'tirzepatide'`; thiếu cổng `mtc`/`men2`. |
| **7. Ivabradine & Digoxin & Vericiguat (AMT)** | Ivabradine **IIa-B2/C**; Digoxin **IIa-B1** (DIGIT-HF cả NYHA II–IV); Vericiguat **IIb-B2** (`2.5 mg`) (*tr. 34, 38*) | Ivabradine **2a B-R** (FDA duy trì ở `50–60 bpm`); Digoxin **2b B-R** (`0.5–0.9 ng/mL`); Vericiguat **2b B-R** (FDA 01/2026 khởi đầu **`5 mg`**) | Ivabradine **IIa-B/C**; Digoxin **IIb-B**; Vericiguat **IIb-B** (*tr. 15–16*) | **SAI AN TOÀN (`HF-R2-R1-04`, `HF-R2-R1-18`):** Tăng liều Ivabradine ở `HR 52 bpm` & fail-open khi thiếu HR/SBP; kê Digoxin ngày đầu chưa có FMT; thiếu liều Vericiguat `5 mg` FDA 2026. |
| **8. Người da đen NYHA III–IV: `Hydralazine + ISDN`** | **Class IIa, Level B2** trên nền 4 trụ cột (*Rec Table 5 tr. 38*) | **COR 1, LOE A** trên nền GDMT tối ưu (*§7.3.5 tr. 46*) | Ghi nhận phối hợp H-ISDN ở người da đen (*tr. 15*) | **THIẾU HOÀN TOÀN (`HF-R2-R1-12`):** Chưa có input và rule. |
| **9. Thiết bị `ICD` dự phòng tiên phát** | Thiếu máu cục bộ: **Class I-A**; Không thiếu máu cục bộ: **Class IIa, Level B1** (*Rec Table 6 tr. 42*) | Cả thiếu máu cục bộ & không thiếu máu cục bộ (NYHA II–III, `EF <= 35%`): **COR 1, LOE A**; NYHA I sau NMCT `>= 40d, EF <= 30%`: **COR 1, LOE B-R** (*tr. 56*) | Thiếu máu cục bộ **Class I-A**; Không thiếu máu cục bộ **Class IIa-A** (*tr. 17*) | **SAI (`HF-R2-R1-11`):** Ghi cứng `(Class IIa-B1)` cho cả `US`, phát `START` cho `IIa` ở `INTL`, dùng `ascvd` thay cho CAD, bỏ sót NYHA I `EF <= 30%` ở `US`. |
| **10. Thiết bị `CRT`** | LBBB `>= 150`: **I-A**; LBBB `130–149` / non-LBBB `>= 150`: **IIa**; `< 130 ms`: **Class III-A** (*Rec Table 7 tr. 42*) | LBBB `>= 150`: **1 B-R**; LBBB **`120–149`**: **2a B-NR**; `< 120 ms`: **COR 3** (*§7.4.1 tr. 57*) | LBBB `>= 150`: **I-A**; `130–149`: **IIa**; `< 130`: **III** (*tr. 17–18*) | **SAI (`HF-R2-R1-11`):** Gắn `AVOID (Class III)` cho `QRS 120–129 ms LBBB` dưới `US`; hạ ngầm khi thiếu `qrsMorphology`; bỏ sót rung nhĩ. |
| **11. Bù sắt tĩnh mạch (FCM / FDI)** | HFrEF (`< 50%`) thiếu sắt: **I-B1** (triệu chứng/QoL), **IIa-B1** (giảm HFH) (*Rec Table 19 tr. 67*) | HFrEF thiếu sắt: **COR 2a, LOE B-R** (*§10.1 tr. 89*) | Suy tim cấp/mạn thiếu sắt `EF < 50%` / `<= 45%` (*tr. 23, 25*) | **SAI (`HF-R2-R1-14`):** Rơi `LVEF = 45%`, sai `loe: "A"`, nối hỏng chuỗi `dose`, thiếu cổng `Hb > 15`, chạy cả trong sốc tim (`HF-R2-R1-02`). |
| **12. Bệnh cơ tim nhiễm bột (`ATTR-CM`)** | `Tafamidis` / `Acoramidis` / `Vutrisiran` **Class I-A**; kháng đông AF bất kể `CHA2DS2-VA`; tránh Digoxin (*Rec Table 28 tr. 77*) | `Tafamidis` **COR 1, LOE B-R**; kháng đông AF **COR 2a** bất kể `CHA2DS2-VASc` (*§7.8.2 tr. 70*) | Tầm soát xạ hình xương / chuỗi nhẹ & điều trị đặc hiệu (*Bảng 5 tr. 11*) | **THIẾU HOÀN TOÀN (`HF-R2-R1-13`):** Bỏ qua `conditions.cardiacAmyloidosis`, thậm chí gợi ý `Digoxin`. |

---

## PHẦN 4. KIỂM ĐỊNH HỒ SƠ THUỐC (`kb/drugs/`), MA TRẬN THẬN, NGƯỠNG SỐ & HỆ THỐNG TRÍCH DẪN

### 4.1. Kiểm định 17+ Hồ sơ Thuốc Suy tim (`kb/drugs/*.json`)
- **Điểm đạt:** Toàn bộ 17 tệp thuốc sở hữu HF (`bisoprolol`, `bumetanide`, `carvedilol`, `digoxin`, `eplerenone`, `ferric_carboxymaltose`, `ferric_derisomaltose`, `finerenone`, `furosemide`, `hydralazine`, `isosorbide_dinitrate`, `ivabradine`, `metoprolol_succinate`, `nebivolol`, `sacubitril_valsartan`, `spironolactone`, `vericiguat`) + các tệp liên quan (`torsemide`, `nitroglycerin`, `sodium_nitroprusside`, `dapagliflozin`, `empagliflozin`, `semaglutide`, `tirzepatide`, `enalapril`, `valsartan`, `candesartan`, `losartan`) có cấu trúc schema hợp lệ, phủ đủ dải thận `G1–G5 + dialysis`, phân tầng gan `hepatic`, thai kỳ, cho con bú và biệt dược lưu hành tại Việt Nam.
- **Các tồn đọng cần chỉnh sửa:**
  1. **`vericiguat.json` (`HF-R2-R1-18`, `HF-R2-R1-15`):** Chưa cập nhật nhãn FDA sửa đổi tháng `01/2026` (liều khởi đầu chuẩn `5 mg x 1 lần/ngày cùng thức ăn`, `2.5 mg` nếu nguy cơ tụt áp); gate `gate_vericiguat_sbp_min = 100` trỏ nhầm vào `esc.hf.2026.vericiguat_rec` (không chứa số `100`).
  2. **`digoxin.json` (`HF-R2-R1-15`):** Gate `gate_digoxin_hr_min = 50` trỏ nhầm vào bảng hướng dẫn **Chẹn beta** (`esc.hf.2026.bb_guidance_table_s6`).
  3. **`finerenone.json` vs `helpers.ts` (`HF-R2-R1-10`):** `finerenone.json` cố định `target.amount = 20` trong khi ở bệnh nhân suy tim có `eGFR >= 60`, liều đích là `40 mg/ngày`, khiến chuỗi `formatHfDose('finerenone', 'target')` in ra `"20 mg"` ngay bên trong khuyến cáo `UPTITRATE` lên `40 mg`.
  4. **`eplerenone.json` (`HF-R2-R1-21`):** Đã biên soạn đầy đủ nhưng không có đường dẫn lâm sàng nào trong module `hf` kích hoạt khi không dung nạp Spironolactone do vú to / đau vú.
  5. **Thiếu `tafamidis.json` (`HF-R2-R1-13`)** cho chỉ định `Class I-A` / `COR 1 B-R` ở ATTR-CM (và đề xuất thêm `acetazolamide.json` ở `HF-R2-R1-23`).

### 4.2. Kiểm định Ma trận An toàn Thận (`src/modules/hf/matrices.ts`)
- Tất cả `drugId` trong cả 2 bảng (`hfMatrixHFrEF` và `hfMatrixHFpEF`) đều tồn tại thực tế trong `kb/drugs/*.json`; lỗi nhân nhầm `30 mg` Spironolactone ở `g3b` từ Vòng 1 đã được sửa sạch thành `12.5 mg/ngày (hoặc 25 mg cách ngày)`.
- Cần khắc phục các điểm tại **`HF-R2-R1-20`** (tách rõ `eGFR 20–29` vs `15–19` ở cột `g4` của SGLT2i; cập nhật mức khuyến cáo Spironolactone ở HFpEF; bổ sung hàng `eplerenone` và `torsemide`) và xóa tham chiếu tới `_sample.json` tại **`HF-R2-R1-15`**.

### 4.3. Kiểm định 75 Ngưỡng Số (`kb/thresholds/hf.json`) & 108 Trích Dẫn (`kb/citations/hf.json`)
- **Về tính xác thực văn bản PDF:** Các trích dẫn trong `kb/citations/hf.json` khớp nguyên văn và đúng trang PDF gốc, **ngoại trừ**:
  1. Hai trích dẫn sắt tĩnh mạch (`esc.hf.2026.iron_rec` và `esc.hf.2026.iron_rec_hfh_2ab1`) ghi sai trường metadata **`"loe": "A"`** trong khi nguyên văn bảng gốc ESC 2026 Rec Table 19 (*PDF tr. 67*) là **`"B1"`** (`HF-R2-R1-14`).
  2. **28 vị trí** trong code và thresholds vẫn gọi 2 mã trích dẫn nằm trong tệp mẫu **`kb/citations/_sample.json`** (`esc.hf.2026.dapagliflozin_hf_rec` bị cắt cụt câu quote) (`HF-R2-R1-15`).
  3. **7 ngưỡng** trong `kb/thresholds/hf.json` (`hf.digoxin.hr_start_min`, `hf.digoxin.k_min`, `hf.digoxin.egfr_avoid_max`, `hf.digoxin.egfr_low_dose_max`, `hf.digoxin.hr_min`, `hf.arni.egfr_esrd_min`, `hf.arni.k_max_hold`) vi phạm trực tiếp quy tắc **`QA-7`** khi lấy trích dẫn của thuốc khác để hợp thức hóa con số (`HF-R2-R1-15`).

---

## PHẦN 5. ĐIỀU KIỆN ĐẠT (`PASS` CRITERIA) CHO VÒNG KIỂM ĐỊNH TIẾP THEO

Để module `hf` có thể đạt **`PASS`** ở vòng duyệt độc lập kế tiếp, đội phát triển module cần giải quyết dứt điểm tối thiểu toàn bộ **5 lỗi `critical` (`HF-R2-R1-01` → `HF-R2-R1-05`)** và **10 lỗi `major` (`HF-R2-R1-06` → `HF-R2-R1-15`)**, cụ thể:
1. **An toàn tuyệt đối về huyết động, điện giải & tương tác chồng chéo:** Chặn và phát `STOP` ngay lập tức khi có đồng thời `ACEi + ARNI` trong `currentMeds`; chặn mọi lệnh `START`/`CONTINUE`/`UPTITRATE` thuốc giãn mạch/MRA/SGLT2i/Finerenone/Sắt TM trong sốc tim (kể cả sốc tim `SBP >= 90 mmHg` nhờ vận mạch); thực thi nghiêm ngặt fail-closed khi thiếu `congestion` nội viện hoặc thiếu `HR`/`SBP` ở Ivabradine; sửa bậc giữ liều Ivabradine ở `50–60 bpm`; và khôi phục đầy đủ cổng an toàn + tái lập từng trụ cột ở `HFimpEF` (`delta LVEF >= 10%`).
2. **Đúng đắn tuyệt đối theo từng hồ sơ khuyến cáo (`INTL` / `US` / `VN`) và nhãn thuốc:** Sửa ngay lỗi gán liều Semaglutide cho Tirzepatide; triển khai ngưỡng `HFrEF < 50%` của ESC 2026 dưới `INTL` kèm `profileDiff` chính xác cho `US` và `VN`; loại trừ Nebivolol dưới `US`; tách rạch ròi `sMRA` (HFrEF) với `Finerenone` (`LVEF >= 40%`, `eGFR >= 60`); phân nhánh đúng ngưỡng `CRT` (`120 ms` ở `US` vs `130 ms` ở `INTL`/`VN`) và `ICD`; bổ sung 2 khuyến cáo Class I đang khuyết (`Hydralazine + ISDN` ở người da đen NYHA III–IV và `Tafamidis`/TTR therapy + an toàn Digoxin/kháng đông ở `cardiacAmyloidosis`).
3. **Toàn vẹn cơ sở tri thức (`KB Integrity`):** Loại bỏ 100% tham chiếu tới `kb/citations/_sample.json`, sửa toàn bộ 7 ngưỡng mượn trích dẫn chéo thuốc (`QA-7`), và sửa `loe: "B1"` + phép tính liều/cổng `Hb > 15` cho sắt tĩnh mạch.

---
**KẾT LUẬN CUỐI CÙNG: `FAIL`** *(5 Critical, 10 Major, 7 Minor, 3 Suggestion)*
