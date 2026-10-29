# ASTHMA-R4-R2-02 / R3-02 — Controller khi có tương tác CYP3A4

Ngày: 2026-10-28. Trạng thái: đã triển khai và kiểm thử; chờ vòng kiểm định lâm sàng độc lập xác nhận đóng finding. Không nâng trạng thái `ai_multi_reviewed`.

## Vấn đề và hành vi sau sửa

Trước sửa, người lớn Track 2 vẫn có thể nhận Seretide khi đang dùng ritonavir; ở tuổi 12–17, chặn phối hợp tương tác có thể xóa hết ICS. Danh mục còn bỏ sót erythromycin, một số PI và tên phối hợp/thương mại. Bộ tái hiện ban đầu thất bại 13/13.

- Một classifier chuyên biệt thuốc hít dùng chung giữa module Hen và cổng an toàn cuối engine. Nhận diện thành phần phối hợp và Paxlovid; không đổi erythromycin thành chất ức chế CYP mạnh toàn thân, tránh lan chính sách sang colchicine/finerenone.
- Controller nhạy CYP không còn hành động kê dùng có liều. Thuốc đang dùng chuyển STOP, thuốc mới AVOID, kèm yêu cầu tiếp nối ICS và rà soát thuốc gây tương tác.
- Cầu nối dùng cùng một lựa chọn cho controller, thuốc cắt cơn và tờ kế hoạch: beclometasone đơn chất ở thiếu niên; phối hợp phù hợp ở người lớn; giữ LAMA khi thay bình ba thuốc. Nhánh MART người lớn Track 1 đã hợp lệ được giữ theo luật hiện có.
- Không chọn liều cầu nối khi thiếu đánh giá GINA; không thay thế quy trình xử trí cơn cấp. Giữ liều hiện tại khi xác nhận được; thiếu liều/tần suất thì không xuất tờ hướng dẫn có đơn suy đoán.
- Nhận diện Ventolin đang dùng để tránh lệnh dừng/bắt đầu trùng. Khi dị ứng salbutamol, chọn terbutaline nếu phù hợp; nếu chưa có thuốc cắt cơn hoặc ICS phù hợp thì REFER khẩn. Chưa sinh handout terbutaline vì mẫu hiện tại ghi riêng salbutamol.
- Dị ứng đạm sữa yêu cầu thiết bị pMDI được xác nhận; DPI hoặc chưa rõ thiết bị phải chuyển rõ sang pMDI. Ngoại lệ tá dược glycopyrronium chỉ áp dụng cho Trimbow pMDI ghi rõ, dựa trên SmPC; DPI và thiết bị không xác định vẫn bị chặn.

## Nguồn và dữ liệu

Thêm một nguồn Chiesi Fostair SmPC và ba citation; tái sử dụng nguồn EMA Trimbow đã có. Không sửa ngưỡng/thuốc hoặc trạng thái clinical review.

- [Chiesi Fostair SmPC](https://www.medicines.org.uk/emc/product/6318/smpc): liều duy trì cố định, giới hạn tuổi và cảnh báo beclometasone vẫn cần theo dõi khi dùng chất ức chế CYP.
- [MHRA steroid và ritonavir/cobicistat](https://www.gov.uk/drug-safety-update/cobicistat-ritonavir-and-coadminsitration-with-a-steroid-risk-of-systemic-corticosteroid-adverse-effects): nguy cơ tác dụng toàn thân và cân nhắc beclometasone.
- [EMA Trimbow product information](https://www.ema.europa.eu/en/documents/product-information/trimbow-epar-product-information_en.pdf), trang 20: tá dược pMDI không có lactose.

Snapshot Fostair: `Medical_Library_2026/09_Nhan_Thuoc/EMA/Chiesi_Fostair_2026_SmPC.html`, SHA256 `610308c46596e520fa320658d9dedd46e1088905591bc39324ab9ee0245dc776`.

## Phạm vi tệp

- Mới: `src/engine/safety/inhaledCypSafety.ts`, `src/modules/asthma/helpers.cyp3a4.ts`, `src/modules/asthma/rules.cyp3a4.ts`.
- Sửa: cổng `src/engine/safety/gates.ts`; các helper/rule Hen (`helpers.constants`, `helpers.dosing`, `rules`, `rules.track2.support`, `rules.safety.inhalers`).
- KB: `kb/sources.json` append một nguồn; `kb/citations/asthma_cyp3a4_bridge.json`.
- Test: hai suite mới, cập nhật kỳ vọng tài liệu cầu nối trong `r4_action_plan_consistency.test.ts`, golden asthma 52 kiểm tra cụ thể thuốc và hành động thay vì ID phụ thuộc triển khai.
- Backup, diff đầy đủ và script tái tạo: `reports/asthma-r4-cyp3a4-20261028/`.

## Kiểm chứng

- `npx vitest run --maxWorkers=4`: 81/81 file PASS; 1.945 test PASS, 9 skipped (1.954 tổng), 190,43 giây. Log: `reports/asthma-r4-cyp3a4-20261028/vitest-final.log`.
- Hai suite chuyên biệt: 47/47 PASS (32 module, 15 engine), gồm dị ứng sữa khi chưa rõ thiết bị.
- `npm run build`: PASS, bao gồm TypeScript strict và `verify:kb`; 127 nguồn, 1.501 trích dẫn, 949 ngưỡng, 179 thuốc; 0 lỗi, 0 cảnh báo KB. PWA tạo 63 mục precache. Log: `reports/asthma-r4-cyp3a4-20261028/build-final.log`.
- Production Playwright: hồ sơ tổng hợp tuổi 14, ritonavir + budesonide/formoterol; hiển thị STOP thuốc tương tác, SWITCH sang beclometasone và thuốc cắt cơn. Offline/reload vẫn giữ kế hoạch; service worker điều khiển; không lỗi/cảnh báo console; viewport 390×844 không tràn ngang. Ảnh đã kiểm tra: `output/playwright/gdmt-cyp-offline-20261028.png`.

## Giới hạn và việc tiếp theo

Đây là nghiệm thu triển khai và hồi quy, chưa thay thế vòng review lâm sàng R1/R2/R3. Liều/thiết bị cầu nối và thuốc gây tương tác cần bác sĩ xác nhận theo nội dung hiển thị. Các finding tuổi của bình ba thuốc, nguồn/ngưỡng MgSO4 và trích dẫn DPI khác vẫn còn trong hàng đợi. Build còn cảnh báo chunk >500 KB đã biết; task này không nghiệm thu performance toàn ứng dụng.
