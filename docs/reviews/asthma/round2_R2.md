# BÁO CÁO THẨM ĐỊNH DƯỢC LÂM SÀNG ĐỘC LẬP – VÒNG 2 (ROUND 2 – R2)
**Module:** Hen phế quản người lớn & thanh thiếu niên ≥ 12 tuổi (`asthma`)  
**Vai trò kiểm định:** R2 – Dược sĩ Lâm sàng Độc lập (Independent Clinical Pharmacist)  
**Ngày kiểm định:** 2026-10-27  
**Phạm vi kiểm định:**
- Hậu kiểm độc lập 100% 17 phát hiện Vòng 1 của R2 (`ASTHMA-R2-01` → `ASTHMA-R2-17`) và các điểm giao thoa dược lý an toàn từ `round1_RESPONSE.md`.
- Rà soát toàn diện 21 hồ sơ thuốc sở hữu bởi module Hen (`kb/drugs/*.json`) + `dupilumab.json`, bộ ngưỡng `kb/thresholds/asthma.json` (60 ngưỡng), trích dẫn `kb/citations/asthma.json` (52 trích dẫn), bảng tương tác `kb/interactions/*.json`, cùng toàn bộ mã nguồn `src/modules/asthma/{rules,matrices,actionPlan,inputs,presets,pathways,index}.ts` và tương tác với tầng gộp/an toàn lõi (`src/engine/{merge.ts,safety/duplicates.ts,safety/gates.ts,safety/reviewMeds.ts}`, `src/modules/hf/rules.ts`).
- Đối chiếu nguyên văn với tài liệu gốc trong `Medical_Library_2026`: `GINA_2026_Strategy_Report.pdf`, `GINA_2026_Summary_Guide.pdf`, `BYT_1851_2020_Hen_phe_quan_NL_va_TE_ge12.pdf`, `BYT_5850_2021_Quy_trinh_hen_phe_quan.pdf`, `EMA/Foster_Fostair_SmPC.pdf`, `FDA/FDA_label_budesonide_formoterol.pdf`, `FDA/FDA_label_benralizumab.pdf`, `FDA/FDA_label_dupilumab.pdf`, `FDA/FDA_label_budesonide.pdf`, `FDA/FDA_label_beclometasone.pdf`, `FDA/FDA_label_ciclesonide.pdf`.
- Thực thi kiểm thử động `evaluate()` thực tế qua bộ kịch bản dược lâm sàng tại `docs/reviews/asthma/scratch/round2_r2_{audit,extra_checks,deep_checks,pdf_verify}.ts`.

---

## 1. TỔNG QUAN KẾT QUẢ HẬU KIỂM VÒNG 1 (POST-CHECK ROUND 1)

Module `asthma` đã có bước tiến rất lớn sau Vòng 1: `npm run verify:kb` đạt **0 lỗi / 0 cảnh báo QA** trên toàn bộ 7 file mã nguồn và KB của `asthma`; 81/81 bài test tự động (`golden.test.ts` + 17.000 ca ngẫu nhiên trong `invariants.test.ts`) đều vượt qua. Hầu hết các lỗi nền tảng ở Vòng 1 đã được khắc phục nghiêm túc:

