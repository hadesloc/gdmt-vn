# BÁO CÁO PHẢN BIỆN AN TOÀN ĐỐI NGHỊCH (ADVERSARIAL REVIEW) – VÒNG 1
## Module: Rung Nhĩ (AF - Atrial Fibrillation) – GDMT-VN

> **Reviewer**: R3 – Phản biện an toàn lâm sàng (Adversarial Safety Reviewer)  
> **Phiên bản engine**: 0.1.0  
> **Ngày thực hiện**: 27/10/2026  
> **Quy chuẩn đánh giá**: Tuân thủ [REVIEW_PROTOCOL.md](../../REVIEW_PROTOCOL.md)  
> **Dữ liệu kiểm thử**: Bộ 66 ca lâm sàng đối nghịch chạy thực thi trên hàm `evaluate()` của engine ([run_r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/af/scratch/run_r3_adversarial.ts))  
> **Bằng chứng thực nghiệm thô**: [adversarial_raw.json](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/af/scratch/adversarial_raw.json)

---

## 1. Tóm Tắt Kết Quả & Kết Luận

| Mức độ nghiêm trọng | Số lượng | Tiêu chí chấp thuận | Trạng thái |
|---|:---:|:---:|:---:|
| **CRITICAL** (Nguy cơ gây hại trực tiếp) | **7** | = 0 | ❌ KHÔNG ĐẠT |
| **MAJOR** (Sai lệch guideline / Thiếu Class I / Thiếu cảnh báo) | **7** | = 0 | ❌ KHÔNG ĐẠT |
| **MINOR** (Lỗi UI / Thông báo sai trường thiếu / Liều không chuẩn) | **2** | - | ⚠️ CẦN SỬA |
| **SUGGESTION** (Khuyến nghị nâng cấp cấu trúc dữ liệu) | **1** | - | 💡 THAM KHẢO |
| **TỔNG CỘNG** | **17** | - | **KẾT LUẬN: FAIL** |

> [!CAUTION]
> **KẾT LUẬN VÒNG 1: FAIL (KHÔNG ĐẠT)**  
> Module Rung nhĩ (`af`) hiện tại có **7 lỗi CRITICAL** và **7 lỗi MAJOR**. Các nguy cơ lâm sàng nghiêm trọng nhất bao gồm:  
> 1. **Khởi trị Diltiazem IV hạ nhịp cấp cứu khi chưa có LVEF** (tự động giả định LVEF bình thường), có thể gây sốc tim và phù phổi cấp tử vong nếu bệnh nhân có suy tim HFrEF tiềm ẩn.  
> 2. **Kê đơn thuốc chống đông độc thai DOAC (Apixaban)** cho phụ nữ mang thai có rung nhĩ do thiếu cổng kiểm soát thai kỳ.  
> 3. **Không phát lệnh ngừng Verapamil** ở bệnh nhân suy tim nặng HFrEF (LVEF 30%) do gán nhầm mã `drugId: 'diltiazem'`.  
> 4. **Tước đoạt chỉ định chống đông Class IIa** ở bệnh nhân có xơ vữa mạch máu do lệch tên trường dữ liệu chuẩn (`ascvd` vs `vascularDisease`).  
> 5. **Kê đơn liều đầy đủ Dabigatran 150 mg x 2 lần/ngày** cho bệnh nhân suy thận CrCl 30–49 mL/min do bỏ quên cờ `isDoseReduced = true`, gây nguy cơ xuất huyết tiêu hóa và xuất huyết não đe dọa tính mạng.  
> 6. **Bỏ sót cấp cứu sốc tụt huyết áp (SBP 75 mmHg)** ở ngoại trú, khuyến cáo "thay đổi lối sống và tái khám sau 3–6 tháng".  
> 7. **Khuyến cáo tiếp tục duy trì Warfarin** ở bệnh nhân mang van cơ học chuẩn bị phẫu thuật lớn có nguy cơ chảy máu cao.  
> 
> Module **bắt buộc phải sửa toàn diện các lỗi Critical và Major** trước khi chuyển sang Vòng 2.

---

## 2. Phương Pháp Kiểm Thử Đối Nghịch (Adversarial Methodology)

Reviewer R3 đã xây dựng một bộ kịch bản tự động hóa gồm **66 bệnh nhân đối nghịch** (`adversarialCases` trong [run_r3_adversarial.ts](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/af/scratch/run_r3_adversarial.ts)), bao phủ 12 trục lâm sàng trọng yếu:

1. **Ranh giới tiêu chí giảm liều DOAC (Tuổi, Cân nặng, Creatinin)**:
   - Tuổi 79 vs 80 tuổi (ranh giới giảm liều Apixaban).
   - Cân nặng 60 kg vs 61 kg (ranh giới giảm liều Apixaban và Edoxaban).
   - Creatinin huyết thanh 132 µmol/L vs 133 µmol/L (1.5 mg/dL).
   - Thử nghiệm các tổ hợp: thỏa 0, 1, 2 và 3 tiêu chí để kiểm tra hiện tượng giảm liều không đúng quy cách (*inappropriate underdosing*).
