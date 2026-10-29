# BÁO CÁO PHẢN HỒI & KHẮC PHỤC THẨM ĐỊNH Y KHOA ĐỘC LẬP VÒNG 3 – PHÂN HỆ COPD (`copd`)

- **Phân hệ**: Bệnh phổi tắc nghẽn mạn tính (`src/modules/copd/**`, `kb/citations/copd.json`, `kb/thresholds/copd.json`, nhóm dược thư COPD `kb/drugs/*.json`)
- **Đơn vị thực hiện**: Agent L4 – Chuyên gia Hô hấp COPD & Kỹ sư Hệ thống
- **Tài liệu tham chiếu gốc**:
  1. **GOLD 2026 Report** (*Global Strategy for Prevention, Diagnosis and Management of COPD – 2026 Report*)
  2. **Bộ Y tế Việt Nam – Quyết định 2131/QĐ-BYT ngày 14/07/2026** (*Hướng dẫn chẩn đoán và điều trị Bệnh phổi tắc nghẽn mạn tính*)
  3. **GINA 2026 Strategy** (đối chiếu chồng lấp Hen – COPD / ACO, lạm dụng SABA, thai kỳ)
  4. **ESC Heart Failure Guidelines & FDA Prescribing Information** (Coreg/Carvedilol, Daliresp/Roflumilast, Trelegy Ellipta, Breztri Aerosphere, Anoro Ellipta, Advair Diskus, Spiriva HandiHaler/Respimat, Zithromax, Theophylline)

---

## 1. Tổng quan Điều hành (Executive Summary)

Toàn bộ **45 phát hiện thẩm định độc lập Vòng 3** từ 3 hội đồng phản biện (`round3_R1.json`: 18 mục, `round3_R2.json`: 10 mục, `round3_R3.json`: 17 mục) đã được rà soát, đối chiếu y văn nguyên bản và khắc phục triệt để:

1. **An toàn Tim mạch – Hô hấp liên phân hệ (`['copd', 'hf']`)**: Khi bệnh nhân COPD không kèm hen có chỉ định tim mạch bắt buộc của thuốc chẹn beta (suy tim HFrEF `LVEF ≤ 40%`, bệnh mạch vành/sau nhồi máu cơ tim, kiểm soát tần số thất rung nhĩ) đang dùng chẹn beta không chọn lọc (`carvedilol`, `propranolol`, `nadolol`...), hệ thống không bao giờ cắt bỏ đơn độc làm mất trụ cột giảm tử vong của suy tim mà phát cặp chuyển đổi trực tiếp sang thuốc chẹn beta-1 chọn lọc cao trên tim (`SWITCH bisoprolol`, `switchFrom: 'carvedilol'`) kèm cảnh báo không ngừng đột ngột theo nhãn FDA Coreg §5.1 và GOLD 2026 tr. 127.
2. **Điều phối cấp cứu nội viện đa bệnh lý (`['copd', 'asthma']`) & Corticoid toàn thân**: Bổ sung bộ nhận diện trạng thái cấp cứu Hen nội viện `getAsthmaInpatientAcuteState(ctx)` và nhận diện đầy đủ `methylprednisolone` / `prednisolone` / `hydrocortisone` / `dexamethasone` trong `currentMeds`, thống nhất 1 y lệnh Corticosteroid toàn thân duy nhất (không sinh cảnh báo giả `dup.systemic_steroid`), cập nhật liều khí dung giờ đầu theo GOLD 2026 PDF p. 114 (và đồng bộ mỗi 20 phút khi đồng mắc cơn hen cấp nặng), đồng thời hòa giải đích bão hòa oxy `SpO₂ 88–92%` ưu tiên phòng toan hô hấp tăng CO₂.
3. **Chống chỉ định & Thận trọng Kháng Cholinergic (LAMA/SAMA)**: Tách bạch chống chỉ định thực sự (`narrowAngleGlaucoma` chưa kiểm soát / `urinaryRetention` cấp) với thận trọng thường gặp (`controlledBphOrTreatedGlaucoma` – vẫn duy trì được bình hít qua ống ngậm miệng kèm cảnh báo tránh xịt vào mắt); bổ sung `formatCopdBudesonideFormoterolDose()` kê liều duy trì cố định chuẩn COPD (`160/4.5 mcg x 2 nhát x 2 lần/ngày` theo BYT QĐ 2131/2026 Phụ lục 1) thay vì lấy nhầm liều cắt cơn AIR của Hen; chặn phối hợp thường quy SAMA (`ipratropium`) trên nền LAMA duy trì; và bỏ gợi ý Ipratropium khí dung qua mặt nạ khi có glôcôm góc đóng.
4. **Bảo vệ toàn diện Dị ứng nặng đạm sữa bò (`severeMilkProteinAllergy`) & Lực hít yếu (`weakInspiratoryFlow`)**: Bổ sung bí danh `fluticasone_umeclidinium_vilanterol` vào `INHALER_PROFILES` & `DPI_INHALER_IDS`; bổ sung `severe_milk_protein_allergy` vào dược thư `fluticasone_vilanterol.json` & `fluticasone_salmeterol.json`; xử lý nhóm thuốc đa dạng bào chế (`DUAL_FORM_LACTOSE_INHALER_IDS`: Spiriva Respimat vs HandiHaler DPI, Symbicort Rapihaler pMDI vs Turbuhaler DPI, Seretide Evohaler pMDI vs Accuhaler DPI); mở khóa chuyển đổi sang pMDI/SMI ngay cả ở nội trú khi có dị ứng đạm sữa bò và phát lệnh `STOP` khẩn DPI chứa lactose ngay cả khi chưa có hô hấp ký.
5. **Khép kín mạch Duy trì Thuốc nền (`CONTINUE`) & Leo thang/Hạ bậc chuẩn GOLD 2026 / BYT 2131/2026**: Bổ sung đầy đủ quy tắc `CONTINUE` cho `lama_mono`, `laba_mono`, `laba_lama`, `ics_laba` ổn định, cả 2 thành phần của phác đồ bộ ba mở (`ICS+LABA` + `LAMA`), thuốc giãn phế quản dài hạn nền trong đợt cấp nội viện (`copd.inpatient.continue_maintenance_labd`), cũng như `azithromycin`, `dupilumab`, `mepolizumab` tái khám; bảo vệ không cắt ICS ở bệnh nhân `ICS+LABA` còn khó thở có `BCAT ≥ 300 /µL` (nâng lên Triple); mở rộng rút ICS sai chỉ định ban đầu cho cả Triple (`BCAT < 100 /µL`, không hen, 0 đợt cấp); và chuẩn hóa chỉ đề xuất 1 thuốc sinh học tối ưu nhất theo kiểu hình (không xếp chồng kép `Dupilumab` + `Mepolizumab`).
6. **Cấp cứu Hô hấp Ngoại trú / ICU / Kháng sinh Anthonisen / NIV 3 tiêu chuẩn**: Bổ sung hàng rào đỏ `copd.outpatient.acute_respiratory_failure_refer` chuyển Cấp cứu ngay khi bệnh nhân ngoại trú có suy hô hấp cấp/toan CO₂ mất bù/rối loạn ý thức/thở nhanh nguy kịch (đồng thời khóa LTOT/Home NIV/tiêm chủng sai thời điểm); sửa `copd.inpatient.icu_transfer` bắt nhạy ngay `respiratoryArrest` và `alteredMentalStatus`; sửa kháng sinh đợt cấp đòi hỏi nghiêm ngặt `≥ 2` triệu chứng chính Anthonisen có đờm mủ hoặc cần thở máy; mở rộng NIV theo đủ 3 tiêu chuẩn BYT QĐ 2131/2026 Mục 3.4.5a; kiểm soát an toàn `theophylline` & thuốc an thần/opioid (`diazepam`, `morphine`...); chuẩn hóa `Child-Pugh A` (cảnh báo tăng AUC 51%), cho con bú (`breastfeeding`) và lọc máu (`onDialysis`).
7. **Tái cấu trúc Mô-đun hóa `< 20 KB` tuyệt đối**: Tách toàn bộ `src/modules/copd/` thành **35 tệp `.ts` chuyên biệt**, dung lượng tệp lớn nhất chỉ **17.835 bytes** (`< 20.480 bytes`), **0 tệp vượt trần 20 KB**.