| Mã Vòng 1 | Nội dung cốt lõi | Trạng thái hậu kiểm Vòng 2 | Ghi chú kiểm chứng |
| :--- | :--- | :---: | :--- |
| **ASTHMA-R2-01** | Bỏ sót y lệnh thuốc cấp cứu ở cơn hen nguy kịch (`silentChest`/`drowsy`) | **ĐÃ SỬA (Có lỗi biên mới R2-202)** | Đã tách Rule 10 (`REFER` ICU) chạy song song 4 y lệnh thuốc (Rules 11A–11D), kể cả khi `paco2 > 45` hoặc `speech === 'unable'`. Tuy nhiên phát hiện lỗi thứ tự ưu tiên khi `acuteResponseAfter1h === 'good_response'` làm tắt cả gói nguy kịch (**ASTHMA-R2-202**). |
| **ASTHMA-R2-02** | Vùng Đỏ Action Plan xịt 4–6 nhát qua buồng đệm cho cả DPI Track 1 | **ĐÃ SỬA (Có lệch thiết bị xuất viện R2-206)** | `actionPlan.ts` đã tách rõ Track 1 (hít trực tiếp 1–2 nhát DPI, cấm buồng đệm/khí dung, cấm hít dồn 4–6 nhát) và Track 2 (4–6 nhát Salbutamol qua buồng đệm). Tuy nhiên `discharge_plan` lại hardcode `Rapihaler` pMDI gây xung đột văn bản (**ASTHMA-R2-206**). |
| **ASTHMA-R2-03** | Tự động kê gói cơn cấp nhẹ-TB cho mọi BN nội viện ổn định | **ĐÃ SỬA ĐẠT** | `evaluateAcuteAsthma()` kiểm tra `isAcuteExacerbation === false` và yêu cầu ít nhất một dữ liệu lâm sàng đợt cấp đặc hiệu. |
| **ASTHMA-R2-04** | Đánh rơi thuốc kiểm soát nền khi lên Bậc 5 Hen nặng | **ĐÃ SỬA (Còn cứng hoạt chất R2-204)** | Đã thêm Rule 21A (`step5_controller_continue`) giữ ICS-LABA nền song song với `REFER` chuyên khoa/LAMA/Sinh học. |
| **ASTHMA-R2-05** | Gộp chung 4 thuốc cấp cứu vào 1 y lệnh `salbutamol` duy nhất | **ĐÃ SỬA ĐẠT** | Đã tách thành 4 `Recommendation` độc lập (`salbutamol`, `ipratropium`, `methylprednisolone`, `magnesium_sulfate`) và 2 y lệnh độc lập ở cơn nhẹ-TB (`salbutamol`, `prednisolone`). |
| **ASTHMA-R2-06** | Ô liều trung bình Mometasone chồng lấn hoàn toàn với liều cao (`>400`) | **ĐÃ SỬA ĐẠT** | `matrices.ts` đã sửa thành Low `200–400 mcg/ngày`, Medium `'Không có mức liều trung bình riêng biệt (GINA Table 6)'`, High `>400 mcg/ngày` (khớp GINA 2026 Box 4-2 trang 78). |
| **ASTHMA-R2-07** | Thiếu gate trần Formoterol ở `beclometasone_formoterol.json` & cứng Symbicort | **SỬA MỘT PHẦN → LỖI NẶNG R2-201** | Đã thêm gate vào JSON và bắt `takingFosterOnly` ở Rule 4A (`HOLD`), nhưng các rule ngoại trú Track 1 vẫn kê chồng thêm `budesonide_formoterol` ngay giữa lúc đang quá liều Foster (**ASTHMA-R2-201**). |
| **ASTHMA-R2-08** | `terbutaline.json` thiếu gate cấm đơn trị & thiếu trần nhát tối đa | **ĐÃ SỬA ĐẠT** | Đã bổ sung `gate_terbutaline_not_alone` và `max: "8 nhát/ngày (4 mg/24 giờ)"`. |
| **ASTHMA-R2-09** | Toán tử `\|\|` làm cảnh báo Montelukast nổ trên BN không dùng thuốc | **ĐÃ SỬA (Còn thiếu tư vấn cơ bản R2-210)** | Đã sửa thành `isTakingMontelukast && hasPsychRisk`, song làm mất lời dặn Boxed Warning ở BN đang uống Montelukast chưa có tiền sử tâm thần (**ASTHMA-R2-210**). |
| **ASTHMA-R2-10** | Nhầm liều nhát xịt giữa Seretide Accuhaler (DPI) và Evohaler (pMDI) | **ĐÃ SỬA ĐẠT** | Đã phân biệt chính xác Accuhaler DPI (100/50, 250/50, 500/50: 1 liều hít × 2 lần/ngày) và Evohaler pMDI (50/25, 125/25, 250/25: 2 nhát xịt × 2 lần/ngày) trên cả JSON, `matrices.ts` và `rules.ts`. |
| **ASTHMA-R2-11** | Ghi biệt dược chỉ có tại Mỹ vào `vnBrands` của 5 thuốc | **ĐÃ SỬA ĐẠT** | Đã cập nhật ghi chú tình trạng lưu hành thực tế tại Việt Nam cho cả 5 thuốc (`fluticasone_furoate`, `beclometasone`, `mometasone`, `mometasone_formoterol`, `tezepelumab`). |
| **ASTHMA-R2-12** | Hardcode `drugId: 'salbutamol'` khi BN đang dùng `terbutaline` đơn độc | **ĐÃ SỬA ĐẠT** | Đã lấy động `sabaMed?.drugId` cho cả Salbutamol và Terbutaline. |
| **ASTHMA-R2-13** | Thiếu trích dẫn co thắt phế quản do chẹn beta & thuốc nhỏ mắt Timolol | **SỬA MỘT PHẦN → LỖI NẶNG R2-203 & R2-208** | Đã thêm `gina.asthma.2026.beta_blocker_bronchospasm` và `timolol_ophthalmic` vào tập kiểm tra, nhưng `.find()` làm bỏ lọt `timolol_ophthalmic` khi dùng kèm chẹn beta uống (**ASTHMA-R2-203**), và `hf.fmt.bb` vẫn gợi ý Carvedilol (**ASTHMA-R2-208**). |
| **ASTHMA-R2-14** | `prednisolone.json` thiếu công thức 1 mg/kg (tối đa 50 mg) | **ĐÃ SỬA ĐẠT** | Đã bổ sung `"40–50 mg/ngày (1 mg/kg/ngày ở người lớn, tối đa 50 mg)"` khớp BYT QĐ 5850 trang 17–18. |
| **ASTHMA-R2-15** | Cấp Action Plan tự quản lý tại nhà khi BN đang cấp cứu chưa ổn định | **ĐÃ SỬA ĐẠT** | Đã chặn ở `inpatient` trừ khi `acuteResponseAfter1h === 'good_response'`. |
| **ASTHMA-R2-16** | Xung đột đơn vị PEF (`L/phút` vs `%`) trong `actionPlan.ts` | **ĐÃ SỬA ĐẠT** | Đã tách riêng `pefBestLMin` (tính ngưỡng tuyệt đối `>80%`, `50–79%`, `<50%` ra `L/phút`) và `pefPct`. |
| **ASTHMA-R2-17** | Chưa đồng bộ lời dặn súc miệng ngừa nấm Candida cho đủ 11 thuốc chứa ICS | **ĐÃ SỬA ĐẠT (11/11)** | Kiểm chứng tự động 11/11 file ICS đơn chất và ICS-LABA đều có hướng dẫn súc miệng kỹ bằng nước sạch và nhổ bỏ sau khi hít. |

---

## 2. BẢNG KIỂM ĐỊNH CHI TIẾT 21 HỒ SƠ THUỐC SỞ HỮU (`kb/drugs/*.json`) + `dupilumab`

