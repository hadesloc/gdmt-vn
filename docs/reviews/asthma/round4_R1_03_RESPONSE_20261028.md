# ASTHMA-R4-R1-03 — Giới hạn tuổi riêng của bình ba thuốc

Ngày 2026-10-28. Đã sửa triển khai; chờ vòng review lâm sàng độc lập xác nhận đóng finding. Không nâng trạng thái `ai_multi_reviewed`.

## Vấn đề và kết quả

Mã hiện tại đã có Trimbow trong danh mục chỉ dành người lớn, nhưng vẫn xếp Breztri vào cùng danh mục. Bệnh nhân hen 12–17 tuổi đang dùng Breztri bị STOP sai, mất nhánh duy trì nội trú/xuất viện và nhận kế hoạch chuyển về ICS/LABA khác. Test tái hiện ban đầu: 8/16 thất bại.

- Gỡ budesonide/glycopyrronium/formoterol và alias Breztri khỏi `ADULT_18_ONLY_DRUGS`. Giữ chặn Trimbow, Trelegy, Enerzair dưới 18 tuổi; giới hạn dưới 12 tuổi và thiếu tuổi của Breztri vẫn được chặn bởi phạm vi module và KB gate hiện có.
- Hoàn chỉnh câu cuối citation GINA trang 246 và sửa tư vấn bậc 5: Breztri có chỉ định hen từ 12 tuổi theo FDA/GINA 2026; các bình ba thuốc khác vẫn 18+. Chỉ tư vấn chuyên khoa cân nhắc đúng hàm lượng và khả năng tiếp cận địa phương, không tự khởi trị mới bình ba thuốc cho thiếu niên.
- Quy về ID thuốc chuẩn khi chọn controller/bình ba thuốc trong luật Hen và helper ACO, giữ hành vi nhất quán cho `breztri`, `breztri_aerosphere` và thứ tự thành phần khác.
- Test mở rộng phát hiện lỗi alias đang dùng với ritonavir: `resolveControllerAction` không nhận alias là ICS đang dùng, tạo START thay vì SWITCH; merger ưu tiên giữ bình ba thuốc hiện có rồi ghi đè khuyến cáo cầu nối. Chuẩn hóa ID ở cả nhánh mục tiêu và thuốc đang dùng giúp phát SWITCH thực sự sang beclometasone. Test xác nhận không còn kê dùng triple tương tác và vẫn có ICS thay thế.

## Nguồn đã đối chiếu

- GINA 2026 Strategy Report, PDF trang 246: bình ba thuốc Trimbow/Trelegy/Enerzair từ 18 tuổi; riêng budesonide/formoterol/glycopyrronium từ 12 tuổi. Đọc trực tiếp PDF local tại `Medical_Library_2026/01_Noi_Khoa/Ho_Hap/GINA_2026_Strategy_Report.pdf`.
- [FDA Breztri label 04/2026](https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/212122s009lbl.pdf), mục 1.1/1.2, PDF trang 4: phân biệt COPD người lớn với hen từ 12 tuổi. Đối chiếu PDF local đã đăng ký `FDA_label_budesonide_glycopyrronium_formoterol.pdf`.
- [Trimbow SmPC](https://www.medicines.org.uk/emc/product/13816/smpc), mục 4.2: chưa xác lập an toàn/hiệu quả điều trị hen ở người dưới 18 tuổi.

Không thêm nguồn, ngưỡng hoặc thay đổi hồ sơ thuốc. Citation `gina.asthma.2026.triple_tiotropium_age_limits` được bổ sung câu ngoại lệ còn thiếu, khớp PDF hiện có; không đổi citation ID.

## Phạm vi tệp và bằng chứng

- `src/modules/asthma/helpers.constants.ts`, `helpers.clinical.ts`, `helpers.dosing.ts`.
- `src/modules/asthma/rules.safety.age_allergy.ts`, `rules.track2.step5.ts`, `rules.track2.support.ts`, `rules.acute.discharge.ts`.
- `src/modules/copd/helpers.aco.ts`: đồng bộ ID trong mô phỏng controller do module Hen kê để khử trùng đơn; caller yêu cầu đã chọn Hen. Không phải tuyến chọn thuốc COPD đơn độc.
- `kb/citations/asthma.json`; test mới `tests/modules/asthma/r4_triple_age.test.ts`.
- Backup, diff gồm tệp mới, log đỏ và log nghiệm thu: `reports/asthma-r4-triple-age-20261028/`. Tái tạo diff bằng `capture_diff.py`; `update.py` lưu thao tác triển khai một lần, không dùng để chạy lại bản sửa.

## Kiểm chứng

- Full suite cuối `npx vitest run --maxWorkers=4`: **82/82 file PASS; 1.972 test PASS, 9 skipped (1.981 tổng)**, 178,56 giây. Log `vitest-final.log`. `npm run typecheck` riêng sau khi chốt test: PASS (`typecheck-final.log`).
- Suite mới cuối: **27/27 PASS**. Bao phủ tuổi 11/12/14/17/18/thiếu tuổi; alias; ba profile; nội trú ổn định; xuất viện; tài liệu; Hen–COPD; ritonavir; và alias đã trùng mục tiêu không bị START lại. Log `targeted-final.log`.
- `npm run build` cuối: PASS, gồm TypeScript strict và verify:kb. **127 nguồn, 1.501 citation, 949 ngưỡng, 179 thuốc; 0 lỗi, 0 cảnh báo KB**. Log `build-final.log`; report KB `reports/kb/verify_2026-10-28T05-12-15-550Z.json`.
- PWA tạo 63 mục precache; cảnh báo chunk >500 KB đã biết vẫn còn. Không chạy lại E2E giao diện trong task này.
- Verifier độc lập đã đọc diff, trace caller ACO và kiểm tra thay đổi helper chọn controller; không phát hiện lỗi còn lại trong phạm vi này. Đây là kiểm định mã, không phải vòng clinical review sạch.

## Việc còn lại

Giới hạn tuổi trong task này dành cho chỉ định hen; không áp ngoại lệ 12+ sang chỉ định COPD. Nhãn FDA phân biệt hàm lượng glycopyrrolate cho hen và COPD; task này giữ đơn đang dùng và yêu cầu chuyên khoa xác nhận, chưa nghiệm thu mọi lựa chọn hàm lượng/thiết bị của chín module. Các finding MgSO4, DPI và phần còn lại của R4 cần xử lý riêng, sau đó chạy lại đầy đủ R1/R2/R3.
