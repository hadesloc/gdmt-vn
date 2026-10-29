# Báo cáo Thẩm định Y khoa Độc lập – Vòng 4 (Round 4)
## Phân hệ: Bệnh thận mạn & Tổn thương thận cấp (`ckd`)

- **Người thẩm định:** **Reviewer R1** – Bác sĩ Chuyên khoa Nội Thận – Tiết niệu & Tim-Thận-Chuyển hóa Độc lập (*Guideline Specialist*)
- **Ngày thẩm định:** 27/10/2026
- **Quy trình áp dụng:** [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md) & [MODULE_CONTRACT.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/MODULE_CONTRACT.md)
- **Tài liệu đối chiếu gốc (`Medical_Library_2026`):**
  1. **KDIGO 2024** Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease (*Kidney Int. 2024;105(4S):S117–S314*)
  2. **KDIGO 2021** Clinical Practice Guideline for the Management of Blood Pressure in Chronic Kidney Disease (*Kidney Int. 2021;99(3S):S1–S87*)
  3. **ESC 2026** Guidelines for the Management of Cardiovascular Disease in Patients with Chronic Kidney Disease (*CVD-CKD*)
  4. **ADA 2026** Standards of Care in Diabetes – Section 11: Chronic Kidney Disease and Risk Management
  5. **Bộ Y tế Việt Nam 2024** – Hướng dẫn chẩn đoán và điều trị bệnh thận mạn và một số bệnh lý thận (*Quyết định 2388/QĐ-BYT ngày 12/08/2024*)
  6. **UKKA 2022/2020** Clinical Practice Guidelines – Treatment of Acute Hyperkalaemia in Adults
  7. **KDIGO 2012** Clinical Practice Guideline for Acute Kidney Injury
  8. **Nhãn thuốc gốc FDA / EMA SmPC:** Kerendia (*finerenone*), Lokelma (*sodium zirconium cyclosilicate*), Veltassa (*patiromer*), Cozaar (*losartan*), Coversyl (*perindopril*), Farxiga (*dapagliflozin*), Jardiance (*empagliflozin*), Ozempic (*semaglutide*)
- **Tệp JSON cấu trúc đi kèm:** [round4_R1.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/round4_R1.json)

---

## 1. Kết luận Tổng quan & Phán quyết Vòng 4 (Executive Verdict)

| Mức độ nghiêm trọng (`severity`) | Số lượng phát hiện | Mã định danh |
| :--- | :---: | :--- |
| **`critical`** (Nguy cơ trực tiếp gây hại nặng / tử vong) | **2** | `CKD-R4-R1-01`, `CKD-R4-R1-02` |
| **`major`** (Sai lệch phác đồ lớn / kê đơn trái nhãn & guideline) | **4** | `CKD-R4-R1-03`, `CKD-R4-R1-04`, `CKD-R4-R1-05`, `CKD-R4-R1-06` |
| **`minor`** (Bỏ sót ngưỡng tiện ích đã khai báo / lỗi siêu dữ liệu hiển thị) | **2** | `CKD-R4-R1-07`, `CKD-R4-R1-08` |
| **`suggestion`** (Hoàn thiện UX & diễn đạt phác đồ phối hợp) | **1** | `CKD-R4-R1-09` |
| **Tổng cộng** | **9** | — |

> **PHÁN QUYẾT CUỐI CÙNG (FINAL VERDICT): `FAIL`**
> *(Theo quy tắc nghiêm ngặt của dự án: chỉ đạt `PASS` khi `0 critical` VÀ `0 major`. Phân hệ `ckd` sau tái cấu trúc hậu Vòng 3 đã khắc phục xuất sắc toàn bộ 9/9 lỗi của R1 Vòng 3 và đạt chuẩn kiến trúc `< 20 KB`/tệp, nhưng phát sinh/bộc lộ **2 lỗi `critical`** và **4 lỗi `major`** qua kiểm thử thực thi trực tiếp `evaluate()` cần được xử lý dứt điểm trước khi thông qua).*

---

## 2. Kiểm tra Kiến trúc Tái cấu trúc (`< 20 KB`) & Hậu kiểm Khắc phục Vòng 3

### 2.1. Kiểm tra tính toàn vẹn mô-đun hóa (`src/modules/ckd/`)
- Toàn bộ **23 tệp mã nguồn** trong thư mục `src/modules/ckd/` đều tuân thủ nghiêm ngặt giới hạn kích thước `< 20.480 bytes` (tệp lớn nhất là [rules.outpatient.glp1ra.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.glp1ra.ts) đạt `19.750 bytes`).
- Không còn số ma thuật (*magic numbers*) vượt rào trong các tệp luật: mọi ngưỡng lâm sàng đều truy xuất qua `thFor(...)` từ [kb/thresholds/ckd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/ckd.json).

### 2.2. Bảng Hậu kiểm 9 Phát hiện Vòng 3 của R1 & Các mục liên quan