| STT | `drugId` | `classes` / `components` | Dạng bào chế & Biệt dược VN | Thai kỳ / Cho con bú | Súc miệng ICS | Đánh giá Dược lâm sàng Vòng 2 |
| :-: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `budesonide` | `["ics"]` | Turbuhaler 100/200 mcg; Respules 0.5–1 mg/2 ml (`Pulmicort`, `Budecort`) | `compatible` / `compatible` | Có | **Đạt chuẩn.** Liều 200–400 / >400–800 / >800 mcg/ngày khớp GINA Table 6; thuốc ưu tiên hàng đầu trong thai kỳ. |
| 2 | `fluticasone_propionate` | `["ics"]` | pMDI 50/125 mcg; Accuhaler 100/250 mcg; Nebules 0.5 mg/2 ml (`Flixotide`) | `compatible` / `compatible` | Có | **Đạt chuẩn** về liều (100–250 / >250–500 / >500 mcg). Cần bổ sung rule tương tác CYP3A4 máy thực thi (**R2-207**). |
| 3 | `fluticasone_furoate` | `["ics"]` | Ellipta DPI 100/200 mcg (Chưa lưu hành đơn chất tại VN) | `caution` / `caution` | Có | **Đạt chuẩn.** Liều 100 mcg (thấp) / 200 mcg (cao), 1 lần/ngày. |
| 4 | `beclometasone` | `["ics"]` | pMDI hạt siêu mịn 100/250 mcg (`Clenil`; chú thích rõ CFC đã ngưng) | `compatible` / `compatible` | Có | **Đạt chuẩn.** Phân biệt tốt hạt tiêu chuẩn HFA (200–500) và hạt siêu mịn extrafine (100–200 mcg). |
| 5 | `mometasone` | `["ics"]` | pMDI 200 mcg; Twisthaler DPI 200/400 mcg (Chưa lưu hành hít đơn chất tại VN) | `caution` / `caution` | Có | **Cần ghi chú nhỏ (R2-211):** Nên tách rõ khung liều pMDI (200–400 / >400) và DPI (tùy thiết bị theo GINA Box 4-2 trang 78). |
| 6 | `ciclesonide` | `["ics"]` | pMDI hạt siêu mịn 80/160 mcg (`Alvesco`) | `caution` / `caution` | Có | **Đạt chuẩn.** Tiền thuốc hoạt hóa tại phổi; liều 80–160 / >160–320 / >320 mcg/ngày khớp GINA Table 6. |
| 7 | `budesonide_formoterol` | `["ics","laba"]` (`budesonide`+`formoterol`), `qtRisk:"conditional"` | Turbuhaler 160/4.5, 80/4.5; Rapihaler 160/4.5; Spiromax 160/4.5 (`Symbicort`, `Bufoler`) | `compatible` / `compatible` | Có | **Đạt chuẩn cốt lõi.** Đề xuất bổ sung dạng `Rapihaler 80/2.25 mcg` (nhân đôi số nhát, trần 24 nhát/ngày theo BYT 1851 trang 19 & GINA Box 4-8B trang 92 — **R2-212**). |
| 8 | `beclometasone_formoterol` | `["ics","laba"]` (`beclometasone`+`formoterol`), `qtRisk:"conditional"` | pMDI / Nexthaler DPI 100/6 mcg (`Foster`, `Foster Nexthaler`) | `compatible` / `compatible` *(lệch SmPC)* | Có | **Cần chỉnh nhỏ (R2-209):** Bổ sung trần 8 nhát/ngày của nhãn EMA SmPC (trang 2) bên cạnh mốc 12 nhát của GINA, và đổi thai kỳ/cho bú sang `caution` khớp SmPC trang 7. |
| 9 | `fluticasone_salmeterol` | `["ics","laba"]` (`fluticasone_propionate`+`salmeterol`), `qtRisk:"conditional"` | Evohaler pMDI 50/25, 125/25, 250/25; Accuhaler DPI 100/50, 250/50, 500/50 (`Seretide`) | `compatible` / `compatible` | Có | **Đạt chuẩn xuất sắc sau Vòng 1.** Phân biệt rõ 2 nhát Evohaler × 2 vs 1 hít Accuhaler × 2; cấm tuyệt đối dùng làm MART. |
| 10 | `fluticasone_vilanterol` | `["ics","laba"]` (`fluticasone_furoate`+`vilanterol`), `qtRisk:"conditional"` | Ellipta DPI 100/25, 200/25 mcg (`Relvar Ellipta`) | `caution` / `caution` | Có | **Đạt chuẩn.** Hít 1 lần/ngày duy nhất, tối đa 200/25 mcg, không dùng cắt cơn. |
| 11 | `mometasone_formoterol` | `["ics","laba"]` (`mometasone`+`formoterol`), `qtRisk:"conditional"` | pMDI 100/5, 200/5 mcg (Chưa lưu hành tại VN; FDA: `Dulera`) | `caution` / `caution` | Có | **Đạt chuẩn.** Liều 2 nhát × 2 lần/ngày (tối đa 4 nhát/ngày). |
| 12 | `salbutamol` | `["saba"]`, `qtRisk:"conditional"` | pMDI 100 mcg; Khí dung 2.5–5 mg; Ống tiêm (`Ventolin`, `Salbutamol Danapha`) | `compatible` / `compatible` | Không áp dụng | **Đạt chuẩn.** Liều cấp cứu 4–10 nhát qua buồng đệm hoặc 5 mg khí dung mỗi 20 phút khớp BYT QĐ 5850 & GINA 2026. |
| 13 | `terbutaline` | `["saba"]`, `qtRisk:"conditional"` | Turbuhaler 0.5 mg; Respules 5 mg/2 ml; Ống tiêm (`Bricanyl`) | `compatible` / `compatible` | Không áp dụng | **Đạt chuẩn sau Vòng 1.** Trần tối đa 8 nhát/ngày (4 mg/24h) và cấm đơn trị không kèm ICS. |
| 14 | `ipratropium` | `["sama"]` | Khí dung 0.5 mg/2 ml (`Atrovent`, `Berodual`, `Combivent`) | `compatible` / `compatible` | Không áp dụng | **Đạt chuẩn.** Liều cấp cứu 0.5 mg khí dung hoặc 4–8 nhát pMDI mỗi 20 phút × 3 liều; có cảnh báo glôcôm góc đóng. *(Lưu ý lâm sàng: Berodual chứa thêm Fenoterol — không dùng đơn độc dài ngày theo GINA Summary p. 43).* |
| 15 | `montelukast` | `["ltra"]` | Viên nhai 4/5 mg, viên nén 10 mg, cốm 4 mg (`Singulair`, `Montiget`) | `compatible` / `caution` | Không áp dụng | **Đạt chuẩn hồ sơ JSON.** Liều người lớn ≥ 15 tuổi 10 mg buổi tối; có ghi FDA Boxed Warning (xem **R2-210** về logic rule). |
| 16 | `omalizumab` | `["biologic_asthma"]` | Bút tiêm/lọ 75 mg, 150 mg (`Xolair`) | `compatible` / `caution` | Không áp dụng | **Cần bổ sung nhỏ (R2-211):** Liều 75–600 mg TDD mỗi 2–4 tuần theo cân nặng & IgE và tuổi ≥ 6 chuẩn xác (dữ liệu thai kỳ EXPECT registry an toàn khớp GINA trang 164), nhưng cần ghi rõ hơn **FDA Boxed Warning về phản vệ muộn (~0.2%)** và tá dược polysorbate. |
| 17 | `benralizumab` | `["biologic_asthma"]` | Bút tiêm dưới da 30 mg/ml (`Fasenra`) | `caution` / `caution` | Không áp dụng | **Đạt chuẩn.** Liều ≥ 12 tuổi: 30 mg TDD mỗi 4 tuần × 3 liều đầu, sau đó mỗi 8 tuần; cảnh báo điều trị giun sán trước khi tiêm khớp `FDA_label_benralizumab.pdf` trang 1–3. |
| 18 | `tezepelumab` | `["biologic_asthma"]` | Bút tiêm dưới da 210 mg/1.91 ml (`Tezspire` - chưa lưu hành đại trà tại VN) | `caution` / `caution` | Không áp dụng | **Đạt chuẩn.** Liều ≥ 12 tuổi: 210 mg TDD mỗi 4 tuần, hiệu quả cả khi không tăng dấu ấn sinh học Type 2 (GINA trang 166). |
| 19 | `prednisolone` | `["systemic_corticosteroid"]` | Viên nén/sủi 5 mg, 20 mg (`Prednisolon`, `Solupred`) | `caution` / `compatible` | Không áp dụng | **Đạt chuẩn sau Vòng 1.** Liều đợt cấp người lớn 1 mg/kg/ngày (40–50 mg uống buổi sáng) × 5–7 ngày, không cần giảm liều dần nếu < 2 tuần. |
| 20 | `methylprednisolone` | `["systemic_corticosteroid"]` | Viên 4/16 mg; Lọ tiêm 40/125/500 mg (`Medrol`, `Solu-Medrol`) | `caution` / `caution` | Không áp dụng | **Đạt chuẩn.** Liều cấp cứu nội viện 40 mg tiêm tĩnh mạch khớp BYT QĐ 5850/2021 trang 17–18. |
| 21 | `magnesium_sulfate` | `["adjuvant_bronchodilator"]` | Ống tiêm truyền TM 15% (1.5 g/10 ml), 50% (5 g/10 ml) | `caution` / `compatible` | Không áp dụng | **Hồ sơ JSON tốt nhưng thiếu thực thi trong Rule (R2-205):** JSON đã ghi giảm 50% liều (1 g) khi `eGFR < 30` và chống chỉ định block tim/nhược cơ, nhưng `rules.ts` chưa kiểm tra khi kê đơn cấp cứu! |
| *(Tham chiếu)* | `dupilumab` | `["biologic_anti_il4ra"]` | Bút tiêm 300 mg/2 mL (`Dupixent`) | `caution` / `caution` | Không áp dụng | **Đạt chuẩn.** `rules.ts` đã chặn gợi ý Dupilumab khi BCAT máu > 1500/µL theo đúng GINA 2026 trang 166. |