---

## 2. Kiến trúc Mô-đun hóa `< 20 KB` (`src/modules/copd/*.ts`)

Tất cả **35 tệp `.ts`** trong `src/modules/copd/` đều tuân thủ nghiêm ngặt giới hạn `< 20.480 bytes`:

| STT | Tệp mã nguồn (`src/modules/copd/`) | Dung lượng (Bytes) | Trạng thái (`< 20.480 B`) |
|---:|---|---:|:---:|
| 1 | `helpers.aco.ts` | 11.934 B | Đạt |
| 2 | `helpers.clinical.ts` | 15.172 B | Đạt |
| 3 | `helpers.constants.ts` | 12.585 B | Đạt |
| 4 | `helpers.inhalers.ts` | 9.030 B | Đạt |
| 5 | `helpers.inhalers_plan.ts` | 11.611 B | Đạt |
| 6 | `helpers.oral_safety.ts` | 6.426 B | Đạt |
| 7 | `helpers.ts` | 220 B | Đạt |
| 8 | `index.ts` | 673 B | Đạt |
| 9 | `inputs.ts` | 17.345 B | Đạt |
| 10 | `matrices.devices.ts` | 10.222 B | Đạt |
| 11 | `matrices.therapy.ts` | 12.951 B | Đạt |
| 12 | `matrices.ts` | 112 B | Đạt |
| 13 | `pathways.ts` | 3.525 B | Đạt |
| 14 | `presets.ts` | 5.200 B | Đạt |
| 15 | `rules.diagnosis.ts` | 11.894 B | Đạt |
| 16 | `rules.escalation.biologics.ts` | 10.117 B | Đạt |
| 17 | `rules.escalation.oral.ts` | 17.337 B | Đạt |
| 18 | `rules.escalation.ts` | 382 B | Đạt |
| 19 | `rules.followup.aco.ts` | 8.857 B | Đạt |
| 20 | `rules.followup.continue.ts` | 10.091 B | Đạt |
| 21 | `rules.followup.stepup_bronch.ts` | 11.934 B | Đạt |
| 22 | `rules.followup.stepup_ics.ts` | 13.627 B | Đạt |
| 23 | `rules.followup.ts` | 509 B | Đạt |
| 24 | `rules.initial.ts` | 15.764 B | Đạt |
| 25 | `rules.inpatient.bronch_o2.ts` | 13.748 B | Đạt |
| 26 | `rules.inpatient.meds.ts` | 16.561 B | Đạt |
| 27 | `rules.inpatient.ts` | 520 B | Đạt |
| 28 | `rules.inpatient.vent_icu.ts` | 15.969 B | Đạt |
| 29 | `rules.inpatient.vte_discharge.ts` | 9.749 B | Đạt |
| 30 | `rules.nonpharm.ts` | 16.281 B | Đạt |
| 31 | `rules.safety.inhalers_device.ts` | 11.487 B | Đạt |
| 32 | `rules.safety.inhalers_stop.ts` | 11.843 B | Đạt |
| 33 | `rules.safety.systemic.ts` | 17.835 B | Đạt |
| 34 | `rules.safety.ts` | 412 B | Đạt |
| 35 | `rules.ts` | 595 B | Đạt |

---

## 3. Giải trình Chi tiết Từng Phát hiện – Hội đồng R1 (`COPD-R3-R1-01` .. `COPD-R3-R1-18`)

### `COPD-R3-R1-01` (Critical) – Chuyển đổi an toàn Carvedilol sang chẹn beta-1 chọn lọc ở bệnh nhân HFrEF + COPD
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung hàm `hasCompellingBbIndication(ctx)` (`helpers.clinical.ts`) nhận diện suy tim (`hf`, `selectedModules.includes('hf')`, `lvef <= 40%`), bệnh mạch vành (`ascvd`, `cad`, `mi`) và rung nhĩ/cuồng nhĩ (`af`, `rhythm === 'af'`).
  - Bổ sung quy tắc `copd.safety.non_selective_bb_switch_selective` (`rules.safety.systemic.ts`) phát đồng thời y lệnh `SWITCH` sang `bisoprolol` (`switchFrom: oldBb.drugId`, liều khởi đầu chuẩn KB) khi bệnh nhân COPD không kèm hen và không suy hô hấp cấp/tụt huyết áp đang dùng `carvedilol` / `propranolol` / `nadolol`, đảm bảo `mergeRecommendations()` giữ vững trụ cột Chẹn beta giảm tử vong của suy tim và kèm cảnh báo FDA không ngừng thuốc đột ngột.
  - Kiểm chứng bằng Golden Case `copd_57_r3_hfref_carvedilol_switch_bisoprolol.json`.

### `COPD-R3-R1-02` (Critical) – Xung đột Corticoid toàn thân, SABA giờ đầu & đích Oxy khi chạy đồng thời `['copd', 'asthma']` nội viện
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Xây dựng `getAsthmaInpatientAcuteState(ctx)` (`helpers.aco.ts`) mô hình hóa chính xác trạng thái cấp cứu nội viện của phân hệ Hen.
  - Trong `copd.inpatient.systemic_steroid` (`rules.inpatient.meds.ts`), khi phân hệ Hen phát `methylprednisolone` cấp cứu (hoặc bệnh nhân đang dùng sẵn `methylprednisolone`), COPD đồng bộ sang `drugId: 'methylprednisolone'` (với `action: 'SWITCH', switchFrom: 'prednisolone'` nếu đang có `prednisolone` nền), triệt tiêu hoàn toàn cảnh báo giả `dup.systemic_steroid`.
  - Trong `copd.inpatient.short_acting_bronchodilators` (`rules.inpatient.bronch_o2.ts`), chuẩn hóa phác đồ khí dung giờ đầu theo GOLD 2026 PDF p. 114 (`mỗi 1 giờ × 2–3 liều đầu, sau đó mỗi 2–4 giờ`), và khi đồng mắc cơn hen cấp nặng đồng bộ nhịp `mỗi 20 phút trong giờ đầu` kèm cảnh báo theo dõi nhịp tim và Kali máu.
  - Trong `copd.inpatient.controlled_oxygen` (`rules.inpatient.bronch_o2.ts`), thống nhất đích bão hòa oxy kiểm soát `88–92%` cho ACO nội viện có nguy cơ tăng CO₂ máu và yêu cầu kiểm tra khí máu động mạch.
  - Kiểm chứng bằng Golden Case `copd_58_r3_inpatient_aco_unified_steroid_o2.json`.

### `COPD-R3-R1-03` (Critical) – Tách bạch chống chỉ định vs thận trọng LAMA (glôcôm / bí tiểu) & sửa liều cố định COPD cho `budesonide_formoterol`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Gỡ bỏ việc chặn cứng sai lệch đối với phì đại tiền liệt tuyến đã kiểm soát trong 10 tệp thuốc LAMA thuộc quyền sở hữu của COPD (`kb/drugs/tiotropium.json`, `umeclidinium.json`, `glycopyrronium.json`, `aclidinium.json`, 3 LABA+LAMA, 3 Triple), chuyển sang hướng dẫn thận trọng lâm sàng chuẩn GOLD 2026 Appendix 3; bổ sung trường `customInputs.controlledBphOrTreatedGlaucoma` trên UI (`inputs.ts`) kèm cảnh báo ngậm kín ống ngậm miệng, tránh xịt sương vào mắt (`getLamaWarnings`).
  - Khi người bệnh có chống chỉ định kháng cholinergic thực sự (`narrowAngleGlaucoma` hoặc `urinaryRetention`) ở Nhóm E tăng BCAT, `copd.safety.lama_contra_alternative` (`rules.safety.inhalers_device.ts`) gọi `formatCopdBudesonideFormoterolDose()` chỉ định **liều duy trì cố định chuẩn COPD** (`160/4.5 mcg: hít 2 nhát x 2 lần/ngày` hoặc `320/9 mcg: 1 nhát x 2 lần/ngày` theo BYT QĐ 2131/2026 Phụ lục 1), tuyệt đối không gọi `dose('budesonide_formoterol', 'start')` (chế độ PRN AIR của Hen).
  - Kiểm chứng bằng Golden Cases `copd_59_r3_glaucoma_group_e_high_eos_fixed_ics_laba.json` và `copd_67_r3_sama_on_lama_stop_and_bph_caution.json`.