2. **Ranh giới thanh thải thận Cockcroft-Gault (CrCl)**:
   - Ngưỡng 14 vs 15 mL/min: Chống chỉ định toàn bộ DOAC (< 15) vs liều giảm tối thiểu.
   - Ngưỡng 29 vs 30 mL/min: Chống chỉ định tuyệt đối Dabigatran (< 30) vs liều 110 mg x 2.
   - Ngưỡng 49 vs 50 mL/min: Giảm liều Rivaroxaban (15 mg) vs liều chuẩn (20 mg).
   - Ngưỡng 95 vs 96 mL/min: Cảnh báo hộp đen FDA Hoa Kỳ về giảm hiệu lực của Edoxaban.
   - Bệnh nhân suy thận vừa (CrCl 30–49 mL/min) dùng Dabigatran.
3. **Thang điểm nguy cơ thuyên tắc mạch CHA₂DS₂-VA (0, 1, 2 điểm)**:
   - Điểm 0: Class III (AVOID toàn bộ chống đông và kháng tiểu cầu).
   - Điểm 1: Class IIa (CONSIDER chỉ định DOAC).
   - Điểm ≥ 2: Class I (START DOAC, ưu tiên hơn Warfarin).
   - Tiền sử đột quỵ / TIA (S₂ = 2 điểm).
4. **Giới tính nữ (CHA₂DS₂-VA vs CHA₂DS₂-VASc) & Đổi Profile (INTL vs US)**:
   - Đánh giá phân tầng ESC 2024 (bỏ Sc) so với ACC/AHA 2023 (giữ Sc).
   - Đổi cài đặt `settings.profile = 'US'` để kiểm tra khả năng thích ứng guideline Hoa Kỳ.
5. **Bệnh van tim nguy cơ cao (Valvular AF)**:
   - Mang van tim cơ học (Mechanical prosthetic heart valve) – BẮT BUỘC Warfarin, CẤM DOAC.
   - Hẹp van hai lá từ vừa đến nặng do thấp (INVICTUS trial) – BẮT BUỘC Warfarin.
   - Bệnh nhân mang van cơ học nhưng đang uống nhầm DOAC (yêu cầu chuyển đổi khẩn cấp).
   - Trùng lặp đồng thời Warfarin + DOAC ở bệnh van tim.
6. **Phân suất tống máu thất trái (LVEF 39% vs 40% vs 41%) & Thuốc chống loạn nhịp (AAD)**:
   - LVEF ≤ 40% (HFrEF): CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI Non-DHP CCB (Diltiazem, Verapamil) Class III; AAD an toàn duy nhất là Amiodarone; cấm Flecainide, Propafenone, Dronedarone, Sotalol.
   - LVEF > 40%: Cho phép Non-DHP CCB hoặc Chẹn beta.
   - Bệnh mạch vành (CAD): Cấm Flecainide/Propafenone (CAST trial); ưu tiên Dronedarone/Sotalol.
   - Không bệnh tim cấu trúc: Flecainide/Propafenone hàng đầu.
7. **Tần số tim (HR 109 vs 110 vs 111 bpm & Nhịp tim chậm < 50-55 bpm)**:
   - Kiểm soát tần số lỏng (< 110 bpm lúc nghỉ theo RACE II).
   - Nhịp tim nhanh nội viện (HR ≥ 110 bpm): Kiểm soát cấp bằng thuốc tĩnh mạch.
   - Nhịp tim nhanh nội viện khi khuyết thiếu LVEF.
   - Nhịp tim chậm nặng (HR 42 bpm) khi đang dùng Bisoprolol + Digoxin.
8. **Huyết động không ổn định & Thời điểm khởi phát (< 24h vs 24–48h vs ≥ 48h)**:
   - Sốc điện đồng bộ cấp cứu ngay lập tức khi huyết động không ổn định (tụt HA, choáng tim).
   - Khởi phát < 24 giờ: Đủ điều kiện chuyển nhịp sớm an toàn sau 1 liều chống đông.
   - Khởi phát 24–48 giờ và ≥ 48 giờ / không rõ thời điểm: Bắt buộc TEE loại trừ huyết khối hoặc dùng đủ 3 tuần chống đông trước chuyển nhịp.
   - Ngoại trú có tụt huyết áp sốc tim (SBP 75 mmHg).
9. **Thuốc chồng chéo & Tương tác nguy hiểm**:
   - Warfarin + DOAC (Dual OAC).
   - Amiodarone + Digoxin (tăng gấp đôi nồng độ Digoxin).
   - Aspirin + DOAC ở rung nhĩ mạn tính (tăng xuất huyết không có chỉ định).
   - Dabigatran + Verapamil (tăng nồng độ Dabigatran, bắt buộc giảm liều 110 mg).
   - Phối hợp Chẹn beta + Non-DHP CCB (Bisoprolol + Diltiazem).