---

## 3. CHI TIẾT CÁC PHÁT HIỆN VÒNG 2 (ROUND 2 FINDINGS)

### 🔴 MỨC ĐỘ NGHIÊM TRỌNG: `CRITICAL` (4 phát hiện – Có thể gây hại trực tiếp cho người bệnh nếu làm theo)

#### [ASTHMA-R2-201] `critical` | Rule `asthma.safety.mart_max_overuse` & Track 1 Outpatient Rules
- **Vấn đề:** Khi bệnh nhân ngoại trú đang dùng **Foster (`beclometasone_formoterol` 100/6 mcg)** hít vượt trần an toàn Formoterol (`totalDailyPuffsUsed > 12` nhát/ngày = `> 72 mcg` formoterol định liều), hệ thống vừa phát lệnh **`HOLD` đối với `beclometasone_formoterol`** và **`REFER` đi cấp cứu**, nhưng **ĐỒNG THỜI vẫn kê đơn `UPTITRATE` / `START` thêm bình thứ hai là `budesonide_formoterol` (Symbicort 160/4.5 mcg: 2 nhát × 2 lần/ngày + 1 nhát khi cần)**!
- **Bằng chứng kiểm chứng (`evaluate()` thực tế trong `round2_r2_audit.ts` – ca `MART-OVERUSE-FOSTER-14-PUFFS`):**
  - *Input:* Nữ 38 tuổi, `setting: 'outpatient'`, `currentTrack: 'track1'`, `currentStep: 3`, `totalDailyPuffsUsed: 14`, `currentMeds: [{ drugId: 'beclometasone_formoterol' }]`, triệu chứng không kiểm soát.
  - *Output:*
    1. `[HOLD] rec_asthma_mart_overuse` (`drugId: 'beclometasone_formoterol'`, prio 98): *"CẢNH BÁO QUÁ LIỀU MART: Đã dùng 14 nhát > 12 nhát/ngày – Tạm ngưng hít vượt trần & Đến cấp cứu ngay"*
    2. `[REFER] rec_asthma_mart_overuse_refer` (prio 99)
    3. **`[UPTITRATE] rec_asthma_track1_step4` (`drugId: 'budesonide_formoterol'`, prio 86, `dose: "160/4.5 mcg: 2 nhát x 2 lần/ngày duy trì + 1 nhát khi cần cắt cơn (tối đa 12 nhát/ngày)"`)**!
  - *Nguyên nhân gốc:* Ở bệnh nhân dùng Symbicort, cả lệnh `HOLD` và lệnh `UPTITRATE` đều mang `drugId: 'budesonide_formoterol'` nên `mergeRecommendations()` gộp lại thành `HOLD`. Nhưng khi bệnh nhân dùng Foster (`beclometasone_formoterol`), Rule 4A (`src/modules/asthma/rules.ts:467-478`) gán `HOLD` cho `beclometasone_formoterol`, còn các rule ngoại trú Track 1 (`rules.ts:1274-1660`) không kiểm tra `totalDailyPuffsUsed > 12` và luôn hardcode `drugId: 'budesonide_formoterol'`, khiến hai dòng tách rời nhau. Hít thêm Symbicort ngay trên nền đã quá liều > 72 mcg formoterol gây nguy cơ hạ kali máu nặng, kéo dài khoảng QT và loạn nhịp thất.
- **Đề xuất khắc phục:**
  1. Chặn không phát sinh các đơn điều trị ngoại trú thường quy (`track1_step1_2`, `track1_step3`, `track1_step4`, `step5_controller_continue`, `track2_maintenance`) khi `totalDailyPuffsUsed > thFor('inhalations_count', 'asthma.formoterol.mart_max_inhalations')` (vì người bệnh bắt buộc chuyển Cấp cứu ngay theo Rule 4B).
  2. Tôn trọng hoạt chất MART bệnh nhân đang dùng hợp lệ (`beclometasone_formoterol` 100/6 mcg hoặc `budesonide_formoterol` 160/4.5 mcg) thay vì luôn ép cứng sang `budesonide_formoterol`.

---

#### [ASTHMA-R2-202] `critical` | Rule `asthma.inpatient.discharge_plan` & Hàm `evaluateAcuteAsthma()`
- **Vấn đề:** Trong hàm phân tầng cấp cứu `evaluateAcuteAsthma()` (`src/modules/asthma/rules.ts:224-252`), câu lệnh thoát sớm `if (ci.acuteResponseAfter1h === 'good_response') return { hasAcuteAttack: false, isSevere: false, isLifeThreatening: false };` được đặt **PHÍA TRƯỚC** khối kiểm tra dấu hiệu nguy kịch đe dọa tử vong (`isLifeThreatening`: lồng ngực im lặng, lơ mơ/lú lẫn, không nói được, hoặc `PaCO2 > 45 mmHg`). Nếu trên giao diện nội viện/cấp cứu ô `acuteResponseAfter1h` đang ở giá trị `'good_response'` (ví dụ bệnh nhân đáp ứng thoáng qua ở giờ đầu rồi suy sụp đột ngột xuất hiện phổi im lặng hoặc tăng `PaCO2 = 58 mmHg` mà bác sĩ chưa xóa ô chọn cũ), engine **xóa sạch 100% báo động ICU và cả 4 thuốc cấp cứu**, đồng thời **kê đơn cho bệnh nhân nguy kịch xuất viện về nhà**!
- **Bằng chứng kiểm chứng (`evaluate()` thực tế trong `round2_r2_extra_checks.ts` – ca `lt_good_resp`):**
  - *Input:* Nam 40 tuổi, `setting: 'inpatient'`, `silentChest: true`, `mentalStatus: 'drowsy_confused'`, `speechAbility: 'unable'`, `paco2: 58`, `spo2: 84`, `acuteResponseAfter1h: 'good_response'`.
  - *Output:* Chỉ sinh `[START] rec_asthma_discharge_plan` (*"Kế hoạch xuất viện: Khởi trị/nâng bậc ICS-formoterol MART + Tái khám sau 2–7 ngày"*) và `[MONITOR] rec_asthma_action_plan_doc`. Hoàn toàn **0 REFER ICU, 0 Salbutamol, 0 Ipratropium, 0 Methylprednisolone, 0 Magnesium sulfate**!