### `COPD-R3-R1-04` (Major) – Bổ sung đầy đủ quy tắc `CONTINUE` cho thuốc hít nền, bộ ba mở 2 bình, thuốc sinh học/Azithromycin & LABD nội viện
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung `copd.followup.continue_controlled_inhaler` (2 khe cho cả phác đồ đôi mở) và `copd.followup.continue_open_triple_ics_laba` song song với `copd.followup.continue_triple` trong `rules.followup.continue.ts` (không bao giờ gán nhãn đơn chất `Tiotropium` là `ICS + LAMA + LABA`, và giữ đủ cả 2 bình của bộ ba mở).
  - Bổ sung `copd.followup.roflumilast_continue` & `copd.followup.azithromycin_continue` (nhắc theo dõi ECG QTc ≤ 450 ms, thính lực, NTM và đánh giá lại ở mốc 1 năm) trong `rules.escalation.oral.ts`, cùng `copd.followup.dupilumab_continue` & `copd.followup.mepolizumab_continue` trong `rules.escalation.biologics.ts`.
  - Bổ sung `copd.inpatient.continue_maintenance_labd` (2 khe) trong `rules.inpatient.meds.ts` duy trì thuốc giãn phế quản dài hạn nền ngay trong đợt cấp theo GOLD 2026 PDF p. 114.
  - Kiểm chứng bằng Golden Case `copd_60_r3_open_triple_continue_both_components.json`.

### `COPD-R3-R1-05` (Major) – Không tự động cắt ICS ở bệnh nhân đang dùng `ICS + LABA` còn khó thở kèm `BCAT ≥ 300 /µL`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Cập nhật `copd.followup.ics_laba_step_up_or_switch` (`rules.followup.stepup_ics.ts`) và `getPlannedTherapeuticInhalerChangeDrugId` (`helpers.inhalers_plan.ts`): khi bệnh nhân đang dùng `ICS + LABA` còn triệu chứng khó thở (`mMRC ≥ 2` hoặc `CAT ≥ 10`) có `BCAT ≥ 300 /µL` (hoặc Nhóm E `BCAT ≥ 100 /µL`, hoặc đồng mắc Hen), hệ thống nâng bậc lên bộ ba `ICS + LAMA + LABA` (`rec_copd_ics_laba_escalate_triple`) đúng theo Biểu đồ 2.2 BYT QĐ 2131/2026 và GOLD 2026 Figure 3.12 thay vì rút ICS sang `LABA + LAMA`.
  - Kiểm chứng bằng Golden Case `copd_61_r3_ics_laba_high_eos_dyspnea_escalate_triple.json`.

### `COPD-R3-R1-06` (Major) – Chuẩn hóa ngưỡng Nhóm E (`≥ 1` đợt cấp vừa) & Fail-Closed khi thiếu `FEV₁/FVC`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TẠI COPD + ĐỐI CHIẾU LIÊN PHÂN HỆ (`Agent B4`)**.
- **Chi tiết xử lý**:
  - Tại phân hệ `copd`: `isGroupEConfirmed(ctx)` đọc ngưỡng `thFor('moderateExacerbations', 'copd.exacerbation_moderate_group_e')` (`= 1`); `copd.nonpharm.vaccinations` đòi hỏi `hasConfirmedStableCopd(ctx)`; `copd.nonpharm.weak_inspiratory_flow_device` đòi hỏi `hasConfirmedCopdSpirometry(ctx) || isAcuteExacerbation(ctx)`; và `getFev1FvcRatio(ctx)` hỗ trợ tính tỷ số từ `fev1 / fvc` thô đồng bộ với engine.
  - Phần tệp trung tâm `src/engine/derive.ts` và `src/engine/calculators/gold.ts` nằm ngoài phạm vi ghi của Agent L4 và thuộc quyền sở hữu trực tiếp của **Agent B4 (Engine Core)** trong Vòng 3.

### `COPD-R3-R1-07` (Major) – Bổ sung quy tắc độc lập Phục hồi chức năng hô hấp (`copd.nonpharm.pulmonary_rehabilitation`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung quy tắc độc lập `copd.nonpharm.pulmonary_rehabilitation` (`id: 'rec_copd_pulmonary_rehab'`, `action: 'REFER'`, `rules.nonpharm.ts`) cho toàn bộ bệnh nhân COPD ổn định thuộc Nhóm B hoặc Nhóm E (`isHighSymptomsConfirmed(ctx) || isGroupEConfirmed(ctx)`), nhấn mạnh khởi động sớm `< 4 tuần` sau xuất viện đợt cấp theo GOLD 2026 Evidence A & BYT QĐ 2131/2026, đồng thời tích hợp vào kế hoạch xuất viện nội trú (`rules.inpatient.vte_discharge.ts`).
  - Kiểm chứng bằng Golden Case `copd_68_r3_pulmonary_rehab_ldct_saba_overuse.json`.

### `COPD-R3-R1-08` (Major) – Phủ kín danh sách bình bột khô DPI chứa lactose (`Seretide`, `Symbicort`, `Spiriva HandiHaler`, `Serevent`, `Trelegy`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Mở rộng `DPI_INHALER_IDS` và tạo mới `DUAL_FORM_LACTOSE_INHALER_IDS` (`helpers.constants.ts`), kết hợp `getActiveDpiInhalerMed()` và `getDualFormLactoseDeviceWarningMed()` (`helpers.inhalers.ts`): tự động chuyển đổi `salmeterol` / `fluticasone_salmeterol` (khi chưa chỉ định rõ Evohaler pMDI) sang SMI/pMDI không chứa lactose, đồng thời phát thẻ kiểm soát bắt buộc dạng bào chế `rec_copd_dual_form_lactose_free_device` đối với `tiotropium` (chỉ cấp Spiriva Respimat, cấm HandiHaler DPI) và `budesonide_formoterol` (chỉ cấp Rapihaler pMDI + buồng đệm, cấm Turbuhaler DPI).

### `COPD-R3-R1-09` (Major) – Tiêu chuẩn Anthonisen `≥ 2` triệu chứng cho kháng sinh đợt cấp, đủ 3 tiêu chuẩn NIV & hoàn thiện dự phòng VTE
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - `copd.inpatient.antibiotics` (`rules.inpatient.meds.ts`): yêu cầu chặt chẽ `hasMechanicalVentilationNeed(ctx) || (isPurulent && (increasedDyspnea || increasedSputumVolume || fever))`; bổ sung thêm quy tắc nhắc xác nhận triệu chứng Anthonisen đi kèm (`copd.inpatient.antibiotics_anthonisen_clarify`) khi chỉ mới tích `purulentSputum` đơn lẻ mà các trường còn lại để trống.
  - `copd.inpatient.niv_bipap` & `copd.inpatient.niv_clinical_prep_pending_abg` (`rules.inpatient.vent_icu.ts`): bao phủ đủ cả 3 tiêu chuẩn của BYT QĐ 2131/2026 Mục 3.4.5a: (1) toan hô hấp `pH ≤ 7.35 & PaCO₂ ≥ 45 mmHg`, (2) khó thở nặng kèm co kéo cơ hô hấp phụ (`accessoryMuscleUse`), (3) giảm oxy máu kháng trị dù đã thở oxy (`onSupplementalOxygen && SpO₂ < 88%`), đồng thời cảnh báo chuẩn bị máy NIV ngay tại giường khi đang chờ kết quả khí máu.
  - `copd.inpatient.vte_prophylaxis` (`rules.inpatient.vte_discharge.ts`): bổ sung đầy đủ chuỗi `dose` chuẩn hóa cho cả nhánh chức năng thận bình thường (LMWH dưới da) và nhánh suy thận nặng `eGFR < 30` / lọc máu (ưu tiên UFH dưới da hoặc giảm liều LMWH kèm `GateResult` thận và cảnh báo kiểm tra tiểu cầu phòng HIT).

