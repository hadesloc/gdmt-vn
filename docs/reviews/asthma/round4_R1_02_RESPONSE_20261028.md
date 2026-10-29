# ASTHMA-R4-R1-02 — Salmeterol và dị ứng protein sữa theo thiết bị

Ngày: 2026-10-28. Phạm vi: một mục review Hen vòng 4; không phải nghiệm thu toàn dự án.

## Kết quả

Đã tái hiện và sửa việc chặn nhầm Seretide Evohaler pMDI do engine phân rã phối hợp fluticasone/salmeterol rồi áp mã chống chỉ định protein sữa của salmeterol cho mọi dạng bào chế. Trước sửa, 4/5 test hồi quy thất bại; sau sửa, toàn bộ 8 test hồi quy đạt.

- Gỡ mã chống chỉ định protein sữa ở cấp hoạt chất salmeterol; giữ cảnh báo theo dạng bào chế và gắn nhãn GSK đúng thuốc.
- Chuyển salmeterol/Serevent từ danh sách chỉ có DPI sang danh sách nhiều dạng bào chế của module Hen. Accuhaler vẫn kích hoạt cảnh báo đổi thiết bị; Evohaler pMDI không bị coi là DPI.
- Salmeterol chưa ghi rõ thiết bị có cảnh báo xác minh trước khi dùng/cấp phát.
- Hướng dẫn Seretide Bậc 5 ghi rõ pMDI không chứa lactose, qua buồng đệm, không cấp dạng Accuhaler/Diskus. Bậc 3–4 đã có hướng dẫn pMDI và được kiểm tra hồi quy.
- Bổ sung ba nguồn HTML GSK, ba trích dẫn mục 6.1 có bản lưu cục bộ và SHA-256. Nguồn HTML không gắn trang PDF giả.
- Đưa `kb/review/salmeterol.json` về `draft`, cập nhật hash; báo cáo review trước sửa lưu trong bản sao trước thay đổi. Không cấp trạng thái AI đã duyệt cho nội dung mới.

## Tệp thay đổi

1. `kb/drugs/salmeterol.json`
2. `kb/review/salmeterol.json`
3. `kb/sources.json` — chỉ nối thêm ba nguồn, giữ nguyên nguồn cũ.
4. `kb/citations/asthma_milk_device.json` — tệp mới.
5. `src/modules/asthma/helpers.constants.ts`
6. `src/modules/asthma/rules.safety.age_allergy.ts`
7. `src/modules/asthma/rules.track2.step5.ts`
8. `tests/modules/asthma/r4_milk_device.test.ts` — tệp mới.

Bản sao trước thay đổi và diff: `reports/asthma-r4-milk-device-20261028/`. Script `register_sources.py` ghi lại cách đăng ký nguồn đã tải. Ba snapshot được lưu trong `Medical_Library_2026/09_Nhan_Thuoc/EMA/GSK_*_SmPC.html`.

## Kiểm chứng

- `npx vitest run tests/modules/asthma/r4_milk_device.test.ts tests/modules/asthma/golden.test.ts tests/modules/asthma/r4_inpatient_acute.test.ts --maxWorkers=2`: **155/155 PASS**, 3 tệp (gồm 8 test hồi quy mới).
- `npx vitest run tests/modules/asthma/invariants.test.ts --maxWorkers=1`: **6/6 PASS**, 40,73 giây.
- `npm run typecheck`: **PASS**.
- `npm run verify:kb`: **0 lỗi, 0 cảnh báo**; 126 nguồn, 1.498 trích dẫn, 949 ngưỡng, 179 thuốc. Báo cáo `reports/kb/verify_2026-10-28T03-48-12-227Z.json`.
- Verifier độc lập đã kiểm tra đường đi thành phần FDC, snapshot, SHA-256, quote, hash review và test mới. Góp ý về thiết bị chưa xác định, nguồn đúng thuốc và trang HTML đã được xử lý. Đây là review mã có phạm vi giới hạn, không thay thế hội đồng y khoa R1/R2/R3.

## Nguồn chính

- [GSK Serevent Evohaler SmPC, mục 6.1](https://www.medicines.org.uk/emc/product/168/smpc): danh sách tá dược HFA.
- [GSK Serevent Accuhaler SmPC, mục 6.1](https://www.medicines.org.uk/emc/product/848/smpc): lactose chứa protein sữa.
- [GSK Seretide Evohaler SmPC, mục 6.1](https://www.medicines.org.uk/emc/product/7599/smpc): danh sách tá dược HFA.

## Bàn giao và giới hạn

Không sửa các tệp interactions, COPD/HF, Gút hay timeout do agent khác phụ trách. Không sửa progress dùng chung. Lần chạy full Vitest do phiên này mở trước khi biết phạm vi agent kia đã được dừng theo đúng PID riêng, không dùng kết quả đó để tuyên bố đạt toàn kho. Agent kia tiếp tục sở hữu `task-2341` và xác nhận toàn bộ bộ test.

Các mục review Hen vòng 4 khác, trong đó có độ chính xác trích dẫn DPI ở các quy tắc khác (R1-06), còn trong hàng đợi. Cảnh báo thiết bị mới nằm trong module Hen; chưa nghiệm thu mọi đường đi chỉ chọn COPD hoặc các module khác. Chưa chạy build/E2E trong ca này để tránh ghi đè `dist` và trùng kiểm chứng toàn dự án của agent kia.