- **Đề xuất khắc phục:**
  1. Đưa khối kiểm tra `isLifeThreatening` (và các dấu hiệu suy hô hấp cấp nặng như `spo2 < 90%`, `speech === 'words'`, `rr > 30`) lên **TRƯỚC** kiểm tra `acuteResponseAfter1h === 'good_response'` trong `evaluateAcuteAsthma()`.
  2. Trong `when()` của `asthma.inpatient.discharge_plan` (`rules.ts:1100`) và `asthma.action_plan.generate` (`rules.ts:1952`), bắt buộc xác nhận không còn bất kỳ dấu hiệu nguy kịch/suy hô hấp giảm oxy máu nào trước khi cho xuất viện.

---

#### [ASTHMA-R2-203] `critical` | Rules `beta_blocker_contra`, `aerd_nsaid_contra`, `laba_only_prohibited`, `sedative_contra`
- **Vấn đề:** Tất cả các quy tắc an toàn bắt thuốc chống chỉ định trong `src/modules/asthma/rules.ts` (dòng 417 `laba_only_prohibited`, dòng 553 `beta_blocker_contra`, dòng 598 `aerd_nsaid_contra`, dòng 1889 `sedative_contra`) đều dùng `.find(...)` và chỉ trả về **1 `Recommendation` duy nhất cho thuốc đầu tiên tìm thấy**, bỏ lọt hoàn toàn các thuốc chống chỉ định thứ hai trở đi trong `currentMeds`! Đồng thời, `src/engine/safety/reviewMeds.ts` (dòng 476) chỉ quét `['carvedilol', 'propranolol', 'nadolol', 'timolol', 'sotalol', 'labetalol']`, thiếu hẳn `timolol_ophthalmic`, `carteolol`, `levobunolol`.
- **Bằng chứng kiểm chứng (`evaluate()` thực tế trong `round2_r2_audit.ts` – ca `ASTHMA-ON-CARVEDILOL-AND-TIMOLOL-OPHTHALMIC`):**
  - *Input:* Nữ 65 tuổi mắc hen kèm tăng nhãn áp và bệnh tim mạch, `currentMeds: [{ drugId: 'budesonide_formoterol' }, { drugId: 'carvedilol', dose: '12.5 mg BID' }, { drugId: 'timolol_ophthalmic', name: 'Timolol 0.5% nhỏ mắt' }]`.
  - *Output:* Engine chỉ sinh `[AVOID] drugId='carvedilol'`, còn **`timolol_ophthalmic` hoàn toàn không có bất kỳ lệnh `STOP` hay `AVOID` nào**! Trên lâm sàng, thuốc nhỏ mắt Timolol 0.5% hấp thu trực tiếp qua niêm mạc ống lệ tị vào tuần hoàn hệ thống (không qua chuyển hóa bước đầu tại gan), đủ sức gây co thắt phế quản cấp tử vong ngay cả khi đã ngưng Carvedilol uống (GINA 2026 Strategy Report trang 113). Tương tự, bệnh nhân AERD dùng đồng thời `aspirin` 81 mg + `ibuprofen` chỉ được báo ngưng `aspirin` và bỏ lọt `ibuprofen`!
- **Đề xuất khắc phục:**
  1. Đổi `produce()` của cả 5 quy tắc an toàn (`beta_blocker_contra`, `aerd_nsaid_contra`, `laba_only_prohibited`, `saba_only_prohibited`, `sedative_contra`) từ `.find()` sang `.filter(...).map(...)` trả về mảng `Recommendation[]` cho **mọi** thuốc vi phạm trong `currentMeds` (ưu tiên dùng `action: 'STOP'` đối với thuốc bệnh nhân đang thực sự dùng; riêng chẹn beta uống lưu ý giảm liều dần/chuyển sang beta-1 chọn lọc liều thấp nếu có HFrEF/nhồi máu cơ tim).
  2. Phối hợp Agent B bổ sung `'timolol_ophthalmic'`, `'carteolol'`, `'levobunolol'`, `'pindolol'` vào `NON_SELECTIVE_BB` tại `src/engine/safety/reviewMeds.ts:476`.

---

#### [ASTHMA-R2-204] `critical` | Rules `track1_step3`, `track1_step4`, `track2_maintenance` & Tương tác với `merge.ts` / `duplicates.ts`
- **Vấn đề:** Khi bệnh nhân ngoại trú tăng bậc điều trị (`currentStep < targetStep`) từ một bình hít hoạt chất khác (ví dụ đang dùng **Foster `beclometasone_formoterol`**, **Seretide `fluticasone_salmeterol`**, **Relvar `fluticasone_vilanterol`**, hoặc **Pulmicort `budesonide`** đơn chất), các rule ngoại trú gán cứng `action = 'UPTITRATE'` cho `budesonide_formoterol` (hoặc `fluticasone_salmeterol`) **mà KHÔNG phát lệnh `SWITCH` / `STOP` cho bình hít cũ**! Do `src/engine/merge.ts` (dòng 673: `if (!r.drugId || r.action !== 'START') continue;`) chỉ tự động sinh lệnh `SWITCH` ngưng thuốc cũ khi `action === 'START'`, toa thuốc đầu ra **tồn tại đồng thời 2 bình hít chứa LABA và/hoặc ICS**, dẫn đến nguy cơ bệnh nhân hít song song cả 2 bình (quá liều LABA/ICS) và kích hoạt báo động trùng lặp ngay cả trên ca mẫu Preset 2 của hệ thống!
- **Bằng chứng kiểm chứng (`evaluate()` thực tế trong `round2_r2_audit.ts`):**
  1. **Ca `T1-FOSTER-STEP2-UNCONTROLLED-TO-STEP3`** (`currentMeds: [beclometasone_formoterol]`, Bậc 2 không kiểm soát): Sinh `[UPTITRATE] budesonide_formoterol` nhưng **không có lệnh ngưng `beclometasone_formoterol`** → Nổ báo động đỏ **`[CRITICAL] dup.laba: Trùng lặp thành phần LABA giữa các bình hít`** + `[WARNING] dup.ics`!
  2. **Ca `T1-SERETIDE-STEP3-UNCONTROLLED-TO-STEP4`** (`currentMeds: [fluticasone_salmeterol]`, Bậc 3 không kiểm soát trên Track 1): Sinh `[UPTITRATE] budesonide_formoterol` nhưng **không có lệnh ngưng `fluticasone_salmeterol`** → Nổ báo động đỏ **`[CRITICAL] dup.laba`** (Salmeterol + Formoterol) + `[WARNING] dup.ics`!
  3. **Ngay trên `Preset 2` (`preset_asthma_uncontrolled_step2`) và Golden Case `asthma_03_track1_step3_moderate`** (`currentMeds: [budesonide]`): Sinh `[UPTITRATE] budesonide_formoterol` không kèm lệnh ngưng `budesonide` → Nổ cảnh báo `[WARNING] dup.ics` ngay trên ca mẫu chính thức!
  4. *(Lỗi liên đới tại tầng lõi `duplicates.ts`)*: Ngay cả khi `action === 'START'` và `merge.ts` đã sinh đúng lệnh `SWITCH` ngưng bình cũ (như ca `FOSTER-CONTROLLED` và `T2-FLIXOTIDE-STEP2-UNCONTROLLED-TO-STEP3`), `src/engine/safety/duplicates.ts` dòng 381 lại cộng ngược `r.drugId` của lệnh `SWITCH` (vốn là thuốc cũ bị ngưng!) vào `effectiveActiveDrugs`, gây báo động giả `dup.laba` / `dup.ics`!