### `COPD-R3-R1-10` (Major) – Chặn Home NIV khi toan hô hấp cấp / chưa nhập viện & bổ sung cảnh báo đỏ cấp cứu ngoại trú
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung quy tắc ưu tiên tối khẩn `copd.outpatient.acute_respiratory_failure_refer` (`id: 'rec_copd_outpatient_emergency_refer'`, `action: 'REFER'`, `priority: 108`, `rules.inpatient.bronch_o2.ts`) chuyển Khoa Cấp cứu / ICU ngay lập tức khi bệnh nhân ngoại trú có ngừng thở, rối loạn tri giác, toan hô hấp cấp mất bù (`pH ≤ 7.35`), nhịp thở `> 30 lần/phút` hoặc đợt cấp suy hô hấp.
  - Trong `copd.outpatient.home_niv` (`rules.nonpharm.ts`): chặn tuyệt đối khi `abgPh ≤ 7.35` hoặc `hasOutpatientAcuteRespiratoryFailure(ctx)` và bắt buộc `hospitalizations ≥ 1` theo đúng thử nghiệm HOT-HMV (GOLD 2026 p. 89) và BYT QĐ 2131/2026 Mục 2.6b.
  - Kiểm chứng bằng Golden Case `copd_62_r3_outpatient_acute_respiratory_failure_refer.json`.

### `COPD-R3-R1-11` (Major) – An toàn thuốc nhóm Methylxanthine (`theophylline`), thuốc ức chế TKTW (`benzodiazepine`/`opioid`) & trích dẫn động `roflumilast_contra`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung 3 quy tắc an toàn hệ thống mới trong `rules.safety.systemic.ts`:
    1. `copd.safety.methylxanthine_acute_stop` (`STOP` theophylline/aminophylline trong đợt cấp COPD theo GOLD 2026 Evidence B).
    2. `copd.safety.theophylline_chronic_review` (`REDUCE` khi cao tuổi ≥ 65 / bệnh gan / suy tim do giảm thanh thải; `CONSIDER` rà soát ngừng chuyển sang LABA/LAMA ở COPD ổn định).
    3. `copd.safety.cns_depressant_hypercapnia_stop` (`STOP` diazepam, lorazepam, midazolam, zolpidem, morphine, fentanyl, codeine, tramadol... khi đợt cấp hoặc tăng CO₂ / toan hô hấp / giảm oxy máu).
  - Tách hàm `getRoflumilastContraInfo(ctx)` (`helpers.oral_safety.ts`) sinh mảng lý do và `citationIds` động khớp chính xác 1-1 với nguyên nhân thực tế trên từng bệnh nhân (suy gan vs trầm cảm vs nhẹ cân BMI < 18.5 vs thai kỳ/cho con bú vs dùng kèm theophylline hoặc chất cảm ứng mạnh CYP3A4).
  - Kiểm chứng bằng Golden Case `copd_64_r3_acute_theophylline_diazepam_stop.json`.

### `COPD-R3-R1-12` (Major) – Khắc phục toàn bộ các trường "mồ côi giao diện" trong `src/modules/copd/inputs.ts`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Viết lại hoàn chỉnh `src/modules/copd/inputs.ts` theo chuẩn `ModuleInputSchema` (3 nhóm lâm sàng trực quan), bổ sung đầy đủ: `customInputs.sabaUsePerWeek`, `customInputs.narrowAngleGlaucoma`, `customInputs.urinaryRetention`, `customInputs.controlledBphOrTreatedGlaucoma`, `customInputs.breastfeeding`, `customInputs.respiratoryRate`, `customInputs.increasedDyspnea`, `customInputs.fever`, `customInputs.respiratoryArrest`; kết nối 100% các trường `packYears`, `increasedSputumVolume`, `accessoryMuscleUse` vào logic quy tắc; và chuẩn hóa nhãn `customInputs.qtcProlonged` ghi rõ mốc `QTc > 450 ms` theo BYT QĐ 2131/2026.

### `COPD-R3-R1-13` (Minor) – Chuẩn hóa `profileDiff.VN` (kháng sinh 5–7 / 7–10 ngày, corticoid 30–40 mg uống / 40–80 mg TM) & tiêu chuẩn LTOT mở rộng (`SaO₂ ≤ 88%`, `PaO₂ 56–59 mmHg`, tăng áp phổi)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Cập nhật `copd.inpatient.antibiotics` và `copd.inpatient.systemic_steroid` (`rules.inpatient.meds.ts`) phản ánh đầy đủ phác đồ BYT QĐ 2131/2026 (kháng sinh ngoại trú `5–7 ngày`, nội trú nặng `7–10 ngày` kèm phân tầng *Pseudomonas aeruginosa*; corticoid uống `30–40 mg/ngày`, Methylprednisolone TM `1–2 lọ 40 mg/ngày`).
  - Chuẩn hóa ngưỡng `copd.ltot_cor_pulmonale_spo2_upper` về `88` (`SaO₂ ≤ 88%`) và bổ sung `copd.ltot_cor_pulmonale_pao2_min` (`56 mmHg`) + `copd.ltot_min_hours_per_day` (`15 giờ/ngày`) trong `kb/thresholds/copd.json`, đồng thời cập nhật nhãn `inputs.ts` & `rules.nonpharm.ts` nêu đủ cả 3 tình trạng: **tăng áp động mạch phổi, tâm phế mạn / suy tim phải hoặc đa hồng cầu (`Hct > 55%`)**.

### `COPD-R3-R1-14` (Minor) – Thay thế các trích dẫn mượn tạm `gold.copd.2026.initial_group_a` bằng trích dẫn nhãn FDA / GOLD chuyên biệt
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung các trích dẫn nhãn thuốc FDA chuyên biệt (`fda.copd.umeclidinium_label`, `fda.copd.aclidinium_label`, `fda.copd.salmeterol_label`, `fda.copd.theophylline_label`, v.v.) vào `kb/citations/copd.json` và gắn kèm `gold.copd.2026.concurrent_asthma` trong `kb/drugs/umeclidinium.json`, `aclidinium.json`, `salmeterol.json` và `theophylline.json`.

### `COPD-R3-R1-15` (Minor) – Cập nhật nguyên văn `quote` chứa mốc `≥ 100 cells/µL` cho `gold.copd.2026.followup_exac_eos_100_300`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Cập nhật `quote` và `section` của `gold.copd.2026.followup_exac_eos_100_300` trong `kb/citations/copd.json` sang đúng câu nguyên văn tại GOLD 2026 Chapter 3 (PDF p. 77 / trang in 66): *"In patients who have a moderate or severe exacerbation on LABA+LAMA therapy we suggest escalation to LABA+LAMA+ICS (Figure 3.10). A beneficial response after the addition of ICS may be observed at blood eosinophil counts ≥ 100 cells/µL..."*.

### `COPD-R3-R1-16` (Minor) – Khử trùng lặp `citationIds` và chuẩn hóa trường `cor` trong `kb/citations/copd.json`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Khử sạch 100% các phần tử `'byt.copd.2026.triple_therapy_indication'` bị lặp đôi trong `rules.followup.*.ts`.
  - Chuẩn hóa toàn bộ `kb/citations/copd.json` (loại bỏ `"cor": "1"` số Ả Rập không chuẩn cho các nguồn GOLD/BYT/FDA không dùng thang Class I–III).

### `COPD-R3-R1-17` (Minor) – Sửa chú thích nguồn của `dupilumab` & `mepolizumab` trong ma trận điều trị `matrices.therapy.ts`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Cập nhật `note` tại cả 2 hàng `dupilumab` và `mepolizumab` trong `src/modules/copd/matrices.therapy.ts` thành `'Chỉ định khi BCAT ≥ 300 /µL theo GOLD 2026 (chưa đưa vào hướng dẫn BYT 2131/2026)'`.

