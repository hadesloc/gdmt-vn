# Hen R4 — MgSO4: nguồn, chỉ định và an toàn

Ngày 2026-10-28. Phạm vi: ASTHMA-R4-R3-03, phần MgSO4 của R1-06/R2-10 và hồi quy gộp lệnh Hen–THA/sản khoa. Phần citation dị ứng DPI của R1-06 vẫn còn; không tuyên bố đóng toàn bộ finding này. Chờ review lâm sàng độc lập; không nâng `ai_multi_reviewed`.

## Kết quả triển khai

Trước sửa, nhịp chậm 49/phút có thể khiến cơn hen được xếp nguy kịch rồi tự nhận MgSO4. Nhánh thận tự tính 1 g từ các trích dẫn không chứa liều hen suy thận; nguồn varenicline/aminoglycoside được gắn nhầm cho MgSO4. Bộ tái hiện ban đầu: 12/16 test thất bại.

- Tách luật MgSO4 sang `rules.acute.magnesium.ts`, giữ rule ID. Chặn nhịp chậm rõ, nhược cơ, rối loạn dẫn truyền, tụt huyết áp, mất nước/giảm thể tích; giữ thuốc giãn phế quản hít, steroid và chuyển Hồi sức theo các luật cơn hen khác.
- Thiếu HR/SBP/chức năng thận, GFR giảm, AKI, thiểu/vô niệu hoặc lọc máu: `DEFER`, không mang liều MgSO4 suy đoán. Bỏ threshold liều hen thận 1 g và threshold thận 30 được gán nguồn không đúng; sửa DrugEntry và lưu review cũ vào `reports/.../retired-reviews/`.
- Mốc eGFR 60 là **chính sách yêu cầu xác nhận liều khi GFR thuộc dải G3–G5**, suy luận từ phân tầng KDIGO và cảnh báo thận của nhãn MgSO4. Đây không phải ngưỡng chỉnh liều trên nhãn và không chẩn đoán CKD từ một xét nghiệm. Mốc HR 50 dựa trên định nghĩa nhịp chậm của AHA kết hợp cảnh báo nhịp chậm rõ trên nhãn; mốc SBP 90 là triage huyết động, không ghi thành ngưỡng chống chỉ định định lượng riêng của nhãn MgSO4.
- Không tự START chỉ vì cơn hen nặng/nguy kịch. Liều chuẩn chỉ xuất khi có tiêu chí đáp ứng kém sau giờ đầu kèm giảm oxy còn tồn tại, hoặc FEV1 rất thấp theo nhánh nguồn đang dùng. Chưa đủ tiêu chí: `CONSIDER` không có liều. Nếu đã ghi nhận đang dùng MgSO4: xác nhận tổng liều/thời điểm trước khi truyền thêm.
- Cổng dùng chung nhận đúng mã `av_block_2_3` thay cho mã `heart_block` không được xử lý; thêm SSS/nhịp chậm và hỗ trợ cờ `myasthenia_gravis` ngoài camelCase.
- Phát hiện test liên phân hệ cũ dùng các tên customInput không thực sự kích hoạt luật cơn hen. Ca mới dùng đúng input xác nhận: chỉ tránh liều chồng của Hen thì phát `MONITOR` không drugId, giữ một lệnh sản khoa từ HTN; nếu thật sự có nhược cơ thì `AVOID` có drugId vẫn thắng khi gộp. Không lấy liều hen thay cho liều sản khoa.

## Nguồn local đã đọc

1. GINA 2026 Strategy và BYT 1851/2020 hiện có: chỉ định bổ trợ/liều đơn chuẩn trong hen. Không suy ra liều thận 1 g từ cụm “after 1 hour”.
2. `03_Cap_Cuu/AHA_2025_CPR_ECC_Part09_Adult_Advanced_Life_Support.pdf`, PDF p37 / S574, định nghĩa nhịp chậm. [Bài gốc AHA](https://doi.org/10.1161/CIR.0000000000001376).
3. `09_Nhan_Thuoc/WHO/WHO_Inresa_Magnesium_Sulfate_2025_SmPC.pdf`, p2 chống chỉ định, p4 theo dõi/cảnh báo thận. [SmPC SRA-approved do WHO lưu trữ](https://extranet.who.int/prequal/sites/default/files/whopar_files/RH062%20part4v2.pdf).
4. KDIGO 2024 CKD Table 2 hiện có: phân tầng GFR; không phải nguồn liều MgSO4.

Tìm ban đầu theo tên file AHA quá hẹp đã bỏ sót bộ ALS đầy đủ local. Đã thay nguồn AHA online-only tạm thời bằng PDF local có hash, không để lại cảnh báo thiếu snapshot. Hai nguồn được đăng ký, bốn citation mới; không bịa nội dung PDF hoặc trạng thái review. DrugEntry/ngưỡng sửa hoặc mới đều `draft` với hash cập nhật; review cũ được lưu trong backup.

## Tệp và kiểm chứng

- Engine: `src/engine/safety/contraCodeMatcher.ts`.
- Hen: `src/modules/asthma/rules.acute.ts`, `rules.acute.inpatient.ts`, file mới `rules.acute.magnesium.ts`.
- KB: `sources.json`, `citations/asthma_magnesium_safety.json`, `drugs/magnesium_sulfate.json`, `thresholds/asthma.json` và các review tương ứng.
- Hai suite mới: `tests/modules/asthma/r4_magnesium_safety.test.ts` và `tests/engine/magnesiumSafety.test.ts`.
- Golden 54 bỏ kỳ vọng 1 g; năm golden thiếu creatinine chờ xác nhận MgSO4 nhưng giữ hồi sức đầu tay; golden 44 được bổ sung creatinine để tiếp tục kiểm tra nhánh START có chỉ định. Giữ các ID/filename golden lịch sử. Invariant không còn buộc MgSO4 hoạt động ở mọi cơn nguy kịch bất chấp nhịp chậm, chỉ định hoặc dữ liệu an toàn.
- Bốn suite liên quan: **1.102 PASS, 9 skipped**, gồm golden toàn dự án, Hen, engine và phối hợp Hen–THA. Trong đó hai suite mới tổng 28 test (22 Hen, 6 engine).
- Full suite cuối trên bản đã chốt: **84/84 file PASS; 2.000 test PASS, 9 skipped (2.009 tổng)**, 196,96 giây. Log `vitest-final.log`.
- `npm run build` trên bản mã cuối: PASS, gồm TypeScript strict và verify:kb. KB **129 nguồn, 1.505 citation, 949 ngưỡng, 179 thuốc, 1.367 review; 0 lỗi, 0 cảnh báo**. Report `reports/kb/verify_2026-10-28T07-09-45-638Z.json`; log `build-final.log`. PWA tạo 63 mục precache; cảnh báo chunk >500 KB đã biết vẫn còn.
- Verifier độc lập đọc nguồn/logic và chạy test nhánh Hen–sản khoa; không phát hiện lỗi còn lại trong phạm vi được giao. Không thay thế vòng clinical review R1/R2/R3.

Backup/diff/log/script: `reports/asthma-r4-magnesium-20261028/`. `prepare.py` và `use_local_aha.py` ghi lại thao tác một lần, không chạy lại; `capture_diff.py` chỉ đọc để tái tạo diff. Task này không chạy lại browser/E2E, không nghiệm thu toàn bộ phác đồ sản khoa hoặc toàn bộ chống chỉ định của mọi chế phẩm MgSO4.