- **Đề xuất khắc phục:**
  1. Trong `src/modules/asthma/rules.ts`: Chỉ dùng `action = 'UPTITRATE'` khi bệnh nhân **đang dùng đúng `targetDrugId` đó** trong `currentMeds`; nếu chuyển sang hoạt chất mới từ bình hít khác, phải phát `action = 'START'` (để `merge.ts` tự sinh lệnh `SWITCH` ngưng bình cũ) hoặc phát tường minh cặp `SWITCH` (bình cũ) + `START` (bình mới).
  2. Hỗ trợ đầy đủ `beclometasone_formoterol` (Foster 100/6 mcg) như một lựa chọn MART chuẩn của Track 1 theo GINA 2026 Box 4-8 (trang 90–92) để bệnh nhân đang dùng Foster được giữ nguyên/chuẩn độ trên chính Foster thay vì bị ép chuyển sang Symbicort.
  3. Báo Agent B sửa `src/engine/safety/duplicates.ts:345, 381` (không đưa `r.drugId` của lệnh `SWITCH` — thuốc cũ đã ngưng — vào `effectiveActiveDrugs`).

---

### 🟠 MỨC ĐỘ NGHIÊM TRỌNG: `MAJOR` (4 phát hiện – Sai lệch hướng dẫn/liều thận cấp cứu, thiếu y lệnh Class I xuất viện hoặc thiếu tương tác/hòa giải liên chuyên khoa)

#### [ASTHMA-R2-205] `major` | Rule `asthma.inpatient.severe_magnesium_sulfate`
- **Vấn đề:** Y lệnh truyền tĩnh mạch `magnesium_sulfate` 2 g trong cơn hen cấp nặng/nguy kịch (`src/modules/asthma/rules.ts:947-977`) hoàn toàn không kiểm tra suy thận nặng / lọc máu (`eGFR < 30 mL/phút/1.73m²` hoặc `onDialysis: true`) và tình trạng tụt huyết áp (`SBP < 90 mmHg`), vẫn kê cứng liều đầy đủ **2 g** với `gates: []`, `warnings: []`.
- **Bằng chứng kiểm chứng:**
  - Hồ sơ `kb/drugs/magnesium_sulfate.json` (dòng 24–29) đã quy định rõ: `eGFRTo: 30, initiate: "caution", doseVi: "Thận trọng tối đa / Giảm 50% liều (1 g) và theo dõi nồng độ Mg máu, phản xạ gân xương"`. Tuy nhiên `src/engine/safety/gates.ts:358` chỉ chặn khi `initiate === 'contra'` (bỏ qua hoàn toàn `'caution'`).
  - Chạy `evaluate()` thực tế (`ACUTE-LIFE-THREATENING-CKD-G5-HYPOTENSION`: `egfr: 12, onDialysis: true, sbp: 82`): Engine phát `[START] magnesium_sulfate` liều đầy đủ **2 g pha truyền TM trong 20 phút** mà không giảm liều 50% (1 g) và không có bất kỳ cảnh báo nguy cơ ngộ độc magie (liệt cơ hô hấp, mất phản xạ gân xương, block nhĩ thất) hay tụt huyết áp giãn mạch nào.
- **Đề xuất khắc phục:** Kiểm tra `need(ctx, 'egfr')`, `ctx.patient.onDialysis` và `need(ctx, 'sbp')` ngay trong `asthma.inpatient.severe_magnesium_sulfate`: khi `egfr < 30` hoặc `onDialysis === true`, hiệu chỉnh liều xuống `1 g` (giảm 50% liều theo `magnesium_sulfate.json`) hoặc chuyển sang `CONSIDER` thận trọng tối đa kèm `gates` & `warnings` theo dõi sát phản xạ gân xương, ECG và Mg máu; cảnh báo rõ nếu `sbp < 90 mmHg`.

---

#### [ASTHMA-R2-206] `major` | Rule `asthma.inpatient.discharge_plan`
- **Vấn đề:** Quy tắc lập đơn xuất viện sau cơn hen cấp (`src/modules/asthma/rules.ts:1095-1141`) có 2 khiếm khuyết dược lâm sàng quan trọng:
  1. **Thiếu y lệnh thuốc Corticosteroid đường uống (`prednisolone` 40–50 mg/ngày × 5–7 ngày, Evidence A) trong mảng `recommendations`:** Khi `acuteResponseAfter1h === 'good_response'`, `evaluateAcuteAsthma()` tắt toàn bộ các rule cấp cứu nội viện (kể cả Rule 13B `prednisolone`), trong khi `discharge_plan` chỉ phát duy nhất 1 thuốc là `budesonide_formoterol`. Hậu quả là danh mục thuốc xuất viện mất hẳn dòng y lệnh `prednisolone` (chỉ còn câu chữ phụ nằm sâu trong `rationale`). Ngoài ra, nếu bệnh nhân trước nhập viện đã dùng `budesonide_formoterol` liều thấp, `merge.ts` tự động biến `START` thành `CONTINUE` giữ nguyên liều cũ thay vì khởi đầu ở mức **Bậc 4 MART** như GINA 2026 quy định.
  2. **Xung đột thiết bị pMDI vs DPI ngay trong cùng một bộ hồ sơ xuất viện:** Dòng 1121 & 1124 lấy cứng phần tử mảng `budForm.forms[1]` = `"Bình xịt định liều Rapihaler 160/4.5 mcg"` (thiết bị **pMDI** — mà GINA 2026 Box 4-8B trang 92 ghi rõ *"For ICS-formoterol by pMDI, use of a spacer is recommended"*). Thế nhưng ngay bên dưới, `rec_asthma_action_plan_doc` (`actionPlan.ts:69, 90`) xuất ra cùng lúc lại dặn bệnh nhân: *"với Turbuhaler 160/4.5... Bình bột khô Turbuhaler/DPI tuyệt đối KHÔNG dùng qua buồng đệm"*!