### `COPD-R3-R1-18` (Suggestion) – Bổ sung tầm soát ung thư phổi bằng LDCT, sàng lọc thiếu hụt Alpha-1 Antitrypsin (AATD) & cảnh giác tim mạch sau đợt cấp
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung quy tắc `copd.nonpharm.screening_ldct_aatd` (`id: 'rec_copd_ldct_screening'`, `rules.nonpharm.ts`) khai thác trực tiếp `age` (`50–80 tuổi`), `packYears` (`≥ 20 gói-năm`) và `smokingStatus` để khuyến cáo chụp CT ngực liều thấp (LDCT) hằng năm kèm xét nghiệm sàng lọc AATD 1 lần theo GOLD 2026 & BYT QĐ 2131/2026 tr. 54.
  - Bổ sung cảnh báo giám sát biến cố tim mạch cấp trong 30 ngày đầu sau đợt cấp nhập viện vào `copd.inpatient.discharge_criteria` (`rules.inpatient.vte_discharge.ts`) kèm trích dẫn `byt.copd.2026.cv_risk_post_exacerbation`.
  - Kiểm chứng bằng Golden Case `copd_68_r3_pulmonary_rehab_ldct_saba_overuse.json`.

---

## 4. Giải trình Chi tiết Từng Phát hiện – Hội đồng R2 (`COPD-R3-R2-01` .. `COPD-R3-R2-10`)

### `COPD-R3-R2-01` (Critical) – Đứt gãy trụ cột Chẹn beta ở bệnh nhân HFrEF + COPD đang dùng Carvedilol
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (đồng bộ với `COPD-R3-R1-01` & `COPD-R3-R3-02`).
- **Chi tiết xử lý**: Phát cặp chuyển đổi an toàn `SWITCH bisoprolol` (`switchFrom: 'carvedilol'`) kèm hướng dẫn chuẩn độ và cảnh báo không ngừng chẹn beta đột ngột trong `rules.safety.systemic.ts`; kiểm chứng qua `copd_57_r3_hfref_carvedilol_switch_bisoprolol.json` trên cả bộ chạy đa phân hệ `['copd', 'hf']`.

### `COPD-R3-R2-02` (Major) – Chuỗi 4 lỗi liên hoàn ở nhánh Glôcôm góc đóng & Bí tiểu (`hasAnticholinergicContra`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  1. Bổ sung `customInputs.narrowAngleGlaucoma` & `customInputs.urinaryRetention` vào `inputs.ts`.
  2. Thay thế hoàn toàn liều AIR của Hen bằng `formatCopdBudesonideFormoterolDose()` (liều cố định COPD `160/4.5 mcg x 2 nhát x 2 lần/ngày`) trong `copd.safety.lama_contra_alternative`.
  3. Bổ sung quy tắc theo dõi khó thở khi chống chỉ định LAMA `copd.followup.lama_contra_dyspnea_stepup` (`rules.followup.stepup_bronch.ts`), nhánh nâng lên `ICS + LABA` cố định khi Nhóm E có `BCAT ≥ 100 /µL` trên nền LABA đơn trị (`helpers.inhalers_plan.ts`), và hướng dẫn kê đơn ra viện không chứa LAMA trong `copd.inpatient.discharge_criteria` (`rules.inpatient.vte_discharge.ts`).
  4. Trong `copd.inpatient.short_acting_bronchodilators` (`rules.inpatient.bronch_o2.ts`), khi `hasAnticholinergicContra(ctx) === true`, chỉ định Salbutamol đơn thuần và cảnh báo tuyệt đối tránh khí dung Ipratropium qua mặt nạ dính vào mắt.

### `COPD-R3-R2-03` (Major) – Tương tác thuốc `salmeterol` / `vilanterol` / `umeclidinium_vilanterol` với chất ức chế mạnh CYP3A4 & trường `qtRisk`
- **Trạng thái**: **ĐÃ KHẮC PHỤC PHẦN DƯỢC THƯ COPD + ĐỐI CHIẾU LIÊN PHÂN HỆ (`Agent E4`)**.
- **Chi tiết xử lý**:
  - Tại các tệp dược thư thuộc quyền sở hữu của COPD (`kb/drugs/salmeterol.json`, `vilanterol.json`, `umeclidinium_vilanterol.json`, `fluticasone_furoate_umeclidinium_vilanterol.json`): đã cập nhật `"qtRisk": "conditional"` đồng bộ với `fluticasone_salmeterol.json` và `fluticasone_vilanterol.json`, đồng thời đồng bộ `kb/review/drug.*.json` (`status: 'auto_checked'`).
  - Phần tệp tương tác thuốc dùng chung `kb/interactions/diabetes_respiratory.json` nằm ngoài phạm vi ghi của Agent L4 và được xử lý bởi **Agent E4 (DDI & Cross-Specialty Pharmacology)** trong Vòng 3.

### `COPD-R3-R2-04` (Major) – Nhận diện `methylprednisolone` nền / cấp cứu trong `copd.inpatient.systemic_steroid`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Trong `copd.inpatient.systemic_steroid` (`rules.inpatient.meds.ts`), kiểm tra đầy đủ `METHYLPRED_SET` (`methylprednisolone`, `medrol`, `solumedrol`), `PREDNISOLONE_SET` và `SYSTEMIC_STEROID_IDS`: nếu bệnh nhân đang dùng `methylprednisolone` liều điều trị đợt cấp (`≥ 30 mg`), phát `CONTINUE methylprednisolone`; nếu đang dùng liều nền thấp (`< 30 mg`), phát `UPTITRATE methylprednisolone` kèm cảnh báo bắt buộc lùi về liều nền sau 5 ngày để phòng suy thượng thận cấp — triệt tiêu hoàn toàn lệnh `SWITCH` nghịch lý và cảnh báo giả `dup.systemic_steroid`.

### `COPD-R3-R2-05` (Major) – Bảo vệ dị ứng nặng đạm sữa bò trên `fluticasone_vilanterol`, `fluticasone_salmeterol`, `tiotropium` & đợt cấp nội viện
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung `severe_milk_protein_allergy` vào `contraindications` của `kb/drugs/fluticasone_vilanterol.json` và `kb/drugs/fluticasone_salmeterol.json`; cập nhật mô tả liều `tiotropium.json` và helper `formatCopdTiotropiumDose(avoidDpi)` loại bỏ hoàn toàn câu gợi ý `HandiHaler 18 mcg` khi có dị ứng đạm sữa bò hoặc lực hít yếu.
  - Bổ sung `copd.safety.dual_form_device_warning` (`rules.safety.inhalers_device.ts`) bắt buộc cấp phát đúng dạng Respimat / Rapihaler pMDI / Evohaler pMDI + buồng đệm.
  - Cho phép `getDpiSwitchTargetDrugId(ctx)` hoạt động ngay cả trong đợt cấp nội viện khi `hasMilkProteinAllergy(ctx) === true` để chuyển ngay từ DPI chứa lactose sang pMDI/SMI an toàn trước xuất viện (kiểm chứng bằng Golden Case `copd_66_r3_inpatient_dpi_milk_allergy_switch_pmdi.json`).

### `COPD-R3-R2-06` (Major) – Thiếu y lệnh `CONTINUE` cho thuốc hít ngoài bộ ba và thuốc cộng thêm dài hạn (`azithromycin`, `dupilumab`, `mepolizumab`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (đồng bộ với `COPD-R3-R1-04` & `COPD-R3-R3-07`).
- **Chi tiết xử lý**: Đã hiện thực hóa đầy đủ `copd.followup.continue_controlled_inhaler`, `copd.followup.azithromycin_continue`, `copd.followup.dupilumab_continue` và `copd.followup.mepolizumab_continue`.