| Mã Vòng 3 | Nội dung cốt lõi | Trạng thái hậu kiểm Vòng 4 | Bằng chứng xác nhận trên mã nguồn & `evaluate()` |
| :--- | :--- | :---: | :--- |
| `CKD-R3-R1-01` | Nút chọn BN mẫu 3 & 4 không tự chuyển sang chế độ Nội trú (`setting: 'inpatient'`) | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | [`PresetPatient`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/types.ts) đã có `setting?: Setting`; [`applyPresetSelection()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L80-L97) chuyển tự động `setting: 'inpatient'` cho BN 3 & BN 4 và hiển thị đầy đủ phác đồ AKI / UKKA 5 bước. |
| `CKD-R3-R1-02` | Trần liều thận giả tạo bắt giảm liều ARB thải qua gan-mật (Losartan, Valsartan, Telmisartan, Irbesartan) | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | [losartan.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/losartan.json), [valsartan.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/valsartan.json), [telmisartan.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/telmisartan.json), [irbesartan.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/irbesartan.json) và [`getRenalMaxDailyDoseInfo()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L129-L137) giữ nguyên trần người lớn theo đúng nhãn FDA & BYT 2024 Bảng 12. |
| `CKD-R3-R1-03` | Trụ cột 4 Semaglutide: sót G4 (`15 <= eGFR < 25`), sai toán tử `>` ở mốc FLOW `10`/`30` mg/mmol, sai `Class I-B` & `ADA 11.4b` | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | [rules.outpatient.glp1ra.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.glp1ra.ts) đã bao phủ `15 <= eGFR < 25`, dùng `>=` cho `10` và `30` mg/mmol, chặn tiền sử MTC/MEN2 & viêm tụy cấp, ghi chuẩn `ESC 2026 Bảng 12 (Class I, Level A)` và `ADA 2026 Khuyến cáo 11.7b (Mức A)`. |
| `CKD-R3-R1-04` | Finerenone: 2 citation ma, bất nhất biên `LVEF >= 40%`, sai ngưỡng `K+ < 5.0` ở HF Bảng 3, khởi trị đè khi RASi chưa đạt đích | **ĐÃ KHẮC PHỤC 3.5/4** *(còn sót nhánh quá liều/đa liều)* | Đã xóa citation ma, đồng bộ `lvef >= 40` và `k < 5.0` cho HF Bảng 3 ([rules.outpatient.finerenone.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.finerenone.ts#L305-L321)). Tuy nhiên cổng RASi bị lọt khi dùng đa liều (`CKD-R4-R1-01`) hoặc khi ACEi đang vượt trần thận (`CKD-R4-R1-05`). |
| `CKD-R3-R1-05` | Ngưỡng THA khởi trị RASi dùng `140/90` thay vì `>= 130/80 mmHg` | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | [`ckd.outpatient.rasi_initiate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.rasi.ts#L45-L48) dùng chuẩn `sbp >= 130 || dbp >= 80 || hasCondition(ctx, 'htn')`. |
| `CKD-R3-R1-06` | Dự phòng thuốc cản quang truyền NaCl 0.9% thường quy ở mọi `eGFR < 45` và ghi sai `Class I` | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | [rules.inpatient.rrt_contrast.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.rrt_contrast.ts) đã phân tầng `START` khi `eGFR < 30 || intraArterial` và `CONSIDER` khi CT tĩnh mạch G3b nguy cơ cao, trích dẫn đúng `ESC 2026 Bảng 30 (Class IIb, Level C)`. Ngưỡng chuyển cấp cứu toan chuyển hóa ngoại trú đã nâng lên `HCO3- < 12 mmol/L`. |
| `CKD-R3-R1-07` | Trích dẫn sai số bảng ESC/BYT và toán tử `< 30` trong đích huyết áp CKD | **ĐÃ KHẮC PHỤC Ở HỒ SƠ VN** *(nhưng lọt lỗi lọc máu ở INTL/US)* | Hồ sơ `VN` đã sửa chuẩn `ESC 2026 Bảng 9` & `BYT 2024 Bảng 11` (`< 30` vs `>= 30`), nhưng hồ sơ mặc định `INTL` lại áp đích `< 120 mmHg` lên cả bệnh nhân chạy thận nhân tạo (`CKD-R4-R1-03`). |
| `CKD-R3-R1-08` | Nhân đôi cảnh báo khẩn cấp tăng kali máu giữa engine chung và module `ckd` | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | [reviewMedsSpecialized.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/safety/reviewMedsSpecialized.ts) đã khử trùng lặp sạch sẽ khi `ckd` phát thẻ xử trí tăng kali máu chuyên sâu. |
| `CKD-R3-R1-09` | Sai nhãn `Grade 1B` cho Cystatin C (đúng là `1C`), lỗi `'10 mg mg/ngày'`, nhân đôi tương tác SZC | **ĐÃ KHẮC PHỤC HOÀN TOÀN** | [`cystatin_c_g3aa1_confirm`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.referral_diagnostics.ts#L181) đã sửa thành `Grade 1C`; `formatCurrentMedDose` khử lặp `'mg mg'`; `interactions.ts` khử trùng lặp cặp SZC. Số mũ CKD-EPI 2012 Cystatin C tại [egfr.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/egfr.ts) đã chuẩn `-1.328`. |

---

## 3. Thẩm định Chuyên sâu Y khoa theo Từng Miền Lâm sàng

1. **Bộ công thức mức lọc cầu thận & tiên lượng suy thận (`egfr.ts`, `kdigo.ts`, `kfre.ts`):**
   - Công thức **CKD-EPI 2021 Creatinine** (`kappa = 0.7/0.9`, `alpha = -0.241/-0.302`, hệ số `142`, `0.9938^age`, `× 1.012` nữ), **CKD-EPI 2021 Cr-Cys** (`135`, `-0.219/-0.144`, `-0.323/-0.778`, `0.9961^age`, `× 0.963` nữ) và **CKD-EPI 2012 Cystatin C** (`133`, `-0.499`, `-1.328`, `0.996^age`, `× 0.932` nữ) khớp tuyệt đối từng chữ số với Inker et al. *NEJM 2021* và *NEJM 2012*.
   - Phương trình **KFRE 4 biến Tangri** hiệu chỉnh đúng hệ số vùng Bắc Mỹ (`S0_2y = 0.9750`, `S0_5y = 0.9240`) và ngoài Bắc Mỹ (`S0_2y = 0.9832`, `S0_5y = 0.9365` cho `VN`/`INTL`), chuyển đổi đúng `UACR mg/mmol × 8.84` sang `mg/g`. Tuy nhiên `risk2Year` chưa được nối vào luật lâm sàng (`CKD-R4-R1-07`).
2. **Bốn trụ cột bảo vệ Tim - Thận - Chuyển hóa ngoại trú:**
   - **Trụ cột 1 – SGLT2i** ([rules.outpatient.sglt2i.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.sglt2i.ts)): Đúng ngưỡng khởi trị `eGFR >= 20 mL/phút/1.73m²` (1A cho ĐTĐ2 hoặc `UACR >= 20 mg/mmol`; 2B cho `eGFR 20–<45` kèm `UACR < 20 mg/mmol`), duy trì tiếp tục khi `eGFR < 20` tới khi lọc máu (PP 3.7.1), chống chỉ định ĐTĐ típ 1, thai kỳ, tiền sử DKA.
   - **Trụ cột 2 – RASi** ([rules.outpatient.rasi.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.rasi.ts), [rules.outpatient.rasi_titration.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.rasi_titration.ts)): Phân tầng chính xác `1B` (A3 không ĐTĐ; A2–A3 có ĐTĐ) và `2C` (A2 không ĐTĐ), xử lý tốt suy gan (chọn Lisinopril ở Child-Pugh C; giảm nửa liều khởi đầu Losartan 25 mg ở Child-Pugh A/B; ngừng Telmisartan ở Child-Pugh C), cấm phối hợp kép ACEi + ARB / ARNI (1B). **Điểm gãy nghiêm trọng:** hàm `parseCurrentDailyDoseMg` bỏ qua `med.freq` làm đảo ngược toàn bộ logic chỉnh liều/chuẩn độ khi thuốc uống `>= 2 lần/ngày` hoặc `cách ngày` (`CKD-R4-R1-01`).
   - **Trụ cột 3 – Finerenone** ([rules.outpatient.finerenone.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.finerenone.ts), [rules.outpatient.finerenone_safety.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.finerenone_safety.ts)): Đúng ngưỡng `eGFR >= 25`, liều khởi đầu `10 mg` (`25–<60`) vs `20 mg` (`>= 60`), tránh dùng ở HFrEF (ưu tiên MRA steroid) và Child-Pugh C, tạm ngừng khi `K+ > 5.5` hoặc đang dùng chất ức chế mạnh CYP3A4 (itraconazole, clarithromycin, ritonavir...). **Điểm gãy:** vẫn phát `[START]` Finerenone đồng thời khi nền ACEi đang quá liều thận phải giảm liều/đổi thuốc và thiếu cảnh báo theo dõi sớm K+ khi `4.8 < K+ <= 5.0` (`CKD-R4-R1-05`).
   - **Trụ cột 4 – GLP-1 RA Semaglutide** ([rules.outpatient.glp1ra.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.glp1ra.ts)): Rất chuẩn xác sau khắc phục Vòng 3 (chuẩn FLOW + KDIGO 2024 Rec 3.9.1 + BYT 2024 Bảng 45).
3. **Kiểm định Trích dẫn & Văn bản gốc (`kb/citations/ckd.json` đối chiếu PDF):**
   - Toàn bộ **124/124 mã `citationId`** được tham chiếu trong `src/modules/ckd/**`, `kb/thresholds/ckd.json` và 18 tệp thuốc thuộc phạm vi CKD đều tồn tại hợp lệ (**0 mã trích dẫn ma**), văn bản `quote` trùng khớp nguyên văn với tài liệu gốc trong `Medical_Library_2026`. Có 1 lỗi nhỏ về việc gán thừa huy hiệu `cor`/`loe` cho các mục `(Not Graded)` và *Practice Point* (`CKD-R4-R1-08`).

---

## 4. Chi tiết Các Phát hiện Vòng 4 (Round 4 Detailed Findings)

---

### 🔴 `[CRITICAL]` `CKD-R4-R1-01` — Hàm `parseCurrentDailyDoseMg(med)` bỏ qua hoàn toàn `med.freq`, gây lệnh `[UPTITRATE]` trên phác đồ quá liều độc thận ở CKD G5, `[UPTITRATE]` vượt trần liều tối đa & `[DEFER]` oan Finerenone ở phác đồ chia 2–3 lần/ngày, và `[REDUCE]` ngược đời trên phác đồ cách ngày

- **Loại mục (`itemType`):** `rule` | **Định danh (`itemId`):** `ckd.helpers.parseCurrentDailyDoseMg`
- **Tệp liên quan:**
  - [`parseCurrentDailyDoseMg`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L31-L59) vs [`getTargetMaxDailyDoseMg`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L72-L83) & [`getRenalMaxDailyDoseInfo`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L111-L266)
  - [`ckd.outpatient.rasi_uptitrate`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.rasi_titration.ts#L183-L203) & [`ckd.outpatient.rasi_renal_dose_reduce`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.rasi_titration.ts#L312-L318)
  - [`ckd.outpatient.finerenone_indication`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.finerenone.ts#L147-L165)
  - [`ckd.outpatient.metabolic_acidosis`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.bp_acidosis.ts#L271-L325)

#### Phân tích lâm sàng & kỹ thuật
Trong cấu trúc dữ liệu `CurrentMed` (`{ drugId, name, dose: number | string, unit?: string, freq?: string }`), liều dùng mỗi lần uống (`dose`) và số lần uống trong ngày (`freq`) được lưu ở hai trường tách biệt. Các hàm tính trần đích như `getTargetMaxDailyDoseMg` (dòng 79–80) và `getAbsoluteMaxDailyDoseMg` (dòng 90) đều nhân `amount * parseMaxFrequencyPerDay(frequency)` để quy về **tổng liều mg/ngày** (ví dụ: Captopril `50 mg × 3 lần/ngày` = `150 mg/ngày`; Valsartan `160 mg × 2 lần/ngày` = `320 mg/ngày`; Natri Bicarbonat tối đa `4000 mg/ngày`), và `getRenalMaxDailyDoseInfo` quy Perindopril `2.5 mg cách ngày` thành `1.25 mg/ngày`.

Thế nhưng tại [`helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L33-L37):
```ts
if (typeof med.dose === 'number') {
  if (!Number.isFinite(med.dose)) return undefined;
  const uLow = (med.unit ?? 'mg').toLowerCase();
  return uLow === 'g' || uLow.startsWith('g/') ? med.dose * 1000 : med.dose;
}
```
Hàm trả thẳng `med.dose` (liều 1 lần uống) mà **bỏ qua hoàn toàn `med.freq`**! Lỗi lệch chuẩn đơn vị này gây ra **4 hậu quả nguy hiểm trực tiếp** đã được xác minh qua chạy `evaluate()`:

1. **Bỏ lọt quá liều độc thận gấp 200% VÀ ra lệnh `[UPTITRATE]` tăng thêm liều ở CKD G5:**
   - *Kịch bản (Case 1A):* Nam 68 tuổi, CKD G5 chưa lọc máu (`SCr = 480 µmol/L` → `eGFR = 10.8 mL/phút/1.73m²`, `CrCl = 12.0 mL/phút`), `HA 142/84 mmHg`, `K+ = 4.4 mmol/L`, đang uống `{ drugId: 'captopril', dose: 50, unit: 'mg', freq: '3 lần/ngày' }` (= **150 mg/ngày**). Theo **Hướng dẫn BYT 2024 – Bảng 12** (tr. 38), khi `GFR < 10–15 mL/phút`, Captopril phải giảm 50% liều (tối đa **75 mg/ngày**, giãn cách mỗi 24 giờ) để tránh tích lũy gây giảm bạch cầu hạt, tăng kali máu và suy thận cấp.
   - *Đầu ra `evaluate()` thực tế:* Hệ thống đọc nhầm `150 mg/ngày` thành `50 mg/ngày` (`< 75 mg/ngày`), nên **bỏ lọt hoàn toàn `[REDUCE]`** và phát ngược lệnh **`REC [UPTITRATE] rec_ckd_rasi_uptitrate: Tăng liều Captopril đến liều tối đa dung nạp theo chức năng thận (hướng tới đích tối đa dung nạp 75 mg/ngày)`**!
2. **Ra lệnh `[UPTITRATE]` vượt trần liều tối đa phê duyệt VÀ `[DEFER]` oan Finerenone:**
   - *Kịch bản (Case 2 & 1B):* Nam 62 tuổi, ĐTĐ2 + CKD G3b (`eGFR = 38`, `UACR = 45 mg/mmol`, `K+ = 4.3`), đang dùng `{ drugId: 'valsartan', dose: 160, unit: 'mg', freq: '2 lần/ngày' }` (= **320 mg/ngày**, liều tối đa được FDA/BYT phê duyệt) + Dapagliflozin 10 mg.
   - *Đầu ra `evaluate()` thực tế:* Phát sai **`REC [UPTITRATE] rec_ckd_rasi_uptitrate`** yêu cầu tăng tiếp Valsartan vượt quá 320 mg/ngày, đồng thời phát sai **`REC [DEFER] rec_ckd_finerenone_start`** với lý giải sai sự thật: *"TẠM HOÃN khởi trị đồng thời: Valsartan hiện mới ở liều 160 mg/ngày (< liều đích 320 mg/ngày)"*! (Lỗi y hệt xảy ra với Captopril `50 mg × 3 lần/ngày`).
3. **Phát lệnh `[REDUCE]` tự mâu thuẫn trên phác đồ cách ngày đã chỉnh liều chuẩn:**
   - *Kịch bản (Case 3):* Nữ 70 tuổi, CKD G4 (`eGFR = 21.5`, hồ sơ `INTL`), đã được bác sĩ chỉnh đúng `{ drugId: 'perindopril', dose: 2.5, unit: 'mg', freq: 'cách ngày' }` (= `1.25 mg/ngày` theo đúng EMA Coversyl SmPC Table 1).
   - *Đầu ra `evaluate()` thực tế:* Hệ thống đọc `2.5 > 1.25` và phát **`REC [REDUCE] rec_ckd_rasi_renal_reduce: Giảm liều Perindopril về mức tối đa theo chức năng thận (2.5 mg cách ngày)`** — bắt giảm về đúng liều bệnh nhân đang uống!
4. **Vượt rào trần 4.000 mg/ngày của Natri Bicarbonat và ra lệnh "Tăng liều" xuống mức thấp hơn:**
   - *Kịch bản (Case 4):* Nam 65 tuổi, CKD G4, `HCO3- = 16 mmol/L`, đang uống `{ drugId: 'sodium_bicarbonate', dose: 1000, unit: 'mg', freq: '4 lần/ngày' }` (= **4.000 mg/ngày**, kịch trần BYT 2024).
   - *Đầu ra `evaluate()` thực tế:* Bỏ qua nhánh `MONITOR` toan chuyển hóa kháng trị và phát sai **`REC [UPTITRATE] rec_ckd_acidosis_bicarb: Tăng liều Natri Bicarbonat (1000 mg 2–3 lần/ngày)`**!

#### Hướng khắc phục đề xuất
- Tại [`parseCurrentDailyDoseMg`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L31-L59), nhân liều đơn vị với hệ số tần suất từ `med.freq` thông qua hàm tách tần suất chuẩn hóa (hỗ trợ `'2 lần/ngày'`/`'bid'`/`'mỗi 12 giờ'`/`'q12h'` → `2`; `'3 lần/ngày'`/`'tid'`/`'mỗi 8 giờ'`/`'q8h'` → `3`; `'4 lần/ngày'`/`'qid'`/`'mỗi 6 giờ'`/`'q6h'` → `4`; `'cách ngày'`/`'mỗi 48 giờ'`/`'q48h'`/`'qod'` → `0.5`), áp dụng cho cả `typeof med.dose === 'number'` và `typeof med.dose === 'string'` khi chuỗi `med.dose` chưa tự chứa biểu thức nhân tần suất.

---

### 🔴 `[CRITICAL]` `CKD-R4-R1-02` — Quy tắc cấp cứu tăng kali máu nặng nội viện kích hoạt truyền Insulin 10 IU + khí dung Salbutamol + Lokelma 10 g TID ngay cả khi Kali máu BÌNH THƯỜNG / HẠ KALI hoặc CHƯA CÓ K+ (`k === undefined`), và tiêm Calcium Gluconate thường quy khi `K+ >= 6.5` không có biến đổi ECG

- **Loại mục (`itemType`):** `rule` | **Định danh (`itemId`):** `ckd.inpatient.hyperkalemia_severe`
- **Tệp liên quan:** [`rules.inpatient.hyperkalemia.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.hyperkalemia.ts#L21-L156)

#### Phân tích lâm sàng & bằng chứng Guideline gốc
1. **Lỗi thứ nhất — Kích hoạt toàn bộ thuốc hạ kali mạnh dựa đơn độc vào cờ `ecgHyperkalemia` không kiểm chứng `K+`:**
   - Tại dòng 31 và dòng 110 của [`rules.inpatient.hyperkalemia.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.inpatient.hyperkalemia.ts#L31):
     ```ts
     return (k !== undefined && k >= thFor('k', 'ckd.hyperkalemia.severe_min')) || ecgChanges;
     ```
   - **Kiểm chứng `evaluate()` Case 6B (`k = 4.1 mmol/L`, `ecgHyperkalemia: true`):** Trên lâm sàng cấp cứu, sóng T cao nhọn đối xứng hoặc QRS giãn rộng rất thường gặp trong **nhồi máu cơ tim tối cấp thành trước (hyperacute anterior STEMI — De Winter / hyperacute T waves), tái cực sớm, phì đại thất trái hoặc block nhánh** dù Kali máu hoàn toàn bình thường hoặc thấp (`K+ = 4.1` hoặc `3.2 mmol/L`). Khi tích ô `ecgHyperkalemia`, hệ thống lập tức phát **`REC [START] rec_ckd_hyperkalemia_severe_bundle (CẤP CỨU TĂNG KALI MÁU NẶNG: K⁺ = 4.1 mmol/L + Biến đổi ECG)`** ra lệnh truyền **Insulin tác dụng nhanh 10 IU + Khí dung Salbutamol 10–20 mg** VÀ **`REC [START] rec_ckd_hyperkalemia_severe_szc_order: Khởi trị Lokelma 10 g x 3 lần/ngày`**! Phối hợp Insulin 10 IU + Salbutamol 10–20 mg + SZC 10 g làm giảm K+ huyết thanh **1,2–2,0 mmol/L**, đẩy bệnh nhân từ `K+ = 4.1` (hoặc `3.2`) xuống **`K+ ~ 2.1–2.5 mmol/L` → gây xoắn đỉnh, rung thất và ngừng tim do hạ kali máu y sinh**, đồng thời lách qua cổng chặn hạ kali của SZC!
   - **Kiểm chứng `evaluate()` Case 6A (`k = undefined`, `ecgHyperkalemia: true`):** Vi phạm trực tiếp nguyên tắc **Fail-Closed** khi phát đồng thời y lệnh `[START]` Insulin 10 IU + Salbutamol + Lokelma 10 g TID cùng lúc với thẻ `missing_input_k` (*"Chưa có thông số Kali máu"*). Theo **UKKA 2022 Guideline 15.2 & 16.6.1** (*PDF tr. 12–13*), bắt buộc xét nghiệm khẩn K+ trên máy khí máu tại giường (*point-of-care blood gas*) và SZC cấp cứu chỉ chỉ định khi xác nhận **`serum K+ >= 6.5 mmol/L` (1B)**.
2. **Lỗi thứ hai — Ra y lệnh cứng tiêm Calcium Gluconate 10% 30 mL ở `K+ >= 6.5 mmol/L` khi ECG bình thường (`ecgHyperkalemia === false`):**
   - **Kiểm chứng `evaluate()` Case 6C (`k = 6.6 mmol/L`, `ecgHyperkalemia: false`):** Bước 1 vẫn ra lệnh cứng *"1. Bảo vệ tim: Tiêm TM chậm Calcium Gluconate 10% 30 mL"* và gắn trích dẫn `ukka.2022.guideline_16_2_calcium_salts`.
   - **Đối chiếu nguyên văn UKKA 2022 Guideline 16.2** (*PDF tr. 13 & tr. 76*):
     > *"Guideline 16.2: We recommend that intravenous calcium salts... be given at an equivalent dose of 6.8 mmol **in the presence of ECG evidence of hyperkalaemia** (1C)."*
     > *(Tr. 76)*: *"There is no consensus about using IV calcium in the following circumstances: • isolated peaked T waves • **normal ECG**... Given that 1) the ECG is the best tool for assessing cardiac toxicity, 2) the effect of IV calcium is assessed by an improvement in ECG appearance, and 3) IV calcium is not without risk, **it seems reasonable to reserve IV [calcium for patients with ECG changes]**."*
   - **Đối chiếu nguyên văn Hướng dẫn Bộ Y tế 2024 – Mục 4.9.3.1** (*PDF tr. 60–61*): Chỉ định tiêm Canxi tĩnh mạch khi **`K+ máu > 7 mmol/L` hoặc có biểu hiện trên điện tâm đồ đe dọa tính mạng**, không tiêm thường quy ở dải `6.5–7.0 mmol/L` không biến đổi ECG, và cảnh báo nguy cơ loạn nhịp nếu đang ngộ độc digitalis (digoxin).

#### Hướng khắc phục đề xuất
1. Chỉ cho phép kích hoạt phác đồ thuốc hạ kali cấp cứu nặng (Insulin-Glucose + Salbutamol + SZC 10 g TID) khi **`k !== undefined && (k >= 6.5 || (k > 5.0 && ecgChanges))`**.
2. Khi `ecgChanges === true` nhưng `k === undefined`: phát thẻ cảnh báo khẩn `[DEFER]`/`[MONITOR]` yêu cầu lấy ngay mẫu máu động mạch/tĩnh mạch chạy `K+` trên máy khí máu tại giường (*blood gas analyzer*) để xác nhận tăng kali trước khi truyền Insulin/Salbutamol/SZC. Khi `ecgChanges === true` nhưng `k <= 5.0 mmol/L`: phát cảnh báo `[MONITOR]` tìm nguyên nhân tim mạch cấp khác gây biến đổi sóng T/QRS (đặc biệt loại trừ STEMI tối cấp), tuyệt đối không hạ kali.
3. Trong `hyperkalemia_severe.produce()`, phân nhánh bước 1 (Calcium Gluconate 10% 30 mL): chỉ định tiêm ngay khi `ecgChanges === true` (hoặc `k > 7.0 mmol/L` theo BYT 2024, kèm lưu ý kiểm tra digoxin); nếu `ecgChanges === false` ở `K+ 6.5–7.0 mmol/L`, hướng dẫn mắc monitor điện tim liên tục và chỉ tiêm Canxi tĩnh mạch ngay khi xuất hiện rối loạn dẫn truyền/biến đổi ECG theo đúng UKKA 2022 Guideline 16.2.

---

### 🟠 `[MAJOR]` `CKD-R4-R1-03` — Quy tắc `ckd.outpatient.bp_target` áp đặt mục tiêu hạ huyết áp tâm thu tích cực `< 120 mmHg` (`[UPTITRATE]`) lên bệnh nhân ĐANG LỌC MÁU CHU KỲ (`onDialysis: true`) ở hồ sơ mặc định `INTL`

- **Loại mục (`itemType`):** `rule` | **Định danh (`itemId`):** `ckd.outpatient.bp_target`
- **Tệp liên quan:** [`rules.outpatient.bp_acidosis.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.bp_acidosis.ts#L86-L186), [`AppShell.tsx`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L45)

#### Phân tích lâm sàng & bằng chứng Guideline gốc
Tại [`rules.outpatient.bp_acidosis.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.bp_acidosis.ts#L86-L118), dù biến `isSevereCkdOrDialysis` đã được tính ở dòng 86–87, cấu trúc `if / else if` ở dòng 95–116 lại đặt `if (profile === 'INTL')` và `else if (profile === 'US')` **lên trước** `else if (isSevereCkdOrDialysis)`:
- **Kiểm chứng `evaluate()` Case 5A:** Nam 58 tuổi chạy thận nhân tạo chu kỳ (`conditions: { ckd: true, onDialysis: true, htn: true }`, `BP = 145/85 mmHg`, `profile: 'INTL'` — chính là hồ sơ mặc định khi mở ứng dụng tại `INITIAL_SETTINGS` dòng 45 của `AppShell.tsx`!) nhận lệnh **`REC [UPTITRATE] rec_ckd_bp_target: Đích huyết áp tâm thu < 120 mmHg (KDIGO 2021/2024)`** kèm trích dẫn `kdigo.2021.bp.rec_3_1_1_target_sbp_120` và `kdigo.ckd.2024.rec_3_4_1_bp_target_120`!
- **Đối chiếu nguyên văn KDIGO 2021 BP in CKD – Tiêu đề Chương 3** (*PDF tr. 29*):
  > *"Chapter 3: Blood pressure management in patients with CKD, with or without diabetes, **not receiving dialysis** — Recommendation 3.1.1: We suggest that adults with high BP and CKD be treated with a target systolic blood pressure (SBP) of <120 mm Hg, when tolerated, using standardized office BP measurement (2B)."*
- Thử nghiệm SPRINT và KDIGO 2021/2024 Rec 3.4.1 **loại trừ hoàn toàn bệnh nhân lọc máu chu kỳ**. Trên bệnh nhân chạy thận nhân tạo, ép huyết áp phòng khám xuống `< 120 mmHg` gây **tụt huyết áp trong buổi lọc (*intradialytic hypotension*), choáng cơ tim (*myocardial stunning*), thiếu máu não thoáng qua, mất vô niệu sớm chức năng thận tồn dư và huyết khối tắc cầu nối thông động - tĩnh mạch (AVF)**. ESC 2026 CVD-CKD (Bảng 9) và BYT 2024 (Bảng 11) cũng loại trừ nhóm lọc máu khỏi đích hạ áp tích cực.

#### Hướng khắc phục đề xuất
Đưa nhánh kiểm tra `if (hasCkdFlag(ctx, 'onDialysis'))` lên **trước** phân nhánh `INTL` / `US` / `VN` trong `ckd.outpatient.bp_target.produce()` để áp dụng nhất quán trên cả 3 hồ sơ: hướng dẫn kiểm soát huyết áp ở bệnh nhân lọc máu dựa trên tối ưu cân khô (*dry weight*), hạn chế muối-nước giữa hai kỳ lọc, đo huyết áp ngoài phòng lọc/tại nhà và cá thể hóa mục tiêu dung nạp an toàn (`< 130–140 / < 80–90 mmHg` tùy dung nạp, tránh tụt huyết áp trong ca lọc), tuyệt đối không gán trích dẫn `< 120 mmHg` của KDIGO Rec 3.1.1/3.4.1.

---

### 🟠 `[MAJOR]` `CKD-R4-R1-04` — Sai phác đồ liều dùng của Sodium Zirconium Cyclosilicate (Lokelma) trên bệnh nhân chạy thận nhân tạo chu kỳ (`10 g x 3 lần/ngày` hàng ngày thay vì `5 g x 1 lần/ngày chỉ vào ngày KHÔNG lọc máu`)

- **Loại mục (`itemType`):** `drug` | **Định danh (`itemId`):** `sodium_zirconium_cyclosilicate`
- **Tệp liên quan:**
  - [sodium_zirconium_cyclosilicate.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/sodium_zirconium_cyclosilicate.json#L37-L46)
  - [`ckdMatrix` (cột `dialysis` của SZC)](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/matrix.ts#L283-L289)
  - [`rules.outpatient.kbinders.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.kbinders.ts#L96-L99)

#### Phân tích lâm sàng & bằng chứng Nhãn gốc FDA
Hiện tại, cả [sodium_zirconium_cyclosilicate.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/drugs/sodium_zirconium_cyclosilicate.json#L37-L46) và ô `cells.dialysis` trong [`matrix.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/matrix.ts#L283-L289) đều ghi cho bệnh nhân chạy thận nhân tạo chu kỳ:
> `"dose": "10 g x 3 lần/ngày (48h đầu), sau đó 5–10 g/ngày"` — *"An toàn cho mọi giai đoạn suy thận và bệnh nhân chạy thận nhân tạo chu kỳ"*.

Đối chiếu nguyên văn **FDA Prescribing Information for LOKELMA – Section 2.2 ("Recommended Dosage in Patients on Chronic Hemodialysis") & Section 5.2 ("Edema")** (*PDF tr. 1, 3–4*):
> *"2.2 Recommended Dosage in Patients on Chronic Hemodialysis: For patients on chronic hemodialysis, **administer LOKELMA only on non-dialysis days. The recommended starting dose is 5 g once daily on non-dialysis days.** Consider a starting dose of 10 g once daily on non-dialysis days in patients with serum potassium greater than 6.5 mEq/L. Monitor serum potassium and adjust the dose of LOKELMA based on the pre-dialysis serum potassium value after the long inter-dialytic interval and desired target range. The recommended maintenance dose range is from 5 g to 15 g once daily, **on non-dialysis days**."*
> *"5.2 Edema: Each 5 g dose of LOKELMA contains approximately 400 mg of sodium."*

Việc cho bệnh nhân chạy thận nhân tạo chu kỳ ngoại trú uống phác đồ không lọc máu `10 g × 3 lần/ngày` (= **30 g/ngày**, nạp thêm **2.400 mg Natri nguyên tố/ngày** ở bệnh nhân vô niệu!) và uống cả vào ngày lọc máu (khi dịch lọc kali thấp đã kéo K+ xuống nhanh) gây hai nguy cơ lớn: **phù phổi cấp do quá tải natri-thể tích giữa kỳ lọc** và **hạ kali máu nặng / loạn nhịp thất sau buổi chạy thận**.

#### Hướng khắc phục đề xuất
1. Bổ sung trích dẫn nguyên văn `fda.szc.hemodialysis_dosing` (FDA Lokelma Section 2.2) vào [kb/citations/ckd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/ckd.json).
2. Sửa ô `cells.dialysis` của `sodium_zirconium_cyclosilicate` trong [`matrix.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/matrix.ts#L283-L289) thành **`"5 g x 1 lần/ngày chỉ vào NGÀY KHÔNG LỌC MÁU (10 g nếu K+ trước lọc > 6.5; duy trì 5–15 g ngày không lọc máu)"`**, ghi chú rõ hàm lượng `400 mg Na+ / gói 5 g`, đồng thời cập nhật ghi chú tương ứng trong `sodium_zirconium_cyclosilicate.json` và `rules.outpatient.kbinders.ts` khi `onDialysis === true`.

---

### 🟠 `[MAJOR]` `CKD-R4-R1-05` — Khởi trị đồng thời `[START]` Finerenone ngay khi nền ACEi đang quá liều tích lũy thận / đang phải chuyển đổi thuốc (`[REDUCE]` Perindopril hoặc Ramipril ở CKD G4), và thiếu phân tầng theo dõi sớm K+ khi khởi trị ở vùng ranh giới `4.8 < K+ <= 5.0 mmol/L`

- **Loại mục (`itemType`):** `rule` | **Định danh (`itemId`):** `ckd.outpatient.finerenone_indication`
- **Tệp liên quan:** [`rules.outpatient.finerenone.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.finerenone.ts#L122-L260)

#### Phân tích lâm sàng & bằng chứng Guideline / Nhãn FDA
1. **Khởi trị chồng Finerenone lên nền ACEi đang vượt trần thải trừ thận / đang phải đổi thuốc:**
   - Tại [`rules.outpatient.finerenone.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.finerenone.ts#L143-L165), code chỉ đặt `rasiSubTargetNeedsUptitrate = true` khi `!isBlockedVnPeri && currentRasiMg < effectiveCeiling`. Khi bệnh nhân đang dùng ACEi **vượt quá trần thận** (ví dụ ở `eGFR = 26.4 mL/phút/1.73m²`: đang uống `Perindopril 5 mg/ngày` trong khi BYT 2024 Bảng 12 khuyến cáo không dùng khi `CrCl < 30` / trần EMA là `1.25 mg/ngày`, hoặc đang uống `Ramipril 10 mg/ngày` vượt trần `5 mg/ngày`), cả `isBlockedVnPeri` (`true`) lẫn `currentRasiMg < effectiveCeiling` (`10 < 5` → `false`) đều khiến `rasiSubTargetNeedsUptitrate = false`!
   - **Kiểm chứng `evaluate()` Case 7A & 7B:** Hệ thống phát ĐỒNG THỜI **`REC [REDUCE] rec_ckd_rasi_renal_reduce`** (*"Chuyển đổi / Giảm liều Perindopril... ưu tiên chuyển sang Losartan"* hoặc *"Giảm liều Ramipril về tối đa 5 mg/ngày"*) VÀ **`REC [START] rec_ckd_finerenone_start: Khởi trị Finerenone (10 mg 1 lần/ngày)`**! Việc cộng thêm ngay một thuốc giữ kali nhóm MRA không steroid lên trên nền perindoprilat/ramiprilat đang tích lũy quá liều thận (hoặc ngay trong lúc vừa đổi ACEi sang ARB chưa kiểm tra lại K+ và SCr sau 2–4 tuần theo KDIGO PP 3.6.2) làm tăng cao nguy cơ tăng kali máu cấp và AKI, trái với điều kiện nền RASi ổn định của FIDELIO-DKD / KDIGO 2024 Rec 3.8.1.
2. **Thiếu lưu ý an toàn khi khởi trị Finerenone ở dải ranh giới `4.8 < K+ <= 5.0 mmol/L`:**
   - **Kiểm chứng `evaluate()` Case 10B (`K+ = 4.9 mmol/L`):** Hệ thống phát `[START]` giống hệt `K+ = 4.2 mmol/L` mà không có lưu ý phân tầng.
   - **Đối chiếu KDIGO 2024 Figure 26** (*PDF tr. 81*: *"K+ <= 4.8 mmol/l → Initiate finerenone"*) và **FDA Kerendia Label Section 2.2** (*PDF tr. 3*):
     > *"Initiation of KERENDIA is recommended when serum potassium is <= 4.8 mEq/L. For serum potassium > 4.8 to 5.0 mEq/L, initiation of KERENDIA **may be considered with additional serum potassium monitoring within the first 4 weeks** based on patient characteristics and serum potassium levels."*

#### Hướng khắc phục đề xuất
1. Trong `ckd.outpatient.finerenone_indication`, bổ sung cổng tạm hoãn `DEFER` khi nền RASi đang không ổn định/vượt trần thận (`isBlockedVnPeri || (currentRasiMg !== undefined && renalCeiling !== undefined && currentRasiMg > renalCeiling.maxDailyMg)`): hướng dẫn giảm liều hoặc chuyển đổi ACEi sang ARB an toàn thận trước, kiểm tra lại K+ và Creatinin sau 2–4 tuần ổn định rồi mới khởi trị Finerenone.
2. Khi `4.8 < k <= 5.0 mmol/L`, chuyển `action` sang `'CONSIDER'` (hoặc giữ cảnh báo rõ trong `title`/`rationale`/`gates`) yêu cầu xét nghiệm kiểm tra sớm K+ bổ sung trong vòng 2–4 tuần đầu theo đúng nhãn FDA Kerendia Section 2.2 & KDIGO 2024 Figure 26.

---

### 🟠 `[MAJOR]` `CKD-R4-R1-06` — Thiếu cổng xác nhận chẩn đoán CKD trong `statin_indication`, `bp_target` và `sick_day_education`: Kê đơn Atorvastatin 20 mg và gắn nhãn bệnh thận mạn cho người tầm soát có chức năng thận HOÀN TOÀN BÌNH THƯỜNG (`G1A1` / `G2A1` không tổn thương thận)

- **Loại mục (`itemType`):** `rule` | **Định danh (`itemId`):** `ckd.outpatient.statin_indication`
- **Tệp liên quan:**
  - [`rules.outpatient.statin.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.statin.ts#L30-L48)
  - [`rules.outpatient.bp_acidosis.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.bp_acidosis.ts#L31-L45)
  - [`rules.outpatient.nsaid_sickday.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.nsaid_sickday.ts#L188-L208)

#### Phân tích lâm sàng & bằng chứng Guideline gốc
Theo **KDIGO 2024 Chương 1 & Bảng 2** (*PDF tr. 19*) và **Recommendation 3.15.1.2** (*PDF tr. 51*):
> *"In adults aged >=50 years **with CKD** and eGFR >=60 ml/min per 1.73 m2 (G1–G2), we recommend treatment with a statin (1B)."*

Ở mức lọc cầu thận `eGFR >= 60 mL/phút/1.73m²` (G1 hoặc G2), bệnh nhân **CHỈ được chẩn đoán mắc CKD** khi có bằng chứng tổn thương thận (như albumin niệu `UACR >= 3 mg/mmol` [`>= 30 mg/g`], tiểu máu cầu thận, bất thường hình ảnh học/mô bệnh học thận hoặc ghép thận) tồn tại `>= 3 tháng`.

Tuy nhiên, `ckd.outpatient.statin_indication.when` chỉ kiểm tra `age >= 50` và `egfr !== undefined` mà không kiểm tra bệnh nhân có thực sự mắc CKD hay không!
- **Kiểm chứng `evaluate()` Case 8A:** Nam 55 tuổi đi khám sức khỏe định kỳ tầm soát thận, `SCr = 75 µmol/L` (`eGFR = 102.7 mL/phút/1.73m²` — G1), `UACR = 1.2 mg/mmol` (< 3 — A1 hoàn toàn bình thường), `HA = 124/76 mmHg`, `conditions: {}` (không tích bệnh nền nào), `currentMeds: []`, chọn phân hệ `['ckd']` để kiểm tra:
  1. Phát sai **`REC [START] rec_ckd_statin_start: Khởi trị Atorvastatin (20 mg 1 lần/ngày)`** với lý giải *"Người lớn từ 50 tuổi trở lên mắc bệnh thận mạn được khuyến cáo điều trị bằng statin (1B - KDIGO 2024 Rec 3.15.1.2)"*!
  2. Phát sai **`REC [CONTINUE] rec_ckd_bp_target`** gọi người khỏe mạnh là *"bệnh nhân CKD có eGFR >= 30"*.
  3. Phát sai **`REC [MONITOR] rec_ckd_sick_day_plan`** hướng dẫn *"tạm ngừng các thuốc nhóm SADMAN"* trong khi `currentMeds = []` (bệnh nhân không uống bất kỳ viên thuốc nào!).
- Nghiêm trọng hơn, khi `eGFR >= 60`, `uacr === undefined` và `conditions: {}`, quy tắc vẫn tự động kê đơn `[START] Atorvastatin 20 mg` viện dẫn Rec 3.15.1.2 dù chưa có xét nghiệm UACR để biết có CKD G1–G2 hay không (**vi phạm nguyên tắc Fail-Closed**).

#### Hướng khắc phục đề xuất
1. Bổ sung vị từ `hasConfirmedCkdEvidence(ctx)` trong `helpers.ts`: xác nhận có CKD khi `hasCkdFlag(ctx, 'onDialysis') || (egfr !== undefined && egfr < 60) || (uacr !== undefined && uacr >= 3) || Boolean(custom?.hematuria) || hasCondition(ctx, 'ckd')` (đồng thời nếu `egfr >= 60 && uacr === undefined && !hasCondition(ctx, 'ckd')` thì Fail-Closed không kê Statin theo Rec 3.15.1.2).
2. Áp cổng này vào `ckd.outpatient.statin_indication` và `ckd.outpatient.bp_target`. Đối với `ckd.outpatient.sick_day_education`, chỉ phát khi bệnh nhân có CKD xác nhận hoặc đang thực sự dùng ít nhất 1 thuốc thuộc nhóm nguy cơ ngày ốm (SADMAN).

---

### 🟡 `[MINOR]` `CKD-R4-R1-07` — Bỏ quên hai ngưỡng nguy cơ KFRE 2 năm (`> 10%` và `> 40%`) đã khai báo trong KB cùng hướng dẫn chuẩn bị đường vào mạch máu chạy thận / bảo tồn tĩnh mạch chi trên (KDIGO 2024 PP 2.2.2 & 2.2.3)

- **Loại mục (`itemType`):** `rule` | **Định danh (`itemId`):** `ckd.outpatient.nephrology_referral`
- **Tệp liên quan:** [kb/thresholds/ckd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/ckd.json#L634-L656), [`helpers.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/helpers.ts#L272-L285), [`rules.outpatient.referral_diagnostics.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.referral_diagnostics.ts#L20-L88)

#### Phân tích & hướng khắc phục
- [kb/thresholds/ckd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/ckd.json#L634-L656) đã khai báo `ckd.kfre.multidisciplinary_2y` (`10%`) và `ckd.kfre.krt_prep_2y` (`40%`), [kb/citations/ckd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/ckd.json#L55-L64) đã có `kdigo.ckd.2024.pp_2_2_3_kfre_krt_prep`, và [`computeKfre()`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/calculators/kfre.ts#L104) đã tính sẵn `risk2Year`, nhưng toàn bộ `src/modules/ckd/**` không nơi nào đọc các ngưỡng này.
- Ở bệnh nhân CKD G4 tiến triển nhanh (Case 10: nam 42T, `eGFR = 17.9`, `UACR = 400 mg/mmol` → **`KFRE 2 năm = 64.6% > 40%`**), cần nối `getKfre2y(ctx)` vào `referral_diagnostics.ts` để hiển thị rõ `KFRE 2 năm` và kích hoạt khuyến cáo chuẩn bị điều trị thay thế thận (KRT): giáo dục lựa chọn phương thức lọc máu/ghép thận đón đầu, lập kế hoạch tạo cầu nối thông động-tĩnh mạch tự thân (AVF) và **bảo tồn tĩnh mạch chi trên** (*tránh lấy máu/truyền dịch tĩnh mạch đầu cổ tay-cẳng tay tay không thuận và tuyệt đối tránh đặt catheter tĩnh mạch dưới đòn/PICC* theo KDIGO 2024 PP 2.2.3).

---

### 🟡 `[MINOR]` `CKD-R4-R1-08` — Gán nhãn `cor` / `loe` sai lệch trên UI cho các khuyến cáo `(Not Graded)`, bảng phân loại giai đoạn và 15 KDIGO Practice Points trong `kb/citations/ckd.json`

- **Loại mục (`itemType`):** `citation` | **Định danh (`itemId`):** `kb/citations/ckd.json`
- **Tệp liên quan:** [kb/citations/ckd.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/ckd.json#L655-L664), [`EvidenceQuote.tsx`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/EvidenceQuote.tsx#L56-L57), [`src/kb-types/index.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/kb-types/index.ts#L69-L70)

#### Phân tích & hướng khắc phục
- Trong interface `Citation` (`src/kb-types/index.ts:69-70`), `cor?: string` và `loe?: string` là tùy chọn; khi có mặt, `EvidenceQuote.tsx:56-57` sẽ hiển thị huy hiệu `Class {cor}` và `LOE {loe}`.
- Tuy nhiên trong `kb/citations/ckd.json`:
  1. `kdigo.aki.2012.rec_5_1_1_rrt_emergently` (dòng 655–664) có câu `quote` kết thúc nguyên văn bằng **`"(Not Graded )"`**, nhưng lại gán `"cor": "1", "loe": "A"` → giao diện hiển thị huy hiệu `Class 1 | LOE A` đối chọi trực tiếp với dòng chữ `(Not Graded)` ngay bên dưới!
  2. Các bảng phân loại danh pháp (`kdigo.ckd.2024.table_2_gfr_categories`, `table_3_albuminuria_categories`) và đoạn văn mô tả độc tính NSAID (`nsaid_nephrotoxicity_p132`) bị gán `"cor": "1", "loe": "A"`.
  3. 15 mục **Practice Point** của KDIGO 2024 (`pp_2_2_1`, `pp_2_2_3`, `pp_3_6_1`..`3_6_7`, `pp_3_7_1`..`3_7_2`, `pp_3_8_2`, `pp_3_8_5`, `pp_3_10_1`..`3_10_2`, `pp_3_11_1`) bị gán `"cor": "conditional", "loe": "B"` (`Class conditional | LOE B`), trong khi KDIGO 2024 Methods (tr. S126) định nghĩa rõ *Practice Points* là đồng thuận thực hành **không phân hạng GRADE**.
- **Đề xuất:** Lược bỏ `cor` và `loe` khỏi các mục `Not Graded`, bảng danh pháp và *Practice Points* (chỉ giữ cho các Recommendation thực sự có phân hạng GRADE/ESC/AHA/ADA).

---

### 💡 `[SUGGESTION]` `CKD-R4-R1-09` — Hiển thị đầy đủ đơn vị + tần suất thuốc đang dùng trên `PatientForm.tsx` và bổ sung lựa chọn phối hợp `Statin + Ezetimibe` ở CKD G3a–G5

- **Loại mục (`itemType`):** `ui` | **Định danh (`itemId`):** `src/ui/PatientForm.tsx`
- **Tệp liên quan:** [`PatientForm.tsx`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/PatientForm.tsx#L565), [`rules.outpatient.statin.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.statin.ts#L108-L129)

#### Chi tiết hoàn thiện
1. Tại [`PatientForm.tsx`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/PatientForm.tsx#L565), thẻ thuốc đang dùng hiện chỉ render `💊 {med.name} {med.dose ? `(${med.dose})` : ''}` (ví dụ `💊 Captopril (50)` hoặc `💊 Perindopril (2.5)` mà ẩn mất `mg` và `3 lần/ngày` / `cách ngày`). Nên hiển thị đầy đủ `(${med.dose}${med.unit ? ' ' + med.unit : ''}${med.freq ? ', ' + med.freq : ''})` để bác sĩ kiểm soát trực quan tổng liều ngày.
2. Tại [`rules.outpatient.statin.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/ckd/rules.outpatient.statin.ts#L124-L129), ở nhóm CKD G3a–G5 chưa lọc máu `>= 50` tuổi (`eGFR < 60`), **KDIGO 2024 Recommendation 3.15.1.1 (1A)** khuyến cáo nguyên văn *"treatment with a statin or statin/ezetimibe combination"* (thử nghiệm SHARP & chiến lược hạ LDL-C an toàn của ESC 2026 CVD-CKD Mục 5.3). Nên bổ sung gợi ý *"statin hoặc phối hợp statin + ezetimibe (ví dụ Atorvastatin 20 mg ± Ezetimibe 10 mg)"* trong phần `rationale`.

---

## 5. Tổng kết Điều kiện Đạt Chuẩn Vòng Kế tiếp

Để phân hệ `ckd` đạt **`PASS`** ở vòng nghiệm thu tiếp theo, nhóm phát triển cần xử lý dứt điểm **6 mục chặn (`2 critical` + `4 major`)**:
1. Sửa `parseCurrentDailyDoseMg(med)` nhân đúng hệ số tần suất `med.freq` (`2/3/4 lần/ngày`, `cách ngày`...) và khóa kiểm thử cho toàn bộ phác đồ BID/TID/QID/QOD (`CKD-R4-R1-01`).
2. Chặn phát thuốc hạ kali cấp cứu nặng (Insulin + Salbutamol + SZC 10 g TID) khi `k === undefined` hoặc `k <= 5.0 mmol/L`, đồng thời chỉ định tiêm Calcium Gluconate tĩnh mạch bám sát sự hiện diện biến đổi ECG / `K+ > 7.0 mmol/L` theo UKKA 2022 Guideline 16.2 & BYT 2024 (`CKD-R4-R1-02`).
3. Tách riêng đích huyết áp cho bệnh nhân đang lọc máu chu kỳ (`onDialysis: true`) trước phân nhánh `INTL`/`US`/`VN` để không áp đích `< 120 mmHg` lên bệnh nhân chạy thận nhân tạo (`CKD-R4-R1-03`).
4. Chuẩn hóa liều Lokelma (SZC) ở bệnh nhân chạy thận nhân tạo chu kỳ thành **5 g x 1 lần/ngày chỉ uống vào ngày KHÔNG lọc máu** theo nhãn FDA Lokelma Section 2.2 (`CKD-R4-R1-04`).
5. Tạm hoãn (`DEFER`) khởi trị Finerenone khi nền ACEi đang quá liều thận / đang phải đổi thuốc, và phân tầng theo dõi K+ sớm trong 4 tuần đầu khi `4.8 < K+ <= 5.0 mmol/L` (`CKD-R4-R1-05`).
6. Bổ sung cổng xác nhận chẩn đoán CKD trước khi kê đơn Statin / gắn nhãn CKD cho bệnh nhân có `eGFR >= 60` và `UACR < 3 mg/mmol` (hoặc chưa có UACR) (`CKD-R4-R1-06`).