- **Bằng chứng nguyên văn:** `GINA_2026_Strategy_Report.pdf` Box 9-5 (trang 184): *"Inhaled corticosteroids (ICS): The preferred regimen for adults/adolescents is maintenance-and-reliever therapy with ICS-formoterol (MART), starting at Step 4... Oral corticosteroids (OCS): Prescribe prednisone/prednisolone 40–50 mg/day for 5–7 days for adults."* và `BYT_5850_2021` (trang 17): *"ĐƠN CHO VỀ: Thuốc cắt cơn: tiếp tục khi cần; Thuốc kiểm soát: bắt đầu hoặc nâng bước; Prednisolone: tiếp tục, thường 5-7 ngày"*.
- **Đề xuất khắc phục:** (1) Phát sinh thêm `Recommendation` độc lập cho `drugId: 'prednisolone'` (`40–50 mg uống buổi sáng hoàn tất đủ đợt 5–7 ngày, không cần giảm liều dần`) khi xuất viện; (2) Khuyến cáo phác đồ MART xuất viện ở mức Bậc 4 (`2 nhát × 2 lần/ngày + 1 nhát khi cần`, dùng `UPTITRATE` nếu đang dùng Bậc 1–3); (3) Bỏ hardcode `budForm.forms[1]`, đồng bộ hướng dẫn thiết bị giữa đơn xuất viện và `actionPlan.ts`.

---

#### [ASTHMA-R2-207] `major` | Thiếu tương tác thuốc `ix.ics_laba_strong_cyp3a4`
- **Vấn đề:** Hệ thống chưa có bất kỳ mục tương tác (`kb/interactions/*.json`) hay quy tắc an toàn (`rules.ts`) nào phát hiện tương tác dược động học nghiêm trọng giữa các ICS / LABA chuyển hóa mạnh qua CYP3A4 (`fluticasone_propionate`, `fluticasone_salmeterol`, `fluticasone_vilanterol`, `budesonide`, `budesonide_formoterol`, `mometasone`, `mometasone_formoterol`) với nhóm ức chế mạnh CYP3A4 (`ritonavir`, `cobicistat`, `itraconazole`, `ketoconazole`, `clarithromycin`).
- **Bằng chứng kiểm chứng:**
  - `GINA_2026_Strategy_Report.pdf` (trang 42, 47, 133, 245, 246): *"Concomitant treatment with cytochrome P450 inhibitors such as ketoconazole, ritonavir, itraconazole, erythromycin and clarithromycin may increase the risk of ICS adverse effects such as adrenal suppression, and with short-term use, may increase the risk of cardiovascular toxicity of the LABA. Product information indicates that for patients taking ICS-salmeterol or ICS-vilanterol, concomitant treatment with CYP3A4 inhibitors is not recommended."* (tương tự `FDA_label_budesonide_formoterol.pdf` Section 5.9 trang 10 & 16).
  - Chạy `evaluate()` thực tế (`CYP3A4-INHIBITOR-PLUS-SERETIDE` với `currentMeds: [fluticasone_salmeterol, clarithromycin, itraconazole, ritonavir]`): Kết quả `alerts = []`, `warnings = []` (im lặng hoàn toàn).
- **Đề xuất khắc phục:** Bổ sung tương tác mức `contraindicated`/`major` trong `kb/interactions/diabetes_respiratory.json` (hoặc rule an toàn trong `asthma/rules.ts`) cảnh báo nguy cơ hội chứng Cushing do thuốc, suy thượng thận cấp và kéo dài khoảng QT do tăng nồng độ salmeterol/vilanterol; gợi ý đổi kháng sinh macrolide/azole hoặc chuyển sang ICS ít phụ thuộc CYP3A4 như `beclometasone` (`Foster_Fostair_SmPC.pdf` trang 7).

---

#### [ASTHMA-R2-208] `major` | Xung đột đa bệnh lý tại `hf.fmt.bb` (`src/modules/hf/rules.ts`)
- **Vấn đề:** Khi bệnh nhân đồng mắc **Suy tim phân suất tống máu giảm (HFrEF) + Hen phế quản** (`selectedModules: ['asthma', 'hf']`, `conditions: { asthma: true, hf: true }`), khuyến cáo trụ cột chẹn beta của module Suy tim (`rec_hf_bb`, `src/modules/hf/rules.ts:455`) vẫn xuất cứng tên thuốc `"Bisoprolol (hoặc Carvedilol, Metoprolol succinate)"` và `warnings: []`, gợi ý trực tiếp **Carvedilol** — thuốc chẹn cả β1, β2 và α1 bị chống chỉ định tuyệt đối ở người bệnh hen!
- **Bằng chứng kiểm chứng (`round2_r2_extra_checks.ts` – ca `hf_ast`):** `rec_hf_bb` trả về `"drugNameVi": "Bisoprolol (hoặc Carvedilol, Metoprolol succinate)"`. Nếu bác sĩ kê Carvedilol theo gợi ý ngoặc đơn này, bệnh nhân hen có nguy cơ co thắt phế quản cấp đe dọa tính mạng (GINA 2026 Strategy Report trang 113) và mâu thuẫn trực tiếp với `asthma.safety.beta_blocker_contra`.
- **Đề xuất khắc phục:** Phối hợp chủ sở hữu module `hf` (Agent G) cập nhật `src/modules/hf/rules.ts:455` (hoặc xử lý tại tầng gộp đa bệnh): Khi `hasCondition(ctx, 'asthma') === true`, loại bỏ `"Carvedilol"` khỏi `drugNameVi` (chỉ giữ chẹn beta-1 chọn lọc `"Bisoprolol (hoặc Metoprolol succinate)"`) và gắn lưu ý khởi trị liều thấp nhất dưới sự giám sát sát triệu chứng co thắt phế quản khi hen đã ổn định.

---

### 🟡 MỨC ĐỘ NGHIÊM TRỌNG: `MINOR` & `SUGGESTION` (4 phát hiện – Chuẩn hóa nhãn thuốc EMA/FDA, tư vấn cảnh báo hộp đen và hàm lượng lưu hành tại Việt Nam)