### `COPD-R3-R2-07` (Major) – Phân tầng suy gan nhẹ `Child-Pugh A` (tăng AUC 51%) và chống chỉ định thời kỳ cho con bú (`breastfeeding`) của Roflumilast
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung `hasChildPughAMildHepatic(ctx)` (`helpers.clinical.ts`) và cập nhật `getRoflumilastContraInfo(ctx)` (`helpers.oral_safety.ts`): khi `childPugh === 'A'` và không có xơ gan mất bù, không chặn cứng `AVOID` kể cả khi `conditions.liverDisease === true`; thay vào đó `copd.followup.roflumilast_indication` và `roflumilast_continue` gắn cảnh báo rõ vào `warnings` về mức tăng phơi nhiễm ~`51%` theo nhãn FDA Daliresp §8.6 (`fda.copd.roflumilast_child_pugh_a_auc51`).
  - Bổ sung trường `customInputs.breastfeeding` vào `inputs.ts` và chặn `AVOID`/`STOP` Roflumilast khi phụ nữ đang cho con bú kèm trích dẫn `fda.copd.roflumilast_lactation`.
  - Kiểm chứng bằng Golden Case `copd_63_r3_roflumilast_child_pugh_a_allowed.json`.

### `COPD-R3-R2-08` (Minor) – Ngừng phối hợp thường quy SAMA (`ipratropium`) trên nền LAMA & rà soát độc tính `theophylline`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung `copd.safety.sama_on_lama_stop` (`id: 'rec_copd_stop_sama_on_lama'`, `rules.safety.inhalers_stop.ts`) phát lệnh `STOP ipratropium` khi người bệnh ngoại đợt cấp đang dùng song song với LAMA duy trì (kiểm chứng bằng Golden Case `copd_67_r3_sama_on_lama_stop_and_bph_caution.json`).
  - Bổ sung `copd.safety.methylxanthine_acute_stop` và `copd.safety.theophylline_chronic_review` (`rules.safety.systemic.ts`) xử lý đầy đủ đợt cấp và tình trạng giảm thanh thải do bệnh gan/xơ gan, suy tim hoặc cao tuổi.

### `COPD-R3-R2-09` (Minor) – Bổ sung trường `lactation` cho 16 tệp thuốc COPD, cảnh báo suy gan cho bộ ba ICS & khử trùng lặp trích dẫn
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Bổ sung đầy đủ trường `lactation` (`status`, `notesVi`, `citationIds`) cho toàn bộ 16 tệp `kb/drugs/*.json` thuộc sở hữu của COPD (`tiotropium`, `umeclidinium`, `glycopyrronium`, `aclidinium`, `indacaterol`, `olodaterol`, `salmeterol`, `vilanterol`, 3 LABA+LAMA, 3 Triple, `mepolizumab`, `theophylline`).
  - Bổ sung ghi chú dược động học tăng phơi nhiễm ICS toàn thân ở suy gan vừa–nặng vào `fluticasone_furoate_umeclidinium_vilanterol.json`, `budesonide_glycopyrronium_formoterol.json` và hàm `getHepaticTripleWarnings(ctx, drugId)` (`helpers.clinical.ts`).
  - Khử sạch toàn bộ trích dẫn trùng lặp `'byt.copd.2026.triple_therapy_indication'`.

### `COPD-R3-R2-10` (Suggestion) – Tư vấn hội chẩn Sản – Hô hấp khi cân nhắc Azithromycin dài ngày hoặc thuốc sinh học trong thai kỳ
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Trong `copd.followup.azithromycin_prophylaxis` (`rules.escalation.oral.ts`), `copd.followup.dupilumab_indication` và `copd.followup.mepolizumab_indication` (`rules.escalation.biologics.ts`), khi `pregnant === true`, tự động đính kèm cảnh báo chuyên biệt vào `warnings` yêu cầu hội chẩn Sản – Hô hấp cân nhắc lợi ích – nguy cơ do dữ liệu phơi nhiễm dài hạn trong thai kỳ còn hạn chế (`gina.copd.2026.pregnancy_biologics_scarce`).

---

## 5. Giải trình Chi tiết Từng Phát hiện – Hội đồng R3 (`COPD-R3-R3-01` .. `COPD-R3-R3-17`)

### `COPD-R3-R3-01` (Critical) – Nhận diện suy hô hấp cấp nguy kịch ngoại trú & chuyển ICU/đặt NKQ khi ngừng thở hoặc rối loạn tri giác
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ TẠI COPD + ĐỐI CHIẾU ENGINE (`Agent B4`)**.
- **Chi tiết xử lý**:
  - Bổ sung `hasOutpatientAcuteRespiratoryFailure(ctx)` (`helpers.clinical.ts`) và quy tắc `copd.outpatient.acute_respiratory_failure_refer` (`rules.inpatient.bronch_o2.ts`, `priority: 108`) bắt nhạy cả khi chưa tích `acuteExacerbation` nếu có ngừng thở, lơ mơ/rối loạn ý thức kèm suy hô hấp, toan hô hấp mất bù (`pH ≤ 7.35`), nhịp thở `> 30 lần/phút`, hoặc đợt cấp ngoại trú nặng (`SpO₂ < 90%`, `RR > 24`, co kéo cơ hô hấp phụ, tụt HA), đồng thời khóa toàn bộ khởi trị ngoại trú thường quy, LTOT, Home NIV và tiêm chủng.
  - Sửa `copd.inpatient.icu_transfer` (`rules.inpatient.vent_icu.ts`) kích hoạt ngay lập tức khi `respiratoryArrest === true` (không cần chờ khí máu) hoặc `alteredMentalStatus === true` (không bị khóa sau điều kiện `PaCO₂ > 60 mmHg`).
  - Phần `checkEmergencyRedFlags()` trong `src/engine/safety/reviewMedsSpecialized.ts` thuộc phạm vi **Agent B4**.

### `COPD-R3-R3-02` (Critical) – Bảo toàn trụ cột Chẹn beta bằng `SWITCH bisoprolol` ở bệnh nhân HFrEF + COPD đang dùng Carvedilol
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (xem `COPD-R3-R1-01` & `copd_57_r3_hfref_carvedilol_switch_bisoprolol.json`).

### `COPD-R3-R3-03` (Critical) – Phản vệ đạm sữa bò, lực hít yếu & bí danh `fluticasone_umeclidinium_vilanterol`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ TẠI COPD + ĐỐI CHIẾU ASTHMA (`Agent L3`)**.
- **Chi tiết xử lý**:
  - Bổ sung bí danh `'fluticasone_umeclidinium_vilanterol'` (`canonicalId: 'fluticasone_furoate_umeclidinium_vilanterol'`) vào cả `INHALER_PROFILES` lẫn `DPI_INHALER_IDS` (`helpers.constants.ts`), chấm dứt hoàn toàn lỗi `eff === 'none'` và 3 cảnh báo trùng lặp giả với chính Trelegy.
  - Bổ sung `severe_milk_protein_allergy` vào `fluticasone_salmeterol.json` & `fluticasone_vilanterol.json`; xử lý chuyển đổi thiết bị/cảnh báo dạng bào chế cho `Seretide`, `Symbicort`, `Spiriva` trong `rules.safety.inhalers_device.ts`. (Phần kê đơn bên trong `src/modules/asthma/**` thuộc phạm vi **Agent L3**).

### `COPD-R3-R3-04` (Critical) – Kê đúng liều cố định COPD cho `budesonide_formoterol` & loại trừ Turbuhaler DPI khi dị ứng đạm sữa / lực hít yếu
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (xem `COPD-R3-R1-03`: hàm `formatCopdBudesonideFormoterolDose(requireLactoseFree)` chỉ định rõ `Rapihaler pMDI kèm buồng đệm` và cấm `Turbuhaler DPI` khi có dị ứng đạm sữa bò hoặc lực hít yếu; kiểm chứng qua `copd_59`).

### `COPD-R3-R3-05` (Major) – Chuẩn hóa tiêu chuẩn Anthonisen `≥ 2` triệu chứng có đờm mủ cho kháng sinh đợt cấp
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (xem `COPD-R3-R1-09` & kiểm thử bất biến 12.000 ca).

### `COPD-R3-R3-06` (Major) – Bắt buộc tiền sử nhập viện (`hospitalizations ≥ 1`) và loại trừ toan máu cấp cho `copd.outpatient.home_niv`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (xem `COPD-R3-R1-10`).