10. **Thiếu khuyết dữ liệu lâm sàng (QA-1 Fail-Closed)**:
    - Thiếu từng trường đơn lẻ: Tuổi, Creatinin, Cân nặng, LVEF, Giới tính, và hồ sơ trống.
11. **Đối tượng đặc biệt**:
    - Phụ nữ mang thai (Thai kỳ).
    - Bệnh gan tiến triển (xơ gan Child-Pugh B/C).
    - Tạm ngừng thuốc quanh phẫu thuật (DOAC vs Warfarin).
    - Chuẩn hóa tên trường bệnh xơ vữa mạch máu (`ascvd` vs `vascularDisease`).
12. **Tích hợp đa module bệnh đồng mắc**:
    - Rung nhĩ + Suy tim HFrEF + CKD G3a + Tăng huyết áp.
    - Rung nhĩ + CKD G5 (CrCl 12 mL/min) đang dùng DOAC.

Toàn bộ dữ liệu input, kết quả phái sinh, khuyến cáo và cảnh báo an toàn được lưu trữ tại file: [`docs/reviews/af/scratch/adversarial_raw.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/af/scratch/adversarial_raw.json).

---

## 3. Top 5 Phát Hiện Nguy Hiểm Nhất (Top 5 Critical Findings)

### 🔴 Top 1: Khởi trị Diltiazem IV hạ nhịp cấp cứu khi chưa biết chức năng tim (LVEF khuyết thiếu) ([R3-AF-01](#r3-af-01))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân cấp cứu nội viện có rung nhĩ đáp ứng thất nhanh (HR 135 bpm), chưa có kết quả siêu âm tim đo LVEF (`lvef: undefined`, ca [ADV_AF_41](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/af/scratch/adversarial_raw.json)). Hệ thống tự động kích hoạt luật `af.inpatient.rvr_acute_rate_control` và ra lệnh: `[START] drug=diltiazem: Kiểm soát tần số cấp khi LVEF bảo tồn: Diltiazem IV (hoặc Metoprolol IV) do nhịp tim nhanh (135 bpm)`, liều *cấp cứu TM bolus 0.25 mg/kg qua 5 phút*!
- **Cơ chế**: Tại dòng 793 file `rules.ts`:
  ```ts
  const isHfRef = ef !== undefined && ef <= th('af.rate.lvef_cutoff');
  ```
  Khi `ef === undefined`, `isHfRef` đánh giá là `false`. Luồng thực thi tự động rơi xuống nhánh mặc định `rec_af_acute_rate_preserved` kê đơn Diltiazem IV! Vi phạm nghiêm trọng nguyên tắc fail-closed (QA-1).
- **Nguy cơ lâm sàng**: Diltiazem đường tĩnh mạch có tác dụng ức chế co bóp cơ tim âm tính (inotropic âm tính) rất mạnh. Ở bệnh nhân rung nhĩ vào viện với nhịp nhanh, có tới 30–40% trường hợp có suy tim giảm phân suất tống máu tiềm ẩn (HFrEF) hoặc bệnh cơ tim do nhịp nhanh. Việc tiêm bolus Diltiazem IV khi chưa biết LVEF sẽ dẫn tới tụt huyết áp trụy mạch đột ngột, sốc tim kháng trị, phù phổi cấp và tử vong ngay tại giường cấp cứu.
- **Khắc phục**: Khi `ef === undefined`, tuyệt đối không được tự động giả định LVEF bảo tồn. Bắt buộc ưu tiên Amiodarone IV hoặc Digoxin IV (nhóm thuốc an toàn cho mọi mức LVEF) hoặc phát sinh dòng yêu cầu khẩn cấp đo LVEF bằng siêu âm tim tại giường (POCUS tim) trước khi sử dụng Non-DHP CCB tĩnh mạch.

---

### 🔴 Top 2: Kê đơn thuốc chống đông độc phôi thai (Apixaban) cho phụ nữ mang thai ([R3-AF-02](#r3-af-02))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân nữ 28 tuổi đang mang thai (`pregnant: true`, ca [ADV_AF_60](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/af/scratch/adversarial_raw.json)) mắc rung nhĩ và có tiền sử thiếu máu não cục bộ thoáng qua TIA (CHA₂DS₂-VA = 2). Hệ thống kê đơn: `[START] drug=apixaban: Khởi trị thuốc chống đông đường uống DOAC (CHA₂DS₂-VA = 2 ≥ 2: Nguy cơ cao), liều 5 mg uống 2 lần/ngày`. Cả 2 cổng an toàn đều passed, không hề có cổng thai kỳ, alerts = 0!
- **Cơ chế**: Luật `af.oac.risk_stratification` hoàn toàn không kiểm tra cờ thai kỳ (`ctx.patient.conditions?.pregnant`). Trong `src/engine/safety/gates.ts` (dòng 218–222), mảng `isContraInPregnancy` chỉ liệt kê RASi, ARNI, MRA, Statin; hoàn toàn **bỏ quên** nhóm DOAC (`apixaban`, `rivaroxaban`, `dabigatran`, `edoxaban`) và `warfarin`!
- **Nguy cơ lâm sàng**: Các thuốc DOAC qua được hàng rào nhau thai, gây độc phôi thai, dị tật bẩm sinh và xuất huyết tử cung đe dọa sảy thai hoặc tử vong mẹ và thai nhi (Chống chỉ định tuyệt đối theo FDA và ESC 2024). Trong thai kỳ, thuốc chống đông duy nhất được khuyến cáo an toàn là Heparin trọng lượng phân tử thấp (LMWH).
- **Khắc phục**: Thêm điều kiện `if (ctx.patient.conditions?.pregnant) return false;` vào các luật chỉ định chống đông đường uống của AF; bổ sung ngay DOAC và Warfarin vào mảng `isContraInPregnancy` của `gates.ts`; đồng thời phát sinh khuyến cáo dùng LMWH (Enoxaparin) cho phụ nữ có thai cần chống đông.

---

### 🔴 Top 3: Không dừng được thuốc Verapamil ở bệnh nhân suy tim HFrEF (LVEF 30%) do gán nhầm mã `drugId: 'diltiazem'` ([R3-AF-03](#r3-af-03))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân suy tim nặng có LVEF = 30% đang sử dụng Verapamil 120 mg (ca [ADV_AF_32](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/af/scratch/adversarial_raw.json)). Hệ thống nhận diện chống chỉ định Non-DHP CCB nhưng lại sinh khuyến cáo: `[STOP] drugId=diltiazem: DỪNG NGAY Diltiazem / Verapamil: Chống chỉ định tuyệt đối khi LVEF từ 40% trở xuống`!
- **Cơ chế**: Tại dòng 543 file `rules.ts`:
  ```ts
  return {
    id: 'rec_af_contra_non_dhp_hfref',
    action: 'STOP',
    drugId: 'diltiazem', // GÁN CỨNG DILTIAZEM!
    ...
  }
  ```
  Dù bệnh nhân đang dùng `verapamil`, mã thuốc của khuyến cáo dừng lại bị gán cứng là `diltiazem`.
- **Nguy cơ lâm sàng**: Trên hệ thống HIS/EMR hoặc đơn thuốc tích hợp, lệnh hủy thuốc mang mã `diltiazem` (thuốc bệnh nhân không uống), trong khi đơn thuốc `verapamil` vẫn tiếp tục có hiệu lực! Bệnh nhân tiếp tục uống Verapamil trong tình trạng suy tim nặng LVEF 30%, dẫn tới ức chế co bóp cơ tim cấp tính, suy tim mất bù tiến triển và tử vong.
- **Khắc phục**: Sửa dòng 543 file `rules.ts`: Kiểm tra thuốc thực tế đang dùng (`hasCurrentMed(ctx, ['verapamil']) ? 'verapamil' : 'diltiazem'`) để gán chính xác `drugId`, hoặc phát sinh cả 2 lệnh STOP nếu bệnh nhân dùng cả hai.

---

### 🔴 Top 4: Tước đoạt chỉ định chống đông Class IIa do lệch tên trường dữ liệu xơ vữa mạch máu (`ascvd` vs `vascularDisease`) ([R3-AF-04](#r3-af-04))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân nam 60 tuổi mắc rung nhĩ và có bệnh động mạch vành xơ vữa nhập theo chuẩn dữ liệu hệ thống `conditions: { af: true, ascvd: true }` (ca [ADV_AF_64](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/af/scratch/adversarial_raw.json)). Hàm tính toán `derivePatientData` tính đúng `CHA₂DS₂-VA = 1`, nhưng module `af` lại hiển thị: `[AVOID] Không chỉ định thuốc chống đông hoặc kháng tiểu cầu (CHA₂DS₂-VA = 0: Nguy cơ thấp)` (Class III)!
- **Cơ chế**: Tại dòng 209 file `rules.ts`:
  ```ts
  vascularDisease: Boolean(ctx.patient.conditions?.vascularDisease),
  ```
  Trường chuẩn trong định nghĩa `PatientConditions` (`types.ts`) là `ascvd`. Do `rules.ts` tự tính lại điểm và chỉ đọc trường `vascularDisease`, giá trị trở thành `undefined` -> `false` -> Điểm V bị gán bằng 0!
- **Nguy cơ lâm sàng**: Bệnh nhân có bệnh mạch máu xơ vữa đáng lẽ thuộc nhóm nguy cơ trung bình (CHA₂DS₂-VA = 1, Class IIa cân nhắc DOAC) bị phân loại sai thành nguy cơ thấp (điểm 0, Class III cấm dùng chống đông), bị bác sĩ tước đoạt cơ hội điều trị dự phòng đột quỵ và đối mặt với nguy cơ thuyên tắc mạch não tàn phế.
- **Khắc phục**: Sửa dòng 209 file `rules.ts` thành: `vascularDisease: Boolean(ctx.patient.conditions?.vascularDisease || ctx.patient.conditions?.ascvd)`, hoặc tốt nhất tái sử dụng trực tiếp `ctx.derived.cha2ds2va` đã được chuẩn hóa thống nhất thay vì tính lại thủ công.

---

### 🔴 Top 5: Kê đơn liều đầy đủ Dabigatran 150 mg x 2 lần/ngày cho bệnh nhân suy thận CrCl 30–49 mL/min ([R3-AF-05](#r3-af-05))
- **Mức độ**: `CRITICAL`
- **Mô tả**: Bệnh nhân 65 tuổi có CrCl = 39.4 mL/min (suy thận vừa) đang dùng Dabigatran (ca [ADV_AF_17](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/af/scratch/adversarial_raw.json)). Rationale ghi rõ: `Tiêu chuẩn giảm liều: CrCl 30 - 49 mL/min (39.4 mL/min)`. Tuy nhiên, tiêu đề và liều khuyến cáo lại là: `[CONTINUE] drug=dabigatran: Chỉ định liều chuẩn Dabigatran etexilate: 150 mg x 2 lần/ngày`!
- **Cơ chế**: Trong máy tính liều `src/engine/calculators/doacDose.ts`, tại dòng 162–164:
  ```ts
  if (input.crcl >= cfg.renalReductionCrclMin && input.crcl <= cfg.renalReductionCrclMax) {
    reductionCriteriaMet.push(`CrCl 30 - 49 mL/min (${input.crcl.toFixed(1)} mL/min)`);
    // QUÊN DÒNG: isDoseReduced = true; !!
  }
  ```
  Hàm đã ghi chuỗi tiêu chuẩn vào mảng `reductionCriteriaMet`, NHƯNG HOÀN TOÀN BỎ QUÊN gán cờ `isDoseReduced = true`! Đến dòng 169, điều kiện giảm liều bị đánh giá sai thành `false`.
- **Nguy cơ lâm sàng**: Dabigatran thải trừ tới 80% qua thận. Ở bệnh nhân suy thận CrCl 30–49 mL/min, việc duy trì liều đầy đủ 150 mg x 2 lần/ngày làm tăng nồng độ thuốc trong huyết tương gấp 2.5–3 lần, dẫn tới nguy cơ xuất huyết tiêu hóa ồ ạt hoặc xuất huyết nội sọ đe dọa tính mạng (EMA, Dược thư Quốc gia Việt Nam và ESC 2024 Table 11 khuyến cáo giảm liều xuống 110 mg x 2 lần/ngày).
- **Khắc phục**: Thêm ngay `isDoseReduced = true;` vào khối `if (input.crcl >= cfg.renalReductionCrclMin && input.crcl <= cfg.renalReductionCrclMax)` trong file `doacDose.ts`.

---

## 4. Bảng Chi Tiết Toàn Bộ 17 Findings

| ID | Mức độ | Phân loại | Vị trí (Item ID) | Tóm tắt phát hiện | Hành động khắc phục |
|---|:---:|:---:|---|---|---|
| **R3-AF-01** | `CRITICAL` | `rule` | `af.inpatient.rvr_acute_rate_control` | Kê đơn Diltiazem IV hạ nhịp cấp cứu khi chưa biết LVEF (lvef khuyết thiếu), nguy cơ trụy mạch sốc tim ở HFrEF | Cấm mặc định LVEF bảo tồn khi ef undefined; bắt buộc dùng Amiodarone/Digoxin IV hoặc yêu cầu POCUS tim khẩn cấp |
| **R3-AF-02** | `CRITICAL` | `rule` | `af.oac.risk_stratification` | Kê đơn DOAC (Apixaban 5 mg x 2) cho phụ nữ mang thai có rung nhĩ do thiếu kiểm tra thai kỳ và thiếu DOAC trong cổng an toàn thai kỳ | Thêm cờ chặn thai kỳ trong luật AF; bổ sung DOAC/Warfarin vào `isContraInPregnancy` trong `gates.ts`; hướng dẫn dùng LMWH |
| **R3-AF-03** | `CRITICAL` | `rule` | `af.rate.reduced_lvef` | Không ngừng được Verapamil ở bệnh nhân suy tim nặng LVEF 30% do gán cứng nhầm `drugId: 'diltiazem'` trong khuyến cáo lệnh STOP | Sửa `drugId` động theo thuốc thực tế bệnh nhân đang dùng (`verapamil` vs `diltiazem`) |
| **R3-AF-04** | `CRITICAL` | `rule` | `af.oac.risk_stratification` | Lệch tên trường xơ vữa mạch máu (`ascvd` vs `vascularDisease`) làm bệnh nhân có CAD/PAD bị tính mất 1 điểm CHA₂DS₂-VA, bị tước đoạt chỉ định chống đông | Đọc cả `conditions.ascvd` hoặc tái sử dụng trực tiếp `ctx.derived.cha2ds2va` đã được chuẩn hóa |
| **R3-AF-05** | `CRITICAL` | `drug` | `src/engine/calculators/doacDose.ts` | Kê đơn liều đầy đủ Dabigatran 150 mg x 2 cho bệnh nhân suy thận CrCl 30–49 mL/min do bỏ quên cờ `isDoseReduced = true` | Thêm `isDoseReduced = true;` vào khối kiểm tra CrCl 30–49 mL/min của Dabigatran trong `doacDose.ts` |
| **R3-AF-06** | `CRITICAL` | `rule` | `af.inpatient.unstable_cardioversion` | Bỏ sót cấp cứu chuyển viện, khuyến cáo "thay đổi lối sống và tái khám sau 3–6 tháng" cho bệnh nhân rung nhĩ bị tụt huyết áp sốc tim (SBP 75 mmHg) ở ngoại trú | Thêm quy tắc cấp cứu ngoại trú: SBP < 90 hoặc unstable phải phát lệnh `REFER` cấp cứu khẩn cấp 115 và dừng thuốc hạ áp/hạ nhịp |
| **R3-AF-07** | `CRITICAL` | `rule` | `af.inpatient.periprocedural_doac_hold` | Khuyến cáo tiếp tục duy trì Warfarin ở bệnh nhân mang van cơ học chuẩn bị phẫu thuật lớn có nguy cơ chảy máu cao do luật chỉ xử lý DOAC | Bổ sung quy tắc perioperative cho Warfarin: ngừng 5 ngày trước mổ, theo dõi INR < 1.5, và bắc cầu LMWH liều điều trị |
| **R3-AF-08** | `MAJOR` | `rule` | `af.oac.risk_stratification` | Mâu thuẫn trực tiếp giữa 2 khuyến cáo `[AVOID]` và `[START]` thuốc chống đông trên cùng một bệnh nhân rung nhĩ khởi phát < 24 giờ chuyển nhịp sớm | Ẩn lệnh AVOID dài hạn khi bệnh nhân đang chuyển nhịp cấp tính; sau chuyển nhịp bắt buộc dùng OAC đủ 4 tuần trước khi ngưng |
| **R3-AF-09** | `MAJOR` | `rule` | `af.oac.doac_dose_adjustment` | Không phát sinh hành động DỪNG (STOP) cụ thể cho thuốc DOAC (Apixaban, Rivaroxaban, Edoxaban) khi CrCl < 15 mL/min ở bệnh nhân đang dùng thuốc | Trong `doac_dose_adjustment`, khi CrCl < 15, quét `currentMeds` và phát sinh lệnh `STOP` đích danh cho từng thuốc DOAC |
| **R3-AF-10** | `MAJOR` | `rule` | `af.oac.doac_dose_adjustment` | Bỏ sót hiển thị Cảnh báo Hộp Đen (Black Box Warning) của FDA Hoa Kỳ khi chỉ định Edoxaban ở bệnh nhân có CrCl > 95 mL/min | Gán chuỗi cảnh báo từ `doacResult.warning` vào trường `warnings` của Recommendation để hiển thị trên UI |
| **R3-AF-11** | `MAJOR` | `rule` | `af.oac.antiplatelet_contra` | Không cảnh báo và không có khuyến cáo ngừng Aspirin khi bệnh nhân rung nhĩ mạn tính đang dùng đồng thời Aspirin + DOAC | Mở rộng luật hoặc thêm tương tác an toàn: Rung nhĩ dùng OAC + Kháng tiểu cầu không có chỉ định mạch vành cấp/PCI gần đây phải ngừng Aspirin |
| **R3-AF-12** | `MAJOR` | `rule` | `af.oac.risk_stratification` | Cài đặt Profile 'US' (ACC/AHA 2023) không kích hoạt thang điểm chuẩn CHA₂DS₂-VASc mà vẫn hiển thị và phân tầng theo CHA₂DS₂-VA Châu Âu | Khi `profile === 'US'`, sử dụng `scoreVasc`, hiển thị tên thang điểm 'CHA₂DS₂-VASc' và áp dụng ngưỡng phân tầng ACC/AHA 2023 |
| **R3-AF-13** | `MAJOR` | `rule` | `af.oac.risk_stratification` | Thiếu cảnh báo và kiểm tra chống chỉ định thuốc DOAC ở bệnh nhân có bệnh gan tiến triển / rối loạn đông máu (`conditions.liverDisease`) | Thêm kiểm tra bệnh gan: Rivaroxaban chống chỉ định ở Child-Pugh B/C; Apixaban/Dabigatran/Edoxaban chống chỉ định ở suy gan nặng |
| **R3-AF-14** | `MAJOR` | `matrix` | `src/engine/safety/interactions.ts` | Thiếu quy tắc kiểm tra tương tác thuốc nguy cơ chậm nhịp tim kịch phát và bloc nhĩ thất khi phối hợp Chẹn beta + Non-DHP CCB | Bổ sung quy tắc tương tác mức 'warning'/'critical' trong `INTERACTION_RULES` cho cặp Beta-blocker + Diltiazem/Verapamil |
| **R3-AF-15** | `MINOR` | `ui` | `af.oac.risk_stratification` | Thông báo sai trường dữ liệu thiếu: Thiếu Cân nặng hoặc Giới tính nhưng lại thông báo "Cần nhập Creatinin huyết thanh" | Tách riêng các điều kiện kiểm tra dữ liệu thiếu cho từng trường (`scr`, `weight`, `sex`, `age`) |
| **R3-AF-16** | `MINOR` | `ui` | `af.rate.preserved_lvef` | Chuỗi liều (`dose`) và tên thuốc (`drugNameVi`) mơ hồ, gộp chung nhiều nhóm thuốc trong cùng một dòng khuyến cáo | Chuẩn hóa mỗi Recommendation gắn một thuốc cụ thể có liều định lượng rõ ràng; các thuốc thay thế đưa vào Rationale |
| **R3-AF-17** | `SUGGESTION` | `matrix` | `src/modules/af/matrices.ts` | Ma trận `afMatrixDoacCrCl` liên kết dải thận bằng trường `eGFRFrom`/`eGFRTo` trong DrugEntry thay vì `crclFrom`/`crclTo` | Cập nhật file JSON trong `kb/drugs/` cho 4 DOAC: bổ sung các trường `crclFrom` và `crclTo` theo chuẩn Cockcroft-Gault |

---

## 5. Danh Mục Bằng Chứng Thực Nghiệm Chi Tiết (Chiết Xuất Từ 66 Ca Đối Nghịch)

Dưới đây là trích đoạn bằng chứng đối chiếu chi tiết từ các ca lâm sàng đối nghịch đặc thù:

### 1. Ca ADV_AF_41: Khởi trị Diltiazem IV khi LVEF khuyết thiếu
```json
// Input bệnh nhân
{
  "id": "pt_adv_41",
  "age": 68,
  "sex": "male",
  "weight": 68,
  "sbp": 125,
  "hr": 135,
  "lvef": undefined, // KHÔNG CÓ THÔNG TIN LVEF
  "selectedModules": ["af"],
  "conditions": { "af": true }
}
// Output thực tế của Engine
{
  "action": "START",
  "drugId": "diltiazem",
  "title": "Kiểm soát tần số cấp khi LVEF bảo tồn: Diltiazem IV (hoặc Metoprolol IV) do nhịp tim nhanh (135 bpm)",
  "dose": "cấp cứu TM bolus 0.25 mg/kg qua 5 phút",
  "rationale": "Khuyến cáo Class I, Mức B (ESC 2024 tr. 40): Diltiazem tĩnh mạch giúp hạ nhịp nhanh chóng và an toàn khi chức năng co bóp thất trái còn bảo tồn."
}
```
*Nhận xét an toàn*: Hệ thống tự kết luận "khi chức năng co bóp thất trái còn bảo tồn" dù chưa hề có thông tin LVEF!

---

### 2. Ca ADV_AF_60: Phụ nữ mang thai mắc Rung nhĩ
```json
// Input bệnh nhân
{
  "id": "pt_adv_60",
  "age": 28,
  "sex": "female",
  "conditions": {
    "af": true,
    "pregnant": true, // ĐANG MANG THAI
    "strokeOrTia": true
  }
}
// Output thực tế của Engine
{
  "action": "START",
  "drugId": "apixaban",
  "title": "Khởi trị thuốc chống đông đường uống DOAC (CHA₂DS₂-VA = 2 ≥ 2: Nguy cơ cao)",
  "dose": "5 mg uống 2 lần/ngày (giảm xuống 2.5 mg x 2 lần/ngày nếu có ít nhất 2 trong 3 tiêu chí...)",
  "gates": [
    { "parameter": "CHA₂DS₂-VA", "passed": true },
    { "parameter": "CrCl", "passed": true }
  ],
  "alerts": [] // HOÀN TOÀN KHÔNG CÓ CẢNH BÁO THAI KỲ!
}
```
*Nhận xét an toàn*: Cực kỳ nguy hiểm. Thuốc gây độc phôi thai và xuất huyết chu sinh được kê đơn mà không bị bất kỳ cổng an toàn nào ngăn chặn.

---

### 3. Ca ADV_AF_32: Bệnh nhân suy tim nặng HFrEF LVEF 30% đang dùng Verapamil
```json
// Input bệnh nhân
{
  "id": "pt_adv_32",
  "lvef": 30, // HFrEF NẶNG
  "currentMeds": [
    { "drugId": "verapamil", "name": "Isoptin", "dose": 120, "unit": "mg" }
  ]
}
// Output thực tế của Engine
{
  "action": "STOP",
  "drugId": "diltiazem", // LỆCH THUỐC! BỆNH NHÂN UỐNG VERAPAMIL!
  "title": "DỪNG NGAY Diltiazem / Verapamil: Chống chỉ định tuyệt đối khi LVEF từ 40% trở xuống"
}
```
*Nhận xét an toàn*: Lệnh STOP gán sai thuốc khiến Verapamil không bị hủy trên đơn thuốc bệnh viện.

---

### 4. Ca ADV_AF_64: Lệch tên trường xơ vữa mạch máu
```json
// Input bệnh nhân
{
  "id": "pt_adv_64",
  "age": 60,
  "sex": "male",
  "conditions": {
    "af": true,
    "ascvd": true // Chuẩn dữ liệu hệ thống
  }
}
// Output thực tế của Engine
{
  "derivedOutputs": {
    "cha2ds2va": 1 // derive.ts tính đúng 1 điểm (Vascular disease)
  },
  "recommendations": [
    {
      "action": "AVOID",
      "title": "Không chỉ định thuốc chống đông hoặc kháng tiểu cầu (CHA₂DS₂-VA = 0: Nguy cơ thấp)",
      "gates": [
        { "parameter": "CHA₂DS₂-VA", "passed": true, "value": 0 } // rules.ts tính ra 0 điểm!
      ]
    }
  ]
}
```
*Nhận xét an toàn*: Mâu thuẫn nội tại giữa giá trị phái sinh của engine và giá trị tự tính trong rule dẫn tới hủy bỏ chỉ định bảo vệ đột quỵ của người bệnh.

---

### 5. Ca ADV_AF_17: Dabigatran ở bệnh nhân suy thận CrCl 39.4 mL/min
```json
// Input bệnh nhân
{
  "id": "pt_adv_17",
  "age": 65,
  "crcl": 39.4,
  "currentMeds": [
    { "drugId": "dabigatran", "name": "Pradaxa", "dose": 150, "unit": "mg" }
  ]
}
// Output thực tế của Engine
{
  "action": "CONTINUE",
  "drugId": "dabigatran",
  "dose": "150 mg x 2 lần/ngày", // VẪN CHO LIỀU ĐẦY ĐỦ 150 MG!
  "rationale": "Khuyến cáo ESC 2024 (Table 11) & Nhãn FDA: Tiêu chuẩn giảm liều: CrCl 30 - 49 mL/min (39.4 mL/min). Tuyệt đối tránh giảm liều không đúng tiêu chuẩn..."
}
```
*Nhận xét an toàn*: Rationale nêu rõ thỏa tiêu chuẩn giảm liều nhưng liều kê đơn vẫn giữ nguyên 150 mg x 2 lần/ngày do lỗi thiếu gán cờ boolean trong code.

---

## 6. Khuyến Nghị Dành Cho Module Owner & Kế Hoạch Vòng 2

1. **Sửa đổi khẩn cấp 7 lỗi Critical**:
   - Thêm kiểm tra `ef !== undefined` trong `af.inpatient.rvr_acute_rate_control`.
   - Bổ sung kiểm tra thai kỳ và cập nhật `isContraInPregnancy` trong `gates.ts` bao gồm DOAC và Warfarin.
   - Sửa `drugId` động cho Verapamil trong `af.rate.reduced_lvef`.
   - Đọc đồng thời `ctx.patient.conditions?.ascvd` khi tính điểm CHA₂DS₂-VA.
   - Thêm `isDoseReduced = true;` cho Dabigatran khi CrCl 30–49 mL/min trong `doacDose.ts`.
   - Bổ sung quy tắc cấp cứu ngoại trú khi SBP < 90 hoặc unstable.
   - Bổ sung quy tắc tạm ngừng Warfarin và bắc cầu LMWH quanh phẫu thuật lớn.
2. **Khắc phục 7 lỗi Major**:
   - Hòa giải xung đột giữa chuyển nhịp cấp và chống đông dài hạn.
   - Phát lệnh STOP cụ thể cho DOAC khi CrCl < 15 mL/min.
   - Hiển thị Black Box Warning của Edoxaban khi CrCl > 95 mL/min.
   - Cảnh báo ngừng Aspirin khi phối hợp thừa với DOAC.
   - Hỗ trợ đầy đủ Profile 'US' (thang CHA₂DS₂-VASc).
   - Kiểm tra chống chỉ định suy gan tiến triển.
   - Bổ sung kiểm tra tương tác Chẹn beta + Non-DHP CCB trong `interactions.ts`.
3. **Tiêu chuẩn vượt qua Vòng 2**: Toàn bộ 66 ca đối nghịch phải được tái kiểm thử đạt 0 vi phạm an toàn, không còn mâu thuẫn chỉ định và đạt tiêu chuẩn **0 Critical, 0 Major**.