#### [ASTHMA-R2-209] `minor` | DrugEntry `beclometasone_formoterol.json`
- **Vấn đề & Bằng chứng:** Tờ thông tin sản phẩm gốc `09_Nhan_Thuoc/EMA/Foster_Fostair_SmPC.pdf` quy định tại trang 2 (Section 4.2 – MART): *"The maximum daily dose is 8 inhalations"* (48 mcg formoterol), và tại trang 7 (Section 4.6): *"Formoterol should not be recommended for use during pregnancy and particularly at the end of pregnancy or during labour unless there is no other (safer) established alternative. Fostair should only be used during pregnancy if the expected benefits outweigh the potential risks... Administration of Fostair to women who are breast-feeding should only be considered if the expected benefits outweigh the potential risks."* Hiện `kb/drugs/beclometasone_formoterol.json` ghi `dosing.max = "12 nhát/ngày"` (theo mở rộng của GINA 2026 trang 45 chú thích `‡`) mà chưa ghi chú trần 8 nhát/ngày trên nhãn thuốc được duyệt, đồng thời để `pregnancy.status = "compatible"` và `lactation.status = "compatible"`.
- **Đề xuất khắc phục:** Ghi rõ cả hai mốc trong `dosing.max` (`8 nhát/ngày theo tờ HDSD EMA SmPC/VN; GINA 2026 cho phép tạm thời tối đa 12 nhát/ngày trước khi phải nhập cấp cứu`) và đổi `pregnancy.status` / `lactation.status` sang `"caution"`.

#### [ASTHMA-R2-210] `minor` | Rule `asthma.safety.montelukast_mental`
- **Vấn đề & Bằng chứng:** Sau khi sửa lỗi `||` thành `isTakingMontelukast && hasPsychRisk` ở Vòng 1 (`rules.ts:704`), những bệnh nhân đang uống `montelukast` nhưng chưa có tiền sử trầm cảm (`depression: false, priorNeuropsychiatric: false` – ca `MONTELUKAST-NO-PSYCH-HISTORY`) không nhận được bất kỳ lời dặn theo dõi nào, dù FDA Boxed Warning (2020) và GINA 2026 (trang 98, 246) cảnh báo biến cố tâm thần kinh nghiêm trọng xảy ra cả ở người chưa từng có bệnh lý tâm thần trước đó.
- **Đề xuất khắc phục:** Khi `isTakingMontelukast === true`: nếu `hasPsychRisk === true` thì phát khuyến cáo `CONSIDER`/`AVOID` đổi sang ICS; nếu `hasPsychRisk === false` vẫn phát một dòng `MONITOR` ngắn gọn (priority ~55) dặn ngưng Montelukast ngay nếu xuất hiện rối loạn giấc ngủ, ác mộng, kích động hoặc thay đổi tâm trạng.

#### [ASTHMA-R2-211] `minor` | DrugEntry `omalizumab.json` & `mometasone.json` / `matrices.ts`
- **Vấn đề & Bằng chứng:** (1) `omalizumab.json` chưa nêu đầy đủ nội dung **FDA Boxed Warning** của Xolair về sốc phản vệ (~0.2%, có thể xảy ra ngay liều đầu hoặc khởi phát muộn sau > 2 giờ hay sau > 1 năm điều trị ổn định, bắt buộc tiêm tại cơ sở y tế có phương tiện cấp cứu phản vệ) và cảnh báo dị ứng tá dược polysorbate mới nhấn mạnh trong GINA 2026 trang 163–164. (2) GINA 2026 Box 4-2 trang 78 tách riêng `Mometasone furoate (pMDI, HFA): Low 200–400, High >400` và `Mometasone furoate (DPI): Depends on DPI device`, trong khi `mometasone.json` gộp chung cả Twisthaler DPI và pMDI vào một khung liều.
- **Đề xuất khắc phục:** Bổ sung chi tiết FDA Boxed Warning phản vệ muộn & cảnh báo polysorbate vào `omalizumab.json`; bổ sung ghi chú phân biệt pMDI HFA vs DPI cho Mometasone trong `mometasone.json` và `matrices.ts`.

#### [ASTHMA-R2-212] `suggestion` | DrugEntry `budesonide_formoterol.json` & Trường `gates` trong JSON thuốc
- **Vấn đề & Bằng chứng:** (1) Bộ Y tế QĐ 1851/2020 (trang 19: *"Formoterol/budesonide 4,5/160 mcg; 4,5/80 mcg; 2,25/80 dạng pMDI"*) và GINA 2026 Box 4-8B (trang 92) ghi nhận bình xịt **Symbicort Rapihaler 80/2.25 mcg** lưu hành rất phổ biến tại Việt Nam và bắt buộc phải **nhân đôi số nhát xịt** (2 nhát = 160/4.5 mcg; trần tối đa 24 nhát/24 giờ), nhưng `budesonide_formoterol.json` hiện chỉ liệt kê Rapihaler 160/4.5 mcg. (2) 8 file JSON thuốc của module Hen có khai báo trường `"gates"` nhưng `src/engine/safety/gates.ts` hiện chưa đọc trường này để thực thi tự động.
- **Đề xuất khắc phục:** Bổ sung dạng `Bình xịt định liều Rapihaler 80/2.25 mcg (nhân đôi số nhát xịt, tối đa 24 nhát/ngày)` vào `budesonide_formoterol.json`; đồng bộ vai trò của `kbDrug.gates` với Agent B.

---

## 4. TỔNG HỢP SỐ LƯỢNG PHÁT HIỆN & KẾT LUẬN CUỐI CÙNG

| Mức độ (Severity) | Số lượng | Mã phát hiện |
| :--- | :---: | :--- |
| **`critical`** | **4** | `ASTHMA-R2-201`, `ASTHMA-R2-202`, `ASTHMA-R2-203`, `ASTHMA-R2-204` |
| **`major`** | **4** | `ASTHMA-R2-205`, `ASTHMA-R2-206`, `ASTHMA-R2-207`, `ASTHMA-R2-208` |
| **`minor`** | **3** | `ASTHMA-R2-209`, `ASTHMA-R2-210`, `ASTHMA-R2-211` |
| **`suggestion`** | **1** | `ASTHMA-R2-212` |
| **TỔNG CỘNG** | **12** | |

**KẾT LUẬN KIỂM ĐỊNH VÒNG 2 (R2 – DƯỢC LÂM SÀNG):** **FAIL** *(4 critical, 4 major, 3 minor, 1 suggestion — yêu cầu khắc phục triệt để toàn bộ 4 lỗi `critical` và 4 lỗi `major` trước khi xét duyệt vòng tiếp theo).*