### `COPD-R3-R3-07` (Major) – Khép kín quy tắc `CONTINUE` cho thuốc hít duy trì đơn/đôi, bộ ba mở 2 bình và LABD nền trong đợt cấp
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (xem `COPD-R3-R1-04` & `copd_60_r3_open_triple_continue_both_components.json`).

### `COPD-R3-R3-08` (Major) – Mở rộng rút ICS sai chỉ định ban đầu (`copd.followup.inappropriate_ics_de_escalation`) cho cả phác đồ bộ ba (`triple`)
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Sửa `isInappropriateIcsDeEscalationCandidate(ctx)` (`helpers.inhalers.ts` dòng 201) từ `eff !== 'ics_laba'` thành `eff !== 'ics_laba' && eff !== 'triple'` và cập nhật tiêu đề/lý giải trong `rules.followup.stepup_ics.ts`.
  - Kiểm chứng bằng Golden Case `copd_65_r3_inappropriate_triple_low_eos_withdraw_ics.json`.

### `COPD-R3-R3-09` (Major) – Hòa giải Corticoid toàn thân & Oxy cấp cứu ở ACO nội viện, và không đề xuất chồng 2 kháng thể đơn dòng
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ TẠI COPD + ĐỐI CHIẾU ASTHMA/ENGINE (`Agent L3` / `Agent B4`)**.
- **Chi tiết xử lý**:
  - Hòa giải Corticoid toàn thân & đích Oxy `88–92%` nội viện thông qua `getAsthmaInpatientAcuteState(ctx)` (`copd_58`).
  - Trong `rules.escalation.biologics.ts`, khi bệnh nhân thỏa đồng thời tiêu chuẩn viêm phế quản mạn + `BCAT ≥ 300 /µL`, hệ thống chỉ đề xuất **1 thuốc sinh học ưu tiên duy nhất** là `Dupilumab` (theo bằng chứng BOREAS/NOTUS, nêu rõ `Mepolizumab` làm phương án thay thế nếu không dung nạp) thay vì xuất song song 2 y lệnh sinh học độc lập; đồng thời chặn đề xuất mới nếu đã dùng bất kỳ thuốc sinh học hô hấp nào (`RESPIRATORY_BIOLOGIC_IDS`). Kiểm chứng bằng `copd_31` và bất biến Suite 1.
  - Phần văn bản Bản kế hoạch hành động Hen (`src/modules/asthma/`) thuộc **Agent L3**, và phần xóa `dose` cũ khi `SWITCH` trong `src/engine/merge.ts` thuộc **Agent B4**.

### `COPD-R3-R3-10` (Major) – An toàn thuốc trên nhóm Lọc máu chu kỳ (`onDialysis`), Cho con bú (`breastfeeding`), `Child-Pugh A`, Glôcôm & QT/Thận nội viện
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  1. `getAzithromycinContraReasons(ctx)` (`helpers.oral_safety.ts`): bổ sung `hasCondition(ctx, 'onDialysis') || Boolean(cond.onDialysis)` chặn tuyệt đối Azithromycin dài hạn ở bệnh nhân lọc máu chu kỳ dù Creatinin sau lọc giảm giả tạo.
  2. `getRoflumilastContraInfo(ctx)`: bổ sung kiểm tra `breastfeeding` / `lactation`.
  3. `hasChildPughAMildHepatic(ctx)`: cho phép `CONSIDER`/`CONTINUE` Roflumilast ở Child-Pugh A kèm cảnh báo tăng AUC 51% (`copd_63`).
  4. `copd.inpatient.short_acting_bronchodilators` & `copd.inpatient.antibiotics`: tách nhánh tránh Ipratropium khi có glôcôm góc đóng/bí tiểu và gắn `warnings` hiệu chỉnh liều thận (`eGFR < 30` / lọc máu) + tránh fluoroquinolone/macrolide khi `qtcProlonged` hoặc đang dùng thuốc kéo dài QT (`amiodarone`, `sotalol`, `propafenone`...).

### `COPD-R3-R3-11` (Major) – Đồng bộ `getFev1FvcRatio` với dữ liệu phế dung thô (`fev1 / fvc`) & đối chiếu `src/engine/derive.ts`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TẠI COPD + ĐỐI CHIẾU ENGINE (`Agent B4`)**.
- **Chi tiết xử lý**:
  - Trong `helpers.clinical.ts`, hàm `getFev1FvcRatio(ctx)` tự động tính `fev1 / fvc` khi người dùng truyền thể tích tuyệt đối `patient.fev1` và `patient.fvc` mà chưa điền `customInputs.fev1FvcRatio`, khép kín đứt gãy dữ liệu phế dung kế.
  - Các điều chỉnh bên trong `src/engine/derive.ts` thuộc phạm vi sở hữu của **Agent B4**.

### `COPD-R3-R3-12` (Minor) – Hiển thị chuẩn xác chỉ số kích hoạt (`PaO₂` vs `SpO₂`) trên tiêu đề và lý giải của `copd.nonpharm.ltot_oxygen`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - Sửa cách tạo chuỗi `valStr` trong `copd.nonpharm.ltot_oxygen` (`rules.nonpharm.ts` dòng 203–216): khi `PaO₂` đạt ngưỡng LTOT (ví dụ `PaO₂ 58 mmHg`) nhưng `SpO₂` không giảm tương ứng (`SpO₂ 89–91%`), hiển thị rõ `PaO₂ 58 mmHg [SpO₂ 89%]` thay vì in nhầm `SpO₂` đơn độc làm lý do kích hoạt (kiểm chứng qua `copd_39`).

### `COPD-R3-R3-13` (Minor) – Ẩn thẻ tiêm chủng ngoại trú & Checklist ra viện khi đang suy hô hấp toan CO₂ cấp cần thở máy NIV
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**.
- **Chi tiết xử lý**:
  - `copd.nonpharm.vaccinations` (`rules.nonpharm.ts`) chỉ kích hoạt khi `hasConfirmedStableCopd(ctx)` (tạm hoãn hoàn toàn trong đợt cấp, chỉ nhắc rà soát tiêm chủng trong Checklist chuẩn bị xuất viện khi bệnh nhân đã qua giai đoạn cấp).
  - `copd.inpatient.discharge_criteria` (`rules.inpatient.vte_discharge.ts`) chặn hiển thị khi bệnh nhân đang có toan hô hấp cấp (`pH ≤ 7.35 && PaCO₂ ≥ 45 mmHg`) hoặc bất ổn nguy kịch (`isCriticallyUnstableInpatient(ctx)`), kiểm chứng bằng `copd_64` và bất biến Suite 1.

### `COPD-R3-R3-14` (Minor) – Tóm tắt bệnh án điện tử `src/engine/note.ts`
- **Trạng thái**: **ĐỐI CHIẾU LIÊN PHÂN HỆ (`Agent B4`)**.
- **Chi tiết xử lý**: Tệp `src/engine/note.ts` thuộc phạm vi độc quyền của **Agent B4 (Engine Core)** (nằm trong danh sách cấm ghi của Agent L4). Về phía phân hệ `copd`, toàn bộ y lệnh thuốc duy trì (`CONTINUE`), liều chuẩn hóa và tiêu đề tiếng Việt đã được xuất đầy đủ vào `plan.recommendations` để `note.ts` kết xuất chính xác.

### `COPD-R3-R3-15` (Minor) – Bổ sung đầy đủ các trường UI (`respiratoryArrest`, `increasedDyspnea`, `breastfeeding`) & kết nối `increasedSputumVolume`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ TẠI COPD + ĐỐI CHIẾU ENGINE (`Agent B4` / `Agent L3`)**.
- **Chi tiết xử lý**:
  - Toàn bộ các trường `customInputs.respiratoryArrest`, `customInputs.increasedDyspnea`, `customInputs.fever`, `customInputs.breastfeeding` đã được bổ sung vào `src/modules/copd/inputs.ts`, và `increasedSputumVolume` đã được kết nối trực tiếp vào tiêu chuẩn Anthonisen trong `rules.inpatient.meds.ts`.
  - Các nhãn tiếng Việt cho 4 câu hỏi GINA trong `src/engine/require.ts` đã hiện diện đầy đủ tại `FIELD_LABELS` (dòng 92–95).

### `COPD-R3-R3-16` (Suggestion) – Khử trùng lặp `'byt.copd.2026.triple_therapy_indication'` trong `rules.followup.*.ts`
- **Trạng thái**: **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** (0 mảng `citationIds` bị trùng lặp trên toàn bộ 35 tệp của `src/modules/copd/`).

### `COPD-R3-R3-17` (Suggestion) – Nhãn `module` của `reviewCurrentMedications()` kèm bổ sung quy tắc `STOP` chính chủ từ `copd`
- **Trạng thái**: **ĐÃ KHẮC PHỤC BỔ TRỢ TẠI COPD + ĐỐI CHIẾU ENGINE (`Agent B4`)**.
- **Chi tiết xử lý**:
  - Tệp `src/engine/safety/reviewMeds.ts` thuộc phạm vi sở hữu của **Agent B4**. Đồng thời, ngay tại phân hệ `copd`, chúng tôi đã chủ động bổ sung các quy tắc `module: 'copd'` ưu tiên cao (`copd.safety.dpi_inhaler_switch`, `copd.safety.dpi_milk_allergy_stop_without_spiro`, `copd.safety.stop_superseded_inhaler`, `copd.safety.roflumilast_contraindicated`) để mọi lệnh ngừng/chuyển đổi bình hít DPI chứa lactose hoặc thuốc chống chỉ định thai kỳ/cho con bú đều mang nhãn chính danh của phân hệ Hô hấp (`copd`).

---

## 6. Bộ Ca Chuẩn Hồi quy Vòng 3 (`copd_57` .. `copd_68`) & Kiểm định 4 Cổng Bắt buộc

### 6.1. 12 Ca Chuẩn Golden Cases Mới (Nâng tổng số lên **68 ca chuẩn COPD**)
1. `copd_57_r3_hfref_carvedilol_switch_bisoprolol.json`: Đồng mắc COPD + HFrEF (`LVEF 30%`) đang dùng Carvedilol -> `STOP carvedilol` + `SWITCH bisoprolol` (bảo toàn tứ trụ GDMT suy tim).
2. `copd_58_r3_inpatient_aco_unified_steroid_o2.json`: Đợt cấp nặng nội viện chồng lấp Hen – COPD trên nền Prednisolone 5 mg -> Thống nhất `SWITCH methylprednisolone` & thở oxy kiểm soát đích `SpO₂ 88–92%`.
3. `copd_59_r3_glaucoma_group_e_high_eos_fixed_ics_laba.json`: COPD Nhóm E `BCAT 380 /µL` kèm glôcôm góc đóng -> Khởi trị `budesonide_formoterol` liều cố định chuẩn COPD (`160/4.5 mcg x 2 nhát x 2 lần/ngày`), tránh LAMA & tránh liều PRN AIR.
4. `copd_60_r3_open_triple_continue_both_components.json`: COPD ổn định đang dùng bộ ba mở 2 bình (`budesonide_formoterol` + `tiotropium`) -> Phát lệnh `CONTINUE` cho đầy đủ cả 2 bình hít.
5. `copd_61_r3_ics_laba_high_eos_dyspnea_escalate_triple.json`: Đang dùng `ICS + LABA` còn khó thở nặng (`mMRC 3, CAT 18`) kèm `BCAT 360 /µL` -> Nâng lên bộ ba `Triple` thay vì cắt ICS sang `LABA + LAMA`.
6. `copd_62_r3_outpatient_acute_respiratory_failure_refer.json`: Khám ngoại trú có toan hô hấp cấp mất bù (`pH 7.26, PaCO₂ 64, SpO₂ 82%`, lơ mơ) -> Phát `REFER` Cấp cứu/ICU tối khẩn và chặn kê LTOT/Home NIV.
7. `copd_63_r3_roflumilast_child_pugh_a_allowed.json`: COPD nặng `FEV₁ 38%`, viêm phế quản mạn, suy gan nhẹ `Child-Pugh A` -> Cho phép `CONSIDER roflumilast` kèm cảnh báo tăng AUC `51%` (không chặn nhầm thành Child-Pugh B/C).
8. `copd_64_r3_acute_theophylline_diazepam_stop.json`: Đợt cấp nội viện toan hô hấp (`pH 7.31, PaCO₂ 58`) đang dùng `theophylline` + `diazepam` -> `STOP` cả 2 thuốc nguy hiểm, `START NIV/BiPAP`, `START` kháng sinh Anthonisen và chặn Checklist xuất viện sớm.
9. `copd_65_r3_inappropriate_triple_low_eos_withdraw_ics.json`: COPD ổn định không kèm hen đang dùng `Triple` sai chỉ định (`0` đợt cấp, ít triệu chứng, `BCAT 60 < 100 /µL`) -> Rút ICS `SWITCH tiotropium_olodaterol` + `STOP` bình bộ ba cũ.
10. `copd_66_r3_inpatient_dpi_milk_allergy_switch_pmdi.json`: Đợt cấp nội viện có dị ứng nặng đạm sữa bò và lực hít yếu đang dùng `Anoro Ellipta` (DPI) -> `SWITCH` sang `Spiolto Respimat` (SMI không chứa lactose) + `STOP` bình DPI cũ.
11. `copd_67_r3_sama_on_lama_stop_and_bph_caution.json`: COPD ổn định đang dùng `Spiolto` kèm `ipratropium` định kỳ và BPH đã kiểm soát -> `STOP ipratropium` trùng lặp và `CONTINUE tiotropium_olodaterol` kèm cảnh báo thận trọng.
12. `copd_68_r3_pulmonary_rehab_ldct_saba_overuse.json`: COPD Nhóm B đang hút thuốc `35 gói-năm`, lạm dụng SABA `5 lần/tuần` -> Chỉ định Phục hồi chức năng hô hấp (`REFER`), Tầm soát LDCT + AATD (`CONSIDER`), Cai thuốc lá (`REFER`) và Cảnh báo lạm dụng SABA (`MONITOR`).
- Đồng thời cập nhật `copd_31` (kiểm chứng chỉ đề xuất 1 thuốc sinh học `Dupilumab`, không xếp chồng `Mepolizumab`) và `copd_39` (kiểm chứng tiêu chuẩn mở rộng LTOT `PaO₂ 58 mmHg` trên nền tâm phế mạn).

### 6.2. Kết quả 4 Cổng Kiểm định Tự động (Verification Gates)
1. **Cổng 1 – Giới hạn kích thước tệp `< 20 KB` (`< 20.480` bytes)**: **ĐẠT 100%** (`35/35` tệp `.ts` trong `src/modules/copd/`, kích thước lớn nhất `17.835 B`, `0` tệp vượt ngưỡng).
2. **Cổng 2 – Kiểm tra Kiểu tĩnh TypeScript (`npx tsc --noEmit`)**: **ĐẠT 100%** (`exit code 0`, `0` lỗi kiểu trên toàn kho mã).
3. **Cổng 3 – Kiểm định Cơ sở Tri thức & Quy tắc Tĩnh (`npm run verify:kb`)**: **ĐẠT 100%** (`copd: 35 files | 0 lỗi | 0 cảnh báo | 34 qa-allow hợp lệ | 0 qa-allow sai`; toàn bộ `kb/review/*.json` ở trạng thái `'auto_checked'`).
4. **Cổng 4 – Kiểm thử Bất biến 22.000 ca & Golden Cases (`vitest`)**: **ĐẠT 100%** (`12.000` ca ngẫu nhiên đa bệnh lý Suite 1 + `10.000` ca xóa ngẫu nhiên trường lâm sàng Fail-Closed Suite 2 + `68/68` ca chuẩn Golden Cases chạy xanh trên cả `tests/modules/copd/invariants.test.ts` lẫn `tests/golden/_runner.test.ts`).
